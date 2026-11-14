import {assertHdManuscriptQuarantineR2} from './hd-manuscript-admission-successor-r2.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const fail=(code,details={})=>{throw Object.assign(Error(code),{code,status:409,details});};
const hashText=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
const bindingKeys=['ownerAccountId','personId','personVersion','inputDigest','authorityDigest'];
const same=(a,b)=>bindingKeys.every(k=>b?.[k]!==undefined&&b[k]!==null&&b[k]!==''&&a?.[k]===b[k]);
// sourceRegister/blueprint are trusted source-owner dependencies, never Account
// request JSON. This validates input; it issues no publication/commerce approval.
export async function requireFullCustomerManuscriptR1({method,source,job,subject,blueprint,sourceRegister}){
 if(!['ECR','HD'].includes(method)||job?.methodCode!==method||job.productId!==(method==='ECR'?'COM-REPORT-ECR-FULL':'COM-REPORT-HD-FULL'))fail('FULL_MANUSCRIPT_METHOD_BINDING_REQUIRED');
 if(!source||source.scope!=='CUSTOMER_FULL_MANUSCRIPT_PENDING_PUBLICATION'||source.composerFixture!==false||source.customerPublicationAllowed!==false)fail('CONTENT_PENDING_FULL_MANUSCRIPT_REQUIRED');
 if(!same(source.subjectBinding,job)||subject?.personVersion!==job.personVersion||subject.person?.personId!==job.personId||source.methodConsentRef!==subject.methodConsent?.consentId||source.reportConsentRef!==subject.reportConsent?.consentId)fail('CONTENT_PENDING_SUBJECT_CONSENT_MISMATCH');
 if(!job.orderId||!job.purchaseId||source.orderId!==job.orderId||source.purchaseId!==job.purchaseId)fail('CONTENT_PENDING_ORDER_BINDING_MISMATCH');
 const language=job.presentation?.reportLocale,languages=language==='bilingual'?['zh-Hans','en']:[language];
 if(!['zh-Hans','en','bilingual'].includes(language)||source.contentLanguage!==language)fail('FULL_MANUSCRIPT_LANGUAGE_MISMATCH');
 const expected=Array.from({length:method==='ECR'?10:17},(_,i)=>(method==='ECR'?'SEC-':'SEC')+String(i+1).padStart(2,'0'));
 if(blueprint?.methodCode!==method||JSON.stringify(blueprint.sections?.map(s=>s.sectionId))!==JSON.stringify(expected)||source.blueprintDigest!==await sha256Stable(blueprint))fail('FULL_MANUSCRIPT_BLUEPRINT_REQUIRED');
 if(source.fullCoverageReview?.status!=='COMPLETE_FOR_DECLARED_CUSTOMER'||!source.fullCoverageReview.sourceOwnerReviewRef||source.fullCoverageReview.blueprintDigest!==source.blueprintDigest)fail('CONTENT_PENDING_FULL_COVERAGE_REVIEW');
 if(!Array.isArray(sourceRegister?.records)||!sourceRegister.version||JSON.stringify(source.sections?.map(s=>s.sectionId))!==JSON.stringify(expected)||source.sectionsDigest!==await sha256Stable(source.sections))fail('CONTENT_PENDING_SECTION_SOURCE_REGISTER');
 const hdAdmission=method==='HD'?await assertHdManuscriptQuarantineR2({sections:source.sections,sourceRegister}):null;
 const sections=[];
 for(const [i,s] of source.sections.entries()){
  const paragraphs=s.paragraphs;
  if(!Array.isArray(paragraphs)||!paragraphs.length||paragraphs.some(p=>!languages.includes(p.language))||new Set(paragraphs.map(p=>p.paragraphId)).size!==paragraphs.length)fail('CONTENT_PENDING_PARAGRAPH_STRUCTURE',{sectionId:s.sectionId});
  for(const locale of languages){
   const required=blueprint.sections[i].requiredUnits?.[locale],selected=paragraphs.filter(p=>p.language===locale);
   if(!Array.isArray(required)||!required.length||!selected.length||required.some(id=>!selected.some(p=>p.coverageUnitId===id)))fail('CONTENT_PENDING_CHAPTER_COVERAGE',{sectionId:s.sectionId,locale});
  }
  for(const p of paragraphs){
   if(method==='HD'&&(typeof p.title!=='string'||!p.title.trim()))fail('CONTENT_PENDING_SUBSECTION_TITLE');
   if(typeof p.text!=='string'||!p.text.trim()||/SYNTHETIC COMPOSER FIXTURE|合成技术样本|隔离合成技术样本|NOT A CUSTOMER REPORT/i.test(p.text))fail('CONTENT_PENDING_FIXTURE_NOT_FULL_PROSE');
   const registered=sourceRegister.records.find(r=>r.recordId===p.sourceRecordId);
   if(!registered||registered.scope!=='CUSTOMER_SPECIFIC_FULL_PROSE'||!same(registered.subjectBinding,job)||registered.language!==p.language||registered.sectionId!==s.sectionId||registered.textSHA256!==await hashText(p.text)||!registered.sourceOwnerRef)fail('CONTENT_PENDING_PARAGRAPH_PROVENANCE',{sectionId:s.sectionId,paragraphId:p.paragraphId});
   if(!['OWNED_ORIGINAL','LICENSE_COMPATIBLE'].includes(registered.resourceDisposition))fail('CONTENT_PENDING_SELECTED_RESOURCE_REVIEW',{recordId:registered.recordId});
  }
  sections.push({...s,title:blueprint.sections[i].title,paragraphs:paragraphs.map(p=>({...p}))});
 }
 return {...(hdAdmission?{hdAdmission}:{}),method,sections,contentLanguage:language,subjectBinding:source.subjectBinding,sectionsDigest:source.sectionsDigest,blueprintDigest:source.blueprintDigest,sourceRegisterVersion:sourceRegister.version,sourceOwnerReviewRef:source.fullCoverageReview.sourceOwnerReviewRef,customerPublicationAllowed:false,commercialAdmission:false,ownerPublicationAccepted:false};
}


// Trusted source-owner assembly only. No provider, default prose, source registry
// creation, publication approval or commercial admission occurs in this function.
export async function assembleFullCustomerManuscriptR2({method,job,subject,blueprint,sourceRegister,selection,readParagraph,coverageReview}){
 if(!['HD','ECR'].includes(method)||job?.methodCode!==method)fail('MANUSCRIPT_ASSEMBLY_METHOD_REQUIRED');
 if(!selection?.version||!sourceRegister?.version||typeof readParagraph!=='function')fail('MANUSCRIPT_ASSEMBLY_SOURCE_SELECTION_REQUIRED');
 if(subject?.person?.personId!==job.personId||subject.personVersion!==job.personVersion||!subject.methodConsent?.consentId||!subject.reportConsent?.consentId)fail('MANUSCRIPT_ASSEMBLY_SUBJECT_REQUIRED');
 const locale=job.presentation?.reportLocale,languages=locale==='bilingual'?['zh-Hans','en']:[locale];
 if(!['zh-Hans','en','bilingual'].includes(locale)||selection.contentLanguage!==locale)fail('MANUSCRIPT_ASSEMBLY_LANGUAGE_MISMATCH');
 const expected=Array.from({length:method==='HD'?17:10},(_,i)=>(method==='HD'?'SEC':'SEC-')+String(i+1).padStart(2,'0'));
 if(blueprint?.methodCode!==method||JSON.stringify(blueprint.sections?.map(s=>s.sectionId))!==JSON.stringify(expected)||JSON.stringify(selection.sections?.map(s=>s.sectionId))!==JSON.stringify(expected))fail('MANUSCRIPT_ASSEMBLY_SECTION_ORDER_REQUIRED');
 if(!Array.isArray(sourceRegister.records))fail('MANUSCRIPT_ASSEMBLY_REGISTRY_REQUIRED');
 const ids=new Set(),sections=[];
 for(const section of selection.sections){
  if(!Array.isArray(section.paragraphs)||!section.paragraphs.length)fail('MANUSCRIPT_ASSEMBLY_EMPTY_SECTION');
  const paragraphs=[];
  for(const pick of section.paragraphs){
   if(typeof pick.paragraphId!=='string'||!pick.paragraphId||ids.has(pick.paragraphId))fail('MANUSCRIPT_ASSEMBLY_PARAGRAPH_ID_REQUIRED');ids.add(pick.paragraphId);
   const records=sourceRegister.records.filter(r=>r.recordId===pick.sourceRecordId),r=records[0];
   if(records.length!==1||r.scope!=='CUSTOMER_SPECIFIC_FULL_PROSE'||!same(r.subjectBinding,job)||r.sectionId!==section.sectionId||!languages.includes(r.language)||!r.sourceOwnerRef||!['OWNED_ORIGINAL','LICENSE_COMPATIBLE'].includes(r.resourceDisposition))fail('MANUSCRIPT_ASSEMBLY_SOURCE_BINDING_REQUIRED');
   if(!pick.coverageUnitId||r.coverageUnitId!==pick.coverageUnitId)fail('MANUSCRIPT_ASSEMBLY_COVERAGE_ID_MISMATCH');
   const text=await readParagraph(r);
   if(typeof text!=='string'||!text.trim()||await hashText(text)!==r.textSHA256)fail('MANUSCRIPT_ASSEMBLY_SOURCE_BYTES_MISMATCH');
   paragraphs.push({paragraphId:pick.paragraphId,sourceRecordId:r.recordId,coverageUnitId:pick.coverageUnitId,language:r.language,title:r.title,text,...(r.calculatedClaims?{calculatedClaims:structuredClone(r.calculatedClaims)}:{})});
  }
  sections.push({sectionId:section.sectionId,paragraphs});
 }
 const source={version:selection.version,scope:'CUSTOMER_FULL_MANUSCRIPT_PENDING_PUBLICATION',composerFixture:false,customerPublicationAllowed:false,subjectBinding:Object.fromEntries(bindingKeys.map(k=>[k,job[k]])),orderId:job.orderId,purchaseId:job.purchaseId,methodConsentRef:subject.methodConsent.consentId,reportConsentRef:subject.reportConsent.consentId,contentLanguage:locale,blueprintDigest:await sha256Stable(blueprint),sections,sectionsDigest:await sha256Stable(sections),fullCoverageReview:coverageReview?structuredClone(coverageReview):{status:'PENDING_SOURCE_OWNER_REVIEW'},sourceRegisterVersion:sourceRegister.version,...(method==='ECR'?{nativeConfigurationId:selection.nativeConfigurationId}:{})};
 return source;
}
