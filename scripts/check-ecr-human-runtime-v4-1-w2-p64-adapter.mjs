import assert from 'node:assert/strict';import fs from 'node:fs';
import {resolveEcrP64} from '../functions/embodied-configuration/ecr-p64-mechanical-adapter.js';
import {GATE_COUNT,GATE_SPAN_DEG,LINE_COUNT,LINE_SPAN_DEG,gateWheelAngleToEclipticLongitude} from '../functions/method-runtime/personal-structure/gate-wheel.js';
assert.equal(resolveEcrP64(302).gate,41);assert.equal(resolveEcrP64(302).line,1);
assert.equal(resolveEcrP64(302.9375).line,2);assert.deepEqual(resolveEcrP64(360),resolveEcrP64(0));
const gates=new Set(),lines=new Set(),stages=new Set();
for(let i=0;i<GATE_COUNT;i++){
 const start=gateWheelAngleToEclipticLongitude(i*GATE_SPAN_DEG),p=resolveEcrP64(start);gates.add(p.gate);assert.equal(p.positionWithinGateDeg,0);
 for(let j=0;j<LINE_COUNT;j++){const q=resolveEcrP64(start+j*LINE_SPAN_DEG);lines.add(`${q.gate}.${q.line}`);assert.equal(q.line,j+1);assert.equal(q.lineBoundaryExact,true);if(j)assert.equal(resolveEcrP64(start+j*LINE_SPAN_DEG-1e-7).line,j);}
 for(let j=0;j<8;j++){const q=resolveEcrP64(start+j*GATE_SPAN_DEG/8);stages.add(q.activationStage);assert.equal(q.activationStage,`A${j+1}`);assert.equal(q.activationStageBoundaryExact,true);if(j)assert.equal(resolveEcrP64(start+j*GATE_SPAN_DEG/8-1e-7).activationStage,`A${j}`);}
}
assert.equal(gates.size,64);assert.equal(lines.size,384);assert.equal(stages.size,8);
assert.throws(()=>resolveEcrP64(NaN));assert.throws(()=>resolveEcrP64('302'));
assert(!fs.readFileSync('functions/embodied-configuration/ecr-p64-mechanical-adapter.js','utf8').includes('41,19'));
console.log('PASS V4.1 W2: 64 sectors, 384 exact line starts, 512 A8 boundaries and wrap.');
