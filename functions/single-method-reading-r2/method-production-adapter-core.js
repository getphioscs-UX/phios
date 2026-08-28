const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const RELATION_TAGS=new Set(['SUPPORT','TENSION','DEPENDENCY','REINFORCEMENT','ACTIVATION','TRANSITION','FRICTION','OPEN']);
const PRIORITY_TAGS=new Set(['PRIMARY','SECONDARY']);
const PUBLIC_METHOD_CODES=Object.freeze({AST:'ASTROLOGY_PROJECTION',BZR:'BAZI_PROJECTION',ZWR:'ZI_WEI_PROJECTION',NUM:'NUMEROLOGY_PROJECTION',ECR:'EMBODIED_CONFIGURATION_PROJECTION'});

function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function inspectUnit(methodResult,lineage){
  const insight=list(methodResult.insights).find(item=>item.insightId===lineage.unitId);
  if(!insight)fail('SMR_R2_INTERPRETATION_LINEAGE_JOIN_FAILED',{unitId:lineage.unitId});
  const tags=uniq(lineage.semanticTags).map(String),relationType=tags.find(tag=>RELATION_TAGS.has(tag))||null,priorityClass=tags.find(tag=>PRIORITY_TAGS.has(tag))||'UNSPECIFIED';
  return freeze({
    interpretationUnitId:lineage.unitId,
    title:insight.title||null,
    summary:insight.summary||null,
    body:insight.body||null,
    plainLanguageExplanation:insight.plainLanguageExplanation||insight.body||null,
    observableSignals:list(insight.observableSignals),
    alternativeInterpretations:list(insight.alternativeInterpretations),
    realityComparisonQuestions:list(insight.openQuestions),
    confidenceBoundary:insight.confidenceBoundary||null,
    semanticTags:tags,
    subject:tags[1]||null,
    relationType,
    priorityClass,
    projectionRefs:uniq(lineage.projectionRefs),
    meaningRefs:uniq(lineage.meaningRefs),
    derivationRefs:uniq(lineage.derivationRefs),
    boundaryRefs:uniq(lineage.boundaryRefs)
  });
}

export function adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId}={}){
  if(!expectedMethodId||!PUBLIC_METHOD_CODES[expectedMethodId])fail('SMR_R2_ADAPTER_METHOD_REQUIRED');
  if(methodResult?.methodId!==expectedMethodId)fail('SMR_R2_ADAPTER_METHOD_MISMATCH',{expectedMethodId,actualMethodId:methodResult?.methodId});
  if(methodResult?.state!=='READY_TO_READ')fail('SMR_R2_READY_TO_READ_REQUIRED',{methodId:expectedMethodId});
  if(methodResult?.technical?.acceptanceBasis!=='ADMITTED_COMPOSITION_RULESET')fail('SMR_R2_ADMITTED_COMPOSITION_REQUIRED',{methodId:expectedMethodId});
  if(methodResult?.technical?.publicMethodCode!==PUBLIC_METHOD_CODES[expectedMethodId])fail('SMR_R2_PUBLIC_METHOD_CODE_MISMATCH',{methodId:expectedMethodId});
  if(!methodResult?.technical?.interpretationResultId||!methodResult?.technical?.semanticDigest||!methodResult?.technical?.admissionRef)fail('SMR_R2_METHOD_AUTHORITY_LINEAGE_REQUIRED',{methodId:expectedMethodId});

  const units=list(methodResult.technical.interpretationUnits).map(lineage=>inspectUnit(methodResult,lineage));
  if(!units.length)fail('SMR_R2_ACCEPTED_INTERPRETATION_UNITS_REQUIRED',{methodId:expectedMethodId});
  const primaryRefs=units.filter(unit=>unit.priorityClass==='PRIMARY').map(unit=>unit.interpretationUnitId);
  const supportRefs=units.filter(unit=>['SUPPORT','REINFORCEMENT'].includes(unit.relationType)).map(unit=>unit.interpretationUnitId);
  const tensionRefs=units.filter(unit=>['TENSION','FRICTION'].includes(unit.relationType)).map(unit=>unit.interpretationUnitId);
  const openRefs=units.filter(unit=>unit.relationType==='OPEN'||unit.confidenceBoundary||unit.realityComparisonQuestions.length||unit.alternativeInterpretations.length).map(unit=>unit.interpretationUnitId);
  const temporalUnits=units.filter(unit=>unit.semanticTags.some(tag=>['TIMING','TEMPORAL','PERIOD','CYCLE_TIMING'].includes(tag)));
  const sourceLineage=uniq(units.flatMap(unit=>[...unit.projectionRefs,...unit.meaningRefs,...unit.boundaryRefs,...list(methodResult.technical.graphSourceRefs)]));
  const ruleLineage=uniq(units.flatMap(unit=>unit.derivationRefs));
  const boundaryFlags=uniq([
    ...units.flatMap(unit=>unit.boundaryRefs),
    ...Object.entries(methodResult.technical.boundary||{}).filter(([,value])=>value===true).map(([key])=>`TECHNICAL_BOUNDARY:${key}`)
  ]);

  return freeze({
    schemaVersion:'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0',
    methodId:expectedMethodId,
    publicMethodCode:methodResult.technical.publicMethodCode,
    productionAdmissionRef:methodResult.technical.admissionRef,
    readingAuthorityRef:methodResult.technical.interpretationResultId,
    humanReviewEvidenceRef:methodResult.technical.humanReviewEvidenceRef||null,
    findingRefs:[],
    interpretationUnitRefs:units.map(unit=>unit.interpretationUnitId),
    priorityRefs:primaryRefs,
    themeRefs:[],
    supportRefs,
    tensionRefs,
    openRefs:uniq(openRefs),
    sourceLineage,
    ruleLineage,
    temporalClaims:temporalUnits.map(unit=>({interpretationUnitRef:unit.interpretationUnitId,authority:'UPSTREAM_EXPLICIT_TEMPORAL_TAG'})),
    boundaryFlags,
    semanticDigest:methodResult.technical.semanticDigest,
    derivationDigest:methodResult.technical.derivationDigest||null,
    compositionRuleVersion:methodResult.technical.compositionRuleVersion||null,
    meaningBundleCode:methodResult.technical.meaningBundleCode||null,
    acceptedUnits:units,
    reconciliation:{
      findingRefs:'UPSTREAM_NOT_EXPOSED_AS_DISTINCT_AUTHORITY',
      themeRefs:'UPSTREAM_NOT_EXPOSED_AS_DISTINCT_AUTHORITY',
      priorityRefs:primaryRefs.length?'UPSTREAM_SEMANTIC_PRIORITY_TAGS':'UPSTREAM_PRIORITY_NOT_EXPOSED',
      noSyntheticFindingPromotion:true,
      noSyntheticThemePromotion:true
    },
    boundary:{
      acceptedAuthorityOnly:true,
      methodRuntimeExecuted:false,
      canonicalProjectionCreated:false,
      rawProjectionConsumedAsCustomerConclusion:false,
      newMeaningCreated:false,
      rendererMeaningCreated:false
    }
  });
}
