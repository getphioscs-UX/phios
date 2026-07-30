import {
  RegistryValidationError,
  requiredText
} from './universal-registry-schema.js';

export const PRODUCT_OFFER_REGISTRY_VERSION =
  'phi-os.pws.product-offer-registry.v1';

export const PRODUCT_TYPE_REGISTRY_TYPE = 'ProductType';
export const PRODUCT_REGISTRY_TYPE = 'Product';
export const OFFER_REGISTRY_TYPE = 'Offer';

export const DEFAULT_PRODUCT_TYPE_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: 'knowledge_product',
    name: 'Knowledge Product',
    definition: 'A governed knowledge item offered without individual analysis.'
  }),
  Object.freeze({
    code: 'reality_journey_pass',
    name: 'Reality Journey Pass',
    definition: 'An entitlement-bearing product for one bounded Reality Journey.'
  }),
  Object.freeze({
    code: 'professional_service_product',
    name: 'Professional Service Product',
    definition:
      'A separately selected professional service requiring its own eligibility, consent, payment and assignment.'
  }),
  Object.freeze({
    code: 'book',
    name: 'Book',
    definition: 'A governed publication product.'
  }),
  Object.freeze({
    code: 'membership',
    name: 'Membership',
    definition: 'A time-bounded membership product with explicit entitlements.'
  }),
  Object.freeze({
    code: 'follow_up_product',
    name: 'Follow-up Product',
    definition:
      'A separately purchased continuation product linked to an eligible prior journey or service.'
  })
]);

export const DEFAULT_PRODUCT_DEFINITIONS = Object.freeze([
  Object.freeze({
    product_code: 'reality-journey-pass-v1',
    display_name: 'Reality Journey Pass',
    product_type_code: 'reality_journey_pass',
    method_code: 'reality_journey',
    journey_type: 'personal_reality_journey',
    professional_review_included: false,
    offer: Object.freeze({
      code: 'reality-journey-pass-v1-myr',
      amount_minor: 500,
      currency: 'MYR'
    })
  }),
  Object.freeze({
    product_code: 'phios-book-one-zh-pdf',
    display_name: '《世界如何形成》第一册',
    product_type_code: 'book',
    method_code: 'knowledge_routing',
    journey_type: null,
    professional_review_included: false,
    legacy_product_ids: Object.freeze(['phios-book-one']),
    fulfilment_code: 'watermarked_pdf',
    knowledge_asset_id: 'BOOK-I',
    offer: Object.freeze({
      code: 'phios-book-one-zh-pdf-myr',
      amount_minor: 8900,
      currency: 'MYR'
    })
  })
]);

const CANONICAL_CODE_PATTERN = /^[a-z][a-z0-9_]*$/;
const COMMERCIAL_CODE_PATTERN = /^[a-z][a-z0-9-]*$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function canonicalCode(value, field = 'code') {
  const code = requiredText(value, field);
  if (!CANONICAL_CODE_PATTERN.test(code)) {
    throw new RegistryValidationError(
      `${field} must be a lowercase canonical code.`,
      { field, value: code }
    );
  }
  return code;
}

function commercialCode(value, field = 'code') {
  const code = requiredText(value, field);
  if (!COMMERCIAL_CODE_PATTERN.test(code)) {
    throw new RegistryValidationError(
      `${field} must be a lowercase hyphenated commercial code.`,
      { field, value: code }
    );
  }
  return code;
}

function currencyCode(value) {
  const currency = requiredText(value, 'currency');
  if (!CURRENCY_PATTERN.test(currency)) {
    throw new RegistryValidationError(
      'currency must be an uppercase ISO 4217 code.',
      { field: 'currency', value: currency }
    );
  }
  return currency;
}

function minorAmount(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RegistryValidationError(
      'amount_minor must be a non-negative safe integer.',
      { field: 'amount_minor', value }
    );
  }
  return value;
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
      registry_version: PRODUCT_OFFER_REGISTRY_VERSION,
      ...metadata
    }
  };
}

export function createProductOfferRegistry(options = {}) {
  const universal = options.universalRegistry;
  if (
    !universal?.registerObject ||
    !universal?.query?.getObject ||
    !universal?.query?.findObjects ||
    !universal?.relationshipStore?.create ||
    !universal?.relationshipStore?.listForObject
  ) {
    throw new RegistryValidationError(
      'Product and Offer Registry requires the Universal Registry Core.'
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
      registry_version: PRODUCT_OFFER_REGISTRY_VERSION,
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
    async registerProductTypeDefinition(input, context) {
      const code = canonicalCode(input.code);
      return ensureObject(objectInput({
        id: `pws.product-type.${code}`,
        code: `PWS-PRODUCT-TYPE-${code.toUpperCase().replaceAll('_', '-')}`,
        type: PRODUCT_TYPE_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/product',
        metadata: {
          value: code,
          definition: requiredText(input.definition, 'definition'),
          definition_only: true,
          creates_entitlement: false,
          creates_professional_responsibility: false
        }
      }), context);
    },

    async registerOfferDefinition(input, context) {
      const code = commercialCode(input.code);
      const productId = requiredText(input.product_id, 'product_id');
      await requireObject(productId, PRODUCT_REGISTRY_TYPE, 'product_id');
      const offer = await ensureObject(objectInput({
        id: `pws.offer.${code}`,
        code: `PWS-OFFER-${code.toUpperCase()}`,
        type: OFFER_REGISTRY_TYPE,
        name: requiredText(input.name, 'name'),
        ownerModule: 'runtime/offer',
        metadata: {
          value: code,
          amount_minor: minorAmount(input.amount_minor),
          currency: currencyCode(input.currency),
          price_source: 'pws_product_offer_registry',
          html_is_write_source: false,
          creates_entitlement: false,
          activates_journey: false,
          creates_professional_assignment: false,
          creates_professional_responsibility: false
        }
      }), context);
      const relationship = await ensureRelationship({
        sourceObjectId: offer.record.object_id,
        targetObjectId: productId,
        relationshipId: `rel.offer-for-product.${code}`,
        relationshipType: 'offer_for_product',
        attributes: {
          price_authority: true,
          purchase_required_for_entitlement: true
        },
        context
      });
      return { offer, relationship };
    },

    async registerProductDefinition(input, context) {
      const productCode = commercialCode(input.product_code, 'product_code');
      const productTypeCode = canonicalCode(
        input.product_type_code,
        'product_type_code'
      );
      const methodCode = canonicalCode(input.method_code, 'method_code');
      const journeyType = input.journey_type == null
        ? null
        : canonicalCode(input.journey_type, 'journey_type');
      const productTypeId = `pws.product-type.${productTypeCode}`;
      const methodId = `pws.method.${methodCode}`;
      await requireObject(
        productTypeId,
        PRODUCT_TYPE_REGISTRY_TYPE,
        'product_type_code'
      );
      await requireObject(methodId, 'Method', 'method_code');
      const professionalReviewIncluded =
        input.professional_review_included === true;
      if (
        productTypeCode === 'reality_journey_pass' &&
        professionalReviewIncluded
      ) {
        throw new RegistryValidationError(
          'Reality Journey Pass cannot include Professional Review.',
          { field: 'professional_review_included' }
        );
      }
      if (productTypeCode === 'reality_journey_pass' && journeyType === null) {
        throw new RegistryValidationError(
          'Reality Journey Pass requires a journey_type.',
          { field: 'journey_type' }
        );
      }
      if (productTypeCode !== 'reality_journey_pass' && journeyType !== null) {
        throw new RegistryValidationError(
          'Only a Reality Journey Pass may declare journey_type.',
          { field: 'journey_type', product_type_code: productTypeCode }
        );
      }
      const legacyProductIds = [
        ...new Set((input.legacy_product_ids || []).map(value =>
          commercialCode(value, 'legacy_product_id')
        ))
      ];
      const product = await ensureObject(objectInput({
        id: `pws.product.${productCode}`,
        code: productCode,
        type: PRODUCT_REGISTRY_TYPE,
        name: requiredText(input.display_name, 'display_name'),
        ownerModule: 'runtime/product',
        metadata: {
          product_code: productCode,
          display_name: requiredText(input.display_name, 'display_name'),
          product_type_code: productTypeCode,
          journey_type: journeyType,
          fulfilment_code: input.fulfilment_code == null
            ? null
            : canonicalCode(input.fulfilment_code, 'fulfilment_code'),
          knowledge_asset_id: input.knowledge_asset_id == null
            ? null
            : requiredText(input.knowledge_asset_id, 'knowledge_asset_id'),
          legacy_product_ids: legacyProductIds,
          professional_review_included: professionalReviewIncluded,
          price_held_by_offer: true,
          requires_order: true,
          requires_payment_confirmation: true,
          requires_active_entitlement: true,
          creates_entitlement: false,
          activates_journey: false,
          creates_professional_entitlement: false,
          creates_professional_assignment: false,
          creates_professional_responsibility: false
        }
      }), context);
      const relationships = [
        await ensureRelationship({
          sourceObjectId: product.record.object_id,
          targetObjectId: productTypeId,
          relationshipId: `rel.product-has-type.${productCode}.${productTypeCode}`,
          relationshipType: 'product_has_type',
          attributes: { classification_only: true },
          context
        }),
        await ensureRelationship({
          sourceObjectId: product.record.object_id,
          targetObjectId: methodId,
          relationshipId: `rel.product-uses-method.${productCode}.${methodCode}`,
          relationshipType: 'product_uses_method',
          attributes: {
            entitlement_required_before_execution: true,
            professional_assignment_created: false
          },
          context
        })
      ];
      const offerInput = input.offer || {};
      const offer = await api.registerOfferDefinition({
        code: commercialCode(offerInput.code, 'offer.code'),
        name: `${product.record.canonical_name} — ${currencyCode(
          offerInput.currency
        )}`,
        product_id: product.record.object_id,
        amount_minor: offerInput.amount_minor,
        currency: offerInput.currency
      }, context);
      return { product, relationships, offer };
    },

    async seedDefaults(context) {
      const productTypes = [];
      for (const definition of DEFAULT_PRODUCT_TYPE_DEFINITIONS) {
        productTypes.push(
          await api.registerProductTypeDefinition(definition, context)
        );
      }
      const products = [];
      for (const definition of DEFAULT_PRODUCT_DEFINITIONS) {
        products.push(await api.registerProductDefinition(definition, context));
      }
      return {
        product_types: {
          created: productTypes.filter(item => item.created).length,
          existing: productTypes.filter(item => !item.created).length,
          total: productTypes.length
        },
        products: {
          created: products.filter(item => item.product.created).length,
          existing: products.filter(item => !item.product.created).length,
          total: products.length
        },
        offers: {
          created: products.filter(item => item.offer.offer.created).length,
          existing: products.filter(item => !item.offer.offer.created).length,
          total: products.length
        },
        relationships: {
          created: products.flatMap(item => [
            ...item.relationships,
            item.offer.relationship
          ]).filter(item => item.created).length,
          existing: products.flatMap(item => [
            ...item.relationships,
            item.offer.relationship
          ]).filter(item => !item.created).length,
          total: products.length * 3
        }
      };
    },

    async listProductTypes(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: PRODUCT_TYPE_REGISTRY_TYPE,
        owner_module: undefined
      });
    },

    async listProducts(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: PRODUCT_REGISTRY_TYPE,
        owner_module: undefined
      });
    },

    async listOffers(input = {}) {
      return universal.query.findObjects({
        ...input,
        object_type: OFFER_REGISTRY_TYPE,
        owner_module: undefined
      });
    }
  };

  return Object.freeze(api);
}
