import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = relativePath => fs.readFile(path.join(root, relativePath), 'utf8');
const readJson = async relativePath => JSON.parse(await read(relativePath));
const digest = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const EXECUTION_BASELINE = 'a8e6c3e9cd1495c407df321cfb94cdaa60e6446a';
const MASTER_WORK_CHECKPOINT = 'b42b775e460041605955d2baee4f15234b649b11';
const HISTORICAL_PLANNING_BASELINE = '807efc359a0d1477bc697044f55970fc5e6e8500';
const NODE_REGISTRY_SHA = '61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431';
const BLUEPRINT_REGISTRY_SHA = '981d25e7fddcab69ce0640ea5bc161c83df095c345695b4a4a82c21ec76fb92a';
const BOOK_W0_AUDIT_SHA = '7035fcc9a354935ac418c1bc4313c78c0c42e4a19247496dd60a2e34d49571fa';
const KAU_R0_FREEZE_SHA = '9276048142f346bdb2ab4b20aaf095bc0409b28ae0d0e38433181828b607a582';
const R5_FREEZE_PATH='content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json';

const [
  books,
  parts,
  migration,
  contract,
  blueprintRegistry,
  nodes,
  packageJson,
  audit,
  bookW0Audit,
  kauR0Freeze
] = await Promise.all([
  readJson('content/registry/books.json'),
  readJson('content/registry/parts.json'),
  readJson('content/knowledge/migrations/five-volume-book-ownership-migration-v1.json'),
  readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  readJson('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('package.json'),
  read('docs/audits/BOOK-W1-five-volume-migration.md'),
  read('docs/audits/BOOK-W0-four-volume-migration.md'),
  read('content/knowledge/authoring/freeze/kau-r0-five-volume-baseline-freeze-v1.json')
]);

assert.equal(books.registry_version, '3.0.0');
assert.equal(books.architecture, 'five-volume-15-part');
assert.equal(books.books.length, 5);

const expectedBooks = [
  ['book-1', 'BOOK-1', 1, '世界如何形成', 'Reality Formation', [1, 2, 3, 4]],
  ['book-2', 'BOOK-2', 2, '世界如何运行', 'Reality Runtime', [5, 6, 7]],
  ['book-3', 'BOOK-3', 3, '世界如何维持', 'Reality Continuity', [8, 9]],
  ['book-4', 'BOOK-4', 4, '世界如何扩展', 'Reality Civilization', [10, 11, 12]],
  ['book-5', 'BOOK-5', 5, '世界将如何继续', 'Reality Navigation', [13, 14, 15]]
];

for (const [index, expected] of expectedBooks.entries()) {
  const [bookId, bookCode, volume, titleZhHans, titleEn, ownedParts] = expected;
  const actual = books.books[index];
  assert.equal(actual.book_id, bookId);
  assert.equal(actual.bookCode, bookCode);
  assert.equal(actual.volume, volume);
  assert.equal(actual.title['zh-Hans'], titleZhHans);
  assert.equal(actual.title.en, titleEn);
  assert.deepEqual(actual.parts, ownedParts);
  assert.equal(actual.manifest, `./book-${volume}-manifest.json`);
  assert.equal(actual.content_root, `../books/book-${volume}/`);
}

assert.equal(parts.registry_version, '3.0.0');
assert.equal(parts.architecture, 'five-volume-15-part');
assert.equal(parts.parts.length, 15);
assert.equal(new Set(parts.parts.map(part => part.number)).size, 15);
assert.equal(new Set(parts.parts.map(part => part.part_id)).size, 15);

const expectedOwners = {
  1: 'book-1', 2: 'book-1', 3: 'book-1', 4: 'book-1',
  5: 'book-2', 6: 'book-2', 7: 'book-2',
  8: 'book-3', 9: 'book-3',
  10: 'book-4', 11: 'book-4', 12: 'book-4',
  13: 'book-5', 14: 'book-5', 15: 'book-5'
};
const expectedCurrentTitles = {
  8: ['运行维持', 'Runtime Maintenance'],
  9: ['协调运行', 'Coordination Runtime'],
  10: ['运行扩展', 'Runtime Expansion'],
  11: ['文明运行', 'Civilization Runtime'],
  12: ['文明图谱', 'Civilization Atlas'],
  13: ['读取科学', 'Reading Science'],
  14: ['导航科学', 'Navigation Science'],
  15: ['现实延续', 'Reality Continuation']
};
const byNumber = new Map(parts.parts.map(part => [part.number, part]));

for (let number = 1; number <= 15; number += 1) {
  assert.equal(byNumber.get(number)?.book, expectedOwners[number], `P${number} must have one exact current owner.`);
}
for (const [numberText, [titleZhHans, titleEn]] of Object.entries(expectedCurrentTitles)) {
  const part = byNumber.get(Number(numberText));
  assert.equal(part.title['zh-Hans'], titleZhHans, `P${numberText} zh-Hans title`);
  assert.equal(part.title.en, titleEn, `P${numberText} English title`);
}
for (const [number, alias] of [
  [9, 'Governance Runtime'],
  [10, 'Civilization Dynamics'],
  [11, 'Civilization Ecology'],
  [13, 'Reality Reading Science'],
  [15, 'Continuity Science']
]) {
  assert(byNumber.get(number).deprecated_aliases.includes(alias), `P${number} must retain ${alias} as a legacy alias.`);
}

const manifests = await Promise.all([2, 3, 4, 5].map(number => readJson(`content/registry/book-${number}-manifest.json`)));
for (const [index, manifest] of manifests.entries()) {
  const volume = index + 2;
  assert.equal(manifest.book_id, `phios-volume-${volume}`);
  assert.equal(manifest.legacy_manifest_id, `phios-volume-${volume}`);
  assert.equal(manifest.canonical_book_id, `book-${volume}`);
  assert.equal(manifest.bookCode, `BOOK-${volume}`);
  assert.equal(manifest.volume, volume);
  assert.equal(manifest.migration_record, 'content/knowledge/migrations/five-volume-book-ownership-migration-v1.json');
  assert.equal(manifest.canonical_reconciliation_status, 'book-w1a-ownership-accepted-awaiting-outline-reconciliation');
}
assert.deepEqual(manifests.map(manifest => manifest.parts.map(part => part.number)), [
  [5, 6, 7], [8, 9], [10, 11, 12], [13, 14, 15]
]);
assert.equal(manifests[2].parts[0].title.en, 'Runtime Expansion');
assert.equal(manifests[2].parts[1].title.en, 'Civilization Runtime');
assert.equal(manifests[3].parts[0].title.en, 'Reading Science');
assert.equal(manifests[3].parts[2].title.en, 'Reality Continuation');

assert.equal(contract.contract, 'PHI-OS-FIVE-VOLUME-MIGRATION-CONTRACT-v1.0.0');
assert.equal(contract.status, 'active-successor-migration');
assert.equal(contract.implementationSteps[0].step, 'BOOK-W1A');
assert.equal(contract.implementationSteps[0].status, 'accepted');
const allowedSuccessorStatuses = new Set(['pending', 'in_progress', 'accepted']);
assert(contract.implementationSteps.slice(1).every(step => allowedSuccessorStatuses.has(step.status)));
let nonAcceptedStepSeen = false;
for (const step of contract.implementationSteps) {
  if (step.status !== 'accepted') nonAcceptedStepSeen = true;
  if (nonAcceptedStepSeen) assert.notEqual(step.status, 'accepted', 'BOOK-W1 steps cannot skip a prior gate.');
}
assert.equal(contract.boundaries.canonicalNodeRegistryMutationAllowedInW1A, false);
assert.equal(contract.boundaries.finalSuccessorBlueprintGenerationAllowedInW1A, false);
assert.equal(contract.boundaries.publicProjectionMutationAllowedInW1A, false);
assert.equal(contract.manifestCompatibility.schemaReconciliationGate, 'BOOK-W1F');

assert.equal(migration.migrationCode, 'BOOK-W1A-FIVE-VOLUME-REGISTRY-OWNERSHIP-v1');
assert.equal(migration.status, 'accepted');
assert.equal(migration.baselines.actualExecutionBaseline, EXECUTION_BASELINE);
assert.equal(migration.baselines.masterWorkDeclaredCheckpoint, MASTER_WORK_CHECKPOINT);
assert.equal(migration.baselines.historicalPlanningBaseline, HISTORICAL_PLANNING_BASELINE);
assert.equal(migration.acceptance.fiveBooksRegistered, true);
assert.equal(migration.acceptance.fifteenPartCodesPreserved, true);
assert.equal(migration.acceptance.canonicalNodeRegistryUnchanged, true);
assert.equal(migration.acceptance.finalSuccessorBlueprintsGenerated, false);
assert.equal(migration.nextGate, 'BOOK-W1B');

const r5Active=await fs.access(path.join(root,R5_FREEZE_PATH)).then(()=>true).catch(()=>false);
if(r5Active){
  const r5=await readJson(R5_FREEZE_PATH);
  assert.equal(r5.canonicalAuthority.predecessorCount,716);
  assert.equal(r5.canonicalAuthority.predecessorSha256,NODE_REGISTRY_SHA);
  assert.equal(r5.canonicalAuthority.successorCount,718);
  assert.equal(nodes.nodes.length,718);
  assert.equal(digest(await read('content/knowledge/registry/nodes.json')),r5.canonicalAuthority.successorSha256);
  assert.equal(blueprintRegistry.totals.canonicalNodes,718);
}else{
  assert.equal(nodes.nodes.length,716);
  assert.equal(digest(await read('content/knowledge/registry/nodes.json')),NODE_REGISTRY_SHA);
  assert.equal(digest(await read('content/knowledge/blueprints/blueprint-registry.json')),BLUEPRINT_REGISTRY_SHA);
}
assert.equal(blueprintRegistry.status,'frozen');
assert.equal(migration.blueprintRegistryTransition.mutatedInW1A, false);
assert.equal(migration.blueprintRegistryTransition.successorGenerationGate, 'BOOK-W1C');
assert.equal(digest(bookW0Audit), BOOK_W0_AUDIT_SHA);
assert.equal(digest(kauR0Freeze), KAU_R0_FREEZE_SHA);

for (const baseline of [EXECUTION_BASELINE, MASTER_WORK_CHECKPOINT, HISTORICAL_PLANNING_BASELINE]) {
  assert(audit.includes(baseline), `BOOK-W1 audit must record ${baseline}.`);
}
assert(audit.includes('P8–P9: BOOK-2 → BOOK-3'));
assert(audit.includes('P10–P12: BOOK-3 → BOOK-4'));
assert(audit.includes('P13–P15: BOOK-4 → BOOK-5'));

assert.equal(packageJson.scripts['check:book-w1a'], 'node scripts/check-book-w1a-five-volume-registry-ownership.mjs');
assert.equal(packageJson.scripts['check:book-w1-ownership'], 'npm run check:book-w1a');

console.log('✓ BOOK-W1A Five-Volume Registry Ownership passed.');
console.log('  BOOK-1/Volume I through BOOK-5/Volume V are aligned; 15 numbered Parts have one current owner.');
console.log('  P8-P15 Current Part Authority is exact; superseded titles remain legacy aliases only.');
console.log(r5Active ? '  W1A historical 716-node baseline remains preserved as predecessor lineage; KAU-R5 is the governed 718-node current successor.' : '  716 Canonical Node identities and the frozen KAU-R0 Blueprint Registry remain unchanged.');
console.log('  W1B outline reconciliation is the next gate; no public projection or Production Authority was created.');
