import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const fixtureDirectory = 'tests/fixtures/knowledge/governance';
const read = file => fs.readFile(path.join(root, file), 'utf8');
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
    assert(
      parent !== undefined,
      `Fixture pointer does not resolve: ${operation.path}`
    );
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

async function materializeFixture(file, stack = []) {
  assert(
    !stack.includes(file),
    `Circular governance fixture inheritance: ${[...stack, file].join(' -> ')}`
  );
  const descriptorPath = path.posix.join(fixtureDirectory, file);
  const descriptor = await readJson(descriptorPath);

  if (descriptor.articleFixture) {
    const [
      article,
      claimDossier,
      sourceDossier,
      reviewFixture
    ] = await Promise.all([
      readJson(path.posix.join(fixtureDirectory, descriptor.articleFixture)),
      readJson(path.posix.join(
        fixtureDirectory,
        descriptor.claimDossierFixture
      )),
      readJson(path.posix.join(
        fixtureDirectory,
        descriptor.sourceDossierFixture
      )),
      readJson(path.posix.join(
        fixtureDirectory,
        descriptor.reviewFixture
      ))
    ]);

    for (const operation of descriptor.articleOperations) {
      applyOperation(article, operation);
    }

    return {
      scenario: {
        fixtureOnly: descriptor.fixtureOnly,
        productionAuthority: descriptor.productionAuthority,
        article,
        claims: claimDossier.claims,
        claimSetVersion: claimDossier.claimSetVersion,
        sources: sourceDossier.sources,
        sourceSetVersion: sourceDossier.sourceSetVersion,
        review: reviewFixture.record,
        canonicalChineseApproval:
          structuredClone(descriptor.canonicalChineseApproval)
      },
      descriptor
    };
  }

  assert(descriptor.baseFixture, `Fixture has no base: ${file}`);
  const materialized = await materializeFixture(
    descriptor.baseFixture,
    [...stack, file]
  );
  const scenario = structuredClone(materialized.scenario);

  for (const operation of descriptor.operations) {
    applyOperation(scenario, operation);
  }

  return {
    scenario,
    descriptor
  };
}

function strictObjectSchemas(schema, location = '#') {
  if (Array.isArray(schema)) {
    schema.forEach((item, index) => (
      strictObjectSchemas(item, `${location}/${index}`)
    ));
    return;
  }
  if (!schema || typeof schema !== 'object') return;

  const isObjectSchema = schema.type === 'object' ||
    (Array.isArray(schema.type) && schema.type.includes('object'));
  if (isObjectSchema) {
    assert.equal(
      schema.additionalProperties,
      false,
      `Object Schema is not strict: ${location}`
    );
  }

  for (const [key, nested] of Object.entries(schema)) {
    strictObjectSchemas(nested, `${location}/${key}`);
  }
}

const [
  claimSchema,
  sourceSchema,
  reviewSchema,
  articleSchema,
  policy,
  nodesRegistry,
  themesRegistry,
  localizedRegistry,
  assetsRegistry,
  existingSourcesRegistry,
  packageJson,
  publishedLoader,
  articleRenderer,
  articleBlocks
] = await Promise.all([
  readJson('content/knowledge/schemas/claim.schema.json'),
  readJson('content/knowledge/schemas/source.schema.json'),
  readJson('content/knowledge/schemas/article-review.schema.json'),
  readJson('content/knowledge/schemas/article-v2.schema.json'),
  readJson(
    'content/knowledge/governance/policies/' +
    'pja-w2c-claim-source-review-policy.json'
  ),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/sources.json'),
  readJson('package.json'),
  read('assets/js/knowledge/published-content.js'),
  read('assets/js/pages/article.js'),
  read('assets/js/knowledge/article-blocks.js')
]);

assert.equal(
  claimSchema.$id,
  'https://getphios.com/schemas/knowledge/claim.schema.json'
);
assert.equal(
  sourceSchema.$id,
  'https://getphios.com/schemas/knowledge/source.schema.json'
);
assert.equal(
  reviewSchema.$id,
  'https://getphios.com/schemas/knowledge/article-review.schema.json'
);
assert.equal(
  claimSchema.properties.schemaVersion.const,
  'PHI-OS-KNOWLEDGE-CLAIM-v1.0.0'
);
assert.equal(
  sourceSchema.properties.schemaVersion.const,
  'PHI-OS-KNOWLEDGE-SOURCE-v1.0.0'
);
assert.equal(
  reviewSchema.properties.schemaVersion.const,
  'PHI-OS-KNOWLEDGE-ARTICLE-REVIEW-v1.0.0'
);
strictObjectSchemas(claimSchema);
strictObjectSchemas(sourceSchema);
strictObjectSchemas(reviewSchema);

assert.equal(
  policy.contractId,
  'PJA-W2C-v1.0.0-Claim-Source-Editorial-Review-Governance'
);
assert.equal(policy.baseline.commit, '1f3a6e36d9bbd5466b6c42926505da45623db719');
assert.equal(policy.responsibilitySeparation.articleJsonRemainsOnlyPublicBodyAuthority, true);
assert.equal(policy.responsibilitySeparation.sourcePresenceEqualsClaimSupport, false);
assert.equal(policy.reviewGovernance.aiAssistantMayApprove, false);
assert.equal(policy.reviewGovernance.automatedValidatorMayApprove, false);
assert.equal(policy.sourceGovernance.contraryEvidenceMustBeRecordable, true);
assert.deepEqual(
  claimSchema.properties.claimType.enum,
  policy.claimGovernance.claimTypes
);
assert.deepEqual(
  reviewSchema.$defs.reviewStatus.enum,
  policy.reviewGovernance.reviewStatuses
);
assert.deepEqual(
  sourceSchema.properties.publicationStatus.enum,
  policy.sourceGovernance.publicationStatuses
);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  strictTypes: false
});
ajv.addFormat(
  'date-time',
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/
);
ajv.addFormat('uri', /^(?:https?:\/\/|urn:)[^\s]+$/);

const validateClaim = ajv.compile(claimSchema);
const validateSource = ajv.compile(sourceSchema);
const validateReview = ajv.compile(reviewSchema);
const validateArticle = ajv.compile(articleSchema);
const nodeByCode = new Map(
  nodesRegistry.nodes.map(node => [node.nodeCode, node])
);

function approvalErrors({
  status,
  reviewerType,
  reviewedBy,
  reviewedAt,
  prefix
}) {
  const errors = [];
  const humanOnly = new Set([
    'conditionally_approved',
    'approved',
    'rejected'
  ]);

  if (!humanOnly.has(status)) return errors;
  if (reviewerType !== 'human') errors.push('non_human_approval');
  if (!reviewedBy) errors.push('approval_identity_missing');
  if (!reviewedAt) errors.push('approval_timestamp_missing');
  if (errors.length) errors.push(`${prefix}_approval_invalid`);
  return errors;
}

function semanticErrors(scenario) {
  const errors = [];
  const {
    article,
    claims = [],
    sources = [],
    review,
    claimSetVersion,
    sourceSetVersion,
    canonicalChineseApproval
  } = scenario;

  if (!article || !validateArticle(article)) errors.push('article_schema');
  for (const claim of claims) {
    if (!validateClaim(claim)) errors.push('claim_schema');
  }
  for (const source of sources) {
    if (!validateSource(source)) errors.push('source_schema');
  }
  if (!review) {
    errors.push('missing_review_record');
  } else if (!validateReview(review)) {
    errors.push('review_schema');
  }

  const claimCodes = claims.map(claim => claim.claimCode);
  const sourceCodes = sources.map(source => source.sourceCode);
  if (new Set(claimCodes).size !== claimCodes.length) {
    errors.push('duplicate_claim_code');
  }
  if (new Set(sourceCodes).size !== sourceCodes.length) {
    errors.push('duplicate_source_code');
  }
  const sourceByCode = new Map(
    sources.map(source => [source.sourceCode, source])
  );
  const claimByCode = new Map(
    claims.map(claim => [claim.claimCode, claim])
  );

  const sectionByCode = new Map();
  const blockByCode = new Map();
  for (const section of article?.sections || []) {
    if (section.sectionCode) sectionByCode.set(section.sectionCode, section);
    for (const block of section.blocks || []) {
      blockByCode.set(block.blockCode, block);
      for (const claimCode of block.sourceClaimCodes || []) {
        const claim = claimByCode.get(claimCode);
        if (!claim) {
          errors.push('article_claim_code_not_found');
        } else if (
          claim.nodeCode !== article.nodeCode ||
          claim.locale !== article.locale
        ) {
          errors.push('article_claim_identity_mismatch');
        }
      }
    }
  }

  const activeClaims = claims.filter(claim => ![
    'rejected',
    'deprecated'
  ].includes(claim.status?.claimStatus));

  for (const claim of claims) {
    if (!nodeByCode.has(claim.nodeCode)) errors.push('claim_node_not_found');
    if (claim.nodeCode !== article.nodeCode) errors.push('claim_node_mismatch');
    if (claim.locale !== article.locale) errors.push('claim_locale_mismatch');
    if (claim.claimSetVersion !== claimSetVersion) {
      errors.push('claim_set_version_mismatch');
    }

    const section = sectionByCode.get(claim.scope?.articleSectionCode);
    if (!section) errors.push('claim_section_not_found');
    const blockCode = claim.scope?.articleBlockCode;
    if (blockCode) {
      const block = blockByCode.get(blockCode);
      if (!block) {
        errors.push('claim_block_not_found');
      } else if (
        activeClaims.includes(claim) &&
        !(block.sourceClaimCodes || []).includes(claim.claimCode)
      ) {
        errors.push('claim_block_mapping_missing');
      }
    }

    const referencedSources = [
      ...(claim.sourceSupport || []).map(item => item.sourceCode),
      ...(claim.canonicalSourceCodes || []),
      ...(claim.contrarySourceCodes || [])
    ];
    for (const sourceCode of referencedSources) {
      if (!sourceByCode.has(sourceCode)) errors.push('source_code_not_found');
    }

    const supportingMappings = (claim.sourceSupport || []).filter(mapping => (
      ['direct', 'partial', 'contextual'].includes(mapping.supportType) &&
      !['none', 'not_assessed'].includes(mapping.supportLevel)
    ));
    const eligibleMappings = supportingMappings.filter(mapping => {
      const source = sourceByCode.get(mapping.sourceCode);
      return (
        source &&
        source.supportEligibility === 'eligible' &&
        source.qualityAssessment.authorityLevel !== 'reference_only' &&
        source.publicationStatus !== 'deprecated'
      );
    });

    if (
      claim.supportRequirement?.sourceRequired &&
      activeClaims.includes(claim) &&
      eligibleMappings.length <
        claim.supportRequirement.minimumIndependentSources
    ) {
      errors.push('source_required');
    }

    if (
      claim.supportRequirement?.qualificationRequired &&
      activeClaims.includes(claim) &&
      !claim.editorialAssessment?.qualification?.trim()
    ) {
      errors.push('qualification_required');
    }

    if (
      /完整理解整个人类文明/.test(claim.statement || '') &&
      eligibleMappings.length === 0
    ) {
      errors.push('unsupported_absolute_claim');
    }

    if (['high', 'critical'].includes(claim.scope?.materiality)) {
      for (const mapping of supportingMappings) {
        const source = sourceByCode.get(mapping.sourceCode);
        if (
          source?.qualityAssessment.authorityLevel === 'reference_only' ||
          source?.supportEligibility !== 'eligible'
        ) {
          errors.push('reference_only_high_claim');
        }
      }
    }

    for (const mapping of claim.sourceSupport || []) {
      const source = sourceByCode.get(mapping.sourceCode);
      if (source?.publicationStatus === 'deprecated') {
        errors.push('deprecated_source_used');
      }
      if (
        mapping.supportType === 'contradictory' &&
        !claim.contrarySourceCodes.includes(mapping.sourceCode)
      ) {
        errors.push('contrary_source_not_recorded');
      }
    }
    for (const contraryCode of claim.contrarySourceCodes || []) {
      if (!(claim.sourceSupport || []).some(mapping => (
        mapping.sourceCode === contraryCode &&
        mapping.supportType === 'contradictory'
      ))) {
        errors.push('contrary_support_mapping_missing');
      }
    }

    if (claim.claimType === 'phi_os_interpretation') {
      if (!claim.canonicalSourceCodes.length) {
        errors.push('canonical_trace_missing');
      }
      for (const sourceCode of claim.canonicalSourceCodes) {
        if (!sourceByCode.get(sourceCode)?.sourceType.startsWith('phi_os_')) {
          errors.push('canonical_trace_source_type');
        }
      }
    }
    if (claim.claimType === 'mixed' && !claim.mixedAssessment) {
      errors.push('mixed_assessment_missing');
    }
    if (claim.claimType === 'canonical_transition' && blockCode) {
      const block = blockByCode.get(blockCode);
      const expectedNextNode = nodeByCode.get(article.nodeCode)
        ?.relationships?.nextNodeCodes?.[0] || null;
      if (
        block?.type !== 'next_node' ||
        block.nodeCode !== expectedNextNode
      ) {
        errors.push('canonical_transition_mismatch');
      }
    }

    for (const [name, assessment] of [
      ['claim_support', claim.supportAssessment],
      ['claim_editorial', claim.editorialAssessment]
    ]) {
      errors.push(...approvalErrors({
        status: assessment?.status,
        reviewerType: assessment?.reviewerType,
        reviewedBy: assessment?.reviewedBy,
        reviewedAt: assessment?.reviewedAt,
        prefix: name
      }));
    }
  }

  for (const source of sources) {
    if (source.sourceSetVersion !== sourceSetVersion) {
      errors.push('source_set_version_mismatch');
    }
    errors.push(...approvalErrors({
      status: source.review?.status,
      reviewerType: source.review?.reviewerType,
      reviewedBy: source.review?.reviewedBy,
      reviewedAt: source.review?.reviewedAt,
      prefix: 'source'
    }));
    if (
      source.qualityAssessment?.authorityLevel === 'reference_only' &&
      source.supportEligibility === 'eligible'
    ) {
      errors.push('reference_only_marked_eligible');
    }
  }

  if (review) {
    if (review.nodeCode !== article.nodeCode) errors.push('review_node_mismatch');
    if (review.locale !== article.locale) errors.push('review_locale_mismatch');
    if (review.articleAssetCode !== article.assetCode) {
      errors.push('review_asset_mismatch');
    }
    if (review.articleVersion !== article.version) {
      errors.push('article_version_mismatch');
    }
    if (review.claimSetVersion !== claimSetVersion) {
      errors.push('review_claim_set_version_mismatch');
    }
    if (review.sourceSetVersion !== sourceSetVersion) {
      errors.push('review_source_set_version_mismatch');
    }

    for (const dimension of Object.values(review.reviews || {})) {
      errors.push(...approvalErrors({
        status: dimension.status,
        reviewerType: dimension.reviewer?.reviewerType,
        reviewedBy: dimension.reviewer?.reviewerId,
        reviewedAt: dimension.reviewedAt,
        prefix: 'review_dimension'
      }));
      for (const finding of dimension.findings || []) {
        if (
          finding.status === 'accepted_risk' &&
          finding.resolvedBy?.reviewerType !== 'human'
        ) {
          errors.push('accepted_risk_without_human');
        }
      }
    }
    errors.push(...approvalErrors({
      status: review.overallDecision?.status,
      reviewerType: review.overallDecision?.reviewerType,
      reviewedBy: review.overallDecision?.approvedBy,
      reviewedAt: review.overallDecision?.approvedAt,
      prefix: 'overall'
    }));
  }

  const expectedNextNode = nodeByCode.get(article?.nodeCode)
    ?.relationships?.nextNodeCodes?.[0] || null;
  if (article?.connections?.nextNode !== expectedNextNode) {
    errors.push('next_node_governance_mismatch');
  }

  const shouldEvaluatePublicationGate = article?.publicationStatus === 'published' ||
    scenario.fixtureOnly;
  if (shouldEvaluatePublicationGate) {
    if (article?.contentStatus !== 'content_reviewed') {
      errors.push('publication_content_not_reviewed');
    }
    if (article?.reviewStatus !== 'approved') {
      errors.push('publication_article_review_not_approved');
    }
    if (!review || review.overallDecision?.status !== 'approved') {
      errors.push('publication_review_not_approved');
    }
    if (review) {
      for (const dimension of Object.values(review.reviews || {})) {
        if (!['approved', 'not_applicable'].includes(dimension.status)) {
          errors.push('required_review_dimension_not_approved');
        }
        for (const finding of dimension.findings || []) {
          if (
            finding.severity === 'critical' &&
            !['verified', 'withdrawn', 'accepted_risk'].includes(finding.status)
          ) {
            errors.push('open_critical_finding');
          }
          if (
            finding.severity === 'major' &&
            !['verified', 'withdrawn', 'accepted_risk'].includes(finding.status)
          ) {
            errors.push('open_major_finding');
          }
        }
      }
    }

    for (const claim of activeClaims) {
      if (
        ['high', 'critical'].includes(claim.scope.materiality) &&
        claim.status.claimStatus !== 'approved'
      ) {
        errors.push('unapproved_high_claim');
      }
      if (claim.supportRequirement.sourceRequired) {
        for (const mapping of claim.sourceSupport.filter(item => (
          ['direct', 'partial', 'contextual'].includes(item.supportType) &&
          !['none', 'not_assessed'].includes(item.supportLevel)
        ))) {
          if (sourceByCode.get(mapping.sourceCode)?.review.status !== 'approved') {
            errors.push('unreviewed_required_source');
          }
        }
      }
    }

    for (const reference of article?.sourceReferences || []) {
      const source = sourceByCode.get(reference.sourceCode);
      if (!source) {
        errors.push('public_source_not_found');
      } else if (![
        'public_citation_allowed',
        'public_metadata_only'
      ].includes(source.publicationStatus)) {
        errors.push('restricted_source_projection');
      }
    }

    if (
      article?.locale === 'en' &&
      canonicalChineseApproval?.status !== 'approved'
    ) {
      errors.push('english_before_canonical_chinese');
    }
  }

  return [...new Set(errors)];
}

function assertFocus(descriptor, scenario) {
  if (!descriptor.focus) return;
  const focus = descriptor.focus;

  if (focus.claimCode) {
    const claim = scenario.claims.find(item => (
      item.claimCode === focus.claimCode
    ));
    assert(claim, `Focus Claim not found: ${focus.claimCode}`);
    if (focus.expectedClaimType) {
      assert.equal(claim.claimType, focus.expectedClaimType);
    }
    if (focus.expectedAuthorityLevel) {
      const source = scenario.sources.find(item => (
        item.sourceCode === claim.sourceSupport[0].sourceCode
      ));
      assert.equal(
        source.qualityAssessment.authorityLevel,
        focus.expectedAuthorityLevel
      );
    }
    if (focus.qualificationRequired) {
      assert.equal(claim.supportRequirement.qualificationRequired, true);
      assert(claim.editorialAssessment.qualification.length > 0);
    }
    if (focus.contrarySourceCode) {
      assert(claim.contrarySourceCodes.includes(focus.contrarySourceCode));
      assert(claim.sourceSupport.some(mapping => (
        mapping.sourceCode === focus.contrarySourceCode &&
        mapping.supportType === 'contradictory'
      )));
    }
  }

  if (focus.requiredReviewDimension) {
    assert.equal(
      scenario.review.reviews[focus.requiredReviewDimension].status,
      'approved'
    );
  }
  if (focus.reviewerType) {
    assert.equal(
      scenario.review.overallDecision.reviewerType,
      focus.reviewerType
    );
  }
  for (const key of [
    'contentStatus',
    'reviewStatus',
    'publicationStatus'
  ]) {
    if (focus[key]) assert.equal(scenario.article[key], focus[key]);
  }
}

const fixtureFiles = (await fs.readdir(
  path.join(root, fixtureDirectory)
)).filter(file => file.endsWith('.json')).sort();
const validFixtureFiles = fixtureFiles.filter(file => file.startsWith('valid-'));
const invalidFixtureFiles = fixtureFiles.filter(file => file.startsWith('invalid-'));

assert.deepEqual(validFixtureFiles, [
  'valid-claim-with-contrary-source.json',
  'valid-content-reviewed-not-published.json',
  'valid-external-claim-with-primary-source.json',
  'valid-human-approved-review.json',
  'valid-mixed-claim-with-qualification.json',
  'valid-phi-os-interpretation-with-canonical-review.json',
  'valid-publication-ready-article.json'
]);
assert(invalidFixtureFiles.length >= 19);

for (const file of validFixtureFiles) {
  const { scenario, descriptor } = await materializeFixture(file);
  const errors = semanticErrors(scenario);
  assert.deepEqual(
    errors,
    [],
    `Valid governance fixture failed: ${file}\n${errors.join('\n')}`
  );
  assertFocus(descriptor, scenario);
  assert.equal(descriptor.expectedPublicationGate, 'allow');
}

for (const file of invalidFixtureFiles) {
  const { scenario, descriptor } = await materializeFixture(file);
  const errors = semanticErrors(scenario);
  assert(
    errors.includes(descriptor.expectedFailure),
    `Invalid fixture did not fail for ${descriptor.expectedFailure}: ${file}\n` +
    errors.join('\n')
  );
}

const claimsFixture = await readJson(
  path.posix.join(fixtureDirectory, 'kn-preface-001-claims.json')
);
const sourcesFixture = await readJson(
  path.posix.join(fixtureDirectory, 'kn-preface-001-sources.json')
);
const reviewFixture = await readJson(
  path.posix.join(fixtureDirectory, 'kn-preface-001-review.json')
);
assert.equal(claimsFixture.fixtureOnly, true);
assert.equal(claimsFixture.productionAuthority, false);
assert.equal(sourcesFixture.fixtureOnly, true);
assert.equal(sourcesFixture.productionAuthority, false);
assert.equal(reviewFixture.fixtureOnly, true);
assert.equal(reviewFixture.productionAuthority, false);
const frozenSourceCodes = new Set(
  existingSourcesRegistry.sources.map(source => source.sourceCode)
);
assert(
  sourcesFixture.sources.every(source => (
    !frozenSourceCodes.has(source.sourceCode)
  )),
  'A fixture duplicates frozen Production Source metadata'
);
assert.deepEqual(
  claimsFixture.claims.map(claim => claim.claimCode),
  [
    'CLM-KN-PREFACE-001-001',
    'CLM-KN-PREFACE-001-002',
    'CLM-KN-PREFACE-001-003',
    'CLM-KN-PREFACE-001-004',
    'CLM-KN-PREFACE-001-005'
  ]
);
assert.equal(claimsFixture.claims.at(-1).status.claimStatus, 'rejected');
assert.equal(
  claimsFixture.claims.some(claim => claim.claimType === 'mixed'),
  true
);

const productionArticleFiles = (await filesIn(
  'content/knowledge/articles'
)).sort();
assert.equal(productionArticleFiles.length, 6);
assert(
  productionArticleFiles.every(file => file.endsWith('.json')),
  'Article JSON is no longer the only production article body source'
);
assert.equal(
  productionArticleFiles.some(file => file.includes(
    'ai-formation-from-civilizational-capability'
  )),
  false
);
const vapW27Path = 'content/production/visual-article/release/website/VAP-W27-KN-PREFACE-001-ZH-HANS.json';
const vapW27Executed = await exists(vapW27Path) && (await readJson(vapW27Path)).status === 'EXECUTED';
assert.equal(await exists('articles/ai-formation-from-civilizational-capability.html'), vapW27Executed);
assert.equal(
  assetsRegistry.assets.some(asset => asset.nodeCode === 'KN-PREFACE-001'),
  false
);
const prefaceLocalized = localizedRegistry.localizedContent.find(record => (
  record.nodeCode === 'KN-PREFACE-001'
));
assert.equal(prefaceLocalized.locales['zh-Hans'].contentStatus, 'not_started');
assert.equal(prefaceLocalized.locales['zh-Hans'].reviewStatus, 'not_reviewed');
assert.equal(prefaceLocalized.locales['zh-Hans'].publicationStatus, 'not_published');
assert.equal(prefaceLocalized.locales.en.contentStatus, 'localization_pending');
assert.equal(prefaceLocalized.locales.en.publicationStatus, 'not_published');

const historicalRegistryBlueprint = await readJson(
  'content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json'
);
const historicalNodeCodes = new Set(
  historicalRegistryBlueprint.nodes.map(node => node.nodeCode)
);
const historicalRegistryNodes = nodesRegistry.nodes.filter(node =>
  historicalNodeCodes.has(node.nodeCode)
);
assert.equal(
  historicalRegistryNodes.length,
  historicalRegistryBlueprint.plannedCanonicalNodes
);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  historicalRegistryBlueprint.prefaceCanonicalNodes
);
const referencedThemeCodes = new Set(
  historicalRegistryNodes
    .filter(node => node.publicationBookCode !== 'BOOK-2')
    .map(node => node.themeCode)
);
assert(
  [...referencedThemeCodes].every(themeCode =>
    themesRegistry.themes.some(theme => theme.themeCode === themeCode)
  )
);
const frozenKnowledgeRegistryFiles = new Set([
  'assets.json', 'canonical-extraction-policy.json', 'collections.json',
  'learning-paths.json', 'localized-content.json', 'nodes.json',
  'search-aliases.json', 'services.json', 'sources.json',
  'supporting-questions.json', 'terminology.json', 'themes.json'
]);
assert.equal(
  (await fs.readdir(path.join(root, 'content/knowledge/registry')))
    .filter(file => frozenKnowledgeRegistryFiles.has(file)).length,
  12
);
assert.equal(
  (await fs.readdir(path.join(root, 'content/knowledge/registry/schemas')))
    .filter(file => file.endsWith('.json')).length,
  12
);
assert.equal(existingSourcesRegistry.sources.length, 12);
assert.equal(
  (await fs.readdir(path.join(root, 'db/migrations')))
    .filter(file => file.endsWith('.sql')).length,
  5
);

const articleBlockTypes = articleSchema.$defs.articleBlock.oneOf.map(item => {
  const definitionName = item.$ref.split('/').at(-1);
  return articleSchema.$defs[definitionName].properties.type.const;
});
assert.deepEqual(articleBlockTypes, [
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
assert.equal(policy.preservation.articleV2BlockAllowlistChanged, false);

assert(publishedLoader.includes("record?.contentStatus === 'content_reviewed'"));
assert(publishedLoader.includes("record?.reviewStatus === 'approved'"));
assert(publishedLoader.includes("record?.publicationStatus === 'published'"));
assert.equal(publishedLoader.includes('/governance/'), false);
assert.equal(articleRenderer.includes('sourceClaimCodes'), false);
for (const privateToken of [
  'claimDossier',
  'supportAssessment',
  'contrarySourceCodes',
  'reviewerId',
  'accepted_risk'
]) {
  assert.equal(
    articleRenderer.includes(privateToken),
    false,
    `Public Renderer exposes governance token: ${privateToken}`
  );
}
for (const moduleSource of [
  publishedLoader,
  articleRenderer,
  articleBlocks
]) {
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
      `Knowledge projection gained forbidden dependency: ${forbiddenDependency}`
    );
  }
}

assert.equal(
  packageJson.scripts['check:pja-w2c'],
  'npm run check:pja-w2b && node scripts/check-pja-w2c-claim-source-review-governance.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w2c-claim-source-review-governance.mjs'
  )
);
assert(
  packageJson.scripts.precheck.indexOf(
    'check-pja-w2c-claim-source-review-governance'
  ) >
  packageJson.scripts.precheck.indexOf(
    'check-pja-w2b-structured-article-schema'
  )
);

console.log('✓ PJA-W2C Claim, Source and Editorial Review Governance passed.');
console.log('  Claim, Source and Review remain separate strict governance objects; Article JSON remains the only production body authority.');
console.log('  Source support, contrary evidence, version binding, human-only approval and blocking Finding rules pass valid and invalid fixtures.');
console.log('  KN-PREFACE-001 remains fixture-only with no production Article, English Article, Asset registration, shell or publication.');
console.log('  PJA-W1, PJA-W2A and PJA-W2B run before this validator and their frozen boundaries remain intact.');
