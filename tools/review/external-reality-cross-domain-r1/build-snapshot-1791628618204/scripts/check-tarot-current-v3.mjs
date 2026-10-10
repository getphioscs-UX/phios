import {spawnSync} from 'node:child_process';import fs from 'node:fs';import assert from 'node:assert/strict';
const run=name=>{const r=spawnSync('npm',['run',name],{stdio:'inherit',shell:true});if(r.status!==0)process.exit(r.status??1);};
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
run('check:tarot-product-activation-phase-m-readiness');
const s=j('content/production/symbolic-method/reconciliation/tarot-current-checker-successor-v3.json');assert.equal(s.productionBoundary.staticRunAllowed,false);assert.equal(s.productionBoundary.clientMayGrantAuthority,false);assert.equal(s.current.pcmCapability,'LIMITED');
const liveL='.runtime-evidence/tarot-production-sha-alignment-v2.json',liveM='.runtime-evidence/tarot-production-capability-live-evidence-v1.json';
if(fs.existsSync(liveL)&&fs.existsSync(liveM)){
  run('check:tarot-production-capability-live');
  console.log('✓ Tarot current v3 passed: Phase-M source + exact-SHA server D1 authority + live smoke are current; LIMITED_PRODUCTION is active for the deployed commit.');
}else{
  console.log('✓ Tarot current v3 source chain passed: Phase-M is ready for commit/push/deploy.');
  console.log('  Live LIMITED_PRODUCTION remains pending until Phase-L v2 verification and server D1 promotion evidence exist for the exact deployed commit.');
}
