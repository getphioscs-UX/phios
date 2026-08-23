import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createIChingRuntime,ICHING_RUNTIME_CODE} from '../functions/core-method-runtime/iching-runtime.js';
import {manualLines} from './lib/iching/iching-fixtures-v1.mjs';

const runtime=createIChingRuntime();
async function calc(lines,id='T') { return runtime.calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId:`ICH-${id}`,evidence:manualLines(lines,{sessionId:`S-${id}`})}); }

let r=await calc([7,8,8,8,7,8],'HEX3');
assert.equal(r.output.primary.binary,'100010'); assert.equal(r.output.primary.hexagramId,'HEXAGRAM-03');
assert.deepEqual(r.output.changingLines,[]); assert.equal(r.output.relating.hexagramId,'HEXAGRAM-03');

r=await calc([6,6,6,6,6,6],'KUN-QIAN');
assert.equal(r.output.primary.hexagramId,'HEXAGRAM-02'); assert.equal(r.output.primary.binary,'000000');
assert.deepEqual(r.output.changingLines,[1,2,3,4,5,6]); assert.equal(r.output.changeMask,'111111');
assert.equal(r.output.relating.hexagramId,'HEXAGRAM-01'); assert.equal(r.output.relating.binary,'111111');
assert.deepEqual(r.output.trace,{inputLines:[6,6,6,6,6,6],normalization:{lineOrder:'BOTTOM_TO_TOP',selectedSymbolCount:6,randomSelectionReplayed:false,rerolledInsideCalculation:false},primaryBinary:'000000',primaryId:'HEXAGRAM-02',changeMask:'111111',relatingBinary:'111111',relatingId:'HEXAGRAM-01'});

r=await calc([9,9,9,9,9,9],'QIAN-KUN');
assert.equal(r.output.primary.hexagramId,'HEXAGRAM-01'); assert.equal(r.output.relating.hexagramId,'HEXAGRAM-02');
assert.deepEqual(r.output.changingLines,[1,2,3,4,5,6]);

r=await calc([6,9,7,8,6,7],'MULTI');
assert.deepEqual(r.output.changingLines,[1,2,5]); assert.equal(r.output.changeMask,'110010');
assert.equal(r.output.trace.primaryId,r.output.primary.hexagramId); assert.equal(r.output.trace.relatingId,r.output.relating.hexagramId);

const spec=JSON.parse(fs.readFileSync('content/professional/core-method-runtime/iching-transformation-runtime-v1.json','utf8'));
assert.deepEqual(spec.output,['primary','changingLines','relating','trace']);
assert.equal(spec.determinism.required,true); assert.equal(spec.authorityBoundary.sourceNeutral,true);
console.log('✓ ICH-W5/W6 transformation + trace passed.');
console.log('  Primary hexagram → change mask/changing lines → relating hexagram is deterministic bottom-to-top structural calculation.');
