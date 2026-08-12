import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  digestKnowledgeSource,
  verifyKnowledgeBlueprintFreeze
} from './lib/knowledge-blueprint/freeze-contract.mjs';

const root = process.cwd();
const readSource = relative => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await readSource(relative));

const registry = await readJson('content/knowledge/blueprints/blueprint-registry.json');
const freeze = await verifyKnowledgeBlueprintFreeze(root);

assert.equal(registry.books.length, 5);
assert.equal(registry.totals.books, 5);
assert.equal(registry.totals.parts, 16);
assert.equal(registry.architectureProjection, 'five-volume-15-part');
const derivedCanonicalNodeTotal = registry.books.reduce((total, entry) => total + entry.canonicalNodeCount, 0);
assert.equal(registry.totals.canonicalNodes, derivedCanonicalNodeTotal);
assert.equal(derivedCanonicalNodeTotal, 716);

for (const entry of registry.books) {
  const source = await readSource(entry.blueprintPath);
  const blueprint = JSON.parse(source);
  assert.equal(entry.sha256, digestKnowledgeSource(source));
  assert.equal(entry.contract, blueprint.contract);
  assert.equal(entry.schemaVersion, blueprint.schemaVersion);
  assert.equal(entry.status, blueprint.status);
  assert.deepEqual(entry.partCodes, (blueprint.parts || []).map(part => part.partCode));
  assert.equal(entry.canonicalNodeCount, Array.isArray(blueprint.nodes) ? blueprint.nodes.length : 0);
  const frozen = freeze.freeze.bookFreeze.find(item => item.bookCode === entry.bookCode);
  assert.ok(frozen, `Missing freeze for ${entry.bookCode}`);
  assert.equal(frozen.blueprintSHA, entry.sha256);
  assert.equal(frozen.contractVersion, entry.contract);
  assert.equal(frozen.status, entry.status);
}

const expected = {
  'BOOK-1': { contract:'PHI-OS-BOOK-1-KNOWLEDGE-BLUEPRINT-v2.0.0', count:65, parts:['P0','P1','P2','P3','P4'] },
  'BOOK-2': { contract:'PHI-OS-BOOK-2-KNOWLEDGE-BLUEPRINT-v3.0.0', count:180, parts:['P5','P6','P7'] },
  'BOOK-3': { contract:'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v3.0.0', count:86, parts:['P8','P9'] },
  'BOOK-4': { contract:'PHI-OS-BOOK-4-KNOWLEDGE-BLUEPRINT-v3.0.0', count:187, parts:['P10','P11','P12'] },
  'BOOK-5': { contract:'PHI-OS-BOOK-5-KNOWLEDGE-BLUEPRINT-v1.0.0', count:198, parts:['P13','P14','P15'] }
};
for (const [bookCode, e] of Object.entries(expected)) {
  const entry=registry.books.find(candidate=>candidate.bookCode===bookCode);
  assert.ok(entry);
  assert.equal(entry.contract,e.contract);
  assert.equal(entry.canonicalNodeCount,e.count);
  assert.deepEqual(entry.partCodes,e.parts);
}

assert.equal(
  freeze.freeze.registryManifestSHA,
  digestKnowledgeSource(await readSource('content/knowledge/blueprints/blueprint-registry.json'))
);
console.log('✓ KH-W4B.5 R1 Blueprint Registry Authority Refresh passed for five-volume projection.');
console.log('✓ BOOK-1..5 digest, contract, Part ownership and 716-node coverage are synchronized.');
console.log('✓ Canonical Nodes and Production states remain unchanged.');
