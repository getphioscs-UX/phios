import {requireSameOrigin} from '../account/oidc-auth.js';
import {readProfessionalFinancialPacket} from '../professional/access/financial-preparation-handoff.js';
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);
 if(!context.data?.professionalAccess)throw Object.assign(Error('PROFESSIONAL_OWNER_CONTEXT_REQUIRED'),{status:403});
 const raw=await context.request.text();if(raw.length>20000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);
 // Identity, credentials, assignment and consent cannot be supplied by the body.
 const packet=await readProfessionalFinancialPacket(context,{savedDraftRef:body.savedDraftRef,grantId:body.grantId,scopes:body.scopes,jurisdictionScope:body.jurisdictionScope,serviceScope:body.serviceScope});
 return Response.json({ok:true,packet},{headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'PROFESSIONAL_PACKET_UNAVAILABLE'},{status:e.status||403,headers:{'cache-control':'private, no-store'}});}}
