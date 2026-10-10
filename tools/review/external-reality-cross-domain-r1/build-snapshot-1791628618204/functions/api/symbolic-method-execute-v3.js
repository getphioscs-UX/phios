/**
 * ICHI-DEPTH-W11 current I Ching execution candidate.
 * Adds the 448/448 admitted human-approved depth corpus to v2 source authority.
 * Still fail-closed behind the existing trusted activation authority.
 */
import {executeIChingProductRuntime} from '../iching-product-runtime/iching-product-runtime-v2.js';
import {inspectIChingExecutionAuthority} from '../iching-product-runtime/iching-execution-authority-v1.js';

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const AUTHORITY_PATHS=Object.freeze({
  hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',
  perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',
  corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json',
  depthCorpus:'/content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json'
});
async function body(request){try{return await request.json();}catch{throw new TypeError('INVALID_JSON_BODY');}}
async function loadAuthority(context,path){
  if(!context?.env?.ASSETS?.fetch) throw new TypeError('ICHING_AUTHORITY_ASSET_BINDING_UNAVAILABLE');
  const response=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url),{headers:{accept:'application/json'}}));
  if(!response.ok) throw new TypeError(`ICHING_AUTHORITY_ASSET_UNAVAILABLE:${path}`);
  return response.json();
}
async function loadAuthorities(context){const entries=await Promise.all(Object.entries(AUTHORITY_PATHS).map(async([key,path])=>[key,await loadAuthority(context,path)]));return Object.freeze(Object.fromEntries(entries));}
function closed(state='EXTERNAL_ACTIVATION_GATES_PENDING'){
  return json({ok:false,error:{code:'SYMBOLIC_LIMITED_PRODUCTION_NOT_ACTIVATED',message:'448/448 human-approved depth is ready, but public execution remains closed until verified identity/D1, live browser, live production SHA and rights gates are complete.'},production:{state,runAllowed:false,humanDepthEditorialReady:true}},423);
}
export async function onRequestPost(context){
  let request;try{request=await body(context.request);}catch(error){return json({ok:false,error:{code:error.message}},400);}
  if(String(request?.method||'').toUpperCase()!=='I_CHING') return closed();
  const activation=inspectIChingExecutionAuthority(context);
  if(!activation.authorized) return closed(activation.state);
  try{
    const authorities=await loadAuthorities(context);
    const result=await executeIChingProductRuntime({...request,method:'I_CHING'},authorities);
    return json({...result,production:{...result.production,state:activation.state,runAllowed:true,limitedProductionActivated:true}},200);
  }catch(error){return json({ok:false,error:{code:'ICHING_PRODUCT_EXECUTION_REJECTED',message:String(error?.message||'Execution rejected.')},production:{state:activation.state,runAllowed:true}},400);}
}
export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
export {AUTHORITY_PATHS as ICHING_CURRENT_AUTHORITY_PATHS};
