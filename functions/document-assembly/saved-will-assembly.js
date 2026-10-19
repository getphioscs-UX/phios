import {loadOwnedDraft} from '../account/financial-will-draft-store.js';
import {readOwnerRegistry} from '../professional/access/financial-capability-owner.js';
import {assembleDocument} from './document-assembler.js';
import {validateDocument} from './document-validator.js';
import {evaluateWillEscalation} from '../legal/will/escalation-gate.js';
import {evaluateHumanReview} from './human-review-gate.js';
import {renderDarHtml} from './renderers/dar-html-renderer.js';
import {renderDarDocx} from './renderers/dar-docx-renderer.js';
import {renderFontAwareDarPdf} from './renderers/dar-font-pdf-adapter.js';
import {createDocumentExportVersion} from './document-version.js';
import {sha256Hex} from './digest.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
async function assembly(context,request,{testPackage}={}){
 const ref=request.willRef;if(!ref||!Number.isInteger(ref.version))fail('EXACT_WILL_SOURCE_REQUIRED');
 const source=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:'WILL'});
 let p;
 if(testPackage){if(context.env.PHIOS_ENVIRONMENT!=='local-test'||testPackage.testOnly!==true)fail('TEST_ONLY_WILL_PACKAGE_FORBIDDEN');p=testPackage;}
 else p={template:await readOwnerRegistry(context,'/content/document-assembly/templates/will-assembly-template-v1.json'),clauses:await readOwnerRegistry(context,'/content/legal/will/registries/will-clause-registry-v1.json'),rules:await readOwnerRegistry(context,'/content/legal/will/registries/will-clause-selection-rules-v1.json'),jurisdictions:await readOwnerRegistry(context,'/content/legal/will/registries/will-jurisdiction-registry-v1.json')};
 const assessment=context.data?.willLegalIdentityAssessment;
 if(!assessment||assessment.sourceRef!==source.savedDraftRef.sourceRef||assessment.sourceDigest!==source.digest||!assessment.receiptRef||!Number.isFinite(Date.parse(assessment.expiresAt))||Date.parse(assessment.expiresAt)<=Date.now()||assessment.legalIdentityVerified!==true||!assessment.input)fail('WILL_OWNER_CASE_IDENTITY_ASSESSMENT_REQUIRED');
 const jurisdiction=(p.jurisdictions.jurisdictions||[]).find(j=>j.jurisdiction===assessment.input.jurisdiction);
 if(p.template.productionEnabled!==true||jurisdiction?.status!=='PRODUCTION_APPROVED'||jurisdiction.willAssemblyProductionEnabled!==true||!jurisdiction.approvedClauseBundleVersion||!jurisdiction.approvedExecutionRequirementVersion||!jurisdiction.legalAuthoritySource)fail('WILL_APPROVED_PACKAGE_REQUIRED');
 if(!Array.isArray(jurisdiction.languages)||!jurisdiction.languages.includes(request.language)||!Array.isArray(jurisdiction.signatureMethods)||!jurisdiction.signatureMethods.includes(request.signatureMethod)||!jurisdiction.reviewValidUntil||jurisdiction.reviewValidUntil<new Date().toISOString().slice(0,10))fail('WILL_PACKAGE_LANGUAGE_METHOD_REVIEW_REQUIRED');
 if(assessment.language!==request.language||assessment.signatureMethod!==request.signatureMethod||assessment.intendedSigningDate!==request.intendedSigningDate)fail('WILL_CASE_CONTEXT_MISMATCH');
 const contextBody={source:source.savedDraftRef,assessmentReceipt:assessment.receiptRef,assessmentInputDigest:sha256Hex(assessment.input),language:request.language,signatureMethod:request.signatureMethod,intendedSigningDate:request.intendedSigningDate,packageDigest:sha256Hex(p)};
 const contextDigest=sha256Hex(contextBody),input={...structuredClone(assessment.input),language:request.language,assemblyContextDigest:contextDigest};
 const ir=assembleDocument({input,template:p.template,clauseRegistry:p.clauses,selectionRules:p.rules,jurisdictionRegistry:p.jurisdictions});
 const validation=validateDocument({ir,input,clauseRegistry:p.clauses,jurisdictionRegistry:p.jurisdictions}),escalation=evaluateWillEscalation(input,p.jurisdictions);
 if(ir.assemblyStatus!=='DOCUMENT_CANDIDATE'||validation.status!=='PASS'||escalation.status!=='CLEAR')fail('WILL_ASSEMBLY_VALIDATION_REQUIRED');
 return {source:source.savedDraftRef,ir,validation,escalation,contextDigest,contextBody};
}
async function store(context,source){return createReportGenerationStore(context.env,{environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:source.ownerRef,orderId:'WILL_ASSEMBLY_REVIEW',reportId:source.sourceRef,productId:'WILL_TEMPLATE_ASSEMBLY'},{scope:'delivery'});}
export async function previewSavedWillAssembly(context,request,options){const a=await assembly(context,request,options);return {source:a.source,assemblyDigest:a.ir.assemblyDigest,contextDigest:a.contextDigest,html:renderDarHtml(a.ir),confirmationRequired:true,executed:false};}
export async function confirmSavedWillAssembly(context,request,options){const a=await assembly(context,request,options);if(request.assemblyDigest!==a.ir.assemblyDigest||request.contextDigest!==a.contextDigest)fail('WILL_CONFIRMATION_CONTEXT_DRIFT');const confirmation=evaluateHumanReview({...a,confirmations:request.confirmations});if(confirmation.status!=='APPROVED_FOR_EXPORT')fail('WILL_EXACT_ASSEMBLY_CONFIRMATIONS_REQUIRED');const state=await store(context,a.source);return state.withLock('will-confirmation',async()=>{await state.putIfAbsent(`CONFIRM:${a.contextDigest}`,confirmation);return {contextDigest:a.contextDigest,confirmation};});}
export async function exportSavedWillAssembly(context,request,options){
 const a=await assembly(context,request,options);if(request.contextDigest!==a.contextDigest)fail('WILL_EXPORT_CONTEXT_DRIFT');
 const state=await store(context,a.source);return state.withLock('will-export',async()=>{
  const confirmation=await state.get(`CONFIRM:${a.contextDigest}`);if(confirmation?.assemblyDigest!==a.ir.assemblyDigest||confirmation.status!=='APPROVED_FOR_EXPORT')fail('WILL_EXACT_ASSEMBLY_CONFIRMATION_REQUIRED');
  let bytes;if(request.format==='DOCX')bytes=renderDarDocx(a.ir);else if(request.format==='PDF')bytes=await renderFontAwareDarPdf(context,a.ir,{localRenderer:options?.localRenderer});else fail('WILL_EXPORT_FORMAT_INVALID');
  const key=`EXPORT:${a.contextDigest}:${request.format}`,prior=await state.get(key),createdAt=new Date().toISOString();const version=createDocumentExportVersion({documentId:a.source.draftId,ir:a.ir,format:request.format,artifactBytes:bytes,exportAuthorization:confirmation,createdAt,previousVersion:prior});
  if(!prior)await state.putIfAbsent(key,version.version);return {bytes,version:prior||version.version,executed:false,legalValidity:'NOT_DETERMINED'};
 });
}
