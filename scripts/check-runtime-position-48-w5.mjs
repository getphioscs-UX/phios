import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const fail=msg=>{throw new Error('RUNTIME_POSITION_48_W5:'+msg);};
const assert=(ok,msg)=>{if(!ok)fail(msg);};

const source=read('content/registry/runtime-position-48-source-windows-v1.json');
const history=read('content/civilization-atlas/reconfiguration/runtime-position-book5-historical-alignment-v1.json');
const correspondence=read('content/civilization-atlas/reconfiguration/runtime-position-correspondence-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const manifest=read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json');
const crosswalk=read('content/registry/runtime-position-48-crosswalk-v1.json');

assert(source.positions?.length===48,'SOURCE_WINDOW_COUNT');
assert(history.alignments?.length===48,'HISTORICAL_ALIGNMENT_COUNT');
assert(correspondence.correspondences?.length===(dossiers.dossiers||[]).length,'DOSSIER_CORRESPONDENCE_COUNT');

const p30=source.positions.find(x=>x.phase===30);
assert(p30?.sourceWindowLabel==='4253–3742 BC','PHASE_30_SOURCE_LITERAL_NOT_PRESERVED');
assert((p30?.anomalies||[]).some(x=>x.includes('OVERLAPS_PHASE_29')),'PHASE_30_ANOMALY_NOT_MARKED');

for(let phase=45;phase<=48;phase++){
  const id='RP-'+String(phase).padStart(2,'0');
  const row=history.alignments.find(x=>x.positionId===id);
  assert(row?.alignmentState==='FUTURE_SOURCE_WINDOW_NOT_BOOK_V_HISTORY','FUTURE_BOOK_V_EXCLUSION_'+id);
  assert((row?.bookV?.periodIds||[]).length===0,'FUTURE_PERIOD_LINK_'+id);
}
const p44=history.alignments.find(x=>x.positionId==='RP-44');
assert(p44?.alignmentState==='HISTORICAL_TO_CURRENT_BOUNDARY','PHASE_44_BOUNDARY');
assert((p44?.bookV?.periodIds||[]).includes('T19'),'PHASE_44_T19_LINK');

for(const row of correspondence.correspondences||[]){
  assert(row.primary?.positionId===null,'CURRENT_POSITION_INFERRED_'+row.dossierId);
  assert(row.primary?.knowledgeState==='UNKNOWN','CURRENT_POSITION_NOT_UNKNOWN_'+row.dossierId);
  assert(row.currentDataAdmission==='NOT_ADMITTED','CURRENT_DATA_ADMISSION_'+row.dossierId);
  assert((row.reachablePositions||[]).length===0,'FUTURE_POSITION_INFERRED_'+row.dossierId);
}

assert(manifest.registryRefs?.runtimePositionSourceWindows==='content/registry/runtime-position-48-source-windows-v1.json','MANIFEST_SOURCE_WINDOWS');
assert(manifest.registryRefs?.runtimePositionHistoricalAlignment==='content/civilization-atlas/reconfiguration/runtime-position-book5-historical-alignment-v1.json','MANIFEST_HISTORY');
assert(manifest.registryRefs?.runtimePositionCorrespondenceData==='content/civilization-atlas/reconfiguration/runtime-position-correspondence-v1.json','MANIFEST_CORRESPONDENCE_DATA');
assert(crosswalk.w5?.bookVMappingMethod==='TEMPORAL_OVERLAP_ONLY','CROSSWALK_MAPPING_METHOD');

const loader=text('assets/js/pages/civilization-atlas/atlas-data.js');
assert(loader.includes('runtime-position-book5-historical-alignment-v1.json'),'LOADER_HISTORY');
assert(loader.includes('runtime-position-correspondence-v1.json'),'LOADER_CORRESPONDENCE');
const renderer=text('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
assert(renderer.includes('48 runtime-position reading'),'RENDERER_POSITION_READING');
assert(renderer.includes('temporal overlap only; not semantic equivalence'),'RENDERER_HISTORY_BOUNDARY');
const ask=text('functions/_lib/atlas-retrieval-scope.js');
assert(ask.includes('CIVILIZATION_ATLAS_POSITION_ALIGNMENT'),'ASK_POSITION_ALIGNMENT');
assert(ask.includes('CIVILIZATION_ATLAS_POSITION_CORRESPONDENCE'),'ASK_POSITION_CORRESPONDENCE');
const discovery=text('assets/js/knowledge/public-discovery.js');
assert(discovery.includes("type:'RUNTIME_POSITION'"),'GLOBAL_SEARCH_POSITION');
assert(discovery.includes("positions:'/content/registry/runtime-position-48-v1.json'"),'GLOBAL_SEARCH_POSITION_SOURCE');

console.log('PASS runtime-position-48 W5: source windows preserved, Book V temporal crosswalk active, Phase 45–48 excluded from history, 12 dossier correspondences governed UNKNOWN, UI/Search/Ask overlays wired.');
