import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
const root='docs/guided-report-successor-r1/batch-6';
const read=n=>JSON.parse(fs.readFileSync(`${root}/${n}.json`));
const manifest=read('manifest'),findings=read('findings'),validation=read('validation'),browser=read('browser-evidence'),pdf=read('pdf-evidence');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const [path,hash] of Object.entries(manifest.sourceHashes))assert.equal(sha(fs.readFileSync(path)),hash,`Source changed: ${path}`);
for(const [path,hash] of Object.entries(validation.artifactHashes))assert.equal(sha(fs.readFileSync(`${root}/${path}`)),hash,`Artifact changed: ${path}`);
assert.equal(browser.machinePass,true);
assert.equal(findings.status,'VISUAL_PROMISE_MISMATCH');
assert.equal(findings.humanReview,'PENDING');
for(const r of [manifest,findings,validation,browser]){assert.equal(r.customerPublishable,false);assert.equal(r.successorBaselineActivated,false);}
assert.equal(findings.pages.length,78);
assert.equal(browser.variants.length,6);
assert.equal(pdf.length,3);
for(const locale of manifest.locales){
 assert.deepEqual(findings.pages.filter(p=>p.locale===locale).map(p=>p.pageNumber),Array.from({length:26},(_,i)=>i+1));
 assert.equal(pdf.find(p=>p.locale===locale).pages,26);
 for(const width of [1440,390]){const variant=browser.variants.find(v=>v.locale===locale&&v.width===width);assert.equal(variant.metrics.length,26);assert(variant.metrics.every(m=>m.designErrors.length===0));}
 const reports=[1,2,3,4,5].map(n=>JSON.parse(fs.readFileSync(`docs/guided-report-successor-r1/batch-${n}/cases.json`)).reports[locale]);
 assert.deepEqual(reports.map(r=>sha(renderVisualReportPages(r))),manifest.dynamicHtmlHashes[locale]);
 for(const report of reports){assert.equal(report.sourceReportRef,reports[0].sourceReportRef);assert.equal(report.sourceProjectionId,reports[0].sourceProjectionId);assert.equal(report.customerPublishable,false);assert.equal(report.reviewMode,true);}
}
console.log('PASS: Batch 6 review integrity, 78 locale/page records, 156 responsive captures, 78 A4 renders, source/renderer hashes, and non-acceptance gates. Visual mismatch remains open.');
