import {getLocale,onLocaleChange} from '../i18n.js';
import {createCivilizationAtlasState} from './civilization-atlas/atlas-state.js';
import {bindAtlasUrlState} from './civilization-atlas/atlas-url-state.js';
import {renderAtlasShell} from './civilization-atlas/atlas-shell.js';

const root=document.querySelector('[data-civilization-atlas-root]');
if(root){
  const store=createCivilizationAtlasState({locale:getLocale()});
  const unbindUrl=bindAtlasUrlState(store,{locale:getLocale()});
  const render=()=>renderAtlasShell(root,store.get(),{locale:getLocale(),onLayerChange:activeLayer=>store.set({activeLayer},{source:'layer-nav'})});
  const unsubscribe=store.subscribe(render);
  const unbindLocale=onLocaleChange(()=>store.set({locale:getLocale()},{source:'locale'}));
  render();
  window.addEventListener('pagehide',()=>{unsubscribe();unbindUrl();unbindLocale();},{once:true});
}
