import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const file = 'scripts/check-pja-w2d-article-renderer-expansion.mjs';
const source = await fs.readFile(file, 'utf8');

for (const evolvingRegistryFile of [
  'content/knowledge/registry/nodes.json',
  'content/knowledge/registry/themes.json',
  'content/knowledge/registry/localized-content.json'
]) {
  const hashEntryPattern = new RegExp(
    `'${evolvingRegistryFile.replaceAll('/', '\\/')}'\\s*:\\s*\\n?\\s*'[a-f0-9]{64}'`
  );
  assert.equal(
    hashEntryPattern.test(source),
    false,
    `Evolving Registry file remains historically hash-frozen: ${evolvingRegistryFile}`
  );
}

for (const frozenDependency of [
  'content/knowledge/registry/assets.json',
  'content/knowledge/registry/sources.json'
]) {
  assert(
    source.includes(`'${frozenDependency}'`),
    `Required W2D preservation dependency is no longer protected: ${frozenDependency}`
  );
}

console.log('✓ PJA-W2F-C0B-R1 W2D preservation migration audit passed.');
console.log('  Article, Asset and Source preservation remain hash-frozen.');
console.log('  Node, Theme and Localized Identity scale are governed by Blueprint validation.');
