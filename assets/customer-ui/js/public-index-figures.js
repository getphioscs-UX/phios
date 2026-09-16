import {hydrateUnifiedPublicVisuals} from '../../js/public-v2/unified-public-visual-resolver.js';
// Existing visual authority resolves the source. Opening an image is read-only.
for(const root of document.querySelectorAll('[data-pis-context-figures]')){
 hydrateUnifiedPublicVisuals(root).then(()=>{
  for(const link of root.querySelectorAll('[data-pis-figure-link]')){
   const image=link.querySelector('img');if(image.dataset.assetStatus!=='ready'||!image.src)continue;
   link.href=image.src;link.setAttribute('aria-label',link.closest('figure').querySelector('figcaption').textContent);
  }
 }).catch(()=>{});
 const update=()=>root.querySelectorAll('[data-pis-figure-link][href]').forEach(link=>link.setAttribute('aria-label',link.closest('figure').querySelector('figcaption').textContent));
 new MutationObserver(()=>queueMicrotask(update)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
