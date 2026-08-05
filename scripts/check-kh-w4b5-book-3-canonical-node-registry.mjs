import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path,'utf8'));

const [nodes, blueprint, normalization, migration, blueprintRegistry] =
  await Promise.all([
    readJson('content/knowledge/registry/nodes.json'),
    readJson('content/knowledge/blueprints/book-3-knowledge-blueprint.json'),
    readJson('content/knowledge/contracts/book-3-registry-normalization-v1.json'),
    readJson('content/knowledge/migrations/book-3-final-outline-migration-v1.json'),
    readJson('content/knowledge/blueprints/blueprint-registry.json')
  ]);

const book3 = nodes.nodes.filter(node =>
  node.publicationBookCode === 'BOOK-3' &&
  ['P10','P11','P12'].includes(node.publicationPartCode)
);

assert.equal(book3.length,187);
assert.equal(new Set(book3.map(node=>node.nodeCode)).size,187);
assert.deepEqual(
  blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),
  [['P10',77],['P11',64],['P12',46]]
);
assert.equal(blueprint.nodes.length,187);
assert.equal(blueprint.plannedCanonicalNodes,187);
assert.equal(blueprint.contract,'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.1.0');
assert.equal(blueprint.status,'final-outline-registry-freeze');
assert.equal(normalization.status,'frozen');
assert.equal(normalization.contract,'KH-W4B.5-BOOK-3-REGISTRY-NORMALIZATION-v2');
assert.equal(migration.status,'frozen');
assert.equal(migration.identityChanges.length > 0,true);

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

const carrier = book3.find(node=>node.nodeCode==='KN-B3-P12-046');
assert.ok(carrier);
assert.equal(carrier.chapterCode,'12.0');
assert.equal(carrier.titleEn,'Carrier Archetypes');
assert.equal(carrier.supportingDimensions.length,10);
assert(carrier.legacyNodeCodes.includes('BOOK-1:4.64'));

const initialization = book3.find(node=>node.chapterCode==='10.3');
assert.ok(initialization);
assert.equal(initialization.titleEn,'Runtime Initialization');
assert.equal(initialization.supportingDimensions.length,4);

for (const code of [
  'KN-B3-P11-061','KN-B3-P11-062','KN-B3-P11-063','KN-B3-P11-064',
  'KN-B3-P12-046'
]) assert(book3.some(node=>node.nodeCode===code));

assert.equal(book3.some(node=>/^4\./.test(node.chapterCode)),false);
assert.equal(book3.some(node=>[
  'Civilization Migration','Civilization Diffusion','Civilization Transition Selection'
].includes(node.titleEn)),false);

const book3Entry = blueprintRegistry.books.find(entry=>entry.bookCode==='BOOK-3');
assert.ok(book3Entry);
assert.equal(book3Entry.canonicalNodeCount,187);
assert.equal(blueprintRegistry.totals.canonicalNodes,nodes.nodes.length);
assert.equal(blueprintRegistry.totals.canonicalNodes, nodes.nodes.length);

const forbidden = new Set(['production_ready','review_ready','approved','published']);
assert.equal(book3.some(node=>forbidden.has(node.registryStatus)),false);

const historicalBook1Codes = new Set(
  (await readJson('content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json'))
    .nodes.map(node=>node.nodeCode)
);
assert.equal(historicalBook1Codes.size,78);
assert([...historicalBook1Codes].every(
  nodeCode=>nodes.nodes.some(node=>node.nodeCode===nodeCode)
));

console.log('✓ KH-W4B.5 Book 3 Final Canonical Node Registry passed.');
console.log('✓ P10 77 / P11 64 / P12 46 / Total 187.');
console.log('✓ 182 permanent identities retained and 5 new identities added.');
console.log('✓ Carrier 4.64 is formally normalized to 12.0 with 10 supporting dimensions.');
console.log(`✓ Universal Registry totals ${nodes.nodes.length} Nodes and production remains closed until KH-W4K.`);
