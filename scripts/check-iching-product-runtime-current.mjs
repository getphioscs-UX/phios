import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists = path => fs.existsSync(path);

const successorPath = 'content/interpretation/iching/reconciliation/iching-product-runtime-checker-successor-v1.json';
const successor = read(successorPath);
const freeze = read(successor.historicalFreeze.path);
const acceptance = read('content/interpretation/iching/acceptance/iching-product-runtime-source-acceptance-v1.json');
const campaign = read('content/production/symbolic-method/human-review/iching-human-review-campaign-v1.json');
const pcm = read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const publicCatalog = read('content/web-production/px2/registries/public-method-catalog-v2.json');
const pkg = read('package.json');

assert.equal(successor.baselineCommit, '6eb24e4e55a77859b0068836da7fa89e946ae3b1');
assert.equal(successor.predecessorCommit, '306b84652102583690a7f7665167f8dfdbb82541');
assert.equal(successor.status, 'CURRENT_CHECKER_RECONCILED_SOURCE_RUNTIME_COMPLETE_ACTIVATION_NOT_GRANTED');
assert.equal(successor.historicalFreeze.preserved, true);
assert.equal(sha(successor.historicalFreeze.path), successor.historicalFreeze.sha256, 'historical I Ching product freeze mutated');
assert.equal(freeze.status, successor.historicalFreeze.status);

for (const item of freeze.frozenScope) {
  assert.equal(exists(item.path), true, `missing historical frozen artifact: ${item.path}`);
  if (item.path === 'package.json') {
    assert.equal(item.sha256, successor.historicalFreeze.historicalPackageSha256);
    continue;
  }
  if (item.path === successor.sharedApiEvolution.path) {
    assert.equal(item.sha256, successor.sharedApiEvolution.historicalIChingProductSha256);
    continue;
  }
  assert.equal(sha(item.path), item.sha256, `historical I Ching product artifact drift: ${item.path}`);
}
assert.equal(sha(successor.sharedApiEvolution.path), successor.sharedApiEvolution.currentSha256, 'unreconciled shared symbolic context API drift');
assert.equal(successor.sharedApiEvolution.productionAuthorityChanged, false);

const historicalChecker = successor.checkerLifecycle.historicalChecker;
assert.equal(sha(historicalChecker.path), historicalChecker.sha256, 'historical I Ching product checker mutated');
const historicalRun = spawnSync(process.execPath, [historicalChecker.path], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
const historicalOutput = `${historicalRun.stdout || ''}\n${historicalRun.stderr || ''}`;
assert.equal(historicalRun.status, 1, 'historical checker must expose its frozen package digest on the evolved worktree');
assert.match(historicalOutput, /freeze drift: functions\/api\/symbolic-method-context\.js/);
assert.ok(historicalOutput.includes(successor.sharedApiEvolution.historicalIChingProductSha256));
assert.ok(historicalOutput.includes(successor.sharedApiEvolution.currentSha256));
for (const unexpected of [
  'predecessor drift:',
  'html missing',
  'client missing',
  'css missing',
  'hidden persistence primitive'
]) {
  assert.equal(historicalOutput.includes(unexpected), false, `historical product validation failed before package reconciliation: ${unexpected}`);
}

assert.equal(pkg.scripts['check:iching-product-runtime'], 'node scripts/check-iching-product-runtime.mjs');
assert.equal(pkg.scripts['check:iching-product-runtime-historical'], 'node scripts/check-iching-product-runtime.mjs');
assert.equal(pkg.scripts['check:iching-product-runtime-current'], 'node scripts/check-iching-product-runtime-current.mjs');
assert.equal(pkg.scripts['check:iching-product-current'], 'npm run check:iching-current && npm run check:iching-product-runtime-current');

assert.equal(acceptance.status, 'ACCEPTED_SOURCE_RUNTIME_COMPLETE_PRODUCTION_ACTIVATION_NOT_GRANTED');
assert.equal(acceptance.machineAcceptance.sourceRuntimeComplete, true);
assert.equal(acceptance.production.humanReviewSessionsAccepted, 0);
assert.equal(acceptance.production.humanReviewSessionsRequired, 24);
assert.equal(acceptance.production.publicRunAllowed, false);
assert.equal(acceptance.production.limitedProductionActivated, false);
assert.equal(campaign.sessions.length, 24);
assert.equal(campaign.sessions.filter(session => session.humanReviewed === true).length, 0);

const ich = pcm.capabilities.find(item => item.methodRuntime?.methodCode === 'I_CHING');
assert.ok(ich);
assert.notEqual(ich.capabilityAvailability, 'AVAILABLE');
assert.equal(ich.userExecutable, false);
assert.equal(ich.productionAccepted, false);
const publicIch = publicCatalog.methods.find(item => item.methodCode === 'I_CHING');
assert.ok(publicIch);
assert.equal(publicIch.runAllowed, false);

for (const value of Object.values(successor.sourceRuntime)) assert.equal(value, true);
for (const key of [
  'verifiedPersistenceIdentity',
  'liveBrowserAcceptance',
  'liveProductionShaAlignment',
  'publicRunAllowed',
  'limitedProductionActivated',
  'productionCapabilityPromoted'
]) assert.equal(successor.productionBoundary[key], false, `${key} cannot be promoted by checker reconciliation`);
assert.equal(successor.rules.historicalFreezeMutationAllowed, false);
assert.equal(successor.rules.historicalCheckerMutationAllowed, false);
assert.equal(successor.rules.checkerReconciliationMayGrantProductionActivation, false);

console.log('✓ ICH-PROD-W10 current checker reconciliation passed.');
console.log('  Historical I Ching product Runtime artifacts remain byte-stable; additive package evolution and the governed shared Tarot/I Ching context successor are explicitly reconciled.');
console.log('  Current product source Runtime is complete. Production remains closed: 0/24 human reviews, persistence identity, live browser acceptance and live production SHA are pending.');
