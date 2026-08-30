import {methodInputExtension,registeredMethodInputExtensions} from './method-input-extension-registry.js';

export const PPR_R4_METHOD_INPUT_HOST_VERSION='PPR-R4-METHOD-INPUT-HOST-v1.0.0';
const cleanMethods=methods=>Array.isArray(methods)?methods.map(x=>String(x||'')).filter(Boolean):[];

export function syncMethodInputExtensions(form,methods=[]){
 const root=document.querySelector('[data-ppr-r4-method-input-mount]');
 if(!root)return;
 const selected=new Set(cleanMethods(methods));
 const active=registeredMethodInputExtensions().filter(entry=>selected.has(entry.methodKey));
 root.hidden=active.length===0;
 root.innerHTML=active.map(entry=>methodInputExtension(entry.methodKey)?.module?.render?.({form,methods:[...selected]})||'').join('');
 for(const entry of active)methodInputExtension(entry.methodKey)?.module?.install?.({root,form,methods:[...selected]});
}

export function collectMethodInputExtensions(form,methods=[]){
 const selected=cleanMethods(methods),result={};
 for(const methodKey of selected){
  const entry=methodInputExtension(methodKey);if(!entry)continue;
  result[methodKey]=entry.module?.collect?.({form,methods:selected})||null;
 }
 return Object.freeze(result);
}

export function resetMethodInputExtensions(form){syncMethodInputExtensions(form,[])}
export default Object.freeze({PPR_R4_METHOD_INPUT_HOST_VERSION,syncMethodInputExtensions,collectMethodInputExtensions,resetMethodInputExtensions});
