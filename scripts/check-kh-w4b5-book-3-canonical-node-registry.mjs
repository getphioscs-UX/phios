import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path,'utf8'));
const [nodes, book3Blueprint, book4Blueprint, normalization, migration, blueprintRegistry] =
  await Promise.all([
    readJson('content/knowledge/registry/nodes.json'),
    readJson('content/knowledge/blueprints/book-3-knowledge-blueprint.json'),
    readJson('content/knowledge/blueprints/book-4-knowledge-blueprint.json'),
    readJson('content/knowledge/contracts/book-3-registry-normalization-v1.json'),
    readJson('content/knowledge/migrations/book-3-final-outline-migration-v1.json'),
    readJson('content/knowledge/blueprints/blueprint-registry.json')
  ]);

// Historical BOOK-3 source identities are retained in Canonical Registry.
const historicalBook3Population = nodes.nodes.filter(node =>
  node.publicationBookCode === 'BOOK-3' &&
  ['P10','P11','P12'].includes(node.publicationPartCode)
);
assert.equal(historicalBook3Population.length,187);
assert.equal(new Set(historicalBook3Population.map(node=>node.nodeCode)).size,187);
assert.equal(normalization.status,'frozen');
assert.equal(normalization.contract,'KH-W4B.5-BOOK-3-REGISTRY-NORMALIZATION-v2');
assert.equal(migration.status,'frozen');
assert.equal(migration.identityChanges.length > 0,true);

for (const node of historicalBook3Population) {
  assert.match(node.nodeCode,/^KN-B3-P(?:10|11|12)-\d{3}$/);
  assert.ok(['planned','draft'].includes(node.registryStatus));
  assert.equal(node.productionReady,false);
  assert.equal(node.articleStatus,'not_created');
  assert.equal(node.candidateStatus,'not_created');
  assert.equal(node.crossSessionNode.enabled,true);
  assert.ok(Array.isArray(node.dependencies));
  assert.ok(node.relationships);
  assert.equal(node.sourceBookCode,'BOOK-3');
}

const carrier = historicalBook3Population.find(node=>node.nodeCode==='KN-B3-P12-046');
assert.ok(carrier);
assert.equal(carrier.chapterCode,'12.0');
assert.equal(carrier.titleEn,'Carrier Archetypes');
assert.equal(carrier.supportingDimensions.length,10);
assert(carrier.legacyNodeCodes.includes('BOOK-1:4.64'));

const initialization = historicalBook3Population.find(node=>node.chapterCode==='10.3');
assert.ok(initialization);
assert.equal(initialization.titleEn,'Runtime Initialization');
assert.equal(initialization.supportingDimensions.length,4);

// KAU-R0: current BOOK-3 is Continuity P8–P9; historical BOOK-3 P10–P12 projects to BOOK-4.
assert.deepEqual(book3Blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),[['P8',47],['P9',39]]);
assert.equal(book3Blueprint.nodes.length,86);
assert.deepEqual(book4Blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),[['P10',77],['P11',64],['P12',46]]);
assert.equal(book4Blueprint.nodes.length,187);
assert.equal(book4Blueprint.contract,'PHI-OS-BOOK-4-KNOWLEDGE-BLUEPRINT-v3.0.0');
assert.deepEqual(
  new Set(book4Blueprint.nodes.map(node=>node.nodeCode)),
  new Set(historicalBook3Population.map(node=>node.nodeCode))
);

const book4Entry = blueprintRegistry.books.find(entry=>entry.bookCode==='BOOK-4');
assert.ok(book4Entry);
assert.equal(book4Entry.canonicalNodeCount,187);
assert.deepEqual(book4Entry.partCodes,['P10','P11','P12']);
assert.equal(blueprintRegistry.totals.canonicalNodes,nodes.nodes.length);
assert.equal(nodes.nodes.length,716);

const forbidden = new Set(['production_ready','review_ready','approved','published']);
assert.equal(historicalBook3Population.some(node=>forbidden.has(node.registryStatus)),false);

console.log('✓ KH-W4B.5 historical BOOK-3 Canonical source population remains preserved.');
console.log('✓ P10 77 / P11 64 / P12 46 = 187 identities now project through BOOK-4.');
console.log('✓ Current BOOK-3 projects P8/P9 only; no Canonical identity or Production state was rewritten.');
