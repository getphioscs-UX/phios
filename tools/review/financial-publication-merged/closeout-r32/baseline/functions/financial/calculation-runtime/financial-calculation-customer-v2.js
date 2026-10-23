/** FCR owner opt-in v2 successor. Frozen v1 bytes remain unchanged; unaffected engines are inherited. */
import { exact, approximate, range, unknown, isUnknown, add, subtract, multiply, divide, scale, maxZero, sum, pow, fromFact, withCurrency } from './range-arithmetic.js';
import { stableSerialize, sha256 } from './stable-digest.js';
import { createTrace } from './trace-runtime.js';
import {calculateFinancialProjection} from './financial-calculation-runtime.js';
const LIQUID_TYPES=new Set(['CASH','BANK_ACCOUNT','FIXED_DEPOSIT']);
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function required(value, name) { const v=text(value); if(!v) throw new TypeError(`${name} is required.`); return v; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function refs(...groups) { return [...new Set(groups.flat(Infinity).filter(Boolean).map(String))]; }
function yearFraction(from, to) {
  const a=Date.parse(`${from}T00:00:00Z`), b=Date.parse(`${to}T00:00:00Z`);
  if(!Number.isFinite(a)||!Number.isFinite(b)) return null;
  return Math.max(0,(b-a)/(365.2425*86400000));
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
  if(frequency==='ANNUAL') return {...converted,value:index.customerV2?divide(converted.value,exact(12)):scale(converted.value,1/12)};
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
function customerFlowV2(payload,base,index){
 const streams=asArray(payload.incomeStreams),declared=flowAggregate(streams,base,index),tax=assumptionValue(index,'TAX_EFFECTIVE_RATE');
 const netParts=streams.map(stream=>{const flow=flowAggregate([stream],base,index);return stream.grossOrNet==='NET'?flow.value:stream.grossOrNet==='GROSS'?multiply(flow.value,subtract(exact(1),tax.value)):unknown('INCOME_GROSS_NET_UNSPECIFIED');});
 const net=netParts.length?sum(netParts):exact(0,{currency:base});
 const debts=asArray(payload.liabilities),debtExpenses=asArray(payload.expenses).filter(x=>x.expenseType==='DEBT_SERVICE');
 const linked=new Set(),debtRows=[];let ambiguous=false;
 for(const expense of debtExpenses){const ids=asArray(expense.relatedLiabilityReferences);if(!ids.length&&debts.length)ambiguous=true;for(const id of ids){if(linked.has(id)||!debts.some(d=>d.liabilityId===id))ambiguous=true;linked.add(id);}if(ids.length){const declared=flowAggregate([expense],base,index).value,repayments=flowAggregate(debts.filter(d=>ids.includes(d.liabilityId)).map(d=>({amountFact:d.repaymentFact,frequency:'MONTHLY',currency:d.currency})),base,index).value;if(!isUnknown(repayments)&&stableSerialize(declared)!==stableSerialize(repayments))ambiguous=true;}debtRows.push(expense);}
 for(const liability of debts){if(linked.has(liability.liabilityId))continue;debtRows.push({amountFact:liability.repaymentFact,frequency:'MONTHLY',currency:liability.currency});}
 const debt=flowAggregate(debtRows,base,index),operating=flowAggregate(asArray(payload.expenses).filter(x=>x.expenseType!=='DEBT_SERVICE'),base,index);
 const debtValue=ambiguous?unknown('DEBT_EXPENSE_LIABILITY_LINK_REQUIRED'):debt.value;
 const total=subtract(subtract(net,operating.value),debtValue),inputRefs=refs(declared.inputRefs,operating.inputRefs,debt.inputRefs),assumptionRefs=refs(declared.assumptionRefs,operating.assumptionRefs,debt.assumptionRefs,streams.some(x=>x.grossOrNet==='GROSS')?tax.refs:[]);
 const m=(code,value,formula)=>metric('CASH_FLOW',code,value,formula,inputRefs,assumptionRefs);
 return engineResult('CASH_FLOW',{declaredIncome:m('declaredIncome',declared.value,'Σ monthly declared income, preserving gross/net classification'),grossIncome:m('grossIncome',streams.some(x=>x.grossOrNet!=='GROSS')?unknown('GROSS_INCOME_NOT_ESTABLISHED'):declared.value,'Σ explicitly GROSS streams only'),netIncome:m('netIncome',net,'NET unchanged; GROSS × explicit (1-tax); unspecified remains unknown'),expenses:m('expenses',add(operating.value,debtValue),'operating expenses + reconciled debt service exactly once'),debtService:m('debtService',debtValue,'linked expense debt once, plus unmatched liability repayment; unlinked ambiguity remains unknown'),savings:m('savings',total,'netIncome - operatingExpenses - reconciledDebtService'),surplus:m('surplus',total,'netIncome - operatingExpenses - reconciledDebtService'),deficit:m('deficit',maxZero(scale(total,-1)),'max(0, -savings)'),savingsRate:m('savingsRate',divide(total,net),'savings/netIncome')});
}
function customerDebtV2(payload,base,index,legacy){const flow=customerFlowV2(payload,base,index),debt=flow.metrics.debtService,net=flow.metrics.netIncome;return {...legacy,metrics:{...legacy.metrics,debtServiceRatio:metric('DEBT','debtServiceRatio',divide(debt.value,net.value),'reconciledDebtService / declaredNetIncome',refs(debt.trace.inputReferences,net.trace.inputReferences),refs(debt.trace.assumptionReferences,net.trace.assumptionReferences))}};}
function customerLiquidityV2(payload,base,index,legacy){const liquid=aggregate(assetValues(payload,base,index,a=>LIQUID_TYPES.has(a.assetType))),outflow=customerFlowV2(payload,base,index).metrics.expenses;return {...legacy,metrics:{...legacy.metrics,monthsOfExpenses:metric('LIQUIDITY','monthsOfExpenses',divide(liquid.value,outflow.value),'liquidAssets / reconciledMonthlyOutflow',refs(liquid.inputRefs,outflow.trace.inputReferences),refs(liquid.assumptionRefs,outflow.trace.assumptionReferences))}};}
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
function customerEducationV2(payload,base,index){
 const goals=asArray(payload.goals).filter(g=>g.goalType==='EDUCATION'&&g.status!=='CLOSED');
 if(goals.length<=1)return educationEngine(payload,base,index);
 const metrics={},goalResults=[];
 for(const goal of goals){const result=educationEngine({...payload,goals:[goal]},base,index),ownMetrics={};for(const [key,value]of Object.entries(result.metrics)){const code=`${goal.goalId}:${key}`,bound=metric('EDUCATION_FUNDING',code,value.value,value.trace.formula,value.trace.inputReferences,value.trace.assumptionReferences);ownMetrics[key]=bound;metrics[code]=bound;}goalResults.push({goalId:goal.goalId,metrics:ownMetrics});}
 for(const key of ['futureEducationCost','existingFunding','fundingGap','requiredContribution'])metrics[key]=metric('EDUCATION_FUNDING',key,unknown('MULTIPLE_EDUCATION_GOALS_SEPARATE_RESULTS',{currency:base}),'individual goal results; no shared funding or horizon inferred',goals.map(g=>g.goalId),[]);
 return {...engineResult('EDUCATION_FUNDING',metrics),goalResults};
}
function customerProtectionV2(payload,base,index){
 // Current intake does not establish an approved needs model per insured person
 // and risk event. A household policy total must not masquerade as one gap.
 const policies=asArray(payload.policies),metrics={};
 for(const key of ['coverageNeed','existingCoverage','coverageGap'])metrics[key]=metric('PROTECTION_NEED',key,unknown('PROTECTION_PERSON_EVENT_SCOPE_REQUIRED',{currency:base}),'insured person, risk event and applicable needs model must be established separately',policies.map(p=>p.policyId),[]);
 const policyResults=policies.map(p=>({policyId:p.policyId,declaredSumAssured:convertFact(p.sumAssured,base,base,index).value,needsGap:unknown('POLICY_PERSON_EVENT_NOT_BOUND',{currency:base})}));
 return {...engineResult('PROTECTION_NEED',metrics),policyResults};
}

export async function calculateCustomerFinancialProjection(input={}){
 if(input.calculationPolicy!=='CUSTOMER_NET_DEBT_V2')throw new TypeError('FCR_CALCULATION_POLICY_UNKNOWN');
 const snapshot=input.fdrSnapshot;if(!snapshot?.snapshotPayload)throw new TypeError('FDR_SNAPSHOT_REQUIRED');
 const {digest:sd,...sc}=snapshot,{digest:pd,...pc}=snapshot.snapshotPayload;
 if(await sha256(sc)!==sd||await sha256(pc)!==pd)throw new TypeError('FDR_SNAPSHOT_CONTENT_DIGEST_MISMATCH');
 const inherited=await calculateFinancialProjection(input),index=assumptionIndex(input.assumptionSet),base=inherited.baseCurrency;index.customerV2=true;
 const successors={CASH_FLOW:customerFlowV2,DEBT:customerDebtV2,LIQUIDITY:customerLiquidityV2,EDUCATION_FUNDING:customerEducationV2,PROTECTION_NEED:customerProtectionV2},engines={...inherited.engines};
 for(const [code,legacy]of Object.entries(engines))if(successors[code])engines[code]=successors[code](snapshot.snapshotPayload,base,index,legacy);
 const traceIndex={};for(const engine of Object.values(engines))for(const m of Object.values(engine.metrics))traceIndex[m.traceId]=m.trace;
 const {resultDigest,determinismKey,...inheritedCore}=inherited;
 const core={...inheritedCore,runtimeVersion:'1.1.0',calculationPolicy:'CUSTOMER_NET_DEBT_V2',engines,traceIndex};
 return Object.freeze({...core,resultDigest:await sha256(core),determinismKey:await sha256({fdrDigest:snapshot.digest,assumptionDigest:inherited.assumptionDigest,fcrVersion:'1.1.0',scenarioCode:inherited.scenarioCode,requestedEngines:Object.keys(engines)})});
}
