import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createIChingRuntime,ICHING_RUNTIME_CODE} from '../functions/core-method-runtime/iching-runtime.js';
import {createIChingHexagramProjector} from '../functions/core-method-runtime/iching-hexagram-projection-mapper.js';
import {manualLines} from './lib/iching/iching-fixtures-v1.mjs';

const calc=await createIChingRuntime().calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId:'ICH-PROJ-CALC-1',evidence:manualLines([6,7,8,9,7,8])});
const projection=await createIChingHexagramProjector().project({calculationResult:calc,projectionVersion:'1.0.0'});
assert.equal(projection.schemaVersion,'PHI-OS-CANONICAL-PROJECTION-v1.0.0');
assert.equal(projection.projectionType,'HEXAGRAM');
assert.deepEqual(Object.keys(projection.projectionValue),['type','primary','changingLines','relating']);
assert.equal(projection.projectionValue.type,'HEXAGRAM');
assert.equal(projection.projectionValue.primary.hexagramId,calc.output.primary.hexagramId);
assert.deepEqual(projection.projectionValue.changingLines,calc.output.changingLines);
assert.equal(projection.projectionValue.relating.hexagramId,calc.output.relating.hexagramId);
assert.equal(projection.projectionSource.methodCode,'I_CHING'); assert.equal(projection.projectionSource.pluginCode,'ICH');
assert.equal(projection.deterministic,true); assert.equal(projection.aiUsed,false); assert.equal(projection.providerUsed,false); assert.equal(projection.interpretationCreated,false);
const binding=JSON.parse(fs.readFileSync('content/professional/core-method-runtime/iching-shared-projection-binding-v1.json','utf8'));
assert.equal(binding.work,'ICH-W8'); assert.equal(binding.rules.dedicatedIChingProjectionRuntimeCreated,false); assert.equal(binding.rules.sharedProjectionRuntimeReused,true);
const collisions=[];
for (const base of ['content','functions']) {
  const walk=d=>{if(!fs.existsSync(d))return; for(const ent of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,ent.name); if(ent.isDirectory())walk(p); else if(/i[-_]?ching.*projection.*runtime/i.test(ent.name))collisions.push(p.replaceAll('\\','/'));}};
  walk(base);
}
assert.deepEqual(collisions,[]);
console.log('✓ ICH-W8 Shared HEXAGRAM Projection passed.');
console.log('  No dedicated I Ching projection runtime exists; mapper output is emitted by the existing Shared Projection Runtime.');
