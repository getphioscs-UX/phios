import assert from 'node:assert/strict';
import fs from 'node:fs';

const benchmark = JSON.parse(fs.readFileSync('content/ai-economics/benchmarks/pai-margin-benchmark-v1.json','utf8'));
assert.equal(benchmark.status,'MARGIN_BENCHMARK_READY_FOR_PAID_ASK_PILOT');
assert.equal(benchmark.actualEconomicsObserved,false);
for(const scenario of benchmark.scenarios){
  const mixTotal=Object.values(scenario.executionClassMix).reduce((sum,value)=>sum+value,0);
  assert.ok(Math.abs(mixTotal-1)<1e-9,scenario.code);
  const providerCostUsd=scenario.requestsPerUser*Object.entries(scenario.executionClassMix).reduce((sum,[code,share])=>sum+share*benchmark.perRequestProviderCostUsd[code],0);
  scenario.estimatedProviderCostMyr=providerCostUsd*benchmark.usdToMyrPlanningRate;
}
for(const plan of benchmark.plans){
  if(plan.code==='FREE'){assert.equal(plan.costCeilingMyr,0);continue;}
  const scenario=benchmark.scenarios.find(item=>item.code===plan.scenario);
  assert.ok(scenario,plan.code);
  assert.ok(plan.revenueMyr-scenario.estimatedProviderCostMyr>0,plan.code);
}
assert.ok(benchmark.pilotRequirements.includes('REPLACE_EXECUTION_MIX_WITH_OBSERVED_DATA'));
console.log('✓ PAI-R1-W10 margin benchmark passed across light, normal, heavy and extreme planning scenarios.');
console.log('  Rates/mix remain planning inputs; Phase 5 must replace them with observed provider cost and real usage.');
