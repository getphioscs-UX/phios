import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const paths = {
  schema: 'content/professional/canonical-asset-runtime/schemas/canonical-asset-v1.schema.json',
  contract: 'content/professional/canonical-asset-runtime/contracts/canonical-asset-contract-v1.json',
  registry: 'content/professional/canonical-asset-runtime/registries/canonical-asset-type-registry-v1.json',
  valid: 'content/professional/canonical-asset-runtime/fixtures/canonical-asset.valid.json',
  invalid: 'content/professional/canonical-asset-runtime/fixtures/canonical-asset.invalid.json',
  boundary: 'content/professional/canonical-asset-runtime/audits/car-authority-boundary-v1.json',
  reconciliation: 'content/professional/canonical-asset-runtime/audits/car-existing-article-runtime-reconciliation-v1.json',
  freeze: 'content/professional/canonical-asset-runtime/freeze/car-w1-freeze-v1.json'
};

const [schema, contract, registry, validFixture, invalidFixture, boundary, reconciliation, freeze] = await Promise.all(
  Object.values(paths).map(readJson)
);

const expectedTypes = [
  'ARTICLE', 'FIGURE', 'DIAGRAM', 'ILLUSTRATION_PROMPT', 'ICON_PROMPT',
  'HERO_IMAGE_PROMPT', 'VIDEO_SCRIPT', 'SHORT_VIDEO_SCRIPT', 'AUDIO_SCRIPT',
  'PODCAST_SCRIPT', 'SLIDES', 'ACADEMY_LESSON', 'QUIZ', 'WEBSITE_MODULE',
  'SOCIAL_POST', 'THUMBNAIL_PROMPT', 'SEO_METADATA', 'SEARCH_SNIPPET'
];

assert.equal(contract.work, 'CAR-W1');
assert.equal(contract.status, 'frozen');
assert.equal(contract.productionStatus, 'validation_only');
assert.deepEqual(contract.requiredProperties, schema.required);
assert.equal(contract.runtimeInvariants.mayCreateCanonicalMeaning, false);
assert.equal(contract.runtimeInvariants.mayRewriteKnowledgeNode, false);
assert.equal(contract.runtimeInvariants.mayTreatAssetAsKnowledgeAuthority, false);
assert.equal(contract.runtimeInvariants.articleMustUseExistingPJA, true);
assert.equal(contract.runtimeInvariants.providerRoutingMayBeRebuilt, false);
assert.equal(contract.runtimeInvariants.providerMayCreatePublishedContent, false);
assert.equal(contract.lifecycleSeparation.reviewIsApproval, false);
assert.equal(contract.lifecycleSeparation.approvalIsPublication, false);

const registryTypes = registry.assetTypes.map(record => record.assetType);
assert.deepEqual(registryTypes, expectedTypes);
assert.equal(new Set(registryTypes).size, expectedTypes.length);
assert.deepEqual(schema.properties.assetType.enum, expectedTypes);
const article = registry.assetTypes.find(record => record.assetType === 'ARTICLE');
assert.equal(article.authorityMode, 'reference_only');
assert.equal(article.productionAuthority, 'PJA');
assert.equal(article.publicationAuthority, 'PJA');
assert.ok(registry.assetTypes.filter(record => record.assetType !== 'ARTICLE').every(record => record.authorityMode === 'car_native'));
assert.equal(registry.invariants.assetIsCanonicalMeaning, false);
assert.equal(registry.invariants.assetIsKnowledgeNode, false);
assert.equal(registry.invariants.assetIsPublishedFragment, false);
assert.equal(registry.invariants.articleRuntimeRebuilt, false);
assert.equal(registry.invariants.articleAuthorityTransferred, false);
assert.equal(registry.invariants.providerRoutingRebuilt, false);
assert.equal(registry.invariants.assetRegistryIsKnowledgeAuthority, false);

const isSemver = value => /^[0-9]+\.[0-9]+\.[0-9]+$/.test(value);
const isDigest = value => /^[a-f0-9]{64}$/.test(value);
const isAssetCode = value => /^ASSET-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value);
const isNodeCode = value => /^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value);
const isMeaningCode = value => /^CM-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value);
const isLocale = value => /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2}|-[0-9]{3})?$/.test(value);
const validateAsset = asset => {
  const keys = Object.keys(asset).sort();
  assert.deepEqual(keys, [...schema.required].sort());
  assert.equal(isAssetCode(asset.assetCode), true);
  assert.equal(isSemver(asset.assetVersion), true);
  assert.equal(expectedTypes.includes(asset.assetType), true);
  assert.equal(isNodeCode(asset.nodeCode), true);
  assert.ok(asset.meaningReferences.length > 0 && asset.meaningReferences.every(isMeaningCode));
  assert.ok(asset.knowledgeReferences.length > 0 && asset.knowledgeReferences.every(isNodeCode));
  assert.ok(asset.sourceFragmentDigests.length > 0 && asset.sourceFragmentDigests.every(isDigest));
  assert.equal(isLocale(asset.locale), true);
  assert.ok(asset.audience.length > 0);
  assert.ok(asset.purpose.length > 0);
  assert.ok(['none','local_projection','provider_candidate'].includes(asset.providerLineage.mode));
  assert.ok(schema.properties.reviewState.enum.includes(asset.reviewState));
  assert.ok(schema.properties.approvalState.enum.includes(asset.approvalState));
  assert.ok(schema.properties.publicationState.enum.includes(asset.publicationState));
  assert.equal(Number.isNaN(Date.parse(asset.createdAt)), false);
  assert.equal(Number.isNaN(Date.parse(asset.updatedAt)), false);
};
validateAsset(validFixture);
assert.equal(validFixture.knowledgeReferences.includes(validFixture.nodeCode), true, 'nodeCode must appear in knowledgeReferences');
assert.throws(() => validateAsset(invalidFixture));
assert.equal(invalidFixture.knowledgeReferences.includes(invalidFixture.nodeCode), false);


assert.equal(boundary.invariants.pjaRebuilt, false);
assert.equal(boundary.invariants.publishedArticleRuntimeRebuilt, false);
assert.equal(boundary.invariants.providerRoutingRebuilt, false);
assert.equal(boundary.invariants.assetRegistryIsKnowledgeAuthority, false);
assert.equal(reconciliation.futureIntegration.authorityMode, 'reference_only');
assert.equal(reconciliation.futureIntegration.publicationAuthority, 'PJA');

assert.equal(freeze.status, 'frozen');
assert.equal(freeze.baselineCommit, '6d9b932a7d4b02057c89658b763ab56061bd0179');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after freeze`);
assert.equal(freeze.invariants.assetNotCanonicalMeaning, true);
assert.equal(freeze.invariants.assetNotKnowledgeNode, true);
assert.equal(freeze.invariants.assetNotPublishedFragment, true);
assert.equal(freeze.invariants.articleAuthorityRemainsPJA, true);
assert.equal(freeze.invariants.providerRoutingUnchanged, true);
assert.equal(freeze.invariants.knowledgeAuthorityUnchanged, true);

console.log('✓ CAR-W1 Canonical Asset Contract passed.');
console.log(`✓ ${expectedTypes.length} controlled Asset Types are registered.`);
console.log('✓ Asset remains distinct from Canonical Meaning, Knowledge Node and Published Fragment.');
console.log('✓ ARTICLE remains reference_only and PJA retains production and publication authority.');
