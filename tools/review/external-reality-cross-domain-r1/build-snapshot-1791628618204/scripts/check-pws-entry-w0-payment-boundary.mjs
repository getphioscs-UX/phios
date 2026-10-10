import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = file => fs.readFile(file, 'utf8');
const contract = JSON.parse(await read('docs/pws/architecture/pws-entry-payment-boundary-v1.json'));

assert.equal(contract.contractId, 'phi-os.pws-entry.payment-boundary.v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.status, 'pws-entry-w0-frozen');
assert.equal(contract.baseline.commit, '2e19922f57a8ff208f48988085761fa28cfbd099');

assert.deepEqual(contract.operatingLayers.beforePayment.available, [
  'public-knowledge', 'service-information', 'pricing', 'service-boundaries',
  'samples', 'preparation', 'free-rule-based-exploration', 'checkout'
]);
assert.deepEqual(contract.operatingLayers.beforePayment.forbiddenCreations, [
  'formal-journey', 'formal-evidence', 'reconstruction', 'individual-reading',
  'journey-report', 'professional-assignment', 'professional-queue',
  'paid-individual-provider-invocation'
]);
for (const value of [
  'formalJourneyIdentityCreated', 'formalEvidenceWritten',
  'runtimePersistenceUsed', 'paidProviderUsed',
  'individualConclusionGenerated', 'professionalResponsibilityCreated'
]) assert.equal(contract.operatingLayers.beforePayment.freeExploration[value], false);

assert.deepEqual(contract.operatingLayers.afterPayment.minimumActivationGates, [
  'order-created', 'payment-confirmed', 'entitlement-active',
  'customer-identity-matched', 'service-boundary-consent-confirmed'
]);
assert.deepEqual(contract.operatingLayers.afterPayment.professionalHandoffAdditionalGates, [
  'service-eligible-for-human-review', 'professional-capability-verified',
  'assignment-created', 'professional-consent-active'
]);
assert.equal(contract.transitionRules.activeEntitlementRequiredForFormalJourney, true);
assert.equal(contract.transitionRules.activeEntitlementRequiredForIndividualConclusion, true);
assert.equal(contract.transitionRules.prePaymentDataMayBePromotedSilently, false);
assert.equal(contract.acceptance.publicBrowsingUsableWithoutPayment, true);
assert.equal(contract.acceptance.freeExplorationBecomesHiddenPaidJourney, false);
assert.equal(contract.acceptance.serviceIsOnlyExit, false);
assert.equal(contract.acceptance.individualConclusionBeforeEntitlement, false);

const master = JSON.parse(await read('content/registry/master-governance.json'));
assert.equal(master.writeSourceRule.pageMayCreateSecondSourceOfTruth, false);
const responsibility = JSON.parse(await read('content/registry/pws-w0-baseline-responsibility-boundary.json'));
assert.equal(responsibility.responsibilityLifecycle.purchaseCreatesResponsibility, false);
assert.equal(responsibility.responsibilityLifecycle.entitlementCreatesResponsibility, false);

const w1 = await read('scripts/check-pws-entry-w1-authorised-data-loader.mjs');
assert(w1.includes("import './check-pws-entry-w0-payment-boundary.mjs';"));

console.log('✓ PWS-ENTRY-W0 payment-before-service boundary frozen.');
