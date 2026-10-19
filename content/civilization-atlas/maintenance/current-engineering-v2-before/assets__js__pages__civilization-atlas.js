import {recordVisual} from './civilization-atlas/visual-runtime.js';
import {renderAtlasStaticVisuals,resolveAtlasVisualDeepLink,ATLAS_VISUAL_BINDINGS_PATH} from './civilization-atlas/atlas-static-visual.js';
import {renderAtlasVisualProjection} from './civilization-atlas/atlas-visual-projection.js';
import {getLocale,onLocaleChange} from '../i18n.js';
import {createCivilizationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {renderAtlasShell} from './civilization-atlas/atlas-shell.js';
import {renderAtlasReadingBridge} from './civilization-atlas/atlas-reading-bridge.js';
import {loadReconfigurationCases} from './civilization-atlas/atlas-data.js';
import {reconcileAtlasContextForLayer} from './civilization-atlas/cross-layer-context.js';
import {loadTimelineRegistry,loadTimelineMacroRegistry,loadCaseRegistry,loadComparisonRegistry,loadWorldSnapshotRegistry,loadTrajectoryRegistry,loadTransitionRegistry,loadLossRegistry} from './civilization-atlas/atlas-data.js';
const root=document.querySelector('[data-civilization-atlas-root]');
if(root){
  recordVisual(null,'BINDING_LOADING');
  const store=createCivilizationAtlasState({locale:getLocale()});
  const unbindUrl=bindAtlasUrlState(store,{locale:getLocale()});
  const data={timeline:null,timelineMacro:null,cases:null,comparison:null,world:null,trajectories:null,transitions:null,loss:null,visualProjection:null,templateSlots:null};
  let visualDeepLinkApplied=false;
  const applyVisualDeepLink=()=>{
    if(visualDeepLinkApplied||!data.staticVisuals||!data.timeline||!data.transitions)return;
    const assetId=new URLSearchParams(globalThis.location?.search||'').get('visual');
    if(!assetId){visualDeepLinkApplied=true;return;}
    const resolved=resolveAtlasVisualDeepLink(data.staticVisuals,assetId,{data});
    if(!resolved)return;
    visualDeepLinkApplied=true;
    if(resolved.externalHref){globalThis.location.assign(resolved.externalHref);return;}
    if(resolved.patch)store.set(resolved.patch,{source:'visual-deep-link'});
  };
  const render=()=>{renderAtlasShell(root,store.get(),{
    locale:getLocale(),data,
    onLayerChange:activeLayer=>store.set(reconcileAtlasContextForLayer(activeLayer,store.get(),data),{source:'layer-nav'}),
    onStateChange:(patch,meta)=>store.set(patch,meta)
  });
  renderAtlasVisualProjection(root.querySelector('[data-atlas-template-projection]'),{projection:data.visualProjection,slots:data.templateSlots,data,state:store.get(),locale:getLocale(),onStateChange:(patch,meta)=>store.set(patch,meta)});
  renderAtlasStaticVisuals(root,{bindings:data.staticVisuals,state:store.get(),locale:getLocale(),data});
  renderAtlasReadingBridge(root,{state:store.get(),cases:data.cases,reconfigurationCases:data.reconfigurationCases,locale:getLocale()});};
  const unsubscribe=store.subscribe(render);
  const unbindLocale=onLocaleChange(()=>store.set({locale:getLocale()},{source:'locale'}));
  render();
  loadReconfigurationCases().then(registry=>{data.reconfigurationCases=registry;render();}).catch(()=>{/* No bridge is asserted without the existing relation. */});
  Promise.all([
    loadTimelineRegistry(),loadTimelineMacroRegistry(),loadCaseRegistry(),loadComparisonRegistry(),loadWorldSnapshotRegistry(),
    loadTrajectoryRegistry(),loadTransitionRegistry(),loadLossRegistry()
  ]).then(([timeline,timelineMacro,cases,comparison,world,trajectories,transitions,loss])=>{
    Object.assign(data,{timeline,timelineMacro,cases,comparison,world,trajectories,transitions,loss});
    root.dataset.atlasReady='true';
    root.dataset.atlasRegistryCounts='20/120/6/15/16/32/24';
    root.dataset.atlasProjection='STRUCTURED_HTML_SVG_PRIMARY';
    applyVisualDeepLink();
    render();
  }).catch(error=>{
    root.dataset.atlasReady='error'; console.error(error);
    const target=root.querySelector('[data-atlas-layer-content]');
    if(target) target.innerHTML=`<p role="alert">${getLocale()==='zh-Hans'?'文明图谱资料暂时无法载入。':'Civilization Atlas data could not be loaded.'}</p>`;
  });
  fetch(ATLAS_VISUAL_BINDINGS_PATH).then(r=>{if(!r.ok)throw new Error('STATIC_VISUAL_BINDINGS_UNAVAILABLE');return r.json();}).then(bindings=>{data.staticVisuals=bindings;applyVisualDeepLink();render();}).catch(error=>{root.dataset.visualBindingState='MISSING_BINDING';console.error(error);globalThis.dispatchEvent(new CustomEvent('phios:atlas-visual-state',{detail:{state:'MISSING_BINDING',error:error.message}}));});
  Promise.all([
    fetch('/content/civilization-atlas/visuals/atlas-visual-projection-v1.json').then(r=>{if(!r.ok)throw new Error('ATLAS_VISUAL_PROJECTION_UNAVAILABLE');return r.json();}),
    fetch('/content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json').then(r=>{if(!r.ok)throw new Error('ATLAS_TEMPLATE_SLOTS_UNAVAILABLE');return r.json();})
  ]).then(([visualProjection,templateSlots])=>{data.visualProjection=visualProjection;data.templateSlots=templateSlots;root.dataset.atlasProjection='CIV_ATLAS_TEMPLATE_COMPOSITOR';render();}).catch(error=>{root.dataset.atlasProjection='STRUCTURED_FALLBACK';console.error(error);globalThis.dispatchEvent(new CustomEvent('phios:atlas-visual-state',{detail:{state:'PROJECTION_UNAVAILABLE',error:error.message}}));});
  window.addEventListener('pagehide',()=>{unsubscribe();unbindUrl();unbindLocale();},{once:true});
}
