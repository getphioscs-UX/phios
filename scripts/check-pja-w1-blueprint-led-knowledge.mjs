import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadPjaBlueprintContext } from './lib/knowledge-production/blueprint-context.mjs';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const evidencePath = 'docs/pja/pja-w1-blueprint-led-public-knowledge-ecosystem-v1.json';
const [
  evidence,
  w0,
  blueprint,
  nodesRegistry,
  localizedRegistry,
  assetsRegistry,
  themesRegistry,
  packageJson,
  publicShell,
  publishedLoader
] = await Promise.all([
  readJson(evidencePath),
  readJson('docs/pja/pja-w0-cross-system-boundary-freeze-v1.json'),
  loadPjaBlueprintContext(root),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('package.json'),
  read('assets/js/public-shell.js'),
  read('assets/js/knowledge/published-content.js')
]);

assert.equal(evidence.freezeId, 'PJA-W1-v1.1.0-Blueprint-led');
assert.equal(evidence.programme, 'PJA Public Architecture');
assert.equal(evidence.step, 'PJA-W1');
assert.equal(evidence.version, '1.1.0');
assert.equal(evidence.status, 'frozen');
assert.deepEqual(evidence.baseline, {
  repository: 'getphioscs-UX/phios',
  branch: 'main',
  commit: 'fd022414b5add0acdef5a0e45f8f890a3addf087',
  prerequisite: 'PJA-W0-v1.0.0-Frozen'
});
assert.equal(w0.freezeId, evidence.baseline.prerequisite);

assert.deepEqual(evidence.knowledgeRoles, [
  'Brand',
  'Education',
  'Trust',
  'SEO',
  'Book Sales',
  'Free Understanding',
  'Professional Boundary Support'
]);
assert.equal(evidence.prohibitedRoles.length, 5);
assert.equal(evidence.sourceAuthority.publicProjectionWriteAuthority, 'none');
for (const source of evidence.canonicalSources) {
  assert.equal(await exists(source), true, `Missing canonical source: ${source}`);
}

const wave1 = blueprint.releaseRecommendation.wave1;
const active = evidence.release.activeArticles;
const activeCodes = active.map(article => article.nodeCode);
const deferredCodes = evidence.release.deferredWave1Candidates
  .map(article => article.nodeCode);
assert.equal(blueprint.activeProductionLimit, 8);
assert.equal(evidence.release.activeArticleMaximum, 8);
assert(active.length > 0 && active.length <= 8);
assert.deepEqual(activeCodes, [
  'KN-PREFACE-004',
  'KN-PREFACE-010',
  'KN-PREFACE-013'
]);
assert.deepEqual([...activeCodes, ...deferredCodes], wave1);
assert(
  evidence.release.deferredWave1Candidates.every(candidate => (
    candidate.reason ===
      'planned_blueprint_node_not_registered_in_canonical_node_registry'
  ))
);

const nodeByCode = new Map(
  nodesRegistry.nodes.map(node => [node.nodeCode, node])
);
const localizedByCode = new Map(
  localizedRegistry.localizedContent.map(record => [record.nodeCode, record])
);
const assetByCode = new Map(
  assetsRegistry.assets.map(asset => [asset.assetCode, asset])
);
assert.equal(nodesRegistry.nodes.length, blueprint.plannedCanonicalNodes);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  blueprint.prefaceCanonicalNodes
);
const referencedThemeCodes = new Set(nodesRegistry.nodes.map(node => node.themeCode));
assert(
  [...referencedThemeCodes].every(themeCode =>
    themesRegistry.themes.some(theme => theme.themeCode === themeCode)
  )
);

const publishedLocaleRecords = [];
for (const article of active) {
  const node = nodeByCode.get(article.nodeCode);
  assert(node, `Active article is not a Canonical Node: ${article.nodeCode}`);
  assert.equal(node.registryStatus, 'frozen');
  assert.equal(node.canonicalLanguage, 'zh-Hans');
  assert.equal(node.productionTier, 'tier_c');
  assert.equal(node.publicationPriority, 'launch');
  assert.deepEqual(article.publishedLanguages, node.requiredPublicLanguages);
  assert.equal(article.canonicalLanguage, node.canonicalLanguage);

  const localizedRecord = localizedByCode.get(article.nodeCode);
  assert(localizedRecord, `Missing localized state: ${article.nodeCode}`);

  for (const locale of node.requiredPublicLanguages) {
    const localized = localizedRecord.locales[locale];
    assert(localized, `Missing ${locale} publication state: ${article.nodeCode}`);
    assert.equal(localized.contentStatus, 'content_reviewed');
    assert.equal(localized.reviewStatus, 'approved');
    assert.equal(localized.publicationStatus, 'published');
    assert.equal(localized.slug, article.slug);
    assert.equal(
      localized.contentRole,
      locale === 'zh-Hans' ? 'canonical' : 'localized'
    );
    if (locale === 'en') {
      assert.equal(localized.terminologyReviewStatus, 'approved');
      assert.equal(localized.semanticParityStatus, 'approved');
      assert.equal(localized.localizationSourceLocale, 'zh-Hans');
    }
    publishedLocaleRecords.push({ node, localized });

    for (const [code, type] of [
      [localized.articleAssetCode, 'article'],
      [localized.masterMediaPostAssetCode, 'master_media_post']
    ]) {
      const asset = assetByCode.get(code);
      assert(asset, `Missing published asset: ${code}`);
      assert.equal(asset.nodeCode, node.nodeCode);
      assert.equal(asset.locale, locale);
      assert.equal(asset.assetType, type);
      assert.equal(asset.contentStatus, 'content_reviewed');
      assert.equal(asset.reviewStatus, 'approved');
      assert.equal(asset.publicationStatus, 'published');
      assert.equal(await exists(asset.contentPath), true);

      const content = await readJson(asset.contentPath);
      assert.equal(content.nodeCode, node.nodeCode);
      assert.equal(content.locale, locale);
      assert.equal(content.contentStatus, 'content_reviewed');
      assert.equal(content.reviewStatus, 'approved');
      assert.equal(content.publicationStatus, 'published');
      assert.equal(content.slug, article.slug);
      if (type === 'article') {
        assert.equal(content.assetCode, code);
        assert(asset.publicHref.startsWith('/articles/'));
      } else {
        assert.equal(content.masterMediaPost.assetCode, code);
        assert.equal(asset.contentSection, 'masterMediaPost');
      }
      assert.deepEqual(content.connections.relatedServices, []);
      assert(content.knowledgeBoundary.length > 0);
    }
  }
}

assert.equal(publishedLocaleRecords.length, 6);
assert.equal(
  localizedRegistry.localizedContent.reduce(
    (count, record) => count + Object.values(record.locales)
      .filter(locale => locale.publicationStatus === 'published').length,
    0
  ),
  6
);
assert.equal(assetsRegistry.assets.length, 12);
assert(
  assetsRegistry.assets.every(asset => asset.publicationStatus === 'published')
);
for (const code of deferredCodes) {
  const node = nodeByCode.get(code);
  const localizedRecord = localizedByCode.get(code);
  assert(node, `Deferred Wave 1 node is not registered: ${code}`);
  assert(localizedRecord, `Deferred Wave 1 node has no localized identity: ${code}`);
  assert.equal(
    assetsRegistry.assets.some(asset => asset.nodeCode === code),
    false
  );
  assert(
    Object.values(localizedRecord.locales || {}).every(locale => (
      locale.publicationStatus !== 'published'
    )),
    `Deferred Wave 1 node became publicly published: ${code}`
  );
}

assert(publishedLoader.includes('/content/knowledge/registry/nodes.json'));
assert(publishedLoader.includes('/content/knowledge/registry/localized-content.json'));
assert(publishedLoader.includes('/content/knowledge/registry/assets.json'));
assert(publishedLoader.includes("node.registryStatus !== 'frozen'"));
assert(publishedLoader.includes("publicationStatus === 'published'"));
assert(publishedLoader.includes("contentStatus === 'content_reviewed'"));
assert(publishedLoader.includes("reviewStatus === 'approved'"));
for (const forbidden of ['/api/', 'openai', 'RuntimeKernel', 'fetchProvider']) {
  assert.equal(
    publishedLoader.toLowerCase().includes(forbidden.toLowerCase()),
    false,
    `Public Knowledge loader contains forbidden dependency: ${forbidden}`
  );
}

const expW1 = await readJson('docs/experience/EXP-W1-global-ia-shared-shell.json');
assert.equal(expW1.freezeId, 'EXP-W1-v1.0.0-Frozen');
assert.equal(expW1.supersedes.field, 'publicInformationArchitecture');
const expectedMainNavigation = expW1.primaryNavigation.map(item => [item.id, item.href]);
for (const [id, href] of expectedMainNavigation) {
  assert(
    publicShell.includes(`{ id: '${id}', href: '${href}'`),
    `Missing main navigation route: ${id}`
  );
}
assert(publicShell.includes('href="/account"'));
assert(publicShell.includes("href: '/reality-journey'"));
assert(publicShell.includes('public-nav__actions'));
assert.equal(publicShell.includes("id: 'explore'"), false);
assert.equal(publicShell.includes("id: 'services'"), false);

const requiredPages = [
  ...evidence.publicInformationArchitecture.requiredPages,
  ...evidence.publicInformationArchitecture.articlePages
];
for (const page of requiredPages) {
  assert.equal(await exists(page), true, `Missing PJA-W1 page: ${page}`);
  const html = await read(page);
  assert(html.includes('/assets/js/public-shell.js'));
}
for (const page of evidence.publicInformationArchitecture.articlePages) {
  const html = await read(page);
  assert(html.includes('data-article-slug='));
  assert(html.includes('/assets/js/pages/article.js'));
  assert(html.includes('/assets/css/knowledge-release.css'));
}
const expW2 = await readJson('docs/experience/EXP-W2-home-discover-about-contract.json');
assert.equal(expW2.freezeId, 'EXP-W2-v1.0.0-Frozen');
assert.equal((await read('index.html')).includes('data-knowledge-article-grid'), false);
for (const page of ['library.html', 'book-one.html', 'thesis.html', 'explore.html']) {
  const html = await read(page);
  assert(html.includes('data-knowledge-article-grid'));
  assert(html.includes('/assets/js/pages/knowledge-connections.js'));
}

function publicTargetToFile(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return 'index.html';
  const relative = clean.replace(/^\//, '');
  if (path.extname(relative)) return relative;
  return `${relative}.html`;
}

const contentFiles = assetsRegistry.assets
  .filter(asset => asset.assetType === 'article')
  .map(asset => asset.contentPath);
for (const contentFile of contentFiles) {
  const content = await readJson(contentFile);
  const linkedItems = [
    ...content.sourceReferences,
    ...content.connections.relatedBooks,
    ...content.connections.relatedAtlasEntries,
    ...content.connections.relatedFigures,
    ...content.connections.relatedServices,
    ...content.connections.journeyEntryTopics
  ];
  for (const item of linkedItems) {
    assert(item.href.startsWith('/'), `External or malformed public link: ${item.href}`);
    const target = publicTargetToFile(item.href);
    assert.equal(
      await exists(target),
      true,
      `Visible link does not resolve: ${item.href} from ${contentFile}`
    );
  }
}

const registryFiles = (await fs.readdir(path.join(root, 'content/knowledge/registry')))
  .filter(file => file.endsWith('.json'));
const registrySchemas = (await fs.readdir(path.join(root, 'content/knowledge/registry/schemas')))
  .filter(file => file.endsWith('.json'));
assert.equal(registryFiles.length, 12);
assert.equal(registrySchemas.length, 12);
assert.equal(evidence.preservation.knowledgeRegistryFileCount, 12);
assert.equal(evidence.preservation.knowledgeRegistrySchemaCount, 12);
assert.equal(evidence.preservation.newKnowledgeRegistryLayerAdded, false);
assert.equal(evidence.preservation.newRuntimeSourceOfTruthAdded, false);
assert.equal(evidence.preservation.publicCaseProviderInvocation, false);
assert.equal(evidence.preservation.personalJudgmentGenerated, false);
assert.equal(evidence.preservation.professionalWorkspaceBlocked, false);
assert.equal(evidence.preservation.commercialRuntimeBlocked, false);

const migrationFiles = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(file => file.endsWith('.sql'));
assert.equal(migrationFiles.length, 5);
assert.equal(evidence.preservation.d1MigrationAdded, false);

assert.equal(
  packageJson.scripts['check:pja-w1'],
  'node scripts/check-pja-w1-blueprint-led-knowledge.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w1-blueprint-led-knowledge.mjs'
  )
);
assert(
  packageJson.scripts.precheck.indexOf('check-pja-w1-blueprint-led-knowledge') >
    packageJson.scripts.precheck.indexOf('check-pja-w0-cross-system-boundary')
);

assert.deepEqual(evidence.acceptance, {
  existingRegistryAndBlueprintDriven: true,
  secondKnowledgeSourceOfTruth: false,
  unpublishedResourcesVisible: false,
  chineseCanonicalExplicit: true,
  englishPublicationRequirementEnforced: true,
  individualOpenAIProviderInvoked: false,
  personalJudgmentFormed: false,
  serviceRecommendedByDefault: false,
  visibleLinksResolve: true,
  pwsOrCommercialRuntimeBlocked: false,
  command: 'npm run check:pja-w1'
});

console.log('✓ PJA-W1 Blueprint-led Public Knowledge Ecosystem passed.');
console.log('  3 frozen Canonical Nodes publish 3 Chinese articles and 3 required English localizations.');
console.log('  5 Wave 1 Nodes remain publication-deferred; their Registry identities are supplied by PKR population, not PJA.');
console.log('  Home, Hub, Articles, Book I, Thesis, Atlas and shared navigation use published-only projections.');
console.log('  No case Provider, personal judgment, default service recommendation, Runtime write or Entitlement substitute exists.');
console.log('  State: PJA-W1-v1.1.0-Blueprint-led.');
