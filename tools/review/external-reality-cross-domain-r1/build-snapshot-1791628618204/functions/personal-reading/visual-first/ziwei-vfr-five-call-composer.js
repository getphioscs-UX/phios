import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from '../narrative/narrative-provider.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../narrative/ziwei-r5-provider-registry.js';
import {selectPaiRoute,estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {assertVfrLiveAllowed,estimateVfrTokens} from './report-provider-budget.js';
import {
 ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,
 ZWR_VFR_FIVE_CALL_BATCHES,
 buildZwrFiveCallBatchSchema,
 projectFiveCallManuscriptToReportSections
} from './ziwei-vfr-five-call-manuscript.js';

export const ZWR_VFR_FIVE_CALL_COMPOSER_VERSION='ZWR-VFR-R1-FIVE-CALL-DEEP-SOL-v1';
const EXPERIMENT_BUDGET_USD=1.00;
const MAX_OUTPUT_TOKENS_PER_CALL=8000;

function modelRecord(){
 const route=selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION',deterministicFallbackAvailable:false},ZIWEI_R5_PAI_REGISTRY);
 const model=ZIWEI_R5_PAI_REGISTRY.models.find(m=>m.modelId===route.selectedModel);
 if(!route.selectedProvider||!route.selectedModel||!model)throw Error('ZWR_FIVE_CALL_PROVIDER_ROUTE_REQUIRED');
 return {route,model};
}
function batchPrompt(batchIds){
 return [
  'You are writing a premium bilingual Zi Wei Dou Shu customer manuscript for exactly two supplied report sections.',
  'The supplied compact batch is the complete authority. Do not calculate new chart facts and do not invent missing evidence.',
  'For each section, write one coherent Chinese long-form chapter and one coherent English long-form chapter. Target roughly 900-1200 Chinese characters and 1400-2200 English characters per section; finish cleanly and do not fill the maximum merely because space remains. Do not decompose the response into semantic subfields, bullet points, checklists, or mini-summaries.',
  'The prose should read like a professional human-written Zi Wei Dou Shu interpretation: begin from the admitted palace and star structure, explain how the configuration works together, then move naturally into recognizable lived situations, constructive expression, pressure distortion, counterweights, timing emphasis where admitted, and a grounded closing observation.',
  'Use Zi Wei terminology densely enough that the chapter could not be mistaken for generic personality writing, but always translate technical structure into lived meaning.',
  'Include concrete situations from the section domain rather than generic advice. Show how the same structure may look different under supportive conditions and under strain.',
  'For timing, clearly distinguish natal baseline from Da Xian and Liu Nian emphasis when the Authority Pack admits timing. Never fabricate guaranteed events.',
  'Chinese and English must carry the same substantive meaning but should each read naturally in their own language; do not mechanically translate sentence by sentence.',
  'Do not generate layout, diagrams, captions, colors, page counts, headings, cards or presentation structure. PHI OS owns all deterministic presentation.',
  'Do not expose internal workflow terms. Preserve uncertainty. Do not diagnose illness or give transaction-level financial advice.',
  'Target sections: '+batchIds.join(', ')+'. Return JSON only in the required schema.'
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
export async function zwrVfrPromptIdentity(){return sha256Stable({composerVersion:ZWR_VFR_FIVE_CALL_COMPOSER_VERSION,manuscriptVersion:ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,prompts:ZWR_VFR_FIVE_CALL_BATCHES.map(batchPrompt),responseSchema:'sections:rawManuscriptSections'});}
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
export async function composeZwrFiveCallExperiment({pack,env={},fetcher=globalThis.fetch,resume=null,onBatchCompleted=null}={}){
 const plan=planZwrFiveCallExperiment({pack});
 if(!plan.allowed)return deepFreeze({status:'EXPERIMENT_BUDGET_PRECHECK_BLOCKED',plan,providerCalls:0,semanticReviewCalls:0});
 assertVfrLiveAllowed(env);
 const {model}=modelRecord();
 const manuscriptSections=[...(resume?.manuscriptSections||[])],usageRecords=[...(resume?.usageRecords||[])];
 let spent=Number(resume?.spent||0),providerCalls=usageRecords.length,totalInput=Number(resume?.totalInput||0),totalCached=Number(resume?.totalCached||0),totalOutput=Number(resume?.totalOutput||0);
 const completed=new Set(manuscriptSections.map(s=>s.sectionId));
 for(let i=0;i<ZWR_VFR_FIVE_CALL_BATCHES.length;i++){
  const ids=ZWR_VFR_FIVE_CALL_BATCHES[i],bp=batchPack(pack,ids);
  if(ids.every(id=>completed.has(id)))continue;
  const remaining=EXPERIMENT_BUDGET_USD-spent;
  if(remaining<=0)throw Object.assign(new Error('ZWR_FIVE_CALL_BUDGET_EXHAUSTED'),{details:{spent,providerCalls}});
  const started=Date.now();
  let result;
  try{
   result=await invokeOpenAIStructured({
    env:{...env,OPENAI_NARRATIVE_MODEL:plan.model},
    fetcher,
    systemPrompt:batchPrompt(ids),
    userPayload:{compactBatch:bp},
    schema:buildZwrFiveCallBatchSchema(bp),
    schemaName:'zwr_vfr_five_call_batch_'+String(i+1),
    maxOutputTokens:MAX_OUTPUT_TOKENS_PER_CALL
   });
  }catch(error){
   const details=error?.details&&typeof error.details==='object'?error.details:{};
   error.details={...details,batch:i+1,sectionIds:[...ids],completedSectionIds:[...completed]};
   throw error;
  }
  providerCalls++;
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
  for(const s of result.output.sections)completed.add(s.sectionId);
  if(onBatchCompleted)await onBatchCompleted({
   batch:i+1,
   sectionIds:[...ids],
   manuscriptSections:[...manuscriptSections],
   usageRecords:[...usageRecords],
   spent,totalInput,totalCached,totalOutput
  });
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
