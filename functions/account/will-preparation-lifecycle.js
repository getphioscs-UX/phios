import {loadOwnedDraft} from './financial-will-draft-store.js';
import {sha256Hex} from '../document-assembly/digest.js';
import {readOwnerRegistry} from '../professional/access/financial-capability-owner.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
export async function prepareSavedWill(context,{willRef,language,signatureMethod,intendedSigningDate}){
 if(!willRef||!Number.isInteger(willRef.version)||!['en','zh-Hans'].includes(language)||signatureMethod!=null&&!['WET_INK_IN_PERSON','REMOTE','ELECTRONIC'].includes(signatureMethod)||intendedSigningDate!=null&&!/^\d{4}-\d{2}-\d{2}$/.test(intendedSigningDate))fail('WILL_CONTEXT_REQUIRED');
 const saved=await loadOwnedDraft(context,{draftId:willRef.draftId,version:willRef.version,expectedRef:willRef,kind:'WILL'});
 const jurisdictions=await readOwnerRegistry(context,'/content/legal/will/registries/will-jurisdiction-registry-v1.json'),clauses=await readOwnerRegistry(context,'/content/legal/will/registries/will-clause-registry-v1.json'),template=await readOwnerRegistry(context,'/content/document-assembly/templates/will-assembly-template-v1.json');
 const bundle=(jurisdictions.jurisdictions||[]).find(j=>j.jurisdiction===saved.payload.jurisdiction&&j.willAssemblyProductionEnabled===true);
 const blockers=[];if(!bundle?.approvedClauseBundleVersion||!bundle?.approvedExecutionRequirementVersion||!bundle?.legalAuthoritySource)blockers.push('WILL_JURISDICTION_LEGAL_APPROVAL_REQUIRED');if(template.productionEnabled!==true)blockers.push('WILL_TEMPLATE_NOT_APPROVED');if(!(clauses.clauses||[]).length||(clauses.clauses||[]).some(c=>!c.approvedText||c.approvalStatus!=='APPROVED_TEMPLATE_COMPONENT'))blockers.push('WILL_APPROVED_CLAUSE_TEXT_REQUIRED');
 // This adapter does not claim raw private labels are approved legal identity.
 blockers.push('WILL_LEGAL_IDENTITY_AND_CASE_ASSESSMENT_BINDING_REQUIRED');
 if(!signatureMethod||!intendedSigningDate)blockers.push('WILL_SIGNING_CONTEXT_NOT_DECLARED');
 const contextBody={source:saved.savedDraftRef,language,signatureMethod:signatureMethod||null,intendedSigningDate:intendedSigningDate||null,templateVersion:template.templateVersion,templateDigest:sha256Hex(template),clauseRegistryDigest:sha256Hex(clauses),jurisdictionRegistryDigest:sha256Hex(jurisdictions)};
 return {source:saved.savedDraftRef,preparation:{sections:saved.payload.sections,financialSource:saved.payload.financialSource||null,intentionsPreserved:true},assemblyContext:contextBody,assemblyContextDigest:sha256Hex(contextBody),signingPreviewAllowed:false,signingExportAllowed:false,blockers,legalValidity:'NOT_DETERMINED',executedWillCreated:false};
}
export async function recordSavedWillEvent(context,{willRef,eventCode,evidenceRef}){
 const saved=await loadOwnedDraft(context,{draftId:willRef?.draftId,version:willRef?.version,expectedRef:willRef,kind:'WILL'});
 if(!['INFORMATION_DOWNLOADED','CUSTOMER_READ','CUSTOMER_DECLARED_SIGNED','PROFESSIONAL_VERIFIED_EXECUTION'].includes(eventCode))fail('WILL_EVENT_INVALID');
 if(eventCode==='PROFESSIONAL_VERIFIED_EXECUTION'&&context.data?.professionalExecutionVerification?.verified!==true)fail('PROFESSIONAL_EXECUTION_EVIDENCE_REQUIRED');
 if(eventCode==='PROFESSIONAL_VERIFIED_EXECUTION'&&(!evidenceRef||context.data.professionalExecutionVerification.evidenceRef!==evidenceRef))fail('PROFESSIONAL_EXECUTION_EVIDENCE_REQUIRED');
 if(eventCode==='PROFESSIONAL_VERIFIED_EXECUTION'){
  const v=context.data.professionalExecutionVerification;
  if(v.sourceRef!==saved.savedDraftRef.sourceRef||v.sourceDigest!==saved.savedDraftRef.contentDigest||!v.professionalId||!v.receiptRef||!Number.isFinite(Date.parse(v.expiresAt))||Date.parse(v.expiresAt)<=Date.now())fail('PROFESSIONAL_EXECUTION_SOURCE_AUTHORITY_REQUIRED');
 }
 const binding={environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:saved.savedDraftRef.ownerRef,orderId:'WILL_PREPARATION_EVENTS',reportId:saved.savedDraftRef.sourceRef,productId:'WILL_PREPARATION'};
 const store=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 return store.withLock('will-events',async()=>{const events=await store.get('WILL_EVENTS')||[];const event={eventId:crypto.randomUUID(),source:saved.savedDraftRef,eventCode,evidenceRef:evidenceRef||null,occurredAt:new Date().toISOString(),legalValidity:'NOT_DETERMINED',signatureClaim:eventCode==='CUSTOMER_DECLARED_SIGNED'?'CUSTOMER_DECLARATION_ONLY':null};events.push(event);await store.put('WILL_EVENTS',events);return event;});
}
