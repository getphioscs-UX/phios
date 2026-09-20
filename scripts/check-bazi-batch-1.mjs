import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectBaziVisualReport} from '../functions/personal-reading/bazi-visual-report-projection.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
import {reportCssErrors} from './lib/report-design-drift.mjs';
const fixture=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/batch-1/cases.json'));
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
const reading=fixture.sourceReading,options={reading,locale:'en',depth:'PAID',reviewMode:true,batch:'BAZI-DYNAMIC-R1-BATCH-01'};
const project=patch=>projectBaziVisualReport({...options,...patch});
for(const locale of ['en','zh-Hans','bilingual']){
 const r=project({locale});assert.deepEqual(r,fixture.reports[locale]);assert.deepEqual(r.pages.map(p=>p.pageNumber),[6,7,8,9,10]);assert.deepEqual(r.pages.map(p=>p.visualTemplateId),['M03','M04','M04','M05','M05']);
 assert.equal(r.customerPublishable,false);assert.equal(r.checkoutEnabled,false);assert.equal(r.pages[4].visual.edges.length,10);
 assert.deepEqual(r.pages[3].visual.nodes.map(n=>n.value),reading.professionalModules.fiveElements.items.map(n=>n.rawCount));
 assert.deepEqual(r.pages.map(p=>p.evidenceRefs),fixture.reports.en.pages.map(p=>p.evidenceRefs));
 for(const p of r.pages){assert.ok(p.insights.length<=3);assert.ok(p.visual.dataRefs.length);if(locale!=='bilingual')assert.equal(p.quality.densityState,'WITHIN_MAXIMUM');assert.ok(p.visual.pillars.every(n=>n.hiddenStems.trim()));}
 const html=renderVisualReportPages(r);assert.equal((html.match(/data-page-number=/g)||[]).length,5);assert.ok(!html.includes('undefined'));assert.ok(!html.includes('M03 Snapshot.webp'));assert.ok(!html.includes('style='));
}
assert.throws(()=>project({reviewMode:false}),/REVIEW_PAID_REQUIRED/);
assert.throws(()=>project({depth:'FREE'}),/REVIEW_PAID_REQUIRED/);
assert.throws(()=>project({locale:'xx'}),/LOCALE_UNSUPPORTED/);
assert.throws(()=>project({batch:'NEXT'}),/BATCH_UNKNOWN/);
assert.throws(()=>project({reading:{...reading,publicationDecision:{customerPublishable:false}}}),/ADMITTED_READING_REQUIRED/);
const missing=structuredClone(reading);missing.professionalModules.fiveElements.items.pop();assert.throws(()=>project({reading:missing}),/SOURCE_DATA_REQUIRED/);
const inconsistent=structuredClone(reading);inconsistent.professionalModules.fiveElements.items[0].rawCount++;assert.throws(()=>project({reading:inconsistent}),/INVENTORY_INCONSISTENT/);
// A changed upstream count propagates; the projection has no reference-art defaults.
const changed=structuredClone(reading);changed.professionalModules.fiveElements.items[0].rawCount++;changed.professionalModules.fiveElements.rawInventory.total++;changed.professionalModules.fiveElements.items[0].breakdown.visibleStems++;
assert.equal(project({reading:changed}).pages[3].visual.nodes[0].value,1);
const css=fs.readFileSync('assets/customer-ui/surfaces/visual-report.css','utf8').split('/* BAZI-DYNAMIC-R1-BATCH-01')[1].split('/* END BAZI-DYNAMIC-R1-BATCH-01 */')[0];assert.deepEqual(reportCssErrors(css,registry),[]);
assert.ok(JSON.parse(fs.readFileSync('package.json')).scripts.check.endsWith('npm run check:ptrc:w9-testamentary-report && npm run check:ptrc:w10-consolidation'));
console.log('BaZi Batch 1: five source-bound Page IR pages; locales, no defaults, review gate and frozen styling verified.');
