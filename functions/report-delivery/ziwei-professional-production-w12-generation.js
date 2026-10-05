import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZwrProBilingualCandidateW4W8} from '../personal-reading/narrative/zwr-pro-w4-w8-pipeline.js';
import {createZwrProImmutableSnapshotW9} from '../personal-reading/narrative/zwr-pro-w9-immutable-snapshot.js';
import {buildZiweiContentDepthR3Sections} from '../personal-reading/narrative/ziwei-production-composer-r3.js';
import {buildZiweiR5AuthoringPack} from '../personal-reading/narrative/ziwei-r5-authoring-pack.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../personal-reading/ziwei-professional-publication-r5.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';

export const ZWR_PRO_W12_GENERATION_VERSION='ZWR-PRO-W12-PRODUCTION-SUCCESSOR-v1';
const IDS=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
function unavailable(code,details=null){const e=new Error(code);e.code=code;e.status=503;if(details)e.details=details;throw e;}

function publicationSections({base,pack,candidates}){
 const map=new Map(candidates.map(c=>[c.sectionId,c]));
 return base.map(section=>{
  if(!IDS.includes(section.sectionId))return section;
  const c=map.get(section.sectionId),p=pack.sections.find(x=>x.sectionId===section.sectionId);
  if(!c||!p)unavailable('ZWR_PRO_W12_SECTION_MISSING',{sectionId:section.sectionId});
  return {
   ...section,
   paragraphs:c.paragraphs.map(x=>x.text),
   claims:p.claims,
   synthesisIr:{sectionId:p.sectionId,locale:p.locale,keyInsights:p.keyInsights,primaryPalaces:p.primaryPalaces,contextPalaces:p.contextPalaces,claims:p.claims,evidenceSummary:p.evidenceSummary},
   publicationIr:{blocks:c.paragraphs.map((x,i)=>({blockId:`ZWR-PRO:${section.sectionId}:B${i+1}`,prose:x.text,claimRefs:x.claimRefs||[],supportRefs:x.supportRefs||[]}))},
   editorialVersion:'ZWR-PRO-W4-LLM-PROFESSIONAL-COMPOSER-v1',
   professionalSynthesis:{status:'PASS',source:'ZWR_PRO_W4_W8_VERIFIED'}
  };
 });
}

export async function generateZiweiProfessionalProductionW12Candidate(context,selection,deps={}){
 if(!String(context?.env?.OPENAI_API_KEY||'').trim())unavailable('ZWR_PRO_W12_OPENAI_API_KEY_REQUIRED');
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const semantic=base.snapshot.semanticContent;
 const pipeline=await buildZwrProBilingualCandidateW4W8({evidence:semantic.evidence,env:context.env});
 if(pipeline?.status!=='PASS_W4_W8')unavailable('ZWR_PRO_W12_W4_W8_UNAVAILABLE',{reason:pipeline?.reason||pipeline?.detail?.reason||null});
 const reportSnapshot=await createZwrProImmutableSnapshotW9({pipelineResult:pipeline,createdAt:base.snapshot.createdAt});
 const locale=base.locale,side=locale==='zh-Hans'?pipeline.zh:pipeline.en;
 const sectionBase=await buildZiweiContentDepthR3Sections({evidence:semantic.evidence,locale});
 const pack=await buildZiweiR5AuthoringPack({evidence:semantic.evidence,locale});
 const sections=publicationSections({base:sectionBase,pack,candidates:side.candidates});
 const report=buildZiweiProfessionalSynthesisR5Publication({evidence:{structured:semantic.evidence},sections,locale,subjectPresentation:semantic.subject});
 if(report.totalPages!==39)unavailable('ZWR_PRO_W12_PAGE_COUNT_DRIFT',{totalPages:report.totalPages});
 const snapshot=await createCustomerDeliverySnapshot({
  methodId:'ZWR',locale,
  subjectFingerprint:base.snapshot.subjectFingerprint,
  inputFingerprint:base.snapshot.inputFingerprint,
  compositionVersion:ZWR_PRO_W12_GENERATION_VERSION,
  authorityVersion:'ZIWEI-R5-AUTHORING-PACK-v2',
  claimIrVersion:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5',
  verifierVersion:'ZWR-PRO-W5+W6+W7+W8+W9',
  createdAt:base.snapshot.createdAt,
  semanticContent:{
   report,
   reportSnapshotId:reportSnapshot.reportSnapshotId,
   immutableLocaleSnapshotId:reportSnapshot.localeSnapshots[locale].semanticSnapshotId,
   sections,
   evidence:semantic.evidence,
   subjectBinding:semantic.subjectBinding,
   subject:semantic.subject
  }
 });
 const all=[...pipeline.zh.candidates,...pipeline.en.candidates];
 const providerCalls=all.reduce((n,c)=>n+Number(c.provider?.transportCalls||0),0);
 const semanticReviewCalls=all.reduce((n,c)=>n+Number(c.provider?.semanticReviewCalls||0),0);
 return {
  ...base,
  schemaVersion:'ZWR-PRO-W12-CANDIDATE-v1',
  snapshot,
  immutableReportSnapshot:reportSnapshot,
  generationSuccessor:ZWR_PRO_W12_GENERATION_VERSION,
  providerAuthority:'WRITING_ONLY',
  naturalCompositionSummary:{requested:20,passed:20,providerCalls,semanticReviewCalls,bilingualParity:true,immutableSnapshot:true},
  productionAdmissionGranted:false
 };
}
export default Object.freeze({generateZiweiProfessionalProductionW12Candidate,ZWR_PRO_W12_GENERATION_VERSION});
