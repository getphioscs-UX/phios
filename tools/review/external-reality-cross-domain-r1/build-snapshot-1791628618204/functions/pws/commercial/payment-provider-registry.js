export const PAYMENT_PROVIDER_REGISTRY_CONTRACT =
  'phi-os.pws.payment-provider-registry.v1';

export const PAYMENT_PROVIDER_KINDS = Object.freeze([
  'gateway', 'bank_rail', 'payment_rail', 'wallet', 'future_provider'
]);

export const PAYMENT_PROVIDER_STATUSES = Object.freeze([
  'registered', 'configured', 'available', 'degraded', 'unavailable', 'retired'
]);

const CODE_PATTERN = /^[a-z][a-z0-9-]*$/;
const SECRET_FIELD_PATTERN = /(secret|password|token|private[_-]?key|credential)/i;

export class PaymentProviderRegistryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PaymentProviderRegistryError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function requiredText(value, field) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new PaymentProviderRegistryError(
      'PWS_PAYMENT_PROVIDER_INVALID', `${field} is required.`, { field }
    );
  }
  return text;
}

function canonicalCode(value, field) {
  const normalized = requiredText(value, field);
  if (!CODE_PATTERN.test(normalized)) {
    throw new PaymentProviderRegistryError(
      'PWS_PAYMENT_PROVIDER_INVALID', `${field} is invalid.`,
      { field, value: normalized }
    );
  }
  return normalized;
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function stringList(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new PaymentProviderRegistryError(
      'PWS_PAYMENT_PROVIDER_POLICY_INVALID', `${field} must be a non-empty array.`,
      { field }
    );
  }
  return [...new Set(value.map(item => requiredText(item, field)))];
}

function rejectSecrets(value, path = 'configuration') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_FIELD_PATTERN.test(key)) {
      throw new PaymentProviderRegistryError(
        'PWS_PAYMENT_PROVIDER_SECRET_FORBIDDEN',
        'Provider Registry cannot store credentials or secrets.',
        { field: `${path}.${key}` }
      );
    }
    rejectSecrets(child, `${path}.${key}`);
  }
}

function normalizeProvider(input) {
  const providerKind = requiredText(input.provider_kind, 'provider_kind');
  if (!PAYMENT_PROVIDER_KINDS.includes(providerKind)) {
    throw new PaymentProviderRegistryError(
      'PWS_PAYMENT_PROVIDER_INVALID', 'Unsupported Payment Provider kind.',
      { provider_kind: providerKind }
    );
  }
  return freeze({
    provider_code: canonicalCode(input.provider_code, 'provider_code'),
    display_name: requiredText(input.display_name, 'display_name'),
    provider_kind: providerKind,
    registry_presence_is_production_requirement: false,
    production_enabled: input.production_enabled === true,
    legacy_integration: input.legacy_integration === true
  });
}

function normalizePolicy(input, providerCode) {
  return freeze({
    policy_code: canonicalCode(input.policy_code, 'policy_code'),
    provider_code: providerCode,
    supported_currencies: stringList(input.supported_currencies, 'supported_currencies'),
    supported_regions: stringList(input.supported_regions, 'supported_regions'),
    supported_customer_segments: stringList(
      input.supported_customer_segments, 'supported_customer_segments'
    ),
    payment_methods: stringList(input.payment_methods, 'payment_methods'),
    production_required: false
  });
}

function normalizeConfiguration(input, providerCode) {
  const configuration = {
    configuration_code: canonicalCode(
      input.configuration_code, 'configuration_code'
    ),
    provider_code: providerCode,
    environment: requiredText(input.environment || 'none', 'environment'),
    configuration_reference: input.configuration_reference == null
      ? null
      : requiredText(input.configuration_reference, 'configuration_reference'),
    credentials_stored: false
  };
  rejectSecrets(input);
  return freeze(configuration);
}

function normalizeStatus(input, providerCode) {
  const status = requiredText(input.status || 'registered', 'status');
  if (!PAYMENT_PROVIDER_STATUSES.includes(status)) {
    throw new PaymentProviderRegistryError(
      'PWS_PAYMENT_PROVIDER_STATUS_INVALID', 'Unsupported Provider status.',
      { provider_code: providerCode, status }
    );
  }
  return freeze({
    provider_code: providerCode,
    status,
    checked_at: requiredText(input.checked_at, 'checked_at'),
    reason_code: input.reason_code == null
      ? null
      : canonicalCode(input.reason_code, 'reason_code'),
    production_required: false
  });
}

export const DEFAULT_PAYMENT_PROVIDER_DEFINITIONS = freeze([
  {
    provider_code: 'stripe',
    display_name: 'Stripe',
    provider_kind: 'gateway',
    production_enabled: true,
    legacy_integration: true,
    policy: {
      policy_code: 'stripe-book-policy',
      supported_currencies: ['MYR'],
      supported_regions: ['my'],
      supported_customer_segments: ['public-customer'],
      payment_methods: ['card', 'fpx']
    },
    configuration: {
      configuration_code: 'stripe-environment-reference',
      environment: 'external_environment',
      configuration_reference: 'STRIPE_* environment bindings'
    },
    status: {
      status: 'configured',
      checked_at: '2026-08-02T00:00:00.000Z',
      reason_code: 'legacy-book-integration'
    }
  },
  {
    provider_code: 'fpx',
    display_name: 'FPX',
    provider_kind: 'bank_rail',
    policy: {
      policy_code: 'fpx-registration-policy',
      supported_currencies: ['MYR'],
      supported_regions: ['my'],
      supported_customer_segments: ['public-customer'],
      payment_methods: ['fpx']
    },
    configuration: {
      configuration_code: 'fpx-no-production-configuration',
      environment: 'none',
      configuration_reference: null
    },
    status: {
      status: 'registered',
      checked_at: '2026-08-02T00:00:00.000Z',
      reason_code: 'registry-only'
    }
  },
  {
    provider_code: 'duitnow',
    display_name: 'DuitNow',
    provider_kind: 'payment_rail',
    policy: {
      policy_code: 'duitnow-registration-policy',
      supported_currencies: ['MYR'],
      supported_regions: ['my'],
      supported_customer_segments: ['public-customer'],
      payment_methods: ['duitnow']
    },
    configuration: {
      configuration_code: 'duitnow-no-production-configuration',
      environment: 'none',
      configuration_reference: null
    },
    status: {
      status: 'registered',
      checked_at: '2026-08-02T00:00:00.000Z',
      reason_code: 'registry-only'
    }
  },
  {
    provider_code: 'touch-n-go-ewallet',
    display_name: "Touch 'n Go eWallet",
    provider_kind: 'wallet',
    policy: {
      policy_code: 'touch-n-go-registration-policy',
      supported_currencies: ['MYR'],
      supported_regions: ['my'],
      supported_customer_segments: ['public-customer'],
      payment_methods: ['touch_n_go_ewallet']
    },
    configuration: {
      configuration_code: 'touch-n-go-no-production-configuration',
      environment: 'none',
      configuration_reference: null
    },
    status: {
      status: 'registered',
      checked_at: '2026-08-02T00:00:00.000Z',
      reason_code: 'registry-only'
    }
  }
]);

export function createPaymentProviderRegistry(options = {}) {
  const records = new Map();

  const register = input => {
    const provider = normalizeProvider(input);
    if (records.has(provider.provider_code)) {
      throw new PaymentProviderRegistryError(
        'PWS_PAYMENT_PROVIDER_CONFLICT', 'Payment Provider already exists.',
        { provider_code: provider.provider_code }
      );
    }
    const record = freeze({
      provider,
      policy: normalizePolicy(input.policy, provider.provider_code),
      configuration: normalizeConfiguration(
        input.configuration, provider.provider_code
      ),
      status: normalizeStatus(input.status, provider.provider_code)
    });
    records.set(provider.provider_code, record);
    return record;
  };

  for (const definition of options.providers || DEFAULT_PAYMENT_PROVIDER_DEFINITIONS) {
    register(definition);
  }

  const resolve = providerCode => {
    const normalized = canonicalCode(providerCode, 'provider_code');
    const record = records.get(normalized);
    if (!record) {
      throw new PaymentProviderRegistryError(
        'PWS_PAYMENT_PROVIDER_NOT_FOUND', 'Payment Provider was not found.',
        { provider_code: normalized }
      );
    }
    return record;
  };

  return Object.freeze({
    contract: PAYMENT_PROVIDER_REGISTRY_CONTRACT,
    register,
    list: () => Object.freeze([...records.values()]),
    resolve,
    supports({ provider_code, currency, region, customer_segment, payment_method }) {
      const record = resolve(provider_code);
      const policy = record.policy;
      return policy.supported_currencies.includes(currency) &&
        policy.supported_regions.includes(region) &&
        policy.supported_customer_segments.includes(customer_segment) &&
        policy.payment_methods.includes(payment_method);
    }
  });
}

export const paymentProviderRegistry = createPaymentProviderRegistry();
