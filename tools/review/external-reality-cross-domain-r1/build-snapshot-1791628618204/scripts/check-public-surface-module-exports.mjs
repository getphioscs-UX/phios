import assert from 'node:assert/strict';

const publicSurface = await import('../assets/js/web-production/public-surface-data.js');
const publishedContent = await import('../assets/js/knowledge/published-content.js');

for (const name of [
  'loadFiveVolumePublicationContextRegistry',
  'resolvePublicationContextForNode',
  'resolveFigurePublicationContext',
  'readingPathVolumeTransition'
]) {
  assert.equal(
    typeof publicSurface[name],
    'function',
    `Missing public-surface-data export: ${name}`
  );
}

assert.equal(
  publicSurface.PUBLICATION_CONTEXT_RUNTIME_POLICY
    ?.nodeCodePrefixUsedForBookInference,
  false
);

for (const name of [
  'loadPublishedArticleBySlug',
  'loadPublishedArticles'
]) {
  assert.equal(
    typeof publishedContent[name],
    'function',
    `Published content import graph is broken: ${name}`
  );
}

console.log('✓ Public article ESM import graph passed.');
console.log('✓ Five-volume publication-context runtime exports are available.');
console.log('✓ published-content.js can import successfully.');
