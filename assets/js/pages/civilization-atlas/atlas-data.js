const JSON_HEADERS={headers:{Accept:'application/json'}};
const CACHE=new Map();
async function getJson(path){
  if(!CACHE.has(path)) CACHE.set(path,fetch(path,JSON_HEADERS).then(r=>{if(!r.ok) throw new Error(`ATLAS_DATA_HTTP_${r.status}:${path}`); return r.json();}));
  return CACHE.get(path);
}
export async function loadTimelineRegistry(){return getJson('/content/civilization-atlas/timeline/timeline-periods-v1.json');}
export async function loadCaseRegistry(){return getJson('/content/civilization-atlas/cases/civilization-case-registry-v1.json');}
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
export async function loadContemporaryRuntimeDossiers(){return getJson('/content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');}
export async function loadLivedRealityDimensions(){return getJson('/content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json');}

export async function loadReconfigurationRelationships(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json');}
export async function loadReconfigurationKnowledgeStates(){return getJson('/content/civilization-atlas/reconfiguration/knowledge-state-contract-v1.json');}
export async function loadReconfigurationVisualStatus(){return getJson('/content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json');}
export async function loadCivilizationVisualBindings(){return getJson('/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');}
