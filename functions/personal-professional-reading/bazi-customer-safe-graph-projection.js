const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const ownerFor=(readingIR,type,schoolCode=null)=>list(readingIR?.renderOwners).find(x=>x.compositionType===type&&(!schoolCode||x.schoolCode===schoolCode))||null;
const trace=owner=>freeze({
 findingCount:list(owner?.findingRefs).length,
 evidenceCount:list(owner?.evidenceRefs).length,
 authorityCount:list(owner?.authorityRefs).length,
 unknownCount:list(owner?.unknownRefs).length,
 counterEvidenceCount:list(owner?.counterEvidenceRefs).length,
 resolutionState:owner?.resolutionState||'OPEN'
});
const node=(nodeKey,kind,owner,extra={})=>freeze({nodeKey,kind,trace:trace(owner),...extra});
const edge=(from,to,relationType)=>freeze({from,to,relationType});

export const PPR_C1_BAZI_CUSTOMER_SAFE_GRAPH_SCHEMA='PHI-OS-PPR-C1-BAZI-CUSTOMER-SAFE-STRUCTURE-GRAPH-v1.0.0';

export function buildBaziCustomerSafeStructureGraph({readingIR,temporalState='UNAVAILABLE'}={}){
 if(readingIR?.schemaVersion!=='PHI-OS-BAZI-FULL-READING-IR-v1.0.0')throw Object.assign(new Error('PPR_C1_W10_BAZI_READING_IR_REQUIRED'),{code:'PPR_C1_W10_BAZI_READING_IR_REQUIRED'});
 if(!readingIR?.source?.graphDigest||readingIR?.sections?.evidence?.graphDigest!==readingIR.source.graphDigest)throw Object.assign(new Error('PPR_C1_W10_W10_GRAPH_LINEAGE_REQUIRED'),{code:'PPR_C1_W10_W10_GRAPH_LINEAGE_REQUIRED'});
 const foundation=ownerFor(readingIR,'NATAL_FOUNDATION');
 const relationships=ownerFor(readingIR,'NATAL_RELATIONSHIP_STRUCTURE');
 const pattern=ownerFor(readingIR,'PATTERN_CANDIDATE_SET');
 const ziping=ownerFor(readingIR,'SCHOOL_QUALIFIED_VIEW','ZI_PING_MONTH_COMMAND_USE_v1');
 const tiyong=ownerFor(readingIR,'SCHOOL_QUALIFIED_VIEW','DI_TIAN_SUI_TI_YONG_BALANCE_v1');
 const tiaohou=ownerFor(readingIR,'SCHOOL_QUALIFIED_VIEW','DI_TIAN_SUI_CLIMATE_TIAOHOU_v1');
 const timing=ownerFor(readingIR,'CURRENT_TEMPORAL_STRUCTURE');
 const timingSection=readingIR.sections?.timing||{};
 const allOwners=[foundation,relationships,pattern,ziping,tiyong,tiaohou,timing].filter(Boolean);
 const unknownKeys=uniq(allOwners.flatMap(x=>list(x.unknownRefs)));
 const counterKeys=uniq(allOwners.flatMap(x=>list(x.counterEvidenceRefs)));
 const evidenceKeys=uniq(allOwners.flatMap(x=>list(x.evidenceRefs)));
 const authorityKeys=uniq(allOwners.flatMap(x=>list(x.authorityRefs)));
 const findingKeys=uniq(allOwners.flatMap(x=>list(x.findingRefs)));
 const nodes=[
  node('CHART','CHART_ROOT',null,{trace:freeze({findingCount:findingKeys.length,evidenceCount:evidenceKeys.length,authorityCount:authorityKeys.length,unknownCount:unknownKeys.length,counterEvidenceCount:counterKeys.length,resolutionState:'GOVERNED_CHART'})}),
  node('FOUNDATION','STRUCTURAL_DOMAIN',foundation),
  node('RELATIONSHIPS','STRUCTURAL_DOMAIN',relationships),
  node('PATTERN','STRUCTURAL_DOMAIN',pattern),
  node('SCHOOL_ZIPING','SCHOOL_VIEW',ziping,{schoolCode:'ZI_PING_MONTH_COMMAND_USE_v1'}),
  node('SCHOOL_TIYONG','SCHOOL_VIEW',tiyong,{schoolCode:'DI_TIAN_SUI_TI_YONG_BALANCE_v1'}),
  node('SCHOOL_TIAOHOU','SCHOOL_VIEW',tiaohou,{schoolCode:'DI_TIAN_SUI_CLIMATE_TIAOHOU_v1'}),
  node('DA_YUN','TEMPORAL_DOMAIN',timing,{availability:temporalState==='EXPLICIT'&&timingSection.currentDaYun?'CURRENT_CONTEXT_ESTABLISHED':'SEQUENCE_ONLY',sourceOwnerSharedWith:'LIU_NIAN'}),
  node('LIU_NIAN','TEMPORAL_DOMAIN',timing,{availability:temporalState==='EXPLICIT'&&timingSection.annual?'CURRENT_CONTEXT_ESTABLISHED':'UNAVAILABLE',sourceOwnerSharedWith:'DA_YUN'}),
  freeze({nodeKey:'OPEN_BOUNDARIES',kind:'BOUNDARY_SUMMARY',trace:freeze({findingCount:0,evidenceCount:0,authorityCount:0,unknownCount:unknownKeys.length,counterEvidenceCount:counterKeys.length,resolutionState:unknownKeys.length?'OPEN':'NO_OPEN_BOUNDARY'})})
 ];
 const edges=[
  edge('CHART','FOUNDATION','READING_SEQUENCE'),
  edge('FOUNDATION','RELATIONSHIPS','READING_SEQUENCE'),
  edge('RELATIONSHIPS','PATTERN','READING_SEQUENCE'),
  edge('PATTERN','SCHOOL_ZIPING','SCHOOL_QUALIFIED_VIEW'),
  edge('PATTERN','SCHOOL_TIYONG','SCHOOL_QUALIFIED_VIEW'),
  edge('PATTERN','SCHOOL_TIAOHOU','SCHOOL_QUALIFIED_VIEW'),
  edge('CHART','DA_YUN','TEMPORAL_LAYER'),
  edge('DA_YUN','LIU_NIAN','TEMPORAL_LAYER')
 ];
 for(const n of nodes){if(n.nodeKey!=='OPEN_BOUNDARIES'&&n.trace?.unknownCount>0)edges.push(edge('OPEN_BOUNDARIES',n.nodeKey,'BOUNDS'));}
 return freeze({
  schemaVersion:PPR_C1_BAZI_CUSTOMER_SAFE_GRAPH_SCHEMA,
  work:'PPR-C1-W10',
  sourceGraphDigest:readingIR.source.graphDigest,
  sourceFindingDigest:readingIR.source.findingDigest,
  sourceReadingDigest:readingIR.readingDigest,
  nodes:freeze(nodes),edges:freeze(edges),
  summary:freeze({nodeCount:nodes.length,edgeCount:edges.length,sourceFindingCount:findingKeys.length,sourceEvidenceCount:evidenceKeys.length,sourceAuthorityCount:authorityKeys.length,sourceUnknownCount:unknownKeys.length,sourceCounterEvidenceCount:counterKeys.length}),
  boundaries:freeze({
   rawNodeIdsExposed:false,rawEdgeIdsExposed:false,rawEvidenceIdsExposed:false,rawAuthorityIdsExposed:false,rawUnknownIdsExposed:false,
   graphTopologyCreatesMeaning:false,graphTopologyImpliesProbability:false,readingSequenceImpliesCausality:false,
   schoolViewsMerged:false,unknownSuppressed:false,counterEvidenceSuppressed:false,eventPredictionCreated:false,goodBadScoreCreated:false,
   upstreamEvidenceGraphRecalculated:false,methodRuntimeRecalculated:false
  }),
  lineage:freeze({upstreamGraphOwner:'BAZI-FP-W10',readingIrOwner:'BAZI-FP-W14',customerProjectionOwner:'PPR-C1-W10',projectionBasis:'W14_RETAINED_FINDING_EVIDENCE_AUTHORITY_UNKNOWN_REFS_PLUS_W10_GRAPH_DIGEST'})
 });
}

export default Object.freeze({PPR_C1_BAZI_CUSTOMER_SAFE_GRAPH_SCHEMA,buildBaziCustomerSafeStructureGraph});
