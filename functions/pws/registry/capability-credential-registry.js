import {
  RegistryValidationError,
  requiredText
} from './universal-registry-schema.js';

export const CAPABILITY_CREDENTIAL_REGISTRY_VERSION =
  'phi-os.pws.capability-credential-registry.v1';

export const CAPABILITY_REGISTRY_TYPE = 'Capability';
export const CREDENTIAL_DEFINITION_REGISTRY_TYPE = 'CredentialDefinition';

export const CAPABILITY_STATES = Object.freeze([
  'active',
  'suspended',
  'expired',
  'revoked'
]);

export const DEFAULT_CAPABILITY_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: 'professional_runtime_reading',
    name: 'Professional Runtime Reading',
    domain: 'runtime_reading',
    definition:
      'Produce a bounded professional reading from authorised Runtime material.',
    jurisdiction_required: false,
    boundaries: Object.freeze([
      'core_runtime_reading_is_not_overwritten',
      'assignment_and_consent_required',
      'provider_output_is_not_formal_reading'
    ])
  }),
  Object.freeze({
    code: 'human_design_foundation',
    name: 'Human Design Foundation',
    domain: 'human_design',
    definition:
      'Explain Human Design foundation material within its declared source boundary.',
    jurisdiction_required: false,
    boundaries: Object.freeze([
      'source_and_method_labels_required',
      'not_objective_evidence',
      'not_medical_or_legal_advice'
    ])
  }),
  Object.freeze({
    code: 'human_design_runtime_interpretation',
    name: 'Human Design Runtime Interpretation',
    domain: 'human_design',
    definition:
      'Interpret Human Design material alongside PHI OS Runtime without merging their authorities.',
    jurisdiction_required: false,
    boundaries: Object.freeze([
      'human_design_and_phi_os_sources_remain_distinct',
      'interpretation_does_not_promote_evidence',
      'professional_review_required'
    ])
  }),
  Object.freeze({
    code: 'financial_reality_reconstruction',
    name: 'Financial Reality Reconstruction',
    domain: 'financial',
    definition:
      'Reconstruct financial facts, assumptions and calculations without product recommendation.',
    jurisdiction_required: true,
    boundaries: Object.freeze([
      'jurisdiction_authority_required',
      'facts_assumptions_and_calculations_remain_separate',
      'product_specific_advice_disabled'
    ])
  }),
  Object.freeze({
    code: 'financial_navigation_consultation',
    name: 'Financial Navigation Consultation',
    domain: 'financial',
    definition:
      'Provide product-neutral financial navigation within verified authority and scope.',
    jurisdiction_required: true,
    boundaries: Object.freeze([
      'jurisdiction_authority_required',
      'product_neutral_only',
      'suitability_and_disclosure_required_for_later_product_step'
    ])
  }),
  Object.freeze({
    code: 'deliverable_review',
    name: 'Deliverable Review',
    domain: 'deliverable',
    definition:
      'Review a versioned Deliverable against its evidence, method and release requirements.',
    jurisdiction_required: false,
    boundaries: Object.freeze([
      'review_does_not_sign_or_release',
      'source_lineage_must_remain_visible',
      'frozen_content_required_before_approval'
    ])
  }),
  Object.freeze({
    code: 'deliverable_signature',
    name: 'Deliverable Signature',
    domain: 'deliverable',
    definition:
      'Apply an explicit attributable signature to an unchanged approved Deliverable.',
    jurisdiction_required: false,
    boundaries: Object.freeze([
      'explicit_human_signature_intent_required',
      'automatic_or_provider_signature_forbidden',
      'signatory_authority_and_frozen_content_required'
    ])
  })
]);

export const DEFAULT_CREDENTIAL_DEFINITIONS = Object.freeze(
  DEFAULT_CAPABILITY_DEFINITIONS.map(capability => Object.freeze({
    code: `${capability.code}_qualification`,
    name: `${capability.name} Qualification Evidence`,
    capability_code: capability.code,
    evidence_kind: 'qualification_or_authority_evidence',
    verification_type_id: 'pws.verification-type.credential',
    expiry_policy: 'issuer_or_governance_policy_defined'
  }))
);

const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

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
      registry_version: CAPABILITY_CREDENTIAL_REGISTRY_VERSION,
      ...metadata
    }
  };
}

export function createCapabilityCredentialRegistry(options = {}) {
  const universal = options.universalRegistry;
  if (
    !universal?.registerObject ||
    !universal?.query?.getObject ||
    !universal?.relationshipStore?.create
  ) {
    throw new RegistryValidationError(
      'Capability and Credential Registry requires the Universal Registry Core.'
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
    context
  }) => {
    const existing = (
      await universal.relationshipStore.listForObject(sourceObjectId)
    ).find(item => item.relationship_id === relationshipId);
    if (existing) {
      if (
        existing.source_object_id !== sourceObjectId ||
        existing.target_object_id !== targetObjectId ||
        existing.relationship_type !== relationshipType
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
        attributes: {
          registry_version: CAPABILITY_CREDENTIAL_REGISTRY_VERSION,
          grants_capability: false
        },
        created_by: canonicalContext.actor_id
      }),
      created: true
    };
  };

  const api = {
    async registerCapabilityDefinition(input, context) {
      const code = canonicalCode(input.code);
      const boundaries = [...new Set(
        (input.boundaries || []).map(value =>
          canonicalCode(value, 'boundary')
        )
      )];
      if (boundaries.length === 0) {
        throw new RegistryValidationError(
          'Capability Definition requires at least one boundary.',
          { field: 'boundaries' }
        );
      }
      return ensureObject(objectInput({
        id: `pws.capability.${code}`,
        code: `PWS-CAPABILITY-${code.toUpperCase().replaceAll('_', '-')}`,
        type: CAPABILITY_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/capability',
        metadata: {
          value: code,
          domain: canonicalCode(input.domain, 'domain'),
          definition: requiredText(input.definition, 'definition'),
          definition_only: true,
          initial_state: 'active',
          allowed_states: CAPABILITY_STATES,
          requires_active_professional: true,
          requires_assignment: true,
          requires_consent: true,
          jurisdiction_required: input.jurisdiction_required === true,
          grants_authority: false,
          boundaries
        }
      }), context);
    },

    async registerCredentialDefinition(input, context) {
      const code = canonicalCode(input.code);
      const capabilityCode = canonicalCode(
        input.capability_code,
        'capability_code'
      );
      const capabilityId = `pws.capability.${capabilityCode}`;
      const capability = await universal.query.getObject(capabilityId);
      if (capability?.object_type !== CAPABILITY_REGISTRY_TYPE) {
        throw new RegistryValidationError(
          `Credential references an unknown Capability: ${capabilityId}`,
          { capability_id: capabilityId }
        );
      }
      const verificationTypeId = requiredText(
        input.verification_type_id,
        'verification_type_id'
      );
      const verificationType = await universal.query.getObject(
        verificationTypeId
      );
      if (verificationType?.object_type !== 'VerificationType') {
        throw new RegistryValidationError(
          `Credential references an unknown Verification Type: ${verificationTypeId}`,
          { verification_type_id: verificationTypeId }
        );
      }
      const credential = await ensureObject(objectInput({
        id: `pws.credential-definition.${code}`,
        code: `PWS-CREDENTIAL-${code.toUpperCase().replaceAll('_', '-')}`,
        type: CREDENTIAL_DEFINITION_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/credential',
        metadata: {
          value: code,
          evidence_kind: canonicalCode(input.evidence_kind, 'evidence_kind'),
          verification_type_id: verificationTypeId,
          expiry_policy: canonicalCode(input.expiry_policy, 'expiry_policy'),
          issuer_required: true,
          verification_required: true,
          grants_capability: false,
          grants_signature_authority: false
        }
      }), context);
      const relationship = await ensureRelationship({
        sourceObjectId: credential.record.object_id,
        targetObjectId: capabilityId,
        relationshipId: `rel.credential-required-for.${capabilityCode}`,
        relationshipType: 'credential_required_for_capability',
        context
      });
      return { credential, relationship };
    },

    async seedDefaults(context) {
      const capabilities = [];
      for (const definition of DEFAULT_CAPABILITY_DEFINITIONS) {
        capabilities.push(
          await api.registerCapabilityDefinition(definition, context)
        );
      }
      const credentials = [];
      for (const definition of DEFAULT_CREDENTIAL_DEFINITIONS) {
        credentials.push(
          await api.registerCredentialDefinition(definition, context)
        );
      }
      return {
        capabilities: {
          created: capabilities.filter(item => item.created).length,
          existing: capabilities.filter(item => !item.created).length,
          total: capabilities.length
        },
        credentials: {
          created: credentials.filter(item => item.credential.created).length,
          existing: credentials.filter(item => !item.credential.created).length,
          total: credentials.length
        },
        relationships: {
          created: credentials.filter(item => item.relationship.created).length,
          existing: credentials.filter(item => !item.relationship.created).length,
          total: credentials.length
        }
      };
    },

    async listCapabilities(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: CAPABILITY_REGISTRY_TYPE,
        owner_module: undefined
      });
    },

    async listCredentialDefinitions(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: CREDENTIAL_DEFINITION_REGISTRY_TYPE,
        owner_module: undefined
      });
    }
  };

  return Object.freeze(api);
}
