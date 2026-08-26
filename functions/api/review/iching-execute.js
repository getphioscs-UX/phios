import {inspectIChingHumanReviewAuthority} from '../../iching-product-runtime/iching-human-review-authority-v1.js';
import {executeIChingHumanReviewSession} from '../../iching-product-runtime/iching-human-review-runtime-v1.js';

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const PATHS=Object.freeze({
  campaign:'/content/production/symbolic-method/human-review/iching-human-review-campaign-v2.json',
  rubric:'/content/production/symbolic-method/human-review/iching-human-review-rubric-v2.json',
  results:'/content/production/symbolic-method/human-review/iching-human-review-results-v2.json',
  hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',
  perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',
  corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'
});

async function load(context,path){
  if(!context?.env?.ASSETS?.fetch) throw new TypeError('ICHING_HUMAN_REVIEW_ASSET_BINDING_UNAVAILABLE');
  const response=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url),{headers:{accept:'application/json'}}));
  if(!response.ok) throw new TypeError(`ICHING_HUMAN_REVIEW_ASSET_UNAVAILABLE:${path}`);
  return response.json();
}

async function loadReviewBundle(context){
  const [campaign,rubric,results]=await Promise.all([load(context,PATHS.campaign),load(context,PATHS.rubric),load(context,PATHS.results)]);
  return Object.freeze({campaign,rubric,results});
}

async function loadAuthorities(context){
  const entries=await Promise.all(['hexagramRegistry','sourceRegistry','perspectiveRegistry','corpus'].map(async key=>[key,await load(context,PATHS[key])]));
  return Object.freeze(Object.fromEntries(entries));
}

function denied(authority){
  return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_AUTHORITY_REQUIRED',message:'This fixed-input review route requires a Cloudflare Access protected reviewer and an explicitly aligned deployment SHA.'},review:{state:authority.state,runAllowed:false,publicExecutionAuthorityCreated:false,productionRunAllowed:false}},403);
}

function reviewEnvelope(authority){
  return Object.freeze({
    state:'HUMAN_REVIEW',
    runAllowed:true,
    reviewerId:authority.reviewerId,
    deploymentSha:authority.deploymentSha,
    campaignVersion:authority.campaignVersion,
    authenticationMode:authority.authenticationMode,
    fixedCampaignInputOnly:true,
    automaticPersistence:false,
    publicExecutionAuthorityCreated:false,
    productionRunAllowed:false,
    clientMayGrantAuthority:false
  });
}

export async function onRequestGet(context){
  const authority=inspectIChingHumanReviewAuthority(context);
  if(!authority.authorized) return denied(authority);
  try{
    const bundle=await loadReviewBundle(context);
    return json({ok:true,review:reviewEnvelope(authority),...bundle});
  }catch(error){
    return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_BUNDLE_UNAVAILABLE',message:String(error?.message||error)},review:reviewEnvelope(authority)},503);
  }
}

export async function onRequestPost(context){
  const authority=inspectIChingHumanReviewAuthority(context);
  if(!authority.authorized) return denied(authority);
  let input;
  try{input=await context.request.json();}catch{return json({ok:false,error:{code:'INVALID_JSON_BODY'},review:reviewEnvelope(authority)},400);}
  try{
    const [{campaign},authorities]=await Promise.all([loadReviewBundle(context),loadAuthorities(context)]);
    const session=campaign.sessions.find(item=>item.sessionId===String(input?.sessionId||''));
    if(!session) return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_SESSION_UNKNOWN'},review:reviewEnvelope(authority)},404);
    const executed=await executeIChingHumanReviewSession(session,authorities);
    return json({
      ok:true,
      review:reviewEnvelope(authority),
      session,
      machineEvidence:executed.snapshot,
      publicView:executed.result.publicView,
      execution:{fixedCampaignInput:true,requestBodyMayOverrideQuestion:false,requestBodyMayOverrideLines:false,automaticPersistence:false,productionRunAllowed:false}
    });
  }catch(error){
    return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_EXECUTION_REJECTED',message:String(error?.message||error)},review:reviewEnvelope(authority)},400);
  }
}

export const ICHING_HUMAN_REVIEW_AUTHORITY_PATHS=PATHS;

