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
  const prior=await state.get('PROFESSIONAL_NOTE');if(prior){if(prior.contentDigest!==contentDigest)fail('PROFESSIONAL_NOTE_IDEMPOTENCY_CONFLICT');await indexNote(context,request,workspace,prior);return {...prior,reused:true};}
  const index=await noteIndex(context,request,workspace),interrupted=await index.inspectState(id+'_RECEIPT');
  if(interrupted){if(interrupted.contentDigest!==contentDigest)fail('PROFESSIONAL_NOTE_IDEMPOTENCY_CONFLICT');try{const recoveredNote=await verifyObject(context,request,workspace,interrupted),recovered={...interrupted,status:'AVAILABLE',createdAt:recoveredNote.createdAt};await state.putIfAbsent('PROFESSIONAL_NOTE',recovered);await indexNote(context,request,workspace,recovered);return {...recovered,reused:true};}catch(e){if(e.code!=='PROFESSIONAL_NOTE_OBJECT_MISSING')throw e;}}
  // Revalidate revocation immediately before durable delivery to the private store.
  await readProfessionalFinancialPacket(context,request);
  const key=`financial-professional-notes/${id}/${contentDigest}.json`,note={...basis,noteId:id,contentDigest,createdAt:new Date().toISOString(),status:'INDEPENDENT_PROFESSIONAL_COMMENT'};
  const pending={noteId:id,contentDigest,source,professionalId,assignmentRef:workspace.decision.assignment_id,grantId:request.grantId,scopes:request.scopes,createdAt:note.createdAt,action:note.action,privateObjectKey:key};await indexNote(context,request,workspace,pending,'PREPARED');
  if(!context.env.PRIVATE_REPORTS?.put)fail('PRIVATE_REPORT_STORAGE_REQUIRED');await context.env.PRIVATE_REPORTS.put(key,JSON.stringify(note));
  const ref={noteId:id,contentDigest,source,professionalId,assignmentRef:workspace.decision.assignment_id,grantId:request.grantId,scopes:request.scopes,createdAt:note.createdAt,action:note.action,privateObjectKey:key};await state.putIfAbsent('PROFESSIONAL_NOTE',ref);await indexNote(context,request,workspace,ref);return {...ref,reused:false};
 });
}
function noteIndex(context,request,workspace){const source=workspace.workspace.resources.previous_reports.source;return createReportGenerationStore(context.env,{environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:source.ownerRef,orderId:'NONCOMMERCIAL_PROFESSIONAL_REVIEW',reportId:'financial_notes_'+sha256Hex({source,professionalId:workspace.decision.professional_id,assignmentRef:workspace.decision.assignment_id,grantId:request.grantId,scopes:[...request.scopes].sort()}).slice(0,32),productId:'FINANCIAL_REVIEW_NOTE_INDEX'},{scope:'delivery'});}
async function indexNote(context,request,workspace,ref,status='AVAILABLE'){
 const store=await noteIndex(context,request,workspace);await store.withLock('note-index',async()=>{await readProfessionalFinancialPacket(context,request);await store.put(ref.noteId+'_RECEIPT',{...ref,status});});
}
function publicRef(ref){const {privateObjectKey,...safe}=ref;return safe;}
async function verifyObject(context,request,workspace,ref){
 if(ref.professionalId!==workspace.decision.professional_id||ref.grantId!==request.grantId||sha256Hex(ref.source)!==sha256Hex(workspace.workspace.resources.previous_reports.source))fail('PROFESSIONAL_NOTE_NOT_FOUND');
 const object=await context.env.PRIVATE_REPORTS.get(ref.privateObjectKey);if(!object)fail('PROFESSIONAL_NOTE_OBJECT_MISSING');const note=JSON.parse(await object.text()),{noteId,contentDigest,createdAt,status,...basis}=note;
 if(sha256Hex(basis)!==ref.contentDigest||contentDigest!==ref.contentDigest||noteId!==ref.noteId||basis.assignmentRef!==workspace.decision.assignment_id||JSON.stringify([...basis.scopes].sort())!==JSON.stringify([...request.scopes].sort()))fail('PROFESSIONAL_NOTE_INTEGRITY_FAILED');return note;
}
export async function listFinancialProfessionalNotes(context,request){
 const workspace=await readProfessionalFinancialPacket(context,request),source=workspace.workspace.resources.previous_reports.source,index=await noteIndex(context,request,workspace);
 // Compatibility recovery reads only receipt metadata already bound to this
 // authorised professional/client/grant/source. It never returns other clients.
 const legacy=await context.env.RUNTIME_DB.prepare("SELECT value_json FROM report_generation_state WHERE state_key='PROFESSIONAL_NOTE' AND json_extract(value_json,'$.professionalId')=? AND json_extract(value_json,'$.grantId')=? AND json_extract(value_json,'$.source.ownerRef')=? AND json_extract(value_json,'$.source.contentDigest')=?").bind(workspace.decision.professional_id,request.grantId,source.ownerRef,source.contentDigest).all();
 for(const row of legacy.results||[]){const ref=JSON.parse(row.value_json);try{const note=await verifyObject(context,request,workspace,ref);await indexNote(context,request,workspace,{...ref,assignmentRef:note.assignmentRef,scopes:note.scopes,createdAt:note.createdAt,action:note.action});}catch(e){if(e.code!=='PROFESSIONAL_NOTE_INTEGRITY_FAILED')throw e;}}
 const entries=await index.inspectStates({suffix:'_RECEIPT'}),notes=[];
 for(const {value:ref} of entries){try{const note=await verifyObject(context,request,workspace,ref);if(ref.status!=='AVAILABLE')await indexNote(context,request,workspace,ref);notes.push(publicRef({...ref,status:'AVAILABLE',createdAt:note.createdAt,action:note.action}));}catch(e){if(e.code==='PROFESSIONAL_NOTE_OBJECT_MISSING'){notes.push(publicRef({...ref,status:'RECOVERY_REQUIRED'}));continue;}throw e;}}
 await readProfessionalFinancialPacket(context,request);return notes.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
}
export async function readFinancialProfessionalNote(context,request){
 const workspace=await readProfessionalFinancialPacket(context,request),source=workspace.workspace.resources.previous_reports.source,professionalId=workspace.decision.professional_id;
 let ref;
 if(request.noteRef){const id=request.noteRef.noteId;if(!/^financial_note_[a-f0-9]{32}$/.test(id||''))fail('PROFESSIONAL_NOTE_NOT_FOUND');const index=await noteIndex(context,request,workspace);ref=await index.inspectState(id+'_RECEIPT');if(!ref||ref.contentDigest!==request.noteRef.contentDigest)fail('PROFESSIONAL_NOTE_NOT_FOUND');}
 else {const id='financial_note_'+sha256Hex({source,professionalId,noteToken:request.noteToken}).slice(0,32),state=await createReportGenerationStore(context.env,{environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:source.ownerRef,orderId:'NONCOMMERCIAL_PROFESSIONAL_REVIEW',reportId:id,productId:'FINANCIAL_REVIEW_NOTE'},{scope:'delivery'});ref=await state.inspectState('PROFESSIONAL_NOTE');if(!ref)fail('PROFESSIONAL_NOTE_NOT_FOUND');}
 const note=await verifyObject(context,request,workspace,ref);await readProfessionalFinancialPacket(context,request);await indexNote(context,request,workspace,{...ref,createdAt:note.createdAt,action:note.action});return note;
}
