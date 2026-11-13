import {runBudgetedReportCall,markReportBudgetDelivered} from './report-generation-budget.js';
import {reportEconomics} from '../pws/commercial/commerce-economics-policy.js';
export function meterReportProviderUsage(response,model){
 if(response?.reportProviderNotInvoked===true)return 0;
 if(!model||!['inputPricePerMillion','cachedInputPricePerMillion','outputPricePerMillion'].every(k=>Number.isFinite(model[k])&&model[k]>=0))return null;
 const usage=response?.budgetUsage,details=usage?.input_tokens_details||{};
 if(!Number.isSafeInteger(usage?.input_tokens)||usage.input_tokens<0||!Number.isSafeInteger(usage?.output_tokens)||usage.output_tokens<0)return null;
 if(usage.total_tokens!==undefined&&(!Number.isSafeInteger(usage.total_tokens)||usage.total_tokens!==usage.input_tokens+usage.output_tokens))return null;
 if(response.body?.service_tier&&response.body.service_tier!==(model.serviceTier||'default'))return null;
 if(model.cacheWritesBilled===true&&['cache_write_tokens','cached_tokens'].some(k=>!Object.prototype.hasOwnProperty.call(details,k)))return null;
 const cached=details.cached_tokens??0,writes=details.cache_write_tokens??0;
 if(![cached,writes].every(n=>Number.isSafeInteger(n)&&n>=0)||cached+writes>usage.input_tokens)return null;
 const split=details.cache_write_tokens_details;
 if(split!==undefined&&(!split||![split.ttl_30m_tokens,split.ttl_12h_tokens].every(n=>Number.isSafeInteger(n)&&n>=0)||split.ttl_30m_tokens+split.ttl_12h_tokens!==writes))return null;
 let writeCost=0;
 if(writes){
  if(split){const a=split.ttl_30m_tokens,b=split.ttl_12h_tokens;if(![a,b].every(n=>Number.isSafeInteger(n)&&n>=0)||a+b!==writes||![model.cacheWriteInputPricePerMillion,model.cacheWrite12hInputPricePerMillion].every(n=>Number.isFinite(n)&&n>=0))return null;writeCost=a*model.cacheWriteInputPricePerMillion+b*model.cacheWrite12hInputPricePerMillion;}
  else{const rate=model.cacheWriteTTL==='30m'?model.cacheWriteInputPricePerMillion:model.cacheWriteTTL==='12h'?model.cacheWrite12hInputPricePerMillion:null;if(!Number.isFinite(rate)||rate<0)return null;writeCost=writes*rate;}
 }
 const amount=((usage.input_tokens-cached-writes)*model.inputPricePerMillion+cached*model.cachedInputPricePerMillion+writeCost+usage.output_tokens*model.outputPricePerMillion)/1e6;
 return Number.isFinite(amount)&&amount>=0?amount:null;
}
// Bind AFTER existing Commerce has verified payment/entitlement and person use.
// No constructor in this module verifies a browser's claim of payment.
export function createPaidReportTransport({store,key,binding,request,model,validateProviderOutput,productCostAuthority}){
 const policy=reportEconomics(binding?.productId);
 if(!productCostAuthority?.reserve||!productCostAuthority.settle||!binding?.purchaseId||['ownerAccountId','purchaseId','productId'].some(k=>productCostAuthority[k]!==binding[k]))throw Error('PAID_REPORT_SHARED_COST_AUTHORITY_REQUIRED');
 if(typeof validateProviderOutput!=='function')throw Error('PAID_REPORT_DOMAIN_VALIDATOR_REQUIRED');
 if(model?.pricingVerified!==true||!['inputPricePerMillion','cachedInputPricePerMillion','outputPricePerMillion'].every(k=>Number.isFinite(model[k])&&model[k]>=0))throw Error('PAID_REPORT_VERIFIED_MODEL_PRICING_REQUIRED');
 const usageCost=response=>meterReportProviderUsage(response,model);
 return Object.freeze({purpose:'PAID_UNLOCKED_REPORT',productId:policy.productId,async invokeBudgeted(invoke){
  const result=await runBudgetedReportCall({store,key,binding,request,usageCost,
   invoke:async()=>{let reservation;try{reservation=await productCostAuthority.reserve(request);}catch(error){error.reportProviderNotInvoked=true;throw error;}if(!reservation.newReservation)throw Error('REPORT_SHARED_COST_RECONCILIATION_REQUIRED');
    let result;try{const response=await invoke();const copy=response.clone();const body=await copy.json();result={body,status:response.status,budgetUsage:body?.usage};}catch(error){try{await productCostAuthority.settle(request,null);}catch{}throw error;}
    await productCostAuthority.settle(request,usageCost(result));return result;},
   validateOutput:async response=>{if(response.status<200||response.status>=300)throw Error('PAID_REPORT_PROVIDER_ERROR');await validateProviderOutput(response.body);return {body:response.body,status:response.status};}});
  const response=Response.json(result.output.body,{status:result.output.status});
  // Server-only telemetry; this property is not serialized as report content.
  Object.defineProperty(response,'reportBudget',{value:Object.freeze({cacheHit:result.cacheHit,providerCalls:result.providerCalls})});
  return response;
 }});
}
export async function completePaidReportBudget({store,key,generationComplete,publicationComplete}){
 return store.withLock(key,async()=>{const ledger=await store.get(key);markReportBudgetDelivered(ledger,{generationComplete,publicationComplete});await store.put(key,ledger);return {budgetDelivered:true};});
}
