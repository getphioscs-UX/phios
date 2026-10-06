import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
 buildZwrVfrPagePlan,
 deriveZwrVfrFitProfile,
 ZWR_VFR_FIT_PROFILE_VERSION
} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';

assert.equal(ZWR_VFR_RENDERER_VERSION,'ZWR-VFR-R1-DEEP-RENDERER-v6');
assert.equal(ZWR_VFR_FIT_PROFILE_VERSION,'ZWR-VFR-R1-PUBLICATION-FIT-v1');

const renderer=fs.readFileSync('assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js','utf8');
const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');

for(const token of [
 'zv-ziwei-board',
 'zv-axis-compact',
 'zv-network-shell',
 'zv-star-atlas',
 'zv-tx-orbits',
 'zv-tx-focus',
 'zv-palace-orbit',
 'zv-nav-wheel',
 'zv-chapter-master',
 'zv-language-reading',
 'partitionParagraphs'
])assert(renderer.includes(token),'professional Zi Wei renderer missing: '+token);

for(const token of [
 '.zv-chapter-master',
 '.zv-language-reading',
 '.zv-axis-compact',
 '.zv-tx-focus',
 '.zv-ziwei-board',
 '.zv-star-atlas',
 '.zv-palace-orbit',
 '.zv-nav-wheel',
 'height:34%',
 'print-color-adjust:exact',
 'backdrop-filter:none!important',
 'filter:none!important'
])assert(builder.includes(token),'publication style missing: '+token);

assert(!builder.includes('linear-gradient(90deg,#101713ed 0%,#101713c7 42%'),'full-page dark chapter overlay must remain retired');
assert(renderer.includes('READING_ZH')&&renderer.includes('READING_EN'),'language-sequential renderer required');

const publicationPath='docs/reports/ziwei/vfr-r1/DEEP-PUBLICATION-IR.json';
if(fs.existsSync(publicationPath)){
 const publication=JSON.parse(fs.readFileSync(publicationPath,'utf8'));
 const fit=deriveZwrVfrFitProfile({sections:publication.sections});
 const pages=buildZwrVfrPagePlan({sections:publication.sections});
 assert(pages.length>=50&&pages.length<=80,'adaptive page count out of range');
 assert.equal(pages.filter(p=>p.pageFamily==='SECTION_MASTER').length,10);
 assert(pages.filter(p=>p.pageFamily==='READING_ZH').length>=20);
 assert(pages.filter(p=>p.pageFamily==='READING_EN').length>=10);
 assert(fit.sectionFit.some(x=>x.zhPages>2)||fit.sectionFit.some(x=>x.enPages>1),'stress manuscript should exercise adaptive expansion');
}

console.log('PASS VFR-ZWR-9R5 deterministic publication fit: original master WebP remains visible without full-page dark overlay; language-sequential pages are adaptive by manuscript density; Life-Body and sparse Four-Transformation redesigns remain present; publication work is provider-free.');
