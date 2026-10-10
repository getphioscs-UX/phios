import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const freezePath = 'content/web-production/freeze/client-surface-global-invariants-freeze-v1.json';
assert.ok(fs.existsSync(freezePath), 'Missing frozen invariant authority: ' + freezePath);
const freeze = read(freezePath);

assert.equal(freeze.status, 'FROZEN_CLIENT_SURFACE_GLOBAL_INVARIANTS_FOUNDATION');
for (const artifact of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(artifact.path), 'Missing frozen invariant output: ' + artifact.path);
  assert.equal(sha256(artifact.path), artifact.sha256, 'Frozen invariant output drift: ' + artifact.path);
}
for (const value of Object.values(freeze.authorityFreeze)) assert.equal(value, true);

console.log('✓ Client Surface INV-01–INV-10 frozen artifacts remain byte-exact.');
console.log('✓ Current CKA reconciliation is evaluated only by the versioned successor checker.');
