// H01 owns exactly one picture. No mounting, no customer state, no new resolver.
import {resolveApprovedVisual} from '../../js/runtime/web-production/asset-resolver.js';
const image=document.querySelector('[data-home-hero]');
if(image){
 const hero=image.closest('section'),picture=image.closest('picture'),source=picture.querySelector('source');
 const sync=()=>{const ok=image.complete&&image.naturalWidth>0;image.hidden=!ok;hero.dataset.homeHeroState=ok?'loaded':'unavailable';};
 image.addEventListener('load',sync);image.addEventListener('error',sync);window.addEventListener('pageshow',sync);
 if(image.complete)sync();
 // Static verified URLs provide progressive rendering; the existing unified
 // resolver verifies the same exact approved identities, never a substitute.
 Promise.all(['PHIOS-HERO-HOMEPAGE-D-v1','PHIOS-HERO-HOMEPAGE-M-v1'].map(id=>resolveApprovedVisual(id,{surface:'HOME_H01'}))).then(([d,m])=>{
  if(image.getAttribute('src')!==d.src||source.getAttribute('srcset')!==m.src){image.hidden=true;hero.dataset.homeHeroState='mapping-conflict';}
 }).catch(()=>{hero.dataset.homeHeroResolution='unavailable';});
}
