import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path,'utf8'));
const nodes = await readJson('content/knowledge/registry/nodes.json');
const blueprint = await readJson('content/knowledge/blueprints/book-3-knowledge-blueprint.json');
const normalization = await readJson('content/knowledge/contracts/book-3-registry-normalization-v1.json');

const book3 = nodes.nodes.filter(node =>
  node.publicationBookCode === 'BOOK-3' &&
  ['P10','P11','P12'].includes(node.publicationPartCode)
);

assert.equal(book3.length,182);
assert.equal(new Set(book3.map(node=>node.nodeCode)).size,182);
assert.deepEqual(
  blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),
  [['P10',77],['P11',60],['P12',45]]
);
assert.equal(blueprint.nodes.length,182);
assert.equal(blueprint.plannedCanonicalNodes,182);
assert.equal(normalization.status,'frozen');

for (const node of book3) {
  assert.match(node.nodeCode,/^KN-B3-P(?:10|11|12)-\d{3}$/);
  assert.ok(['planned','draft'].includes(node.registryStatus));
  assert.equal(node.productionReady,false);
  assert.equal(node.articleStatus,'not_created');
  assert.equal(node.candidateStatus,'not_created');
  assert.equal(node.crossSessionNode.enabled,true);
  assert.ok(Array.isArray(node.dependencies));
  assert.ok(node.relationships);
  assert.equal(node.sourceBookCode,'BOOK-3');
  assert.equal(node.publicationBookCode,'BOOK-3');
}

assert.equal(book3.some(node=>node.titleEn==='Civilization Transition Selection'),true);
assert.equal(book3.some(node=>node.titleEn==='Compression Runtime'),true);
assert.equal(book3.some(node=>node.titleEn==='Civilization Future Extraction'),true);
assert.equal(book3.some(node=>node.titleEn==='Civilization Diffusion'),true);

const forbidden = new Set(['production_ready','review_ready','approved','published']);
assert.equal(book3.some(node=>forbidden.has(node.registryStatus)),false);

console.log('✓ KH-W4B.5 Book 3 Canonical Node Registry passed.');
console.log('✓ P10 77 / P11 60 / P12 45 / Total 182.');
console.log('✓ Canonical naming, dependencies and cross-session graph passed.');
console.log('✓ Production boundary remains closed until KH-W4K.');
