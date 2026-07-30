import {
  RegistryValidationError,
  requiredText
} from './universal-registry-schema.js';

export const KNOWLEDGE_DELIVERABLE_TYPE_REGISTRY_VERSION =
  'phi-os.pws.knowledge-deliverable-type-registry.v1';

export const PUBLISHED_ASSET_TYPE_REGISTRY_TYPE = 'PublishedAssetType';
export const DELIVERABLE_TYPE_REGISTRY_TYPE = 'DeliverableType';

export const DEFAULT_PUBLISHED_ASSET_TYPE_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: 'article',
    name: 'Article',
    definition: 'A published written asset derived from governed knowledge.'
  }),
  Object.freeze({
    code: 'video',
    name: 'Video',
    definition: 'A published moving-image asset derived from governed knowledge.'
  }),
  Object.freeze({
    code: 'audio',
    name: 'Audio',
    definition: 'A published audio asset derived from governed knowledge.'
  }),
  Object.freeze({
    code: 'figure',
    name: 'Figure',
    definition: 'A published visual figure derived from governed knowledge.'
  }),
  Object.freeze({
    code: 'atlas_entry',
    name: 'Atlas Entry',
    definition: 'A published Reality Atlas entry derived from governed knowledge.'
  }),
  Object.freeze({
    code: 'book',
    name: 'Book',
    definition: 'A published book asset governed independently from its plan.'
  }),
  Object.freeze({
    code: 'research_resource',
    name: 'Research Resource',
    definition: 'A published research resource with explicit source lineage.'
  })
]);

export const DEFAULT_DELIVERABLE_TYPE_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: 'journey_report',
    name: 'Journey Report',
    owner_module: 'runtime/deliverable/journey-report',
    definition:
      'A versioned report derived from an existing Journey without replacing it.'
  }),
  Object.freeze({
    code: 'professional_response',
    name: 'Professional Response',
    owner_module: 'runtime/deliverable/professional-response',
    definition:
      'A source-labelled response authored by an identified assigned Professional.'
  }),
  Object.freeze({
    code: 'human_design_specialist_report',
    name: 'Human Design Specialist Report',
    owner_module: 'runtime/deliverable/specialist-report',
    definition:
      'A versioned specialist report that preserves Human Design and Runtime source separation.'
  }),
  Object.freeze({
    code: 'financial_specialist_report',
    name: 'Financial Specialist Report',
    owner_module: 'runtime/deliverable/specialist-report',
    definition:
      'A versioned financial specialist report with evidence, assumptions and calculations separated.'
  }),
  Object.freeze({
    code: 'navigation_plan',
    name: 'Navigation Plan',
    owner_module: 'runtime/deliverable/navigation-plan',
    definition:
      'A versioned navigation plan that records options, dependencies and review points without automatic execution.'
  })
]);

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
      registry_version: KNOWLEDGE_DELIVERABLE_TYPE_REGISTRY_VERSION,
      ...metadata
    }
  };
}

export function createKnowledgeDeliverableTypeRegistry(options = {}) {
  const universal = options.universalRegistry;
  if (
    !universal?.registerObject ||
    !universal?.query?.getObject ||
    !universal?.query?.findObjects
  ) {
    throw new RegistryValidationError(
      'Knowledge and Deliverable Type Registry requires the Universal Registry Core.'
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

  const api = {
    async registerPublishedAssetType(input, context) {
      const code = canonicalCode(input.code);
      return ensureObject(objectInput({
        id: `pws.published-asset-type.${code}`,
        code:
          `PWS-PUBLISHED-ASSET-TYPE-${code.toUpperCase().replaceAll('_', '-')}`,
        type: PUBLISHED_ASSET_TYPE_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'knowledge/published-asset-type',
        metadata: {
          value: code,
          definition: requiredText(input.definition, 'definition'),
          definition_only: true,
          type_authority: 'pws_i2',
          canonical_node_authority: 'pkr',
          supporting_question_authority: 'pkr',
          book_i_planning_authority: 'kh_w3_5g_blueprint',
          creates_canonical_knowledge_node: false,
          creates_supporting_question: false,
          starts_content_production: false,
          creates_published_asset: false
        }
      }), context);
    },

    async registerDeliverableType(input, context) {
      const code = canonicalCode(input.code);
      return ensureObject(objectInput({
        id: `pws.deliverable-type.${code}`,
        code:
          `PWS-DELIVERABLE-TYPE-${code.toUpperCase().replaceAll('_', '-')}`,
        type: DELIVERABLE_TYPE_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: requiredText(input.owner_module, 'owner_module'),
        metadata: {
          value: code,
          definition: requiredText(input.definition, 'definition'),
          definition_only: true,
          requires_source_lineage: true,
          requires_versioning: true,
          requires_explicit_release: true,
          creates_deliverable_instance: false,
          creates_signature: false,
          creates_professional_responsibility: false
        }
      }), context);
    },

    async seedDefaults(context) {
      const publishedAssetTypes = [];
      for (const definition of DEFAULT_PUBLISHED_ASSET_TYPE_DEFINITIONS) {
        publishedAssetTypes.push(
          await api.registerPublishedAssetType(definition, context)
        );
      }
      const deliverableTypes = [];
      for (const definition of DEFAULT_DELIVERABLE_TYPE_DEFINITIONS) {
        deliverableTypes.push(
          await api.registerDeliverableType(definition, context)
        );
      }
      return {
        published_asset_types: {
          created: publishedAssetTypes.filter(item => item.created).length,
          existing: publishedAssetTypes.filter(item => !item.created).length,
          total: publishedAssetTypes.length
        },
        deliverable_types: {
          created: deliverableTypes.filter(item => item.created).length,
          existing: deliverableTypes.filter(item => !item.created).length,
          total: deliverableTypes.length
        }
      };
    },

    async listPublishedAssetTypes(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: PUBLISHED_ASSET_TYPE_REGISTRY_TYPE,
        owner_module: undefined
      });
    },

    async listDeliverableTypes(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: DELIVERABLE_TYPE_REGISTRY_TYPE,
        owner_module: undefined
      });
    }
  };

  return Object.freeze(api);
}
