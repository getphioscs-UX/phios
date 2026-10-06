import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_DEEP_PUBLICATION_IR_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-deep-publication.js';

const root='docs/reports/ziwei/vfr-r1/';
const htmlPath='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html';
const publicationPath=root+'DEEP-PUBLICATION-IR.json';
const repairedPath=root+'five-call-experiment/REPAIRED-RESULT.json';
const cachePath=root+'DEEP-RENDER-CACHE.json';

for(const p of [htmlPath,publicationPath,repairedPath,cachePath])assert(fs.existsSync(p),'ZWR VFR W9 artifact missing: '+p);
const html=fs.readFileSync(htmlPath,'utf8');
const publication=JSON.parse(fs.readFileSync(publicationPath,'utf8'));
const repaired=JSON.parse(fs.readFileSync(repairedPath,'utf8'));
const cache=JSON.parse(fs.readFileSync(cachePath,'utf8'));

assert.equal(publication.schemaVersion,ZWR_VFR_DEEP_PUBLICATION_IR_VERSION);
assert.equal(publication.sourceResultDigest,repaired.resultDigest);
assert.equal(publication.authorityDigest,repaired.authorityDigest);
assert.equal(cache.repairedResultDigest,repaired.resultDigest);
assert.equal(cache.publicationIrDigest,publication.publicationIrDigest);
assert.equal(cache.providerCallsDuringRerender,0);

const renderedPages=(html.match(/class="zv-page/g)||[]).length;
assert(renderedPages>=48&&renderedPages<=60,'human review page count outside bilingual range: '+renderedPages);
assert(!html.includes('<pre>'),'human review must not expose raw diagram JSON placeholders');

for(let i=1;i<=15;i++){
 const id='ZWD-'+String(i).padStart(2,'0');
 assert.equal((html.match(new RegExp('data-diagram-id="'+id+'"','g'))||[]).length,1,'diagram must render exactly once: '+id);
}
assert((html.match(/<svg class="zv-svg/g)||[]).length>=1,'at least one real SVG diagram required');
for(const cls of ['zv-ziwei-board','zv-axis-compact','zv-star-atlas','zv-tx-orbits','zv-palace-orbit','zv-nav-wheel','zv-chapter-master','zv-language-reading']){
 assert(html.includes('class="'+cls)||html.includes('class="'+cls+' '),'professional Zi Wei diagram structure missing: '+cls);
}
assert(html.includes('zv-diagram-composite'),'adaptive diagram composition missing');
assert(html.includes('zv-tx-focus'),'sparse Four-Transformation focus composition missing');
assert.equal((html.match(/data-page-family="SECTION_MASTER"/g)||[]).length,10,'exactly ten chapter master pages required');
assert.equal((html.match(/data-page-family="READING_ZH"/g)||[]).length,20,'exactly twenty Chinese reading pages required');
assert.equal((html.match(/data-page-family="READING_EN"/g)||[]).length,10,'exactly ten English reading pages required');
assert(html.includes('中文解读'),'Chinese review copy missing');
assert(html.includes('English Reading'),'English review copy missing');
assert(!/class=["'][^"']*\bzv-empty\b[^"']*["']/.test(html),'missing deterministic diagram renderer remains');
assert(html.includes('Deep Manuscript W8 PASS'),'Deep Manuscript W8 provenance banner missing');
assert(html.includes('repaired completeness PASS'),'repaired completeness provenance missing');
assert(html.includes('rerender provider calls 0'),'zero-cost rerender provenance missing');
assert(!html.includes('1 Sol call'),'legacy one-call provenance must not remain');

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
assert(!/[\uFDD0-\uFDEF\uFFFE\uFFFF]/u.test(html),'noncharacter Unicode leaked into customer review');
for(const rawBranch of ['>MAO<','>YIN<','>CHOU<','>CHEN<','>SI<','>WU<','>WEI<','>SHEN<','>YOU<','>XU<','>HAI<'])assert(!html.includes(rawBranch),'raw branch code leaked into customer review: '+rawBranch);
assert(!/>ZWD-\d\d</.test(html),'internal diagram id must not be customer-visible');
assert(html.includes('十二宫本命结构'),'page 6 must use the canonical natal palace overview');
assert(html.includes('读取边界')&&html.includes('Reading Boundary'),'closing boundary page missing');
assert(html.includes('data-focus-layer="DA_XIAN"'),'S09 must visually emphasize Da Xian');
assert(html.includes('data-focus-layer="LIU_NIAN"')||html.includes('Current Palace Activation'),'S10 must visibly preserve current-year activation');

function htmlText(text){
 return String(text??'')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#39;");
}
function completeZh(text){
 const t=String(text||'').trim();
 return ['。','！','？','》','）','」','』','】'].some(x=>t.endsWith(x));
}
function completeEn(text){
 const t=String(text||'').trim();
 return ['.','!','?'].includes(t.at(-1)) || ['."','!"','?"',".'","!'","?'"].some(x=>t.endsWith(x));
}
for(const section of publication.sections||[]){
 assert(section.zhHans?.paragraphs?.length>=5,section.sectionId+': Chinese deep manuscript too thin');
 assert(section.en?.paragraphs?.length>=5,section.sectionId+': English deep manuscript too thin');
 assert(section.zhHans.paragraphs.every(completeZh),section.sectionId+': Chinese paragraph truncation');
 assert(section.en.paragraphs.every(completeEn),section.sectionId+': English paragraph truncation');
 assert(html.includes(htmlText(section.zhHans.headline)),section.sectionId+': Chinese headline not rendered');
 assert(html.includes(htmlText(section.en.headline)),section.sectionId+': English headline not rendered');
}

console.log('PASS ZWR-VFR W9 human-review readiness: repaired Deep Manuscript bound; pages='+renderedPages+'; ZWD-01..15 rendered exactly once; adaptive diagram composition present; all visual assets bound; zero provider calls during rerender; bilingual manuscripts complete; ready for browser/print HUMAN REVIEW.');
