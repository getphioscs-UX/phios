const JSON_HEADERS={headers:{Accept:'application/json'}};
const CACHE=new Map();
async function getJson(path){
  if(!CACHE.has(path)) CACHE.set(path,fetch(path,JSON_HEADERS).then(r=>{if(!r.ok) throw new Error(`ATLAS_DATA_HTTP_${r.status}:${path}`); return r.json();}));
  return CACHE.get(path);
}
export async function loadTimelineRegistry(){return getJson('/content/civilization-atlas/timeline/timeline-periods-v1.json');}
export async function loadCaseRegistry(){return getJson('/content/civilization-atlas/cases/civilization-case-registry-v1.json');}
export async function loadAtlasLayers(){return getJson('/content/civilization-atlas/atlas-layers-v1.json');}
export function clearAtlasDataCache(){CACHE.clear();}
