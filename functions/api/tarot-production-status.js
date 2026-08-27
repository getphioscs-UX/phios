import {resolveTarotExecutionAuthority} from '../tarot-product-runtime/tarot-production-authority.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function onRequestGet(context){
  const production=await resolveTarotExecutionAuthority(context);
  return json({ok:true,method:'TAROT',production:{...production,clientMayGrantAuthority:false},persistence:{guestHiddenHistory:false,accountSaveRequiresVerifiedServerIdentityAndRetention:true}});
}
export async function onRequestPost(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
