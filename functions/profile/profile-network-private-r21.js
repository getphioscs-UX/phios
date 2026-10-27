import {requireLocalNetworkDisplay,PROFILE_NETWORK_DISPLAY,displayBinding} from './profile-network-display-policy-r21.js';
import {dossierEligibility} from './personal-evidence-membership.js';
import {grantOwner,createFinancialGrant,requireFinancialGrant,revokeFinancialGrant} from '../professional/consent/financial-purpose-grants.js';
import {loadOwnedDraft,savedDraftRef} from '../account/financial-will-draft-store.js';
import {readLocalOwnedNetworkDraft} from './profile-network-draft-adapter-r2.js';
import {projectProfileNetwork} from './profile-context-network-r2.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
const fail=(code,status=403)=>{throw Object.assign(Error(code),{code,status});};
const scopes=domain=>domain==='FINANCIAL'?['people','assets','liabilities','guarantees','policies']:['people','assets'];
async function source(context,body){
 const ref=body.savedDraftRef;
 if(!['FINANCIAL','ESTATE'].includes(body.domain))fail('RELATIONSHIP_PRIVATE_OWNER_NOT_ESTABLISHED');
 if(!ref||!Number.isInteger(ref.version))fail('EXACT_SOURCE_REFERENCE_REQUIRED',422);
 const loaded=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:body.domain==='ESTATE'?'WILL':'FINANCIAL'});
 const latest=await context.env.RUNTIME_DB.prepare('SELECT MAX(object_version) AS version FROM account_financial_will_drafts WHERE user_id=? AND draft_id=?').bind(grantOwner(context),ref.draftId).first();
 if(latest?.version!==ref.version)fail('SOURCE_SUPERSEDED',409);
 return loaded.savedDraftRef;
}
export async function privateProfileNetwork(context){
 // Gate before any DB access; the flag alone is insufficient outside localhost.
 requireLocalNetworkDisplay(context);const owner=grantOwner(context);
 if(context.request.method!=='POST')fail('EXPLICIT_SELECTION_REQUIRED',422);
 requireSameOrigin(context.request);const raw=await context.request.text();if(new TextEncoder().encode(raw).length>24000)fail('REQUEST_TOO_LARGE',413);
 const body=JSON.parse(raw);
 // Withdrawal is an owner right, not a paid entitlement.
 if(body.action==='revoke'){if(body.confirmed!==true)fail('EXPLICIT_CONSENT_REQUIRED');await revokeFinancialGrant(context,body.grantId);return {ok:true,revoked:true};}
 if(body.action==='permissions'){
  const rows=await context.env.RUNTIME_DB.prepare('SELECT grant_id,source_ref,expires_at FROM financial_purpose_grants WHERE owner_id=? AND purpose=? AND revoked_at IS NULL ORDER BY granted_at DESC LIMIT 100').bind(owner,PROFILE_NETWORK_DISPLAY).all();
  return {ok:true,grants:(rows.results||[]).map(g=>({grantId:g.grant_id,sourceRef:g.source_ref,expiresAt:new Date(g.expires_at).toISOString()}))};
 }
 const entitlement=await dossierEligibility(context.env,owner);
 if(body.action==='sources'){
  // Metadata only; no names, amounts, notes or ciphertext leave the owner.
  const rows=await context.env.RUNTIME_DB.prepare('SELECT d.draft_id,d.user_id,d.draft_type,d.schema_version,d.object_version,d.digest,d.created_at FROM account_financial_will_drafts d WHERE d.user_id=? AND d.expires_at>? AND d.object_version=(SELECT MAX(x.object_version) FROM account_financial_will_drafts x WHERE x.user_id=d.user_id AND x.draft_id=d.draft_id) ORDER BY d.created_at DESC LIMIT 100').bind(owner,Date.now()).all();
  const grants=await context.env.RUNTIME_DB.prepare('SELECT grant_id,source_ref,expires_at FROM financial_purpose_grants WHERE owner_id=? AND purpose=? AND revoked_at IS NULL AND expires_at>? ORDER BY granted_at DESC LIMIT 100').bind(owner,PROFILE_NETWORK_DISPLAY,Date.now()).all();
  return {ok:true,sources:(rows.results||[]).map(r=>({domain:r.draft_type==='WILL'?'ESTATE':'FINANCIAL',savedDraftRef:savedDraftRef(r)})),grants:(grants.results||[]).map(g=>({grantId:g.grant_id,sourceRef:g.source_ref,expiresAt:new Date(g.expires_at).toISOString()})),relationshipStatus:'PRIVATE_OWNER_NOT_ESTABLISHED',entitlementBasis:entitlement.basis};
 }
 if(!['preview','grant','read'].includes(body.action))fail('ACTION_INVALID',422);
 if(body.action!=='read'&&body.confirmed!==true)fail('EXPLICIT_CONSENT_REQUIRED');
 const ref=await source(context,body);
 if(body.action==='read'){
  const row=await requireFinancialGrant(context,{grantId:body.grantId,source:ref,purpose:PROFILE_NETWORK_DISPLAY,scopes:scopes(body.domain)});
  let binding;try{binding=JSON.parse(row.service_scope);}catch{fail('DISPLAY_BINDING_INVALID');}
  if(row.recipient_ref!==owner||row.jurisdiction_scope!=='DISPLAY_ONLY_NO_LEGAL_EFFECT'||binding.domain!==body.domain||row.service_scope!==displayBinding(binding))fail('DISPLAY_BINDING_INVALID');
  const net=await projectProfileNetwork({identity:context.data.symbolicAccountIdentity,selections:[{domain:body.domain,sourceRef:ref.sourceRef,version:ref.version}],authorizeSource:async()=>({ownerRef:owner,sourceRef:ref.sourceRef,version:ref.version,purpose:PROFILE_NETWORK_DISPLAY,status:'ACTIVE',expiresAt:new Date(row.expires_at).toISOString()}),readSource:async()=>{
   const s=await readLocalOwnedNetworkDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,domain:body.domain});
   s.edges=s.edges.filter(e=>binding.edgeIds.includes(e.edge_id));return s;
  }});
  // Recheck mutable consent and entitlement immediately before returning a view.
  await requireFinancialGrant(context,{grantId:body.grantId,source:ref,purpose:PROFILE_NETWORK_DISPLAY,scopes:scopes(body.domain)});await dossierEligibility(context.env,owner);await source(context,body);
  return {ok:true,network:net};
 }
 const s=await readLocalOwnedNetworkDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,domain:body.domain});
 if(body.action==='preview')return {ok:true,choices:s.edges.map(e=>({edgeId:e.edge_id,label:e.label,type:e.edge_type,from:s.nodes.find(n=>n.id===e.from_ref)?.label,to:s.nodes.find(n=>n.id===e.to_ref)?.label})),unknowns:s.unknowns,sourceRef:ref.sourceRef,version:ref.version};
 const binding=displayBinding({domain:body.domain,edgeIds:body.edgeIds});
 if(body.edgeIds.some(id=>!s.edges.some(e=>e.edge_id===id)))fail('DISPLAY_SELECTION_NOT_IN_SOURCE',422);
 const grant=await createFinancialGrant(context,{source:ref,purpose:PROFILE_NETWORK_DISPLAY,scopes:scopes(body.domain),expiresAt:body.expiresAt,displaySelection:JSON.parse(binding)});
 return {ok:true,grant};
}
