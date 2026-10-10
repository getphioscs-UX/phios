import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  buildCanonicalInput,
  stableDigest,
  verifyCanonicalInput
} from './lib/input-case-runtime/icr-input-foundation-v1.mjs';
import {
  assertCanonicalCaseDigest,
  assertRealityInitializationRequestDigest,
  buildCanonicalCase,
  buildRdgLifecycleReferences,
  buildRealityInitializationRequest,
  reviseCanonicalCase
} from './lib/input-case-runtime/icr-case-runtime-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const hashFile = relative => crypto.createHash('sha256')
  .update(normalizeText(readText(relative)), 'utf8')
  .digest('hex');
const clone = value => structuredClone(value);
const sorted = values => [...values].sort();
const expectThrow = (fn, code) => assert.throws(
  fn,
  error => error?.message?.startsWith(code),
  `Expected error starting with ${code}`
);

const base = 'content/runtime/input-case-runtime';
const audit = readJson(`${base}/audits/icr-case-runtime-authority-audit-v1.json`);
const caseContract = readJson(`${base}/contracts/canonical-case-runtime-v1.json`);
const rdgContract = readJson(`${base}/contracts/icr-rdg-integration-v1.json`);
const realityHandoffContract = readJson(`${base}/contracts/canonical-reality-initialization-handoff-v1.json`);
const versioningContract = readJson(`${base}/contracts/case-versioning-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/icr-w0-w9-acceptance-contract-v1.json`);
const stateRegistry = readJson(`${base}/registries/case-state-transition-registry-v1.json`);
const rdgReferenceRegistry = readJson(`${base}/registries/icr-rdg-reference-registry-v1.json`);
const preservation = readJson(`${base}/freeze/icr-w0-w4-byte-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/icr-w0-w9-freeze-v1.json`);
const caseRequestFixture = readJson(`${base}/fixtures/canonical-case.request.valid.json`);
const realityRequestFixture = readJson(`${base}/fixtures/reality-initialization.request.valid.json`);
const revisionRequestFixture = readJson(`${base}/fixtures/case-revision.request.valid.json`);

const canonicalInputContract = readJson(`${base}/contracts/canonical-input-contract-v1.json`);
const inputTypeRegistry = readJson(`${base}/registries/canonical-input-type-registry-v1.json`);
const canonicalInputRequest = readJson(`${base}/fixtures/canonical-input.request.valid.json`);
const verificationRequest = readJson(`${base}/fixtures/input-verification.request.valid.json`);

const rdg = {
  purposes: readJson('content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json'),
  consents: readJson('content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json'),
  persistence: readJson('content/governance/reality-data-governance/registries/canonical-persistence-class-registry-v1.json'),
  retention: readJson('content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json'),
  sensitivity: readJson('content/governance/reality-data-governance/registries/canonical-data-sensitivity-registry-v1.json'),
  deletion: readJson('content/governance/reality-data-governance/contracts/deletion-tombstone-runtime-v1.json')
};
const rdgAuthority = readJson('content/governance/reality-data-governance/registries/reality-data-registry-v1.json');
const persistenceGate = readJson('content/governance/reality-data-governance/contracts/persistence-eligibility-gate-v1.json');
const dataContracts = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const planeRegistry = readJson('content/governance/canonical-master-work/registries/canonical-runtime-plane-registry-v1.json');
const dependencyRegistry = readJson('content/governance/canonical-master-work/registries/canonical-runtime-dependency-registry-v1.json');
const crossAuthority = readJson('content/professional/cross-runtime-authority/runtime-authority-registry-v1.json');

assert.equal(audit.baselineCommit, '1e99186e5bc5fafa705f61cc15ef57370bec07e9');
assert.equal(audit.status, 'reconciled');
assert.equal(audit.scope, 'ICR-W5-W9 Canonical Case Runtime');
for (const authority of audit.inspectedAuthorities) {
  assert.equal(hashFile(authority.reference), authority.sha256, `authority drift: ${authority.reference}`);
}
assert.equal(audit.authorityDecision.canonicalCaseOwner, 'ICR');
assert.equal(audit.authorityDecision.persistenceConsentRetentionDeletionOwner, 'RDG');
assert.equal(audit.authorityDecision.realityV1Owner, 'RMO');
assert.equal(audit.authorityDecision.icrMayCreateRealityV1, false);
assert.equal(audit.existingRuntimeOrUserDataMutated, false);

assert.equal(preservation.files.length, 20);
for (const file of preservation.files) {
  assert.ok(fs.existsSync(path.join(root, file.path)), `preserved file missing: ${file.path}`);
  assert.equal(hashFile(file.path), file.sha256, `ICR-W0-W4 byte drift: ${file.path}`);
}
assert.equal(preservation.rules.w5W9MayRewriteW0W4, false);

const icrWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'ICR');
const rmoWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'RMO');
assert.deepEqual(icrWorks.map(entry => entry.workCode), Array.from({ length: 10 }, (_, index) => `ICR-W${index}`));
assert.deepEqual(rmoWorks.map(entry => entry.workCode), Array.from({ length: 16 }, (_, index) => `RMO-W${index}`));
assert.ok(icrWorks.every(entry => entry.status === 'PLANNED'));
assert.ok(rmoWorks.every(entry => entry.status === 'PLANNED'));
assert.equal(icrWorks.at(-1).executionOrder + 1, rmoWorks[0].executionOrder);
for (const code of ['ICR', 'RMO']) {
  assert.equal(planeRegistry.assignments.find(entry => entry.code === code)?.plane, 'RUNTIME');
}
assert.equal(planeRegistry.assignments.find(entry => entry.code === 'RDG')?.plane, 'GOVERNANCE');
assert.equal(dependencyRegistry.entries.some(entry => ['ICR', 'RMO'].includes(entry.runtimeCode)), false);

const inputAuthority = crossAuthority.authorities.find(entry => entry.authorityCode === 'INPUT_AUTHORITY');
assert.equal(inputAuthority.runtimeAuthority, 'SHARED_DATA_AUTHORITY');
const icrDataContract = dataContracts.entries.find(entry => entry.runtimeCode === 'ICR');
const rmoDataContract = dataContracts.entries.find(entry => entry.runtimeCode === 'RMO');
assert.deepEqual(sorted(icrDataContract.producedDataTypes), ['METHOD_INPUT_RECORD', 'REALITY_INPUT_RECORD']);
assert.deepEqual(sorted(icrDataContract.writeAuthority.dataTypes), ['METHOD_INPUT_RECORD', 'REALITY_INPUT_RECORD']);
assert.ok(rmoDataContract.consumedDataTypes.includes('REALITY_INPUT_RECORD'));
assert.deepEqual(rmoDataContract.producedDataTypes, ['RUNTIME_STATE_RECORD']);
assert.deepEqual(rmoDataContract.writeAuthority.dataTypes, ['RUNTIME_STATE_RECORD']);
assert.equal(icrDataContract.permissions.evidencePromotion, 'DENY');
assert.equal(rmoDataContract.permissions.evidencePromotion, 'DENY');

assert.equal(rdgAuthority.containsUserData, false);
assert.equal(rdgAuthority.containsRuntimePayloads, false);
assert.equal(rdgAuthority.rules.secondDataAuthorityCreated, false);
assert.equal(persistenceGate.rules.providerMayDecide, false);
assert.equal(persistenceGate.rules.missingRequiredGovernanceFailsClosed, true);
assert.equal(rdgReferenceRegistry.authority, 'RDG');
assert.equal(rdgReferenceRegistry.copiedPolicyEntries.length, 0);
assert.equal(rdgReferenceRegistry.instances.length, 0);
for (const reference of Object.values(rdgReferenceRegistry.references)) {
  assert.ok(fs.existsSync(path.join(root, reference)), `RDG reference missing: ${reference}`);
}

assert.equal(caseContract.dataType, 'REALITY_INPUT_RECORD');
assert.equal(caseContract.rules.caseIsReality, false);
assert.equal(caseContract.rules.caseIsRuntimeState, false);
assert.equal(caseContract.rules.caseStoresVerifiedInputPayload, false);
assert.equal(caseContract.rules.persistentStoreActivated, false);
assert.equal(rdgContract.legacyPrivacyAndRetentionStatus, 'MOVED_TO_RDG');
assert.equal(rdgContract.integrationMode, 'REFERENCE_ONLY');
assert.equal(rdgContract.rules.icrMayGrantPersistence, false);
assert.equal(rdgContract.rules.icrMayExtendRetention, false);
assert.equal(rdgContract.rules.icrMayExecuteDeletion, false);
assert.equal(realityHandoffContract.icrOutput, 'Reality Initialization Request');
assert.equal(realityHandoffContract.rmoOutput, 'Reality v1');
assert.equal(realityHandoffContract.rules.icrMayCreateRealityV1, false);
assert.equal(realityHandoffContract.rules.rmoProductionExecutionActivated, false);
assert.equal(versioningContract.rules.versionMutationInPlaceForbidden, true);
assert.equal(versioningContract.rules.persistentVersionStoreActivated, false);
assert.equal(stateRegistry.instances.length, 0);
assert.equal(stateRegistry.states.find(entry => entry.state === 'CLOSED').terminal, true);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateRdgLifecycle = ajv.compile(readJson(`${base}/schemas/icr-rdg-lifecycle-reference-v1.schema.json`));
const validateCase = ajv.compile(readJson(`${base}/schemas/canonical-case-v1.schema.json`));
const validateRealityRequest = ajv.compile(readJson(`${base}/schemas/reality-initialization-request-v1.schema.json`));
const validateRevisionRequest = ajv.compile(readJson(`${base}/schemas/case-version-request-v1.schema.json`));

function buildVerifiedPair() {
  const canonicalOne = buildCanonicalInput(
    canonicalInputRequest,
    inputTypeRegistry,
    rdg,
    canonicalInputContract
  );
  const verifiedOne = verifyCanonicalInput(canonicalOne, verificationRequest, inputTypeRegistry, rdg);

  const secondCanonicalRequest = clone(canonicalInputRequest);
  secondCanonicalRequest.canonicalInputCode = 'ICR-INPUT-BIRTH-VALIDATION-0002';
  secondCanonicalRequest.canonicalInputVersion = '1.0.1';
  secondCanonicalRequest.declaredAt = '2026-08-10T06:30:00.000Z';
  secondCanonicalRequest.payload.birthData.localTime = '10:31:00';
  secondCanonicalRequest.lineage.previousCanonicalInputReference = canonicalOne.canonicalInputCode;
  const canonicalTwo = buildCanonicalInput(
    secondCanonicalRequest,
    inputTypeRegistry,
    rdg,
    canonicalInputContract
  );
  const secondVerificationRequest = clone(verificationRequest);
  secondVerificationRequest.verifiedInputCode = 'ICR-VERIFIED-BIRTH-VALIDATION-0002';
  secondVerificationRequest.verifiedInputVersion = '1.0.1';
  secondVerificationRequest.verificationCode = 'ICR-VERIFY-BIRTH-VALIDATION-0002';
  secondVerificationRequest.verifiedAt = '2026-08-10T06:40:00.000Z';
  for (const [index, binding] of secondVerificationRequest.authorityBindings.entries()) {
    binding.bindingCode = binding.bindingCode.replace('0001', '0002');
    binding.recordId = binding.recordId.replace('0001', '0002');
    binding.recordVersion = '1.0.1';
    binding.recordDigest = String(index + 4).repeat(64);
  }
  const verifiedTwo = verifyCanonicalInput(
    canonicalTwo,
    secondVerificationRequest,
    inputTypeRegistry,
    rdg
  );
  return [verifiedOne, verifiedTwo];
}

const verifiedInputs = buildVerifiedPair();
const lifecycleReferences = buildRdgLifecycleReferences(
  caseRequestFixture.governanceBindings,
  caseRequestFixture.rdgLifecycleReferenceRequest,
  rdg,
  rdgReferenceRegistry
);
assert.equal(validateRdgLifecycle(lifecycleReferences), true, JSON.stringify(validateRdgLifecycle.errors));
assert.equal(lifecycleReferences.mode, 'RDG_REFERENCE_ONLY');
assert.equal(lifecycleReferences.consentReference, caseRequestFixture.governanceBindings.consentReference);
assert.equal(lifecycleReferences.retentionClass, caseRequestFixture.governanceBindings.retentionClass);
assert.equal(Object.hasOwn(lifecycleReferences, 'duration'), false);
assert.equal(Object.hasOwn(lifecycleReferences, 'expiryBehavior'), false);

const caseRequest = clone(caseRequestFixture);
caseRequest.changeReferences.push('CASE-REQUEST-VALIDATION-0002');
const canonicalCase = buildCanonicalCase(
  caseRequest,
  verifiedInputs,
  stateRegistry,
  rdg,
  rdgReferenceRegistry
);
assert.equal(validateCase(canonicalCase), true, JSON.stringify(validateCase.errors));
assertCanonicalCaseDigest(canonicalCase);
assert.equal(canonicalCase.caseStatus, 'READY_FOR_RMO');
assert.equal(canonicalCase.operationalMode, 'VALIDATION_ONLY');
assert.equal(canonicalCase.persistentStoreWriteAllowed, false);
assert.equal(canonicalCase.rmoRealityWriteAllowed, false);
assert.equal(Object.hasOwn(canonicalCase, 'payload'), false);
assert.equal(Object.hasOwn(canonicalCase, 'reality'), false);
assert.equal(canonicalCase.verifiedInputReferences.length, 2);
assert.deepEqual(
  canonicalCase.verifiedInputReferences.map(entry => entry.verifiedInputCode),
  sorted(canonicalCase.verifiedInputReferences.map(entry => entry.verifiedInputCode))
);

const reorderedCaseRequest = clone(caseRequest);
reorderedCaseRequest.changeReferences.reverse();
reorderedCaseRequest.governanceBindings.purposeCodes.reverse();
const repeatedCase = buildCanonicalCase(
  reorderedCaseRequest,
  [...verifiedInputs].reverse(),
  stateRegistry,
  rdg,
  rdgReferenceRegistry
);
assert.deepEqual(repeatedCase, canonicalCase);
assert.equal(repeatedCase.caseDigest, canonicalCase.caseDigest);

const forbiddenCaseRequest = { ...clone(caseRequest), customerRecord: { id: 'FORBIDDEN' } };
expectThrow(
  () => buildCanonicalCase(forbiddenCaseRequest, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_DIRECT_DATA_FIELD_FORBIDDEN:'
);
const providerCaseRequest = { ...clone(caseRequest), providerUsed: true };
expectThrow(
  () => buildCanonicalCase(providerCaseRequest, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const badLifecycleRequest = {
  ...caseRequest.rdgLifecycleReferenceRequest,
  duration: 'INDEFINITE'
};
expectThrow(
  () => buildRdgLifecycleReferences(caseRequest.governanceBindings, badLifecycleRequest, rdg, rdgReferenceRegistry),
  'ICR_RDG_POLICY_COPY_FORBIDDEN:'
);
const badPersistenceReference = { persistenceDecisionReference: 'ALLOW_SERVICE_SCOPE' };
expectThrow(
  () => buildRdgLifecycleReferences(caseRequest.governanceBindings, badPersistenceReference, rdg, rdgReferenceRegistry),
  'ICR_RDG_PERSISTENCE_DECISION_REFERENCE_INVALID'
);
const partialVerificationRequest = clone(verificationRequest);
partialVerificationRequest.fieldDecisions[0].state = 'UNKNOWN';
partialVerificationRequest.fieldDecisions[0].evidenceReferences = [];
const partialCanonical = buildCanonicalInput(
  canonicalInputRequest,
  inputTypeRegistry,
  rdg,
  canonicalInputContract
);
const partialVerified = verifyCanonicalInput(
  partialCanonical,
  partialVerificationRequest,
  inputTypeRegistry,
  rdg
);
expectThrow(
  () => buildCanonicalCase(caseRequest, [partialVerified], stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_VERIFIED_INPUT_INELIGIBLE'
);

const realityRequest = buildRealityInitializationRequest(
  canonicalCase,
  realityRequestFixture,
  stateRegistry
);
assert.equal(validateRealityRequest(realityRequest), true, JSON.stringify(validateRealityRequest.errors));
assertRealityInitializationRequestDigest(realityRequest);
assert.equal(realityRequest.targetRuntimeCode, 'RMO');
assert.equal(realityRequest.targetWorkCode, 'RMO-W1');
assert.equal(realityRequest.requestedObject, 'REALITY_V1');
assert.equal(realityRequest.requestedOutputDataType, 'RUNTIME_STATE_RECORD');
assert.equal(realityRequest.rmoAcceptanceRequired, true);
assert.equal(realityRequest.rmoExecutionActivated, false);
assert.equal(realityRequest.realityObjectCreated, false);
assert.equal(Object.hasOwn(realityRequest, 'reality'), false);
assert.equal(Object.hasOwn(realityRequest, 'realityCode'), false);
assert.deepEqual(
  buildRealityInitializationRequest(canonicalCase, realityRequestFixture, stateRegistry),
  realityRequest
);
const realityPayloadRequest = { ...clone(realityRequestFixture), reality: {} };
expectThrow(
  () => buildRealityInitializationRequest(canonicalCase, realityPayloadRequest, stateRegistry),
  'ICR_RMO_HANDOFF_DIRECT_DATA_FIELD_FORBIDDEN:'
);
const deletionBlockedCaseRequest = clone(caseRequest);
deletionBlockedCaseRequest.governanceBindings.deletionState = 'DELETION_REQUESTED';
const deletionBlockedCase = buildCanonicalCase(
  deletionBlockedCaseRequest,
  verifiedInputs,
  stateRegistry,
  rdg,
  rdgReferenceRegistry
);
expectThrow(
  () => buildRealityInitializationRequest(deletionBlockedCase, realityRequestFixture, stateRegistry),
  'ICR_RMO_HANDOFF_RDG_DELETION_STATE_BLOCKED'
);
const tamperedCase = clone(canonicalCase);
tamperedCase.caseStatus = 'CLOSED';
expectThrow(() => assertCanonicalCaseDigest(tamperedCase), 'ICR_CASE_DIGEST_INVALID');

assert.equal(validateRevisionRequest(revisionRequestFixture), true, JSON.stringify(validateRevisionRequest.errors));
const originalCaseBeforeRevision = clone(canonicalCase);
const revisedCase = reviseCanonicalCase(
  canonicalCase,
  revisionRequestFixture,
  verifiedInputs,
  stateRegistry,
  rdg,
  rdgReferenceRegistry
);
assert.deepEqual(canonicalCase, originalCaseBeforeRevision);
assert.equal(validateCase(revisedCase), true, JSON.stringify(validateCase.errors));
assertCanonicalCaseDigest(revisedCase);
assert.equal(revisedCase.caseCode, canonicalCase.caseCode);
assert.equal(revisedCase.caseVersion, '1.0.1');
assert.equal(revisedCase.caseVersionSequence, 2);
assert.equal(revisedCase.caseStatus, 'HANDED_OFF_TO_RMO');
assert.equal(revisedCase.lineage.previousCaseVersion, canonicalCase.caseVersion);
assert.equal(revisedCase.lineage.previousCaseDigest, canonicalCase.caseDigest);
assert.notEqual(revisedCase.caseDigest, canonicalCase.caseDigest);
expectThrow(
  () => buildRealityInitializationRequest(revisedCase, realityRequestFixture, stateRegistry),
  'ICR_RMO_HANDOFF_CASE_INELIGIBLE'
);

const badSequenceRevision = { ...clone(revisionRequestFixture), nextCaseVersionSequence: 4 };
expectThrow(
  () => reviseCanonicalCase(canonicalCase, badSequenceRevision, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_VERSION_SEQUENCE_INVALID'
);
const badVersionRevision = { ...clone(revisionRequestFixture), nextCaseVersion: '1.0.0' };
expectThrow(
  () => reviseCanonicalCase(canonicalCase, badVersionRevision, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_VERSION_NOT_INCREASED'
);
const badTransitionRevision = { ...clone(revisionRequestFixture), nextStatus: 'DRAFT' };
expectThrow(
  () => reviseCanonicalCase(canonicalCase, badTransitionRevision, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_STATE_TRANSITION_FORBIDDEN'
);
const providerRevision = { ...clone(revisionRequestFixture), providerUsed: true };
expectThrow(
  () => reviseCanonicalCase(canonicalCase, providerRevision, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);

const closeRevision = clone(revisionRequestFixture);
closeRevision.nextCaseVersion = '1.0.2';
closeRevision.nextCaseVersionSequence = 3;
closeRevision.nextStatus = 'CLOSED';
closeRevision.revisedAt = '2026-08-10T07:30:00.000Z';
closeRevision.changeReferences = ['CASE-CLOSE-VALIDATION-0001'];
const closedCase = reviseCanonicalCase(
  revisedCase,
  closeRevision,
  verifiedInputs,
  stateRegistry,
  rdg,
  rdgReferenceRegistry
);
const reopenRevision = clone(closeRevision);
reopenRevision.nextCaseVersion = '1.0.3';
reopenRevision.nextCaseVersionSequence = 4;
reopenRevision.nextStatus = 'READY_FOR_RMO';
reopenRevision.revisedAt = '2026-08-10T07:40:00.000Z';
expectThrow(
  () => reviseCanonicalCase(closedCase, reopenRevision, verifiedInputs, stateRegistry, rdg, rdgReferenceRegistry),
  'ICR_CASE_STATE_TRANSITION_FORBIDDEN'
);

assert.equal(acceptance.status, 'acceptance_closed');
assert.ok(acceptance.acceptanceGates.every(gate => gate.required === true));
for (const gate of acceptance.acceptanceGates) {
  assert.ok(fs.existsSync(path.join(root, gate.evidence)), `acceptance evidence missing: ${gate.evidence}`);
}
assert.equal(acceptance.rules.packageJsonModifiedByDelivery, false);
assert.equal(freeze.status, 'ICR-v1.0.0-FROZEN');
assert.deepEqual(freeze.completedWork, Array.from({ length: 10 }, (_, index) => `ICR-W${index}`));
assert.equal(freeze.closedBoundaries.icrCreatesRealityV1, false);
assert.equal(freeze.closedBoundaries.icrOwnsPrivacyOrRetention, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
assert.equal(freeze.deliveryBoundary.packageJsonModified, false);
assert.equal(freeze.deliveryBoundary.packageWiringProvidedForManualEntry, true);
assert.ok(!freeze.frozenOutputs.includes('package.json'));
for (const output of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(path.join(root, output)), `freeze output missing: ${output}`);
}

const manualWiring = readText('docs/runtime/ICR-W5-W9-PACKAGE-MANUAL-WIRING.md');
assert.match(manualWiring, /"check:icr-w5-w9": "node scripts\/check-icr-w5-w9-canonical-case-runtime\.mjs"/);
assert.match(manualWiring, /"check:icr-runtime": "npm run check:icr-w5-w9"/);
assert.match(manualWiring, /"check:icr": "npm run check:icr-foundation && npm run check:icr-runtime"/);
assert.match(manualWiring, /npm run check:icr-foundation && npm run check:icr-runtime && node scripts\/check-exp-w4/);

console.log('✓ ICR-W5-W9 Canonical Case Runtime passed.');
console.log('✓ ICR references RDG persistence, consent, retention and deletion without owning or copying policy.');
console.log('✓ Verified Inputs hand off to RMO through an immutable Case; ICR does not create Reality v1 or activate persistence.');
