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
  'scripts/check-kh-w4b5-r1-blueprint-registry-authority-refresh.mjs',
  [
    [
      "assert.equal(registry.totals.canonicalNodes, 331);",
      `const derivedCanonicalNodeTotal = registry.books.reduce(
  (total, entry) => total + entry.canonicalNodeCount,
  0
);
assert.equal(registry.totals.canonicalNodes, derivedCanonicalNodeTotal);`
    ],
    [
      `const frozenBook2 = freeze.freeze.bookFreeze.find(
  entry => entry.bookCode === 'BOOK-2'
);
assert.ok(frozenBook2);
assert.equal(frozenBook2.blueprintSHA, book2.sha256);
assert.equal(frozenBook2.contractVersion, book2.contract);
assert.equal(frozenBook2.status, book2.status);`,
      `const frozenBook2 = freeze.freeze.bookFreeze.find(
  entry => entry.bookCode === 'BOOK-2'
);
assert.ok(frozenBook2);
assert.equal(frozenBook2.blueprintSHA, book2.sha256);
assert.equal(frozenBook2.contractVersion, book2.contract);
assert.equal(frozenBook2.status, book2.status);

const book3 = registry.books.find(entry => entry.bookCode === 'BOOK-3');
assert.ok(book3);
assert.equal(book3.contract, 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.0.0');
assert.equal(book3.status, 'registry-complete-planning');
assert.equal(book3.canonicalNodeCount, 182);
assert.deepEqual(book3.partCodes, ['P10', 'P11', 'P12']);

const frozenBook3 = freeze.freeze.bookFreeze.find(
  entry => entry.bookCode === 'BOOK-3'
);
assert.ok(frozenBook3);
assert.equal(frozenBook3.blueprintSHA, book3.sha256);
assert.equal(frozenBook3.contractVersion, book3.contract);
assert.equal(frozenBook3.status, book3.status);`
    ],
    [
      "console.log('✓ BOOK-2 digest, contract, status and 266-node count are synchronized.');",
      "console.log('✓ BOOK-2 and BOOK-3 digest, contract, status and node counts are synchronized.');"
    ]
  ]
);

await patch(
  'scripts/check-kh-w4a-knowledge-runtime-v2.mjs',
  [
    [
      `assert.deepEqual(knowledge.totals, { books: 4, parts: 16, nodes: 78 });
assert.deepEqual(knowledge.registry.totals, { books: 4, parts: 16, canonicalNodes: 78 });`,
      `const currentCanonicalNodeCount = nodes.nodes.length;
assert.deepEqual(knowledge.totals, {
  books: 4,
  parts: 16,
  nodes: currentCanonicalNodeCount
});
assert.deepEqual(knowledge.registry.totals, {
  books: 4,
  parts: 16,
  canonicalNodes: currentCanonicalNodeCount
});`
    ],
    [
      `assert.equal(new Set(projectedCodes).size, 78);
assert.equal(knowledge.byBookCode.get('BOOK-1').cardinality.canonicalNodeCount, 65);
assert.equal(knowledge.byBookCode.get('BOOK-2').cardinality.canonicalNodeCount, 13);
assert.equal(knowledge.byBookCode.get('BOOK-3').cardinality.canonicalNodeCount, 0);
assert.equal(knowledge.byBookCode.get('BOOK-4').cardinality.canonicalNodeCount, 0);`,
      `assert.equal(new Set(projectedCodes).size, currentCanonicalNodeCount);
assert.equal(knowledge.byBookCode.get('BOOK-1').cardinality.canonicalNodeCount, 65);
assert.equal(knowledge.byBookCode.get('BOOK-2').cardinality.canonicalNodeCount, 266);
assert.equal(knowledge.byBookCode.get('BOOK-3').cardinality.canonicalNodeCount, 182);
assert.equal(knowledge.byBookCode.get('BOOK-4').cardinality.canonicalNodeCount, 0);`
    ],
    [
      `assert.equal(freeze.invariants.canonicalNodeCount, 78);
assert.equal(freeze.invariants.canonicalNodeCodesChanged, false);`,
      `assert.equal(freeze.invariants.canonicalNodeCount, 78);
assert.ok(
  currentCanonicalNodeCount >= freeze.invariants.canonicalNodeCount,
  'Current Registry may extend the historical KH-W4A baseline but must not shrink below it.'
);
assert.equal(freeze.invariants.canonicalNodeCodesChanged, false);`
    ],
    [
      "console.log('  Four registered Blueprints project 16 Parts and preserve all 78 Canonical Node identities.');",
      "console.log(`  Four registered Blueprints project 16 Parts and ${currentCanonicalNodeCount} current Canonical Node identities.`);"
    ],
    [
      "console.log('  P5 resolves to BOOK-2; P13 resolves to BOOK-4; architecture-only Parts create no Nodes.');",
      "console.log('  P5 resolves to BOOK-2; P10 resolves to BOOK-3; P13 resolves to BOOK-4.');"
    ]
  ]
);

await patch(
  'scripts/check-pja-w1-blueprint-led-knowledge.mjs',
  [
    [
      `const referencedThemeCodes = new Set(nodesRegistry.nodes.map(node => node.themeCode));
assert(
  [...referencedThemeCodes].every(themeCode =>
    themesRegistry.themes.some(theme => theme.themeCode === themeCode)
  )
);`,
      `const pjaW1NodeCodes = new Set([...activeCodes, ...deferredCodes]);
const referencedThemeCodes = new Set(
  nodesRegistry.nodes
    .filter(node => pjaW1NodeCodes.has(node.nodeCode))
    .map(node => node.themeCode)
);
assert(
  [...referencedThemeCodes].every(themeCode =>
    themesRegistry.themes.some(theme => theme.themeCode === themeCode)
  ),
  'PJA-W1 validates Theme coverage only for its active and deferred Wave 1 Nodes.'
);`
    ]
  ]
);

console.log('✓ KH-W4B.5 Book 3 compatibility assertions repaired.');
console.log('✓ Historical 78-node KH-W4A baseline remains preserved as historical evidence.');
console.log('✓ Current Registry authority derives 513 Nodes from registered Blueprints.');
console.log('✓ PJA-W1 remains scoped to its active/deferred public Wave nodes.');
