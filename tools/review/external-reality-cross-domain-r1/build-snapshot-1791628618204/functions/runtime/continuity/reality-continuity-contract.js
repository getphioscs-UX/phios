/**
 * PHI OS Reality Continuity Contract — Step 2.5.4C.
 *
 * Continuity translates an explicitly confirmed Review outcome into a bounded
 * next-Runtime route. It prepares a transition but never creates a new Runtime,
 * rewrites history, re-runs Reading, or selects a route automatically.
 */

import { SCHEMA_IDS } from '../shared/schema-registry.js';
import { REVIEW_NEXT_RUNTIME_STATES } from '../review/review-contract.js';

export const CONTINUITY_CONTRACT_VERSION = SCHEMA_IDS.CONTINUITY;

export const CONTINUITY_ROUTE_TYPES = Object.freeze({
  continue_observation: 'continue_current_runtime',
  continue_selected_path: 'continue_current_runtime',
  return_to_reading: 'return_to_reading',
  choose_another_path: 'return_to_navigation',
  start_new_entry: 'start_new_runtime',
  professional_review: 'professional_boundary',
  remain_open: 'remain_open'
});

export const CONTINUITY_GUARDRAILS = Object.freeze({
  automaticSelectionAllowed: false,
  automaticNextRuntimeCreationAllowed: false,
  historicalContractOverwriteAllowed: false,
  readingOverwriteAllowed: false,
  navigationOverwriteAllowed: false,
  memoryOverwriteAllowed: false,
  unknownRealityAsFactAllowed: false,
  customerReportAsFactAllowed: false,
  professionalConclusionInferenceAllowed: false,
  userConfirmationRequired: true,
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

function createContinuityId(memory = {}) {
  const source = cleanText(memory.memoryId || memory.runtimeEntryId);
  return `continuity-${source}`.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-');
}

function transitionRequirements(state, memory) {
  const requirements = [];
  if (state === 'continue_observation') requirements.push('preserve_observation_scope');
  if (state === 'continue_selected_path') requirements.push('preserve_selected_path');
  if (state === 'return_to_reading') requirements.push('create_new_reading_revision');
  if (state === 'choose_another_path') requirements.push('clear_path_selection', 'preserve_navigation_history');
  if (state === 'start_new_entry') requirements.push('explicit_new_entry_creation');
  if (state === 'professional_review') requirements.push('accepted_professional_boundary');
  if (state === 'remain_open') requirements.push('no_runtime_transition');
  if (memory?.professionalBoundary?.required === true) requirements.push('preserve_professional_boundary');
  return [...new Set(requirements)];
}

export function createRealityContinuityContract(memory = {}, selection = {}, options = {}) {
  const source = isObject(memory) ? memory : {};
  const chosen = cleanText(selection.nextRuntimeState);
  const routeType = CONTINUITY_ROUTE_TYPES[chosen] || '';
  const requiresNewRuntime = chosen === 'start_new_entry';
  const requiresProfessionalBoundary = chosen === 'professional_review';

  return {
    schemaVersion: CONTINUITY_CONTRACT_VERSION,
    continuityId: cleanText(options.continuityId) || createContinuityId(source),
    createdAt: new Date().toISOString(),
    runtimeEntityId: cleanText(source.runtimeEntityId),
    sourceRuntimeId: cleanText(source.lineage?.currentRuntimeId || source.runtimeEntryId),
    sourceRuntimeEntryId: cleanText(source.runtimeEntryId),
    sourceMemoryId: cleanText(source.memoryId),

    sourceMemory: {
      schemaVersion: cleanText(source.schemaVersion),
      reviewId: cleanText(source.reviewId),
      selectedPathId: cleanText(source.selectedPath?.id),
      reviewOutcome: cleanText(source.outcomeMemory?.nextRuntimeState),
      unresolvedReality: uniqueText([
        ...list(source.unresolvedMemory?.inheritedUnknownReality),
        ...list(source.unresolvedMemory?.unexpectedRealityPendingReview)
      ], 24)
    },

    userChoice: {
      nextRuntimeState: chosen || null,
      confirmed: selection.confirmed === true,
      confirmedAt: selection.confirmed === true
        ? cleanText(selection.confirmedAt) || new Date().toISOString()
        : '',
      selectionSource: selection.confirmed === true ? 'user_confirmation' : '',
      automaticSelection: false
    },

    transition: {
      status: selection.confirmed === true ? 'prepared' : 'awaiting_confirmation',
      routeType: routeType || null,
      requirements: transitionRequirements(chosen, source),
      requiresNewRuntime,
      requiresProfessionalBoundary,
      createsNextRuntime: false,
      nextRuntimeId: null,
      preservesSourceRuntime: true,
      appendOnly: true
    },

    destination: {
      stage:
        chosen === 'return_to_reading' ? 'reading' :
        chosen === 'choose_another_path' ? 'navigation' :
        chosen === 'start_new_entry' ? 'entry' :
        chosen === 'professional_review' ? 'professional_boundary' :
        chosen === 'remain_open' ? 'open' :
        chosen ? 'review_continuation' : null,
      sourceContractMode: chosen === 'return_to_reading' ? 'new_revision' : 'reference_only',
      historicalOverwrite: false
    },

    professionalBoundary: {
      required: requiresProfessionalBoundary || source.professionalBoundary?.required === true,
      domainId: cleanText(source.professionalBoundary?.domainId),
      consentAccepted: source.professionalBoundary?.consentAccepted === true,
      sensitiveDataCollection: false,
      conclusionsProvided: false
    },

    source: 'reality_continuity_builder',
    guardrails: CONTINUITY_GUARDRAILS
  };
}

export function validateRealityContinuityContract(value) {
  const errors = [];
  if (!isObject(value)) return { valid: false, errors: ['Continuity Contract must be an object.'] };
  if (value.schemaVersion !== CONTINUITY_CONTRACT_VERSION) errors.push('schemaVersion is invalid.');
  if (!cleanText(value.continuityId)) errors.push('continuityId is required.');
  if (!cleanText(value.runtimeEntityId)) errors.push('runtimeEntityId is required.');
  if (!cleanText(value.sourceRuntimeId)) errors.push('sourceRuntimeId is required.');
  if (!cleanText(value.sourceMemoryId)) errors.push('sourceMemoryId is required.');
  if (!REVIEW_NEXT_RUNTIME_STATES.includes(value.userChoice?.nextRuntimeState)) errors.push('A valid next Runtime state is required.');
  if (value.userChoice?.confirmed !== true) errors.push('Explicit user confirmation is required.');
  if (cleanText(value.userChoice?.selectionSource) !== 'user_confirmation') errors.push('Continuity must come from user confirmation.');
  if (value.userChoice?.automaticSelection !== false) errors.push('Continuity cannot be selected automatically.');
  if (value.sourceMemory?.reviewOutcome !== value.userChoice?.nextRuntimeState) errors.push('Continuity choice must match the completed Review outcome.');
  if (value.transition?.status !== 'prepared') errors.push('Continuity transition must be prepared.');
  if (value.transition?.createsNextRuntime !== false) errors.push('Continuity cannot create the next Runtime automatically.');
  if (value.transition?.nextRuntimeId !== null) errors.push('nextRuntimeId must remain null until a new Runtime is explicitly created.');
  if (value.transition?.preservesSourceRuntime !== true) errors.push('The source Runtime must be preserved.');
  if (value.destination?.historicalOverwrite !== false) errors.push('Historical contracts cannot be overwritten.');
  if (value.professionalBoundary?.required === true && value.professionalBoundary?.consentAccepted !== true) {
    errors.push('Accepted professional boundary consent is required.');
  }
  if (value.guardrails?.appendOnly !== true) errors.push('Continuity must be append-only.');
  if (value.guardrails?.automaticNextRuntimeCreationAllowed !== false) errors.push('Automatic next Runtime creation is prohibited.');
  if (value.guardrails?.historicalContractOverwriteAllowed !== false) errors.push('Historical overwrite is prohibited.');
  return { valid: errors.length === 0, errors };
}

export default createRealityContinuityContract;
