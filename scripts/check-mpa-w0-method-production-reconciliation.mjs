import assert from 'node:assert/strict';
import { BASELINE, readJson, exists, methodByCode } from './lib/method-production-activation/mpa-foundation-v1.mjs';

const baseline = readJson('content/professional/method-production-activation/audits/mpa-method-production-baseline-v1.json');
const reconciliation = readJson('content/professional/method-production-activation/registries/mpa-registry-reconciliation-v1.json');
const mr = readJson('content/professional/method-runtime/method-registry-v1.json');
const imr = readJson('content/professional/method-governance/imr-method-registry-v1.json');
const mrFreeze = readJson('content/professional/method-runtime/method-runtime-freeze-v1.json');
const imrFreeze = readJson('content/professional/method-governance/imr-method-governance-freeze-v1.json');
const numExtension = readJson('content/professional/method-governance/numerology-registration-extension-v1.json');
const numFreeze = readJson('content/professional/core-method-runtime/num-production-freeze-v1.json');
const astFreeze = readJson('content/professional/core-method-runtime/ast-production-freeze-v1.json');
const hdrFreeze = readJson('content/professional/core-method-runtime/hdr-production-freeze-v1.json');
const bzrManifest = readJson('content/professional/core-method-runtime/bzr-runtime-manifest-v1.json');

assert.equal(baseline.schemaVersion, 'PHI-OS-MPA-W0-METHOD-PRODUCTION-BASELINE-v1.0.0');
assert.equal(baseline.baselineCommit, BASELINE);
assert.equal(baseline.status, 'RECONCILED_FOUNDATION_NO_PRODUCTION_ACTIVATION');
assert.equal(baseline.repository.originMainVerified, true);
assert.equal(baseline.authorityPosition.ownsMethod, false);
assert.equal(baseline.authorityPosition.ownsAlgorithmDefinition, false);
assert.equal(baseline.authorityPosition.ownsMeaningAuthority, false);
assert.equal(baseline.authorityPosition.createsRealityTruth, false);
assert.equal(baseline.authorityPosition.createsProfessionalJudgment, false);

assert.equal(mr.status, 'frozen');
assert.equal(mrFreeze.status, 'MR Frozen v1');
assert.equal(mrFreeze.successorPolicy.inPlaceMutationAllowed, false);
assert.equal(imrFreeze.status, 'IMR Frozen v1');
assert.equal(imrFreeze.freezeRules.versionedSuccessorRequired, true);
assert.equal(methodByCode(mr, 'NUMEROLOGY'), undefined, 'NUM must remain absent from frozen MR v1.');
assert.equal(methodByCode(imr, 'NUMEROLOGY'), undefined, 'NUM must remain absent from frozen IMR v1.');
assert.equal(numExtension.status, 'versioned_extension_candidate_not_merged_into_frozen_v1');
assert.equal(numFreeze.executionMode, 'validation_only');
assert.equal(numFreeze.productionStatus, 'blocked');
assert.equal(astFreeze.productionStatus, 'blocked');
assert.equal(hdrFreeze.productionStatus, 'blocked');
assert.equal(bzrManifest.activation.productionEligible, false);

for (const path of [
  'functions/core-method-runtime/num-birth-number-runtime.js',
  'functions/core-method-runtime/num-projection-runtime.js',
  'functions/core-method-runtime/ast-astronomy-runtime.js',
  'functions/core-method-runtime/ast-projection-runtime.js',
  'functions/core-method-runtime/bzr-solar-calendar-runtime.js',
  'functions/core-method-runtime/bzr-projection-runtime.js',
  'functions/core-method-runtime/hdr-astronomy-runtime.js',
  'functions/core-method-runtime/hdr-projection-runtime.js',
  'functions/method-runtime/shared-calculation-runtime.js',
  'functions/method-runtime/shared-projection-runtime.js',
  'functions/method-runtime/shared-interpretation-runtime.js',
  'functions/method-runtime/shared-professional-runtime.js'
]) assert.equal(exists(path), true, `Missing reconciled runtime artifact: ${path}`);

const codes = new Set(baseline.reconciliationFindings.map(item => item.code));
for (const code of [
  'NUM_RUNTIME_EXISTS_BUT_V1_REGISTRY_ABSENT',
  'AST_LEGACY_MANIFEST_STAGE_DRIFT',
  'BZR_LEGACY_MANIFEST_STAGE_DRIFT',
  'PUBLIC_METHOD_TERM_AUTHORITY_NOT_SEPARATED'
]) assert.equal(codes.has(code), true, code);

assert.equal(reconciliation.status, 'VERSIONED_SUCCESSOR_REQUIRED');
assert.equal(reconciliation.successorPlan.predecessorMutation, false);
assert.equal(reconciliation.methodReconciliation.find(x => x.methodCode === 'NUMEROLOGY').v2TargetState, 'ACTIVATION_CANDIDATE');
assert.equal(reconciliation.methodReconciliation.find(x => x.pluginCode === 'HDR').v2TargetState, 'BLOCKED');

console.log('✓ MPA-W0 Method Production Reconciliation passed.');
console.log('  Frozen MR/IMR v1 remain untouched; NUM is reconciled only through a versioned successor path.');
console.log('  Existing method implementations are recognized without converting validation-only state into Production.');
