// Versioned FCR-owned supplement. Uses the same typed arithmetic as FCR v1;
// no benchmarks, FX guesses or mutation of historical calculation engines.
import {fromFact,sum,divide,scale,unknown,exact,approximate,range,subtract} from './range-arithmetic.js';
import {minor,money} from './customer-finance-tools.js';
export function publicationDifference(a,b){if(a?.kind==='RANGE'||b?.kind==='RANGE'){const typed=v=>v?.kind==='RANGE'?range(v.value.min,v.value.max):typeof v?.value==='number'?(v.kind==='APPROXIMATE'?approximate(v.value):exact(v.value)):unknown();const result=subtract(typed(a),typed(b));return {...result,value:result.kind==='RANGE'?{min:result.min,max:result.max}:result.value??null};}if(typeof a?.value!=='number'||typeof b?.value!=='number')return {kind:'UNKNOWN',value:null};return {kind:a.kind==='APPROXIMATE'||b.kind==='APPROXIMATE'?'APPROXIMATE':'EXACT',value:Number(money(minor(String(a.value))-minor(String(b.value))))};}
export function publicationMonthlyValue(fact,currency,frequency){const source=fromFact(fact,currency),result=frequency==='MONTHLY'?source:frequency==='ANNUAL'?divide(source,exact(12)):unknown('PERIOD_UNCONFIRMED');return {...result,value:result.kind==='RANGE'?{min:result.min,max:result.max}:result.value??null};}
export function calculatePublicationAccessibility(snapshot,metadata,cashFlow){
 const payload=snapshot.snapshotPayload,base=payload.currencyContext.baseCurrency,liquid=payload.assets.filter(a=>['CASH','BANK_ACCOUNT','FIXED_DEPOSIT'].includes(a.assetType));
 const assetMeta=a=>(metadata.assets||[]).find(m=>m.ref===a.assetId);
 const admitted=liquid.length&&liquid.every(a=>a.currency===base&&['IMMEDIATE','RESTRICTED','MATURITY'].includes(assetMeta(a)?.access));
 const immediate=liquid.filter(a=>assetMeta(a)?.access==='IMMEDIATE');
 const accessible=admitted?(immediate.length?sum(immediate.map(a=>fromFact(a.valueFact,base))):exact(0)):unknown('ACCESS_OR_CURRENCY_UNCONFIRMED');
 const essentials=payload.expenses.filter(a=>a.expenseType==='ESSENTIAL'),expenseMeta=a=>(metadata.expenses||[]).find(m=>m.ref===a.expenseId);
 const monthly=a=>a.currency!==base?unknown('CURRENCY_UNCONFIRMED'):a.frequency==='MONTHLY'?fromFact(a.amountFact,base):a.frequency==='ANNUAL'?divide(fromFact(a.amountFact,base),exact(12)):unknown('PERIOD_UNCONFIRMED');
 const essentialExpenses=essentials.length&&essentials.every(a=>expenseMeta(a)?.classification==='DECLARED_ESSENTIAL')?sum(essentials.map(monthly)):unknown('ESSENTIAL_CLASSIFICATION_UNCONFIRMED');
 const metric=(id,value,formula,refs)=>({id,value,formula,sourceFactRefs:refs,unit:id.includes('Coverage')?'MONTHS':'MONEY',currency:base,asOfDate:payload.asOfDate,formulaVersion:'FCR_PUBLICATION_ACCESSIBILITY_R3_1'});
 return {accessible:metric('accessible',accessible,'Sum of same-currency declared immediate-access interests',immediate.map(a=>a.assetId)),essentialExpenses:metric('essentialExpenses',essentialExpenses,'Declared essential expense facts normalized to month',essentials.map(a=>a.expenseId)),totalCoverage:metric('totalCoverage',divide(accessible,cashFlow.metrics.expenses.value),'accessible / FCR monthly total outflow',immediate.map(a=>a.assetId)),essentialCoverage:metric('essentialCoverage',divide(accessible,essentialExpenses),'accessible / declared monthly essential expenses',essentials.map(a=>a.expenseId))};
}
