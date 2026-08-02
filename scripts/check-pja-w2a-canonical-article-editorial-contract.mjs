import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

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

async function sha256(file) {
  const canonicalText = (await fs.readFile(path.join(root, file), 'utf8'))
    .replace(/\r\n?/g, '\n');
  return crypto
    .createHash('sha256')
    .update(canonicalText, 'utf8')
    .digest('hex');
}

const contractPath =
  'docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json';
const readinessPath =
  'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json';
const articleSchemaPath =
  'content/knowledge/editorial/schemas/canonical-article.schema.json';
const claimSchemaPath =
  'content/knowledge/editorial/schemas/claim-review-record.schema.json';

const [
  contract,
  readiness,
  articleSchema,
  claimSchema,
  pjaW1,
  blueprint,
  nodesRegistry,
  localizedRegistry,
  assetsRegistry,
  themesRegistry,
  sourcesRegistry,
  packageJson,
  renderer,
  publishedLoader
] = await Promise.all([
  readJson(contractPath),
  readJson(readinessPath),
  readJson(articleSchemaPath),
  readJson(claimSchemaPath),
  readJson('docs/pja/pja-w1-blueprint-led-public-knowledge-ecosystem-v1.json'),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('content/knowledge/registry/sources.json'),
  readJson('package.json'),
  read('assets/js/pages/article.js'),
  read('assets/js/knowledge/published-content.js')
]);


const universalReadiness = readiness.readinessSchemaVersion ===
  'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0';

const readinessView = universalReadiness ? {
  articleIdentity: {
    nodeCode: readiness.canonicalIdentity.nodeCode,
    canonicalQuestionKey: readiness.canonicalIdentity.canonicalQuestionKey,
    slug: readiness.canonicalIdentity.slug,
    canonicalLanguage: readiness.locale,
    nextNode: readiness.sequenceBoundary.nextNode
  },
  canonicalQuestion: readiness.canonicalIdentity.localizedQuestion,
  centralThesis: readiness.canonicalThesis.statement,
  requiredMechanisms: readiness.articleBoundary.mustEstablish,
  requiredDistinctions: readiness.articleBoundary.requiredDistinctions,
  prohibitedClaims: readiness.articleBoundary.mustNotClaim,
  articleBoundary: readiness.articleBoundary.includedScope,
  editorialOutline: {
    sections: readiness.articleBoundary.mustEstablish.map((heading, index) => ({
      sectionCode: `S${String(index + 1).padStart(2, '0')}`,
      heading
    })),
    articleBodyCreated: false
  },
  visualRequirement: {
    briefOnly: true,
    assetCreated: false,
    assetCode: null,
    registryRequirement: {
      requiredFields: contract.visualAssetBoundary.requiredFields
    }
  },
  claimDossier: { claims: [] },
  reviewRequirement: contract.reviewLayer.reviewTypes.map(reviewType => ({
    reviewType,
    reviewStatus: 'not_reviewed'
  })),
  publicationRequirement: { published: false },
  productionLifecycle: {
    currentStage: 'claims_prepared',
    humanApprovalGranted: false,
    publicationAuthorityGranted: false
  }
} : readiness;

if (universalReadiness) {
  assert.equal(readiness.nodeCode, 'KN-PREFACE-001');
  assert.equal(readiness.review.humanFrozen, true);
  assert.equal(readiness.review.status, 'approved');
  assert.equal(typeof readiness.review.reviewedBy, 'string');
  assert(readiness.review.reviewedBy.length > 0);
  assert.equal(readiness.productionReadiness.status, 'production_ready');
  assert.deepEqual(readiness.productionReadiness.missingFields, []);
  assert.deepEqual(readiness.productionReadiness.blockingReasons, []);
  assert(Array.isArray(readiness.claimBoundary.requiredClaimFamilies));
  assert(readiness.claimBoundary.requiredClaimFamilies.length > 0);
  assert(
    readiness.claimBoundary.allowedClaimTypes.every(claimType =>
      contract.claimGovernance.claimTypes.includes(claimType)
    )
  );
  assert(
    readiness.sourceBoundary.knownSources.every(sourceCode =>
      sourcesRegistry.sources.some(source => source.sourceCode === sourceCode)
    )
  );
  assert.equal(readiness.figureBoundary.figureRequirement, 'required');
  assert(readiness.publicContentBoundary.publicKnowledgeBoundary.length > 0);
  assert(readiness.publicContentBoundary.paidBookBoundary.length > 0);
  assert(readiness.publicContentBoundary.runtimeJourneyBoundary.length > 0);
  assert(readiness.publicContentBoundary.professionalServiceBoundary.length > 0);
}

assert.equal(
  contract.contractId,
  'PJA-W2A-v1.0.0-Canonical-Article-Editorial'
);
assert.equal(contract.step, 'PJA-W2A');
assert.equal(contract.version, '1.0.0');
assert.deepEqual(contract.baseline, {
  repository: 'getphioscs-UX/phios',
  branch: 'main',
  commit: '1c59299a64f7ddcd5dd2cbfe4ee56beff5f04d72',
  prerequisite: 'PJA-W1-v1.1.0-Blueprint-led'
});
assert.equal(pjaW1.freezeId, contract.baseline.prerequisite);

const registryPopulationEvolutionFiles = new Set([
  'content/knowledge/registry/nodes.json',
  'content/knowledge/registry/localized-content.json'
]);
for (const [file, expectedHash] of Object.entries(
  contract.preservation.baselineHashes
)) {
  if (registryPopulationEvolutionFiles.has(file)) continue;
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen PJA-W1 publication content changed: ${file}`
  );
}

const registryFiles = (await fs.readdir(
  path.join(root, 'content/knowledge/registry')
)).filter(file => file.endsWith('.json'));
const registrySchemas = (await fs.readdir(
  path.join(root, 'content/knowledge/registry/schemas')
)).filter(file => file.endsWith('.json'));
const migrationFiles = (await fs.readdir(
  path.join(root, 'db/migrations')
)).filter(file => file.endsWith('.sql'));

assert.equal(nodesRegistry.nodes.length, blueprint.plannedCanonicalNodes);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  contract.preservation.canonicalNodeCount
);
assert.equal(
  themesRegistry.themes.filter(theme => theme.themeCode.startsWith('TH-PREFACE-')).length,
  contract.preservation.canonicalThemeCount
);
assert.equal(themesRegistry.themes.length, contract.preservation.canonicalThemeCount + blueprint.sourceParts);
assert.equal(registryFiles.length, 12);
assert.equal(registrySchemas.length, 12);
assert.equal(migrationFiles.length, 5);
assert.equal(contract.preservation.canonicalNodeCount, blueprint.prefaceCanonicalNodes);
assert.equal(
  contract.preservation.canonicalThemeCount,
  themesRegistry.themes.filter(theme => theme.themeCode.startsWith('TH-PREFACE-')).length
);
assert.equal(contract.preservation.knowledgeRegistryFileCount, 12);
assert.equal(contract.preservation.knowledgeRegistrySchemaCount, 12);
assert.equal(contract.preservation.canonicalRegistryChanged, false);
assert.equal(contract.preservation.localizedRegistryChanged, false);
assert.equal(contract.preservation.assetRegistryChanged, false);
assert.equal(
  nodesRegistry.nodes.every(node => blueprint.nodes.some(item => item.nodeCode === node.nodeCode)),
  true,
  'Canonical Node Registry contains an identity outside the Book I Blueprint.'
);
assert.equal(
  localizedRegistry.localizedContent.every(record => (
    nodesRegistry.nodes.some(node => node.nodeCode === record.nodeCode)
  )),
  true,
  'Localized Registry contains an identity outside the Canonical Node Registry.'
);
assert.equal(contract.preservation.d1MigrationAdded, false);

const articleFiles = (await filesIn('content/knowledge/articles')).sort();
assert.equal(articleFiles.length, 6);
assert(
  articleFiles.every(file => file.endsWith('.json')),
  'Article content directory contains a second body format'
);
assert.equal(
  articleFiles.some(file => file.includes(
    'ai-formation-from-civilizational-capability'
  )),
  false,
  'KN-PREFACE-001 Article JSON was created before approval'
);

const articleAllowedProperties = new Set(
  Object.keys(articleSchema.properties)
);
const auditedArticleFields = [...contract.currentStateAudit.articleJsonFields]
  .sort();
const localizedArticleAdditionalFields =
  contract.currentStateAudit.localizedArticleAdditionalFields;

for (const articleFile of articleFiles) {
  const article = await readJson(articleFile);

  for (const property of Object.keys(article)) {
    assert(
      auditedArticleFields.includes(property),
      `Article JSON field is absent from the baseline audit: ${property}`
    );
  }
  if (article.locale === 'en') {
    assert(
      localizedArticleAdditionalFields.every(field => (
        Object.hasOwn(article, field)
      )),
      `English article is missing localization governance fields: ${articleFile}`
    );
  } else {
    assert(
      localizedArticleAdditionalFields.every(field => (
        !Object.hasOwn(article, field)
      )),
      `Canonical article contains localized-only fields: ${articleFile}`
    );
  }
  for (const required of articleSchema.required) {
    assert(
      Object.hasOwn(article, required),
      `Legacy article is missing schema field ${required}: ${articleFile}`
    );
  }
  for (const property of Object.keys(article)) {
    assert(
      articleAllowedProperties.has(property),
      `Legacy article contains an uncontrolled property: ${property}`
    );
  }
  assert(article.sections.length > 0);
  for (const section of article.sections) {
    assert.equal(typeof section.heading, 'string');
    assert(Array.isArray(section.paragraphs));
    assert(section.paragraphs.length > 0);
    assert(
      section.paragraphs.every(paragraph => typeof paragraph === 'string')
    );
  }
}

const articleBodyAlternatives = await Promise.all([
  filesIn('content/knowledge').then(files => files.filter(file => (
    !file.startsWith('content/knowledge/production/') &&
    !file.startsWith('content/knowledge/governance/prompt-templates/') &&
    (file.endsWith('.md') || file.endsWith('.html'))
  ))),
  filesIn('articles').then(files => files.filter(file => (
    file.endsWith('.md') ||
    file.endsWith('.json')
  )))
]);
assert.deepEqual(articleBodyAlternatives[0], []);
assert.deepEqual(articleBodyAlternatives[1], []);

for (const shell of await filesIn('articles')) {
  const html = await read(shell);
  assert.match(
    html,
    /<main id="article-main"[^>]+data-article-slug="[^"]+"[^>]*><\/main>/
  );
  assert(html.includes('/assets/js/pages/article.js'));
}
assert.equal(
  await exists('articles/ai-formation-from-civilizational-capability.html'),
  false
);

assert.equal(articleSchema.additionalProperties, false);
assert.equal(articleSchema.allOf.length, 2);
assert(
  articleSchema.allOf[0].then.required.includes(
    'semanticParityStatus'
  )
);
assert.equal(
  articleSchema.allOf[1].then.properties.locale.const,
  'zh-Hans'
);
const blockRefs = articleSchema.$defs.articleBlock.oneOf.map(item => item.$ref);
const blockTypes = blockRefs.map(reference => {
  const name = reference.split('/').at(-1);
  const definition = articleSchema.$defs[name];
  assert.equal(
    definition.additionalProperties,
    false,
    `Block schema is not strict: ${name}`
  );
  return definition.properties.type.const;
});
assert.deepEqual(
  blockTypes,
  contract.structuredArticleBlockModel.allowedTypes
);
assert.equal(
  articleSchema.$defs.section.properties.blocks.minItems,
  1
);
assert(
  articleSchema.$defs.section.anyOf.some(rule => (
    rule.required?.includes('paragraphs')
  ))
);
assert(
  articleSchema.$defs.section.anyOf.some(rule => (
    rule.required?.includes('blocks')
  ))
);

const forbiddenCapabilities =
  contract.structuredArticleBlockModel.forbiddenCapabilities;
const blockDefinitions = Object.fromEntries(blockRefs.map(reference => {
  const name = reference.split('/').at(-1);
  return [name, articleSchema.$defs[name]];
}));
const blockSchemaKeys = new Set();

function collectObjectKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(collectObjectKeys);
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, nested] of Object.entries(value)) {
    blockSchemaKeys.add(key);
    collectObjectKeys(nested);
  }
}

collectObjectKeys(blockDefinitions);
for (const forbidden of forbiddenCapabilities) {
  assert.equal(
    blockSchemaKeys.has(forbidden),
    false,
    `Forbidden article capability entered the Block Schema: ${forbidden}`
  );
}

for (const blockType of blockTypes) {
  assert(
    renderer.includes(`case '${blockType}'`),
    `Renderer does not implement allowlisted block: ${blockType}`
  );
}
for (const escapedField of [
  'block.text',
  'block.question',
  'block.answer',
  'block.heading',
  'block.statement',
  'step.label',
  'step.description',
  'entry.period',
  'entry.title',
  'entry.description',
  'side?.heading',
  'item',
  'visual.publicSrc',
  'visual.altText',
  'visual.caption',
  'block.label',
  'block.description',
  'nextArticle.title'
]) {
  assert(
    renderer.includes(`escapeHtml(${escapedField})`),
    `Structured Renderer does not escape ${escapedField}`
  );
}
assert(renderer.includes('const legacyParagraphs = Array.isArray(section.paragraphs)'));
assert(renderer.includes('const blocks = Array.isArray(section.blocks)'));
assert(renderer.includes("default:\n      return '';"));
assert.equal(renderer.includes('rawHtml'), false);
assert.equal(renderer.includes('innerHTML: block'), false);

assert(publishedLoader.includes('VISUAL_ASSET_TYPES'));
assert(publishedLoader.includes("asset.localeDependency === 'none'"));
assert(publishedLoader.includes('isApprovedPublication(asset)'));
assert(publishedLoader.includes('visualAssetsFor('));
assert(renderer.includes('article.visualAssets?.find'));
assert(renderer.includes('candidate.nodeCode === block.nodeCode'));
assert(renderer.includes('articleHref(nextArticle)'));

assert.deepEqual(contract.claimGovernance.claimTypes, [
  'externally_verifiable',
  'phi_os_interpretation',
  'editorial_inference',
  'canonical_transition',
  'boundary_statement'
]);
assert.deepEqual(
  claimSchema.properties.claimType.enum,
  contract.claimGovernance.claimTypes
);
assert.deepEqual(
  claimSchema.required,
  contract.claimGovernance.requiredFields
);
assert.deepEqual(claimSchema.properties.reviewStatus.enum, [
  'not_reviewed',
  'changes_required',
  'conditionally_approved',
  'approved'
]);
assert.equal(claimSchema.additionalProperties, false);
assert.equal(
  contract.claimGovernance.rules.sourceCodeMayBeInvented,
  false
);
assert.equal(
  contract.claimGovernance.rules.sourcePresenceEqualsClaimSupport,
  false
);
assert.equal(contract.claimGovernance.rules.aiMaySetApproved, false);

const knownSourceCodes = new Set(
  sourcesRegistry.sources.map(source => source.sourceCode)
);
const claimIds = new Set();
for (const claim of readinessView.claimDossier.claims) {
  assert.equal(
    Object.keys(claim).length,
    claimSchema.required.length,
    `Claim contains an uncontrolled field: ${claim.claimId}`
  );
  for (const required of claimSchema.required) {
    assert(Object.hasOwn(claim, required));
  }
  assert(contract.claimGovernance.claimTypes.includes(claim.claimType));
  assert(claimSchema.properties.reviewStatus.enum.includes(claim.reviewStatus));
  assert.notEqual(claim.reviewStatus, 'approved');
  assert.equal(claim.reviewedBy, null);
  assert.equal(claim.reviewedAt, null);
  assert.equal(claimIds.has(claim.claimId), false);
  claimIds.add(claim.claimId);
  if (claim.claimType === 'externally_verifiable') {
    assert.equal(claim.sourceRequired, true);
  }
  for (const sourceCode of claim.sourceCodes) {
    assert(
      knownSourceCodes.has(sourceCode),
      `Claim invents an unregistered sourceCode: ${sourceCode}`
    );
  }
}

assert.deepEqual(contract.reviewLayer.reviewTypes, [
  'Canonical Review',
  'Factual Review',
  'Source Review',
  'Boundary Review',
  'Language Review',
  'Public Readability Review',
  'Cross-node Duplication Review',
  'Next-node Continuity Review',
  'Visual Review',
  'Localization Readiness Review'
]);
assert.deepEqual(contract.reviewLayer.allowedResults, [
  'not_reviewed',
  'changes_required',
  'conditionally_approved',
  'approved'
]);
assert.deepEqual(
  readinessView.reviewRequirement.map(review => review.reviewType),
  contract.reviewLayer.reviewTypes
);
assert(
  readinessView.reviewRequirement.every(review => (
    review.reviewStatus === 'not_reviewed'
  ))
);
assert.equal(contract.reviewLayer.publicationGateReduced, false);

assert.deepEqual(contract.productionLifecycle.orderedStages, [
  'node_selected',
  'thesis_frozen',
  'claims_prepared',
  'outline_approved',
  'canonical_draft_created',
  'content_editing',
  'fact_review',
  'canonical_review',
  'changes_required',
  'content_reviewed',
  'approved',
  'published'
]);
assert.deepEqual(contract.productionLifecycle.humanOnlyStages, [
  'approved',
  'published'
]);
assert.equal(
  contract.productionLifecycle.aiMaySelfAssignHumanOnlyStages,
  false
);

const editorialFields = Object.keys(contract.editorialContract.definitions);
assert.deepEqual(
  editorialFields,
  contract.editorialContract.requiredFields
);
assert.equal(
  contract.editorialContract.frozenRules
    .canonicalNodeDeterminesArticleIdentity,
  true
);
assert.equal(
  contract.editorialContract.frozenRules
    .chineseArticleJsonIsCanonicalContent,
  true
);
assert.equal(
  contract.editorialContract.frozenRules.aiHasPublicationAuthority,
  false
);
assert.equal(
  contract.editorialContract.frozenRules
    .registryPresenceEqualsProductionRequirement,
  false
);
assert.equal(
  contract.editorialContract.frozenRules
    .blueprintPresenceCreatesCanonicalIdentity,
  false
);

const prefaceNode = nodesRegistry.nodes.find(node => (
  node.nodeCode === 'KN-PREFACE-001'
));
const prefaceLocalized = localizedRegistry.localizedContent.find(record => (
  record.nodeCode === 'KN-PREFACE-001'
));
assert(prefaceNode);
assert(prefaceLocalized);
assert.equal(
  readinessView.articleIdentity.nodeCode,
  prefaceNode.nodeCode
);
assert.equal(
  readinessView.articleIdentity.canonicalQuestionKey,
  prefaceNode.canonicalQuestionKey
);
assert.equal(
  readinessView.articleIdentity.slug,
  prefaceLocalized.locales['zh-Hans'].slug
);
assert.equal(
  readinessView.articleIdentity.slug,
  'ai-formation-from-civilizational-capability'
);
assert.equal(
  readinessView.articleIdentity.canonicalLanguage,
  prefaceNode.canonicalLanguage
);
assert.equal(readinessView.articleIdentity.canonicalLanguage, 'zh-Hans');
assert.equal(
  readinessView.articleIdentity.nextNode,
  prefaceNode.relationships.nextNodeCodes[0]
);
assert.equal(readinessView.articleIdentity.nextNode, 'KN-PREFACE-002');
assert.equal(readinessView.canonicalQuestion, '人工智能如何从文明能力中形成？');
assert(readinessView.centralThesis.length > 0);
assert(readinessView.requiredMechanisms.length >= 4);
assert(readinessView.requiredDistinctions.length >= 4);
assert(readinessView.prohibitedClaims.length >= 5);
assert(readinessView.articleBoundary.length >= 3);
assert(readinessView.editorialOutline.sections.length >= 4);
assert.equal(readinessView.editorialOutline.articleBodyCreated, false);
assert.equal(readinessView.visualRequirement.briefOnly, true);
assert.equal(readinessView.visualRequirement.assetCreated, false);
assert.equal(readinessView.visualRequirement.assetCode, null);

for (const requiredVisualField of
  contract.visualAssetBoundary.requiredFields) {
  assert(
    readinessView.visualRequirement.registryRequirement.requiredFields
      .includes(requiredVisualField)
  );
}
assert.equal(contract.visualAssetBoundary.articleBodyMayBeConvertedToImage, false);
assert.equal(contract.visualAssetBoundary.base64Allowed, false);
assert.equal(contract.visualAssetBoundary.externalImageUrlAllowed, false);

assert.deepEqual(prefaceLocalized.locales['zh-Hans'], {
  locale: 'zh-Hans',
  contentRole: 'canonical',
  displayQuestion: '人工智能如何从文明能力中形成？',
  slug: 'ai-formation-from-civilizational-capability',
  contentStatus: 'not_started',
  reviewStatus: 'not_reviewed',
  publicationStatus: 'not_published',
  articleAssetCode: null,
  masterMediaPostAssetCode: null
});
assert.equal(
  prefaceLocalized.locales.en.contentStatus,
  'localization_pending'
);
assert.equal(prefaceLocalized.locales.en.reviewStatus, 'not_reviewed');
assert.equal(prefaceLocalized.locales.en.publicationStatus, 'not_published');
assert.equal(prefaceLocalized.locales.en.articleAssetCode, null);
assert.equal(
  assetsRegistry.assets.some(asset => (
    asset.nodeCode === 'KN-PREFACE-001'
  )),
  false
);
assert.equal(readinessView.publicationRequirement.published, false);
assert.equal(
  readinessView.productionLifecycle.currentStage,
  'claims_prepared'
);
assert.equal(
  readinessView.productionLifecycle.humanApprovalGranted,
  false
);
assert.equal(
  readinessView.productionLifecycle.publicationAuthorityGranted,
  false
);

assert.equal(
  contract.sourceAuthority.publicBodyCompetitionAllowed,
  false
);
assert.equal(contract.sourceAuthority.governanceRecordsArePublicBody, false);
assert.equal(contract.rendererExpansion.newCms, false);
assert.equal(contract.rendererExpansion.runtimeDependency, false);
assert.equal(contract.rendererExpansion.caseProvider, false);
assert.equal(contract.rendererExpansion.d1Migration, false);
assert.equal(contract.rendererExpansion.secondArticleBodySource, false);

for (const moduleSource of [renderer, publishedLoader]) {
  for (const forbiddenImport of [
    "from '../runtime",
    "from '../providers",
    "from '../payments",
    "from '../entitlements",
    "from '../../functions",
    '/api/'
  ]) {
    assert.equal(
      moduleSource.includes(forbiddenImport),
      false,
      `Article rendering gained forbidden dependency: ${forbiddenImport}`
    );
  }
}

assert.equal(
  packageJson.scripts['check:pja-w2a'],
  'npm run check:pja-w1 && node scripts/check-pja-w2a-canonical-article-editorial-contract.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w2a-canonical-article-editorial-contract.mjs'
  )
);
assert(
  packageJson.scripts.precheck.indexOf(
    'check-pja-w2a-canonical-article-editorial-contract'
  ) >
  packageJson.scripts.precheck.indexOf(
    'check-pja-w1-blueprint-led-knowledge'
  )
);

console.log('✓ PJA-W2A Canonical Article Editorial Contract passed.');
console.log(`  PJA-W1 content and Registry hashes remain frozen: ${contract.preservation.canonicalNodeCount} Preface Nodes, ${contract.preservation.canonicalThemeCount} Preface Themes, ${registryFiles.length} Registry files and ${registrySchemas.length} Registry schemas.`);
console.log('  Legacy paragraphs and 10 strict optional Block types remain compatible; text is escaped and visual/next-node references are published-only.');
console.log('  Claim, source, review, lifecycle and AI authority boundaries are enforced without Runtime, Provider, Payment, Entitlement or D1 dependencies.');
console.log('  KN-PREFACE-001 has no public Article asset, English asset, shell, Registry asset or publication state; governed production drafts remain isolated.');
