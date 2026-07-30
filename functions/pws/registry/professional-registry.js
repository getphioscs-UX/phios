import {
  RegistryValidationError,
  jsonObject,
  requiredText
} from './universal-registry-schema.js';

export const PROFESSIONAL_REGISTRY_VERSION =
  'phi-os.pws.professional-registry.v1';

export const PROFESSIONAL_REGISTRY_TYPES = Object.freeze({
  professionalType: 'ProfessionalType',
  professionalStatus: 'ProfessionalStatus',
  jurisdiction: 'Jurisdiction',
  organization: 'Organization',
  verificationType: 'VerificationType'
});

export const PROFESSIONAL_STATUSES = Object.freeze([
  'pending_verification',
  'active',
  'suspended',
  'revoked'
]);

export const PROFESSIONAL_STATUS_TRANSITIONS = Object.freeze({
  pending_verification: Object.freeze(['active', 'revoked']),
  active: Object.freeze(['suspended', 'revoked']),
  suspended: Object.freeze(['active', 'revoked']),
  revoked: Object.freeze([])
});

export const DEFAULT_PROFESSIONAL_TYPES = Object.freeze([
  Object.freeze({
    code: 'independent',
    name: 'Independent Professional',
    definition: 'A Professional acting under their own verified authority.'
  }),
  Object.freeze({
    code: 'organization_affiliated',
    name: 'Organization-affiliated Professional',
    definition:
      'A Professional whose declared affiliation is separately registered.'
  })
]);

export const DEFAULT_VERIFICATION_TYPES = Object.freeze([
  Object.freeze({
    code: 'identity',
    name: 'Identity Verification',
    verifies: 'professional_identity'
  }),
  Object.freeze({
    code: 'organization_affiliation',
    name: 'Organization Affiliation Verification',
    verifies: 'organization_affiliation'
  }),
  Object.freeze({
    code: 'credential',
    name: 'Credential Verification',
    verifies: 'credential_evidence'
  }),
  Object.freeze({
    code: 'certification',
    name: 'Certification Verification',
    verifies: 'certification_evidence'
  }),
  Object.freeze({
    code: 'jurisdiction_registration',
    name: 'Jurisdiction Registration Verification',
    verifies: 'jurisdiction_authority'
  })
]);

const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function registryCode(value, field = 'code') {
  const code = requiredText(value, field);
  if (!CODE_PATTERN.test(code)) {
    throw new RegistryValidationError(
      `${field} must be a lowercase canonical code.`,
      { field, value: code }
    );
  }
  return code;
}

function jurisdictionCode(value) {
  const code = requiredText(value, 'country_code');
  if (!COUNTRY_CODE_PATTERN.test(code)) {
    throw new RegistryValidationError(
      'country_code must be an ISO 3166-1 alpha-2 code.',
      { field: 'country_code', value: code }
    );
  }
  return code;
}

function context(input = {}) {
  return {
    actor_id: requiredText(input.actor_id, 'actor_id'),
    correlation_id: requiredText(input.correlation_id, 'correlation_id')
  };
}

function objectInput({
  id,
  code,
  type,
  name,
  ownerModule,
  metadata
}) {
  return {
    object_id: id,
    object_code: code,
    object_type: type,
    canonical_name: name,
    owner_module: ownerModule,
    schema_version: 'pws-v1',
    status: 'active',
    metadata: {
      registry_version: PROFESSIONAL_REGISTRY_VERSION,
      ...metadata
    }
  };
}

export function createProfessionalRegistry(options = {}) {
  const universal = options.universalRegistry;
  if (!universal?.registerObject || !universal?.query?.getObject) {
    throw new RegistryValidationError(
      'Professional Registry requires the Universal Registry Core.'
    );
  }

  const ensure = async (record, writeContext) => {
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
      record: await universal.registerObject(record, context(writeContext)),
      created: true
    };
  };

  const api = {
    async registerProfessionalType(input, writeContext) {
      const code = registryCode(input.code);
      return ensure(objectInput({
        id: `pws.professional-type.${code}`,
        code: `PWS-PROFESSIONAL-TYPE-${code.toUpperCase().replaceAll('_', '-')}`,
        type: PROFESSIONAL_REGISTRY_TYPES.professionalType,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/professional',
        metadata: {
          value: code,
          definition: requiredText(input.definition, 'definition')
        }
      }), writeContext);
    },

    async registerProfessionalStatus(input, writeContext) {
      const code = registryCode(input.code);
      if (!PROFESSIONAL_STATUSES.includes(code)) {
        throw new RegistryValidationError(
          'Professional Status must use the frozen PWS-I1 state set.',
          { value: code, allowed: PROFESSIONAL_STATUSES }
        );
      }
      return ensure(objectInput({
        id: `pws.professional-status.${code}`,
        code: `PWS-PROFESSIONAL-STATUS-${code.toUpperCase().replaceAll('_', '-')}`,
        type: PROFESSIONAL_REGISTRY_TYPES.professionalStatus,
        name: input.name || code,
        ownerModule: 'runtime/professional',
        metadata: {
          value: code,
          initial: code === 'pending_verification',
          terminal: code === 'revoked',
          transitions_to: PROFESSIONAL_STATUS_TRANSITIONS[code]
        }
      }), writeContext);
    },

    async registerJurisdiction(input, writeContext) {
      const code = jurisdictionCode(input.country_code);
      return ensure(objectInput({
        id: `pws.jurisdiction.${code}`,
        code: `PWS-JURISDICTION-${code}`,
        type: PROFESSIONAL_REGISTRY_TYPES.jurisdiction,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/governance',
        metadata: {
          country_code: code,
          regulatory_scope: jsonObject(
            input.regulatory_scope,
            'regulatory_scope'
          )
        }
      }), writeContext);
    },

    async registerOrganization(input, writeContext) {
      const code = registryCode(input.code);
      const jurisdictionIds = [...new Set(
        (input.jurisdiction_ids || []).map(value =>
          requiredText(value, 'jurisdiction_id')
        )
      )];
      if (jurisdictionIds.length === 0) {
        throw new RegistryValidationError(
          'Organization requires at least one registered Jurisdiction.',
          { field: 'jurisdiction_ids' }
        );
      }
      for (const jurisdictionId of jurisdictionIds) {
        const jurisdiction = await universal.query.getObject(jurisdictionId);
        if (
          jurisdiction?.object_type !==
          PROFESSIONAL_REGISTRY_TYPES.jurisdiction
        ) {
          throw new RegistryValidationError(
            `Organization references an unknown Jurisdiction: ${jurisdictionId}`,
            { jurisdiction_id: jurisdictionId }
          );
        }
      }
      return ensure(objectInput({
        id: `pws.organization.${code}`,
        code: `PWS-ORGANIZATION-${code.toUpperCase().replaceAll('_', '-')}`,
        type: PROFESSIONAL_REGISTRY_TYPES.organization,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/governance/organization',
        metadata: {
          organization_code: code,
          legal_name: requiredText(input.legal_name, 'legal_name'),
          jurisdiction_ids: Object.freeze(jurisdictionIds),
          identifiers: jsonObject(input.identifiers, 'identifiers')
        }
      }), writeContext);
    },

    async registerVerificationType(input, writeContext) {
      const code = registryCode(input.code);
      return ensure(objectInput({
        id: `pws.verification-type.${code}`,
        code: `PWS-VERIFICATION-TYPE-${code.toUpperCase().replaceAll('_', '-')}`,
        type: PROFESSIONAL_REGISTRY_TYPES.verificationType,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/professional',
        metadata: {
          value: code,
          verifies: requiredText(input.verifies, 'verifies'),
          grants_capability: false,
          grants_jurisdiction_authority: false
        }
      }), writeContext);
    },

    async seedDefaults(writeContext) {
      const results = [];
      for (const item of DEFAULT_PROFESSIONAL_TYPES) {
        results.push(await api.registerProfessionalType(item, writeContext));
      }
      for (const code of PROFESSIONAL_STATUSES) {
        results.push(await api.registerProfessionalStatus({ code }, writeContext));
      }
      for (const item of DEFAULT_VERIFICATION_TYPES) {
        results.push(await api.registerVerificationType(item, writeContext));
      }
      return {
        created: results.filter(result => result.created).length,
        existing: results.filter(result => !result.created).length,
        total: results.length
      };
    },

    async list(type, input = {}) {
      if (!Object.values(PROFESSIONAL_REGISTRY_TYPES).includes(type)) {
        throw new RegistryValidationError(
          'Unknown Professional Registry type.',
          { type }
        );
      }
      return universal.query.findObjects({
        ...input,
        object_type: type,
        owner_module: undefined
      });
    }
  };

  return Object.freeze(api);
}
