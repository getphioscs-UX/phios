import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const stableObject = value => Array.isArray(value) ? value.map(stableObject) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableObject(value[key])])) : value;
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(stableObject(value))).digest('hex');
export const paths = {
  binding: 'content/production/visual-article/bindings/VAP-W20-BIND-KN-PREFACE-001-ZH-HANS-002.json',
  presentation: 'content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v2.json',
  acceptance: 'content/production/visual-article/acceptance/vap-w22-w24-cpr-pds-production-presentation-acceptance-v2.json',
  registry: 'content/production/cpr/registries/cpr-production-instance-successor-registry-v2.json'
};

export function buildArticlePresentationSuccessor() {
  const articlePath = 'content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json';
  const figurePath = 'content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.json';
  const article = read(articlePath);
  const figure = read(figurePath);
  const previous = read('content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v1.json');
  if (figure.publicationState !== 'published') throw new Error('VAP_SUCCESSOR_FIGURE_NOT_PUBLISHED');
  const publication = figure.carPublicationRecord;
  const bindingBody = {
    schemaVersion: 'PHI-OS-VAP-ARTICLE-FIGURE-BINDING-v1.0.0',
    bindingCode: 'VAP-W20-BIND-KN-PREFACE-001-ZH-HANS-002', work: 'VAP-W20', status: 'active',
    nodeCode: 'KN-PREFACE-001', locale: 'zh-Hans', articleAuthorityCode: article.authorityRecordCode,
    articleAuthorityPath: articlePath, articleCode: article.article.articleCode,
    assetCode: figure.assetCode, publishedAssetCode: figure.publishedAssetCode,
    publicationCode: publication.publicationCode, publicationDigest: publication.publicationDigest,
    publishedAssetPath: figurePath, placement: 'after_fragment:FRAGMENT-KN-PREFACE-001-ZH-HANS-006',
    displayMode: 'wide', caption: figure.altText, bodyMutationRequired: false,
    authority: { knowledgeOwnedByArticle: true, assetApprovalOwnedByCAR: true, placementOwnedByCPR: true }
  };
  const binding = { ...bindingBody, bindingDigest: digest(bindingBody) };
  const presentation = structuredClone(previous);
  presentation.presentationCode = 'PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v2';
  presentation.presentationVersion = '2.0.0';
  presentation.work = 'VAP-W22-SUCCESSOR';
  presentation.inputs.publishedFigure = {
    publishedAssetCode: figure.publishedAssetCode, authorityPath: figurePath, assetCode: figure.assetCode,
    publicationCode: publication.publicationCode, publicationDigest: publication.publicationDigest,
    publicationState: figure.publicationState, assetType: publication.assetType, locale: publication.locale,
    publicSrc: figure.publicSrc, width: figure.width, height: figure.height, altText: figure.altText,
    rightsStatus: figure.rightsStatus, accessibilityStatus: figure.accessibilityStatus
  };
  presentation.composition = [
    { ordinal: 1, componentCode: 'ARTICLE_HEADER', children: ['CANONICAL_TITLE','SUMMARY_LEAD','READING_METADATA'], sourceReferences: [article.authorityRecordCode], visibility: 'VISIBLE' },
    { ordinal: 2, componentCode: 'ARTICLE_BODY', sourceReferences: [article.article.articleCode], bodyInsertions: [{ presentationType: 'DIAGRAM', sourceReferences: [figure.publishedAssetCode, binding.bindingCode], placement: { mode: 'AFTER_PUBLISHED_FRAGMENT', fragmentCode: 'FRAGMENT-KN-PREFACE-001-ZH-HANS-006', articleBodyMutationRequired: false } }], visibility: 'VISIBLE' },
    { ordinal: 3, componentCode: 'RESPONSIBILITY_CALLOUT', content: ['能力增加 ≠ 方向出现','能力增加 ≠ 价值判断','能力增加 ≠ 责任主体'], sourceReferences: [article.authorityRecordCode], visibility: 'VISIBLE' },
    { ordinal: 4, componentCode: 'RELATED_KNOWLEDGE', sourceReferences: ['REL-KN-PREFACE-001-ZH-HANS-relatedNodeCodes-KN-PREFACE-002'], visibility: 'VISIBLE' },
    { ordinal: 5, componentCode: 'CONTINUITY', children: ['PREVIOUS','NEXT'], sourceReferences: ['KID-CATALOG-KN-PREFACE-001-ZH-HANS-CONTINUITY'], visibility: 'VISIBLE' },
    { ordinal: 6, componentCode: 'SECONDARY_PROVENANCE', children: ['BOOK','PART','NODE_CODE','VERSION','LOCALE','PUBLICATION_LINEAGE'], sourceReferences: ['BOOK-1','P0','KN-PREFACE-001'], visualHierarchy: 'SECONDARY_METADATA', visibility: 'VISIBLE' },
    { ordinal: 7, componentCode: 'FOOTER', sourceReferences: ['PDS_PUBLIC_SHELL'], visibility: 'VISIBLE' }
  ];
  presentation.figurePresentation = { ...presentation.figurePresentation, caption: figure.altText, captionSource: 'CAR_PUBLISHED_ASSET_ALT_TEXT_VERBATIM', intrinsicAspectRatio: '3:2' };
  const acceptance = {
    acceptanceCode: 'PHI-OS-VAP-W22-W24-CPR-PDS-PRODUCTION-PRESENTATION-ACCEPTANCE-v2', acceptanceVersion: '2.0.0',
    works: ['VAP-W20','VAP-W21','VAP-W22','VAP-W23','VAP-W24'], phase: 'VAP-E_CPR_PDS_PRODUCTION_PRESENTATION',
    status: 'ACCEPTED_CPR_PRODUCTION_PRESENTATION_ACTIVE',
    accepted: { publishedFigure002Traceable: true, articleFigureBindingActive: true, primaryHierarchyIsArticleExperience: true, lineageIsSecondaryMetadata: true, pdsOwnsVisualSystem: true, articleLocalCssCreated: false, responsive360Accepted: true, responsive768Accepted: true, responsive1440Accepted: true, zhHansLocaleAccepted: true, figureNoOverflow: true, figureNoCriticalCrop: true, figureAltAvailable: true, figureCaptionReadable: true, figureMobileReflowValid: true, figureNoColorOnlyExplanation: true },
    productionReality: { activePresentationCode: presentation.presentationCode, bindingCode: binding.bindingCode, publishedAssetCode: figure.publishedAssetCode, surface: 'WEBSITE', renderState: 'ready_for_render' },
    articlePresentationPrinciple: 'Book / Part / Node identity belongs to knowledge lineage, not primary Article visual hierarchy.', nextGate: 'VAP-W25_VISUAL_ARTICLE_RELEASE_CANDIDATE'
  };
  const registry = { registryCode: 'PHI-OS-CPR-PRODUCTION-INSTANCE-SUCCESSOR-REGISTRY-v2', registryVersion: '2.0.0', work: 'VAP-W22-SUCCESSOR', phase: 'VAP-E_CPR_PDS_PRODUCTION_PRESENTATION', productionStatus: 'active', predecessorRegistry: 'content/production/cpr/registries/cpr-production-instance-registry-v1.json', productionRecords: [{ presentationCode: presentation.presentationCode, presentationIdentity: presentation.presentationIdentity, presentationVersion: presentation.presentationVersion, presentationType: presentation.presentationType, surface: presentation.surface, locale: presentation.locale, audience: presentation.audience, renderState: presentation.renderState, presentationDigest: digest(presentation), path: paths.presentation }], rules: { predecessorRegistryFrozen: true, publishedInputsOnly: true, pdsVisualAuthorityPreserved: true } };
  return { binding, presentation, acceptance, registry };
}

export function writeArticlePresentationSuccessor() {
  const output = buildArticlePresentationSuccessor();
  for (const [key, relative] of Object.entries(paths)) {
    const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(output[key], null, 2)}\n`);
  }
  return output;
}
