import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createAstronomyEngineLunarNodeAdapter } from '../functions/core-method-runtime/ast-lunar-node-adapter.js';
import { resolveGateLine } from '../functions/method-runtime/personal-structure/gate-line.js';

const fixture=JSON.parse(await fs.readFile('content/method/personal-structure/fixtures/teresa-lunar-node-true-reference-v1.json','utf8'));
const tolerance=JSON.parse(await fs.readFile('content/professional/method-production-activation/contracts/mpa-ast-tolerance-freeze-v1.json','utf8'));
const maxDeg=tolerance.angularComparison.maximumArcminutes/60;
const wrappedDiff=(a,b)=>Math.abs((((a-b+180)%360)+360)%360-180);
const adapter=createAstronomyEngineLunarNodeAdapter();
for(const [layer,data] of [['PERSONALITY',fixture.personality],['DESIGN',fixture.design]]){
  const result=await adapter.calculateTrueNode(data.instantUTC);
  assert.ok(wrappedDiff(result.northNodeLongitude,data.northNodeLongitudeDeg)<=maxDeg,`${layer} true-node reference tolerance`);
  assert.ok(wrappedDiff(result.southNodeLongitude,data.southNodeLongitudeDeg)<=maxDeg,`${layer} south-node reference tolerance`);
  const north=resolveGateLine(result.northNodeLongitude),south=resolveGateLine(result.southNodeLongitude);
  assert.deepEqual({gate:north.gate,line:north.line},data.expectedNorth,`${layer} north Gate.Line`);
  assert.deepEqual({gate:south.gate,line:south.line},data.expectedSouth,`${layer} south Gate.Line`);
  console.log(`${layer}: N ${result.northNodeLongitude.toFixed(12)}° => ${north.gate}.${north.line}; S ${result.southNodeLongitude.toFixed(12)}° => ${south.gate}.${south.line}`);
}
console.log('✓ Astronomy Engine 2.1.19 real-package Lunar Node integration passed against validation-only TRUE_NODE reference and the frozen 302° mapper.');
