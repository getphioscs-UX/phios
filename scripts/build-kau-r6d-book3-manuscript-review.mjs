import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildReviewHtml, recordsFromCorpusText, sha256, validateCorpusRecords } from './lib/kau-r6d-book3-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const stable = value => `${JSON.stringify(value, null, 2)}\n`;

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function fail(message) {
  throw new Error(`KAU-R6D build failed: ${message}`);
}

const completed = read('content/knowledge/manuscripts/completed/book-3-completed-manuscript-v1.json');
const materialization = read('content/knowledge/manuscripts/materialization/book-3-materialization-v1.json');
const inventory = read('content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json');
const source = completed.sourceBinary;
const expectedCorpus = { charCount: materialization.extraction.corpusCharCount, sha256: materialization.extraction.corpusSha256 };

if (process.argv.includes('--self-test')) {
  const text = 'Front\nSection body';
  const sections = [
    { sectionCode: 'TEST-FRONT', segmentType: 'FRONT_MATTER', partCode: 'FRONT', sequence: 0, heading: 'Front', headingRaw: null, startOffset: 0, endOffset: 6, startPage: 1, endPage: 1, charCount: 6, textSha256: sha256('Front\n') },
    { sectionCode: 'TEST-P8-S001', segmentType: 'SECTION', partCode: 'P8', sequence: 1, heading: 'Section', headingRaw: 'Section', startOffset: 6, endOffset: text.length, startPage: 2, endPage: 2, charCount: text.length - 6, textSha256: sha256('Section body') }
  ];
  const records = recordsFromCorpusText(text, { totalSegments: 2, sections }, { charCount: text.length, sha256: sha256(text) });
  validateCorpusRecords(records, { totalSegments: 2, sections });
  const html = buildReviewHtml(records, { sectionSegments: 1, pageCount: 2, sourceSha256: 'test', corpusSha256: sha256(text) });
  if (!html.includes("DATA.length+' 个完整片段") || html.includes('448 sections')) fail('review UI is not count-dynamic');
  console.log('✓ KAU-R6D Book III review generator self-test passed.');
  process.exit(0);
}

const pdfPathValue = argument('--pdf', process.env.KAU_R6D_BOOK3_PDF || null);
const corpusDirValue = argument('--corpus-dir', process.env.KSAR_PRIVATE_CORPUS_DIR || null);
if (Boolean(pdfPathValue) === Boolean(corpusDirValue)) fail('provide exactly one of --pdf or --corpus-dir');

let records;
let sourceMode;
if (pdfPathValue) {
  const pdfPath = path.resolve(pdfPathValue);
  if (!fs.existsSync(pdfPath)) fail(`PDF not found: ${pdfPath}`);
  const bytes = fs.readFileSync(pdfPath);
  if (bytes.length !== source.byteSize) fail(`PDF byte size ${bytes.length} != ${source.byteSize}`);
  if (sha256(bytes) !== source.sha256) fail('PDF SHA-256 does not match frozen completed-manuscript record');
  const extraction = spawnSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (extraction.error) fail(`pdftotext unavailable: ${extraction.error.message}`);
  if (extraction.status !== 0) fail(`pdftotext exited ${extraction.status}: ${extraction.stderr.trim()}`);
  const corpusText = extraction.stdout.replaceAll('\f', '');
  records = recordsFromCorpusText(corpusText, inventory, expectedCorpus);
  sourceMode = 'EXACT_SOURCE_PDF_TEXT_LAYER';
} else {
  const corpusRoot = path.resolve(corpusDirValue);
  const relative = 'books/book-3/materialized/v1/retrieval-corpus.json';
  const candidates = [path.join(corpusRoot, relative), path.join(corpusRoot, relative.replace(/^books[\\/]/, ''))];
  const corpusPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!corpusPath) fail(`private retrieval corpus not found: ${relative}`);
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  records = validateCorpusRecords(corpus.records, inventory);
  sourceMode = 'PRIVATE_RETRIEVAL_CORPUS';
}

const outputDir = path.resolve(argument('--out', path.join(ROOT, 'dist/kau-r6d-book3-manuscript-review')));
const riskCounts = records.reduce((counts, record) => ({ ...counts, [record.quality.riskLevel]: (counts[record.quality.riskLevel] || 0) + 1 }), {});
const metadata = {
  schemaVersion: 'PHI-OS-KAU-R6D-BOOK3-READABILITY-REVIEW-METADATA-v1.0.0',
  stage: 'KAU-R6D',
  status: 'REVIEW_WORKFLOW_READY_HUMAN_DECISIONS_PENDING',
  bookCode: 'BOOK-3',
  titleZhHans: completed.titleZhHans,
  titleEn: completed.titleEn,
  sourceMode,
  sourceSha256: source.sha256,
  sourceByteSize: source.byteSize,
  pageCount: source.pageCount,
  corpusSha256: expectedCorpus.sha256,
  corpusCharCount: expectedCorpus.charCount,
  recordCount: records.length,
  sectionSegments: inventory.sectionSegments,
  partCounts: inventory.partCounts,
  riskCounts,
  authorityBoundary: {
    automatedRiskIsNotHumanReadabilityApproval: true,
    noCanonicalAuthorityCreated: true,
    noCanonicalNodeMutationPerformed: true,
    manuscriptBodyStoredInPublicRepository: false
  }
};
const publicRecords = records.map(({ text, ...record }) => ({ ...record, reviewStatus: 'PENDING_HUMAN_READABILITY_REVIEW' }));
const manifest = {
  schemaVersion: 'PHI-OS-KAU-R6D-BOOK3-READABILITY-REVIEW-PROJECTION-v1.0.0',
  stage: 'KAU-R6D',
  status: metadata.status,
  html: 'review-index.html',
  metadata: 'book-3-readability-review-metadata-v1.json',
  recordCount: records.length,
  records: publicRecords,
  sourcePageImagesEmbedded: false,
  sourceVisualCheck: 'Use the exact private source PDF and displayed page range when a figure or layout finding needs visual confirmation.'
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'review-index.html'), buildReviewHtml(records, metadata), 'utf8');
fs.writeFileSync(path.join(outputDir, 'book-3-readability-review-metadata-v1.json'), stable(metadata), 'utf8');
fs.writeFileSync(path.join(outputDir, 'review-projection-manifest.json'), stable(manifest), 'utf8');
console.log(`✓ KAU-R6D Book III review built: ${records.length} complete segments / ${inventory.sectionSegments} manuscript sections.`);
console.log(`  Source: ${sourceMode}`);
console.log(`  Review UI: ${path.join(outputDir, 'review-index.html')}`);

