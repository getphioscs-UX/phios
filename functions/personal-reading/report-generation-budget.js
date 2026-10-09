import {COMMERCE_ECONOMICS_VERSION,reportEconomics,reportFollowupReserve,reportGenerationCeiling} from '../pws/commercial/commerce-economics-policy.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const validAmount=n=>Number.isFinite(n)&&n>=0;
// Generation/cache state projection; the shared SQL ProductCostEnvelope remains
// the sole monetary reservation authority used by paid-report-transport.
// Use only server-loaded payment/entitlement records. Never expose this as a
// request-body authority. The durable store must supply an exclusive lock.
export function createReportBudget({productId,orderId,reportId,ownerAccountId,verifiedPayment,authorityDigest}) {
 const policy=reportEconomics(productId);
 if(verifiedPayment!==true||![orderId,reportId,ownerAccountId,authorityDigest].every(x=>typeof x==='string'&&x.length))fail('PAID_REPORT_BUDGET_BINDING_REQUIRED');
 return {version:COMMERCE_ECONOMICS_VERSION,productId:policy.productId,orderId,reportId,ownerAccountId,authorityDigest,hardCapUsd:policy.providerCapUsd,followupReserveUsd:reportFollowupReserve(productId),includedFollowups:4,requests:{},delivered:false};
}
export function inspectReportBudget(ledger) {
 const policy=reportEconomics(ledger?.productId);
 if(ledger?.version!==COMMERCE_ECONOMICS_VERSION||ledger.hardCapUsd!==policy.providerCapUsd)fail('REPORT_BUDGET_POLICY_MISMATCH');
 const requests=Object.values(ledger.requests||{});let spentUsd=0,reservedUsd=0,generationUsd=0,followupUsd=0;
 for(const r of requests){if(!validAmount(r.reservedUsd)||!['RESERVED','RECORDED','UNKNOWN'].includes(r.state))fail('REPORT_BUDGET_LEDGER_INVALID');
  const amount=r.state==='RECORDED'?r.actualUsd:r.reservedUsd;if(!validAmount(amount))fail('REPORT_BUDGET_LEDGER_INVALID');
  if(r.state==='RECORDED')spentUsd+=amount;else reservedUsd+=amount;
  if(r.phase==='FOLLOWUP')followupUsd+=amount;else generationUsd+=amount;
 }
 return {spentUsd,reservedUsd,totalCommittedUsd:spentUsd+reservedUsd,generationUsd,followupUsd,unknownUsage:requests.some(r=>r.state==='UNKNOWN'),inFlight:requests.some(r=>r.state==='RESERVED'),followupsUsed:requests.filter(r=>r.phase==='FOLLOWUP'&&(r.state!=='RECORDED'||r.output!==undefined)).length};
}
export function reserveReportCall(ledger,{requestId,phase,projectedMaximumUsd,repairUnit=null}) {
 if(!['PRIMARY','REPAIR','FOLLOWUP'].includes(phase)||typeof requestId!=='string'||!requestId||!validAmount(projectedMaximumUsd))fail('REPORT_BUDGET_REQUEST_INVALID');
 if(ledger.requests?.[requestId])return {replay:true,request:ledger.requests[requestId]};
 const state=inspectReportBudget(ledger);
 if(state.unknownUsage||state.inFlight)fail('REPORT_USAGE_RECONCILIATION_REQUIRED');
 if(phase==='FOLLOWUP'){
  if(!ledger.delivered)fail('REPORT_COMPLETE_DELIVERY_REQUIRED');
  if(state.followupsUsed>=4)fail('REPORT_FOUR_FOLLOWUPS_EXHAUSTED');
  // Preserve a funded share for every remaining included answer.
  const allowance=(ledger.hardCapUsd-state.totalCommittedUsd)/(4-state.followupsUsed);
  if(projectedMaximumUsd>allowance+1e-10)fail('REPORT_FOLLOWUP_RESERVE_EXCEEDED');
 }else{
  if(state.generationUsd+projectedMaximumUsd>reportGenerationCeiling(ledger.productId)+1e-10)fail('REPORT_GENERATION_AND_REPAIR_BUDGET_EXCEEDED');
  if(phase==='REPAIR'){
   if(typeof repairUnit!=='string'||!repairUnit)fail('REPORT_TARGETED_REPAIR_UNIT_REQUIRED');
   if(Object.values(ledger.requests).some(r=>r.phase==='REPAIR'&&r.repairUnit===repairUnit))fail('REPORT_REPEATED_AUTOMATIC_REPAIR_DENIED');
  }
 }
 if(state.totalCommittedUsd+projectedMaximumUsd>ledger.hardCapUsd+1e-10)fail('REPORT_TOTAL_COST_CAP_EXCEEDED');
 const request={requestId,phase,repairUnit,reservedUsd:projectedMaximumUsd,state:'RESERVED'};ledger.requests[requestId]=request;return {replay:false,request};
}
export function settleReportCall(ledger,requestId,actualUsd) {
 const request=ledger.requests?.[requestId];if(!request||request.state!=='RESERVED')fail('REPORT_CALL_RESERVATION_REQUIRED');
 if(!validAmount(actualUsd)){request.state='UNKNOWN';return request;}
 request.state='RECORDED';request.actualUsd=actualUsd;
 if(actualUsd>request.reservedUsd+1e-10||inspectReportBudget(ledger).totalCommittedUsd>ledger.hardCapUsd+1e-10)fail('REPORT_PROVIDER_USAGE_EXCEEDED_RESERVATION');
 return request;
}
export function markReportBudgetDelivered(ledger,{generationComplete,publicationComplete}) {
 const s=inspectReportBudget(ledger);if(!generationComplete||!publicationComplete||s.unknownUsage||s.inFlight)fail('REPORT_COMPLETE_DELIVERY_REQUIRED');ledger.delivered=true;return ledger;
}
// Atomic reserve -> persist -> transport -> settle -> persist. Unknown/error
// usage holds the reservation and blocks retries; rerender/cache never calls it.
export async function runBudgetedReportCall({store,key,binding,request,invoke,validateOutput,usageCost}) {
 if(!store?.withLock||!store.get||!store.put||!store.putIfAbsent||typeof invoke!=='function'||typeof usageCost!=='function')fail('REPORT_DURABLE_BUDGET_STORE_REQUIRED');
 return store.withLock(key,async()=>{
  const ledger=await store.get(key)||createReportBudget(binding);
  for(const k of ['productId','orderId','reportId','ownerAccountId','authorityDigest'])if(ledger[k]!==binding[k])fail('REPORT_BUDGET_OWNER_MISMATCH');
  const reservation=reserveReportCall(ledger,request);
  if(reservation.replay){if(reservation.request.state!=='RECORDED'||reservation.request.output===undefined)fail('REPORT_USAGE_RECONCILIATION_REQUIRED');return {output:reservation.request.output,cacheHit:true,providerCalls:0};}
  await store.put(key,ledger);
  let response;
  try{response=await invoke();}catch(e){settleReportCall(ledger,request.requestId,usageCost(e));await store.put(key,ledger);throw e;}
  try{settleReportCall(ledger,request.requestId,usageCost(response));}finally{await store.put(key,ledger);}
  if(ledger.requests[request.requestId].state!=='RECORDED')fail('REPORT_USAGE_RECONCILIATION_REQUIRED');
  const output=await validateOutput(response);ledger.requests[request.requestId].output=output;await store.put(key,ledger);
  return {output,cacheHit:false,providerCalls:1};
 });
}
