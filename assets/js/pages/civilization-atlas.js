import {renderAtlasStaticVisuals,ATLAS_VISUAL_BINDINGS_PATH} from './civilization-atlas/atlas-static-visual.js';
import {renderAtlasVisualProjection} from './civilization-atlas/atlas-visual-projection.js';
import {getLocale,onLocaleChange} from '../i18n.js';
import {createCivilizationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {renderAtlasShell} from './civilization-atlas/atlas-shell.js';
import {reconcileAtlasContextForLayer} from './civilization-atlas/cross-layer-context.js';
import {loadTimelineRegistry,loadTimelineMacroRegistry,loadCaseRegistry,loadComparisonRegistry,loadWorldSnapshotRegistry,loadTrajectoryRegistry,loadTransitionRegistry,loadLossRegistry} from './civilization-atlas/atlas-data.js';
const root=document.querySelector('[data-civilization-atlas-root]');
if(root){
  const store=createCivilizationAtlasState({locale:getLocale()});
  const unbindUrl=bindAtlasUrlState(store,{locale:getLocale()});
  const data={timeline:null,timelineMacro:null,cases:null,comparison:null,world:null,trajectories:null,transitions:null,loss:null,visualProjection:null,templateSlots:null};
  const render=()=>{renderAtlasShell(root,store.get(),{
    locale:getLocale(),data,
    onLayerChange:activeLayer=>store.set(reconcileAtlasContextForLayer(activeLayer,store.get(),data),{source:'layer-nav'}),
    onStateChange:(patch,meta)=>store.set(patch,meta)
  });
  renderAtlasVisualProjection(root.querySelector('[data-atlas-template-projection]'),{projection:data.visualProjection,slots:data.templateSlots,data,state:store.get(),locale:getLocale()});
  renderAtlasStaticVisuals(root,{bindings:data.staticVisuals,state:store.get(),locale:getLocale(),data});};
  const unsubscribe=store.subscribe(render);
  const unbindLocale=onLocaleChange(()=>store.set({locale:getLocale()},{source:'locale'}));
  render();
  Promise.all([
    loadTimelineRegistry(),loadTimelineMacroRegistry(),loadCaseRegistry(),loadComparisonRegistry(),loadWorldSnapshotRegistry(),
    loadTrajectoryRegistry(),loadTransitionRegistry(),loadLossRegistry()
  ]).then(([timeline,timelineMacro,cases,comparison,world,trajectories,transitions,loss])=>{
    Object.assign(data,{timeline,timelineMacro,cases,comparison,world,trajectories,transitions,loss});
    root.dataset.atlasReady='true';
    root.dataset.atlasRegistryCounts='20/120/6/15/16/32/24';
    root.dataset.atlasProjection='STRUCTURED_HTML_SVG_PRIMARY';
    render();
  }).catch(error=>{
    root.dataset.atlasReady='error'; console.error(error);
    const target=root.querySelector('[data-atlas-layer-content]');
    if(target) target.innerHTML=`<p role="alert">${getLocale()==='zh-Hans'?'文明图谱资料暂时无法载入。':'Civilization Atlas data could not be loaded.'}</p>`;
  });
  fetch(ATLAS_VISUAL_BINDINGS_PATH).then(r=>{if(!r.ok)throw new Error('STATIC_VISUAL_BINDINGS_UNAVAILABLE');return r.json();}).then(bindings=>{data.staticVisuals=bindings;render();}).catch(()=>{/* Optional imagery: structured Atlas remains available. */});
  Promise.all([
    fetch('/content/civilization-atlas/visuals/atlas-visual-projection-v1.json').then(r=>{if(!r.ok)throw new Error('ATLAS_VISUAL_PROJECTION_UNAVAILABLE');return r.json();}),
    fetch('/content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json').then(r=>{if(!r.ok)throw new Error('ATLAS_TEMPLATE_SLOTS_UNAVAILABLE');return r.json();})
  ]).then(([visualProjection,templateSlots])=>{data.visualProjection=visualProjection;data.templateSlots=templateSlots;root.dataset.atlasProjection='LIBRARY_TEMPLATE_COMPOSITOR';render();}).catch(()=>{root.dataset.atlasProjection='STRUCTURED_FALLBACK';});
  window.addEventListener('pagehide',()=>{unsubscribe();unbindUrl();unbindLocale();},{once:true});
}
