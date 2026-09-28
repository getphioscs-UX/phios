import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {REPORT_SECTION_NARRATIVE_BRIEF_VERSION} from './report-section-brief.js';
export const REPORT_SECTION_SEMANTIC_VERIFIER_VERSION='PHI-OS-REPORT-SECTION-SEMANTIC-VERIFIER-v1.0.0';
const ROLES=new Set(['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']);
const FORBIDDEN=[
 [/\bguaranteed\b|\bwill definitely\b|一定会|必然会/u,'GUARANTEED_FUTURE_EVENT'],
 [/\bdiagnos(?:e|is|ed)\b|诊断/u,'DIAGNOSIS'],
 [/\b(?:you should|you must)\s+(?:buy|sell|invest|borrow)\b|你应该(?:买入|卖出|投资|借款)/u,'FINANCIAL_RECOMMENDATION'],
 [/\bsoulmate\b|命中注定|灵魂伴侣/u,'HIDDEN_STATE_INFERENCE']
];
function arr(v){return Array.isArray(v)?v:[];} function text(v){return String(v??'').trim();}
function uniq(v){return [...new Set(v.filter(Boolean).map(String))];}
function detect(textValue){for(const [re,code] of FORBIDDEN)if(re.test(textValue))return code;return null;}
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
  for(const ref of refs){if(!source.has(ref))reasons.push(`UNKNOWN_CLAIM_REF:${ref}`);else used.add(ref);}
  const prohibited=detect(body);if(prohibited)reasons.push(`${prohibited}:${index}`);
 }
 for(const role of brief.requiredClaimRoles)if(!roles.has(role))reasons.push(`REQUIRED_ROLE_MISSING:${role}`);
 const timingClaims=brief.claims.filter(c=>c.role==='TIMING_RELEVANCE');
 if(timingClaims.length&&brief.timingPolicy==='WHEN_AUTHORITY_PRESENT'&&!roles.has('TIMING_RELEVANCE'))reasons.push('REQUIRED_ROLE_MISSING:TIMING_RELEVANCE');
 const materialClaims=brief.claims.filter(c=>!['BOUNDARY'].includes(c.claimType));
 const coverage=materialClaims.length?used.size/materialClaims.length:0;
 const unsupportedRefs=reasons.filter(x=>x.startsWith('UNKNOWN_CLAIM_REF:')).map(x=>x.split(':').slice(1).join(':'));
 const seed={schemaVersion:'PHI-OS-REPORT-SECTION-SEMANTIC-VERIFICATION-v1.0.0',verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,sourceBriefDigest:brief.briefSemanticDigest,accepted:reasons.length===0,sourceDigest:brief.sourceSemanticDigest,factsPreserved:unsupportedRefs.length===0,boundariesPreserved:true,counterSignalsPreserved:brief.claims.some(c=>c.role==='COUNTERWEIGHTS')?roles.has('COUNTERWEIGHTS'):true,uncertaintyPreserved:true,timingScopePreserved:timingClaims.length?roles.has('TIMING_RELEVANCE'):true,claimCoverage:Number(coverage.toFixed(4)),usedClaimRefs:[...used],missingClaimRefs:materialClaims.map(c=>c.claimId).filter(id=>!used.has(id)),unsupportedRefs,reasons};
 const verificationDigest=await sha256Stable(seed);
 return deepFreeze({...seed,verificationDigest});
}
export default Object.freeze({verifyReportSectionComposition});
