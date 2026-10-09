// Projection and admission over the existing BDM checkpoint ledger, not a provider engine.
export const BAZI_OWNER_NORMAL_COST_CONTRACT=Object.freeze({NORMAL_GENERATION_CALLS_MAX:3,NORMAL_GENERATION_COST_USD_MAX:1,BILINGUAL_ZH_EN_INCLUDED_IN_SAME_3_CALLS:true,REPAIR:'CONDITIONAL_ONLY',REPAIR_BUDGET:'EXISTING_AUTHORIZED_POLICY'});
const sum=rows=>rows.reduce((n,r)=>n+(Number.isFinite(r.cost)?r.cost:0),0);
export function projectBaziReportCostLedger(cp={}){
 const rows=cp.ledger||[],normal=rows.filter(r=>r.callType==='NORMAL'),repair=rows.filter(r=>r.callType!=='NORMAL'),pending=cp.inFlight;
 if(rows.some(r=>Number.isFinite(r.cost)&&r.cost<0))throw Error('BAZI_REPORT_LEDGER_INVALID');
 const unknown=r=>r.usageStatus!=='RECORDED'||!Number.isFinite(r.cost),normalUnknown=normal.some(unknown),repairUnknown=repair.some(unknown),usageUnknown=normalUnknown||repairUnknown;
 const normalGenerationCalls=normal.length+(pending?.callType==='NORMAL'?1:0),repairCalls=repair.length+(pending&&pending.callType!=='NORMAL'?1:0);
 return {normalGenerationCalls,normalGenerationCostUSD:normalUnknown?null:sum(normal),repairCalls,repairCostUSD:repairUnknown?null:sum(repair),totalProviderCalls:normalGenerationCalls+repairCalls,totalProviderCostUSD:usageUnknown?null:sum(rows),
  actualRecordedCostUSD:sum(rows),estimatedReservedCostUSD:pending?.estimatedMaximumCostUSD??0,usageUnknown,
  repairEligibility:'EXPLICIT_VERIFIER_FAILURE_AND_EXISTING_POLICY_AUTHORIZATION_REQUIRED',softLimitState:Object.keys(cp.costTelemetry||{}).length?cp.costTelemetry:'EXISTING_POLICY_THRESHOLDS_UNSET',
  hardLimitState:usageUnknown?'BLOCKED_UNKNOWN_INCURRED_COST':normalGenerationCalls>3||sum(normal)>1?'NORMAL_HARD_LIMIT_EXCEEDED':'WITHIN_NORMAL_LIMIT'};
}
export function inspectBaziRepairEligibility(failure){
 if(!failure||failure.verificationRejected!==true||!failure.failureId||!failure.sectionId||!['zh-Hans','en'].includes(failure.locale)||!failure.reason||failure.reason==='BLOCKED_ACCEPTED_COPY_COVERAGE'||failure.successfulVerification===true)return {eligible:false,reason:'NO_REPAIR_ELIGIBLE_VERIFIER_FAILURE'};
 return {eligible:true,state:'TARGETED_REPAIR_REVIEW_ONLY',scope:{sectionId:failure.sectionId,locale:failure.locale,failureId:failure.failureId,reason:failure.reason},automaticAttempt:false};
}
export function assertBaziOwnerCallBudget({checkpoint,callType,projectedMaximumCostUSD,units=[],repairAuthorization=null}={}){
 const ledger=projectBaziReportCostLedger(checkpoint);
 const deny=code=>{throw Object.assign(Error(code),{code,state:'BUDGET_BLOCKED',ledger});};
 if(!Number.isFinite(projectedMaximumCostUSD)||projectedMaximumCostUSD<0)deny('BAZI_COST_ESTIMATE_REQUIRED');
 if(checkpoint?.inFlight||ledger.usageUnknown)deny('BAZI_USAGE_RECONCILIATION_REQUIRED');
 if(callType==='NORMAL'){
  if(ledger.normalGenerationCalls>=3)deny('BAZI_FOURTH_NORMAL_CALL_DENIED');
  if(ledger.normalGenerationCostUSD+projectedMaximumCostUSD>1+1e-10)deny('BAZI_NORMAL_USD1_HARD_STOP');
  return ledger;
 }
 const eligibility=inspectBaziRepairEligibility(repairAuthorization?.failure);
 if(!eligibility.eligible||repairAuthorization?.explicitlyAuthorized!==true||!repairAuthorization.policyReceipt||!Number.isFinite(repairAuthorization.authorizedMaximumCostUSD))deny('BAZI_EXISTING_REPAIR_AUTHORIZATION_REQUIRED');
 if(!units.length||units.some(u=>u.sectionId!==eligibility.scope.sectionId||u.locale!==eligibility.scope.locale))deny('BAZI_TARGETED_REPAIR_SCOPE_REQUIRED');
 if((checkpoint.ledger||[]).some(r=>r.repairFailureId===eligibility.scope.failureId))deny('BAZI_DUPLICATE_REPAIR_CONDITION_DENIED');
 if(ledger.repairCostUSD+projectedMaximumCostUSD>repairAuthorization.authorizedMaximumCostUSD)deny('BAZI_EXISTING_REPAIR_COST_LIMIT');
 // Does not replace BDM standard-recovery counts or any existing soft-limit owner.
 if(repairAuthorization.existingPolicyAllows!==true)deny('BAZI_EXISTING_REPAIR_POLICY_DENIED');
 return ledger;
}
