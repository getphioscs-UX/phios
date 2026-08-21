import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = 'content/professional/method-production-activation';

const freeze = json(`${base}/freeze/mpa-production-activation-freeze-v1.json`);
const manifest = json(`${base}/freeze/mpa-w0-w29-content-preservation-manifest-v1.json`);
const mcd2 = json(`${base}/successors/mpa-w30-mcd2-adapter-successor-v1.json`);
const mcd4 = json(`${base}/successors/mpa-w30-mcd4-execution-successor-v1.json`);
const mcd5 = json(`${base}/successors/mpa-w30-mcd5-projection-successor-v1.json`);
const mcdCurrent = json('content/professional/method-client-delivery/successors/mcd-ast-bzr-production-adapter-successor-v1.json');
const mir3 = json(`${base}/successors/mpa-w14-mir3-dependency-regression-successor-v1.json`);
const w14v2 = json(`${base}/successors/mpa-w14-visual-raster-dependency-regression-successor-v2.json`);
const w14v3 = json(`${base}/successors/mpa-w14-mcd-package-script-regression-successor-v3.json`);
const w14v4 = json(`${base}/successors/mpa-w14-bfr-h-central-checker-package-script-successor-v4.json`);
const w30v2 = json(`${base}/successors/mpa-w30-w14-dependency-successor-v2.json`);
const w30v3 = json(`${base}/successors/mpa-w30-current-checker-and-mcd-ast-bzr-successor-v3.json`);
const pkg = json('package.json');

assert.equal(freeze.status, 'MPA-v1.0.0-FROZEN');
assert.equal(manifest.status, 'FROZEN_CONTENT_PRESERVATION_MANIFEST');
assert.equal(sha256(mcd5.predecessor.path), mcd5.predecessor.sha256);

const d2 = mcd2.authorizedDrift[0];
const d4 = mcd4.authorizedDrift[0];
const d5 = mcd5.authorizedDrift[0];
assert.equal(d2.successorSha256, d4.predecessorSha256);
assert.equal(d4.successorSha256, d5.predecessorSha256);
assert.equal(d5.successorSha256, mcdCurrent.predecessors.api.predecessorSha256);
assert.equal(sha256(mcdCurrent.predecessors.api.path), mcdCurrent.predecessors.api.currentSha256);
assert.equal(mcdCurrent.authorityBoundary.mpaRemainsOnlyProductionDispatchAuthority, true);
assert.equal(mcdCurrent.authorityBoundary.secondMethodRuntimeCreated, false);
assert.equal(mcdCurrent.authorityBoundary.secondProjectionAuthorityCreated, false);

assert.equal(w30v2.status, 'AUTHORIZED_POST_FREEZE_W14_DEPENDENCY_SUCCESSOR');
assert.equal(sha256(w30v2.predecessor.path), w30v2.predecessor.sha256);
assert.equal(sha256(w30v2.successor.path), w30v2.successor.sha256);
assert.equal(w30v2.predecessor.checkerSha256, mir3.successor.checkerSha256);
assert.equal(w30v2.successor.checkerSha256, w14v2.successor.checkerSha256);

assert.equal(w14v3.predecessor.checkerSha256, w14v2.successor.checkerSha256);
assert.equal(w14v4.predecessor.checkerSha256, w14v3.successor.checkerSha256);
assert.equal(sha256(w14v4.predecessor.path), w14v4.predecessor.sha256);
assert.equal(sha256('package.json'), w14v4.successor.packageJsonSha256);
assert.equal(sha256(w14v4.successor.checkerPath), w14v4.successor.checkerSha256);

assert.equal(w30v3.status, 'AUTHORIZED_POST_FREEZE_CURRENT_SUCCESSOR_MCD_AST_BZR_AND_W14_V4');
assert.equal(sha256(w30v3.predecessor.path), w30v3.predecessor.sha256);
assert.equal(w30v3.predecessor.checkerSha256, '0fe9dce72398c94e9bd2de95fa37d1c3adcdb82dc9c6e91ba65719405b4d6e42');
assert.equal(sha256(w30v3.mcdAstBzrSuccessor.path), w30v3.mcdAstBzrSuccessor.sha256);
assert.equal(w30v3.mcdAstBzrSuccessor.apiPredecessorSha256, d5.successorSha256);
assert.equal(w30v3.mcdAstBzrSuccessor.apiCurrentSha256, mcdCurrent.predecessors.api.currentSha256);
assert.equal(sha256(w30v3.w14PackageSuccessor.path), w30v3.w14PackageSuccessor.sha256);
assert.equal(w30v3.w14PackageSuccessor.packageJsonSha256, w14v4.successor.packageJsonSha256);
assert.equal(w30v3.w14PackageSuccessor.w14CheckerSha256, w14v4.successor.checkerSha256);
assert.equal(w30v3.boundaries.historicalFreezeMutated, false);
assert.equal(w30v3.boundaries.historicalManifestMutated, false);
assert.equal(w30v3.boundaries.methodProductionEligibilityChangedByPartGH, false);
assert.equal(w30v3.boundaries.professionalEligibilityChangedByPartGH, false);

for (const record of manifest.entries) {
  if (record.reference === d5.path) {
    assert.equal(record.sha256, d2.predecessorSha256);
    assert.equal(d5.successorSha256, mcdCurrent.predecessors.api.predecessorSha256);
    assert.equal(sha256(record.reference), mcdCurrent.predecessors.api.currentSha256, 'Unauthorized current Method API drift');
  } else if (record.reference === mir3.successor.checkerPath) {
    assert.equal(record.sha256, mir3.predecessor.checkerSha256);
    assert.equal(mir3.successor.checkerSha256, w14v2.predecessor.checkerSha256);
    assert.equal(w14v2.successor.checkerSha256, w14v3.predecessor.checkerSha256);
    assert.equal(w14v3.successor.checkerSha256, w14v4.predecessor.checkerSha256);
    assert.equal(sha256(record.reference), w14v4.successor.checkerSha256, 'Unauthorized MPA-W14 current successor drift');
  } else {
    assert.equal(sha256(record.reference), record.sha256, `Unauthorized MPA freeze drift: ${record.reference}`);
  }
}

assert.equal(mir3.boundaries.historicalRegressionRegistryMutated, false);
assert.equal(w14v2.boundaries.historicalRegressionRegistryMutated, false);
assert.equal(w14v3.boundaries.historicalRegressionRegistryMutated, false);
assert.equal(w14v4.boundaries.historicalRegressionRegistryMutated, false);
assert.equal(mcd5.projectionBoundary.coreRawSchemaPublic, false);
assert.equal(mcd5.projectionBoundary.interpretationAllowed, false);
assert.equal(mcd5.productionAuthority.HDR.dispatchAllowed, false);
assert.equal(pkg.scripts['check:mpa-w30'], 'node scripts/check-mpa-w30-mcd5-successor-freeze.mjs');
assert.equal(pkg.scripts['check:mpa-freeze'], 'npm run check:mpa-w30');
assert.equal(sha256(w30v3.successor.checkerPath), w30v3.successor.checkerSha256, 'MPA_W30_V3_SUCCESSOR_CHECKER_DRIFT');

console.log('✓ MPA-W30 current successor freeze passed.');
console.log('  Historical MPA W0-W29 freeze remains immutable; MCD-5 → AST/BZR production API and W14 v1→v4 package/checker evolution are versioned current successors only.');
