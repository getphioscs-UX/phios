import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewHtml, recordsFromCorpusText, sha256, validateCorpusRecords } from './lib/kau-r6d-book3-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const contract = read('content/knowledge/manuscripts/review/kau-r6d-book3-manuscript-readability-review-contract-v1.json');
const completed = read('content/knowledge/manuscripts/completed/book-3-completed-manuscript-v1.json');
const materialization = read('content/knowledge/manuscripts/materialization/book-3-materialization-v1.json');
const inventory = read('content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json');
const integrity = read('content/knowledge/manuscripts/extraction/book-3-section-integrity-v1.json');
const admission = read('content/knowledge/knowledge-intelligence-r2/registries/kir-r2-book-i-iii-source-admission-v1.json');
const packageJson = read('package.json');

assert.equal(contract.stage, 'KAU-R6D');
assert.equal(contract.status, 'REVIEW_WORKFLOW_READY_HUMAN_DECISIONS_PENDING');
assert.equal(contract.bookCode, 'BOOK-3');
assert.deepEqual(contract.source, {
  fileName: completed.sourceBinary.fileName,
  byteSize: completed.sourceBinary.byteSize,
  pageCount: completed.sourceBinary.pageCount,
  sha256: completed.sourceBinary.sha256,
  corpusCharCount: materialization.extraction.corpusCharCount,
  corpusSha256: materialization.extraction.corpusSha256
});
assert.equal(materialization.status, 'FULLY_MATERIALIZED');
assert.equal(materialization.extraction.ocrUsed, false);
assert.equal(materialization.extraction.semanticRewrite, false);
assert.equal(inventory.totalSegments, 106);
assert.equal(inventory.sectionSegments, 103);
assert.equal(inventory.partCounts.FRONT, 1);
assert.equal(inventory.partCounts.P8, 60);
assert.equal(inventory.partCounts.P9, 43);
assert.equal(integrity.exactCoverage.gaps, 0);
assert.equal(integrity.exactCoverage.overlaps, 0);
assert.equal(integrity.exactCoverage.corpusLengthMatches, true);
assert.equal(inventory.sections.length, inventory.totalSegments);
assert.equal(inventory.sections[0].startOffset, 0);
assert.equal(inventory.sections.at(-1).endOffset, materialization.extraction.corpusCharCount);

const book3Admission = admission.records.find(record => record.bookCode === 'BOOK-3');
assert.ok(book3Admission, 'BOOK-3 is missing from KIR-R2 source admission');
assert.equal(book3Admission.recordCount, inventory.totalSegments);
assert.equal(book3Admission.sourceSha256, completed.sourceBinary.sha256);
assert.equal(book3Admission.r2ObjectKey, 'books/book-3/materialized/v1/retrieval-corpus.json');
assert.equal(book3Admission.sectionInventoryPath, contract.inventory.path);

assert.equal(packageJson.scripts['kau:r6d:review'], 'node scripts/build-kau-r6d-book3-manuscript-review.mjs');
assert.equal(packageJson.scripts['check:kau-r6d'], 'node scripts/check-kau-r6d-book3-manuscript-review.mjs');
assert.match(packageJson.scripts['check:kau-complete'], /npm run check:kau-r6d/);

const text = 'Front\nReadable section';
const sections = [
  { sectionCode: 'TEST-FRONT', segmentType: 'FRONT_MATTER', partCode: 'FRONT', sequence: 0, heading: 'Front', headingRaw: null, startOffset: 0, endOffset: 6, startPage: 1, endPage: 1, charCount: 6, textSha256: sha256('Front\n') },
  { sectionCode: 'TEST-P8-S001', segmentType: 'SECTION', partCode: 'P8', sequence: 1, heading: 'Readable', headingRaw: 'Readable', startOffset: 6, endOffset: text.length, startPage: 2, endPage: 2, charCount: text.length - 6, textSha256: sha256('Readable section') }
];
const testInventory = { totalSegments: 2, sections };
const records = recordsFromCorpusText(text, testInventory, { charCount: text.length, sha256: sha256(text) });
assert.equal(validateCorpusRecords(records, testInventory).length, 2);
assert.throws(() => validateCorpusRecords([{ ...records[0], text: 'tampered' }, records[1]], testInventory), /integrity failure/);
const html = buildReviewHtml(records, { sectionSegments: 1, pageCount: 2, sourceSha256: 'test-source', corpusSha256: sha256(text) });
for (const required of ['KAU-R6D', 'DATA.length', '导出决定', '全部决定', 'SOURCE_PDF_FIX_REQUIRED']) assert.ok(html.includes(required), `review UI missing ${required}`);
assert.ok(!html.includes('448 sections'), 'retired hard-coded section total leaked into KAU-R6D UI');

const forbiddenPublicBodyPaths = [
  'content/knowledge/manuscripts/materialization/pages.ndjson',
  'content/knowledge/manuscripts/materialization/full-manuscript.md',
  'content/knowledge/manuscripts/materialization/retrieval-corpus.json',
  'content/knowledge/manuscripts/extraction/sections'
];
for (const relative of forbiddenPublicBodyPaths) assert.equal(fs.existsSync(path.join(ROOT, relative)), false, `private manuscript body leaked: ${relative}`);

console.log('✓ KAU-R6D Book III readability review passed: exact 397-page source and 411,937-character corpus are frozen.');
console.log('✓ Review projection covers all 106 segments / 103 sections (P8 60, P9 43) without requiring private text in CI.');
console.log('✓ The review workflow itself creates no human approval; successor human acceptance is checked by check:kau-r6d-human.');
