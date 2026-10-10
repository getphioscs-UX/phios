import {executeIChingProductRuntime} from '../iching-product-runtime/iching-product-runtime-v2.js';
import {resolveIChingFullProductionAuthority,ensureIChingGuestSession} from '../iching-full-production/iching-full-production-v1.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const PATHS=Object.freeze({hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json',depthCorpus:'/content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json'});
function json(body,status=200,setCookie=null){const h=new Headers(headers);if(setCookie)h.append('set-cookie',setCookie);return new Response(JSON.stringify(body),{status,headers:h});}
async function load(context,path){if(!context?.env?.ASSETS?.fetch)throw new TypeError('ICHING_AUTHORITY_ASSET_BINDING_UNAVAILABLE');const r=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url),{headers:{accept:'application/json'}}));if(!r.ok)throw new TypeError(`ICHING_AUTHORITY_ASSET_UNAVAILABLE:${path}`);return r.json();}
async function authorities(context){return Object.freeze(Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async([k,p])=>[k,await load(context,p)]))));}
function assertReflectiveBoundary(result={}){
  const a=result?.readingIr?.authority||{};
  if(a.readingMayPredict!==false||a.readingMayDiagnose!==false||a.readingMayInferThirdPartyHiddenState!==false||a.readingMayCreateProfessionalDirective!==false||a.decisionOwner!=='USER'||a.sourceGapMayBeFilledByModel!==false)throw new TypeError('ICHING_FULL_PRODUCTION_REFLECTIVE_BOUNDARY_REQUIRED');
  if(result?.execution?.humanApprovedDepthOnly!==true||result?.execution?.candidateFallbackUsed!==false||result?.execution?.runtimeModelDepthGenerationUsed!==false)throw new TypeError('ICHING_FULL_PRODUCTION_HUMAN_APPROVED_DEPTH_ONLY_REQUIRED');
}
export async function onRequestPost(context){
  let request;try{request=await context.request.json();}catch{return json({ok:false,error:{code:'INVALID_JSON_BODY'}},400);}if(String(request?.method||'').toUpperCase()!=='I_CHING')return json({ok:false,error:{code:'UNSUPPORTED_SYMBOLIC_METHOD'}},400);
  const production=await resolveIChingFullProductionAuthority(context);if(!production.authorized)return json({ok:false,error:{code:'ICHING_FULL_PRODUCTION_NOT_PROMOTED'},production},423);
  let guest=null;try{guest=await ensureIChingGuestSession(context);}catch{}
  try{const result=await executeIChingProductRuntime({...request,method:'I_CHING'},await authorities(context));assertReflectiveBoundary(result);return json({...result,production:{...result.production,state:'FULL_PRODUCTION',runAllowed:true,fullProduction:true,globalPublicExecution:true,guestPersistenceAllowed:true,productionCapabilityPromoted:true,approvedCommitSha:production.approvedCommitSha,releaseId:production.releaseId},boundaries:{fortuneTellingAuthority:false,predictionAuthority:false,diagnosticAuthority:false,hiddenStateAuthority:false,professionalDirectiveAuthority:false,decisionAuthority:'USER'}},200,guest?.setCookie||null);}
  catch(error){return json({ok:false,error:{code:'ICHING_PRODUCT_EXECUTION_REJECTED',message:String(error?.message||'Execution rejected.')},production:{state:'FULL_PRODUCTION',runAllowed:true}},400,guest?.setCookie||null);}
}
export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
