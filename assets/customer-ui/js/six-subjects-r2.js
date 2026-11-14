// Public presentation only. Never reads account, Profile or handoff storage.
function metadata(){const home=document.body.dataset.cxSurface==='HOME';const h=document.querySelector(home?'#cx-home-title':'.sow-eyebrow');const p=document.querySelector(home?'.r3-home-intro':'.sow-lede');if(h){document.title=h.textContent+' — PHI OS';document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);}if(p){document.querySelector('meta[name="description"]')?.setAttribute('content',p.textContent);document.querySelector('meta[property="og:description"]')?.setAttribute('content',p.textContent);}}
window.addEventListener('phios:localechange',event=>{metadata();const url=new URL(location.href);if(url.searchParams.has('locale')){url.searchParams.set('locale',event.detail.locale);history.replaceState(history.state,'',url);}});metadata();

// Presentation failure never removes the heading, navigation or real action.
for(const image of document.querySelectorAll('[data-subject-hero]')){
 const picture=image.closest('picture'),hero=image.closest('.sow-hero');
 const failed=()=>{picture.hidden=true;hero.dataset.heroState='failed';};
 image.addEventListener('error',failed);image.addEventListener('load',()=>{picture.hidden=false;hero.dataset.heroState='loaded';});
 if(image.complete){if(image.naturalWidth)hero.dataset.heroState='loaded';else failed();}
}

// Exact legacy Home fragments retain their semantic destination after R3.
// This presentation-only compatibility does not read or create user records.
const legacyHomeFragments=Object.freeze({'#start':'#six-perspectives','#flagship-experiences':'#six-perspectives','#world-knowledge':'#r3-continue','#human-services':'#r3-support','#continue':'#r3-continue'});
function resolveLegacyHomeFragment(){
 if(!['/','/index.html'].includes(location.pathname)||document.body.dataset.cxSurface!=='HOME'||!Object.hasOwn(legacyHomeFragments,location.hash))return;
 const target=legacyHomeFragments[location.hash],element=document.getElementById(target.slice(1));if(!element)return;
 history.replaceState(history.state,'',location.pathname+location.search+target);element.scrollIntoView();
}
window.addEventListener('hashchange',resolveLegacyHomeFragment);window.addEventListener('popstate',resolveLegacyHomeFragment);resolveLegacyHomeFragment();
