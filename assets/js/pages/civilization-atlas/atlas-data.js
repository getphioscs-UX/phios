import {applyAuthorDisplay} from './book6-current-view.js';
const JSON_HEADERS={headers:{Accept:'application/json'}};
const CACHE=new Map();
const ACCEPTED_CACHE=new Map();
async function getJson(path){
  if(!CACHE.has(path)) CACHE.set(path,fetch(path,JSON_HEADERS).then(r=>{if(!r.ok) throw new Error(`ATLAS_DATA_HTTP_${r.status}:${path}`); return r.json();}));
  return CACHE.get(path).catch(error=>{CACHE.delete(path);throw error;});
}
export async function loadTimelineRegistry(){return getJson('/content/civilization-atlas/timeline/timeline-periods-v1.json');}
export async function loadTimelineMacroRegistry(){return getJson('/content/civilization-atlas/timeline/timeline-macro-eras-v1.json');}
const CASE_DEPTH_SHARDS=[
  '/content/civilization-atlas/cases/depth/fr5-f1-remaining-11-v1.json',
  '/content/civilization-atlas/cases/depth/fr5-f2-remaining-11-v1.json',
  '/content/civilization-atlas/cases/depth/fr5-f3-remaining-11-v1.json',
  '/content/civilization-atlas/cases/depth/fr5-f4-remaining-11-v1.json',
  '/content/civilization-atlas/cases/depth/fr5-f5-remaining-11-v1.json'
];
export async function loadCaseRegistry(){
  const [base,...depth]=await Promise.all([
    getJson('/content/civilization-atlas/cases/civilization-case-registry-v1.json'),
    ...CASE_DEPTH_SHARDS.map(getJson)
  ]);
  const overlay=new Map(depth.flatMap(x=>x.records||[]).map(x=>[x.caseId,x]));
  return {...base,cases:(base.cases||[]).map(c=>{const d=overlay.get(c.caseId);if(!d)return c;const {caseId,...fields}=d;return {...c,...fields};})};
}
export async function loadComparisonRegistry(){return getJson('/content/civilization-atlas/comparison/comparison-families-v1.json');}
export async function loadWorldSnapshotRegistry(){return getJson('/content/civilization-atlas/snapshots/world-snapshots-v1.json');}
export async function loadTrajectoryRegistry(){return getJson('/content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');}
export async function loadTransitionRegistry(){return getJson('/content/civilization-atlas/transitions/transition-windows-v1.json');}
export async function loadLossRegistry(){return getJson('/content/civilization-atlas/loss/reversal-loss-atlas-v1.json');}
export async function loadAtlasLayers(){return getJson('/content/civilization-atlas/atlas-layers-v1.json');}
export function clearAtlasDataCache(){CACHE.clear();ACCEPTED_CACHE.clear();}

export async function loadReconfigurationSections(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-sections-v1.json');}
export async function loadReconfigurationCases(){return getJson('/content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');}
export async function loadReconfigurationWindows(){return getJson('/content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json');}
export async function loadReconfigurationSnapshots(){return getJson('/content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json');}
export async function loadAcceptedDossier(id){
 const path='/api/book6-runtime-readout?dossier='+encodeURIComponent(id);
 try{
  const cached=ACCEPTED_CACHE.get(path);if(cached&&cached.expiresAt>Date.now())return structuredClone(await cached.promise);
  const promise=fetch(path,JSON_HEADERS).then(async r=>{if(!r.ok)throw Error('ATLAS_DATA_HTTP_'+r.status);const body=await r.json();if(body.ok&&body.projection?.dossierId!==id)throw Error('BOOK6_DOSSIER_IDENTITY_MISMATCH');return {acceptedCurrent:body.ok?body.projection:null,currentLoadState:body.ok?'ACCEPTED_SCOPE':'NO_EVIDENCE'};});
  ACCEPTED_CACHE.set(path,{promise,expiresAt:Date.now()+60000});return structuredClone(await promise);
 }catch(error){ACCEPTED_CACHE.delete(path);return {acceptedCurrent:null,currentLoadState:error.message.includes('HTTP_404')?'NOT_ACTIVATED':'SERVICE_ERROR',currentLoadError:error.message};}
}
export async function loadContemporaryRuntimeDossiers({dossierId=null}={}){
 const [base,depth]=await Promise.all([getJson('/content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json'),getJson('/content/civilization-atlas/reconfiguration/dossier-knowledge-depth-v1.json')]);
 const overlay=new Map((depth.dossiers||[]).map(d=>[d.id,d]));
 const rows=await Promise.all((base.dossiers||[]).map(async d=>({...d,knowledgeDepth:overlay.get(d.id)||null,...(d.id===dossierId?await loadAcceptedDossier(d.id):{acceptedCurrent:null,currentLoadState:'NOT_REQUESTED'}),runtimePositionCorrespondence:null,runtimePositionEvidenceGate:null,runtimePositionAdmissionReadiness:null,runtimePositionCandidates:[],currentPositionState:'UNKNOWN'})));
 return {...base,knowledgeDepthContract:depth.contract,knowledgeDepthVersion:depth.version,currentAdmissionOwner:'W8-I_ACCEPTED_CURRENT_DOSSIER',dossiers:rows};
}
export async function loadLivedRealityDimensions(){return getJson('/content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json');}

export async function loadReconfigurationRelationships(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json');}
export async function loadReconfigurationKnowledgeStates(){return getJson('/content/civilization-atlas/reconfiguration/knowledge-state-contract-v1.json');}
export async function loadReconfigurationVisualStatus(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json');}
export async function loadRuntimePositionRegistry(){
  const [registry,crosswalk,sourceWindows,historicalAlignment]=await Promise.all([
    getJson('/content/registry/runtime-position-48-v1.json'),
    getJson('/content/registry/runtime-position-48-crosswalk-v1.json'),
    getJson('/content/registry/runtime-position-48-source-windows-v1.json'),
    getJson('/content/civilization-atlas/reconfiguration/runtime-position-book5-historical-alignment-v1.json')
  ]);
  const overlay=await getJson('/content/civilization-atlas/reconfiguration/runtime-position-display-errata-r1.json');
  const decision=await applyAuthorDisplay(registry,sourceWindows,overlay);
  const sourceById=new Map((sourceWindows.positions||[]).map(x=>[x.positionId,x.positionId==='RP-30'?{...x,authorDisplay:{label:decision.rp30.display,literal:decision.rp30.literal,version:decision.version}}:x]));
  const historyById=new Map((historicalAlignment.alignments||[]).map(x=>[x.positionId,x]));
  return {...registry,crosswalk,sourceWindows,historicalAlignment,positions:(registry.positions||[]).map(x=>({...x,...(decision.g8.positionIds.includes(x.id)?{authorArc:decision.g8}:{}),sourceWindow:sourceById.get(x.id)||null,historicalAlignment:historyById.get(x.id)||null}))};
}
export async function loadCivilizationVisualBindings(){return getJson('/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');}
