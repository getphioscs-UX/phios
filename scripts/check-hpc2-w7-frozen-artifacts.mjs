import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(text(path), 'utf8').digest('hex');

const freezePath = 'content/web/homepage/hpc2/freeze/hpc2-w7-reality-surface-freeze-v1.json';
assert.ok(fs.existsSync(freezePath), `Missing HPC2-W7 freeze: ${freezePath}`);
const freeze = read(freezePath);
assert.equal(freeze.status, 'HPC2_W7_H06_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) {
  assert.ok(fs.existsSync(artifact.path), `Missing frozen HPC2-W7 artifact: ${artifact.path}`);
  assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W7 immutable artifact drift: ${artifact.path}`);
}
assert.equal(freeze.preservedBoundaries.humanVisualAcceptanceCreated, false);
assert.equal(freeze.preservedBoundaries.browserAcceptanceCreated, false);
assert.equal(freeze.preservedBoundaries.globalProductionAcceptanceCreated, false);

console.log('HPC2-W7 frozen artifacts: ACCEPTED');
