import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  P1_CANDIDATE_RELATIVE,
  P1_EXTRACTION_REPORT_RELATIVE,
  P1_HUMAN_REVIEW_RELATIVE,
  P1_R2_TARGET,
  REQUIRED_REVIEW_CHECKS
} from './lib/knowledge-manuscripts/p1-human-review.mjs';
import {
  P1_MAPPING_REVIEW_RELATIVE,
  REQUIRED_MAPPING_REVIEW_CHECKS
} from './lib/knowledge-manuscripts/p1-mapping-review.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const packageJson = json('package.json');
const manifest = json('content/knowledge/manuscripts/book-1/manuscript-manifest.json');
const inventory = json('content/knowledge/manuscripts/book-1/book-1-section-inventory.json');
const mapping = json('content/knowledge/manuscripts/book-1/node-manuscript-mapping.json');
const blueprint = json('content/knowledge/blueprints/book-1-knowledge-blueprint.json');

const expectedScripts = {
  'knowledge:manuscript:extract-p1': 'node scripts/extract-book-i-p1.mjs',
  'knowledge:manuscript:review-p1': 'node scripts/review-book-i-p1.mjs review',
  'knowledge:manuscript:upload-p1': 'node scripts/review-book-i-p1.mjs upload',
  'knowledge:manuscript:review-map-p1': 'node scripts/review-book-i-p1-mapping.mjs review',
  'knowledge:manuscript:apply-map-p1': 'node scripts/review-book-i-p1-mapping.mjs apply',
  'check:knr-w2r1-t09-p1': 'node scripts/check-knr-w2r1-t09-p1-progressive-extraction.mjs'
};
for (const [name, command] of Object.entries(expectedScripts)) assert.equal(packageJson.scripts[name], command);

assert.equal(P1_CANDIDATE_RELATIVE, '.tmp/knowledge-manuscripts/book-1/p1-reality-physics-candidate.md');
assert.equal(P1_EXTRACTION_REPORT_RELATIVE, '.tmp/knowledge-manuscripts/book-1/p1-reality-physics-extraction-report.json');
assert.equal(P1_HUMAN_REVIEW_RELATIVE, '.tmp/knowledge-manuscripts/book-1/p1-reality-physics-human-review.json');
assert.equal(P1_MAPPING_REVIEW_RELATIVE, '.tmp/knowledge-manuscripts/book-1/p1-node-mapping-review.json');
assert.equal(P1_R2_TARGET, 'books/book-1/extracted/p1-reality-physics.md');
assert.equal(REQUIRED_REVIEW_CHECKS.length, 9);
assert.equal(REQUIRED_MAPPING_REVIEW_CHECKS.length, 8);

const p1Manifest = manifest.parts.find(part => part.partCode === 'P1');
const p1Inventory = inventory.parts.find(part => part.partCode === 'P1');
const p1Blueprint = blueprint.parts.find(part => part.partCode === 'P1');
const p1Mappings = mapping.mappings.filter(record => record.partCode === 'P1');
assert(p1Manifest && p1Inventory && p1Blueprint);
assert.equal(p1Mappings.length, p1Blueprint.nodes.length);
assert.equal(p1Inventory.startHeading, '第一部｜现实物理学');
assert.equal(p1Inventory.endHeading, '第二部｜投影系统');

const preMaterialized = p1Manifest.normalizationStatus === 'not_materialized';
const humanVerified = p1Manifest.normalizationStatus === 'human_verified' && p1Manifest.humanVerified === true;
assert(preMaterialized || humanVerified, 'P1 must be not materialized or human verified');
if (preMaterialized) {
  assert.equal(p1Manifest.normalizedObjectKey, null);
  assert(p1Mappings.every(record => record.mappingStatus === 'unmapped'));
} else {
  assert.equal(p1Manifest.normalizedObjectKey, P1_R2_TARGET);
  assert.equal(manifest.contentHashes.normalizedParts.P1.length, 64);
  const candidateRound = p1Mappings.every(record => record.mappingStatus === 'candidate');
  const mappedRound = p1Mappings.every(record => record.mappingStatus === 'mapped');
  assert(candidateRound || mappedRound, 'P1 must be wholly candidate or atomically mapped');
}
for (const partCode of ['P2', 'P3', 'P4', 'P5']) {
  assert(mapping.mappings.filter(record => record.partCode === partCode)
    .every(record => record.mappingStatus === 'unmapped'));
}

const implementation = [
  'scripts/lib/knowledge-manuscripts/p1-searchable-pdf-extraction.mjs',
  'scripts/lib/knowledge-manuscripts/p1-human-review.mjs',
  'scripts/lib/knowledge-manuscripts/p1-mapping-review.mjs',
  'scripts/extract-book-i-p1.mjs',
  'scripts/review-book-i-p1.mjs',
  'scripts/review-book-i-p1-mapping.mjs'
].map(read).join('\n');
assert(!/publicUrl|presignedUrl|r2\.dev/u.test(implementation));
assert(!/content\/knowledge\/articles|content\/knowledge\/production|functions\/runtime/u.test(implementation));
assert(!/automatic.*(?:approved|mapped|published)/iu.test(implementation));
assert(implementation.includes('searchable_pdf_text_layer'));
assert(implementation.includes('human_review_required'));
assert(implementation.includes('private_mapped_only'));
assert(implementation.includes('mapping_metadata_only_no_continuous_body'));

console.log('✓ KNR-W2R1-T09 P1 Progressive Extraction contract passed.');
console.log('  P1 reuses the governed P0 sequence: searchable extraction → TL normalization review → private R2 → inventory → mapping candidates → atomic TL mapping.');
console.log('  P2–P5 remain unmapped; no public article, Runtime, Provider or publication authority is changed.');
