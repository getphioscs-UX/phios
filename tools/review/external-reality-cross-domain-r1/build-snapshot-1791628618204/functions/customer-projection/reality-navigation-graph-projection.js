// Read-only display adapter. Neither the renderer nor this adapter admits facts,
// directions, actions, causal links or persistence into the existing runtime.
export const REALITY_NAVIGATION_GRAPH_SCHEMA='PHI-OS-REALITY-NAVIGATION-GRAPH-PROJECTION-v1';
const freeze=v=>{if(v&&typeof v==='object'){Object.freeze(v);Object.values(v).forEach(x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x))freeze(x);});}return v;};
export function projectRealityNavigationGraph({reality={},navigation={},authorized=true}={}){
 const bundleId=reality.overview?.bundleId,sourceVersion=reality.schemaVersion,asOf=reality.overview?.createdAt;
 const denied=!authorized,valid=!denied&&typeof bundleId==='string'&&!!bundleId&&typeof sourceVersion==='string'&&!!sourceVersion&&Number.isFinite(Date.parse(asOf));
 const nodes=[];
 // Current customer projection retains strings but drops per-fact provenance.
 // Only its explicitly self-reported lane can be represented safely at present.
 if(valid)for(const [index,value] of (reality.currentReality?.reportedContext||[]).entries()){
  if(typeof value!=='string'||!value.trim())continue;
  nodes.push({id:`${bundleId}:reportedContext:${index}`,type:'REPORTED_CONTEXT',labelZh:'客户自述',labelEn:'Customer statement',content:value,contentLanguage:'CUSTOMER_ORIGINAL_UNTRANSLATED',sourceRef:`${bundleId}#/reportedContext/${index}`,sourceVersion,sourceClass:'USER_SELF_REPORT',asOf,currentness:'SESSION_INPUT',confirmation:'SELF_REPORTED',scope:'SESSION_PROJECTION',realityVersion:null,decisionVersion:null,permissions:{processingAllowed:true,thirdPartyFactsAdmitted:false},independentlyConfirmedFact:false});
 }
 const modules=navigation.acceptedEvaluation?.modules||[];
 return freeze({schemaVersion:REALITY_NAVIGATION_GRAPH_SCHEMA,source:{bundleId:valid?bundleId:null,sourceVersion:valid?sourceVersion:null,asOf:valid?asOf:null,identityScope:'SOURCE_VERSION_LOCAL',canonicalRealityVersion:null},G1:{state:denied?'NO_ACCESS':nodes.length?'LIMITED_SELF_REPORT':'EMPTY',nodes,edges:[],missing:['PER_OBJECT_PROVENANCE_REQUIRED_FOR_FACT_RESOURCE_CONSTRAINT_NODES','EXPLICIT_RELATIONSHIP_SOURCE_REQUIRED_FOR_EDGES']},G2:{state:'NOT_ESTABLISHED',nodes:[],edges:[],missing:['OWNER_SCOPED_CURRENT_REALITY_AND_DECISION_VERSION','ADMITTED_DIRECTION_AND_CONFIRMED_POSITION_PROJECTION'],acceptedNavEvaluation:modules.map(m=>({moduleId:m.moduleId,state:m.state,sourceVersion:m.contractVersion,sourceSHA256:m.sourceSHA256,known:m.known||[],unknown:m.unknown||[],customerActionAuthorized:false}))},G3:{state:'NO_VERIFIED_HISTORY',nodes:[],edges:[],missing:['QUALIFYING_VERSIONED_REALITY_DIFF_AND_HISTORY_OWNER'],historyReconstructed:false},governance:{readOnly:true,persisted:false,actionAdvancementAllowed:false,finalAction:null,providerCalls:0,correlationIsCausation:false,structuralReinforcementInferred:false,rendererAuthorityCreated:false}});
}
export function assertRealityNavigationGraph(graph){
 if(graph?.schemaVersion!==REALITY_NAVIGATION_GRAPH_SCHEMA||graph.governance?.readOnly!==true||graph.governance?.persisted!==false||graph.governance?.actionAdvancementAllowed!==false)throw new Error('GRAPH_READ_ONLY_BOUNDARY_REQUIRED');
 const ids=new Set();for(const key of ['G1','G2','G3']){
  const layer=graph[key];if(!Array.isArray(layer?.nodes)||!Array.isArray(layer?.edges))throw new Error('GRAPH_LAYER_REQUIRED');
  for(const node of layer.nodes){if(ids.has(node.id)||!node.id||!node.sourceRef||!node.sourceVersion||!Number.isFinite(Date.parse(node.asOf))||node.permissions?.processingAllowed!==true)throw new Error('GRAPH_NODE_PROVENANCE_OR_PERMISSION_REQUIRED');ids.add(node.id);}
  // Current owner does not yet expose admitted relationship records. No lines
  // may be synthesized from strings, proximity, module readiness or history titles.
  if(layer.edges.length)throw new Error('GRAPH_EDGE_OWNER_ADAPTER_NOT_ADMITTED');
 }
 if(graph.G3.nodes.length)throw new Error('GRAPH_HISTORY_OWNER_ADAPTER_NOT_ADMITTED');return graph;
}
