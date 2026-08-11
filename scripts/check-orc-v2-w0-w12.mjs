import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  applyEvent,
  checkDependencies,
  claimOperation,
  createCase,
  loadOrcContracts,
  recoverFromLastCommitted,
  replayCase,
  stableDigest
} from './lib/orc-v2-runtime.mjs';

const root = process.cwd();
const readText = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = file => JSON.parse(readText(file));
const hash = file => crypto.createHash('sha256').update(readText(file), 'utf8').digest('hex');
const exists = file => fs.existsSync(path.join(root, file));

const base = 'content/runtime/cross-runtime-orchestration';
const contracts = loadOrcContracts(root);

// W0 — Boundary and migration.
assert.equal(contracts.authority.runtimeCode, 'ORC');
assert.equal(contracts.authority.coreBoundary.coordinates, true);
assert.equal(contracts.authority.coreBoundary.decides, false);
assert.equal(contracts.authority.coreBoundary.ownsDomainAuthority, false);
assert.equal(contracts.authority.migration.legacyRuntime, 'ORC_V1');
assert.equal(contracts.authority.migration.legacyScope, 'ORC-W0-W4');
assert.equal(contracts.authority.migration.successorScope, 'ORC-W0-W12');
assert.equal(contracts.authority.migration.legacyFreezeMutationAllowed, false);

const migration = read('content/governance/canonical-master-work/registries/canonical-master-work-migration-registry-v1.json');
const orcMigration = migration.entries.find(item => item.legacyRuntime === 'ORC_V1');
assert.ok(orcMigration, 'ORC_V1_MIGRATION_MISSING');
assert.equal(orcMigration.legacyWorkCode, 'ORC-W0-W4');
assert.equal(orcMigration.canonicalWorkCode, 'ORC-W0-W12');
assert.equal(orcMigration.migrationStatus, 'UPGRADED');
assert.equal(orcMigration.freezeImpact, 'NO_SILENT_MUTATION');

const master = read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const orcWorks = master.entries.filter(item => item.runtimeCode === 'ORC');
assert.deepEqual(orcWorks.map(item => item.workCode), Array.from({length: 13}, (_, i) => `ORC-W${i}`));
assert.ok(orcWorks.every(item => item.status === 'PLANNED'), 'ORC_IMPLEMENTATION_MUST_NOT_SILENTLY_MUTATE_MASTER_WORK_STATE');

const rdg = read('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const rdgOrc = rdg.entries.find(item => item.runtimeCode === 'ORC');
assert.ok(rdgOrc, 'RDG_ORC_CONTRACT_MISSING');
assert.deepEqual(rdgOrc.producedDataTypes, ['SYSTEM_OPERATION_RECORD']);
assert.deepEqual(rdgOrc.consumedDataTypes, ['RUNTIME_STATE_RECORD', 'GOVERNANCE_RECORD']);
assert.deepEqual(rdgOrc.writeAuthority.dataTypes, ['SYSTEM_OPERATION_RECORD']);

// W1 — Canonical state machine and governed optional paths.
const expectedStates = [
  'CASE_OPENED','CONSENT_VALID','INPUT_VERIFIED','REALITY_INITIALIZED','METHOD_CALCULATED',
  'PROJECTION_FROZEN','MEANING_RESOLVED','KNOWLEDGE_COVERAGE_CHECKED','READOUT_GENERATED',
  'JOURNEY_ACTIVATED','PROFESSIONAL_HANDOFF','PROFESSIONAL_DECISION','REPORT_ASSEMBLED',
  'REPORT_APPROVED','REPORT_RELEASED','ACTION_RECORDED','OUTCOME_OBSERVED','REVIEW','CONTINUITY'
];
assert.deepEqual(contracts.machine.states.map(item => item.stateCode), expectedStates);
assert.equal(contracts.machine.rules.notEveryServiceUsesEveryState, true);
assert.equal(contracts.machine.rules.optionalPathMustBeGoverned, true);
const order = new Map(expectedStates.map((state, index) => [state, index]));
for (const profile of contracts.machine.serviceProfiles) {
  assert.ok(profile.governedStatePath.length > 0, profile.profileCode);
  for (let i = 1; i < profile.governedStatePath.length; i++) {
    assert.ok(order.get(profile.governedStatePath[i]) > order.get(profile.governedStatePath[i - 1]), `${profile.profileCode}:ORDER`);
  }
}
const optionalFixture = read(`${base}/fixtures/orc-optional-path-v2.json`);
const optionalProfile = contracts.machine.serviceProfiles.find(item => item.profileCode === optionalFixture.serviceProfile);
assert.deepEqual(optionalFixture.expectedPath, optionalProfile.governedStatePath);
assert.ok(optionalFixture.forbiddenInference.every(state => !optionalProfile.governedStatePath.includes(state)));

// W2 — Event registry.
const eventCodes = contracts.events.events.map(item => item.eventCode);
assert.equal(new Set(eventCodes).size, eventCodes.length);
for (const code of [
  'CONSENT_VALIDATED','INPUT_VERIFIED','METHOD_CALCULATED','READOUT_READY',
  'PROFESSIONAL_REVIEW_REQUIRED','REPORT_RELEASED','OUTCOME_OBSERVED'
]) assert.ok(eventCodes.includes(code), `EVENT_MISSING:${code}`);
assert.ok(contracts.events.events.every(item => item.payloadPolicy === 'REFERENCE_ONLY'));

// W3 — Dependency enforcement.
const emptyMethodCtx = createCase({caseId:'NEG-METHOD', serviceProfile:'METHOD_READOUT'}, contracts);
emptyMethodCtx.committedStates = ['CASE_OPENED','CONSENT_VALID','INPUT_VERIFIED','REALITY_INITIALIZED'];
emptyMethodCtx.currentState = 'REALITY_INITIALIZED';
assert.ok(checkDependencies(emptyMethodCtx, 'METHOD_CALCULATED', contracts).some(x => x.includes('METHOD_ELIGIBILITY_CONFIRMED')));

const reportCtx = createCase({caseId:'NEG-REPORT', serviceProfile:'PROFESSIONAL_REPORT'}, contracts);
reportCtx.committedStates = [
  'CASE_OPENED','CONSENT_VALID','INPUT_VERIFIED','REALITY_INITIALIZED','METHOD_CALCULATED',
  'PROJECTION_FROZEN','MEANING_RESOLVED','KNOWLEDGE_COVERAGE_CHECKED','READOUT_GENERATED',
  'JOURNEY_ACTIVATED','PROFESSIONAL_HANDOFF','REPORT_ASSEMBLED'
];
reportCtx.currentState = 'REPORT_ASSEMBLED';
assert.ok(checkDependencies(reportCtx, 'REPORT_APPROVED', contracts).some(x => x.includes('PROFESSIONAL_DECISION')));

// W4 — Failure classes.
assert.deepEqual(contracts.failures.failureClasses.map(item => item.code), [
  'RETRYABLE','NON_RETRYABLE','BLOCKED','MANUAL_REVIEW','DATA_CORRECTION_REQUIRED'
]);
assert.equal(contracts.failures.rules.retryMayNotBypassDependency, true);

// W6 — Explicit operation idempotency for protected operation classes.
const opCtx = createCase({caseId:'IDEM-001', serviceProfile:'SELF_GUIDED_READOUT'}, contracts);
for (const operationClass of ['CASE','REPORT','PAYMENT','PROJECTION','ACTION']) {
  const first = claimOperation(opCtx, {
    operationClass, operationCode:`${operationClass}.TEST`,
    authorityReference:`AUTH-${operationClass}`, requestIdentity:'same-request'
  });
  const second = claimOperation(opCtx, {
    operationClass, operationCode:`${operationClass}.TEST`,
    authorityReference:`AUTH-${operationClass}`, requestIdentity:'same-request'
  });
  assert.equal(first.replayed, false);
  assert.equal(second.status, 'REPLAYED_NO_DUPLICATE');
}
assert.equal(opCtx.operationRecords.length, 5);

// W7 — Invalid transition must be all-or-nothing.
const atomicCtx = createCase({caseId:'ATOMIC-001', serviceProfile:'SELF_GUIDED_READOUT'}, contracts);
const snapshot = JSON.stringify({
  currentState: atomicCtx.currentState, committedStates: atomicCtx.committedStates,
  auditTimeline: atomicCtx.auditTimeline, operationRecords: atomicCtx.operationRecords
});
assert.throws(() => applyEvent(atomicCtx, {
  eventCode:'READOUT_READY', eventId:'BAD-1', caseId:'ATOMIC-001', authorityRuntime:'RRE',
  authorityReference:'RRE-REF-BAD', requestIdentity:'bad-order', externalSideEffect:false
}, {contracts}), /ORC_STATE_ORDER_BLOCKED/);
assert.equal(JSON.stringify({
  currentState: atomicCtx.currentState, committedStates: atomicCtx.committedStates,
  auditTimeline: atomicCtx.auditTimeline, operationRecords: atomicCtx.operationRecords
}), snapshot);

// W11 vertical slice also proves W5, W8 and W10.
const pilot = read(`${base}/fixtures/orc-pilot-vertical-slice-v2.json`);
assert.equal(pilot.fixtureNature, 'PILOT_ACCEPTANCE_FIXTURE');
assert.equal(pilot.pilotRuntimeAuthorityActivated, false);
const live = createCase({caseId:pilot.caseId, serviceProfile:pilot.serviceProfile}, contracts);
for (const event of pilot.events) applyEvent(live, event, {contracts});
assert.equal(live.currentState, pilot.expected.finalState);
assert.equal(live.committedStates.length, pilot.expected.committedStateCount);
assert.equal(live.auditTimeline.length, pilot.expected.committedStateCount);
assert.equal(live.externalSideEffectsExecuted, 0);
assert.deepEqual(live.auditTimeline.map(item => item.toState), expectedStates);

// W5 — Recovery uses only last committed canonical state.
const recovery = recoverFromLastCommitted(live);
assert.equal(recovery.recoveryAnchor, 'LAST_COMMITTED_CANONICAL_STATE');
assert.equal(recovery.state, 'CONTINUITY');
assert.equal(recovery.guessed, false);

// W8 — Every state transition is in append-only audit timeline and contains no domain payload.
for (const entry of live.auditTimeline) {
  for (const field of contracts.audit.requiredFields) assert.ok(Object.hasOwn(entry, field), `AUDIT_FIELD:${field}`);
  assert.equal(Object.hasOwn(entry, 'payload'), false);
}

// W10 — Deterministic replay, no external side effects.
const replay1 = replayCase({caseId:pilot.caseId, serviceProfile:pilot.serviceProfile, events:pilot.events}, contracts);
const replay2 = replayCase({caseId:pilot.caseId, serviceProfile:pilot.serviceProfile, events:pilot.events}, contracts);
assert.equal(replay1.finalState, 'CONTINUITY');
assert.equal(replay1.determinismDigest, replay2.determinismDigest);
assert.equal(replay1.externalSideEffectsExecuted, 0);
assert.equal(replay2.externalSideEffectsExecuted, 0);
const liveDigest = stableDigest(live.auditTimeline.map(({replay, ...entry}) => entry));
assert.equal(replay1.determinismDigest, liveDigest);

// W9 — RG post-freeze successor registration without silent v3 mutation.
const v3 = read('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v3.json');
const v4 = read('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v4.json');
assert.equal(v4.predecessorMutated, false);
for (const entry of v3.entries) {
  const successorEntry = v4.entries.find(item => item.runtimeCode === entry.runtimeCode && item.workCode === entry.workCode);
  assert.deepEqual(successorEntry, entry, `RG_V3_ENTRY_DRIFT:${entry.runtimeCode}:${entry.workCode}`);
}
const orcRg = v4.entries.filter(item => item.runtimeCode === 'ORC');
assert.equal(orcRg.length, 13);
assert.deepEqual(orcRg.map(item => item.workCode), Array.from({length:13}, (_, i) => `ORC-W${i}`));
for (const entry of orcRg) {
  assert.equal(entry.implementationFile, 'scripts/check-orc-v2-w0-w12.mjs');
  assert.equal(entry.implementationDigest, hash('scripts/check-orc-v2-w0-w12.mjs'));
}

const groupV2 = read('content/governance/runtime-checker-governance/registries/runtime-checker-group-registry-v2.json');
assert.deepEqual(groupV2.groups.find(item => item.groupCode === 'ORC').runtimeCodes, ['ORC']);
assert.ok(groupV2.groups.find(item => item.groupCode === 'ALL_REGISTERED').runtimeCodes.includes('ORC'));

const rgRecon = read('docs/governance/reconciliation/orc-w9-rg-post-freeze-registration-v1.json');
assert.equal(rgRecon.historicalRgFreezeRewritten, false);
assert.equal(rgRecon.historicalAliasV3Rewritten, false);
assert.equal(rgRecon.globalCutoverDeferred, true);
assert.equal(rgRecon.authorityExpansionGranted, false);

const rgFreeze = read('content/governance/runtime-checker-governance/freeze/rg-w9-w15-runtime-checker-governance-freeze-v1.json');
assert.equal(rgFreeze.status, 'frozen');
assert.equal(rgFreeze.resolutionAuthority, 'runtime-checker-alias-registry-v3.json');

const pkg = read('package.json');
assert.equal(pkg.scripts['check:runtime'], 'node scripts/run-runtime-checker-v3.mjs');
assert.equal(pkg.scripts['check:runtime:v4'], 'node scripts/run-runtime-checker-v4.mjs');
assert.equal(pkg.scripts['check:orc-w0-w12'], 'node scripts/check-orc-v2-w0-w12.mjs');

// W11 acceptance.
const acceptance = read(`${base}/acceptance/orc-v2-vertical-slice-acceptance-v1.json`);
assert.equal(acceptance.status, 'accepted');
assert.equal(acceptance.pilotRuntimeAuthorityActivated, false);
assert.equal(acceptance.finalState, 'CONTINUITY');
assert.equal(acceptance.externalSideEffectsExecutedDuringReplay, 0);

// W12 Freeze and exact artifact digests.
const freeze = read(`${base}/freeze/orc-v2-freeze-v1.json`);
assert.equal(freeze.status, 'ORC_V2_FROZEN');
assert.equal(freeze.scope, 'ORC-W0-W12');
assert.equal(freeze.authority.domainAuthorityAcquired, false);
assert.equal(freeze.rgIntegration.globalRgV3Mutated, false);
for (const artifact of freeze.frozenArtifacts) {
  assert.ok(exists(artifact.path), `FREEZE_ARTIFACT_MISSING:${artifact.path}`);
  assert.equal(hash(artifact.path), artifact.sha256, `FREEZE_DIGEST_DRIFT:${artifact.path}`);
}

console.log('✓ ORC-W0-W12 Cross-Runtime Orchestration v2 passed.');
console.log('✓ ORC coordinates canonical state, dependencies, failures, recovery, idempotency, atomic commits and audit timeline without domain decision authority.');
console.log('✓ Operational replay is deterministic and re-executes no external side effects.');
console.log('✓ RG registration uses an explicit v4 successor extension; frozen RG v1/v3 and global check:runtime remain untouched.');
console.log('✓ PILOT vertical slice fixture reaches Continuity without activating PHASE PILOT runtime authority.');
console.log('✓ ORC v2 Frozen.');
