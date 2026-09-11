import {getLocale,onLocaleChange} from '../i18n.js';
import {createCivilizationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {renderAtlasShell} from './civilization-atlas/atlas-shell.js';
import {loadTimelineRegistry,loadCaseRegistry,loadComparisonRegistry,loadWorldSnapshotRegistry} from './civilization-atlas/atlas-data.js';
const root=document.querySelector('[data-civilization-atlas-root]');
if(root){
  const store=createCivilizationAtlasState({locale:getLocale()});
  const unbindUrl=bindAtlasUrlState(store,{locale:getLocale()});
  const data={timeline:null,cases:null,comparison:null,world:null}; let loadError=null;
  const render=()=>renderAtlasShell(root,store.get(),{locale:getLocale(),data,onLayerChange:activeLayer=>store.set({activeLayer},{source:'layer-nav'}),onStateChange:(patch,meta)=>store.set(patch,meta)});
  const unsubscribe=store.subscribe(render);
  const unbindLocale=onLocaleChange(()=>store.set({locale:getLocale()},{source:'locale'}));
  render();
  Promise.all([loadTimelineRegistry(),loadCaseRegistry(),loadComparisonRegistry(),loadWorldSnapshotRegistry()]).then(([timeline,cases,comparison,world])=>{data.timeline=timeline;data.cases=cases;data.comparison=comparison;data.world=world;render();}).catch(error=>{loadError=error;console.error(error);const target=root.querySelector('[data-atlas-layer-content]');if(target) target.innerHTML=`<p role="alert">${getLocale()==='zh-Hans'?'文明图谱资料暂时无法载入。':'Civilization Atlas data could not be loaded.'}</p>`;});
  window.addEventListener('pagehide',()=>{unsubscribe();unbindUrl();unbindLocale();},{once:true});
}
