import {VFR_BILINGUAL_SINGLE_CALL_V1} from '../../canonical-presentation-runtime/vfr-trilayer-bilingual-contract.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from '../narrative/narrative-provider.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../narrative/ziwei-r5-provider-registry.js';
import {selectPaiRoute,estimatePaiProviderCost,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {planVfrProviderBudget,assertVfrLiveAllowed,assertVfrCallCount} from './report-provider-budget.js';
import {buildZwrVfrProviderSchema,createZwrVfrReportIr} from './ziwei-vfr-report-ir.js';

export const ZWR_VFR_ONE_CALL_COMPOSER_VERSION='ZWR-VFR-R1-ONE-CALL-BILINGUAL-SOL-v3';
const MAX_OUTPUT_TOKENS=VFR_BILINGUAL_SINGLE_CALL_V1.maxOutputTokens;

function systemPrompt(){
 return [
  'You generate bilingual Zi Wei Dou Shu semantic content only. PHI OS owns all presentation structure and diagrams.',
  'The supplied Compact Authoring Pack is the complete authority. Do not calculate the chart and do not invent technical facts.',
  'For each supplied section return exactly four semantic fields in zhHans and en: coreMeaning, livedExpression, counterweight, navigation.',
  'Use professional Zi Wei terminology and concrete lived meaning. Avoid generic psychology, star-by-star glossary prose, and workflow language.',
  'Do not decide headlines, subheadlines, insight counts, paragraph counts, captions, diagram content, diagram labels, page structure or layout. PHI OS projects those deterministically.',
  'Preserve unknowns. Do not predict guaranteed events, diagnose illness, or give transaction-level financial advice.',
  'Use authorityRefs only from the supplied section claims.',
  'Keep every semantic field compact and information-dense. Return JSON only.'
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
