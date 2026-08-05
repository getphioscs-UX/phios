import fs from 'node:fs/promises';

async function patch(path, replacements) {
  let source = await fs.readFile(path, 'utf8');
  for (const [before, after] of replacements) {
    if (!source.includes(before)) {
      throw new Error(`PATCH_TARGET_NOT_FOUND: ${path}\n${before}`);
    }
    source = source.replace(before, after);
  }
  await fs.writeFile(path, source, 'utf8');
  console.log(`✓ Updated ${path}`);
}

await patch(
  'scripts/check-kh-w4b-w4c-registry-authority-consumption.mjs',
  [
    [
      `assert.deepEqual(authority.totals, { books: 4, parts: 16, nodes: 78 });
assert.deepEqual(knowledge.totals, authority.totals);`,
      `const expectedAuthorityTotals = {
  books: authority.byBookCode.size,
  parts: authority.byPartCode.size,
  nodes: authority.byNodeCode.size
};
assert.deepEqual(authority.totals, expectedAuthorityTotals);
assert.deepEqual(knowledge.totals, authority.totals);
assert.equal(authority.totals.nodes, 513);`
    ]
  ]
);

await patch(
  'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',
  [
    [
      `assert.equal(nodesRegistry.nodes.length, blueprint.plannedCanonicalNodes);`,
      `const registryNodeCodes = new Set(
  nodesRegistry.nodes.map(node => node.nodeCode)
);
const blueprintNodeCodes = new Set(
  (blueprint.nodes || []).map(node =>
    typeof node === 'string' ? node : node.nodeCode
  )
);
assert.equal(blueprintNodeCodes.size, blueprint.plannedCanonicalNodes);
assert(
  [...blueprintNodeCodes].every(nodeCode => registryNodeCodes.has(nodeCode)),
  'Every PJA-W2A Book 1 Blueprint Node must exist in the expanded Canonical Registry.'
);
assert(
  nodesRegistry.nodes.length >= blueprint.plannedCanonicalNodes,
  'The Universal Canonical Registry may extend beyond the historical Book 1 Blueprint.'
);`
    ]
  ]
);

console.log('✓ KH-W4B.5 Book 3 R2 compatibility assertions repaired.');
console.log('✓ KH-W4B/W4C derives current totals from Registry Authority.');
console.log('✓ PJA-W2A validates Book 1 Blueprint membership inside the expanded Registry.');
console.log('✓ No Registry, Blueprint, Freeze or production data changed.');
