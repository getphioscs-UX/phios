import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const checks = [
  'scripts/check-kir-r2-deterministic-answerability.mjs',
  'scripts/check-pai-r1-provider-registry.mjs',
  'scripts/check-pai-r1-runtime.mjs',
  'scripts/check-kir-r2-pai-composer-boundaries.mjs',
  'scripts/check-pai-r1-margin.mjs'
];
for(const checker of checks){
  const result=spawnSync(process.execPath,[checker],{stdio:'inherit',cwd:process.cwd()});
  assert.equal(result.status,0,checker);
}
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const acceptance=read('content/ai-economics/acceptance/pai-r1-w0-w10-acceptance-v1.json');
const freeze=read('content/ai-economics/freeze/pai-r1-w0-w10-freeze-v1.json');
assert.equal(acceptance.status,'PAI_R1_READY_FOR_PAID_ASK_PILOT');
assert.equal(acceptance.completed.length,12);
assert.ok(Object.values(acceptance.exitGates).every(Boolean));
assert.equal(acceptance.proof.t0DefaultProviderCalls,0);
assert.equal(acceptance.proof.normalProductionProviderAttemptLimit,1);
assert.equal(acceptance.proof.composerChoosesProvider,false);
assert.equal(acceptance.proof.paiOwnsKnowledgeAuthority,false);
assert.equal(acceptance.pilotBoundary.realProviderCostObserved,false);
assert.equal(freeze.status,acceptance.status);
assert.match(freeze.nextGate,/PHASE 5 PAID ASK PILOT/);
console.log('✓ PAI-R1-W0–W10 Acceptance and Freeze passed.');
console.log('  PAI_R1_READY_FOR_PAID_ASK_PILOT; no Paid Ask, CX-R31 or PVP W6+ authority was opened.');
