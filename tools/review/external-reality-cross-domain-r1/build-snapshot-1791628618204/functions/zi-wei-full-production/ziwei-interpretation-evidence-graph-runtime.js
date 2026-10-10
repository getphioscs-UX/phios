import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';
export const ZIWEI_INTERPRETATION_EVIDENCE_GRAPH_SCHEMA='PHI-OS-ZIWEI-INTERPRETATION-EVIDENCE-GRAPH-v1.0.0';
export const ZIWEI_INTERPRETATION_EVIDENCE_GRAPH_VERSION='1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const uniq=v=>[...new Set((Array.isArray(v)?v:[]).filter(Boolean))];
function fail(code){const e=new Error(code);e.code=code;throw e;}

function meaningCatalog(context){
 const out=[];const push=m=>{if(m?.meaningCode)out.push(m)};
 push(context.foundation?.lifePalace?.domainMeaning);push(context.foundation?.bodyPalace?.domainMeaning);push(context.foundation?.bodyPalace?.emphasisMeaning);
 for(const x of context.palaceMeanings||[])push(x.meaning);for(const x of context.starMeanings||[])if(x.state==='AVAILABLE')push(x.meaning);for(const x of context.stateMeanings||[])push(x.meaning);for(const x of context.transformations||[])push(x);for(const x of context.relationshipMeanings||[])push(x);for(const x of context.patternMeanings||[])push(x.meaning);for(const x of context.temporalMeanings||[])push(x);
 return [...new Map(out.map(x=>[x.meaningCode,x])).values()];
}
export function buildZiweiInterpretationEvidenceGraph({structuralFindings,meaningContext}={}){
 if(structuralFindings?.schemaVersion!=='PHI-OS-ZIWEI-STRUCTURAL-FINDING-COLLECTION-v1.0.0')fail('ZIWEI_FP_W13_REQUIRES_W12_FINDINGS');
 if(meaningContext?.schemaVersion!=='PHI-OS-ZIWEI-FP-W11-MEANING-CONTEXT-v1.0.0'||meaningContext.sourceChartDigest!==structuralFindings.sourceChartDigest)fail('ZIWEI_FP_W13_REQUIRES_W11_MEANINGS');
 const snapshots=[stableStringify(structuralFindings),stableStringify(meaningContext)];const nodes=[],edges=[];const nodeIds=new Set();
 const addNode=n=>{if(nodeIds.has(n.nodeId))return;nodeIds.add(n.nodeId);nodes.push(n)};const addEdge=(type,from,to,metadata=null)=>edges.push({edgeId:`ZWR-EDGE-${String(edges.length+1).padStart(4,'0')}`,type,from,to,metadata});
 const mMap=new Map(meaningCatalog(meaningContext).map(x=>[x.meaningCode,x]));
 for(const f of structuralFindings.findings)addNode({nodeId:f.findingId,nodeType:'FINDING',findingType:f.findingType,scope:f.scope,state:f.state,semanticDimension:f.semanticDimension,technicalLabel:f.technicalLabel,temporalContext:f.temporalContext});
 for(const e of structuralFindings.evidenceCatalog)addNode({nodeId:e.evidenceId,nodeType:'EVIDENCE',kind:e.kind,sourceWork:e.sourceWork,sourceDigest:e.sourceDigest,path:e.path,semanticRole:e.semanticRole,evidenceDigest:e.evidenceDigest,summary:e.summary});
 for(const a of structuralFindings.authorityCatalog)addNode({nodeId:a.authorityId,nodeType:'AUTHORITY',authorityClass:a.authorityClass,ref:a.ref});
 for(const u of structuralFindings.unknownCatalog)addNode({nodeId:u.unknownId,nodeType:'UNKNOWN',code:u.code,sourceWork:u.sourceWork,detail:u.detail,rendererMustPreserve:u.rendererMustPreserve});
 const requiredMeanings=uniq(structuralFindings.findings.flatMap(f=>f.meaningRefs));for(const code of requiredMeanings){const m=mMap.get(code);if(!m)fail(`ZIWEI_FP_W13_MEANING_NODE_MISSING:${code}`);addNode({nodeId:code,nodeType:'MEANING',meaningCode:m.meaningCode,meaningVersion:m.meaningVersion,kind:m.kind,sourceCode:m.sourceCode,meaningType:m.meaningType,authorityClass:m.authorityClass,semanticDigest:m.semanticDigest,label:m.label,definition:m.definition});}
 const evIds=new Set(structuralFindings.evidenceCatalog.map(x=>x.evidenceId)),authIds=new Set(structuralFindings.authorityCatalog.map(x=>x.authorityId)),unkIds=new Set(structuralFindings.unknownCatalog.map(x=>x.unknownId));
 for(const f of structuralFindings.findings){
  if(!f.evidenceRefs.length||!f.meaningRefs.length||!f.authorityRefs.length)fail(`ZIWEI_FP_W13_UNTRACEABLE_FINDING:${f.findingId}`);
  for(const ref of f.evidenceRefs){if(!evIds.has(ref))fail('ZIWEI_FP_W13_EVIDENCE_REF_MISSING');addEdge(f.counterEvidenceRefs.includes(ref)?'COUNTERS':'SUPPORTS',ref,f.findingId,{counterEvidence:f.counterEvidenceRefs.includes(ref)});}
  for(const ref of f.meaningRefs){if(!mMap.has(ref))fail('ZIWEI_FP_W13_MEANING_REF_MISSING');addEdge('QUALIFIES',ref,f.findingId);}
  for(const ref of f.authorityRefs){if(!authIds.has(ref))fail('ZIWEI_FP_W13_AUTHORITY_REF_MISSING');addEdge('GOVERNS',ref,f.findingId);}
  for(const ref of f.unknownRefs){if(!unkIds.has(ref))fail('ZIWEI_FP_W13_UNKNOWN_REF_MISSING');addEdge('BOUNDS',ref,f.findingId);}
 }
 nodes.sort((a,b)=>a.nodeId.localeCompare(b.nodeId));edges.sort((a,b)=>a.edgeId.localeCompare(b.edgeId));const typeCounts={};for(const n of nodes)typeCounts[n.nodeType]=(typeCounts[n.nodeType]||0)+1;const edgeTypeCounts={};for(const e of edges)edgeTypeCounts[e.type]=(edgeTypeCounts[e.type]||0)+1;
 const base={schemaVersion:ZIWEI_INTERPRETATION_EVIDENCE_GRAPH_SCHEMA,work:'ZIWEI-FP-W13',runtimeVersion:ZIWEI_INTERPRETATION_EVIDENCE_GRAPH_VERSION,authorityState:'TRACE_GRAPH_ONLY_NO_NARRATIVE_OR_CONTRADICTION_RESOLUTION',sourceFindingDigest:structuralFindings.findingDigest,sourceMeaningRegistryDigest:meaningContext.registryDigest,nodes,edges,summary:{nodeCount:nodes.length,edgeCount:edges.length,nodeTypeCounts:typeCounts,edgeTypeCounts,traceableFindingCount:structuralFindings.findings.length,counterEdgeCount:edges.filter(x=>x.type==='COUNTERS').length,unknownBoundaryEdgeCount:edges.filter(x=>x.type==='BOUNDS').length},boundaries:{newFindingCreated:false,newMeaningCreated:false,contradictionResolved:false,evidenceDeleted:false,unknownDeleted:false,graphTopologyProbabilityCreated:false,customerNarrativeCreated:false,eventPredictionCreated:false,customerCutoverAllowed:false}};
 const graphDigest=sha256Stable(base);if(stableStringify(structuralFindings)!==snapshots[0]||stableStringify(meaningContext)!==snapshots[1])fail('ZIWEI_FP_W13_INPUT_MUTATION_FORBIDDEN');return freeze({...base,graphDigest});
}
export default Object.freeze({buildZiweiInterpretationEvidenceGraph});
