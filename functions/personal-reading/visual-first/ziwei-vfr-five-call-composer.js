import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from '../narrative/narrative-provider.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../narrative/ziwei-r5-provider-registry.js';
import {selectPaiRoute,estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {assertVfrLiveAllowed,estimateVfrTokens} from './report-provider-budget.js';
import {
 ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,
 ZWR_VFR_FIVE_CALL_BATCHES,
 buildZwrFiveCallBatchSchema,
 validateZwrFiveCallBatch,
 projectFiveCallManuscriptToReportSections
} from './ziwei-vfr-five-call-manuscript.js';

export const ZWR_VFR_FIVE_CALL_COMPOSER_VERSION='ZWR-VFR-R1-FIVE-CALL-DEEP-SOL-v1';
const EXPERIMENT_BUDGET_USD=1.00;
const MAX_OUTPUT_TOKENS_PER_CALL=6000;

function modelRecord(){
 const route=selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION',deterministicFallbackAvailable:false},ZIWEI_R5_PAI_REGISTRY);
 const model=ZIWEI_R5_PAI_REGISTRY.models.find(m=>m.modelId===route.selectedModel);
 if(!route.selectedProvider||!route.selectedModel||!model)throw Error('ZWR_FIVE_CALL_PROVIDER_ROUTE_REQUIRED');
 return {route,model};
}
function batchPrompt(batchIds){
 return [
  'You are writing a premium bilingual Zi Wei Dou Shu semantic manuscript for exactly two supplied report sections.',
  'The supplied compact batch is the complete authority. Do not calculate new chart facts and do not invent missing evidence.',
  'Write publication-quality semantic content, not summary bullets. The purpose of this experiment is depth comparable to a strong human-reviewed long-form chapter.',
  'For each section, synthesize the palace network, star combination, transformations and timing only when admitted by that section evidence.',
  'structuralMechanism: explain why the admitted Zi Wei configuration produces this operating structure, with causal links rather than glossary definitions.',
  'livedScenarios: give three distinct, concrete and recognizable life situations specific to the section domain.',
  'constructiveExpression: explain how the structure operates when conditions are supportive.',
  'pressureDistortion: explain how the same structure distorts under strain and what becomes overused, rigid, avoidant or unstable.',
  'counterweight: explain which chart factors or real conditions moderate the structure; do not give generic reassurance.',
  'timingOverlay: distinguish natal baseline from Da Xian and Liu Nian emphasis where timing is admitted; if timing is not central, state the bounded role of timing without fabricating events.',
  'realityNavigation: use section-specific observational guidance, not generic checklists, review-date formulas, responsibility lists, or repeated boundary advice.',
  'Chinese and English must be semantically equivalent but naturally written in each language. Do not mechanically translate sentence-by-sentence.',
  'Do not generate layout, diagrams, captions, colors, page counts or presentation structure. PHI OS owns all deterministic presentation.',
  'Do not expose internal workflow terms. Preserve uncertainty. Do not guarantee events, diagnose illness, or give transaction-level financial advice.',
  'Target sections: '+batchIds.join(', ')+'. Return JSON only.'
 ].join('\n');
}
function batchPack(pack,ids){
 const selected=new Set(ids);
 return deepFreeze({
  schemaVersion:'ZWR-VFR-R1-FIVE-CALL-BATCH-PACK-v1',
  methodId:pack.methodId,
  localeMode:'BILINGUAL',
  subjectBinding:pack.subjectBinding,
  sourceAuthorityVersion:pack.sourceAuthorityVersion,
  reportRules:pack.reportRules,
  sections:pack.sections.filter(s=>selected.has(s.sectionId)),
  realityContext:pack.realityContext,
  authorityDigest:pack.authorityDigest
 });
}
export function planZwrFiveCallExperiment({pack}={}){
 if(pack?.schemaVersion!=='ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1')throw Error('ZWR_FIVE_CALL_COMPACT_PACK_REQUIRED');
 const {route,model}=modelRecord();
 const batches=ZWR_VFR_FIVE_CALL_BATCHES.map((ids,index)=>{
  const bp=batchPack(pack,ids);
  const input={systemPrompt:batchPrompt(ids),payload:{compactBatch:bp}};
  const inputTokens=estimateVfrTokens(input);
  const maxCost=Number(estimatePaiProviderCost(model,{inputTokens,cachedInputTokens:0,outputTokens:MAX_OUTPUT_TOKENS_PER_CALL}));
  return deepFreeze({index:index+1,sectionIds:[...ids],inputTokens,maxOutputTokens:MAX_OUTPUT_TOKENS_PER_CALL,estimatedMaxCost:maxCost});
 });
 const estimatedMaxTotalCost=Number(batches.reduce((a,b)=>a+b.estimatedMaxCost,0).toFixed(8));
 return deepFreeze({
  schemaVersion:'ZWR-VFR-R1-FIVE-CALL-PLAN-v1',
  experimentVersion:ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,
  provider:route.selectedProvider,
  model:route.selectedModel,
  providerCallsPlanned:5,
  semanticReviewCallsPlanned:0,
  budgetLimitUsd:EXPERIMENT_BUDGET_USD,
  estimatedMaxTotalCost,
  allowed:estimatedMaxTotalCost<=EXPERIMENT_BUDGET_USD,
  batches
 });
}
export async function composeZwrFiveCallExperiment({pack,env={},fetcher=globalThis.fetch}={}){
 const plan=planZwrFiveCallExperiment({pack});
 if(!plan.allowed)return deepFreeze({status:'EXPERIMENT_BUDGET_PRECHECK_BLOCKED',plan,providerCalls:0,semanticReviewCalls:0});
 assertVfrLiveAllowed(env);
 const {model}=modelRecord();
 const manuscriptSections=[],usageRecords=[];
 let spent=0,providerCalls=0,totalInput=0,totalCached=0,totalOutput=0;
 for(let i=0;i<ZWR_VFR_FIVE_CALL_BATCHES.length;i++){
  const ids=ZWR_VFR_FIVE_CALL_BATCHES[i],bp=batchPack(pack,ids);
  const remaining=EXPERIMENT_BUDGET_USD-spent;
  if(remaining<=0)throw Object.assign(new Error('ZWR_FIVE_CALL_BUDGET_EXHAUSTED'),{details:{spent,providerCalls}});
  const started=Date.now();
  const result=await invokeOpenAIStructured({
   env:{...env,OPENAI_NARRATIVE_MODEL:plan.model},
   fetcher,
   systemPrompt:batchPrompt(ids),
   userPayload:{compactBatch:bp},
   schema:buildZwrFiveCallBatchSchema(bp),
   schemaName:'zwr_vfr_five_call_batch_'+String(i+1),
   maxOutputTokens:MAX_OUTPUT_TOKENS_PER_CALL
  });
  providerCalls++;
  const guard=await validateZwrFiveCallBatch({batchPack:bp,output:result.output});
  if(!guard.accepted)throw Object.assign(new Error('ZWR_FIVE_CALL_BATCH_GUARD_REJECTED'),{details:{batch:i+1,guard}});
  const usage=result?.usage||{};
  const inputTokens=usage.input_tokens||usage.inputTokens||0;
  const cachedInputTokens=usage.input_tokens_details?.cached_tokens||usage.cachedInputTokens||0;
  const outputTokens=usage.output_tokens||usage.outputTokens||0;
  const cost=Number(estimatePaiProviderCost(model,{inputTokens,cachedInputTokens,outputTokens}));
  spent=Number((spent+cost).toFixed(8));
  if(spent>EXPERIMENT_BUDGET_USD)throw Object.assign(new Error('ZWR_FIVE_CALL_EXPERIMENT_BUDGET_EXCEEDED'),{details:{spent,batch:i+1}});
  totalInput+=inputTokens;totalCached+=cachedInputTokens;totalOutput+=outputTokens;
  manuscriptSections.push(...result.output.sections);
  usageRecords.push(createPaiUsageRecord({
   requestId:'ZWR-VFR-FIVE-CALL:'+pack.subjectBinding.subjectKey+':B'+(i+1),
   timestamp:new Date().toISOString(),
   aiExecutionClass:'T3_DEEP_COMPOSITION',
   provider:result.provider||plan.provider,
   model:result.model||plan.model,
   inputTokens,cachedInputTokens,outputTokens,
   estimatedProviderCost:cost,
   requestType:'EXPERIMENT',
   providerAttemptCount:1,
   latencyMs:Date.now()-started,
   success:true,
   fallbackUsed:false
  }));
 }
 const sections=projectFiveCallManuscriptToReportSections({pack,manuscriptSections});
 const seed={
  schemaVersion:'ZWR-VFR-R1-FIVE-CALL-EXPERIMENT-RESULT-v1',
  composerVersion:ZWR_VFR_FIVE_CALL_COMPOSER_VERSION,
  manuscriptVersion:ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,
  status:'PASS',
  subjectBinding:pack.subjectBinding,
  authorityDigest:pack.authorityDigest,
  sections,
  rawManuscriptSections:manuscriptSections,
  providerUsage:{
   providerCalls,
   semanticReviewCalls:0,
   inputTokens:totalInput,
   cachedInputTokens:totalCached,
   outputTokens:totalOutput,
   estimatedProviderCost:spent,
   budgetLimit:EXPERIMENT_BUDGET_USD,
   usageRecords
  }
 };
 return deepFreeze({...seed,resultDigest:await sha256Stable(seed)});
}
export default Object.freeze({planZwrFiveCallExperiment,composeZwrFiveCallExperiment,ZWR_VFR_FIVE_CALL_COMPOSER_VERSION});
