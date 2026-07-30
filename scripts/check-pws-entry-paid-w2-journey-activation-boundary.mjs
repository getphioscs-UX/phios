import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const contract = await readJson(
  'docs/pws/architecture/pws-entry-paid-journey-activation-boundary-v1.json'
);
const w0 = await readJson(
  'docs/pws/architecture/pws-entry-payment-boundary-v1.json'
);
const publicW1 = await readJson(
  'docs/pws/architecture/pws-entry-public-navigation-boundary-v1.json'
);
const operations = await readJson(
  'docs/pws/contracts/pws-canonical-operations-v1.json'
);
const states = await readJson(
  'docs/pws/contracts/pws-canonical-states-v1.json'
);

assert.equal(
  contract.contractId,
  'phi-os.pws-entry.paid-journey-activation-boundary.v1'
);
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.displayStep, 'PWS-ENTRY-W2');
assert.equal(contract.sequenceKey, 'PWS-ENTRY-ACTIVATION-W2');
assert.equal(contract.status, 'paid-journey-activation-boundary-frozen');
assert.equal(
  contract.baseline.commit,
  '877cc11b44396c7f13716b7b48bdeb0bb4f2dcbc'
);

assert.deepEqual(contract.requiredGates.map(item => item.gate), [
  'identity',
  'order',
  'payment-confirmation',
  'active-entitlement',
  'purpose-consent',
  'data-consent',
  'governance-not-blocking',
  'journey-identity',
  'provider-budget'
]);
assert.equal(new Set(contract.requiredGates.map(item => item.gate)).size, 9);
assert(contract.requiredGates.every(item => item.writeSource));

for (const [rule, expected] of Object.entries({
  evaluation: 'all-gates-required',
  defaultDecision: 'blocked',
  partialActivationAllowed: false,
  clientClaimMaySatisfyGate: false,
  paymentRedirectMaySatisfyGate: false,
  missingOrUnknownGateRemainsVisible: true,
  failedGateMustNameBlockingReason: true,
  activationOperation: 'journey.activate',
  activationEvent: 'journey.activated'
})) {
  assert.equal(contract.activationPolicy[rule], expected, rule);
}

for (const rule of [
  'paymentAloneCreatesFormalJourney',
  'paymentAloneActivatesJourney',
  'paymentAloneCreatesProfessionalAssignment',
  'paymentAloneCreatesProfessionalResponsibility',
  'paymentAloneCreatesConfirmedReading',
  'paymentAloneCreatesSignedDeliverable'
]) {
  assert.equal(contract.paymentBoundary[rule], false, rule);
}
assert.equal(
  contract.paymentBoundary.verifiedPaymentIsNecessaryButNotSufficient,
  true
);

for (const [rule, expected] of Object.entries({
  professionalAssignmentRequiresSeparateOperation: true,
  professionalAssignmentOperation: 'assignment.create',
  professionalResponsibilityRequiresAcceptedEligibleAssignment: true,
  confirmedReadingRequiresEvidenceAndReadingGates: true,
  signedDeliverableRequiresFrozenContentAndAuthorisedSignature: true,
  journeyActivationMayInvokeProfessionalHandoff: false,
  journeyActivationMaySignDeliverable: false
})) {
  assert.equal(contract.responsibilitySeparation[rule], expected, rule);
}

for (const [rule, expected] of Object.entries({
  journeyStateWhenBlocked: 'draft',
  formalEvidenceCollectionMayStartWhenBlocked: false,
  paidIndividualProviderMayRunWhenBlocked: false,
  individualReadingMayBeConfirmedWhenBlocked: false,
  professionalQueueMayBeCreatedWhenBlocked: false,
  retryAfterCorrectableGateChangeAllowed: true,
  priorGateEvidenceMustRemainAuditable: true
})) {
  assert.equal(contract.failureBehaviour[rule], expected, rule);
}

assert.equal(w0.status, 'pws-entry-w0-frozen');
assert.equal(w0.transitionRules.paymentRedirectCreatesEntitlement, false);
assert.equal(w0.transitionRules.activeEntitlementRequiredForFormalJourney, true);
assert.equal(
  publicW1.freeObservationBoundary.savedStateMayBecomeFormalRuntimeSilently,
  false
);

const operationByCode = new Map(
  operations.operations.map(operation => [operation.operationCode, operation])
);
assert.equal(
  operationByCode.get('journey.activate')?.eventCode,
  'journey.activated'
);
assert(
  operationByCode
    .get('journey.activate')
    ?.preconditions.includes('activation_boundary_satisfied')
);
assert.equal(
  operationByCode.get('assignment.create')?.eventCode,
  'assignment.created'
);
assert.equal(operations.rules.paymentMayCreateJourney, false);

assert.equal(states.semanticBoundaries.paymentStateIsNotEntitlement, true);
assert.equal(states.semanticBoundaries.entitlementStateIsNotConsent, true);
assert.equal(states.semanticBoundaries.deliverableStateIsNotSignature, true);
assert.equal(states.semanticBoundaries.journeyStateIsNotJourneyStage, true);

assert.equal(contract.namingCompatibility.replacementAllowed, false);
assert.equal(contract.namingCompatibility.uniqueSequenceKeyRequired, true);
assert.equal(contract.acceptance.requiredGateCount, 9);
assert.equal(contract.acceptance.paymentOnlyOutcomeCount, 4);
assert.equal(contract.acceptance.allGatesRequired, true);
assert.equal(contract.acceptance.unknownsRemainVisible, true);
assert.equal(contract.acceptance.pageChangeInThisStep, false);
assert.equal(contract.acceptance.visualAcceptance.status, 'not-applicable');
assert.equal(contract.acceptance.languageAcceptance.status, 'not-applicable');
assert.equal(
  contract.acceptance.keyboardFocusAcceptance.status,
  'not-applicable'
);
assert.equal(contract.acceptance.touchTargetAcceptance.status, 'not-applicable');

const document = await read(
  'docs/pws/architecture/PWS-ENTRY-W2-PAID-JOURNEY-ACTIVATION-BOUNDARY-FREEZE.md'
);
for (const phrase of [
  'all nine gates',
  'Payment alone does not activate or create a formal Journey',
  'Professional Assignment',
  'Confirmed Reading',
  'Signed Deliverable',
  'Neither contract replaces the other'
]) {
  assert(document.includes(phrase), `Paid W2 document missing: ${phrase}`);
}

const legacyW1 = await read(
  'scripts/check-pws-entry-w1-authorised-data-loader.mjs'
);
assert(
  legacyW1.includes(
    "import './check-pws-entry-paid-w2-journey-activation-boundary.mjs';"
  ),
  'Historical W1 must enforce Paid Journey activation before authorisation'
);

console.log('✓ PWS-ENTRY-ACTIVATION-W2 Paid Journey activation boundary frozen.');
console.log('  All nine gates are required; missing or unknown gates remain visible.');
console.log('  Payment alone creates no assignment, responsibility, confirmed reading or signed deliverable.');
