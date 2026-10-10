import assert from 'node:assert/strict';
import { PATHS, readJson, assertBaseline, assertRef, assertBaselineCommitResolvableWhenGitPresent, findNamedFiles } from './lib/runtime-maturity/mrm-s-phase-a-lib.mjs';

const doc = readJson(PATHS.s0);
assertBaseline(doc, 'MRM_S0');
assert.equal(doc.work, 'MRM-S0');
assert.equal(doc.status, 'FROZEN_CURRENT_AUTHORITY_BASELINE_NO_SECOND_MATURITY_AUTHORITY');
const expectedRequired = ['CMW','PDS','CPR','WPR','MPA','MCD','CMR','RMO','RRE','RNE','RDG','JR','KNR','KAP','CKA','ALR','PR','RR','AST','BZR','NUM','HDR','FINANCIAL','COMMERCE','ACCOUNT','EXTERNAL_READER'];
const expectedExtensions = ['RG','ICR','ORC','CAR','KAU','KPP','PJA','KI'];
assert.deepEqual(doc.requiredAuditSet, expectedRequired, 'MRM_S0_REQUIRED_AUDIT_SET_DRIFT');
assert.deepEqual(doc.reconciliationExtensions, expectedExtensions, 'MRM_S0_RECONCILIATION_EXTENSION_DRIFT');
assert.equal(doc.runtimes.length, 34, 'MRM_S0_TRACKED_RUNTIME_COUNT_DRIFT');
assert.equal(new Set(doc.runtimes.map(x => x.runtimeCode)).size, doc.runtimes.length, 'MRM_S0_DUPLICATE_RUNTIME_CODE');
for (const rt of doc.runtimes) {
  assert.equal(rt.duplicateAuthorityDetected, false, `MRM_S0_DUPLICATE_AUTHORITY_FLAG_${rt.runtimeCode}`);
  assert.equal(rt.historicalFreezePreserved, true, `MRM_S0_FREEZE_PRESERVATION_${rt.runtimeCode}`);
  assertRef(rt.currentAuthority, `MRM_S0_${rt.runtimeCode}_AUTHORITY`);
  assertRef(rt.checkerAuthority, `MRM_S0_${rt.runtimeCode}_CHECKER`);
  if (rt.freezeAuthority) assertRef(rt.freezeAuthority, `MRM_S0_${rt.runtimeCode}_FREEZE`);
  for (let i = 0; i < (rt.supportingAuthorities || []).length; i++) assertRef(rt.supportingAuthorities[i], `MRM_S0_${rt.runtimeCode}_SUPPORT_${i}`);
}
for (const reserved of doc.reservedFutureRuntimeCodes) assert.ok(!doc.runtimes.some(x => x.runtimeCode === reserved), `MRM_S0_FUTURE_RUNTIME_SILENTLY_REGISTERED_${reserved}`);
assert.deepEqual(doc.exitGate, { duplicateRuntimeAuthorityCount:0, secondMaturityAuthorityCount:0, historicalFreezeMutationCount:0 });
const duplicates = findNamedFiles('content', 'evidence-maturity-level-registry-v1.json');
assert.deepEqual(duplicates, [PATHS.s2], 'MRM_S0_SECOND_MASTER_EVIDENCE_AUTHORITY_DETECTED');
const mpa = readJson('content/professional/method-production-activation/current/mpa-current-check-consolidation-v1.json');
assert.equal(mpa.status, 'ACTIVE_CURRENT_SINGLE_ENTRY_NO_REPOSITORY_FINGERPRINT_COUPLING', 'MRM_S0_MPA_CURRENT_CONSOLIDATION_DRIFT');
assert.equal(mpa.forbiddenCurrentFingerprintScopes.includes('WHOLE_PACKAGE_JSON_SHA256'), true);
const gitState = assertBaselineCommitResolvableWhenGitPresent();
console.log('✓ MRM-S0 Authority Baseline Freeze passed.');
console.log(`  ${doc.runtimes.length} current runtimes: ${doc.requiredAuditSet.length} required + ${doc.reconciliationExtensions.length} reconciliation extensions; 0 duplicate authority; ${gitState}.`);
