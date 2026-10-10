import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const NARRATIVE_VERIFICATION_SCHEMA='PHI-OS-NARRATIVE-CLAIM-VERIFICATION-v1.0.0';
export const NARRATIVE_VERIFIER_VERSION='PHI-OS-NARRATIVE-CLAIM-VERIFIER-v1.0.0';
const DRAFT='PHI-OS-NARRATIVE-DRAFT-v1.0.0';
const W53='PHI-OS-PERSONAL-READING-EVIDENCE-WRITING-RULES-v2.0.0',W54='PHI-OS-NO-UNSUPPORTED-FACTUAL-PERSONALITY-CLAIM-v1.0.0';
const ALWAYS_PROHIBITED=new Set(['DIAGNOSIS','MEDICAL_DIAGNOSIS','MENTAL_HEALTH_DIAGNOSIS','FINANCIAL_RECOMMENDATION','LEGAL_CONCLUSION','GUARANTEED_FUTURE_EVENT','OBJECTIVE_RELATIONSHIP_FACT','OBJECTIVE_PERSONALITY_FACT','PARTNER_HIDDEN_STATE_INFERENCE','COMPATIBILITY_PERCENTAGE','DESTINY_OR_SOULMATE_VERDICT','STAY_LEAVE_DIRECTIVE','GUARANTEED_RELATIONSHIP_OUTCOME','SCIENTIFIC_VALIDATION_TRANSFER','IQ','PERCENTILE','COGNITIVE_DIAGNOSIS']);
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;} function arr(v){return Array.isArray(v)?v:[];} function clean(v){return typeof v==='string'?v.trim():'';}
function allSignals(brief){const out=[];for(const key of ['coreThemes','priorityFindings','importantRelationships','methodSignals','profileSignals','crossPerspectiveSignals','crossSourceSignals','currentRealitySignals','relationshipCoreThemes','connectionDynamics','complementaryDynamics','tensions','asymmetries','misreadRisks','sharedLifeThemes','resourceThemes','decisionThemes','currentReality','nonConvergence'])out.push(...arr(brief?.[key]));if(brief?.profileSignals&&typeof brief.profileSignals==='object'&&!Array.isArray(brief.profileSignals))out.push(...arr(brief.profileSignals.A),...arr(brief.profileSignals.B));return out;}
function allowedRefs(brief){const set=new Set();for(const s of allSignals(brief)){for(const r of arr(s?.refs))set.add(String(r));for(const k of ['claimRefs','profileEvidenceRefs','observationRefs'])for(const r of arr(s?.[k]))set.add(String(r));if(clean(s?.signalId))set.add(clean(s.signalId));}
  for(const l of arr(brief.sourceClassLocks))if(clean(l?.sourceRef))set.add(clean(l.sourceRef));for(const l of arr(brief.profileSourceClassLocks))if(clean(l?.profileSignalRef))set.add(clean(l.profileSignalRef));
  for(const p of [brief.participantA,brief.participantB]){for(const r of arr(p?.relevantMethodRefs))set.add(String(r));}
  return set;
}
function textProhibition(text,brief){const t=clean(text).toLowerCase();if(!t)return null;
  const rules=[[/\bdiagnos(?:e|is|ed)\b|抑郁症|诊断/u,'DIAGNOSIS'],[/\b(?:you should|you must)\s+(?:buy|sell|invest|borrow|refinance)\b|\bfinancial recommendation\b|你应该(?:买入|卖出|投资|借款)|理财建议/u,'FINANCIAL_RECOMMENDATION'],[/\blegally\s+(?:you|this)|\blegal conclusion\b|法律上你|法律结论/u,'LEGAL_CONCLUSION'],[/\bwill definitely\b|\bguaranteed\b|一定会|必然会/u,'GUARANTEED_FUTURE_EVENT'],[/\bsecretly\b|内心其实|其实不爱|private intention|hidden feeling/u,'PARTNER_HIDDEN_STATE_INFERENCE'],[/\b\d{1,3}\s*%\s*(?:compatible|compatibility)|兼容度\s*\d{1,3}%/u,'COMPATIBILITY_PERCENTAGE'],[/\bsoulmate\b|命中注定|灵魂伴侣/u,'DESTINY_OR_SOULMATE_VERDICT'],[/\bmust leave\b|\bmust stay\b|你必须离开|你必须留下/u,'STAY_LEAVE_DIRECTIVE'],[/\biq\b|智商/u,'IQ'],[/\bpercentile\b|百分位/u,'PERCENTILE'],[/scientifically proves|scientific validation|科学证明/u,'SCIENTIFIC_VALIDATION_TRANSFER']];
  for(const [re,cls] of rules)if(re.test(t))return cls;
  if(arr(brief?.factsAiDoesNotKnow).some(x=>t.includes(String(x).toLowerCase())))return 'PARTNER_HIDDEN_STATE_INFERENCE';
  return null;
}
function sourceClassDrift(claim){const sc=arr(claim.sourceClasses);const text=clean(claim.text).toLowerCase();if(sc.some(x=>['CUSTOMER_SELF_REPORT','STANDARDIZED_SELF_REPORT','EXTERNAL_PROFILE_RESULT'].includes(x))&&/(objectively|definitively|you are always|客观上|你就是)/u.test(text))return 'PROFILE_SOURCE_CLASS_OVERCLAIM';if(sc.includes('MEASURED_TASK_PERFORMANCE')&&/(iq|percentile|智商|百分位)/u.test(text))return 'REASONING_TASK_NORMING_OVERCLAIM';if(sc.length>1&&/(proves|validated|科学证明|证实了)/u.test(text))return 'CROSS_SOURCE_PROOF_OVERCLAIM';return null;}
function precisionOverclaim(claim,brief){const p=brief?.narrativeFreedom?.precisionBoundary||brief?.precisionBoundary||null;const level=clean(p?.overallPrecision).toUpperCase();if(!['LOW','UNKNOWN'].includes(level))return null;const t=clean(claim?.text).toLowerCase();return /(definitely|certainly|clearly shows|always means|毫无疑问|明确证明|一定就是|必然是)/u.test(t)?'INPUT_PRECISION_OVERCLAIM':null;}
function classify(claim,brief,known){
  const explicit=clean(claim.claimClass).toUpperCase();const prohibited=textProhibition(claim.text,brief)||sourceClassDrift(claim)||precisionOverclaim(claim,brief);
  if(prohibited||ALWAYS_PROHIBITED.has(explicit)||arr(brief.prohibitedClaimClasses).includes(explicit))return {classification:'PROHIBITED_CLAIM',repairRequired:true,reasonCode:prohibited||explicit,supportRefs:[]};
  if(explicit==='STYLE_ONLY'||explicit==='METAPHOR'||explicit==='NARRATIVE_TRANSITION')return {classification:'STYLE_ONLY',repairRequired:false,reasonCode:'STYLE_NO_FACTUAL_AUTHORITY',supportRefs:[]};
  const refs=arr(claim.supportRefs).map(String);const valid=refs.length>0&&refs.every(r=>known.has(r));
  if(['SUPPORTED_FACT','NEW_FACTUAL_PERSONALITY_ASSERTION','NEW_LIFE_EVENT','OBJECTIVE_RELATIONSHIP_FACT'].includes(explicit))return valid?{classification:'SUPPORTED_FACT',repairRequired:false,reasonCode:'SUPPORTED_BY_BRIEF_REFS',supportRefs:refs}:{classification:'UNSUPPORTED_FACT',repairRequired:true,reasonCode:'FACT_SUPPORT_MISSING_OR_UNKNOWN',supportRefs:refs.filter(r=>known.has(r))};
  if(explicit==='SUPPORTED_SYNTHESIS')return valid&&refs.length>=1?{classification:'SUPPORTED_SYNTHESIS',repairRequired:false,reasonCode:'SYNTHESIS_SUPPORTED_BY_BRIEF_REFS',supportRefs:refs}:{classification:'UNSUPPORTED_FACT',repairRequired:true,reasonCode:'SYNTHESIS_SUPPORT_MISSING_OR_UNKNOWN',supportRefs:refs.filter(r=>known.has(r))};
  return {classification:'AMBIGUOUS',repairRequired:true,reasonCode:'CLAIM_CLASS_NOT_VERIFIABLE',supportRefs:refs.filter(r=>known.has(r))};
}
export async function verifyNarrativeClaims({brief,draft,evidenceWritingRules,factualGuard}={}){
  if(draft?.schemaVersion!==DRAFT)fail('W54N2_DRAFT_SCHEMA_REQUIRED');if(draft.sourceBriefDigest!==brief?.briefSemanticDigest)fail('W54N2_BRIEF_DRAFT_DIGEST_MISMATCH');
  if(evidenceWritingRules?.schemaVersion!==W53||evidenceWritingRules?.rulesetBoundaries?.postGenerationVerifierAuthority!==true)fail('W54N2_W53_AUTHORITY_REQUIRED');if(factualGuard?.schemaVersion!==W54)fail('W54N2_W54_AUTHORITY_REQUIRED');
  const known=allowedRefs(brief),claims=[];for(const c of arr(draft.claims)){const v=classify(c,brief,known);claims.push({claimId:c.claimId,sentenceRef:c.sentenceRef,classification:v.classification,supportRefs:v.supportRefs,repairRequired:v.repairRequired,reasonCode:v.reasonCode});}
  const counts=Object.fromEntries(['SUPPORTED_FACT','SUPPORTED_SYNTHESIS','STYLE_ONLY','UNSUPPORTED_FACT','PROHIBITED_CLAIM','AMBIGUOUS'].map(k=>[k,claims.filter(x=>x.classification===k).length]));
  const seed={schemaVersion:NARRATIVE_VERIFICATION_SCHEMA,sourceBriefDigest:brief.briefSemanticDigest,draftDigest:draft.draftDigest,verifierVersion:NARRATIVE_VERIFIER_VERSION,claims,summary:{...counts,total:claims.length,repairRequiredCount:claims.filter(x=>x.repairRequired).length,passed:claims.every(x=>!x.repairRequired)},governance:{w53AuthorityUsed:true,w54AuthorityUsed:true,briefFactsAreAuthority:true,writerModelIsNotAuthority:true}};
  const verificationDigest=await sha256Stable(seed);return deepFreeze({...seed,verificationDigest});
}
export default Object.freeze({verifyNarrativeClaims});
