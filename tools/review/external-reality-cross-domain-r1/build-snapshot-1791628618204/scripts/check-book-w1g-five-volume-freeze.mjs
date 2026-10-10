import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const read = path => fs.readFile(path, 'utf8');
const json = async path => JSON.parse(await read(path));
const sha256 = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const ACCEPTANCE_PATH = 'content/knowledge/migrations/book-w1-five-volume-acceptance-v1.json';
const FREEZE_PATH = 'content/knowledge/blueprints/knowledge-blueprint-freeze-v3.json';
const [acceptance, freeze, contract, books, parts, nodes, registry, materializationReconciliation, wprFiveVolumeManifest] = await Promise.all([
  json(ACCEPTANCE_PATH),
  json(FREEZE_PATH),
  json('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  json('content/registry/books.json'),
  json('content/registry/parts.json'),
  json('content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json'),
  json('content/knowledge/blueprints/blueprint-registry.json'),
  json('content/knowledge/migrations/book-w1e/book-w1e-public-assets-materialization-reconciliation-v1.json'),
  json('docs/runtime/WPR-5V-DELTA-MANIFEST.json')
]);

assert.equal(acceptance.status, 'HUMAN_APPROVED_FIVE_VOLUME_FREEZE');
assert.equal(acceptance.humanAcceptance.actor, 'TL');
assert.equal(acceptance.humanAcceptance.decision, 'ACCEPT');
assert(acceptance.prerequisiteGates.every(record => record.status === 'accepted'));
assert.deepEqual(acceptance.prerequisiteGates.map(record => record.step), [
  'BOOK-W1A', 'BOOK-W1B', 'BOOK-W1C', 'BOOK-W1D', 'BOOK-W1E', 'BOOK-W1F'
]);

assert.equal(freeze.contract, 'PHI-OS-KNOWLEDGE-BLUEPRINT-FREEZE-v3.0.0');
assert.equal(freeze.status, 'frozen-book-w1g-human-approved-five-volume-successor');
assert.equal(freeze.humanAcceptance.path, ACCEPTANCE_PATH);
assert.equal(freeze.supersedes.path, 'content/knowledge/blueprints/successors/book-w1d/knowledge-blueprint-freeze-v1.json');
assert.equal(freeze.supersedes.historicalAuthorityMutationAllowed, false);
assert(freeze.supersedes.historicalFreezePaths.includes('content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json'));
assert.equal(freeze.architecture.canonicalBookCount, 5);
assert.equal(freeze.architecture.canonicalPartCount, 15);
assert.equal(freeze.architecture.canonicalNodeCount, 931);

assert.equal(books.books.length, 5);
assert.equal(parts.parts.length, 15);
assert.equal(nodes.nodes.length, 931);
assert.equal(new Set(nodes.nodes.map(node => node.nodeCode)).size, 931);
assert.equal(registry.books.length, 5);
assert.equal(registry.totals.canonicalNodes, 931);
assert.equal(freeze.registryManifestSHA, sha256(await read(freeze.registryManifestPath)));
assert.equal(freeze.canonicalRegistrySHA, sha256(await read(freeze.canonicalRegistryPath)));
for (const record of freeze.bookFreeze) {
  assert.equal(record.blueprintSHA, sha256(await read(record.blueprintPath)), `${record.bookCode} Blueprint digest drift.`);
  assert.equal(record.status, 'book-w1g-frozen-successor');
}

for (const record of Object.values(acceptance.authorityDigests)) {
  if (record.path === materializationReconciliation.acceptedSuccessorDigests.partsRegistry.path) {
    const successor = materializationReconciliation.acceptedSuccessorDigests.partsRegistry;
    assert.equal(record.sha256, successor.bookW1gRecordedPredecessorSha256);
    assert.equal(sha256(await read(record.path)), successor.wprFiveVolumeAcceptedSha256);
    assert.equal(
      wprFiveVolumeManifest.files.find(entry => entry.path === record.path)?.sha256,
      successor.wprFiveVolumeAcceptedSha256
    );
    assert.equal(successor.canonicalArchitectureChanged, false);
    continue;
  }
  assert.equal(record.sha256, sha256(await read(record.path)), `Acceptance digest drift: ${record.path}`);
}

const expectedBooks = [
  ['BOOK-1', 'Volume I', 'Reality Formation', '世界如何形成', ['P1', 'P2', 'P3', 'P4']],
  ['BOOK-2', 'Volume II', 'Reality Runtime', '世界如何运行', ['P5', 'P6', 'P7']],
  ['BOOK-3', 'Volume III', 'Reality Continuity', '世界如何维持', ['P8', 'P9']],
  ['BOOK-4', 'Volume IV', 'Reality Civilization', '世界如何扩展', ['P10', 'P11', 'P12']],
  ['BOOK-5', 'Volume V', 'Reality Navigation', '世界将如何继续', ['P13', 'P14', 'P15']]
];
for (const [index, [bookCode, volume, en, zh, partCodes]] of expectedBooks.entries()) {
  const accepted = acceptance.canonicalArchitecture.books[index];
  assert.deepEqual([accepted.bookCode, accepted.volume, accepted.titleEn, accepted.titleZhHans, accepted.partCodes], [bookCode, volume, en, zh, partCodes]);
  const registered = books.books[index];
  assert.equal(registered.bookCode, bookCode);
  assert.equal(registered.volume, index + 1);
  assert.equal(registered.title.en, en);
  assert.equal(registered.title['zh-Hans'], zh);
  assert.deepEqual(registered.parts.map(number => `P${number}`), partCodes);
}

const expectedParts = [
  ['P8', 'Runtime Maintenance', '运行维持'], ['P9', 'Coordination Runtime', '协调运行'],
  ['P10', 'Runtime Expansion', '运行扩展'], ['P11', 'Civilization Runtime', '文明运行'],
  ['P12', 'Civilization Atlas', '文明图谱'], ['P13', 'Reading Science', '读取科学'],
  ['P14', 'Navigation Science', '导航科学'], ['P15', 'Reality Continuation', '现实延续']
];
for (const [partCode, en, zh] of expectedParts) {
  const part = parts.parts.find(record => `P${record.number}` === partCode);
  assert.equal(part.title.en, en);
  assert.equal(part.title['zh-Hans'], zh);
}

assert.deepEqual(acceptance.acceptanceProof, {
  existingCanonicalNodeAuthorityPreserved: true,
  orphanPartCount: 0,
  duplicateCurrentOwnershipCount: 0,
  ungovernedNodeCodeMutationCount: 0,
  semanticNodeLossCount: 0,
  brokenMigrationLineageCount: 0,
  activeFourVolumeProductionAssumptionCount: 0,
  duplicateActiveIdentityCount: 0,
  orphanMigrationEntryCount: 0,
  silentDeletionCount: 0
});
assert.deepEqual(freeze.acceptanceProof, {
  existingCanonicalNodeAuthorityPreserved: true,
  orphanPartCount: 0,
  duplicateCurrentOwnershipCount: 0,
  ungovernedNodeCodeMutationCount: 0,
  semanticNodeLossCount: 0,
  brokenMigrationLineageCount: 0,
  activeFourVolumeProductionAssumptionCount: 0
});
assert.equal(contract.status, 'FROZEN_BOOK_W1G_SUCCESSOR');
assert.equal(contract.progress.currentStep, 'BOOK-W1G');
assert.equal(contract.progress.status, 'five-volume-human-approved-frozen-successor');
assert(contract.implementationSteps.every(record => record.status === 'accepted'));

console.log('✓ BOOK-W1G Five-Volume Acceptance + successor freeze passed.');
console.log('  Canonical Books=5, Parts=15, Nodes=931; historical freezes remain immutable predecessors.');
console.log('  0 orphan Part, duplicate ownership, ungoverned identity mutation, semantic loss or broken lineage.');
