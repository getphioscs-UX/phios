/** Build Reality Continuity only from a valid Runtime Memory and user confirmation. */

import { REVIEW_NEXT_RUNTIME_STATES } from '../review/review-contract.js';
import {
  createRealityContinuityContract,
  validateRealityContinuityContract
} from './reality-continuity-contract.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

export function evaluateMemoryContinuityReadiness(memory = {}, selection = {}) {
  const blockers = [];
  if (!isObject(memory)) return { ready: false, blockers: ['runtime_memory_required'] };
  if (!cleanText(memory.memoryId)) blockers.push('memory_id_required');
  if (!cleanText(memory.runtimeEntityId)) blockers.push('runtime_entity_required');
  if (!cleanText(memory.lineage?.currentRuntimeId || memory.runtimeEntryId)) blockers.push('current_runtime_required');
  if (memory.guardrails?.appendOnly !== true) blockers.push('append_only_memory_required');
  if (memory.lineage?.nextRuntimeId !== null) blockers.push('next_runtime_already_assigned');

  const outcome = cleanText(memory.outcomeMemory?.nextRuntimeState);
  if (!REVIEW_NEXT_RUNTIME_STATES.includes(outcome)) blockers.push('review_outcome_required');
  if (memory.outcomeMemory?.selectedByUser !== true) blockers.push('user_review_outcome_required');
  if (memory.outcomeMemory?.automaticSelection !== false) blockers.push('automatic_review_outcome_prohibited');

  const selected = cleanText(selection.nextRuntimeState);
  if (!REVIEW_NEXT_RUNTIME_STATES.includes(selected)) blockers.push('continuity_choice_required');
  if (selected && outcome && selected !== outcome) blockers.push('continuity_choice_mismatch');
  if (selection.confirmed !== true) blockers.push('continuity_confirmation_required');

  const professionalRequired = selected === 'professional_review' || memory.professionalBoundary?.required === true;
  if (professionalRequired && memory.professionalBoundary?.consentAccepted !== true) {
    blockers.push('professional_consent_required');
  }

  return {
    ready: blockers.length === 0,
    blockers,
    selectedNextRuntimeState: selected || null,
    userChoiceRequired: true,
    automaticSelection: false,
    contractVersion: 'phi-os.memory-continuity-handoff.v1'
  };
}

export function buildRealityContinuityFromMemory(memory = {}, selection = {}, options = {}) {
  const readiness = evaluateMemoryContinuityReadiness(memory, selection);
  if (!readiness.ready) {
    throw new Error(`Runtime Memory → Continuity handoff invalid: ${readiness.blockers.join(', ')}`);
  }
  const continuity = createRealityContinuityContract(memory, selection, options);
  const validation = validateRealityContinuityContract(continuity);
  if (!validation.valid) {
    throw new Error(`Reality Continuity Contract invalid: ${validation.errors.join(' ')}`);
  }
  return continuity;
}

export default buildRealityContinuityFromMemory;
