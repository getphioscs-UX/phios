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
console.log('PASS ZWR-VFR W9 human-review readiness: 47 pages; ZWD-01..15 rendered; no raw JSON placeholders; bilingual review copy present; no missing renderer.');
