import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {ROOT,readJson,sha256,assertEvidence} from './lib/knowledge-answer-projection/kap-foundation-v1.mjs';
const pkg=readJson('package.json');
const aliases=['check:kap-w0','check:kap-w1','check:kap-w2','check:kap-w3'];
for(const a of aliases) assert.ok(pkg.scripts[a],`MISSING_SCRIPT:${a}`);
const acceptance=readJson(`${ROOT}/acceptance/kap-w0-w3-authority-foundation-acceptance-v1.json`); const freeze=readJson(`${ROOT}/freeze/kap-w0-w3-authority-foundation-freeze-v1.json`);
assert.equal(acceptance.status,'ACCEPTED_AUTHORITY_FOUNDATION_ONLY'); assert.equal(acceptance.nextPermittedWork,'KAP-W4_QUESTION_INTAKE');
assert.equal(freeze.status,'FROZEN_AUTHORITY_FOUNDATION_NO_RUNTIME_ACTIVATION');
for(const item of freeze.frozenOutputs) assertEvidence(item); for(const item of freeze.predecessorEvidence) assertEvidence(item);
assert.deepEqual(freeze.authorityFreeze,{knowledge:'PRESERVED',answer:'NON_AUTHORITATIVE_PROJECTION_ONLY',publication:'PRESERVED_PJA_CAR',realityReading:'PRESERVED_CASE_EVIDENCE_SCOPED',rreActivation:'UNCHANGED_VALIDATION_ONLY'});
for(const [k,v] of Object.entries(freeze.nonActivation)) assert.equal(v,false,`UNEXPECTED_ACTIVATION:${k}`);
for(const a of aliases){ const cmd=pkg.scripts[a]; const [exe,...args]=cmd.split(' '); assert.equal(exe,'node'); const run=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8'}); assert.equal(run.status,0,`${a} failed\n${run.stdout}\n${run.stderr}`); process.stdout.write(run.stdout); }
assert.equal(pkg.scripts['check:kap-foundation'],'node scripts/check-kap-w0-w3-authority-foundation.mjs'); const kapSegments=String(pkg.scripts['check:kap']||'').split(' && '); assert.equal(kapSegments[0],'npm run check:kap-foundation');
console.log('✓ KAP Phase 1 W0-W3 Authority Foundation accepted and frozen.');
console.log('  Knowledge / Answer / Publication / Reality Reading boundaries remain frozen; KAP-W0-W3 themselves create no MCD, AI, Guided Reading or client-surface authority.');
