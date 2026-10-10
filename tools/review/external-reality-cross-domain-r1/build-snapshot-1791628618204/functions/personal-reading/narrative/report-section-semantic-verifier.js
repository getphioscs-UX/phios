import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {REPORT_SECTION_NARRATIVE_BRIEF_VERSION} from './report-section-brief.js';
import {evaluateCustomerEditorialR4} from './report-editorial-quality-r4.js';
import {MARKET_ROLES,evaluateMarketReading} from './bazi-s04-market-reading.js';

export const REPORT_SECTION_SEMANTIC_VERIFIER_VERSION='PHI-OS-REPORT-SECTION-SEMANTIC-VERIFIER-v1.3.1';
const ROLES=new Set(['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']);
const FORBIDDEN=[
 [/\bguaranteed\b|\bwill definitely\b|一定会|必然会/u,'GUARANTEED_FUTURE_EVENT'],
 [/\bdiagnos(?:e|is|ed)\b|诊断/u,'DIAGNOSIS'],
 [/\b(?:you should|you must)\s+(?:buy|sell|invest|borrow)\b|你应该(?:买入|卖出|投资|借款)/u,'FINANCIAL_RECOMMENDATION'],
 [/\bsoulmate\b|命中注定|灵魂伴侣/u,'HIDDEN_STATE_INFERENCE']
];
const OPERATOR_PATTERNS=Object.freeze({
 CAUSES:/\b(?:causes?|caused by|results? in)\b|(?:导致|造成|引发)/iu,
 PRECEDES:/\b(?:must come before|always precedes)\b|(?:必然先于|必须先发生)/iu,
 DEVELOPS_INTO:/\b(?:develops? into|will become)\b|(?:发展成|必然变成)/iu,
 MANIFESTS_AS:/\b(?:manifests? as|shows? up as)\b|(?:必然表现为|直接表现为)/iu
});
function arr(v){return Array.isArray(v)?v:[];} function text(v){return String(v??'').trim();}
function uniq(v){return [...new Set(v.filter(Boolean).map(String))];}
// These narrow negative constructions are not affirmative certainty claims.
// The independent reviewer always receives the original, unmodified prose.
function assertionText(value){return value
 .replace(/\brather than\b[^.!?;,\n]{0,100}\bguaranteed\b/giu,' ')
 .replace(/\b(?:not|never|without)\s+(?:a\s+)?(?:guaranteed|certainly|definitely|always|proves?)\b/giu,' ')
 .replace(/(?:不能|无法|并未|未能|不曾)证明|(?:过于|过度)绝对/gu,' ')
 .replace(/(?:并不|也不|不)代表(?:某一|具体)?事件(?:已经发生或)?必然发生/gu,' ')
 .replace(/(?:而非|并非|不是|不等于|不代表|不能视为|不可视为)[^，。；！？\n]{0,40}(?:一定|必然|绝对|证明)/gu,' ');
}
function detect(textValue,careerIdentity=false){
 // Technical problem diagnosis is licensed by the career expertise node; this
 // exception cannot mask a diagnosis of a person or a medical condition.
 const checked=careerIdentity?textValue.replace(/through diagnosis, explanation, or method/giu,'through problem analysis, explanation, or method'):textValue;
 for(const [re,code] of FORBIDDEN)if(re.test(assertionText(checked)))return code;return null;
}
function licenseAllows(claims,operator){
 return claims.some(c=>arr(c.semanticOperators).includes(operator)||c?.license?.allowedSemanticOperators?.includes?.(operator));
}
function hasMeaningForRole(claims,role){
 if(claims.some(c=>c.role===role))return true;
 if(role==='CONDITIONS')return claims.some(c=>arr(c.conditions).length>0);
 if(role==='COUNTERWEIGHTS')return claims.some(c=>arr(c.counterweights).length>0||['OPEN_CONDITION','COUNTER_SIGNAL','TENSION','CONTRAST'].includes(c.claimType));
 if(role==='OBSERVABLE_EXPRESSION')return claims.some(c=>c.claimType==='QUESTION'||arr(c.observableSignals).length>0||c?.license?.allowsObservedReality===true);
 if(role==='TIMING_RELEVANCE')return claims.some(c=>c.role==='TIMING_RELEVANCE'||arr(c.timing).length>0);
 if(role==='NAVIGATION')return claims.some(c=>c.role==='NAVIGATION'||c.claimType==='CROSS_SECTION_RELEVANCE');
 return false;
}
function certaintyEscalated(body,claims,successor=false,careerIdentity=false){
 const weak=claims.some(c=>['UNRESOLVED','QUESTION','SYMBOLIC_CONDITIONAL','BOUNDED_SOURCE_PROJECTION_NOT_EMPIRICAL_CERTAINTY'].includes(String(c.certainty||'').toUpperCase()));
 let assertions=successor?assertionText(body).replace(/\b(?:who|when(?:\s+it)?)\s+will\b/giu,' ').replace(/不必然/gu,' '):assertionText(body);
 if(careerIdentity)assertions=assertions.replace(/不证明/gu,' ').replace(/不等于[^，。；]{0,24}必然/gu,' ').replace(/不表示(?:某个|具体)?事件必然发生/gu,' ').replace(/not predictions? of what will happen/giu,' ');
 return weak&&/\b(?:certainly|definitely|always|proves?|will)\b|(?:一定|必然|证明|就是|绝对)/iu.test(assertions);
}

export async function verifyReportSectionComposition({brief,candidate,semanticReview=null}={}){
 if(brief?.schemaVersion!==REPORT_SECTION_NARRATIVE_BRIEF_VERSION)throw Error('RNT2_VERIFIER_BRIEF_REQUIRED');
 const source=new Map(brief.claims.map(c=>[c.claimId,c])),reasons=[],used=new Set(),roles=new Set();
 const blocks=arr(candidate?.blocks);
 const {briefSemanticDigest,...briefSeed}=brief;
 if(await sha256Stable(briefSeed)!==briefSemanticDigest)reasons.push('SOURCE_LINEAGE_LOSS');
 if(candidate?.sourceBriefDigest!==briefSemanticDigest)reasons.push('SOURCE_DIGEST_MISMATCH');
 if(!blocks.length)reasons.push('NO_BLOCKS');
 if(blocks.length<4||blocks.length>(brief.identityContract?16:brief.successorVersion?14:10))reasons.push('BLOCK_COUNT_INVALID');
 for(const [index,b] of blocks.entries()){
  const role=text(b?.role).toUpperCase(),body=text(b?.text),refs=uniq(arr(b?.claimRefs));
  if(refs.length!==arr(b?.claimRefs).length||uniq(arr(b?.supportRefs)).length!==arr(b?.supportRefs).length)reasons.push(`DUPLICATE_REFERENCES:${index}`);
  if(!(brief.marketContract?brief.marketContract.roles.includes(role):ROLES.has(role)||brief.successorVersion&&role==='CAREER_THESIS'))reasons.push(`BLOCK_ROLE_INVALID:${index}`);else roles.add(role);
  if(!body)reasons.push(`BLOCK_TEXT_REQUIRED:${index}`);
  if(typeof b?.text!=='string'||body.length<20||body.length>2600)reasons.push(`BLOCK_TEXT_SIZE_INVALID:${index}`);
  if(!refs.length)reasons.push(`BLOCK_CLAIM_REFS_REQUIRED:${index}`);
  const claims=[];
  for(const ref of refs){
   if(!source.has(ref))reasons.push(`UNKNOWN_CLAIM_REF:${ref}`);
   else {used.add(ref);claims.push(source.get(ref));}
  }
  const permittedSupports=new Set(claims.flatMap(c=>c.sourceRefs));
  if(!arr(b?.supportRefs).length||arr(b.supportRefs).some(ref=>!permittedSupports.has(ref)))reasons.push(`SOURCE_LINEAGE_LOSS:${index}`);
  const conditionalRole=brief.successorVersion&&role==='OBSERVABLE_EXPRESSION'&&claims.some(c=>['MECHANISM','CAUSAL_CHAIN','SCENARIO'].includes(c.claimType)&&c.license?.allowsConditionalScenario);
  if(claims.length&&!hasMeaningForRole(claims,role)&&!conditionalRole)reasons.push(`ROLE_SUPPORT_MISMATCH:${index}:${role}`);
  const prohibited=detect(body,Boolean(brief.identityContract));if(prohibited)reasons.push(`${prohibited}:${index}`);
  for(const [operator,re] of Object.entries(OPERATOR_PATTERNS))if(re.test(body)&&!licenseAllows(claims,operator))reasons.push(`UNLICENSED_${operator}:${index}`);
  if(certaintyEscalated(body,claims,Boolean(brief.successorVersion),Boolean(brief.identityContract)))reasons.push(`CERTAINTY_STRENGTHENING:${index}`);
  if(role==='OBSERVABLE_EXPRESSION'){
   const admitsObserved=claims.some(c=>c?.license?.allowsObservedReality===true);
   const questionOnly=claims.every(c=>c.claimType==='QUESTION'||arr(c.conditions).includes('QUESTION_ONLY_NOT_OBSERVED_FACT')||!admitsObserved);
   if(questionOnly&&!/[?？]|\b(?:compare|notice|observe|look for|which|what|when|if)\b|(?:观察|比较|留意|哪些|什么|什么时候|如果|若|当)/iu.test(body))reasons.push(`REALITY_INFERENCE:${index}`);
  }
 }
 for(const role of brief.requiredClaimRoles)if(!roles.has(role))reasons.push(`REQUIRED_ROLE_MISSING:${role}`);
 const timingClaims=brief.claims.filter(c=>c.role==='TIMING_RELEVANCE');
 if(timingClaims.length&&brief.timingPolicy==='WHEN_AUTHORITY_PRESENT'&&!roles.has('TIMING_RELEVANCE'))reasons.push('REQUIRED_ROLE_MISSING:TIMING_RELEVANCE');
 const materialClaims=brief.claims.filter(c=>!['BOUNDARY'].includes(c.claimType));
 const usedMaterial=materialClaims.filter(c=>used.has(c.claimId));
 const coverage=materialClaims.length?usedMaterial.length/materialClaims.length:0;
 const unsupportedRefs=reasons.filter(x=>x.startsWith('UNKNOWN_CLAIM_REF:')).map(x=>x.split(':').slice(1).join(':'));
 const candidateDigest=await sha256Stable(candidate??null);
 const checks=['factsPreserved','boundariesPreserved','conditionsPreserved','counterSignalsPreserved','uncertaintyPreserved','timingScopePreserved','noInventedReality','noNewMethodFact','semanticOperatorsPreserved','rankPreserved','directionPreserved'];
 const structuralChecksPassed=reasons.length===0;
 let review=null;
 if(!reasons.length&&typeof semanticReview==='function'){
  try{review=await semanticReview({brief,candidate,candidateDigest});}catch{reasons.push('SEMANTIC_REVIEW_UNAVAILABLE');}
 }
 const reviewBound=review?.sourceBriefDigest===briefSemanticDigest&&review?.candidateDigest===candidateDigest;
 const reviewed=reviewBound&&checks.every(key=>review?.[key]===true);
 if(structuralChecksPassed&&!reviewBound)reasons.push('SEMANTIC_REVIEW_REQUIRED');
 if(reviewBound)for(const key of checks)if(review[key]!==true)reasons.push('SEMANTIC_REVIEW_FAILED:'+key);
 if(reviewBound&&arr(review.reasons).length)reasons.push('SEMANTIC_REVIEW_REJECTED');
 const meaningful=new Set(reviewBound?arr(review.meaningfullyUsedClaimRefs):[]);
 for(const ref of meaningful)if(!used.has(ref))reasons.push('UNSUPPORTED_REVIEW_CLAIM:'+ref);
 for(const c of materialClaims)if(!meaningful.has(c.claimId))reasons.push('CLAIM_MEANING_NOT_VERIFIED:'+c.claimId);
 const technicalAccepted=reasons.length===0;
 const editorialQuality=brief.successorVersion?(brief.marketContract?evaluateMarketReading:evaluateCustomerEditorialR4)({brief,candidate,verification:{semanticReview:review}}):null;
 if(editorialQuality&&!editorialQuality.accepted)reasons.push(...editorialQuality.reasons);
 const seed={
  schemaVersion:'PHI-OS-REPORT-SECTION-SEMANTIC-VERIFICATION-v1.1.0',
  verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,
  sourceBriefDigest:brief.briefSemanticDigest,
  accepted:reasons.length===0,
  sourceDigest:brief.sourceSemanticDigest,
  factsPreserved:reviewed&&unsupportedRefs.length===0,
  semanticOperatorsPreserved:reviewed&&!reasons.some(x=>x.startsWith('UNLICENSED_')),
  roleSemanticsPreserved:!reasons.some(x=>x.startsWith('ROLE_SUPPORT_MISMATCH:')),
  boundariesPreserved:reviewBound&&review.boundariesPreserved===true,
  conditionsPreserved:reviewBound&&review.conditionsPreserved===true,
  counterSignalsPreserved:reviewBound&&review.counterSignalsPreserved===true,
  uncertaintyPreserved:reviewed&&!reasons.some(x=>x.startsWith('CERTAINTY_STRENGTHENING:')),
  timingScopePreserved:reviewBound&&review.timingScopePreserved===true,
  observableScopePreserved:reviewed&&!reasons.some(x=>x.startsWith('REALITY_INFERENCE:')),
  noInventedReality:reviewBound&&review.noInventedReality===true,
  noNewMethodFact:reviewBound&&review.noNewMethodFact===true,
  claimReferenceCoverage:Number(coverage.toFixed(4)),
  claimCoverage:materialClaims.length?materialClaims.filter(c=>meaningful.has(c.claimId)).length/materialClaims.length:0,
  semanticReview:review,
  ...(editorialQuality?{technicalAccepted,editorialQuality}:{}),
  candidateDigest,
  usedClaimRefs:[...used],
  missingClaimRefs:materialClaims.map(c=>c.claimId).filter(id=>!used.has(id)),
  unsupportedRefs,
  reasons
 };
 const verificationDigest=await sha256Stable(seed);
 return deepFreeze({...seed,verificationDigest});
}
export default Object.freeze({verifyReportSectionComposition});
