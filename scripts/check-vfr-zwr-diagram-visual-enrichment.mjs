import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_PAGE_PLAN} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';

assert.equal(ZWR_VFR_RENDERER_VERSION,'ZWR-VFR-R1-DEEP-RENDERER-v6');
assert.equal(ZWR_VFR_PAGE_PLAN.length,57,'current W9R4 publication should render 57 pages');

for(const id of ['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']){
 assert.equal(ZWR_VFR_PAGE_PLAN.filter(p=>p.sectionId===id&&p.pageFamily==='SECTION_MASTER').length,1,id+': exactly one chapter master required');
 assert.equal(ZWR_VFR_PAGE_PLAN.filter(p=>p.sectionId===id&&p.pageFamily==='READING_ZH').length,2,id+': exactly two Chinese reading pages required');
 assert.equal(ZWR_VFR_PAGE_PLAN.filter(p=>p.sectionId===id&&p.pageFamily==='READING_EN').length,1,id+': exactly one English reading page required');
}

const composites=ZWR_VFR_PAGE_PLAN.filter(p=>p.pageFamily==='DIAGRAM_COMPOSITE');
assert.equal(composites.length,4,'four related diagram pairs should share a page');
for(const p of composites)assert.equal(p.diagramIds.length,2,p.pageKey+': composite page requires two diagrams');

const renderer=fs.readFileSync('assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js','utf8');
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

const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');
for(const token of [
 '.zv-chapter-master',
 '.zv-language-reading',
 '.zv-axis-compact',
 '.zv-tx-focus',
 '.zv-ziwei-board',
 '.zv-star-atlas',
 '.zv-palace-orbit',
 '.zv-nav-wheel',
 'print-color-adjust:exact',
 'backdrop-filter:none!important',
 'filter:none!important'
])assert(builder.includes(token),'W9R4 publication style missing: '+token);

assert(!renderer.includes('<span>47</span>'),'closing page must not hardcode legacy page number');
assert(builder.includes("String(pagePlan.length)"),'review provenance must use dynamic page count');
assert(builder.includes("pagePlan.length+' rendered pages"),'build log must use dynamic page count');

console.log('PASS VFR-ZWR-9R4 publication redesign: 57-page language-sequential bilingual report; distinct chapter masters; two full-width Chinese pages and one full-width English page per section; four diagram-composite pages; compact Life-Body axis and sparse Four-Transformation focus renderer present.');
