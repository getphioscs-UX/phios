import {symbolicPersonalizationStatus} from '../interpretation-runtime/symbolic-personalized-narrative-r2.js';
import {executeIChingProductRuntime} from '../iching-product-runtime/iching-product-runtime-v2.js';
import {resolveIChingFullProductionAuthority} from '../iching-full-production/iching-full-production-v1.js';
import {verifyIChingGovernedCast} from '../iching-casting/iching-casting-adapter-v1.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
export const ICHING_FULL_AUTHORITY_PATHS=Object.freeze({hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json',depthCorpus:'/content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json'});
function json(body,status=200,setCookie=null){const h=new Headers(headers);if(setCookie)h.append('set-cookie',setCookie);return new Response(JSON.stringify(body),{status,headers:h});}
async function load(context,path){if(!context?.env?.ASSETS?.fetch)throw new TypeError('ICHING_AUTHORITY_ASSET_BINDING_UNAVAILABLE');const r=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url),{headers:{accept:'application/json'}}));if(!r.ok)throw new TypeError(`ICHING_AUTHORITY_ASSET_UNAVAILABLE:${path}`);return r.json();}
async function authorities(context){return Object.freeze(Object.fromEntries(await Promise.all(Object.entries(ICHING_FULL_AUTHORITY_PATHS).map(async([k,p])=>[k,await load(context,p)]))));}
function assertReflectiveBoundary(result={}){
  const a=result?.readingIr?.authority||{};
  if(a.readingMayPredict!==false||a.readingMayDiagnose!==false||a.readingMayInferThirdPartyHiddenState!==false||a.readingMayCreateProfessionalDirective!==false||a.decisionOwner!=='USER'||a.sourceGapMayBeFilledByModel!==false)throw new TypeError('ICHING_FULL_PRODUCTION_REFLECTIVE_BOUNDARY_REQUIRED');
  if(result?.execution?.humanApprovedDepthOnly!==true||result?.execution?.candidateFallbackUsed!==false||result?.execution?.runtimeModelDepthGenerationUsed!==false)throw new TypeError('ICHING_FULL_PRODUCTION_HUMAN_APPROVED_DEPTH_ONLY_REQUIRED');
}
export async function onRequestPost(context){
  let request;try{request=await context.request.json();}catch{return json({ok:false,error:{code:'INVALID_JSON_BODY'}},400);}if(String(request?.method||'').toUpperCase()!=='I_CHING')return json({ok:false,error:{code:'UNSUPPORTED_SYMBOLIC_METHOD'}},400);
  const production=await resolveIChingFullProductionAuthority(context);if(!production.authorized)return json({ok:false,error:{code:'ICHING_FULL_PRODUCTION_NOT_PROMOTED'},production},423);
  // Reuse the existing governed evidence verifier; an unkeyed replay digest
  // checks consistency, not server identity or permission to execute.
  if(request.inputMode==='SYSTEM_RANDOM'&&(!(await verifyIChingGovernedCast(request.governedCast,request.question))||request.sessionId!==request.governedCast.castId||request.timestamp!==request.governedCast.createdAt||JSON.stringify(request.randomSelectionEvidence)!==JSON.stringify(request.governedCast.randomSelectionEvidence)))return json({ok:false,error:{code:'ICHING_PRODUCT_EXECUTION_REJECTED',message:'Cast evidence is inconsistent.'}},400);
  // Reading creates no guest identity/cookie. Explicit save retains its existing
  // signed-session, Secret, identity and retention-consent gates.
  const guest=null;
  try{const loadedAuthorities=await authorities(context);const result=await executeIChingProductRuntime({...request,method:'I_CHING'},loadedAuthorities);assertReflectiveBoundary(result);
  const localReview=context.env.PHIOS_SYMBOLIC_CONTENT_REVIEW==='true'&&['localhost','127.0.0.1','[::1]'].includes(new URL(context.request.url).hostname);
  const languageViews={};for(const locale of ['en','zh-Hans']){const translated=locale===(request.locale||'en')?result:await executeIChingProductRuntime({...request,method:'I_CHING',locale},loadedAuthorities);languageViews[locale]={...translated.publicView,localQuestionConnectionReview:localReview};}
  const personalization=await symbolicPersonalizationStatus(context,request,result);return json({...result,personalization,publicView:languageViews[request.locale||'en'],languageViews,production:{...result.production,state:'FULL_PRODUCTION',runAllowed:true,fullProduction:true,globalPublicExecution:true,guestPersistenceAllowed:context.env?.PHIOS_D1_MAINTENANCE_MODE!=='READ_ONLY'&&production.guestPersistenceAllowed===true,applicationGuestPersistenceAllowed:production.guestPersistenceAllowed===true,productionCapabilityPromoted:true,approvedCommitSha:production.approvedCommitSha,releaseId:production.releaseId},boundaries:{fortuneTellingAuthority:false,predictionAuthority:false,diagnosticAuthority:false,hiddenStateAuthority:false,professionalDirectiveAuthority:false,decisionAuthority:'USER'}},200,guest?.setCookie||null);}
  catch(error){const sourceUnavailable=/AUTHORITY_ASSET|Failed to fetch|Unexpected (?:token|end)/.test(String(error?.message));return json({ok:false,error:{code:sourceUnavailable?'SYMBOLIC_CONTENT_UNAVAILABLE':'ICHING_PRODUCT_EXECUTION_REJECTED',message:sourceUnavailable?'The reading content is unavailable. Your question and cast can be kept.':String(error?.message||'Execution rejected.')},production:{state:'FULL_PRODUCTION',applicationRunAllowed:true,runAllowed:!sourceUnavailable}},sourceUnavailable?503:400);}
}
export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
