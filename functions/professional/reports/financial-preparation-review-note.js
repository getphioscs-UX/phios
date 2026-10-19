import {readProfessionalFinancialPacket} from '../access/financial-preparation-handoff.js';
import {createReportGenerationStore} from '../../personal-reading/report-generation-store.js';
import {sha256Hex} from '../../document-assembly/digest.js';
import {assertNoPersistedIdentity} from '../../account/person-use-policy.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export async function saveFinancialProfessionalNote(context,request){
 const workspace=await readProfessionalFinancialPacket(context,request),source=workspace.workspace.resources.previous_reports.source;
 if(!['CONFIRM','QUESTION','REQUEST_EVIDENCE'].includes(request.action)||typeof request.comment!=='string'||!request.comment.trim()||request.comment.length>4000||!/^[a-f0-9-]{36}$/i.test(request.noteToken||''))fail('PROFESSIONAL_NOTE_INVALID');
 assertNoPersistedIdentity(request);
 const professionalId=workspace.decision.professional_id,sourceDigest=source.contentDigest,id='financial_note_'+sha256Hex({source,professionalId,noteToken:request.noteToken}).slice(0,32);
 const basis={source,sourceDigest,professionalId,assignmentRef:workspace.decision.assignment_id,grantId:request.grantId,scopes:request.scopes,action:request.action,comment:request.comment.trim(),authority:'HUMAN_PROFESSIONAL_COMMENT',customerSourceMutated:false,aiReportMutated:false};
 const contentDigest=sha256Hex(basis),binding={environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:source.ownerRef,orderId:'NONCOMMERCIAL_PROFESSIONAL_REVIEW',reportId:id,productId:'FINANCIAL_REVIEW_NOTE'};
 const state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 return state.withLock('professional-note',async()=>{
  const prior=await state.get('PROFESSIONAL_NOTE');if(prior){if(prior.contentDigest!==contentDigest)fail('PROFESSIONAL_NOTE_IDEMPOTENCY_CONFLICT');return {...prior,reused:true};}
  // Revalidate revocation immediately before durable delivery to the private store.
  await readProfessionalFinancialPacket(context,request);
  const key=`financial-professional-notes/${id}/${contentDigest}.json`,note={...basis,noteId:id,contentDigest,createdAt:new Date().toISOString(),status:'INDEPENDENT_PROFESSIONAL_COMMENT'};
  if(!context.env.PRIVATE_REPORTS?.put)fail('PRIVATE_REPORT_STORAGE_REQUIRED');await context.env.PRIVATE_REPORTS.put(key,JSON.stringify(note));
  const ref={noteId:id,contentDigest,source,professionalId,grantId:request.grantId,privateObjectKey:key};await state.putIfAbsent('PROFESSIONAL_NOTE',ref);return {...ref,reused:false};
 });
}
export async function readFinancialProfessionalNote(context,request){
 const workspace=await readProfessionalFinancialPacket(context,request),source=workspace.workspace.resources.previous_reports.source,professionalId=workspace.decision.professional_id;
 const id='financial_note_'+sha256Hex({source,professionalId,noteToken:request.noteToken}).slice(0,32),state=await createReportGenerationStore(context.env,{environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:source.ownerRef,orderId:'NONCOMMERCIAL_PROFESSIONAL_REVIEW',reportId:id,productId:'FINANCIAL_REVIEW_NOTE'},{scope:'delivery'});
 const ref=await state.inspectState('PROFESSIONAL_NOTE');if(!ref||ref.grantId!==request.grantId)fail('PROFESSIONAL_NOTE_NOT_FOUND');const object=await context.env.PRIVATE_REPORTS.get(ref.privateObjectKey);if(!object)fail('PROFESSIONAL_NOTE_OBJECT_MISSING');const note=JSON.parse(await object.text()),{noteId,contentDigest,createdAt,status,...basis}=note;if(sha256Hex(basis)!==ref.contentDigest||contentDigest!==ref.contentDigest)fail('PROFESSIONAL_NOTE_INTEGRITY_FAILED');return note;
}
