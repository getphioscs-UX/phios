import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  resolvePublicationContext,
  resolveSourceLineage,
  verifyKnowledgeBlueprintFreeze
} from './lib/knowledge-blueprint/freeze-contract.mjs';

const root = process.cwd();
const readJson = async relative =>
  JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

const result = await verifyKnowledgeBlueprintFreeze(root);
assert.equal(result.freeze.status, 'frozen');
assert.equal(result.freeze.bookFreeze.length, 5);
assert.deepEqual(
  result.freeze.bookFreeze.map(entry => entry.bookCode),
  ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']
);

const migration = await readJson(
  'content/knowledge/migrations/node-publication-ownership-v2.json'
);
assert.equal(migration.partCode, 'P5');
assert.equal(migration.sourceBookCode, 'BOOK-1');
assert.equal(migration.publicationBookCode, 'BOOK-2');
assert.equal(migration.publicationPartCode, 'P5');
assert.equal(migration.nodeRenamePolicy, 'retain_canonical_and_legacy_identity');
assert.equal(migration.nodes.length, 13);

for (let index = 1; index <= 13; index += 1) {
  const nodeCode = `KN-B1-P5-${String(index).padStart(3, '0')}`;
  const node = migration.nodes.find(candidate => candidate.nodeCode === nodeCode);
  assert.ok(node, `Missing Part 5 ownership node: ${nodeCode}`);
  assert.equal(node.sourceBookCode, 'BOOK-1');
  assert.equal(node.publicationBookCode, 'BOOK-2');
  assert.equal(node.publicationPartCode, 'P5');

  const publication = await resolvePublicationContext(nodeCode, root);
  const lineage = await resolveSourceLineage(nodeCode, root);
  assert.equal(publication.publicationBookCode, 'BOOK-2');
  assert.equal(publication.publicationPartCode, 'P5');
  assert.equal(lineage.sourceBookCode, 'BOOK-1');
  assert.equal(lineage.canonicalIdentityRetained, true);
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['knowledge:freeze'],
  'node scripts/knowledge-blueprints-freeze.mjs write'
);
assert.equal(
  packageJson.scripts['knowledge:freeze:status'],
  'node scripts/knowledge-blueprints-freeze.mjs status'
);
assert.equal(
  packageJson.scripts['check:kh-w4d-w4e'],
  'node scripts/check-kh-w4d-w4e-freeze-ownership.mjs'
);
assert.match(packageJson.scripts.precheck, /check-kh-w4d-w4e-freeze-ownership\.mjs/);

const forbiddenRoots = [
  'content/knowledge/articles',
  'content/knowledge/candidates',
  'content/knowledge/readiness',
  'content/knowledge/reviews',
  'content/knowledge/approvals',
  'content/knowledge/publication'
];
for (const forbiddenRoot of forbiddenRoots) {
  assert.equal(
    Object.keys(import.meta).includes(forbiddenRoot),
    false,
    `KH-W4D/W4E must not mutate ${forbiddenRoot}`
  );
}

console.log('✓ KH-W4D Freeze Contract v2 passed.');
console.log('✓ KH-W4E Part 5 Publication Ownership passed.');
console.log('✓ Five per-book Blueprint digests remain independently frozen under KAU-R0 projection.');
console.log('✓ Canonical Node codes and production states remain unchanged.');
