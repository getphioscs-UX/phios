import {confirmExternalProfile} from '../external-profile/external-profile-confirmation.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'EXTERNAL_PROFILE_CONFIRMATION_JSON_REQUIRED'},400)}
  if(body?.consent!==true)return json({ok:false,error:'EXTERNAL_PROFILE_CONFIRMATION_CONSENT_REQUIRED'},403);
  try{
    const confirmedExternalProfile=confirmExternalProfile({confirmationDraft:body.confirmationDraft,edits:body.edits||{}});
    return json({ok:true,confirmedExternalProfile,privacy:{saved:false,runtimeMemoryWritten:false}});
  }catch(error){return json({ok:false,error:error?.message||'EXTERNAL_PROFILE_CONFIRMATION_FAILED'},422)}
}
