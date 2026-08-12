import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const readJson = async path => JSON.parse(await fs.readFile(path,'utf8'));
const [nodes, book4Blueprint, book5Blueprint, registry, acceptance] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/book-4-knowledge-blueprint.json'),
  readJson('content/knowledge/blueprints/book-5-knowledge-blueprint.json'),
  readJson('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/contracts/book-4-canonical-node-registry-acceptance-v1.json')
]);

// Historical BOOK-4 source identities remain unchanged in Canonical Registry.
const historicalBook4Population = nodes.nodes.filter(node =>
  node.publicationBookCode === 'BOOK-4' && ['P13','P14','P15'].includes(node.publicationPartCode)
);
assert.equal(historicalBook4Population.length,198);
assert.equal(new Set(historicalBook4Population.map(node=>node.nodeCode)).size,198);
assert.equal(acceptance.bookCanonicalNodeCount,198);
for (const node of historicalBook4Population) {
  assert.match(node.nodeCode,/^KN-B4-P(?:13|14|15)-\d{3}$/);
  assert.ok(node.chapterCode && node.partCode && node.canonicalQuestionKey);
  assert.equal(node.sourceBookCode,'BOOK-4');
  assert.ok(node.relationships && Array.isArray(node.dependencies));
  assert.ok(node.crossSessionNode);
  assert.ok(Object.hasOwn(node,'previousNodeCode'));
  assert.ok(Object.hasOwn(node,'nextNodeCode'));
  assert.ok(['planned','draft'].includes(node.registryStatus));
  assert.equal(node.productionReady,false);
  assert.equal(node.articleStatus,'not_created');
  assert.equal(node.candidateStatus,'not_created');
  assert.equal(node.productionQueue,'not_scheduled');
  assert.equal(node.publicationPriority,'not_scheduled');
}

// KAU-R0 current projection: BOOK-4=P10–P12; BOOK-5=P13–P15.
assert.deepEqual(book4Blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),[['P10',77],['P11',64],['P12',46]]);
assert.equal(book4Blueprint.nodes.length,187);
assert.deepEqual(book5Blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),[['P13',75],['P14',52],['P15',71]]);
assert.equal(book5Blueprint.nodes.length,198);
assert.equal(book5Blueprint.contract,'PHI-OS-BOOK-5-KNOWLEDGE-BLUEPRINT-v1.0.0');
assert.deepEqual(
  new Set(book5Blueprint.nodes.map(node=>node.nodeCode)),
  new Set(historicalBook4Population.map(node=>node.nodeCode))
);
assert.equal(registry.totals.canonicalNodes,nodes.nodes.length);
assert.equal(nodes.nodes.length,716);
assert.equal(registry.books.find(entry=>entry.bookCode==='BOOK-5')?.canonicalNodeCount,198);

assert.equal(new Set(nodes.nodes.map(n=>n.canonicalQuestionKey)).size,nodes.nodes.length);
const byCode=new Map(nodes.nodes.map(n=>[n.nodeCode,n]));
assert.equal(byCode.get('KN-B3-P12-045').nextNodeCode,'KN-B4-P13-001');
assert.equal(byCode.get('KN-B4-P13-075').nextNodeCode,'KN-B4-P14-001');
assert.equal(byCode.get('KN-B4-P14-052').nextNodeCode,'KN-B4-P15-001');
assert.equal(byCode.get('KN-B4-P15-071').nextNodeCode,null);
// Historical closureRole is deliberately preserved until KAU-R2+ semantic reconciliation.
assert.equal(byCode.get('KN-B4-P15-071').closureRole,'four_volume_finale');

console.log('✓ KH-W4B.5 historical BOOK-4 Canonical source population remains preserved.');
console.log('✓ P13 75 / P14 52 / P15 71 = 198 identities now project through BOOK-5.');
console.log('✓ Current BOOK-4 projects P10–P12; no Article/Candidate/Readiness/Approval/Publication state was promoted.');
