import {
  createCapabilityCredentialRegistry
} from './capability-credential-registry.js';
import {
  createKnowledgeDeliverableTypeRegistry
} from './knowledge-deliverable-type-registry.js';
import {
  createMethodServiceRegistry
} from './method-service-registry.js';
import {
  createProductOfferRegistry
} from './product-offer-registry.js';
import {
  createProfessionalRegistry
} from './professional-registry.js';
import {
  RegistryValidationError,
  requiredText
} from './universal-registry-schema.js';

export const PWS_I2_MIGRATION_RECONCILIATION_VERSION =
  'phi-os.pws.migration-reconciliation.v1';

export const LEGACY_METHOD_ID_MAP = Object.freeze({
  automated_runtime_reading: 'pws.method.reality_journey',
  professional_runtime_reading: 'pws.method.professional_runtime_reading',
  human_design_foundation: 'pws.method.human_design_foundation',
  human_design_runtime_interpretation:
    'pws.method.human_design_runtime_interpretation',
  financial_reality_review: 'pws.method.financial_reality_review',
  knowledge_routing: 'pws.method.knowledge_routing',
  reality_journey: 'pws.method.reality_journey'
});

export const LEGACY_CAPABILITY_ID_MAP = Object.freeze({
  professional_runtime_reading: 'pws.capability.professional_runtime_reading',
  human_design_foundation: 'pws.capability.human_design_foundation',
  human_design_runtime_interpretation:
    'pws.capability.human_design_runtime_interpretation',
  financial_reality_reconstruction:
    'pws.capability.financial_reality_reconstruction',
  financial_navigation_consultation:
    'pws.capability.financial_navigation_consultation',
  deliverable_review: 'pws.capability.deliverable_review',
  deliverable_signature: 'pws.capability.deliverable_signature'
});

export const LEGACY_REPORT_TYPE_MAP = Object.freeze({
  runtime_report: 'pws.deliverable-type.journey_report',
  professional_readout: 'pws.deliverable-type.professional_response',
  navigation_plan: 'pws.deliverable-type.navigation_plan',
  follow_up_report: 'pws.deliverable-type.professional_response',
  human_design_foundation_report:
    'pws.deliverable-type.human_design_specialist_report',
  human_design_runtime_interpretation:
    'pws.deliverable-type.human_design_specialist_report',
  reality_specific_external_reader_report:
    'pws.deliverable-type.human_design_specialist_report',
  integrated_runtime_review: 'pws.deliverable-type.professional_response',
  financial_reality_snapshot:
    'pws.deliverable-type.financial_specialist_report',
  financial_stamina_analysis:
    'pws.deliverable-type.financial_specialist_report',
  financial_navigation_plan: 'pws.deliverable-type.navigation_plan',
  financial_follow_up_report:
    'pws.deliverable-type.financial_specialist_report',
  annual_financial_runtime_review:
    'pws.deliverable-type.financial_specialist_report',
  integrated_runtime_financial_review:
    'pws.deliverable-type.financial_specialist_report'
});

export const LEGACY_SERVICE_METHOD_MAP = Object.freeze({
  automated_runtime_reading: Object.freeze(['reality_journey']),
  professional_runtime_reading:
    Object.freeze(['professional_runtime_reading']),
  reading_consultation: Object.freeze(['professional_runtime_reading']),
  navigation_follow_up: Object.freeze(['professional_runtime_reading']),
  long_term_runtime_review:
    Object.freeze(['professional_runtime_reading']),
  human_design_foundation_report:
    Object.freeze(['human_design_foundation']),
  human_design_runtime_interpretation:
    Object.freeze(['human_design_runtime_interpretation']),
  reality_specific_human_design_interpretation:
    Object.freeze(['human_design_runtime_interpretation']),
  runtime_human_design_consultation: Object.freeze([
    'professional_runtime_reading',
    'human_design_runtime_interpretation'
  ]),
  financial_reality_snapshot: Object.freeze(['financial_reality_review']),
  financial_stamina_analysis: Object.freeze(['financial_reality_review']),
  financial_reality_consultation:
    Object.freeze(['financial_reality_review']),
  financial_navigation_plan: Object.freeze(['financial_reality_review']),
  financial_implementation_review:
    Object.freeze(['financial_reality_review']),
  long_term_financial_runtime_review:
    Object.freeze(['financial_reality_review']),
  joint_household_financial_review:
    Object.freeze(['financial_reality_review']),
  integrated_runtime_financial_review: Object.freeze([
    'professional_runtime_reading',
    'financial_reality_review'
  ]),
  integrated_professional_review: Object.freeze([
    'professional_runtime_reading',
    'human_design_runtime_interpretation',
    'financial_reality_review'
  ])
});

const SERVICE_DELIVERABLE_MAP = Object.freeze({
  automated_runtime_reading: 'pws.deliverable-type.journey_report',
  professional_runtime_reading:
    'pws.deliverable-type.professional_response',
  reading_consultation: 'pws.deliverable-type.professional_response',
  navigation_follow_up: 'pws.deliverable-type.navigation_plan',
  long_term_runtime_review:
    'pws.deliverable-type.professional_response',
  human_design_foundation_report:
    'pws.deliverable-type.human_design_specialist_report',
  human_design_runtime_interpretation:
    'pws.deliverable-type.human_design_specialist_report',
  reality_specific_human_design_interpretation:
    'pws.deliverable-type.human_design_specialist_report',
  runtime_human_design_consultation:
    'pws.deliverable-type.human_design_specialist_report',
  financial_reality_snapshot:
    'pws.deliverable-type.financial_specialist_report',
  financial_stamina_analysis:
    'pws.deliverable-type.financial_specialist_report',
  financial_reality_consultation:
    'pws.deliverable-type.financial_specialist_report',
  financial_navigation_plan: 'pws.deliverable-type.navigation_plan',
  financial_implementation_review:
    'pws.deliverable-type.financial_specialist_report',
  long_term_financial_runtime_review:
    'pws.deliverable-type.financial_specialist_report',
  joint_household_financial_review:
    'pws.deliverable-type.financial_specialist_report',
  integrated_runtime_financial_review:
    'pws.deliverable-type.financial_specialist_report',
  integrated_professional_review:
    'pws.deliverable-type.professional_response'
});

function plainObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RegistryValidationError(`${field} must be an object.`, { field });
  }
  return value;
}

function exactCoverage(actual, expected, field) {
  const actualValues = [...new Set(actual)].sort();
  const expectedValues = [...new Set(expected)].sort();
  if (JSON.stringify(actualValues) !== JSON.stringify(expectedValues)) {
    throw new RegistryValidationError(`${field} coverage does not reconcile.`, {
      field,
      actual: actualValues,
      expected: expectedValues
    });
  }
}

function serviceDefinition(service) {
  const code = requiredText(service.serviceId, 'serviceId');
  const methodCodes = LEGACY_SERVICE_METHOD_MAP[code];
  const deliverableContractId = SERVICE_DELIVERABLE_MAP[code];
  if (!methodCodes || !deliverableContractId) {
    throw new RegistryValidationError(
      `Legacy Service has no frozen reconciliation mapping: ${code}`,
      { service_id: code }
    );
  }
  return {
    code,
    name: requiredText(service.name?.en, 'service.name.en'),
    definition:
      `Definition-only migration of ${requiredText(
        service.name?.en,
        'service.name.en'
      )}; activation remains subject to its canonical boundaries.`,
    method_codes: methodCodes,
    deliverable_contract_id: deliverableContractId,
    boundary_contract_id: code === 'automated_runtime_reading'
      ? 'phi-os.reading-evidence-boundary'
      : 'phi-os.professional-service-boundaries',
    legacy_aliases: [code]
  };
}

export function reconcileLegacyIdentifiers(input = {}) {
  const source = plainObject(input, 'legacy_record');
  const output = structuredClone(source);
  for (const mapping of [
    {
      legacy: 'service_product_id',
      canonical: 'product_id',
      alias: 'ServiceProduct'
    },
    {
      legacy: 'service_entitlement_id',
      canonical: 'entitlement_id',
      alias: 'ServiceEntitlement'
    }
  ]) {
    if (source[mapping.legacy] == null) continue;
    const legacyValue = requiredText(source[mapping.legacy], mapping.legacy);
    const serviceId = requiredText(source.service_id, 'service_id');
    if (
      source[mapping.canonical] != null &&
      requiredText(source[mapping.canonical], mapping.canonical) !== legacyValue
    ) {
      throw new RegistryValidationError(
        `${mapping.legacy} conflicts with ${mapping.canonical}.`,
        { legacy_alias: mapping.alias }
      );
    }
    output[mapping.canonical] = legacyValue;
    output.service_id = serviceId;
    delete output[mapping.legacy];
  }
  return output;
}

export function createPwsI2MigrationReconciler(options = {}) {
  const universalRegistry = options.universalRegistry;
  if (
    !universalRegistry?.registerObject ||
    !universalRegistry?.query?.getObject ||
    !universalRegistry?.relationshipStore?.create
  ) {
    throw new RegistryValidationError(
      'PWS-I2 Migration and Reconciliation requires the Universal Registry Core.'
    );
  }

  const professional = createProfessionalRegistry({ universalRegistry });
  const capability = createCapabilityCredentialRegistry({
    universalRegistry
  });
  const methodService = createMethodServiceRegistry({ universalRegistry });
  const productOffer = createProductOfferRegistry({ universalRegistry });
  const knowledgeDeliverable = createKnowledgeDeliverableTypeRegistry({
    universalRegistry
  });

  return Object.freeze({
    async reconcile(input = {}, context = {}) {
      const serviceCatalog = plainObject(
        input.service_catalog,
        'service_catalog'
      );
      const pricingPolicy = plainObject(
        input.pricing_policy,
        'pricing_policy'
      );
      const bookProductRegistry = plainObject(
        input.book_product_registry,
        'book_product_registry'
      );
      const knowledgePolicy = plainObject(
        input.knowledge_policy,
        'knowledge_policy'
      );
      const legacyReportTypes = input.report_types || [];

      exactCoverage(
        (serviceCatalog.services || []).map(item => item.serviceId),
        Object.keys(LEGACY_SERVICE_METHOD_MAP),
        'service_catalog.services'
      );
      exactCoverage(
        legacyReportTypes,
        Object.keys(LEGACY_REPORT_TYPE_MAP),
        'report_types'
      );
      if (
        pricingPolicy.amountsPublished !== false ||
        pricingPolicy.checkoutEnabled !== false
      ) {
        throw new RegistryValidationError(
          'Unapproved Professional Price configuration cannot be activated.'
        );
      }
      if (
        knowledgePolicy.productionQueue
          ?.registryPresenceImpliesProduction !== false
      ) {
        throw new RegistryValidationError(
          'Knowledge Registry presence must not create a production requirement.'
        );
      }

      const seeded = {
        professional: await professional.seedDefaults(context),
        capability: await capability.seedDefaults(context),
        method: await methodService.seedDefaults(context),
        knowledge_deliverable:
          await knowledgeDeliverable.seedDefaults(context),
        product_offer: await productOffer.seedDefaults(context)
      };

      const services = [];
      for (const service of serviceCatalog.services || []) {
        services.push(await methodService.registerServiceDefinition(
          serviceDefinition(service),
          context
        ));
      }

      const [bookProduct] = bookProductRegistry.products || [];
      if (!bookProduct || (bookProductRegistry.products || []).length !== 1) {
        throw new RegistryValidationError(
          'Book Product reconciliation expects the single approved Book I record.'
        );
      }
      const canonicalProduct = await universalRegistry.query.getObject(
        `pws.product.${requiredText(bookProduct.productId, 'productId')}`
      );
      const canonicalOffer = await universalRegistry.query.getObject(
        'pws.offer.phios-book-one-zh-pdf-myr'
      );
      if (
        canonicalProduct?.metadata?.legacy_product_ids?.[0] !==
          bookProduct.legacyProductId ||
        canonicalOffer?.metadata?.amount_minor !== bookProduct.amountMinor ||
        canonicalOffer?.metadata?.currency !== bookProduct.currency
      ) {
        throw new RegistryValidationError(
          'Static Book Product or Price configuration conflicts with the canonical Product and Offer.'
        );
      }

      for (const objectId of [
        ...Object.values(LEGACY_METHOD_ID_MAP),
        ...Object.values(LEGACY_CAPABILITY_ID_MAP),
        ...Object.values(LEGACY_REPORT_TYPE_MAP)
      ]) {
        if (!await universalRegistry.query.getObject(objectId)) {
          throw new RegistryValidationError(
            `Reconciliation target is not registered: ${objectId}`,
            { object_id: objectId }
          );
        }
      }

      return {
        migration: PWS_I2_MIGRATION_RECONCILIATION_VERSION,
        seeded,
        services: {
          created: services.filter(item => item.service.created).length,
          existing: services.filter(item => !item.service.created).length,
          total: services.length
        },
        legacy_aliases: {
          ServiceProduct: 'Product + required Service reference',
          ServiceEntitlement: 'Entitlement + required Service reference'
        },
        report_types: {
          reconciled: legacyReportTypes.length,
          canonical_targets: new Set(
            Object.values(LEGACY_REPORT_TYPE_MAP)
          ).size
        },
        professional_prices: 'deferred_until_approved',
        knowledge_configuration: 'pkr_authority_preserved',
        storage_migration_added: false,
        legacy_deleted: false
      };
    }
  });
}
