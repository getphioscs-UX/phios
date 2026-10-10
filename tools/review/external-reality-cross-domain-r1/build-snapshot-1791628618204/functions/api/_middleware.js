import {verifyIChingLimitedSession,applyIChingLimitedAuthority} from '../iching-limited-production/iching-limited-production-v1.js';
import {onRequestPost as executeIChingLimited} from './symbolic-method-execute-v4.js';
import {authenticate,requireSameOrigin} from '../account/oidc-auth.js';
const eligible=new Set(['/api/iching-runtime-status','/api/symbolic-method-context','/api/symbolic-method-save','/api/symbolic-method-readings','/api/symbolic-method-execute']);
export async function onRequest(context){
  const url=new URL(context.request.url);
  // Only this server-verified bridge supplies ordinary customer identity.
  // Authentication does not grant consent, entitlements or professional rights.
  if(!url.pathname.startsWith('/api/auth/')){
    let identity;
    try{identity=await authenticate(context);}catch{return new Response(JSON.stringify({ok:false,code:'AUTH_UNAVAILABLE'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
    if(identity){
      if(!['GET','HEAD','OPTIONS'].includes(context.request.method)){
        try{requireSameOrigin(context.request);}catch{return new Response(null,{status:403,headers:{'Cache-Control':'no-store'}});}
      }
      context.data ||= {};
      context.data.symbolicAccountIdentity=identity;
      context.data.ckaAccess=Object.freeze({accountState:'ACCOUNT',permission:false,privacy:false,entitlement:false,retentionPolicyAccepted:false,roles:[]});
      return context.next();
    }
  }
  if(!eligible.has(url.pathname)) return context.next();
  const session=await verifyIChingLimitedSession(context).catch(()=>null); if(!session) return context.next();
  applyIChingLimitedAuthority(context,session);
  if(url.pathname==='/api/symbolic-method-execute'&&context.request.method==='POST'){
    let body=null; try{body=await context.request.clone().json();}catch{}
    if(String(body?.method||'').toUpperCase()==='I_CHING') return executeIChingLimited(context);
  }
  return context.next();
}
