const list=value=>Array.isArray(value)?value:[];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

/**
 * Lossless authority adapter from the current READY_TO_READ customer method
 * result into the SMR contract. It joins customer prose to the matching
 * internal lineage record; it does not calculate, interpret or create meaning.
 */
export function adaptAcceptedMethodResultForSmr(methodResult){
  if(methodResult?.state!=='READY_TO_READ'||methodResult?.technical?.acceptanceBasis!=='ADMITTED_COMPOSITION_RULESET')throw Object.assign(new Error('SMR_ACCEPTED_METHOD_RESULT_REQUIRED'),{code:'SMR_ACCEPTED_METHOD_RESULT_REQUIRED'});
  const insightById=new Map(list(methodResult.insights).map(insight=>[insight.insightId,insight]));
  const interpretationUnits=list(methodResult.technical.interpretationUnits).map(lineage=>{
    const insight=insightById.get(lineage.unitId);
    if(!insight)throw Object.assign(new Error('SMR_INSIGHT_LINEAGE_JOIN_FAILED'),{code:'SMR_INSIGHT_LINEAGE_JOIN_FAILED',unitId:lineage.unitId});
    const semanticTags=list(lineage.semanticTags),subject=semanticTags[1]||null,relationType=semanticTags[2]||null,priority=semanticTags.find(tag=>tag==='PRIMARY'||tag==='SECONDARY')||semanticTags[3]||'SECONDARY';
    return freeze({
      unitId:lineage.unitId,
      interpretationUnitId:lineage.unitId,
      methodId:methodResult.methodId,
      title:insight.title,
      summary:insight.summary,
      body:insight.body,
      plainLanguageExplanation:insight.plainLanguageExplanation||insight.body,
      structuralReason:insight.summary,
      constructiveExpression:insight.body,
      frictionExpression:list(insight.alternativeInterpretations)[0]||null,
      observableSignals:list(insight.observableSignals),
      alternativeInterpretations:list(insight.alternativeInterpretations),
      realityComparisonQuestions:list(insight.openQuestions),
      uncertainties:[],
      confidenceBoundary:insight.confidenceBoundary||null,
      semanticTags,
      subject,
      relationType,
      priority,
      projectionRefs:list(lineage.projectionRefs),
      meaningRefs:list(lineage.meaningRefs),
      derivationRefs:list(lineage.derivationRefs),
      ruleRefs:list(lineage.derivationRefs).map(ref=>String(ref).replace(/^COMPOSITION_RULE:/,'')),
      boundaryRefs:list(lineage.boundaryRefs)
    });
  });
  return freeze({
    schemaVersion:'PHI-OS-SMR-ACCEPTED-INTERPRETATION-ADAPTER-v1.0.0',
    methodId:methodResult.methodId,
    resultStatus:'CUSTOMER_PUBLISHABLE',
    acceptanceBasis:methodResult.technical.acceptanceBasis,
    interpretationResultId:methodResult.technical.interpretationResultId,
    semanticDigest:methodResult.technical.semanticDigest,
    derivationDigest:methodResult.technical.derivationDigest,
    meaningBundleCode:methodResult.technical.meaningBundleCode,
    compositionRuleVersion:methodResult.technical.compositionRuleVersion,
    admissionRef:methodResult.technical.admissionRef,
    interpretationUnits,
    boundary:{authorityJoinedOnly:true,newMeaningCreated:false,rawProjectionConsumed:false}
  });
}

