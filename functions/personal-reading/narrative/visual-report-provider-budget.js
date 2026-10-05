import {estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {admitVfrReportRequest} from '../visual-first/report-provider-budget.js';
export function planReportProviderRequest({model,usage,calls=0,spent=0,reason=null}){
 if(!Number.isInteger(calls)||calls<0||!Number.isFinite(spent)||spent<0||spent>1)throw Error('PROVIDER_LEDGER_INVALID');
 if(!model||['inputPricePerMillion','cachedInputPricePerMillion','outputPricePerMillion'].some(k=>!Number.isFinite(model[k])||model[k]<0)||!usage||!Number.isFinite(usage.inputTokens)||!Number.isFinite(usage.outputTokens))throw Error('PROVIDER_PRICING_OR_USAGE_REQUIRED');
 if(usage.inputTokens<0||usage.outputTokens<0||(usage.cachedInputTokens!=null&&(!Number.isFinite(usage.cachedInputTokens)||usage.cachedInputTokens<0||usage.cachedInputTokens>usage.inputTokens)))throw Error('PROVIDER_PRICING_OR_USAGE_REQUIRED');
 const projected=Number(estimatePaiProviderCost(model,usage));
 return admitVfrReportRequest({projectedCost:projected,calls,spent,reason});
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
 const completeUsage=Number.isFinite(response.usage?.input_tokens)&&Number.isFinite(response.usage?.output_tokens);
 const actual=completeUsage?{inputTokens:response.usage.input_tokens,cachedInputTokens:response.usage.input_tokens_details?.cached_tokens||0,outputTokens:response.usage.output_tokens}:usage;
 const record=recordVisualReportUsage({requestId:ledger.requestId,model,usage:actual,callCount:ledger.calls,firstAttemptFailureRecorded:ledger.calls>1});
 ledger.spent+=record.estimatedProviderCost-plan.projected;(ledger.records||=[]).push(record);
 if(ledger.spent>1)throw Error('PROVIDER_BUDGET_EXCEEDED');return response.output;
}
