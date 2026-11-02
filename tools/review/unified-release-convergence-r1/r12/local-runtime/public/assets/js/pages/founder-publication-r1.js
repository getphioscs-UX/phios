import {t,onLocaleChange,getLocale} from '../i18n.js';
import en from '../locales/en/public.js?v=founder-human-r2-20261010';
import zh from '../locales/zh-Hans/public.js?v=founder-human-r2-20261010';
// Use the same approved locale source as a fallback for cached older dictionaries.
function copy(key){
 const dictionary=getLocale()==='zh-Hans'?zh:en;
 const fallback=key.split('.').reduce((value,part)=>value?.[part],dictionary);
 const translated=t(key,{},typeof fallback==='string'?fallback:'');
 return translated===key&&typeof fallback==='string'?fallback:translated;
}
// Metadata follows the existing locale owner; no second translation runtime.
function update(){
 for(const node of document.querySelectorAll('main [data-i18n],.public-skip-link[data-i18n]'))node.textContent=copy(node.dataset.i18n);
 for(const node of document.querySelectorAll('main [data-i18n]'))node.hidden=node.textContent.trim()==='';
 for(const image of document.querySelectorAll('[data-i18n-alt]'))image.alt=copy(image.dataset.i18nAlt);
 for(const node of document.querySelectorAll('[data-i18n-aria-label]'))node.setAttribute('aria-label',copy(node.getAttribute('data-i18n-aria-label')));
 const title=copy('hpc2Destinations.founder.metaTitle');
 const description=copy('hpc2Destinations.founder.publication.metaDescription');
 document.title=title;
 for(const selector of ['meta[name="description"]','meta[property="og:description"]'])document.querySelector(selector)?.setAttribute('content',description);
 document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);
 document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content',copy('hpc2Destinations.founder.humanPresenceR2.portraitAlt'));
 const page=document.querySelector('[data-pis-schema]');if(page){const schema=JSON.parse(page.textContent);schema.name=title;schema.description=description;page.textContent=JSON.stringify(schema);}
}
onLocaleChange(update);update();

// A failed selected source hides its media; no alternate founder image is substituted.
for(const media of document.querySelectorAll('[data-founder-image-state]')){const image=media.querySelector('img');const fail=()=>{media.dataset.founderImageState='ASSET_UNAVAILABLE';media.closest('[data-founder-portrait-state]')?.setAttribute('data-founder-portrait-state','WAITING_FOR_R2_OBJECT');};image?.addEventListener('error',fail);if(image?.complete&&!image.naturalWidth)fail();}
