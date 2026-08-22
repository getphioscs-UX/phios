import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = 'content/professional/method-production-activation';
const freeze = json(`${base}/freeze/mpa-production-activation-freeze-v1.json`);
const manifest = json(`${base}/freeze/mpa-w0-w29-content-preservation-manifest-v1.json`);
const consolidation = json(`${base}/current/mpa-current-check-consolidation-v1.json`);
const dependencyRegistry = json(`${base}/registries/mpa-method-dependency-registry-v2.json`);
const regressionRegistry = json(`${base}/registries/mpa-regression-trigger-registry-v2.json`);
const mcd2 = json(`${base}/successors/mpa-w30-mcd2-adapter-successor-v1.json`);
const mcd4 = json(`${base}/successors/mpa-w30-mcd4-execution-successor-v1.json`);
const mcd5 = json(`${base}/successors/mpa-w30-mcd5-projection-successor-v1.json`);
const mcdCurrent = json('content/professional/method-client-delivery/successors/mcd-ast-bzr-production-adapter-successor-v1.json');
const pkg = json('package.json');

assert.equal(freeze.status, 'MPA-v1.0.0-FROZEN');
assert.equal(manifest.status, 'FROZEN_CONTENT_PRESERVATION_MANIFEST');
assert.equal(consolidation.status, 'ACTIVE_CURRENT_SINGLE_ENTRY_NO_REPOSITORY_FINGERPRINT_COUPLING');
for (const v of Object.values(consolidation.boundaries)) assert.equal(v, false);
assert.equal(consolidation.historicalPreservation.historicalFreezeMutated, false);
assert.equal(consolidation.historicalPreservation.historicalW14CheckerMutated, false);
assert.equal(consolidation.historicalPreservation.historicalW30CheckerMutated, false);

// Historical MPA freeze remains an audit predecessor; central npm wiring is superseded only by this current contract.
assert.equal(freeze.governanceClosure.governanceClosed, true);
assert.equal(freeze.eligibilityAtFreeze.eligibleCount, 0);
assert.equal(freeze.executionAtFreeze.productionDispatchActive, false);
assert.equal(freeze.downstreamAtFreeze.mpaCreatesCustomerReadout, false);
assert.equal(freeze.downstreamAtFreeze.mpaCreatesRealityFact, false);
assert.equal(freeze.downstreamAtFreeze.mpaCreatesProfessionalJudgment, false);

// Preserve the actual MCD authority succession without coupling it to package/checker fingerprints.
const d2 = mcd2.authorizedDrift[0], d4 = mcd4.authorizedDrift[0], d5 = mcd5.authorizedDrift[0];
assert.equal(d2.successorSha256, d4.predecessorSha256);
assert.equal(d4.successorSha256, d5.predecessorSha256);
assert.equal(d5.successorSha256, mcdCurrent.predecessors.api.predecessorSha256);
assert.equal(sha256(mcdCurrent.predecessors.api.path), mcdCurrent.predecessors.api.currentSha256);
assert.equal(mcdCurrent.authorityBoundary.mpaRemainsOnlyProductionDispatchAuthority, true);
assert.equal(mcdCurrent.authorityBoundary.secondMethodRuntimeCreated, false);
assert.equal(mcdCurrent.authorityBoundary.secondProjectionAuthorityCreated, false);
assert.equal(mcd5.projectionBoundary.interpretationAllowed, false);
assert.equal(mcd5.productionAuthority.HDR.dispatchAllowed, false);

// Current regression authority is method scoped.
assert.equal(dependencyRegistry.wholePackageJsonFingerprint, false);
assert.equal(dependencyRegistry.wholePackageLockFingerprint, false);
assert.equal(regressionRegistry.rules.repositoryWidePackageFingerprintForbidden, true);
assert.equal(regressionRegistry.fingerprints.some(x => x.path === 'package.json' || x.path === 'package-lock.json'), false);

// package.json exposes exactly one MPA entry and one global postcheck call.
const mpaKeys = Object.keys(pkg.scripts).filter(k => k === 'check:mpa' || k.startsWith('check:mpa-') || k.startsWith('check:mpa-w') || k === 'method-production-activation:check');
assert.deepEqual(mpaKeys, ['check:mpa']);
assert.equal(pkg.scripts['check:mpa'], 'node scripts/check-mpa-current.mjs');
const post = String(pkg.scripts.postcheck || '').split(' && ').map(x => x.trim()).filter(Boolean);
assert.equal(post.filter(x => x === 'npm run check:mpa').length, 1);
assert.ok(post.indexOf('npm run check:mpa') < post.indexOf('npm run check:web-production-runtime'));

// Retired package/checker fingerprint successors remain historical only; current checkers must not consume them.
for (const retired of consolidation.retiredFromCurrentChain) assert.ok(fs.existsSync(retired), `MISSING_HISTORICAL_MPA_SUCCESSOR:${retired}`);
for (const currentPath of [
  'scripts/check-mpa-current.mjs',
  'scripts/check-mpa-w14-current-regression-runtime.mjs',
  'scripts/check-mpa-w30-current-freeze.mjs'
]) {
  const source = fs.readFileSync(currentPath, 'utf8');
  for (const retired of consolidation.retiredFromCurrentChain) {
    assert.equal(source.includes(retired.split('/').at(-1)), false, `RETIRED_SUCCESSOR_CONSUMED_BY_CURRENT:${currentPath}:${retired}`);
  }
}

console.log('✓ MPA-W30 Current Freeze passed.');
console.log('  Historical MPA v1 freeze remains preserved; current MPA exposes one npm entry and no repository/package/PXR/BFR/visual fingerprint successor is consumed.');
