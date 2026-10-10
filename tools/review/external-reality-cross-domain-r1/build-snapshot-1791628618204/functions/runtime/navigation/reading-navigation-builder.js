/** Build the bounded Reading → Navigation handoff and attach rule-generated path options. */
import {
  createReadingNavigationContract,
  validateReadingNavigationContract
} from './reading-navigation-contract.js';

import generateNavigationPaths from './navigation-path-rules.js';

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function directionFromInput(readingInput = {}) {
  const entry = readingInput.runtimeEntry || {};
  const direction = entry.desiredTransition || entry.desiredDirection || {};
  return cleanText(
    direction.summary ||
    direction.statement ||
    direction.rawStatement ||
    readingInput.reconstruction?.direction?.summary ||
    readingInput.reconstruction?.direction?.nextDirection
  );
}

function constraintsFromInput(readingInput = {}) {
  const entry = readingInput.runtimeEntry || {};
  return [
    ...list(entry.activeConstraints),
    ...list(entry.constraints),
    ...list(readingInput.reconstruction?.context?.constraints)
  ];
}

export function buildReadingNavigationContract({ reading, readingInput, options = {} }) {
  const integrated = reading?.integratedReading || {};
  const boundary = reading?.evidenceBoundary || {};

  const contract = createReadingNavigationContract({
    runtimeEntityId: reading?.runtimeEntityId,
    runtimeEntryId: reading?.runtimeEntryId,
    readingSchemaVersion: reading?.schemaVersion,
    readingStatus: reading?.status,
    navigationReadiness: reading?.navigationReadiness,
    currentReality: {
      primaryPattern: integrated.primaryPattern || null,
      primaryRuntimeRegion: reading?.primaryRuntimeRegion || null,
      connectedRuntimeRegions: list(reading?.connectedRuntimeRegions),
      confidence: Number(reading?.confidence) || 0
    },
    currentTransition: integrated.currentTransition,
    decisionContext: reading?.decisionContext,
    activeQuestion: reading?.decisionContext?.activeQuestion,
    primaryCapability: reading?.primaryCapability,
    runtimeCapabilities: reading?.runtimeCapabilities,
    driverPriority: reading?.decisionContext?.driverPriority,
    runtimeCoordinate: readingInput?.reconstruction?.runtimeCoordinate,
    carrierOrganization: readingInput?.reconstruction?.carrierOrganization,
    carrierConfiguration: readingInput?.reconstruction?.carrierConfiguration,
    desiredDirection: directionFromInput(readingInput),
    constraints: constraintsFromInput(readingInput),
    evidenceBoundary: {
      observedEvidenceCount: list(boundary.observedEvidence).length,
      reportedExperienceCount: list(boundary.reportedExperience).length,
      interpretationExcluded: true,
      professionalAssessmentExcluded: true,
      aiInterpretationExcluded: true,
      unknownRealityExcluded: true
    },
    evidenceWatch: integrated.evidenceWatch,
    unknownReality: boundary.unknownReality,
    professionalBoundary: {
      escalationNeeded: reading?.routingHints?.professionalReviewUseful === true,
      domains: [],
      reasons: reading?.routingHints?.professionalReviewUseful === true
        ? ['professional_assessment_present']
        : []
    }
  });

  const generated = generateNavigationPaths(contract, {
    outputLanguage:
      options.outputLanguage ||
      options.language ||
      readingInput?.languageContract?.outputLanguage ||
      readingInput?.outputLanguage ||
      readingInput?.locale
  });

  const enrichedContract = createReadingNavigationContract({
    ...contract,
    availablePaths: generated.availablePaths,
    recommendedPriority: generated.recommendedPriority,
    pathGeneration: generated.pathGeneration
  });

  const validation = validateReadingNavigationContract(enrichedContract);
  if (!validation.valid) {
    throw new Error(`Reading → Navigation contract invalid: ${validation.errors.join(' ')}`);
  }

  return enrichedContract;
}

export default buildReadingNavigationContract;
