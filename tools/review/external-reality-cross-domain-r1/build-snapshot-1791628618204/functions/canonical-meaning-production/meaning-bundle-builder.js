import { resolveCanonicalMeaningItems, sha256Canonical } from './meaning-resolver.js';

const BUNDLE_SCHEMA = 'PHI-OS-CANONICAL-MEANING-PRODUCTION-BUNDLE-v1.0.0';
const BUNDLE_VERSION = '1.0.0';

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freezeDeep(child);
  }
  return value;
}

export async function buildCanonicalMeaningProductionBundle({ projection, admissionRegistry, mappingRegistry, mode = 'foundation_validation' }) {
  const resolved = await resolveCanonicalMeaningItems({ projection, admissionRegistry, mappingRegistry, mode });
  const registryVersions = Object.freeze({
    admissionRegistryVersion: admissionRegistry.schemaVersion,
    mappingRegistryVersion: mappingRegistry.schemaVersion
  });
  const digestSeed = {
    projectionDigest: resolved.projectionDigest,
    registryVersions,
    matchedMappingCodes: resolved.items.map(item => item.mappingLineage.mappingCode).sort(),
    meaningIdentityDigests: resolved.items.map(item => item.evidence.meaningCanonicalDigest).sort()
  };
  const bundleDigest = await sha256Canonical(digestSeed);
  const production = mode === 'production';
  const bundle = {
    schemaVersion: BUNDLE_SCHEMA,
    bundleCode: `CMPB-${bundleDigest.slice(0, 24).toUpperCase()}`,
    bundleVersion: BUNDLE_VERSION,
    status: production ? 'PRODUCTION' : 'FOUNDATION_VALIDATION_ONLY',
    activationState: production ? 'PRODUCTION_ACTIVE' : 'NOT_USER_ACTIVE',
    sourceProjection: {
      projectionId: projection.projectionId,
      schemaVersion: projection.schemaVersion,
      publicMethodCode: resolved.publicMethodCode,
      methodCode: resolved.methodCode,
      projectionDigest: resolved.projectionDigest
    },
    registryVersions,
    items: [...resolved.items],
    bundleDigest,
    boundaries: {
      providerUsed: false,
      aiUsed: false,
      promptUsed: false,
      recalculated: false,
      projectionMutated: false,
      interpretationCreated: false,
      professionalJudgmentCreated: false,
      realityDecisionCreated: false,
      localeRenderingIncluded: false
    }
  };
  return freezeDeep(bundle);
}

export default Object.freeze({ buildCanonicalMeaningProductionBundle });
