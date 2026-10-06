import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_PAGE_PLAN} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';

assert.equal(ZWR_VFR_RENDERER_VERSION,'ZWR-VFR-R1-DEEP-RENDERER-v5');
assert(ZWR_VFR_PAGE_PLAN.length>=48&&ZWR_VFR_PAGE_PLAN.length<=60,'bilingual page plan must allow spacious 48-60 pages');
assert.equal(ZWR_VFR_PAGE_PLAN.length,50,'current W9R3 review plan should be 50 pages');

for(const id of ['S02','S04','S05']){
 assert.equal(ZWR_VFR_PAGE_PLAN.filter(p=>p.sectionId===id&&p.pageFamily==='READING').length,3,id+': overflow-prone section must have three reading pages');
}
for(const id of ['S03','S06','S07','S08','S09','S10','S11']){
 assert.equal(ZWR_VFR_PAGE_PLAN.filter(p=>p.sectionId===id&&p.pageFamily==='READING').length,2,id+': section must have two reading pages');
}

const composites=ZWR_VFR_PAGE_PLAN.filter(p=>p.pageFamily==='DIAGRAM_COMPOSITE');
assert.equal(composites.length,4,'W9R3 should have four shared diagram pages');
for(const p of composites)assert.equal(p.diagramIds.length,2,p.pageKey+': composite page requires two diagrams');

const renderer=fs.readFileSync('assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js','utf8');
for(const token of [
 'zv-ziwei-board',
 'zv-axis-map',
 'zv-network-shell',
 'zv-star-atlas',
 'zv-tx-orbits',
 'zv-palace-orbit',
 'zv-nav-wheel',
 'partitionParagraphs',
 'zv-diagram-composite',
 "ctx.compact?' is-compact'"
])assert(renderer.includes(token),'adaptive/professional renderer missing: '+token);

const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');
for(const token of [
 '.zv-ziwei-board',
 '.zv-axis-map',
 '.zv-star-atlas',
 '.zv-tx-orbits',
 '.zv-palace-orbit',
 '.zv-nav-wheel',
 '.zv-diagram-composite',
 'print-color-adjust:exact',
 'backdrop-filter:none!important',
 'filter:none!important'
])assert(builder.includes(token),'W9R3 publication style missing: '+token);

assert(!renderer.includes('<span>47</span>'),'closing page must not hardcode legacy page number');
for(const id of ['S07','S08','S09','S10','S11'])assert(renderer.includes("'"+id+"'"),id+': stacked bilingual section registration missing');
assert(renderer.includes("is-stacked"),'stacked bilingual reading renderer missing');
assert(builder.includes('.zv-reading-grid.is-stacked'),'stacked bilingual reading styles missing');
assert(builder.includes("String(pagePlan.length)"),'review provenance must use dynamic page count');
assert(builder.includes("pagePlan.length+' rendered pages"),'build log must use dynamic page count');

console.log('PASS VFR-ZWR-9R3 adaptive composition: 50-page bilingual plan; overflow-prone S02/S04/S05 receive three reading pages; four related diagram pairs share pages; weighted paragraph partitioning present; professional Zi Wei visual language preserved; print effects optimized.');
