import {requireSameOrigin} from '../account/oidc-auth.js';
import {loadOwnedDraft} from '../account/financial-will-draft-store.js';
import {createFinancialGrant,revokeFinancialGrant} from '../professional/consent/financial-purpose-grants.js';
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);const raw=await context.request.text();if(raw.length>16000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);
 if(body.action==='revoke'){await revokeFinancialGrant(context,body.grantId);return Response.json({ok:true},{headers:{'cache-control':'private, no-store'}});}
 if(body.confirmed!==true)throw Object.assign(Error('EXPLICIT_PURPOSE_CONSENT_REQUIRED'),{status:403});
 const ref=body.savedDraftRef;const source=await loadOwnedDraft(context,{draftId:ref?.draftId,version:ref?.version,expectedRef:ref,kind:'FINANCIAL'});
 const grant=await createFinancialGrant(context,{source:source.savedDraftRef,purpose:body.purpose,scopes:body.scopes,expiresAt:body.expiresAt,recipientRef:body.recipientRef,jurisdictionScope:body.jurisdictionScope,serviceScope:body.serviceScope,language:body.language});
 return Response.json({ok:true,grant},{headers:{'cache-control':'private, no-store'}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'PURPOSE_GRANT_INVALID'},{status:e.status||422,headers:{'cache-control':'private, no-store'}});}}
