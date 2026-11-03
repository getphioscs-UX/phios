import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {generateAndReleaseAccountZiwei,openAccountZiweiMaterial} from '../account/ziwei-account-delivery.js';
import {downloadAccountZiweiPdf} from '../account/ziwei-pdf-delivery.js';
import {buildZiweiReportEvidence} from '../personal-reading/narrative/ziwei-publication-adapter.js';
import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
import {requireZwrVfrProfile,requireZwrVfrGenerationAdmission} from './ziwei-vfr-profile-policy.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {reportEconomics} from '../pws/commercial/commerce-economics-policy.js';
import {commerceProduct} from '../pws/commercial/stripe-product-registry.js';
const productId='COM-REPORT-ZIWEI-FULL';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const locale=job=>job.presentation.reportLocale==='bilingual'?'zh-Hans':job.presentation.reportLocale;
// Bridges the existing native/composer/publication/account owners. Commercial
// admission stays false in the registry; no synthetic source is a default.
export const ziweiPaidReportAdapter=Object.freeze({
 version:'ZWR-SHARED-PAID-ADAPTER-R2',methodCode:'ZWR',productId,
 supportedPresentations:['en','zh-Hans','bilingual'],recoveryPolicy:{maximumAttempts:2,rescue:true},costPolicy:reportEconomics(productId),
 async readiness(context,intent){
  const subject=await loadCanonicalPersonSubject(context.env,intent.ownerAccountId,intent.personId);
  // Observation time must survive the same Checkout -> Job snapshot contract.
  // Until that owner supplies it, deny explicitly instead of substituting today.
  if(!intent.targetContext)fail('ZWR_ORDER_OBSERVATION_CONTEXT_NOT_BOUND');
  const targetContext=resolveZiweiLiveTargetContext(intent.targetContext),input={...subject.canonicalBirthInput,locale:locale(intent)};
  const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:input.consent.purposeCode,canonicalInput:input,executionParameters:{traditionalCalculationSex:subject.calculationSex},consentRecordId:subject.methodConsent.consentId,requestId:'ZWR-PAID-PREFLIGHT:'+intent.personId+':'+subject.personVersion};
  const evidence=await buildZiweiReportEvidence({subjectId:intent.personId,executionRequest:request,targetContext,locale:input.locale});
  requireZwrVfrProfile();await requireZwrVfrGenerationAdmission(context.env);
  // Generation's existing provider guard still requires a durable paid-context
  // bridge. Do not report that known-unconnected owner as ready.
  return {inputValid:true,calculationReady:true,authorityReady:true,publicationPreflightReady:true,rendererReady:!!context.env.METHOD_REPORT_RENDERER?.fetch,productionConfigReady:false,commercialProductReady:commerceProduct(productId).active===true,personVersion:subject.personVersion,inputDigest:await sha256Stable({birth:subject.canonicalBirthInput,targetContext}),authorityDigest:await sha256Stable(evidence.structured)};
 },
 async prepare(context,job){const fresh=await this.readiness(context,job);if(fresh.personVersion!==job.personVersion||fresh.inputDigest!==job.inputDigest||fresh.authorityDigest!==job.authorityDigest)fail('ZWR_SUBJECT_AUTHORITY_MISMATCH');return {personId:job.personId,locale:locale(job),targetContext:resolveZiweiLiveTargetContext(job.targetContext)};},
 async generate(context,job,selection){const result=await generateAndReleaseAccountZiwei(context,selection);return {reportId:result.reportId};},
 async validate(context,job,output){const material=await openAccountZiweiMaterial(context,output.reportId);if(personIdentity(context).userId!==job.ownerAccountId||material.candidate.customerId!==job.ownerAccountId||material.candidate.purchaseId!==job.purchaseId||material.candidate.personId!==job.personId||material.candidate.snapshot.methodId!=='ZWR'||material.candidate.locale!==locale(job))fail('ZWR_MATERIAL_IDENTITY_MISMATCH');return output;},
 async compile(context,job,output){await this.validate(context,job,output);const m=await openAccountZiweiMaterial(context,output.reportId);if(!m.candidate.visualFirst||!m.candidate.snapshot.semanticContent.visualReportIr)fail('ZWR_PUBLICATION_NOT_COMPLETE');return output;},
 async render(context,job,output){await this.validate(context,job,output);const m=await openAccountZiweiMaterial(context,output.reportId),receipt=JSON.parse(m.row.verifier_receipt);if(receipt.passed!==true||receipt.diagramCount!==15||!Number.isSafeInteger(receipt.pageCount)||receipt.pageCount<1)fail('ZWR_RENDER_NOT_VERIFIED');return output;},
 async release(context,job,output){await this.compile(context,job,output);await this.render(context,job,output);return output;},
 async reconcile(context,job){const rows=await context.env.RUNTIME_DB.prepare("SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND person_id=? AND method_code='ZWR'").bind(job.ownerAccountId,job.personId).all();for(const row of rows.results){const m=await openAccountZiweiMaterial(context,row.report_id);if(m.candidate.purchaseId===job.purchaseId){const output={reportId:row.report_id};await this.verifyDelivered(context,job,output);return output;}}return null;},
 async verifyDelivered(context,job,output){await this.validate(context,job,output);await this.render(context,job,output);const response=await downloadAccountZiweiPdf(context,output.reportId);if(!response.headers.get('content-type')?.startsWith('application/pdf'))fail('ZWR_PDF_DELIVERY_REQUIRED');const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length<1000||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')fail('ZWR_PDF_DELIVERY_REQUIRED');return true;},
 async resumeFrom(context,job){const prior=await this.reconcile(context,job);return prior||this.generate(context,job,await this.prepare(context,job));},
 async reopen(context,job,output){await this.verifyDelivered(context,job,output);return openAccountZiweiMaterial(context,output.reportId);},
 downloadPdf:downloadAccountZiweiPdf
});
