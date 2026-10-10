import { normalizeTrustedCkaAccess } from '../_lib/client-knowledge-ask-c.js';
import { assertVerifiedSymbolicAccountIdentity } from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import { createSymbolicReadingD1Store } from '../symbolic-method-persistence/symbolic-reading-store-d1-v1.js';

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});

function resolve(context) {
  const access=normalizeTrustedCkaAccess(context?.data?.ckaAccess||{});
  if(access.accountState!=='ACCOUNT'){const e=new Error('ACCOUNT_REQUIRED');e.status=401;throw e;}
  if(!access.retentionPolicyAccepted){const e=new Error('RETENTION_POLICY_REQUIRED');e.status=403;throw e;}
  const identity=assertVerifiedSymbolicAccountIdentity(context?.data?.symbolicAccountIdentity||{});
  const store=createSymbolicReadingD1Store({db:context?.env?.RUNTIME_DB});
  return {identity,store};
}

export async function onRequestGet(context){
  try{
    const {identity,store}=resolve(context);const url=new URL(context.request.url);const readingId=String(url.searchParams.get('readingId')||'').trim();
    if(readingId){const record=await store.read({identity,readingId});if(!record)return json({ok:false,error:{code:'SYMBOLIC_READING_NOT_FOUND'}},404);return json({ok:true,record,governance:{userScoped:true,guestHistoryRead:false}});}
    const records=await store.list({identity,limit:url.searchParams.get('limit')||20});return json({ok:true,records,governance:{userScoped:true,guestHistoryRead:false,localBrowserHistoryRead:false}});
  }catch(error){return json({ok:false,error:{code:error.code||error.message||'SYMBOLIC_READINGS_UNAVAILABLE'}},error.status||503);}
}

export async function onRequestPatch(context){
  try{
    const {identity,store}=resolve(context);let body;try{body=await context.request.json();}catch{return json({ok:false,error:{code:'INVALID_JSON'}},400);}
    const readingId=String(body?.readingId||'').trim();if(!readingId)return json({ok:false,error:{code:'SYMBOLIC_READING_ID_REQUIRED'}},400);
    const result=await store.update({identity,readingId,patch:{userNotes:body.userNotes,reviewState:body.reviewState,realityHandoff:body.realityHandoff}});
    return json({ok:true,updated:true,...result,governance:{userScoped:true,explicitMutation:true,canonicalRealityCreated:false}});
  }catch(error){return json({ok:false,error:{code:error.code||error.message||'SYMBOLIC_READING_UPDATE_FAILED'}},error.status||503);}
}
