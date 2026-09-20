import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectBaziVisualReport} from '../functions/personal-reading/bazi-visual-report-projection.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
import {reportCssErrors} from './lib/report-design-drift.mjs';
const fixtures=Object.fromEntries([4,5].map(n=>[n,JSON.parse(fs.readFileSync(`docs/guided-report-successor-r1/batch-${n}/cases.json`))]));
const project=(n,reading,locale='en',extra={})=>projectBaziVisualReport({reading,locale,depth:'PAID',reviewMode:true,batch:`BAZI-DYNAMIC-R1-BATCH-0${n}`,...extra});
for(const n of [4,5])for(const item of [fixtures[n],...Object.values(fixtures[n].caseVariants||{})])for(const locale of ['en','zh-Hans','bilingual']){
 const r=project(n,item.sourceReading,locale);assert.deepEqual(r,item.reports[locale]);assert.deepEqual(r.pages.map(p=>p.pageNumber),n===4?[20,21,22]:[23,24,25,26]);assert.ok(r.pages.every(p=>p.visualTemplateId===(n===4?'M07':'M08')));assert.equal(r.customerPublishable,false);assert.equal(r.checkoutEnabled,false);assert.equal(r.humanReview,'PENDING');
 assert.deepEqual(r.pages.map(p=>p.evidenceRefs),item.reports.en.pages.map(p=>p.evidenceRefs));
 const html=renderVisualReportPages(r);assert.ok(!/undefined|NaN|style=/.test(html));assert.equal((html.match(/data-page-number=/g)||[]).length,n===4?3:4);
 if(n===4){
  const tl=item.sourceReading.professionalModules.professionalTimeline;assert.deepEqual(r.pages[0].visual.bands.map(x=>[x.startAge,x.endAge,x.selected]),tl.daYunTimeline.map(x=>[x.startAge,x.endAge,x.isSelected]));assert.equal(r.pages[1].visual.selection.includes('2033'),tl.targetContext?.targetDate.startsWith('2033')||false);
  const reality=r.pages[2];assert.equal(reality.accessState,'DATA_REQUIRED');assert.equal(reality.visual.comparisonState,'NOT_COMPARED');assert.equal(reality.visual.counterEvidenceState,'NOT_SUPPLIED');assert.deepEqual(reality.visual.nodes.map(x=>x.id),['METHOD_PROJECTION','CURRENT_EVIDENCE','COUNTER_EVIDENCE','STATUS','WHY']);
  assert.ok(!/SPARKLINE|energyCurve|accuracyPercent/.test(JSON.stringify(r)));
 }else{assert.deepEqual(r.pages[0].visual.nodes.map(x=>x.id),['WHEN','OBSERVE','COUNTER_SIGNAL']);assert.deepEqual(r.pages[1].visual.nodes.map(x=>x.id),['OPPORTUNITY','CONDITION','RISK']);assert.deepEqual(r.pages[2].visual.nodes.map(x=>x.id),['NOTICE','COMPARE','TEST','REVIEW']);assert.equal(r.pages[3].visual.lineage[0].value,item.sourceReading.evidence.sourceNatalProjectionId);assert.equal(r.pages[3].visual.trace[1].value,item.sourceReading.professionalModules.customerSafeGraph.summary.sourceEvidenceCount);}
}
const noTarget=fixtures[4].reports.en;assert.equal(noTarget.pages[1].accessState,'DATA_REQUIRED');assert.equal(noTarget.pages[0].visual.bands.filter(x=>x.selected).length,0);
for(const key of ['transition','annualMissing','cycleMissing'])assert.equal(fixtures[4].caseVariants[key].reports.en.pages[1].accessState,'CONDITIONAL');
const bad=(n,mutate,rx=/BAZI_/)=>{const r=structuredClone(fixtures[n].sourceReading);mutate(r.professionalModules);assert.throws(()=>project(n,r),rx);};
bad(4,m=>m.professionalTimeline.daYunTimeline[0].startAge=20);bad(4,m=>m.professionalTimeline.daYunTimeline[0].isSelected=true);bad(4,m=>m.professionalTimeline.daYunTimeline[0].certainty='UNKNOWN');bad(4,m=>m.professionalTimeline.state='CURRENT_FROM_CLOCK');bad(4,m=>m.realityComparison.boundaries.customerResonanceIsEvidence=true);bad(4,m=>m.realityComparison.currentEvidence=[]);
bad(5,m=>m.realityBridge.topicPrompts=[]);bad(5,m=>m.realityBridge.boundaries.customerAnswerChangesMethodVerdict=true);bad(5,m=>m.customerSafeGraph.summary.sourceEvidenceCount=-1);
const selected=structuredClone(fixtures[4].caseVariants.selected.sourceReading);selected.professionalModules.professionalTimeline.targetContext.targetTime='';assert.throws(()=>project(4,selected),/TARGET_REQUIRED/);
for(const n of [4,5]){assert.throws(()=>project(n,fixtures[n].sourceReading,'en',{reviewMode:false}),/REVIEW_PAID_REQUIRED/);assert.throws(()=>project(n,fixtures[n].sourceReading,'en',{depth:'FREE'}),/REVIEW_PAID_REQUIRED/);}
// Data changes must propagate rather than render hard-coded benchmark values.
const changed=structuredClone(fixtures[5].sourceReading);changed.professionalModules.customerSafeGraph.summary.sourceEvidenceCount=21;assert.equal(project(5,changed).pages[3].visual.trace[1].value,21);
const css=fs.readFileSync('assets/customer-ui/surfaces/visual-report.css','utf8'),registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
assert.deepEqual(reportCssErrors(css.split('/* BAZI-DYNAMIC-R1-BATCH-04-05')[1].split('/* END BAZI-DYNAMIC-R1-BATCH-04-05 */')[0],registry),[]);
const baseline=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/batch-4/regression-baseline.json')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(hash(fs.readFileSync('assets/css/tokens.css')),baseline.tokensSha256);assert.equal(hash(css.split('/* BAZI-DYNAMIC-R1-BATCH-04-05')[0]),baseline.stylesheetSha256);
for(const n of [1,2,3]){const f=JSON.parse(fs.readFileSync(`docs/guided-report-successor-r1/batch-${n}/cases.json`));for(const locale of ['en','zh-Hans','bilingual'])assert.equal(hash(renderVisualReportPages(f.reports[locale])),baseline.batches[n][locale]);}
console.log('BaZi Batch 4/5 PASS: P20–P26, M07/M08, explicit/partial/missing timing, unfilled Reality boundary, source prompts and lineage; previous three batches unchanged.');
