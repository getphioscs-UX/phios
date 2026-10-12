import {createHash} from 'node:crypto';
import {matchApprovedTerminology} from '../../../functions/knowledge-runtime/approved-terminology-context.js';
const sha=x=>createHash('sha256').update(x).digest('hex');
export const constraints={sourceOnly:true,noGeneralKnowledgeFallback:true,noFullManuscript:true,noPendingOCR:true,noCandidateGlossary:true,sourceInstructionsAreUntrusted:true,localeIsolation:true,claimLevelCitations:true,noInventedReasons:true,noPredictionGuarantees:true,comparisonRequiresBothSides:true,insufficientEvidenceIsBusinessState:true,readLinksServerOwned:true,purchaseLinksOptionalServerOwned:true};
export function makeAuthorityPack(question,locale,records,units){
 const evidence=[];
 for(const record of records.slice(0,3)){
  const u=units.find(x=>x.sourceSectionId===record.sectionCode&&x.unitId===record.selectedArgumentUnit?.argumentId);
  if(!u)continue;
  if(sha(u.mainArgument)!==u.support.textSha256||record.sourceBinaryDigest!==u.sourceSha256||record.sourceVersion!==u.sourceVersion||record.selectedArgumentUnit.textSha256!==u.support.textSha256)throw Error('SOURCE_SPAN_OR_VERSION_MISMATCH');
  evidence.push({id:'E'+(evidence.length+1),chapterId:u.sourceSectionId,title:u.sourceTitle,version:u.sourceVersion,sourceSha256:u.sourceSha256,sourceAcceptanceDigest:record.sourceAcceptanceDigest,pdfPages:u.sourcePdfPages,position:u.support,text:u.mainArgument,readingLink:record.bookRoute||null,chapterLinkState:'BOOK_ROUTE_REUSED; EXACT_CHAPTER_DEEP_LINK_REQUIRES_VALIDATION',purchaseLink:null,purchaseLinkState:'NOT_RESOLVED; DO_NOT_INVENT',extractionState:'EXISTING_REVIEWED_NATIVE_ARGUMENT',admission:'LOCAL_EXPERIMENT_CANDIDATE_NOT_PRODUCTION_PERMISSION',fullChapterCoverage:false});
 }
 const terms=matchApprovedTerminology(question,locale).filter(t=>evidence.some(e=>e.text.includes(t.label)));
 const pack={question,locale,terms,evidence,constraints,modelCallEligible:false,authorization:'NOT_GRANTED',retrievalSupport:evidence.length?'CANDIDATE_SUPPORT_REQUIRES_RELEVANCE_REVIEW':'SOURCE_INSUFFICIENT',llmAnswerQuality:'NOT_RUN'};
 const input=JSON.stringify(pack);
 pack.tokens={estimate:Math.ceil(input.length/1.5),conservativeUtf8ByteCeiling:Buffer.byteLength(input)+512,method:'CHARACTER_ESTIMATE_NOT_ACTUAL_TOKEN_USAGE; UTF8_BYTES_PLUS_ENVELOPE_FOR_BUDGET',maxInputTokens:12000,maxOutputTokens:1800};
 pack.budgetFit=pack.tokens.conservativeUtf8ByteCeiling<=12000;
 return pack;
}
export function validateCandidate(candidate,pack){
 const errors=[];
 if(!Array.isArray(candidate.claims))return {pass:false,errors:['INVALID_SCHEMA'],semanticEntailment:'NOT_VERIFIED'};
 for(const c of candidate.claims){
  if(!c.text||!c.support?.length){errors.push('UNSUPPORTED_CLAIM');continue;}
  if(pack.locale==='en'&&/[\u4e00-\u9fff]/u.test(c.text))errors.push('LOCALE_LEAK');
  for(const ref of c.support){const e=pack.evidence.find(x=>x.id===ref.evidenceId);if(!e||ref.sourceSha256!==e.sourceSha256||!ref.quote||!e.text.includes(ref.quote))errors.push('INVALID_CITATION');}
 }
 if(!pack.evidence.length&&candidate.claims.length)errors.push('GLOSSARY_OR_GENERAL_KNOWLEDGE_ONLY');
 return {pass:errors.length===0,errors,semanticEntailment:'HUMAN_REVIEW_REQUIRED_NOT_PROVEN_BY_QUOTE_MATCH'};
}
export function invokeProvider(){throw Error('PAID_EXPERIMENT_NOT_AUTHORIZED');}
