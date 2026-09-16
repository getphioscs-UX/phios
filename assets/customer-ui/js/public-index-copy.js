// A presentation-only locale bridge for editorial additions on both existing shells.
// It does not set language, replace either locale authority, or touch page forms.
import {hydrateUnifiedPublicVisuals} from '../../js/public-v2/unified-public-visual-resolver.js';
function apply(){
 const zh=document.documentElement.lang.toLowerCase().startsWith('zh');
 document.querySelectorAll('[data-pis-copy]').forEach(node=>{
   node.textContent=node.getAttribute(zh?'data-cx-zh':'data-cx-en')||'';
 });
 document.querySelectorAll('[data-pis-aria]').forEach(node=>{
   node.setAttribute('aria-label',node.getAttribute(zh?'data-cx-zh-aria-label':'data-cx-en-aria-label'));
 });
 document.querySelectorAll('[data-pis-locale]').forEach(node=>{node.hidden=node.dataset.pisLocale!==(zh?'zh-Hans':'en');});
}
apply();
new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const heroCode=document.body.dataset.pisHero;
if(heroCode){
 const heading=document.querySelector('main h1');
 const target=heading?.parentElement;
 if(target&&!target.querySelector('form')){
  target.classList.add('pis-landing-hero');
  const image=document.createElement('img');image.dataset.px2Asset=heroCode;
  image.className='pis-landing-hero__image';image.alt='';image.setAttribute('aria-hidden','true');
  image.loading='eager';image.fetchPriority='high';target.prepend(image);
  const section=target.closest('section');
  // The hero has one illustration; do not display the previous boxed duplicate.
  section?.querySelectorAll('.cx-knowledge-hero__visual,.cx-explore-hero__visual').forEach(node=>{node.hidden=true;});
 }
}
hydrateUnifiedPublicVisuals(document).catch(()=>{});
