import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateSectionStaleness,
  runBookIManuscriptCommand,
  validateBookISectionInventory
} from './book-i-manuscript.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryRelative = 'content/knowledge/manuscripts/book-1/book-1-section-inventory.json';
const manifestRelative = 'content/knowledge/manuscripts/book-1/manuscript-manifest.json';
const read = relative => fs.readFileSync(path.join(repositoryRoot, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const clone = value => JSON.parse(JSON.stringify(value));

const inventorySource = read(inventoryRelative);
const inventory = JSON.parse(inventorySource);
const manifest = json(manifestRelative);
const packageJson = json('package.json');
const requiredPartFields = [
  'partCode',
  'title',
  'sequence',
  'sourceObjectKey',
  'normalizedObjectKey',
  'startHeading',
  'endHeading',
  'startAnchor',
  'endAnchor',
  'estimatedCharacterCount',
  'sectionHash',
  'normalizationStatus',
  'humanVerified',
  'startPage',
  'endPage',
  'stalenessStatus'
];

assert.equal(
  packageJson.scripts['check:knr-w2r1-t06'],
  'node scripts/check-knr-w2r1-t06-book-i-section-inventory.mjs'
);
assert.equal(inventory.schemaVersion, '1.0.0');
assert.equal(inventory.stage, 'KNR-W2R1-T06');
assert.equal(inventory.bookCode, manifest.bookCode);
assert.equal(inventory.locale, manifest.locale);
assert.equal(inventory.manuscriptVersion, manifest.manuscriptVersion);
assert.equal(inventory.sourceObjectKey, manifest.parts[0].sourceObjectKey);
assert.equal(inventory.sourceObjectSha256, manifest.contentHashes.sourceObjectSha256);
assert(inventorySource.length < 20_000, 'Inventory must contain metadata, not manuscript body text');
assert(!inventorySource.includes('.tmp/knowledge-manuscripts/'));
assert(!/publicUrl|presignedUrl|secretAccessKey|accessKeyId|apiToken|credential/u.test(inventorySource));

assert.deepEqual(inventory.boundaryAuthority, {
  primary: ['startHeading', 'endHeading', 'startAnchor', 'endAnchor', 'sectionHash'],
  auxiliary: ['startPage', 'endPage'],
  pageNumbersAuthoritative: false
});
assert.deepEqual(inventory.stalenessPolicy, {
  hashAlgorithm: 'sha256',
  hashChangeStatus: 'MANUSCRIPT_STALE',
  automaticReuseOnHashChange: {
    mapping: false,
    candidate: false,
    prompt: false
  },
  automaticStaleClear: false,
  freshHumanReviewRequired: true
});

assert.deepEqual(inventory.parts.map(part => part.partCode), ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);
assert.deepEqual(inventory.parts.map(part => part.sequence), [0, 1, 2, 3, 4, 5]);
for (const part of inventory.parts) {
  assert(requiredPartFields.every(field => Object.hasOwn(part, field)), `${part.partCode} fields`);
  const manifestPart = manifest.parts.find(item => item.partCode === part.partCode);
  assert(manifestPart, `${part.partCode} must exist in Manifest`);
  assert.equal(part.title, manifestPart.title);
  assert.equal(part.sourceObjectKey, manifestPart.sourceObjectKey);
  assert.equal(part.normalizedObjectKey, manifestPart.normalizedObjectKey);
}

const p0 = inventory.parts[0];
assert.equal(p0.title, '序部｜为什么需要 PHI OS');
assert.equal(p0.startHeading, '为什么需要 PHI OS');
assert.equal(p0.endHeading, '第一部｜现实物理学');
assert.equal(p0.startAnchor, '序部｜为什么需要 PHI OS');
assert.equal(p0.endAnchor, '第一部｜现实物理学');
assert.equal(p0.normalizedObjectKey, 'books/book-1/extracted/p0-preface.md');
assert.equal(p0.estimatedCharacterCount, 30192);
assert.equal(p0.sectionHash, manifest.contentHashes.normalizedParts.P0);
assert.equal(p0.normalizationStatus, 'human_verified');
assert.equal(p0.humanVerified, true);
assert.equal(p0.startPage, 2);
assert.equal(p0.endPage, 33);
assert.equal(p0.stalenessStatus, 'CURRENT');

const p1 = inventory.parts[1];
assert.equal(p1.startPage, 34, 'P1 starts at the T04-detected page 34 boundary');
assert.equal(p1.endPage, null, 'Unverified P1 end page must not be invented');
for (const part of inventory.parts.slice(1)) {
  assert.equal(part.normalizedObjectKey, null);
  assert.equal(part.estimatedCharacterCount, null);
  assert.equal(part.sectionHash, null);
  assert.equal(part.normalizationStatus, 'not_materialized');
  assert.equal(part.humanVerified, false);
  assert.equal(part.stalenessStatus, 'NOT_MATERIALIZED');
}
for (const part of inventory.parts.slice(2)) {
  assert.equal(part.startPage, null);
  assert.equal(part.endPage, null);
}
for (let index = 0; index < inventory.parts.length - 1; index += 1) {
  assert.equal(inventory.parts[index].endHeading, inventory.parts[index + 1].startHeading);
  assert.equal(inventory.parts[index].endAnchor, inventory.parts[index + 1].startAnchor);
}
assert.equal(inventory.parts.at(-1).endHeading, null);
assert.equal(inventory.parts.at(-1).endAnchor, null);

assert.equal(validateBookISectionInventory(inventory, manifest), inventory);
const missingField = clone(inventory);
delete missingField.parts[0].sectionHash;
assert.throws(
  () => validateBookISectionInventory(missingField, manifest),
  error => error.code === 'SECTION_INVENTORY_PART_FIELDS_MISSING'
);
const authoritativePages = clone(inventory);
authoritativePages.boundaryAuthority.pageNumbersAuthoritative = true;
assert.throws(
  () => validateBookISectionInventory(authoritativePages, manifest),
  error => error.code === 'SECTION_INVENTORY_BOUNDARY_AUTHORITY_INVALID'
);
const inventedP2Hash = clone(inventory);
inventedP2Hash.parts[2].sectionHash = '2'.repeat(64);
assert.throws(
  () => validateBookISectionInventory(inventedP2Hash, manifest),
  error => error.code === 'SECTION_INVENTORY_NOT_MATERIALIZED_INVALID'
);

const currentEvaluation = evaluateSectionStaleness(p0, p0.sectionHash);
assert.equal(currentEvaluation.stalenessStatus, 'CURRENT');
assert.equal(currentEvaluation.hashComparison, 'matched');
assert.equal(currentEvaluation.reuseBlocked, false);

const changedHash = '0'.repeat(64);
const staleEvaluation = evaluateSectionStaleness(p0, changedHash);
assert.equal(staleEvaluation.stalenessStatus, 'MANUSCRIPT_STALE');
assert.equal(staleEvaluation.hashComparison, 'changed');
assert.equal(staleEvaluation.reuseBlocked, true);
assert.deepEqual(staleEvaluation.invalidatedArtifacts, ['mapping', 'candidate', 'prompt']);
assert.equal(staleEvaluation.freshHumanReviewRequired, true);

const previouslyStale = { ...p0, stalenessStatus: 'MANUSCRIPT_STALE' };
const noAutomaticClear = evaluateSectionStaleness(previouslyStale, p0.sectionHash);
assert.equal(noAutomaticClear.stalenessStatus, 'MANUSCRIPT_STALE');
assert.equal(noAutomaticClear.reuseBlocked, true);

const report = await runBookIManuscriptCommand('inventory', ['--dry-run'], { manifest });
assert.equal(report.stage, 'KNR-W2R1-T06');
assert.equal(report.status, 'registered');
assert.equal(report.inventoryFilePresent, true);
assert.equal(report.sectionCount, 6);
assert.equal(report.humanVerifiedSectionCount, 1);
assert.equal(report.notMaterializedSectionCount, 5);
assert.deepEqual(report.staleParts, []);
assert.equal(report.staleArtifactReuseBlocked, false);
assert.equal(report.pageNumberAuthority, 'auxiliary_only');
assert.equal(report.nextImplementation, 'KNR-W2R1-T07');
assert.equal(report.writes, 0);
assert.equal(report.productionModified, false);

const changedManifest = clone(manifest);
changedManifest.contentHashes.normalizedParts.P0 = changedHash;
const staleReport = await runBookIManuscriptCommand('inventory', ['--dry-run'], {
  manifest: changedManifest,
  inventory
});
assert.equal(staleReport.status, 'MANUSCRIPT_STALE');
assert.deepEqual(staleReport.staleParts, ['P0']);
assert.equal(staleReport.staleArtifactReuseBlocked, true);
assert.equal(staleReport.partStates[0].stalenessStatus, 'MANUSCRIPT_STALE');
assert.deepEqual(staleReport.partStates[0].invalidatedArtifacts, [
  'mapping',
  'candidate',
  'prompt'
]);
assert.equal(
  staleReport.nextImplementation,
  'FRESH_EXTRACTION_MAPPING_CANDIDATE_AND_PROMPT_REVIEW_REQUIRED'
);
assert.equal(staleReport.writes, 0);

console.log('✓ KNR-W2R1-T06 Book I Section Inventory contract passed.');
console.log('  Six ordered P0–P5 records use Heading, Anchor and Section Hash as primary authority; pages remain auxiliary.');
console.log('  P0 is bound to the human-verified private object and hash; P1–P5 remain explicitly unmaterialized.');
console.log('  Any Section Hash change becomes MANUSCRIPT_STALE and blocks Mapping, Candidate and Prompt reuse.');
console.log('  Inventory metadata contains no manuscript body, private review evidence, credential or Production content.');
