import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const b1 = read('content/knowledge/manuscripts/materialization/book-1-materialization-v1.json');
const b2 = read('content/knowledge/manuscripts/materialization/book-2-materialization-v1.json');
const reg = read('content/knowledge/manuscripts/materialization/kau-r1b-materialization-registry-v1.json');
const c1 = read('content/knowledge/manuscripts/completed/book-1-completed-manuscript-v2.json');
const c2 = read('content/knowledge/manuscripts/completed/book-2-completed-manuscript-v1.json');

assert.equal(reg.stage, 'KAU-R1B');
assert.equal(reg.baselineCommit, '7043d884c27bc38c42106ace336b5f4cb6ae54ab');
assert.equal(reg.totals.pdfPages, 788);
assert.equal(reg.totals.corpusCharCount, 962398);
for (const [m,c,pages,chars,corpus,pageChain] of [
  [b1,c1,402,485229,'37c581f4ffcce1dc47501166b04954cbc7dd6a726dd8ba6e2bad773e59fcafe5','6f999c10fb59bb0c17772eca3134cc65e2d0f32891e039bc1e322530ad8f04ae'],
  [b2,c2,386,477169,'94a9c7d506078f1f975022d108058c19465eb883d523efc886648819d3392f63','3aba0f2b7f7955939d360f2ecaf8cec5234997fb29ef4a2ea47a3b8b5a8587e9']
]) {
  assert.equal(m.status, 'FULLY_MATERIALIZED');
  assert.equal(m.sourceBinary.sha256, c.sourceBinary.sha256);
  assert.equal(m.sourceBinary.byteSize, c.sourceBinary.byteSize);
  assert.equal(m.extraction.pageCount, pages);
  assert.equal(m.extraction.corpusCharCount, chars);
  assert.equal(m.extraction.corpusSha256, corpus);
  assert.equal(m.extraction.pageHashChainSha256, pageChain);
  assert.deepEqual(m.extraction.emptyTextPages, []);
  assert.equal(m.extraction.ocrUsed, false);
  assert.equal(m.extraction.semanticRewrite, false);
  assert.equal(m.privateArtifacts.publicRepositoryBodyStorageAllowed, false);
  assert.equal(m.integrity.everyPdfPageMaterialized, true);
}
assert.equal(reg.privateArtifactTransfer.publicRepositoryBodyStorageAllowed, false);
assert.equal(reg.boundaries.canonicalNodeMutation, false);

for (const forbidden of [
  'content/knowledge/manuscripts/materialization/full-manuscript.md',
  'content/knowledge/manuscripts/materialization/pages.ndjson',
  'content/knowledge/manuscripts/extraction/sections'
]) assert.equal(fs.existsSync(forbidden), false, `Private manuscript body leaked into public repository: ${forbidden}`);

console.log('✓ KAU-R1B Full Manuscript Materialization passed.');
console.log('  BOOK-1: 402/402 pages materialized; corpus sha256 37c581f4...');
console.log('  BOOK-2: 386/386 pages materialized; corpus sha256 94a9c7d5...');
console.log('  788 pages are source-derived, OCR-free, semantic-rewrite-free, and private-body only.');
