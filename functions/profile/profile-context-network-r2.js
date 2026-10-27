import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
// Read-only projection. Domain records, versions and consent remain with their
// existing owners. No graph persistence, financial ledger or identity registry.
export const PROFILE_NETWORK_VERSION='PROFILE-CONTEXT-NETWORK-R2-LOCAL-v1';
export const EDGE_TYPES=Object.freeze(['RELATIONSHIP_ASSERTION','FINANCIAL_SUPPORT','SHARED_OWNERSHIP_CLAIM','LOAN_OR_GUARANTEE_ROLE','PROTECTION_ROLE','ESTATE_DRAFT_ROLE','ESTATE_ASSET_REFERENCE']);
const error=code=>{throw Object.assign(Error(code),{code})};
const label=(en,zh)=>({en,'zh-Hans':zh});
export function publicProfileNetworkFixture(){
 const nodes=[['self','PERSON','Me','本人'],['partner','PERSON','Partner','伴侣'],['child','PERSON','Child','子女'],['parent','PERSON','Parent','长辈'],['context','RELATIONSHIP_CONTEXT','Household context','家庭情境'],['home','FINANCIAL_OBJECT','Home claim','住宅主张'],['loan','FINANCIAL_OBJECT','Loan record','借贷记录'],['policy','FINANCIAL_OBJECT','Protection roles','保障角色'],['draft','ESTATE_INTENTION_DRAFT','Estate intentions draft','遗产意向草稿']].map(([id,type,en,zh])=>({id,type,label:label(en,zh),source_status:'SYNTHETIC',unknowns:label('No real person or document is represented.','不代表真实人物或文件。')}));
 const rows=[['r1','self','partner','RELATIONSHIP_ASSERTION','Partner assertion','伴侣关系自述'],['r2','self','child','RELATIONSHIP_ASSERTION','Parent / child assertion','亲子关系自述'],['r3','self','parent','RELATIONSHIP_ASSERTION','Family assertion','亲属关系自述'],['r4','self','context','RELATIONSHIP_ASSERTION','Declared household context','声明的家庭情境'],['f1','self','child','FINANCIAL_SUPPORT','Recorded support','记录的生活费支持'],['f2','partner','child','FINANCIAL_SUPPORT','Recorded contribution','记录的开支分担'],['f3','self','home','SHARED_OWNERSHIP_CLAIM','Ownership claim - unverified','产权主张，未核实'],['f4','partner','home','SHARED_OWNERSHIP_CLAIM','Shared ownership claim','共同持有主张'],['f5','self','loan','LOAN_OR_GUARANTEE_ROLE','Borrower role - unverified','借款人角色，未核实'],['f6','self','policy','PROTECTION_ROLE','Policyholder record','投保人记录'],['e1','draft','partner','ESTATE_DRAFT_ROLE','Proposed executor','拟指定执行人'],['e2','draft','child','ESTATE_DRAFT_ROLE','Proposed beneficiary','拟列入受益对象'],['e3','draft','home','ESTATE_ASSET_REFERENCE','Proposed asset inclusion','拟列入的资产']];
 const edges=rows.map(([edge_id,from_ref,to_ref,edge_type,en,zh])=>({edge_id,owner_ref:'SYNTHETIC-OWNER-A',source_domain:edge_id.startsWith('r')?'RELATIONSHIP':edge_id.startsWith('f')?'FINANCIAL':'ESTATE',source_ref:'SYNTHETIC:'+edge_id,exact_source_version:1,from_ref,to_ref,edge_type,direction:edge_type==='RELATIONSHIP_ASSERTION'?'UNDIRECTED':'FROM_TO',observed_at:'2026-10-26',source_status:'SYNTHETIC',verification_status:edge_type.startsWith('ESTATE')?'DRAFT_INTENTION':'NOT_INDEPENDENTLY_VERIFIED',consent_scope:'PUBLIC_SYNTHETIC_ONLY',visibility:'PUBLIC_SYNTHETIC',revoked_at:null,superseded_by:null,label:label(en,zh),unknowns:label('Ownership, obligations, shares and legal effect are not established.','产权、义务、份额及法律效力均未确立。'),next_verification:label(edge_id.startsWith('e')?'Check intentions, ownership and the applicable formal documents separately.':'Check the dated source, the recorded role and permission separately.',edge_id.startsWith('e')?'分别核对意向、产权和适用正式文件。':'分别核对有日期的来源、记录角色和授权。')}));
 return {version:PROFILE_NETWORK_VERSION,scope:'PUBLIC_SYNTHETIC_ONLY',status:'SYNTHETIC_EXAMPLE',nodes,edges,states:[],automaticPersistence:false,legalEffectEstablished:false,financialFactsFromSymbolicReadings:false};
}
export async function projectProfileNetwork({identity,selections,readSource,authorizeSource,now=Date.now()}={}){
 const actor=normalizeVerifiedSymbolicAccountIdentity(identity);if(!actor)error('ACCOUNT_REQUIRED');
 if(!Array.isArray(selections)||selections.length>12)error('REFERENCE_INVALID');
 const nodes=new Map(),edges=[],states=[];
 for(const selected of selections){
  if(!selected||!['RELATIONSHIP','FINANCIAL','ESTATE'].includes(selected.domain)||typeof selected.sourceRef!=='string'||!Number.isInteger(selected.version)||selected.version<1){states.push({status:'REFERENCE_INVALID'});continue;}
  const grant=await authorizeSource?.(selected,actor);
  if(!grant||grant.ownerRef!==actor.userId||grant.sourceRef!==selected.sourceRef||grant.version!==selected.version||grant.purpose!=='PROFILE_NETWORK_DISPLAY'||grant.revokedAt||grant.status!=='ACTIVE'||!Number.isFinite(Date.parse(grant.expiresAt))||Date.parse(grant.expiresAt)<=now){states.push({domain:selected.domain,status:'CONSENT_REQUIRED'});continue;}
  let source;
  try{source=await readSource?.(selected,actor);}catch(cause){
   states.push({domain:selected.domain,status:/DRAFT_(NOT_FOUND|EXPIRED)/.test(cause?.code||cause?.message||'')?'SOURCE_UNAVAILABLE':'SERVICE_UNAVAILABLE'});continue;
  }
  if(!source){states.push({domain:selected.domain,status:'SOURCE_UNAVAILABLE'});continue;}
  if(source.ownerRef!==actor.userId||source.sourceRef!==selected.sourceRef||source.version!==selected.version){states.push({domain:selected.domain,status:'SOURCE_VERSION_OR_OWNER_MISMATCH'});continue;}
  const sourceClasses=selected.domain==='RELATIONSHIP'?['CUSTOMER_RELATIONSHIP_CONTEXT','CUSTOMER_DECLARATION','DOCUMENT_SUPPORTED']:selected.domain==='ESTATE'?['CUSTOMER_RECORDED_DRAFT']:['CUSTOMER_RECORDED_DRAFT','CUSTOMER_DECLARATION','DOCUMENT_SUPPORTED'];
  if(source.domain!==selected.domain||!sourceClasses.includes(source.sourceClass)){states.push({domain:selected.domain,status:'SOURCE_DOMAIN_NOT_AUTHORITY'});continue;}
  if(source.revokedAt||source.supersededBy||!Number.isFinite(Date.parse(source.expiresAt))||Date.parse(source.expiresAt)<=now){states.push({domain:selected.domain,status:'SOURCE_INACTIVE'});continue;}
  const local=new Map((source.nodes||[]).map(n=>[n.id,n]));
  for(const raw of source.edges||[]){
   if(!EDGE_TYPES.includes(raw.edge_type)||!local.has(raw.from_ref)||!local.has(raw.to_ref)||raw.revoked_at||raw.superseded_by){states.push({domain:selected.domain,status:'EDGE_NOT_ESTABLISHED'});continue;}
   const allowed=selected.domain==='RELATIONSHIP'?raw.edge_type==='RELATIONSHIP_ASSERTION':selected.domain==='FINANCIAL'?['FINANCIAL_SUPPORT','SHARED_OWNERSHIP_CLAIM','LOAN_OR_GUARANTEE_ROLE','PROTECTION_ROLE'].includes(raw.edge_type):raw.edge_type.startsWith('ESTATE_');
   if(!allowed||source.sourceClass==='SYMBOLIC_READING'){states.push({domain:selected.domain,status:'SOURCE_DOMAIN_NOT_AUTHORITY'});continue;}
   const qualify=id=>source.sourceRef+'@'+source.version+':'+id;
   for(const id of [raw.from_ref,raw.to_ref]){const n=local.get(id);nodes.set(qualify(id),{id:qualify(id),type:n.type,label:n.label,source_status:source.sourceStatus,unknowns:n.unknowns});}
   const verification=selected.domain==='ESTATE'?'DRAFT_INTENTION':['CONFLICTED','UNKNOWN'].includes(source.sourceStatus)?source.sourceStatus:source.sourceStatus==='DOCUMENT_SUPPORTED'?'DOCUMENT_SUPPORTED_NOT_INDEPENDENTLY_VERIFIED':'SELF_REPORT';
   edges.push({edge_id:qualify(raw.edge_id),owner_ref:actor.userId,source_domain:selected.domain,source_ref:source.sourceRef,exact_source_version:source.version,from_ref:qualify(raw.from_ref),to_ref:qualify(raw.to_ref),edge_type:raw.edge_type,label:raw.label,unknowns:raw.unknowns||label('Not established.','尚未确立。'),next_verification:raw.next_verification||label('Verify the exact source and permission.','核对准确来源和授权。'),direction:raw.edge_type==='RELATIONSHIP_ASSERTION'?'UNDIRECTED':'FROM_TO',observed_at:raw.observed_at||null,source_status:source.sourceStatus,verification_status:verification,consent_scope:grant.purpose,visibility:'OWNER_ONLY',revoked_at:null,superseded_by:null});
  }
 }
 const status=edges.length?'READ_ONLY_PROJECTION':['SERVICE_UNAVAILABLE','CONSENT_REQUIRED','SOURCE_UNAVAILABLE'].find(s=>states.some(x=>x.status===s))||'NOT_ESTABLISHED';
 return {version:PROFILE_NETWORK_VERSION,scope:'PRIVATE_READ_ONLY_PROJECTION',status,nodes:[...nodes.values()],edges,states,automaticPersistence:false,legalEffectEstablished:false,financialFactsFromSymbolicReadings:false};
}
