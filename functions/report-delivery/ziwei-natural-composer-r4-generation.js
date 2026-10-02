// Governed Zi Wei R4 successor. Frozen Production V1 remains unchanged.
// This lane is admitted only by the existing local/qa/preview identity boundary.
import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZiweiNaturalComposerR4,ZIWEI_NATURAL_COMPOSER_R4_VERSION} from '../personal-reading/narrative/ziwei-natural-composer-r4.js';
import {ZIWEI_R4_PAI_REGISTRY} from '../personal-reading/narrative/ziwei-r4-provider-registry.js';
import {buildZiweiContentDepthR3Publication} from '../personal-reading/ziwei-production-publication-r3.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from '../personal-reading/narrative/report-section-semantic-verifier.js';

export const ZIWEI_R4_GENERATION_VERSION='ZIWEI-NATURAL-COMPOSER-R4-GENERATION-v1';
const NATURAL_SECTIONS=Object.freeze(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
function unavailable(code){
 const error=new Error(code);error.code=code;error.status=503;throw error;
}
function assertLiveR4(sections){
 const rows=sections.filter(section=>NATURAL_SECTIONS.includes(section.sectionId));
 if(rows.length!==NATURAL_SECTIONS.length)unavailable('ZIWEI_R4_SECTION_SET_INCOMPLETE');
 const failed=rows.filter(section=>section.naturalComposition?.status!=='PASS'
  ||section.naturalComposition?.providerCalled!==true
  ||section.naturalComposition?.verificationAccepted!==true
  ||!section.naturalComposition?.compositionDigest);
 if(failed.length){
  const error=new Error('ZIWEI_R4_COMPOSITION_UNAVAILABLE');
  error.code='ZIWEI_R4_COMPOSITION_UNAVAILABLE';error.status=503;
  error.details={sections:failed.map(section=>({sectionId:section.sectionId,status:section.naturalComposition?.status||null,fallbackReason:section.naturalComposition?.fallbackReason||null}))};
  throw error;
 }
 return rows;
}

export async function generateZiweiNaturalComposerR4Candidate(context,selection,deps={}){
 if(!String(context?.env?.OPENAI_API_KEY||'').trim())unavailable('ZIWEI_R4_OPENAI_API_KEY_REQUIRED');
 // Reuse the frozen V1 trusted identity / entitlement / canonical-person /
 // calculation / cover-binding lane. Its deterministic prose is discarded.
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const semantic=base.snapshot.semanticContent;
 const sections=await buildZiweiNaturalComposerR4({
  evidence:semantic.evidence,
  locale:base.locale,
  registry:ZIWEI_R4_PAI_REGISTRY,
  env:context.env,
  requestIdPrefix:`ZIWEI-R4-${base.personId}`
 });
 const natural=assertLiveR4(sections);
 const report=buildZiweiContentDepthR3Publication({
  evidence:{structured:semantic.evidence},
  sections,
  locale:base.locale,
  subjectPresentation:semantic.subject
 });
 const snapshot=await createCustomerDeliverySnapshot({
  methodId:'ZWR',
  locale:base.locale,
  subjectFingerprint:base.snapshot.subjectFingerprint,
  inputFingerprint:base.snapshot.inputFingerprint,
  compositionVersion:ZIWEI_NATURAL_COMPOSER_R4_VERSION,
  authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',
  claimIrVersion:'REPORT_PUBLICATION_IR_V2',
  verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,
  createdAt:base.snapshot.createdAt,
  semanticContent:{
   report,sections,evidence:semantic.evidence,
   subjectBinding:semantic.subjectBinding,subject:semantic.subject
  }
 });
 return {
  ...base,
  schemaVersion:'ZWR-NATURAL-COMPOSER-R4-CANDIDATE-1',
  snapshot,
  generationSuccessor:ZIWEI_R4_GENERATION_VERSION,
  providerAuthority:'WRITING_ONLY',
  naturalCompositionSummary:{
   requested:NATURAL_SECTIONS.length,
   passed:natural.length,
   providerCalls:natural.reduce((sum,s)=>sum+(s.naturalComposition?.transportCalls||0),0),
   semanticReviewCalls:natural.reduce((sum,s)=>sum+(s.naturalComposition?.semanticReviewCalls||0),0)
  },
  productionAdmissionGranted:false
 };
}
export default Object.freeze({generateZiweiNaturalComposerR4Candidate});
