import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [r1, w4a] = await Promise.all([
  fs.readFile(
    'scripts/check-kh-w4b5-r1-blueprint-registry-authority-refresh.mjs',
    'utf8'
  ),
  fs.readFile(
    'scripts/check-kh-w4a-knowledge-runtime-v2.mjs',
    'utf8'
  )
]);

assert.match(
  r1,
  /PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2\.1\.0/
);
assert.match(r1, /book3\.canonicalNodeCount, 187/);
assert.doesNotMatch(
  r1,
  /PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2\.0\.0/
);
assert.doesNotMatch(r1, /book3\.canonicalNodeCount, 182/);

assert.match(
  w4a,
  /BOOK-3'\)\.cardinality\.canonicalNodeCount, 187/
);
assert.doesNotMatch(
  w4a,
  /BOOK-3'\)\.cardinality\.canonicalNodeCount, 182/
);

console.log('✓ KH-W4B.5 Book 3 Final R1 checker repair passed.');
console.log('✓ Final BOOK-3 contract: v2.1.0.');
console.log('✓ Final BOOK-3 canonical node count: 187.');
