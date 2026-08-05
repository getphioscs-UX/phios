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
      "assert.equal(book3.contract, 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.0.0');",
      "assert.equal(book3.contract, 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.1.0');"
    ],
    [
      "assert.equal(book3.canonicalNodeCount, 182);",
      "assert.equal(book3.canonicalNodeCount, 187);"
    ]
  ]
);

await patch(
  'scripts/check-kh-w4a-knowledge-runtime-v2.mjs',
  [
    [
      "assert.equal(knowledge.byBookCode.get('BOOK-3').cardinality.canonicalNodeCount, 182);",
      "assert.equal(knowledge.byBookCode.get('BOOK-3').cardinality.canonicalNodeCount, 187);"
    ]
  ]
);

console.log('✓ Final Book 3 checker expectations updated.');
console.log('✓ BOOK-3 contract v2.1.0 and 187-node authority are now accepted.');
console.log('✓ No Registry, Blueprint, Freeze or production data changed.');
