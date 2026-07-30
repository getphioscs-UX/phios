import {
  RegistryValidationError,
  requiredText
} from './universal-registry-schema.js';

export const METHOD_SERVICE_REGISTRY_VERSION =
  'phi-os.pws.method-service-registry.v1';

export const METHOD_REGISTRY_TYPE = 'Method';
export const SERVICE_REGISTRY_TYPE = 'Service';

export const DEFAULT_METHOD_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: 'professional_runtime_reading',
    name: 'Professional Runtime Reading Method',
    domain: 'runtime_reading',
    execution_authority: 'professional',
    definition:
      'Produce a bounded professional interpretation from authorised Runtime material without replacing the Core Runtime reading.',
    capability_codes: Object.freeze(['professional_runtime_reading']),
    boundaries: Object.freeze([
      'core_runtime_reading_is_not_overwritten',
      'assignment_and_consent_required',
      'method_and_source_labels_required'
    ])
  }),
  Object.freeze({
    code: 'human_design_runtime_interpretation',
    name: 'Human Design Runtime Interpretation Method',
    domain: 'human_design',
    execution_authority: 'professional',
    definition:
      'Interpret Human Design material alongside Runtime evidence while preserving separate source authorities.',
    capability_codes: Object.freeze([
      'human_design_runtime_interpretation'
    ]),
    boundaries: Object.freeze([
      'human_design_and_runtime_sources_remain_distinct',
      'interpretation_is_not_verified_reality_fact',
      'assignment_and_separate_consent_required'
    ])
  }),
  Object.freeze({
    code: 'human_design_foundation',
    name: 'Human Design Foundation Method',
    domain: 'human_design',
    execution_authority: 'professional',
    definition:
      'Explain Human Design foundation material within its declared interpretive and source boundary.',
    capability_codes: Object.freeze(['human_design_foundation']),
    boundaries: Object.freeze([
      'source_and_method_labels_required',
      'interpretation_is_not_verified_reality_fact',
      'assignment_and_separate_consent_required'
    ])
  }),
  Object.freeze({
    code: 'financial_reality_review',
    name: 'Financial Reality Review Method',
    domain: 'financial',
    execution_authority: 'professional',
    definition:
      'Reconstruct financial reality and provide product-neutral navigation within verified jurisdiction and scope.',
    capability_codes: Object.freeze([
      'financial_reality_reconstruction',
      'financial_navigation_consultation'
    ]),
    boundaries: Object.freeze([
      'facts_assumptions_and_calculations_remain_separate',
      'jurisdiction_authority_required',
      'product_specific_advice_disabled'
    ])
  }),
  Object.freeze({
    code: 'knowledge_routing',
    name: 'Knowledge Routing Method',
    domain: 'knowledge',
    execution_authority: 'system',
    definition:
      'Route a user to canonical knowledge by explicit rules without creating professional assessment or responsibility.',
    capability_codes: Object.freeze([]),
    boundaries: Object.freeze([
      'canonical_knowledge_only',
      'does_not_create_professional_responsibility',
      'does_not_activate_paid_service'
    ])
  }),
  Object.freeze({
    code: 'reality_journey',
    name: 'Reality Journey Method',
    domain: 'reality_journey',
    execution_authority: 'system',
    definition:
      'Orchestrate the Core Runtime Reality Journey without changing its evidence, state or payment boundaries.',
    capability_codes: Object.freeze([]),
    boundaries: Object.freeze([
      'core_runtime_authority_preserved',
      'journey_activation_requires_separate_entitlement',
      'does_not_create_professional_responsibility'
    ])
  })
]);

const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;
const EXECUTION_AUTHORITIES = Object.freeze(['professional', 'system']);

function canonicalCode(value, field = 'code') {
  const code = requiredText(value, field);
  if (!CODE_PATTERN.test(code)) {
    throw new RegistryValidationError(
      `${field} must be a lowercase canonical code.`,
      { field, value: code }
    );
  }
  return code;
}

function canonicalCodes(values, field) {
  return [...new Set((values || []).map(value => canonicalCode(value, field)))];
}

function executionAuthority(value) {
  const authority = requiredText(value, 'execution_authority');
  if (!EXECUTION_AUTHORITIES.includes(authority)) {
    throw new RegistryValidationError(
      'execution_authority has an unsupported value.',
      { field: 'execution_authority', value: authority, allowed: EXECUTION_AUTHORITIES }
    );
  }
  return authority;
}

function writeContext(input = {}) {
  return {
    actor_id: requiredText(input.actor_id, 'actor_id'),
    correlation_id: requiredText(input.correlation_id, 'correlation_id')
  };
}

function objectInput({ id, code, type, name, ownerModule, metadata }) {
  return {
    object_id: id,
    object_code: code,
    object_type: type,
    canonical_name: name,
    owner_module: ownerModule,
    schema_version: 'pws-v1',
    status: 'active',
    metadata: {
      registry_version: METHOD_SERVICE_REGISTRY_VERSION,
      ...metadata
    }
  };
}

export function createMethodServiceRegistry(options = {}) {
  const universal = options.universalRegistry;
  if (
    !universal?.registerObject ||
    !universal?.query?.getObject ||
    !universal?.query?.findObjects ||
    !universal?.relationshipStore?.create ||
    !universal?.relationshipStore?.listForObject
  ) {
    throw new RegistryValidationError(
      'Method and Service Registry requires the Universal Registry Core.'
    );
  }

  const ensureObject = async (record, context) => {
    const existing = await universal.query.getObject(record.object_id);
    if (existing) {
      if (
        existing.object_code !== record.object_code ||
        existing.object_type !== record.object_type ||
        existing.canonical_name !== record.canonical_name ||
        existing.owner_module !== record.owner_module ||
        JSON.stringify(existing.metadata) !== JSON.stringify(record.metadata)
      ) {
        throw new RegistryValidationError(
          `Registry identity conflict: ${record.object_id}`,
          { object_id: record.object_id }
        );
      }
      return { record: existing, created: false };
    }
    return {
      record: await universal.registerObject(record, writeContext(context)),
      created: true
    };
  };

  const ensureRelationship = async ({
    sourceObjectId,
    targetObjectId,
    relationshipId,
    relationshipType,
    attributes,
    context
  }) => {
    const existing = (
      await universal.relationshipStore.listForObject(sourceObjectId)
    ).find(item => item.relationship_id === relationshipId);
    const canonicalAttributes = {
      registry_version: METHOD_SERVICE_REGISTRY_VERSION,
      ...attributes
    };
    if (existing) {
      if (
        existing.source_object_id !== sourceObjectId ||
        existing.target_object_id !== targetObjectId ||
        existing.relationship_type !== relationshipType ||
        JSON.stringify(existing.attributes) !== JSON.stringify(canonicalAttributes)
      ) {
        throw new RegistryValidationError(
          `Registry relationship conflict: ${relationshipId}`,
          { relationship_id: relationshipId }
        );
      }
      return { record: existing, created: false };
    }
    const canonicalContext = writeContext(context);
    return {
      record: await universal.relationshipStore.create({
        relationship_id: relationshipId,
        source_object_id: sourceObjectId,
        target_object_id: targetObjectId,
        relationship_type: relationshipType,
        attributes: canonicalAttributes,
        created_by: canonicalContext.actor_id
      }),
      created: true
    };
  };

  const requireObject = async (objectId, objectType, field) => {
    const object = await universal.query.getObject(objectId);
    if (object?.object_type !== objectType) {
      throw new RegistryValidationError(
        `${field} references an unknown ${objectType}: ${objectId}`,
        { field, object_id: objectId }
      );
    }
    return object;
  };

  const api = {
    async registerMethodDefinition(input, context) {
      const code = canonicalCode(input.code);
      const authority = executionAuthority(input.execution_authority);
      const capabilityCodes = canonicalCodes(
        input.capability_codes,
        'capability_code'
      );
      const boundaries = canonicalCodes(input.boundaries, 'boundary');
      if (boundaries.length === 0) {
        throw new RegistryValidationError(
          'Method Definition requires at least one boundary.',
          { field: 'boundaries' }
        );
      }
      if (authority === 'professional' && capabilityCodes.length === 0) {
        throw new RegistryValidationError(
          'Professional Method requires at least one Capability.',
          { field: 'capability_codes' }
        );
      }
      if (authority === 'system' && capabilityCodes.length > 0) {
        throw new RegistryValidationError(
          'System Method cannot claim a professional Capability.',
          { field: 'capability_codes' }
        );
      }
      for (const capabilityCode of capabilityCodes) {
        await requireObject(
          `pws.capability.${capabilityCode}`,
          'Capability',
          'capability_code'
        );
      }
      const method = await ensureObject(objectInput({
        id: `pws.method.${code}`,
        code: `PWS-METHOD-${code.toUpperCase().replaceAll('_', '-')}`,
        type: METHOD_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/method',
        metadata: {
          value: code,
          domain: canonicalCode(input.domain, 'domain'),
          definition: requiredText(input.definition, 'definition'),
          definition_only: true,
          execution_authority: authority,
          requires_active_professional: authority === 'professional',
          creates_professional_responsibility: false,
          capability_codes: capabilityCodes,
          boundaries
        }
      }), context);
      const relationships = [];
      for (const capabilityCode of capabilityCodes) {
        relationships.push(await ensureRelationship({
          sourceObjectId: method.record.object_id,
          targetObjectId: `pws.capability.${capabilityCode}`,
          relationshipId: `rel.method-requires-capability.${code}.${capabilityCode}`,
          relationshipType: 'method_requires_capability',
          attributes: {
            requirement: 'all',
            grants_capability: false
          },
          context
        }));
      }
      return { method, relationships };
    },

    async registerServiceDefinition(input, context) {
      const code = canonicalCode(input.code);
      const methodCodes = canonicalCodes(input.method_codes, 'method_code');
      if (methodCodes.length === 0) {
        throw new RegistryValidationError(
          'Service Definition requires at least one Method.',
          { field: 'method_codes' }
        );
      }
      const methods = [];
      for (const methodCode of methodCodes) {
        methods.push(await requireObject(
          `pws.method.${methodCode}`,
          METHOD_REGISTRY_TYPE,
          'method_code'
        ));
      }
      const capabilityCodes = [...new Set(
        methods.flatMap(method => method.metadata.capability_codes || [])
      )];
      const service = await ensureObject(objectInput({
        id: `pws.service.${code}`,
        code: `PWS-SERVICE-${code.toUpperCase().replaceAll('_', '-')}`,
        type: SERVICE_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/service',
        metadata: {
          value: code,
          definition: requiredText(input.definition, 'definition'),
          definition_only: true,
          method_codes: methodCodes,
          capability_codes: capabilityCodes,
          deliverable_contract_id: requiredText(
            input.deliverable_contract_id,
            'deliverable_contract_id'
          ),
          boundary_contract_id: requiredText(
            input.boundary_contract_id,
            'boundary_contract_id'
          ),
          legacy_aliases: canonicalCodes(input.legacy_aliases, 'legacy_alias'),
          legacy_catalog_is_write_source: false
        }
      }), context);
      const relationships = [];
      for (const methodCode of methodCodes) {
        relationships.push(await ensureRelationship({
          sourceObjectId: service.record.object_id,
          targetObjectId: `pws.method.${methodCode}`,
          relationshipId: `rel.service-uses-method.${code}.${methodCode}`,
          relationshipType: 'service_uses_method',
          attributes: { requirement: 'all' },
          context
        }));
      }
      for (const capabilityCode of capabilityCodes) {
        relationships.push(await ensureRelationship({
          sourceObjectId: service.record.object_id,
          targetObjectId: `pws.capability.${capabilityCode}`,
          relationshipId:
            `rel.service-requires-capability.${code}.${capabilityCode}`,
          relationshipType: 'service_requires_capability',
          attributes: {
            derived_from_method: true,
            grants_capability: false
          },
          context
        }));
      }
      if (input.product_id !== undefined && input.product_id !== null) {
        const productId = requiredText(input.product_id, 'product_id');
        await requireObject(productId, 'Product', 'product_id');
        relationships.push(await ensureRelationship({
          sourceObjectId: service.record.object_id,
          targetObjectId: productId,
          relationshipId: `rel.service-product.${code}.${productId}`,
          relationshipType: 'service_available_as_product',
          attributes: { commercial_activation: false },
          context
        }));
      }
      return { service, relationships };
    },

    async seedDefaults(context) {
      const entries = [];
      for (const definition of DEFAULT_METHOD_DEFINITIONS) {
        entries.push(await api.registerMethodDefinition(definition, context));
      }
      return {
        methods: {
          created: entries.filter(item => item.method.created).length,
          existing: entries.filter(item => !item.method.created).length,
          total: entries.length
        },
        relationships: {
          created: entries.flatMap(item => item.relationships)
            .filter(item => item.created).length,
          existing: entries.flatMap(item => item.relationships)
            .filter(item => !item.created).length,
          total: entries.flatMap(item => item.relationships).length
        }
      };
    },

    async listMethods(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: METHOD_REGISTRY_TYPE,
        owner_module: undefined
      });
    },

    async listServices(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: SERVICE_REGISTRY_TYPE,
        owner_module: undefined
      });
    }
  };

  return Object.freeze(api);
}
