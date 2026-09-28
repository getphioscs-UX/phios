import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {selectPaiRoute,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {createPublicationProviderAdapters} from './narrative-provider.js';
import {verifyReportSectionComposition,REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from './report-section-semantic-verifier.js';
import {REPORT_SECTION_NARRATIVE_BRIEF_VERSION} from './report-section-brief.js';
import {buildReportSectionGenerationIdentity,classifyProviderFailure,retryDecision,semanticRepairDecision} from './report-narrative-governance.js';

export const REPORT_SECTION_T2_COMPOSER_VERSION='PHI-OS-REPORT-SECTION-T2-COMPOSER-v1.1.0';
export const REPORT_SECTION_T2_PROMPT_VERSION='PHI-OS-RNT2-T2-PROMPT-v2.0.0';
const OUTPUT_SCHEMA={type:'object',additionalProperties:false,required:['blocks'],properties:{blocks:{type:'array',minItems:4,maxItems:10,items:{type:'object',additionalProperties:false,required:['role','text','claimRefs'],properties:{role:{type:'string',enum:['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']},text:{type:'string',minLength:20,maxLength:2600},claimRefs:{type:'array',minItems:1,items:{type:'string'},uniqueItems:true}}}}}};

function systemPrompt(brief,{repairReasons=[]}={}){
 const repair=repairReasons.length?[
  'A previous candidate was rejected by the semantic verifier.',
  'Repair only the verifier-rejected semantic spans. Do not broaden the claim set or increase certainty.',
  'Verifier reasons: '+repairReasons.join('; ')
 ]:[];
 return [
  'You are the PHI OS paid-report section writer.',
  'The supplied Section Narrative Brief is the complete factual and semantic authority for this section.',
  'Write a customer-readable interpretation, not a method manual and not governance prose.',
  'Explain what the licensed structure means in the customer domain, the conditions that change it, counterweights, observable comparisons, timing relevance when licensed, and useful navigation.',
  'Use enough explanation to make the section feel like a professional paid reading rather than a list of rules, but never add facts to make it longer.',
  'Do not calculate, invent facts, invent life events, diagnose, give financial recommendations, infer hidden states, guarantee events, or strengthen open/candidate claims.',
  'Do not mention claim IDs, source refs, governance, admission, verifier, candidate verdict machinery, or internal runtime terms in customer prose.',
  'Every block must cite the brief claim IDs that license its meaning. A claim reference licenses only the meaning already present in that claim.',
  'OBSERVABLE_EXPRESSION must be framed as comparisons/questions/conditions unless the brief contains an admitted observed-reality claim.',
  ...repair,
  'Return only structured JSON.'
 ].join('\n');
}

function sumUsage(records){
 const out={inputTokens:0,cachedInputTokens:0,outputTokens:0};
 for(const r of records){const u=r?.usage||{};out.inputTokens+=u.input_tokens||u.inputTokens||0;out.cachedInputTokens+=u.input_tokens_details?.cached_tokens||u.cachedInputTokens||0;out.outputTokens+=u.output_tokens||u.outputTokens||0;}
 return out;
}

export async function composeReportSectionT2({brief,registry,env={},fetcher,providerAdapters=null,requestId='RNT2-SECTION',verifier=verifyReportSectionComposition,cache=null}={}){
 if(brief?.schemaVersion!==REPORT_SECTION_NARRATIVE_BRIEF_VERSION)throw Error('RNT2_T2_BRIEF_REQUIRED');
 const route=selectPaiRoute({aiExecutionClass:'T2_LIGHT_COMPOSITION',deterministicFallbackAvailable:true},registry||{});
 if(!route.selectedProvider||!route.selectedModel)return deepFreeze({status:'FALLBACK',candidate:null,verification:null,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:'NO_ADMITTED_PROVIDER_ROUTE',route,providerCalled:false}});
 const adapter=(providerAdapters||createPublicationProviderAdapters({env,fetcher}))[route.selectedProvider];
 if(typeof adapter!=='function')return deepFreeze({status:'FALLBACK',candidate:null,verification:null,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:'PROVIDER_ADAPTER_UNAVAILABLE',route,providerCalled:false}});
 const generationIdentity=await buildReportSectionGenerationIdentity({
  methodId:brief.methodId,sectionKey:brief.sectionKey,locale:brief.locale,
  compositionVersion:REPORT_SECTION_T2_COMPOSER_VERSION,promptVersion:REPORT_SECTION_T2_PROMPT_VERSION,
  authorityVersion:brief.sourceAuthorityVersion||'UNVERSIONED_AUTHORITY',claimIrVersion:brief.claimIrVersion||'UNVERSIONED_CLAIM_IR',
  verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,evidenceDigest:brief.sourceSemanticDigest,
  schemaVersion:brief.schemaVersion,provider:route.selectedProvider,model:route.selectedModel
 });
 if(cache?.get){
  const cached=await cache.get(generationIdentity);
  if(cached?.candidate)return deepFreeze({...cached.candidate,cacheHit:true,generationIdentity,internalOnly:{...cached.candidate.internalOnly,providerCalled:false,cacheHit:true}});
 }
 const started=Date.now(),providerResults=[],attemptLog=[];
 const invoke=async({repairReasons=[]}={})=>{
  const result=await adapter({
   model:route.selectedModel,executionClass:'T2_LIGHT_COMPOSITION',taskType:'REPORT_SECTION_COMPOSITION',
   language:brief.locale,evidencePack:brief,
   compositionPolicy:{version:'RNT2-T2-v2',calculate:false,requiredRoles:brief.requiredClaimRoles,preserve:['claims','conditions','counterweights','certainty','timing','boundaries','semanticOperators'],customerReadable:true,governanceJargon:false},
   systemPrompt:systemPrompt(brief,{repairReasons}),schema:OUTPUT_SCHEMA,payload:{sectionNarrativeBrief:brief,generationIdentity,...(repairReasons.length?{repairReasons}:{})}
  });
  providerResults.push(result);return result;
 };
 let result=null,providerAttemptCount=0,lastProviderError=null;
 for(let attempt=0;attempt<2;attempt++){
  try{providerAttemptCount++;result=await invoke();attemptLog.push({kind:'PROVIDER',attempt:providerAttemptCount,state:'SUCCESS'});lastProviderError=null;break;}
  catch(error){
   lastProviderError=error;const errorClass=classifyProviderFailure(error),decision=retryDecision({attemptCount:attempt,errorClass});
   attemptLog.push({kind:'PROVIDER',attempt:providerAttemptCount,state:'FAIL',errorClass,retryAllowed:decision.retryAllowed});
   if(!decision.retryAllowed)break;
  }
 }
 if(!result){
  return deepFreeze({status:'FALLBACK',candidate:null,verification:null,generationIdentity,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:lastProviderError?.code||lastProviderError?.message||'PROVIDER_FAILURE',route,providerCalled:true,providerAttemptCount,attemptLog}});
 }
 let candidate=result?.output||result;
 let verification=await verifier({brief,candidate});
 let repairCount=0;
 const repair=semanticRepairDecision({verification,repairCount});
 if(!verification.accepted&&repair.repairAllowed){
  repairCount=1;
  try{
   providerAttemptCount++;
   const repaired=await invoke({repairReasons:verification.reasons});
   candidate=repaired?.output||repaired;
   verification=await verifier({brief,candidate});
   attemptLog.push({kind:'SEMANTIC_REPAIR',attempt:repairCount,state:verification.accepted?'SUCCESS':'FAIL',reasons:verification.reasons});
  }catch(error){
   attemptLog.push({kind:'SEMANTIC_REPAIR',attempt:repairCount,state:'PROVIDER_FAIL',errorClass:classifyProviderFailure(error)});
  }
 }
 const usage=sumUsage(providerResults);
 const usageRecord=createPaiUsageRecord({
  requestId,aiExecutionClass:'T2_LIGHT_COMPOSITION',provider:result?.provider||route.selectedProvider,model:result?.model||route.selectedModel,
  inputTokens:usage.inputTokens,cachedInputTokens:usage.cachedInputTokens,outputTokens:usage.outputTokens,
  requestType:'PRODUCTION',providerAttemptCount,firstAttemptFailureRecorded:providerAttemptCount>1,
  latencyMs:Date.now()-started,success:verification?.accepted===true,fallbackUsed:verification?.accepted!==true,
  fallbackFrom:verification?.accepted?'':route.selectedModel,fallbackTo:verification?.accepted?'':'DETERMINISTIC_FALLBACK'
 });
 if(!verification?.accepted)return deepFreeze({status:'FALLBACK',candidate,verification,usageRecord,generationIdentity,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:'SEMANTIC_VERIFIER_REJECTED',route,providerCalled:true,providerAttemptCount,repairCount,attemptLog}});
 const compositionDigest=await sha256Stable({brief:brief.briefSemanticDigest,candidate,generationIdentity:generationIdentity.generationKey});
 const finalValue=deepFreeze({status:'PASS',candidate,verification,usageRecord,compositionDigest,generationIdentity,cacheHit:false,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'T2_GOVERNED_NATURAL_COMPOSITION',fallbackReason:null,route,composerVersion:REPORT_SECTION_T2_COMPOSER_VERSION,promptVersion:REPORT_SECTION_T2_PROMPT_VERSION,providerCalled:true,providerAttemptCount,repairCount,attemptLog,cacheHit:false}});
 if(cache?.put)await cache.put(generationIdentity,finalValue);
 return finalValue;
}
export default Object.freeze({composeReportSectionT2});
