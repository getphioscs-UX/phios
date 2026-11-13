import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {requireFullCustomerManuscriptR1,assembleFullCustomerManuscriptR2} from './full-customer-manuscript-input-r1.js';
import {buildEcrDeepReadingR2} from '../ecr-full-report/ecr-deep-reading-r2.js';
import {renderEcrAuthorPublicationChapter,assembleEcrAuthorPublicationPdf} from '../ecr-full-report/ecr-author-led-publication-r31.js';
import {drawEcrSec07Presentation} from '../ecr-full-report/ecr-sec07-presentation-r33.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const textSha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
// Full-source review port, deliberately separate from the frozen R4 fixture port.
// Existing chapter renderer, fixed-art assembler and SEC07 presentation remain owners.
export async function prepareEcrFullManuscriptPublisherR1(context,{job,native,source,blueprint,sourceRegister,manifest,manuscriptSelection,readSourceParagraph,coverageReview}){
 if(context.env?.PHIOS_ENVIRONMENT!=='local'||personIdentity(context).userId!==job.ownerAccountId)fail('FULL_PUBLICATION_LOCAL_OWNER_REVIEW_ONLY');
 const subject=await loadCanonicalPersonSubject(context.env,job.ownerAccountId,job.personId);
 if(await sha256Stable(subject.canonicalBirthInput)!==job.inputDigest)fail('CONTENT_PENDING_CURRENT_INPUT_DIGEST');
 if(!source)source=await assembleFullCustomerManuscriptR2({method:'ECR',job,subject,blueprint,sourceRegister,selection:manuscriptSelection,readParagraph:readSourceParagraph,coverageReview});
 const selected=await requireFullCustomerManuscriptR1({method:'ECR',source,job,subject,blueprint,sourceRegister});
 if(native?.method!=='ECR'||await sha256Stable(native)!==job.authorityDigest||source.nativeConfigurationId!==native.configuration?.configurationId)fail('FULL_ECR_NATIVE_SOURCE_MISMATCH');
 const base=buildEcrDeepReadingR2({ir:native.configuration,locale:selected.contentLanguage,reviewMode:true});
 const sections=await Promise.all(base.sections.map(async section=>{
  if(section.interactive)return {...section,authorBodies:[]};
  const s=selected.sections.find(s=>s.sectionId==='SEC-'+section.id),languages=selected.contentLanguage==='bilingual'?['zh-Hans','en']:[selected.contentLanguage];
  const authorBodies=await Promise.all(languages.map(async locale=>{const text=s.paragraphs.filter(p=>p.language===locale).map(p=>p.text).join('\n\n');return {sectionId:section.id,locale,text,exactTextSha256:await textSha(text),sourceScope:'CUSTOMER_FULL_MANUSCRIPT_PENDING_PUBLICATION',sourceParagraphs:s.paragraphs.filter(p=>p.language===locale)};}));
  return {...section,authorBodies};
 }));
 const publication={...base,sections,publicationState:'FULL_CUSTOMER_SOURCE_REVIEW_PENDING',sourceOwner:'ECR_CUSTOMER_FULL_MANUSCRIPT_SOURCE_OWNER',contentBinding:selected,customerPublishable:false};
 return {publication,renderChapter:sectionId=>({...renderEcrAuthorPublicationChapter({publication,sectionId,manifest}),sourceOwner:publication.sourceOwner,customerPublishable:false}),assembleExisting:assembleEcrAuthorPublicationPdf,drawSec07Existing:drawEcrSec07Presentation,appendixContract:{required:true,owner:'scripts/ecr-r33-appendix.mjs',scope:'CUSTOMER_CALCULATION_ONLY_R1',nativeConfigurationId:native.configuration.configurationId,internalAuditExcluded:true},publisherOwner:'scripts/ecr-r33-render.mjs',contentLanguage:selected.contentLanguage,formalPublicationAccepted:false,commercialAdmission:false};
}
