import {methodInputExtension,registeredMethodInputExtensions} from './method-input-extension-registry.js';
import {upgradeAndInstallTargetMomentControls} from './target-moment-place-control.js';

export const PPR_R4_METHOD_INPUT_HOST_VERSION='PPR-R4-METHOD-INPUT-HOST-v1.0.0';
const cleanMethods=methods=>Array.isArray(methods)?methods.map(x=>String(x||'')).filter(Boolean):[];
// Current customer input ownership: Astrology timing and the BaZi/Zi Wei traditional
// direction rule are unified elsewhere on the form. Historical method extensions
// remain registered for lineage/regression serialization, but must not create a
// second visible owner or collect a second value.
const SHARED_INPUT_SUCCESSORS=new Set(['astrology','bazi']);

function snapshotNamedControls(root){
 const values=[...root?.querySelectorAll('[name]')||[]].map(node=>({name:node.name,value:node.value,checked:node.checked===true,type:node.type}));
 const open=[...root?.querySelectorAll('details[open]')||[]].map(node=>node.className);
 return {values,open};
}
function restoreNamedControls(root,snapshot){
 for(const state of snapshot.values){const nodes=[...root?.querySelectorAll('[name]')||[]].filter(item=>item.name===state.name);const node=state.type==='radio'?nodes.find(item=>item.value===state.value):nodes[0];if(!node)continue;if(node.type==='checkbox'||node.type==='radio')node.checked=state.checked;else node.value=state.value}
 root?.querySelectorAll('details').forEach(node=>{if(snapshot.open.includes(node.className))node.open=true});
}

export function syncMethodInputExtensions(form,methods=[]){
 const root=document.querySelector('[data-ppr-r4-method-input-mount]');
 if(!root)return;
 const snapshot=snapshotNamedControls(root);
 const selected=new Set(cleanMethods(methods));
 const active=registeredMethodInputExtensions().filter(entry=>selected.has(entry.methodKey)&&!SHARED_INPUT_SUCCESSORS.has(entry.methodKey));
 root.hidden=active.length===0;
 root.innerHTML=active.map(entry=>methodInputExtension(entry.methodKey)?.module?.render?.({form,methods:[...selected]})||'').join('');
 for(const entry of active)methodInputExtension(entry.methodKey)?.module?.install?.({root,form,methods:[...selected]});
 upgradeAndInstallTargetMomentControls(root);
 restoreNamedControls(root,snapshot);
 upgradeAndInstallTargetMomentControls(root);
}

export function collectMethodInputExtensions(form,methods=[]){
 const selected=cleanMethods(methods),result={};
 for(const methodKey of selected){
  if(SHARED_INPUT_SUCCESSORS.has(methodKey))continue;
  const entry=methodInputExtension(methodKey);if(!entry)continue;
  result[methodKey]=entry.module?.collect?.({form,methods:selected})||null;
 }
 return Object.freeze(result);
}

export function resetMethodInputExtensions(form){syncMethodInputExtensions(form,[])}
export default Object.freeze({PPR_R4_METHOD_INPUT_HOST_VERSION,syncMethodInputExtensions,collectMethodInputExtensions,resetMethodInputExtensions});
