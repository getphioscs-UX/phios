import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';

import {
  ARTICLE_BLOCK_TYPES
} from '../assets/js/knowledge/article-blocks.js';
import {
  ArticleRenderError
} from '../assets/js/knowledge/article-errors.js';
import {
  createPublicArticleProjection
} from '../assets/js/knowledge/article-projection.js';
import {
  renderArticleDocument
} from '../assets/js/knowledge/article-renderer.js';
import {
  loadPublishedArticles
} from '../assets/js/knowledge/published-content.js';

const root = process.cwd();
const renderingFixtureDirectory =
  'tests/fixtures/knowledge/rendering';
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file))
  .then(() => true, () => false);
const listJson = async directory => (await fs.readdir(
  path.join(root, directory),
  { withFileTypes: true }
))
  .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
  .map(entry => entry.name)
  .sort();
const sha256 = value => crypto
  .createHash('sha256')
  .update(value)
  .digest('hex');

const expectedArticleHashes = Object.freeze({
  'content/knowledge/articles/en/why-explanation-does-not-equal-understanding.json':
    'b7e9a25b78c67aefd976a36cd35f1865e413872fb589d29bced9b2f737402110',
  'content/knowledge/articles/en/why-navigation-begins-with-reality-position.json':
    'da8b61afd3ac18254439371f75d3be48699c34e1d54c32f5e3d8d17a1cef5aef',
  'content/knowledge/articles/en/why-phi-os-is-needed.json':
    '324764afa4e9c4bf9a86e44b0f91245cfd7d2572af9e6da3ec1cd11e60732169',
  'content/knowledge/articles/zh-Hans/why-explanation-does-not-equal-understanding.json':
    'f0e5d6f422575770ce1291753cbd90ceebc88480268fc22d9ab9316bc426b6d1',
  'content/knowledge/articles/zh-Hans/why-navigation-begins-with-reality-position.json':
    '229e4f4fca008df9ea9bcd95e59ae367f49c256ee09102aa494d13236b99d869',
  'content/knowledge/articles/zh-Hans/why-phi-os-is-needed.json':
    'fae12d4d1356cf5a955d9087144de427020a93b47fc20207f674b5625995811b'
});

const expectedRegistryHashes = Object.freeze({
  'content/knowledge/registry/assets.json':
    'd5bf0ed9374d9c22607ee427becde123578032b9059227e32721c5c991167b31',
  'content/knowledge/registry/sources.json':
    'dec895da7e91a8f83a95508c6334566b79d7871c1d3b27b498a7129731669740'
});

const validFixtures = [
  'valid-legacy-article-render.json',
  'valid-structured-all-blocks-render.json',
  'valid-article-without-hero.json',
  'valid-article-with-optional-figure-missing.json',
  'valid-public-sources-render.json',
  'valid-related-nodes-filtering.json',
  'valid-next-node-render.json',
  'valid-zh-hans-render.json'
];
const invalidFixtures = [
  'invalid-unknown-block-render.json',
  'invalid-raw-html-render.json',
  'invalid-javascript-url-source.json',
  'invalid-external-asset-url.json',
  'invalid-unpublished-asset-render.json',
  'invalid-unpublished-next-node-render.json',
  'invalid-node-url-injection.json',
  'invalid-innerhtml-content-render.json',
  'invalid-duplicate-h1-render.json',
  'invalid-heading-order-render.json',
  'invalid-question-as-button-render.json',
  'invalid-figure-without-alt-render.json',
  'invalid-internal-source-projection.json',
  'invalid-review-data-public-render.json',
  'invalid-horizontal-overflow-content.json'
];

const [
  nodesRegistry,
  themesRegistry,
  localizedRegistry,
  assetsRegistry,
  sourcesRegistry,
  packageJson,
  coordinatorSource,
  rendererSource,
  blockSource,
  assetSource,
  linkSource,
  sourceSource,
  projectionSource,
  errorSource,
  rendererCss,
  knowledgeCss,
  enLocale,
  zhLocale
] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/sources.json'),
  readJson('package.json'),
  read('assets/js/pages/article.js'),
  read('assets/js/knowledge/article-renderer.js'),
  read('assets/js/knowledge/article-blocks.js'),
  read('assets/js/knowledge/article-assets.js'),
  read('assets/js/knowledge/article-links.js'),
  read('assets/js/knowledge/article-sources.js'),
  read('assets/js/knowledge/article-projection.js'),
  read('assets/js/knowledge/article-errors.js'),
  read('assets/css/article-renderer.css'),
  read('assets/css/knowledge-release.css'),
  read('assets/js/locales/en/knowledge.js'),
  read('assets/js/locales/zh-Hans/knowledge.js')
]);

const historicalRegistryBlueprint = await readJson(
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json'
);
assert.equal(
  nodesRegistry.nodes.length,
  historicalRegistryBlueprint.plannedCanonicalNodes
);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  historicalRegistryBlueprint.prefaceCanonicalNodes
);
assert.equal(
  themesRegistry.themes.filter(theme => theme.themeCode.startsWith('TH-PREFACE-')).length,
  6
);
assert.equal(
  themesRegistry.themes.length,
  6 + historicalRegistryBlueprint.sourceParts
);
assert.equal((await listJson('content/knowledge/registry')).length, 12);
assert.equal((await listJson('content/knowledge/registry/schemas')).length, 12);
assert.equal(assetsRegistry.assets.length, 12);
assert.equal(sourcesRegistry.sources.length, 12);

for (const [file, expectedHash] of Object.entries({
  ...expectedArticleHashes,
  ...expectedRegistryHashes
})) {
  assert.equal(
    sha256(await read(file)),
    expectedHash,
    `Frozen PJA-W2D publication dependency changed: ${file}`
  );
}

assert.equal(
  await exists(
    'content/knowledge/articles/zh-Hans/' +
    'ai-formation-from-civilizational-capability.json'
  ),
  false
);
assert.equal(
  await exists(
    'content/knowledge/articles/en/' +
    'ai-formation-from-civilizational-capability.json'
  ),
  false
);
assert.equal(
  await exists('articles/ai-formation-from-civilizational-capability.html'),
  false
);
const prefaceLocalized = localizedRegistry.localizedContent.find(
  record => record.nodeCode === 'KN-PREFACE-001'
);
assert.equal(
  prefaceLocalized.locales['zh-Hans'].publicationStatus,
  'not_published'
);
assert.equal(
  prefaceLocalized.locales.en.contentStatus,
  'localization_pending'
);
assert.equal(
  prefaceLocalized.locales.en.publicationStatus,
  'not_published'
);

const executionModules = [
  coordinatorSource,
  rendererSource,
  blockSource,
  assetSource,
  linkSource,
  sourceSource,
  projectionSource,
  errorSource
];
for (const moduleSource of executionModules) {
  for (const unsafeDomApi of [
    '.innerHTML',
    '.outerHTML',
    'insertAdjacentHTML',
    'document.write'
  ]) {
    assert.equal(
      moduleSource.includes(unsafeDomApi),
      false,
      `Unsafe DOM API entered Article rendering: ${unsafeDomApi}`
    );
  }
  for (const forbiddenDependency of [
    "from '../runtime",
    "from '../providers",
    "from '../payments",
    "from '../entitlements",
    '/api/',
    'RuntimeKernel',
    'providerInvocation(',
    'paymentAction('
  ]) {
    assert.equal(
      moduleSource.includes(forbiddenDependency),
      false,
      `Renderer crossed a frozen authority boundary: ${forbiddenDependency}`
    );
  }
}

assert(coordinatorSource.includes('root.replaceChildren('));
assert(rendererSource.includes('documentRef.createElement('));
assert(rendererSource.includes('.textContent ='));
assert(rendererSource.includes("case 'paragraph'"));
assert(rendererSource.includes("case 'next_node'"));
assert(blockSource.includes('ARTICLE_BLOCK_TYPES'));
assert.deepEqual(ARTICLE_BLOCK_TYPES, [
  'paragraph',
  'lead',
  'question',
  'insight',
  'mechanism',
  'timeline',
  'comparison',
  'figure',
  'transition',
  'next_node'
]);
assert(assetSource.includes('PUBLIC_VISUAL_TYPES'));
assert(assetSource.includes('SAFE_ASSET_PATH'));
assert(
  assetSource.includes(
    "image.setAttribute('loading', eager ? 'eager' : 'lazy')"
  )
);
assert(assetSource.includes("image.setAttribute('decoding', 'async')"));
assert(linkSource.includes("value.startsWith('//')"));
assert(sourceSource.includes('PUBLIC_SOURCE_USES'));
assert(projectionSource.includes('createPublicArticleProjection'));
assert(projectionSource.includes('publicSources'));
assert.equal(projectionSource.includes('...content'), false);

for (const privateProjectionField of [
  'claimDossier',
  'supportAssessment',
  'contrarySourceCodes',
  'reviewerId',
  'reviewedBy',
  'sourceClaimCodes'
]) {
  assert.equal(
    rendererSource.includes(privateProjectionField),
    false,
    `Private governance field entered the Renderer: ${privateProjectionField}`
  );
}

for (const shellFile of [
  'articles/why-phi-os-is-needed.html',
  'articles/why-explanation-does-not-equal-understanding.html',
  'articles/why-navigation-begins-with-reality-position.html'
]) {
  const shell = await read(shellFile);
  assert(shell.includes('/assets/css/article-renderer.css'));
  assert(shell.includes('data-article-slug='));
  assert(shell.includes('/assets/js/pages/article.js'));
  const mount = shell.match(
    /<main[^>]+data-article-slug="[^"]+"[^>]*>([\s\S]*?)<\/main>/
  );
  assert(mount);
  assert.equal(mount[1].trim(), '');
}

for (const localeSource of [enLocale, zhLocale]) {
  for (const key of [
    'loading',
    'unavailable',
    'invalidContent',
    'keyConcepts',
    'sources',
    'boundary',
    'related',
    'continueReading',
    'readingTime',
    'minutes',
    'publishedOn',
    'updatedOn',
    'tableOfContents',
    'nextNodeUnavailable',
    'knowledgeHub'
  ]) {
    assert(
      localeSource.includes(`${key}:`),
      `Locale dictionary omits Article string: ${key}`
    );
  }
}

assert(rendererCss.includes('@media (max-width: 900px)'));
assert(rendererCss.includes('@media (max-width: 620px)'));
assert(rendererCss.includes('@media (prefers-reduced-motion: reduce)'));
assert(rendererCss.includes('overflow-wrap: anywhere'));
assert(rendererCss.includes('max-width: 100%'));
assert(rendererCss.includes('min-height: 44px'));
assert(knowledgeCss.includes('width: min(960px, calc(100% - 2.5rem))'));

const originalFetch = globalThis.fetch;
globalThis.fetch = async requestPath => {
  const publicPath = String(requestPath).replace(/^\/+/, '');
  try {
    const body = await fs.readFile(path.join(root, publicPath), 'utf8');
    return {
      ok: true,
      async json() {
        return JSON.parse(body);
      }
    };
  } catch {
    return {
      ok: false,
      async json() {
        return null;
      }
    };
  }
};
const [publishedChinese, publishedEnglish] = await Promise.all([
  loadPublishedArticles('zh-Hans'),
  loadPublishedArticles('en')
]);
globalThis.fetch = originalFetch;
assert.equal(publishedChinese.length, 3);
assert.equal(publishedEnglish.length, 3);
for (const publicArticle of [
  ...publishedChinese,
  ...publishedEnglish
]) {
  const publicJson = JSON.stringify(publicArticle);
  assert.equal(publicArticle.publicSources.length, 1);
  assert.equal(publicArticle.sections.length, 4);
  for (const privateField of [
    'contentStatus',
    'reviewStatus',
    'publicationStatus',
    'sourceClaimCodes',
    'reviewedBy',
    'reviewerId'
  ]) {
    assert.equal(
      publicJson.includes(privateField),
      false,
      `Published Projection leaked ${privateField}`
    );
  }
}

const actualFixtures = await listJson(renderingFixtureDirectory);
assert.deepEqual(
  actualFixtures,
  [...invalidFixtures, ...validFixtures].sort()
);
for (const fixtureName of actualFixtures) {
  const fixture = await readJson(
    path.posix.join(renderingFixtureDirectory, fixtureName)
  );
  assert.equal(fixture.fixtureType, 'renderer_scenario');
  assert.equal(typeof fixture.baseArticle, 'string');
  assert.equal(typeof fixture.expected, 'object');
}

const translationValues = Object.freeze({
  'knowledge.articles.allArticles': 'All articles',
  'knowledge.articles.publicKnowledge': 'Public knowledge',
  'knowledge.articles.keyConcepts': 'Key concepts',
  'knowledge.articles.sources': 'Public sources',
  'knowledge.articles.boundary': 'Boundary',
  'knowledge.articles.boundaryTitle': 'What this article does not do',
  'knowledge.articles.continueReading': 'Continue reading',
  'knowledge.articles.related': 'Related articles',
  'knowledge.articles.read': 'Read article',
  'knowledge.articles.nextRoutes': 'Knowledge routes',
  'knowledge.articles.leaveForNow': 'Return to all articles',
  'knowledge.articles.viewBook': 'View Book I',
  'knowledge.articles.viewAtlas': 'View Atlas',
  'knowledge.articles.tableOfContents': 'In this article',
  'knowledge.articles.insight': 'Key insight',
  'knowledge.articles.timeline': 'Development sequence',
  'knowledge.articles.comparison': 'Structural comparison',
  'knowledge.articles.nextNodeUnavailable': 'Not yet published'
});
function translate(key, values = {}) {
  if (key === 'knowledge.articles.readingTime') {
    return `${values.minutes} min read`;
  }
  if (key === 'knowledge.articles.publishedOn') {
    return `Published ${values.date}`;
  }
  return translationValues[key] || key;
}

const visualAsset = Object.freeze({
  assetCode: 'KFIG-TEST-KN-PREFACE-001-001',
  assetType: 'mechanism_diagram',
  publicSrc: '/assets/images/knowledge/test-renderer.svg',
  altText: 'Test mechanism diagram',
  caption: 'Test-only renderer fixture',
  width: 1600,
  height: 900,
  publicProjection: true
});
const nextArticle = Object.freeze({
  nodeCode: 'KN-PREFACE-002',
  title: 'Why capability does not create direction',
  summary: 'A published next-node projection.',
  publicHref: '/articles/why-capability-does-not-create-direction'
});
const relatedArticle = Object.freeze({
  nodeCode: 'KN-PREFACE-010',
  title: 'Why explanation is not understanding',
  summary: 'A published related-node projection.',
  publicHref: '/articles/why-explanation-does-not-equal-understanding'
});

function firstBlock(article, type) {
  return article.sections
    .flatMap(section => section.blocks || [])
    .find(block => !type || block.type === type);
}

function mutateScenario(article, scenario) {
  switch (scenario.mutation) {
    case 'unknown_block_type':
      firstBlock(article).type = 'video';
      break;
    case 'add_raw_html_field':
      firstBlock(article).rawHtml = '<script>unsafe()</script>';
      break;
    case 'javascript_source_href':
      article.sourceReferences[0].href = 'javascript:alert(1)';
      break;
    case 'remove_figure_alt':
      firstBlock(article, 'figure').altText = '';
      break;
    case 'html_like_text':
      firstBlock(article).text =
        '<img src=x onerror="globalThis.injected=true">';
      break;
    case 'heading_markup_in_text':
      article.title = '<h1>Injected heading</h1>';
      break;
    case 'heading_markup_in_block':
      firstBlock(article, 'mechanism').title =
        '<h4>Injected heading</h4>';
      break;
    case 'question_button_markup':
      firstBlock(article, 'question').text =
        '<button type="button">Not interactive</button>';
      break;
    case 'review_data_on_article':
      article.reviewerId = 'internal-reviewer';
      article.reviewedBy = 'internal-reviewer';
      article.claimDossier = { decision: 'internal' };
      break;
    case 'unbroken_long_text':
      firstBlock(article).text = 'A'.repeat(2000);
      break;
    default:
      break;
  }
}

function publicContext(article, scenario) {
  const context = {
    node: {
      nodeCode: article.nodeCode,
      canonicalLanguage: 'zh-Hans',
      themeCode: 'TH-PREFACE-01'
    },
    localized: {
      contentRole: article.contentRole || 'canonical',
      locale: article.locale,
      slug: article.slug
    },
    articleAsset: {
      publicHref: `/articles/${article.slug}`
    },
    visualAssets: [visualAsset],
    registeredSources: sourcesRegistry.sources
  };

  if (scenario.mutation === 'external_asset_url') {
    context.visualAssets = [{
      ...visualAsset,
      publicSrc: 'https://external.example/unsafe.svg'
    }];
  }
  if (scenario.mutation === 'unpublished_asset_projection') {
    context.visualAssets = [{
      ...visualAsset,
      publicProjection: false
    }];
  }
  return context;
}

function publishedContext(scenario) {
  if (scenario.mutation === 'unpublished_next_node') {
    return [];
  }
  if (scenario.mutation === 'node_url_injection') {
    return [{
      ...nextArticle,
      publicHref: 'javascript:alert(1)'
    }];
  }
  if (scenario.scenario === 'related_nodes_filtering') {
    return [relatedArticle];
  }
  return [nextArticle, relatedArticle];
}

function headingOrderIsValid(element) {
  const headings = [...element.querySelectorAll('h1, h2, h3, h4')];
  let previous = 0;
  for (const heading of headings) {
    const current = Number(heading.localName.slice(1));
    if (previous && current > previous + 1) {
      return false;
    }
    previous = current;
  }
  return true;
}

for (const fixtureName of actualFixtures) {
  const fixturePath = path.posix.join(
    renderingFixtureDirectory,
    fixtureName
  );
  const scenario = await readJson(fixturePath);
  const articlePath = path.resolve(
    root,
    renderingFixtureDirectory,
    scenario.baseArticle
  );
  const article = JSON.parse(await fs.readFile(articlePath, 'utf8'));
  mutateScenario(article, scenario);

  let projection;
  let renderError = null;
  let rendered = null;

  try {
    projection = createPublicArticleProjection(
      article,
      publicContext(article, scenario)
    );

    if (scenario.mutation === 'internal_source_use') {
      projection = {
        ...projection,
        publicSources: projection.publicSources.map(source => ({
          ...source,
          publicUse: 'internal_only'
        }))
      };
    }

    const { document } = parseHTML(
      '<!doctype html><html><body></body></html>'
    );
    rendered = renderArticleDocument(document, projection, {
      publishedArticles: publishedContext(scenario),
      translate
    });
    document.body.append(rendered);
  } catch (error) {
    renderError = error;
  }

  if (scenario.expected.result === 'blocked') {
    assert(
      renderError instanceof ArticleRenderError,
      `${fixtureName} was not blocked`
    );
    if (scenario.expected.errorCode) {
      assert.equal(renderError.code, scenario.expected.errorCode);
    }
    continue;
  }

  assert.equal(renderError, null, `${fixtureName} did not render`);
  assert(rendered);
  assert.equal(rendered.querySelectorAll('h1').length, 1);
  assert.equal(
    rendered.querySelectorAll(
      '.knowledge-block--question button'
    ).length,
    0
  );
  assert.equal(headingOrderIsValid(rendered), true);

  const serialized = rendered.outerHTML;
  for (const privateField of [
    'reviewerId',
    'reviewedBy',
    'claimDossier',
    'sourceClaimCodes'
  ]) {
    assert.equal(serialized.includes(privateField), false);
  }
  for (const link of rendered.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    assert(
      href.startsWith('/') || href.startsWith('#'),
      `${fixtureName} rendered unsafe href: ${href}`
    );
  }

  switch (scenario.scenario || scenario.mutation) {
    case 'legacy_article':
      assert.equal(
        rendered.querySelectorAll('.knowledge-article__body > section').length,
        4
      );
      assert.equal(
        rendered.querySelectorAll('.knowledge-block').length,
        0
      );
      break;
    case 'structured_all_blocks': {
      const classes = ARTICLE_BLOCK_TYPES.map(type => (
        `.knowledge-block--${type.replace('_', '-')}`
      ));
      for (const selector of classes) {
        assert(rendered.querySelector(selector), `Missing ${selector}`);
      }
      const image = rendered.querySelector(
        '.knowledge-block--figure img'
      );
      assert(image);
      assert(image.getAttribute('alt'));
      assert.equal(image.getAttribute('loading'), 'lazy');
      assert.equal(image.getAttribute('decoding'), 'async');
      assert.equal(image.getAttribute('width'), '1600');
      assert.equal(image.getAttribute('height'), '900');
      assert(rendered.querySelector('.knowledge-block--figure figcaption'));
      assert(rendered.querySelector('.knowledge-block--mechanism > ol'));
      assert(rendered.querySelector('.knowledge-block--timeline > ol'));
      assert.equal(
        rendered.querySelector('.knowledge-block--next-node')?.localName,
        'nav'
      );
      break;
    }
    case 'without_hero':
      assert.equal(
        rendered.querySelectorAll('.knowledge-article__hero-visual').length,
        0
      );
      break;
    case 'optional_related_figure_missing':
      assert.equal(
        rendered.querySelectorAll('.knowledge-block--figure').length,
        0
      );
      assert.equal(rendered.querySelectorAll('img').length, 0);
      break;
    case 'public_source_projection':
      assert.equal(
        rendered.querySelectorAll('.knowledge-source-list > li').length,
        1
      );
      break;
    case 'related_nodes_filtering':
      assert.equal(
        rendered.querySelectorAll('.knowledge-related .knowledge-card').length,
        1
      );
      break;
    case 'published_next_node':
      assert.equal(
        rendered.querySelectorAll(
          '.knowledge-block--next-node a'
        ).length,
        1
      );
      break;
    case 'zh_hans_public_article':
      assert.equal(projection.locale, 'zh-Hans');
      break;
    case 'javascript_source_href':
    case 'internal_source_use':
      assert.equal(
        rendered.querySelectorAll('.knowledge-source-list > li').length,
        0
      );
      break;
    case 'unpublished_next_node':
    case 'node_url_injection':
      assert.equal(
        rendered.querySelectorAll(
          '.knowledge-block--next-node a'
        ).length,
        0
      );
      assert(
        rendered.querySelector('.knowledge-block__availability')
      );
      break;
    case 'html_like_text':
      assert.equal(
        rendered.querySelectorAll('[onerror]').length,
        0
      );
      assert(serialized.includes('&lt;img'));
      break;
    case 'heading_markup_in_text':
      assert.equal(rendered.querySelectorAll('h1').length, 1);
      assert(serialized.includes('&lt;h1&gt;'));
      break;
    case 'heading_markup_in_block':
      assert.equal(headingOrderIsValid(rendered), true);
      assert(serialized.includes('&lt;h4&gt;'));
      break;
    case 'question_button_markup':
      assert.equal(
        rendered.querySelectorAll(
          '.knowledge-block--question button'
        ).length,
        0
      );
      assert(serialized.includes('&lt;button'));
      break;
    case 'review_data_on_article': {
      const projectionText = JSON.stringify(projection);
      assert.equal(projectionText.includes('reviewerId'), false);
      assert.equal(projectionText.includes('reviewedBy'), false);
      assert.equal(projectionText.includes('claimDossier'), false);
      break;
    }
    case 'unbroken_long_text':
      assert(rendererCss.includes('overflow-wrap: anywhere'));
      break;
    default:
      break;
  }
}

for (const documentationFile of [
  'docs/knowledge/PJA-W2D-article-renderer-expansion.md',
  'docs/knowledge/PJA-article-renderer-contract.md',
  'docs/knowledge/PJA-public-article-projection-contract.md',
  'docs/knowledge/PJA-article-renderer-accessibility.md',
  'docs/knowledge/PJA-article-renderer-security.md',
  'docs/knowledge/PJA-article-static-rendering-boundary.md'
]) {
  assert.equal(
    await exists(documentationFile),
    true,
    `Missing W2D documentation: ${documentationFile}`
  );
}

assert.equal(
  packageJson.scripts['check:pja-w2d'],
  'npm run check:pja-w2c && ' +
  'node scripts/check-pja-w2d-article-renderer-expansion.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w2d-article-renderer-expansion.mjs'
  )
);

console.log('✓ PJA-W2D Article Renderer Expansion passed.');
console.log(
  '  Safe DOM rendering covers legacy Articles and all 10 allowlisted blocks.'
);
console.log(
  '  Public Projection strips review/Claim data and resolves only public Assets, Sources and Nodes.'
);
console.log(
  '  23 valid/invalid rendering fixtures pass semantic, security and accessibility checks.'
);
console.log(
  '  Frozen Registries, six production Articles and KN-PREFACE-001 publication state remain unchanged.'
);
