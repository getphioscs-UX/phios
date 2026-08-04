import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'scripts/book-i-manuscript-v1-3.mjs',
  'scripts/lib/knowledge-manuscripts/mapping-range-suggestion.mjs',
  'scripts/lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs',
  ...[1, 2, 3, 4, 5].map(number => `scripts/lib/knowledge-manuscripts/p${number}-mapping-review.mjs`)
];
const missing = required.filter(relative => !fs.existsSync(path.join(root, relative)));
if (missing.length) throw new Error(`KNR_W2R1_V1_3_FILES_MISSING: ${missing.join(', ')}`);

const engine = fs.readFileSync(path.join(root, 'scripts/lib/knowledge-manuscripts/mapping-range-suggestion.mjs'), 'utf8');
for (const marker of [
  'candidate_markdown',
  'chooseMonotonicStarts',
  'uniqueAnchor',
  'archiveStaleMappingReview',
  'mappingReviewIdentityMatches'
]) {
  if (!engine.includes(marker)) throw new Error(`KNR_W2R1_V1_3_ENGINE_MARKER_MISSING: ${marker}`);
}

const generator = fs.readFileSync(path.join(root, 'scripts/lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs'), 'utf8');
if (generator.includes('startHeading: inventoryPart.startHeading')) {
  throw new Error('KNR_W2R1_V1_3_LEGACY_WHOLE_PART_RANGE_PRESENT');
}
if (!generator.includes('suggestPartNodeRanges')) {
  throw new Error('KNR_W2R1_V1_3_RANGE_SUGGESTION_NOT_WIRED');
}

for (let number = 1; number <= 5; number += 1) {
  const file = path.join(root, `scripts/lib/knowledge-manuscripts/p${number}-mapping-review.mjs`);
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of ['mappingReviewIdentityMatches', 'archiveStaleMappingReview', 'stale_review_requires_regeneration']) {
    if (!text.includes(marker)) throw new Error(`P${number}_MAPPING_REVIEW_LIFECYCLE_MARKER_MISSING: ${marker}`);
  }
}

console.log('✓ PHI-OS-KNR-W2R1-v1.3.0 mapping lifecycle contract passed.');
