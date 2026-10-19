import {grantOwner} from '../professional/consent/financial-purpose-grants.js';
import {customerFinancialPacket} from '../professional/access/financial-preparation-handoff.js';
import {PREPARATION_SCOPES} from '../professional/consent/financial-preparation-scopes.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {loadOwnedDraft} from '../account/financial-will-draft-store.js';
import {createFinancialGrant,revokeFinancialGrant} from '../professional/consent/financial-purpose-grants.js';
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);const raw=await context.request.text();if(raw.length>16000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);
 if(body.action==='revoke'){await revokeFinancialGrant(context,body.grantId);return Response.json({ok:true},{headers:{'cache-control':'private, no-store'}});}
 if(body.confirmed!==true)throw Object.assign(Error('EXPLICIT_PURPOSE_CONSENT_REQUIRED'),{status:403});
 const ref=body.savedDraftRef;const source=await loadOwnedDraft(context,{draftId:ref?.draftId,version:ref?.version,expectedRef:ref,kind:'FINANCIAL'});
 let preparationBinding=null;if(body.scopes?.some(s=>PREPARATION_SCOPES.includes(s))){const packet=await customerFinancialPacket(context,{savedDraftRef:source.savedDraftRef,scopes:body.scopes,packetOptions:body.packetOptions});if(body.packageDigest!==packet.packetDigest)throw Error('PREPARATION_PREVIEW_CONFIRMATION_REQUIRED');preparationBinding={savedDraftRef:source.savedDraftRef,scopes:body.scopes,packetOptions:packet.preparation.packetOptions,packageDigest:packet.packetDigest,recipientRef:body.recipientRef,jurisdictionScope:body.jurisdictionScope,serviceScope:body.serviceScope,expiresAt:body.expiresAt};}
 const grant=await createFinancialGrant(context,{source:source.savedDraftRef,purpose:body.purpose,scopes:body.scopes,expiresAt:body.expiresAt,recipientRef:body.recipientRef,jurisdictionScope:body.jurisdictionScope,serviceScope:body.serviceScope,language:body.language,preparationBinding});
 return Response.json({ok:true,grant},{headers:{'cache-control':'private, no-store'}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'PURPOSE_GRANT_INVALID'},{status:e.status||422,headers:{'cache-control':'private, no-store'}});}}

export async function onRequestGet(context){try{const owner=grantOwner(context),rows=await context.env.RUNTIME_DB.prepare("SELECT grant_id,recipient_ref,service_scope,jurisdiction_scope,expires_at,data_scopes FROM financial_purpose_grants WHERE owner_id=? AND purpose='PROFESSIONAL_REVIEW' AND revoked_at IS NULL AND expires_at>? ORDER BY granted_at DESC LIMIT 100").bind(owner,Date.now()).all();return Response.json({ok:true,grants:(rows.results||[]).map(r=>({grantId:r.grant_id,recipientRef:r.recipient_ref,serviceScope:r.service_scope,jurisdictionScope:r.jurisdiction_scope,expiresAt:new Date(r.expires_at).toISOString(),scopes:JSON.parse(r.data_scopes)}))},{headers:{'cache-control':'private, no-store'}});}catch(e){return Response.json({ok:false,code:e.code||'SHARE_LIST_UNAVAILABLE'},{status:e.status||503,headers:{'cache-control':'private, no-store'}});}}
