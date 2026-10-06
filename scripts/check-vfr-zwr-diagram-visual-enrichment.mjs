import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_PAGE_PLAN} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';

assert.equal(ZWR_VFR_RENDERER_VERSION,'ZWR-VFR-R1-DEEP-RENDERER-v3');
assert(ZWR_VFR_PAGE_PLAN.length>=48&&ZWR_VFR_PAGE_PLAN.length<=60,'bilingual page plan must allow spacious 48-60 pages');
assert.equal(ZWR_VFR_PAGE_PLAN.length,51,'current W9R2 review plan should be 51 pages');

for(const id of ['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']){
 assert.equal(ZWR_VFR_PAGE_PLAN.filter(p=>p.sectionId===id&&p.pageFamily==='READING').length,2,id+': must have two reading pages');
}

const renderer=fs.readFileSync('assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js','utf8');
for(const token of [
 'zv-ziwei-board',
 'zv-axis-map',
 'zv-network-shell',
 'zv-star-atlas',
 'zv-tx-orbits',
 'zv-palace-orbit',
 'zv-nav-wheel'
])assert(renderer.includes(token),'professional diagram renderer missing: '+token);

const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');
for(const token of [
 '.zv-ziwei-board',
 '.zv-axis-map',
 '.zv-star-atlas',
 '.zv-tx-orbits',
 '.zv-palace-orbit',
 '.zv-nav-wheel'
])assert(builder.includes(token),'professional diagram style missing: '+token);

assert(!renderer.includes('<span>47</span>'),'closing page must not hardcode legacy page number');
assert(builder.includes("pagePlan.length+' pages"),'review provenance must use dynamic page count');
assert(builder.includes("pagePlan.length+' rendered pages"),'build log must use dynamic page count');

console.log('PASS VFR-ZWR-9R2 diagram visual enrichment: 51-page spacious bilingual plan; two reading pages per section; professional Zi Wei palace board, Life-Body axis, star atlas, transformation tracks, palace orbit and navigation wheel present; legacy 47-page hard limit removed.');
