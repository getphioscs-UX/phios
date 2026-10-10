import assert from 'node:assert/strict';
import {
  createReviewContract,
  validateReviewContract,
  REVIEW_GUARDRAILS
} from '../functions/runtime/review/review-contract.js';
import {
  buildReviewContractFromNavigation,
  validateNavigationForReview
} from '../functions/runtime/review/navigation-review-builder.js';

function navigationSource({ professional = false, consent = false, prepared = true } = {}) {
  const path = {
    id: professional ? 'professional_review' : 'observe',
    pathType: professional ? 'professional_review' : 'observe',
    label: professional ? 'Financial Professional Review' : 'Observe',
    direction: 'Observe what changes without forcing an outcome.',
    boundary: 'This path does not decide the outcome.',
    firstStep: 'Record one observable change.',
    observationWindow: '7 days',
    evidenceWatch: ['Spending decisions become easier or remain difficult'],
    completionSignals: ['A stable change can be described'],
    stopConditions: ['Distress increases'],
    reviewConditions: ['Review after seven days'],
    unknownReality: ['Actual household cash flow remains unverified'],
    selectedAt: '2026-07-19T00:00:00.000Z',
    selectionSource: 'user_choice',
    professionalDomain: professional ? 'financial' : '',
    requiresProfessionalReview: professional,
    professionalBoundary: professional ? {
      domainId: 'financial',
      domainName: 'Financial',
      unknownReality: ['Actual liabilities remain unverified'],
      excludedServices: ['Investment recommendations']
    } : undefined
  };
  return {
    runtimeEntityId: 'entity-1',
    runtimeEntryId: 'entry-1',
    navigationInput: { createdAt: '2026-07-18T00:00:00.000Z' },
    navigation: {
      schemaVersion: 'phi-os.navigation.v1',
      availablePaths: [{ ...path, status: 'selected' }],
      selectedPath: path,
      unknownReality: ['Tax position remains unknown']
    },
    navigationState: {
      schemaVersion: 'phi-os.navigation-state.v1',
      reviewGate: {
        ready: prepared,
        blockers: prepared ? [] : ['review_preparation_required'],
        preparedAt: prepared ? '2026-07-19T00:10:00.000Z' : ''
      },
      professionalConsent: {
        required: professional,
        accepted: consent,
        acceptedAt: consent ? '2026-07-19T00:05:00.000Z' : ''
      }
    }
  };
}

const ordinary = buildReviewContractFromNavigation(navigationSource());
assert.equal(validateReviewContract(ordinary).valid, true);
assert.equal(ordinary.status, 'awaiting_customer_report');
assert.equal(ordinary.customerReport.evidenceClass, 'reported_experience');
assert.deepEqual(ordinary.customerReport.observedChanges, []);
assert.equal(ordinary.runtimeDrift.interpretation, null);
assert.equal(ordinary.reviewOutcome.nextRuntimeState, null);
assert.equal(ordinary.memoryHandoff.ready, false);
assert(ordinary.reviewScope.inheritedUnknownReality.includes('Tax position remains unknown'));
assert.equal(REVIEW_GUARDRAILS.rereadingAllowed, false);
assert.equal(REVIEW_GUARDRAILS.readingOverwriteAllowed, false);
assert.equal(REVIEW_GUARDRAILS.navigationOverwriteAllowed, false);

const professional = buildReviewContractFromNavigation(
  navigationSource({ professional: true, consent: true })
);
assert.equal(professional.professionalBoundary.required, true);
assert.equal(professional.professionalBoundary.consentAccepted, true);
assert.equal(professional.professionalBoundary.sensitiveDataCollection, false);
assert.equal(professional.professionalBoundary.conclusionsProvided, false);

const missingConsent = validateNavigationForReview(
  navigationSource({ professional: true, consent: false })
);
assert.equal(missingConsent.valid, false);
assert(missingConsent.errors.some(error => error.includes('consent')));

const notPrepared = validateNavigationForReview(navigationSource({ prepared: false }));
assert.equal(notPrepared.valid, false);

const premature = createReviewContract(navigationSource());
premature.reviewOutcome.nextRuntimeState = 'continue_observation';
assert.equal(validateReviewContract(premature).valid, false);

console.log('✓ Review Contract and Navigation → Review boundary checks passed.');
