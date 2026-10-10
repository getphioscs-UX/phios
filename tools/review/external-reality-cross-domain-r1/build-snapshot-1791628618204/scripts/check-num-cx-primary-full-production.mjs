import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const run=s=>{const r=spawnSync(process.execPath,[s],{encoding:'utf8'});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status!==0)throw new Error(`FAILED:${s}`)};
for(const s of [
  'scripts/check-num-cx-w17-human-acceptance.mjs',
  'scripts/check-num-cx-w18-primary-cutover-gate.mjs',
  'scripts/check-runtime-frontend-parity-v9.mjs',
  'scripts/check-num-cx-w4-w9-primary-presentation.mjs',
  'scripts/check-num-cx-w10-w13-primary-state.mjs',
  'scripts/check-num-cx-w14-primary-machine-campaign.mjs',
  'scripts/check-num-cx-w15-w16-dom-visual.mjs'
]) run(s);
const status=j('content/professional/num-production/customer/num-cx-w10-w18-status-v1.json');
assert.equal(status.status,'NUM_CX_W10_W18_FULL_PRIMARY_CUSTOMER_PRODUCTION_ACTIVE');
assert.equal(status.cutover['NUM-CX-W18'],'FULL_PRIMARY_CUSTOMER_ROUTE_AUTHORITY_ACTIVE');
assert.equal(status.cutover.currentPCMRegistry,'v9');
assert.equal(status.boundaries.humanAcceptanceFabricated,false);
assert.equal(status.boundaries.predecessorPCMRegistryMutated,false);
assert.equal(status.boundaries.fullPrimaryRouteAuthorityCutoverClaimed,true);
assert.equal(status.boundaries.externalDeploymentVerified,false);
console.log('✓ NUM-CX primary customer Chart-first Full Production source-authority gate passed.');
console.log('  External deployment verification remains explicitly pending and is not fabricated.');
