import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectBaziVisualReport} from '../functions/personal-reading/bazi-visual-report-projection.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
import {reportCssErrors} from './lib/report-design-drift.mjs';
const root='docs/guided-report-successor-r1/batch-3',fixture=JSON.parse(fs.readFileSync(`${root}/cases.json`)),reading=fixture.sourceReading;
const options={reading,locale:'en',depth:'PAID',reviewMode:true,batch:'BAZI-DYNAMIC-R1-BATCH-03'},project=patch=>projectBaziVisualReport({...options,...patch});
const codes=['LIFE_OPERATION','RELATIONSHIPS','CAREER','WEALTH'];
for(const locale of ['en','zh-Hans','bilingual']){
 const r=project({locale});assert.deepEqual(r,fixture.reports[locale]);assert.deepEqual(r.pages.map(p=>p.pageNumber),[16,17,18,19]);assert.ok(r.pages.every(p=>p.visualTemplateId==='M06'));
 assert.equal(r.customerPublishable,false);assert.equal(r.checkoutEnabled,false);assert.equal(r.humanReview,'PENDING');assert.deepEqual(r.pages.map(p=>p.evidenceRefs),fixture.reports.en.pages.map(p=>p.evidenceRefs));
 for(const [i,p] of r.pages.entries()){
  const topic=reading.professionalModules.professionalTopics.topics.find(t=>t.topicCode===codes[i]),narrative=reading.professionalModules.customerNarrative.topicNarratives.find(t=>t.topicCode===codes[i]);
  assert.equal(p.visual.topicCode,codes[i]);assert.deepEqual(p.visual.nodes.map(n=>[n.id,n.value]),topic.relevantGroups.map(g=>[g.groupCode,g.count]));
  assert.equal(p.visual.nodes.find(n=>n.lead).id,topic.leadGroup.groupCode);
  assert.deepEqual(p.visual.themes.map(n=>n.value),[topic.patternCandidates.length,topic.relationshipInterfaces.length,topic.priorityRefs.length]);
  assert.deepEqual(p.insights.map(x=>x.text),['lead','condition'].map(k=>locale==='bilingual'?`${narrative[k].zhHans} / ${narrative[k].en}`:narrative[k][locale==='en'?'en':'zhHans']));
  assert.ok(p.visual.nodes.every(n=>n.sourceRefs.length));assert.equal(p.insights.length,2);
 }
 const html=renderVisualReportPages(r);assert.equal((html.match(/data-page-number=/g)||[]).length,4);assert.equal((html.match(/data-part="domain-main"/g)||[]).length,4);assert.ok(!/undefined|NaN|style=/.test(html));assert.ok(!html.includes('data-page-number="20"'));
}
assert.throws(()=>project({reviewMode:false}),/REVIEW_PAID_REQUIRED/);assert.throws(()=>project({depth:'FREE'}),/REVIEW_PAID_REQUIRED/);
const mutate=fn=>{const copy=structuredClone(reading);fn(copy.professionalModules);return copy;};
for(const change of [m=>m.professionalTopics.topics.pop(),m=>m.professionalTopics.topics.push(m.professionalTopics.topics[0]),m=>m.professionalTopics.topics[0].relevantGroups[0].count=-1,m=>m.professionalTopics.topics[0].leadGroup.groupCode='UNKNOWN',m=>m.customerNarrative.topicNarratives[0].condition.en='',m=>m.professionalTopics.topics[0].state='PREDICTED'])assert.throws(()=>project({reading:mutate(change)}),/TOPIC_CONTRACT_REQUIRED/);
assert.throws(()=>project({reading:mutate(m=>m.professionalTopics.topics[0].boundaries.topicIsCompositionNotPrediction=false)}),/BOUNDARIES_REQUIRED/);
// The wealth owner's selected lead is WEALTH, even when OFFICER has more occurrences.
assert.equal(project({}).pages[3].visual.nodes.find(n=>n.lead).id,'WEALTH');
const changed=project({reading:mutate(m=>{m.professionalTopics.topics[1].relevantGroups[0].count=4;m.professionalTopics.topics[1].leadGroup.count=4;})});assert.equal(changed.pages[3].visual.nodes[0].value,4);
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json')),css=fs.readFileSync('assets/customer-ui/surfaces/visual-report.css','utf8');
assert.deepEqual(reportCssErrors(css.split('/* BAZI-DYNAMIC-R1-BATCH-03')[1].split('/* END BAZI-DYNAMIC-R1-BATCH-03 */')[0],registry),[]);
const baseline=JSON.parse(fs.readFileSync(`${root}/regression-baseline.json`)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
assert.equal(hash(fs.readFileSync('assets/css/tokens.css')),baseline.tokensSha256);assert.equal(hash(css.slice(0,css.indexOf('/* BAZI-DYNAMIC-R1-BATCH-03'))),baseline.stylesheetSha256);
for(const batch of [1,2]){const prior=JSON.parse(fs.readFileSync(`docs/guided-report-successor-r1/batch-${batch}/cases.json`));for(const locale of ['en','zh-Hans','bilingual'])assert.equal(hash(renderVisualReportPages(prior.reports[locale])),baseline.batches[batch][locale]);}
console.log('BaZi Batch 3 PASS: P16–P19, shared M06, three locales, source-selected leads and approved narratives, fail-closed contracts; Batch 1/2 HTML/styles/tokens unchanged.');
