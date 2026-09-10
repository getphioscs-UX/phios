import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

for(const checker of ['scripts/check-paid-ask-pilot-evidence.mjs','scripts/check-paid-ask-pilot-runtime.mjs','scripts/check-paid-ask-pilot-boundary.mjs']){
  const result=spawnSync(process.execPath,[checker],{cwd:process.cwd(),stdio:'inherit'});
  assert.equal(result.status,0,checker);
}
console.log('✓ PHASE 5 Paid Ask Pilot engineering package passed: PASK-W0–W9 ready, W10 correctly fail-closed.');
