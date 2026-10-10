import {reportEconomics,reportGenerationCeiling,COMMERCE_ECONOMICS_VERSION} from '../../pws/commercial/commerce-economics-policy.js';
import {estimatePaiProviderCost} from '../../_lib/pai-r1-economics.js';

export const VFR_REPORT_PROVIDER_BUDGET_VERSION=COMMERCE_ECONOMICS_VERSION;
export const VFR_REPORT_PROVIDER_BUDGET_USD=reportEconomics('BZR').providerCapUsd;
export const VFR_FIRST_CALL_PRECHECK_USD=reportGenerationCeiling('BZR');
export const VFR_REPAIR_FORBIDDEN_AT_USD=reportGenerationCeiling('BZR');

// Shared decision owner for both exact-usage and compact-pack planning adapters.
export function admitVfrReportRequest({projectedCost,calls=0,spent=0,reason=null,methodId='BZR'}={}){
 const policy=reportEconomics(methodId),ceiling=reportGenerationCeiling(methodId);
 if(!Number.isFinite(projectedCost)||projectedCost<0||!Number.isInteger(calls)||calls<0||!Number.isFinite(spent)||spent<0)throw Error('PROVIDER_LEDGER_INVALID');
 const repair=reason!==null;
 if(!repair&&calls>=3)return {allowed:false,code:'PROVIDER_PRIMARY_CALL_TARGET_EXCEEDED',projected:projectedCost};
 if(repair&&!['MALFORMED_JSON','ONE_MISSING_SECTION','BOUNDED_FACT_REPAIR','TRUNCATION','TRANSPORT_FAILURE'].includes(reason))return {allowed:false,code:'PROVIDER_REPAIR_DENIED',projected:projectedCost};
 if(spent+projectedCost>ceiling+1e-10)return {allowed:false,code:'PROVIDER_BUDGET_EXCEEDED',projected:projectedCost};
 return {allowed:true,projected:projectedCost,budgetLimitUsd:policy.providerCapUsd,generationCeilingUsd:ceiling,budgetRemaining:policy.providerCapUsd-spent-projectedCost,repairSoftLimit:2};
}

function finite(v){return Number.isFinite(Number(v))?Number(v):0;}
export function estimateVfrTokens(value){
 const text=typeof value==='string'?value:JSON.stringify(value??null);
 // Conservative planning estimate for mixed Chinese/English structured JSON.
 return Math.ceil(text.length/3);
}
export function planVfrProviderBudget({model,input,maxOutputTokens=12000,spentUsd=0,nextCallKind='PRIMARY',methodId='BZR'}={}){
 const inputTokens=estimateVfrTokens(input);
 const maxCost=Number(estimatePaiProviderCost(model,{inputTokens,cachedInputTokens:0,outputTokens:maxOutputTokens}));
 const spent=finite(spentUsd),projected=Number((spent+maxCost).toFixed(8));
 const primary=nextCallKind==='PRIMARY';
 const allowed=admitVfrReportRequest({projectedCost:Number(maxCost),spent,calls:primary?0:1,methodId,reason:primary?null:'BOUNDED_FACT_REPAIR'}).allowed;
 return Object.freeze({
  schemaVersion:VFR_REPORT_PROVIDER_BUDGET_VERSION,
  nextCallKind,
  inputTokens,
  maxOutputTokens,
  estimatedNextCallCost:maxCost,
  spentUsd:spent,
  projectedTotalUsd:projected,
  budgetLimitUsd:reportEconomics(methodId).providerCapUsd,
  firstCallPrecheckCeilingUsd:reportGenerationCeiling(methodId),
  repairForbiddenAtOrAboveUsd:reportGenerationCeiling(methodId),
  allowed,
  status:allowed?'WITHIN_BUDGET':primary?'PROVIDER_BUDGET_PRECHECK_BLOCKED':'PROVIDER_REPAIR_BUDGET_BLOCKED'
 });
}
export function assertVfrLiveAllowed(env={}){
 if(String(env.REPORT_PROVIDER_LIVE_ALLOWED||'').toLowerCase()!=='true')throw Error('VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED');
 return true;
}
export function assertVfrCallCount({providerCalls=0,semanticReviewCalls=0}={}){
 if(!Number.isInteger(providerCalls)||providerCalls<0)throw Error('VFR_PROVIDER_CALL_COUNT_INVALID'); // Cost/defect ledger, not an arbitrary repair count, is the hard gate.
 if(semanticReviewCalls!==0)throw Error('VFR_SEMANTIC_AI_REVIEW_FORBIDDEN');
 return true;
}
export default Object.freeze({estimateVfrTokens,planVfrProviderBudget,assertVfrLiveAllowed,assertVfrCallCount});
