/**
 * PHI OS Reading → Navigation handoff contract.
 *
 * This contract transfers bounded Reading results into the Navigation layer.
 * Step 2.5.3B may attach bounded paths and display priority, but never selects a path.
 */

export const READING_NAVIGATION_CONTRACT_VERSION =
  'phi-os.reading-navigation-contract.v2';

export const READING_NAVIGATION_GUARDRAILS = Object.freeze({
  pathsGenerated: true,
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
    : {
        ready: input.navigationReady === true,
        score: input.readinessScore,
        blockers: input.blockers,
        advisories: input.advisories,
        reason: input.readinessReason,
        requirements: input.requirements
      };

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
    advisories: uniqueText(readiness.advisories, 12),
    readinessReason: cleanText(readiness.reason),
    requirements: isObject(readiness.requirements)
      ? { ...readiness.requirements }
      : {},
    currentReality: isObject(input.currentReality)
      ? { ...input.currentReality }
      : {},
    currentTransition: cleanText(input.currentTransition),
    decisionContext: isObject(input.decisionContext)
      ? { ...input.decisionContext }
      : {},
    activeQuestion: isObject(input.activeQuestion)
      ? { ...input.activeQuestion }
      : null,
    primaryCapability: isObject(input.primaryCapability)
      ? { ...input.primaryCapability }
      : null,
    runtimeCapabilities: list(input.runtimeCapabilities)
      .filter(isObject)
      .map(item => ({ ...item })),
    driverPriority: list(input.driverPriority)
      .filter(isObject)
      .map(item => ({ ...item })),
    runtimeCoordinate: list(input.runtimeCoordinate)
      .filter(isObject)
      .map(item => ({ ...item })),
    carrierOrganization: list(input.carrierOrganization)
      .filter(isObject)
      .map(item => ({ ...item })),
    carrierConfiguration: list(input.carrierConfiguration)
      .filter(isObject)
      .map(item => ({ ...item })),
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
    availablePaths: Array.isArray(input.availablePaths)
      ? input.availablePaths.map(path => ({ ...path }))
      : [],
    recommendedPriority: uniqueText(input.recommendedPriority, 8),
    selectedPath: null,
    pathGeneration: isObject(input.pathGeneration)
      ? { ...input.pathGeneration }
      : { generated: false },
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
  if (!Array.isArray(value.advisories)) errors.push('advisories must be an array.');
  if (!Array.isArray(value.availablePaths)) errors.push('availablePaths must be an array.');
  if (!Array.isArray(value.recommendedPriority)) errors.push('recommendedPriority must be an array.');
  if (!Array.isArray(value.runtimeCapabilities)) errors.push('runtimeCapabilities must be an array.');
  if (!Array.isArray(value.driverPriority)) errors.push('driverPriority must be an array.');
  if (value.selectedPath !== null) errors.push('selectedPath must remain null in the handoff contract.');
  const pathIds = list(value.availablePaths)
    .map(path => cleanText(path?.id))
    .filter(Boolean);

  if (value.navigationReady !== true && pathIds.length > 0) {
    errors.push('Paths cannot be generated while Navigation is not ready.');
  }

  if (pathIds.length > 4) errors.push('availablePaths cannot exceed four paths.');
  if (pathIds.length !== new Set(pathIds).size) errors.push('availablePaths contains duplicate ids.');

  const priorities = uniqueText(value.recommendedPriority, 8);
  if (priorities.some(pathId => !pathIds.includes(pathId))) {
    errors.push('recommendedPriority must reference available path ids.');
  }

  if (pathIds.length > 0 && priorities.length !== pathIds.length) {
    errors.push('recommendedPriority must order every available path.');
  }

  return { valid: errors.length === 0, errors };
}

export default createReadingNavigationContract;
