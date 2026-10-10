import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const base = 'content/professional/method-production-activation';
const freeze = json(`${base}/freeze/mpa-production-activation-freeze-v1.json`);
const manifest = json(`${base}/freeze/mpa-w0-w29-content-preservation-manifest-v1.json`);
const mcd2 = json(`${base}/successors/mpa-w30-mcd2-adapter-successor-v1.json`);
const mcd4 = json(`${base}/successors/mpa-w30-mcd4-execution-successor-v1.json`);
const pkg = json('package.json');

assert.equal(freeze.status, 'MPA-v1.0.0-FROZEN');
assert.equal(manifest.status, 'FROZEN_CONTENT_PRESERVATION_MANIFEST');
assert.equal(mcd2.authorityOwner, 'MPA');
assert.equal(mcd4.authorityOwner, 'MPA');
assert.equal(mcd4.predecessor.predecessorMutated, false);
assert.equal(sha256(mcd4.predecessor.path), mcd4.predecessor.sha256);
const mcd2Api = mcd2.authorizedDrift.find(record => record.path === 'functions/api/method-execute.js');
const mcd4Api = mcd4.authorizedDrift.find(record => record.path === 'functions/api/method-execute.js');
assert.equal(mcd2Api.successorSha256, mcd4Api.predecessorSha256);
assert.equal(sha256(mcd4Api.path), mcd4Api.successorSha256);
for (const record of manifest.entries) {
  if (record.reference === mcd4Api.path) {
    assert.equal(record.sha256, mcd2Api.predecessorSha256);
  } else {
    assert.equal(sha256(record.reference), record.sha256, `Unauthorized MPA freeze drift: ${record.reference}`);
  }
}
assert.equal(mcd4.executionBoundary.canonicalProjectionDeferredTo, 'MCD-5');
assert.equal(mcd4.executionBoundary.interpretationAllowed, false);
assert.equal(mcd4.productionAuthority.HDR.dispatchAllowed, false);
assert.equal(pkg.scripts['check:mpa-w30'], 'node scripts/check-mpa-w30-mcd4-successor-freeze.mjs');
assert.equal(pkg.scripts['check:mpa-freeze'], 'npm run check:mpa-w30');

console.log('✓ MPA-W30 → MCD-4 versioned successor freeze passed.');
console.log('  The two-step MCD-2/MCD-4 API drift chain is authorized; all other frozen MPA artifacts remain byte-exact.');
