import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';

export const BAZI_INTERPRETATION_EVIDENCE_GRAPH_SCHEMA='PHI-OS-BAZI-INTERPRETATION-EVIDENCE-GRAPH-v1.0.0';
export const BAZI_INTERPRETATION_EVIDENCE_GRAPH_RUNTIME_VERSION='1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
function fail(code){const e=new Error(code);e.code=code;throw e;}
const edgeId=(type,from,to)=>`BAZI-EDGE-${type}-${from}-${to}`;

export async function buildBaziInterpretationEvidenceGraph({structuralFindings}={}){
 if(structuralFindings?.schemaVersion!=='PHI-OS-BAZI-STRUCTURAL-FINDING-COLLECTION-v1.0.0')fail('BAZI_FP_W10_REQUIRES_W9_STRUCTURAL_FINDINGS');
 const snapshot=stableSerialize(structuralFindings),nodes=[],edges=[],seenNodes=new Set(),seenEdges=new Set();
 const addNode=node=>{if(seenNodes.has(node.nodeId))fail('BAZI_FP_W10_DUPLICATE_NODE_ID');seenNodes.add(node.nodeId);nodes.push(node);};
 const addEdge=(type,from,to,metadata={})=>{if(!seenNodes.has(from)||!seenNodes.has(to))fail('BAZI_FP_W10_EDGE_ENDPOINT_MISSING');const id=edgeId(type,from,to);if(seenEdges.has(id))return;seenEdges.add(id);edges.push({edgeId:id,type,from,to,metadata});};
 for(const f of structuralFindings.findings)addNode({nodeId:f.findingId,nodeType:'FINDING',state:f.state,scope:f.scope,semanticDimension:f.semanticDimension,findingType:f.findingType,schoolCode:f.schoolCode||null});
 for(const e of structuralFindings.evidenceCatalog)addNode({nodeId:e.evidenceId,nodeType:'EVIDENCE',evidenceKind:e.kind,sourceWork:e.sourceWork,sourceDigest:e.sourceDigest,evidenceDigest:e.evidenceDigest,role:e.role});
 for(const a of structuralFindings.authorityCatalog)addNode({nodeId:a.authorityId,nodeType:'AUTHORITY',authorityClass:a.authorityClass,ref:a.ref});
 for(const u of structuralFindings.unknownCatalog)addNode({nodeId:u.unknownId,nodeType:'UNKNOWN',code:u.code,sourceWork:u.sourceWork,rendererMustPreserve:u.rendererMustPreserve===true});
 for(const f of structuralFindings.findings){for(const ref of f.evidenceRefs||[]){const e=structuralFindings.evidenceCatalog.find(x=>x.evidenceId===ref);if(!e)fail('BAZI_FP_W10_FINDING_EVIDENCE_REF_MISSING');addEdge(e.role==='QUALIFY'?'QUALIFIES':'SUPPORTS',ref,f.findingId,{evidenceKind:e.kind});}for(const ref of f.counterEvidenceRefs||[]){if(!seenNodes.has(ref))fail('BAZI_FP_W10_COUNTER_EVIDENCE_REF_MISSING');addEdge('COUNTERS',ref,f.findingId);}for(const ref of f.authorityRefs||[]){if(!seenNodes.has(ref))fail('BAZI_FP_W10_FINDING_AUTHORITY_REF_MISSING');addEdge('GOVERNS',ref,f.findingId);}for(const ref of f.unknownRefs||[]){if(!seenNodes.has(ref))fail('BAZI_FP_W10_FINDING_UNKNOWN_REF_MISSING');addEdge('BOUNDS',ref,f.findingId);}}
 nodes.sort((a,b)=>a.nodeId.localeCompare(b.nodeId));edges.sort((a,b)=>a.edgeId.localeCompare(b.edgeId));
 const nodeTypeCounts={},edgeTypeCounts={};for(const n of nodes)nodeTypeCounts[n.nodeType]=(nodeTypeCounts[n.nodeType]||0)+1;for(const e of edges)edgeTypeCounts[e.type]=(edgeTypeCounts[e.type]||0)+1;
 for(const f of structuralFindings.findings){const inbound=edges.filter(e=>e.to===f.findingId);if(!inbound.some(e=>e.type==='SUPPORTS'||e.type==='QUALIFIES'))fail('BAZI_FP_W10_FINDING_WITHOUT_EVIDENCE_EDGE');if(!inbound.some(e=>e.type==='GOVERNS'))fail('BAZI_FP_W10_FINDING_WITHOUT_AUTHORITY_EDGE');}
 const base={schemaVersion:BAZI_INTERPRETATION_EVIDENCE_GRAPH_SCHEMA,work:'BAZI-FP-W10',runtimeVersion:BAZI_INTERPRETATION_EVIDENCE_GRAPH_RUNTIME_VERSION,authorityState:'DETERMINISTIC_TRACE_GRAPH_OVER_W9_STRUCTURAL_FINDINGS',sourceFindingDigest:structuralFindings.findingDigest,nodes,edges,summary:{nodeCount:nodes.length,edgeCount:edges.length,nodeTypeCounts,edgeTypeCounts,orphanFindingCount:0},lineage:{findingOwner:'BAZI-FP-W9',graphOwner:'BAZI-FP-W10',currentSourceAdmissionRegistryRef:structuralFindings.lineage.sourceAdmissionRegistryRef},boundaries:{graphCreatesFinding:false,graphCreatesMeaning:false,graphResolvesContradiction:false,graphPerformsComposition:false,graphPerformsSemanticDeduplication:false,graphChangesSchoolAuthority:false,goodBadScoreCreated:false,eventPredictionCreated:false,customerInterpretationCreated:false,customerProductionEligible:false}};
 const graphDigest=await sha256(base);if(stableSerialize(structuralFindings)!==snapshot)fail('BAZI_FP_W10_INPUT_MUTATION_FORBIDDEN');return freeze({...base,graphDigest});
}
export default Object.freeze({buildBaziInterpretationEvidenceGraph});
