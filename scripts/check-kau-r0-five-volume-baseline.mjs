import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  loadKnowledgeBlueprintRegistry,
  resolveKnowledgeBlueprintForNode,
  resolveKnowledgeBlueprintForPart
} from './lib/knowledge-blueprint/blueprint-registry-loader.mjs';
import { verifyKnowledgeBlueprintFreeze } from './lib/knowledge-blueprint/freeze-contract.mjs';

const root = process.cwd();
const BASELINE = '807efc359a0d1477bc697044f55970fc5e6e8500';
const NODE_SHA = '61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431';
const NODE_CODE_SET_SHA = '98cea9eb7a84970dc1ea8fb98c992ee66612f5c560b987c90ba85a11d43f50c3';
const R5_FREEZE_PATH = 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json';
const r5Active = await fs.access(path.join(root, R5_FREEZE_PATH)).then(() => true).catch(() => false);

const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await read(relative));
const digest = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const [contract, audit, books, parts, nodes, schema, knowledge, blueprintFreeze] = await Promise.all([
  readJson('content/knowledge/authoring/freeze/kau-r0-five-volume-baseline-freeze-v1.json'),
  readJson('content/knowledge/authoring/audits/kau-r0-five-volume-baseline-reconciliation-v1.json'),
  readJson('content/registry/books.json'),
  readJson('content/registry/parts.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('data/schemas/book-architecture-manifest.schema.json'),
  loadKnowledgeBlueprintRegistry(root),
  verifyKnowledgeBlueprintFreeze(root)
]);

assert.equal(contract.freezeCode, 'KAU-R0-FIVE-VOLUME-BASELINE-FREEZE');
assert.equal(contract.stage, 'KAU-R0');
assert.equal(contract.status, 'frozen');
assert.equal(contract.baseline.commit, BASELINE);
assert.equal(contract.architecture.id, 'five-volume-15-part');
assert.equal(audit.stage, 'KAU-R0');
assert.equal(audit.status, 'reconciled');
assert.equal(audit.baselineCommit, BASELINE);

const expectedBooks = [
  ['book-1', 1, '世界如何形成', 'Reality Formation', [1, 2, 3, 4], 'completed'],
  ['book-2', 2, '世界如何运行', 'Reality Runtime', [5, 6, 7], 'completed'],
  ['book-3', 3, '世界如何维持', 'Reality Continuity', [8, 9], 'architecture-registered'],
  ['book-4', 4, '世界如何扩展', 'Reality Civilization', [10, 11, 12], 'architecture-registered'],
  ['book-5', 5, '世界将如何继续', 'Reality Navigation', [13, 14, 15], 'architecture-registered']
];
assert.equal(books.architecture, 'five-volume-15-part');
assert.equal(books.books.length, 5);
for (const [index, expected] of expectedBooks.entries()) {
  const [bookId, volume, zh, en, ownedParts, contentStatus] = expected;
  const actual = books.books[index];
  assert.equal(actual.book_id, bookId);
  assert.equal(actual.volume, volume);
  assert.equal(actual.title['zh-Hans'], zh);
  assert.equal(actual.title.en, en);
  assert.deepEqual(actual.parts, ownedParts);
  assert.equal(actual.content_status, contentStatus);
}
assert.equal(books.books[1].status, 'publication-preparation');
assert.equal(books.books[2].subtitle['zh-Hans'], '运行如何被维护、恢复与协调');

assert.equal(parts.architecture, 'five-volume-15-part');
assert.equal(parts.parts.length, 15);
const expectedOwners = {
  1: 'book-1', 2: 'book-1', 3: 'book-1', 4: 'book-1',
  5: 'book-2', 6: 'book-2', 7: 'book-2',
  8: 'book-3', 9: 'book-3',
  10: 'book-4', 11: 'book-4', 12: 'book-4',
  13: 'book-5', 14: 'book-5', 15: 'book-5'
};
const byNumber = new Map(parts.parts.map(part => [part.number, part]));
for (const [number, owner] of Object.entries(expectedOwners)) {
  assert.equal(byNumber.get(Number(number))?.book, owner, `P${number} owner`);
}
assert.equal(byNumber.get(6).title['zh-Hans'], '共同运行');
assert.equal(byNumber.get(6).title.en, 'Relational Runtime');
assert.equal(byNumber.get(8).title['zh-Hans'], '运行维持');
assert.equal(byNumber.get(8).title.en, 'Runtime Maintenance');
assert.equal(byNumber.get(9).title['zh-Hans'], '协调运行');
assert.equal(byNumber.get(9).title.en, 'Coordination Runtime');
for (const n of [5, 6, 7]) assert.equal(byNumber.get(n).content_status, 'completed');

const nodeSource = await read('content/knowledge/registry/nodes.json');
const nodeCodes = nodes.nodes.map(node => node.nodeCode).sort();
if (r5Active) {
  const r5 = await readJson(R5_FREEZE_PATH);
  assert.equal(r5.status, 'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
  assert.equal(r5.canonicalAuthority.predecessorCount, 716);
  assert.equal(r5.canonicalAuthority.predecessorSha256, NODE_SHA);
  assert.equal(r5.canonicalAuthority.predecessorNodeCodeSetSha256, NODE_CODE_SET_SHA);
  assert.equal(r5.canonicalAuthority.successorCount, 718);
  assert.equal(nodes.nodes.length, 718);
  assert.equal(digest(nodeSource), r5.canonicalAuthority.successorSha256);
  const predecessorCodes = nodeCodes.filter(code => !['KN-B2-P7-058','KN-B2-P7-059'].includes(code));
  assert.equal(predecessorCodes.length, 716);
  assert.equal(digest(`${predecessorCodes.join('\n')}\n`), NODE_CODE_SET_SHA);
} else {
  assert.equal(digest(nodeSource), NODE_SHA, 'Canonical Node Registry bytes/content must remain unchanged from baseline before an accepted successor.');
  assert.equal(nodes.nodes.length, 716);
  assert.equal(digest(`${nodeCodes.join('\n')}\n`), NODE_CODE_SET_SHA);
}
assert.equal(new Set(nodeCodes).size, nodes.nodes.length);
assert.equal(contract.canonicalPreservation.normalizedSha256, NODE_SHA);
assert.equal(contract.canonicalPreservation.nodeCodeSetSha256, NODE_CODE_SET_SHA);
assert.equal(contract.canonicalPreservation.nodeIdentityMutationAllowed, false);

const w1dActive = knowledge.registry.status === 'book-w1d-human-approved-frozen-successor';
assert.equal(w1dActive, true);
assert.deepEqual(knowledge.books.map(book => book.bookCode), ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']);
assert.deepEqual(knowledge.totals, { books: 5, parts: 16, nodes: 931 });
assert.deepEqual(knowledge.registry.totals, { books: 5, parts: 16, canonicalNodes: 931 });
assert.deepEqual(
  Object.fromEntries(knowledge.books.map(book => [book.bookCode, book.cardinality.canonicalNodeCount])),
  { 'BOOK-1': 65, 'BOOK-2': 180, 'BOOK-3': 105, 'BOOK-4': 279, 'BOOK-5': 302 }
);
assert.deepEqual(
  Object.fromEntries(knowledge.books.map(book => [book.bookCode, book.parts.map(part => part.partCode)])),
  {
    'BOOK-1': ['P0', 'P1', 'P2', 'P3', 'P4'],
    'BOOK-2': ['P5', 'P6', 'P7'],
    'BOOK-3': ['P8', 'P9'],
    'BOOK-4': ['P10', 'P11', 'P12'],
    'BOOK-5': ['P13', 'P14', 'P15']
  }
);
assert.equal(blueprintFreeze.books.length, 5);
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'P8', { knowledge })).bookCode, 'BOOK-3');
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'P10', { knowledge })).bookCode, 'BOOK-4');
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'P13', { knowledge })).bookCode, 'BOOK-5');

for (const [nodeCode, owner] of [
  ['KN-B2-P8-001', 'BOOK-3'],
  ['KN-B3-P10-001', 'BOOK-4'],
  ['KN-B4-P13-001', 'BOOK-5']
]) {
  assert(nodeCodes.includes(nodeCode), `${nodeCode} must retain its Canonical identity.`);
  assert.equal((await resolveKnowledgeBlueprintForNode(root, nodeCode, { knowledge })).bookCode, owner);
}

const manifests = await Promise.all([1, 2, 3, 4, 5].map(i => readJson(`content/registry/book-${i}-manifest.json`)));
assert.deepEqual(manifests.map(m => m.volume), [1, 2, 3, 4, 5]);
assert.deepEqual(manifests.map(m => m.parts.filter(p => p.number > 0).map(p => p.number)), [
  [1, 2, 3, 4], [5, 6, 7], [8, 9], [10, 11, 12], [13, 14, 15]
]);
assert.equal(manifests[1].content_status, 'content-complete');
assert.equal(manifests[1].manuscript_registration_status, 'completed-manuscript-awaiting-kau-r1-registration');
assert.equal(manifests[2].canonical_title.en, 'Reality Continuity');
assert.equal(manifests[3].canonical_title.en, 'Reality Civilization');
assert.equal(manifests[4].canonical_title.en, 'Reality Navigation');

const bookIdPattern = new RegExp(schema.properties.book_id.pattern);
assert.equal(schema.properties.volume.maximum, 5);
assert(bookIdPattern.test('phios-volume-5'));
assert(!bookIdPattern.test('phios-volume-6'));

for (const key of ['newCanonicalNodeCreated', 'canonicalNodeRenamed', 'canonicalNodeDeleted', 'publishedAssetRewritten', 'VAPOrCARFreezeRewritten', 'productionAuthorityCreated', 'historicalFreezeRewritten']) {
  assert.equal(contract.boundaries[key], false, key);
}
assert.equal(contract.acceptance.fiveBookIdentitiesExact, true);
assert.equal(contract.acceptance.numberedPartsOwnedExactlyOnce, true);
assert.equal(contract.acceptance.canonicalNodeIdentitiesPreserved, true);
assert.equal(contract.acceptance.blueprintCoveragePreserves716Nodes, true);
assert.equal(contract.acceptance.canonicalSemanticReconciliationDeferred, true);
assert.equal(contract.acceptance.productionDeploymentAllowed, false);
assert.equal(contract.downstreamGate.webProductionRuntime, 'BLOCKED_PENDING_FIVE_VOLUME_SUCCESSOR_RECONCILIATION');

console.log('✓ KAU-R0 Five-Volume Baseline & Book/Part Authority Reconciliation passed.');
console.log('  BOOK-1 P1–P4; BOOK-2 P5–P7; BOOK-3 P8–P9; BOOK-4 P10–P12; BOOK-5 P13–P15.');
console.log('  KAU-R0 predecessor 716 identities and the exact 718-node KAU-R5 successor remain preserved as historical authorities.');
console.log('  Active W1D Blueprint projection: 65 / 180 / 105 / 279 / 302 = 931.');
console.log('  Production deployment remains blocked until frozen WPR receives a five-volume successor reconciliation.');
