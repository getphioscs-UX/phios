import enRecovery from '../../locales/en/world-recovery.js';
import zhRecovery from '../../locales/zh-Hans/world-recovery.js';
import {getLocale,t} from '../../i18n.js';
// Presentation-only terminology from the same active dictionary as data-i18n.
// Canonical source text, technical details and user-entered source text are preserved.
export function localizeWorldCopy(root){
 if(!root)return;
 const recovery=(getLocale()==='zh-Hans'?zhRecovery:enRecovery).worldRecovery;
 // Use the same governed namespace as a fallback during cached dictionary upgrades.
 for(const el of root.querySelectorAll('[data-i18n^="worldRecovery."]')){const key=el.dataset.i18n,fallback=key.split('.').slice(1).reduce((value,part)=>value?.[part],recovery);if(typeof fallback==='string')el.textContent=t(key,{},fallback);}
 for(const el of root.querySelectorAll('header a[href="/world"],header a[href="/world/"]')){el.dataset.i18n='worldRecovery.nav';el.textContent=t('worldRecovery.nav',{},recovery.nav);}
 for(const el of root.querySelectorAll('[data-i18n-aria-label="worldRecovery.navigation"]'))el.setAttribute('aria-label',t('worldRecovery.navigation',{},recovery.navigation));
 if(getLocale()!=='zh-Hans')return;
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walk.nextNode())nodes.push(walk.currentNode);
 for(const node of nodes){if(node.parentElement?.closest('script,style,code,[data-source-original],input,textarea'))continue;let text=node.textContent;
 text=text.replace(/\bAsk PHI OS\b/g,t('worldRecovery.terms.ask',{},recovery.terms.ask));
 const terms={Atlas:t('worldRecovery.terms.Atlas',{},recovery.terms.Atlas),Runtime:t('worldRecovery.terms.Runtime',{},recovery.terms.Runtime),Reality:t('worldRecovery.terms.Reality',{},recovery.terms.Reality),World:t('worldRecovery.terms.World',{},recovery.terms.World)};
 for(const [term,translation] of Object.entries(terms))text=text.replace(new RegExp('\\b'+term+'\\b','g'),translation);
 if(text!==node.textContent)node.textContent=text;
 }
}
