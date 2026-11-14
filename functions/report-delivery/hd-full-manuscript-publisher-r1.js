import {HD_QUARANTINE_VERSION} from './hd-manuscript-admission-successor-r2.js';
import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {requireFullCustomerManuscriptR1,assembleFullCustomerManuscriptR2} from './full-customer-manuscript-input-r1.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const at=(v,path)=>path.split('.').reduce((o,k)=>o?.[k],v);
// Maps full paragraphs/subsections into the existing Full17 Publisher input shape.
// No short-fixture composer, old personal introduction or default prose fallback.
export async function prepareHdFullManuscriptPublisherR1(context,{job,native,source,blueprint,sourceRegister,manuscriptSelection,readSourceParagraph,coverageReview}){
 if(context.env?.PHIOS_ENVIRONMENT!=='local'||personIdentity(context).userId!==job.ownerAccountId)fail('FULL_PUBLICATION_LOCAL_OWNER_REVIEW_ONLY');
 const subject=await loadCanonicalPersonSubject(context.env,job.ownerAccountId,job.personId);
 if(await sha256Stable(subject.canonicalBirthInput)!==job.inputDigest)fail('CONTENT_PENDING_CURRENT_INPUT_DIGEST');
 if(!source)source=await assembleFullCustomerManuscriptR2({method:'HD',job,subject,blueprint,sourceRegister,selection:manuscriptSelection,readParagraph:readSourceParagraph,coverageReview});
 const selected=await requireFullCustomerManuscriptR1({method:'HD',source,job,subject,blueprint,sourceRegister});
 if(native?.method!=='HD'||await sha256Stable(native)!==job.authorityDigest||native.ownedSource?.subjectBinding?.personId!==job.personId)fail('FULL_HD_NATIVE_SOURCE_MISMATCH');
 if(selected.hdAdmission?.version!==HD_QUARANTINE_VERSION||selected.hdAdmission.personalCognition!=='UNKNOWN')fail('HD_R2_QUARANTINE_POLICY_REQUIRED');
 const facts=native.ownedSource.full17Facts.facts;
 for(const section of selected.sections)for(const paragraph of section.paragraphs)for(const claim of paragraph.calculatedClaims||[]){
  const actual=at(facts,claim.path);if(actual===undefined||actual===null||JSON.stringify(actual)!==JSON.stringify(claim.value))fail('FULL_HD_UNSUPPORTED_CALCULATED_CLAIM');
 }
 const mapped=mapHdFull17PublisherParagraphsR1(selected.sections,source.version),selection=mapped.selection;
 const packets=selection.sections.map(s=>({sectionId:s.id,paragraphs:s.paragraphs,calculation:{chartResultDigest:job.authorityDigest,...facts},commercial:false}));
 return {selection,packets,preview:{source:'PHIOS_CURRENT_SUBJECT_NATIVE_SOURCE',chart:native.chart,chartDigest:job.authorityDigest,subjectBinding:selected.subjectBinding,customerConfirmed:false},sourceBinding:selected,personalCognition:'UNKNOWN',sourceQuarantineVersion:HD_QUARANTINE_VERSION,advancedUnknown:[...(native.ownedSource.full17Facts.unknown||[]),{section:'personal_cognition',reason:'HD_R2_QUARANTINED_PERSONAL_INFERENCE_UNKNOWN'}],diagramPolicy:{knownFactsOnly:true,unknownAdvancedPanelRequired:true,neverRunOldPersonalGraphicBranches:true},publisherOwner:'tools/review/hd-r6/import-20261027/r611/render.py',flowPolicy:{adapter:'tools/review/six-method-paid-report-integration-r2/hd-full17-paragraph-flow-r1.py',source:'Original R65 section-loop used by R611; frozen main/old intro must not execute',languages:selected.contentLanguage==='bilingual'?['zh-Hans','en']:[selected.contentLanguage],chineseFontPt:11,englishFontPt:11.5,oneShortParagraphPerChapterForbidden:true,noPdfProduced:true},formalPublicationAccepted:false,commercialAdmission:false};
}

// Structural projection only; callers still need the subject/source contract.
// This function does not mark content accepted or invoke a PDF generator.
export function mapHdFull17PublisherParagraphsR1(sections,candidateId){
 if(sections?.length!==17||sections.some((s,i)=>s.sectionId!=='SEC'+String(i+1).padStart(2,'0')))fail('HD_FULL17_COMPLETE_STRUCTURE_REQUIRED');
 return {selection:{candidateId,sections:sections.map((s,i)=>({id:s.sectionId,number:i+1,title:s.title,paragraphs:s.paragraphs.map(p=>({...p,id:p.paragraphId||p.id,sectionId:s.sectionId,subsectionId:p.coverageUnitId||p.subsectionId}))}))},publicationAccepted:false};
}