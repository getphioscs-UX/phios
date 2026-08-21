import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const j = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const freeze = j('content/professional/method-client-delivery/freeze/mcd-5-canonical-projection-freeze-v1.json');
const acceptance = j('content/professional/method-client-delivery/acceptance/mcd-5-canonical-projection-acceptance-v1.json');
const prior = j('content/professional/method-production-activation/successors/mpa-w30-mcd5-projection-successor-v1.json');
const current = j('content/professional/method-client-delivery/successors/mcd-ast-bzr-production-adapter-successor-v1.json');
const mcd7 = j('content/professional/method-client-delivery/contracts/mcd-7-personal-runtime-result-surface-contract-v1.json');
const pkg = j('package.json');

assert.equal(freeze.status, 'FROZEN_CORE_ISOLATED_CANONICAL_RESULT_INTERPRETATION_EXCLUDED_HDR_VALIDATION_ONLY');
assert.equal(current.baselineCommit, 'a45d65851df55858fd9ea9c7f76a14d34ed915e6');
assert.equal(current.status, 'ACTIVE_MPA_BOUND_AST_BZR_PHYSICAL_ADAPTER_SUCCESSOR');

const priorApi = prior.authorizedDrift.find(x => x.path === 'functions/api/method-execute.js');
assert(priorApi);
assert.equal(priorApi.successorSha256, current.predecessors.api.predecessorSha256);
assert.equal(sha(current.predecessors.api.path), current.predecessors.api.currentSha256);

for (const record of [...freeze.frozenOutputs, ...freeze.predecessorEvidence]) {
  if (record.path === 'functions/api/method-execute.js') {
    assert.equal(record.sha256, current.predecessors.api.predecessorSha256);
    assert.equal(sha(record.path), current.predecessors.api.currentSha256);
  } else {
    assert.equal(sha(record.path), record.sha256, `MCD-5 historical predecessor drift: ${record.path}`);
  }
}

assert.equal(sha(current.predecessors.mcd5HistoricalRuntime.path), current.predecessors.mcd5HistoricalRuntime.sha256);
const currentProjection = current.currentRuntimeArtifacts.find(x => x.path === 'functions/method-client-delivery/canonical-projection-runtime-current.js');
assert(currentProjection);
assert.equal(sha(currentProjection.path), currentProjection.sha256);
assert.equal(current.authorityBoundary.mpaRemainsOnlyProductionDispatchAuthority, true);
assert.equal(current.authorityBoundary.secondProjectionAuthorityCreated, false);
assert.equal(current.authorityBoundary.hdrProductionActivationCreated, false);
assert.equal(current.authorityBoundary.aiUsedForCalculation, false);
assert.equal(current.authorityBoundary.providerUsedForCalculation, false);
assert.equal(freeze.authorityFreeze.productionDispatchOwner, 'MPA');
assert.equal(freeze.authorityFreeze.clientContract, 'CANONICAL_METHOD_PROJECTION_ONLY');
assert.equal(freeze.hdrFreeze.productionCustomerResultAllowed, false);
assert.equal(acceptance.nextWork, 'MCD-6');
assert.equal(mcd7.authority.frontendConsumesCanonicalProjectionOnly, true);
assert.equal(mcd7.authority.interpretationIncluded, false);

assert.equal(pkg.scripts['check:mcd-2'], 'node scripts/check-mcd-2-ast-bzr-production-successor.mjs');
assert.equal(pkg.scripts['check:mcd-4'], 'node scripts/check-mcd-4-ast-bzr-production-successor.mjs');
assert.equal(pkg.scripts['check:mcd-5'], 'node scripts/check-mcd-5-canonical-method-projection.mjs && node scripts/check-mcd-5-ast-bzr-production-successor-freeze.mjs');
assert.equal(pkg.scripts['check:mcd-2-historical'], 'node scripts/check-mcd-2-canonical-runtime-adapter.mjs');
assert.equal(pkg.scripts['check:mcd-4-historical'], 'node scripts/check-mcd-4-execution.mjs && node scripts/check-mcd-4-execution-freeze.mjs');
assert.equal(pkg.scripts['check:mcd-5-historical'], 'node scripts/check-mcd-5-canonical-method-projection.mjs && node scripts/check-mcd-5-canonical-projection-freeze.mjs');

const run = spawnSync(process.execPath, ['scripts/check-mcd-ast-bzr-production-successor.mjs'], {
  cwd: process.cwd(), encoding: 'utf8'
});
assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
process.stdout.write(run.stdout);
console.log('✓ MCD-5 current AST+BZR Canonical Projection successor freeze passed.');
console.log('  Historical MCD-5 projection bytes remain immutable; only the versioned API/current projection consumer advances to physical AST/BZR execution.');
