import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  buildCanonicalInput,
  verifyCanonicalInput
} from './lib/input-case-runtime/icr-input-foundation-v1.mjs';
import {
  buildCanonicalCase,
  buildRealityInitializationRequest
} from './lib/input-case-runtime/icr-case-runtime-v1.mjs';
import {
  assertCanonicalRealityDigest,
  assertRealityEntityDigest,
  assertRealityEventDigest,
  assertRealitySignalDigest,
  buildCanonicalReality,
  buildRealityEntity,
  buildRealityEvent,
  buildRealitySignal,
  stableDigest
} from './lib/reality-model-runtime/rmo-reality-foundation-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const normalizedHash = relative => crypto.createHash('sha256')
  .update(readText(relative).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const clone = value => structuredClone(value);
const sorted = values => [...values].sort();
const expectThrow = (fn, code) => assert.throws(
  fn,
  error => error?.message?.startsWith(code),
  `Expected error starting with ${code}`
);
const withoutDigest = (value, field) => {
  const copy = clone(value);
  delete copy[field];
  return copy;
};

const base = 'content/runtime/reality-model-runtime';
const audit = readJson(`${base}/audits/rmo-reality-model-authority-audit-v1.json`);
const realityContract = readJson(`${base}/contracts/canonical-reality-object-v1.json`);
const entityContract = readJson(`${base}/contracts/entity-runtime-contract-v1.json`);
const eventContract = readJson(`${base}/contracts/event-runtime-contract-v1.json`);
const signalContract = readJson(`${base}/contracts/signal-runtime-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rmo-w0-w4-acceptance-contract-v1.json`);
const entityRegistry = readJson(`${base}/registries/canonical-entity-type-registry-v1.json`);
const eventRegistry = readJson(`${base}/registries/canonical-event-type-registry-v1.json`);
const signalRegistry = readJson(`${base}/registries/canonical-signal-type-registry-v1.json`);
const freeze = readJson(`${base}/freeze/rmo-w0-w4-reality-foundation-freeze-v1.json`);
const realityAcceptanceFixture = readJson(`${base}/fixtures/reality-initialization.acceptance.valid.json`);
const entityFixture = readJson(`${base}/fixtures/reality-entity.request.valid.json`);
const eventFixture = readJson(`${base}/fixtures/reality-event.request.valid.json`);
const signalFixture = readJson(`${base}/fixtures/reality-signal.request.valid.json`);

const icrBase = 'content/runtime/input-case-runtime';
const canonicalInputContract = readJson(`${icrBase}/contracts/canonical-input-contract-v1.json`);
const inputTypeRegistry = readJson(`${icrBase}/registries/canonical-input-type-registry-v1.json`);
const stateRegistry = readJson(`${icrBase}/registries/case-state-transition-registry-v1.json`);
const rdgReferenceRegistry = readJson(`${icrBase}/registries/icr-rdg-reference-registry-v1.json`);
const canonicalInputFixture = readJson(`${icrBase}/fixtures/canonical-input.request.valid.json`);
const verificationFixture = readJson(`${icrBase}/fixtures/input-verification.request.valid.json`);
const caseFixture = readJson(`${icrBase}/fixtures/canonical-case.request.valid.json`);
const initializationFixture = readJson(`${icrBase}/fixtures/reality-initialization.request.valid.json`);

const rdg = {
  purposes: readJson('content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json'),
  consents: readJson('content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json'),
  persistence: readJson('content/governance/reality-data-governance/registries/canonical-persistence-class-registry-v1.json'),
  retention: readJson('content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json'),
  sensitivity: readJson('content/governance/reality-data-governance/registries/canonical-data-sensitivity-registry-v1.json'),
  deletion: readJson('content/governance/reality-data-governance/contracts/deletion-tombstone-runtime-v1.json'),
  natures: readJson('content/governance/reality-data-governance/registries/canonical-data-nature-registry-v1.json'),
  certainties: readJson('content/governance/reality-data-governance/registries/canonical-data-certainty-registry-v1.json')
};
const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const planeRegistry = readJson('content/governance/canonical-master-work/registries/canonical-runtime-plane-registry-v1.json');
const dependencyRegistry = readJson('content/governance/canonical-master-work/registries/canonical-runtime-dependency-registry-v1.json');
const dataContracts = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const evidenceEligibility = readJson('content/governance/reality-data-governance/contracts/evidence-eligibility-contract-v1.json');
const inferenceFirewall = readJson('content/governance/reality-data-governance/contracts/sensitive-inference-firewall-v1.json');

assert.equal(audit.baselineCommit, '0732b3dfef7c15d3571d980887f1423b68eee6a2');
assert.equal(audit.status, 'reconciled');
assert.equal(audit.scope, 'RMO-W0-W4 Reality Foundation');
assert.equal(audit.digestMode, 'UTF8_NO_BOM_LF');
for (const authority of audit.inspectedAuthorities) {
  assert.ok(fs.existsSync(path.join(root, authority.reference)), `audited authority missing: ${authority.reference}`);
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority drift: ${authority.reference}`);
}
assert.equal(audit.authorityDecision.canonicalRealityOwner, 'RMO');
assert.equal(audit.authorityDecision.canonicalCaseOwner, 'ICR');
assert.equal(audit.authorityDecision.dataGovernanceOwner, 'RDG');
assert.equal(audit.authorityDecision.realityEventIsOperationalTimelineEvent, false);
assert.equal(audit.authorityDecision.signalIsEvidence, false);
assert.equal(audit.authorityDecision.rmoMayPromoteEvidence, false);
assert.equal(audit.authorityDecision.providerOrAiMayCreateRealityAuthority, false);
assert.equal(audit.existingRuntimeOrUserDataMutated, false);

const icrWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'ICR');
const rmoWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'RMO');
assert.deepEqual(icrWorks.map(entry => entry.workCode), Array.from({ length: 10 }, (_, index) => `ICR-W${index}`));
assert.deepEqual(rmoWorks.map(entry => entry.workCode), Array.from({ length: 16 }, (_, index) => `RMO-W${index}`));
assert.equal(icrWorks.at(-1).executionOrder + 1, rmoWorks[0].executionOrder);
assert.ok(rmoWorks.every(entry => entry.status === 'PLANNED'));
assert.equal(planeRegistry.assignments.find(entry => entry.code === 'RMO')?.plane, 'RUNTIME');
assert.equal(planeRegistry.assignments.find(entry => entry.code === 'RDG')?.plane, 'GOVERNANCE');
assert.equal(dependencyRegistry.entries.some(entry => entry.runtimeCode === 'RMO'), false);

const rmoDataContract = dataContracts.entries.find(entry => entry.runtimeCode === 'RMO');
assert.deepEqual(rmoDataContract.producedDataTypes, ['RUNTIME_STATE_RECORD']);
assert.deepEqual(sorted(rmoDataContract.consumedDataTypes), sorted([
  'REALITY_INPUT_RECORD',
  'REALITY_EVIDENCE_RECORD',
  'GOVERNANCE_RECORD'
]));
assert.deepEqual(rmoDataContract.writeAuthority.dataTypes, ['RUNTIME_STATE_RECORD']);
assert.equal(rmoDataContract.permissions.evidencePromotion, 'DENY');
assert.equal(evidenceEligibility.rules.eligibilityDoesNotEqualTruth, true);
assert.equal(inferenceFirewall.rules.sensitiveInferenceByDefaultDenied, true);
assert.equal(inferenceFirewall.rules.aiProviderCannotGrantPermission, true);

assert.equal(realityContract.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(realityContract.authorityBoundary.icrOwns.includes('Canonical Case'), true);
assert.equal(realityContract.authorityBoundary.rmoOwns.includes('Reality identity'), true);
assert.equal(realityContract.rules.realityStoresVerifiedInputPayload, false);
assert.equal(realityContract.rules.realityCreationDoesNotPromoteEvidence, true);
assert.equal(realityContract.rules.productionExecutionActivated, false);
assert.equal(entityContract.rules.entityIsCustomerDatabaseRecord, false);
assert.equal(eventContract.rules.realityEventIsOperationalTimelineEvent, false);
assert.equal(eventContract.rules.existingOperationalTimelineMutated, false);
assert.equal(signalContract.rules.signalIsEvidence, false);
assert.equal(signalContract.rules.signalIsInterpretation, false);
assert.equal(signalContract.rules.signalIsInference, false);

for (const registry of [entityRegistry, eventRegistry, signalRegistry]) {
  assert.equal(registry.runtimeAuthority, 'RMO');
  assert.equal(registry.containsUserData, false);
  assert.deepEqual(registry.instances, []);
}
assert.deepEqual(entityRegistry.entityTypes.map(entry => entry.entityType), [
  'SUBJECT', 'PERSON', 'GROUP', 'ORGANIZATION', 'LOCATION', 'OBJECT', 'SYSTEM', 'RESOURCE', 'ENVIRONMENT'
]);
assert.deepEqual(eventRegistry.eventTypes.map(entry => entry.eventType), [
  'OCCURRENCE', 'TRANSITION', 'INTERACTION', 'MILESTONE', 'CONDITION_CHANGE'
]);
assert.deepEqual(signalRegistry.signalTypes.map(entry => entry.signalType), [
  'STATE_INDICATOR', 'CHANGE_INDICATOR', 'TREND_INDICATOR', 'THRESHOLD_INDICATOR', 'ANOMALY_INDICATOR', 'ABSENCE_INDICATOR'
]);
assert.equal(signalRegistry.rules.calculatedOrDerivedSignalExecutionDeferred, true);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateReality = ajv.compile(readJson(`${base}/schemas/canonical-reality-v1.schema.json`));
const validateEntity = ajv.compile(readJson(`${base}/schemas/canonical-reality-entity-v1.schema.json`));
const validateEvent = ajv.compile(readJson(`${base}/schemas/canonical-reality-event-v1.schema.json`));
const validateSignal = ajv.compile(readJson(`${base}/schemas/canonical-reality-signal-v1.schema.json`));

const canonicalInput = buildCanonicalInput(
  canonicalInputFixture,
  inputTypeRegistry,
  rdg,
  canonicalInputContract
);
const verifiedInput = verifyCanonicalInput(
  canonicalInput,
  verificationFixture,
  inputTypeRegistry,
  rdg
);
const canonicalCase = buildCanonicalCase(
  caseFixture,
  [verifiedInput],
  stateRegistry,
  rdg,
  rdgReferenceRegistry
);
const initializationRequest = buildRealityInitializationRequest(
  canonicalCase,
  initializationFixture,
  stateRegistry
);

const reality = buildCanonicalReality(
  canonicalCase,
  initializationRequest,
  realityAcceptanceFixture
);
assert.equal(validateReality(reality), true, JSON.stringify(validateReality.errors));
assertCanonicalRealityDigest(reality);
assert.equal(reality.realityStatus, 'INITIALIZED');
assert.equal(reality.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(reality.subjectReference, canonicalCase.subjectReference);
assert.equal(reality.sourceInitialization.initializationRequestDigest, initializationRequest.requestDigest);
assert.equal(reality.sourceInitialization.sourceCaseDigest, canonicalCase.caseDigest);
assert.deepEqual(reality.governanceReferences, initializationRequest.governanceReferences);
assert.ok(Object.values(reality.componentReferences).every(references => references.length === 0));
assert.equal(reality.persistentStoreWriteAllowed, false);
assert.equal(reality.productionExecutionAllowed, false);
assert.equal(Object.hasOwn(reality, 'payload'), false);
assert.equal(Object.hasOwn(reality, 'evidence'), false);
assert.equal(Object.hasOwn(reality, 'interpretation'), false);
assert.equal(Object.isFrozen(reality), true);
assert.deepEqual(
  buildCanonicalReality(canonicalCase, initializationRequest, realityAcceptanceFixture),
  reality
);

const badAcceptanceField = { ...clone(realityAcceptanceFixture), payload: {} };
expectThrow(
  () => buildCanonicalReality(canonicalCase, initializationRequest, badAcceptanceField),
  'RMO_REALITY_ACCEPTANCE_FIELD_FORBIDDEN:payload'
);
expectThrow(
  () => buildCanonicalReality(canonicalCase, initializationRequest, { ...realityAcceptanceFixture, aiUsed: true }),
  'RMO_REALITY_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
expectThrow(
  () => buildCanonicalReality(canonicalCase, initializationRequest, { ...realityAcceptanceFixture, acceptedAt: initializationRequest.requestedAt }),
  'RMO_REALITY_ACCEPTANCE_TIME_INVALID'
);
const badTargetRequest = clone(initializationRequest);
badTargetRequest.targetWorkCode = 'RMO-W2';
badTargetRequest.requestDigest = stableDigest(withoutDigest(badTargetRequest, 'requestDigest'));
expectThrow(
  () => buildCanonicalReality(canonicalCase, badTargetRequest, realityAcceptanceFixture),
  'RMO_REALITY_INITIALIZATION_REQUEST_INELIGIBLE'
);
const tamperedReality = clone(reality);
tamperedReality.realityStatus = 'CLOSED';
expectThrow(() => assertCanonicalRealityDigest(tamperedReality), 'RMO_REALITY_DIGEST_INVALID');

const entity = buildRealityEntity(reality, entityFixture, entityRegistry, rdg);
assert.equal(validateEntity(entity), true, JSON.stringify(validateEntity.errors));
assertRealityEntityDigest(entity);
assert.equal(entity.entityRole, 'PRIMARY_SUBJECT');
assert.equal(entity.canonicalReference, reality.subjectReference);
assert.equal(entity.realityReference.realityDigest, reality.realityDigest);
assert.equal(entity.persistentStoreWriteAllowed, false);
assert.equal(Object.hasOwn(entity, 'payload'), false);
assert.deepEqual(buildRealityEntity(reality, entityFixture, entityRegistry, rdg), entity);
expectThrow(
  () => buildRealityEntity(reality, { ...entityFixture, entityType: 'UNKNOWN_TYPE' }, entityRegistry, rdg),
  'RMO_ENTITY_TYPE_UNKNOWN'
);
expectThrow(
  () => buildRealityEntity(reality, { ...entityFixture, canonicalReference: 'SUBJECT-WRONG' }, entityRegistry, rdg),
  'RMO_ENTITY_PRIMARY_SUBJECT_MISMATCH'
);
expectThrow(
  () => buildRealityEntity(reality, { ...clone(entityFixture), customerRecord: {} }, entityRegistry, rdg),
  'RMO_ENTITY_FIELD_FORBIDDEN:customerRecord'
);

const event = buildRealityEvent(reality, eventFixture, eventRegistry, rdg, [entity]);
assert.equal(validateEvent(event), true, JSON.stringify(validateEvent.errors));
assertRealityEventDigest(event);
assert.equal(event.operationalTimelineWriteAllowed, false);
assert.equal(event.evidenceEligibility, 'NOT_EVALUATED');
assert.equal(event.entityReferences[0], entity.entityCode);
assert.equal(Object.hasOwn(event, 'payload'), false);
assert.deepEqual(buildRealityEvent(reality, eventFixture, eventRegistry, rdg, [entity]), event);
expectThrow(
  () => buildRealityEvent(reality, { ...eventFixture, entityReferences: ['RMO-ENTITY-UNKNOWN-0001'] }, eventRegistry, rdg, [entity]),
  'RMO_EVENT_ENTITY_REFERENCE_UNKNOWN:RMO-ENTITY-UNKNOWN-0001'
);
expectThrow(
  () => buildRealityEvent(reality, { ...clone(eventFixture), operationalTimelineWriteAllowed: true }, eventRegistry, rdg, [entity]),
  'RMO_EVENT_FIELD_FORBIDDEN:operationalTimelineWriteAllowed'
);
expectThrow(
  () => buildRealityEvent(reality, { ...eventFixture, dataNature: 'INFERRED' }, eventRegistry, rdg, [entity]),
  'RMO_EVENT_DATA_NATURE_FORBIDDEN'
);

const signal = buildRealitySignal(reality, signalFixture, signalRegistry, rdg, [entity], [event]);
assert.equal(validateSignal(signal), true, JSON.stringify(validateSignal.errors));
assertRealitySignalDigest(signal);
assert.equal(signal.interpretationState, 'NOT_INTERPRETED');
assert.equal(signal.inferenceState, 'NOT_INFERRED');
assert.equal(signal.evidenceEligibility, 'NOT_EVALUATED');
assert.equal(signal.eventReferences[0], event.eventCode);
assert.equal(Object.hasOwn(signal, 'value'), false);
assert.deepEqual(buildRealitySignal(reality, signalFixture, signalRegistry, rdg, [entity], [event]), signal);
expectThrow(
  () => buildRealitySignal(reality, { ...signalFixture, eventReferences: ['RMO-EVENT-UNKNOWN-0001'] }, signalRegistry, rdg, [entity], [event]),
  'RMO_SIGNAL_EVENT_REFERENCE_UNKNOWN:RMO-EVENT-UNKNOWN-0001'
);
expectThrow(
  () => buildRealitySignal(reality, { ...clone(signalFixture), interpretation: {} }, signalRegistry, rdg, [entity], [event]),
  'RMO_SIGNAL_FIELD_FORBIDDEN:interpretation'
);
expectThrow(
  () => buildRealitySignal(reality, { ...signalFixture, dataNature: 'DERIVED' }, signalRegistry, rdg, [entity], [event]),
  'RMO_SIGNAL_INFERENCE_OR_DERIVATION_BOUNDARY_NOT_IMPLEMENTED'
);
expectThrow(
  () => buildRealitySignal(reality, { ...signalFixture, providerUsed: true }, signalRegistry, rdg, [entity], [event]),
  'RMO_SIGNAL_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);

assert.equal(acceptance.baselineCommit, '0732b3dfef7c15d3571d980887f1423b68eee6a2');
assert.deepEqual(acceptance.requiredWork, ['RMO-W0', 'RMO-W1', 'RMO-W2', 'RMO-W3', 'RMO-W4']);
assert.ok(Object.values(acceptance.acceptanceRules).every(value => value === true || value === false));
assert.equal(acceptance.acceptanceRules.evidencePromotionActivated, false);
assert.equal(acceptance.acceptanceRules.packageJsonModifiedByDelivery, false);
assert.equal(freeze.status, 'RMO-W0-W4-FOUNDATION-FROZEN');
assert.deepEqual(freeze.completedWork, ['RMO-W0', 'RMO-W1', 'RMO-W2', 'RMO-W3', 'RMO-W4']);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
assert.equal(freeze.deliveryBoundary.packageJsonModified, false);
assert.equal(freeze.nextWork, 'RMO-W5');
for (const output of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(path.join(root, output)), `frozen output missing: ${output}`);
}

const manualWiring = readText('docs/runtime/RMO-W0-W4-PACKAGE-MANUAL-WIRING.md');
assert.match(manualWiring, /"check:rmo-w0-w4": "node scripts\/check-rmo-w0-w4-reality-foundation\.mjs"/);
assert.match(manualWiring, /"check:rmo-foundation": "npm run check:rmo-w0-w4"/);
assert.match(manualWiring, /"check:rmo": "npm run check:rmo-foundation"/);
assert.match(manualWiring, /npm run check:icr-runtime && npm run check:rmo-foundation && node scripts\/check-exp-w4/);

for (const authority of audit.inspectedAuthorities) {
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority mutated during check: ${authority.reference}`);
}

console.log('✓ RMO-W0-W4 Canonical Reality Foundation passed.');
console.log('✓ Reality v1, Entity, Event and Signal are deterministic RMO records bound to ICR and governed by RDG.');
console.log('✓ Existing Runtime Timeline, persistence, Evidence promotion, Interpretation, Inference, Provider/AI and production execution remain inactive.');
