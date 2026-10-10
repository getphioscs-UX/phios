import assert from 'node:assert/strict';
import { readText, readJson, BASELINE } from './lib/web-production/wpr-public-v1.mjs';
const c=readJson('content/web-production/composition/public/figure-diagram-composition-v1.json'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.work,'WPR-W17');
for(const f of ['assets/js/pages/figures.js','assets/js/pages/figure-detail.js']){const s=readText(f);assert.equal(s.includes('/assets/images/figures/book-1/web/'),false,`legacy hardcode:${f}`);assert.ok(s.includes('figurePublicSrc'));}
const html=readText('figures.html'); assert.equal(html.includes('value="5"'),false); assert.ok(html.includes('data-wpr-production-surface="FIGURE"'));
const figs=readJson('content/registry/figures.json'), parts=readJson('content/registry/parts.json'), audit=readJson('content/web-production/audits/wpr-figure-ownership-drift-audit-v1.json');
const owner=new Map(parts.parts.map(p=>[p.number,p.book])); const actual=figs.figures.filter(f=>{const expected=f.part===0?'book-1':owner.get(f.part);return expected && `book-${f.book}`!==expected;});
assert.equal(actual.length,5); assert.equal(audit.mismatchCount,5); assert.equal(audit.mismatches.length,5); assert.ok(actual.every(f=>f.part===5)); console.log('✓ WPR-W17 Figure / Diagram Production Composition passed with 5 upstream ownership mismatches excluded.');
