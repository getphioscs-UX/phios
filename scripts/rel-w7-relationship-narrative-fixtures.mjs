import fs from 'node:fs';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {normalizeRelationshipIntent} from '../functions/personal-reading/relationship/relationship-intent.js';
import {buildRelationshipParticipantReadingSet} from '../functions/personal-reading/relationship/relationship-participant-reading-set.js';
import {
  normalizeRelationshipCurrentRealityInput,
  buildRelationshipCurrentRealityIR,
  buildRelationshipRealityComparisonCandidates,
  buildRelationshipRealityComparisons,
  RELATIONSHIP_CURRENT_REALITY_PURPOSE,
  REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA
} from '../functions/personal-reading/relationship/relationship-current-reality.js';
import {buildProfileSignalEnvelope} from '../functions/profile/profile-foundation-runtime.js';
import {buildRelationshipProfileEvidence} from '../functions/profile/profile-context-runtime.js';
import {buildCrossEvidenceRelationshipSynthesis} from '../functions/personal-reading/relationship/relationship-cross-evidence-synthesis.js';

export const METHODS=['AST','BZR','ZWR','NUM','ECR','HD'];
export const genericBriefContract=JSON.parse(fs.readFileSync('content/personal-reading/narrative/contracts/narrative-brief-contract-v1.json','utf8'));
export const crossRules=JSON.parse(fs.readFileSync('content/personal-reading/relationship/cross-evidence/registries/cross-evidence-relationship-rule-registry-v1.json','utf8'));
export const profileRules=JSON.parse(fs.readFileSync('content/profile/relationship/registries/relationship-profile-comparison-rule-registry-v1.json','utf8'));
const capabilityMatrix={methods:METHODS.map(methodId=>({methodId,relationshipCompositionSupported:'SUPPORTED',customerPublishable:true}))};
const CLAIM_CLASSES=['CONNECTION','COMPLEMENT','TENSION','ASYMMETRY','MISREAD_RISK','RESOURCE_DYNAMIC','DECISION_DYNAMIC','TIMING_CONTEXT','OPEN'];

async function acceptedReading(methodId,side,index){
  const units=[1,2].map(n=>({
    interpretationUnitId:`${methodId}-${side}-${index}-${n}`,
    summary:`Accepted ${methodId} baseline theme ${n} for participant ${side} in relationship case ${index}.`,
    confidenceBoundary:`${methodId} remains bounded by its admitted reading authority for participant ${side}.`
  }));
  const semanticDigest=await sha256Stable({methodId,side,index,units});
  return {schemaVersion:'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0',methodId,readingAuthorityRef:`AUTH:${methodId}:${side}:${index}`,semanticDigest,acceptedUnits:units,priorityRefs:[units[0].interpretationUnitId],boundaryFlags:[`${methodId}:PRECISION:PRESERVED`],boundary:{acceptedAuthorityOnly:true}};
}

async function participantSet(intent,index,methods,{withB=true,astUnavailable=false}={}){
  const effective=astUnavailable?methods.filter(x=>x!=='AST'):methods;
  const pairs=[];
  for(const methodId of effective){pairs.push({methodId,A:await acceptedReading(methodId,'A',index),B:withB?await acceptedReading(methodId,'B',index):null});}
  const participantAInputDigest=await sha256Stable({case:index,side:'A'});
  const participantBInputDigest=withB?await sha256Stable({case:index,side:'B'}):null;
  return buildRelationshipParticipantReadingSet({relationshipIntentId:intent.relationshipIntentId,participantARef:'PERSON-A',participantBRef:withB?'PERSON-B':null,participantAInputDigest,participantBInputDigest,methodPairs:pairs,capabilityMatrix});
}

function sourceClaim(methodId,n,index){
  const claimClass=CLAIM_CLASSES[n%CLAIM_CLASSES.length];
  return {
    schemaVersion:'PHI-OS-METHOD-RELATIONSHIP-CLAIM-v1.0.0',
    relationshipClaimId:`RELCL-W7-${String(index).padStart(2,'0')}-${methodId}-${n}`,
    methodId,
    participantARefs:[`A:${methodId}`],
    participantBRefs:[`B:${methodId}`],
    compositionRuleId:`REL-W4-${methodId}-RULE-${claimClass}`,
    semanticOwnerId:`${methodId}:REL:${claimClass}:${n}`,
    claimClass,
    headline:`${methodId} ${claimClass.toLowerCase()} relationship claim`,
    summary:`${methodId} contributes an admitted ${claimClass.toLowerCase().replaceAll('_',' ')} relationship structure in case ${index}.`,
    supportRefs:[`${methodId}:SUPPORT:${index}:${n}`],
    tensionRefs:claimClass==='TENSION'?[`${methodId}:TENSION:${index}:${n}`]:[],
    conditionRefs:[`${methodId}:CONDITION:${index}:${n}`],
    counterRefs:claimClass==='OPEN'?[`${methodId}:COUNTER:${index}:${n}`]:[],
    timingRefs:claimClass==='TIMING_CONTEXT'?[`${methodId}:TIMING:${index}:${n}`]:[],
    precisionBoundaryRefs:methodId==='AST'?[`AST:TIME_PRECISION:CASE:${index}`]:[],
    sourceRefs:[`${methodId}:SOURCE:${index}:${n}`],
    customerPublishable:false,
    governance:{humanAdmissionState:'PENDING',compatibilityScoreCreated:false,partnerHiddenStateInferred:false}
  };
}

async function claimSnapshot(methods,index){
  const claims=[];
  for(let n=0;n<9;n++){
    const methodId=methods[n%methods.length];
    const c=sourceClaim(methodId,n,index);
    claims.push({relationshipClaimId:c.relationshipClaimId,methodId:c.methodId,semanticOwnerId:c.semanticOwnerId,claimClass:c.claimClass,headline:c.headline,summary:c.summary,sourceClaim:c,admissionState:'HUMAN_ADMITTED',admissionRef:`REL-W4:${c.methodId}:HUMAN`,sourceClass:'SYMBOLIC_INTERPRETATION',customerPublishable:true});
  }
  const semanticDigest=await sha256Stable(claims.map(x=>({id:x.relationshipClaimId,method:x.methodId,owner:x.semanticOwnerId,cls:x.claimClass})));
  return {schemaVersion:REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA,methods:[...new Set(methods)].sort(),claimEntries:claims,claimCount:claims.length,governance:{onlyHumanAdmittedRelationshipClaims:true},semanticDigest};
}

async function profilePair(index,sourceClass){
  const common={domainId:'COMMUNICATION_STYLE',assessmentDate:'2026-09-01',customerConfirmed:true,precisionBoundary:['Profile evidence remains source-bounded and is not an objective relationship fact.']};
  if(sourceClass==='EXTERNAL_PROFILE_RESULT'){
    const A=await buildProfileSignalEnvelope({...common,participantRef:'PERSON-A',sourceClass,sourceRef:`EXT:A:${index}`,providerFamily:'16P_NERIS',value:'DIRECT',valueType:'LABEL',confidence:'EXTERNAL_RESULT_CONFIRMED',provenance:[{source:'fixture'}]});
    const B=await buildProfileSignalEnvelope({...common,participantRef:'PERSON-B',sourceClass,sourceRef:`EXT:B:${index}`,providerFamily:'16P_NERIS',value:'REFLECTIVE',valueType:'LABEL',confidence:'EXTERNAL_RESULT_CONFIRMED',provenance:[{source:'fixture'}]});
    return [A,B];
  }
  if(sourceClass==='MEASURED_TASK_PERFORMANCE'){
    const task={...common,domainId:'REASONING_TASK_PERFORMANCE',facetId:'PATTERN_COMPLETION'};
    const A=await buildProfileSignalEnvelope({...task,participantRef:'PERSON-A',sourceClass,sourceRef:`TASK:A:${index}`,value:{rawCorrect:4,rawAttempted:5},valueType:'OBJECT',confidence:'TASK_OBSERVED',provenance:[{source:'fixture'}]});
    const B=await buildProfileSignalEnvelope({...task,participantRef:'PERSON-B',sourceClass,sourceRef:`TASK:B:${index}`,value:{rawCorrect:3,rawAttempted:5},valueType:'OBJECT',confidence:'TASK_OBSERVED',provenance:[{source:'fixture'}]});
    return [A,B];
  }
  const confidence=sourceClass==='CUSTOMER_SELF_REPORT'?'CUSTOMER_CONFIRMED':'CUSTOMER_CONFIRMED';
  const A=await buildProfileSignalEnvelope({...common,participantRef:'PERSON-A',sourceClass,sourceRef:`PROFILE:A:${index}:${sourceClass}`,value:'DIRECT',valueType:'LABEL',confidence,provenance:[{source:'fixture'}]});
  const B=await buildProfileSignalEnvelope({...common,participantRef:'PERSON-B',sourceClass,sourceRef:`PROFILE:B:${index}:${sourceClass}`,value:'REFLECTIVE',valueType:'LABEL',confidence,provenance:[{source:'fixture'}]});
  return [A,B];
}

async function profileEvidence(intent,signals,sourceClass,index){
  if(!signals.length||sourceClass==='STANDARDIZED_SELF_REPORT')return null;
  let ruleId='PRF-REL-SELF-REPORT-SAME-DOMAIN-v1',comparisonClass='DIFFERENT_SELF_REPORTED_TENDENCY';
  if(sourceClass==='EXTERNAL_PROFILE_RESULT')ruleId='PRF-REL-EXTERNAL-SAME-PROVIDER-DIMENSION-v1';
  if(sourceClass==='MEASURED_TASK_PERFORMANCE'){ruleId='PRF-REL-REASONING-SAME-TASK-FAMILY-CONTEXT-v1';comparisonClass='COMMUNICATION_OBSERVATION_TARGET';}
  return buildRelationshipProfileEvidence({relationshipIntent:intent,participantARef:'PERSON-A',participantBRef:'PERSON-B',profileSignals:signals,comparisons:[{ruleId,comparisonClass,explicitComparison:true,signalARef:signals[0].profileSignalId,signalBRef:signals[1].profileSignalId,topicId:signals[0].domainId,statement:`Profile relationship evidence remains a source-bounded observation target in case ${index}.`}],comparisonRuleRegistry:profileRules});
}

async function realityBundle(intent,snapshot,index,{mode='SUPPORT',sensitive=false}={}){
  if(mode==='NONE'){
    const normalized=normalizeRelationshipCurrentRealityInput({},intent);
    return {ir:await buildRelationshipCurrentRealityIR(normalized),comparisons:[]};
  }
  const consentRef=sensitive?`REL-SENSITIVE-${index}`:`REL-CONSENT-${index}`;
  const normalized=normalizeRelationshipCurrentRealityInput({optIn:true,purposeCode:RELATIONSHIP_CURRENT_REALITY_PURPOSE,observations:[{scope:index%3===0?'OTHER_AS_OBSERVED':'US',domain:index%2===0?'COMMUNICATION':'PRACTICAL_PRESSURE',statement:`Customer-observed relationship reality in case ${index}.`,source:'CUSTOMER',confidence:'HIGH',observableVsInterpretive:index%4===0?'CUSTOMER_INTERPRETATION':'OBSERVABLE',sensitive,consentRef}],sensitiveConsent:sensitive,sensitiveConsentRef:sensitive?consentRef:null},intent);
  const ir=await buildRelationshipCurrentRealityIR(normalized);
  if(!snapshot?.claimEntries?.length)return {ir,comparisons:[]};
  const selected=snapshot.claimEntries.slice(0,2).map(x=>x.relationshipClaimId);
  const candidates=await buildRelationshipRealityComparisonCandidates({claimSnapshot:snapshot,selectedClaimRefs:selected});
  const state=mode==='SUPPORT'?'CURRENTLY_RESONANT':mode==='CONTRADICT'?'CURRENTLY_NOT_RESONANT':mode==='OPEN'?'OPEN':'PARTIALLY_RESONANT';
  const responses=candidates.map(c=>({candidateId:c.candidateId,state,observationRefs:[ir.observations[0].relationshipObservationId]}));
  const set=await buildRelationshipRealityComparisons({relationshipIntentId:intent.relationshipIntentId,candidates,responses,relationshipCurrentRealityIr:ir});
  return {ir,comparisons:set.comparisons};
}

async function crossIr(intent,snapshot,signals,evidence,reality,index,{astUnavailable=false}={}){
  const entries=snapshot.claimEntries;
  const pair1=[entries[0].relationshipClaimId,entries.find(x=>x.methodId!==entries[0].methodId)?.relationshipClaimId].filter(Boolean);
  const pair2=[entries[2]?.relationshipClaimId,entries.find(x=>x.methodId!==entries[2]?.methodId)?.relationshipClaimId].filter(Boolean);
  const symbolicRequests=[
    {ruleId:'REL-W6-XM-EXPLICIT-MULTI-METHOD-v1',group:'COMMON_EMPHASIS',topicId:'SHARED_LIFE',claimRefs:pair1,statement:`Two admitted methods share an explicit relationship emphasis in case ${index}; this is synthesis, not proof.`},
    {ruleId:'REL-W6-XM-EXPLICIT-MULTI-METHOD-v1',group:'COMPLEMENTARY_VIEW',topicId:'DECISION_MAKING',claimRefs:pair2,statement:`Two admitted methods offer complementary relationship views in case ${index}.`},
    {ruleId:'REL-W6-XM-EXPLICIT-MULTI-METHOD-v1',group:'TENSION',topicId:'COMMUNICATION',claimRefs:pair1,statement:`The admitted methods preserve a relationship tension in case ${index}.`},
    {ruleId:'REL-W6-XM-EXPLICIT-MULTI-METHOD-v1',group:index%3===0?'NON_CONVERGENCE':'OPEN',topicId:'CURRENT_PHASE',claimRefs:pair2,statement:`The cross-evidence relationship synthesis remains ${index%3===0?'non-convergent':'open'} in case ${index}.`}
  ];
  const profileRequests=evidence?[{ruleId:'REL-W6-XP-ADMITTED-PROFILE-EVIDENCE-v1',group:index%2===0?'PROFILE_ALIGNMENT':'PROFILE_DIFFERENCE',topicId:'COMMUNICATION_STYLE',profileEvidenceRefs:[evidence.evidence[0].relationshipProfileEvidenceId],statement:`Profile evidence is preserved as Profile evidence in case ${index}.`}]:[];
  const mixedSourceRequests=evidence?[{ruleId:'REL-W6-XS-SYMBOLIC-PROFILE-TENSION-v1',group:'SOURCE_TENSION',topicId:'COMMUNICATION',claimRefs:[pair1[0]],profileEvidenceRefs:[evidence.evidence[0].relationshipProfileEvidenceId],statement:`Symbolic and Profile sources remain distinct where they pull differently in case ${index}.`}]:[];
  const methodContext=astUnavailable?[{methodId:'AST',state:'UNAVAILABLE',reasonRefs:['PERSON_B_TIME_UNKNOWN'],precisionBoundaryRefs:['PERSON_B_TIME_UNKNOWN']}]:[];
  return buildCrossEvidenceRelationshipSynthesis({relationshipIntent:intent,claimSnapshot:snapshot,profileSignals:signals,relationshipProfileEvidenceIr:evidence,relationshipCurrentRealityIr:reality.ir,relationshipRealityComparisons:reality.comparisons,symbolicRequests,profileRequests,mixedSourceRequests,methodContext,ruleRegistry:crossRules});
}

export async function buildSpecificRelW7Case(index=1,options={}){
  const methodCount=options.methodCount??Math.max(2,Math.min(6,(index%5)+2));
  const astUnavailable=options.astUnavailable===true;
  let methods=METHODS.slice(0,methodCount);
  if(astUnavailable)methods=methods.filter(x=>x!=='AST');
  if(methods.length<2)methods=['BZR','ZWR'];
  const intent=normalizeRelationshipIntent({relationshipIntentId:`REL-W7-SPEC-${String(index).padStart(2,'0')}`,mode:'SPECIFIC_PERSON_RELATIONSHIP',relationshipType:'PARTNER',focusAreas:['COMMUNICATION','SHARED_LIFE','CURRENT_PHASE'],participantARef:'PERSON-A',customerQuestion:`What is most useful to understand about this relationship in case ${index}?`,locale:index%2===0?'zh-Hans':'en',purpose:'RELATIONSHIP_READING',consent:{relationshipReadingUseAllowed:true,consentRecordId:`REL-CONSENT-${index}`}});
  const set=await participantSet(intent,index,methods,{withB:true,astUnavailable:false});
  const snapshot=await claimSnapshot(methods,index);
  const sourceClasses=['CUSTOMER_SELF_REPORT','EXTERNAL_PROFILE_RESULT','MEASURED_TASK_PERFORMANCE','STANDARDIZED_SELF_REPORT'];
  const hasProfile=options.hasProfile??index%2===0;
  const sourceClass=options.profileSourceClass??sourceClasses[index%sourceClasses.length];
  const signals=hasProfile?await profilePair(index,sourceClass):[];
  const evidence=hasProfile?await profileEvidence(intent,signals,sourceClass,index):null;
  const realityMode=options.realityMode??['SUPPORT','CONTRADICT','OPEN','NONE'][index%4];
  const reality=await realityBundle(intent,snapshot,index,{mode:realityMode,sensitive:options.sensitive??index%6===0});
  const cross=await crossIr(intent,snapshot,signals,evidence,reality,index,{astUnavailable});
  return {genericNarrativeBriefContract:genericBriefContract,relationshipIntent:intent,participantReadingSet:set,claimSnapshot:snapshot,profileSignals:signals,crossMethodRelationshipIr:cross,relationshipCurrentRealityIr:reality.ir,relationshipRealityComparisons:reality.comparisons,styleIntent:{tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',phiOsLens:'SPARING',explanationFirst:true,customerReadable:true,governanceJargonDefault:false},customerContext:options.customerContext??(index%4===0?`Customer reports an explicit relationship context for case ${index}; treat it as reported context, not objective knowledge of Person B.`:null)};
}

export async function buildSelfRelW7Case(index=1,{hasProfile=true,sensitive=false}={}){
  const intent=normalizeRelationshipIntent({relationshipIntentId:`REL-W7-SELF-${String(index).padStart(2,'0')}`,mode:'SELF_RELATIONSHIP_PATTERN',relationshipType:'OTHER',focusAreas:['CONFLICT_REPAIR','UNDERSTANDING'],participantARef:'PERSON-A',customerQuestion:`What keeps repeating in my relationship patterns in case ${index}?`,locale:index%2===0?'zh-Hans':'en',purpose:'RELATIONSHIP_READING',consent:{relationshipReadingUseAllowed:true,consentRecordId:`REL-SELF-CONSENT-${index}`}});
  const set=await participantSet(intent,100+index,['ECR','NUM'],{withB:false});
  const signal=hasProfile?await buildProfileSignalEnvelope({participantRef:'PERSON-A',sourceClass:'CUSTOMER_SELF_REPORT',sourceRef:`SELF-PROFILE:${index}`,domainId:'SELF_DESCRIPTION',value:'I tend to slow down before conflict.',valueType:'TEXT',confidence:'CUSTOMER_CONFIRMED',assessmentDate:'2026-09-01',customerConfirmed:true,precisionBoundary:['Self-report remains self-report.'],provenance:[{source:'fixture'}]}):null;
  const reality=await realityBundle(intent,null,100+index,{mode:'SUPPORT',sensitive});
  return {genericNarrativeBriefContract:genericBriefContract,relationshipIntent:intent,participantReadingSet:set,claimSnapshot:null,profileSignals:signal?[signal]:[],crossMethodRelationshipIr:null,relationshipCurrentRealityIr:reality.ir,relationshipRealityComparisons:[],customerContext:index%2===0?`Customer describes a recurring self-observed relationship pattern in case ${index}.`:null};
}
