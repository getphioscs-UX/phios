import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = path => fs.readFile(path,'utf8');

const [r1,w4a,pja] = await Promise.all([
  read('scripts/check-kh-w4b5-r1-blueprint-registry-authority-refresh.mjs'),
  read('scripts/check-kh-w4a-knowledge-runtime-v2.mjs'),
  read('scripts/check-pja-w1-blueprint-led-knowledge.mjs')
]);

assert.match(r1,/derivedCanonicalNodeTotal/);
assert.match(r1,/book3\.canonicalNodeCount, 182/);
assert.doesNotMatch(r1,/registry\.totals\.canonicalNodes, 331/);

assert.match(w4a,/currentCanonicalNodeCount/);
assert.match(w4a,/BOOK-2'\)\.cardinality\.canonicalNodeCount, 266/);
assert.match(w4a,/BOOK-3'\)\.cardinality\.canonicalNodeCount, 182/);
assert.doesNotMatch(w4a,/knowledge\.totals, \{ books: 4, parts: 16, nodes: 78 \}/);

assert.match(pja,/pjaW1NodeCodes/);
assert.match(pja,/activeCodes, \.\.\.deferredCodes/);
assert.doesNotMatch(pja,/new Set\(nodesRegistry\.nodes\.map\(node => node\.themeCode\)\)/);

console.log('✓ KH-W4B.5 Book 3 R1 compatibility repair passed.');
console.log('✓ Dynamic Registry totals replace obsolete 331/78 current-scale assertions.');
console.log('✓ KH-W4A 78-node evidence remains historical, not current authority.');
console.log('✓ PJA-W1 Theme validation remains bounded to its own Wave.');
