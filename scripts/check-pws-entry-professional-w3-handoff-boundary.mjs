import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const contract = await readJson(
  'docs/pws/architecture/pws-entry-professional-handoff-boundary-v1.json'
);
const activation = await readJson(
  'docs/pws/architecture/pws-entry-paid-journey-activation-boundary-v1.json'
);
const responsibility = await readJson(
  'content/registry/pws-w0-baseline-responsibility-boundary.json'
);
const operations = await readJson(
  'docs/pws/contracts/pws-canonical-operations-v1.json'
);
const events = await readJson(
  'docs/pws/contracts/pws-canonical-events-v1.json'
);
const states = await readJson(
  'docs/pws/contracts/pws-canonical-states-v1.json'
);

assert.equal(
  contract.contractId,
  'phi-os.pws-entry.professional-handoff-boundary.v1'
);
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.displayStep, 'PWS-ENTRY-W3');
assert.equal(contract.sequenceKey, 'PWS-ENTRY-HANDOFF-W3');
assert.equal(contract.status, 'professional-handoff-boundary-frozen');
assert.equal(
  contract.baseline.commit,
  'a6bfa5b3083596ce50b9e844608b917a2d9f5c9a'
);

assert.deepEqual(contract.requiredGates.map(item => item.gate), [
  'professional-service-selected',
  'independent-product-and-offer-resolved',
  'independent-payment-and-entitlement',
  'service-specific-consent',
  'eligibility-and-required-intake',
  'readiness-passed',
  'assignment-created',
  'professional-accepts-responsibility'
]);
assert.deepEqual(
  contract.requiredGates.map(item => item.ordinal),
  [1, 2, 3, 4, 5, 6, 7, 8]
);
assert(contract.requiredGates.every(item => item.writeSource));

for (const [rule, expected] of Object.entries({
  evaluation: 'strictly-ordered-all-gates-required',
  defaultDecision: 'not-ready',
  partialHandoffAllowed: false,
  automaticProfessionalSelectionAllowed: false,
  paymentMayCreateAssignment: false,
  entitlementMayCreateAssignment: false,
  journeyCompletionMayCreateAssignment: false,
  professionalResponsibilityStartsAt: 'assignment.accepted',
  professionalResponsibilityStartsBeforeAcceptance: false,
  missingOrUnknownGateRemainsVisible: true
})) {
  assert.equal(contract.handoffPolicy[rule], expected, rule);
}

for (const [rule, expected] of Object.entries({
  readinessOutcomeEvent: 'readiness.passed',
  assignmentCreationOperation: 'assignment.create',
  assignmentCreationEvent: 'assignment.created',
  assignmentAcceptanceOperation: 'assignment.accept',
  assignmentAcceptanceEvent: 'assignment.accepted',
  assignmentProposalCreatesResponsibility: false,
  assignmentAcceptanceRequiresAssignedProfessional: true,
  handoffMayEnterProfessionalQueueBeforeAcceptance: false
})) {
  assert.equal(contract.operationBoundary[rule], expected, rule);
}

const journeyEntitlement = contract.entitlementSeparation.journeyEntitlement;
assert.equal(journeyEntitlement.commercialLabel, 'RM5 Reality Journey');
assert.equal(journeyEntitlement.currency, 'MYR');
assert.equal(journeyEntitlement.price, 5);
assert.equal(journeyEntitlement.scope, 'formal-reality-journey');
assert.equal(journeyEntitlement.professionalServiceAccess, false);
assert.equal(journeyEntitlement.professionalAssignmentAccess, false);
assert.equal(journeyEntitlement.professionalQueueAccess, false);

const professionalEntitlement =
  contract.entitlementSeparation.professionalEntitlement;
for (const rule of [
  'separateProductRequired',
  'separateOfferRequired',
  'separateOrderRequired',
  'separatePaymentRequired',
  'separateEntitlementRequired',
  'serviceSpecificConsentRequired'
]) {
  assert.equal(professionalEntitlement[rule], true, rule);
}

for (const rule of [
  'journeyEntitlementMayBeReusedAsProfessionalEntitlement',
  'journeyEntitlementScopeMayBeMutatedToProfessional',
  'journeyEntitlementMayBeSilentlyUpgraded',
  'priceDifferenceMayAutoUpgradeEntitlement',
  'journeyCompletionMayGrantProfessionalAccess',
  'sharedEntitlementIdentifierAllowed'
]) {
  assert.equal(contract.entitlementSeparation[rule], false, rule);
}
assert.equal(
  contract.entitlementSeparation.explicitProfessionalPurchaseRequired,
  true
);

for (const [rule, expected] of Object.entries({
  journeyMayBeProfessionalInput: true,
  journeyDataMovesAutomatically: false,
  serviceSpecificConsentRequired: true,
  assignmentScopeRequired: true,
  minimumNecessaryDataOnly: true,
  sourceAndLineageRemainVisible: true,
  journeyReadingBecomesProfessionalConclusionAutomatically: false
})) {
  assert.equal(contract.journeyDataHandoff[rule], expected, rule);
}

for (const [rule, expected] of Object.entries({
  handoffStateWhenBlocked: 'not-ready',
  assignmentMayBeCreatedBeforeReadinessPassed: false,
  professionalWorkspaceMayLoadBeforeAcceptance: false,
  professionalQueueMayReceiveWorkBeforeAcceptance: false,
  professionalDeliveryClockMayStartBeforeAcceptance: false,
  customerMayContinueEntitledJourney: true,
  retryAfterCorrectableGateChangeAllowed: true,
  blockingReasonMustRemainVisible: true
})) {
  assert.equal(contract.failureBehaviour[rule], expected, rule);
}

assert.equal(
  activation.paymentBoundary.paymentAloneCreatesProfessionalAssignment,
  false
);
assert.equal(
  activation.responsibilitySeparation
    .professionalResponsibilityRequiresAcceptedEligibleAssignment,
  true
);
assert.equal(responsibility.responsibilityLifecycle.purchaseCreatesResponsibility, false);
assert.equal(
  responsibility.responsibilityLifecycle.entitlementCreatesResponsibility,
  false
);

const operationByCode = new Map(
  operations.operations.map(operation => [operation.operationCode, operation])
);
assert.equal(
  operationByCode.get('assignment.create')?.eventCode,
  'assignment.created'
);
assert.equal(
  operationByCode.get('assignment.accept')?.authority,
  'assigned_professional'
);
assert.equal(
  operationByCode.get('assignment.accept')?.eventCode,
  'assignment.accepted'
);

const eventByCode = new Map(
  events.events.map(event => [event.eventCode, event])
);
assert.equal(eventByCode.get('readiness.passed')?.outcome, 'ready');
assert.equal(eventByCode.get('assignment.created')?.stateChanged, true);
assert.equal(eventByCode.get('assignment.accepted')?.stateChanged, true);

const stateByName = new Map(
  states.stateFamilies.map(family => [family.stateName, family])
);
assert.equal(stateByName.get('Professional Readiness State')?.initialState, 'not_ready');
assert(stateByName.get('Professional Readiness State')?.allowedStates.includes('ready'));
assert.equal(stateByName.get('Assignment State')?.initialState, 'proposed');
assert(stateByName.get('Assignment State')?.transitions.proposed.includes('active'));

assert.equal(contract.namingCompatibility.replacementAllowed, false);
assert.equal(contract.namingCompatibility.uniqueSequenceKeyRequired, true);
assert.equal(contract.acceptance.requiredGateCount, 8);
assert.equal(contract.acceptance.strictOrderRequired, true);
assert.equal(
  contract.acceptance.rm5JourneyEntitlementIsProfessionalEntitlement,
  false
);
assert.equal(contract.acceptance.silentEntitlementUpgradeAllowed, false);
assert.equal(
  contract.acceptance.professionalResponsibilityBeforeAcceptance,
  false
);
assert.equal(contract.acceptance.pageChangeInThisStep, false);
assert.equal(contract.acceptance.visualAcceptance.status, 'not-applicable');
assert.equal(contract.acceptance.languageAcceptance.status, 'not-applicable');
assert.equal(
  contract.acceptance.keyboardFocusAcceptance.status,
  'not-applicable'
);
assert.equal(contract.acceptance.touchTargetAcceptance.status, 'not-applicable');

const document = await read(
  'docs/pws/architecture/PWS-ENTRY-W3-PROFESSIONAL-HANDOFF-BOUNDARY-FREEZE.md'
);
for (const phrase of [
  'all eight gates',
  'assignment.created',
  'assignment.accepted',
  'must never be silently upgraded into Professional entitlement',
  'Neither contract replaces the other'
]) {
  assert(document.includes(phrase), `Professional W3 document missing: ${phrase}`);
}

const legacyW1 = await read(
  'scripts/check-pws-entry-w1-authorised-data-loader.mjs'
);
assert(
  legacyW1.includes(
    "import './check-pws-entry-professional-w3-handoff-boundary.mjs';"
  ),
  'Historical W1 must enforce the professional handoff boundary'
);

console.log('✓ PWS-ENTRY-HANDOFF-W3 Professional handoff boundary frozen.');
console.log('  Eight ordered gates precede accepted professional responsibility.');
console.log('  RM5 Journey entitlement cannot become Professional entitlement.');
