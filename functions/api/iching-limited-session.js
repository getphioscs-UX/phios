import {createIChingLimitedSession,limitedCookie} from '../iching-limited-production/iching-limited-production-v1.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
export async function onRequestPost(context){
  try{
    const session=await createIChingLimitedSession(context);
    return json({ok:true,state:'LIMITED_PRODUCTION_SESSION_CREATED',deploymentSha:session.payload.deploymentSha,country:session.payload.country,rightsReviewId:session.payload.rightsReviewId,d1:{provider:session.d1.provider,writeReadVerified:true},boundaries:{fullProduction:false,retentionConsentGranted:false,rawAccountIdentityReturned:false}},200,{'set-cookie':limitedCookie(session.token,session.maxAge)});
  }catch(error){return json({ok:false,error:{code:error?.message||'ICHING_LIMITED_SESSION_REJECTED'},state:'ACTIVATION_EVIDENCE_PENDING',boundaries:{runAllowed:false,fullProduction:false}},Number(error?.status)||403);}
}
export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
