import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  parseArticleFigurePlacement,
  projectStructuredFigureBinding,
  resolveCanonicalArticleVisualBinding
} from './lib/visual-article-production/article-figure-binding-v1.mjs';
import { renderArticleDocument } from '../assets/js/knowledge/article-renderer.js';

const root = process.cwd();
const read = rel => fs.readFile(path.join(root, rel), 'utf8');
const readJson = async rel => JSON.parse(await read(rel));

const [contract20, registry20, audit20, contract21, acceptance, activation, carPublished, carMedia, publicAssets, publishedArticle, pkg, rendererSource, assetSource] = await Promise.all([
  readJson('content/production/visual-article/contracts/vap-w20-canonical-article-visual-binding-v1.json'),
  readJson('content/production/visual-article/registries/vap-w20-article-figure-binding-registry-v1.json'),
  readJson('content/production/visual-article/audits/vap-w20-canonical-article-visual-binding-audit-v1.json'),
  readJson('content/production/visual-article/contracts/vap-w21-structured-figure-block-projection-v1.json'),
  readJson('content/production/visual-article/acceptance/vap-w20-w21-acceptance-v1.json'),
  readJson('content/production/visual-article/activation/vap-w20-w21-article-figure-binding-v1.json'),
  readJson('content/professional/canonical-asset-runtime/registries/published-asset-registry-v1.json'),
  readJson('content/professional/canonical-asset-runtime/registries/asset-media-registry-v1.json'),
  readJson('content/registry/public-assets.json'),
  readJson('content/knowledge/articles/zh-Hans/why-phi-os-is-needed.json'),
  readJson('package.json'),
  read('assets/js/knowledge/article-renderer.js'),
  read('assets/js/knowledge/article-assets.js')
]);

assert.equal(contract20.work, 'VAP-W20');
assert.equal(contract20.authority.articleOwnsImage, false);
assert.equal(contract20.authority.articleReferencesPublishedAsset, true);
assert.equal(contract20.authority.publishedVisualAssetAuthority, 'CAR');
assert.equal(contract20.authority.vapMayPublishFigure, false);
assert.equal(contract20.authority.vapMayMutateCarFrozenRegistry, false);
assert.equal(contract20.bindingContract.articleBodyMutationRequired, false);
assert.equal(contract20.bindingContract.stableSectionCodeRequired, true);
assert.equal(contract20.failClosedRules.unverifiedLegacyFigureGroup, 'BLOCK');

assert.equal(carPublished.productionStatus, 'validation_only');
assert.equal(carPublished.publications.length, 0);
assert.equal(carMedia.productionStatus, 'validation_only');
assert.equal(carMedia.media.length, 0);
assert.equal(registry20.bindings.length, 0);
assert.equal(registry20.liveBindingCount, 0);
assert.equal(registry20.pendingRequirements.length, 1);
assert.equal(registry20.pendingRequirements[0].nodeCode, 'KN-PREFACE-004');
assert(registry20.pendingRequirements[0].blockers.includes('CAR_PUBLISHED_FIGURE_ABSENT'));
assert(registry20.pendingRequirements[0].blockers.includes('PUBLISHED_ARTICLE_STABLE_SECTION_CODE_ABSENT'));
assert.equal(audit20.result, 'BLOCKED_UPSTREAM_NO_CANONICAL_PUBLISHED_FIGURE');
assert.equal(activation.liveBindingMaterialized, false);
assert.equal(activation.liveArticleMutated, false);
assert.equal(activation.carRegistryMutated, false);

const legacyGroup = publicAssets.assets.find(asset => asset.asset_code === 'BOOK-1-FIGURES');
assert(legacyGroup);
assert(legacyGroup.object_key.endsWith('/'));
assert.match(legacyGroup.verification, /^pending/);
assert.equal(contract20.currentBaseline.legacyBookFigureGroupRenderable, false);
assert.equal(publishedArticle.publicationStatus, 'published');
assert(publishedArticle.sections.every(section => !section.sectionCode));

assert.deepEqual(parseArticleFigurePlacement('after_section:S04'), { mode: 'after_section', sectionCode: 'S04' });
assert.throws(() => parseArticleFigurePlacement('after_heading:四'), error => error.code === 'VAP_W20_PLACEMENT_INVALID');

const binding = {
  bindingCode: 'VAP-W20-BIND-TEST-001',
  articleAssetCode: 'KA-TEST-ARTICLE',
  nodeCode: 'KN-TEST-001',
  locale: 'zh-Hans',
  assetCode: 'ASSET-KN-TEST-001-FIGURE-001',
  publicationCode: 'CAR-PUB-ASSET-KN-TEST-001-FIGURE-001',
  publicationDigest: 'a'.repeat(64),
  placement: 'after_section:S04',
  displayMode: 'wide',
  creditLabel: 'PHI OS',
  bindingState: 'active'
};
const article = {
  assetCode: 'KA-TEST-ARTICLE',
  nodeCode: 'KN-TEST-001',
  locale: 'zh-Hans',
  publicationStatus: 'published',
  sections: [
    { sectionCode: 'S03', heading: 'Before', paragraphs: ['Before paragraph.'] },
    { sectionCode: 'S04', heading: 'Mechanism', paragraphs: ['Mechanism paragraph one.', 'Mechanism paragraph two.'] }
  ]
};
const fixtureCar = {
  productionStatus: 'production',
  publications: [{
    publicationCode: binding.publicationCode,
    assetCode: binding.assetCode,
    assetType: 'FIGURE',
    publicationState: 'published',
    surface: 'WEBSITE',
    locale: 'zh-Hans',
    publicationDigest: binding.publicationDigest
  }]
};
const resolved = resolveCanonicalArticleVisualBinding({ binding, article, publishedAssetRegistry: fixtureCar });
assert.equal(resolved.publication.assetCode, binding.assetCode);

const wrongDigest = structuredClone(binding);
wrongDigest.publicationDigest = 'b'.repeat(64);
assert.throws(
  () => resolveCanonicalArticleVisualBinding({ binding: wrongDigest, article, publishedAssetRegistry: fixtureCar }),
  error => error.code === 'VAP_W20_PUBLICATION_DIGEST_MISMATCH'
);
assert.throws(
  () => resolveCanonicalArticleVisualBinding({ binding, article: { ...article, sections: [{ sectionCode: 'S03', paragraphs: ['x'] }] }, publishedAssetRegistry: fixtureCar }),
  error => error.code === 'VAP_W20_TARGET_SECTION_NOT_STABLE'
);
assert.throws(
  () => resolveCanonicalArticleVisualBinding({ binding, article, publishedAssetRegistry: carPublished }),
  error => error.code === 'VAP_W20_CAR_REGISTRY_VALIDATION_ONLY'
);

assert.equal(contract21.work, 'VAP-W21');
assert.equal(contract21.existingCapabilitiesReused.figureBlockType, 'figure');
assert.equal(contract21.existingCapabilitiesReused.secondImageRendererCreated, false);
assert.equal(contract21.currentBaseline.liveStructuredFigureProjectionCount, 0);

const publicArticle = {
  ...article,
  title: 'Fixture article',
  summary: 'Fixture summary',
  displayQuestion: 'Fixture question?',
  shortAnswer: 'Fixture short answer.',
  readingTimeMinutes: 2,
  publishedAt: '2026-08-11T00:00:00.000Z',
  hero: null,
  keyConcepts: [],
  publicSources: [],
  knowledgeBoundary: [],
  connections: { previousNode: null, nextNode: null, relatedNodes: [], relatedArticles: [] },
  publicHref: '/articles/fixture',
  visualAssets: []
};
const publishedVisualAssets = [{
  assetCode: binding.assetCode,
  assetType: 'mechanism_diagram',
  publicSrc: '/assets/images/figures/test-fixture.webp',
  altText: 'Fixture mechanism figure showing a governed visual relationship.',
  caption: 'Fixture caption for renderer acceptance.',
  width: 1200,
  height: 800,
  publicProjection: true
}];
const projected = projectStructuredFigureBinding({ publicArticle, resolvedBinding: resolved, publishedVisualAssets });
assert.equal(projected.figureReferences.length, 1);
assert.equal(projected.figureReferences[0].assetCode, binding.assetCode);
const target = projected.sections.find(section => section.sectionCode === 'S04');
assert(target);
assert.equal(Array.isArray(target.paragraphs), false);
assert.equal(target.blocks.filter(block => block.type === 'paragraph').length, 2);
assert.equal(target.blocks.at(-1).type, 'figure');
assert.equal(target.blocks.at(-1).assetCode, binding.assetCode);

assert(rendererSource.includes("case 'figure'"));
assert(rendererSource.includes("documentRef.createElement('figure')"));
assert(rendererSource.includes('createPublishedPicture(documentRef, asset'));
assert(assetSource.includes("documentRef.createElement('picture')"));
assert(assetSource.includes("documentRef.createElement('img')"));
assert(assetSource.includes("image.setAttribute('src', asset.publicSrc)"));
assert(assetSource.includes("image.setAttribute('alt', altText || asset.altText)"));
assert(assetSource.includes("image.setAttribute('width', String(asset.width))"));
assert(assetSource.includes("image.setAttribute('height', String(asset.height))"));

let domRendered = false;
try {
  const { parseHTML } = await import('linkedom');
  const { document } = parseHTML('<!doctype html><html><body></body></html>');
  const rendered = renderArticleDocument(document, projected, { publishedArticles: [], translate: key => key });
  assert.equal(rendered.querySelectorAll('figure').length, 1);
  assert.equal(rendered.querySelectorAll('picture').length, 1);
  assert.equal(rendered.querySelectorAll('img').length, 1);
  const image = rendered.querySelector('img');
  assert.equal(image.getAttribute('src'), publishedVisualAssets[0].publicSrc);
  assert.equal(image.getAttribute('alt'), publishedVisualAssets[0].altText);
  assert.equal(image.getAttribute('width'), '1200');
  assert.equal(image.getAttribute('height'), '800');
  assert.equal(rendered.querySelector('figcaption').textContent, publishedVisualAssets[0].caption);
  domRendered = true;
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

assert.equal(acceptance.status, 'ACCEPTED_CAPABILITY_READY_LIVE_BINDING_BLOCKED_UPSTREAM');
assert.equal(acceptance.productionReality.liveBindingCount, 0);
assert.equal(acceptance.productionReality.falseActivationForbidden, true);

assert.equal(pkg.scripts['check:vap-w20'], 'node scripts/check-vap-w20-w21-article-figure-binding.mjs VAP-W20');
assert.equal(pkg.scripts['check:vap-w21'], 'node scripts/check-vap-w20-w21-article-figure-binding.mjs VAP-W21');
assert.equal(pkg.scripts['check:vap-w20-w21'], 'node scripts/check-vap-w20-w21-article-figure-binding.mjs');
assert.equal(pkg.scripts['check:vap-d'], 'npm run check:vap-w20-w21');
const postcheckTokens = pkg.scripts.postcheck.split('&&').map(value => value.trim()).filter(Boolean);
assert(postcheckTokens.includes('npm run check:vap-d'));

console.log('✓ VAP-W20/W21 Article ↔ Figure Binding foundation passed.');
console.log('✓ Article references CAR Published Asset authority; Article never owns, approves or publishes the Figure.');
console.log('✓ Existing figure block, published visual resolver, <picture>/<img> factory and Article renderer are reused; no second image renderer exists.');
console.log(domRendered ? '✓ Controlled acceptance fixture renders one governed Figure block after S04 with publicSrc, alt, caption, width and height.' : '✓ Structured Figure projection and existing <figure>/<picture>/<img> renderer path validated; DOM execution is additionally exercised when linkedom is installed.');
console.log('✓ Current main remains fail-closed at 0 live bindings because CAR has 0 Published Assets and the target legacy Published Article has no stable sectionCode identity.');
