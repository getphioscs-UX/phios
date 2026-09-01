import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from './narrative-provider.js';
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
    'Do not diagnose, guarantee future events, turn self-report into objective identity, turn reasoning tasks into IQ/percentile, or turn cross-source agreement into scientific proof.',
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
