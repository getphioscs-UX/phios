import assert from 'node:assert/strict';
import {createIChingRuntime,ICHING_RUNTIME_CODE} from '../functions/core-method-runtime/iching-runtime.js';
import {createIChingHexagramProjector} from '../functions/core-method-runtime/iching-hexagram-projection-mapper.js';
import {evidence} from './lib/iching/iching-fixtures-v1.mjs';

const runtime=createIChingRuntime(); const projector=createIChingHexagramProjector();
const ev=evidence({inputMode:'SYSTEM_RANDOM',selectedSymbols:['9','7','8','6','7','9'],sessionId:'ICH-REPLAY-SESSION'});
let expected=null;
for (let i=0;i<1000;i++) {
  const result=await runtime.calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId:'ICH-REPLAY-CALC',evidence:ev});
  const projection=await projector.project({calculationResult:result,projectionVersion:'1.0.0'});
  const snapshot={inputDigest:result.inputDigest,outputDigest:result.outputDigest,primary:result.output.primary.hexagramId,changingLines:result.output.changingLines,relating:result.output.relating.hexagramId,projectionCode:projection.projectionCode};
  if (!expected) expected=snapshot; else assert.deepEqual(snapshot,expected,`ICH-W9 replay drift at run ${i+1}`);
}
console.log('✓ ICH-W9 Replay passed: 1000/1000 identical calculation + Shared HEXAGRAM projection results from the same persisted SYSTEM_RANDOM evidence.');
