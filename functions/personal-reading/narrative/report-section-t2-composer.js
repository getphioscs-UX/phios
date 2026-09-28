import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {selectPaiRoute,createPaiUsageRecord} from '../../_lib/pai-r1-economics.js';
import {createPublicationProviderAdapters} from './narrative-provider.js';
import {verifyReportSectionComposition} from './report-section-semantic-verifier.js';
import {REPORT_SECTION_NARRATIVE_BRIEF_VERSION} from './report-section-brief.js';
export const REPORT_SECTION_T2_COMPOSER_VERSION='PHI-OS-REPORT-SECTION-T2-COMPOSER-v1.0.0';
const OUTPUT_SCHEMA={type:'object',additionalProperties:false,required:['blocks'],properties:{blocks:{type:'array',minItems:4,maxItems:10,items:{type:'object',additionalProperties:false,required:['role','text','claimRefs'],properties:{role:{type:'string',enum:['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']},text:{type:'string',minLength:20,maxLength:2600},claimRefs:{type:'array',minItems:1,items:{type:'string'},uniqueItems:true}}}}}};
function systemPrompt(brief){
 return [
  'You are the PHI OS paid-report section writer.',
  'The supplied Section Narrative Brief is the complete factual and semantic authority for this section.',
  'Write a customer-readable interpretation, not a method manual and not governance prose.',
  'Explain what the licensed structure means in the customer domain, the conditions that change it, counterweights, observable comparisons, timing relevance when licensed, and useful navigation.',
  'Do not calculate, invent facts, invent life events, diagnose, give financial recommendations, infer hidden states, guarantee events, or strengthen open/candidate claims.',
  'Do not mention claim IDs, source refs, governance, admission, verifier, candidate verdict machinery, or internal runtime terms in customer prose.',
  'Every block must cite the brief claim IDs that license its meaning. A claim reference licenses only the meaning already present in that claim.',
  'OBSERVABLE_EXPRESSION must be framed as comparisons/questions/conditions unless the brief contains an admitted observed-reality claim.',
  'Return only structured JSON.'
 ].join('\n');
}
export async function composeReportSectionT2({brief,registry,env={},fetcher,providerAdapters=null,requestId='RNT2-SECTION',verifier=verifyReportSectionComposition}={}){
 if(brief?.schemaVersion!==REPORT_SECTION_NARRATIVE_BRIEF_VERSION)throw Error('RNT2_T2_BRIEF_REQUIRED');
 const route=selectPaiRoute({aiExecutionClass:'T2_LIGHT_COMPOSITION',deterministicFallbackAvailable:true},registry||{});
 if(!route.selectedProvider||!route.selectedModel)return deepFreeze({status:'FALLBACK',candidate:null,verification:null,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:'NO_ADMITTED_PROVIDER_ROUTE',route}});
 const adapter=(providerAdapters||createPublicationProviderAdapters({env,fetcher}))[route.selectedProvider];
 if(typeof adapter!=='function')return deepFreeze({status:'FALLBACK',candidate:null,verification:null,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:'PROVIDER_ADAPTER_UNAVAILABLE',route}});
 const started=Date.now();
 try{
  const result=await adapter({model:route.selectedModel,executionClass:'T2_LIGHT_COMPOSITION',taskType:'REPORT_SECTION_COMPOSITION',language:brief.locale,evidencePack:brief,compositionPolicy:{version:'RNT2-T2-v1',calculate:false,requiredRoles:brief.requiredClaimRoles,preserve:['claims','conditions','counterweights','certainty','timing','boundaries'],customerReadable:true,governanceJargon:false},systemPrompt:systemPrompt(brief),schema:OUTPUT_SCHEMA,payload:{sectionNarrativeBrief:brief}});
  const candidate=result?.output||result;
  const verification=await verifier({brief,candidate});
  const usage=result?.usage||null;
  const usageRecord=createPaiUsageRecord({requestId,aiExecutionClass:'T2_LIGHT_COMPOSITION',provider:result?.provider||route.selectedProvider,model:result?.model||route.selectedModel,inputTokens:usage?.input_tokens||usage?.inputTokens||0,cachedInputTokens:usage?.input_tokens_details?.cached_tokens||usage?.cachedInputTokens||0,outputTokens:usage?.output_tokens||usage?.outputTokens||0,requestType:'PRODUCTION',providerAttemptCount:1,latencyMs:Date.now()-started,success:verification.accepted===true,fallbackUsed:verification.accepted!==true,fallbackFrom:verification.accepted?'':route.selectedModel,fallbackTo:verification.accepted?'':'DETERMINISTIC_FALLBACK'});
  if(!verification.accepted)return deepFreeze({status:'FALLBACK',candidate,verification,usageRecord,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:'SEMANTIC_VERIFIER_REJECTED',route}});
  const compositionDigest=await sha256Stable({brief:brief.briefSemanticDigest,candidate});
  return deepFreeze({status:'PASS',candidate,verification,usageRecord,compositionDigest,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'T2_GOVERNED_NATURAL_COMPOSITION',fallbackReason:null,route,composerVersion:REPORT_SECTION_T2_COMPOSER_VERSION,providerCalled:true}});
 }catch(error){
  return deepFreeze({status:'FALLBACK',candidate:null,verification:null,internalOnly:{requestedTier:'T2_GOVERNED_NATURAL_COMPOSITION',actualTier:'DETERMINISTIC_FALLBACK',fallbackReason:error?.code||error?.message||'PROVIDER_FAILURE',route,providerCalled:true}});
 }
}
export default Object.freeze({composeReportSectionT2});
