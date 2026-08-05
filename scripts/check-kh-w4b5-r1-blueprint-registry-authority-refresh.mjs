import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  digestKnowledgeSource,
  verifyKnowledgeBlueprintFreeze
} from './lib/knowledge-blueprint/freeze-contract.mjs';

const root = process.cwd();
const readSource = relative =>
  fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await readSource(relative));

const registry = await readJson(
  'content/knowledge/blueprints/blueprint-registry.json'
);
const freeze = await verifyKnowledgeBlueprintFreeze(root);

assert.equal(registry.books.length, 4);
assert.equal(registry.totals.books, 4);
assert.equal(registry.totals.parts, 16);
const derivedCanonicalNodeTotal = registry.books.reduce(
  (total, entry) => total + entry.canonicalNodeCount,
  0
);
assert.equal(registry.totals.canonicalNodes, derivedCanonicalNodeTotal);

for (const entry of registry.books) {
  const source = await readSource(entry.blueprintPath);
  const blueprint = JSON.parse(source);
  assert.equal(entry.sha256, digestKnowledgeSource(source));
  assert.equal(entry.contract, blueprint.contract);
  assert.equal(entry.schemaVersion, blueprint.schemaVersion);
  assert.equal(entry.status, blueprint.status);
  assert.deepEqual(
    entry.partCodes,
    (blueprint.parts || []).map(part => part.partCode)
  );
  assert.equal(
    entry.canonicalNodeCount,
    Array.isArray(blueprint.nodes)
      ? blueprint.nodes.length
      : (blueprint.parts || []).reduce(
          (total, part) => total + Number(part.canonicalNodeCount || 0),
          0
        )
  );
}

const book2 = registry.books.find(entry => entry.bookCode === 'BOOK-2');
assert.ok(book2);
assert.equal(book2.contract, 'PHI-OS-BOOK-2-KNOWLEDGE-BLUEPRINT-v2.0.0');
assert.equal(book2.status, 'registry-complete-planning');
assert.equal(book2.canonicalNodeCount, 266);
assert.deepEqual(book2.partCodes, ['P5', 'P6', 'P7', 'P8', 'P9']);

assert.equal(
  freeze.freeze.registryManifestSHA,
  digestKnowledgeSource(
    await readSource('content/knowledge/blueprints/blueprint-registry.json')
  )
);

const frozenBook2 = freeze.freeze.bookFreeze.find(
  entry => entry.bookCode === 'BOOK-2'
);
assert.ok(frozenBook2);
assert.equal(frozenBook2.blueprintSHA, book2.sha256);
assert.equal(frozenBook2.contractVersion, book2.contract);
assert.equal(frozenBook2.status, book2.status);

const book3 = registry.books.find(entry => entry.bookCode === 'BOOK-3');
assert.ok(book3);
assert.equal(book3.contract, 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.1.0');
assert.equal(book3.status, 'final-outline-registry-freeze');
assert.equal(book3.canonicalNodeCount, 187);
assert.deepEqual(book3.partCodes, ['P10', 'P11', 'P12']);

const frozenBook3 = freeze.freeze.bookFreeze.find(
  entry => entry.bookCode === 'BOOK-3'
);
assert.ok(frozenBook3);
assert.equal(frozenBook3.blueprintSHA, book3.sha256);
assert.equal(frozenBook3.contractVersion, book3.contract);
assert.equal(frozenBook3.status, book3.status);


const book4 = registry.books.find(entry => entry.bookCode === 'BOOK-4');
assert.ok(book4);
assert.equal(book4.contract, 'PHI-OS-BOOK-4-KNOWLEDGE-BLUEPRINT-v2.0.0');
assert.equal(book4.status, 'final-outline-registry-freeze');
assert.equal(book4.canonicalNodeCount, 198);
assert.deepEqual(book4.partCodes, ['P13', 'P14', 'P15']);

const frozenBook4 = freeze.freeze.bookFreeze.find(
  entry => entry.bookCode === 'BOOK-4'
);
assert.ok(frozenBook4);
assert.equal(frozenBook4.blueprintSHA, book4.sha256);
assert.equal(frozenBook4.contractVersion, book4.contract);
assert.equal(frozenBook4.status, book4.status);

console.log('✓ KH-W4B.5 R1 Blueprint Registry Authority Refresh passed.');
console.log('✓ BOOK-2, BOOK-3 and BOOK-4 digest, contract, status and node counts are synchronized.');
console.log('✓ Registry Manifest and per-book Freeze are synchronized.');
console.log('✓ Canonical Nodes and production states remain unchanged.');
