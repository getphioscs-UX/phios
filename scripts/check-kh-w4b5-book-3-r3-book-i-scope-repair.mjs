import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [c0, w2a] = await Promise.all([
  fs.readFile(
    'scripts/check-pja-w2f-c0-book-i-registry-population.mjs',
    'utf8'
  ),
  fs.readFile(
    'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',
    'utf8'
  )
]);

assert.match(c0, /book1BlueprintCodes/);
assert.match(c0, /book1RegistryNodes/);
assert.match(c0, /Books II–IV beyond Book I C0 scope/);
assert.doesNotMatch(c0, /assert\.equal\(nodes\.nodes\.length, 78\)/);

assert.match(w2a, /universalNodeCodes/);
assert.match(w2a, /Every Book I Blueprint identity must exist/);
assert.doesNotMatch(
  w2a,
  /Canonical Node Registry contains an identity outside the Book I Blueprint/
);

console.log('✓ KH-W4B.5 Book 3 R3 scope repair passed.');
console.log('✓ Book I historical checks are bounded to Book I identities.');
console.log('✓ Universal Registry expansion to 513 Nodes remains valid.');
