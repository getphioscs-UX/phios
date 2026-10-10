/**
 * PHI OS Runtime Memory Contract — Step 2.5.4B.
 *
 * Runtime Memory preserves the lineage of one completed Runtime without
 * promoting customer reports into verified facts, rewriting prior contracts,
 * or using unresolved material as established evidence.
 */

import { SCHEMA_IDS } from '../shared/schema-registry.js';
import { REVIEW_NEXT_RUNTIME_STATES } from '../review/review-contract.js';

export const RUNTIME_MEMORY_VERSION = SCHEMA_IDS.RUNTIME_MEMORY;

export const MEMORY_EVIDENCE_CLASSES = Object.freeze([
  'reported_experience',
  'observed_evidence',
  'verified_record',
  'professional_record',
  'system_interpretation',
  'unknown_reality'
]);

export const RUNTIME_MEMORY_GUARDRAILS = Object.freeze({
  customerReportAsFactAllowed: false,
  unknownRealityAsFactAllowed: false,
  historicalContractOverwriteAllowed: false,
  automaticContinuityAllowed: false,
  automaticNextRuntimeCreationAllowed: false,
  professionalConclusionInferenceAllowed: false,
  sensitiveDataCollectionAllowed: false,
  userChoiceRequiredForNextRuntime: true,
  appendOnly: true
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
    const text = cleanText(value?.statement || value?.summary || value?.text || value);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= maximum) break;
  }
  return output;
}

function memoryItems(values, evidenceClass, source = 'review_customer_report', maximum = 20) {
  return uniqueText(values, maximum).map(statement => ({
    statement,
    evidenceClass,
    source,
    verified: evidenceClass === 'verified_record' || evidenceClass === 'professional_record'
  }));
}

function copySelectedPath(path = {}) {
  return {
    id: cleanText(path.id),
    pathType: cleanText(path.pathType),
    label: cleanText(path.label || path.title),
    direction: cleanText(path.direction),
    boundary: cleanText(path.boundary),
    firstStep: cleanText(path.firstStep),
    observationWindow: cleanText(path.observationWindow),
    requiresProfessionalReview: path.requiresProfessionalReview === true
  };
}

function createMemoryId(review = {}) {
  const explicit = cleanText(review.memoryId);
  if (explicit) return explicit;
  const parts = [
    'memory',
    cleanText(review.runtimeEntryId),
    cleanText(review.reviewId || review.customerReport?.reviewedAt)
  ].filter(Boolean);
  return parts.join('-').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-');
}

export function createRuntimeMemoryContract(review = {}, options = {}) {
  const source = isObject(review) ? review : {};
  const customerReport = isObject(source.customerReport) ? source.customerReport : {};
  const drift = isObject(source.runtimeDrift) ? source.runtimeDrift : {};
  const outcome = isObject(source.reviewOutcome) ? source.reviewOutcome : {};
  const professional = isObject(source.professionalBoundary) ? source.professionalBoundary : {};

  return {
    schemaVersion: RUNTIME_MEMORY_VERSION,
    memoryId: cleanText(options.memoryId) || createMemoryId(source),
    createdAt: new Date().toISOString(),
    runtimeEntityId: cleanText(source.runtimeEntityId),
    runtimeEntryId: cleanText(source.runtimeEntryId),
    reviewId: cleanText(source.reviewId),

    lineage: {
      previousRuntimeId: cleanText(options.previousRuntimeId),
      currentRuntimeId: cleanText(options.currentRuntimeId || source.runtimeEntryId),
      nextRuntimeId: null,
      sequence: Number.isInteger(options.sequence) && options.sequence > 0
        ? options.sequence
        : null,
      continuityPrepared: false
    },

    sourceReview: {
      schemaVersion: cleanText(source.schemaVersion),
      createdAt: cleanText(source.createdAt),
      reviewedAt: cleanText(customerReport.reviewedAt),
      status: cleanText(source.status),
      selectedPathId: cleanText(source.selectedPath?.id),
      reviewOutcome: cleanText(outcome.nextRuntimeState)
    },

    selectedPath: copySelectedPath(source.selectedPath),

    reportedMemory: {
      evidenceClass: 'reported_experience',
      pathStatus: cleanText(customerReport.pathStatus),
      startedAt: cleanText(customerReport.startedAt),
      reviewedAt: cleanText(customerReport.reviewedAt),
      observedChanges: memoryItems(customerReport.observedChanges, 'reported_experience'),
      noObservedChange: memoryItems(customerReport.noObservedChange, 'reported_experience'),
      unexpectedReality: memoryItems(customerReport.unexpectedReality, 'reported_experience'),
      difficulties: memoryItems(customerReport.difficulties, 'reported_experience'),
      customerNotes: cleanText(customerReport.customerNotes)
    },

    evidenceMemory: {
      observedEvidence: memoryItems(source.observedEvidence, 'observed_evidence', 'review_evidence'),
      verifiedRecords: memoryItems(source.verifiedRecords, 'verified_record', 'verified_record'),
      professionalRecords: memoryItems(source.professionalRecords, 'professional_record', 'professional_record')
    },

    interpretationMemory: {
      runtimeDriftStatus: cleanText(drift.status),
      observations: memoryItems(drift.observations, 'system_interpretation', 'review_runtime_drift'),
      interpretation: cleanText(drift.interpretation),
      automaticDetection: drift.automaticDetection === true
    },

    unresolvedMemory: {
      evidenceClass: 'unknown_reality',
      inheritedUnknownReality: memoryItems(
        source.reviewScope?.inheritedUnknownReality,
        'unknown_reality',
        'review_inherited_unknown'
      ),
      unexpectedRealityPendingReview: memoryItems(
        customerReport.unexpectedReality,
        'unknown_reality',
        'review_customer_report'
      )
    },

    outcomeMemory: {
      status: cleanText(outcome.status),
      nextRuntimeState: cleanText(outcome.nextRuntimeState) || null,
      reasons: uniqueText(outcome.reasons, 12),
      selectedByUser: outcome.userSelected === true,
      automaticSelection: outcome.automaticSelection === true
    },

    professionalBoundary: {
      required: professional.required === true,
      domainId: cleanText(professional.domainId),
      consentAccepted: professional.consentAccepted === true,
      consentAcceptedAt: cleanText(professional.consentAcceptedAt),
      sensitiveDataCollection: false,
      conclusionsProvided: false,
      excludedServices: uniqueText(professional.excludedServices, 12)
    },

    continuityHandoff: {
      ready: false,
      blockers: ['continuity_choice_required'],
      allowedNextRuntimeStates: [...REVIEW_NEXT_RUNTIME_STATES],
      selectedNextRuntimeState: null,
      userChoiceRequired: true,
      automaticSelection: false,
      contractVersion: 'phi-os.memory-continuity-handoff.v1'
    },

    source: 'runtime_memory_builder',
    guardrails: RUNTIME_MEMORY_GUARDRAILS
  };
}

export function validateRuntimeMemoryContract(value) {
  const errors = [];
  if (!isObject(value)) return { valid: false, errors: ['Runtime Memory must be an object.'] };
  if (value.schemaVersion !== RUNTIME_MEMORY_VERSION) errors.push('schemaVersion is invalid.');
  if (!cleanText(value.memoryId)) errors.push('memoryId is required.');
  if (!cleanText(value.runtimeEntityId)) errors.push('runtimeEntityId is required.');
  if (!cleanText(value.runtimeEntryId)) errors.push('runtimeEntryId is required.');
  if (!cleanText(value.sourceReview?.reviewedAt)) errors.push('A completed Review timestamp is required.');
  if (!cleanText(value.selectedPath?.id)) errors.push('The selected Navigation path snapshot is required.');
  if (!REVIEW_NEXT_RUNTIME_STATES.includes(value.outcomeMemory?.nextRuntimeState)) {
    errors.push('A valid Review outcome is required.');
  }
  if (value.reportedMemory?.evidenceClass !== 'reported_experience') {
    errors.push('Customer reports must remain reported experience.');
  }
  for (const item of list(value.reportedMemory?.observedChanges)) {
    if (item?.evidenceClass !== 'reported_experience' || item?.verified !== false) {
      errors.push('Reported changes cannot be promoted to verified evidence.');
      break;
    }
  }
  for (const item of list(value.unresolvedMemory?.inheritedUnknownReality)) {
    if (item?.evidenceClass !== 'unknown_reality' || item?.verified !== false) {
      errors.push('Unknown Reality must remain unresolved.');
      break;
    }
  }
  if (value.lineage?.nextRuntimeId !== null) errors.push('Memory cannot create the next Runtime automatically.');
  if (value.continuityHandoff?.ready !== false) errors.push('Continuity cannot be ready before explicit user choice.');
  if (value.continuityHandoff?.selectedNextRuntimeState !== null) errors.push('Continuity state cannot be selected automatically.');
  if (value.outcomeMemory?.automaticSelection !== false) errors.push('Review outcome must not be automatically selected.');
  if (value.guardrails?.appendOnly !== true) errors.push('Runtime Memory must be append-only.');
  if (value.guardrails?.historicalContractOverwriteAllowed !== false) errors.push('Runtime Memory must not overwrite historical contracts.');
  if (value.guardrails?.customerReportAsFactAllowed !== false) errors.push('Customer report cannot be stored as verified fact.');
  if (value.professionalBoundary?.required === true && value.professionalBoundary?.consentAccepted !== true) {
    errors.push('Accepted professional boundary consent must be preserved.');
  }
  return { valid: errors.length === 0, errors };
}

export default createRuntimeMemoryContract;
