import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const [nodes, book2Blueprint, book3Blueprint, ownership] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/book-2-knowledge-blueprint.json'),
  readJson('content/knowledge/blueprints/book-3-knowledge-blueprint.json'),
  readJson('content/knowledge/migrations/node-publication-ownership-v2.json')
]);

// KH-W4B.5 source population remains immutable historical lineage.
const historicalBook2Population = nodes.nodes.filter(
  node => node.publicationBookCode === 'BOOK-2' &&
    ['P5', 'P6', 'P7', 'P8', 'P9'].includes(node.publicationPartCode)
);
assert.equal(historicalBook2Population.length, 266);
assert.equal(new Set(historicalBook2Population.map(node => node.nodeCode)).size, 266);
for (const node of historicalBook2Population) {
  assert.match(node.nodeCode, /^KN-(?:B1-P5|B2-P[6-9])-\d{3}$/);
  assert.ok(['planned', 'draft'].includes(node.registryStatus));
  assert.equal(node.productionReady, false);
  assert.equal(node.articleStatus, 'not_created');
  assert.equal(node.candidateStatus, 'not_created');
  assert.equal(node.crossSessionNode.enabled, true);
  assert.ok(Array.isArray(node.dependencies));
  assert.ok(node.relationships);
}

// KAU-R0 changes publication projection only: P5–P7 remain BOOK-2; P8–P9 move to BOOK-3.
assert.deepEqual(
  book2Blueprint.parts.map(part => [part.partCode, part.canonicalNodeCount]),
  [['P5', 65], ['P6', 58], ['P7', 57]]
);
assert.equal(book2Blueprint.nodes.length, 180);
assert.equal(book2Blueprint.plannedCanonicalNodes, 180);
assert.equal(book2Blueprint.bookCode, 'BOOK-2');
assert.equal(book2Blueprint.contract, 'PHI-OS-BOOK-2-KNOWLEDGE-BLUEPRINT-v3.0.0');
assert.deepEqual(
  book3Blueprint.parts.map(part => [part.partCode, part.canonicalNodeCount]),
  [['P8', 47], ['P9', 39]]
);
assert.equal(book3Blueprint.nodes.length, 86);
assert.equal(book3Blueprint.bookCode, 'BOOK-3');
assert.equal(book3Blueprint.contract, 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v3.0.0');

const projectedCodes = new Set([
  ...book2Blueprint.nodes.map(node => node.nodeCode),
  ...book3Blueprint.nodes.map(node => node.nodeCode)
]);
assert.deepEqual(projectedCodes, new Set(historicalBook2Population.map(node => node.nodeCode)));

for (let index = 1; index <= 13; index += 1) {
  const nodeCode = `KN-B1-P5-${String(index).padStart(3, '0')}`;
  assert.ok(projectedCodes.has(nodeCode));
  assert.ok(ownership.nodes.some(node => node.nodeCode === nodeCode));
}

for (const blueprint of [book2Blueprint, book3Blueprint]) {
  assert.equal(blueprint.productionPolicy.articleGenerationAllowed, false);
  assert.equal(blueprint.productionPolicy.candidateGenerationAllowed, false);
  assert.equal(blueprint.productionPolicy.productionReadyPromotionAllowed, false);
  assert.equal(blueprint.registryCompletion.canonicalSemanticReconciliationComplete, false);
}

console.log('✓ KH-W4B.5 Book 2 Canonical source population remains preserved.');
console.log('✓ KAU-R0 projection: P5 65 / P6 58 / P7 57 → BOOK-2; P8 47 / P9 39 → BOOK-3.');
console.log('✓ All 266 historical identities remain exactly once; Production boundary remains closed.');
