import {getLocale,onLocaleChange} from '../i18n.js';
import {loadReconfigurationSections,loadReconfigurationCases,loadReconfigurationWindows,loadReconfigurationSnapshots,loadContemporaryRuntimeDossiers,loadLivedRealityDimensions} from './civilization-atlas/atlas-data.js';
import {mountReconfigurationAtlas} from './civilization-atlas/reconfiguration-renderer.js';
const root=document.querySelector('[data-civilization-atlas-root][data-atlas-mode="reconfiguration"]');
let generation=0;
async function render(){
 if(!root)return;const g=++generation;
 try{
  const [sections,cases,windows,snapshots,dossiers,lived]=await Promise.all([loadReconfigurationSections(),loadReconfigurationCases(),loadReconfigurationWindows(),loadReconfigurationSnapshots(),loadContemporaryRuntimeDossiers(),loadLivedRealityDimensions()]);
  if(g!==generation)return;
  mountReconfigurationAtlas(root,{sections,cases,windows,snapshots,dossiers,lived},{locale:getLocale()});
 }catch(error){
  root.dataset.atlasReady='error';
  root.innerHTML=`<div class="knowledge-shell"><p role="alert">${getLocale()==='zh-Hans'?'文明重组图谱暂时无法载入。':'Civilization Reconfiguration Atlas could not be loaded.'}</p></div>`;
  console.error(error);
 }
}
onLocaleChange(render);render();
