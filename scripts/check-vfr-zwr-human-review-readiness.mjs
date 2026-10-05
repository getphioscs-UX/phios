import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_ONE_CALL_COMPOSER_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js';

const htmlPath='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html';
const livePath='docs/reports/ziwei/vfr-r1/LIVE-RESULT.json';
assert(fs.existsSync(htmlPath),'ZWR VFR human review HTML missing');
assert(fs.existsSync(livePath),'ZWR VFR live result missing');
const html=fs.readFileSync(htmlPath,'utf8');
const live=JSON.parse(fs.readFileSync(livePath,'utf8'));

assert.equal(live.schemaVersion,ZWR_VFR_ONE_CALL_COMPOSER_VERSION,'W9 review is using a stale Sol candidate; regenerate W8 with the current semantic contract');
assert.equal((html.match(/class="zv-page/g)||[]).length,47,'human review must render 47 pages');
assert(!html.includes('<pre>'),'human review must not expose raw diagram JSON placeholders');
for(let i=1;i<=15;i++){
 const id='ZWD-'+String(i).padStart(2,'0');
 assert(html.includes('data-diagram-id="'+id+'"'),'missing rendered diagram '+id);
}
assert((html.match(/<svg class="zv-svg"/g)||[]).length>=1,'at least one real SVG diagram required');
assert(html.includes('中文解读'),'Chinese review copy missing');
assert(html.includes('English Reading'),'English review copy missing');
assert(!/class=["'][^"']*\bzv-empty\b[^"']*["']/.test(html),'missing deterministic diagram renderer remains');
assert(html.includes('W8 live PASS'),'W8 provenance banner missing');
assert(html.includes('0 semantic review'),'semantic-review-free provenance missing');

for(const asset of [
 'RPT-ZIWEI-P01-COVER-v1.webp',
 'RPT-ZIWEI-P02-METHOD-INTRO-v1.webp',
 'RPT-ZIWEI-P03-ORIGIN-v1.webp',
 'RPT-ZIWEI-P04-PHIOS-LENS-v1.webp',
 'RPT-ZIWEI-P05-HOW-TO-READ-v1.webp',
 'VIS-REPORT-ZIWEI-BODY.webp',
 'VIS-REPORT-ZIWEI-MOTIF-1.svg',
 'VIS-REPORT-ZIWEI-MOTIF-2.svg',
 'VIS-REPORT-ZIWEI-SEC-01-PALACE-ARCHITECTURE.webp',
 'VIS-REPORT-ZIWEI-SEC-02-PATTERN-RESOURCES.webp',
 'VIS-REPORT-ZIWEI-SEC-03-SELF-DEVELOPMENT.webp',
 'VIS-REPORT-ZIWEI-SEC-04-RELATIONSHIP-PARTNERSHIP.webp',
 'VIS-REPORT-ZIWEI-SEC-05-FAMILY-CLOSE-RELATIONSHIPS.webp',
 'VIS-REPORT-ZIWEI-SEC-06-CAREER-SOCIAL.webp',
 'VIS-REPORT-ZIWEI-SEC-07-RESOURCES-WEALTH.webp',
 'VIS-REPORT-ZIWEI-SEC-08-MOVEMENT-ENVIRONMENT.webp',
 'VIS-REPORT-ZIWEI-SEC-09-TIMING-NAVIGATION.webp',
 'VIS-REPORT-ZIWEI-SEC-10-EVIDENCE-BOUNDARY.webp'
])assert(html.includes(asset),'missing Zi Wei visual asset binding: '+asset);

for(const leak of ['entityId','ZWR:TIMING_LAYER','Authoring Pack','semantic verifier','authorityRefs'])assert(!html.includes(leak),'internal term leaked into review HTML: '+leak);
assert(!html.includes('&lt;small&gt;'),'escaped HTML label leaked into customer review');
assert(!/>ZWD-\d\d</.test(html),'internal diagram id must not be customer-visible');
assert(html.includes('十二宫本命结构'),'page 6 must use the current canonical natal palace overview');
assert(html.includes('读取边界')&&html.includes('Reading Boundary'),'closing boundary page missing');
assert(html.includes('data-focus-layer="DA_XIAN"'),'S09 must visually emphasize Da Xian');
assert(html.includes('data-focus-layer="LIU_NIAN"'),'S10 must visually emphasize Liu Nian');
for(const projection of ['S02_NETWORK','S06_RECIPROCITY_BOUNDARY','S07_RESPONSIBILITY','S04_TIMING','S09_NATAL_DAXIAN','S10_TRANSFORMATION_TIMING'])assert(html.includes('data-projection="'+projection+'"'),'section-scoped diagram projection missing: '+projection);

const sentenceEnd=/[。！？.!?][”’"'\)]?$/u;
const fragment=/\b(?:andf|requiresf|responsivenessf|anotherf|distancef)\b|\brecipro$|\bhidden$|\bor$/iu;
for(const section of live.reportIr?.sections||[]){
 for(const [locale,copy] of [['zhHans',section.zhHans],['en',section.en]]){
  assert.equal(copy?.keyInsights?.length,3,section.sectionId+':'+locale+': expected 3 projected insights');
  assert.equal(copy?.interpretation?.length,2,section.sectionId+':'+locale+': expected 2 projected interpretation paragraphs');
  for(const insight of copy.keyInsights){
   const t=String(insight?.text||'').trim();
   assert(t.length>12,section.sectionId+':'+locale+': insight too short');
   assert(sentenceEnd.test(t),section.sectionId+':'+locale+': clipped insight sentence: '+t.slice(-40));
   assert(!fragment.test(t),section.sectionId+':'+locale+': fragment marker detected');
  }
  for(const p of copy.interpretation){
   const t=String(p||'').trim();
   assert(sentenceEnd.test(t),section.sectionId+':'+locale+': clipped interpretation: '+t.slice(-40));
   assert(!fragment.test(t),section.sectionId+':'+locale+': fragment marker detected');
  }
 }
}
const allZh=(live.reportIr?.sections||[]).flatMap(s=>s.zhHans?.interpretation||[]).join('\n');
const allEn=(live.reportIr?.sections||[]).flatMap(s=>s.en?.interpretation||[]).join('\n');
assert((allZh.match(/复盘/g)||[]).length<=3,'navigation language is too template-like: 复盘 repeated too often');
assert((allEn.match(/review date/gi)||[]).length<=3,'navigation language is too template-like: review date repeated too often');

console.log('PASS ZWR-VFR W9 human-review readiness: current Sol candidate; 47 pages; all 15 diagrams rendered with section projections; all five front-matter and ten section assets bound; no raw JSON/internal ids/escaped labels; S09/S10 timing differentiated; bilingual copy complete enough for human review.');
