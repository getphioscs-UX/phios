import {runKirR2Pipeline} from './kir-r2-intelligence.js';
import {kirR2ModelGatewayEnabled} from './kir-r2-model-gateway.js';
import {kirR2W16R2BProductionCutoverEnabled,getKirR2W16R2BProductionAdmission} from './kir-r2-production-admission.js';
import {runKirR2W16R2Successor} from './kir-r2-w16r2-successor.js';
const PROFILE_PATH='content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book4-a6/kir-r2-book-i-iv-semantic-retrieval-profiles-v2.json';
const ARTICLE_BINDING_PATH='content/knowledge/knowledge-intelligence-r2/registries/successors/book4-publication-v1/kir-r2-book-i-iv-published-article-binding-registry-v3.json';
async function readAsset(env,path){if(!env?.ASSETS?.fetch)return null;const r=await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));return r.ok?r.json():null}
function enrichProfiles(profiles,bindings=[]){
 const byNode=new Map();for(const b of bindings){if(!byNode.has(b.nodeCode))byNode.set(b.nodeCode,[]);byNode.get(b.nodeCode).push(b)}
 return profiles.map(p=>{const rows=byNode.get(p.nodeCode)||[];if(!rows.length)return p;return {...p,articleSources:rows.map(r=>({articleCode:r.articleCode,slug:r.slug,href:r.href,title:r.title,locale:r.locale,authorityDigest:r.authorityDigest})),aliases:[...(p.aliases||[]),...rows.flatMap(r=>[r.title,r.slug])],userLanguage:[...(p.userLanguage||[]),...rows.map(r=>r.title)]}})
}
async function loadProfiles(env){
  const [doc,binding]=await Promise.all([readAsset(env,PROFILE_PATH),readAsset(env,ARTICLE_BINDING_PATH)]);
  if(!Array.isArray(doc?.profiles)||doc.profiles.length<348)return null;
  if(Number.isInteger(doc.profileCount)&&doc.profileCount!==doc.profiles.length)return null;
  return enrichProfiles(doc.profiles,binding?.records||[]);
}
export async function runKirR2ProductionProjection({question,locale='zh-Hans',env={},allowedContext=null,upstreamGroundedAnswer=null,upstreamGroundingBundle=null,provider=null}={}){
  try{
    const profiles=await loadProfiles(env);
    if(!profiles)return {status:'KIR_R2_PROFILES_UNAVAILABLE',applied:false};
    if(!provider&&kirR2W16R2BProductionCutoverEnabled(env)){
      const successor=await runKirR2W16R2Successor({question,locale,profiles,allowedContext,upstreamGroundedAnswer,groundingBundle:upstreamGroundingBundle,env});
      if(successor.applied)return {status:successor.status,applied:true,result:successor.result,w16r2:{successorGuard:successor.successorGuard,escalated:successor.escalated,attempts:successor.attempts}};
      if(successor.result)return {status:successor.status,applied:false,result:successor.result,w16r2:{successorGuard:successor.successorGuard,escalated:successor.escalated,attempts:successor.attempts}};
      return {status:successor.status,applied:false,errorCode:successor.errorCode||null};
    }
    const admission=getKirR2W16R2BProductionAdmission(env);
    const result=await runKirR2Pipeline({question,locale,profiles,allowedContext,upstreamGroundedAnswer,groundingBundle:upstreamGroundingBundle,provider});
    if(!result.guard.passed)return {status:'KIR_R2_GUARD_REJECTED',applied:false,result};
    return {status:kirR2ModelGatewayEnabled(env)&&!admission.allowed?'KIR_R2_W16R2B_PRODUCTION_BLOCKED_FALLBACK':'KIR_R2_APPLIED',applied:true,result,w16r2b:{admission}};
  }catch(error){return {status:'KIR_R2_RUNTIME_ERROR',applied:false,errorCode:String(error?.message||'KIR_R2_RUNTIME_ERROR')}}
}
export const KIR_R2_PRODUCTION_PROFILE_PATH=PROFILE_PATH;
export const KIR_R2_PRODUCTION_ARTICLE_BINDING_PATH=ARTICLE_BINDING_PATH;
