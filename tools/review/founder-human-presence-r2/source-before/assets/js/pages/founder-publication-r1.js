import {t,onLocaleChange,getLocale} from '../i18n.js';
import en from '../locales/en/public.js?v=founder-copy-20261010';
import zh from '../locales/zh-Hans/public.js?v=founder-copy-20261010';
// Use the same approved locale source as a fallback for cached older dictionaries.
function copy(key){
 const dictionary=getLocale()==='zh-Hans'?zh:en;
 const fallback=key.split('.').reduce((value,part)=>value?.[part],dictionary);
 const translated=t(key,{},typeof fallback==='string'?fallback:'');
 return translated===key&&typeof fallback==='string'?fallback:translated;
}
// Metadata follows the existing locale owner; no second translation runtime.
function update(){
 for(const node of document.querySelectorAll('main [data-i18n]'))node.textContent=copy(node.dataset.i18n);
 for(const node of document.querySelectorAll('main [data-i18n]'))node.hidden=node.textContent.trim()==='';
 for(const image of document.querySelectorAll('[data-i18n-alt]'))image.alt=copy(image.dataset.i18nAlt);
 const title=copy('hpc2Destinations.founder.metaTitle');
 const description=copy('hpc2Destinations.founder.publication.metaDescription');
 document.title=title;
 for(const selector of ['meta[name="description"]','meta[property="og:description"]'])document.querySelector(selector)?.setAttribute('content',description);
 document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);
 const page=document.querySelector('[data-pis-schema]');if(page){const schema=JSON.parse(page.textContent);schema.name=title;schema.description=description;page.textContent=JSON.stringify(schema);}
}
onLocaleChange(update);update();
