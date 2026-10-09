import {BAZI_SECTION_REGISTRY} from '../canonical-presentation-runtime/report-section-contract.js';
import {SECTIONS as BDM_SECTIONS} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
import {verifyReportSectionComposition,REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from '../personal-reading/narrative/report-section-semantic-verifier.js';
import {deepFreeze,sha256Stable} from '../interpretation-runtime/mir7-utils.js';

export const BAZI_CHAPTER_SCHEMAS=Object.freeze({legacy:'BAZI_SECTION_REGISTRY',deep:'BDM-S02-S10'});
const DEEP_KEYS=Object.freeze(['CORE_CAPABILITY','LIFE_STRUCTURE','CAREER','WEALTH','RELATIONSHIP','FAMILY_SUPPORT','PRESSURE_VULNERABILITY','LONG_TERM_CYCLES','CURRENT_TIMING']);
export const BAZI_CHAPTER_CROSSWALK=deepFreeze(BDM_SECTIONS.map((s,i)=>({
 deepId:s.sectionId,deepKey:`BDM_R2:${s.sectionId}_${DEEP_KEYS[i]}`,deepTitle:{zh:s.zh,en:s.en},
 legacyKey:BAZI_SECTION_REGISTRY.sections[i+1].key,
 relation:i<5?'RELATED_TOPIC_NOT_COPY_EQUIVALENCE':'DIFFERENT_CHAPTER_PURPOSE',
 automaticContentTransfer:false,
 note:i===5?'Family/support is not the legacy health chapter.':i===6?'Pressure/vulnerability is not legacy current timing.':i===7?'Long-term cycles are not legacy guidance.':i===8?'Current timing is not the legacy appendix.':'Topic overlap does not admit accepted copy for another subject.'
})));
export function resolveBaziChapter({schema,sectionId}={}){
 if(schema===BAZI_CHAPTER_SCHEMAS.legacy){
  const row=BAZI_SECTION_REGISTRY.sections.find(s=>s.key===sectionId);
  if(!row)throw Error('BAZI_EXPLICIT_LEGACY_SECTION_KEY_REQUIRED');
  return deepFreeze({schema,sectionId:row.key,briefSectionKey:row.key,automaticContentTransfer:false});
 }
 if(schema===BAZI_CHAPTER_SCHEMAS.deep){
  const row=BAZI_CHAPTER_CROSSWALK.find(s=>s.deepId===sectionId);
  if(!row)throw Error('BAZI_DEEP_SECTION_REQUIRED');
  return deepFreeze({schema,sectionId:row.deepId,briefSectionKey:row.deepKey,automaticContentTransfer:false});
 }
 throw Error('BAZI_EXPLICIT_CHAPTER_SCHEMA_REQUIRED');
}
// Actual native subject pipeline exposes its missing verification prerequisites.
// This plan does not convert canonical calculation into a narrative Claim IR.
export function buildBaziSubjectVerificationPlan(authority){
 if(!authority?.personId||!authority.calculationDigest||!authority.canonicalBirthInputFingerprint)throw Error('BAZI_CALCULATED_SUBJECT_AUTHORITY_REQUIRED');
 return deepFreeze({schemaVersion:'BAZI-SUBJECT-VERIFICATION-PLAN-v1',activeChapterSchema:BAZI_CHAPTER_SCHEMAS.legacy,
  subject:{customerId:authority.customerId,personId:authority.personId,personVersion:authority.personVersion,canonicalBirthInputFingerprint:authority.canonicalBirthInputFingerprint,calculationDigest:authority.calculationDigest},
  chapters:BAZI_SECTION_REGISTRY.sections.map(s=>({sectionId:s.key,briefSectionKey:s.key,state:'BLOCKED_NO_ADMITTED_SUBJECT_CLAIM_IR_AND_PROSE'})),
  alternateSchema:BAZI_CHAPTER_SCHEMAS.deep,crosswalk:BAZI_CHAPTER_CROSSWALK,
  verifier:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,semanticReviewRequired:true,semanticReviewActivated:false,
  providerExecutionContract:{entrypoint:'generateBaziWithinOwnerThreeCallCostContract',normalGenerationCallsMax:3,normalGenerationCostUSDMax:1,bilingualIncludedInSameCalls:true,repair:'CONDITIONAL_EXISTING_AUTHORIZED_POLICY_ONLY',activated:false},
  existingAcceptedManuscriptsUnmodified:true,providerCalls:0,releaseAllowed:false});
}
const SUBJECT_KEYS=['customerId','personId','personVersion','canonicalBirthInputFingerprint','calculationDigest','timingDigest','evidenceDigest','compositionRevision'];
// Server-owned candidate adapter. No provider callback, no prose authoring,
// no customer release. Uses the existing verifier without weakening its gate.
export async function verifyBaziChapterCandidate({schema,sectionId,locale,subjectBinding,candidateBinding,brief,candidate}={}){
 const chapter=resolveBaziChapter({schema,sectionId});
 const reasons=[];
 if(!['zh-Hans','en'].includes(locale)||brief?.locale!==locale)reasons.push('BAZI_LOCALE_MISMATCH');
 if(brief?.methodId!=='BZR'||brief?.sectionKey!==chapter.briefSectionKey)reasons.push('BAZI_BRIEF_CHAPTER_SCHEMA_MISMATCH');
 if(SUBJECT_KEYS.some(k=>subjectBinding?.[k]===undefined||subjectBinding[k]===null||subjectBinding[k]===''||candidateBinding?.[k]!==subjectBinding[k]))reasons.push('BAZI_SUBJECT_OR_SOURCE_BINDING_MISMATCH');
 if(candidateBinding?.sourceBriefDigest!==brief?.briefSemanticDigest)reasons.push('BAZI_SUBJECT_BRIEF_DIGEST_MISMATCH');
 if(reasons.length)return deepFreeze({accepted:false,state:'VERIFICATION_REJECTED',reasons,providerCalls:0,releaseAllowed:false});
 const verification=await verifyReportSectionComposition({brief,candidate,semanticReview:null});
 return deepFreeze({accepted:false,state:'VERIFICATION_REJECTED',chapter,subjectBindingDigest:await sha256Stable(subjectBinding),verification,
  reasons:verification.reasons.length?verification.reasons:['BAZI_INDEPENDENT_SEMANTIC_AND_HUMAN_ADMISSION_REQUIRED'],
  providerCalls:0,releaseAllowed:false,humanAcceptance:false});
}
