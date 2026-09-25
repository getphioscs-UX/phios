import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import './check-kap-m3-optional-quality-outcome.mjs';

const json = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const inventory = json('content/production-truth/consolidation/ptrc-w10-retirement-inventory-v1.json');
const candidate = json('content/production-truth/consolidation/ptrc-w10-release-candidate-v1.json');
const pkg = json('package.json');
assert.equal(inventory.schemaVersion, 'PTRC-W10.retirement-inventory.v1');
assert.equal(candidate.schemaVersion, 'PTRC-W10.release-candidate.v1');
assert.equal(candidate.status, 'BLOCKED_PENDING_RELEASE_EVIDENCE');
assert.equal(candidate.releaseName, 'PTRC-v1.0.0-Frozen');
assert.equal(candidate.frozen, false);
assert.equal(candidate.baselineCommit, '0f241bf737fdebcd859d7e9ae64e359d7698bbec');
assert.equal(inventory.deletionAuthorized, false);
const seen = new Set();
for (const entry of inventory.entries) {
  assert.ok(['KEEP', 'REPLACE', 'ARCHIVE', 'DELETE_AFTER_EVIDENCE'].includes(entry.disposition));
  assert.ok(entry.owner && entry.reason && entry.references.length);
  assert.ok(!seen.has(entry.path), `Duplicate inventory path: ${entry.path}`);
  seen.add(entry.path);
  assert.ok(fs.existsSync(entry.path), `Missing inventory path: ${entry.path}`);
  for (const ref of entry.references) assert.ok(fs.existsSync(ref), `Missing reference: ${ref}`);
  assert.equal(entry.removalApproved, false);
}
assert.equal(inventory.hashEncoding, 'UTF8_LF_NORMALIZED_SHA256');
assert.ok(inventory.generatedSnapshots.length > 0);
for (const entry of inventory.generatedSnapshots) {
  assert.ok(entry.path.startsWith('dist/') && !entry.path.includes('..'));
  const hash = crypto.createHash('sha256').update(fs.readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
  assert.equal(hash, entry.sha256, `Generated evidence drift: ${entry.path}`);
}
assert.equal(pkg.scripts['check:ptrc:w9-testamentary-report'], 'node scripts/check-ptrc-w9-testamentary-report.mjs');
assert.ok(pkg.scripts.check.endsWith('npm run check:ptrc:w9-testamentary-report && npm run check:ptrc:w10-consolidation'));
assert.ok(pkg.scripts['check:ptrc:machine'].startsWith('node scripts/check-ptrc-w0-production-truth-baseline.mjs && '));
const nodePin = json('content/production-truth/consolidation/ptrc-w10-node-runtime-pin-successor-v1.json');
assert.equal(nodePin.status, 'ACTIVE_NODE_PIN_RECONCILIATION');
assert.equal(fs.readFileSync('.node-version', 'utf8').trim(), nodePin.currentNodeVersion);
assert.equal(nodePin.currentNodeVersion, '22.16.0');
const workflow = fs.readFileSync('.github/workflows/ptrc-validation.yml', 'utf8');
assert.ok(workflow.includes('node-version-file: .node-version'));
for (const command of ['npm ci', 'npm run check:ptrc:machine', 'npm run check']) assert.ok(workflow.includes(command));
assert.equal(candidate.deployment.preview, null);
assert.equal(candidate.deployment.production, null);
assert.ok(candidate.blockers.includes('W7_TWO_HUMAN_REVIEWERS'));
assert.ok(candidate.blockers.includes('IMMUTABLE_DEPLOYMENT_AND_ROLLBACK_EVIDENCE'));
if (process.argv.includes('--release')) {
  // A candidate is never a release attestation. A governed successor must verify
  // real deployment, browser, build and rollback evidence before removing this block.
  throw new Error(`PTRC-W10 RELEASE BLOCKED: ${candidate.blockers.join('; ')}`);
}
console.log(`✓ PTRC-W10 candidate checks passed: ${inventory.entries.length} classified paths, ${inventory.generatedSnapshots.length} preserved generated snapshots.`);
console.log('  Release remains BLOCKED; no deletion, deployment or freeze is attested.');
