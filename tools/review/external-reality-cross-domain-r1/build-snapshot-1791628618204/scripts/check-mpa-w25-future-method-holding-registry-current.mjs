import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const BASE = 'content/professional/method-production-activation';
const baseline = 'd150a741231abe608a0d994e9e5787e6c71cfc3d';

const registry = readJson(`${BASE}/registries/mpa-future-method-holding-registry-v1.json`);
const contract = readJson(`${BASE}/contracts/mpa-future-method-holding-contract-v1.json`);
const schema = readJson(`${BASE}/schemas/mpa-future-method-holding-registry-v1.schema.json`);
const fixture = readJson(`${BASE}/fixtures/mpa-w25-future-method-draft.valid.json`);
const acceptance = readJson(`${BASE}/acceptance/mpa-w25-future-method-holding-acceptance-v1.json`);
const canonical = readJson(`${BASE}/registries/method-registry-v2.json`);
const mr = readJson('content/professional/method-runtime/method-registry-v1.json');
const imrEligibility = readJson('content/professional/method-governance/imr-production-eligibility-registry-v1.json');
const imrLicense = readJson('content/professional/method-governance/imr-commercial-license-registry-v1.json');
const imrAlgorithm = readJson('content/professional/method-governance/imr-algorithm-governance-registry-v1.json');
const pkg = readJson('package.json');

assert.equal(registry.registryCode, 'MPA-FUTURE-METHOD-HOLDING-REGISTRY-v1');
assert.equal(registry.work, 'MPA-W25');
assert.equal(registry.baselineCommit, baseline);
assert.equal(registry.status, 'ACTIVE_HOLDING_REGISTRY_NO_PRODUCTION_GRANT');
assert.deepEqual(registry.allowedHoldingStates, ['DRAFT', 'REGISTERED']);
assert.equal(registry.holdingContract, `${BASE}/contracts/mpa-future-method-holding-contract-v1.json`);
assert.equal(registry.canonicalMethodRegistry, `${BASE}/registries/method-registry-v2.json`);

assert.equal(contract.work, 'MPA-W25');
assert.equal(contract.baselineCommit, baseline);
assert.equal(contract.status, 'ACTIVE_HOLDING_BOUNDARY_NO_PRODUCTION_AUTHORITY');
assert.deepEqual(contract.allowedHoldingStates, ['DRAFT', 'REGISTERED']);
for (const [key, value] of Object.entries(contract.authority)) {
  if (key === 'ownsHoldingStateOnly') assert.equal(value, true);
  else assert.equal(value, false, `${key} must remain false in W25`);
}
assert.equal(contract.rules.holdingRegistrationCreatesProductionAuthority, false);
assert.equal(contract.rules.holdingRegistrationCreatesProfessionalAuthority, false);
assert.equal(contract.rules.holdingRegistrationOpensMpaW26, false);
assert.equal(contract.rules.holdingRegistrationOpensMpaW27, false);
assert.equal(contract.rules.independentActivationRequiredBeforeForwardLifecycle, true);
assert.equal(contract.rules.independentActivationMustUseVersionedSuccessorEvidence, true);
assert.equal(contract.rules.holdingRegistryCannotSelfPromote, true);

assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.properties.registryCode.const, registry.registryCode);
assert.deepEqual(schema.properties.allowedHoldingStates.const, ['DRAFT', 'REGISTERED']);
assert.deepEqual(schema.$defs.holdingEntry.properties.holdingState.enum, ['DRAFT', 'REGISTERED']);
for (const field of ['productionEligible','productionExecutionAllowed','professionalEligible','publicEligible']) {
  assert.equal(schema.$defs.holdingEntry.properties[field].const, false);
}
assert.equal(schema.$defs.holdingEntry.properties.activationState.const, 'NOT_ACTIVATED');

const expected = [
  ['I_CHING', 'I Ching', 'ICH'],
  ['TAROT', 'Tarot', 'TAR'],
  ['PSYCHOLOGY', 'Psychology', 'PSY']
];
assert.equal(registry.entries.length, expected.length);
assert.equal(new Set(registry.entries.map(entry => entry.methodCode)).size, expected.length);
assert.equal(new Set(registry.entries.map(entry => entry.pluginCode)).size, expected.length);

const byCode = (source, code) => (source.methods || source.entries || []).find(entry => entry.methodCode === code);
for (const [methodCode, methodName, pluginCode] of expected) {
  const held = registry.entries.find(entry => entry.methodCode === methodCode);
  assert.ok(held, `Missing holding entry ${methodCode}`);
  assert.equal(held.methodName, methodName);
  assert.equal(held.pluginCode, pluginCode);
  assert.equal(held.holdingState, 'REGISTERED');
  assert.equal(held.definitionState, 'DRAFT');
  assert.equal(held.implementationState, 'NOT_IMPLEMENTED');
  assert.equal(held.activationState, 'NOT_ACTIVATED');
  assert.equal(held.productionEligible, false);
  assert.equal(held.productionExecutionAllowed, false);
  assert.equal(held.professionalEligible, false);
  assert.equal(held.publicEligible, false);
  assert.equal(held.independentActivationRequired, true);
  assert.ok(held.blockingReasons.includes('INDEPENDENT_ACTIVATION_REQUIRED'));
  assert.ok(held.blockingReasons.includes('PRODUCTION_FROM_HOLDING_FORBIDDEN'));

  const canonicalEntry = byCode(canonical, methodCode);
  assert.ok(canonicalEntry, `${methodCode} missing from Method Registry v2`);
  assert.equal(canonicalEntry.state, 'REGISTERED');
  assert.equal(canonicalEntry.pluginCode, pluginCode);
  assert.equal(canonicalEntry.productionEligible, false);
  assert.equal(canonicalEntry.professionalEligible, false);
  assert.deepEqual(held.canonicalMethodRegistryBinding, {
    registry: 'METHOD_REGISTRY_V2',
    methodCode,
    pluginCode,
    methodVersion: canonicalEntry.methodVersion,
    registryState: 'REGISTERED'
  });

  const mrEntry = byCode(mr, methodCode);
  assert.ok(mrEntry);
  assert.equal(mrEntry.status, 'draft');
  assert.equal(mrEntry.productionEligible, false);

  const eligibility = byCode(imrEligibility, methodCode);
  assert.ok(eligibility);
  assert.equal(eligibility.productionReady, false);
  assert.equal(eligibility.professionalReady, false);
  assert.equal(eligibility.productionAuthorityCreated, false);

  const license = byCode(imrLicense, methodCode);
  assert.ok(license);
  assert.equal(license.commercialRights.commercialUse, 'blocked');
  assert.equal(license.commercialRights.serviceUse, 'blocked');
  assert.equal(license.productionAuthorityCreated, false);

  const algorithm = byCode(imrAlgorithm, methodCode);
  assert.ok(algorithm);
  assert.equal(algorithm.algorithmStatus, 'not_defined');
  assert.equal(algorithm.calculation.implementedInSharedRuntime, false);
  assert.equal(algorithm.productionAuthorityCreated, false);
}

assert.equal(registry.futureMethodPolicy.additionalFutureMethodsAllowed, true);
assert.equal(registry.futureMethodPolicy.draftEntryRequiresCanonicalRegistryBinding, false);
assert.equal(registry.futureMethodPolicy.registeredEntryRequiresCanonicalRegistryBinding, true);
assert.equal(registry.futureMethodPolicy.productionFromHoldingAllowed, false);
assert.equal(registry.futureMethodPolicy.independentActivationRequired, true);
assert.equal(registry.futureMethodPolicy.versionedSuccessorRequired, true);

assert.equal(fixture.holdingState, 'DRAFT');
assert.equal(fixture.definitionState, 'DRAFT');
assert.equal(fixture.canonicalMethodRegistryBinding, null);
assert.equal(fixture.implementationState, 'NOT_IMPLEMENTED');
assert.equal(fixture.activationState, 'NOT_ACTIVATED');
assert.equal(fixture.productionEligible, false);
assert.equal(fixture.productionExecutionAllowed, false);
assert.equal(fixture.professionalEligible, false);
assert.equal(fixture.publicEligible, false);
assert.equal(fixture.independentActivationRequired, true);
assert.equal(byCode(canonical, fixture.methodCode), undefined, 'Draft holding fixture must not silently enter Method Registry v2.');

assert.equal(acceptance.status, 'ACCEPT_FUTURE_METHOD_HOLDING_REGISTERED_OR_DRAFT_NO_PRODUCTION');
assert.deepEqual(acceptance.acceptedMethods, expected.map(([code]) => code));
assert.equal(acceptance.acceptedFacts.holdingStatesLimitedToDraftOrRegistered, true);
assert.equal(acceptance.acceptedFacts.otherFutureMethodDraftSupported, true);
assert.equal(acceptance.acceptedFacts.canonicalMethodRegistryV2Rewritten, false);
assert.equal(acceptance.acceptedFacts.imrProductionEligibilityRewritten, false);
assert.equal(acceptance.acceptedFacts.holdingCreatesProductionAuthority, false);
assert.equal(acceptance.acceptedFacts.productionExecutionAllowed, false);
assert.equal(acceptance.acceptedFacts.independentActivationRequired, true);

// Current checker intentionally omits historical package.json wiring assertions.
console.log('✓ MPA-W25 Future Method Holding Registry passed.');
console.log('  I Ching, Tarot and Psychology remain REGISTERED/DRAFT holding entries with zero Production, Professional, Public or execution authority.');
console.log('  Additional future methods may enter DRAFT holding without entering Method Registry v2; independent versioned activation is required before any forward lifecycle.');
