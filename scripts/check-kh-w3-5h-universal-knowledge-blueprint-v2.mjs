import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BLUEPRINT_SCHEMA_VERSION,
  deriveFrozenBlueprintCardinality,
  loadKnowledgeBlueprintDirectory
} from './lib/knowledge-blueprint/blueprint-loader.mjs';

const root = process.cwd();
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

const [knowledge, freeze, registry, schema] = await Promise.all([
  loadKnowledgeBlueprintDirectory(root),
  readJson('docs/knowledge/kh-w3-5g-book-i-knowledge-blueprint-freeze-v1.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/blueprints/schemas/knowledge-blueprint-v2.schema.json')
]);

assert.equal(schema.properties.schemaVersion.const, BLUEPRINT_SCHEMA_VERSION);
assert(knowledge.books.length > 0, 'At least one Knowledge Blueprint is required.');

for (const book of knowledge.books) {
  assert.equal(book.schemaVersion, BLUEPRINT_SCHEMA_VERSION);
  assert.equal(book.cardinality.canonicalNodeCount, book.nodes.length);
  assert.equal(
    book.parts.reduce((sum, part) => sum + part.canonicalNodeCount, 0),
    book.cardinality.canonicalNodeCount
  );
  const nodeCodes = new Set(book.nodes.map(node => node.nodeCode));
  assert.equal(nodeCodes.size, book.nodes.length, `${book.bookCode} has duplicate Node Codes.`);
  for (const part of book.parts) {
    assert.equal(part.nodes.length, part.canonicalNodeCount);
    for (const nodeCode of part.nodes) {
      assert(nodeCodes.has(nodeCode), `${part.partCode} references unknown Node ${nodeCode}.`);
    }
  }
}

const frozen = deriveFrozenBlueprintCardinality(freeze);
const book1 = knowledge.byBookCode.get('BOOK-1');
assert(book1, 'BOOK-1 Blueprint is required.');
assert.equal(freeze.totals.bookICanonicalNodes, frozen.canonicalNodeCount);
assert.equal(book1.cardinality.canonicalNodeCount, frozen.canonicalNodeCount);
for (const [partCode, count] of Object.entries(frozen.nodesByPart)) {
  assert.equal(book1.cardinality.nodesByPart[partCode], count);
}

const registryCodes = new Set(registry.nodes.map(node => node.nodeCode));
const blueprintCodes = new Set(knowledge.nodes.map(node => node.nodeCode));
assert.deepEqual([...registryCodes].sort(), [...blueprintCodes].sort());

console.log('✓ KH-W3.5H Universal Knowledge Blueprint Schema v2 passed.');
console.log(`  ${knowledge.totals.books} Book Blueprint(s), ${knowledge.totals.parts} Parts and ${knowledge.totals.nodes} Canonical Nodes are derived from source arrays.`);
console.log('  Historical KH-W3.5G freeze evidence remains immutable and reconciles through canonicalNodePlan.');
console.log('  Registry Node identity equals normalized Blueprint Node identity; no production state was created.');
console.log('  State: KH-W3.5H-v2.0.0-Foundation-Ready.');
