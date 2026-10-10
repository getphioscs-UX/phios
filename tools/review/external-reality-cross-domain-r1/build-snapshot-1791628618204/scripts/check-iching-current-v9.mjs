import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const run=(p,{historicalLabel=null}={})=>{
  const r=spawnSync(process.execPath,['--no-warnings',p],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(r.status,0,`${p}\n${r.stdout}\n${r.stderr}`);
  if(historicalLabel) console.log(`✓ ${historicalLabel}`); else process.stdout.write(r.stdout);
};

for(const p of [
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
  'scripts/check-symbolic-browser.mjs'
]) run(p);

run('scripts/check-symbolic-human-review-gate.mjs',{historicalLabel:'Pre-acceptance symbolic human-review gate remains historical; accepted current evidence supersedes its pending wording.'});

for(const p of [
  'scripts/check-iching-machine-campaign.mjs',
  'scripts/check-iching-persistence-current-v4.mjs',
  'scripts/check-iching-line-corpus-current.mjs'
]) run(p);

run('scripts/check-iching-depth-w0-w8.mjs',{historicalLabel:'ICHI-DEPTH W0-W8 0/448 state remains historical; 448/448 current admission is unchanged.'});

for(const p of [
  'scripts/check-iching-human-review-readiness.mjs',
  'scripts/check-iching-human-acceptance.mjs',
  'scripts/check-iching-depth-human-acceptance-v2.mjs',
  'scripts/check-iching-depth-current-v7.mjs',
  'scripts/check-iching-depth-product-runtime-current-v1.mjs',
  'scripts/check-iching-limited-production-static-v2.mjs',
  'scripts/check-iching-limited-production-freeze-v2.mjs',
  'scripts/check-iching-limited-production-evidence-v1.mjs',
  'scripts/check-iching-limited-production-observation-v2.mjs',
  'scripts/check-iching-w33-final-limited-production-acceptance-v1.mjs',
  'scripts/check-iching-activation-readiness-current-v6.mjs'
]) run(p);

const depth=JSON.parse(fs.readFileSync('content/interpretation/iching/reconciliation/iching-depth-current-successor-v7.json','utf8'));
const cur=JSON.parse(fs.readFileSync('content/production/symbolic-method/reconciliation/iching-limited-production-current-successor-v3.json','utf8'));
const w33=JSON.parse(fs.readFileSync('content/production/symbolic-method/acceptance/iching-final-limited-production-acceptance-v1.json','utf8'));
const ready=JSON.parse(fs.readFileSync('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v6.json','utf8'));

assert.equal(depth.singleAuthority.currentMasterChecker,'scripts/check-iching-current-v9.mjs');
assert.equal(depth.admittedCoverage.humanApproved,'448/448');
assert.equal(depth.runtimeAcceptance.bilingualProductCases,'896/896');
assert.equal(cur.currentMasterChecker,'scripts/check-iching-current-v9.mjs');
assert.equal(cur.authority.state,'LIMITED_PRODUCTION');
assert.equal(cur.authority.finalLimitedProductionAcceptance,true);
assert.equal(cur.authority.fullProduction,false);
assert.equal(cur.authority.globalPublicExecution,false);
assert.equal(cur.authority.productionCapabilityPromoted,false);
assert.equal(w33.finalDecision.finalLimitedProductionAcceptance,true);
assert.equal(w33.finalDecision.fullProductionGranted,false);
assert.equal(ready.fullProductionGates.w32R1SuccessorObservationAccepted,true);
assert.equal(ready.fullProductionGates.w33FinalProductionAcceptance,true);
assert.equal(ready.fullProductionGates.globalPublicExecutionApproved,false);
assert.equal(ready.fullProductionGates.fullProductionFreezeCreated,false);

console.log('✓ I Ching current v9 master chain passed: W31 historical first-live + W32R1 live observation + W33 final LIMITED_PRODUCTION acceptance are current without reopening 24/24, 448/448, 896/896 or persistence.');
console.log('  Governed beta remains LIMITED_PRODUCTION; FULL_PRODUCTION, global public execution and production capability promotion require a separate successor.');
