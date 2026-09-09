const list=v=>Array.isArray(v)?v:[];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const freeze=v=>Object.freeze(v);
const groupBy=(rows,keyFn)=>{const m=new Map();for(const row of rows){const k=keyFn(row);if(!m.has(k))m.set(k,[]);m.get(k).push(row);}return [...m.entries()].map(([key,items])=>({key,items}));};

export const PROFILE_CUSTOMER_OUTPUT_IR_SCHEMA='PHI-OS-PROFILE-CUSTOMER-OUTPUT-IR-v1.0.0';

/**
 * Profile/PPR-owned projection-safe successor.
 * It only reorganizes already published progressive-view evidence.
 * It does not calculate new scores, infer generic styles, or create Profile meaning.
 */
export function buildProfileCustomerOutputSuccessor(progressiveView={}){
  const cards=list(progressiveView.signalCards);
  const sourceScopedDimensions=groupBy(cards,x=>`${x.sourceClass||'UNKNOWN'}::${x.providerFamily||'UNSPECIFIED'}`).map(g=>freeze({
    sourceKey:g.key,
    sourceClass:g.items[0]?.sourceClass||null,
    providerFamily:g.items[0]?.providerFamily||null,
    dimensions:g.items.map(x=>({signalRef:x.signalRef,domainId:x.domainId,facetId:x.facetId||null,value:clone(x.value),assessmentDate:x.assessmentDate||null,confidence:x.confidence??null,provenance:clone(x.provenance||[])}))
  }));

  const cross=list(progressiveView.crossSource?.perspectives);
  const relationship=list(progressiveView.relationshipProfile?.evidence);
  const tensionSignals=[
    ...cross.filter(x=>x.group==='SOURCE_TENSION').map(x=>({kind:'CROSS_SOURCE_TENSION',id:x.id,statement:x.statement,sourceClasses:clone(x.sourceClasses||[]),signalRefs:clone(x.signalRefs||[])})),
    ...relationship.filter(x=>x.comparisonClass==='POTENTIAL_FRICTION_TARGET').map(x=>({kind:'RELATIONSHIP_FRICTION_TARGET',id:x.id,statement:x.statement,sourceClass:x.sourceClass,providerFamily:x.providerFamily||null}))
  ];
  const contradictions=cross.filter(x=>x.group==='SOURCE_CONTRADICTION').map(x=>({kind:'SOURCE_CONTRADICTION',id:x.id,statement:x.statement,sourceClasses:clone(x.sourceClasses||[]),signalRefs:clone(x.signalRefs||[])}));
  const realityQuestions=list(progressiveView.careerInterest?.currentRealityPrompts).map((text,index)=>({questionId:`CAREER_REALITY_${index+1}`,text,owner:'CAREER_INTEREST'}));
  const availableSections=['selfAssessmentRadar','careerInterest','currentReality','crossSource','relationshipProfile'].filter(k=>progressiveView[k]!=null);
  const profileOverview=freeze({
    sourceCount:list(progressiveView.sourceLegend).length,
    signalCount:cards.length,
    availableSections,
    sourceLegend:clone(progressiveView.sourceLegend||[]),
    freshness:clone(progressiveView.freshness||null),
    boundary:'SOURCE_AWARE_CONTAINER_ONLY_NO_UNIVERSAL_PROFILE_SYNTHESIS'
  });
  const contextEvidence=(progressiveView.currentReality||progressiveView.crossSource)?freeze({currentReality:clone(progressiveView.currentReality||null),crossSourceGroups:clone(progressiveView.crossSource?.groups||[]),boundary:'EVIDENCE_SUMMARY_ONLY_NO_NEW_CONTEXT_TYPE'}):null;
  return freeze({
    schemaVersion:PROFILE_CUSTOMER_OUTPUT_IR_SCHEMA,
    profileOverview,
    sourceScopedDimensions,
    tensionSignals,
    relationshipEvidence:clone(progressiveView.relationshipProfile||null),
    careerInterest:clone(progressiveView.careerInterest||null),
    contextEvidence,
    contradictions,
    realityQuestions,
    explicitlyAbsentGenericFields:['strengthPatterns','decisionStyle','relationshipStyle','workStyle','stressPattern','environmentFit','universalCoreDimensions','universalProfileScore'],
    governance:{truthOwner:'PROFILE_PPR',pvpMeaningAuthorityCreated:false,universalMasterScoreCreated:false,crossInstrumentNormalizationCreated:false}
  });
}
