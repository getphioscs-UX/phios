import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const checkerPath = 'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs';
const readinessPath = 'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json';
const packagePath = 'package.json';

const [checker, readiness, packageJson] = await Promise.all([
  read(checkerPath),
  readJson(readinessPath),
  readJson(packagePath)
]);

assert.equal(
  readiness.readinessSchemaVersion,
  'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0'
);
assert.equal(readiness.nodeCode, 'KN-PREFACE-001');
assert.equal(readiness.review.humanFrozen, true);
assert.equal(readiness.review.status, 'approved');
assert.equal(readiness.productionReadiness.status, 'production_ready');

assert(checker.includes('const universalReadiness ='));
assert(checker.includes('const readinessView = universalReadiness ?'));
assert(checker.includes("readiness.review.humanFrozen, true"));
assert(checker.includes("readiness.productionReadiness.status, 'production_ready'"));
assert(checker.includes('readinessView.claimDossier.claims'));
assert.equal(
  /for \(const claim of readiness\.claimDossier\.claims\)/.test(checker),
  false,
  'W2A checker still dereferences the removed legacy claimDossier directly'
);

for (const boundary of [
  'claimBoundary',
  'sourceBoundary',
  'figureBoundary',
  'publicContentBoundary',
  'sequenceBoundary'
]) {
  assert(Object.hasOwn(readiness, boundary), `Missing universal boundary: ${boundary}`);
}

assert.equal(
  packageJson.scripts['check:pja-w2f-b2b'],
  'npm run check:pja-w2f-b2a && node scripts/check-pja-w2f-b2b-schema-validator-alignment.mjs'
);

console.log('✓ PJA-W2F-B2B Schema Migration and Validator Alignment passed.');
console.log('  W2A now accepts both the legacy readiness record and the Universal Readiness Contract.');
console.log('  KN-PREFACE-001 remains human-frozen and production_ready; no article, approval or publication record is created.');
