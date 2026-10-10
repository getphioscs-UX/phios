import {executeIChingProductRuntime} from '../iching-product-runtime/iching-product-runtime-v1.js';
import {inspectIChingExecutionAuthority} from '../iching-product-runtime/iching-execution-authority-v1.js';
import {resolveTarotExecutionAuthority} from '../tarot-product-runtime/tarot-production-authority.js';
import {executeTarotProductRuntime} from '../tarot-product-runtime/tarot-product-runtime.js';

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'};
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers});
const ICHING_AUTHORITY_PATHS=Object.freeze({
  hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v1.json',
  perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v1.json',
  corpus:'/content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json'
});
export const TAROT_PRODUCTION_AUTHORITY_PATHS=Object.freeze({
  deckContract:'/content/professional/core-method-runtime/tarot-deck-contract-v1.json',
  cardRegistry:'/content/professional/core-method-runtime/tarot-card-registry-v1.json',
  spreadRegistry:'/content/professional/core-method-runtime/tarot-spread-registry-v2.json',
  positionSemanticsRegistry:'/content/interpretation/tarot/registries/tarot-position-semantics-registry-v1.json',
  spreadCompositionContract:'/content/interpretation/tarot/contracts/tarot-spread-composition-contract-v1.json',
  orientationPolicy:'/content/professional/core-method-runtime/tarot-orientation-policy-v1.json',
  visualCorpus:'/content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
  visualLocator:'/content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',
  sourceRegistry:'/content/interpretation/tarot/registries/tarot-source-registry-v2.json',
  perspectiveRegistry:'/content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json',
  waiteCorpus:'/content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',
  editorialCorpus:'/content/interpretation/tarot/corpus/tarot-waite-editorial-paraphrase-corpus-v1.json',
  cardReflectiveCorpus:'/content/interpretation/tarot/corpus/tarot-card-reflective-corpus-v1.json',
  productCompositionCorpus:'/content/interpretation/tarot/corpus/tarot-product-interpretation-composition-corpus-v1.json',
  noSourceBlendingContract:'/content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json',
  corpusFreeze:'/content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json',
  productInterpretationFreeze:'/content/interpretation/tarot/freeze/tarot-product-interpretation-freeze-v1.json'
});
async function body(request){try{return await request.json();}catch{throw new TypeError('INVALID_JSON_BODY');}}
async function loadAuthority(context,path,code){
  if(!context?.env?.ASSETS?.fetch)throw new TypeError(`${code}_AUTHORITY_ASSET_BINDING_UNAVAILABLE`);
  const response=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url),{headers:{accept:'application/json'}}));
  if(!response.ok)throw new TypeError(`${code}_AUTHORITY_ASSET_UNAVAILABLE:${path}`);
  return response.json();
}
async function loadAuthorities(context,paths,code){const entries=await Promise.all(Object.entries(paths).map(async([key,path])=>[key,await loadAuthority(context,path,code)]));return Object.freeze(Object.fromEntries(entries));}
function closed(state='PRODUCTION_AUTHORITY_PENDING'){
  return json({ok:false,error:{code:'SYMBOLIC_PRODUCTION_AUTHORITY_NOT_ACTIVE',message:'Public execution is unavailable because the trusted server-side production authority is not active.'},production:{state,runAllowed:false}},423);
}
async function executeIChing(context,request){
  const activation=inspectIChingExecutionAuthority(context);if(!activation.authorized)return closed(activation.state);
  try{const authorities=await loadAuthorities(context,ICHING_AUTHORITY_PATHS,'ICHING');const result=await executeIChingProductRuntime({...request,method:'I_CHING'},authorities);return json({...result,production:{...result.production,state:activation.state,runAllowed:true,limitedProductionActivated:true}},200);}
  catch(error){return json({ok:false,error:{code:'ICHING_PRODUCT_EXECUTION_REJECTED',message:String(error?.message||'Execution rejected.')},production:{state:activation.state,runAllowed:true}},400);}
}
async function executeTarot(context,request){
  const activation=await resolveTarotExecutionAuthority(context);if(!activation.authorized)return closed(activation.state);
  try{const authorities=await loadAuthorities(context,TAROT_PRODUCTION_AUTHORITY_PATHS,'TAROT');const result=await executeTarotProductRuntime({...request,method:'TAROT'},authorities);return json({...result,production:{...result.production,state:activation.state,runAllowed:true,fullProduction:true,limitedProductionActivated:false,releaseId:activation.releaseId,authorityDigest:activation.authorityDigest}},200);}
  catch(error){return json({ok:false,error:{code:'TAROT_PRODUCT_EXECUTION_REJECTED',message:String(error?.message||'Execution rejected.')},production:{state:activation.state,runAllowed:true}},400);}
}
export async function onRequestPost(context){
  let request;try{request=await body(context.request);}catch(error){return json({ok:false,error:{code:error.message}},400);}
  const method=String(request?.method||'').toUpperCase();
  if(method==='I_CHING')return executeIChing(context,request);
  if(method==='TAROT')return executeTarot(context,request);
  return json({ok:false,error:{code:'UNSUPPORTED_SYMBOLIC_METHOD'}},400);
}
export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
