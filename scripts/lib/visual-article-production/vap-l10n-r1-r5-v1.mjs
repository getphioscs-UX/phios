import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const NODE_CODE = 'KN-PREFACE-001';
export const LOCALE = 'en';
export const SLUG = 'ai-formation-from-civilizational-capability';
export const HREF = `/articles/${SLUG}`;

export const PATHS = Object.freeze({
  repair: 'content/knowledge/production/repairs/en/KN-PREFACE-001/repair-candidate.v1.json',
  reviewTemplate: 'content/knowledge/production/repairs/en/KN-PREFACE-001/review-resolution.template.json',
  review: 'content/knowledge/production/repairs/en/KN-PREFACE-001/review-resolution.json',
  approvalTemplate: 'content/knowledge/production/repairs/en/KN-PREFACE-001/approval-resolution.template.json',
  approval: 'content/knowledge/production/repairs/en/KN-PREFACE-001/approval-resolution.json',
  publicationTemplate: 'content/knowledge/production/repairs/en/KN-PREFACE-001/publication-resolution.template.json',
  publication: 'content/knowledge/production/repairs/en/KN-PREFACE-001/publication-resolution.json',
  predecessorAuthority: 'content/knowledge/public/authority/articles/en/KN-PREFACE-001.json',
  zhAuthority: 'content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json',
  successorAuthorityCandidate: 'content/production/visual-article/l10n/candidates/VAP-L10N-R1-KN-PREFACE-001-EN.json',
  successorAuthority: 'content/knowledge/public/authority/successors/en/KN-PREFACE-001.v1.0.1.json',
  zhFigure: 'content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.json',
  carProjectionCandidate: 'content/production/visual-article/l10n/candidates/VAP-L10N-R2-KN-PREFACE-001-EN.json',
  carProjection: 'content/production/car/projections/CAR-LOCALE-PROJECTION-KN-PREFACE-001-MECHANISM-EN-001.json',
  zhPresentation: 'content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v2.json',
  cprPresentationCandidate: 'content/production/visual-article/l10n/candidates/VAP-L10N-R3-KN-PREFACE-001-EN.json',
  cprPresentation: 'content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-EN-v1.json',
  cprRegistryV2: 'content/production/cpr/registries/cpr-production-instance-successor-registry-v2.json',
  cprRegistryV3: 'content/production/cpr/registries/cpr-production-instance-successor-registry-v3.json',
  relationships: 'content/knowledge/public/retrieval/relationships.json',
  readingPaths: 'content/knowledge/intelligence/reading/dynamic-reading-paths.json',
  publicNodes: 'content/knowledge/public/retrieval/nodes.json',
  publicBooks: 'content/knowledge/public/public-book-metadata.json',
  parts: 'content/registry/parts.json',
  visualArticleCandidate: 'content/production/visual-article/l10n/candidates/VAP-L10N-R4-KN-PREFACE-001-EN.json',
  visualArticle: `content/knowledge/public/visual-articles/en/${SLUG}.json`,
  visualManifest: 'content/knowledge/public/visual-article-release.json',
  r5Preflight: 'content/production/visual-article/l10n/acceptance/VAP-L10N-R5-KN-PREFACE-001-EN.preflight.json',
  r5Acceptance: 'content/production/visual-article/l10n/acceptance/VAP-L10N-R5-KN-PREFACE-001-EN.json',
  r5Freeze: 'content/production/visual-article/l10n/freeze/VAP-L10N-R5-KN-PREFACE-001-EN.json',
  route: `articles/${SLUG}.html`,
  articlePage: 'assets/js/pages/article.js',
  publishedContent: 'assets/js/knowledge/published-content.js',
  contract: 'content/production/visual-article/l10n/contracts/vap-l10n-r1-r5-english-successor-v1.json'
});

const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value;

export const digest = value => crypto
  .createHash('sha256')
  .update(JSON.stringify(stable(value)))
  .digest('hex');

export const fileDigest = (root, relative) => crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(root, relative)))
  .digest('hex');

export const readJson = (root, relative) => JSON.parse(
  fs.readFileSync(path.join(root, relative), 'utf8')
);

export const exists = (root, relative) => fs.existsSync(path.join(root, relative));

function withoutDigest(record, key) {
  const copy = structuredClone(record);
  delete copy[key];
  return copy;
}

export function assertDigest(record, key) {
  if (record[key] !== digest(withoutDigest(record, key))) {
    throw new Error(`${key.toUpperCase()}_INVALID`);
  }
}

export function containsCjk(value) {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(value || '');
}

export function articleParagraphs(markdown) {
  return String(markdown || '')
    .replace(/^# .*\n+/, '')
    .split(/\n\n+/)
    .map(value => value.trim())
    .filter(Boolean);
}

function decisionDigest(record) {
  return digest(record);
}

function checkedTrue(object) {
  return object && Object.values(object).length > 0 && Object.values(object).every(value => value === true);
}

export function humanGateState(root = ROOT) {
  const repair = readJson(root, PATHS.repair);
  const state = {
    review: { exists: exists(root, PATHS.review), accepted: false, digest: null },
    approval: { exists: exists(root, PATHS.approval), approved: false, digest: null },
    publication: { exists: exists(root, PATHS.publication), published: false, digest: null }
  };
  if (state.review.exists) {
    const review = readJson(root, PATHS.review);
    state.review.accepted = review.repairCode === repair.repairCode &&
      review.candidateDigest === repair.candidateDigest &&
      String(review.decision).toUpperCase() === 'ACCEPT' && checkedTrue(review.checks);
    state.review.digest = decisionDigest(review);
  }
  if (state.approval.exists) {
    const approval = readJson(root, PATHS.approval);
    state.approval.approved = state.review.accepted &&
      approval.repairCode === repair.repairCode &&
      approval.candidateDigest === repair.candidateDigest &&
      approval.reviewResolutionDigest === state.review.digest &&
      String(approval.decision).toUpperCase() === 'APPROVE';
    state.approval.digest = decisionDigest(approval);
  }
  if (state.publication.exists) {
    const publication = readJson(root, PATHS.publication);
    state.publication.published = state.approval.approved &&
      publication.repairCode === repair.repairCode &&
      publication.candidateDigest === repair.candidateDigest &&
      publication.reviewResolutionDigest === state.review.digest &&
      publication.approvalResolutionDigest === state.approval.digest &&
      String(publication.decision).toUpperCase() === 'PUBLISH';
    state.publication.digest = decisionDigest(publication);
  }
  return state;
}

export function requireHumanGates(root = ROOT) {
  const state = humanGateState(root);
  if (!state.review.accepted) throw new Error('VAP_L10N_R1_HUMAN_REVIEW_REQUIRED');
  if (!state.approval.approved) throw new Error('VAP_L10N_R1_HUMAN_APPROVAL_REQUIRED');
  if (!state.publication.published) throw new Error('VAP_L10N_R1_PUBLICATION_DECISION_REQUIRED');
  return state;
}

export function buildR1Candidate(root = ROOT) {
  const repair = readJson(root, PATHS.repair);
  const predecessor = readJson(root, PATHS.predecessorAuthority);
  const gates = humanGateState(root);
  const payload = {
    schemaVersion: 'PHI-OS-VAP-L10N-R1-ENGLISH-ARTICLE-SUCCESSOR-CANDIDATE-v1.0.0',
    work: 'VAP-L10N-R1',
    status: gates.publication.published ? 'READY_FOR_SUCCESSOR_AUTHORITY_WRITE' :
      gates.approval.approved ? 'AWAITING_HUMAN_PUBLICATION_DECISION' :
        gates.review.accepted ? 'AWAITING_HUMAN_APPROVAL' : 'AWAITING_HUMAN_REVIEW',
    nodeCode: NODE_CODE,
    locale: LOCALE,
    version: repair.version,
    slug: SLUG,
    href: HREF,
    predecessor: {
      path: PATHS.predecessorAuthority,
      authorityRecordCode: predecessor.authorityRecordCode,
      authorityDigest: predecessor.authorityDigest,
      immutable: true,
      mixedLocaleContentKnown: true
    },
    sourceRepair: {
      path: PATHS.repair,
      repairCode: repair.repairCode,
      candidateDigest: repair.candidateDigest,
      independentEnglishAuthoring: repair.sourceBrief?.authoringMode === 'independent_english_authoring',
      translationFromZhHans: repair.sourceBrief?.translationFromZhHans === true
    },
    article: repair.article,
    humanGates: gates,
    targetPath: PATHS.successorAuthority,
    governance: {
      predecessorMutationAllowed: false,
      automaticReviewAllowed: false,
      automaticApprovalAllowed: false,
      automaticPublicationAllowed: false,
      sameSlugAcrossLocalesRequired: true
    }
  };
  return { ...payload, candidateDigest: digest(payload) };
}

export function buildR1Authority(root = ROOT) {
  const repair = readJson(root, PATHS.repair);
  const predecessor = readJson(root, PATHS.predecessorAuthority);
  const gates = requireHumanGates(root);
  const publication = readJson(root, PATHS.publication);
  const body = {
    schemaVersion: 'PHI-OS-PUBLISHED-KNOWLEDGE-AUTHORITY-SUCCESSOR-v1.0.0',
    authorityRecordCode: 'PKA-KN-PREFACE-001-EN-SUCCESSOR-V1-0-1',
    nodeCode: NODE_CODE,
    locale: LOCALE,
    article: {
      articleCode: 'KA-PREFACE-001-EN-ARTICLE-V1-0-1',
      title: repair.article.title,
      summary: repair.article.summary,
      bodyMarkdown: repair.article.bodyMarkdown,
      version: repair.version,
      slug: SLUG,
      href: HREF
    },
    eligibility: { contentReviewed: true, approved: true, published: true },
    lineage: {
      repairCode: repair.repairCode,
      candidateDigest: repair.candidateDigest,
      reviewResolutionDigest: gates.review.digest,
      approvalResolutionDigest: gates.approval.digest,
      publicationResolutionDigest: gates.publication.digest,
      predecessorAuthorityRecordCode: predecessor.authorityRecordCode,
      predecessorAuthorityDigest: predecessor.authorityDigest
    },
    publishedAt: publication.publishedAt,
    publicStatus: 'eligible_for_public_projection',
    governance: {
      successorAuthority: true,
      predecessorImmutable: true,
      independentEnglishAuthoring: true,
      translationInheritanceUsed: false,
      mixedLocalePredecessorSupersededForPublicProjection: true
    }
  };
  return { ...body, authorityDigest: digest(body) };
}

export function buildR2Projection(root = ROOT, { active = false } = {}) {
  const repair = readJson(root, PATHS.repair);
  const figure = readJson(root, PATHS.zhFigure);
  const binary = figure.publicSrc.replace(/^\//, '');
  const body = {
    schemaVersion: 'PHI-OS-CAR-LOCALE-PROJECTION-v1.0.0',
    work: 'VAP-L10N-R2',
    projectionCode: 'CAR-LOCALE-PROJECTION-KN-PREFACE-001-MECHANISM-EN-001',
    status: active ? 'active_production_projection' : 'prepared_awaiting_r1_authority',
    nodeCode: NODE_CODE,
    locale: LOCALE,
    surface: 'WEBSITE',
    assetType: figure.carPublicationRecord.assetType,
    sourcePublishedAsset: {
      path: PATHS.zhFigure,
      publishedAssetCode: figure.publishedAssetCode,
      assetCode: figure.assetCode,
      publicationCode: figure.carPublicationRecord.publicationCode,
      publicationDigest: figure.carPublicationRecord.publicationDigest,
      publicationState: figure.publicationState,
      sourceLocale: figure.carPublicationRecord.locale,
      rightsStatus: figure.rightsStatus,
      width: figure.width,
      height: figure.height
    },
    physicalMedia: {
      publicSrc: figure.publicSrc,
      binaryPath: binary,
      binaryDigest: fileDigest(root, binary),
      sharedPhysicalMedia: true,
      reusePhysicalMedia: true,
      generationPerformed: false,
      binaryDuplicated: false,
      visualContainsLanguageText: repair.figureReuseCandidate.visualContainsLanguageText === true
    },
    accessibilityProjection: {
      altText: repair.figureReuseCandidate.englishAltText,
      caption: repair.figureReuseCandidate.englishCaption,
      accessibilityStatus: 'passed'
    },
    authority: {
      imagePublicationOwnedByCAR: true,
      localeAccessibilityProjectionOwnedByCAR: true,
      sourcePublicationMutated: false
    }
  };
  return { ...body, projectionDigest: digest(body) };
}

function enReadingContext(root) {
  const nodes = readJson(root, PATHS.publicNodes);
  const books = readJson(root, PATHS.publicBooks);
  const parts = readJson(root, PATHS.parts);
  const node = (nodes.records || []).find(record => record.nodeCode === NODE_CODE && record.locale === LOCALE);
  const book = (books.records || []).find(record => record.bookCode === node?.bookCode);
  const part = parts[`part_${String(node?.partCode || '').replace(/^P/, '')}`];
  return {
    nodeProjectionPath: PATHS.publicNodes,
    nodeProjectionDigest: nodes.digest,
    bookMetadataPath: PATHS.publicBooks,
    partMetadataPath: PATHS.parts,
    bookCode: node?.bookCode || 'BOOK-1',
    bookTitle: book?.title?.en || 'Reality Formation',
    partCode: node?.partCode || 'P0',
    partTitle: part?.title?.en || 'PHI OS Core Language'
  };
}

function enRelationships(root) {
  const relationships = readJson(root, PATHS.relationships);
  return {
    authorityPath: PATHS.relationships,
    projectionDigest: relationships.digest,
    relationshipCodes: (relationships.records || [])
      .filter(record => record.locale === LOCALE && record.sourceNodeCode === NODE_CODE)
      .map(record => record.relationshipCode)
      .sort(),
    targetPublicationState: 'unpublished_boundary'
  };
}

function enContinuity(root) {
  const reading = readJson(root, PATHS.readingPaths);
  const record = (reading.paths || []).find(item => item.nodeCode === NODE_CODE && item.locale === LOCALE && item.purpose === 'continuity');
  return {
    authorityPath: PATHS.readingPaths,
    catalogPathCode: record?.catalogPathCode,
    catalogPathDigest: record?.catalogPathDigest,
    publishedOnly: true,
    previousNodeCode: null,
    nextNodeCode: 'KN-PREFACE-002',
    nextNodePublished: false
  };
}

export function buildR3Presentation(root = ROOT, { active = false } = {}) {
  const zh = readJson(root, PATHS.zhPresentation);
  const repair = readJson(root, PATHS.repair);
  const r1 = active ? buildR1Authority(root) : buildR1Candidate(root);
  const r2 = buildR2Projection(root, { active });
  const presentation = structuredClone(zh);
  presentation.schemaVersion = 'PHI-OS-CPR-PRODUCTION-INSTANCE-v1.0.0';
  presentation.presentationCode = 'PRESENTATION-ARTICLE-KN-PREFACE-001-EN-v1';
  presentation.presentationIdentity = 'PRESENTATION-ARTICLE-KN-PREFACE-001';
  presentation.presentationVersion = '1.0.0';
  presentation.work = 'VAP-L10N-R3';
  presentation.phase = 'VAP-L10N_ENGLISH_VISUAL_ARTICLE_SUCCESSOR';
  presentation.status = active ? 'active_production_instance' : 'prepared_awaiting_r1_authority';
  presentation.locale = LOCALE;
  presentation.renderState = active ? 'ready_for_render' : 'blocked_human_gate';
  presentation.inputs.publishedArticle = active ? {
    authorityRecordCode: r1.authorityRecordCode,
    authorityPath: PATHS.successorAuthority,
    authorityDigest: r1.authorityDigest,
    articleCode: r1.article.articleCode,
    nodeCode: NODE_CODE,
    publicationCode: r1.lineage.repairCode,
    publicationDigest: r1.lineage.publicationResolutionDigest,
    publicationState: 'published',
    publishedAt: r1.publishedAt,
    version: r1.article.version,
    href: HREF
  } : {
    authorityRecordCode: 'PENDING_R1_SUCCESSOR_AUTHORITY',
    authorityPath: PATHS.successorAuthority,
    authorityDigest: null,
    articleCode: 'KA-PREFACE-001-EN-ARTICLE-V1-0-1',
    nodeCode: NODE_CODE,
    publicationCode: null,
    publicationDigest: null,
    publicationState: 'blocked_human_gate',
    publishedAt: null,
    version: repair.version,
    href: HREF
  };
  presentation.inputs.publishedFigure = {
    publishedAssetCode: r2.sourcePublishedAsset.publishedAssetCode,
    authorityPath: PATHS.carProjection,
    localeProjectionCode: r2.projectionCode,
    localeProjectionDigest: r2.projectionDigest,
    assetCode: r2.sourcePublishedAsset.assetCode,
    publicationCode: r2.sourcePublishedAsset.publicationCode,
    publicationDigest: r2.sourcePublishedAsset.publicationDigest,
    publicationState: r2.sourcePublishedAsset.publicationState,
    assetType: r2.assetType,
    locale: LOCALE,
    sourceLocale: r2.sourcePublishedAsset.sourceLocale,
    publicSrc: r2.physicalMedia.publicSrc,
    width: r2.sourcePublishedAsset.width,
    height: r2.sourcePublishedAsset.height,
    altText: r2.accessibilityProjection.altText,
    caption: r2.accessibilityProjection.caption,
    rightsStatus: r2.sourcePublishedAsset.rightsStatus,
    accessibilityStatus: r2.accessibilityProjection.accessibilityStatus,
    sharedPhysicalMedia: true
  };
  presentation.inputs.knowledgeRelationships = enRelationships(root);
  presentation.inputs.readingContinuity = enContinuity(root);
  presentation.inputs.readingContext = enReadingContext(root);
  presentation.inputs.locale = LOCALE;
  for (const component of presentation.composition) {
    if (component.componentCode === 'ARTICLE_HEADER') component.sourceReferences = [active ? r1.authorityRecordCode : 'PENDING_R1_SUCCESSOR_AUTHORITY'];
    if (component.componentCode === 'ARTICLE_BODY') {
      component.sourceReferences = ['KA-PREFACE-001-EN-ARTICLE-V1-0-1'];
      component.bodyInsertions = [{
        presentationType: 'DIAGRAM',
        sourceReferences: [r2.projectionCode, r2.sourcePublishedAsset.publishedAssetCode],
        placement: { mode: 'AFTER_ARTICLE_BODY', articleBodyMutationRequired: false }
      }];
    }
    if (component.componentCode === 'RESPONSIBILITY_CALLOUT') {
      component.content = [repair.article.insight.statement];
      component.sourceReferences = [active ? r1.authorityRecordCode : 'PENDING_R1_SUCCESSOR_AUTHORITY'];
    }
    if (component.componentCode === 'RELATED_KNOWLEDGE') component.sourceReferences = ['REL-KN-PREFACE-001-EN-relatedNodeCodes-KN-PREFACE-002'];
    if (component.componentCode === 'CONTINUITY') component.sourceReferences = ['KID-CATALOG-KN-PREFACE-001-EN-CONTINUITY'];
  }
  presentation.figurePresentation.caption = r2.accessibilityProjection.caption;
  presentation.figurePresentation.captionSource = 'CAR_LOCALE_PROJECTION_CAPTION';
  presentation.localeAcceptance = [
    {
      locale: 'en',
      publishedArticleAvailable: active,
      publishedArticleLocaleQuality: active ? 'ACCEPTED_SUCCESSOR_AUTHORITY' : 'BLOCKED_HUMAN_GATE',
      publishedFigureAvailable: true,
      productionProjection: active ? 'READY_FOR_RENDER' : 'BLOCKED_R1_AUTHORITY',
      responsiveTemplateAccepted: true,
      figureProjection: 'PROJECTED_SHARED_PHYSICAL_MEDIA',
      translationInvented: false,
      mixedLocaleInputDetected: false,
      samePresentationIdentity: true
    },
    {
      locale: 'zh-Hans',
      publishedArticleAvailable: true,
      publishedArticleLocaleQuality: 'FROZEN_PREDECESSOR_LANE_UNCHANGED',
      publishedFigureAvailable: true,
      productionProjection: 'UNCHANGED',
      responsiveTemplateAccepted: true,
      figureProjection: 'UNCHANGED',
      translationInvented: false,
      mixedLocaleInputDetected: false,
      samePresentationIdentity: true
    }
  ];
  return presentation;
}

export function presentationDigest(presentation) {
  return digest(presentation);
}

export function buildCprRegistryV3(root = ROOT, presentation = buildR3Presentation(root, { active: true })) {
  const v2 = readJson(root, PATHS.cprRegistryV2);
  return {
    registryCode: 'PHI-OS-CPR-PRODUCTION-INSTANCE-SUCCESSOR-REGISTRY-v3',
    registryVersion: '3.0.0',
    work: 'VAP-L10N-R3',
    phase: 'VAP-L10N_ENGLISH_VISUAL_ARTICLE_SUCCESSOR',
    productionStatus: 'active',
    predecessorRegistry: PATHS.cprRegistryV2,
    productionRecords: [
      ...(v2.productionRecords || []),
      {
        presentationCode: presentation.presentationCode,
        presentationIdentity: presentation.presentationIdentity,
        presentationVersion: presentation.presentationVersion,
        presentationType: presentation.presentationType,
        surface: presentation.surface,
        locale: presentation.locale,
        audience: presentation.audience,
        renderState: presentation.renderState,
        presentationDigest: presentationDigest(presentation),
        path: PATHS.cprPresentation
      }
    ],
    rules: {
      predecessorRegistryUnchanged: true,
      sharedPresentationIdentityAcrossLocales: true,
      publishedArticleSuccessorRequiredForEnglish: true,
      sharedPhysicalFigureProjectionAllowedWhenLanguageNeutral: true,
      pdsVisualAuthorityPreserved: true
    }
  };
}

export function buildR4VisualArticle(root = ROOT, { active = false } = {}) {
  const repair = readJson(root, PATHS.repair);
  const paragraphs = articleParagraphs(repair.article.bodyMarkdown);
  const r1 = active ? buildR1Authority(root) : buildR1Candidate(root);
  const r2 = buildR2Projection(root, { active });
  const r3 = buildR3Presentation(root, { active });
  const blocks = paragraphs.map((text, index) => ({
    type: 'paragraph',
    blockCode: `VAP-L10N-KN-PREFACE-001-EN-P${String(index + 1).padStart(2, '0')}`,
    text
  }));
  blocks.push({
    type: 'figure',
    blockCode: 'VAP-L10N-KN-PREFACE-001-EN-FIGURE-01',
    assetCode: r2.sourcePublishedAsset.assetCode,
    altText: r2.accessibilityProjection.altText,
    caption: r2.accessibilityProjection.caption,
    displayMode: 'wide'
  });
  blocks.push({
    type: 'insight',
    blockCode: 'VAP-L10N-KN-PREFACE-001-EN-INSIGHT-01',
    heading: repair.article.insight.heading,
    statement: repair.article.insight.statement
  });
  return {
    schemaVersion: 'PHI-OS-PUBLIC-VISUAL-ARTICLE-v1.0.0',
    assetCode: 'KA-PREFACE-001-EN-ARTICLE-V1-0-1',
    nodeCode: NODE_CODE,
    locale: LOCALE,
    slug: SLUG,
    publicHref: HREF,
    title: repair.article.title,
    summary: repair.article.summary,
    shortAnswer: repair.article.summary,
    publicationOrder: 1,
    contentStatus: active ? 'content_reviewed' : 'candidate',
    reviewStatus: active ? 'approved' : 'pending',
    publicationStatus: active ? 'published' : 'not_published',
    version: repair.version,
    sections: [{
      sectionCode: 'VAP-L10N-KN-PREFACE-001-EN-SECTION-01',
      heading: repair.article.title,
      blocks
    }],
    hero: { lead: repair.article.summary },
    keyConcepts: repair.article.keyConcepts,
    knowledgeBoundary: repair.article.knowledgeBoundary,
    connections: {
      previousNode: null,
      nextNode: null,
      relatedNodes: [], relatedArticles: [], relatedBooks: [], relatedAtlasEntries: [], relatedFigures: [], journeyEntryTopics: []
    },
    publicSources: [],
    visualAssets: [{
      assetCode: r2.sourcePublishedAsset.assetCode,
      assetType: 'mechanism_diagram',
      publicSrc: r2.physicalMedia.publicSrc,
      altText: r2.accessibilityProjection.altText,
      caption: r2.accessibilityProjection.caption,
      width: r2.sourcePublishedAsset.width,
      height: r2.sourcePublishedAsset.height,
      publicProjection: true,
      localeProjectionCode: r2.projectionCode,
      sharedPhysicalMedia: true
    }],
    figureReferences: [{
      assetCode: r2.sourcePublishedAsset.assetCode,
      publishedAssetCode: r2.sourcePublishedAsset.publishedAssetCode,
      publicationCode: r2.sourcePublishedAsset.publicationCode,
      publicationDigest: r2.sourcePublishedAsset.publicationDigest,
      localeProjectionCode: r2.projectionCode,
      localeProjectionDigest: r2.projectionDigest,
      publicSrc: r2.physicalMedia.publicSrc,
      placement: 'after_article_body',
      presentationCode: r3.presentationCode
    }],
    provenance: {
      bookCode: r3.inputs.readingContext.bookCode,
      partCode: r3.inputs.readingContext.partCode,
      nodeCode: NODE_CODE,
      locale: LOCALE,
      version: repair.version,
      lineage: {
        repairCode: repair.repairCode,
        candidateDigest: repair.candidateDigest,
        successorAuthorityCode: active ? r1.authorityRecordCode : 'PENDING_R1_SUCCESSOR_AUTHORITY',
        successorAuthorityDigest: active ? r1.authorityDigest : null,
        carLocaleProjectionCode: r2.projectionCode,
        carLocaleProjectionDigest: r2.projectionDigest,
        presentationCode: r3.presentationCode,
        presentationDigest: presentationDigest(r3)
      }
    },
    seo: {
      title: `${repair.article.title}｜PHI OS Knowledge`,
      description: repair.article.summary
    }
  };
}

export function buildR4Candidate(root = ROOT) {
  const article = buildR4VisualArticle(root, { active: false });
  const payload = {
    schemaVersion: 'PHI-OS-VAP-L10N-R4-ENGLISH-VISUAL-ARTICLE-CANDIDATE-v1.0.0',
    work: 'VAP-L10N-R4',
    status: 'PREPARED_AWAITING_R1_AUTHORITY',
    nodeCode: NODE_CODE,
    locale: LOCALE,
    slug: SLUG,
    href: HREF,
    targetPath: PATHS.visualArticle,
    article,
    governance: { publicationWriteAllowedBeforeR1: false, sameCanonicalRouteRequired: true }
  };
  return { ...payload, candidateDigest: digest(payload) };
}

export function buildR5Preflight(root = ROOT) {
  const r1 = buildR1Candidate(root);
  const r2 = buildR2Projection(root, { active: false });
  const r3 = buildR3Presentation(root, { active: false });
  const r4 = buildR4Candidate(root);
  const route = fs.readFileSync(path.join(root, PATHS.route), 'utf8');
  const articleJs = fs.readFileSync(path.join(root, PATHS.articlePage), 'utf8');
  const published = fs.readFileSync(path.join(root, PATHS.publishedContent), 'utf8');
  const body = {
    schemaVersion: 'PHI-OS-VAP-L10N-R5-SAME-ROUTE-PREFLIGHT-v1.0.0',
    work: 'VAP-L10N-R5',
    status: r1.status === 'READY_FOR_SUCCESSOR_AUTHORITY_WRITE' ? 'READY_FOR_ACTIVATION' : r1.status,
    nodeCode: NODE_CODE,
    locales: ['zh-Hans', 'en'],
    canonicalRoute: HREF,
    gates: {
      sameSlugAcrossLocales: SLUG === readJson(root, PATHS.zhAuthority).article.slug,
      routeShellSingleSlug: route.includes(`data-article-slug="${SLUG}"`),
      runtimeGetsLocale: /getLocale\(\)/.test(articleJs),
      loaderScopesVisualReleaseByLocale: /record\.locale === normalizedLocale/.test(published),
      visualReleaseOverridesByNode: /new Map\([\s\S]*visualArticles[\s\S]*\.map\(article => \[article\.nodeCode, article\]\)/.test(published),
      sharedFigureBinary: r2.physicalMedia.sharedPhysicalMedia && r2.physicalMedia.binaryDuplicated === false,
      samePresentationIdentity: r3.presentationIdentity === 'PRESENTATION-ARTICLE-KN-PREFACE-001',
      pdsProjectionInherited: JSON.stringify(r3.pdsReferences) === JSON.stringify(readJson(root, PATHS.zhPresentation).pdsReferences),
      englishCandidateHasNoCjk: !containsCjk(JSON.stringify(readJson(root, PATHS.repair).article)),
      predecessorAuthorityImmutable: r1.predecessor.immutable === true,
      humanReviewPassed: r1.humanGates.review.accepted,
      humanApprovalPassed: r1.humanGates.approval.approved,
      humanPublicationDecisionPassed: r1.humanGates.publication.published
    },
    preparedReferences: {
      r1CandidateDigest: r1.candidateDigest,
      r2ProjectionDigest: r2.projectionDigest,
      r3PresentationDigest: presentationDigest(r3),
      r4CandidateDigest: r4.candidateDigest
    },
    activationCommand: 'npm run vap:l10n:r1-r5:apply',
    strictCheckCommand: 'npm run check:vap-l10n:r1-r5',
    governance: {
      productionBrowserAcceptanceClaimed: false,
      productionDeploymentClaimed: false,
      localSameRouteRuntimeAcceptanceOnly: true
    }
  };
  return { ...body, preflightDigest: digest(body) };
}

export function buildR5Acceptance(root = ROOT, { successorAuthority, carProjection, presentation, visualArticle } = {}) {
  const manifest = readJson(root, PATHS.visualManifest);
  const zhRecord = manifest.records.find(record => record.nodeCode === NODE_CODE && record.locale === 'zh-Hans');
  const enRecord = manifest.records.find(record => record.nodeCode === NODE_CODE && record.locale === LOCALE);
  const zhArticle = readJson(root, `content/knowledge/public/visual-articles/zh-Hans/${SLUG}.json`);
  const body = {
    schemaVersion: 'PHI-OS-VAP-L10N-R5-SAME-ROUTE-LOCALE-ACCEPTANCE-v1.0.0',
    work: 'VAP-L10N-R5',
    status: 'ACCEPTED_SAME_ROUTE_LOCALE_RUNTIME',
    nodeCode: NODE_CODE,
    slug: SLUG,
    href: HREF,
    acceptance: {
      zhHansPublished: zhRecord?.status === 'published',
      englishPublished: enRecord?.status === 'published',
      sameSlug: zhRecord?.slug === enRecord?.slug && enRecord?.slug === SLUG,
      sameHref: zhRecord?.href === enRecord?.href && enRecord?.href === HREF,
      distinctLocaleProjection: zhRecord?.locale === 'zh-Hans' && enRecord?.locale === 'en',
      englishTextOnly: !containsCjk(JSON.stringify({ title: visualArticle.title, summary: visualArticle.summary, sections: visualArticle.sections, seo: visualArticle.seo })),
      samePhysicalFigureBinary: zhArticle.visualAssets?.[0]?.publicSrc === visualArticle.visualAssets?.[0]?.publicSrc,
      englishFigureAccessibilityLocalized: visualArticle.visualAssets?.[0]?.altText === carProjection.accessibilityProjection.altText && visualArticle.visualAssets?.[0]?.caption === carProjection.accessibilityProjection.caption,
      samePresentationIdentity: presentation.presentationIdentity === 'PRESENTATION-ARTICLE-KN-PREFACE-001',
      pdsReferencesIdentical: JSON.stringify(presentation.pdsReferences) === JSON.stringify(readJson(root, PATHS.zhPresentation).pdsReferences),
      successorDoesNotMutatePredecessor: successorAuthority.lineage.predecessorAuthorityDigest === readJson(root, PATHS.predecessorAuthority).authorityDigest
    },
    authorityReferences: {
      successorAuthorityPath: PATHS.successorAuthority,
      successorAuthorityDigest: successorAuthority.authorityDigest,
      carProjectionPath: PATHS.carProjection,
      carProjectionDigest: carProjection.projectionDigest,
      cprPresentationPath: PATHS.cprPresentation,
      cprPresentationDigest: presentationDigest(presentation),
      visualArticlePath: PATHS.visualArticle,
      visualArticleDigest: fileDigest(root, PATHS.visualArticle),
      manifestPath: PATHS.visualManifest,
      manifestDigest: fileDigest(root, PATHS.visualManifest)
    },
    deployment: {
      deploymentPerformedByThisPhase: false,
      productionBrowserAcceptanceClaimed: false,
      postDeploymentBrowserAcceptanceStillRequired: true
    }
  };
  if (!Object.values(body.acceptance).every(Boolean)) throw new Error('VAP_L10N_R5_ACCEPTANCE_FAILED');
  return { ...body, acceptanceDigest: digest(body) };
}

export function buildR5Freeze(acceptance) {
  const body = {
    schemaVersion: 'PHI-OS-VAP-L10N-R5-SAME-ROUTE-LOCALE-FREEZE-v1.0.0',
    work: 'VAP-L10N-R5',
    status: 'FROZEN',
    nodeCode: NODE_CODE,
    locale: LOCALE,
    slug: SLUG,
    href: HREF,
    frozenLane: ['VAP-L10N-R1', 'VAP-L10N-R2', 'VAP-L10N-R3', 'VAP-L10N-R4', 'VAP-L10N-R5'],
    upstreamAcceptanceDigest: acceptance.acceptanceDigest,
    governance: {
      zhHansFrozenVerticalSliceMutated: false,
      predecessorEnglishAuthorityMutated: false,
      physicalFigureDuplicated: false,
      sameRouteLocaleBehaviorFrozen: true,
      productionBrowserAcceptanceIncluded: false
    }
  };
  return { ...body, freezeDigest: digest(body) };
}

export function ensureDirFor(root, relative) {
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
}

export function writeJson(root, relative, value) {
  ensureDirFor(root, relative);
  fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function writePreparedCandidates(root = ROOT) {
  const r1 = buildR1Candidate(root);
  const r2 = buildR2Projection(root, { active: false });
  const r3 = buildR3Presentation(root, { active: false });
  const r4 = buildR4Candidate(root);
  const r5 = buildR5Preflight(root);
  writeJson(root, PATHS.successorAuthorityCandidate, r1);
  writeJson(root, PATHS.carProjectionCandidate, r2);
  writeJson(root, PATHS.cprPresentationCandidate, r3);
  writeJson(root, PATHS.visualArticleCandidate, r4);
  writeJson(root, PATHS.r5Preflight, r5);
  return { r1, r2, r3, r4, r5 };
}

export function activateR1R5(root = ROOT) {
  requireHumanGates(root);
  const successorAuthority = buildR1Authority(root);
  const carProjection = buildR2Projection(root, { active: true });
  const presentation = buildR3Presentation(root, { active: true });
  const cprRegistryV3 = buildCprRegistryV3(root, presentation);
  const visualArticle = buildR4VisualArticle(root, { active: true });

  writeJson(root, PATHS.successorAuthority, successorAuthority);
  writeJson(root, PATHS.carProjection, carProjection);
  writeJson(root, PATHS.cprPresentation, presentation);
  writeJson(root, PATHS.cprRegistryV3, cprRegistryV3);
  writeJson(root, PATHS.visualArticle, visualArticle);

  const manifest = readJson(root, PATHS.visualManifest);
  const records = (manifest.records || []).filter(record => !(record.nodeCode === NODE_CODE && record.locale === LOCALE));
  records.push({
    nodeCode: NODE_CODE,
    locale: LOCALE,
    slug: SLUG,
    href: HREF,
    path: `/${PATHS.visualArticle}`,
    authorityPath: PATHS.successorAuthority,
    presentationPath: PATHS.cprPresentation,
    figureProjectionPath: PATHS.carProjection,
    status: 'published'
  });
  writeJson(root, PATHS.visualManifest, { ...manifest, records });

  const acceptance = buildR5Acceptance(root, { successorAuthority, carProjection, presentation, visualArticle });
  const freeze = buildR5Freeze(acceptance);
  writeJson(root, PATHS.r5Acceptance, acceptance);
  writeJson(root, PATHS.r5Freeze, freeze);
  writePreparedCandidates(root);
  return { successorAuthority, carProjection, presentation, cprRegistryV3, visualArticle, acceptance, freeze };
}
