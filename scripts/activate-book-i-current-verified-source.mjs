import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p)),root='tools/review/free-ask-manuscript-r1/';
const receipts=['BOOK-I-III-CURRENT-BATCH-REGRESSION.json','BOOK-I-III-CURRENT-BATCH-FRESH-ANSWERS.json','BOOK-I-CURRENT-BATCH-UNSEEN-ANSWERS.json','BOOK-I-CURRENT-BATCH-FINAL-HOLDOUT.json'];
for(const p of receipts){const q=read(root+p);assert.equal(q.passed,q.cases);assert(q.results.every(r=>r.id.includes('-I-')||r.id.startsWith('I-')));assert.equal(q.providerCalls,0);}
const scopePath='content/knowledge/source-access/registries/manuscript-text-scope-candidates-v5.json',scope=read(scopePath);
for(const r of scope.records.filter(r=>r.bookCode==='BOOK-1')){
 const pages=r.validation.visualPages;r.pdfPageRange={start:Math.min(...pages),end:Math.max(...pages)};
 r.answerAcceptance='CURRENT_API_QUESTION_FIT_AND_BOUNDARY_VERIFIED_LIMITED_RANGE';
 r.validation.visualScope='Compared native PDF renders: intro13/14; structure57; capacity341/342. Obscured text on56 and343 excluded; no diagram/OCR/footnote consumed.';
 r.validation.receipts=receipts.map(p=>({path:root+p,sha256:sha(fs.readFileSync(root+p))}));
 r.validation.visualAssets=pages.map(p=>{const path='.tmp/knowledge-manuscripts/book-1-v3-revision-33c91cd60d5f/visual-'+p+'.png';return {pdfPage:p,path,sha256:sha(fs.readFileSync(path))};});
}
scope.publicationAuthorization='OWNER_CONTINUOUS_VERIFIED_CHINESE_RANGE_DEPLOYMENT_AUTHORIZATION';
fs.writeFileSync(scopePath,JSON.stringify(scope,null,2)+'\n');
const registry=read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7-candidate.json');
registry.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v7';registry.productionActivated=true;
const first=registry.records.find(r=>r.bookCode==='BOOK-1');first.scopeAdmissionSha256=sha(fs.readFileSync(scopePath));
first.currentness='CURRENT_V3_REVISION_THREE_VERIFIED_PROSE_RANGES';
assert.equal(registry.records.find(r=>r.bookCode==='BOOK-3').sourceSha256,read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json').records.find(r=>r.bookCode==='BOOK-3').sourceSha256,'THIRD_CURRENT_QA_FAILURE_DO_NOT_ACTIVATE');
fs.writeFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7.json',JSON.stringify(registry,null,2)+'\n');
console.log('Prepared governed Book I three-range publication source; Book III current candidate remains closed. No deployment performed.');
