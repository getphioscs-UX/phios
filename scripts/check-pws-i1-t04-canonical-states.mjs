import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const registry = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-object-registry-v1.json'
));
const contract = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-states-v1.json'
));
assert.equal(contract.contractId, 'phi-os.pws.canonical-states.v1');
assert.equal(contract.schemaVersion, 'pws-v1');
assert.equal(contract.status, 'frozen');
assert.equal(
  contract.baseline.commit,
  '78e3c4a46b02adc6fb637e7f4a761bc61dd7d619'
);
assert.deepEqual(contract.baseline.prerequisiteContracts, [
  'phi-os.pws.canonical-object-registry.v1',
  'phi-os.pws.schema-version.v1'
]);

for (const [rule, expected] of Object.entries({
  freeStringStatesAllowed: false,
  stateCodesAreCaseSensitive: true,
  stateCodesUseSnakeCase: true,
  initialStateRequired: true,
  explicitTransitionRequired: true,
  illegalTransitionRejected: true,
  illegalTransitionHasSideEffects: false,
  uiMayCreateState: false,
  apiMayCreateState: false,
  aiMayCreateState: false,
  providerMayCreateState: false,
  paymentMayCreateJourneyState: false,
  providerSuccessMayPromoteCandidate: false,
  legacyReadAdaptersAllowed: true,
  legacyWriteStatesAllowed: false
})) assert.equal(contract.rules[rule], expected, rule);

const expectedFamilies = [
  'Professional State','Capability State','Registry State','Product State',
  'Offer State','Order State','Payment State','Entitlement State',
  'Consent State','Journey State','Assignment State','Workspace State',
  'Candidate State','Journey Report State','Professional Readiness State',
  'Professional Response State','Deliverable State','Knowledge Resource State',
  'Observation State','Provider Operation State'
];
assert.deepEqual(
  contract.stateFamilies.map(item => item.stateName),
  expectedFamilies
);
const stateIds = new Set();
for (const family of contract.stateFamilies) {
  assert.match(family.stateId, /^pws\.state\.[a-z0-9-]+$/);
  assert.equal(stateIds.has(family.stateId), false);
  stateIds.add(family.stateId);
  assert.ok(family.allowedStates.includes(family.initialState));
  assert.equal(new Set(family.allowedStates).size, family.allowedStates.length);
  assert.deepEqual(Object.keys(family.transitions), family.allowedStates);
  for (const state of family.allowedStates) {
    assert.match(state, /^[a-z][a-z0-9_]*$/);
    const nextStates = family.transitions[state];
    assert.ok(Array.isArray(nextStates));
    assert.equal(new Set(nextStates).size, nextStates.length);
    for (const next of nextStates) assert.ok(family.allowedStates.includes(next));
  }
  for (const terminal of family.terminalStates) {
    assert.ok(family.allowedStates.includes(terminal));
    assert.deepEqual(family.transitions[terminal], []);
  }
}
assert.equal(contract.stateFamilies.length, 20);

const registeredNames = new Set(registry.objects.map(item => item.canonicalName));
for (const family of contract.stateFamilies) {
  if (['Registry','Journey','Provider Operation'].includes(family.objectName)) {
    continue;
  }
  assert.ok(
    registeredNames.has(family.objectName),
    `${family.objectName} must be registered.`
  );
}
for (const item of contract.legacyCompatibility) {
  assert.equal(await exists(item.path), true, item.path);
  assert.ok(item.handling);
}
for (const value of Object.values(contract.semanticBoundaries)) {
  assert.equal(value, true);
}

const contentRegistry = JSON.parse(await read('content/registry/index.json'));
const runtimeContracts = JSON.parse(
  await read('content/registry/runtime-contracts.json')
);
const migrations = JSON.parse(
  await read('content/registry/runtime-migrations.json')
);
assert.equal(Object.keys(contentRegistry.registries).length, 48);
assert.equal(runtimeContracts.contracts.length, 20);
assert.equal(migrations.migrations.length, 4);
assert.deepEqual(migrations.migrations.map(item => item.version), [1, 2, 3, 4]);

console.log('✓ PWS-I1-T04 Canonical States v1 frozen.');
console.log('  20 closed state enums with explicit initial, terminal and transition rules.');
console.log('  Free strings, implicit transitions and UI/API/AI/Provider-created states are prohibited.');
