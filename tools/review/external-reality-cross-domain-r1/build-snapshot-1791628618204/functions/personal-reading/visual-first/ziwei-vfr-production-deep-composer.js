import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {composeZwrFiveCallExperiment} from './ziwei-vfr-five-call-composer.js';
import {buildTargetedRepairPlan,runTargetedRepair} from './ziwei-vfr-targeted-repair.js';
import {buildZwrVfrProductionCompletenessManifest} from './ziwei-vfr-production-completeness.js';

export const ZWR_VFR_PRODUCTION_DEEP_COMPOSER_VERSION='ZWR-VFR-R1-PRODUCTION-DEEP-COMPOSER-v1';

async function normalizeAcceptedFiveCall({pack,result}){
 const seed={
  schemaVersion:'ZWR-VFR-R1-TARGETED-REPAIRED-RESULT-v1',
  repairVersion:'ZWR-VFR-R1-PRODUCTION-NO-REPAIR-v1',
  status:'PASS',
  authorityDigest:pack.authorityDigest,
  originalResultDigest:result.resultDigest,
  rawManuscriptSections:result.rawManuscriptSections,
  providerUsage:{
   originalProviderCalls:result.providerUsage.providerCalls,
   repairProviderCalls:0,
   semanticReviewCalls:0,
   originalEstimatedProviderCost:Number(result.providerUsage.estimatedProviderCost||0),
   repairEstimatedProviderCost:0,
   totalEstimatedProviderCost:Number(result.providerUsage.estimatedProviderCost||0),
   repairInputTokens:0,
   repairCachedInputTokens:0,
   repairOutputTokens:0,
   usageRecords:[]
  }
 };
 return deepFreeze({...seed,resultDigest:await sha256Stable(seed)});
}

export async function composeZwrVfrProductionDeepManuscript({pack,env={},fetcher=globalThis.fetch}={}){
 const first=await composeZwrFiveCallExperiment({pack,env,fetcher});
 if(first.status!=='PASS'){
  const error=new Error('ZWR_VFR_PRODUCTION_DEEP_COMPOSITION_UNAVAILABLE');
  error.code='ZWR_VFR_PRODUCTION_DEEP_COMPOSITION_UNAVAILABLE';
  error.status=503;
  error.details={status:first.status,plan:first.plan||null};
  throw error;
 }

 const firstManifest=buildZwrVfrProductionCompletenessManifest(first);
 if(firstManifest.status==='PASS'){
  const repairedResult=await normalizeAcceptedFiveCall({pack,result:first});
  return deepFreeze({
   schemaVersion:ZWR_VFR_PRODUCTION_DEEP_COMPOSER_VERSION,
   status:'PASS',
   repairedResult,
   completeness:firstManifest,
   providerCalls:repairedResult.providerUsage.originalProviderCalls,
   repairProviderCalls:0,
   semanticReviewCalls:0,
   estimatedProviderCost:repairedResult.providerUsage.totalEstimatedProviderCost
  });
 }

 if(firstManifest.defects.some(d=>d.sectionId==='ALL')){
  const error=new Error('ZWR_VFR_PRODUCTION_TOTAL_DEPTH_UNRESOLVED');
  error.code='ZWR_VFR_PRODUCTION_TOTAL_DEPTH_UNRESOLVED';
  error.status=503;
  error.details={manifest:firstManifest};
  throw error;
 }

 const plan=buildTargetedRepairPlan({pack,result:first,manifest:firstManifest});
 if(!plan.allowed){
  const error=new Error('ZWR_VFR_PRODUCTION_REPAIR_BUDGET_BLOCKED');
  error.code='ZWR_VFR_PRODUCTION_REPAIR_BUDGET_BLOCKED';
  error.status=503;
  error.details={plan};
  throw error;
 }

 const repairedResult=await runTargetedRepair({pack,result:first,manifest:firstManifest,env,fetcher});
 if(repairedResult.status!=='PASS'){
  const error=new Error('ZWR_VFR_PRODUCTION_REPAIR_UNAVAILABLE');
  error.code='ZWR_VFR_PRODUCTION_REPAIR_UNAVAILABLE';
  error.status=503;
  error.details={status:repairedResult.status};
  throw error;
 }

 const finalManifest=buildZwrVfrProductionCompletenessManifest(repairedResult);
 if(finalManifest.status!=='PASS'){
  const error=new Error('ZWR_VFR_PRODUCTION_COMPLETENESS_UNRESOLVED');
  error.code='ZWR_VFR_PRODUCTION_COMPLETENESS_UNRESOLVED';
  error.status=503;
  error.details={manifest:finalManifest};
  throw error;
 }

 return deepFreeze({
  schemaVersion:ZWR_VFR_PRODUCTION_DEEP_COMPOSER_VERSION,
  status:'PASS',
  repairedResult,
  completeness:finalManifest,
  providerCalls:repairedResult.providerUsage.originalProviderCalls+repairedResult.providerUsage.repairProviderCalls,
  repairProviderCalls:repairedResult.providerUsage.repairProviderCalls,
  semanticReviewCalls:0,
  estimatedProviderCost:repairedResult.providerUsage.totalEstimatedProviderCost
 });
}
export default Object.freeze({composeZwrVfrProductionDeepManuscript,ZWR_VFR_PRODUCTION_DEEP_COMPOSER_VERSION});
