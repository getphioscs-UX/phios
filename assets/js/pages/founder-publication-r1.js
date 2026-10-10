import {t,onLocaleChange} from '../i18n.js';
// Metadata follows the existing locale owner; no second translation runtime.
function update(){
 for(const node of document.querySelectorAll('main [data-i18n]'))node.hidden=node.textContent.trim()==='';
 for(const image of document.querySelectorAll('[data-i18n-alt]'))image.alt=t(image.dataset.i18nAlt);
 const title=t('hpc2Destinations.founder.metaTitle');
 const description=t('hpc2Destinations.founder.publication.metaDescription');
 document.title=title;
 for(const selector of ['meta[name="description"]','meta[property="og:description"]'])document.querySelector(selector)?.setAttribute('content',description);
 document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);
 const page=document.querySelector('[data-pis-schema]');if(page){const schema=JSON.parse(page.textContent);schema.name=title;schema.description=description;page.textContent=JSON.stringify(schema);}
}
onLocaleChange(update);update();
