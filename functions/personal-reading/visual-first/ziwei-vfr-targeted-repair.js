import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from '../narrative/narrative-provider.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../narrative/ziwei-r5-provider-registry.js';
import {selectPaiRoute,estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {assertVfrLiveAllowed,estimateVfrTokens} from './report-provider-budget.js';

export const ZWR_VFR_TARGETED_REPAIR_VERSION='ZWR-VFR-R1-TARGETED-COMPLETENESS-REPAIR-v1';
const TOTAL_EXPERIMENT_BUDGET_USD=1.00;
const MAX_OUTPUT_TOKENS=6000;

function modelRecord(){
 const route=selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION',deterministicFallbackAvailable:false},ZIWEI_R5_PAI_REGISTRY);
 const model=ZIWEI_R5_PAI_REGISTRY.models.find(m=>m.modelId===route.selectedModel);
 if(!route.selectedProvider||!route.selectedModel||!model)throw Error('ZWR_TARGETED_REPAIR_PROVIDER_ROUTE_REQUIRED');
 return {route,model};
}
function sectionPack(pack,sectionId){
 const section=pack.sections.find(s=>s.sectionId===sectionId);
 if(!section)throw Error('ZWR_TARGETED_REPAIR_SECTION_MISSING:'+sectionId);
 return deepFreeze({
  schemaVersion:'ZWR-VFR-R1-TARGETED-REPAIR-PACK-v1',
  methodId:pack.methodId,
  subjectBinding:pack.subjectBinding,
  sourceAuthorityVersion:pack.sourceAuthorityVersion,
  reportRules:pack.reportRules,
  section,
  realityContext:pack.realityContext,
  authorityDigest:pack.authorityDigest
 });
}
function schemaFor(locales,sectionId){
 const props={sectionId:{type:'string',enum:[sectionId]}};
 const required=['sectionId'];
 if(locales.includes('zhHans')){
  props.zhHansManuscript={
   type:'string',
   minLength:650,
   description:'Write one complete publication-quality Chinese Zi Wei Dou Shu chapter in 5-7 natural paragraphs. Target roughly 900-1300 Chinese characters. There is no maximum-length field: finish every sentence and every paragraph cleanly.'
  };
  required.push('zhHansManuscript');
 }
 if(locales.includes('en')){
  props.enManuscript={
   type:'string',
   minLength:1200,
   description:'Write one complete publication-quality English Zi Wei Dou Shu chapter in 5-7 natural paragraphs. Target roughly 1600-2600 characters. There is no maximum-length field: finish every sentence and every paragraph cleanly.'
  };
  required.push('enManuscript');
 }
 return {
  type:'object',
  additionalProperties:false,
  required,
  properties:props
 };
}
function promptFor({sectionId,locales,anchorZh}){
 const mode=locales.length===2
  ?'Rewrite the complete Chinese and English manuscripts for this one section.'
  :'Rewrite only the complete English manuscript for this one section. The supplied Chinese manuscript is the semantic anchor: preserve its substantive meaning, but write natural English rather than sentence-by-sentence translation.';
 return [
  'You are repairing publication completeness for one premium Zi Wei Dou Shu customer-report chapter.',
  'The supplied section Authority Pack is the complete factual authority. Do not calculate new chart facts and do not invent missing evidence.',
  mode,
  'Write coherent long-form prose, not bullets, semantic fields, checklists, or mini-summaries.',
  'Integrate palace structure, star combinations, transformations, lived situations, supportive expression, pressure distortion, counterweights, timing where admitted, and grounded reality navigation naturally.',
  'Use professional Zi Wei terminology and translate technical structure into recognizable lived meaning.',
  'Every paragraph must end with a complete sentence. Never stop mid-clause or mid-word. Do not fill space merely because output budget remains.',
  'Do not generate layout, diagrams, headings, captions, colors, cards, or page structure. PHI OS owns presentation.',
  'Do not expose internal workflow terms. Preserve uncertainty. Do not diagnose illness or give transaction-level financial advice.',
  anchorZh?'Existing complete Chinese semantic anchor follows in the user payload.':'',
  'Target section: '+sectionId+'. Return JSON only in the required schema.'
 ].filter(Boolean).join('\n');
}
export function buildTargetedRepairPlan({pack,result,manifest}={}){
 if(!pack||!result||!manifest)throw Error('ZWR_TARGETED_REPAIR_INPUT_REQUIRED');
 const affected=new Set(manifest.affectedSections||[]);
 const repairs=[];
 for(const sectionId of affected){
  const sectionResult=result.rawManuscriptSections.find(s=>s.sectionId===sectionId);
  if(!sectionResult)throw Error('ZWR_TARGETED_REPAIR_RESULT_SECTION_MISSING:'+sectionId);
  const defects=(manifest.defects||[]).filter(d=>d.sectionId===sectionId);
  const zhBroken=defects.some(d=>d.locale==='zhHans'&&d.code!=='LENGTH_ADVISORY');
  const enBroken=defects.some(d=>d.locale==='en'&&d.code!=='LENGTH_ADVISORY');
  const locales=[];
  if(zhBroken)locales.push('zhHans');
  if(enBroken)locales.push('en');
  if(!locales.length)continue;
  repairs.push({
   sectionId,
   locales,
   preserveZh:!zhBroken&&Boolean(sectionResult.zhHansManuscript),
   preserveEn:!enBroken&&Boolean(sectionResult.enManuscript)
  });
 }
 const {route,model}=modelRecord();
 const planned=repairs.map((r,index)=>{
  const sp=sectionPack(pack,r.sectionId);
  const existing=result.rawManuscriptSections.find(s=>s.sectionId===r.sectionId);
  const anchorZh=r.locales.length===1&&r.locales[0]==='en'?existing.zhHansManuscript:null;
  const input={
   systemPrompt:promptFor({sectionId:r.sectionId,locales:r.locales,anchorZh}),
   payload:{sectionAuthority:sp,existingChineseAnchor:anchorZh}
  };
  const inputTokens=estimateVfrTokens(input);
  const estimatedMaxCost=Number(estimatePaiProviderCost(model,{inputTokens,cachedInputTokens:0,outputTokens:MAX_OUTPUT_TOKENS}));
  return {...r,index:index+1,inputTokens,maxOutputTokens:MAX_OUTPUT_TOKENS,estimatedMaxCost};
 });
 const originalCost=Number(result.providerUsage?.estimatedProviderCost||0);
 const estimatedRepairMaxCost=Number(planned.reduce((a,b)=>a+b.estimatedMaxCost,0).toFixed(8));
 const estimatedTotalExperimentCost=Number((originalCost+estimatedRepairMaxCost).toFixed(8));
 return deepFreeze({
  schemaVersion:'ZWR-VFR-R1-TARGETED-REPAIR-PLAN-v1',
  repairVersion:ZWR_VFR_TARGETED_REPAIR_VERSION,
  provider:route.selectedProvider,
  model:route.selectedModel,
  originalProviderCost:originalCost,
  repairCallsPlanned:planned.length,
  semanticReviewCallsPlanned:0,
  postCallVerifierCallsPlanned:0,
  budgetLimitUsd:TOTAL_EXPERIMENT_BUDGET_USD,
  estimatedRepairMaxCost,
  estimatedTotalExperimentCost,
  allowed:estimatedTotalExperimentCost<=TOTAL_EXPERIMENT_BUDGET_USD,
  repairs:planned
 });
}
export async function runTargetedRepair({pack,result,manifest,env={},fetcher=globalThis.fetch,onRepairCompleted=null,resume=null}={}){
 const plan=buildTargetedRepairPlan({pack,result,manifest});
 if(!plan.allowed)return deepFreeze({status:'TARGETED_REPAIR_BUDGET_PRECHECK_BLOCKED',plan});
 assertVfrLiveAllowed(env);
 const {model}=modelRecord();
 const repaired=new Map(result.rawManuscriptSections.map(s=>[s.sectionId,{...s}]));
 const usageRecords=[...(resume?.usageRecords||[])];
 let spent=Number(resume?.spent||0);
 let totalInput=Number(resume?.totalInput||0);
 let totalCached=Number(resume?.totalCached||0);
 let totalOutput=Number(resume?.totalOutput||0);
 const completed=new Set(resume?.completedSectionIds||[]);
 for(const repair of plan.repairs){
  if(completed.has(repair.sectionId))continue;
  const existing=repaired.get(repair.sectionId);
  const sp=sectionPack(pack,repair.sectionId);
  const anchorZh=repair.locales.length===1&&repair.locales[0]==='en'?existing.zhHansManuscript:null;
  const started=Date.now();
  let call;
  try{
   call=await invokeOpenAIStructured({
    env:{...env,OPENAI_NARRATIVE_MODEL:plan.model},
    fetcher,
    systemPrompt:promptFor({sectionId:repair.sectionId,locales:repair.locales,anchorZh}),
    userPayload:{sectionAuthority:sp,existingChineseAnchor:anchorZh},
    schema:schemaFor(repair.locales,repair.sectionId),
    schemaName:'zwr_vfr_targeted_repair_'+repair.sectionId.toLowerCase(),
    maxOutputTokens:MAX_OUTPUT_TOKENS
   });
  }catch(error){
   const details=error?.details&&typeof error.details==='object'?error.details:{};
   error.details={...details,sectionId:repair.sectionId,locales:repair.locales,completedSectionIds:[...completed]};
   throw error;
  }
  const usage=call?.usage||{};
  const inputTokens=usage.input_tokens||usage.inputTokens||0;
  const cachedInputTokens=usage.input_tokens_details?.cached_tokens||usage.cachedInputTokens||0;
  const outputTokens=usage.output_tokens||usage.outputTokens||0;
  const cost=Number(estimatePaiProviderCost(model,{inputTokens,cachedInputTokens,outputTokens}));
  spent=Number((spent+cost).toFixed(8));
  if(Number(result.providerUsage?.estimatedProviderCost||0)+spent>TOTAL_EXPERIMENT_BUDGET_USD){
   throw Object.assign(new Error('ZWR_TARGETED_REPAIR_TOTAL_BUDGET_EXCEEDED'),{details:{spent,originalCost:result.providerUsage?.estimatedProviderCost,sectionId:repair.sectionId}});
  }
  totalInput+=inputTokens;totalCached+=cachedInputTokens;totalOutput+=outputTokens;
  const next={...existing};
  if(repair.locales.includes('zhHans'))next.zhHansManuscript=call.output.zhHansManuscript;
  if(repair.locales.includes('en'))next.enManuscript=call.output.enManuscript;
  repaired.set(repair.sectionId,next);
  completed.add(repair.sectionId);
  usageRecords.push(createPaiUsageRecord({
   requestId:'ZWR-VFR-TARGETED-REPAIR:'+pack.subjectBinding.subjectKey+':'+repair.sectionId,
   timestamp:new Date().toISOString(),
   aiExecutionClass:'T3_DEEP_COMPOSITION',
   provider:call.provider||plan.provider,
   model:call.model||plan.model,
   inputTokens,cachedInputTokens,outputTokens,
   estimatedProviderCost:cost,
   requestType:'EXPERIMENT_REPAIR',
   providerAttemptCount:1,
   latencyMs:Date.now()-started,
   success:true,
   fallbackUsed:false
  }));
  if(onRepairCompleted)await onRepairCompleted({
   completedSectionIds:[...completed],
   repairedSections:[...repaired.values()],
   usageRecords:[...usageRecords],
   spent,totalInput,totalCached,totalOutput
  });
 }
 const seed={
  schemaVersion:'ZWR-VFR-R1-TARGETED-REPAIRED-RESULT-v1',
  repairVersion:ZWR_VFR_TARGETED_REPAIR_VERSION,
  status:'PASS',
  authorityDigest:pack.authorityDigest,
  originalResultDigest:result.resultDigest,
  rawManuscriptSections:[...repaired.values()],
  providerUsage:{
   originalProviderCalls:result.providerUsage.providerCalls,
   repairProviderCalls:usageRecords.length,
   semanticReviewCalls:0,
   originalEstimatedProviderCost:Number(result.providerUsage.estimatedProviderCost||0),
   repairEstimatedProviderCost:spent,
   totalEstimatedProviderCost:Number((Number(result.providerUsage.estimatedProviderCost||0)+spent).toFixed(8)),
   repairInputTokens:totalInput,
   repairCachedInputTokens:totalCached,
   repairOutputTokens:totalOutput,
   usageRecords
  }
 };
 return deepFreeze({...seed,resultDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildTargetedRepairPlan,runTargetedRepair,ZWR_VFR_TARGETED_REPAIR_VERSION});
