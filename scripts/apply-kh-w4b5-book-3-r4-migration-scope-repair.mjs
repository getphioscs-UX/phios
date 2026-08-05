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
      `  assert(node && identity, \`${'${blueprintNode.nodeCode}'}: Registry identity missing\`);
  assert(collectionByCode.has(node.collectionCode));`,
      `  assert(node && identity, \`${'${blueprintNode.nodeCode}'}: Registry identity missing\`);

  const isPart5PublicationMigration = (
    node.sourceBookCode === 'BOOK-1' &&
    node.publicationBookCode === 'BOOK-2' &&
    node.publicationPartCode === 'P5'
  );
  if (isPart5PublicationMigration) {
    assert.match(node.nodeCode, /^KN-B1-P5-\\d{3}$/);
    assert.equal(node.partCode, 'P5');
    assert.equal(node.productionReady, false);
    assert.equal(node.articleStatus, 'not_created');
    assert.equal(node.candidateStatus, 'not_created');
    continue;
  }

  assert(collectionByCode.has(node.collectionCode));`
    ]
  ]
);

await patch(
  'scripts/check-pja-w2b-structured-article-schema.mjs',
  [
    [
      `assert.equal(nodesRegistry.nodes.length, blueprint.plannedCanonicalNodes);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  blueprint.prefaceCanonicalNodes
);
const referencedThemeCodes = new Set(nodesRegistry.nodes.map(node => node.themeCode));
assert(
  [...referencedThemeCodes].every(themeCode =>
    themesRegistry.themes.some(theme => theme.themeCode === themeCode)
  )
);`,
      `const blueprintNodeCodes = new Set(
  (blueprint.nodes || []).map(node =>
    typeof node === 'string' ? node : node.nodeCode
  )
);
const universalNodeCodes = new Set(
  nodesRegistry.nodes.map(node => node.nodeCode)
);
assert.equal(blueprintNodeCodes.size, blueprint.plannedCanonicalNodes);
assert(
  [...blueprintNodeCodes].every(nodeCode => universalNodeCodes.has(nodeCode)),
  'Every PJA-W2B Blueprint identity must exist in the Universal Canonical Registry.'
);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  blueprint.prefaceCanonicalNodes
);
const referencedThemeCodes = new Set(
  nodesRegistry.nodes
    .filter(node => blueprintNodeCodes.has(node.nodeCode))
    .map(node => node.themeCode)
);
assert(
  [...referencedThemeCodes].every(themeCode =>
    themesRegistry.themes.some(theme => theme.themeCode === themeCode)
  ),
  'PJA-W2B validates Theme coverage only for its Blueprint scope.'
);`
    ]
  ]
);

console.log('✓ KH-W4B.5 Book 3 R4 migration and W2B scope repair applied.');
console.log('✓ Part 5 publication-migrated Nodes defer legacy collection/theme checks to KH-W4E.');
console.log('✓ PJA-W2B validates Blueprint membership inside the Universal Registry.');
console.log('✓ No Registry, Blueprint, Freeze or production data changed.');
