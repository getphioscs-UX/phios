import {runKirR2Pipeline} from './kir-r2-intelligence.js';
const PROFILE_PATH='content/knowledge/knowledge-intelligence-r2/semantic-profiles/kir-r2-book-i-iii-semantic-retrieval-profiles-v1.json';
async function loadProfiles(env){
  if(!env?.ASSETS?.fetch) return null;
  const r=await env.ASSETS.fetch(new Request(`https://assets.local/${PROFILE_PATH}`));
  if(!r.ok) return null;
  const doc=await r.json();
  return Array.isArray(doc?.profiles)&&doc.profiles.length===350?doc.profiles:null;
}
export async function runKirR2ProductionProjection({question,locale='zh-Hans',env={},allowedContext=null,upstreamGroundedAnswer=null,provider=null}={}){
  try{
    const profiles=await loadProfiles(env);
    if(!profiles)return {status:'KIR_R2_PROFILES_UNAVAILABLE',applied:false};
    const result=await runKirR2Pipeline({question,locale,profiles,allowedContext,upstreamGroundedAnswer,provider});
    if(!result.guard.passed)return {status:'KIR_R2_GUARD_REJECTED',applied:false,result};
    return {status:'KIR_R2_APPLIED',applied:true,result};
  }catch(error){return {status:'KIR_R2_RUNTIME_ERROR',applied:false,errorCode:String(error?.message||'KIR_R2_RUNTIME_ERROR')}}
}
export const KIR_R2_PRODUCTION_PROFILE_PATH=PROFILE_PATH;
