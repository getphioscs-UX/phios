import assert from 'node:assert/strict';
import { readText, readJson, exists, BASELINE } from './lib/web-production/wpr-public-v1.mjs';

const composition = readJson('content/web-production/composition/public/book-composition-v1.json');
assert.equal(composition.baselineCommit, BASELINE);
assert.equal(composition.work, 'WPR-W18');

// WPR-W18 is a frozen five-volume predecessor. Keep its registry intact while
// validating the active seven-volume publication successor selected by the
// current architecture pointer.
const historicalBooks = readJson('content/registry/books.json');
assert.equal(historicalBooks.books.length, 5);
assert.deepEqual(historicalBooks.books.map(book => book.parts), [
  [1, 2, 3, 4],
  [5, 6, 7],
  [8, 9],
  [10, 11, 12],
  [13, 14, 15]
]);

const architecture = readJson('content/registry/current-book-architecture.json');
assert.equal(architecture.status, 'ACTIVE');
assert.equal(architecture.architecture, 'seven-volume-15-part');
assert.equal(architecture.historicalPredecessor.mutable, false);

const currentBooks = readJson(architecture.books.replace(/^\//, ''));
const projection = readJson('content/web-production/registries/wpr-seven-volume-book-production-projection-v1.json');
assert.equal(currentBooks.books.length, 7);
assert.equal(projection.status, 'ACTIVE_SUCCESSOR');
assert.equal(projection.architecture, architecture.architecture);
assert.deepEqual(
  projection.books.map(book => book.parts.map(part => Number(part.slice(1)))),
  currentBooks.books.map(book => book.parts)
);

const pages = ['books/index.html', ...projection.books.map(book => `${book.route.replace(/^\//, '')}index.html`)];
for (const file of pages) assert.ok(exists(file), file);

const redirects = readText('_redirects');
assert.ok(redirects.includes('/books/reality-civilization/ /books/reality-expansion/ 308'));

const bookOne = readText('book-one.html');
for (const forbidden of ['Part 5', 'five Parts', 'six Parts', 'Conscious Runtime']) {
  assert.equal(bookOne.includes(forbidden), false, `stale Book I content:${forbidden}`);
}
assert.ok(bookOne.includes('RM89'));
assert.ok(bookOne.includes('No reader reviews'));
assert.ok(bookOne.includes('data-knowledge-article-grid'));
assert.ok(bookOne.includes('/assets/js/pages/knowledge-connections.js'));

const js = readText('assets/js/pages/book-one.js');
assert.equal(js.trim(), "import './book-volume.js';");
console.log('✓ WPR-W18 historical composition and active seven-volume successor passed.');
