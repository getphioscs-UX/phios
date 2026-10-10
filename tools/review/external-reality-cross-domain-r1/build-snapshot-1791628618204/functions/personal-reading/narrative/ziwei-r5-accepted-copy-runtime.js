import {buildZiweiContentDepthR3Sections} from './ziwei-production-composer-r3.js';
import {buildZiweiSynthesisIrR5,ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION} from './ziwei-professional-synthesis-r5.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from './report-publication-ir-v2.js';
import {resolveZiweiR5AcceptedCopy} from './ziwei-r5-accepted-copy.generated.js';

export const ZIWEI_R5_ACCEPTED_COPY_RUNTIME_VERSION='ZIWEI-R5-ACCEPTED-COPY-RUNTIME-v1';
export const ZIWEI_R5_ACCEPTED_REFERENCE_SUBJECT='ZPA-CONTROLLED-01';
const NATURAL=new Set(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);

export async function buildZiweiR5AcceptedCopySections({evidence,locale}={}){
 if((evidence?.structured||evidence)?.subjectId!==ZIWEI_R5_ACCEPTED_REFERENCE_SUBJECT)throw Error('ZIWEI_R5_ACCEPTED_COPY_REFERENCE_ONLY');
 const accepted=resolveZiweiR5AcceptedCopy(locale);
 if(accepted.humanDecision!=='ACCEPT'||accepted.productionUse!==false)throw Error('ZIWEI_R5_ACCEPTED_COPY_NOT_FROZEN');
 const base=await buildZiweiContentDepthR3Sections({evidence,locale});
 const acceptedById=new Map(accepted.sections.map(s=>[s.id,s]));
 const prior=[],out=[];
 for(const section of base){
  if(!NATURAL.has(section.sectionId)){
   out.push({...section,editorialVersion:ZIWEI_R5_ACCEPTED_COPY_RUNTIME_VERSION,humanDecision:'ACCEPTED_BASE_STRUCTURE'});
   continue;
  }
  const frozen=acceptedById.get(section.sectionId);
  if(!frozen||!Array.isArray(frozen.paragraphs)||!frozen.paragraphs.length)throw Error('ZIWEI_R5_ACCEPTED_COPY_SECTION_MISSING:'+section.sectionId);
  const synthesisIr=await buildZiweiSynthesisIrR5({evidence,section,locale,priorSynthesis:prior});
  prior.push(synthesisIr);
  const claimRefs=section.claims.map(c=>c.claimId);
  const candidate={blocks:frozen.paragraphs.map((text,i)=>({role:'ACCEPTED_LONGFORM',text,claimRefs}))};
  const publicationIr=await buildReportPublicationIrV2({
   methodId:'ZWR',
   reportVersion:ZIWEI_R5_ACCEPTED_COPY_RUNTIME_VERSION,
   sectionKey:section.sectionId,
   locale,
   brief:section.brief,
   candidate,
   semanticOwner:'ZIWEI_PRO_R2_AUTHORITY_V2',
   compositionOwner:'HUMAN_ACCEPTED_FROZEN_COPY',
   snapshotLineage:{acceptedCopySchema:accepted.schemaVersion,humanDecision:accepted.humanDecision}
  });
  if(!assertPublicationIrV2Preservation({publicationIr,brief:section.brief}).accepted)throw Error('ZIWEI_R5_ACCEPTED_COPY_IR_PRESERVATION_FAILED:'+section.sectionId);
  out.push({
   ...section,
   title:frozen.title,
   synthesisIr,
   publicationIr,
   paragraphs:frozen.paragraphs,
   editorialVersion:ZIWEI_R5_ACCEPTED_COPY_RUNTIME_VERSION,
   acceptedCopy:{schemaVersion:accepted.schemaVersion,humanDecision:'ACCEPT',locale,title:frozen.title},
   professionalSynthesis:{
    status:'PASS',
    composerStatus:'FROZEN_ACCEPTED_COPY',
    providerCalled:false,
    verificationAccepted:true,
    editorialQuality:{accepted:true,reasons:[]},
    actualTier:'DETERMINISTIC_ACCEPTED_COPY',
    model:null,
    semanticReviewCalls:0,
    transportCalls:0,
    compositionDigest:publicationIr.publicationIrDigest
   },
   humanDecision:'ACCEPT',
   productionAdmissionGranted:false
  });
 }
 if(out.filter(s=>NATURAL.has(s.sectionId)&&s.humanDecision==='ACCEPT').length!==10)throw Error('ZIWEI_R5_ACCEPTED_COPY_10_OF_10_REQUIRED');
 return out;
}
export default Object.freeze({buildZiweiR5AcceptedCopySections});
