import {getLocale,onLocaleChange} from '../i18n.js';
import {loadReconfigurationSections,loadReconfigurationCases,loadReconfigurationWindows,loadReconfigurationSnapshots,loadContemporaryRuntimeDossiers,loadLivedRealityDimensions,loadReconfigurationRelationships,loadReconfigurationKnowledgeStates,loadReconfigurationVisualStatus,loadCivilizationVisualBindings} from './civilization-atlas/atlas-data.js';
import {createReconfigurationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindReconfigurationAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {mountReconfigurationAtlas} from './civilization-atlas/reconfiguration-renderer.js';
const root=document.querySelector('[data-civilization-atlas-root][data-atlas-mode="reconfiguration"]');
let generation=0,dispose=()=>{};
async function render(){
 if(!root)return;const g=++generation;dispose();dispose=()=>{};
 try{
  const locale=getLocale();
  const [sections,cases,windows,snapshots,dossiers,lived,relationships,knowledgeStates,visualStatus,visualBindings]=await Promise.all([
   loadReconfigurationSections(),loadReconfigurationCases(),loadReconfigurationWindows(),loadReconfigurationSnapshots(),
   loadContemporaryRuntimeDossiers(),loadLivedRealityDimensions(),loadReconfigurationRelationships(),loadReconfigurationKnowledgeStates(),
   loadReconfigurationVisualStatus(),loadCivilizationVisualBindings()
  ]);
  if(g!==generation)return;
  const store=createReconfigurationAtlasState({locale});
  const unbind=bindReconfigurationAtlasUrlState(store,{locale});
  const unmount=mountReconfigurationAtlas(root,{sections,cases,windows,snapshots,dossiers,lived,relationships,knowledgeStates,visualStatus,visualBindings},{locale,store});
  dispose=()=>{unbind?.();unmount?.();};
 }catch(error){
  root.dataset.atlasReady='error';
  root.innerHTML=`<div class="knowledge-shell"><p role="alert">${getLocale()==='zh-Hans'?'文明重组图谱暂时无法载入。':'Civilization Reconfiguration Atlas could not be loaded.'}</p></div>`;
  console.error(error);
 }
}
onLocaleChange(render);render();
