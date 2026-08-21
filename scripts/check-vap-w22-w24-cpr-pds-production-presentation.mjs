import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  projectCprProductionArticle,
  stableProductionPresentationDigest,
  validateCprProductionInstance
} from './lib/canonical-presentation-runtime/production-presentation-v1.mjs';

const root = process.cwd();
const read = rel => fs.readFile(path.join(root, rel), 'utf8');
const readJson = async rel => JSON.parse(await read(rel));
const exists = async rel => fs.access(path.join(root, rel)).then(() => true, () => false);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

const selectedWork = process.argv[2];
if (selectedWork) assert(['VAP-W22', 'VAP-W23', 'VAP-W24'].includes(selectedWork));

const paths = {
  contract22: 'content/production/visual-article/contracts/vap-w22-cpr-production-activation-v1.json',
  contract23: 'content/production/visual-article/contracts/vap-w23-canonical-article-presentation-v1.json',
  contract24: 'content/production/visual-article/contracts/vap-w24-responsive-article-figure-acceptance-v1.json',
  instanceSchema: 'content/production/visual-article/schemas/vap-w22-cpr-production-instance-v1.schema.json',
  instance: 'content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v1.json',
  registry: 'content/production/cpr/registries/cpr-production-instance-registry-v1.json',
  template: 'content/production/cpr/templates/article-page-v1.json',
  activation: 'content/production/visual-article/activation/vap-w22-cpr-production-activation-v1.json',
  acceptance: 'content/production/visual-article/acceptance/vap-w22-w24-cpr-pds-production-presentation-acceptance-v1.json',
  canonicalRegistry: 'content/professional/canonical-presentation-runtime/registries/canonical-presentation-registry-v1.json',
  canonicalComposition: 'content/professional/canonical-presentation-runtime/contracts/cpr-canonical-composition-runtime-v1.json',
  canonicalResponsive: 'content/professional/canonical-presentation-runtime/contracts/cpr-responsive-presentation-runtime-v1.json',
  canonicalLocale: 'content/professional/canonical-presentation-runtime/contracts/cpr-locale-presentation-runtime-v1.json',
  canonicalAccessibility: 'content/professional/canonical-presentation-runtime/contracts/cpr-accessibility-presentation-runtime-v1.json',
  articleZh: 'content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json',
  articleEn: 'content/knowledge/public/authority/articles/en/KN-PREFACE-001.json',
  figure: 'content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-001.json',
  carRegistry: 'content/production/car/registries/published-asset-production-registry-v1.json',
  relationships: 'content/knowledge/public/retrieval/relationships.json',
  reading: 'content/knowledge/intelligence/reading/dynamic-reading-paths.json',
  compression: 'content/knowledge/intelligence/compression/knowledge-compression.json',
  publicNodes: 'content/knowledge/public/retrieval/nodes.json',
  publicBookMetadata: 'content/knowledge/public/public-book-metadata.json',
  parts: 'content/registry/parts.json',
  pds: 'content/registry/pds-w2-design-token-contract.json',
  tokenRegistry: 'content/professional/canonical-presentation-runtime/registries/pds-token-reference-registry-v1.json',
  tokensCss: 'assets/css/tokens.css',
  articlePdsCss: 'assets/css/design/article-presentation.css',
  pkg: 'package.json',
  retrievalProjectionSuccessor: 'content/production/visual-article/reconciliation/vap-w22-w24-retrieval-projection-successor-v1.json'
};

const [
  contract22, contract23, contract24, instanceSchema, instance, productionRegistry, template,
  activation, acceptance, canonicalRegistry, canonicalComposition,
  canonicalResponsive, canonicalLocale, canonicalAccessibility, articleZh,
  articleEn, figure, carRegistry, relationships, reading, compression,
  publicNodes, publicBookMetadata, parts, pds, tokenRegistry, tokensCss,
  articlePdsCss, pkg, canonicalRegistrySource, retrievalProjectionSuccessor
] = await Promise.all([
  readJson(paths.contract22),
  readJson(paths.contract23),
  readJson(paths.contract24),
  readJson(paths.instanceSchema),
  readJson(paths.instance),
  readJson(paths.registry),
  readJson(paths.template),
  readJson(paths.activation),
  readJson(paths.acceptance),
  readJson(paths.canonicalRegistry),
  readJson(paths.canonicalComposition),
  readJson(paths.canonicalResponsive),
  readJson(paths.canonicalLocale),
  readJson(paths.canonicalAccessibility),
  readJson(paths.articleZh),
  readJson(paths.articleEn),
  readJson(paths.figure),
  readJson(paths.carRegistry),
  readJson(paths.relationships),
  readJson(paths.reading),
  readJson(paths.compression),
  readJson(paths.publicNodes),
  readJson(paths.publicBookMetadata),
  readJson(paths.parts),
  readJson(paths.pds),
  readJson(paths.tokenRegistry),
  read(paths.tokensCss),
  read(paths.articlePdsCss),
  readJson(paths.pkg),
  read(paths.canonicalRegistry),
  readJson(paths.retrievalProjectionSuccessor)
]);

// VAP-W22: active production registry is separate from the frozen CPR registry.
assert.equal(contract22.work, 'VAP-W22');
assert.equal(contract22.baselineCommit, '807efc359a0d1477bc697044f55970fc5e6e8500');
assert.equal(contract22.firstProductionInstance, 'PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v1');
assert.deepEqual(contract22.requiredInputs, [
  'PUBLISHED_ARTICLE',
  'PUBLISHED_FIGURE',
  'KNOWLEDGE_RELATIONSHIPS',
  'READING_CONTINUITY',
  'LOCALE',
  'AUDIENCE'
]);
assert.equal(contract22.canonicalRegistryBoundary.frozenRegistryMutationAllowed, false);
assert.equal(sha256(canonicalRegistrySource), contract22.canonicalRegistryBoundary.baselineDigest);
assert.equal(canonicalRegistry.productionRecordsMustRemainEmptyAtFreeze, true);
assert.deepEqual(canonicalRegistry.productionRecords, []);
assert.equal(productionRegistry.productionStatus, 'active');
assert.equal(productionRegistry.canonicalRegistryMutationRequired, false);
assert.equal(productionRegistry.productionRecords.length, 1);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateInstanceSchema = ajv.compile(instanceSchema);
assert.equal(validateInstanceSchema(instance), true, JSON.stringify(validateInstanceSchema.errors));
validateCprProductionInstance(instance);
assert.equal(instance.presentationCode, contract22.firstProductionInstance);
assert.equal(instance.presentationIdentity, 'PRESENTATION-ARTICLE-KN-PREFACE-001');
assert.equal(instance.presentationType, 'ARTICLE_PAGE');
assert.equal(instance.surface, 'WEBSITE');
assert.equal(instance.locale, 'zh-Hans');
assert.equal(instance.audience, 'CUSTOMER');
assert.equal(instance.renderState, 'ready_for_render');
assert.deepEqual(instance.authorityBoundaries.decides, contract22.decisionBoundary.cprDecides);
assert.deepEqual(instance.authorityBoundaries.doesNotDecide, contract22.decisionBoundary.cprDoesNotDecide);
assert.equal(canonicalComposition.rules.mayCreateKnowledge, false);
assert.equal(canonicalComposition.rules.maySelectMeaning, false);
assert.equal(canonicalComposition.rules.maySelectRelatedNodes, false);
assert.equal(canonicalComposition.rules.maySelectReadingPath, false);
assert.equal(canonicalComposition.rules.mayPromotePublication, false);
assert.equal(productionRegistry.productionRecords[0].presentationDigest, stableProductionPresentationDigest(instance));
assert.equal(productionRegistry.productionRecords[0].path, paths.instance);
const unpublishedArticleInstance = structuredClone(instance);
unpublishedArticleInstance.inputs.publishedArticle.publicationState = 'draft';
assert.throws(
  () => validateCprProductionInstance(unpublishedArticleInstance),
  error => error.code === 'CPR_PRODUCTION_PUBLISHED_ARTICLE_REQUIRED'
);
const unpublishedFigureInstance = structuredClone(instance);
unpublishedFigureInstance.inputs.publishedFigure.publicationState = 'approved';
assert.throws(
  () => validateCprProductionInstance(unpublishedFigureInstance),
  error => error.code === 'CPR_PRODUCTION_PUBLISHED_FIGURE_REQUIRED'
);
const noAltInstance = structuredClone(instance);
noAltInstance.inputs.publishedFigure.altText = '';
assert.throws(
  () => validateCprProductionInstance(noAltInstance),
  error => error.code === 'CPR_PRODUCTION_FIGURE_ALT_REQUIRED'
);
const localCssInstance = structuredClone(instance);
localCssInstance.pdsReferences.articleLocalCss = true;
assert.throws(
  () => validateCprProductionInstance(localCssInstance),
  error => error.code === 'CPR_PRODUCTION_ARTICLE_LOCAL_CSS_FORBIDDEN'
);

// Published Article is consumed by immutable authority reference.
assert.equal(articleZh.nodeCode, instance.inputs.publishedArticle.nodeCode);
assert.equal(articleZh.locale, instance.locale);
assert.equal(articleZh.authorityRecordCode, instance.inputs.publishedArticle.authorityRecordCode);
assert.equal(articleZh.authorityDigest, instance.inputs.publishedArticle.authorityDigest);
assert.equal(articleZh.article.articleCode, instance.inputs.publishedArticle.articleCode);
assert.equal(articleZh.article.href, instance.inputs.publishedArticle.href);
assert.equal(instance.inputs.publishedArticle.publishedAt, '2026-08-06T10:00:00.000Z');
assert.equal(instance.inputs.publishedArticle.version, articleZh.article.version);
assert.equal(articleZh.lineage.publicationCode, instance.inputs.publishedArticle.publicationCode);
assert.equal(articleZh.lineage.publicationDigest, instance.inputs.publishedArticle.publicationDigest);
assert.equal(articleZh.eligibility.published, true);
assert.equal(articleZh.eligibility.approved, true);
assert.equal(articleZh.eligibility.contentReviewed, true);
assert.equal(articleZh.publicStatus, 'eligible_for_public_projection');
const publicNode = publicNodes.records.find(record => (
  record.nodeCode === instance.inputs.publishedArticle.nodeCode && record.locale === instance.locale
));
assert(publicNode);
// The presentation pins the published-node projection that existed at VAP-W22.
// Later governed publication may expand the current retrieval projection without rewriting
// that historical presentation context. The successor record must therefore prove both
// the immutable predecessor digest and the unchanged node authority consumed by CPR.
const stableJson = value => JSON.stringify(value, (key, item) => (
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
    : item
), 2) + '\n';
assert.equal(publicNodes.recordCount, publicNodes.records.length);
assert.equal(publicNodes.digest, sha256(stableJson(publicNodes.records)));
assert.equal(retrievalProjectionSuccessor.historicalBaselineCommit, contract22.baselineCommit);
assert.equal(retrievalProjectionSuccessor.nodeProjection.path, paths.publicNodes);
assert.equal(retrievalProjectionSuccessor.nodeProjection.historical.digest, instance.inputs.readingContext.nodeProjectionDigest);
assert.equal(retrievalProjectionSuccessor.nodeProjection.current.digest, publicNodes.digest);
assert.equal(retrievalProjectionSuccessor.nodeProjection.current.recordCount, publicNodes.recordCount);
assert(retrievalProjectionSuccessor.nodeProjection.current.recordCount >= retrievalProjectionSuccessor.nodeProjection.historical.recordCount);
assert.equal(retrievalProjectionSuccessor.rules.historicalPresentationDigestMayBeRewritten, false);
assert.equal(retrievalProjectionSuccessor.rules.historicalProjectionSnapshotMayBeRewritten, false);
assert.equal(retrievalProjectionSuccessor.rules.presentationNodeIdentityMustRemainResolvable, true);
assert.equal(retrievalProjectionSuccessor.rules.presentationNodeAuthorityMustRemainIdentical, true);
assert.equal(retrievalProjectionSuccessor.rules.unknownOrUnreconciledNodeMutationFailsClosed, true);
const preservedPresentationRecord = retrievalProjectionSuccessor.nodeProjection.preservedPresentationRecord;
assert.equal(preservedPresentationRecord.nodeCode, instance.inputs.publishedArticle.nodeCode);
assert.equal(preservedPresentationRecord.locale, instance.locale);
assert.equal(preservedPresentationRecord.authorityRecordCode, instance.inputs.publishedArticle.authorityRecordCode);
assert.equal(preservedPresentationRecord.authorityDigest, instance.inputs.publishedArticle.authorityDigest);
assert.equal(publicNode.authorityRecordCode, preservedPresentationRecord.authorityRecordCode);
assert.equal(publicNode.authorityDigest, preservedPresentationRecord.authorityDigest);
assert.equal(publicNode.publicationCode, preservedPresentationRecord.publicationCode);
assert.equal(publicNode.href, preservedPresentationRecord.href);
assert.equal(publicNode.bookCode, instance.inputs.readingContext.bookCode);
assert.equal(publicNode.partCode, instance.inputs.readingContext.partCode);
const publicBook = publicBookMetadata.records.find(record => record.bookCode === publicNode.bookCode);
assert.equal(publicBook.title[instance.locale], instance.inputs.readingContext.bookTitle);
assert.equal(parts.part_0.title[instance.locale], instance.inputs.readingContext.partTitle);

// Published Figure is consumed from CAR; CPR does not approve or publish it.
assert.equal(figure.publishedAssetCode, instance.inputs.publishedFigure.publishedAssetCode);
assert.equal(figure.assetCode, instance.inputs.publishedFigure.assetCode);
assert.equal(figure.carPublicationRecord.publicationCode, instance.inputs.publishedFigure.publicationCode);
assert.equal(figure.publicationDigest, instance.inputs.publishedFigure.publicationDigest);
assert.equal(figure.publicationState, 'published');
assert.equal(figure.surface, 'WEBSITE');
assert.equal(figure.carPublicationRecord.locale, instance.locale);
assert.equal(figure.carPublicationRecord.assetType, 'DIAGRAM');
assert.equal(figure.publicSrc, instance.inputs.publishedFigure.publicSrc);
assert.equal(figure.width, instance.inputs.publishedFigure.width);
assert.equal(figure.height, instance.inputs.publishedFigure.height);
assert.equal(figure.altText, instance.inputs.publishedFigure.altText);
assert.equal(figure.rightsStatus, 'cleared');
assert.equal(figure.accessibilityStatus, 'passed');
assert(carRegistry.publications.some(record => (
  record.publishedAssetCode === figure.publishedAssetCode &&
  record.publicationDigest === figure.publicationDigest &&
  record.path === paths.figure
)));
assert.equal(await exists(figure.publicSrc.replace(/^\//, '')), true);
assert.equal(instance.figurePresentation.captionSource, 'PUBLISHED_FIGURE_ALT_TEXT_VERBATIM');
assert.equal(instance.figurePresentation.caption, figure.altText);

// Knowledge relationships are also presentation-time retrieval snapshots.
// The VAP-W22 presentation records KN-PREFACE-002 as unpublished; later governed
// publication may legitimately flip the current retrieval edge to targetPublished=true
// without rewriting the historical presentation or inventing a different relationship.
assert.equal(relationships.recordCount, relationships.records.length);
assert.equal(relationships.digest, sha256(stableJson(relationships.records)));
assert.equal(retrievalProjectionSuccessor.relationshipProjection.path, paths.relationships);
assert.equal(retrievalProjectionSuccessor.relationshipProjection.historical.digest, instance.inputs.knowledgeRelationships.projectionDigest);
assert.equal(retrievalProjectionSuccessor.relationshipProjection.current.digest, relationships.digest);
assert.equal(retrievalProjectionSuccessor.relationshipProjection.current.recordCount, relationships.recordCount);
assert(retrievalProjectionSuccessor.relationshipProjection.current.recordCount >= retrievalProjectionSuccessor.relationshipProjection.historical.recordCount);
for (const relationshipCode of instance.inputs.knowledgeRelationships.relationshipCodes) {
  const historicalRelationship = retrievalProjectionSuccessor.relationshipProjection.preservedPresentationRelationships
    .find(record => record.relationshipCode === relationshipCode);
  assert(historicalRelationship);
  assert.equal(historicalRelationship.locale, instance.locale);
  assert.equal(historicalRelationship.sourceNodeCode, instance.inputs.publishedArticle.nodeCode);
  assert.equal(historicalRelationship.targetNodeCode, 'KN-PREFACE-002');
  assert.equal(historicalRelationship.targetPublished, false);
  const relationship = relationships.records.find(record => record.relationshipCode === relationshipCode);
  assert(relationship);
  assert.equal(relationship.locale, historicalRelationship.locale);
  assert.equal(relationship.sourceNodeCode, historicalRelationship.sourceNodeCode);
  assert.equal(relationship.targetNodeCode, historicalRelationship.targetNodeCode);
  assert.equal(relationship.type, historicalRelationship.type);
  const currentTarget = publicNodes.records.find(record => (
    record.nodeCode === relationship.targetNodeCode && record.locale === relationship.locale
  ));
  assert.equal(relationship.targetPublished, Boolean(currentTarget));
}
const continuityPath = reading.paths.find(record => (
  record.catalogPathCode === instance.inputs.readingContinuity.catalogPathCode
));
assert(continuityPath);
assert.equal(continuityPath.catalogPathDigest, instance.inputs.readingContinuity.catalogPathDigest);
assert.equal(continuityPath.locale, instance.locale);
assert.equal(continuityPath.nodeCode, instance.inputs.publishedArticle.nodeCode);
assert.equal(continuityPath.purpose, 'continuity');
assert.equal(continuityPath.publishedOnly, true);
const continuity = instance.composition.find(component => component.componentCode === 'CONTINUITY');
assert.equal(continuity.previous, null);
assert.equal(continuity.next.nodeCode, 'KN-PREFACE-002');
assert.equal(continuity.next.published, false);
assert.equal(continuity.next.linkProjected, false);

// Figure placement points to a published Article paragraph and governed Knowledge block without mutating either source.
const articleBodyParagraphs = articleZh.article.bodyMarkdown
  .split(/\n\n/)
  .filter(value => value && !value.startsWith('# '));
const articleBody = instance.composition.find(component => component.componentCode === 'ARTICLE_BODY');
assert.equal(articleBody.bodyInsertions.length, 1);
const insertion = articleBody.bodyInsertions[0];
assert.equal(insertion.presentationType, 'DIAGRAM');
assert.equal(insertion.placement.articleBodyMutationRequired, false);
const paragraph = articleBodyParagraphs[insertion.placement.articleParagraphOrdinal - 1];
assert.equal(sha256(paragraph), insertion.placement.fragmentDigest);
const knowledgeBlock = compression.blocks.find(record => (
  record.blockCode === insertion.placement.knowledgeBlockCode
));
assert(knowledgeBlock);
assert.equal(knowledgeBlock.blockDigest, insertion.placement.knowledgeBlockDigest);
assert(knowledgeBlock.fragmentCodes.includes(insertion.placement.fragmentCode));
assert.equal(
  knowledgeBlock.fragments.find(record => record.fragmentCode === insertion.placement.fragmentCode).digest,
  insertion.placement.fragmentDigest
);

// VAP-W23: one canonical ARTICLE_PAGE structure with PDS-owned visual behavior.
assert.equal(contract23.work, 'VAP-W23');
assert.equal(contract23.presentationType, 'ARTICLE_PAGE');
assert.equal(contract23.template, paths.template);
assert.deepEqual(contract23.canonicalOrder, template.semanticOrder);
assert.deepEqual(instance.composition.map(component => component.componentCode), template.semanticOrder);
assert.deepEqual(template.components.find(component => component.componentCode === 'ARTICLE_HEADER').children, [
  'PART_BOOK', 'CANONICAL_TITLE', 'SUMMARY_LEAD', 'READING_METADATA'
]);
const articleHeader = instance.composition.find(component => component.componentCode === 'ARTICLE_HEADER');
assert.equal(articleHeader.partBook.bookCode, instance.inputs.readingContext.bookCode);
assert.equal(articleHeader.partBook.bookTitle, instance.inputs.readingContext.bookTitle);
assert.equal(articleHeader.partBook.partCode, instance.inputs.readingContext.partCode);
assert.equal(articleHeader.partBook.partTitle, instance.inputs.readingContext.partTitle);
assert.equal(articleHeader.readingMetadata.publishedAt, instance.inputs.publishedArticle.publishedAt);
assert.equal(articleHeader.readingMetadata.version, instance.inputs.publishedArticle.version);
assert.equal(articleHeader.readingMetadata.locale, instance.locale);
assert.deepEqual(template.components.find(component => component.componentCode === 'ARTICLE_BODY').allowedChildren, [
  'SECTION', 'FIGURE', 'CALLOUT', 'DIAGRAM'
]);
assert.deepEqual(template.components.find(component => component.componentCode === 'KNOWLEDGE_CONTEXT').children, [
  'CANONICAL_NODE', 'RELATED_NODES', 'SOURCES_WHERE_PUBLIC'
]);
assert.deepEqual(template.components.find(component => component.componentCode === 'CONTINUITY').children, [
  'PREVIOUS', 'NEXT'
]);
assert.equal(template.pds.articleLocalCss, false);
assert.equal(contract23.rules.articleLocalCssForbidden, true);
assert.deepEqual(template.pds.owns, contract23.pdsOwnership);
assert.equal(instance.pdsReferences.articleLocalCss, false);
assert.equal(instance.pdsReferences.rawVisualLiterals, false);
for (const reference of [...instance.pdsReferences.contracts, ...instance.pdsReferences.styleReferences]) {
  assert.equal(await exists(reference), true, `missing PDS reference: ${reference}`);
}
const allowedTokens = new Set(tokenRegistry.categories.flatMap(category => category.tokens));
for (const token of instance.pdsReferences.tokenReferences) {
  assert(allowedTokens.has(token), `uncontrolled CPR token reference: ${token}`);
  assert(tokensCss.includes(`${token}:`), `missing PDS token: ${token}`);
}
const pdsDeclarations = articlePdsCss.replace(/@media\s*\([^)]*\)/g, '@media');
assert.equal(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b[0-9.]+(?:px|rem|em)\b/i.test(pdsDeclarations), false);
assert(articlePdsCss.includes('object-fit: contain'));
assert(articlePdsCss.includes('max-width: 100%'));
assert(articlePdsCss.includes('height: auto'));
assert(articlePdsCss.includes('overflow: clip'));
assert(articlePdsCss.includes(':focus-visible'));
assert(articlePdsCss.includes('@media (prefers-reduced-motion: reduce)'));
assert(articlePdsCss.includes('@media (min-width: 90rem)'));
assert(articlePdsCss.includes('grid-template-columns:'));

// VAP-W24: PDS viewport authority, locale truthfulness and Figure acceptance.
assert.equal(contract24.work, 'VAP-W24');
assert.deepEqual(contract24.acceptanceViewportsPx, [360, 768, 1440]);
assert.deepEqual(contract24.acceptanceViewportsPx, pds.responsiveContract.acceptanceViewportsPx);
assert.deepEqual(contract24.locales, ['en', 'zh-Hans']);
assert.deepEqual(canonicalLocale.supportedLocales, contract24.locales);
assert.equal(canonicalLocale.fallbackPolicy, 'explicit_only');
assert.equal(canonicalLocale.mixedLocaleDefault, 'forbidden');
assert.equal(canonicalResponsive.breakpointAuthority, 'PDS');
assert.equal(canonicalResponsive.rules.semanticOrderImmutable, true);
assert.equal(canonicalResponsive.rules.rawBreakpointValueForbidden, true);
assert.deepEqual(instance.responsiveProjection.map(record => record.viewportPx), [360, 768, 1440]);
assert.deepEqual(instance.responsiveProjection.map(record => record.mode), ['COMPACT', 'STANDARD', 'EXPANDED']);
assert.equal(instance.responsiveProjection[0].articleColumns, 1);
assert.equal(instance.responsiveProjection[1].articleColumns, 1);
assert.equal(instance.responsiveProjection[2].articleColumns, 2);

const projections = contract24.locales.flatMap(locale => (
  contract24.acceptanceViewportsPx.map(viewportPx => projectCprProductionArticle(instance, { locale, viewportPx }))
));
for (const projection of projections) {
  assert.equal(projection.responsiveTemplateAccepted, true);
  assert.equal(projection.semanticOrderImmutable, true);
  assert.equal(projection.horizontalOverflowAllowed, false);
  assert.equal(projection.articleLocalCss, false);
  assert.deepEqual(projection.componentOrder, projections[0].componentOrder);
  if (projection.viewportPx === 360) assert.equal(projection.articleColumns, 1);
}
const zhProjections = projections.filter(record => record.locale === 'zh-Hans');
assert(zhProjections.every(record => record.readyForRender && record.figureProjected));
assert(zhProjections.every(record => record.figureBehavior.startsWith('CONTAIN_')));
const enProjections = projections.filter(record => record.locale === 'en');
assert(enProjections.every(record => !record.readyForRender && !record.figureProjected));
assert(enProjections.every(record => record.productionProjection === 'BLOCKED_UPSTREAM_LOCALE_CONTENT_AND_FIGURE'));
assert(enProjections.every(record => record.figureBehavior === 'OMITTED_MISSING_LOCALE_AUTHORITY'));

const enLocaleAcceptance = instance.localeAcceptance.find(record => record.locale === 'en');
const zhLocaleAcceptance = instance.localeAcceptance.find(record => record.locale === 'zh-Hans');
assert.equal(enLocaleAcceptance.mixedLocaleInputDetected, true);
assert.equal(enLocaleAcceptance.publishedFigureAvailable, false);
assert.equal(zhLocaleAcceptance.mixedLocaleInputDetected, false);
assert.equal(zhLocaleAcceptance.publishedFigureAvailable, true);
assert(/[\u3400-\u9fff]/u.test(articleEn.article.bodyMarkdown));
assert.equal(articleEn.eligibility.published, true);
assert.equal(figure.carPublicationRecord.locale, 'zh-Hans');

assert.equal(instance.figurePresentation.overflowAllowed, false);
assert.equal(instance.figurePresentation.criticalInformationCropAllowed, false);
assert.equal(instance.figurePresentation.altAvailable, true);
assert(instance.figurePresentation.caption.trim().length > 0);
assert.equal(instance.figurePresentation.mobileReflow, 'BLOCK_FLOW_FULL_AVAILABLE_WIDTH');
assert.equal(instance.figurePresentation.colorOnlyExplanationAllowed, false);
assert(canonicalAccessibility.requirements.includes('ALT_TEXT'));
assert(canonicalAccessibility.requirements.includes('CAPTION'));
assert(canonicalAccessibility.requirements.includes('FOCUS_VISIBILITY'));
assert.equal(pds.accessibilityContract.reducedMotionRequired, true);
assert.equal(pds.accessibilityContract.colorAloneMayExpressState, false);

assert.equal(activation.status, 'CPR_PRODUCTION_INSTANCE_ACTIVE');
assert.equal(activation.productionInstanceCreated, true);
assert.equal(activation.canonicalFrozenRegistryMutated, false);
assert.equal(activation.knowledgeMutated, false);
assert.equal(activation.meaningSelectedOrMutated, false);
assert.equal(activation.assetApprovalMutated, false);
assert.equal(acceptance.status, 'ACCEPTED_CPR_PRODUCTION_PRESENTATION_ACTIVE');
assert.equal(acceptance.productionReality.productionInstanceCount, 1);
assert.equal(acceptance.accepted.enProductionProjectionBlockedUpstream, true);
assert.equal(acceptance.accepted.zhHansLocaleAccepted, true);

assert.equal(pkg.scripts['check:vap-w22'], 'node scripts/check-vap-w22-w24-cpr-pds-production-presentation.mjs VAP-W22');
assert.equal(pkg.scripts['check:vap-w23'], 'node scripts/check-vap-w22-w24-cpr-pds-production-presentation.mjs VAP-W23');
assert.equal(pkg.scripts['check:vap-w24'], 'node scripts/check-vap-w22-w24-cpr-pds-production-presentation.mjs VAP-W24');
assert.equal(pkg.scripts['check:vap-w22-w24'], 'node scripts/check-vap-w22-w24-cpr-pds-production-presentation.mjs');
assert.equal(pkg.scripts['check:vap-e'], 'npm run check:vap-w22-w24');
const postcheckTokens = pkg.scripts.postcheck.split('&&').map(value => value.trim()).filter(Boolean);
assert.equal(postcheckTokens.filter(value => value === 'npm run check:vap-e').length, 1);

console.log('✓ VAP-W22 CPR Production Instance activated in a separate production registry; the frozen canonical registry remains unchanged and empty.');
console.log('✓ VAP-W23 ARTICLE_PAGE composition is canonical and all visual-system ownership remains with PDS; no Article-local CSS exists.');
console.log('✓ VAP-W24 360/768/1440 responsive acceptance passed for en and zh-Hans template projections with immutable semantic order and no horizontal overflow.');
console.log('✓ zh-Hans Published Figure is source-traceable, contained, uncropped, captioned, alt-backed, mobile-reflowable and not color-only.');
console.log('✓ en production remains truthfully fail-closed because upstream Article content is mixed-locale and no en Published Figure authority exists.');
