import assert from 'node:assert/strict';
import { readText, readJson, exists, BASELINE } from './lib/web-production/wpr-public-v1.mjs';
const c=readJson('content/web-production/composition/public/book-composition-v1.json'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.work,'WPR-W18');
const books=readJson('content/registry/books.json'); assert.equal(books.books.length,5); assert.deepEqual(books.books.map(b=>b.parts),[[1,2,3,4],[5,6,7],[8,9],[10,11,12],[13,14,15]]);
const pages=['books/index.html','books/reality-formation/index.html','books/reality-runtime/index.html','books/reality-civilization/index.html','books/reality-navigation/index.html']; for(const f of pages) assert.ok(exists(f),f);
const one=readText('book-one.html'); for(const forbidden of ['Part 5','five Parts','six Parts','Conscious Runtime']) assert.equal(one.includes(forbidden),false,`stale Book I content:${forbidden}`); assert.ok(one.includes('RM89')); assert.ok(one.includes('No reader reviews')); assert.ok(one.includes('data-knowledge-article-grid')); assert.ok(one.includes('/assets/js/pages/knowledge-connections.js'));
const js=readText('assets/js/pages/book-one.js'); assert.equal(js.trim(),"import './book-volume.js';"); console.log('✓ WPR-W18 Five-Volume Book Production Composition passed.');
