import fs from 'node:fs';
import assert from 'node:assert/strict';

const htmlPath='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html';
assert(fs.existsSync(htmlPath),'ZWR VFR human review HTML missing');
const html=fs.readFileSync(htmlPath,'utf8');
assert.equal((html.match(/class="zv-page"/g)||[]).length,47,'human review must render 47 pages');
assert(!html.includes('<pre>'),'human review must not expose raw diagram JSON placeholders');
for(let i=1;i<=15;i++){
 const id='ZWD-'+String(i).padStart(2,'0');
 assert(html.includes('data-diagram-id="'+id+'"'),'missing rendered diagram '+id);
}
assert((html.match(/<svg class="zv-svg"/g)||[]).length>=1,'at least one real SVG diagram required');
assert(html.includes('中文解读'),'Chinese review copy missing');
assert(html.includes('English Reading'),'English review copy missing');
assert(!html.includes('zv-empty'),'missing deterministic diagram renderer remains');
assert(html.includes('W8 live PASS'),'W8 provenance banner missing');
assert(html.includes('0 semantic review'),'semantic-review-free provenance missing');
for(const asset of [
 'RPT-ZIWEI-P01-COVER-v1.webp',
 'RPT-ZIWEI-P02-METHOD-INTRO-v1.webp',
 'RPT-ZIWEI-P03-ORIGIN-v1.webp',
 'RPT-ZIWEI-P04-PHIOS-LENS-v1.webp',
 'RPT-ZIWEI-P05-HOW-TO-READ-v1.webp',
 'VIS-REPORT-ZIWEI-BODY.webp',
 'VIS-REPORT-ZIWEI-SEC-06-CAREER-SOCIAL.webp',
 'VIS-REPORT-ZIWEI-SEC-07-RESOURCES-WEALTH.webp',
 'VIS-REPORT-ZIWEI-SEC-09-TIMING-NAVIGATION.webp',
 'VIS-REPORT-ZIWEI-SEC-10-EVIDENCE-BOUNDARY.webp'
])assert(html.includes(asset),'missing Zi Wei visual asset binding: '+asset);
for(const leak of ['entityId','ZWR:TIMING_LAYER','Authoring Pack','semantic verifier','authorityRefs'])assert(!html.includes(leak),'internal term leaked into review HTML: '+leak);
assert(!/>ZWD-\d\d</.test(html),'internal diagram id must not be customer-visible');
console.log('PASS ZWR-VFR W9 human-review readiness: 47 pages; ZWD-01..15 rendered; R2 front matter/body/section art bound; no raw JSON/internal ids; bilingual review copy present; no missing renderer.');
