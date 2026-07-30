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

assert.equal(operations.contractId, 'phi-os.pws.canonical-operations.v1');
assert.equal(events.contractId, 'phi-os.pws.canonical-events.v1');
assert.equal(operations.schemaVersion, 'pws-v1');
assert.equal(events.schemaVersion, 'pws-v1');
assert.equal(operations.status, 'frozen');
assert.equal(events.status, 'frozen');
assert.equal(
  events.baseline.commit,
  '1a032cdf851d71060ddb2d0033b9d65b75e35254'
);
assert.equal(events.operationContractId, operations.contractId);

const expectedOperationCodes = [
  'payment.confirm','payment.fail','payment.refund',
  'entitlement.activate','entitlement.revoke',
  'consent.confirm','consent.withdraw',
  'journey.activate','journey.pause','journey.resume',
  'assignment.create','assignment.accept','assignment.cancel',
  'assignment.complete','readiness.evaluate',
  'professionalResponse.confirm','professionalResponse.refine',
  'professionalResponse.challenge','professionalResponse.extend',
  'deliverable.freeze','deliverable.sign','deliverable.release',
  'capability.activate','capability.suspend','professional.verify'
];
assert.deepEqual(
  operations.operations.map(operation => operation.operationCode),
  expectedOperationCodes
);

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

  const family = stateByObject.get(operation.objectName);
  assert(family, `Missing state family for ${operation.operationCode}`);
  assert(family.allowedStates.includes(operation.targetState));
  if (operation.createsObject === true) {
    assert.equal(operation.operationCode, 'assignment.create');
    assert.deepEqual(operation.sourceStates, ['__absent__']);
    assert.equal(operation.targetState, family.initialState);
  } else {
    for (const sourceState of operation.sourceStates) {
      assert(family.allowedStates.includes(sourceState));
      assert(
        family.transitions[sourceState].includes(operation.targetState),
        `Illegal transition: ${operation.operationCode} ` +
          `${sourceState} -> ${operation.targetState}`
      );
    }
  }
}

const expectedEventCodes = [
  'payment.confirmed','payment.failed','payment.refunded',
  'entitlement.activated','entitlement.revoked',
  'consent.confirmed','consent.withdrawn',
  'journey.activated','journey.paused','journey.resumed',
  'assignment.created','assignment.accepted','assignment.completed',
  'readiness.passed','readiness.blocked',
  'professionalResponse.recorded',
  'deliverable.frozen','deliverable.signed','deliverable.released',
  'provider.invocation.started','provider.invocation.failed',
  'provider.invocation.completed','provider.budget.warning',
  'provider.budget.blocked'
];
assert.deepEqual(
  events.events.map(event => event.eventCode),
  expectedEventCodes
);
assert.equal(new Set(expectedEventCodes).size, expectedEventCodes.length);

for (const [rule, expected] of Object.entries({
  freeStringEventsAllowed: false,
  eventIsPastFact: true,
  eventMayExecuteOperation: false,
  eventMayChangeState: false,
  eventMayContainBusinessPayload: false,
  eventMayContainSensitiveData: false,
  eventIdRequired: true,
  occurredAtRequired: true,
  actorReferenceRequired: true,
  subjectReferenceRequired: true,
  causationReferenceRequired: true,
  correlationIdRequired: true,
  stateSnapshotRequiredWhenStateChanged: true,
  appendOnly: true,
  immutable: true,
  providerOutputIsEventAllowed: false,
  uiTelemetryIsCanonicalEventAllowed: false,
  legacyEventWritesAllowed: false
})) {
  assert.equal(events.rules[rule], expected, `Event rule changed: ${rule}`);
}

const operationCodes = new Set(expectedOperationCodes);
for (const event of events.events) {
  assert.equal(event.eventId, `pws.event.${event.eventCode}`);
  assert(Array.isArray(event.causedBy));
  assert(event.causedBy.length > 0);
  assert.equal(typeof event.stateChanged, 'boolean');
  for (const cause of event.causedBy) {
    assert(
      operationCodes.has(cause) ||
        cause.startsWith('provider_boundary.') ||
        cause.startsWith('provider_budget_threshold.'),
      `Unbounded event cause: ${event.eventCode} <- ${cause}`
    );
  }
}
assert.deepEqual(
  events.events
    .filter(event => event.eventCode.startsWith('provider.'))
    .map(event => event.stateChanged),
  [false,false,false,false,false]
);
assert(events.eventEnvelope.forbiddenFields.includes('provider_output'));
assert(events.eventEnvelope.forbiddenFields.includes('prompt'));
assert(events.eventEnvelope.forbiddenFields.includes('completion'));

const legacyCodes = new Set(
  events.deprecatedLegacyEvents.map(event => event.eventCode)
);
assert.equal(legacyCodes.size, events.deprecatedLegacyEvents.length);
for (const operation of operations.operations) {
  assert(
    expectedEventCodes.includes(operation.eventCode) ||
      legacyCodes.has(operation.eventCode),
    `T05 event reference is neither canonical nor Legacy: ${operation.eventCode}`
  );
}

for (const boundary of events.existingEventBoundaries) {
  for (const legacyPath of boundary.paths) {
    assert(
      await exists(legacyPath),
      `Existing event boundary is not traceable: ${legacyPath}`
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

console.log('✓ PWS-I1-T05 Operations and revised T06 Events passed.');
console.log('  T05: 25 operations; one operation, one formal state change.');
console.log('  T06: 24 payload-free past facts; 9 prior codes remain Legacy.');
