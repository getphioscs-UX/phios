import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BLUEPRINT_REGISTRY_VERSION,
  loadKnowledgeBlueprintRegistry,
  resolveKnowledgeBlueprintForNode,
  resolveKnowledgeBlueprintForPart
} from './lib/knowledge-blueprint/blueprint-registry-loader.mjs';

const root = process.cwd();
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

const [knowledge, nodes, books, parts, freeze] = await Promise.all([
  loadKnowledgeBlueprintRegistry(root),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/registry/books.json'),
  readJson('content/registry/parts.json'),
  readJson('docs/knowledge/kh-w4a-knowledge-runtime-v2-freeze.json')
]);

assert.equal(knowledge.registry.contract, BLUEPRINT_REGISTRY_VERSION);
assert.equal(knowledge.registry.status, 'frozen');
assert.equal(knowledge.registry.policies.directSingleBookAssumptionDeprecated, true);
assert.equal(knowledge.registry.policies.registryRequiredForProduction, true);
assert.equal(knowledge.registry.policies.failClosedOnDigestMismatch, true);
assert.deepEqual(knowledge.books.map(book => book.bookCode), ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']);
const currentCanonicalNodeCount = nodes.nodes.length;
assert.deepEqual(knowledge.totals, {
  books: 5,
  parts: 16,
  nodes: currentCanonicalNodeCount
});
assert.deepEqual(knowledge.registry.totals, {
  books: 5,
  parts: 16,
  canonicalNodes: currentCanonicalNodeCount
});

const expectedBookParts = Object.fromEntries(books.books.map(book => [
  `BOOK-${book.volume}`,
  [...(book.cross_volume_sections?.includes('part-0-core-language') ? ['P0'] : []), ...book.parts.map(number => `P${number}`)]
]));
const actualBookParts = Object.fromEntries(knowledge.books.map(book => [book.bookCode, book.parts.map(part => part.partCode)]));
assert.deepEqual(actualBookParts, expectedBookParts);

const registryPartOwners = Object.fromEntries(parts.parts.map(part => [
  `P${part.number}`,
  `BOOK-${Number(part.book.replace('book-', ''))}`
]));
for (const [partCode, projected] of knowledge.byPartCode) {
  if (partCode !== 'P0') assert.equal(projected.bookCode, registryPartOwners[partCode]);
}

const canonicalCodes = nodes.nodes.map(node => node.nodeCode).sort();
const projectedCodes = knowledge.nodes.map(node => node.nodeCode).sort();
assert.deepEqual(projectedCodes, canonicalCodes);
assert.equal(new Set(projectedCodes).size, currentCanonicalNodeCount);
assert.equal(knowledge.byBookCode.get('BOOK-1').cardinality.canonicalNodeCount, 65);
assert.equal(knowledge.byBookCode.get('BOOK-2').cardinality.canonicalNodeCount, 180);
assert.equal(knowledge.byBookCode.get('BOOK-3').cardinality.canonicalNodeCount, 86);
assert.equal(knowledge.byBookCode.get('BOOK-4').cardinality.canonicalNodeCount, 187);
assert.equal(knowledge.byBookCode.get('BOOK-5').cardinality.canonicalNodeCount, 198);
assert.equal((await resolveKnowledgeBlueprintForNode(root, 'KN-B1-P5-001', { knowledge })).bookCode, 'BOOK-2');
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'P8', { knowledge })).bookCode, 'BOOK-3');
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'P10', { knowledge })).bookCode, 'BOOK-4');
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'P13', { knowledge })).bookCode, 'BOOK-5');
assert.equal(freeze.completionId, 'KH-W4A-Blueprint-Registry-Loader-Freeze-Completed');
assert.equal(freeze.invariants.canonicalNodeCount, 78);
assert.ok(
  currentCanonicalNodeCount >= freeze.invariants.canonicalNodeCount,
  'Current Registry may extend the historical KH-W4A baseline but must not shrink below it.'
);
assert.equal(freeze.invariants.canonicalNodeCodesChanged, false);
assert.equal(freeze.invariants.canonicalMeaningChanged, false);

console.log('✓ KH-W4A Knowledge Runtime v2 Blueprint Registry and Loader passed.');
console.log(`  Five registered Blueprints project 16 Parts and ${currentCanonicalNodeCount} current Canonical Node identities.`);
console.log('  P5 resolves to BOOK-2; P8 resolves to BOOK-3; P10 resolves to BOOK-4; P13 resolves to BOOK-5.');
console.log('  Legacy single-Book authority is retired; digest mismatch fails closed.');
