import {resolveTarotExecutionAuthority} from '../tarot-product-runtime/tarot-production-authority.js';
import {TAROT_PRODUCTION_AUTHORITY_PATHS} from './symbolic-method-execute.js';
import {symbolicServiceAvailability} from '../_lib/symbolic-service-availability-r2.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function onRequestGet(context){
  const production=await resolveTarotExecutionAuthority(context);
  const service=await symbolicServiceAvailability(context,'TAROT',production,TAROT_PRODUCTION_AUTHORITY_PATHS);
  return json({ok:true,method:'TAROT',service,production:{...production,applicationRunAllowed:production.runAllowed,runAllowed:service.execution.allowed,clientMayGrantAuthority:false},persistence:{...service.persistence,guestHiddenHistory:false,accountSaveRequiresVerifiedServerIdentityAndRetention:true}});
}
export async function onRequestPost(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
