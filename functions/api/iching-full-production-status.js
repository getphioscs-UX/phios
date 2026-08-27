import {resolveIChingFullProductionAuthority} from '../iching-full-production/iching-full-production-v1.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers});}
export async function onRequestGet(context){
  const production=await resolveIChingFullProductionAuthority(context);
  return json({ok:true,method:'I_CHING',deployment:{commitSha:String(context?.env?.CF_PAGES_COMMIT_SHA||'').trim()||null},production,
    boundaries:{globalPublicExecution:production.globalPublicExecution===true,guestPersistenceAllowed:production.guestPersistenceAllowed===true,guestPersistenceRequiresExplicitConsent:true,automaticPersistence:false,clientMayGrantAuthority:false,decisionAuthority:'USER'}});
}
export async function onRequestPost(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
