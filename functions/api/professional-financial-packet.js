import {resolveFinancialProfessionalOwnerContext} from '../professional/access/financial-professional-owner-context.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {readProfessionalFinancialPacket} from '../professional/access/financial-preparation-handoff.js';
import {savedDraftRef} from '../account/financial-will-draft-store.js';
export async function onRequestGet(context){try{
 const account=context.data?.symbolicAccountIdentity;
 if(!account?.authenticated||!account?.verified)throw Object.assign(Error('ACCOUNT_REQUIRED'),{status:401});
 const records=await context.env.RUNTIME_DB.prepare('SELECT access_id FROM professional_owner_access_records WHERE subject_account_id=? AND revoked_at IS NULL').bind(account.userId).all();
 const selections=[];
 for(const row of records.results||[]){let trusted;try{trusted=await resolveFinancialProfessionalOwnerContext(context,row.access_id);}catch{continue;}
 const access=trusted.data.professionalAccess;
 const rows=await context.env.RUNTIME_DB.prepare("SELECT d.*,g.grant_id,g.data_scopes,g.jurisdiction_scope,g.service_scope FROM financial_purpose_grants g JOIN account_financial_will_drafts d ON g.source_ref=('ACCOUNT_DRAFT:'||d.draft_id||':'||d.object_version) AND g.owner_id=d.user_id AND g.source_digest=d.digest WHERE g.owner_id=? AND g.recipient_ref=? AND g.purpose='PROFESSIONAL_REVIEW' AND g.revoked_at IS NULL AND g.granted_at<=? AND g.expires_at>? AND d.expires_at>? AND d.draft_type='FINANCIAL'").bind(access.assignment.client_id,access.identity.professional_id,Date.now(),Date.now(),Date.now()).all();
 for(const item of rows.results||[])if(access.verifiedJurisdictionScopes?.includes(item.jurisdiction_scope)&&access.verifiedServiceScopes?.includes(item.service_scope))selections.push({accessId:row.access_id,grantId:item.grant_id,savedDraftRef:savedDraftRef(item),scopes:JSON.parse(item.data_scopes),jurisdictionScope:item.jurisdiction_scope,serviceScope:item.service_scope});
 }
 return Response.json({ok:true,selections},{headers:{'cache-control':'private, no-store'}});
 }catch(e){return Response.json({ok:false,code:e.code||'PROFESSIONAL_OWNER_STORE_NOT_AVAILABLE'},{status:e.status||503,headers:{'cache-control':'private, no-store'}});}}
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);
 const raw=await context.request.text();if(raw.length>20000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);context=await resolveFinancialProfessionalOwnerContext(context,body.accessId);
 // Identity, credentials, assignment and consent cannot be supplied by the body.
 const packet=await readProfessionalFinancialPacket(context,{savedDraftRef:body.savedDraftRef,grantId:body.grantId,scopes:body.scopes,jurisdictionScope:body.jurisdictionScope,serviceScope:body.serviceScope});
 return Response.json({ok:true,packet},{headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'PROFESSIONAL_PACKET_UNAVAILABLE'},{status:e.status||403,headers:{'cache-control':'private, no-store'}});}}
