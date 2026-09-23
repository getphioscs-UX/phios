import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured,createPublicationProviderAdapters} from './narrative-provider.js';
import {selectPaiRoute} from '../../_lib/pai-r1-economics.js';
export const NARRATIVE_DRAFT_SCHEMA='PHI-OS-NARRATIVE-DRAFT-v1.0.0';
export const NARRATIVE_WRITER_VERSION='PHI-OS-NARRATIVE-WRITER-v1.0.0';
export const NARRATIVE_PROMPT_VERSION='PHI-OS-NARRATIVE-PROMPT-v1.0.0';
const GENERIC='PHI-OS-NARRATIVE-BRIEF-v1.0.0',REL='PHI-OS-RELATIONSHIP-NARRATIVE-BRIEF-v1.0.0';
const FORBIDDEN_KEYS=new Set(['rawPlanets','rawPillars','rawPalaces','rawNumbers','rawEcr','rawHumanDesign','rawAssessmentAnswers','methodRegistries','semanticCorpora','apiKey','providerSecret']);
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
function arr(v){return Array.isArray(v)?v:[];} function clean(v){return typeof v==='string'?v.trim():'';}
function briefType(brief){if(brief?.schemaVersion===GENERIC)return 'PERSONAL';if(brief?.schemaVersion===REL&&brief?.briefType==='RELATIONSHIP')return 'RELATIONSHIP';fail('W54N1_NARRATIVE_BRIEF_REQUIRED');}
function assertBrief(brief){
  briefType(brief);
  if(!/^[a-f0-9]{64}$/.test(String(brief.briefSemanticDigest||'')))fail('W54N1_BRIEF_DIGEST_REQUIRED');
  if(!arr(brief.factsAiMustNotAlter).length||!arr(brief.prohibitedClaimClasses).length)fail('W54N1_BRIEF_FACTUAL_LOCKS_REQUIRED');
  for(const k of Object.keys(brief||{}))if(FORBIDDEN_KEYS.has(k))fail('W54N1_RAW_INPUT_FORBIDDEN',{key:k});
  return brief;
}
function prompt(brief){
  const rel=briefType(brief)==='RELATIONSHIP';
  return [
    'You are the PHI OS paid narrative writer. The Narrative Brief is the complete factual authority for this generation.',
    'Write compelling customer-readable prose, but never recalculate chart/profile/reality facts and never invent missing facts.',
    'factsAiMustNotAlter and sourceClassLocks are immutable. unsupported areas remain unsupported. Preserve uncertainty, counter-evidence, and non-convergence.',
    'Do not diagnose, provide medical/mental-health conclusions, financial recommendations or legal conclusions, guarantee future events, turn self-report into objective identity, turn reasoning tasks into IQ/percentile, or turn cross-source agreement into scientific proof.',
    'When the Brief carries a precision boundary, wording certainty must not exceed the weakest dependency. You may improve readability, never certainty.',
    rel?'For relationship narratives: keep A and B distinct; never infer hidden feelings, private intentions, soulmate/destiny, compatibility percentages, stay/leave directives, or guaranteed relationship outcomes. Prefer this architecture when supported, omitting unsupported chapters rather than adding filler: opening interaction structure; what each person brings; natural connection points; where they operate differently; possible misreads; communication/decisions/shared reality; resources/home/work/family when relevant; current phase; what Current Reality supports or contradicts; what to observe next.':'For personal narratives: do not create objective personality facts beyond the governed brief.',
    'Return only the requested structured JSON. Every factual or synthesis claim must include supportRefs from the Brief. Style-only text has no factual authority.'
  ].join('\n');
}
export const WRITER_OUTPUT_SCHEMA=Object.freeze({
  type:'object',additionalProperties:false,required:['opening','chapters','phiOsLensBlocks','closing','openQuestions','claims'],properties:{
    opening:{$ref:'#/$defs/block'},
    chapters:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,required:['chapterId','title','blocks'],properties:{chapterId:{type:'string'},title:{type:'string'},blocks:{type:'array',minItems:1,maxItems:12,items:{$ref:'#/$defs/block'}}}}},
    phiOsLensBlocks:{type:'array',maxItems:6,items:{$ref:'#/$defs/block'}},closing:{$ref:'#/$defs/block'},
    openQuestions:{type:'array',maxItems:12,items:{type:'string'}},
    claims:{type:'array',maxItems:96,items:{type:'object',additionalProperties:false,required:['claimId','sentenceRef','claimClass','text','supportRefs','sourceClasses'],properties:{claimId:{type:'string'},sentenceRef:{type:'string'},claimClass:{type:'string'},text:{type:'string'},supportRefs:{type:'array',items:{type:'string'},uniqueItems:true},sourceClasses:{type:'array',items:{type:'string'},uniqueItems:true}}}}
  },$defs:{block:{type:'object',additionalProperties:false,required:['blockId','text','claimRefs'],properties:{blockId:{type:'string'},text:{type:'string'},claimRefs:{type:'array',items:{type:'string'},uniqueItems:true}}}}
});
function validateOutput(o){
  if(!o||typeof o!=='object'||Array.isArray(o))fail('W54N1_WRITER_OUTPUT_OBJECT_REQUIRED');
  if(!o.opening||!arr(o.chapters).length||!o.closing||!Array.isArray(o.claims))fail('W54N1_WRITER_OUTPUT_INCOMPLETE');
  const ids=new Set();
  for(const c of o.claims){if(!clean(c?.claimId)||ids.has(c.claimId))fail('W54N1_DUPLICATE_OR_MISSING_CLAIM_ID');ids.add(c.claimId);if(!clean(c.sentenceRef)||!clean(c.text)||!clean(c.claimClass))fail('W54N1_CLAIM_INCOMPLETE');}
  return o;
}
export async function writeNarrative({brief,env={},fetcher,provider,providerMetadata={}}={}){
  assertBrief(brief);
  const invoke=provider||((args)=>invokeOpenAIStructured({...args,env,fetcher}));
  const providerResult=await invoke({systemPrompt:prompt(brief),userPayload:{narrativeBrief:brief},schema:WRITER_OUTPUT_SCHEMA,schemaName:'phi_os_narrative_draft',maxOutputTokens:5200});
  const output=validateOutput(providerResult?.output??providerResult);
  const seed={schemaVersion:NARRATIVE_DRAFT_SCHEMA,narrativeType:briefType(brief),sourceBriefId:brief.briefId,sourceBriefDigest:brief.briefSemanticDigest,locale:brief.relationshipIntent?.locale||brief.locale||'en',promptVersion:NARRATIVE_PROMPT_VERSION,opening:output.opening,chapters:output.chapters,phiOsLensBlocks:arr(output.phiOsLensBlocks),closing:output.closing,openQuestions:arr(output.openQuestions),claims:arr(output.claims),writer:{provider:clean(providerResult?.provider)||clean(providerMetadata.provider)||'injected-test-provider',model:clean(providerResult?.model)||clean(providerMetadata.model)||'test-model',writerVersion:NARRATIVE_WRITER_VERSION,usage:providerResult?.usage??null}};
  const draftDigest=await sha256Stable(seed);
  return deepFreeze({...seed,draftDigest});
}
export default Object.freeze({writeNarrative});

// Versioned Addendum D lane; legacy T2 contracts remain frozen.
export {composeBaziT3Section} from './bazi-t3-composition.js';

export function humanizePublicationStatement(text){
 // A bounded editorial glossary, not inference or an LLM paraphrase license.
 return String(text).replaceAll('interfaces','relationships between pillar positions').replaceAll('interface','relationship between pillar positions').replaceAll('接口','柱位关系').replaceAll('whole-chart priority themes','themes considered across the chart').replaceAll('not an isolated mini-reading','best read together with the rest of the chart');
}

// The publication lane stays in this writer, behind the existing PAI router.
// No live text is admitted solely because its provider returned valid JSON.
export async function composePublicationNarrative({interpretation,locale,executionClass,registry={},providerAdapters=null,env={},fetcher,verifyComposition,timeoutMs=8000,sectionComposition=null}={}){
 if(!['T2_LIGHT_COMPOSITION','T3_DEEP_COMPOSITION'].includes(executionClass))throw Error('PUBLICATION_COMPOSITION_CLASS_INVALID');
 if(interpretation?.schemaVersion!=='PHI-OS-PUBLICATION-INTERPRETATION-v2'||!['en','zh-Hans'].includes(locale))throw Error('PUBLICATION_WRITER_INPUT_INVALID');
 const route=selectPaiRoute({aiExecutionClass:executionClass,deterministicFallbackAvailable:true},registry);
 const fallback=()=>({paragraphs:interpretation.allowedInterpretations.map(s=>humanizePublicationStatement(s.text)),internalOnly:{executionClass:'T2_LIGHT_COMPOSITION',requestedExecutionClass:executionClass,evidenceAdmission:'SOURCE_BOUND_CANONICAL_STATEMENTS',route,compositionVersion:'2.0.0',fallbackReason:!route.selectedModel?'NO_ADMITTED_PROVIDER_ROUTE':typeof verifyComposition!=='function'?'SEMANTIC_VERIFIER_NOT_ADMITTED':'PROVIDER_OR_VERIFICATION_FAILED',fallbackState:executionClass==='T3_DEEP_COMPOSITION'?'DEEP_COMPOSITION_FALLBACK':'CANONICAL_HUMANIZATION',sourceDigest:interpretation.semanticDigest}});
 const invoke=(providerAdapters||createPublicationProviderAdapters({env,fetcher}))[route.selectedProvider];
 // A semantic verifier must preserve facts, uncertainty, counter-signals and
 // bilingual scope. Existing extractive verification does not license paraphrase.
 if(!invoke||typeof verifyComposition!=='function')return fallback();
 const controller=new AbortController();let timer;
 try{
  const result=await Promise.race([invoke({model:route.selectedModel,executionClass,taskType:sectionComposition?'PUBLICATION_SECTION':'PUBLICATION_NARRATIVE',language:locale,evidencePack:interpretation,sectionComposition,compositionPolicy:{version:'2.1.0',calculate:false,scope:sectionComposition?'SECTION':'PAGE',required:['WHAT_WE_SEE','WHY_IT_MATTERS','WHEN_IT_MAY_DIFFER','WHAT_TO_OBSERVE'],preserve:['facts','conditions','counterSignals','boundaries'],maxParagraphs:3},signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('PUBLICATION_COMPOSITION_TIMEOUT'));},timeoutMs);})]);
  if(!Array.isArray(result?.paragraphs)||!result.paragraphs.length||result.paragraphs.length>3||result.paragraphs.some(p=>typeof p!=='string'||!p.trim()||p.length>1000))return fallback();
  const verified=await verifyComposition({interpretation,locale,result});
  if(verified?.accepted!==true||verified.sourceDigest!==interpretation.semanticDigest||verified.factsPreserved!==true||verified.boundariesPreserved!==true||verified.counterSignalsPreserved!==true)return fallback();
  return {paragraphs:result.paragraphs,internalOnly:{executionClass,evidenceAdmission:'SEMANTIC_VERIFIER_ACCEPTED',route,compositionVersion:'2.0.0',fallbackState:null,sourceDigest:interpretation.semanticDigest,verification:verified}};
 }catch{return fallback();}finally{clearTimeout(timer);}
}
