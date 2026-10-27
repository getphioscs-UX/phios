import {loadOwnedDraft} from '../account/financial-will-draft-store.js';
// Local conformance adapter only. Production Financial purpose grants do not
// currently admit Profile network use, so no public handler invokes this reader.
const bi=(en,zh)=>({en,'zh-Hans':zh});
export async function readLocalOwnedNetworkDraft(context,{draftId,version,expectedRef,domain}){
 if(context.env?.PHIOS_PROFILE_NETWORK_LOCAL!=='true'||!['localhost','127.0.0.1'].includes(new URL(context.request.url).hostname))throw Error('LOCAL_NETWORK_ADAPTER_ONLY');
 if(!Number.isInteger(version)||version<1||!expectedRef)throw Error('EXACT_SOURCE_REFERENCE_REQUIRED');
 const record=await loadOwnedDraft(context,{draftId,version,expectedRef,kind:domain==='ESTATE'?'WILL':'FINANCIAL'});
 const nodes=[],edges=[],unknowns=[],people=new Set();
 const node=(id,type,label)=>{if(!nodes.some(n=>n.id===id))nodes.push({id,type,label,unknowns:bi('Recorded claim only; independently verify the underlying role.','仅为记录的主张，须独立核对相关角色。')});};
 const person=id=>{if(typeof id==='string'&&id&&people.has(id))return id;return null;};
 const add=(from,to,type,index,en,zh)=>{if(!from||!to){unknowns.push('PERSON_REFERENCE_NOT_ESTABLISHED');return;}edges.push({edge_id:'row-'+index,from_ref:from,to_ref:to,edge_type:type,direction:'FROM_TO',observed_at:record.createdAt,label:bi(en,zh),unknowns:bi('No share, legal duty or effective estate entitlement is established.','未确立份额、法律义务或有效遗产权益。'),next_verification:bi('Check the exact document, role, date and permission.','核对准确文件、角色、日期及授权。')});};
 if(domain==='FINANCIAL'){
  const inventory=record.payload.inventory||{};
  for(const [i,p]of(inventory.people||[]).entries())if(p.personId){people.add(p.personId);node(p.personId,'PERSON',bi('Recorded person '+(i+1),'记录人物'+(i+1)));}
  for(const [group,type,en,zh]of[['assets','SHARED_OWNERSHIP_CLAIM','Ownership claim','产权主张'],['liabilities','LOAN_OR_GUARANTEE_ROLE','Recorded borrower / obligation role','记录的借贷／责任角色'],['guarantees','LOAN_OR_GUARANTEE_ROLE','Recorded guarantee role','记录的担保角色'],['policies','PROTECTION_ROLE','Recorded policy role','记录的保单角色']]){
   for(const [i,row]of(inventory[group]||[]).entries()){
    const id=group+':'+i;node(id,'FINANCIAL_OBJECT',bi('Recorded '+group+' '+(i+1),'记录的财务对象'+(i+1)));
    const refs=group==='assets'?row.ownerReferences||[]:group==='policies'?[row.personId]:[row.obligor||row.personId];
    for(const ref of refs)add(person(ref),id,type,group+'-'+i+'-'+ref,en,zh);
    // A documentReference is a locator, not proof of independent verification.
    // Nominee/beneficiary strings are not merged with estate beneficiary roles.
   }
  }
 }else if(domain==='ESTATE'){
  const sections=record.payload.sections||{};node('draft','ESTATE_INTENTION_DRAFT',bi('Estate intentions draft','遗产意向草稿'));
  for(const p of [...(sections.identity?.items||[]),...(sections.family?.items||[])])if(p.personId){people.add(p.personId);node(p.personId,'PERSON',bi('Recorded draft participant','草稿记录人物'));}
  for(const group of ['executors','guardians','beneficiaries'])for(const [i,row]of(sections[group]?.items||[]).entries())add('draft',person(row.beneficiaryPersonId||row.personId),'ESTATE_DRAFT_ROLE',group+i,'Proposed '+group,'草稿拟定角色');
  for(const [i,row]of(sections.assets?.items||[]).entries()){const id='draft-asset:'+i;node(id,'FINANCIAL_OBJECT',bi('Proposed asset inclusion','拟列入的资产'));add('draft',id,'ESTATE_ASSET_REFERENCE','assets'+i,'Candidate asset - ownership not verified','候选资产，产权未核实');}
 }else throw Error('NETWORK_DRAFT_DOMAIN_INVALID');
 const latest=await context.env.RUNTIME_DB.prepare('SELECT MAX(object_version) AS version FROM account_financial_will_drafts WHERE user_id=? AND draft_id=?').bind(record.savedDraftRef.ownerRef,draftId).first();
 return {domain,ownerRef:record.savedDraftRef.ownerRef,sourceRef:record.savedDraftRef.sourceRef,version:record.version,expiresAt:record.expiresAt,supersededBy:latest?.version>record.version?`ACCOUNT_DRAFT:${draftId}:${latest.version}`:null,sourceClass:'CUSTOMER_RECORDED_DRAFT',sourceStatus:'SELF_REPORT',nodes,edges,unknowns};
}
