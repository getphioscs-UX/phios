import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {selectPaiRoute} from '../../_lib/pai-r1-economics.js';
import {createPublicationProviderAdapters} from './narrative-provider.js';
import {COMPOSITION_VERSION,VERIFIER_VERSION,EDITORIAL_VERSION,COMPOSITION_SCHEMA,VERIFICATION_SCHEMA,COMPOSITION_PROMPT,VERIFIER_PROMPT,validateEditorial,validateSemanticVerdict,narrativeBlocks} from './bazi-editorial-contract.js';
import {evaluateBaziT3Release} from './bazi-t3-release-gate.js';

// This is the section lane of the existing writer/provider/router, not a new
// method or provider authority. Callers must be trusted server/build owners.
export async function composeBaziT3Section({pack,registry={},env={},fetcher,providerAdapters,timeoutMs=45000,snapshot=null}={}){
 const fallback=reason=>({status:'FALLBACK',snapshot:null,internalOnly:{fallbackState:'T3_FALLBACK_USED',fallbackReason:reason,canonicalEvidenceHash:pack.canonicalEvidenceHash}});
 if(snapshot){
  const {snapshotDigest,...seed}=snapshot;
  if(snapshot.sectionKey!==pack.sectionKey||snapshot.locale!==pack.locale||snapshot.canonicalEvidenceHash!==pack.canonicalEvidenceHash||snapshot.compositionVersion!==COMPOSITION_VERSION||snapshot.verifierVersion!==VERIFIER_VERSION||snapshot.editorialVersion!==EDITORIAL_VERSION||snapshotDigest!==await sha256Stable(seed)||validateEditorial(snapshot.finalNarrative,pack).status!=='PASS'||!validateSemanticVerdict(snapshot.verification,snapshot.finalNarrative,pack))return fallback('FROZEN_SNAPSHOT_INVALID');
  return {status:'PASS',snapshot:deepFreeze(snapshot),internalOnly:{cacheHit:true}};
 }
 if(!pack.admittedInterpretations.length)return fallback('INSUFFICIENT_ADMITTED_INTERPRETATION');
 const route=selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION',deterministicFallbackAvailable:true},registry);
 const invoke=(providerAdapters||createPublicationProviderAdapters({env,fetcher}))[route.selectedProvider];
 if(!invoke||!route.selectedModel)return fallback('NO_ADMITTED_PROVIDER_ROUTE');
 if(!providerAdapters&&!env.OPENAI_API_KEY)return fallback('PROVIDER_CREDENTIAL_NOT_CONFIGURED');
 const controller=new AbortController();let timer;
 const started=Date.now(),usage=[];
 const call=async(taskType,payload,schema,systemPrompt)=>{
  const result=await invoke({taskType,executionClass:'T3_DEEP_COMPOSITION',model:route.selectedModel,language:pack.locale,evidencePack:pack,compositionPolicy:'BAZI_EDITORIAL_V1',payload,schema,systemPrompt,signal:controller.signal});
  if(result?.usage)usage.push(result.usage);
  return result?.output??result;
 };
 try{
  return await Promise.race([(async()=>{
   let repair=null;
   for(let attempt=0;attempt<2;attempt++){
    const readingRules='Only admittedInterpretations license personal interpretation. Numeric method facts do not establish behavioral causes. Glossary entries define terms but do not establish their occurrence or personal effect; cite their term IDs only for definitions. Counter-signal and reflection questions are questions, not observed answers. Boundary-only policy supports boundaries, never personal claims. A hypothetical everyday illustration must be explicitly conditional and express an already admitted relationship, without a new causal mechanism or assertion that it happened. Never name a functional emphasis as an established pattern verdict. Preserve relative emphasis without exposing weights, percentages, counts, or banned technical prose. Do not demand raw weights in repair instructions.';
    const editorialIntent={opener:['QUESTION_LED','CONCEPT_LED','CONTEXT_LED'][(Number(pack.sectionKey.slice(1,3))-2)%3],mainNarrativeBudget:pack.locale==='en'?'130–230 words across lead, interpretation, manifestations, counters and closing combined':'180–320 Chinese characters across lead, interpretation, manifestations, counters and closing combined',supportAndTensionBudget:pack.locale==='en'?'12–35 words per item':'18–50 Chinese characters per item'};
    const candidate=await call('REPORT_SECTION_COMPOSITION',{repair,editorialIntent},COMPOSITION_SCHEMA,COMPOSITION_PROMPT+'\n'+readingRules+' Observe editorialIntent as layout limits, not evidence. Prefer exactly two supportingConditions, one tensionCondition and one counterSignal (Guidance requires two tensions). Keep the main narrative within the combined budget; do not invent filler to reach it.');
    const editorial=validateEditorial(candidate,pack);
    // A verifier sees the complete evidence and every candidate block. Reference
    // membership alone is never reported as semantic acceptance.
    const claims=narrativeBlocks(candidate).filter(b=>b.text?.trim());
    const schema=structuredClone(VERIFICATION_SCHEMA);
    schema.properties.assessments.items.properties.path.enum=claims.map(b=>b.path);
    const verdict=await call('REPORT_SECTION_SEMANTIC_VERIFICATION',{candidate,claimsToVerify:claims},schema,VERIFIER_PROMPT+'\n'+readingRules+' Assess only claimsToVerify, using each supplied path exactly once (for example headline or interpretation.0). Do not add candidate prefixes, .text suffixes, or an assessment of the factRefs index.');
    if(editorial.status==='PASS'&&validateSemanticVerdict(verdict,candidate,pack)){
     const seed={sectionKey:pack.sectionKey,locale:pack.locale,canonicalEvidenceHash:pack.canonicalEvidenceHash,temporalSnapshot:pack.temporalContext,compositionVersion:COMPOSITION_VERSION,verifierVersion:VERIFIER_VERSION,editorialVersion:EDITORIAL_VERSION,finalNarrative:candidate,verification:verdict};
     return {status:'PASS',snapshot:deepFreeze({...seed,snapshotDigest:await sha256Stable(seed)}),internalOnly:{route,attempts:attempt+1,usage,latencyMs:Date.now()-started,semanticStatus:'PASS',editorialStatus:'PASS'}};
    }
    if(verdict?.status==='REJECT')return {...fallback('SEMANTIC_REJECTED'),internalOnly:{...fallback('SEMANTIC_REJECTED').internalOnly,route,usage,latencyMs:Date.now()-started,attempts:attempt+1,verification:verdict,editorial,candidate}};
    repair={candidate,editorialIssues:editorial.issues,semanticIssues:verdict};
   }
   return {...fallback('REPAIR_EXHAUSTED'),internalOnly:{...fallback('REPAIR_EXHAUSTED').internalOnly,route,usage,latencyMs:Date.now()-started,attempts:2,lastRepair:repair}};
  })(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('T3_TIMEOUT'));},timeoutMs);})]);
 }catch(error){return {...fallback(error?.message==='T3_TIMEOUT'?'PROVIDER_TIMEOUT':'PROVIDER_OR_VERIFIER_FAILED'),providerFailure:{code:/^[A-Z0-9_]+$/.test(error?.code||'')?error.code:'PROVIDER_FAILED',httpStatus:Number.isInteger(error?.details?.status)?error.details.status:null}};}
 finally{clearTimeout(timer);controller.abort();}
}

export function canShowT3({stage='SHADOW',environment,staff=false,acceptance}={}){
 if(stage==='QA')return ['preview','qa'].includes(environment);
 if(stage==='CANARY')return staff===true&&evaluateBaziT3Release(acceptance).accepted;
 if(stage==='PRODUCTION')return acceptance?.canary?.status==='PASS'&&evaluateBaziT3Release(acceptance).accepted;
 return false;
}
