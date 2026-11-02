import {renderBaziProduct} from '../specialists/bazi/product-renderer.js';
import {fitPublicationForPrint} from './publication-report-pages.js';
const entry=document.querySelector('script[data-mode]'),mode=entry.dataset.mode,locale=entry.dataset.locale||new URLSearchParams(location.search).get('locale')||'en';
document.documentElement.lang=locale;
const product=await(await fetch(`/docs/guided-report-successor-r2/visual-commerce/${mode}-${locale}.json`)).json();
const root=document.querySelector('#report'),plan=renderBaziProduct({product,mount:{host:root}});
root.innerHTML=plan.readingHtml;
await plan.afterMount({host:root,reading:root});
await document.fonts.ready;window.fitPublication=()=>fitPublicationForPrint(root);window.batchReady=true;
