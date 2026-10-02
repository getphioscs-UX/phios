import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZiweiProfessionalSynthesisR5,ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION} from '../personal-reading/narrative/ziwei-professional-synthesis-r5.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../personal-reading/narrative/ziwei-r5-provider-registry.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../personal-reading/ziwei-professional-publication-r5.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from '../personal-reading/narrative/report-section-semantic-verifier.js';

export const ZIWEI_R5_GENERATION_VERSION='ZIWEI-PROFESSIONAL-SYNTHESIS-R5-GENERATION-v1';
const NATURAL=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
function unavailable(code,details=null){const e=new Error(code);e.code=code;e.status=503;if(details)e.details=details;throw e;}
function assertR5(sections){
 const rows=sections.filter(s=>NATURAL.includes(s.sectionId));
 const failed=rows.filter(s=>s.professionalSynthesis?.status!=='PASS'||s.professionalSynthesis?.composerStatus!=='PASS'||s.professionalSynthesis?.providerCalled!==true||s.professionalSynthesis?.verificationAccepted!==true||s.professionalSynthesis?.editorialQuality?.accepted!==true||s.professionalSynthesis?.actualTier!=='T3_GOVERNED_DEEP_COMPOSITION'||s.professionalSynthesis?.model!=='gpt-5.6-sol'||!(s.professionalSynthesis?.semanticReviewCalls>0)||!(s.professionalSynthesis?.transportCalls>1)||!s.professionalSynthesis?.compositionDigest);
 if(rows.length!==NATURAL.length||failed.length)unavailable('ZIWEI_R5_SYNTHESIS_UNAVAILABLE',{sections:failed.map(s=>({sectionId:s.sectionId,status:s.professionalSynthesis?.status||null,reasons:s.professionalSynthesis?.editorialQuality?.reasons||[],fallbackReason:s.professionalSynthesis?.fallbackReason||null}))});
 return rows;
}
export async function generateZiweiProfessionalSynthesisR5Candidate(context,selection,deps={}){
 if(!String(context?.env?.OPENAI_API_KEY||'').trim())unavailable('ZIWEI_R5_OPENAI_API_KEY_REQUIRED');
 const base=await generateZiweiProductionCandidate(context,selection,deps),semantic=base.snapshot.semanticContent;
 const sections=await buildZiweiProfessionalSynthesisR5({evidence:semantic.evidence,locale:base.locale,registry:ZIWEI_R5_PAI_REGISTRY,env:context.env,requestIdPrefix:'ZIWEI-R5-'+base.personId});
 const natural=assertR5(sections);
 const report=buildZiweiProfessionalSynthesisR5Publication({evidence:{structured:semantic.evidence},sections,locale:base.locale,subjectPresentation:semantic.subject});
 if(report.totalPages!==39)unavailable('ZIWEI_R5_PAGE_COUNT_DRIFT',{totalPages:report.totalPages});
 const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale:base.locale,subjectFingerprint:base.snapshot.subjectFingerprint,inputFingerprint:base.snapshot.inputFingerprint,compositionVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',claimIrVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,createdAt:base.snapshot.createdAt,semanticContent:{report,sections,evidence:semantic.evidence,subjectBinding:semantic.subjectBinding,subject:semantic.subject}});
 return {...base,schemaVersion:'ZWR-PROFESSIONAL-SYNTHESIS-R5-CANDIDATE-1',snapshot,generationSuccessor:ZIWEI_R5_GENERATION_VERSION,providerAuthority:'WRITING_ONLY',naturalCompositionSummary:{requested:NATURAL.length,passed:natural.length,providerCalls:natural.reduce((n,s)=>n+(s.professionalSynthesis?.transportCalls||0),0),semanticReviewCalls:natural.reduce((n,s)=>n+(s.professionalSynthesis?.semanticReviewCalls||0),0)},productionAdmissionGranted:false};
}
export default Object.freeze({generateZiweiProfessionalSynthesisR5Candidate});
