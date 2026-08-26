import {createIChingLimitedSession,limitedCookie} from '../iching-limited-production/iching-limited-production-v1.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});

/**
 * ICH-PROD-W29 Cloudflare Pages edge-fetch compatibility successor.
 * Workerd rejects redirect:"error" for this subrequest path in production.
 * Preserve the frozen v1 verifier/session semantics and adapt only the injected
 * fetch implementation to manual redirects, which are then fail-closed by the
 * existing response.ok check before any JWKS content is trusted.
 */
const edgeSafeAccessFetch=(input,init={})=>fetch(input,{...init,redirect:init?.redirect==='error'?'manual':init?.redirect});

export async function onRequestPost(context){
  try{
    const session=await createIChingLimitedSession(context,{fetchImpl:edgeSafeAccessFetch});
    return json({ok:true,state:'LIMITED_PRODUCTION_SESSION_CREATED',deploymentSha:session.payload.deploymentSha,country:session.payload.country,rightsReviewId:session.payload.rightsReviewId,d1:{provider:session.d1.provider,writeReadVerified:true},boundaries:{fullProduction:false,retentionConsentGranted:false,rawAccountIdentityReturned:false},successor:{sessionEndpointVersion:'2.0.0',edgeRedirectMode:'manual'}},200,{'set-cookie':limitedCookie(session.token,session.maxAge)});
  }catch(error){return json({ok:false,error:{code:error?.message||'ICHING_LIMITED_SESSION_REJECTED'},state:'ACTIVATION_EVIDENCE_PENDING',boundaries:{runAllowed:false,fullProduction:false}},Number(error?.status)||403);}
}
export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
