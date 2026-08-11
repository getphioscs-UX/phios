import assert from 'node:assert/strict';
import { readText, readJson, BASELINE } from './lib/web-production/wpr-public-v1.mjs';
const c=readJson('content/web-production/composition/public/library-composition-v1.json'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.work,'WPR-W15');
const js=readText('assets/js/pages/library.js'); assert.equal(js.includes('knowledge/catalog.js'),false); assert.equal(js.includes('LIBRARY_RESOURCES'),false); assert.ok(js.includes('loadCanonicalBooks')); assert.ok(js.includes('loadCanonicalParts')); assert.ok(js.includes('loadPublishedArticles'));
const html=readText('library.html'); assert.ok(html.includes('href="/books"')); assert.ok(html.includes('data-knowledge-article-grid')); assert.ok(html.includes('/assets/js/pages/knowledge-connections.js')); assert.ok(html.includes('/assets/css/wpr-public-production.css'));
const books=readJson('content/registry/books.json'); assert.equal(books.books.length,4); console.log('✓ WPR-W15 Library Production Composition passed.');
