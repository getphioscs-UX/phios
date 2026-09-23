import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {selectPaiRoute} from '../../_lib/pai-r1-economics.js';
import {createPublicationProviderAdapters} from './narrative-provider.js';
import {COMPOSITION_VERSION,VERIFIER_VERSION,EDITORIAL_VERSION,COMPOSITION_SCHEMA,VERIFICATION_SCHEMA,COMPOSITION_PROMPT,VERIFIER_PROMPT,validateEditorial,validateSemanticVerdict} from './bazi-editorial-contract.js';

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
    const candidate=await call('REPORT_SECTION_COMPOSITION',{repair},COMPOSITION_SCHEMA,COMPOSITION_PROMPT);
    const editorial=validateEditorial(candidate,pack);
    // A verifier sees the complete evidence and every candidate block. Reference
    // membership alone is never reported as semantic acceptance.
    const verdict=await call('REPORT_SECTION_SEMANTIC_VERIFICATION',{candidate},VERIFICATION_SCHEMA,VERIFIER_PROMPT);
    if(editorial.status==='PASS'&&validateSemanticVerdict(verdict,candidate,pack)){
     const seed={sectionKey:pack.sectionKey,locale:pack.locale,canonicalEvidenceHash:pack.canonicalEvidenceHash,temporalSnapshot:pack.temporalContext,compositionVersion:COMPOSITION_VERSION,verifierVersion:VERIFIER_VERSION,editorialVersion:EDITORIAL_VERSION,finalNarrative:candidate,verification:verdict};
     return {status:'PASS',snapshot:deepFreeze({...seed,snapshotDigest:await sha256Stable(seed)}),internalOnly:{route,attempts:attempt+1,usage,latencyMs:Date.now()-started,semanticStatus:'PASS',editorialStatus:'PASS'}};
    }
    if(verdict?.status==='REJECT')return fallback('SEMANTIC_REJECTED');
    repair={candidate,editorialIssues:editorial.issues,semanticIssues:verdict};
   }
   return fallback('REPAIR_EXHAUSTED');
  })(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('T3_TIMEOUT'));},timeoutMs);})]);
 }catch(error){return fallback(error?.message==='T3_TIMEOUT'?'PROVIDER_TIMEOUT':'PROVIDER_OR_VERIFIER_FAILED');}
 finally{clearTimeout(timer);controller.abort();}
}

export function canShowT3({stage='SHADOW',environment,staff=false,acceptance}={}){
 if(stage==='QA')return ['preview','qa'].includes(environment);
 if(stage==='CANARY')return staff===true&&acceptance?.canaryAccepted===true;
 if(stage==='PRODUCTION')return acceptance?.productionAccepted===true;
 return false;
}
