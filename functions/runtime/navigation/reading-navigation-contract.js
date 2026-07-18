/**
 * PHI OS Reading → Navigation handoff contract.
 *
 * This contract transfers bounded Reading results into the Navigation layer.
 * It does not generate paths, recommend a path, or select a path.
 */

export const READING_NAVIGATION_CONTRACT_VERSION =
  'phi-os.reading-navigation-contract.v1';

export const READING_NAVIGATION_GUARDRAILS = Object.freeze({
  pathsGenerated: false,
  automaticSelectionAllowed: false,
  deterministicCommandsAllowed: false,
  unknownRealityPreserved: true,
  evidenceBoundaryRequired: true,
  userChoiceRequired: true
});

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueText(values, maximum = Infinity) {
  const output = [];
  const seen = new Set();

  for (const value of list(values)) {
    const text = cleanText(value?.statement || value?.summary || value);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= maximum) break;
  }

  return output;
}

export function createReadingNavigationContract(source = {}) {
  const input = isObject(source) ? source : {};
  const readiness = isObject(input.navigationReadiness)
    ? input.navigationReadiness
    : {};

  return {
    schemaVersion: READING_NAVIGATION_CONTRACT_VERSION,
    createdAt: cleanText(input.createdAt) || new Date().toISOString(),
    runtimeEntityId: cleanText(input.runtimeEntityId),
    runtimeEntryId: cleanText(input.runtimeEntryId),
    readingSchemaVersion: cleanText(input.readingSchemaVersion),
    readingStatus: cleanText(input.readingStatus) || 'partial',
    navigationReady: readiness.ready === true,
    readinessScore: Number.isFinite(Number(readiness.score))
      ? Number(Number(readiness.score).toFixed(2))
      : 0,
    blockers: uniqueText(readiness.blockers, 12),
    readinessReason: cleanText(readiness.reason),
    requirements: isObject(readiness.requirements)
      ? { ...readiness.requirements }
      : {},
    currentReality: isObject(input.currentReality)
      ? { ...input.currentReality }
      : {},
    currentTransition: cleanText(input.currentTransition),
    desiredDirection: cleanText(input.desiredDirection),
    constraints: uniqueText(input.constraints, 12),
    evidenceBoundary: isObject(input.evidenceBoundary)
      ? { ...input.evidenceBoundary }
      : {},
    evidenceWatch: uniqueText(input.evidenceWatch, 12),
    unknownReality: uniqueText(input.unknownReality, 12),
    professionalBoundary: {
      escalationNeeded: input.professionalBoundary?.escalationNeeded === true,
      domains: uniqueText(input.professionalBoundary?.domains, 8),
      reasons: uniqueText(input.professionalBoundary?.reasons, 8)
    },
    availablePaths: [],
    recommendedPriority: [],
    selectedPath: null,
    source: 'rule_engine',
    guardrails: READING_NAVIGATION_GUARDRAILS
  };
}

export function validateReadingNavigationContract(value) {
  const errors = [];

  if (!isObject(value)) {
    return { valid: false, errors: ['Contract must be an object.'] };
  }

  if (value.schemaVersion !== READING_NAVIGATION_CONTRACT_VERSION) {
    errors.push('schemaVersion is invalid.');
  }

  if (!cleanText(value.runtimeEntityId)) errors.push('runtimeEntityId is required.');
  if (!cleanText(value.runtimeEntryId)) errors.push('runtimeEntryId is required.');
  if (!Array.isArray(value.blockers)) errors.push('blockers must be an array.');
  if (!Array.isArray(value.availablePaths)) errors.push('availablePaths must be an array.');
  if (!Array.isArray(value.recommendedPriority)) errors.push('recommendedPriority must be an array.');
  if (value.selectedPath !== null) errors.push('selectedPath must remain null in the handoff contract.');
  if (list(value.availablePaths).length > 0) errors.push('Path generation belongs to Step 2.5.3B.');
  if (list(value.recommendedPriority).length > 0) errors.push('Priority generation belongs to Step 2.5.3B.');

  return { valid: errors.length === 0, errors };
}

export default createReadingNavigationContract;
