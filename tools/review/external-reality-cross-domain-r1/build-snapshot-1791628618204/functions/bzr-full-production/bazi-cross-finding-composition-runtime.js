import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';

export const BAZI_CROSS_FINDING_COMPOSITION_SCHEMA='PHI-OS-BAZI-CROSS-FINDING-COMPOSITION-IR-v1.0.0';
export const BAZI_COMPOSITION_UNIT_SCHEMA='PHI-OS-BAZI-COMPOSITION-UNIT-v1.0.0';
export const BAZI_CROSS_FINDING_COMPOSITION_RUNTIME_VERSION='1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const idPart=value=>String(value??'NA').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase()||'NA';
function fail(code){const e=new Error(code);e.code=code;throw e;}

const COMPOSITION_RULES=Object.freeze([
 {ruleId:'BZR-W11-NATAL-FOUNDATION',compositionType:'NATAL_FOUNDATION',semanticKey:'BAZI:COMPOSITION:NATAL_FOUNDATION',findingTypes:['DAY_MASTER_CONTEXT','MONTH_COMMAND_CONTEXT','ROOT_SUPPORT_EVIDENCE','TEN_GOD_CONFIGURATION']},
 {ruleId:'BZR-W11-NATAL-RELATIONSHIPS',compositionType:'NATAL_RELATIONSHIP_STRUCTURE',semanticKey:'BAZI:COMPOSITION:NATAL_RELATIONSHIPS',findingTypes:['NATAL_RELATIONSHIP_CONFIGURATION']},
 {ruleId:'BZR-W11-PATTERN-SET',compositionType:'PATTERN_CANDIDATE_SET',semanticKey:'BAZI:COMPOSITION:PATTERN_CANDIDATE_SET',findingTypes:['PATTERN_CANDIDATE']},
 {ruleId:'BZR-W11-SCHOOL-VIEW',compositionType:'SCHOOL_QUALIFIED_VIEW',findingTypes:['SCHOOL_QUALIFIED_USE_CONTEXT'],onePerSchool:true},
 {ruleId:'BZR-W11-CURRENT-TEMPORAL',compositionType:'CURRENT_TEMPORAL_STRUCTURE',semanticKey:'BAZI:COMPOSITION:CURRENT_TEMPORAL_STRUCTURE',findingTypes:['DA_YUN_ACTIVATION','LIU_NIAN_ACTIVATION','CROSS_LAYER_ACTIVATION'],sameTemporalContextRequired:true}
]);

function temporalContextFor(findings,required){
 const contexts=findings.map(f=>f.temporalContext).filter(Boolean);if(!contexts.length)return null;
 const serialized=uniq(contexts.map(stableSerialize));if(required&&serialized.length!==1)fail('BAZI_FP_W11_TEMPORAL_CONTEXT_MISMATCH');
 return contexts[0];
}

export async function buildBaziCrossFindingComposition({structuralFindings,evidenceGraph}={}){
 if(structuralFindings?.schemaVersion!=='PHI-OS-BAZI-STRUCTURAL-FINDING-COLLECTION-v1.0.0')fail('BAZI_FP_W11_REQUIRES_W9_STRUCTURAL_FINDINGS');
 if(evidenceGraph?.schemaVersion!=='PHI-OS-BAZI-INTERPRETATION-EVIDENCE-GRAPH-v1.0.0')fail('BAZI_FP_W11_REQUIRES_W10_EVIDENCE_GRAPH');
 if(evidenceGraph.sourceFindingDigest!==structuralFindings.findingDigest)fail('BAZI_FP_W11_W10_W9_LINEAGE_MISMATCH');
 const snapshots=[stableSerialize(structuralFindings),stableSerialize(evidenceGraph)];
 const graphFindingIds=new Set(evidenceGraph.nodes.filter(n=>n.nodeType==='FINDING').map(n=>n.nodeId));
 for(const f of structuralFindings.findings)if(!graphFindingIds.has(f.findingId))fail('BAZI_FP_W11_FINDING_MISSING_FROM_GRAPH');
 const byType=new Map();for(const f of structuralFindings.findings){if(!byType.has(f.findingType))byType.set(f.findingType,[]);byType.get(f.findingType).push(f)}
 const units=[],covered=new Set();
 const addUnit=async({rule,findings,schoolCode=null,semanticKey})=>{
  if(!findings.length)return;
  const findingRefs=findings.map(f=>f.findingId).sort();for(const ref of findingRefs){if(covered.has(ref))fail('BAZI_FP_W11_FINDING_COMPOSED_MORE_THAN_ONCE');covered.add(ref)}
  const evidenceRefs=uniq(findings.flatMap(f=>f.evidenceRefs)).sort();
  const authorityRefs=uniq(findings.flatMap(f=>f.authorityRefs)).sort();
  const unknownRefs=uniq(findings.flatMap(f=>f.unknownRefs)).sort();
  const counterEvidenceRefs=uniq(findings.flatMap(f=>f.counterEvidenceRefs)).sort();
  const temporalContext=temporalContextFor(findings,rule.sameTemporalContextRequired===true);
  const dimensions=findings.map(f=>f.semanticDimension).sort();
  const semanticFingerprint=await sha256({semanticKey,schoolCode,temporalContext,dimensions});
  const compositionId=`BAZI-COMP-${idPart(rule.compositionType)}-${idPart(schoolCode||semanticKey)}`;
  units.push({schemaVersion:BAZI_COMPOSITION_UNIT_SCHEMA,compositionId,ruleId:rule.ruleId,compositionType:rule.compositionType,semanticKey,schoolCode,temporalContext,findingRefs,evidenceRefs,authorityRefs,unknownRefs,counterEvidenceRefs,semanticFingerprint,memberSummary:{findingCount:findingRefs.length,findingTypes:uniq(findings.map(f=>f.findingType)).sort(),findingStates:uniq(findings.map(f=>f.state)).sort(),crossFinding:findings.length>1},boundaries:{newFindingCreated:false,customerMeaningCreated:false,customerNarrativeCreated:false,contradictionResolved:false,schoolMergeCreated:false,primaryPatternSelected:false,goodBadScoreCreated:false,eventPredictionCreated:false}});
 };
 for(const rule of COMPOSITION_RULES){
  if(rule.onePerSchool){const candidates=rule.findingTypes.flatMap(t=>byType.get(t)||[]);const schools=uniq(candidates.map(f=>f.schoolCode)).sort();for(const schoolCode of schools){const findings=candidates.filter(f=>f.schoolCode===schoolCode).sort((a,b)=>a.findingId.localeCompare(b.findingId));await addUnit({rule,findings,schoolCode,semanticKey:`BAZI:COMPOSITION:SCHOOL:${schoolCode}`});}continue;}
  const findings=rule.findingTypes.flatMap(t=>byType.get(t)||[]).sort((a,b)=>a.findingId.localeCompare(b.findingId));await addUnit({rule,findings,semanticKey:rule.semanticKey});
 }
 if(covered.size!==structuralFindings.findings.length){const omitted=structuralFindings.findings.filter(f=>!covered.has(f.findingId)).map(f=>f.findingId);fail(`BAZI_FP_W11_UNCOMPOSED_FINDINGS:${omitted.join(',')}`)}
 units.sort((a,b)=>a.compositionId.localeCompare(b.compositionId));
 const typeCounts={};for(const u of units)typeCounts[u.compositionType]=(typeCounts[u.compositionType]||0)+1;
 const base={schemaVersion:BAZI_CROSS_FINDING_COMPOSITION_SCHEMA,work:'BAZI-FP-W11',runtimeVersion:BAZI_CROSS_FINDING_COMPOSITION_RUNTIME_VERSION,authorityState:'CROSS_FINDING_COMPOSITION_UNRESOLVED_NO_CUSTOMER_NARRATIVE',sourceFindingDigest:structuralFindings.findingDigest,sourceGraphDigest:evidenceGraph.graphDigest,compositionUnits:units,summary:{compositionUnitCount:units.length,coveredFindingCount:covered.size,typeCounts,schoolUnitCount:units.filter(u=>u.compositionType==='SCHOOL_QUALIFIED_VIEW').length,crossFindingUnitCount:units.filter(u=>u.memberSummary.crossFinding).length},lineage:{findingOwner:'BAZI-FP-W9',graphOwner:'BAZI-FP-W10',compositionOwner:'BAZI-FP-W11',ruleRegistryRef:'content/professional/bzr-full-production/registries/bazi-cross-finding-composition-rule-registry-v1.json'},boundaries:{allFindingsCoveredExactlyOnce:true,customerMeaningCreated:false,customerNarrativeCreated:false,contradictionResolutionCreated:false,semanticDeduplicationCreated:false,crossSchoolMergeCreated:false,primaryPatternVerdictCreated:false,goodBadScoreCreated:false,eventPredictionCreated:false,customerProductionEligible:false}};
 const compositionDigest=await sha256(base);
 if(stableSerialize(structuralFindings)!==snapshots[0]||stableSerialize(evidenceGraph)!==snapshots[1])fail('BAZI_FP_W11_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,compositionDigest});
}
export default Object.freeze({buildBaziCrossFindingComposition});
