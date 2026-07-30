import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const exists = file =>
  fs.access(path.join(root, file)).then(() => true, () => false);

const states = await readJson(
  'docs/pws/contracts/pws-canonical-states-v1.json'
);
const operations = await readJson(
  'docs/pws/contracts/pws-canonical-operations-v1.json'
);
const events = await readJson(
  'docs/pws/contracts/pws-canonical-events-v1.json'
);

const baseline = '7a99bda47c7a32f7e490ca95e06e4fa4574443c7';
assert.equal(operations.contractId, 'phi-os.pws.canonical-operations.v1');
assert.equal(events.contractId, 'phi-os.pws.canonical-events.v1');
assert.equal(operations.schemaVersion, 'pws-v1');
assert.equal(events.schemaVersion, 'pws-v1');
assert.equal(operations.status, 'frozen');
assert.equal(events.status, 'frozen');
assert.equal(operations.baseline.commit, baseline);
assert.equal(events.baseline.commit, baseline);
assert.equal(events.operationContractId, operations.contractId);

const expectedOperationCodes = [
  'payment.confirm',
  'payment.fail',
  'payment.refund',
  'entitlement.activate',
  'entitlement.revoke',
  'consent.confirm',
  'consent.withdraw',
  'journey.activate',
  'journey.pause',
  'journey.resume',
  'assignment.create',
  'assignment.accept',
  'assignment.cancel',
  'assignment.complete',
  'readiness.evaluate',
  'professionalResponse.confirm',
  'professionalResponse.refine',
  'professionalResponse.challenge',
  'professionalResponse.extend',
  'deliverable.freeze',
  'deliverable.sign',
  'deliverable.release',
  'capability.activate',
  'capability.suspend',
  'professional.verify'
];
assert.deepEqual(
  operations.operations.map(operation => operation.operationCode),
  expectedOperationCodes
);
assert.equal(new Set(expectedOperationCodes).size, expectedOperationCodes.length);

for (const [rule, expected] of Object.entries({
  freeStringOperationsAllowed: false,
  oneOperationOneFormalStateChange: true,
  explicitSourceStatesRequired: true,
  singleTargetStateRequired: true,
  preconditionsRequired: true,
  authorityRequired: true,
  idempotencyRequired: true,
  illegalOperationRejected: true,
  illegalOperationHasSideEffects: false,
  uiMayInventOperation: false,
  apiMayInventOperation: false,
  aiMayInventOperation: false,
  providerMayInventOperation: false,
  eventMayExecuteOperation: false,
  paymentMayCreateJourney: false,
  providerOutputMayCreateFormalObject: false,
  legacyOperationWritesAllowed: false
})) {
  assert.equal(operations.rules[rule], expected, `Operation rule changed: ${rule}`);
}

const stateByObject = new Map(
  states.stateFamilies.map(family => [family.objectName, family])
);
for (const operation of operations.operations) {
  assert.equal(operation.operationId, `pws.operation.${operation.operationCode}`);
  assert(Array.isArray(operation.sourceStates));
  assert(operation.sourceStates.length > 0);
  assert.equal(typeof operation.targetState, 'string');
  assert(operation.targetState.length > 0);
  assert.equal(typeof operation.authority, 'string');
  assert(operation.authority.length > 0);
  assert(Array.isArray(operation.preconditions));
  assert(operation.preconditions.length > 0);
  assert.equal(operation.idempotencyKeyRequired, true);
  assert.match(operation.eventCode, /^[a-z][A-Za-z]*\.[a-z][a-z_]*$/);

  const family = stateByObject.get(operation.objectName);
  assert(family, `Missing state family for ${operation.operationCode}`);
  assert(
    family.allowedStates.includes(operation.targetState),
    `Unknown target state for ${operation.operationCode}`
  );

  if (operation.createsObject === true) {
    assert.equal(operation.operationCode, 'assignment.create');
    assert.deepEqual(operation.sourceStates, ['__absent__']);
    assert.equal(operation.targetState, family.initialState);
    continue;
  }
  assert(!operation.sourceStates.includes('__absent__'));
  for (const sourceState of operation.sourceStates) {
    assert(
      family.allowedStates.includes(sourceState),
      `Unknown source state for ${operation.operationCode}: ${sourceState}`
    );
    assert(
      family.transitions[sourceState].includes(operation.targetState),
      `Illegal transition for ${operation.operationCode}: ` +
        `${sourceState} -> ${operation.targetState}`
    );
  }
}

for (const [rule, expected] of Object.entries({
  freeStringEventsAllowed: false,
  eventIsPastFact: true,
  eventMayExecuteOperation: false,
  eventMayChangeState: false,
  eventMayContainPayload: false,
  eventMayContainSensitiveData: false,
  eventIdRequired: true,
  occurredAtRequired: true,
  actorReferenceRequired: true,
  objectReferenceRequired: true,
  operationIdRequired: true,
  previousStateRequired: true,
  resultingStateRequired: true,
  appendOnly: true,
  immutable: true,
  providerOutputIsEventAllowed: false,
  uiTelemetryIsCanonicalEventAllowed: false,
  legacyEventWritesAllowed: false
})) {
  assert.equal(events.rules[rule], expected, `Event rule changed: ${rule}`);
}

assert.equal(events.events.length, operations.operations.length);
const operationByCode = new Map(
  operations.operations.map(operation => [operation.operationCode, operation])
);
for (const event of events.events) {
  const operation = operationByCode.get(event.operationCode);
  assert(operation, `Event has no canonical operation: ${event.eventCode}`);
  assert.equal(event.eventId, `pws.event.${event.eventCode}`);
  assert.equal(event.eventCode, operation.eventCode);
  assert.equal(event.objectName, operation.objectName);
}
assert.equal(
  new Set(events.events.map(event => event.eventCode)).size,
  events.events.length
);
assert(events.eventEnvelope.forbiddenFields.includes('payload'));
assert(events.eventEnvelope.forbiddenFields.includes('provider_output'));

for (const boundary of [
  ...operations.legacyCompatibility,
  ...events.existingEventBoundaries
]) {
  assert(Array.isArray(boundary.paths));
  for (const legacyPath of boundary.paths) {
    assert(
      await exists(legacyPath),
      `Legacy boundary path is not traceable: ${legacyPath}`
    );
  }
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:pws-i1-t05'],
  'node scripts/check-pws-i1-t05-t06-operations-events.mjs'
);
assert.equal(
  packageJson.scripts['check:pws-i1-t06'],
  'node scripts/check-pws-i1-t05-t06-operations-events.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pws-i1-t05-t06-operations-events.mjs'
  )
);

console.log('✓ PWS-I1-T05 Canonical Operations and T06 Events v1 frozen.');
console.log('  25 operations: one operation, one formal state change.');
console.log('  25 payload-free past-fact events; events cannot execute operations.');
