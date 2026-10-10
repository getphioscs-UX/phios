import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const run=(path,{historicalLabel=null}={})=>{
  const r=spawnSync(process.execPath,['--no-warnings',path],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(r.status,0,`${path}\n${r.stdout}\n${r.stderr}`);
  if(historicalLabel) console.log(`✓ ${historicalLabel}`); else process.stdout.write(r.stdout);
};
for(const path of [
  'scripts/check-iching-identity.mjs','scripts/check-iching-calculation.mjs','scripts/check-iching-transformation.mjs','scripts/check-iching-projection.mjs','scripts/check-iching-replay.mjs','scripts/check-iching-edge-cases.mjs','scripts/check-iching-freeze.mjs',
  'scripts/check-iching-interpretation-reality.mjs','scripts/check-symbolic-public-ux.mjs','scripts/check-symbolic-sensitive-domain-guard.mjs','scripts/check-symbolic-browser.mjs'
]) run(path);
run('scripts/check-symbolic-human-review-gate.mjs',{historicalLabel:'Pre-acceptance symbolic human-review gate remains intact; its pending wording is historical and is superseded below by accepted current evidence.'});
for(const path of ['scripts/check-iching-machine-campaign.mjs','scripts/check-iching-persistence-current-v3.mjs','scripts/check-iching-live-activation.mjs','scripts/check-iching-line-corpus-current.mjs']) run(path);
run('scripts/check-iching-depth-w0-w8.mjs',{historicalLabel:'ICHI-DEPTH W0-W8 engineering predecessor remains intact; its 0/448 admission state is historical and is superseded below by the 448/448 current successor.'});
for(const path of [
  'scripts/check-iching-human-review-readiness.mjs','scripts/check-iching-human-acceptance.mjs','scripts/check-iching-depth-human-acceptance-v2.mjs','scripts/check-iching-depth-current-v3.mjs','scripts/check-iching-depth-product-runtime-current-v1.mjs','scripts/check-iching-activation-readiness-current-v3.mjs'
]) run(path);
const successor=JSON.parse(fs.readFileSync('content/interpretation/iching/reconciliation/iching-depth-current-successor-v3.json','utf8'));
const readiness=JSON.parse(fs.readFileSync('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v3.json','utf8'));
assert.equal(successor.status,'448_HUMAN_APPROVED_DEPTH_CURRENT_RECONCILED_MUTABLE_ORCHESTRATION_DECOUPLED_EXTERNAL_ACTIVATION_PENDING');
assert.equal(successor.singleAuthority.currentMasterChecker,'scripts/check-iching-current-v5.mjs');
assert.equal(successor.singleAuthority.depthCurrentChecker,'scripts/check-iching-depth-current-v3.mjs');
assert.equal(successor.admittedCoverage.humanApproved,'448/448');
assert.equal(readiness.contentReadiness.humanInterpretiveReviewComplete,true);
assert.equal(readiness.currentAuthority.publicRunAllowed,false);
console.log('✓ I Ching current v5 master chain passed: frozen predecessors + current shared persistence + 24/24 base human acceptance + 448/448 depth acceptance/admission + 896/896 bilingual depth product cases.');
console.log('  Package orchestration is no longer a false domain-drift trigger; external activation gates remain separate before LIMITED_PRODUCTION.');
