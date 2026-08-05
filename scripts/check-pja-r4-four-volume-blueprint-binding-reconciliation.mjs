import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadKnowledgeBlueprintRegistry } from './lib/knowledge-blueprint/blueprint-registry-loader.mjs';
import { loadKnowledgeInventory, resolveKnowledgeScope } from './lib/knowledge-production/readiness-system.mjs';
import { loadCanonicalContext } from './lib/knowledge-production/repository-loader.mjs';

const root = process.cwd();
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const contract = await readJson('docs/pja/pja-r4-four-volume-blueprint-binding-reconciliation-v1.json');
const knowledge = await loadKnowledgeBlueprintRegistry(root);
const inventory = await loadKnowledgeInventory(root);
const nodes = await readJson('content/knowledge/registry/nodes.json');

assert.equal(contract.status, 'frozen');
assert.equal(knowledge.totals.books, contract.invariants.registeredBlueprints);
assert.equal(knowledge.totals.parts, contract.invariants.registeredPartsIncludingPreface);
assert.equal(knowledge.totals.nodes, contract.invariants.canonicalNodes);
assert.equal(nodes.nodes.length, contract.invariants.canonicalNodes);
assert.equal(new Set(knowledge.nodes.map(node => node.nodeCode)).size, knowledge.totals.nodes);
assert.deepEqual(
  new Set(knowledge.nodes.map(node => node.nodeCode)),
  new Set(nodes.nodes.map(node => node.nodeCode))
);
assert.equal(knowledge.byPartCode.get('P5').bookCode, 'BOOK-2');
assert.equal(knowledge.byPartCode.get('P13').bookCode, 'BOOK-4');
assert.equal(knowledge.byNodeCode.get('KN-B1-P5-001').bookCode, 'BOOK-2');
assert.equal(resolveKnowledgeScope(inventory, { scope: 'ALL' }).length, 78);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'BOOK-1' }).length, 65);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'BOOK-2' }).length, 13);
const p5 = await loadCanonicalContext(root, 'KN-B1-P5-001', 'zh-Hans', { requireReadiness: false });
assert.equal(p5.blueprintNode.bookCode, 'BOOK-2');
assert(p5.inputFiles.includes('content/knowledge/blueprints/blueprint-registry.json'));
assert(p5.inputFiles.includes('content/knowledge/blueprints/book-2-knowledge-blueprint.json'));

for (const relative of [
  'scripts/lib/knowledge-production/repository-loader.mjs',
  'scripts/lib/knowledge-production/readiness-system.mjs',
  'scripts/sync-pja-w2f-c1-readiness-skeletons.mjs',
  'scripts/check-pja-w3r1-scalable-article-production.mjs'
]) {
  const source = await read(relative);
  assert(source.includes('blueprint-registry'), `${relative}: registry binding missing`);
}
for (const relative of [
  'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',
  'scripts/check-pja-w2b-structured-article-schema.mjs',
  'scripts/check-pja-w2c-claim-source-review-governance.mjs',
  'scripts/check-pja-w2d-article-renderer-expansion.mjs'
]) {
  const source = await read(relative);
  assert(source.includes('book-1-knowledge-blueprint-v1.3.0.legacy.json'), `${relative}: historical freeze snapshot missing`);
}
for (const entry of knowledge.registry.books) {
  if (entry.productionEligibility === 'architecture_only') {
    assert.equal(entry.canonicalNodeCount, 0);
  }
}
console.log('✓ PJA-R4 Four-Volume Blueprint Binding Reconciliation passed.');
console.log('  4 Blueprints / 16 Part projections / 78 stable Canonical Nodes are registry-bound.');
console.log('  P5 resolves to BOOK-2; historical PJA freezes remain bound to the v1.3.0 legacy snapshot.');
