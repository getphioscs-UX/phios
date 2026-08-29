import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';

export const BAZI_CONTRADICTION_RESOLUTION_SCHEMA='PHI-OS-BAZI-CONTRADICTION-RESOLUTION-IR-v1.0.0';
export const BAZI_CONTRADICTION_RESOLUTION_RUNTIME_VERSION='1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const idPart=value=>String(value??'NA').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase()||'NA';
function fail(code){const e=new Error(code);e.code=code;throw e;}

export function resolveBaziCompositionUnit({unit,findings,graph,unknownCatalog=[]}={}){
 const members=list(findings).filter(f=>unit.findingRefs.includes(f.findingId));
 if(members.length!==unit.findingRefs.length)fail('BAZI_FP_W12_COMPOSITION_FINDING_REF_MISSING');
 const graphCounters=list(graph?.edges).filter(e=>e.type==='COUNTERS'&&unit.findingRefs.includes(e.to)).map(e=>e.from);
 const counterEvidenceRefs=uniq([...list(unit.counterEvidenceRefs),...graphCounters]).sort();
 const unknownRefs=uniq(unit.unknownRefs).sort();
 const unknownCodeById=new Map(list(unknownCatalog).map(u=>[u.unknownId,u.code]));
 const qualifierCodes=unknownRefs.map(ref=>unknownCodeById.get(ref)||ref);
 const patternCandidates=members.filter(f=>f.findingType==='PATTERN_CANDIDATE');
 const hasPartial=members.some(f=>f.state==='PARTIAL');
 const unestablishedTransformation=members.some(f=>f.findingType==='CROSS_LAYER_ACTIVATION'&&f.metadata?.transformationEstablished===false);
 if(unestablishedTransformation)qualifierCodes.push('CROSS_LAYER_TRANSFORMATION_NOT_ESTABLISHED');
 let state='SUPPORTED';
 if(counterEvidenceRefs.length)state='COUNTERBALANCED';
 else if(unit.compositionType==='PATTERN_CANDIDATE_SET'&&patternCandidates.length>1){state='ALTERNATIVES_OPEN';qualifierCodes.push('MULTIPLE_PATTERN_CANDIDATES_PRIMARY_UNRESOLVED');}
 else if(unit.compositionType==='SCHOOL_QUALIFIED_VIEW'&&(members.some(f=>f.state==='OPEN')||unknownRefs.length)){state='SCHOOL_VIEW_OPEN';qualifierCodes.push('SCHOOL_SPECIFIC_VERDICT_OPEN');}
 else if(hasPartial)state='PARTIAL';
 else if(unknownRefs.length)state='BOUNDED_BY_UNKNOWN';
 else if(unestablishedTransformation)state='QUALIFIED';
 const preservedFindingRefs=unit.findingRefs.slice();
 return freeze({resolutionId:`BAZI-RESOLUTION-${idPart(unit.compositionId)}`,compositionRef:unit.compositionId,semanticKey:unit.semanticKey,schoolCode:unit.schoolCode||null,state,preservedFindingRefs,alternativeFindingRefs:state==='ALTERNATIVES_OPEN'?patternCandidates.map(f=>f.findingId).sort():[],counterEvidenceRefs,unknownRefs,qualifierCodes:uniq(qualifierCodes).sort(),directives:{deleteFindingAllowed:false,deleteCounterEvidenceAllowed:false,selectPatternWinnerAllowed:false,selectWinningSchoolAllowed:false,collapseUnknownToNegativeEvidenceAllowed:false,requireQualifierInLaterNarrative:state!=='SUPPORTED',preserveAlternatives:state==='ALTERNATIVES_OPEN',preserveSchoolIdentity:unit.compositionType==='SCHOOL_QUALIFIED_VIEW',eventPredictionAllowed:false},boundaries:{newMeaningCreated:false,newFindingCreated:false,customerNarrativeCreated:false,goodBadScoreCreated:false}});
}

export async function resolveBaziContradictions({composition,structuralFindings,evidenceGraph}={}){
 if(composition?.schemaVersion!=='PHI-OS-BAZI-CROSS-FINDING-COMPOSITION-IR-v1.0.0')fail('BAZI_FP_W12_REQUIRES_W11_COMPOSITION');
 if(structuralFindings?.schemaVersion!=='PHI-OS-BAZI-STRUCTURAL-FINDING-COLLECTION-v1.0.0')fail('BAZI_FP_W12_REQUIRES_W9_FINDINGS');
 if(evidenceGraph?.schemaVersion!=='PHI-OS-BAZI-INTERPRETATION-EVIDENCE-GRAPH-v1.0.0')fail('BAZI_FP_W12_REQUIRES_W10_GRAPH');
 if(composition.sourceFindingDigest!==structuralFindings.findingDigest||composition.sourceGraphDigest!==evidenceGraph.graphDigest)fail('BAZI_FP_W12_LINEAGE_MISMATCH');
 const snapshots=[stableSerialize(composition),stableSerialize(structuralFindings),stableSerialize(evidenceGraph)];
 const graphNodeIds=new Set(evidenceGraph.nodes.map(n=>n.nodeId));for(const unit of composition.compositionUnits){for(const ref of unit.counterEvidenceRefs||[])if(!graphNodeIds.has(ref))fail('BAZI_FP_W12_COUNTER_EVIDENCE_NODE_MISSING');for(const ref of unit.unknownRefs||[])if(!graphNodeIds.has(ref))fail('BAZI_FP_W12_UNKNOWN_NODE_MISSING');}
 const resolutions=composition.compositionUnits.map(unit=>resolveBaziCompositionUnit({unit,findings:structuralFindings.findings,graph:evidenceGraph,unknownCatalog:structuralFindings.unknownCatalog})).sort((a,b)=>a.resolutionId.localeCompare(b.resolutionId));
 const stateCounts={};for(const r of resolutions)stateCounts[r.state]=(stateCounts[r.state]||0)+1;
 const expectedCounters=uniq(composition.compositionUnits.flatMap(u=>u.counterEvidenceRefs));const preservedCounters=uniq(resolutions.flatMap(r=>r.counterEvidenceRefs));for(const ref of expectedCounters)if(!preservedCounters.includes(ref))fail('BAZI_FP_W12_COUNTER_EVIDENCE_DROPPED');
 const preservedFindingRefs=uniq(resolutions.flatMap(r=>r.preservedFindingRefs));for(const f of structuralFindings.findings)if(!preservedFindingRefs.includes(f.findingId))fail('BAZI_FP_W12_FINDING_DROPPED');
 const base={schemaVersion:BAZI_CONTRADICTION_RESOLUTION_SCHEMA,work:'BAZI-FP-W12',runtimeVersion:BAZI_CONTRADICTION_RESOLUTION_RUNTIME_VERSION,authorityState:'CONTRADICTION_AND_COUNTER_EVIDENCE_PRESERVED_NO_WINNER_INVENTED',sourceCompositionDigest:composition.compositionDigest,sourceFindingDigest:structuralFindings.findingDigest,sourceGraphDigest:evidenceGraph.graphDigest,resolutions,summary:{resolutionCount:resolutions.length,stateCounts,counterEvidenceRefCount:preservedCounters.length,unknownBoundResolutionCount:resolutions.filter(r=>r.unknownRefs.length).length,alternativeSetCount:resolutions.filter(r=>r.state==='ALTERNATIVES_OPEN').length,openSchoolViewCount:resolutions.filter(r=>r.state==='SCHOOL_VIEW_OPEN').length},lineage:{compositionOwner:'BAZI-FP-W11',resolverOwner:'BAZI-FP-W12',findingOwner:'BAZI-FP-W9',graphOwner:'BAZI-FP-W10'},boundaries:{allFindingsPreserved:true,counterEvidenceDeleted:false,unknownDeleted:false,patternWinnerInvented:false,schoolWinnerInvented:false,customerNarrativeCreated:false,goodBadScoreCreated:false,eventPredictionCreated:false,customerProductionEligible:false}};
 const resolutionDigest=await sha256(base);
 if(stableSerialize(composition)!==snapshots[0]||stableSerialize(structuralFindings)!==snapshots[1]||stableSerialize(evidenceGraph)!==snapshots[2])fail('BAZI_FP_W12_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,resolutionDigest});
}
export default Object.freeze({resolveBaziCompositionUnit,resolveBaziContradictions});
