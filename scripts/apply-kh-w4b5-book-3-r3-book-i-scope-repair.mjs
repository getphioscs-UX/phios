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
  'scripts/check-pja-w2f-c0-book-i-registry-population.mjs',
  [
    [
      `assert.equal(nodes.nodes.length, 78);
assert.equal(localized.localizedContent.length, 78);
assert.deepEqual(new Set(nodes.nodes.map(node => node.nodeCode)), new Set(blueprint.nodes.map(node => node.nodeCode)));
assert.deepEqual(new Set(localized.localizedContent.map(item => item.nodeCode)), new Set(blueprint.nodes.map(node => node.nodeCode)));`,
      `const book1BlueprintCodes = new Set(
  blueprint.nodes.map(node => node.nodeCode)
);
const book1RegistryNodes = nodes.nodes.filter(node =>
  book1BlueprintCodes.has(node.nodeCode)
);
assert.equal(book1RegistryNodes.length, 78);
assert.equal(localized.localizedContent.length, 78);
assert.deepEqual(
  new Set(book1RegistryNodes.map(node => node.nodeCode)),
  book1BlueprintCodes
);
assert.deepEqual(
  new Set(localized.localizedContent.map(item => item.nodeCode)),
  book1BlueprintCodes
);
assert(
  nodes.nodes.length >= book1RegistryNodes.length,
  'Universal Canonical Registry may contain Books II–IV beyond Book I C0 scope.'
);`
    ]
  ]
);

await patch(
  'scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',
  [
    [
      `assert.equal(
  nodesRegistry.nodes.every(node => blueprint.nodes.some(item => item.nodeCode === node.nodeCode)),
  true,
  'Canonical Node Registry contains an identity outside the Book I Blueprint.'
);`,
      `const universalNodeCodes = new Set(
  nodesRegistry.nodes.map(node => node.nodeCode)
);
assert.equal(
  blueprint.nodes.every(item => universalNodeCodes.has(item.nodeCode)),
  true,
  'Every Book I Blueprint identity must exist in the Universal Canonical Node Registry.'
);`
    ]
  ]
);

console.log('✓ KH-W4B.5 Book 3 R3 Book I scope repair applied.');
console.log('✓ PJA C0 validates only the 78 Book I identities inside the Universal Registry.');
console.log('✓ PJA W2A validates Book I membership without rejecting Books II–IV.');
console.log('✓ No Registry, Blueprint, Freeze or production data changed.');
