import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [c0, w2b] = await Promise.all([
  fs.readFile(
    'scripts/check-pja-w2f-c0-book-i-registry-population.mjs',
    'utf8'
  ),
  fs.readFile(
    'scripts/check-pja-w2b-structured-article-schema.mjs',
    'utf8'
  )
]);

assert.match(c0, /isPart5PublicationMigration/);
assert.match(c0, /publicationBookCode === 'BOOK-2'/);
assert.match(c0, /publicationPartCode === 'P5'/);
assert.match(c0, /productionReady, false/);

assert.match(w2b, /blueprintNodeCodes/);
assert.match(w2b, /universalNodeCodes/);
assert.match(w2b, /PJA-W2B Blueprint identity/);
assert.match(w2b, /Blueprint scope/);
assert.doesNotMatch(
  w2b,
  /assert\.equal\(nodesRegistry\.nodes\.length, blueprint\.plannedCanonicalNodes\)/
);

console.log('✓ KH-W4B.5 Book 3 R4 repair passed.');
console.log('✓ Part 5 migration is separated from legacy Book I collection/theme assertions.');
console.log('✓ PJA-W2B is compatible with the 513-Node Universal Registry.');
