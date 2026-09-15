import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const receipt=read('docs/knowledge/structured-successor/source-material-receipt-v1.json');assert.equal(receipt.records.length,4);
for(const r of receipt.records){assert.ok(r.textPath.startsWith('functions/_source-material/books/'));const bytes=fs.readFileSync(r.textPath);assert.equal(hash(bytes),r.textFileSha256);const corpus=JSON.parse(bytes);assert.equal(corpus.pages.length,r.pageCount);assert.equal(corpus.sourcePdfSha256,r.sourcePdfSha256);assert.equal(corpus.canonicalAuthority,false);assert.equal(corpus.rawDeliveryAllowed,false);for(const [i,p] of corpus.pages.entries()){assert.equal(p.pdfPage,i+1);assert.equal(hash(p.text),p.textSha256);}}
// Check the installed lockfile runtime's actual Pages exclusion, not .gitignore.
const wrangler=fs.readFileSync('node_modules/wrangler/wrangler-dist/cli.js','utf8');assert.match(wrangler,/const IGNORE_LIST = \[[\s\S]{0,250}"functions"/,'PAGES_SOURCE_ARCHIVE_EXCLUSION_DRIFT');
const registry=read('content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
for(const n of [1,2]){const file=`functions/_source-material/books/book-${n}-registered-reviewed-corpus.json`;assert.equal(hash(fs.readFileSync(file)),registry.records.find(r=>r.bookCode===`BOOK-${n}`).retrievalCorpusSha256);}
const tasks=read('docs/knowledge/structured-successor/meaning-extraction/meaning-extraction-tasks-v1.json').tasks;
const sections=read('functions/_source-material/books/book-3-registered-sections-v1.json').sections;
for(const t of tasks.filter(t=>t.bookCode==='BOOK-3'))for(const s of t.sourceSections)assert.equal(hash(sections.find(x=>x.sectionCode===s.sectionCode).text),s.textSha256);
const review=read('docs/knowledge/structured-successor/meaning-extraction/meaning-semantic-differences-v1.json');assert.equal(review.records.length,40);assert.equal(review.humanAcceptanceComplete,false);assert.equal(review.userFeedback.meaningApproval,false);for(const [p,digest] of Object.entries(review.batchDigests))assert.equal(hash(fs.readFileSync(p)),digest);
assert.equal(review.records.filter(r=>r.status==='WORDING_REVISION_SUGGESTED').length,2);assert.equal(review.records.filter(r=>r.status==='EXPANDED_EVIDENCE_ADDED_PENDING_HUMAN_REVIEW').length,8);
console.log('✓ Four archived desktop texts, per-page hashes, registered I/II corpus and III sections verified. Source archive excluded by Pages; AI review is not human approval.');

for(const r of review.records.filter(r=>r.additionalEvidence)){const e=r.additionalEvidence,corpus=read(e.sourcePath),section=(corpus.sections||corpus.records).find(s=>s.sectionCode===e.sectionCode);assert.equal(hash(section.text),e.sectionTextSha256);assert.ok(section.text.replace(/\s+/g,'').includes(e.quote));}
