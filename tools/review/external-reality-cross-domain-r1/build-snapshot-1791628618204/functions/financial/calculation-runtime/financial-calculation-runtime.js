/** PHI OS FCR v1 — canonical deterministic financial calculation runtime. */
import { exact, approximate, range, unknown, isUnknown, add, subtract, multiply, divide, scale, maxZero, sum, pow, fromFact, withCurrency } from './range-arithmetic.js';
import { stableSerialize, sha256 } from './stable-digest.js';
import { createTrace } from './trace-runtime.js';

export const FCR_RUNTIME_CODE = 'FINANCIAL_CALCULATION_RUNTIME';
export const FCR_RUNTIME_VERSION = '1.0.0';
export const FCR_SCENARIOS = Object.freeze(['BASE','CONSERVATIVE','STRESS','CUSTOM']);
export const FCR_ENGINES = Object.freeze([
  'CURRENCY','NET_WORTH','LIQUIDITY','CASH_FLOW','DEBT','CONTINGENT_EXPOSURE',
  'EMERGENCY_RESERVE','PROTECTION_NEED','EDUCATION_FUNDING','RETIREMENT',
  'INVESTMENT_PROJECTION','ESTATE_LIQUIDITY','BUSINESS_WEALTH','ALLOCATION'
]);
const LIQUID_TYPES = new Set(['CASH','BANK_ACCOUNT','FIXED_DEPOSIT']);
const ALLOCATION = Object.freeze({
  cash: new Set(['CASH','BANK_ACCOUNT','FIXED_DEPOSIT']),
  property: new Set(['PROPERTY']),
  business: new Set(['PRIVATE_COMPANY_SHARE','BUSINESS_INTEREST']),
  investment: new Set(['UNIT_TRUST','LISTED_SECURITY','DIGITAL_ASSET']),
  retirement: new Set(['EPF','PRS'])
});

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function required(value, name) { const v=text(value); if(!v) throw new TypeError(`${name} is required.`); return v; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function refs(...groups) { return [...new Set(groups.flat(Infinity).filter(Boolean).map(String))]; }
function yearFraction(from, to) {
  const a=Date.parse(`${from}T00:00:00Z`), b=Date.parse(`${to}T00:00:00Z`);
  if(!Number.isFinite(a)||!Number.isFinite(b)) return null;
  return Math.max(0,(b-a)/(365.2425*86400000));
}
function fullYears(birthDate, asOfDate) {
  const b=new Date(`${birthDate}T00:00:00Z`), a=new Date(`${asOfDate}T00:00:00Z`);
  if(!Number.isFinite(b.getTime())||!Number.isFinite(a.getTime())) return null;
  let age=a.getUTCFullYear()-b.getUTCFullYear();
  if(a.getUTCMonth()<b.getUTCMonth()||(a.getUTCMonth()===b.getUTCMonth()&&a.getUTCDate()<b.getUTCDate())) age--;
  return age;
}
function valueFromGoalTarget(target, fallbackCurrency) {
  if (typeof target === 'number') return exact(target,{currency:fallbackCurrency});
  if (target && typeof target === 'object') {
    if (typeof target.amount === 'number') return exact(target.amount,{currency:target.currency||fallbackCurrency});
    if (typeof target.min === 'number' && typeof target.max === 'number') return range(target.min,target.max,{currency:target.currency||fallbackCurrency});
  }
  return unknown('UNKNOWN_GOAL_TARGET',{currency:fallbackCurrency});
}
function domainUnavailable(payload, domain) {
  const v=payload?.disclosureSummary?.[domain];
  return ['NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','UNKNOWN'].includes(v);
}

function assumptionIndex(set) {
  const map=new Map();
  for(const item of asArray(set?.assumptions)) {
    const type=required(item.type,'assumption.type');
    if(!item.assumptionId) throw new TypeError('assumptionId is required.');
    if(item.value === undefined || item.value === null) throw new TypeError(`Assumption ${item.assumptionId} requires explicit value.`);
    if(!item.version || !item.effectiveDate || !item.sourceLabel) throw new TypeError(`Assumption ${item.assumptionId} requires version/effectiveDate/sourceLabel.`);
    if(!map.has(type)) map.set(type,[]);
    map.get(type).push(Object.freeze({...item}));
  }
  return map;
}
function firstAssumption(index,type,predicate=()=>true) { return (index.get(type)||[]).find(predicate)||null; }
function assumptionValue(index,type) {
  const a=firstAssumption(index,type);
  if(!a || typeof a.value !== 'number' || !Number.isFinite(a.value)) return { value: unknown(`MISSING_ASSUMPTION:${type}`), refs: [] };
  return { value: exact(a.value), refs:[a.assumptionId] };
}
function fxAssumption(index, from, to) {
  if(from===to) return { rate:exact(1), refs:[] };
  const direct=firstAssumption(index,'FX_RATE',a=>a.fromCurrency===from&&a.toCurrency===to&&typeof a.value==='number');
  if(direct) return { rate:exact(direct.value), refs:[direct.assumptionId] };
  const inverse=firstAssumption(index,'FX_RATE',a=>a.fromCurrency===to&&a.toCurrency===from&&typeof a.value==='number');
  if(inverse) return { rate:divide(exact(1),exact(inverse.value)), refs:[inverse.assumptionId] };
  return { rate:unknown(`MISSING_FX_ASSUMPTION:${from}/${to}`), refs:[] };
}
function convertValue(value, baseCurrency, index) {
  const currency=value?.currency||baseCurrency;
  if(isUnknown(value)) return { value:withCurrency(value,baseCurrency), assumptionRefs:[] };
  const fx=fxAssumption(index,currency,baseCurrency);
  return { value:withCurrency(multiply(value,fx.rate),baseCurrency), assumptionRefs:fx.refs };
}
function convertFact(fact, currency, baseCurrency, index) {
  const raw=fromFact(fact,currency||baseCurrency); const converted=convertValue(raw,baseCurrency,index);
  return { value:converted.value, inputRefs:refs(fact?.factId), assumptionRefs:converted.assumptionRefs };
}
function normalizeMonthly(item, baseCurrency, index) {
  const converted=convertFact(item?.amountFact,item?.currency,baseCurrency,index);
  if(isUnknown(converted.value)) return converted;
  const frequency=item?.frequency;
  if(frequency==='MONTHLY') return converted;
  if(frequency==='ANNUAL') return {...converted,value:scale(converted.value,1/12)};
  return {...converted,value:unknown(`UNSUPPORTED_CASHFLOW_FREQUENCY:${frequency}`,{currency:baseCurrency})};
}
function assetValues(payload, baseCurrency, index, predicate=()=>true) {
  if(domainUnavailable(payload,'assets')) return [{value:unknown('ASSETS_NOT_DISCLOSED',{currency:baseCurrency}),inputRefs:[],assumptionRefs:[]}];
  return asArray(payload.assets).filter(predicate).map(asset=>{
    const c=convertFact(asset.valueFact,asset.valueFact?.value?.currency||asset.currency||baseCurrency,baseCurrency,index);
    return {...c, assetId:asset.assetId, assetType:asset.assetType};
  });
}
function liabilityValues(payload, baseCurrency, index) {
  if(domainUnavailable(payload,'liabilities')) return [{value:unknown('LIABILITIES_NOT_DISCLOSED',{currency:baseCurrency}),inputRefs:[],assumptionRefs:[]}];
  return asArray(payload.liabilities).map(liability=>({
    ...convertFact(liability.balanceFact,liability.currency||baseCurrency,baseCurrency,index), liability
  }));
}
function aggregate(entries) {
  return {
    value:sum(entries.map(x=>x.value)),
    inputRefs:refs(entries.map(x=>x.inputRefs||[])),
    assumptionRefs:refs(entries.map(x=>x.assumptionRefs||[]))
  };
}
function flowAggregate(items, baseCurrency, index) {
  return aggregate(asArray(items).map(item=>normalizeMonthly(item,baseCurrency,index)));
}
function metric(engineCode,resultCode,value,formula,inputRefs=[],assumptionRefs=[],notes=[]) {
  const traceId=`TRACE-${engineCode}-${resultCode}`;
  return Object.freeze({
    resultCode,
    value,
    traceId,
    trace:createTrace({traceId,engineCode,resultCode,formula,inputReferences:inputRefs,assumptionReferences:assumptionRefs,notes})
  });
}
function engineResult(engineCode, metrics, status=null) {
  const list=Object.values(metrics);
  const derived=status || (list.every(m=>!isUnknown(m.value))?'CALCULATED':list.some(m=>!isUnknown(m.value))?'PARTIAL':'UNKNOWN');
  return Object.freeze({engineCode,status:derived,metrics:Object.freeze(metrics),recommendationCreated:false,professionalJudgmentCreated:false});
}
function annuityContribution(gap, annualRate, years) {
  if(isUnknown(gap)||isUnknown(annualRate)||!Number.isFinite(years)||years<=0) return unknown('INSUFFICIENT_CONTRIBUTION_INPUT');
  const rBounds=annualRate.kind==='RANGE'?[annualRate.min,annualRate.max]:[annualRate.value,annualRate.value];
  const calc=r=>Math.abs(r)<1e-12?1/years:r/(Math.pow(1+r,years)-1);
  const f1=calc(rBounds[0]), f2=calc(rBounds[1]);
  const factor=annualRate.kind==='RANGE' ? range(Math.min(f1,f2),Math.max(f1,f2)) : annualRate.kind==='APPROXIMATE' ? approximate(f1) : exact(f1);
  return multiply(gap,factor);
}

function netWorthEngine(payload,base,index) {
  const assets=aggregate(assetValues(payload,base,index));
  const liabilities=aggregate(liabilityValues(payload,base,index));
  const liquid=aggregate(assetValues(payload,base,index,a=>LIQUID_TYPES.has(a.assetType)));
  return engineResult('NET_WORTH',{
    grossAssets:metric('NET_WORTH','grossAssets',assets.value,'Σ base-currency asset values',assets.inputRefs,assets.assumptionRefs),
    liabilities:metric('NET_WORTH','liabilities',liabilities.value,'Σ base-currency liability balances',liabilities.inputRefs,liabilities.assumptionRefs),
    netWorth:metric('NET_WORTH','netWorth',subtract(assets.value,liabilities.value),'grossAssets - liabilities',refs(assets.inputRefs,liabilities.inputRefs),refs(assets.assumptionRefs,liabilities.assumptionRefs)),
    liquidAssets:metric('NET_WORTH','liquidAssets',liquid.value,'Σ assets classified liquid by FCR policy v1',liquid.inputRefs,liquid.assumptionRefs,['Liquid classification is governed policy, not advice.'])
  });
}
function liquidityEngine(payload,base,index) {
  const assets=aggregate(assetValues(payload,base,index));
  const liquid=aggregate(assetValues(payload,base,index,a=>LIQUID_TYPES.has(a.assetType)));
  const currentLiab=aggregate(liabilityValues(payload,base,index));
  const expenses=flowAggregate(payload.expenses,base,index);
  return engineResult('LIQUIDITY',{
    liquidityRatio:metric('LIQUIDITY','liquidityRatio',divide(liquid.value,assets.value),'liquidAssets / grossAssets',refs(liquid.inputRefs,assets.inputRefs),refs(liquid.assumptionRefs,assets.assumptionRefs)),
    liquidNetWorth:metric('LIQUIDITY','liquidNetWorth',subtract(liquid.value,currentLiab.value),'liquidAssets - liabilities',refs(liquid.inputRefs,currentLiab.inputRefs),refs(liquid.assumptionRefs,currentLiab.assumptionRefs)),
    monthsOfExpenses:metric('LIQUIDITY','monthsOfExpenses',divide(liquid.value,expenses.value),'liquidAssets / monthlyExpenses',refs(liquid.inputRefs,expenses.inputRefs),refs(liquid.assumptionRefs,expenses.assumptionRefs))
  });
}
function cashFlowEngine(payload,base,index) {
  const income=flowAggregate(payload.incomeStreams,base,index);
  const expenses=flowAggregate(payload.expenses,base,index);
  const debtItems=asArray(payload.expenses).filter(x=>x.expenseType==='DEBT_SERVICE');
  const debt=flowAggregate(debtItems,base,index);
  const tax=assumptionValue(index,'TAX_EFFECTIVE_RATE');
  const netIncome=multiply(income.value,subtract(exact(1),tax.value));
  const savings=subtract(netIncome,expenses.value);
  const deficit=maxZero(scale(savings,-1));
  return engineResult('CASH_FLOW',{
    grossIncome:metric('CASH_FLOW','grossIncome',income.value,'Σ normalized monthly gross income',income.inputRefs,income.assumptionRefs),
    netIncome:metric('CASH_FLOW','netIncome',netIncome,'grossIncome × (1 - taxEffectiveRate)',income.inputRefs,refs(income.assumptionRefs,tax.refs)),
    expenses:metric('CASH_FLOW','expenses',expenses.value,'Σ normalized monthly expenses',expenses.inputRefs,expenses.assumptionRefs),
    debtService:metric('CASH_FLOW','debtService',debt.value,'Σ monthly DEBT_SERVICE expenses',debt.inputRefs,debt.assumptionRefs),
    savings:metric('CASH_FLOW','savings',savings,'netIncome - expenses',refs(income.inputRefs,expenses.inputRefs),refs(income.assumptionRefs,expenses.assumptionRefs,tax.refs)),
    surplus:metric('CASH_FLOW','surplus',savings,'netIncome - expenses',refs(income.inputRefs,expenses.inputRefs),refs(income.assumptionRefs,expenses.assumptionRefs,tax.refs)),
    deficit:metric('CASH_FLOW','deficit',deficit,'max(0, expenses - netIncome)',refs(income.inputRefs,expenses.inputRefs),refs(income.assumptionRefs,expenses.assumptionRefs,tax.refs)),
    savingsRate:metric('CASH_FLOW','savingsRate',divide(savings,netIncome),'savings / netIncome',refs(income.inputRefs,expenses.inputRefs),refs(income.assumptionRefs,expenses.assumptionRefs,tax.refs))
  });
}
function debtEngine(payload,base,index) {
  const liabilities=aggregate(liabilityValues(payload,base,index));
  const assets=aggregate(assetValues(payload,base,index));
  const grossIncome=flowAggregate(payload.incomeStreams,base,index);
  const debtService=flowAggregate(asArray(payload.expenses).filter(x=>x.expenseType==='DEBT_SERVICE'),base,index);
  const tax=assumptionValue(index,'TAX_EFFECTIVE_RATE');
  const netIncome=multiply(grossIncome.value,subtract(exact(1),tax.value));
  const projections=[]; const pRefs=[]; const pAss=[];
  for(const liability of asArray(payload.liabilities)) {
    const bal=convertFact(liability.balanceFact,liability.currency||base,base,index);
    const rate=fromFact(liability.interestRateFact,null); const repay=convertFact(liability.repaymentFact,liability.currency||base,base,index);
    pRefs.push(...bal.inputRefs,...repay.inputRefs,liability.interestRateFact?.factId); pAss.push(...bal.assumptionRefs,...repay.assumptionRefs);
    if(isUnknown(bal.value)||isUnknown(rate)||isUnknown(repay.value)) { projections.push(unknown('MISSING_LOAN_PROJECTION_INPUT',{currency:base})); continue; }
    let outstanding=bal.value; const monthlyRate=scale(rate,1/12/100);
    for(let m=0;m<12;m++) outstanding=maxZero(subtract(add(outstanding,multiply(outstanding,monthlyRate)),repay.value));
    projections.push(outstanding);
  }
  const projection=projections.length?sum(projections):(asArray(payload.liabilities).length===0?exact(0,{currency:base}):unknown('MISSING_LOAN_PROJECTION_INPUT',{currency:base}));
  return engineResult('DEBT',{
    debtToAsset:metric('DEBT','debtToAsset',divide(liabilities.value,assets.value),'liabilities / grossAssets',refs(liabilities.inputRefs,assets.inputRefs),refs(liabilities.assumptionRefs,assets.assumptionRefs)),
    debtToIncome:metric('DEBT','debtToIncome',divide(scale(debtService.value,12),scale(grossIncome.value,12)),'annualDebtService / annualGrossIncome',refs(debtService.inputRefs,grossIncome.inputRefs),refs(debtService.assumptionRefs,grossIncome.assumptionRefs)),
    debtServiceRatio:metric('DEBT','debtServiceRatio',divide(debtService.value,netIncome),'monthlyDebtService / monthlyNetIncome',refs(debtService.inputRefs,grossIncome.inputRefs),refs(debtService.assumptionRefs,grossIncome.assumptionRefs,tax.refs)),
    loanBalanceProjection:metric('DEBT','loanBalanceProjection',projection,'12-month amortization from FDR balance/rate/repayment facts',pRefs,pAss)
  });
}
function contingentEngine(payload,base,index) {
  const guarantees=asArray(payload.guarantees);
  const entries=guarantees.map(g=>convertFact(g.exposureFact,g.currency||base,base,index));
  const agg=guarantees.length?aggregate(entries):{
    value: asArray(payload.entities).some(e=>asArray(e.guaranteeReferences).length)?unknown('GUARANTEE_REFERENCED_BUT_NOT_IN_FDR_SNAPSHOT',{currency:base}):exact(0,{currency:base}),
    inputRefs:[],assumptionRefs:[]
  };
  return engineResult('CONTINGENT_EXPOSURE',{
    exposure:metric('CONTINGENT_EXPOSURE','exposure',agg.value,'Σ structured contingent guarantee exposure facts',agg.inputRefs,agg.assumptionRefs,['Exposure is numeric only; no risk judgment is created.'])
  });
}
function emergencyEngine(payload,base,index) {
  const liquid=aggregate(assetValues(payload,base,index,a=>LIQUID_TYPES.has(a.assetType)));
  const essential=flowAggregate(asArray(payload.expenses).filter(x=>x.expenseType==='ESSENTIAL'),base,index);
  const months=assumptionValue(index,'EMERGENCY_RESERVE_MONTHS');
  const target=multiply(essential.value,months.value);
  return engineResult('EMERGENCY_RESERVE',{
    currentReserveMonths:metric('EMERGENCY_RESERVE','currentReserveMonths',divide(liquid.value,essential.value),'liquidAssets / monthlyEssentialExpenses',refs(liquid.inputRefs,essential.inputRefs),refs(liquid.assumptionRefs,essential.assumptionRefs)),
    targetReserve:metric('EMERGENCY_RESERVE','targetReserve',target,'monthlyEssentialExpenses × emergencyReserveMonths',essential.inputRefs,refs(essential.assumptionRefs,months.refs)),
    shortfall:metric('EMERGENCY_RESERVE','shortfall',maxZero(subtract(target,liquid.value)),'max(0, targetReserve - liquidAssets)',refs(essential.inputRefs,liquid.inputRefs),refs(essential.assumptionRefs,liquid.assumptionRefs,months.refs))
  });
}
function protectionEngine(payload,base,index) {
  const income=flowAggregate(payload.incomeStreams,base,index);
  const debt=aggregate(liabilityValues(payload,base,index));
  const years=assumptionValue(index,'PROTECTION_INCOME_REPLACEMENT_YEARS');
  const incomeNeed=multiply(scale(income.value,12),years.value);
  const educationGoals=asArray(payload.goals).filter(g=>g.goalType==='EDUCATION'&&g.status!=='CLOSED').map(g=>({value:valueFromGoalTarget(g.target,base),inputRefs:[g.goalId],assumptionRefs:[]}));
  const educationNeed=educationGoals.length?aggregate(educationGoals):{value:exact(0,{currency:base}),inputRefs:[],assumptionRefs:[]};
  const dependentSupport=flowAggregate(asArray(payload.expenses).filter(x=>x.expenseType==='DEPENDENT_SUPPORT'),base,index);
  const dependentSupportNeed=multiply(scale(dependentSupport.value,12),years.value);
  const depNeed={value:add(educationNeed.value,dependentSupportNeed),inputRefs:refs(educationNeed.inputRefs,dependentSupport.inputRefs),assumptionRefs:refs(educationNeed.assumptionRefs,dependentSupport.assumptionRefs,years.refs)};
  const coverageNeed=add(incomeNeed,debt.value,depNeed.value);
  const coverEntries=asArray(payload.policies).map(p=>convertFact(p.sumAssured,base,base,index));
  const cover=coverEntries.length?aggregate(coverEntries):{value:exact(0,{currency:base}),inputRefs:[],assumptionRefs:[]};
  return engineResult('PROTECTION_NEED',{
    coverageNeed:metric('PROTECTION_NEED','coverageNeed',coverageNeed,'annualIncome × replacementYears + liabilities + disclosed dependent support horizon + education targets',refs(income.inputRefs,debt.inputRefs,depNeed.inputRefs),refs(income.assumptionRefs,debt.assumptionRefs,depNeed.assumptionRefs,years.refs)),
    existingCoverage:metric('PROTECTION_NEED','existingCoverage',cover.value,'Σ existing disclosed policy sumAssured',cover.inputRefs,cover.assumptionRefs),
    coverageGap:metric('PROTECTION_NEED','coverageGap',maxZero(subtract(coverageNeed,cover.value)),'max(0, coverageNeed - existingCoverage)',refs(income.inputRefs,debt.inputRefs,depNeed.inputRefs,cover.inputRefs),refs(income.assumptionRefs,debt.assumptionRefs,depNeed.assumptionRefs,cover.assumptionRefs,years.refs))
  });
}
function educationEngine(payload,base,index) {
  const goal=asArray(payload.goals).find(g=>g.goalType==='EDUCATION'&&g.status!=='CLOSED');
  if(!goal) return engineResult('EDUCATION_FUNDING',{futureEducationCost:metric('EDUCATION_FUNDING','futureEducationCost',unknown('NO_EDUCATION_GOAL',{currency:base}),'goal target compounded by education inflation',[],[])});
  const targetConv=convertValue(valueFromGoalTarget(goal.target,base),base,index);
  const inflation=assumptionValue(index,'EDUCATION_INFLATION');
  const years=yearFraction(payload.asOfDate,goal.targetDate);
  const factor=(years==null||isUnknown(inflation.value))?unknown('MISSING_EDUCATION_HORIZON_OR_INFLATION'):pow(add(exact(1),inflation.value),years);
  const future=multiply(targetConv.value,factor);
  const fundingRefs=asArray(goal.relatedAssetReferences);
  let existing;
  if(fundingRefs.length) existing=aggregate(assetValues(payload,base,index,a=>fundingRefs.includes(a.assetId)));
  else if(goal.fundingSource==='NONE') existing={value:exact(0,{currency:base}),inputRefs:[],assumptionRefs:[]};
  else existing={value:unknown('UNKNOWN_EDUCATION_FUNDING_SOURCE',{currency:base}),inputRefs:[],assumptionRefs:[]};
  const gap=maxZero(subtract(future,existing.value));
  const ret=assumptionValue(index,'INVESTMENT_RETURN');
  const contribution=annuityContribution(gap,ret.value,years);
  return engineResult('EDUCATION_FUNDING',{
    futureEducationCost:metric('EDUCATION_FUNDING','futureEducationCost',future,'currentEducationTarget × (1 + educationInflation)^years',[goal.goalId],refs(targetConv.assumptionRefs,inflation.refs)),
    existingFunding:metric('EDUCATION_FUNDING','existingFunding',existing.value,'Σ explicitly linked education funding assets',existing.inputRefs,existing.assumptionRefs),
    fundingGap:metric('EDUCATION_FUNDING','fundingGap',gap,'max(0, futureEducationCost - existingFunding)',refs(goal.goalId,existing.inputRefs),refs(targetConv.assumptionRefs,inflation.refs,existing.assumptionRefs)),
    requiredContribution:metric('EDUCATION_FUNDING','requiredContribution',contribution,'annual contribution required to accumulate fundingGap using explicit investmentReturn over horizon',refs(goal.goalId,existing.inputRefs),refs(targetConv.assumptionRefs,inflation.refs,existing.assumptionRefs,ret.refs))
  });
}
function retirementEngine(payload,base,index) {
  const person=asArray(payload.people).find(p=>asArray(p.roles).includes('CUSTOMER'))||asArray(payload.people)[0];
  const age=person?.dateOfBirth?fullYears(person.dateOfBirth,payload.asOfDate):null;
  const retirementAge=assumptionValue(index,'RETIREMENT_AGE'); const longevity=assumptionValue(index,'LONGEVITY_AGE');
  const salaryGrowth=assumptionValue(index,'SALARY_GROWTH'); const replacement=assumptionValue(index,'RETIREMENT_INCOME_REPLACEMENT_RATE'); const ret=assumptionValue(index,'INVESTMENT_RETURN');
  const income=flowAggregate(payload.incomeStreams,base,index);
  const rAge=isUnknown(retirementAge.value)?null:retirementAge.value.value;
  const lAge=isUnknown(longevity.value)?null:longevity.value.value;
  const yearsTo=(age==null||rAge==null)?null:Math.max(0,rAge-age);
  const yearsIn=(rAge==null||lAge==null)?null:Math.max(0,lAge-rAge);
  const growth=(yearsTo==null||isUnknown(salaryGrowth.value))?unknown('MISSING_RETIREMENT_HORIZON_OR_SALARY_GROWTH'):pow(add(exact(1),salaryGrowth.value),yearsTo);
  const incomeAt=multiply(scale(income.value,12),growth);
  const requiredIncome=multiply(incomeAt,replacement.value);
  const capital=yearsIn==null?unknown('MISSING_LONGEVITY_HORIZON',{currency:base}):scale(requiredIncome,yearsIn);
  const epfRet=assumptionValue(index,'EPF_RETURN');
  const retirementAssetEntries=assetValues(payload,base,index,a=>['EPF','PRS'].includes(a.assetType));
  const projectedRetirementEntries=retirementAssetEntries.map(entry=>{
    if(yearsTo==null) return {...entry,value:unknown('MISSING_RETIREMENT_HORIZON',{currency:base})};
    const rate=entry.assetType==='EPF'?epfRet:ret; const factor=isUnknown(rate.value)?unknown(`MISSING_${entry.assetType}_RETURN`):pow(add(exact(1),rate.value),yearsTo);
    return {...entry,value:multiply(entry.value,factor),assumptionRefs:refs(entry.assumptionRefs,rate.refs)};
  });
  const retirementAssets=aggregate(projectedRetirementEntries);
  const shortfall=maxZero(subtract(capital,retirementAssets.value));
  const contribution=yearsTo==null?unknown('MISSING_RETIREMENT_HORIZON',{currency:base}):annuityContribution(shortfall,ret.value,yearsTo);
  const allAss=refs(retirementAge.refs,longevity.refs,salaryGrowth.refs,replacement.refs,ret.refs,epfRet.refs,income.assumptionRefs,retirementAssets.assumptionRefs);
  const allInputs=refs(person?.personId,income.inputRefs,retirementAssets.inputRefs);
  return engineResult('RETIREMENT',{
    incomeAtRetirement:metric('RETIREMENT','incomeAtRetirement',incomeAt,'annualIncome × (1 + salaryGrowth)^yearsToRetirement',income.inputRefs,refs(income.assumptionRefs,retirementAge.refs,salaryGrowth.refs)),
    requiredIncome:metric('RETIREMENT','requiredIncome',requiredIncome,'incomeAtRetirement × retirementIncomeReplacementRate',income.inputRefs,refs(income.assumptionRefs,retirementAge.refs,salaryGrowth.refs,replacement.refs)),
    capitalRequired:metric('RETIREMENT','capitalRequired',capital,'requiredAnnualIncome × (longevityAge - retirementAge)',allInputs,allAss),
    availableRetirementAssets:metric('RETIREMENT','availableRetirementAssets',retirementAssets.value,'Σ EPF/PRS disclosed asset values projected to retirement using explicit EPF/investment return assumptions',retirementAssets.inputRefs,retirementAssets.assumptionRefs),
    shortfall:metric('RETIREMENT','shortfall',shortfall,'max(0, capitalRequired - availableRetirementAssets)',allInputs,allAss),
    annualContributionNeeded:metric('RETIREMENT','annualContributionNeeded',contribution,'annual contribution required to accumulate shortfall using explicit investmentReturn',allInputs,allAss)
  });
}
function investmentEngine(payload,base,index) {
  const contribution=assumptionValue(index,'INVESTMENT_CONTRIBUTION_ANNUAL'); const ret=assumptionValue(index,'INVESTMENT_RETURN'); const inflation=assumptionValue(index,'INFLATION'); const horizon=assumptionValue(index,'INVESTMENT_HORIZON_YEARS');
  const h=isUnknown(horizon.value)?null:horizon.value.value;
  let nominal=unknown('MISSING_INVESTMENT_SCENARIO_INPUT',{currency:base});
  if(h!=null&&!isUnknown(contribution.value)&&!isUnknown(ret.value)) {
    const r=ret.value.value;
    nominal=exact(Math.abs(r)<1e-12?contribution.value.value*h:contribution.value.value*((Math.pow(1+r,h)-1)/r),{currency:base});
  }
  const real=(h==null||isUnknown(inflation.value))?unknown('MISSING_INFLATION_OR_HORIZON',{currency:base}):divide(nominal,pow(add(exact(1),inflation.value),h));
  return engineResult('INVESTMENT_PROJECTION',{
    futureValue:metric('INVESTMENT_PROJECTION','futureValue',nominal,'annualContribution × annuityFutureValueFactor(investmentReturn, horizon)',[],refs(contribution.refs,ret.refs,horizon.refs)),
    inflationAdjustedValue:metric('INVESTMENT_PROJECTION','inflationAdjustedValue',real,'futureValue / (1 + inflation)^horizon',[],refs(contribution.refs,ret.refs,inflation.refs,horizon.refs))
  });
}
function estateEngine(payload,base,index) {
  const liabilities=aggregate(liabilityValues(payload,base,index)); const assets=aggregate(assetValues(payload,base,index)); const liquid=aggregate(assetValues(payload,base,index,a=>LIQUID_TYPES.has(a.assetType)));
  const expenseRate=assumptionValue(index,'ESTATE_EXPENSE_RATE'); const estateExpenses=multiply(assets.value,expenseRate.value); const required=add(liabilities.value,estateExpenses); const gap=maxZero(subtract(required,liquid.value));
  return engineResult('ESTATE_LIQUIDITY',{
    knownLiabilities:metric('ESTATE_LIQUIDITY','knownLiabilities',liabilities.value,'Σ known liabilities',liabilities.inputRefs,liabilities.assumptionRefs),
    estateExpensesAssumption:metric('ESTATE_LIQUIDITY','estateExpensesAssumption',estateExpenses,'grossAssets × estateExpenseRate',assets.inputRefs,refs(assets.assumptionRefs,expenseRate.refs)),
    liquidEstate:metric('ESTATE_LIQUIDITY','liquidEstate',liquid.value,'Σ liquid estate assets only; policy proceeds are not presumed estate property',liquid.inputRefs,liquid.assumptionRefs),
    estimatedLiquidityGap:metric('ESTATE_LIQUIDITY','estimatedLiquidityGap',gap,'max(0, knownLiabilities + estateExpensesAssumption - liquidEstate)',refs(liabilities.inputRefs,assets.inputRefs,liquid.inputRefs),refs(liabilities.assumptionRefs,assets.assumptionRefs,liquid.assumptionRefs,expenseRate.refs),['Numeric estimate only; no legal validity or distribution judgment.'])
  });
}
function businessEngine(payload,base,index) {
  const business=aggregate(assetValues(payload,base,index,a=>ALLOCATION.business.has(a.assetType)));
  const assets=aggregate(assetValues(payload,base,index));
  const dividends=flowAggregate(asArray(payload.incomeStreams).filter(i=>i.incomeType==='DIVIDEND'),base,index);
  const businessIncome=flowAggregate(asArray(payload.incomeStreams).filter(i=>['BUSINESS_INCOME','DIVIDEND'].includes(i.incomeType)),base,index);
  const totalIncome=flowAggregate(payload.incomeStreams,base,index);
  const guarantees=asArray(payload.guarantees).map(g=>convertFact(g.exposureFact,g.currency||base,base,index));
  const exposure=guarantees.length?aggregate(guarantees):{value:asArray(payload.entities).some(e=>asArray(e.guaranteeReferences).length)?unknown('GUARANTEE_REFERENCED_BUT_NOT_IN_FDR_SNAPSHOT',{currency:base}):exact(0,{currency:base}),inputRefs:[],assumptionRefs:[]};
  return engineResult('BUSINESS_WEALTH',{
    shareValue:metric('BUSINESS_WEALTH','shareValue',business.value,'Σ business-interest asset values',business.inputRefs,business.assumptionRefs),
    dividendContribution:metric('BUSINESS_WEALTH','dividendContribution',scale(dividends.value,12),'monthly dividends × 12',dividends.inputRefs,dividends.assumptionRefs),
    businessConcentration:metric('BUSINESS_WEALTH','businessConcentration',divide(business.value,assets.value),'business asset value / grossAssets',refs(business.inputRefs,assets.inputRefs),refs(business.assumptionRefs,assets.assumptionRefs)),
    guaranteeExposure:metric('BUSINESS_WEALTH','guaranteeExposure',exposure.value,'Σ structured guarantee exposure',exposure.inputRefs,exposure.assumptionRefs),
    familyWealthDependency:metric('BUSINESS_WEALTH','familyWealthDependency',divide(businessIncome.value,totalIncome.value),'business-derived monthly income / total monthly income',refs(businessIncome.inputRefs,totalIncome.inputRefs),refs(businessIncome.assumptionRefs,totalIncome.assumptionRefs))
  });
}
function allocationEngine(payload,base,index) {
  const all=assetValues(payload,base,index); const total=aggregate(all);
  const metrics={};
  for(const [code,types] of Object.entries(ALLOCATION)) {
    const entry=aggregate(all.filter(a=>types.has(a.assetType)));
    const sameRefs=entry.inputRefs.length===total.inputRefs.length && entry.inputRefs.every(x=>total.inputRefs.includes(x));
    let pct=sameRefs && !isUnknown(total.value) ? exact(100) : scale(divide(entry.value,total.value),100);
    if(pct.kind==='RANGE') pct=range(Math.max(0,pct.min),Math.min(100,pct.max));
    metrics[`${code}Percent`]=metric('ALLOCATION',`${code}Percent`,pct,`${code} classified assets / grossAssets × 100`,refs(entry.inputRefs,total.inputRefs),refs(entry.assumptionRefs,total.assumptionRefs),['Actual allocation only; no purchase or sell direction.']);
  }
  const classified=aggregate(all.filter(a=>Object.values(ALLOCATION).some(types=>types.has(a.assetType))));
  metrics.classifiedCoveragePercent=metric('ALLOCATION','classifiedCoveragePercent',scale(divide(classified.value,total.value),100),'classifiedAssets / grossAssets × 100',refs(classified.inputRefs,total.inputRefs),refs(classified.assumptionRefs,total.assumptionRefs));
  return engineResult('ALLOCATION',metrics);
}
function currencyEngine(payload,base,index) {
  const currencies=new Set([base]);
  const inspect=fact=>{ const raw=fact?.value; if(raw&&typeof raw==='object'&&raw.currency) currencies.add(raw.currency); };
  asArray(payload.assets).forEach(a=>inspect(a.valueFact));
  asArray(payload.liabilities).forEach(l=>currencies.add(l.currency||base));
  asArray(payload.incomeStreams).forEach(i=>currencies.add(i.currency||base));
  asArray(payload.expenses).forEach(i=>currencies.add(i.currency||base));
  asArray(payload.guarantees).forEach(g=>currencies.add(g.currency||base));
  const metrics={};
  for(const cur of [...currencies].sort()) {
    const fx=fxAssumption(index,cur,base);
    metrics[`fx_${cur}_${base}`]=metric('CURRENCY',`fx_${cur}_${base}`,fx.rate,cur===base?'identity FX rate':`${cur} → ${base} explicit versioned FX assumption`,[],fx.refs);
  }
  return engineResult('CURRENCY',metrics);
}
const ENGINE_EXECUTORS=Object.freeze({
  CURRENCY:currencyEngine, NET_WORTH:netWorthEngine, LIQUIDITY:liquidityEngine, CASH_FLOW:cashFlowEngine,
  DEBT:debtEngine, CONTINGENT_EXPOSURE:contingentEngine, EMERGENCY_RESERVE:emergencyEngine,
  PROTECTION_NEED:protectionEngine, EDUCATION_FUNDING:educationEngine, RETIREMENT:retirementEngine,
  INVESTMENT_PROJECTION:investmentEngine, ESTATE_LIQUIDITY:estateEngine, BUSINESS_WEALTH:businessEngine,
  ALLOCATION:allocationEngine
});

export async function validateAssumptionSet(set) {
  required(set?.assumptionSetId,'assumptionSetId'); required(set?.version,'assumptionSet.version'); required(set?.effectiveDate,'assumptionSet.effectiveDate'); required(set?.sourceLabel,'assumptionSet.sourceLabel');
  assumptionIndex(set);
  if(!/^[a-f0-9]{64}$/.test(String(set.digest||''))) throw new TypeError('ASSUMPTION_SET_DIGEST_REQUIRED');
  const clone=structuredClone(set); delete clone.digest;
  const digest=await sha256(clone);
  if(set.digest!==digest) throw new TypeError('ASSUMPTION_SET_DIGEST_MISMATCH');
  return Object.freeze({...set,digest});
}
export async function calculateFinancialProjection(input={}) {
  if(input.runtimeCode && input.runtimeCode!==FCR_RUNTIME_CODE) throw new TypeError('Invalid FCR runtimeCode.');
  const calculationId=required(input.calculationId,'calculationId');
  const scenario=required(input.scenarioCode,'scenarioCode'); if(!FCR_SCENARIOS.includes(scenario)) throw new TypeError('Unsupported FCR scenario.');
  const snapshot=input.fdrSnapshot; if(!snapshot?.snapshotId||!snapshot?.digest||!snapshot?.snapshotPayload) throw new TypeError('FCR requires an immutable FDR snapshot with digest.');
  if(!/^[a-f0-9]{64}$/.test(String(snapshot.digest))) throw new TypeError('FDR snapshot digest is invalid.');
  if(snapshot.snapshotPayload.digest && snapshot.financialRealityVersion && snapshot.snapshotPayload.version!==snapshot.financialRealityVersion) throw new TypeError('FDR snapshot payload version mismatch.');
  const assumptions=await validateAssumptionSet(input.assumptionSet); if(required(assumptions.scenarioCode,'assumptionSet.scenarioCode')!==scenario) throw new TypeError('FCR scenario and assumption set mismatch.');
  const snapshotDate=Date.parse(`${snapshot.snapshotPayload.asOfDate}T23:59:59Z`); for(const a of assumptions.assumptions) if(Date.parse(`${a.effectiveDate}T00:00:00Z`)>snapshotDate) throw new TypeError(`ASSUMPTION_NOT_EFFECTIVE:${a.assumptionId}`);
  const index=assumptionIndex(assumptions);
  const base=required(snapshot.snapshotPayload?.currencyContext?.baseCurrency,'FDR baseCurrency');
  const requested=input.requestedEngines?asArray(input.requestedEngines):FCR_ENGINES;
  for(const code of requested) if(!ENGINE_EXECUTORS[code]) throw new TypeError(`Unknown FCR engine: ${code}`);
  const engines={}; for(const code of requested) engines[code]=ENGINE_EXECUTORS[code](snapshot.snapshotPayload,base,index);
  const traceIndex={};
  for(const engine of Object.values(engines)) for(const m of Object.values(engine.metrics)) traceIndex[m.traceId]=m.trace;
  const deterministicCore={
    schemaVersion:'PHI-OS-FCR-CALCULATION-RESULT-v1.0.0',runtimeCode:FCR_RUNTIME_CODE,runtimeVersion:FCR_RUNTIME_VERSION,
    calculationId,scenarioCode:scenario,baseCurrency:base,fdrSnapshotId:snapshot.snapshotId,fdrDigest:snapshot.digest,
    assumptionSetId:assumptions.assumptionSetId,assumptionDigest:assumptions.digest,
    engines,traceIndex,
    analysisCreated:false,adviceCreated:false,professionalJudgmentCreated:false,recommendationCreated:false,
    inventedMissingValue:false,rangeCollapsedToMidpoint:false
  };
  const resultDigest=await sha256(deterministicCore);
  return Object.freeze({...deterministicCore,resultDigest,determinismKey:await sha256({fdrDigest:snapshot.digest,assumptionDigest:assumptions.digest,fcrVersion:FCR_RUNTIME_VERSION,scenarioCode:scenario,requestedEngines:requested})});
}
export function stableFinancialResult(value) { return stableSerialize(value); }
export default Object.freeze({calculateFinancialProjection,validateAssumptionSet});
