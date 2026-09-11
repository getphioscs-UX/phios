import {getLocale,onLocaleChange} from '../i18n.js';
import {createCivilizationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {renderAtlasShell} from './civilization-atlas/atlas-shell.js';
import {reconcileAtlasContextForLayer} from './civilization-atlas/cross-layer-context.js';
import {loadTimelineRegistry,loadCaseRegistry,loadComparisonRegistry,loadWorldSnapshotRegistry,loadTrajectoryRegistry,loadTransitionRegistry,loadLossRegistry,loadAtlasVisualProjection} from './civilization-atlas/atlas-data.js';
const root=document.querySelector('[data-civilization-atlas-root]');
if(root){
  const store=createCivilizationAtlasState({locale:getLocale()});
  const unbindUrl=bindAtlasUrlState(store,{locale:getLocale()});
  const data={timeline:null,cases:null,comparison:null,world:null,trajectories:null,transitions:null,loss:null,visuals:null};
  const render=()=>renderAtlasShell(root,store.get(),{locale:getLocale(),data,onLayerChange:activeLayer=>store.set(reconcileAtlasContextForLayer(activeLayer,store.get(),data),{source:'layer-nav'}),onStateChange:(patch,meta)=>store.set(patch,meta)});
  const unsubscribe=store.subscribe(render);
  const unbindLocale=onLocaleChange(()=>store.set({locale:getLocale()},{source:'locale'}));
  render();
  Promise.all([
    loadTimelineRegistry(),loadCaseRegistry(),loadComparisonRegistry(),loadWorldSnapshotRegistry(),
    loadTrajectoryRegistry(),loadTransitionRegistry(),loadLossRegistry(),loadAtlasVisualProjection()
  ]).then(([timeline,cases,comparison,world,trajectories,transitions,loss,visuals])=>{
    Object.assign(data,{timeline,cases,comparison,world,trajectories,transitions,loss,visuals}); root.dataset.atlasReady='true'; root.dataset.atlasRegistryCounts='20/120/6/15/16/32/24'; render();
  }).catch(error=>{
    root.dataset.atlasReady='error'; console.error(error);
    const target=root.querySelector('[data-atlas-layer-content]');
    if(target) target.innerHTML=`<p role="alert">${getLocale()==='zh-Hans'?'文明图谱资料暂时无法载入。':'Civilization Atlas data could not be loaded.'}</p>`;
  });
  window.addEventListener('pagehide',()=>{unsubscribe();unbindUrl();unbindLocale();},{once:true});
}
