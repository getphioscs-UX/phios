/**
 * PHI OS CM-W14 Meaning Projection for Journey.
 *
 * Read-only safe projection:
 * Canonical Meaning Bundle -> Journey Context Projection
 *
 * The exposed journeyContext contains ONLY:
 * - meaningCode
 * - meaningFamily
 * - selectedDimensions
 * - knowledgeCoverage
 * - limitations
 * - sourceLineage
 *
 * It does not query Knowledge, execute Method algorithms, call Providers,
 * create Interpretation, or expose Professional/internal/licensed data.
 */

export const JOURNEY_MEANING_PROJECTION_RUNTIME_CODE =
  'JOURNEY_MEANING_PROJECTION_RUNTIME';
export const JOURNEY_MEANING_PROJECTION_RUNTIME_VERSION = '1.0.0';
export const JOURNEY_MEANING_CONTEXT_SCHEMA_VERSION =
  'PHI-OS-JOURNEY-MEANING-CONTEXT-v1.0.0';

const BUNDLE_SCHEMA = 'PHI-OS-CANONICAL-MEANING-BUNDLE-v1.0.0';

const FORBIDDEN_KEYS = new Set([
  'algorithmCode',
  'algorithmVersion',
  'calculationId',
  'calculationRuntimeCode',
  'calculationRuntimeVersion',
  'inputDigest',
  'outputDigest',
  'mappingLineage',
  'mappingCode',
  'mappingDigest',
  'knowledgeReferences',
  'primaryNodeCodes',
  'supportingNodeCodes',
  'publishedFragmentDigests',
  'articleBody',
  'article',
  'unpublishedKnowledge',
  'professionalNotes',
  'internalProfessionalNotes',
  'licenseRestrictedSourceData',
  'rawMethodObject',
  'providerOutput',
  'prompt',
  'interpretation',
  'professionalConclusion',
  'realityDecision'
]);

function fail(code, message = code) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function assertObject(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(code);
  }
}

function assertString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(code);
  }
}

function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      fail('CMR_W14_FORBIDDEN_FIELD', `${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertMeaningBundle(bundle) {
  assertObject(bundle, 'CMR_W14_MEANING_BUNDLE_REQUIRED');

  if (bundle.schemaVersion !== BUNDLE_SCHEMA ||
      bundle.status !== 'validation_only' ||
      !Array.isArray(bundle.meanings) ||
      bundle.meanings.length < 1 ||
      !Array.isArray(bundle.limitations) ||
      !bundle.knowledgeCoverage) {
    fail('CMR_W14_MEANING_BUNDLE_INVALID');
  }

  for (const meaning of bundle.meanings) {
    assertObject(meaning, 'CMR_W14_MEANING_RECORD_INVALID');
    assertString(meaning.meaningCode, 'CMR_W14_MEANING_CODE_REQUIRED');
    assertString(meaning.meaningFamily, 'CMR_W14_MEANING_FAMILY_REQUIRED');
    assertObject(
      meaning.meaningDimensions,
      'CMR_W14_MEANING_DIMENSIONS_REQUIRED'
    );
    assertObject(
      meaning.sourceProjection,
      'CMR_W14_SOURCE_PROJECTION_REQUIRED'
    );

    for (const key of [
      'methodCode',
      'projectionType',
      'projectionCode',
      'projectionVersion',
      'projectionDigest'
    ]) {
      assertString(
        meaning.sourceProjection[key],
        `CMR_W14_SOURCE_LINEAGE_${key.toUpperCase()}_REQUIRED`
      );
    }

    if (meaning.status !== 'validation_only') {
      fail('CMR_W14_MEANING_STATUS_INVALID');
    }
  }

  const coverage = bundle.knowledgeCoverage;
  if (!['none', 'partial', 'sufficient'].includes(coverage.status) ||
      !Number.isInteger(coverage.nodeCount) ||
      coverage.nodeCount < 0 ||
      !Number.isInteger(coverage.publishedFragmentCount) ||
      coverage.publishedFragmentCount < 0 ||
      !['zh-Hans', 'en'].includes(coverage.locale)) {
    fail('CMR_W14_KNOWLEDGE_COVERAGE_INVALID');
  }
}

function normalizeRequestedDimensions(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    fail('CMR_W14_SELECTED_DIMENSIONS_MUST_BE_ARRAY');
  }

  const unique = [...new Set(value)];
  for (const item of unique) {
    assertString(item, 'CMR_W14_SELECTED_DIMENSION_CODE_INVALID');
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(item)) {
      fail('CMR_W14_SELECTED_DIMENSION_CODE_INVALID', item);
    }
  }
  return unique.sort();
}

function selectedDimensionsFor(meaning, requested) {
  const source = meaning.meaningDimensions;
  const available = Object.keys(source).sort();
  const selectedCodes = requested.length ? requested : available;
  const selected = {};

  for (const code of selectedCodes) {
    if (!(code in source)) continue;
    const value = source[code];
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      fail('CMR_W14_DIMENSION_VALUE_NOT_JOURNEY_SAFE', code);
    }
    selected[code] = value;
  }

  return Object.freeze(selected);
}

function safeLineage(meaning) {
  const source = meaning.sourceProjection;
  return Object.freeze({
    methodCode: source.methodCode,
    projectionType: source.projectionType,
    projectionCode: source.projectionCode,
    projectionVersion: source.projectionVersion,
    projectionDigest: source.projectionDigest
  });
}

function uniqueSortedStrings(values) {
  return [...new Set(
    values.filter(value => typeof value === 'string' && value.trim() !== '')
  )].sort();
}

function safeLimitations(bundle, meaning) {
  const boundaryLimitations = meaning.boundaries?.limitations;
  const mustNotClaim = meaning.boundaries?.mustNotClaim;

  return Object.freeze(uniqueSortedStrings([
    ...bundle.limitations,
    ...(Array.isArray(boundaryLimitations) ? boundaryLimitations : []),
    ...(Array.isArray(mustNotClaim) ? mustNotClaim : []),
    'Journey projection is read-only and does not create interpretation.',
    'Knowledge coverage is an inherited summary; unpublished knowledge is not exposed.',
    'Professional notes and license-restricted source data are not exposed.'
  ]));
}

export function projectMeaningBundleForJourney({
  meaningBundle,
  journeyCode,
  selectedDimensionCodes = []
} = {}) {
  assertMeaningBundle(meaningBundle);
  assertString(journeyCode, 'CMR_W14_JOURNEY_CODE_REQUIRED');

  const requestedDimensions =
    normalizeRequestedDimensions(selectedDimensionCodes);

  const journeyContext = meaningBundle.meanings
    .map(meaning => Object.freeze({
      meaningCode: meaning.meaningCode,
      meaningFamily: meaning.meaningFamily,
      selectedDimensions:
        selectedDimensionsFor(meaning, requestedDimensions),
      knowledgeCoverage: Object.freeze({
        status: meaningBundle.knowledgeCoverage.status,
        nodeCount: meaningBundle.knowledgeCoverage.nodeCount,
        publishedFragmentCount:
          meaningBundle.knowledgeCoverage.publishedFragmentCount,
        locale: meaningBundle.knowledgeCoverage.locale
      }),
      limitations: safeLimitations(meaningBundle, meaning),
      sourceLineage: safeLineage(meaning)
    }))
    .sort((a, b) =>
      `${a.meaningFamily}:${a.meaningCode}`.localeCompare(
        `${b.meaningFamily}:${b.meaningCode}`
      )
    );

  // Defensive assertion: exposed payload must not acquire restricted fields.
  assertNoForbiddenKeys(journeyContext);

  return Object.freeze({
    schemaVersion: JOURNEY_MEANING_CONTEXT_SCHEMA_VERSION,
    runtimeCode: JOURNEY_MEANING_PROJECTION_RUNTIME_CODE,
    runtimeVersion: JOURNEY_MEANING_PROJECTION_RUNTIME_VERSION,
    journeyCode,
    sourceBundleCode: meaningBundle.bundleCode,
    sourceBundleVersion: meaningBundle.bundleVersion,
    journeyContext: Object.freeze(journeyContext),
    readOnly: true,
    providerUsed: false,
    aiUsed: false,
    promptUsed: false,
    knowledgeQueried: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    realityDecisionCreated: false,
    status: 'validation_only'
  });
}

export default Object.freeze({
  projectMeaningBundleForJourney
});
