import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const nodes = await readJson('content/knowledge/registry/nodes.json');
const blueprint = await readJson(
  'content/knowledge/blueprints/book-2-knowledge-blueprint.json'
);
const ownership = await readJson(
  'content/knowledge/migrations/node-publication-ownership-v2.json'
);

const book2Nodes = nodes.nodes.filter(
  node => node.publicationBookCode === 'BOOK-2' &&
    ['P5','P6','P7','P8','P9'].includes(node.publicationPartCode)
);

assert.equal(book2Nodes.length, 266);
assert.equal(new Set(book2Nodes.map(node => node.nodeCode)).size, 266);
assert.deepEqual(
  blueprint.parts.map(part => [part.partCode, part.canonicalNodeCount]),
  [['P5',65],['P6',58],['P7',57],['P8',47],['P9',39]]
);
assert.equal(blueprint.nodes.length, 266);
assert.equal(blueprint.plannedCanonicalNodes, 266);
assert.equal(blueprint.productionPolicy.articleGenerationAllowed, false);
assert.equal(blueprint.productionPolicy.candidateGenerationAllowed, false);
assert.equal(blueprint.productionPolicy.productionReadyPromotionAllowed, false);

for (const node of book2Nodes) {
  assert.match(node.nodeCode, /^KN-(?:B1-P5|B2-P[6-9])-\d{3}$/);
  assert.ok(['planned','draft'].includes(node.registryStatus));
  assert.equal(node.productionReady, false);
  assert.equal(node.articleStatus, 'not_created');
  assert.equal(node.candidateStatus, 'not_created');
  assert.equal(node.crossSessionNode.enabled, true);
  assert.ok(Array.isArray(node.dependencies));
  assert.ok(node.relationships);
  assert.equal(node.publicationBookCode, 'BOOK-2');
}

for (let index = 1; index <= 13; index += 1) {
  const nodeCode = `KN-B1-P5-${String(index).padStart(3, '0')}`;
  assert.ok(book2Nodes.some(node => node.nodeCode === nodeCode));
  assert.ok(ownership.nodes.some(node => node.nodeCode === nodeCode));
}

const forbiddenStatuses = new Set([
  'production_ready','review_ready','approved','published'
]);
assert.equal(
  book2Nodes.some(node => forbiddenStatuses.has(node.registryStatus)),
  false
);

console.log('✓ KH-W4B.5 Book 2 Canonical Node Registry passed.');
console.log('✓ P5 65 / P6 58 / P7 57 / P8 47 / P9 39.');
console.log('✓ 266 permanent node identities with cross-session relationships.');
console.log('✓ Production boundary remains closed until KH-W4K.');
