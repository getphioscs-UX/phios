import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const successor = read('content/interpretation/tarot/reconciliation/tarot-persistence-checker-successor-v1.json');
const acceptance = read(successor.historicalAcceptance.path);
const historicalSuccessor = read(successor.historicalSuccessor.path);
const pkg = read('package.json');
const pcm = read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const publicCatalog = read('content/web-production/px2/successors/public-method-catalog-v2.json');

assert.equal(successor.baselineCommit, '6eb24e4e55a77859b0068836da7fa89e946ae3b1');
assert.equal(successor.predecessorCommit, '306b84652102583690a7f7665167f8dfdbb82541');
assert.equal(successor.status, 'CURRENT_TAROT_PERSISTENCE_CHECKER_RECONCILED_PRODUCT_STILL_CLOSED');
assert.equal(successor.historicalAcceptance.preserved, true);
assert.equal(successor.historicalSuccessor.preserved, true);
assert.equal(sha(successor.historicalAcceptance.path), successor.historicalAcceptance.sha256, 'historical Tarot persistence acceptance mutated');
assert.equal(sha(successor.historicalSuccessor.path), successor.historicalSuccessor.sha256, 'historical Tarot persistence successor mutated');

for (const [name, item] of Object.entries(acceptance.artifacts)) {
  assert.ok(fs.existsSync(item.path), `missing historical Tarot persistence artifact: ${name}`);
  if (item.path === successor.sharedContextApiEvolution.path) {
    assert.equal(item.sha256, successor.sharedContextApiEvolution.tarotPersistenceAcceptanceSha256);
    continue;
  }
  assert.equal(sha(item.path), item.sha256, `historical Tarot persistence artifact drift: ${name}`);
}

const sharedApi = successor.sharedContextApiEvolution;
assert.equal(sha(sharedApi.path), sharedApi.currentSharedSuccessorSha256, 'unreconciled symbolic context API drift');
const sharedSource = text(sharedApi.path);
assert.match(sharedSource, /METHODS=new Set\(\['I_CHING','TAROT'\]\)/);
assert.match(sharedSource, /productRuntime:\{sourceReady:true,structuralRuntimeFrozen:true,interpretationSourceBound:true,automaticPersistence:false\}/);
for (const key of [
  'tarotSourceReadyRestored',
  'iChingSourceReadyPreserved',
  'separateExecutionAuthorityPreserved'
]) assert.equal(sharedApi[key], true);
assert.equal(sharedApi.productionAuthorityChanged, false);

const historicalChecker = successor.checkerLifecycle.historicalChecker;
assert.equal(sha(historicalChecker.path), historicalChecker.sha256, 'historical Tarot persistence checker mutated');
const historicalRun = spawnSync(process.execPath, [historicalChecker.path], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
const historicalOutput = `${historicalRun.stdout || ''}\n${historicalRun.stderr || ''}`;
assert.equal(historicalRun.status, 1, 'historical Tarot checker must expose the approved shared API successor drift');
assert.match(historicalOutput, /acceptance drift contextApi/);
assert.ok(historicalOutput.includes(sharedApi.tarotPersistenceAcceptanceSha256));
assert.ok(historicalOutput.includes(sharedApi.currentSharedSuccessorSha256));
for (const unexpected of [
  'cross-account',
  'missing action',
  'hidden persistence',
  'GLOBAL_ACCOUNT'
]) {
  assert.equal(historicalOutput.includes(unexpected), false, `historical Tarot validation failed before shared API reconciliation: ${unexpected}`);
}

assert.equal(pkg.scripts['check:tarot-persistence'], 'node scripts/check-tarot-persistence.mjs');
assert.equal(pkg.scripts['check:tarot-persistence-historical'], 'node scripts/check-tarot-persistence.mjs');
assert.equal(pkg.scripts['check:tarot-persistence-current'], 'node scripts/check-tarot-persistence-current.mjs');
assert.equal(pkg.scripts['check:tarot-product-activation-phase-h'], 'npm run check:tarot-product-activation-phase-g && npm run check:tarot-persistence-current');

assert.equal(acceptance.status, 'ACCEPTED_SOURCE_PERSISTENCE_D1_READY_GLOBAL_ACCOUNT_PROVIDER_PENDING_PRODUCT_STILL_CLOSED');
assert.equal(historicalSuccessor.productionBoundary.globalAccountIdentityProviderConnected, false);
assert.equal(historicalSuccessor.productionBoundary.verifiedLiveAccountPersistenceClaimed, false);
assert.equal(historicalSuccessor.productionBoundary.publicRunAllowedChanged, false);
for (const value of Object.values(successor.persistenceRuntime)) assert.equal(value, true);
for (const value of Object.values(successor.productionBoundary)) assert.equal(value, false);

const tarPcm = pcm.capabilities.find(item => item.methodRuntime?.methodCode === 'TAROT');
assert.ok(tarPcm);
assert.equal(tarPcm.userExecutable, false);
assert.equal(tarPcm.productionAccepted, false);
const tarPublic = publicCatalog.methods.find(item => item.methodCode === 'TAROT');
assert.ok(tarPublic);
assert.equal(tarPublic.runAllowed, false);
assert.equal(successor.rules.historicalAcceptanceMutationAllowed, false);
assert.equal(successor.rules.historicalCheckerMutationAllowed, false);
assert.equal(successor.rules.checkerReconciliationMayGrantProductionActivation, false);

console.log('✓ TPA-W35 current persistence checker reconciliation passed.');
console.log('  Historical Tarot persistence acceptance remains byte-stable; the shared context API now truthfully reports both Tarot and I Ching source readiness.');
console.log('  Tarot remains product-closed: global verified account provider, human acceptance, live browser and live production SHA evidence are pending.');
