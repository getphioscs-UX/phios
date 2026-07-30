import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const exists = file =>
  fs.access(path.join(root, file)).then(() => true, () => false);

const paths = {
  freeze: 'docs/pws/contracts/pws-i1-v1-freeze.json',
  glossary: 'docs/pws/contracts/pws-canonical-glossary-v1.json',
  identifiers: 'docs/pws/contracts/pws-canonical-identifiers-v1.json',
  objects: 'docs/pws/contracts/pws-canonical-object-registry-v1.json',
  schema: 'docs/pws/contracts/pws-schema-version-v1.json',
  states: 'docs/pws/contracts/pws-canonical-states-v1.json',
  operations: 'docs/pws/contracts/pws-canonical-operations-v1.json',
  events: 'docs/pws/contracts/pws-canonical-events-v1.json',
  errors: 'docs/pws/contracts/pws-canonical-errors-v1.json',
  directory: 'docs/pws/contracts/pws-directory-blueprint-v1.json'
};

const entries = await Promise.all(
  Object.entries(paths).map(async ([key, file]) => [key, await readJson(file)])
);
const contracts = Object.fromEntries(entries);
const {
  freeze, glossary, identifiers, objects, schema, states,
  operations, events, errors, directory
} = contracts;

assert.equal(freeze.freezeId, 'PWS-I1-v1.0.0-Frozen');
assert.equal(freeze.version, '1.0.0');
assert.equal(freeze.schemaVersion, 'pws-v1');
assert.equal(freeze.status, 'frozen');
assert.equal(
  freeze.baseline.commit,
  '4fd426aa87664e58073432d9c3654d35d8f2a820'
);
assert.equal(freeze.scope.from, 'PWS-I1-T00');
assert.equal(freeze.scope.through, 'PWS-I1-T08');
assert.equal(freeze.scope.nextPhase, 'PWS-I2 Registry Foundation');

for (const contract of [
  glossary, identifiers, objects, schema, states,
  operations, events, errors, directory
]) {
  assert.equal(contract.status, 'frozen');
}

// Glossary and Legacy Alias acceptance.
assert.equal(glossary.terms.length, 35);
assert.equal(new Set(glossary.terms.map(term => term.term)).size, 35);
for (const term of glossary.terms) {
  assert(term.id && term.term && term.zhHans && term.definition && term.owner);
}
assert.equal(glossary.legacyAliases.length, 11);
assert.equal(glossary.rules.legacyAliasWritesAllowed, false);
assert.equal(identifiers.legacyFieldAliases.length, 11);
assert(identifiers.legacyCompatibility.length > 0);
assert.equal(identifiers.rules.legacyIdWritesAllowed, false);

// Canonical Object Registry acceptance.
assert.equal(objects.objects.length, 35);
assert.equal(new Set(objects.objects.map(object => object.objectId)).size, 35);
assert.equal(new Set(objects.objects.map(object => object.objectCode)).size, 35);
assert.equal(
  new Set(objects.objects.map(object => object.canonicalName)).size,
  35
);
for (const object of objects.objects) {
  for (const field of objects.requiredFields) {
    assert(field in object, `Object ${object.objectId} lacks ${field}`);
  }
}
assert.equal(objects.rules.duplicateObjectCodeAllowed, false);
assert.equal(objects.rules.legacyAliasesAreWriteSources, false);

// Closed State acceptance.
assert.equal(states.stateFamilies.length, 20);
assert.equal(states.rules.freeStringStatesAllowed, false);
assert.equal(states.rules.explicitTransitionRequired, true);
for (const family of states.stateFamilies) {
  const allowed = new Set(family.allowedStates);
  assert(allowed.size > 0);
  assert.equal(allowed.size, family.allowedStates.length);
  assert(allowed.has(family.initialState));
  assert.deepEqual(new Set(Object.keys(family.transitions)), allowed);
  for (const [source, targets] of Object.entries(family.transitions)) {
    assert(allowed.has(source));
    for (const target of targets) assert(allowed.has(target));
  }
}

// Operation and Event correspondence acceptance.
assert.equal(operations.operations.length, 25);
assert.equal(events.events.length, 24);
assert.equal(events.operationContractId, operations.contractId);
const eventCodes = new Set(events.events.map(event => event.eventCode));
const legacyEventCodes = new Set(
  events.deprecatedLegacyEvents.map(event => event.eventCode)
);
for (const operation of operations.operations) {
  assert(
    eventCodes.has(operation.eventCode) ||
      legacyEventCodes.has(operation.eventCode),
    `Unregistered Operation event: ${operation.operationCode}`
  );
}
const operationCodes = new Set(
  operations.operations.map(operation => operation.operationCode)
);
for (const event of events.events) {
  for (const cause of event.causedBy) {
    assert(
      operationCodes.has(cause) ||
        cause.startsWith('provider_boundary.') ||
        cause.startsWith('provider_budget_threshold.'),
      `Unregistered Event cause: ${event.eventCode} <- ${cause}`
    );
  }
}

// Error Family acceptance.
const expectedErrorFamilies = [
  'IDENTITY','AUTHENTICATION','AUTHORIZATION','CAPABILITY','CONSENT',
  'ENTITLEMENT','PAYMENT','ASSIGNMENT','WORKSPACE','EVIDENCE','METHOD',
  'DELIVERABLE','STATE','VERSION','PROVIDER','SECURITY','INTEGRATION','SYSTEM'
];
assert.deepEqual(
  errors.families.map(family => family.family),
  expectedErrorFamilies
);
assert.equal(errors.rules.freeStringErrorFamiliesAllowed, false);
assert.equal(errors.rules.freeStringErrorCodesAllowed, false);

// Directory Blueprint and freeze manifest acceptance.
assert.equal(directory.modules.length, 23);
assert.equal(directory.standardModuleDirectories.length, 7);
assert.equal(directory.rules.secondSourceOfTruthAllowed, false);
assert.equal(directory.rules.phaseEarlyImplementationAllowed, false);
assert.equal(freeze.frozenContracts.length, 9);
for (const item of freeze.frozenContracts) {
  assert(await exists(item.path), `Missing frozen Contract: ${item.path}`);
}
for (const condition of freeze.acceptanceConditions) {
  for (const evidence of condition.evidence ?? []) {
    assert(await exists(evidence), `Missing acceptance evidence: ${evidence}`);
  }
}

for (const [rule, expected] of Object.entries({
  silentBehaviouralChangeAllowed: false,
  directMutationAllowed: false,
  newFreeStringStateAllowed: false,
  newUnregisteredOperationAllowed: false,
  newUnregisteredEventAllowed: false,
  legacyAliasWriteAllowed: false,
  secondSourceOfTruthAllowed: false
})) {
  assert.equal(freeze.changeControl[rule], expected, `Freeze rule changed: ${rule}`);
}

const requiredChecks = [
  'check-pws-i1-t01-canonical-glossary.mjs',
  'check-pws-i1-t02-canonical-identifiers.mjs',
  'check-pws-i1-t02-object-registry-t03-schema-version.mjs',
  'check-pws-i1-t04-canonical-states.mjs',
  'check-pws-i1-t05-t06-operations-events.mjs',
  'check-pws-i1-t07-canonical-errors.mjs',
  'check-pws-i1-t08-directory-blueprint.mjs',
  'check-pws-i1-v1-freeze.mjs'
];
const packageJson = await readJson('package.json');
for (const check of requiredChecks) {
  assert(
    packageJson.scripts.precheck.includes(`node scripts/${check}`),
    `PWS-I1 precheck missing: ${check}`
  );
}
assert.equal(
  packageJson.scripts['check:pws-i1'],
  'node scripts/check-pws-i1-v1-freeze.mjs'
);

console.log('✓ PWS-I1 v1.0.0 Acceptance and Freeze passed.');
console.log('  Glossary 35; Objects 35; State families 20; Operations 25; Events 24.');
console.log('  Error families 18; Legacy Alias decisions recorded; Directory modules 23.');
console.log('  Freeze: PWS-I1-v1.0.0-Frozen.');
