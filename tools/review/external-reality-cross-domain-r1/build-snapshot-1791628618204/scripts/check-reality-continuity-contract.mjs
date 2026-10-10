import assert from 'node:assert/strict';
import {
  CONTINUITY_GUARDRAILS,
  validateRealityContinuityContract
} from '../functions/runtime/continuity/reality-continuity-contract.js';
import {
  buildRealityContinuityFromMemory,
  evaluateMemoryContinuityReadiness
} from '../functions/runtime/continuity/memory-continuity-builder.js';

function memory(nextRuntimeState = 'continue_observation', professional = false) {
  return {
    schemaVersion: 'phi-os.runtime-memory.v1',
    memoryId: 'memory-entry-1-review-1',
    runtimeEntityId: 'entity-1',
    runtimeEntryId: 'entry-1',
    reviewId: 'review-1',
    lineage: {
      previousRuntimeId: null,
      currentRuntimeId: 'entry-1',
      nextRuntimeId: null,
      sequence: 1,
      continuityPrepared: false
    },
    selectedPath: {
      id: professional ? 'professional_review' : 'observe'
    },
    unresolvedMemory: {
      inheritedUnknownReality: [{ statement: 'Actual cash flow remains unknown' }],
      unexpectedRealityPendingReview: []
    },
    outcomeMemory: {
      status: 'assessed',
      nextRuntimeState,
      selectedByUser: true,
      automaticSelection: false
    },
    professionalBoundary: {
      required: professional,
      domainId: professional ? 'financial' : '',
      consentAccepted: professional
    },
    guardrails: { appendOnly: true }
  };
}

const selection = {
  nextRuntimeState: 'continue_observation',
  confirmed: true,
  confirmedAt: '2026-07-28T00:00:00.000Z'
};
const readiness = evaluateMemoryContinuityReadiness(memory(), selection);
assert.equal(readiness.ready, true);
assert.deepEqual(readiness.blockers, []);

const continuity = buildRealityContinuityFromMemory(memory(), selection);
assert.equal(validateRealityContinuityContract(continuity).valid, true);
assert.equal(continuity.schemaVersion, 'phi-os.continuity.v1');
assert.equal(continuity.userChoice.selectionSource, 'user_confirmation');
assert.equal(continuity.transition.routeType, 'continue_current_runtime');
assert.equal(continuity.transition.createsNextRuntime, false);
assert.equal(continuity.transition.nextRuntimeId, null);
assert.equal(continuity.transition.preservesSourceRuntime, true);
assert.equal(continuity.destination.historicalOverwrite, false);
assert.equal(CONTINUITY_GUARDRAILS.appendOnly, true);
assert.equal(CONTINUITY_GUARDRAILS.automaticNextRuntimeCreationAllowed, false);

const newEntry = buildRealityContinuityFromMemory(
  memory('start_new_entry'),
  { nextRuntimeState: 'start_new_entry', confirmed: true }
);
assert.equal(newEntry.transition.routeType, 'start_new_runtime');
assert.equal(newEntry.transition.requiresNewRuntime, true);
assert.equal(newEntry.transition.createsNextRuntime, false);
assert.equal(newEntry.destination.stage, 'entry');

const reading = buildRealityContinuityFromMemory(
  memory('return_to_reading'),
  { nextRuntimeState: 'return_to_reading', confirmed: true }
);
assert.equal(reading.destination.stage, 'reading');
assert.equal(reading.destination.sourceContractMode, 'new_revision');

const professional = buildRealityContinuityFromMemory(
  memory('professional_review', true),
  { nextRuntimeState: 'professional_review', confirmed: true }
);
assert.equal(professional.professionalBoundary.required, true);
assert.equal(professional.professionalBoundary.consentAccepted, true);
assert.equal(professional.professionalBoundary.sensitiveDataCollection, false);

const mismatch = evaluateMemoryContinuityReadiness(
  memory('continue_observation'),
  { nextRuntimeState: 'start_new_entry', confirmed: true }
);
assert.equal(mismatch.ready, false);
assert.ok(mismatch.blockers.includes('continuity_choice_mismatch'));

assert.throws(
  () => buildRealityContinuityFromMemory(memory(), { nextRuntimeState: 'continue_observation', confirmed: false }),
  /continuity_confirmation_required/
);

const badProfessional = memory('professional_review', true);
badProfessional.professionalBoundary.consentAccepted = false;
assert.equal(
  evaluateMemoryContinuityReadiness(
    badProfessional,
    { nextRuntimeState: 'professional_review', confirmed: true }
  ).ready,
  false
);

console.log('✓ Reality Continuity Contract and Memory → Continuity boundary checks passed.');
