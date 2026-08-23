import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createIChingRuntime,ICHING_RUNTIME_CODE} from '../functions/core-method-runtime/iching-runtime.js';
import {manualLines} from './lib/iching/iching-fixtures-v1.mjs';
const set=JSON.parse(fs.readFileSync('content/professional/core-method-runtime/iching-edge-case-fixtures-v1.json','utf8'));
const runtime=createIChingRuntime();
for (const f of set.fixtures) {
  const run=()=>runtime.calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId:f.fixtureId,evidence:manualLines(f.lines,{sessionId:f.fixtureId})});
  if (f.expectError) { await assert.rejects(run(),new RegExp(f.expectError)); continue; }
  const r=await run();
  assert.deepEqual(r.output.changingLines,f.expectChangingLines,f.fixtureId);
  if (f.expectPrimary) assert.equal(r.output.primary.hexagramId,f.expectPrimary,f.fixtureId);
  if (f.expectRelating) assert.equal(r.output.relating.hexagramId,f.expectRelating,f.fixtureId);
}
console.log(`✓ ICH-W12 Edge Cases passed: ${set.fixtures.length}/${set.fixtures.length} no/one/multiple/all-change, yin/yang and invalid cardinality/value fixtures.`);
