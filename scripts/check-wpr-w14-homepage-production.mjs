import assert from 'node:assert/strict';
import { readText, readJson, exists, BASELINE } from './lib/web-production/wpr-public-v1.mjs';
const c=readJson('content/web-production/composition/public/homepage-composition-v1.json');
assert.equal(c.baselineCommit,BASELINE); assert.equal(c.work,'WPR-W14'); assert.equal(c.mode,'STATIC_PUBLIC_SHELL_TRANSITIONAL');
const html=readText('index.html'); assert.ok(html.includes('/assets/css/wpr-public-production.css')); assert.ok(html.includes('/assets/js/pages/home-production.js')); assert.ok(html.includes('data-wpr-home-books')); assert.ok(html.includes('data-wpr-home-visuals')); assert.equal(html.includes('data-knowledge-article-grid'),false);
const books=readJson('content/registry/books.json'); assert.equal(books.books.length,4); assert.deepEqual(books.books.map(b=>b.volume),[1,2,3,4]);
assert.ok(exists('assets/js/pages/home-production.js')); console.log('✓ WPR-W14 Homepage Production Composition passed.');
