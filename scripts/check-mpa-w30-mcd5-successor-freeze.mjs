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
const mir3 = json(`${base}/successors/mpa-w14-mir3-dependency-regression-successor-v1.json`);
const w14v2 = json(`${base}/successors/mpa-w14-visual-raster-dependency-regression-successor-v2.json`);
const w30v2 = json(`${base}/successors/mpa-w30-w14-dependency-successor-v2.json`);
const pkg = json('package.json');

assert.equal(freeze.status, 'MPA-v1.0.0-FROZEN');
assert.equal(manifest.status, 'FROZEN_CONTENT_PRESERVATION_MANIFEST');
assert.equal(sha256(mcd5.predecessor.path), mcd5.predecessor.sha256);

const d2 = mcd2.authorizedDrift[0];
const d4 = mcd4.authorizedDrift[0];
const d5 = mcd5.authorizedDrift[0];
assert.equal(d2.successorSha256, d4.predecessorSha256);
assert.equal(d4.successorSha256, d5.predecessorSha256);
assert.equal(sha256(d5.path), d5.successorSha256);

assert.equal(w30v2.status, 'AUTHORIZED_POST_FREEZE_W14_DEPENDENCY_SUCCESSOR');
assert.equal(w30v2.predecessor.path, `${base}/successors/mpa-w14-mir3-dependency-regression-successor-v1.json`);
assert.equal(sha256(w30v2.predecessor.path), w30v2.predecessor.sha256);
assert.equal(w30v2.successor.path, `${base}/successors/mpa-w14-visual-raster-dependency-regression-successor-v2.json`);
assert.equal(sha256(w30v2.successor.path), w30v2.successor.sha256);
assert.equal(w30v2.predecessor.checkerSha256, mir3.successor.checkerSha256);
assert.equal(w30v2.successor.checkerSha256, w14v2.successor.checkerSha256);
assert.equal(w14v2.predecessor.checkerSha256, mir3.successor.checkerSha256);
assert.equal(w30v2.boundaries.historicalFreezeMutated, false);
assert.equal(w30v2.boundaries.historicalManifestMutated, false);
assert.equal(w30v2.boundaries.methodProductionEligibilityChanged, false);
assert.equal(w30v2.boundaries.professionalEligibilityChanged, false);
assert.equal(w30v2.boundaries.futureW14CheckerDriftRequiresVersionedSuccessor, true);

for (const record of manifest.entries) {
  if (record.reference === d5.path) {
    assert.equal(record.sha256, d2.predecessorSha256);
  } else if (record.reference === mir3.successor.checkerPath) {
    assert.equal(record.sha256, mir3.predecessor.checkerSha256);
    assert.equal(mir3.successor.checkerSha256, w14v2.predecessor.checkerSha256);
    assert.equal(sha256(record.reference), w14v2.successor.checkerSha256, 'Unauthorized MPA-W14 successor drift');
  } else {
    assert.equal(sha256(record.reference), record.sha256, `Unauthorized MPA freeze drift: ${record.reference}`);
  }
}

assert.equal(mir3.boundaries.historicalRegressionRegistryMutated, false);
assert.equal(mir3.boundaries.productionEligibilityChanged, false);
assert.equal(mir3.boundaries.professionalEligibilityChanged, false);
assert.equal(w14v2.boundaries.historicalRegressionRegistryMutated, false);
assert.equal(w14v2.boundaries.methodProductionEligibilityChanged, false);
assert.equal(w14v2.boundaries.professionalEligibilityChanged, false);
assert.equal(mcd5.projectionBoundary.coreRawSchemaPublic, false);
assert.equal(mcd5.projectionBoundary.interpretationAllowed, false);
assert.equal(mcd5.productionAuthority.HDR.dispatchAllowed, false);
assert.equal(pkg.scripts['check:mpa-w30'], 'node scripts/check-mpa-w30-mcd5-successor-freeze.mjs');
assert.equal(pkg.scripts['check:mpa-freeze'], 'npm run check:mpa-w30');
assert.equal(sha256(w30v2.checker.path), w30v2.checker.sha256, 'MPA_W30_SUCCESSOR_CHECKER_DRIFT');

console.log('✓ MPA-W30 → MCD-5 + MIR-3 + W14-v2 versioned successor freeze passed.');
console.log('  Historical MPA hashes remain authoritative; MCD projection, MIR-3 dependency evidence and the explicit sharp-only W14 successor are independently chained.');
