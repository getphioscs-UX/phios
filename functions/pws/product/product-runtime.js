export const PRODUCT_RUNTIME_CONTRACT = 'phi-os.pws.product-runtime.v1';

export const PRODUCT_COMPONENT_TYPES = Object.freeze([
  'knowledge_access',
  'journey_access',
  'professional_service_access',
  'membership_access',
  'service_credit'
]);

const PRODUCT_STATES = Object.freeze(['draft', 'active', 'suspended', 'retired']);
const VERSION_STATES = Object.freeze(['draft', 'active', 'superseded', 'withdrawn']);
const CODE_PATTERN = /^[a-z][a-z0-9-]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const FORBIDDEN_PRODUCT_FIELDS = Object.freeze([
  'amount', 'amount_minor', 'currency', 'country', 'countries',
  'payment_provider', 'payment_provider_id', 'provider', 'provider_id',
  'entitlement_id', 'journey_id'
]);

export class ProductRuntimeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProductRuntimeError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function requiredText(value, field) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_INVALID', `${field} is required.`, { field }
    );
  }
  return text;
}

function code(value, field) {
  const normalized = requiredText(value, field);
  if (!CODE_PATTERN.test(normalized)) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_INVALID', `${field} must be a lowercase product code.`,
      { field, value: normalized }
    );
  }
  return normalized;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function clone(value) {
  return structuredClone(value);
}

function rejectCommercialBinding(value, path = 'product') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PRODUCT_FIELDS.includes(key)) {
      throw new ProductRuntimeError(
        'PWS_PRODUCT_COMMERCIAL_BINDING_FORBIDDEN',
        `Product Runtime cannot contain ${key}.`, { field: `${path}.${key}` }
      );
    }
    rejectCommercialBinding(child, `${path}.${key}`);
  }
}

function normalizeConfiguration(type, input = {}) {
  const configuration = clone(input);
  if (type === 'knowledge_access') {
    configuration.knowledge_asset_id = requiredText(
      configuration.knowledge_asset_id, 'knowledge_asset_id'
    );
    configuration.access_scope = requiredText(
      configuration.access_scope, 'access_scope'
    );
  }
  if (type === 'journey_access') {
    configuration.journey_type = requiredText(
      configuration.journey_type, 'journey_type'
    );
    configuration.method_code = requiredText(
      configuration.method_code, 'method_code'
    );
    if (!Number.isSafeInteger(configuration.journey_count) || configuration.journey_count < 1) {
      throw new ProductRuntimeError(
        'PWS_PRODUCT_COMPONENT_INVALID',
        'journey_count must be a positive safe integer.',
        { field: 'journey_count' }
      );
    }
  }
  if (type === 'professional_service_access') {
    configuration.service_code = requiredText(
      configuration.service_code, 'service_code'
    );
    for (const field of ['eligibility_required', 'consent_required', 'assignment_required']) {
      if (configuration[field] !== true) {
        throw new ProductRuntimeError(
          'PWS_PRODUCT_COMPONENT_INVALID', `${field} must remain true.`, { field }
        );
      }
    }
  }
  if (type === 'membership_access') {
    configuration.membership_tier = requiredText(
      configuration.membership_tier, 'membership_tier'
    );
  }
  if (type === 'service_credit') {
    configuration.service_code = requiredText(
      configuration.service_code, 'service_code'
    );
    if (!Number.isSafeInteger(configuration.units) || configuration.units < 1) {
      throw new ProductRuntimeError(
        'PWS_PRODUCT_COMPONENT_INVALID',
        'Service Credit units must be a positive safe integer.', { field: 'units' }
      );
    }
  }
  return configuration;
}

export function createProductComponent(input) {
  const componentType = requiredText(input?.component_type, 'component_type');
  if (!PRODUCT_COMPONENT_TYPES.includes(componentType)) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_COMPONENT_INVALID', 'Unsupported Product Component type.',
      { field: 'component_type', value: componentType }
    );
  }
  const component = {
    component_code: code(input.component_code, 'component_code'),
    component_type: componentType,
    configuration: normalizeConfiguration(componentType, input.configuration),
    creates_entitlement: false,
    activates_journey: false,
    creates_professional_assignment: false,
    creates_professional_responsibility: false
  };
  rejectCommercialBinding(component, 'component');
  return deepFreeze(component);
}

export function composeProductVersion(input) {
  const version = requiredText(input?.version, 'version');
  if (!VERSION_PATTERN.test(version)) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_VERSION_INVALID', 'version must use MAJOR.MINOR.PATCH.',
      { field: 'version', value: version }
    );
  }
  const status = requiredText(input.status || 'active', 'status');
  if (!VERSION_STATES.includes(status)) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_VERSION_INVALID', 'Unsupported Product Version status.',
      { field: 'status', value: status }
    );
  }
  const components = (input.components || []).map(createProductComponent);
  if (components.length === 0) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_VERSION_INVALID', 'Product Version requires a component.'
    );
  }
  const componentCodes = components.map(item => item.component_code);
  if (new Set(componentCodes).size !== componentCodes.length) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_VERSION_INVALID', 'Product Component codes must be unique.'
    );
  }
  const productVersion = {
    version,
    status,
    effective_at: requiredText(input.effective_at, 'effective_at'),
    components,
    creates_entitlement: false,
    activates_journey: false
  };
  rejectCommercialBinding(productVersion, 'product_version');
  return deepFreeze(productVersion);
}

function normalizeProduct(input) {
  const productCode = code(input.product_code, 'product_code');
  const state = requiredText(input.state || 'active', 'state');
  if (!PRODUCT_STATES.includes(state)) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_INVALID', 'Unsupported Product state.', { field: 'state', value: state }
    );
  }
  const versions = (input.versions || []).map(composeProductVersion);
  const versionCodes = versions.map(item => item.version);
  if (versions.length === 0 || new Set(versionCodes).size !== versions.length) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_INVALID', 'Product Versions must exist and be unique.'
    );
  }
  const currentVersion = requiredText(input.current_version, 'current_version');
  if (!versions.some(item => item.version === currentVersion && item.status === 'active')) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_INVALID', 'current_version must reference an active Product Version.'
    );
  }
  const legacyProductIds = [...new Set(
    (input.legacy_product_ids || []).map(value => code(value, 'legacy_product_id'))
  )];
  if (legacyProductIds.includes(productCode)) {
    throw new ProductRuntimeError(
      'PWS_PRODUCT_INVALID', 'A legacy Product ID cannot equal the canonical code.'
    );
  }
  const product = {
    contract: PRODUCT_RUNTIME_CONTRACT,
    product_code: productCode,
    display_name: requiredText(input.display_name, 'display_name'),
    product_type_code: requiredText(input.product_type_code, 'product_type_code'),
    state,
    current_version: currentVersion,
    legacy_product_ids: legacyProductIds,
    versions,
    payment_provider_independent: true,
    country_independent: true,
    currency_independent: true,
    creates_entitlement: false,
    activates_journey: false
  };
  rejectCommercialBinding(product);
  return deepFreeze(product);
}

export const DEFAULT_PRODUCT_RUNTIME_DEFINITIONS = deepFreeze([
  {
    product_code: 'reality-journey-pass-v1',
    display_name: 'Reality Journey Pass',
    product_type_code: 'reality_journey_pass',
    state: 'active',
    current_version: '1.0.0',
    legacy_product_ids: [],
    versions: [{
      version: '1.0.0',
      status: 'active',
      effective_at: '2026-07-30T00:00:00.000Z',
      components: [{
        component_code: 'reality-journey-access',
        component_type: 'journey_access',
        configuration: {
          journey_type: 'personal_reality_journey',
          method_code: 'reality_journey',
          journey_count: 1,
          professional_review_included: false
        }
      }]
    }]
  },
  {
    product_code: 'phios-book-one-zh-pdf',
    display_name: '《世界如何形成》第一册',
    product_type_code: 'book',
    state: 'active',
    current_version: '1.0.0',
    legacy_product_ids: ['phios-book-one'],
    versions: [{
      version: '1.0.0',
      status: 'active',
      effective_at: '2026-07-19T00:00:00.000Z',
      components: [{
        component_code: 'book-one-knowledge-access',
        component_type: 'knowledge_access',
        configuration: {
          knowledge_asset_id: 'BOOK-I',
          access_scope: 'full_asset',
          language: 'zh-Hans',
          format: 'watermarked_pdf',
          licence: 'single_purchaser_personal_use'
        }
      }]
    }]
  }
].map(normalizeProduct));

export function createProductRuntime(options = {}) {
  const products = (options.products || DEFAULT_PRODUCT_RUNTIME_DEFINITIONS)
    .map(normalizeProduct);
  const canonical = new Map();
  const legacy = new Map();
  for (const product of products) {
    if (canonical.has(product.product_code) || legacy.has(product.product_code)) {
      throw new ProductRuntimeError(
        'PWS_PRODUCT_CONFLICT', 'Duplicate canonical Product code.',
        { product_code: product.product_code }
      );
    }
    canonical.set(product.product_code, product);
    for (const legacyId of product.legacy_product_ids) {
      if (canonical.has(legacyId) || legacy.has(legacyId)) {
        throw new ProductRuntimeError(
          'PWS_PRODUCT_CONFLICT', 'Legacy Product ID is ambiguous.',
          { legacy_product_id: legacyId }
        );
      }
      legacy.set(legacyId, product.product_code);
    }
  }

  const resolveProduct = reference => {
    const requested = requiredText(reference, 'product_reference');
    const canonicalCode = legacy.get(requested) || requested;
    const product = canonical.get(canonicalCode);
    if (!product) {
      throw new ProductRuntimeError(
        'PWS_PRODUCT_NOT_FOUND', 'Product could not be resolved.',
        { product_reference: requested }
      );
    }
    return product;
  };

  const resolveProductVersion = (reference, version = null) => {
    const product = resolveProduct(reference);
    const requestedVersion = version || product.current_version;
    const productVersion = product.versions.find(item => item.version === requestedVersion);
    if (!productVersion) {
      throw new ProductRuntimeError(
        'PWS_PRODUCT_VERSION_NOT_FOUND', 'Product Version could not be resolved.',
        { product_code: product.product_code, version: requestedVersion }
      );
    }
    return productVersion;
  };

  return Object.freeze({
    contract: PRODUCT_RUNTIME_CONTRACT,
    listProducts: () => Object.freeze([...canonical.values()]),
    resolveProduct,
    resolveProductVersion,
    resolveComponents(reference, version = null, componentType = null) {
      const productVersion = resolveProductVersion(reference, version);
      if (componentType && !PRODUCT_COMPONENT_TYPES.includes(componentType)) {
        throw new ProductRuntimeError(
          'PWS_PRODUCT_COMPONENT_INVALID', 'Unsupported Product Component type.',
          { component_type: componentType }
        );
      }
      return Object.freeze(productVersion.components.filter(
        item => !componentType || item.component_type === componentType
      ));
    },
    mapLegacyProduct(reference) {
      const requested = requiredText(reference, 'legacy_product_id');
      const productCode = legacy.get(requested);
      return productCode ? deepFreeze({
        legacy_product_id: requested,
        product_code: productCode,
        read_compatibility_only: true,
        legacy_write_allowed: false
      }) : null;
    }
  });
}

export const productRuntime = createProductRuntime();
