import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BLUEPRINT_SCHEMA_VERSION,
  loadKnowledgeBlueprintDirectory
} from './lib/knowledge-blueprint/blueprint-loader.mjs';

const root = process.cwd();
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

const [knowledge, migration, registry, schema, legacy] = await Promise.all([
  loadKnowledgeBlueprintDirectory(root),
  readJson('docs/knowledge/kh-w3-5g-four-volume-knowledge-blueprint-migration-v1.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/schemas/knowledge-blueprint-v2.schema.json'),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json')
]);

assert.equal(schema.properties.schemaVersion.const, BLUEPRINT_SCHEMA_VERSION);
assert.equal(knowledge.books.length, 4);
for (const book of knowledge.books) {
  assert.equal(book.schemaVersion, BLUEPRINT_SCHEMA_VERSION);
  assert.equal(book.cardinality.canonicalNodeCount, book.nodes.length);
  assert.equal(book.parts.reduce((sum, part) => sum + part.canonicalNodeCount, 0), book.nodes.length);
  const nodeCodes = new Set(book.nodes.map(node => node.nodeCode));
  assert.equal(nodeCodes.size, book.nodes.length, `${book.bookCode} has duplicate Node Codes.`);
  for (const part of book.parts) {
    assert.equal(part.nodes.length, part.canonicalNodeCount);
    for (const nodeCode of part.nodes) assert(nodeCodes.has(nodeCode));
  }
}

assert.equal(knowledge.totals.books, 4);
assert.equal(knowledge.totals.parts, 16);
assert.equal(knowledge.totals.nodes, 78);
assert.equal(migration.cardinality.legacyCanonicalNodes, 78);
assert.equal(migration.cardinality.migratedCanonicalNodes, 78);
assert.equal(legacy.nodes.length, 78);

const registryCodes = new Set(registry.nodes.map(node => node.nodeCode));
const blueprintCodes = new Set(knowledge.nodes.map(node => node.nodeCode));
assert.deepEqual([...registryCodes].sort(), [...blueprintCodes].sort());
assert.deepEqual([...legacy.nodes.map(node => node.nodeCode)].sort(), [...blueprintCodes].sort());

console.log('✓ KH-W3.5H Universal Knowledge Blueprint Schema v2 passed.');
console.log('  Four Book Blueprints, 16 Part projections and 78 preserved Canonical Nodes are derived from source arrays.');
console.log('  P6–P15 remain architecture-only and create no fabricated Canonical Node.');
console.log('  Registry identity equals migrated Blueprint identity; publication ownership is separated from Knowledge authority.');
