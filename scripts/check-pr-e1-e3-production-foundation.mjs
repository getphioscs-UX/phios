import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  authorizeProfessionalAccess,
  buildProfessionalCase
} from './lib/professional-runtime/pr-v2.mjs';
import {
  buildProfessionalCasePersistenceIntent,
  evaluateProfessionalProductionActivation,
  materializeProfessionalCaseVersion,
  resolveProfessionalEvidencePackage
} from './lib/professional-runtime/pr-production-extension-v1.mjs';

const root = process.cwd();
const base = 'content/runtime/professional-runtime/extensions/production';
const readText = file => fs.readFile(path.join(root, file), 'utf8');
const read = async file => JSON.parse(await readText(file));
const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digestFile = async file => crypto.createHash('sha256').update(normalize(await readText(file)), 'utf8').digest('hex');

const audit = await read(`${base}/audits/pr-e1-production-activation-audit-v1.json`);
assert.equal(audit.baselineCommit, '57bccb6d6f9fc6aca054b4261e854f04758ec0e3');
assert.equal(audit.decision, 'FOUNDATION_ALLOWED_CASE_STORAGE_EXECUTION_BLOCKED');
assert.equal(audit.observed.professionalWorkspacePersistenceStatus, 'contract_only');
assert.equal(audit.observed.professionalWorkspaceD1RecordCreated, false);
assert.equal(audit.observed.authorisedWorkspacePersistenceStatus, 'not_implemented');
assert.equal(audit.observed.dedicatedPrCasePersistenceExecutorObserved, false);

const activation = evaluateProfessionalProductionActivation(audit.observed);
assert.equal(activation.decision, 'FOUNDATION_ALLOWED_CASE_STORAGE_EXECUTION_BLOCKED');
assert.equal(activation.caseVersionMaterializationAllowed, true);
assert.equal(activation.evidenceResolutionAllowed, true);
assert.equal(activation.storageExecutionAllowed, false);

const authorityBoundary = await read(`${base}/contracts/pr-production-authority-boundary-v1.json`);
assert.equal(authorityBoundary.storageAuthority, 'EXTERNAL_PWS_OR_STORAGE_EXECUTOR');
assert.equal(authorityBoundary.professionalJudgmentAuthority, 'PR_W4_HUMAN_ATTRIBUTABLE_ONLY');

const caseContract = await read(`${base}/contracts/pr-case-persistence-contract-v1.json`);
assert.equal(caseContract.status, 'CASE_VERSIONING_READY_STORAGE_EXECUTION_BLOCKED');
assert.equal(caseContract.versioning.immutable, true);
assert.equal(caseContract.versioning.appendOnly, true);
assert.equal(caseContract.versioning.overwriteAllowed, false);
assert.equal(caseContract.persistenceIntent.storageExecutedByPr, false);
assert.equal(caseContract.rules.pwsCaseObjectCreated, false);

const evidenceContract = await read(`${base}/contracts/pr-evidence-resolution-contract-v1.json`);
assert.equal(evidenceContract.status, 'ACTIVE_REFERENCE_RESOLUTION_ONLY');
assert.equal(evidenceContract.payloadPolicy, 'REFERENCE_AND_METADATA_ONLY_NO_SOURCE_CONTENT_COPY');
assert.equal(evidenceContract.rules.rawDataIsEvidence, false);
assert.equal(evidenceContract.rules.metricIsJudgment, false);
assert.equal(evidenceContract.rules.readoutIsJudgment, false);
assert.equal(evidenceContract.rules.unknownRemainsExplicit, true);

const activationRegistry = await read(`${base}/registries/pr-production-activation-gate-registry-v1.json`);
const gate = code => activationRegistry.gates.find(item => item.gateCode === code);
assert.equal(gate('CASE_STORAGE_EXECUTOR').state, 'BLOCKED_NOT_IMPLEMENTED');
assert.equal(gate('WORKSPACE_D1_PERSISTENCE').state, 'BLOCKED_CONTRACT_ONLY');
assert.equal(gate('EVIDENCE_REFERENCE_RESOLUTION').state, 'READY');

const persistenceRegistry = await read(`${base}/registries/pr-case-persistence-state-registry-v1.json`);
assert.equal(persistenceRegistry.currentMaximumState, 'PERSISTENCE_INTENT_READY');
assert.equal(persistenceRegistry.prMaySelfPromoteToPersisted, false);

const sourceRegistry = await read(`${base}/registries/pr-evidence-source-resolution-registry-v1.json`);
assert.deepEqual(sourceRegistry.sourceClasses.map(item => item.sourceClass), [
  'RAW_DATA','REALITY','EVIDENCE','READOUT','METRICS','MEANING','KNOWLEDGE','JOURNEY','UNKNOWN'
]);
assert.ok(sourceRegistry.sourceClasses.every(item => item.payloadCopied === false));

const preservation = await read(`${base}/freeze/pr-v2-base-preservation-manifest-v1.json`);
assert.equal(preservation.baselineCommit, audit.baselineCommit);
for (const item of preservation.preserved) {
  assert.equal(await digestFile(item.reference), item.sha256, `PR_E1_E3_PRESERVATION:${item.reference}`);
}

const prFreeze = await read('content/runtime/professional-runtime/freeze/pr-v2-freeze-v1.json');
assert.equal(prFreeze.status, 'PR-v2.0.0-FROZEN');
assert.equal(prFreeze.scope, 'PR-W0-W13');
assert.equal(prFreeze.productionState, 'GOVERNED_PROFESSIONAL_RUNTIME_READY_HUMAN_AUTHORITY_GATED');

const pwsWorkspaceSource = await readText('functions/professional/workspace/professional-workspace-contract.js');
assert.match(pwsWorkspaceSource, /persistence_status:\s*'contract_only'/);
assert.match(pwsWorkspaceSource, /d1_record_created:\s*false/);
const authorisedLoaderSource = await readText('functions/professional/access/authorised-professional-data-loader.js');
assert.match(authorisedLoaderSource, /persistence_status:\s*'not_implemented'/);

const pwsBoundary = await read('docs/pws/architecture/pws-entry-professional-handoff-boundary-v1.json');
assert.equal(pwsBoundary.handoffPolicy.professionalResponsibilityStartsAt, 'assignment.accepted');
assert.equal(pwsBoundary.handoffPolicy.professionalWorkspaceMayLoadBeforeAcceptance, undefined);
assert.equal(pwsBoundary.failureBehaviour.professionalWorkspaceMayLoadBeforeAcceptance, false);
assert.equal(pwsBoundary.journeyDataHandoff.minimumNecessaryDataOnly, true);

const fixture = await read(`${base}/fixtures/pr-production-extension.valid.json`);
const caseContext = buildProfessionalCase(fixture.case);
const access = authorizeProfessionalAccess(caseContext, fixture.access);
const v1 = materializeProfessionalCaseVersion(caseContext, fixture.caseVersion);
assert.equal(v1.objectClass, 'PR_CASE_VERSION');
assert.equal(v1.caseVersion, 1);
assert.equal(v1.previousCaseVersion, null);
assert.equal(v1.persistence.storageWritePerformed, false);
assert.equal(v1.persistence.executorState, 'NOT_IMPLEMENTED_FAIL_CLOSED');
assert.equal(Object.isFrozen(v1), true);

const intent = buildProfessionalCasePersistenceIntent(v1);
assert.equal(intent.storageWritePerformedByPr, false);
assert.equal(intent.decision, 'DEFERRED_FAIL_CLOSED_EXECUTOR_NOT_IMPLEMENTED');

const v2 = materializeProfessionalCaseVersion(caseContext, {
  caseVersion: 2,
  previousCaseVersion: v1,
  openedAt: '2026-08-11T09:00:00Z',
  status: 'ACTIVE'
});
assert.equal(v2.previousCaseVersion, 1);
assert.equal(v2.previousCaseDigest, v1.versionDigest);
assert.notEqual(v2.versionDigest, v1.versionDigest);
assert.throws(() => materializeProfessionalCaseVersion(caseContext, {
  caseVersion: 3,
  previousCaseVersion: v1,
  openedAt: '2026-08-11T10:00:00Z',
  status: 'ACTIVE'
}), /contiguous/);

const resolved = resolveProfessionalEvidencePackage(v1, access, fixture.evidenceRequest, fixture.sourceCatalogue);
assert.equal(resolved.objectClass, 'PR_RESOLVED_EVIDENCE_PACKAGE');
assert.equal(resolved.resolvedSources.length, 9);
assert.deepEqual(resolved.resolvedSources.map(item => item.sourceClass), [
  'RAW_DATA','REALITY','EVIDENCE','READOUT','METRICS','MEANING','KNOWLEDGE','JOURNEY','UNKNOWN'
]);
assert.equal(resolved.rawDataCountsAsEvidence, false);
assert.equal(resolved.metricCountsAsJudgment, false);
assert.equal(resolved.readoutCountsAsJudgment, false);
assert.equal(resolved.sourcePayloadCopied, false);
assert.ok(resolved.resolvedSources.every(item => item.payloadCopied === false && item.permissionDecision === 'ALLOW'));

const deniedCatalogue = structuredClone(fixture.sourceCatalogue);
deniedCatalogue[2].permissionDecision = 'DENY';
assert.throws(() => resolveProfessionalEvidencePackage(v1, access, fixture.evidenceRequest, deniedCatalogue), /permission denied or unresolved/);
const badVersion = structuredClone(fixture.evidenceRequest);
badVersion.sources[3].requestedVersion = '999';
assert.throws(() => resolveProfessionalEvidencePackage(v1, access, badVersion, fixture.sourceCatalogue), /version mismatch/);
const badScopeCatalogue = structuredClone(fixture.sourceCatalogue);
badScopeCatalogue[0].scope = ['outside_scope'];
assert.throws(() => resolveProfessionalEvidencePackage(v1, access, fixture.evidenceRequest, badScopeCatalogue), /scope exceeds/);
const payloadCatalogue = structuredClone(fixture.sourceCatalogue);
payloadCatalogue[0].payload = { forbidden: true };
assert.throws(() => resolveProfessionalEvidencePackage(v1, access, fixture.evidenceRequest, payloadCatalogue), /payload copy is forbidden/);

const acceptance = await read(`${base}/acceptance/pr-e1-e3-acceptance-v1.json`);
assert.equal(acceptance.status, 'accepted_post_freeze_foundation');
assert.equal(acceptance.requiredAssertions.prV2FreezeUnchanged, true);
assert.equal(acceptance.requiredAssertions.caseStorageExecutionFalse, true);

const freeze = await read(`${base}/freeze/pr-e1-e3-production-foundation-freeze-v1.json`);
assert.equal(freeze.status, 'FROZEN_POST_FREEZE_PRODUCTION_FOUNDATION_PERSISTENCE_BLOCKED');
assert.deepEqual(freeze.completedExtensions, ['PR-E1','PR-E2','PR-E3']);
assert.equal(freeze.caseVersionMaterializationActive, true);
assert.equal(freeze.evidenceReferenceResolutionActive, true);
assert.equal(freeze.caseStorageExecutionActive, false);
assert.equal(freeze.finalExtensionFreeze, false);
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:pr-e1-e3'], 'node scripts/check-pr-e1-e3-production-foundation.mjs');
assert.equal(pkg.scripts['check:pr-production-foundation'], 'npm run check:pr-e1-e3');
assert.equal(pkg.scripts['check:pr-production'], 'npm run check:pr-production-foundation');
const postcheckCommands = String(pkg.scripts.postcheck || '').split('&&').map(command => command.trim()).filter(Boolean);
const baseIndex = postcheckCommands.indexOf('npm run check:pr');
const extensionIndex = postcheckCommands.indexOf('npm run check:pr-production-foundation');
assert.ok(baseIndex >= 0 && extensionIndex > baseIndex, 'POSTCHECK_PR_BASE_BEFORE_PRODUCTION_FOUNDATION');
assert.equal(postcheckCommands.filter(item => item === 'npm run check:pr-production-foundation').length, 1, 'POSTCHECK_PR_PRODUCTION_FOUNDATION_DUPLICATE');

console.log('✓ PR-E1-E3 post-freeze production foundation passed.');
console.log('✓ PR v2 frozen authority remains unchanged; PWS Assignment/Workspace and RDG permission boundaries remain external.');
console.log('✓ Immutable PR Case Versions and persistence intents are materialized without claiming D1/storage execution.');
console.log('✓ All nine Professional source classes resolve by governed reference, authority, version, permission, purpose and scope without copying payload.');
console.log('✓ Raw Data remains non-Evidence; Readout and Metric remain non-Judgment; Unknown remains explicit.');
console.log('✓ Case storage execution stays fail-closed until an authorized PWS/storage executor exists.');
