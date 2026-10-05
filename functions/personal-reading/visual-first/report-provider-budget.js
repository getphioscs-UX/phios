import {estimatePaiProviderCost} from '../../_lib/pai-r1-economics.js';

export const VFR_REPORT_PROVIDER_BUDGET_VERSION='PHI-OS-VFR-R1-PROVIDER-BUDGET-v1';
export const VFR_REPORT_PROVIDER_BUDGET_USD=1.00;
export const VFR_FIRST_CALL_PRECHECK_USD=.80;
export const VFR_REPAIR_FORBIDDEN_AT_USD=.90;

function finite(v){return Number.isFinite(Number(v))?Number(v):0;}
export function estimateVfrTokens(value){
 const text=typeof value==='string'?value:JSON.stringify(value??null);
 // Conservative planning estimate for mixed Chinese/English structured JSON.
 return Math.ceil(text.length/3);
}
export function planVfrProviderBudget({model,input,maxOutputTokens=12000,spentUsd=0,nextCallKind='PRIMARY'}={}){
 const inputTokens=estimateVfrTokens(input);
 const maxCost=estimatePaiProviderCost(model,{inputTokens,cachedInputTokens:0,outputTokens:maxOutputTokens});
 const spent=finite(spentUsd),projected=Number((spent+maxCost).toFixed(8));
 const primary=nextCallKind==='PRIMARY';
 const allowed=primary
  ?maxCost<=VFR_FIRST_CALL_PRECHECK_USD&&projected<=VFR_REPORT_PROVIDER_BUDGET_USD
  :spent<VFR_REPAIR_FORBIDDEN_AT_USD&&projected<=VFR_REPORT_PROVIDER_BUDGET_USD;
 return Object.freeze({
  schemaVersion:VFR_REPORT_PROVIDER_BUDGET_VERSION,
  nextCallKind,
  inputTokens,
  maxOutputTokens,
  estimatedNextCallCost:maxCost,
  spentUsd:spent,
  projectedTotalUsd:projected,
  budgetLimitUsd:VFR_REPORT_PROVIDER_BUDGET_USD,
  firstCallPrecheckCeilingUsd:VFR_FIRST_CALL_PRECHECK_USD,
  repairForbiddenAtOrAboveUsd:VFR_REPAIR_FORBIDDEN_AT_USD,
  allowed,
  status:allowed?'WITHIN_BUDGET':primary?'PROVIDER_BUDGET_PRECHECK_BLOCKED':'PROVIDER_REPAIR_BUDGET_BLOCKED'
 });
}
export function assertVfrLiveAllowed(env={}){
 if(String(env.REPORT_PROVIDER_LIVE_ALLOWED||'').toLowerCase()!=='true')throw Error('VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED');
 return true;
}
export function assertVfrCallCount({providerCalls=0,semanticReviewCalls=0}={}){
 if(providerCalls>2)throw Error('VFR_PROVIDER_CALL_LIMIT_EXCEEDED');
 if(semanticReviewCalls!==0)throw Error('VFR_SEMANTIC_AI_REVIEW_FORBIDDEN');
 return true;
}
export default Object.freeze({estimateVfrTokens,planVfrProviderBudget,assertVfrLiveAllowed,assertVfrCallCount});
