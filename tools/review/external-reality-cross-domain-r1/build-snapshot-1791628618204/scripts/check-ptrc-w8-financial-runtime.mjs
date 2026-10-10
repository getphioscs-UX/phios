import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runFinancialCalculator, financialCalculatorIds, PTRC_FINANCIAL_FORMULA_VERSION, PTRC_FINANCIAL_NON_ADVICE_NOTICE } from '../functions/professional/financial/financial-runtime-v1.js';

const matrix = JSON.parse(fs.readFileSync('content/production-truth/financial/ptrc-w8-financial-capability-matrix-v1.json','utf8'));
const requestSchema = JSON.parse(fs.readFileSync('content/production-truth/financial/contracts/ptrc-w8-financial-calculator-request-v1.schema.json','utf8'));
const resultSchema = JSON.parse(fs.readFileSync('content/production-truth/financial/contracts/ptrc-w8-financial-calculator-result-v1.schema.json','utf8'));
const contracts = JSON.parse(fs.readFileSync('content/production-truth/financial/contracts/ptrc-w8-financial-calculator-contracts-v1.json','utf8'));

assert.equal(matrix.status, 'ACTIVE_DETERMINISTIC_FINANCIAL_RUNTIME');
assert.equal(matrix.formulaVersion, PTRC_FINANCIAL_FORMULA_VERSION);
assert.equal(matrix.calculators.filter(x => x.status === 'PARTIAL').length, 0, 'PTRC_W8_UNEXPLAINED_PARTIAL');
assert.equal(matrix.advertisedCalculationCoverage.promisedCalculationCount, 11);
assert.equal(matrix.advertisedCalculationCoverage.implementedPromisedCalculationCount, 11);
assert.equal(matrix.advertisedCalculationCoverage.coverageRatio, 1);
assert.deepEqual(matrix.calculators.filter(x=>x.status==='IMPLEMENTED').map(x=>x.calculatorId).sort(), [...financialCalculatorIds()].sort());
for (const item of matrix.calculators.filter(x=>['UNAVAILABLE','PROHIBITED'].includes(x.status))) assert.ok(item.reason, `${item.calculatorId}:reason`);
for (const value of Object.values(matrix.boundaries)) assert.equal(value, false);
assert.ok(requestSchema.properties.calculatorId.enum.includes('RETIREMENT_SCENARIO'));
assert.ok(resultSchema.properties.status.enum.includes('NEEDS_INPUT'));
assert.equal(contracts.formulaVersion,PTRC_FINANCIAL_FORMULA_VERSION);
for (const id of financialCalculatorIds()) { const contract=contracts.calculators[id]; assert.ok(contract,`${id}:typed-contract`); assert.ok(contract.inputs&&contract.outputs&&contract.formula,`${id}:contract-fields`); }
assert.match(contracts.global.missingValueRule,/never impute numeric values/i);
assert.match(contracts.global.modelBoundary,/cannot create numeric inputs/i);

const base = { asOfDate:'2026-09-14', currency:'MYR', assumptions:['User-provided scenario inputs only'] };
const calc = (calculatorId, inputs, extra={}) => runFinancialCalculator({ ...base, calculatorId, inputs, ...extra });

// Golden fixtures.
const cash = calc('CASH_FLOW',{monthlyIncome:12000,monthlyExpenses:7000});
assert.equal(cash.values.monthlySurplusDeficit,5000); assert.equal(cash.values.savingsRatio,0.416667);
const nw = calc('NET_WORTH',{assets:[30000,50000,500000],liabilities:[180000]});
assert.equal(nw.values.netWorth,400000);
const debt = calc('DEBT',{principal:12000,annualInterestRate:0,monthlyPayment:1000});
assert.equal(debt.values.monthsToPayoff,12); assert.equal(debt.values.totalInterest,0);
const savings = calc('SAVINGS',{targetAmount:12000,currentSavings:0,horizonMonths:12,annualReturnRate:0});
assert.equal(savings.values.requiredMonthlyContribution,1000);
const compound = calc('COMPOUNDING',{principal:10000,annualRate:0,years:2,monthlyContribution:500});
assert.equal(compound.values.futureValue,22000);
const inflation = calc('INFLATION',{amount:1000,annualInflationRate:3,years:10});
assert.ok(Math.abs(inflation.values.futureEquivalentCost-1343.92)<=0.01);
const drawdown = calc('DRAWDOWN',{openingBalance:12000,monthlyWithdrawal:1000,annualReturnRate:0,months:24});
assert.equal(drawdown.values.monthsUntilDepletion,12); assert.equal(drawdown.values.endingBalance,0);
const affordability = calc('AFFORDABILITY',{monthlyIncome:10000,monthlyFixedExpenses:4000,monthlyDebtPayments:1000,proposedMonthlyCost:1500,maxExpenseRatio:.7});
assert.equal(affordability.values.monthlySurplusAfterProposedCost,3500); assert.equal(affordability.values.withinUserSuppliedRatio,true);
const retirement = calc('RETIREMENT_SCENARIO',{currentAssets:250000,monthlyContribution:0,years:10,annualReturnRate:0,targetAmountAtRetirement:500000,annualInflationRate:0});
assert.equal(retirement.values.projectedAssets,250000); assert.equal(retirement.values.projectedFundingGap,250000);
const estate = calc('ESTATE_SUMMARY',{assets:[500000,80000],liabilities:[180000]},{jurisdiction:'MY'});
assert.equal(estate.values.netEstateBeforeTaxFeesAndDistribution,400000); assert.equal(estate.values.taxCalculated,false);

// Missing-input / jurisdiction boundary: focused request, never guessed result.
const estateMissingJurisdiction = calc('ESTATE_SUMMARY',{assets:[100],liabilities:[10]});
assert.equal(estateMissingJurisdiction.status,'NEEDS_INPUT'); assert.deepEqual(estatesort(estateMissingJurisdiction.missing),['jurisdiction']); assert.equal(estateMissingJurisdiction.guessedInputs,false);
const missingDate = runFinancialCalculator({calculatorId:'CASH_FLOW',currency:'MYR',inputs:{monthlyIncome:1,monthlyExpenses:1}});
assert.equal(missingDate.status,'NEEDS_INPUT'); assert.ok(missingDate.missing.includes('asOfDate'));

// Property-style checks: compounding must reconcile with zero-rate arithmetic and inflation transforms must be inverse within tolerance.
for (let principal=0; principal<=10000; principal+=1000) {
  const out=calc('COMPOUNDING',{principal,annualRate:0,years:3,monthlyContribution:100});
  assert.equal(out.values.futureValue,principal+3600);
}
for (const rate of [0,1,3,5,8]) {
  const out=calc('INFLATION',{amount:2500,annualInflationRate:rate,years:7});
  const factor=out.values.inflationFactor;
  assert.ok(Math.abs((out.values.futureEquivalentCost/factor)-2500)<0.02);
}

// Cross-calculator reconciliation with the existing M4A 16-metric engine.
const position = calc('FINANCIAL_POSITION',{
  income:[12000],expenses:[7000],assets:[580000],liquid_assets:[30000],liabilities:[180000],current_liabilities:[12000],monthly_debt_repayment:2500,
  insurance_need:500000,insurance_cover:300000,retirement_target:1000000,retirement_assets:250000,education_target:300000,education_fund:50000
},{inputEvidenceIds:['ptrc-fixture'],inputSources:['ptrc-fixture']});
assert.equal(position.values.monthly_surplus_deficit,cash.values.monthlySurplusDeficit);
assert.equal(position.values.net_worth,nw.values.netWorth);

// Every successful result carries visible calculation governance and cannot be overridden by model prose.
for (const result of [cash,nw,debt,savings,compound,inflation,drawdown,affordability,retirement,estate,position]) {
  assert.equal(result.ok,true); assert.equal(result.formulaVersion,PTRC_FINANCIAL_FORMULA_VERSION); assert.equal(result.asOfDate,'2026-09-14');
  assert.equal(result.currency,'MYR'); assert.ok(result.notices.includes(PTRC_FINANCIAL_NON_ADVICE_NOTICE));
  assert.equal(result.provenance.numericInputsSource,'CALLER_PROVIDED_ONLY'); assert.equal(result.provenance.modelGeneratedNumericInputs,false); assert.equal(result.provenance.engineResultMayBeOverriddenByModel,false);
  assert.equal(result.recommendationCreated,false); assert.equal(result.projectedOutcomeGuaranteed,false);
}

function estatesort(values){ return [...values].sort(); }
console.log('✓ PTRC-W8 Financial runtime completion passed.');
console.log('  11/11 promised calculator families are implemented deterministically; PARTIAL=0; tax rules remain explicitly unavailable and automatic product recommendation prohibited.');
console.log('  Golden, boundary, property-style, and cross-calculator reconciliation fixtures passed; assumptions/formula/as-of/non-advice/provenance are present on every calculated result.');
