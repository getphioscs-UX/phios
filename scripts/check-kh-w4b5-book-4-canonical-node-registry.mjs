import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const readJson = async path => JSON.parse(await fs.readFile(path,'utf8'));
const [nodes, blueprint, registry, acceptance] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/book-4-knowledge-blueprint.json'),
  readJson('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/contracts/book-4-canonical-node-registry-acceptance-v1.json')
]);
const book4 = nodes.nodes.filter(node => node.publicationBookCode === 'BOOK-4');
assert.equal(book4.length,198);
assert.equal(new Set(book4.map(node=>node.nodeCode)).size,198);
assert.deepEqual(blueprint.parts.map(part=>[part.partCode,part.canonicalNodeCount]),[['P13',75],['P14',52],['P15',71]]);
assert.equal(blueprint.nodes.length,198);
assert.equal(blueprint.plannedCanonicalNodes,198);
assert.equal(blueprint.contract,'PHI-OS-BOOK-4-KNOWLEDGE-BLUEPRINT-v2.0.0');
assert.equal(blueprint.schemaVersion,'PHI-OS-KNOWLEDGE-BLUEPRINT-v2.0.0');
assert.equal(blueprint.status,'final-outline-registry-freeze');
assert.equal(registry.totals.canonicalNodes,nodes.nodes.length);
assert.equal(nodes.nodes.length,716);
assert.equal(acceptance.bookCanonicalNodeCount,198);
for (const node of book4) {
  assert.match(node.nodeCode,/^KN-B4-P(?:13|14|15)-\d{3}$/);
  assert.ok(node.chapterCode && node.partCode && node.canonicalQuestionKey);
  assert.equal(node.sourceBookCode,'BOOK-4');
  assert.equal(node.publicationBookCode,'BOOK-4');
  assert.equal(node.publicationPartCode,node.partCode);
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
assert.equal(new Set(nodes.nodes.map(n=>n.canonicalQuestionKey)).size,nodes.nodes.length);
const byCode=new Map(nodes.nodes.map(n=>[n.nodeCode,n]));
assert.equal(byCode.get('KN-B3-P12-045').nextNodeCode,'KN-B4-P13-001');
assert.equal(byCode.get('KN-B4-P13-075').nextNodeCode,'KN-B4-P14-001');
assert.equal(byCode.get('KN-B4-P14-052').nextNodeCode,'KN-B4-P15-001');
assert.equal(byCode.get('KN-B4-P15-071').nextNodeCode,null);
assert.equal(byCode.get('KN-B4-P15-071').closureRole,'four_volume_finale');
assert.deepEqual(byCode.get('KN-B4-P13-015').supportingDimensions.map(x=>x.titleEn),['Event','Behavioral','Relational','Organizational','Biological','Environmental','Financial','Digital']);
assert.deepEqual(byCode.get('KN-B4-P13-037').supportingDimensions.map(x=>x.titleEn),['Origin','Condition','Response','Spread','Cost','Tension']);
assert.deepEqual(byCode.get('KN-B4-P13-043').supportingDimensions.map(x=>x.titleEn),['Grammar','Runtime','Carrier','Configuration','Continuity']);
assert.deepEqual(byCode.get('KN-B4-P15-002').legacyChapterReferences,['BOOK-1:4.48']);
assert.deepEqual(byCode.get('KN-B4-P15-045').legacyChapterReferences,['BOOK-1:4.47']);
for (const code of ['KN-B4-P13-007','KN-B4-P14-011','KN-B4-P13-069','KN-B4-P14-002','KN-B4-P14-048','KN-B4-P15-064','KN-B4-P13-006','KN-B4-P15-019']) assert.ok(byCode.get(code).mechanismScope);
console.log('✓ KH-W4B.5 Book 4 Canonical Node Registry passed.');
console.log('✓ P13 75 / P14 52 / P15 71 = 198 BOOK-4 nodes; Universal Registry = 716.');
console.log('✓ No Article, Candidate, Readiness, Review, Approval or Publication state was promoted.');
