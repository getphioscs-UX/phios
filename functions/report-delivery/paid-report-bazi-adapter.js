import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {buildCustomerNativeBaziInputs} from './bazi-customer-native-inputs.js';
import {buildBaziProductionGenerationConfig} from '../personal-reading/deep-manuscript/bazi-production-generation-config.js';
import {generateAndReleaseAccountBazi,openAccountBaziMaterial,inspectAccountBaziDeliveryProgress} from '../account/bazi-account-delivery.js';
import {reportEconomics,reportFollowupReserve,reportGenerationCeiling} from '../pws/commercial/commerce-economics-policy.js';
import {commerceProduct} from '../pws/commercial/stripe-product-registry.js';
import {closeReleasedReportBudget} from '../personal-reading/report-delivery-budget.js';
import {grantDeliveredReportFollowups} from '../account/report-followup-store.js';
import {buildBaziDeepDiagrams} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js';
import {expectedBaziDiagramTopology} from '../personal-reading/publication-fit/bazi-publication-fit-gate.js';
const productId='COM-REPORT-BAZI-FULL';
export const baziPaidReportAdapter=Object.freeze({
 version:'P8-BZR-ADAPTER-1',supportedPresentations:['en','zh-Hans','bilingual'],generationPolicy:{normalCalls:3,technicalRecoveryCalls:2,semanticVerifierCalls:0,editorialRewriteCalls:0},recoveryPolicy:{maximumAttempts:2,rescue:true},costPolicy:reportEconomics(productId),followupPolicy:{includedQuestions:4,reserveUsd:reportFollowupReserve(productId),generationCeilingUsd:reportGenerationCeiling(productId)},
 async readiness(context,intent){
  const subject=await loadCanonicalPersonSubject(context.env,intent.ownerAccountId,intent.personId);
  const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:subject.canonicalBirthInput,executionParameters:{traditionalCalculationSex:subject.calculationSex},consentRecordId:subject.methodConsent.consentId,requestId:`BAZI-CANDIDATE:${subject.person.personId}:v${subject.personVersion}`};
  const execution=await executeAndProjectMcd5CurrentRequest(request);
  if(execution.canonicalProjection?.calculation?.status!=='COMPLETE')throw Object.assign(Error('INPUT_CLASS_UNSUPPORTED'),{responsibilityOwner:'METHOD_SCOPE'});
  const prepared={customerId:intent.ownerAccountId,personId:intent.personId,personVersion:subject.personVersion,canonicalBirthInputFingerprint:await reportBirthInputFingerprint(subject.canonicalBirthInput),calculationDigest:await sha256Stable(execution.canonicalProjection),execution};
  const native=await buildCustomerNativeBaziInputs(context,prepared),config=context.env.BAZI_REPORT_GENERATION_CONFIG||buildBaziProductionGenerationConfig();
  const diagrams=await buildBaziDeepDiagrams(native.pack);expectedBaziDiagramTopology(diagrams);if(diagrams.length!==15)throw Error('PUBLICATION_PREFLIGHT_INCOMPLETE');
  return {inputValid:true,calculationReady:true,authorityReady:true,publicationPreflightReady:true,rendererReady:!!context.env.METHOD_REPORT_RENDERER?.fetch,productionConfigReady:!!config.approval?.productionFrozen&&!!config.model&&!!config.policy,commercialProductReady:commerceProduct(productId).active===true,personVersion:subject.personVersion,inputDigest:prepared.canonicalBirthInputFingerprint,authorityDigest:native.pack.digest};
 },
 // The accepted owner already performs atomic generation -> validation -> compose
 // -> verified rendering -> immutable release -> budget/followups. Preserve it.
 // Subsequent shared checkpoints verify its persisted outputs, never recompute them.
 async prepare(context,job){const fresh=await this.readiness(context,{...job});if(fresh.personVersion!==job.personVersion||fresh.inputDigest!==job.inputDigest||fresh.authorityDigest!==job.authorityDigest)throw Error('SUBJECT_AUTHORITY_MISMATCH');return {personId:job.personId,locale:job.presentation.reportLocale};},
 async generate(context,job,selection){const released=await generateAndReleaseAccountBazi(context,selection,context.env.P8_BAZI_QA_OPTIONS||{});return {reportId:released.reportId};},
 async inspectDurableProgress(context,job){try{const p=await inspectAccountBaziDeliveryProgress(context,job);if(p.material){await this.validate(context,job,{reportId:p.material.row.report_id});const e=await context.env.RUNTIME_DB.prepare("SELECT entitlement_id FROM digital_entitlements WHERE purchase_id=? AND customer_id=? AND product_id=? AND entitlement_status='active'").bind(job.purchaseId,job.ownerAccountId,job.productId).first();if(e?.entitlement_id!==p.material.artifact?.entitlementId)throw Error('ENTITLEMENT_MISMATCH');}return {...p,materialVerified:!!p.material,renderVerified:!!p.render,publicationVerified:!!p.publication,generationVerified:!!p.result?.snapshot};}catch(error){if(/INTEGRITY|REPORT_UNAVAILABLE|ARTIFACT/.test(error.code||error.message))return {materialInvalid:true,locks:[],stores:{},integrityError:error.code||error.message};throw error;}},
 async resumeFrom(context,job){return this.generate(context,job,{personId:job.personId,locale:job.presentation.reportLocale});},
 async validate(context,job,output){const m=await openAccountBaziMaterial(context,output.reportId);if(m.row.person_id!==job.personId||m.candidate.purchaseId!==job.purchaseId||m.row.locale!==job.presentation.reportLocale)throw Error('SUBJECT_OR_PURCHASE_MISMATCH');return output;},
 async compile(context,job,output){const m=await openAccountBaziMaterial(context,output.reportId);if(!m.artifact?.publicationIR?.customerPublishable)throw Error('PUBLICATION_NOT_COMPLETE');return output;},
 async render(context,job,output){const m=await openAccountBaziMaterial(context,output.reportId);if(m.verification.passed!==true||m.verification.pageCount!==48||m.verification.diagramCount!==15)throw Error('RENDER_NOT_VERIFIED');return output;},
 async release(context,job,output){return this.validate(context,job,output);},
 async reconcile(context,job){const row=await context.env.RUNTIME_DB.prepare('SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND person_id=? AND method_code=?').bind(job.ownerAccountId,job.personId,'BZR').all();for(const r of row.results){const m=await openAccountBaziMaterial(context,r.report_id);if(m.candidate.purchaseId===job.purchaseId){await closeReleasedReportBudget(context,{candidate:m.candidate,release:{reportId:r.report_id},receipt:m.verification});await grantDeliveredReportFollowups(context.env,{reportId:r.report_id,ownerAccountId:job.ownerAccountId,purchaseId:job.purchaseId,methodCode:'BZR'});return {reportId:r.report_id};}}return null;},
 async reopen(context,job,output){return openAccountBaziMaterial(context,output.reportId);},
 async verifyDelivered(context,job,output){const m=await this.reopen(context,job,output);if(m.row.person_id!==job.personId||m.row.locale!==job.presentation.reportLocale||m.candidate.purchaseId!==job.purchaseId)throw Error('MATERIAL_IDENTITY_MISMATCH');const entitlement=await context.env.RUNTIME_DB.prepare("SELECT entitlement_id FROM digital_entitlements WHERE purchase_id=? AND customer_id=? AND product_id=? AND entitlement_status='active'").bind(job.purchaseId,job.ownerAccountId,job.productId).first();if(!entitlement||entitlement.entitlement_id!==m.artifact.entitlementId)throw Error('ENTITLEMENT_MISMATCH');const closed=await closeReleasedReportBudget(context,{candidate:m.candidate,release:{reportId:output.reportId},receipt:m.verification});if(closed?.budgetDelivered!==true)throw Error('BUDGET_CLOSURE_REQUIRED');const grant=await context.env.RUNTIME_DB.prepare('SELECT included_questions FROM account_report_followup_grants WHERE report_id=? AND owner_account_id=? AND purchase_id=?').bind(output.reportId,job.ownerAccountId,job.purchaseId).first();if(grant?.included_questions!==4)throw Error('FOLLOWUP_GRANT_REQUIRED');return true;}
});
