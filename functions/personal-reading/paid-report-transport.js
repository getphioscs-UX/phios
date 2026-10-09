import {runBudgetedReportCall,markReportBudgetDelivered} from './report-generation-budget.js';
import {reportEconomics} from '../pws/commercial/commerce-economics-policy.js';
// Bind AFTER existing Commerce has verified payment/entitlement and person use.
// No constructor in this module verifies a browser's claim of payment.
export function createPaidReportTransport({store,key,binding,request,model,validateProviderOutput,productCostAuthority}){
 const policy=reportEconomics(binding?.productId);
 if(!productCostAuthority?.reserve||!productCostAuthority.settle||!binding?.purchaseId||['ownerAccountId','purchaseId','productId'].some(k=>productCostAuthority[k]!==binding[k]))throw Error('PAID_REPORT_SHARED_COST_AUTHORITY_REQUIRED');
 if(typeof validateProviderOutput!=='function')throw Error('PAID_REPORT_DOMAIN_VALIDATOR_REQUIRED');
 if(model?.pricingVerified!==true||!['inputPricePerMillion','cachedInputPricePerMillion','outputPricePerMillion'].every(k=>Number.isFinite(model[k])&&model[k]>=0))throw Error('PAID_REPORT_VERIFIED_MODEL_PRICING_REQUIRED');
 const usageCost=response=>{
  if(response?.reportProviderNotInvoked===true)return 0;
  const usage=response?.budgetUsage;
  if(!Number.isSafeInteger(usage?.input_tokens)||usage.input_tokens<0||!Number.isSafeInteger(usage?.output_tokens)||usage.output_tokens<0)return null;
  const cached=usage.input_tokens_details?.cached_tokens||0;
  if(!Number.isSafeInteger(cached)||cached<0||cached>usage.input_tokens)return null;
  return ((usage.input_tokens-cached)*model.inputPricePerMillion+cached*model.cachedInputPricePerMillion+usage.output_tokens*model.outputPricePerMillion)/1e6;
 };
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
