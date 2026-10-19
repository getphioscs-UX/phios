import {grantOwner,requireFinancialGrant} from '../consent/financial-purpose-grants.js';
import {loadOwnedDraft} from '../../account/financial-will-draft-store.js';
import {loadAuthorisedProfessionalWorkspace} from './authorised-professional-data-loader.js';
import {sha256Hex} from '../../document-assembly/digest.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:403});};
export async function customerFinancialPacket(context,{savedDraftRef,scopes}){
 const owner=grantOwner(context);if(savedDraftRef?.ownerRef!==owner||!Array.isArray(scopes)||!scopes.length||scopes.some(s=>!['assets','liabilities','guarantees'].includes(s)))fail('HANDOFF_SCOPE_INVALID');
 const source=await loadOwnedDraft(context,{draftId:savedDraftRef.draftId,version:savedDraftRef.version,expectedRef:savedDraftRef,kind:'FINANCIAL'});
 const packet={source:source.savedDraftRef,scopes,sections:Object.fromEntries(scopes.map(s=>[s,source.payload.inventory?.[s]||[]])),state:'CUSTOMER_PREVIEW_ONLY',appointmentState:'NOT_REQUESTED',assignmentCreated:false,externalSend:false};return {...packet,packetDigest:sha256Hex(packet)};
}
// The caller supplies no identity, eligibility or assignment decision. Those must
// already have been loaded by the existing authenticated professional owner.
export async function readProfessionalFinancialPacket(context,{savedDraftRef,grantId,scopes,jurisdictionScope,serviceScope}){
 const access=context.data?.professionalAccess;if(!access)fail('PROFESSIONAL_OWNER_CONTEXT_REQUIRED');
 if(!Array.isArray(access.verifiedJurisdictionScopes)||!access.verifiedJurisdictionScopes.includes(jurisdictionScope)||!Array.isArray(access.verifiedServiceScopes)||!access.verifiedServiceScopes.includes(serviceScope))fail('PROFESSIONAL_JURISDICTION_SERVICE_UNVERIFIED');
 return loadAuthorisedProfessionalWorkspace({...access,read_authorised_resources:async authorized=>{
  if(!authorized.resource_scopes.includes('previous_reports'))fail('PROFESSIONAL_RESOURCE_SCOPE_REQUIRED');
  // Delegation exists only inside the existing owner's authorized reader callback.
  const delegated={...context,data:{...context.data,symbolicAccountIdentity:{userId:authorized.client_id,providerId:'AUTHORIZED_PROFESSIONAL_DATA_LOADER',authenticated:true,verified:true}}};
  const grant=await requireFinancialGrant(delegated,{grantId,source:savedDraftRef,purpose:'PROFESSIONAL_REVIEW',scopes});
  if(authorized.professional_id!==grant.recipient_ref||grant.jurisdiction_scope!==jurisdictionScope||grant.service_scope!==serviceScope||authorized.client_id!==grant.owner_id)fail('HANDOFF_RECIPIENT_SCOPE_MISMATCH');
  // Revocation is re-read immediately before any payload is decrypted.
  await requireFinancialGrant(delegated,{grantId,source:savedDraftRef,purpose:'PROFESSIONAL_REVIEW',scopes});
  const source=await loadOwnedDraft(delegated,{draftId:savedDraftRef.draftId,version:savedDraftRef.version,expectedRef:savedDraftRef,kind:'FINANCIAL'});
  return {client:{reference:source.savedDraftRef.subjectRef},resources:{previous_reports:{source:source.savedDraftRef,sections:Object.fromEntries(scopes.map(s=>[s,source.payload.inventory?.[s]||[]]))}}};
 }},{now:new Date().toISOString()});
}
