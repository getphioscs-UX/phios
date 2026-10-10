// Local architecture review contract. Not imported by any customer route or provider.
export const BINDING_KEYS=Object.freeze(['accountId','personId','chartDigest','timingDigest','evidenceDigest','authorityRevision','compositionRevision','sectionSchema','locale','subjectScope']);
export function selectCompositionLane({context,accepted=[]}={}){
 if(!context||BINDING_KEYS.some(k=>typeof context[k]!=='string'||!context[k].trim()))return {lane:'NONE',state:'BLOCKED_BINDING_INCOMPLETE',release:false};
 const match=accepted.find(c=>c?.humanAcceptance===true&&c.completeCoverage===true&&c.receiptDigest&&BINDING_KEYS.every(k=>c.binding?.[k]===context[k]));
 return match?{lane:'A',state:'EXACT_CONTEXT_REUSE_CANDIDATE',receiptDigest:match.receiptDigest,release:false}:{lane:'B',state:'GOVERNED_COMPOSITION_PROPOSAL_ONLY',release:false};
}
export function inspectCompositionEnvelope({context,envelope,admittedClaimIds=[]}={}){
 const reasons=[];
 if(!context||!envelope||BINDING_KEYS.some(k=>!context[k]||envelope.binding?.[k]!==context[k]))reasons.push('SUBJECT_CONTEXT_REVISION_MISMATCH');
 if(envelope?.sectionSchema!=='BDM-S02-S10')reasons.push('SECTION_SCHEMA_NOT_ADMITTED');
 const rows=envelope?.sections||[];
 if(rows.length!==9||new Set(rows.map(r=>r.sectionId)).size!==9||rows.some(r=>!/^S0[2-9]$|^S10$/.test(r.sectionId)))reasons.push('INCOMPLETE_SECTION_COVERAGE');
 for(const row of rows){
  if(!row.zh?.trim()||!row.en?.trim())reasons.push('BILINGUAL_INCOMPLETE');
  if(!Array.isArray(row.claimRefs)||!row.claimRefs.length||row.claimRefs.some(id=>!admittedClaimIds.includes(id)))reasons.push('UNADMITTED_CLAIM_REFERENCE');
  if(/guaranteed|will definitely|一定会|必然会|AuthorityPack|checkpoint|runtime|生产准入|治理管线/iu.test(`${row.zh} ${row.en}`))reasons.push('FORBIDDEN_CUSTOMER_ASSERTION_OR_INTERNAL_TEXT');
 }
 return {state:reasons.length?'REJECTED':'MACHINE_SCREEN_ONLY',reasons:[...new Set(reasons)],professionalQualityAccepted:false,bilingualEquivalenceAccepted:false,humanAcceptance:false,release:false};
}
export function providerExecutionDisposition(){return Object.freeze({enabled:false,providerCalls:0,openAiCalls:0,automaticPaidRetries:0,automaticSave:false,automaticRelease:false,state:'SEPARATE_EXPLICIT_AUTHORIZATION_REQUIRED'});}
