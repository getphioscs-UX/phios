import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {calculateFinancialProjection,FCR_ENGINES} from '../functions/financial/calculation-runtime/financial-calculation-runtime.js';
import {readJson,strings} from './lib/fcr/fcr-check-lib.mjs';
const dir='content/financial/calculation-runtime/fixtures';
const registry=readJson(`${dir}/fcr-fixture-registry-v1.json`);
for(const required of registry.requiredScenarios) assert.ok(registry.fixtures.includes(`${required}.json`),`Missing FCR fixture: ${required}`);
const results={};
for(const file of registry.fixtures){
 const fixture=readJson(`${dir}/${file}`); const result=await calculateFinancialProjection(fixture.calculationInput); results[fixture.scenario]=result;
 assert.equal(result.runtimeCode,'FINANCIAL_CALCULATION_RUNTIME'); assert.equal(result.runtimeVersion,'1.0.0'); assert.match(result.resultDigest,/^[a-f0-9]{64}$/); assert.match(result.determinismKey,/^[a-f0-9]{64}$/);
 assert.equal(result.analysisCreated,false); assert.equal(result.adviceCreated,false); assert.equal(result.professionalJudgmentCreated,false); assert.equal(result.recommendationCreated,false); assert.equal(result.inventedMissingValue,false); assert.equal(result.rangeCollapsedToMidpoint,false);
 for(const engine of Object.values(result.engines)) for(const metric of Object.values(engine.metrics)){
   assert.ok(metric.trace.formula); assert.ok(Array.isArray(metric.trace.inputReferences)); assert.ok(Array.isArray(metric.trace.assumptionReferences)); assert.equal(metric.trace.recommendationCreated,false); assert.equal(metric.trace.professionalJudgmentCreated,false);
 }
 const forbidden=/\b(should buy|should sell|recommend buying|recommend selling|best product|high risk|low risk)\b/i; assert.equal(strings(result).some(s=>forbidden.test(s)),false,`${file} contains advisory/judgment text`);
}
assert.equal(results['zero-debt'].engines.DEBT.metrics.debtToAsset.value.value,0);
assert.ok(results['negative-cashflow'].engines.CASH_FLOW.metrics.savings.value.value<0); assert.ok(results['negative-cashflow'].engines.CASH_FLOW.metrics.deficit.value.value>0);
const range=results['range-input'].engines.NET_WORTH.metrics.grossAssets.value; assert.equal(range.kind,'RANGE'); assert.equal(range.min,100000); assert.equal(range.max,200000); assert.equal(results['range-input'].engines.ALLOCATION.metrics.investmentPercent.value.value,100);
assert.equal(results['multi-currency'].baseCurrency,'MYR'); assert.equal(results['multi-currency'].engines.NET_WORTH.metrics.grossAssets.value.value,500000); assert.ok(results['multi-currency'].engines.CURRENCY.metrics.fx_USD_MYR.trace.assumptionReferences.length===1);
assert.equal(results['large-guarantee'].engines.CONTINGENT_EXPOSURE.metrics.exposure.value.value,7500000);
assert.equal(results['missing-value'].engines.NET_WORTH.metrics.grossAssets.value.kind,'UNKNOWN'); assert.equal(results['missing-value'].engines.NET_WORTH.metrics.netWorth.value.kind,'UNKNOWN');
for(const m of ['incomeAtRetirement','requiredIncome','capitalRequired','availableRetirementAssets','shortfall','annualContributionNeeded']) assert.notEqual(results.retirement.engines.RETIREMENT.metrics[m].value.kind,'UNKNOWN',m);
for(const m of ['futureEducationCost','existingFunding','requiredContribution','fundingGap']) assert.notEqual(results.education.engines.EDUCATION_FUNDING.metrics[m].value.kind,'UNKNOWN',m);
for(const m of ['knownLiabilities','estateExpensesAssumption','liquidEstate','estimatedLiquidityGap']) assert.notEqual(results.estate.engines.ESTATE_LIQUIDITY.metrics[m].value.kind,'UNKNOWN',m);
assert.notEqual(results['business-owner'].engines.BUSINESS_WEALTH.metrics.businessConcentration.value.kind,'UNKNOWN');
console.log('✓ FCR-W3–W20 executable engine + edge fixture runtime passed.');
console.log(`  ${registry.fixtures.length} fixtures executed across ${FCR_ENGINES.length} engines; range, FX, missing-value, guarantee, retirement, education and estate boundaries verified.`);
