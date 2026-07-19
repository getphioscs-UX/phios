/** Build Runtime Memory only from a completed, explicitly resolved Review. */

import {
  createRuntimeMemoryContract,
  validateRuntimeMemoryContract
} from './runtime-memory-contract.js';
import {
  REVIEW_NEXT_RUNTIME_STATES
} from '../review/review-contract.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

export function evaluateReviewMemoryReadiness(review = {}) {
  const blockers = [];
  if (!isObject(review)) return { ready: false, blockers: ['review_required'] };
  if (!cleanText(review.runtimeEntityId)) blockers.push('runtime_entity_required');
  if (!cleanText(review.runtimeEntryId)) blockers.push('runtime_entry_required');
  if (!cleanText(review.selectedPath?.id)) blockers.push('selected_path_required');
  if (!cleanText(review.customerReport?.reviewedAt)) blockers.push('customer_report_required');
  if (cleanText(review.customerReport?.pathStatus) === 'not_started') blockers.push('path_status_required');
  if (cleanText(review.reviewOutcome?.status) !== 'assessed') blockers.push('review_outcome_required');
  if (!REVIEW_NEXT_RUNTIME_STATES.includes(review.reviewOutcome?.nextRuntimeState)) {
    blockers.push('next_runtime_state_required');
  }
  if (review.reviewOutcome?.automaticSelection !== false) blockers.push('automatic_outcome_prohibited');
  if (review.reviewOutcome?.userSelected !== true) blockers.push('user_outcome_choice_required');
  if (review.professionalBoundary?.required === true && review.professionalBoundary?.consentAccepted !== true) {
    blockers.push('professional_consent_required');
  }

  return {
    ready: blockers.length === 0,
    blockers,
    contractVersion: 'phi-os.review-memory-handoff.v1'
  };
}

export function buildRuntimeMemoryFromReview(review = {}, options = {}) {
  const readiness = evaluateReviewMemoryReadiness(review);
  if (!readiness.ready) {
    throw new Error(`Review → Runtime Memory handoff invalid: ${readiness.blockers.join(', ')}`);
  }

  const source = {
    ...review,
    memoryHandoff: readiness
  };
  const memory = createRuntimeMemoryContract(source, options);
  const validation = validateRuntimeMemoryContract(memory);
  if (!validation.valid) {
    throw new Error(`Runtime Memory Contract invalid: ${validation.errors.join(' ')}`);
  }
  return memory;
}

export default buildRuntimeMemoryFromReview;
