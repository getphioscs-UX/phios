export const METHODS=['ECR','AST','BZR','ZWR','HD','NUM'];
export const GENERATED_AT='2026-09-01T08:45:00.000Z';

export function methodReading(methodId,index=0){
  const dims=['WORK','RELATIONSHIP','RESOURCES','ENVIRONMENT','CHANGE','RECOVERY'];
  const dimension=dims[index%dims.length];
  const units=[1,2,3].map(n=>({
    interpretationUnitId:`${methodId}-UNIT-${index+1}-${n}`,
    title:`${methodId} governed theme ${n}`,
    plainLanguageExplanation:`${methodId} accepted reading describes governed theme ${n} in ${dimension.toLowerCase()} without creating new meaning.`,
    semanticTags:[dimension],
    confidenceBoundary:'Interpret within the admitted method boundary.',
    alternativeInterpretations:n===3?[`Alternative context for ${methodId} theme ${n}`]:[],
    realityComparisonQuestions:[`Where is ${methodId} theme ${n} observable now?`]
  }));
  return {
    schemaVersion:'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0',
    methodId,
    readingAuthorityRef:`AUTH:${methodId}:${index+1}`,
    productionAdmissionRef:`ADMISSION:${methodId}:PRODUCTION`,
    supportRefs:[`${methodId}:SUPPORT:${index+1}`],
    tensionRefs:index%3===0?[`${methodId}:TENSION:${index+1}`]:[],
    openRefs:[`${methodId}:OPEN:${index+1}`],
    temporalClaims:[{interpretationUnitRef:units[2].interpretationUnitId}],
    boundaryFlags:[`${methodId}:BOUNDARY:PRESERVED`],
    acceptedUnits:units,
    priorityRefs:[units[0].interpretationUnitId,units[1].interpretationUnitId],
    semanticDigest:`${methodId.toLowerCase()}${String(index+1).padStart(2,'0')}`.padEnd(64,methodId[0].toLowerCase()),
    boundary:{acceptedAuthorityOnly:true}
  };
}

export function crossPerspective(methodIds,index=0){
  if(methodIds.length<2)return null;
  const support=['COMMON','COMPLEMENTARY','TENSION','OPEN'][index%4];
  return {
    schemaVersion:'PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2.0.0',
    readingDigest:`cross${String(index+1).padStart(2,'0')}`.padEnd(64,'c'),
    claims:[{
      claimId:`CROSS-${String(index+1).padStart(2,'0')}`,
      semanticDimension:['WORK','RELATIONSHIP','RESOURCES','ENVIRONMENT'][index%4],
      headline:`Cross-perspective theme ${index+1}`,
      narrative:`${methodIds.slice(0,3).join(', ')} contribute distinct admitted perspectives to this theme.`,
      methodRefs:methodIds.slice(0,3),
      claimRefs:methodIds.slice(0,3).map(m=>`${m}:CLAIM:${index+1}`),
      evidenceRefs:methodIds.slice(0,3).map(m=>`${m}:EVIDENCE:${index+1}`),
      supportType:support,
      tensionRefs:support==='TENSION'?[`CROSS:TENSION:${index+1}`]:[]
    }],
    uncomposedDimensions:index%5===0?['TIMING']:[],
    boundaries:{rawProjectionConsumed:false,newCanonicalMeaningCreated:false}
  };
}

export function profileSignals(index=0){
  const classes=['CUSTOMER_SELF_REPORT','EXTERNAL_PROFILE_RESULT','MEASURED_TASK_PERFORMANCE','STANDARDIZED_SELF_REPORT'];
  const sourceClass=classes[index%classes.length];
  if(index%2===0)return [];
  const id=`PRF-SIG-${String(index+1).padStart(2,'0')}`;
  return [{
    schemaVersion:'PHI-OS-PROFILE-SIGNAL-ENVELOPE-v1',
    profileSignalId:id,
    participantRef:'PERSON_A',
    sourceClass,
    sourceRef:`PROFILE-SOURCE:${sourceClass}:${index+1}`,
    domainId:sourceClass==='MEASURED_TASK_PERFORMANCE'?'REASONING_TASK_PERFORMANCE':'SELF_DESCRIPTION',
    value:sourceClass==='MEASURED_TASK_PERFORMANCE'?{rawCorrect:4,rawAttempted:5}:`Signal ${index+1}`,
    confidence:'SOURCE_BOUNDED',
    precisionBoundary:['Do not convert this source into objective personality truth.'],
    provenance:{source:`fixture-${index+1}`},
    semanticDigest:`profile${String(index+1).padStart(2,'0')}`.padEnd(64,'p'),
    governance:{sourceClassErased:false,newPersonalityTruthAuthorityCreated:false}
  }];
}

export function profileAdmission(){return {
  schemaVersion:'PHI-OS-PRF-W12-PRODUCTION-ADMISSION-v1.0.0',
  status:'PRODUCTION_ADMITTED_CUTOVER_ELIGIBLE',
  authorityEffect:{profileProductionAdmitted:true,customerPublicationAllowed:true}
}}

export function crossSource(signals,index=0){
  if(!signals.length)return null;
  const groups=['SOURCE_ALIGNED','SOURCE_COMPLEMENTARY','SOURCE_TENSION','OPEN'];
  return {
    schemaVersion:'PHI-OS-CROSS-SOURCE-PERSPECTIVE-IR-v1',
    perspectives:[{
      crossSourcePerspectiveId:`CSP-${String(index+1).padStart(2,'0')}`,
      group:groups[index%groups.length],
      statement:`Profile evidence and symbolic evidence remain distinct while being compared in case ${index+1}.`,
      signalRefs:signals.map(x=>x.profileSignalId)
    }],
    governance:{crossSourceProofCreated:false,symbolicScientificValidationTransferAllowed:false},
    semanticDigest:`csource${String(index+1).padStart(2,'0')}`.padEnd(64,'s')
  };
}

export function currentReality(index=0){
  if(index%3===2)return {observation:null,comparison:null};
  const observationId=`CR-OBS-${String(index+1).padStart(2,'0')}`;
  const states=['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN'];
  return {
    observation:{schemaVersion:'PHI-OS-CURRENT-REALITY-OBSERVATION-v1',observations:[{observationId,domain:index%2?'LOAD':'CURRENT_STATE',promptId:'ACTIVE_NOW',statement:`Customer reports current reality observation ${index+1}.`,source:'CUSTOMER',confidence:'SELF_REPORTED',sensitive:false,objectiveFact:false}]},
    comparison:{schemaVersion:'PHI-OS-REALITY-COMPARISON-v1',comparisons:[{comparisonId:`RC-${String(index+1).padStart(2,'0')}`,candidateId:`CAND-${index+1}`,methodId:METHODS[index%METHODS.length],methodClaimRef:`CLAIM-${index+1}`,responseState:states[index%4],observationRefs:[observationId],customerNote:`Customer comparison ${index+1}`,source:'CUSTOMER',customerControlled:true,methodProvenTrue:false,methodProvenFalse:false}],governance:{agreementIsProof:false,disagreementInvalidatesMethod:false,customerControlsResponse:true,unansweredRemainsOpen:true}}
  };
}

export function caseInput(index,sectionRegistry,compositionRules){
  const methodCount=(index%6)+1;
  const ids=METHODS.slice(0,methodCount);
  const signals=profileSignals(index);
  const reality=currentReality(index);
  return {
    methodReadings:ids.map((id,i)=>methodReading(id,index+i)),
    crossPerspective:crossPerspective(ids,index),
    profileSignals:signals,
    profileProductionAdmission:signals.length?profileAdmission():null,
    crossSourcePerspective:crossSource(signals,index),
    currentRealityObservation:reality.observation,
    realityComparison:reality.comparison,
    sectionRegistry,
    compositionRules,
    customerChoices:{profileOptIn:signals.length>0,currentRealityOptIn:Boolean(reality.observation)},
    locale:index%2?'zh-Hans':'en',
    generatedAt:GENERATED_AT
  };
}
