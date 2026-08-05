import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const fixtureDirectory = 'tests/fixtures/knowledge/articles';
const schemaPath = 'content/knowledge/schemas/article-v2.schema.json';
const read = file => fs.readFile(path.join(root, file), 'utf8')
  .then(content => content.replace(/\r\n?/g, '\n'));
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file)).then(
  () => true,
  () => false
);

async function filesIn(directory) {
  const entries = await fs.readdir(path.join(root, directory), {
    withFileTypes: true
  });
  const files = [];

  for (const entry of entries) {
    const relative = path.posix.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await filesIn(relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files;
}

function pointerParts(pointer) {
  assert(pointer.startsWith('/'), `Invalid fixture pointer: ${pointer}`);
  return pointer
    .slice(1)
    .split('/')
    .map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function applyOperation(document, operation) {
  const parts = pointerParts(operation.path);
  const key = parts.pop();
  let parent = document;

  for (const part of parts) {
    parent = parent[part];
    assert(parent !== undefined, `Fixture pointer does not resolve: ${operation.path}`);
  }

  if (operation.op === 'remove') {
    if (Array.isArray(parent)) {
      parent.splice(Number(key), 1);
    } else {
      delete parent[key];
    }
    return;
  }

  assert(
    operation.op === 'add' || operation.op === 'replace',
    `Unsupported fixture operation: ${operation.op}`
  );

  if (Array.isArray(parent) && key === '-') {
    parent.push(operation.value);
  } else {
    parent[key] = operation.value;
  }
}

async function materializeInvalidFixture(file) {
  const mutation = await readJson(path.posix.join(fixtureDirectory, file));
  const base = structuredClone(await readJson(
    path.posix.join(fixtureDirectory, mutation.baseFixture)
  ));

  for (const operation of mutation.operations) {
    applyOperation(base, operation);
  }

  return {
    article: base,
    expectedLayer: mutation.expectedLayer
  };
}

const [
  schema,
  blueprint,
  nodesRegistry,
  themesRegistry,
  localizedRegistry,
  assetsRegistry,
  supportingQuestionRegistry,
  sourcesRegistry,
  packageJson,
  renderer,
  rendererAdapter,
  publishedLoader,
  authoringContract,
  migrationPolicy,
  schemaContract,
  readiness
] = await Promise.all([
  readJson(schemaPath),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/supporting-questions.json'),
  readJson('content/knowledge/registry/sources.json'),
  readJson('package.json'),
  read('assets/js/pages/article.js'),
  read('assets/js/knowledge/article-blocks.js'),
  read('assets/js/knowledge/published-content.js'),
  read('docs/knowledge/PJA-structured-article-authoring-contract.md'),
  read('docs/knowledge/PJA-article-v2-migration-policy.md'),
  read('docs/knowledge/PJA-W2B-structured-article-block-schema.md'),
  readJson(
    'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json'
  )
]);

assert.equal(
  schema.$id,
  'https://getphios.com/schemas/knowledge/article-v2.schema.json'
);
assert.equal(
  schema.properties.schemaVersion.const,
  'PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0'
);
assert.equal(schema.additionalProperties, false);
assert.equal(schema.oneOf.length, 2);

const allowedBlockTypes = [
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
];
const blockRefs = schema.$defs.articleBlock.oneOf.map(item => item.$ref);
const schemaBlockTypes = blockRefs.map(reference => {
  const name = reference.split('/').at(-1);
  const definition = schema.$defs[name];

  assert.equal(definition.type, 'object');
  assert.equal(definition.additionalProperties, false);
  assert(definition.required.includes('blockCode'));
  assert(definition.required.includes('type'));
  return definition.properties.type.const;
});
assert.deepEqual(schemaBlockTypes, allowedBlockTypes);
assert.equal(schema.$defs.structuredSection.additionalProperties, false);
assert.equal(schema.$defs.legacySection.additionalProperties, false);
assert.equal(schema.$defs.structuredConnections.additionalProperties, false);
assert.equal(schema.$defs.legacyConnections.additionalProperties, false);
assert.equal(schema.$defs.structuredKeyConcept.additionalProperties, false);
assert.equal(schema.$defs.structuredBoundary.additionalProperties, false);
assert.equal(schema.$defs.figureBlock.required.includes('altText'), true);
assert.equal(schema.$defs.figureBlock.required.includes('assetCode'), true);
assert.equal(schema.$defs.comparisonBlock.properties.columns.maxItems, 3);
assert.equal(schema.$defs.mechanismBlock.properties.steps.maxItems, 8);
assert.equal(schema.$defs.structuredSection.properties.blocks.maxItems, 24);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  strictTypes: false
});
const validateSchema = ajv.compile(schema);
const nodeByCode = new Map(
  nodesRegistry.nodes.map(node => [node.nodeCode, node])
);
const localizedByNode = new Map(
  localizedRegistry.localizedContent.map(record => [record.nodeCode, record])
);
const assetByCode = new Map(
  assetsRegistry.assets.map(asset => [asset.assetCode, asset])
);
const sourceCodes = new Set(
  sourcesRegistry.sources.map(source => source.sourceCode)
);
const supportingQuestionCodes = new Set(
  supportingQuestionRegistry.supportingQuestions.map(
    question => question.supportingQuestionCode
  )
);
const testVisualAssets = new Map([
  [
    'KFIG-TEST-KN-PREFACE-001-001',
    {
      nodeCode: 'KN-PREFACE-001',
      testOnly: true
    }
  ]
]);

function semanticErrors(article, { allowTestAssets = false } = {}) {
  const errors = [];
  const node = nodeByCode.get(article.nodeCode);
  const localized = localizedByNode.get(article.nodeCode)?.locales?.[article.locale];

  if (!node) {
    errors.push(`Article creates an unregistered Canonical identity: ${article.nodeCode}`);
    return errors;
  }
  if (!localized) {
    errors.push(`Article locale is absent from Localization Registry: ${article.locale}`);
  } else if (article.slug !== localized.slug) {
    errors.push(`Article slug differs from Localization Registry: ${article.slug}`);
  }
  if (!article.assetCode.startsWith('KA-TEST-')) {
    const articleAsset = assetByCode.get(article.assetCode);
    if (
      !articleAsset ||
      articleAsset.nodeCode !== article.nodeCode ||
      articleAsset.assetType !== 'article'
    ) {
      errors.push(`Article assetCode is not registered for the Node: ${article.assetCode}`);
    }
  } else if (!allowTestAssets) {
    errors.push(`Test assetCode is outside a fixture: ${article.assetCode}`);
  }

  for (const source of article.sourceReferences) {
    if (!sourceCodes.has(source.sourceCode)) {
      errors.push(`Unregistered sourceCode: ${source.sourceCode}`);
    }
  }

  if (!article.schemaVersion) {
    return errors;
  }

  if (article.taxonomy.themeCode !== node.themeCode) {
    errors.push('Article taxonomy themeCode differs from Canonical Registry');
  }
  if (article.taxonomy.nodeType !== node.nodeType) {
    errors.push('Article taxonomy nodeType differs from Canonical Registry');
  }
  if (article.taxonomy.knowledgeLevel !== node.knowledgeLevel) {
    errors.push('Article taxonomy knowledgeLevel differs from Canonical Registry');
  }

  const sectionCodes = new Set();
  const blockCodes = new Set();
  const nextNodeBlocks = [];

  article.sections.forEach((section, sectionIndex) => {
    const expectedSectionCode = `S${String(sectionIndex + 1).padStart(2, '0')}`;

    if (section.sectionCode !== expectedSectionCode) {
      errors.push(
        `Section code is not sequential: ${section.sectionCode} expected ${expectedSectionCode}`
      );
    }
    if (sectionCodes.has(section.sectionCode)) {
      errors.push(`Duplicate sectionCode: ${section.sectionCode}`);
    }
    sectionCodes.add(section.sectionCode);

    const typeCounts = new Map();
    section.blocks.forEach((block, blockIndex) => {
      const expectedBlockCode =
        `${section.sectionCode}-B${String(blockIndex + 1).padStart(2, '0')}`;

      if (block.blockCode !== expectedBlockCode) {
        errors.push(
          `Block code is not sequential: ${block.blockCode} expected ${expectedBlockCode}`
        );
      }
      if (blockCodes.has(block.blockCode)) {
        errors.push(`Duplicate blockCode: ${block.blockCode}`);
      }
      blockCodes.add(block.blockCode);
      typeCounts.set(block.type, (typeCounts.get(block.type) || 0) + 1);

      if (block.type === 'figure') {
        const visualAsset = assetByCode.get(block.assetCode) ||
          (allowTestAssets ? testVisualAssets.get(block.assetCode) : null);
        if (!visualAsset || visualAsset.nodeCode !== article.nodeCode) {
          errors.push(`Figure asset is not registered for the Article Node: ${block.assetCode}`);
        }
        if (
          article.publicationStatus === 'published' &&
          visualAsset?.publicationStatus !== 'published'
        ) {
          errors.push(`Published article references unpublished figure: ${block.assetCode}`);
        }
      }

      if (block.type === 'next_node') {
        nextNodeBlocks.push({
          block,
          sectionIndex,
          blockIndex
        });
      }
    });

    if ((typeCounts.get('transition') || 0) > 1) {
      errors.push(`Section has more than one transition: ${section.sectionCode}`);
    }
  });

  const allNodeReferences = [
    article.connections.previousNode,
    article.connections.nextNode,
    ...article.connections.relatedNodes,
    ...article.connections.relatedArticles
  ].filter(Boolean);
  for (const code of allNodeReferences) {
    if (!nodeByCode.has(code)) {
      errors.push(`Connection references an unregistered Canonical Node: ${code}`);
    }
    if (supportingQuestionCodes.has(code)) {
      errors.push(`Connection references a Supporting Question as a Node: ${code}`);
    }
    if (code === article.nodeCode) {
      errors.push(`Connection references the current Article Node: ${code}`);
    }
  }

  const expectedNextNode = node.relationships.nextNodeCodes[0] || null;
  if (article.connections.nextNode !== expectedNextNode) {
    errors.push(
      `connections.nextNode differs from Canonical Registry: ${article.connections.nextNode}`
    );
  }
  if (nextNodeBlocks.length > 1) {
    errors.push('Article contains more than one next_node block');
  }
  if (expectedNextNode && nextNodeBlocks.length !== 1) {
    errors.push('Article with a Registry nextNode must contain one next_node block');
  }
  if (nextNodeBlocks.length === 1) {
    const [{ block, sectionIndex, blockIndex }] = nextNodeBlocks;
    const lastSectionIndex = article.sections.length - 1;
    const lastBlockIndex = article.sections[lastSectionIndex].blocks.length - 1;

    if (block.nodeCode !== article.connections.nextNode) {
      errors.push('next_node block differs from connections.nextNode');
    }
    if (
      sectionIndex !== lastSectionIndex ||
      blockIndex !== lastBlockIndex
    ) {
      errors.push('next_node block must be the final public block');
    }
  }

  if (article.masterMediaPost !== null && article.contentStatus === 'draft') {
    errors.push('Structured draft must not create a derivative media body');
  }
  return errors;
}

const fixtureFiles = (await fs.readdir(
  path.join(root, fixtureDirectory)
)).filter(file => file.endsWith('.json')).sort();
const validFixtureFiles = fixtureFiles.filter(file => (
  file.startsWith('valid-') ||
  file === 'kn-preface-001-structured-skeleton.json'
));
const invalidFixtureFiles = fixtureFiles.filter(file => file.startsWith('invalid-'));

assert.deepEqual(validFixtureFiles, [
  'kn-preface-001-structured-skeleton.json',
  'valid-all-block-types-article.json',
  'valid-legacy-article.json',
  'valid-structured-article-without-figure.json',
  'valid-structured-article.json'
]);
assert(invalidFixtureFiles.length >= 15);

for (const file of validFixtureFiles) {
  const article = await readJson(path.posix.join(fixtureDirectory, file));
  assert.equal(
    validateSchema(article),
    true,
    `Valid fixture failed schema validation: ${file}\n${ajv.errorsText(validateSchema.errors)}`
  );
  assert.deepEqual(
    semanticErrors(article, { allowTestAssets: true }),
    [],
    `Valid fixture failed semantic validation: ${file}`
  );
}

for (const file of invalidFixtureFiles) {
  const { article, expectedLayer } = await materializeInvalidFixture(file);
  const schemaValid = validateSchema(article);

  if (expectedLayer === 'schema') {
    assert.equal(
      schemaValid,
      false,
      `Invalid fixture was accepted by JSON Schema: ${file}`
    );
  } else {
    assert.equal(
      schemaValid,
      true,
      `Semantic fixture failed too early at JSON Schema: ${file}\n${ajv.errorsText(validateSchema.errors)}`
    );
    assert(
      semanticErrors(article, { allowTestAssets: true }).length > 0,
      `Invalid fixture was accepted by semantic validation: ${file}`
    );
  }
}

const allBlocksFixture = await readJson(
  path.posix.join(fixtureDirectory, 'valid-all-block-types-article.json')
);
assert.deepEqual(
  allBlocksFixture.sections
    .flatMap(section => section.blocks.map(block => block.type))
    .sort(),
  [...allowedBlockTypes].sort()
);
const skeleton = await readJson(
  path.posix.join(fixtureDirectory, 'kn-preface-001-structured-skeleton.json')
);
assert.equal(skeleton.nodeCode, 'KN-PREFACE-001');
assert.equal(skeleton.slug, 'ai-formation-from-civilizational-capability');
assert.equal(skeleton.locale, 'zh-Hans');
assert.equal(skeleton.contentStatus, 'draft');
assert.equal(skeleton.reviewStatus, 'not_reviewed');
assert.equal(skeleton.publicationStatus, 'not_published');
assert.equal(skeleton.masterMediaPost, null);
assert.equal(skeleton.connections.nextNode, 'KN-PREFACE-002');

const productionArticleFiles = (await filesIn(
  'content/knowledge/articles'
)).sort();
assert.equal(productionArticleFiles.length, 6);
assert(
  productionArticleFiles.every(file => file.endsWith('.json')),
  'A second production article body format exists'
);
for (const file of productionArticleFiles) {
  const article = await readJson(file);
  assert.equal(
    validateSchema(article),
    true,
    `Legacy production article is no longer valid: ${file}\n${ajv.errorsText(validateSchema.errors)}`
  );
  assert(
    article.sections.every(section => (
      Array.isArray(section.paragraphs) &&
      !Object.hasOwn(section, 'blocks')
    )),
    `Legacy production article was implicitly migrated: ${file}`
  );
}

const blueprintNodeCodes = new Set(
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
);
assert.equal(
  (await fs.readdir(path.join(root, 'content/knowledge/registry')))
    .filter(file => file.endsWith('.json')).length,
  12
);
assert.equal(
  (await fs.readdir(path.join(root, 'content/knowledge/registry/schemas')))
    .filter(file => file.endsWith('.json')).length,
  12
);
assert.equal(
  (await fs.readdir(path.join(root, 'db/migrations')))
    .filter(file => file.endsWith('.sql')).length,
  5
);

const prefaceLocalized = localizedByNode.get('KN-PREFACE-001');
assert.equal(prefaceLocalized.locales['zh-Hans'].contentStatus, 'not_started');
assert.equal(prefaceLocalized.locales['zh-Hans'].reviewStatus, 'not_reviewed');
assert.equal(prefaceLocalized.locales['zh-Hans'].publicationStatus, 'not_published');
assert.equal(prefaceLocalized.locales.en.contentStatus, 'localization_pending');
assert.equal(prefaceLocalized.locales.en.reviewStatus, 'not_reviewed');
assert.equal(prefaceLocalized.locales.en.publicationStatus, 'not_published');
assert.equal(prefaceLocalized.locales.en.articleAssetCode, null);
assert.equal(
  assetsRegistry.assets.some(asset => asset.nodeCode === 'KN-PREFACE-001'),
  false
);
assert.equal(
  await exists(
    'content/knowledge/articles/zh-Hans/ai-formation-from-civilizational-capability.json'
  ),
  false
);
assert.equal(
  await exists(
    'content/knowledge/articles/en/ai-formation-from-civilizational-capability.json'
  ),
  false
);
assert.equal(
  await exists('articles/ai-formation-from-civilizational-capability.html'),
  false
);
if (readiness.readinessSchemaVersion) {
  assert.equal(readiness.review.humanFrozen, true);
  assert.equal(readiness.productionReadiness.status, 'production_ready');
  assert.equal(readiness.review.status, 'approved');
} else {
  assert.equal(readiness.editorialOutline.articleBodyCreated, false);
  assert.equal(readiness.publicationRequirement.published, false);
}

for (const type of allowedBlockTypes) {
  assert(
    rendererAdapter.includes(`'${type}'`),
    `Renderer adapter omits allowlisted block: ${type}`
  );
  assert(
    renderer.includes(`case '${type}'`),
    `Public Renderer omits allowlisted block: ${type}`
  );
}
assert(rendererAdapter.includes("block.visibility === 'editorial_only'"));
assert(rendererAdapter.includes('isSupportedArticleBlockType(block.type)'));
assert(rendererAdapter.includes('hasLegacyParagraphs === hasStructuredBlocks'));
assert(renderer.includes('prepareArticleSectionForRendering(section)'));
assert(renderer.includes('escapeHtml('));
assert(renderer.includes('<p class="knowledge-block knowledge-block--paragraph">'));
assert(renderer.includes('<ol>'));
assert(renderer.includes('<figure'));
assert(renderer.includes('article.visualAssets?.find'));
assert(renderer.includes('candidate.nodeCode === block.nodeCode'));
assert(renderer.includes("default:\n      return '';"));
assert.equal(renderer.includes('rawHtml'), false);
assert.equal(rendererAdapter.includes('innerHTML'), false);

assert(publishedLoader.includes('VISUAL_ASSET_TYPES'));
assert(publishedLoader.includes('isApprovedPublication(asset)'));
assert(publishedLoader.includes('visualAssetsFor('));
for (const moduleSource of [renderer, rendererAdapter, publishedLoader]) {
  for (const forbiddenDependency of [
    "from '../runtime",
    "from '../providers",
    "from '../payments",
    "from '../entitlements",
    '/api/',
    'providerInvocation',
    'runtimeAction',
    'paymentAction'
  ]) {
    assert.equal(
      moduleSource.includes(forbiddenDependency),
      false,
      `Article rendering gained forbidden dependency: ${forbiddenDependency}`
    );
  }
}

for (const requiredStatement of [
  '只能生成 Article JSON',
  '不得生成完整 HTML',
  '不得生成 Markdown 正文',
  '不得输出 raw HTML',
  '不得更改 Canonical Registry',
  '不得设置 `approved`',
  '不得设置 `published`',
  '不得虚构 Asset Code',
  '不得虚构 Source Code',
  '所有新文章必须使用 Structured Section'
]) {
  assert(
    authoringContract.includes(requiredStatement),
    `Authoring Contract omits: ${requiredStatement}`
  );
}
assert(migrationPolicy.includes('不得批量迁移'));
assert(migrationPolicy.includes('不得覆盖'));
assert(migrationPolicy.includes('不得自动推进'));
assert(schemaContract.includes('Article JSON'));
assert(schemaContract.includes('Legacy Compatibility'));
assert(schemaContract.includes('Accessibility'));
assert(schemaContract.includes('Localization'));
assert(schemaContract.includes('Future Extension Policy'));

assert.equal(
  packageJson.scripts['check:pja-w2b'],
  'npm run check:pja-w2a && node scripts/check-pja-w2b-structured-article-schema.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w2b-structured-article-schema.mjs'
  )
);
assert(
  packageJson.scripts.precheck.indexOf(
    'check-pja-w2b-structured-article-schema'
  ) >
  packageJson.scripts.precheck.indexOf(
    'check-pja-w2a-canonical-article-editorial-contract'
  )
);

console.log('✓ PJA-W2B Structured Article Block Schema passed.');
console.log('  Article v2.0.0 strictly allows 10 Block types; unknown, executable and external-image structures are rejected.');
console.log('  Six PJA-W1 Article JSON assets remain valid and unmigrated; Article JSON remains the only production body authority.');
console.log('  Section/Block sequencing, Canonical Node references, Asset references and next-node continuity pass schema plus semantic validation.');
console.log('  KN-PREFACE-001 remains a test-only draft skeleton with no production Article, English localization, Asset registration, shell or publication.');
