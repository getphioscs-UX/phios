import {inspectIChingHumanReviewAuthority} from '../../iching-product-runtime/iching-human-review-authority-v1.js';
import {executeIChingHumanReviewSession} from '../../iching-product-runtime/iching-human-review-runtime-v1.js';

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const PATHS=Object.freeze({
  campaign:'/content/production/symbolic-method/human-review/iching-human-review-campaign-v2.json',
  rubric:'/content/production/symbolic-method/human-review/iching-human-review-rubric-v2.json',
  results:'/content/production/symbolic-method/human-review/iching-human-review-results-v2.json',
  depthCampaign:'/content/production/symbolic-method/human-review/iching-depth-human-review-campaign-v1.json',
  depthRubric:'/content/production/symbolic-method/human-review/iching-depth-human-review-rubric-v1.json',
  depthResults:'/content/production/symbolic-method/human-review/iching-depth-human-review-results-v1.json',
  depthHexagramCandidates:'/content/interpretation/iching/corpus/iching-depth-hexagram-editorial-candidates-v1.json',
  depthLineCandidates:'/content/interpretation/iching/corpus/iching-depth-line-editorial-candidates-v1.json',
  hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',
  perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',
  corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'
});

const reviewMode=request=>new URL(request.url).searchParams.get('mode')==='depth'?'DEPTH':'RUNTIME';

async function load(context,path){
  if(!context?.env?.ASSETS?.fetch) throw new TypeError('ICHING_HUMAN_REVIEW_ASSET_BINDING_UNAVAILABLE');
  const response=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url),{headers:{accept:'application/json'}}));
  if(!response.ok) throw new TypeError(`ICHING_HUMAN_REVIEW_ASSET_UNAVAILABLE:${path}`);
  return response.json();
}

async function loadReviewBundle(context,mode='RUNTIME'){
  const keys=mode==='DEPTH'?['depthCampaign','depthRubric','depthResults']:['campaign','rubric','results'];
  const [campaign,rubric,results]=await Promise.all(keys.map(key=>load(context,PATHS[key])));
  return Object.freeze({campaign,rubric,results});
}

async function loadAuthorities(context){
  const entries=await Promise.all(['hexagramRegistry','sourceRegistry','perspectiveRegistry','corpus'].map(async key=>[key,await load(context,PATHS[key])]));
  return Object.freeze(Object.fromEntries(entries));
}

function denied(authority){
  return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_AUTHORITY_REQUIRED',message:'This fixed-input review route requires a Cloudflare Access protected reviewer and an explicitly aligned deployment SHA.'},review:{state:authority.state,runAllowed:false,publicExecutionAuthorityCreated:false,productionRunAllowed:false}},403);
}

function reviewEnvelope(authority,mode='RUNTIME'){
  return Object.freeze({
    state:'HUMAN_REVIEW',
    mode,
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
  const mode=reviewMode(context.request);
  try{
    const bundle=await loadReviewBundle(context,mode);
    return json({ok:true,review:reviewEnvelope(authority,mode),...bundle});
  }catch(error){
    return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_BUNDLE_UNAVAILABLE',message:String(error?.message||error)},review:reviewEnvelope(authority,mode)},503);
  }
}

export async function onRequestPost(context){
  const authority=inspectIChingHumanReviewAuthority(context);
  if(!authority.authorized) return denied(authority);
  const mode=reviewMode(context.request);
  let input;
  try{input=await context.request.json();}catch{return json({ok:false,error:{code:'INVALID_JSON_BODY'},review:reviewEnvelope(authority)},400);}
  try{
    if(mode==='DEPTH'){
      const [{campaign},hexagramCandidates,lineCandidates,canonicalCorpus,hexagramRegistry]=await Promise.all([
        loadReviewBundle(context,mode),
        load(context,PATHS.depthHexagramCandidates),
        load(context,PATHS.depthLineCandidates),
        load(context,PATHS.corpus),
        load(context,PATHS.hexagramRegistry)
      ]);
      const session=campaign.sessions.find(item=>item.sessionId===String(input?.sessionId||''));
      if(!session) return json({ok:false,error:{code:'ICHING_DEPTH_HUMAN_REVIEW_SESSION_UNKNOWN'},review:reviewEnvelope(authority,mode)},404);
      const candidates=[...(hexagramCandidates.entries||[]),...(lineCandidates.entries||[])];
      const candidate=candidates.find(item=>item.interpretationId===session.interpretationId);
      if(!candidate) throw new TypeError('ICHING_DEPTH_REVIEW_CANDIDATE_UNAVAILABLE');
      const claimIds=new Set(candidate.sourceBindings.sourceClaimRefs);
      const sourceClaims=(canonicalCorpus.entries||[]).filter(item=>claimIds.has(item.claimId));
      const structure=(hexagramRegistry.entries||[]).find(item=>item.hexagramId===candidate.hexagramId);
      const digestBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(candidate)));
      const candidateDigest=[...new Uint8Array(digestBytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
      return json({
        ok:true,
        review:reviewEnvelope(authority,mode),
        session,
        candidate,
        candidateDigest,
        sourceClaims,
        structure,
        execution:{fixedCampaignInput:true,requestBodyMayOverrideCandidate:false,automaticPersistence:false,productionRunAllowed:false}
      });
    }
    const [{campaign},authorities]=await Promise.all([loadReviewBundle(context,mode),loadAuthorities(context)]);
    const session=campaign.sessions.find(item=>item.sessionId===String(input?.sessionId||''));
    if(!session) return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_SESSION_UNKNOWN'},review:reviewEnvelope(authority)},404);
    const executed=await executeIChingHumanReviewSession(session,authorities);
    return json({
      ok:true,
      review:reviewEnvelope(authority,mode),
      session,
      machineEvidence:executed.snapshot,
      publicView:executed.result.publicView,
      execution:{fixedCampaignInput:true,requestBodyMayOverrideQuestion:false,requestBodyMayOverrideLines:false,automaticPersistence:false,productionRunAllowed:false}
    });
  }catch(error){
    return json({ok:false,error:{code:'ICHING_HUMAN_REVIEW_EXECUTION_REJECTED',message:String(error?.message||error)},review:reviewEnvelope(authority,mode)},400);
  }
}

export const ICHING_HUMAN_REVIEW_AUTHORITY_PATHS=PATHS;
