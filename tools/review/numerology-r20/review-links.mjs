import fs from 'node:fs';
import path from 'node:path';
const m='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html',h=fs.readFileSync(m,'utf8'),s=h.slice(h.indexOf('<!-- NUM_R20_CURRENT_START -->'),h.indexOf('<!-- NUM_R20_CURRENT_END -->'));
const rows=[...s.matchAll(/(?:href|src)="([^"]+)"/g)].map(x=>({url:x[1],exists:fs.existsSync(path.resolve(path.dirname(m),x[1]))}));
if(rows.some(x=>!x.exists))throw Error(JSON.stringify(rows.filter(x=>!x.exists)));
fs.writeFileSync('tools/review/numerology-r20/REVIEW-LINKS.json',JSON.stringify({pass:true,rows},null,2));
fs.writeFileSync('tools/review/numerology-r20/FINAL-VISUAL-REVIEW.json',JSON.stringify({scope:'All 99 current pages reviewed in nine contact sheets; source images previously viewed individually',result:'PASS_LOCAL_LAYOUT_SCREEN_REVIEW',physicalPrintProof:false,limitations:['Fixed source assets approximately128 dpi','Single-language body pages retain whitespace; no unsupported prose added','No new author acceptance implied'],pdfs:JSON.parse(fs.readFileSync('tools/review/numerology-r20/PDF-RESULTS.json')).results.map(p=>({locale:p.locale,sha256:p.sha256}))},null,2));
console.log('review links',rows.length,'all exist');
