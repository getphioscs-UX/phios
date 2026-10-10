import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const targets = [
  'scripts/check-pja-w1-blueprint-led-knowledge.mjs',
  'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',
  'scripts/check-pja-w2b-structured-article-schema.mjs',
  'scripts/check-pja-w2c-claim-source-review-governance.mjs',
  'scripts/check-pja-w2d-article-renderer-expansion.mjs',
  'scripts/check-pja-w2e-production-tools.mjs',
  'scripts/check-pja-w2e-r1-production-brief-hardening.mjs',
  'scripts/check-pja-w2f-a-universal-production-readiness.mjs',
  'scripts/check-pja-w2f-b1-preface-content-population.mjs'
];

const obsoletePatterns = [
  /assert\.equal\(\s*[A-Za-z_$][A-Za-z0-9_$]*\.nodes\.length\s*,\s*13\s*\);/,
  /assert\.equal\(\s*[A-Za-z_$][A-Za-z0-9_$]*\.themes\.length\s*,\s*6\s*\);/
];

const unresolved = [];
for (const file of targets) {
  let content;
  try {
    content = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }

  for (const pattern of obsoletePatterns) {
    if (pattern.test(content)) {
      unresolved.push(`${file}: ${pattern}`);
    }
  }
}

assert.deepEqual(
  unresolved,
  [],
  `Historical PJA Registry assertions remain:\n${unresolved.join('\n')}`
);

console.log('✓ PJA-W2F-C0B Historical PJA Registry Migration audit passed.');
console.log('  No targeted PJA checker treats the complete Registry as permanently fixed at 13 Nodes or 6 Themes.');
console.log('  Preface coverage remains independently protected while Book I totals follow the Blueprint.');
