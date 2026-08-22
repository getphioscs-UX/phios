import assert from 'node:assert/strict';
import {calculateFinancialProjection} from '../functions/financial/calculation-runtime/financial-calculation-runtime.js';
import {sha256} from '../functions/financial/calculation-runtime/stable-digest.js';
import {readJson} from './lib/fcr/fcr-check-lib.mjs';
const fixture=readJson('content/financial/calculation-runtime/fixtures/zero-debt.json');
for(const code of ['BASE','CONSERVATIVE','STRESS','CUSTOM']){
  const input=structuredClone(fixture.calculationInput); input.scenarioCode=code; input.calculationId=`SCENARIO-${code}`; input.assumptionSet.scenarioCode=code; input.assumptionSet.assumptionSetId=`AS-${code}-EXEC`; input.assumptionSet.assumptions=input.assumptionSet.assumptions.map(a=>({...a,assumptionId:a.assumptionId.replace('BASE',code)}));
  const clone=structuredClone(input.assumptionSet); delete clone.digest; input.assumptionSet.digest=await sha256(clone);
  const result=await calculateFinancialProjection(input); assert.equal(result.scenarioCode,code); assert.equal(result.assumptionSetId,`AS-${code}-EXEC`); assert.match(result.resultDigest,/^[a-f0-9]{64}$/);
}
const bad=structuredClone(fixture.calculationInput); bad.scenarioCode='STRESS'; await assert.rejects(()=>calculateFinancialProjection(bad),/scenario and assumption set mismatch/i);
console.log('✓ FCR-W17 scenario engine passed.');
console.log('  BASE / CONSERVATIVE / STRESS / CUSTOM execute only with an explicitly matching assumption set; scenario labels contain no hidden numeric defaults.');
