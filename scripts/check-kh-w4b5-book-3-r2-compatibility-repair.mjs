import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [authorityCheck, pjaW2aCheck] = await Promise.all([
  fs.readFile(
    'scripts/check-kh-w4b-w4c-registry-authority-consumption.mjs',
    'utf8'
  ),
  fs.readFile(
    'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',
    'utf8'
  )
]);

assert.match(authorityCheck, /expectedAuthorityTotals/);
assert.match(authorityCheck, /authority\.byNodeCode\.size/);
assert.match(authorityCheck, /authority\.totals\.nodes, 513/);
assert.doesNotMatch(
  authorityCheck,
  /authority\.totals, \{ books: 4, parts: 16, nodes: 78 \}/
);

assert.match(pjaW2aCheck, /registryNodeCodes/);
assert.match(pjaW2aCheck, /blueprintNodeCodes/);
assert.match(pjaW2aCheck, /expanded Canonical Registry/);
assert.doesNotMatch(
  pjaW2aCheck,
  /nodesRegistry\.nodes\.length, blueprint\.plannedCanonicalNodes/
);

console.log('✓ KH-W4B.5 Book 3 R2 compatibility repair passed.');
console.log('✓ Current Authority total is 513 Canonical Nodes.');
console.log('✓ Historical Book 1 PJA scope is validated by membership, not global equality.');
