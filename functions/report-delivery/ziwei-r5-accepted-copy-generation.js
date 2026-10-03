import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZiweiR5AcceptedCopySections,ZIWEI_R5_ACCEPTED_COPY_RUNTIME_VERSION} from '../personal-reading/narrative/ziwei-r5-accepted-copy-runtime.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../personal-reading/ziwei-professional-publication-r5.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';

export const ZIWEI_R5_ACCEPTED_GENERATION_VERSION='ZIWEI-R5-ACCEPTED-COPY-GENERATION-v1';

export async function generateZiweiR5AcceptedCopyCandidate(context,selection,deps={}){
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const semantic=base.snapshot.semanticContent;
 const sections=await buildZiweiR5AcceptedCopySections({evidence:semantic.evidence,locale:base.locale});
 const report=buildZiweiProfessionalSynthesisR5Publication({
  evidence:{structured:semantic.evidence},
  sections,
  locale:base.locale,
  subjectPresentation:semantic.subject
 });
 if(report.totalPages!==39)throw Error('ZIWEI_R5_ACCEPTED_COPY_PAGE_COUNT_DRIFT:'+report.totalPages);
 const snapshot=await createCustomerDeliverySnapshot({
  methodId:'ZWR',
  locale:base.locale,
  subjectFingerprint:base.snapshot.subjectFingerprint,
  inputFingerprint:base.snapshot.inputFingerprint,
  compositionVersion:ZIWEI_R5_ACCEPTED_COPY_RUNTIME_VERSION,
  authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',
  claimIrVersion:'REPORT_PUBLICATION_IR_V2',
  verifierVersion:'ZIWEI-R5-HUMAN-ACCEPTED-COPY-v1',
  createdAt:base.snapshot.createdAt,
  semanticContent:{
   report,
   sections,
   evidence:semantic.evidence,
   subjectBinding:semantic.subjectBinding,
   subject:semantic.subject
  }
 });
 return {
  ...base,
  schemaVersion:'ZWR-R5-ACCEPTED-COPY-CANDIDATE-1',
  snapshot,
  generationSuccessor:ZIWEI_R5_ACCEPTED_GENERATION_VERSION,
  providerAuthority:'NONE_RUNTIME_DETERMINISTIC',
  naturalCompositionSummary:{
   requested:10,
   passed:10,
   providerCalls:0,
   semanticReviewCalls:0,
   source:'HUMAN_ACCEPTED_FROZEN_COPY'
  },
  productionAdmissionGranted:false
 };
}
export default Object.freeze({generateZiweiR5AcceptedCopyCandidate});
