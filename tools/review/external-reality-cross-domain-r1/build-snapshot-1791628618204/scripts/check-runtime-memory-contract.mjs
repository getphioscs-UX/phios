import assert from 'node:assert/strict';
import {
  createRuntimeMemoryContract,
  validateRuntimeMemoryContract,
  RUNTIME_MEMORY_GUARDRAILS
} from '../functions/runtime/memory/runtime-memory-contract.js';
import {
  buildRuntimeMemoryFromReview,
  evaluateReviewMemoryReadiness
} from '../functions/runtime/memory/review-memory-builder.js';

function completedReview({ professional = false } = {}) {
  return {
    schemaVersion: 'phi-os.review.v1',
    reviewId: 'review-1',
    createdAt: '2026-07-19T00:00:00.000Z',
    runtimeEntityId: 'entity-1',
    runtimeEntryId: 'entry-1',
    status: 'completed',
    selectedPath: {
      id: professional ? 'professional_review' : 'observe',
      pathType: professional ? 'professional_review' : 'observe',
      label: professional ? 'Financial Professional Review' : 'Observe',
      direction: 'Observe what changes.',
      boundary: 'This path does not decide the outcome.',
      firstStep: 'Record one observable change.',
      observationWindow: '7 days',
      requiresProfessionalReview: professional
    },
    reviewScope: {
      inheritedUnknownReality: ['Actual household cash flow remains unverified']
    },
    customerReport: {
      pathStatus: 'completed',
      startedAt: '2026-07-20T00:00:00.000Z',
      reviewedAt: '2026-07-27T00:00:00.000Z',
      observedChanges: ['Spending decisions felt slightly easier'],
      noObservedChange: ['Income uncertainty remained'],
      unexpectedReality: ['Professional identity loss became more visible'],
      difficulties: ['Tracking every decision was tiring'],
      customerNotes: 'I want to continue observing.',
      evidenceClass: 'reported_experience'
    },
    observedEvidence: ['Three planned household purchases were completed'],
    runtimeDrift: {
      status: 'no_material_drift',
      observations: ['The path remained focused on spending decisions'],
      interpretation: 'No material drift was identified.',
      automaticDetection: false
    },
    reviewOutcome: {
      status: 'assessed',
      nextRuntimeState: 'continue_observation',
      reasons: ['More observation is needed'],
      userChoiceRequired: true,
      userSelected: true,
      automaticSelection: false
    },
    professionalBoundary: {
      required: professional,
      domainId: professional ? 'financial' : '',
      consentAccepted: professional,
      consentAcceptedAt: professional ? '2026-07-19T00:05:00.000Z' : '',
      excludedServices: professional ? ['Investment recommendations'] : []
    }
  };
}

const readiness = evaluateReviewMemoryReadiness(completedReview());
assert.equal(readiness.ready, true);
assert.deepEqual(readiness.blockers, []);

const memory = buildRuntimeMemoryFromReview(completedReview(), {
  previousRuntimeId: 'entry-0',
  sequence: 2
});
assert.equal(validateRuntimeMemoryContract(memory).valid, true);
assert.equal(memory.schemaVersion, 'phi-os.runtime-memory.v1');
assert.equal(memory.lineage.previousRuntimeId, 'entry-0');
assert.equal(memory.lineage.currentRuntimeId, 'entry-1');
assert.equal(memory.lineage.nextRuntimeId, null);
assert.equal(memory.reportedMemory.evidenceClass, 'reported_experience');
assert.equal(memory.reportedMemory.observedChanges[0].verified, false);
assert.equal(memory.evidenceMemory.observedEvidence[0].evidenceClass, 'observed_evidence');
assert.equal(memory.unresolvedMemory.inheritedUnknownReality[0].evidenceClass, 'unknown_reality');
assert.equal(memory.outcomeMemory.nextRuntimeState, 'continue_observation');
assert.equal(memory.outcomeMemory.automaticSelection, false);
assert.equal(memory.continuityHandoff.ready, false);
assert.equal(memory.continuityHandoff.selectedNextRuntimeState, null);
assert.equal(RUNTIME_MEMORY_GUARDRAILS.appendOnly, true);
assert.equal(RUNTIME_MEMORY_GUARDRAILS.customerReportAsFactAllowed, false);

const professional = buildRuntimeMemoryFromReview(completedReview({ professional: true }));
assert.equal(professional.professionalBoundary.required, true);
assert.equal(professional.professionalBoundary.consentAccepted, true);
assert.equal(professional.professionalBoundary.sensitiveDataCollection, false);
assert.equal(professional.professionalBoundary.conclusionsProvided, false);

const incomplete = completedReview();
incomplete.customerReport.reviewedAt = '';
assert.equal(evaluateReviewMemoryReadiness(incomplete).ready, false);
assert.throws(() => buildRuntimeMemoryFromReview(incomplete), /customer_report_required/);

const automatic = completedReview();
automatic.reviewOutcome.userSelected = false;
automatic.reviewOutcome.automaticSelection = true;
assert.equal(evaluateReviewMemoryReadiness(automatic).ready, false);

const promoted = createRuntimeMemoryContract(completedReview());
promoted.reportedMemory.observedChanges[0].verified = true;
assert.equal(validateRuntimeMemoryContract(promoted).valid, false);

console.log('✓ Runtime Memory Contract and Review → Memory boundary checks passed.');
