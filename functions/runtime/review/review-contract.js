/**
 * PHI OS Reality Review Contract — Step 2.5.4A.
 *
 * Review records what happened after an explicitly selected Navigation path.
 * It does not re-run Reading, reinterpret historical evidence, replace the
 * selected path, or convert customer reports into established facts.
 */

import { SCHEMA_IDS } from '../shared/schema-registry.js';

export const REVIEW_CONTRACT_VERSION = SCHEMA_IDS.REVIEW;

export const REVIEW_PATH_STATUSES = Object.freeze([
  'not_started',
  'in_progress',
  'paused',
  'completed',
  'changed',
  'withdrawn'
]);

export const REVIEW_NEXT_RUNTIME_STATES = Object.freeze([
  'continue_observation',
  'continue_selected_path',
  'return_to_reading',
  'choose_another_path',
  'start_new_entry',
  'professional_review',
  'remain_open'
]);

export const REVIEW_GUARDRAILS = Object.freeze({
  rereadingAllowed: false,
  historicalEvidenceReinterpretationAllowed: false,
  readingOverwriteAllowed: false,
  navigationOverwriteAllowed: false,
  automaticOutcomeAllowed: false,
  customerReportAsFactAllowed: false,
  unknownRealityPreserved: true,
  unexpectedRealityPreserved: true,
  userChoiceRequired: true,
  professionalConsentPreserved: true
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

function copyPath(path = {}) {
  return {
    id: cleanText(path.id),
    pathType: cleanText(path.pathType),
    label: cleanText(path.label || path.title),
    direction: cleanText(path.direction),
    boundary: cleanText(path.boundary),
    firstStep: cleanText(path.firstStep || path.nextStep),
    observationWindow: cleanText(path.observationWindow),
    completionSignals: uniqueText(path.completionSignals, 8),
    stopConditions: uniqueText(path.stopConditions, 8),
    reviewConditions: uniqueText(path.reviewConditions, 8),
    evidenceWatch: uniqueText(path.evidenceWatch || path.evidenceBasis, 12),
    unknownReality: uniqueText(path.unknownReality, 12),
    professionalDomain: cleanText(path.professionalDomain),
    requiresProfessionalReview:
      path.requiresProfessionalReview === true ||
      cleanText(path.pathType) === 'professional_review'
  };
}

function professionalSnapshot(source = {}, selectedPath = {}) {
  const consent = isObject(source?.navigationState?.professionalConsent)
    ? source.navigationState.professionalConsent
    : {};
  const boundary = isObject(selectedPath.professionalBoundary)
    ? selectedPath.professionalBoundary
    : {};
  const required =
    cleanText(selectedPath.pathType) === 'professional_review' ||
    selectedPath.requiresProfessionalReview === true;

  return {
    required,
    domainId: cleanText(boundary.domainId || selectedPath.professionalDomain),
    domainName: cleanText(boundary.domainName),
    consentRequired: required,
    consentAccepted: required ? consent.accepted === true : false,
    consentAcceptedAt: required ? cleanText(consent.acceptedAt) : '',
    sensitiveDataCollection: false,
    uploadEnabled: false,
    conclusionsProvided: false,
    unknownReality: uniqueText(boundary.unknownReality, 12),
    excludedServices: uniqueText(boundary.excludedServices, 12)
  };
}

export function createReviewContract(source = {}) {
  const input = isObject(source) ? source : {};
  const navigation = isObject(input.navigation) ? input.navigation : {};
  const selectedPath = isObject(navigation.selectedPath)
    ? navigation.selectedPath
    : {};
  const path = copyPath(selectedPath);
  const professionalBoundary = professionalSnapshot(input, selectedPath);

  return {
    schemaVersion: REVIEW_CONTRACT_VERSION,
    createdAt: new Date().toISOString(),
    reviewId: cleanText(input.reviewId),
    runtimeEntityId: cleanText(input.runtimeEntityId),
    runtimeEntryId: cleanText(input.runtimeEntryId),
    status: 'awaiting_customer_report',

    sourceNavigation: {
      schemaVersion: cleanText(navigation.schemaVersion || input.schemaVersion),
      navigationInputCreatedAt: cleanText(input.navigationInput?.createdAt),
      navigationStateVersion: cleanText(input.navigationState?.schemaVersion),
      navigationPreparedAt: cleanText(input.navigationState?.reviewGate?.preparedAt),
      selectedPathId: path.id,
      selectedAt: cleanText(selectedPath.selectedAt),
      selectionSource: cleanText(selectedPath.selectionSource) || 'user_choice'
    },

    selectedPath: path,
    professionalBoundary,

    reviewScope: {
      observationWindow: path.observationWindow,
      evidenceWatch: [...path.evidenceWatch],
      completionSignals: [...path.completionSignals],
      stopConditions: [...path.stopConditions],
      reviewConditions: [...path.reviewConditions],
      inheritedUnknownReality: uniqueText([
        ...path.unknownReality,
        ...list(input.unknownReality),
        ...list(navigation.unknownReality)
      ], 16)
    },

    customerReport: {
      pathStatus: 'not_started',
      startedAt: '',
      reviewedAt: '',
      observedChanges: [],
      noObservedChange: [],
      unexpectedReality: [],
      difficulties: [],
      customerNotes: '',
      evidenceClass: 'reported_experience'
    },

    runtimeDrift: {
      status: 'not_assessed',
      observations: [],
      interpretation: null,
      automaticDetection: false
    },

    reviewOutcome: {
      status: 'not_assessed',
      nextRuntimeState: null,
      reasons: [],
      userChoiceRequired: true,
      automaticSelection: false
    },

    memoryHandoff: {
      ready: false,
      blockers: ['customer_report_required', 'review_outcome_required'],
      contractVersion: 'phi-os.review-memory-handoff.v1'
    },

    source: 'review_contract_builder',
    guardrails: REVIEW_GUARDRAILS
  };
}

export function validateReviewContract(value) {
  const errors = [];
  if (!isObject(value)) return { valid: false, errors: ['Review Contract must be an object.'] };
  if (value.schemaVersion !== REVIEW_CONTRACT_VERSION) errors.push('schemaVersion is invalid.');
  if (!cleanText(value.runtimeEntityId)) errors.push('runtimeEntityId is required.');
  if (!cleanText(value.runtimeEntryId)) errors.push('runtimeEntryId is required.');
  if (!cleanText(value.sourceNavigation?.selectedPathId)) errors.push('A user-selected Navigation path is required.');
  if (cleanText(value.sourceNavigation?.selectionSource) !== 'user_choice') errors.push('Navigation path must come from explicit user choice.');
  if (!cleanText(value.selectedPath?.id)) errors.push('selectedPath snapshot is required.');
  if (cleanText(value.selectedPath?.id) !== cleanText(value.sourceNavigation?.selectedPathId)) errors.push('selectedPath identity does not match Navigation source.');
  if (!Array.isArray(value.reviewScope?.inheritedUnknownReality)) errors.push('Inherited Unknown Reality must remain an array.');
  if (!isObject(value.customerReport)) errors.push('customerReport is required.');
  if (value.customerReport?.evidenceClass !== 'reported_experience') errors.push('Customer Review reports must remain reported experience.');
  if (value.reviewOutcome?.nextRuntimeState !== null) errors.push('Review outcome cannot be selected when the contract is created.');
  if (value.runtimeDrift?.interpretation !== null) errors.push('Runtime Drift cannot be interpreted when the contract is created.');
  if (value.memoryHandoff?.ready !== false) errors.push('Runtime Memory handoff cannot be ready before Review is completed.');
  if (value.guardrails?.rereadingAllowed !== false) errors.push('Review must not re-run Reading.');
  if (value.guardrails?.readingOverwriteAllowed !== false) errors.push('Review must not overwrite Reading.');
  if (value.guardrails?.navigationOverwriteAllowed !== false) errors.push('Review must not overwrite Navigation.');
  if (value.professionalBoundary?.required === true && value.professionalBoundary?.consentAccepted !== true) {
    errors.push('Professional boundary consent is required before Review.');
  }
  return { valid: errors.length === 0, errors };
}

export default createReviewContract;
