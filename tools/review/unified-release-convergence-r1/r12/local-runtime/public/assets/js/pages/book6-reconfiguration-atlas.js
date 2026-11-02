import {getLocale,onLocaleChange} from '../i18n.js';
import {loadReconfigurationSections,loadReconfigurationCases,loadReconfigurationWindows,loadReconfigurationSnapshots,loadContemporaryRuntimeDossiers,loadLivedRealityDimensions,loadReconfigurationRelationships,loadReconfigurationKnowledgeStates,loadReconfigurationVisualStatus,loadRuntimePositionRegistry,loadCivilizationVisualBindings} from './civilization-atlas/atlas-data.js';
import {createReconfigurationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindReconfigurationAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {mountReconfigurationAtlas} from './civilization-atlas/reconfiguration-renderer.js';
const root=document.querySelector('[data-civilization-atlas-root][data-atlas-mode="reconfiguration"]');
let generation=0,dispose=()=>{};
async function render(){
 if(!root)return;const g=++generation;dispose();dispose=()=>{};
 try{
  const locale=getLocale();
  const [sections,cases,windows,snapshots,dossiers,lived,relationships,knowledgeStates,visualStatus,positions,visualBindings]=await Promise.all([
   loadReconfigurationSections(),loadReconfigurationCases(),loadReconfigurationWindows(),loadReconfigurationSnapshots(),
   loadContemporaryRuntimeDossiers({dossierId:new URLSearchParams(location.search).get('dossier')}),loadLivedRealityDimensions(),loadReconfigurationRelationships().catch(error=>({relationships:[],unavailable:error.message})),loadReconfigurationKnowledgeStates(),
   loadReconfigurationVisualStatus(),loadRuntimePositionRegistry(),loadCivilizationVisualBindings()
  ]);
  if(g!==generation)return;
  const store=createReconfigurationAtlasState({locale});
  const unbind=bindReconfigurationAtlasUrlState(store,{locale});
  if(relationships.unavailable)root.dataset.relationshipState='SERVICE_ERROR';
  const unmount=mountReconfigurationAtlas(root,{sections,cases,windows,snapshots,dossiers,lived,relationships,knowledgeStates,visualStatus,positions,visualBindings},{locale,store});
  if(relationships.unavailable){const note=document.createElement('p');note.setAttribute('role','status');note.textContent=locale==='zh-Hans'?'辅助关系资料暂不可读；原生对象仍可阅读，不生成替代关系。':'Supplementary relationships could not load; native objects remain readable and no replacement links are generated.';root.prepend(note);}
  dispose=()=>{unbind?.();unmount?.();};
 }catch(error){
  root.dataset.atlasReady='error';
  root.innerHTML=`<div class="knowledge-shell"><p role="alert">${getLocale()==='zh-Hans'?'文明重组图谱暂时无法载入。':'Civilization Reconfiguration Atlas could not be loaded.'}</p></div>`;
  console.error(error);
 }
}
onLocaleChange(render);render();
