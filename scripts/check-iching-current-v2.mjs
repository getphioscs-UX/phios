import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const historical = 'scripts/check-iching-current.mjs';
const historicalSha = 'b4cc115ce02341ef1fb9117b5588b33d1caf113c179e0e4b77f903af7210dd29';
assert.equal(sha(historical), historicalSha, 'historical I Ching current checker mutated');

const checkers = [
  'scripts/check-iching-identity.mjs',
  'scripts/check-iching-calculation.mjs',
  'scripts/check-iching-transformation.mjs',
  'scripts/check-iching-projection.mjs',
  'scripts/check-iching-replay.mjs',
  'scripts/check-iching-edge-cases.mjs',
  'scripts/check-iching-freeze.mjs',
  'scripts/check-iching-interpretation-reality.mjs',
  'scripts/check-symbolic-public-ux.mjs',
  'scripts/check-symbolic-sensitive-domain-guard.mjs',
  'scripts/check-symbolic-browser.mjs',
  'scripts/check-symbolic-human-review-gate.mjs',
  'scripts/check-iching-product-runtime-current-v2.mjs',
  'scripts/check-iching-machine-campaign.mjs',
  'scripts/check-iching-persistence.mjs',
  'scripts/check-iching-live-activation.mjs'
];
for (const path of checkers) {
  const result = spawnSync(process.execPath, ['--no-warnings', path], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 0, `${path}\n${result.stdout}\n${result.stderr}`);
  process.stdout.write(result.stdout);
}

const machine = read('content/production/symbolic-method/acceptance/iching-machine-acceptance-v2.json');
const readiness = read('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v1.json');
assert.equal(machine.machineAcceptanceComplete, true);
assert.equal(machine.accepted.canonicalHexagramCoverage, 64);
assert.equal(readiness.currentAuthority.fullyActivated, false);
assert.equal(readiness.externalGates.acceptedHumanSessions, 0);
assert.equal(readiness.contentReadiness.sourceBoundCommentaryCoverage, '2/64');

console.log('✓ I Ching current v2 chain passed: source Runtime + 64/64 product machine acceptance + shared D1 persistence source + live gate structure.');
console.log('  Fully activated remains false until human, verified live account/D1, browser, deployed SHA and full-content gates are closed.');
