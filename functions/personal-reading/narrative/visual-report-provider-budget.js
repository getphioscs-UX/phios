import {estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
export function planReportProviderRequest({model,usage,calls=0,spent=0,reason=null}){
 if(!model||['inputPricePerMillion','cachedInputPricePerMillion','outputPricePerMillion'].some(k=>!Number.isFinite(model[k])||model[k]<0)||!usage||!Number.isFinite(usage.inputTokens)||!Number.isFinite(usage.outputTokens))throw Error('PROVIDER_PRICING_OR_USAGE_REQUIRED');
 const projected=Number(estimatePaiProviderCost(model,usage));
 const boundedReasons=['MALFORMED_JSON','ONE_MISSING_SECTION','BOUNDED_FACT_REPAIR','TRUNCATION','TRANSPORT_FAILURE'];
 if(calls>=2)return {allowed:false,code:'PROVIDER_CALL_LIMIT_EXCEEDED',projected};
 if(calls===0&&projected>.8)return {allowed:false,code:'PROVIDER_BUDGET_PRECHECK_BLOCKED',projected};
 // Conservative repair reserve includes the owner's explicit $0.88 deny case.
 if(calls===1&&(spent>=.88||!boundedReasons.includes(reason)))return {allowed:false,code:'PROVIDER_REPAIR_DENIED',projected};
 if(spent+projected>1)return {allowed:false,code:'PROVIDER_BUDGET_EXCEEDED',projected};
 return {allowed:true,projected,budgetRemaining:1-spent-projected};
}
export function recordVisualReportUsage({requestId,model,usage,callCount,firstAttemptFailureRecorded=false}){
 const estimatedProviderCost=Number(estimatePaiProviderCost(model,usage));
 return createPaiUsageRecord({requestId,aiExecutionClass:'T3_DEEP_COMPOSITION',provider:model.providerId,model:model.modelId,...usage,estimatedProviderCost,providerAttemptCount:callCount,firstAttemptFailureRecorded,requestType:'QA',customerTier:'PAID',entitlementClass:'REPORT',creditsCharged:0});
}
// One explicitly requested bounded attempt. No automatic repair/retry or AI review.
export async function composeVisualReportAttempt({env={},ledger,model,usage,reason=null,invoke,payload,pricingVerified=false}){
 if(env.REPORT_PROVIDER_LIVE_ALLOWED!=='true'||env.REPORT_ZERO_COST_REPLAY==='true')throw Error('REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED');
 if(!pricingVerified)throw Error('PROVIDER_PRICING_REVALIDATION_REQUIRED');
 const plan=planReportProviderRequest({model,usage,calls:ledger.calls,spent:ledger.spent,reason});if(!plan.allowed)throw Error(plan.code);
 ledger.calls++;ledger.spent+=plan.projected; // Reserve worst-case cost before transport, including failure.
 const response=await invoke(payload);
 const actual=response.usage?{inputTokens:response.usage.input_tokens,cachedInputTokens:response.usage.input_tokens_details?.cached_tokens||0,outputTokens:response.usage.output_tokens}:usage;
 const record=recordVisualReportUsage({requestId:ledger.requestId,model,usage:actual,callCount:ledger.calls,firstAttemptFailureRecorded:ledger.calls>1});
 ledger.spent+=record.estimatedProviderCost-plan.projected;(ledger.records||=[]).push(record);
 if(ledger.spent>1)throw Error('PROVIDER_BUDGET_EXCEEDED');return response.output;
}
