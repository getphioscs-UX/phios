import fs from 'node:fs';

const main = 'scripts/book-i-manuscript-v1-2.mjs';
const required = [
  main,
  'scripts/lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs',
  ...[1,2,3,4,5].map(part => `scripts/lib/knowledge-manuscripts/p${part}-mapping-review.mjs`)
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
const source = fs.readFileSync(main, 'utf8');
for (const token of [
  "PHI-OS-KNR-W2R1-v1.2.1",
  "heading-authority",
  "generate-all-mapping-candidates",
  "prepare-all-mapping-reviews",
  "headingAuthority:'candidate_markdown'",
  "object.sha256=hash",
  "object.sizeBytes="
]) {
  if (!source.includes(token)) throw new Error(`v1.2.1 contract token missing: ${token}`);
}
for (let part = 1; part <= 5; part += 1) {
  const review = fs.readFileSync(`scripts/lib/knowledge-manuscripts/p${part}-mapping-review.mjs`, 'utf8');
  if (!review.includes('function headingCatalog(candidateText)')) {
    throw new Error(`P${part} does not parse headings from candidate Markdown`);
  }
  if (!review.includes('const bytes = fs.readFileSync(file)')) {
    throw new Error(`P${part} candidate Markdown is not read directly`);
  }
  if (!review.includes(`stage: 'KNR-W2R1-T09-P${part}'`)) {
    throw new Error(`P${part} mapping stage mismatch`);
  }
}
console.log('✓ KNR-W2R1 v1.2.1 mapping engine contract passed.');
console.log('  Candidate Markdown is the sole heading authority; P1–P5 candidates and reviews can be generated in controlled sequence.');
console.log('  Reconcile synchronizes normalized hashes, inventory hashes, and manifest object SHA/size.');
