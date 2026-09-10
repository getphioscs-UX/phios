import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const checks=[
  'scripts/check-cx-r31-w0-entry-census.mjs',
  'scripts/check-cx-r31-w1-universal-ask.mjs',
  'scripts/check-cx-r31-w2-context-boundary.mjs',
  'scripts/check-cx-r31-w3-next-steps.mjs',
  'scripts/check-cx-r31-w4-w5-handoff-direct-routes.mjs',
  'scripts/check-cx-r31-w6-paid-upgrade-ux.mjs',
  'scripts/check-cx-r31-w7-reality-return.mjs',
  'scripts/check-cx-r31-w8-responsive.mjs',
  'scripts/check-cx-r31-w9-human-first-use-gate.mjs'
];
for(const checker of checks){const r=spawnSync(process.execPath,[checker],{cwd:process.cwd(),stdio:'inherit'});assert.equal(r.status,0,checker);}
console.log('✓ PHASE 6 CX-R31 machine package passed: W0–W8 accepted, W9 ready for human first-use review, Phase 7 still blocked.');
