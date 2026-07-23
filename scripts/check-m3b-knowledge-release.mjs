import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BOOK_ONE_ACCESS_CONTRACT,
  PURCHASE_STATES,
  canAccessBook
} from '../assets/js/knowledge/purchase-state.js';
import { LIBRARY_RESOURCES } from '../assets/js/knowledge/catalog.js';
import { onRequest as bookAccessEndpoint } from '../functions/api/book-one-access.js';

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

const requiredFiles = [
  'library.html',
  'book-one.html',
  'book-one-preview.html',
  'read/book-one/index.html',
  'figures.html',
  'figure.html',
  'glossary.html',
  'checkout.html',
  'assets/css/knowledge-release.css',
  'assets/js/pages/library.js',
  'assets/js/pages/book-one.js',
  'assets/js/pages/book-one-preview.js',
  'assets/js/pages/book-one-reader.js',
  'assets/js/pages/atlas-knowledge-upgrade.js',
  'assets/js/pages/figures.js',
  'assets/js/pages/figure-detail.js',
  'assets/js/pages/glossary.js',
  'assets/js/knowledge/purchase-state.js',
  'assets/js/knowledge/reading-progress.js',
  'content/registry/m3b-knowledge-release.json',
  'content/registry/book-1-free-preview.json',
  'content/knowledge/glossary-en.json',
  'content/knowledge/figure-captions-en.json',
  'data/schemas/book-access.schema.json',
  'docs/knowledge/M3B-W8-PAYMENT-PROVIDER-COMPARISON.md',
  'docs/knowledge/M3B-W8-STRIPE-MALAYSIA-READINESS.md',
  'functions/api/book-one-access.js'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3B deliverable: ${file}`);
}

assert.deepEqual(PURCHASE_STATES, [
  'not_purchased',
  'payment_pending',
  'purchased',
  'refunded',
  'revoked'
]);
assert.equal(BOOK_ONE_ACCESS_CONTRACT.amountMinor, 8900);
assert.equal(BOOK_ONE_ACCESS_CONTRACT.currency, 'MYR');
assert.equal(BOOK_ONE_ACCESS_CONTRACT.browserStorageCanGrantAccess, false);
for (const state of PURCHASE_STATES) {
  assert.equal(canAccessBook(state), state === 'purchased');
}

const accessResponse = await bookAccessEndpoint({
  request: new Request('https://example.test/api/book-one-access')
});
const accessPayload = await accessResponse.json();
assert.equal(accessResponse.status, 200);
assert.equal(accessPayload.purchaseState, 'not_purchased');
assert.equal(accessPayload.accessGranted, false);
assert.equal(accessPayload.accessConfigured, false);

const categories = new Set(LIBRARY_RESOURCES.map(resource => resource.category));
assert.deepEqual([...categories].sort(), [
  'atlas',
  'books',
  'downloads',
  'figures',
  'glossary',
  'research'
]);
const resourceStatuses = new Set(LIBRARY_RESOURCES.map(resource => resource.status));
for (const requiredStatus of ['available', 'preview', 'development', 'later']) {
  assert.equal(resourceStatuses.has(requiredStatus), true);
}

const manifest = await readJson('content/registry/book-1-manifest.json');
const figureRegistry = await readJson('content/registry/figures.json');
const conceptRegistry = await readJson('content/registry/concepts.json');
const glossaryEnglish = await readJson('content/knowledge/glossary-en.json');
const figureCaptionsEnglish = await readJson('content/knowledge/figure-captions-en.json');
const releaseRegistry = await readJson('content/registry/m3b-knowledge-release.json');
const previewManifest = await readJson('content/registry/book-1-free-preview.json');

assert.equal(manifest.page_count, 462);
assert.equal(manifest.parts.length, 6);
assert.equal(figureRegistry.figures.filter(figure => figure.book === 1).length, 16);
assert.equal(conceptRegistry.concepts.length, 41);
assert.equal(Object.keys(glossaryEnglish.definitions).length, 41);
assert.equal(Object.keys(figureCaptionsEnglish.captions).length, 16);
for (const concept of conceptRegistry.concepts) {
  assert.equal(typeof glossaryEnglish.definitions[concept.id], 'string', `Missing English definition: ${concept.id}`);
}

const invalidWebFigures = [];
for (const figure of figureRegistry.figures.filter(item => item.book === 1)) {
  assert.equal(typeof figureCaptionsEnglish.captions[figure.figure_id], 'string', `Missing English caption: ${figure.figure_id}`);
  const webPath = `assets/images/figures/book-1/web/${figure.figure_number}.webp`;
  if (!await exists(webPath)) {
    invalidWebFigures.push(`${figure.figure_id} (missing)`);
    continue;
  }
  const webFile = await fs.stat(path.join(root, webPath));
  if (!webFile.isFile() || webFile.size === 0) {
    invalidWebFigures.push(`${figure.figure_id} (empty)`);
  }
}
assert.deepEqual(
  invalidWebFigures,
  [],
  `Invalid public WebP files: ${invalidWebFigures.join(', ')}`
);

assert.equal(previewManifest.status, 'public-preview-ready');
assert.equal(previewManifest.source.pageCount, 48);
assert.equal(
  previewManifest.source.sha256,
  '40448c457354a8094f92f88f73a2cab8e136703931dacfaa8e39eecdc5015e95'
);
assert.equal(previewManifest.source.sourcePdfPubliclyServed, false);
assert.equal(previewManifest.publicRender.format, 'webp');
assert.equal(previewManifest.publicRender.pageCount, 48);
assert.equal(previewManifest.publicRender.previewPdfDownloadExposed, false);
assert.equal(previewManifest.publicRender.fullBookPdfDownloadExposed, false);
assert.equal(previewManifest.accessBoundary.browserStorageCanGrantFullAccess, false);

const invalidPreviewPages = [];
for (let page = 1; page <= previewManifest.publicRender.pageCount; page += 1) {
  const pageNumber = String(page).padStart(
    previewManifest.publicRender.pageNumberPadding,
    '0'
  );
  const pagePath = `assets/images/books/book-1/preview/page-${pageNumber}.webp`;
  if (!await exists(pagePath)) {
    invalidPreviewPages.push(`page ${page} (missing)`);
    continue;
  }
  const pageFile = await fs.stat(path.join(root, pagePath));
  if (!pageFile.isFile() || pageFile.size === 0) {
    invalidPreviewPages.push(`page ${page} (empty)`);
  }
}
assert.deepEqual(
  invalidPreviewPages,
  [],
  `Invalid free-preview WebP files: ${invalidPreviewPages.join(', ')}`
);

const previewAssetFiles = await fs.readdir(
  path.join(root, 'assets/images/books/book-1/preview')
);
assert.equal(
  previewAssetFiles.some(file => file.toLowerCase().endsWith('.pdf')),
  false,
  'The source or full Book I PDF must not be exposed in the public preview assets'
);

assert.equal(releaseRegistry.workstreams['M3B-W1'].status, 'ready');
assert.equal(releaseRegistry.workstreams['M3B-W6'].publicFormat, 'webp');
assert.equal(releaseRegistry.workstreams['M3B-W8'].checkoutAcceptsMoney, false);
assert.equal(releaseRegistry.workstreams['M3B-W8'].provider, 'stripe-malaysia');
assert.equal(
  releaseRegistry.workstreams['M3B-W8'].privateFullBookDeliveryConfigured,
  false
);
assert.equal(releaseRegistry.bookOne.manuscriptSourceAvailableInRepository, false);
assert.equal(releaseRegistry.bookOne.freePreviewPages, 48);

const previewHtml = await read('book-one-preview.html');
assert.match(previewHtml, /approved first 48 pages/);
assert.match(previewHtml, /data-preview-pages/);
assert.doesNotMatch(previewHtml, /not presented as a verbatim extract/);
assert.doesNotMatch(previewHtml, /\.pdf(?:["?#]|$)/i);

const previewScript = await read('assets/js/pages/book-one-preview.js');
assert.match(previewScript, /book-1-free-preview\.json/);
assert.match(previewScript, /IntersectionObserver/);
assert.doesNotMatch(previewScript, /\.pdf(?:["?#]|$)/i);

const progressScript = await read('assets/js/knowledge/reading-progress.js');
assert.match(progressScript, /preview-progress:v2/);
assert.doesNotMatch(progressScript, /purchaseState|accessGranted|purchased/);

const productHtml = await read('book-one.html');
assert.match(productHtml, /RM89/);
assert.match(productHtml, /No reader reviews/);
assert.doesNotMatch(productHtml, /customer review|five-star|★★★★★/i);

const readerHtml = await read('read/book-one/index.html');
assert.match(readerHtml, /data-access-guard/);
assert.doesNotMatch(readerHtml, /localStorage/);

const readerScript = await read('assets/js/pages/book-one-reader.js');
assert.doesNotMatch(readerScript, /setItem|purchaseState\s*=\s*['"]purchased/);

const atlasHtml = await read('explore.html');
assert.match(atlasHtml, /atlas-knowledge-upgrade\.js/);

console.log('✓ M3B Knowledge Release passed: Library → Book I → 48-page Preview → Access → Atlas → Figures → Glossary.');
console.log('  Stripe Malaysia is selected; commerce remains safely locked until every production gate passes.');
