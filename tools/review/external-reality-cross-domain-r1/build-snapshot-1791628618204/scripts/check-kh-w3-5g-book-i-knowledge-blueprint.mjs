import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadKnowledgeBlueprintDirectory } from './lib/knowledge-blueprint/blueprint-loader.mjs';

const root = process.cwd();
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const digest = async relative => crypto
  .createHash('sha256')
  .update((await fs.readFile(path.join(root, relative), 'utf8')).replace(/\r\n?/g, '\n'))
  .digest('hex');

const [knowledge, migration, books, parts, registry, legacy] = await Promise.all([
  loadKnowledgeBlueprintDirectory(root),
  readJson('docs/knowledge/kh-w3-5g-four-volume-knowledge-blueprint-migration-v1.json'),
  readJson('content/registry/books.json'),
  readJson('content/registry/parts.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json')
]);

assert.equal(migration.completionId, 'KH-W3.5G-Four-Volume-Blueprint-Migration-Completed');
assert.equal(migration.status, 'four_volume_blueprint_frozen');
assert.equal(migration.migrationBoundary.canonicalNodeCodeChanged, false);
assert.equal(migration.migrationBoundary.canonicalNodeCountChanged, false);
assert.equal(migration.migrationBoundary.canonicalMeaningChanged, false);
assert.equal(migration.migrationBoundary.publicationOwnershipChanged, true);
assert.equal(migration.migrationBoundary.productionStateCreated, false);
assert.equal(migration.migrationBoundary.publicContentPublished, false);

assert.equal(knowledge.books.length, 4);
assert.deepEqual(knowledge.books.map(book => book.bookCode), ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4']);
assert.deepEqual(
  Object.fromEntries(knowledge.books.map(book => [book.bookCode, book.parts.map(part => part.partCode)])),
  migration.bookOwnership
);

const expectedBookParts = Object.fromEntries(books.books.map(book => [
  `BOOK-${book.volume}`,
  [...(book.cross_volume_sections?.includes('part-0-core-language') ? ['P0'] : []), ...book.parts.map(number => `P${number}`)]
]));
assert.deepEqual(migration.bookOwnership, expectedBookParts);

const registryPartOwners = Object.fromEntries(parts.parts.map(part => [`P${part.number}`, `BOOK-${Number(part.book.replace('book-', ''))}`]));
for (const [bookCode, partCodes] of Object.entries(migration.bookOwnership)) {
  for (const partCode of partCodes.filter(code => code !== 'P0')) {
    assert.equal(registryPartOwners[partCode], bookCode, `${partCode} ownership mismatch.`);
  }
}

const legacyCodes = legacy.nodes.map(node => node.nodeCode);
const migratedCodes = knowledge.nodes.map(node => node.nodeCode);
assert.equal(legacyCodes.length, 78);
assert.equal(migratedCodes.length, 78);
assert.deepEqual([...migratedCodes].sort(), [...legacyCodes].sort());
assert.equal(new Set(migratedCodes).size, 78);

const registryCodes = registry.nodes.map(node => node.nodeCode);
assert.deepEqual([...migratedCodes].sort(), [...registryCodes].sort());

const book1 = knowledge.byBookCode.get('BOOK-1');
const book2 = knowledge.byBookCode.get('BOOK-2');
const book3 = knowledge.byBookCode.get('BOOK-3');
const book4 = knowledge.byBookCode.get('BOOK-4');
assert.equal(book1.contract, 'PHI-OS-BOOK-1-KNOWLEDGE-BLUEPRINT-v2.0.0');
assert.equal(book1.cardinality.canonicalNodeCount, 65);
assert.equal(book2.cardinality.canonicalNodeCount, 13);
assert.equal(book3.cardinality.canonicalNodeCount, 0);
assert.equal(book4.cardinality.canonicalNodeCount, 0);
assert.deepEqual(book1.cardinality.nodesByPart, { P0: 13, P1: 12, P2: 13, P3: 15, P4: 12 });
assert.deepEqual(book2.cardinality.nodesByPart, { P5: 13, P6: 0, P7: 0, P8: 0, P9: 0 });
assert.deepEqual(book3.cardinality.nodesByPart, { P10: 0, P11: 0, P12: 0 });
assert.deepEqual(book4.cardinality.nodesByPart, { P13: 0, P14: 0, P15: 0 });
assert(book1.nodes.every(node => node.partCode !== 'P5'));
assert(book2.nodes.every(node => node.partCode === 'P5'));
assert.equal(book1.activeProductionLimit, 8);
assert.equal(book2.activeProductionLimit, 3);
assert(book3.nodes.length === 0 && book4.nodes.length === 0, 'Architecture-only books must not fabricate Nodes.');

for (const evidence of migration.blueprints) {
  assert.equal(await digest(evidence.path), evidence.sha256, `Blueprint digest changed: ${evidence.path}`);
}

console.log('✓ KH-W3.5G Four-Volume Knowledge Blueprint Migration passed.');
console.log('  BOOK-1 P0–P4: 65 Nodes; BOOK-2 P5–P9: 13 Nodes; BOOK-3/4 remain architecture-only.');
console.log('  All 78 Canonical Node identities are preserved exactly once; no new production state was created.');
console.log('  State: KH-W3.5G-Four-Volume-Blueprint-Migration-Completed.');
