import {getLocale,t} from '../../i18n.js';
// Presentation-only terminology from the same active dictionary as data-i18n.
// Canonical source text, technical details and user-entered source text are preserved.
export function localizeWorldCopy(root){
 if(getLocale()!=='zh-Hans'||!root)return;
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walk.nextNode())nodes.push(walk.currentNode);
 for(const node of nodes){if(node.parentElement?.closest('script,style,code,[data-source-original],input,textarea'))continue;let text=node.textContent;
 text=text.replace(/\bAsk PHI OS\b/g,t('worldRecovery.terms.ask'));
 const terms={Atlas:t('worldRecovery.terms.Atlas'),Runtime:t('worldRecovery.terms.Runtime'),Reality:t('worldRecovery.terms.Reality'),World:t('worldRecovery.terms.World')};
 for(const [term,translation] of Object.entries(terms))text=text.replace(new RegExp('\\b'+term+'\\b','g'),translation);
 if(text!==node.textContent)node.textContent=text;
 }
}
