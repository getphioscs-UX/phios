import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
const hash=x=>createHash('sha256').update(x).digest('hex');
export function checkZiweiNarrowRepair(){
 const path='docs/reports/ziwei/full-report-r2/narrow-repair-baseline.json';
 if(!fs.existsSync(path))return null;
 const baseline=JSON.parse(fs.readFileSync(path));
 for(const [p,h] of Object.entries(baseline.files))assert.equal(hash(fs.readFileSync(p)),h,'Narrow repair changed frozen input: '+p);
 const artifacts=[];
 for(const a of baseline.artifacts){
  const html=fs.readFileSync(a.path,'utf8'),main=html.match(/<main>([\s\S]*?)<\/main>/)[1];
  const nav=/<section\b[^>]*data-page-key="ZWR:S11:NAVIGATION"[\s\S]*?<\/footer><\/section>/;
  assert.equal(hash(main.replace(nav,'')),a.unchangedPagesDigest,'A page outside S11 changed');
  const {document}=parseHTML(html),page=document.querySelector('[data-page-key="ZWR:S11:NAVIGATION"]');
  const r=JSON.parse(fs.readFileSync(a.evidencePath)),zh=r.snapshot.locale==='zh-Hans';
  assert.deepEqual([...page.querySelectorAll('[data-source-block]')].map(p=>p.textContent),r.sections.find(s=>s.sectionId==='S11').paragraphs,'Accepted S11 prose changed');
  assert.deepEqual([...page.querySelectorAll('.zwr-navigation-item h3')].map(x=>x.textContent),zh?['需要保护什么','可以改变什么','哪些承诺不宜扩大','现在观察什么','哪些证据会修正这份读取']:['WHAT TO PROTECT','WHAT TO CHANGE','WHAT NOT TO OVER-COMMIT','WHAT TO OBSERVE NOW','WHAT EVIDENCE WOULD REVISE THIS READING']);
  assert.equal(page.querySelectorAll('.zwr-next-review').length,1);
  assert.equal(page.querySelectorAll('.zwr-next-review li').length,5);
  assert.equal(page.querySelector('.zwr-next-review').dataset.reviewPurpose,'OBSERVATION_ONLY');
  assert(page.textContent.includes('30–90'));
  assert(page.textContent.includes(zh?'不是星象事件时间':'not astrological event timing'));
  artifacts.push({path:a.path,sha256:hash(html),unchanged32Pages:'PASS',acceptedS11Blocks:'UNCHANGED',headings:5,actionPrompts:5});
 }
 return {workId:'ZWR-R2-F1-F5',status:'PASS',frozenClaimsAndIr:'UNCHANGED',visualSystem:'UNCHANGED',sharedRenderer:'UNCHANGED',artifacts};
}
