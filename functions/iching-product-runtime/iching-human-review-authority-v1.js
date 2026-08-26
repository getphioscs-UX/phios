/**
 * Server-controlled I Ching human-review authority.
 *
 * This authority is deliberately disjoint from LIMITED_PRODUCTION. A reviewer
 * can execute fixed campaign inputs, but can never promote public runAllowed,
 * persistence, or product activation.
 */
const text=value=>String(value??'').normalize('NFKC').trim();
const enabled=value=>['1','true','enabled'].includes(text(value).toLowerCase());

function allowlisted(email,value){
  const normalized=text(email).toLowerCase();
  if(!normalized) return false;
  return text(value).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(normalized);
}

function trustedContextAuthority(context){
  const authority=context?.data?.symbolicHumanReviewAuthority?.I_CHING;
  const deploymentSha=text(context?.env?.CF_PAGES_COMMIT_SHA).toLowerCase();
  const authorized=Boolean(
    authority&&authority.methodCode==='I_CHING'&&authority.state==='HUMAN_REVIEW'&&
    authority.runAllowed===true&&authority.campaignVersion==='2.0.0'&&
    text(authority.reviewerId)&&deploymentSha&&
    text(authority.deploymentSha).toLowerCase()===deploymentSha
  );
  if(!authorized) return null;
  return Object.freeze({reviewerId:text(authority.reviewerId),deploymentSha,authenticationMode:'TRUSTED_SERVER_CONTEXT'});
}

function cloudflareAccessAuthority(context){
  const request=context?.request;
  const env=context?.env||{};
  const deploymentSha=text(env.CF_PAGES_COMMIT_SHA).toLowerCase();
  const configuredSha=text(env.ICHING_HUMAN_REVIEW_DEPLOYMENT_SHA).toLowerCase();
  const reviewerEmail=text(request?.headers?.get?.('cf-access-authenticated-user-email')).toLowerCase();
  const accessAssertion=text(request?.headers?.get?.('cf-access-jwt-assertion'));
  const authorized=Boolean(
    enabled(env.ICHING_HUMAN_REVIEW_ENABLED)&&
    deploymentSha&&/^[a-f0-9]{40}$/.test(deploymentSha)&&configuredSha===deploymentSha&&
    accessAssertion&&allowlisted(reviewerEmail,env.ICHING_HUMAN_REVIEWER_EMAILS)
  );
  if(!authorized) return null;
  return Object.freeze({reviewerId:reviewerEmail,deploymentSha,authenticationMode:'CLOUDFLARE_ACCESS_POLICY_AND_ALLOWLIST'});
}

export function inspectIChingHumanReviewAuthority(context={}){
  const identity=trustedContextAuthority(context)||cloudflareAccessAuthority(context);
  const authorized=Boolean(identity);
  return Object.freeze({
    authorized,
    methodCode:'I_CHING',
    state:authorized?'HUMAN_REVIEW':'HUMAN_REVIEW_AUTHORITY_REQUIRED',
    runAllowed:authorized,
    campaignVersion:'2.0.0',
    reviewerId:identity?.reviewerId||null,
    deploymentSha:identity?.deploymentSha||null,
    authenticationMode:identity?.authenticationMode||null,
    accessPolicyRequired:true,
    fixedCampaignInputOnly:true,
    automaticPersistence:false,
    publicExecutionAuthorityCreated:false,
    productionRunAllowed:false,
    clientMayGrantAuthority:false
  });
}

