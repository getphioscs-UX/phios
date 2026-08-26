import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const run=path=>{
  const result=spawnSync(process.execPath,['--no-warnings',path],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(result.status,0,`${path}\n${result.stdout}\n${result.stderr}`);
  process.stdout.write(result.stdout);
};

for(const path of [
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
  'scripts/check-iching-machine-campaign.mjs',
  'scripts/check-iching-persistence-current-v2.mjs',
  'scripts/check-iching-live-activation.mjs',
  'scripts/check-iching-line-corpus-current.mjs',
  'scripts/check-iching-depth-w0-w2.mjs',
  'scripts/check-iching-human-review-readiness.mjs',
  'scripts/check-iching-activation-readiness-current-v2.mjs'
]) run(path);

const current=JSON.parse(fs.readFileSync('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v2.json','utf8'));
assert.equal(current.contentReadiness.sourceBoundCanonicalLineWitnessCoverage,'384/384');
assert.equal(current.currentAuthority.fullyActivated,false);

console.log('✓ I Ching current v3 chain passed: frozen predecessors + 64/64 canonical text + 384/384 line Runtime coverage + ICHI-DEPTH-W0-W2 foundation + ICH-HR-W0-W4 human-review readiness.');
