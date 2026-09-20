import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectBaziVisualReport} from '../functions/personal-reading/bazi-visual-report-projection.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
import {reportCssErrors} from './lib/report-design-drift.mjs';
const root='docs/guided-report-successor-r1/batch-2',fixture=JSON.parse(fs.readFileSync(`${root}/cases.json`)),reading=fixture.sourceReading;
const options={reading,locale:'en',depth:'PAID',reviewMode:true,batch:'BAZI-DYNAMIC-R1-BATCH-02'},project=patch=>projectBaziVisualReport({...options,...patch});
for(const locale of ['en','zh-Hans','bilingual']){
 const r=project({locale});assert.deepEqual(r,fixture.reports[locale]);assert.deepEqual(r.pages.map(p=>p.pageNumber),[11,12,13,14,15]);assert.deepEqual(r.pages.map(p=>p.visualTemplateId),['M05','M04','M04','M04','M04']);
 assert.equal(r.customerPublishable,false);assert.equal(r.checkoutEnabled,false);assert.deepEqual(r.pages.map(p=>p.evidenceRefs),fixture.reports.en.pages.map(p=>p.evidenceRefs));
 assert.deepEqual(r.pages[0].visual.nodes.map(n=>n.value),[reading.professionalModules.dayMasterStrength.supportBalance.supportVisible,reading.professionalModules.dayMasterStrength.supportBalance.outwardVisible,reading.professionalModules.dayMasterStrength.supportBalance.pressureVisible]);
 assert.equal(r.pages[1].visual.nodes[0].id,'PRIMARY_OPEN');assert.deepEqual(r.pages[1].visual.candidates.map(c=>c.id),reading.professionalModules.pattern.summary.readingOrder);assert.equal(r.pages[4].visual.frictionCount,3);
 for(const p of r.pages){assert.ok(p.insights.length<=3);assert.ok(p.visual.nodes.every(n=>n.sourceRefs.length));if(locale!=='bilingual')assert.equal(p.quality.densityState,'WITHIN_MAXIMUM');}
 const html=renderVisualReportPages(r);assert.equal((html.match(/data-page-number=/g)||[]).length,5);assert.ok(!/undefined|NaN|style=/.test(html));assert.ok(!html.includes('data-page-number="16"'));
}
assert.throws(()=>project({reviewMode:false}),/REVIEW_PAID_REQUIRED/);assert.throws(()=>project({depth:'FREE'}),/REVIEW_PAID_REQUIRED/);
const bad=structuredClone(reading);delete bad.professionalModules.dayMasterStrength.supportBalance;assert.throws(()=>project({reading:bad}),/SOURCE_REQUIRED/);
const confirmed=structuredClone(reading);confirmed.professionalModules.pattern.summary.primaryPatternEstablished=true;assert.throws(()=>project({reading:confirmed}),/VERDICT_CONTRACT_UNSUPPORTED/);
const unsupported=structuredClone(reading);unsupported.professionalModules.pattern.candidates[0].professionalReading.formation.paths[0].state='UNRECOGNIZED';assert.throws(()=>project({reading:unsupported}),/PATH_STATE_UNSUPPORTED/);
const changed=structuredClone(reading);changed.professionalModules.dayMasterStrength.supportBalance.pressureVisible=5;assert.equal(project({reading:changed}).pages[0].visual.nodes[2].value,5);
const empty=structuredClone(reading);empty.professionalModules.pattern.candidates=[];empty.professionalModules.pattern.summary.candidateCount=0;empty.professionalModules.pattern.summary.readingOrder=[];empty.professionalModules.relationships.items=[];const emptyReport=project({reading:empty});assert.equal(emptyReport.pages[4].visual.frictionCount,0);assert.ok(renderVisualReportPages(emptyReport).includes('No candidates recorded.'));
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
const css=fs.readFileSync('assets/customer-ui/surfaces/visual-report.css','utf8'),batchCss=css.split('/* BAZI-DYNAMIC-R1-BATCH-02')[1].split('/* END BAZI-DYNAMIC-R1-BATCH-02 */')[0];assert.deepEqual(reportCssErrors(batchCss,registry),[]);
const baseline=JSON.parse(fs.readFileSync(`${root}/batch-1-regression-baseline.json`)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
assert.equal(hash(fs.readFileSync('assets/css/tokens.css')),baseline.tokensSha256);
assert.equal(hash(css.slice(0,css.indexOf('/* BAZI-DYNAMIC-R1-BATCH-02'))),baseline.stylesheetSha256);
const prior=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/batch-1/cases.json'));
for(const locale of ['en','zh-Hans','bilingual'])assert.equal(hash(renderVisualReportPages(prior.reports[locale])),baseline.htmlSha256[locale]);
console.log('BaZi Batch 2 PASS: P11–P15, three locales, source counts, open verdicts, fail-closed states; Batch 1 HTML/styles/tokens unchanged.');
