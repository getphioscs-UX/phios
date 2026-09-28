import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {assertReportSectionNarrativeContract} from './report-section-contract.js';
export const REPORT_SECTION_NARRATIVE_BRIEF_VERSION='PHI-OS-REPORT-SECTION-NARRATIVE-BRIEF-v1.0.0';
function arr(v){return Array.isArray(v)?v:[];} function text(v){return String(v??'').trim();}
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
function roleForClaim(c){
 const t=text(c.claimType||c.relationType).toUpperCase();
 if(['EMPHASIS','CO_OCCURRING_DIMENSIONS','ASSOCIATION','CONTEXT_MODIFIER'].includes(t))return 'STRUCTURE';
 if(['LIFE_DOMAIN_EXPLANATION'].includes(t))return 'MEANING';
 if(['OPERATING_CONDITION','SUPPORT_CONDITION'].includes(t))return 'CONDITIONS';
 if(['TENSION','CONTRAST','OPEN_CONDITION','COUNTER_SIGNAL'].includes(t))return 'COUNTERWEIGHTS';
 if(['TEMPORAL_RELEVANCE'].includes(t))return 'TIMING_RELEVANCE';
 if(['CROSS_SECTION_RELEVANCE'].includes(t))return 'NAVIGATION';
 return null;
}
export async function buildReportSectionNarrativeBrief({contract,richClaimIr,locale,styleIntent={},sourceAuthorityVersion=null}={}){
 assertReportSectionNarrativeContract(contract);
 if(!['en','zh-Hans'].includes(locale))fail('RNT2_BRIEF_LOCALE_REQUIRED');
 const claims=arr(richClaimIr?.claims).filter(c=>c&&text(c.claimId||c.id)&&text(c.text)).map(c=>{
  const claimId=text(c.claimId||c.id),role=text(c.explanationRole)||roleForClaim(c);
  return Object.freeze({claimId,role:role||'STRUCTURE',text:text(c.text),claimType:text(c.claimType||c.relationType),priority:text(c.priority)||'SUPPORTING',semanticOperators:Object.freeze(arr(c.semanticOperators)),conditions:Object.freeze(arr(c.conditions)),counterweights:Object.freeze(arr(c.counterweights)),timing:Object.freeze(arr(c.timing)),observableSignals:Object.freeze(arr(c.observableSignals)),certainty:text(c.certainty)||text(c.modality)||'BOUNDED',sourceRefs:Object.freeze(arr(c.sourceRefs).map(String)),license:c.license||null});
 });
 for(const q of arr(richClaimIr?.reflectionQuestions)){
  if(!text(q?.id)||!text(q?.text))continue;
  claims.push(Object.freeze({claimId:text(q.id),role:'OBSERVABLE_EXPRESSION',text:text(q.text),claimType:'QUESTION',priority:'SUPPORTING',semanticOperators:Object.freeze(['QUESTION']),conditions:Object.freeze(['QUESTION_ONLY_NOT_OBSERVED_FACT']),counterweights:Object.freeze([]),timing:Object.freeze([]),observableSignals:Object.freeze([]),certainty:'QUESTION',sourceRefs:Object.freeze(arr(q.sourceRefs).map(String)),license:Object.freeze({allowsObservedReality:false})}));
 }
 if(!claims.length)fail('RNT2_BRIEF_CLAIMS_REQUIRED');
 const sourceDigest=await sha256Stable({version:richClaimIr.version||null,claims:claims.map(c=>({claimId:c.claimId,text:c.text,sourceRefs:c.sourceRefs,certainty:c.certainty,role:c.role}))});
 const briefSeed={
  schemaVersion:REPORT_SECTION_NARRATIVE_BRIEF_VERSION,
  methodId:contract.methodId,sectionKey:contract.sectionKey,locale,
  customerQuestion:contract.customerQuestion,customerOutcome:contract.customerOutcome,
  requiredClaimRoles:contract.requiredClaimRoles,optionalClaimRoles:contract.optionalClaimRoles,
  claims,
  reflectionQuestions:Object.freeze(arr(richClaimIr.reflectionQuestions).map(q=>({id:text(q.id),text:text(q.text),claimIds:Object.freeze(arr(q.claimIds).map(String)),sourceRefs:Object.freeze(arr(q.sourceRefs).map(String))}))),
  counterPrompts:Object.freeze(arr(richClaimIr.counterPrompts).map(q=>({id:text(q.id),text:text(q.text),claimIds:Object.freeze(arr(q.claimIds).map(String)),sourceRefs:Object.freeze(arr(q.sourceRefs).map(String))}))),
  factsAiMustNotAlter:Object.freeze(claims.flatMap(c=>c.sourceRefs).filter(Boolean).map(ref=>({lockType:'SOURCE_REF',value:ref}))),
  prohibitedClaims:contract.forbiddenInferenceClasses,
  timingPolicy:contract.timingPolicy,boundaryPolicy:contract.boundaryPolicy,realityBridgePolicy:contract.realityBridgePolicy,
  styleIntent:Object.freeze({tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',customerReadable:true,explanationFirst:true,governanceJargonDefault:false,...styleIntent}),
  depthTarget:contract.depthTarget,
  claimIrVersion:richClaimIr.version||'UNVERSIONED_CLAIM_IR',
  sourceAuthorityVersion:sourceAuthorityVersion||richClaimIr.version||null,
  sourceSemanticDigest:sourceDigest,
  narrativeFreedom:Object.freeze({mayVary:['paragraph order','transitions','natural phrasing','licensed explanation depth'],mustPreserve:['claim meaning','uncertainty','conditions','counterweights','timing scope','boundaries','source lineage'],mayRecalculateFacts:false,mayInventLifeEvents:false,mayInventCurrentReality:false})
 };
 const briefSemanticDigest=await sha256Stable(briefSeed);
 return deepFreeze({...briefSeed,briefSemanticDigest});
}
export default Object.freeze({buildReportSectionNarrativeBrief});
