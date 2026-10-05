import {VFR_BILINGUAL_SINGLE_CALL_V1} from '../../canonical-presentation-runtime/vfr-trilayer-bilingual-contract.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from '../narrative/narrative-provider.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../narrative/ziwei-r5-provider-registry.js';
import {selectPaiRoute,estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {planVfrProviderBudget,assertVfrLiveAllowed,assertVfrCallCount} from './report-provider-budget.js';
import {buildZwrVfrProviderSchema,createZwrVfrReportIr} from './ziwei-vfr-report-ir.js';

export const ZWR_VFR_ONE_CALL_COMPOSER_VERSION='ZWR-VFR-R1-ONE-CALL-BILINGUAL-SOL-v2';
const MAX_OUTPUT_TOKENS=VFR_BILINGUAL_SINGLE_CALL_V1.maxOutputTokens;

function systemPrompt(){
 return [
  'You write one complete bilingual visual-first Zi Wei Dou Shu customer report interpretation in a single response.',
  'The supplied Compact Authoring Pack is the complete authority. Do not calculate the chart and do not invent technical facts.',
  'Use professional Zi Wei terminology, then translate it into concise lived meaning. Avoid generic psychology and avoid star-by-star glossary prose.',
  'Return both zhHans and en for every section in this one call. Do not split generation by locale or by section.',
  'Each section must contain exactly 3 short key insights, exactly 2 compact interpretation paragraphs, and two very short diagram captions in each language.'
  'Diagrams, diagram data, technical captions, visual labels, page placement and palace connections are deterministic PHI OS responsibilities. Do not generate, describe, or redesign diagrams.'
  'Preserve unknowns. Do not predict guaranteed events, diagnose illness, give transaction-level financial advice, or expose internal workflow language.',
  'Use authorityRefs only from the supplied section claims. References license the interpretation but must not be shown in customer prose.',
  'The finished physical report is limited to 50 pages and is diagram-led. Stay well below every schema maxLength; prioritize dense professional meaning over prose volume. Do not write long essays.'
  'Return JSON only.'
 ].join('\n');
}
function modelRecord(){
 const route=selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION',deterministicFallbackAvailable:false},ZIWEI_R5_PAI_REGISTRY);
 const model=ZIWEI_R5_PAI_REGISTRY.models.find(m=>m.modelId===route.selectedModel);
 if(!route.selectedProvider||!route.selectedModel||!model)throw Error('ZWR_VFR_PROVIDER_ROUTE_REQUIRED');
 return {route,model};
}
export async function planZwrVfrOneCall({pack}={}){
 if(pack?.schemaVersion!=='ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1')throw Error('ZWR_VFR_COMPACT_PACK_REQUIRED');
 const {route,model}=modelRecord();
 const payload={compactAuthoringPack:pack};
 const planningInput={systemPrompt:systemPrompt(),payload};
 const budget=planVfrProviderBudget({model,input:planningInput,maxOutputTokens:MAX_OUTPUT_TOKENS,nextCallKind:'PRIMARY'});
 return deepFreeze({
  schemaVersion:'ZWR-VFR-R1-ONE-CALL-PLAN-v1',
  provider:route.selectedProvider,
  model:route.selectedModel,
  providerCallsPlanned:1,
  semanticReviewCallsPlanned:0,
  maxOutputTokens:MAX_OUTPUT_TOKENS,
  budget
 });
}
export async function composeZwrVfrOneCall({pack,env={},fetcher=globalThis.fetch,cache=null}={}){
 const plan=await planZwrVfrOneCall({pack});
 if(!plan.budget.allowed)return deepFreeze({status:'PROVIDER_BUDGET_PRECHECK_BLOCKED',plan,providerCalls:0,semanticReviewCalls:0});
 assertVfrLiveAllowed(env);
 const cacheKey='ZWR-VFR-R1:'+await sha256Stable({authorityDigest:pack.authorityDigest,realityContext:pack.realityContext,composerVersion:ZWR_VFR_ONE_CALL_COMPOSER_VERSION});
 if(cache?.get){
  const cached=await cache.get(cacheKey);
  if(cached?.reportIr)return deepFreeze({...cached,status:'PASS',cacheHit:true,providerCalls:0,semanticReviewCalls:0});
 }
 const schema=buildZwrVfrProviderSchema(pack);
 const started=Date.now();
 const result=await invokeOpenAIStructured({
  env:{...env,OPENAI_NARRATIVE_MODEL:plan.model},
  fetcher,
  systemPrompt:systemPrompt(),
  userPayload:{compactAuthoringPack:pack},
  schema,
  schemaName:'zwr_vfr_bilingual_visual_report_ir',
  maxOutputTokens:MAX_OUTPUT_TOKENS
 });
 const usage=result?.usage||{};
 const inputTokens=usage.input_tokens||usage.inputTokens||0;
 const cachedInputTokens=usage.input_tokens_details?.cached_tokens||usage.cachedInputTokens||0;
 const outputTokens=usage.output_tokens||usage.outputTokens||0;
 const {model}=modelRecord();
 const estimatedProviderCost=estimatePaiProviderCost(model,{inputTokens,cachedInputTokens,outputTokens});
 const usageRecord=createPaiUsageRecord({
  requestId:'ZWR-VFR-R1:'+pack.subjectBinding.subjectKey,
  timestamp:new Date().toISOString(),
  aiExecutionClass:'T3_DEEP_COMPOSITION',
  provider:result.provider||plan.provider,
  model:result.model||plan.model,
  inputTokens,cachedInputTokens,outputTokens,
  estimatedProviderCost,
  requestType:'PRODUCTION',
  providerAttemptCount:1,
  latencyMs:Date.now()-started,
  success:true,
  fallbackUsed:false
 });
 assertVfrCallCount({providerCalls:1,semanticReviewCalls:0});
 if(estimatedProviderCost>1)throw Error('ZWR_VFR_PROVIDER_BUDGET_EXCEEDED_AFTER_CALL');
 const reportIr=await createZwrVfrReportIr({pack,providerOutput:result.output,usage:{
  providerCalls:1,
  semanticReviewCalls:0,
  inputTokens,cachedInputTokens,outputTokens,
  estimatedProviderCost,
  budgetLimit:1,
  budgetRemaining:Number((1-estimatedProviderCost).toFixed(8)),
  cacheHit:false,
  usageRecord
 }});
 const out=deepFreeze({
  status:'PASS',
  schemaVersion:ZWR_VFR_ONE_CALL_COMPOSER_VERSION,
  reportIr,
  providerCalls:1,
  semanticReviewCalls:0,
  cacheHit:false,
  plan
 });
 if(cache?.put)await cache.put(cacheKey,out);
 return out;
}
export default Object.freeze({planZwrVfrOneCall,composeZwrVfrOneCall,ZWR_VFR_ONE_CALL_COMPOSER_VERSION});
