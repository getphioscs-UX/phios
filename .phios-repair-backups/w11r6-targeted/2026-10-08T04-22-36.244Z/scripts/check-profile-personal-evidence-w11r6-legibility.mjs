import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='content/profile/successors/personal-evidence-r1/w11r6/',browser=JSON.parse(fs.readFileSync(dir+'browser-results.json'));
assert.equal(browser.status,'PASS');assert.equal(browser.results.length,11);assert.equal(browser.networkEvidence.providerCalls,0);assert.equal(browser.networkEvidence.remoteRequestsBlocked,0);
for(const r of browser.results){
 assert(fs.statSync('tools/review/personal-evidence-r1/'+r.id+'-bilingual-dossier.html').mtimeMs<=Date.parse(browser.timestamp),'Report changed after browser verification');
 assert(r.pageAudit.every(p=>!p.blank&&!p.readingOverlap&&p.figures.every(f=>!f.footerOverlap&&!f.childOverflow)));
 assert(r.mobile.scroll<=r.mobile.width+1);assert(r.mobile.figures.every(f=>f.scroll<=f.width+1&&f.minTextSize>=13));
}
console.log('W11R6 stored real browser evidence PASS: 11 A4/mobile audits, current report timestamps, zero remote requests.');
