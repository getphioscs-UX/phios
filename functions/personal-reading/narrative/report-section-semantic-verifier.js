import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {REPORT_SECTION_NARRATIVE_BRIEF_VERSION} from './report-section-brief.js';

export const REPORT_SECTION_SEMANTIC_VERIFIER_VERSION='PHI-OS-REPORT-SECTION-SEMANTIC-VERIFIER-v1.1.0';
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
function detect(textValue){for(const [re,code] of FORBIDDEN)if(re.test(textValue))return code;return null;}
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
function certaintyEscalated(body,claims){
 const weak=claims.some(c=>['UNRESOLVED','QUESTION','SYMBOLIC_CONDITIONAL','BOUNDED_SOURCE_PROJECTION_NOT_EMPIRICAL_CERTAINTY'].includes(String(c.certainty||'').toUpperCase()));
 return weak&&/\b(?:certainly|definitely|always|proves?|will)\b|(?:一定|必然|证明|就是|绝对)/iu.test(body);
}

export async function verifyReportSectionComposition({brief,candidate}={}){
 if(brief?.schemaVersion!==REPORT_SECTION_NARRATIVE_BRIEF_VERSION)throw Error('RNT2_VERIFIER_BRIEF_REQUIRED');
 const source=new Map(brief.claims.map(c=>[c.claimId,c])),reasons=[],used=new Set(),roles=new Set();
 const blocks=arr(candidate?.blocks);
 if(!blocks.length)reasons.push('NO_BLOCKS');
 for(const [index,b] of blocks.entries()){
  const role=text(b?.role).toUpperCase(),body=text(b?.text),refs=uniq(arr(b?.claimRefs));
  if(!ROLES.has(role))reasons.push(`BLOCK_ROLE_INVALID:${index}`);else roles.add(role);
  if(!body)reasons.push(`BLOCK_TEXT_REQUIRED:${index}`);
  if(!refs.length)reasons.push(`BLOCK_CLAIM_REFS_REQUIRED:${index}`);
  const claims=[];
  for(const ref of refs){
   if(!source.has(ref))reasons.push(`UNKNOWN_CLAIM_REF:${ref}`);
   else {used.add(ref);claims.push(source.get(ref));}
  }
  if(claims.length&&!hasMeaningForRole(claims,role))reasons.push(`ROLE_SUPPORT_MISMATCH:${index}:${role}`);
  const prohibited=detect(body);if(prohibited)reasons.push(`${prohibited}:${index}`);
  for(const [operator,re] of Object.entries(OPERATOR_PATTERNS))if(re.test(body)&&!licenseAllows(claims,operator))reasons.push(`UNLICENSED_${operator}:${index}`);
  if(certaintyEscalated(body,claims))reasons.push(`CERTAINTY_STRENGTHENING:${index}`);
  if(role==='OBSERVABLE_EXPRESSION'){
   const admitsObserved=claims.some(c=>c?.license?.allowsObservedReality===true);
   const questionOnly=claims.every(c=>c.claimType==='QUESTION'||arr(c.conditions).includes('QUESTION_ONLY_NOT_OBSERVED_FACT')||!admitsObserved);
   if(questionOnly&&!/[?？]|\b(?:compare|notice|observe|look for|which|what|when)\b|(?:观察|比较|留意|哪些|什么|什么时候)/iu.test(body))reasons.push(`REALITY_INFERENCE:${index}`);
  }
 }
 for(const role of brief.requiredClaimRoles)if(!roles.has(role))reasons.push(`REQUIRED_ROLE_MISSING:${role}`);
 const timingClaims=brief.claims.filter(c=>c.role==='TIMING_RELEVANCE');
 if(timingClaims.length&&brief.timingPolicy==='WHEN_AUTHORITY_PRESENT'&&!roles.has('TIMING_RELEVANCE'))reasons.push('REQUIRED_ROLE_MISSING:TIMING_RELEVANCE');
 const materialClaims=brief.claims.filter(c=>!['BOUNDARY'].includes(c.claimType));
 const usedMaterial=materialClaims.filter(c=>used.has(c.claimId));
 const coverage=materialClaims.length?usedMaterial.length/materialClaims.length:0;
 const unsupportedRefs=reasons.filter(x=>x.startsWith('UNKNOWN_CLAIM_REF:')).map(x=>x.split(':').slice(1).join(':'));
 const seed={
  schemaVersion:'PHI-OS-REPORT-SECTION-SEMANTIC-VERIFICATION-v1.1.0',
  verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,
  sourceBriefDigest:brief.briefSemanticDigest,
  accepted:reasons.length===0,
  sourceDigest:brief.sourceSemanticDigest,
  factsPreserved:unsupportedRefs.length===0,
  semanticOperatorsPreserved:!reasons.some(x=>x.startsWith('UNLICENSED_')),
  roleSemanticsPreserved:!reasons.some(x=>x.startsWith('ROLE_SUPPORT_MISMATCH:')),
  boundariesPreserved:true,
  conditionsPreserved:brief.claims.some(c=>arr(c.conditions).length)?roles.has('CONDITIONS')||roles.has('COUNTERWEIGHTS'):true,
  counterSignalsPreserved:brief.claims.some(c=>c.role==='COUNTERWEIGHTS'||arr(c.counterweights).length)?roles.has('COUNTERWEIGHTS'):true,
  uncertaintyPreserved:!reasons.some(x=>x.startsWith('CERTAINTY_STRENGTHENING:')),
  timingScopePreserved:timingClaims.length?roles.has('TIMING_RELEVANCE'):true,
  observableScopePreserved:!reasons.some(x=>x.startsWith('REALITY_INFERENCE:')),
  claimCoverage:Number(coverage.toFixed(4)),
  usedClaimRefs:[...used],
  missingClaimRefs:materialClaims.map(c=>c.claimId).filter(id=>!used.has(id)),
  unsupportedRefs,
  reasons
 };
 const verificationDigest=await sha256Stable(seed);
 return deepFreeze({...seed,verificationDigest});
}
export default Object.freeze({verifyReportSectionComposition});
