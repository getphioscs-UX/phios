import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';

export const BAZI_SEMANTIC_DEDUP_SCHEMA='PHI-OS-BAZI-SEMANTIC-DEDUP-IR-v1.0.0';
export const BAZI_SEMANTIC_DEDUP_RUNTIME_VERSION='1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
function fail(code){const e=new Error(code);e.code=code;throw e;}
const temporalKey=value=>value?stableSerialize(value):'NO_TEMPORAL_CONTEXT';
const clusterKey=unit=>`${unit.semanticKey}::SCHOOL=${unit.schoolCode||'NONE'}::TIME=${temporalKey(unit.temporalContext)}`;
const infoRefs=unit=>uniq([...list(unit.findingRefs),...list(unit.evidenceRefs),...list(unit.authorityRefs),...list(unit.unknownRefs),...list(unit.counterEvidenceRefs)]);

export function clusterSemanticCompositionUnits(units=[]){
 const groups=new Map();for(const unit of list(units)){const key=clusterKey(unit);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(unit)}
 const semanticClusters=[],decisions=[];
 for(const [key,items] of [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
  const ranked=[...items].sort((a,b)=>infoRefs(b).length-infoRefs(a).length||b.findingRefs.length-a.findingRefs.length||a.compositionId.localeCompare(b.compositionId));
  const primary=ranked[0],primaryInfo=new Set(infoRefs(primary));
  const clusterId=`BAZI-SEMCLUSTER-${primary.semanticFingerprint.slice(0,16).toUpperCase()}`;
  for(const unit of ranked){
   if(unit===primary){decisions.push(freeze({compositionRef:unit.compositionId,semanticClusterId:clusterId,decision:'PRIMARY_EXPLANATION',primaryCompositionRef:primary.compositionId,newInformationRefs:[]}));continue;}
   const newInformationRefs=infoRefs(unit).filter(ref=>!primaryInfo.has(ref)).sort();
   decisions.push(freeze({compositionRef:unit.compositionId,semanticClusterId:clusterId,decision:newInformationRefs.length?'CONTEXT_DERIVATIVE':'REFERENCE_ONLY',primaryCompositionRef:primary.compositionId,newInformationRefs}));
  }
  semanticClusters.push(freeze({semanticClusterId:clusterId,dedupKey:key,semanticKey:primary.semanticKey,schoolCode:primary.schoolCode||null,temporalContext:primary.temporalContext||null,primaryCompositionRef:primary.compositionId,compositionRefs:ranked.map(u=>u.compositionId).sort(),fullExplanationCount:1}));
 }
 return freeze({semanticClusters,decisions:decisions.sort((a,b)=>a.compositionRef.localeCompare(b.compositionRef))});
}

export async function buildBaziSemanticDedupIR({composition,contradictionResolution}={}){
 if(composition?.schemaVersion!=='PHI-OS-BAZI-CROSS-FINDING-COMPOSITION-IR-v1.0.0')fail('BAZI_FP_W13_REQUIRES_W11_COMPOSITION');
 if(contradictionResolution?.schemaVersion!=='PHI-OS-BAZI-CONTRADICTION-RESOLUTION-IR-v1.0.0')fail('BAZI_FP_W13_REQUIRES_W12_RESOLUTION');
 if(contradictionResolution.sourceCompositionDigest!==composition.compositionDigest)fail('BAZI_FP_W13_W12_W11_LINEAGE_MISMATCH');
 const snapshots=[stableSerialize(composition),stableSerialize(contradictionResolution)];
 const resolutionByComposition=new Map(contradictionResolution.resolutions.map(r=>[r.compositionRef,r]));for(const u of composition.compositionUnits)if(!resolutionByComposition.has(u.compositionId))fail('BAZI_FP_W13_RESOLUTION_MISSING');
 const clustered=clusterSemanticCompositionUnits(composition.compositionUnits);
 const enrichedDecisions=clustered.decisions.map(d=>{const resolution=resolutionByComposition.get(d.compositionRef);return freeze({...d,resolutionRef:resolution.resolutionId,resolutionState:resolution.state,qualifierCodes:resolution.qualifierCodes,counterEvidenceRefs:resolution.counterEvidenceRefs,unknownRefs:resolution.unknownRefs,lineagePreserved:true});});
 const clusterById=new Map(clustered.semanticClusters.map(c=>[c.semanticClusterId,c]));for(const d of enrichedDecisions){const c=clusterById.get(d.semanticClusterId);if(!c)fail('BAZI_FP_W13_CLUSTER_MISSING');if(c.schoolCode){const unit=composition.compositionUnits.find(u=>u.compositionId===d.compositionRef);if(unit.schoolCode!==c.schoolCode)fail('BAZI_FP_W13_CROSS_SCHOOL_DEDUP_FORBIDDEN')}}
 const primaryCount=enrichedDecisions.filter(d=>d.decision==='PRIMARY_EXPLANATION').length,referenceOnlyCount=enrichedDecisions.filter(d=>d.decision==='REFERENCE_ONLY').length,contextDerivativeCount=enrichedDecisions.filter(d=>d.decision==='CONTEXT_DERIVATIVE').length;
 const base={schemaVersion:BAZI_SEMANTIC_DEDUP_SCHEMA,work:'BAZI-FP-W13',runtimeVersion:BAZI_SEMANTIC_DEDUP_RUNTIME_VERSION,authorityState:'ONE_PRIMARY_RENDER_OWNER_PER_SEMANTIC_CLUSTER_NO_CUSTOMER_PROSE',sourceCompositionDigest:composition.compositionDigest,sourceResolutionDigest:contradictionResolution.resolutionDigest,semanticClusters:clustered.semanticClusters,decisions:enrichedDecisions,summary:{compositionCandidateCount:composition.compositionUnits.length,semanticClusterCount:clustered.semanticClusters.length,primaryExplanationCount:primaryCount,contextDerivativeCount,referenceOnlyCount,suppressedFullExplanationCount:composition.compositionUnits.length-primaryCount},lineage:{compositionOwner:'BAZI-FP-W11',contradictionOwner:'BAZI-FP-W12',dedupOwner:'BAZI-FP-W13'},boundaries:{fullExplanationMaxPerSemanticCluster:1,evidenceDeleted:false,authorityDeleted:false,unknownDeleted:false,counterEvidenceDeleted:false,crossSchoolMergeCreated:false,contradictionResolutionChanged:false,customerMeaningCreated:false,customerNarrativeCreated:false,goodBadScoreCreated:false,eventPredictionCreated:false,customerProductionEligible:false}};
 const dedupDigest=await sha256(base);
 if(stableSerialize(composition)!==snapshots[0]||stableSerialize(contradictionResolution)!==snapshots[1])fail('BAZI_FP_W13_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,dedupDigest});
}
export default Object.freeze({clusterSemanticCompositionUnits,buildBaziSemanticDedupIR});
