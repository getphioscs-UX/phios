const JSON_HEADERS={headers:{Accept:'application/json'}};
const CACHE=new Map();
async function getJson(path){
  if(!CACHE.has(path)) CACHE.set(path,fetch(path,JSON_HEADERS).then(r=>{if(!r.ok) throw new Error(`ATLAS_DATA_HTTP_${r.status}:${path}`); return r.json();}));
  return CACHE.get(path);
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
export function clearAtlasDataCache(){CACHE.clear();}

export async function loadReconfigurationSections(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-sections-v1.json');}
export async function loadReconfigurationCases(){return getJson('/content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');}
export async function loadReconfigurationWindows(){return getJson('/content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json');}
export async function loadReconfigurationSnapshots(){return getJson('/content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json');}
export async function loadContemporaryRuntimeDossiers(){
  const [base,depth]=await Promise.all([
    getJson('/content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json'),
    getJson('/content/civilization-atlas/reconfiguration/dossier-knowledge-depth-v1.json')
  ]);
  const overlay=new Map((depth.dossiers||[]).map(x=>[x.id,x]));
  return {...base,knowledgeDepthContract:depth.contract,knowledgeDepthVersion:depth.version,dossiers:(base.dossiers||[]).map(d=>({...d,knowledgeDepth:overlay.get(d.id)||null}))};
}
export async function loadLivedRealityDimensions(){return getJson('/content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json');}

export async function loadReconfigurationRelationships(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json');}
export async function loadReconfigurationKnowledgeStates(){return getJson('/content/civilization-atlas/reconfiguration/knowledge-state-contract-v1.json');}
export async function loadReconfigurationVisualStatus(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json');}
export async function loadCivilizationVisualBindings(){return getJson('/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');}
