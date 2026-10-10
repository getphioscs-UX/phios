import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const [nodes, book2Blueprint, book3Blueprint, ownership] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/book-2-knowledge-blueprint.json'),
  readJson('content/knowledge/blueprints/book-3-knowledge-blueprint.json'),
  readJson('content/knowledge/migrations/node-publication-ownership-v2.json')
]);

// KH-W4B.5 predecessor identities remain immutable lineage even after a governed KAU-R5 successor.
const currentBook2SourcePopulation = nodes.nodes.filter(
  node => node.publicationBookCode === 'BOOK-2' &&
    ['P5', 'P6', 'P7', 'P8', 'P9'].includes(node.publicationPartCode)
);
const r5Active = nodes.nodes.some(node => node.nodeCode === 'KN-B2-P7-058') && nodes.nodes.some(node => node.nodeCode === 'KN-B2-P7-059');
const predecessorBook2Population = currentBook2SourcePopulation.filter(node => !['KN-B2-P7-058','KN-B2-P7-059'].includes(node.nodeCode));
assert.equal(predecessorBook2Population.length, 266);
assert.equal(new Set(predecessorBook2Population.map(node => node.nodeCode)).size, 266);
assert.equal(currentBook2SourcePopulation.length, r5Active ? 268 : 266);
for (const node of predecessorBook2Population) {
  assert.match(node.nodeCode, /^KN-(?:B1-P5|B2-P[6-9])-\d{3}$/);
  assert.ok(r5Active ? ['planned', 'draft', 'deprecated', 'rehome_pending'].includes(node.registryStatus) : ['planned', 'draft'].includes(node.registryStatus));
  assert.equal(node.productionReady, false);
  assert.equal(node.articleStatus, 'not_created');
  assert.equal(node.candidateStatus, 'not_created');
  if (!['deprecated','rehome_pending'].includes(node.registryStatus)) assert.equal(node.crossSessionNode.enabled, true);
  assert.ok(Array.isArray(node.dependencies));
  assert.ok(node.relationships);
}

// KAU-R0 changes publication projection only: P5–P7 remain BOOK-2; P8–P9 move to BOOK-3.
assert.deepEqual(
  book2Blueprint.parts.map(part => [part.partCode, part.canonicalNodeCount]),
  r5Active ? [['P5', 65], ['P6', 58], ['P7', 59]] : [['P5', 65], ['P6', 58], ['P7', 57]]
);
assert.equal(book2Blueprint.nodes.length, r5Active ? 182 : 180);
assert.equal(book2Blueprint.plannedCanonicalNodes, r5Active ? 182 : 180);
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
assert.deepEqual(projectedCodes, new Set(currentBook2SourcePopulation.map(node => node.nodeCode)));

for (let index = 1; index <= 13; index += 1) {
  const nodeCode = `KN-B1-P5-${String(index).padStart(3, '0')}`;
  assert.ok(projectedCodes.has(nodeCode));
  assert.ok(ownership.nodes.some(node => node.nodeCode === nodeCode));
}

for (const blueprint of [book2Blueprint, book3Blueprint]) {
  assert.equal(blueprint.productionPolicy.articleGenerationAllowed, false);
  assert.equal(blueprint.productionPolicy.candidateGenerationAllowed, false);
  assert.equal(blueprint.productionPolicy.productionReadyPromotionAllowed, false);
}
assert.equal(book2Blueprint.registryCompletion.canonicalSemanticReconciliationComplete, r5Active);
assert.equal(book3Blueprint.registryCompletion.canonicalSemanticReconciliationComplete, false);

console.log('✓ KH-W4B.5 Book 2 Canonical source population remains preserved.');
console.log(r5Active ? '✓ KAU-R5 successor projection: P5 65 / P6 58 / P7 59 → BOOK-2; P8 47 / P9 39 → BOOK-3.' : '✓ KAU-R0 projection: P5 65 / P6 58 / P7 57 → BOOK-2; P8 47 / P9 39 → BOOK-3.');
console.log(r5Active ? '✓ All 266 predecessor identities remain preserved plus 2 human-authorized P7 additions; Production boundary remains closed.' : '✓ All 266 historical identities remain exactly once; Production boundary remains closed.');
