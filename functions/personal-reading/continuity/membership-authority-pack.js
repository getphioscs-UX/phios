import {approvedTerminologyForSourcePack} from '../../knowledge-runtime/approved-terminology-context.js';
import {digest} from '../../account/oidc-auth.js';
export async function buildMembershipAuthorityPack({question,locale,records,customerContext=null}){
 if(typeof question!=='string'||!question.trim()||question.length>2000||!['en','zh-Hans'].includes(locale))throw Error('ASK_INPUT_INVALID');
 const sources=[];
 for(const r of (records||[]).slice(0,4)){
  const u=r.explanationUnit;
  if(r.sourceType!=='COMPLETED_MANUSCRIPT'||!r.sourceAcceptanceDigest||!u?.mainArgument||!r.sourceBinaryDigest||!r.sourceVersion||u.sourceSectionId!==r.sectionCode||u.support?.textSha256!==await digest(u.mainArgument))continue;
  const bookCode=/BOOK-\d/.exec(r.sourceCode||'')?.[0]||r.bookCode||'';
  const chapterDeepLink='/membership-source.html?'+new URLSearchParams({bookCode,chapter:r.sectionCode,q:question,locale}).toString();
  sources.push({id:'S'+(sources.length+1),sourceCode:r.sourceCode,sourceVersion:r.sourceVersion,sourceSha256:r.sourceBinaryDigest,sourceAcceptanceDigest:r.sourceAcceptanceDigest,chapterId:r.sectionCode,heading:r.heading,sourceLanguage:u.locale||'zh-Hans',pdfPages:r.pageRange,support:u.support,text:u.mainArgument,readingHref:r.bookRoute||null,chapterDeepLink,chapterDeepLinkState:'SERVER_PERMISSION_CHECKED_CHAPTER_DESCRIPTION',purchaseHref:r.bookRoute||null,purchaseLinkRole:'BOOK_PRODUCT_INFORMATION_NOT_FULL_TEXT_ACCESS',permissions:{knowledgeExcerpt:true,fullTextDownload:false,reconstructBook:false}});
 }
 const glossary=approvedTerminologyForSourcePack(question,locale,sources);
 const constraints={answerLocale:locale,sourceLanguagesDisclosed:true,translationDoesNotAcceptEnglishManuscript:true,sourceOnly:true,noGeneralKnowledgeFallback:true,preserveConditions:true,directAnswerWhenSupported:true,claimCitationsRequired:true,compareBothSides:true,untrustedSourceInstructions:true,noPrivateTextReconstruction:true,noOCRPromotion:true,noGlossaryPromotion:true,customerContextIsCustomerSuppliedNotEstablishedFact:true,purchaseMustNotReplaceAnswer:true};
 const pack={question,locale,sources,glossary,customerContext, constraints,state:sources.length?'SOURCE_PACK_READY_RELEVANCE_REVIEW_REQUIRED':'SOURCE_INSUFFICIENT'};
 const bytes=new TextEncoder().encode(JSON.stringify(pack)).length;
 pack.tokenEstimate={estimated:Math.ceil(bytes/2),conservativeInputTokenCeiling:bytes+512,actualTokens:null,method:'UTF8_BYTE_CONSERVATIVE_BOUND_NOT_PROVIDER_USAGE'};
 pack.packDigest=await digest(JSON.stringify(pack));return pack;
}
export async function validateMembershipCandidate(candidate,pack){
 const errors=[];if(candidate?.locale!==pack.locale||!Array.isArray(candidate?.claims))return {ok:false,errors:['ANSWER_SCHEMA_INVALID'],semanticSupport:'NOT_VERIFIED'};
 for(const claim of candidate.claims){if(typeof claim.text!=='string'||!claim.text.trim()||claim.text.length>1000||!claim.support?.length){errors.push('UNSUPPORTED_CLAIM');continue;}
  if(pack.sources.some(s=>s.sourceClass!=='OWNED_REPORT_INTERPRETATION'&&s.text.includes(claim.text)&&claim.text.length>160))errors.push('PRIVATE_SOURCE_VERBATIM_EXCESS');
  if(pack.locale==='en'&&/[\u4e00-\u9fff]/u.test(claim.text))errors.push('EN_BODY_LANGUAGE_LEAK');
  if(pack.locale==='zh-Hans'){
   let prose=claim.text;for(const term of pack.glossary)prose=prose.replaceAll(term.label,'');
   if(/[A-Za-z]{3,}(?:\s+[A-Za-z]{2,}){2,}/.test(prose))errors.push('ZH_UNEXPLAINED_ENGLISH_PROSE');
  }
  for(const ref of claim.support){const source=pack.sources.find(s=>s.id===ref.sourceId);if(!source||ref.sourceSha256!==source.sourceSha256||ref.sourceVersion!==source.sourceVersion||!ref.quote||ref.quote.length>160||!source.text.includes(ref.quote))errors.push('INVALID_SOURCE_CITATION');}
 }
 if(!pack.sources.length&&candidate.claims.length)errors.push('NO_SOURCE_SUPPORT');
 if(candidate.claims.reduce((n,c)=>n+(c.support||[]).reduce((m,s)=>m+(s.quote?.length||0),0),0)>480)errors.push('EXCERPT_DISCLOSURE_LIMIT');
 if(candidate.claims.reduce((n,c)=>n+(c.text?.length||0),0)>3000)errors.push('ANSWER_LENGTH_LIMIT');
 return {ok:!errors.length,errors,semanticSupport:'REQUIRES_EXECUTED_ENTAILMENT_AND_ANSWER_QUALITY_REVIEW'};
}
