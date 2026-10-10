import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));

const admission = read('content/knowledge/manuscripts/completed/book-1-completed-manuscript-v3.json');
const completed = read('content/knowledge/manuscripts/completed/completed-manuscript-registry-v2.json');
const preview = read('content/registry/book-1-free-preview.json');
const publicAssets = read('content/registry/public-assets.json');
const samples = read('content/web-production/registries/book-public-samples-v1.json');

assert.equal(admission.bookCode, 'BOOK-1');
assert.equal(admission.sourceBinary.fileName, 'PHI-OS-Book-I-v3.pdf');
assert.equal(admission.privateStorageBinding.bucket, 'phios-private-manuscripts');
assert.equal(admission.privateStorageBinding.objectKey, 'books/book-1/source/PHI-OS-Book-I-v3.pdf');
assert.equal(admission.status, 'OWNER_CONFIRMED_FINAL_UPLOAD_BINARY_VERIFICATION_PENDING');
assert.equal(admission.cutoverGate.completedManuscriptRegistryCutoverAllowed, false);
assert.equal(admission.authorityBoundary.canonicalNodeMutationAllowed, false);
assert.equal(admission.sourceBinary.sha256, null);
assert.equal(admission.sourceBinary.pageCount, null);
assert.equal(admission.sourceBinary.byteSize, null);

const currentBook1 = completed.records.find(record => record.bookCode === 'BOOK-1');
assert.ok(currentBook1, 'BOOK-1 completed registry record required');
assert.equal(currentBook1.fileName, 'PHI-OS-Book-I-v2.pdf', 'v2 must remain active until v3 binary + extraction review passes');
assert.equal(currentBook1.recordPath, 'content/knowledge/manuscripts/completed/book-1-completed-manuscript-v2.json');

assert.equal(preview.publicRender.pageNumberPadding, 3);
assert.equal(preview.publicRender.objectKeyPattern, 'books/previews/book-1/page-{page}.webp');
assert.equal(preview.publicRender.r2UploadEvidence.status, 'OWNER_CONFIRMED_FINAL_UPLOAD');

const previewAsset = publicAssets.assets.find(asset => asset.asset_code === 'BOOK-1-PREVIEW');
const figureAsset = publicAssets.assets.find(asset => asset.asset_code === 'BOOK-1-FIGURES');
assert.ok(previewAsset);
assert.ok(figureAsset);
assert.equal(previewAsset.object_key, 'books/previews/book-1/');
assert.equal(previewAsset.naming, 'page-001.webp');
assert.equal(figureAsset.object_key, 'images/figures/books/book-1/');
assert.deepEqual(figureAsset.final_uploaded_set, ['4A.webp','4B.webp','4C.webp','4D.webp','4E.webp','4F.webp']);

const book1 = samples.books.find(book => book.bookId === 'book-1');
assert.ok(book1, 'book-1 public sample record required');
assert.ok(book1.previewPages.length > 0);
assert.ok(book1.previewPages.every((url, index) => url.endsWith(`/page-${String(index + 1).padStart(3, '0')}.webp`)));
for (const number of ['4A','4B','4C','4D','4E','4F']) {
  const figure = book1.figures.find(item => item.number === number);
  assert.ok(figure, `${number} final figure record required`);
  assert.equal(figure.url, `https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-1/${number}.webp`);
  assert.equal(figure.deliveryState, 'OWNER_CONFIRMED_FINAL_UPLOAD');
}
assert.deepEqual(book1.finalAssetUploadEvidence.finalFigureSet, ['4A','4B','4C','4D','4E','4F']);

console.log('PASS Book I v3 final-source admission: owner-confirmed R2 paths are registered; preview naming is NNN; 4A-4F are bound; v2 remains active until verified v3 cutover.');
