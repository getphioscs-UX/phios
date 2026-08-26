import {verifyIChingLimitedSession,applyIChingLimitedAuthority} from '../iching-limited-production/iching-limited-production-v1.js';
import {onRequestPost as executeIChingLimited} from './symbolic-method-execute-v4.js';
const eligible=new Set(['/api/iching-runtime-status','/api/symbolic-method-context','/api/symbolic-method-save','/api/symbolic-method-readings','/api/symbolic-method-execute']);
export async function onRequest(context){
  const url=new URL(context.request.url);
  if(!eligible.has(url.pathname)) return context.next();
  const session=await verifyIChingLimitedSession(context).catch(()=>null); if(!session) return context.next();
  applyIChingLimitedAuthority(context,session);
  if(url.pathname==='/api/symbolic-method-execute'&&context.request.method==='POST'){
    let body=null; try{body=await context.request.clone().json();}catch{}
    if(String(body?.method||'').toUpperCase()==='I_CHING') return executeIChingLimited(context);
  }
  return context.next();
}
