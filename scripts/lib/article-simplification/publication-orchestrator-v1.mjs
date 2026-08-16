import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { serialize } from '../knowledge-production/canonical-brief-v2.mjs';
import {
  applyVapW11,
  validatePublicationDecisionEnvelope,
  VAP_W11_PATHS
} from '../visual-article-production/publication-handoff-decision-v1.mjs';
import { writeApsPublishedKnowledgeAuthoritySuccessor } from './published-authority-successor-v1.mjs';
import { buildAps6DecisionBridge, apsBatchPaths, aps6Digest } from './human-decision-bridge-v1.mjs';
import { buildPublicationFromFrozenBrief, ensurePublicationAndRegistry, assertFrozenPjaPublicationImplementation } from './pja-publication-successor-v1.mjs';

export const APS7_SCHEMA_VERSION = 'PHI-OS-APS-7-ONE-COMMAND-PUBLICATION-v1.0.0';
export const APS7_BASELINE = '94d5efa953ff83713505b133d0039764df577675';
const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = async (root, rel) => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const exists = file => fs.access(file).then(() => true, () => false);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const stable = value => `${JSON.stringify(value, null, 2)}\n`;

const publicationRunPath = batchCode => `content/production/article-simplification/batches/${batchCode}/publication-run.v1.json`;
const cprPath = (nodeCode, locale) => `content/production/cpr/presentations/PRESENTATION-ARTICLE-${nodeCode}-${locale.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-APS-v1.json`;
const visualArticlePath = (locale, slug) => `content/knowledge/public/visual-articles/${locale}/${slug}.json`;
const manifestPath = 'content/knowledge/public/visual-article-release.json';

async function atomicWrite(target, text, { replace = false } = {}) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await fs.writeFile(temp, text, { flag: 'wx' });
  if (!replace && await exists(target)) { await fs.rm(temp, { force: true }); throw fail('APS7_TARGET_EXISTS', target); }
  await fs.rename(temp, target);
}

async function ensureText(root, relative, text, { apply }) {
  const target = path.join(root, relative);
  if (await exists(target)) {
    const current = await fs.readFile(target, 'utf8');
    if (current !== text) throw fail('APS7_OUTPUT_CONFLICT', relative);
    return 'existing_equivalent';
  }
  if (apply) await atomicWrite(target, text);
  return 'create';
}

function cleanInline(value) {
  return String(value ?? '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/^[-*]\s+/, '').trim();
}

export function markdownToPublicSections(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
  const sections = [];
  let current = null;
  let paragraph = [];
  const flushParagraph = () => {
    const text = cleanInline(paragraph.join(' '));
    paragraph = [];
    if (text && current) current.paragraphs.push(text);
  };
  const ensureSection = () => {
    if (!current) { current = { heading: '正文', paragraphs: [], blocks: [] }; sections.push(current); }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#\s+/.test(line)) { flushParagraph(); continue; }
    if (/^##\s+/.test(line)) {
      flushParagraph();
      current = { heading: cleanInline(line.replace(/^##\s+/, '')), paragraphs: [], blocks: [] };
      sections.push(current);
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushParagraph(); ensureSection();
      paragraph.push(cleanInline(line.replace(/^###\s+/, '')));
      continue;
    }
    if (!line) { flushParagraph(); continue; }
    ensureSection(); paragraph.push(line);
  }
  flushParagraph();
  return sections.filter(section => section.heading && section.paragraphs.length).map((section, index) => ({
    sectionCode: `APS-SECTION-${String(index + 1).padStart(2, '0')}`,
    heading: section.heading,
    anchor: `section-${index + 1}`,
    paragraphs: section.paragraphs,
    blocks: []
  }));
}

function buildCprArticleOnlyProjection({ authorityRecord, publication, packageRecord }) {
  const noVisualAsset = !packageRecord.figure && !packageRecord.visual && !packageRecord.assets;
  if (!noVisualAsset) throw fail('APS7_CAR_REQUIRED_FOR_VISUAL_ASSET', publication.article.nodeCode);
  return {
    schemaVersion: 'PHI-OS-CPR-APS-ARTICLE-PRESENTATION-SUCCESSOR-v1.0.0',
    presentationCode: `PRESENTATION-ARTICLE-${publication.article.nodeCode}-${publication.article.locale.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-APS-v1`,
    presentationVersion: '1.0.0',
    work: 'APS-7_CPR_SUCCESSOR_ORCHESTRATION',
    status: 'active_production_instance',
    surface: 'WEBSITE', presentationType: 'ARTICLE_PAGE', renderState: 'ready_for_render',
    locale: publication.article.locale, audience: 'CUSTOMER',
    inputs: {
      publishedArticle: {
        authorityRecordCode: authorityRecord.authorityRecordCode,
        authorityDigest: authorityRecord.authorityDigest,
        publicationCode: publication.publicationCode,
        publicationDigest: publication.publicationDigest,
        articleCode: publication.article.articleCode,
        nodeCode: publication.article.nodeCode,
        href: publication.article.href,
        version: publication.article.version
      },
      car: { required: false, state: 'NOT_REQUIRED_NO_VISUAL_ASSET', publishedAssetReferences: [] }
    },
    composition: [
      { ordinal: 1, componentCode: 'ARTICLE_HEADER', sourceReferences: [authorityRecord.authorityRecordCode], visibility: 'VISIBLE' },
      { ordinal: 2, componentCode: 'ARTICLE_BODY', sourceReferences: [publication.article.articleCode], bodyInsertions: [], visibility: 'VISIBLE' },
      { ordinal: 3, componentCode: 'SECONDARY_PROVENANCE', sourceReferences: [publication.article.nodeCode], visibility: 'VISIBLE' },
      { ordinal: 4, componentCode: 'FOOTER', sourceReferences: ['PDS_PUBLIC_SHELL'], visibility: 'VISIBLE' }
    ],
    pdsReferences: {
      authority: 'PDS',
      contracts: [
        'content/registry/pds-w2-design-token-contract.json',
        'content/registry/pds-w3-core-component-shell-contract.json',
        'content/registry/pds-w7-reading-experience.json',
        'content/registry/pds-w9-knowledge-professional.json'
      ],
      styleReferences: [
        'assets/css/tokens.css', 'assets/css/design/foundation.css', 'assets/css/design/typography.css',
        'assets/css/public-experience.css', 'assets/css/knowledge-release.css', 'assets/css/article-renderer.css',
        'assets/css/pds-w9-knowledge-professional.css', 'assets/css/wpr-public-production.css'
      ]
    },
    governance: {
      cprDecidesKnowledge: false,
      cprDecidesPublication: false,
      apsCreatesCarAuthority: false,
      carBypassAllowedWhenVisualAssetRequired: false,
      articleOnlyNoAssetPathAllowed: true
    }
  };
}

function buildPublicVisualArticle({ publication, authorityRecord, reviewEntry, presentation }) {
  const sections = markdownToPublicSections(publication.article.bodyMarkdown);
  if (!sections.length) throw fail('APS7_PUBLIC_ARTICLE_SECTIONS_EMPTY', publication.article.nodeCode);
  return {
    schemaVersion: 'PHI-OS-PUBLIC-VISUAL-ARTICLE-v1.0.0',
    assetCode: publication.article.articleCode,
    nodeCode: publication.article.nodeCode,
    locale: publication.article.locale,
    slug: publication.article.slug,
    publicHref: publication.article.href,
    title: publication.article.title,
    summary: publication.article.summary,
    shortAnswer: publication.article.summary,
    displayQuestion: publication.article.title,
    publicationOrder: 1000 + Number(reviewEntry.batchIndex || 0),
    contentStatus: 'content_reviewed', reviewStatus: 'approved', publicationStatus: 'published',
    version: publication.article.version,
    publishedAt: publication.publishedAt,
    sections,
    hero: { lead: publication.article.summary },
    keyConcepts: [], knowledgeBoundary: [], connections: { previousNode: null, nextNode: null, relatedNodes: [], relatedArticles: [], relatedBooks: [], relatedAtlasEntries: [], relatedFigures: [], journeyEntryTopics: [] },
    publicSources: [], visualAssets: [], figureReferences: [],
    provenance: {
      bookCode: reviewEntry.bookCode, partCode: reviewEntry.partCode, nodeCode: publication.article.nodeCode, locale: publication.article.locale, version: publication.article.version,
      lineage: {
        candidateCode: publication.candidate.candidateCode, candidateDigest: publication.candidate.candidateDigest,
        reviewCode: publication.review.reviewCode, reviewDigest: publication.review.reviewDigest,
        approvalCode: publication.approval.approvalCode, approvalDigest: publication.approval.approvalDigest,
        publicationCode: publication.publicationCode, publicationDigest: publication.publicationDigest,
        publishedKnowledgeAuthorityCode: authorityRecord.authorityRecordCode,
        publishedKnowledgeAuthorityDigest: authorityRecord.authorityDigest,
        presentationCode: presentation.presentationCode
      }
    },
    seo: { title: `${publication.article.title}｜PHI OS Knowledge`, description: publication.article.summary }
  };
}

function htmlEscape(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function buildArticleHtml(article) {
  return `<!doctype html>\n<html lang="${htmlEscape(article.locale)}">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="description" content="${htmlEscape(article.seo.description)}">\n  <title>${htmlEscape(article.seo.title)}</title>\n  <link rel="canonical" href="https://phios-github.pages.dev${htmlEscape(article.publicHref)}">\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Newsreader:opsz,wght@6..72,400;6..72,500&amp;display=swap" rel="stylesheet">\n  <link rel="stylesheet" href="/assets/css/tokens.css">\n  <link rel="stylesheet" href="/assets/css/design/foundation.css">\n  <link rel="stylesheet" href="/assets/css/design/typography.css">\n  <link rel="stylesheet" href="/assets/css/public-experience.css">\n  <link rel="stylesheet" href="/assets/css/knowledge-release.css">\n  <link rel="stylesheet" href="/assets/css/article-renderer.css">\n  <link rel="stylesheet" href="/assets/css/pds-w9-knowledge-professional.css">\n  <link rel="stylesheet" href="/assets/css/wpr-public-production.css">\n</head>\n<body class="knowledge-page" data-public-section="knowledge" data-page="knowledge-article">\n  <a class="skip-link" href="#article-main" data-i18n="knowledge.common.skip">跳至主要内容</a>\n  <header data-public-header-placeholder></header>\n  <main id="article-main" class="knowledge-article-shell" data-wpr-production-surface="ARTICLE" data-article-slug="${htmlEscape(article.slug)}" aria-busy="true"></main>\n  <footer data-public-footer-placeholder></footer>\n  <script type="module" src="/assets/js/public-shell.js"></script>\n  <script type="module" src="/assets/js/pages/article.js"></script>\n</body>\n</html>\n`;
}

async function writeW11DecisionEnvelope(root, envelope, { apply }) {
  const rel = VAP_W11_PATHS.decisions;
  const target = path.join(root, rel);
  if (await exists(target)) {
    const existing = await readJson(root, rel);
    const existingDecided = existing.entries?.some(item => item.decisionState === 'human_decided');
    if (existingDecided && serialize(existing) !== serialize(envelope)) throw fail('APS7_EXISTING_W11_HUMAN_DECISION_CONFLICT', rel);
  }
  if (apply) await atomicWrite(target, serialize(envelope), { replace: true });
  return rel;
}

async function ensureManifestRecord(root, record, { apply }) {
  const manifest = await readJson(root, manifestPath);
  const index = manifest.records.findIndex(item => item.nodeCode === record.nodeCode && item.locale === record.locale);
  if (index >= 0) {
    if (stable(manifest.records[index]) !== stable(record)) throw fail('APS7_VISUAL_RELEASE_MANIFEST_CONFLICT', `${record.nodeCode}:${record.locale}`);
    return 'existing_equivalent';
  }
  if (apply) {
    const next = { ...manifest, records: [...manifest.records, record] };
    await atomicWrite(path.join(root, manifestPath), stable(next), { replace: true });
  }
  return 'create';
}

export async function runAps7Publication(root, batchCode = 'BATCH-001', { apply = true } = {}) {
  const built = await buildAps6DecisionBridge(root, batchCode);
  if (built.bridge.errors.length) throw fail('APS7_APS6_INPUT_INVALID', JSON.stringify(built.bridge.errors));
  if (built.bridge.status !== 'READY_FOR_APS_7_PUBLICATION') {
    const pending = built.bridge.entries.filter(entry => !entry.explicitHumanDecisionComplete).map(entry => entry.nodeCode);
    throw fail('APS7_EXPLICIT_HUMAN_DECISIONS_REQUIRED', pending.join(','));
  }
  const vapValidation = validatePublicationDecisionEnvelope(built.vapEnvelope, built.queue, { requireAllDecided: true });
  if (!vapValidation.valid) throw fail('APS7_VAP_W11_DECISION_BRIDGE_INVALID', JSON.stringify(vapValidation.errors));
  await assertFrozenPjaPublicationImplementation(root);
  if (apply) {
    await writeW11DecisionEnvelope(root, built.vapEnvelope, { apply: true });
    await fs.writeFile(path.join(root, apsBatchPaths(batchCode).decisionBridge), stable(built.bridge), 'utf8');
  }
  const w11 = await applyVapW11(root, built.vapEnvelope, { apply, targetRoot: root });
  const publicationOutcomes = [];
  for (const bridgeEntry of built.bridge.entries) {
    const reviewEntry = built.reviewBatch.entries.find(item => item.nodeCode === bridgeEntry.nodeCode && item.locale === bridgeEntry.locale);
    const q = built.queue.entries.find(item => item.nodeCode === bridgeEntry.nodeCode);
    if (bridgeEntry.publicationDecision !== 'publish') {
      publicationOutcomes.push({ nodeCode: bridgeEntry.nodeCode, locale: bridgeEntry.locale, decision: bridgeEntry.publicationDecision, publicationCreated: false, publicReleaseCreated: false });
      continue;
    }
    const [candidate, review, approval, packageRecord] = await Promise.all([
      readJson(root, q.candidate.path), readJson(root, q.review.path), readJson(root, q.approval.path), readJson(root, q.productionArticlePackage.path)
    ]);
    if (packageRecord.figure || packageRecord.visual || packageRecord.assets) throw fail('APS7_VISUAL_ASSET_REQUIRES_CAR_PATH', q.nodeCode);
    const decision = built.humanDecisions.entries.find(item => item.nodeCode === q.nodeCode && item.locale === q.locale);
    const publicationBuilt = await buildPublicationFromFrozenBrief(root, {
      candidate, review, approval, canonicalBriefPath: q.canonicalBrief.path,
      publisherCode: 'TL', publishedAt: decision.decidedAt, version: q.targetPublication.version
    });
    const ensured = await ensurePublicationAndRegistry(root, publicationBuilt.publication, { apply });
    publicationOutcomes.push({ nodeCode: q.nodeCode, locale: q.locale, decision: 'publish', publicationCreated: true, publication: publicationBuilt.publication, publicationPath: ensured.publicationPath, publicationState: ensured.packageState, registryState: ensured.registryState, reviewEntry, packageRecord });
  }

  let authority = null;
  if (publicationOutcomes.some(item => item.publicationCreated)) {
    if (!apply) {
      authority = { mode: 'deferred_until_apply', reason: 'Published Knowledge Authority rebuild requires Publication Packages to exist in target root.' };
    } else {
      authority = writeApsPublishedKnowledgeAuthoritySuccessor(root);
      for (const outcome of publicationOutcomes.filter(item => item.publicationCreated)) {
        const authorityRecord = authority.registry.records.find(record => record.nodeCode === outcome.nodeCode && record.locale === outcome.locale);
        if (!authorityRecord) throw fail('APS7_PUBLISHED_KNOWLEDGE_AUTHORITY_MISSING', `${outcome.nodeCode}:${outcome.locale}`);
        const presentation = buildCprArticleOnlyProjection({ authorityRecord, publication: outcome.publication, packageRecord: outcome.packageRecord });
        const cprRel = cprPath(outcome.nodeCode, outcome.locale);
        const cprState = await ensureText(root, cprRel, stable(presentation), { apply: true });
        const article = buildPublicVisualArticle({ publication: outcome.publication, authorityRecord, reviewEntry: outcome.reviewEntry, presentation });
        const articleRel = visualArticlePath(outcome.locale, outcome.publication.article.slug);
        const articleState = await ensureText(root, articleRel, stable(article), { apply: true });
        const routeRel = `articles/${outcome.publication.article.slug}.html`;
        const routeState = await ensureText(root, routeRel, buildArticleHtml(article), { apply: true });
        const manifestRecord = {
          nodeCode: outcome.nodeCode,
          locale: outcome.locale,
          slug: outcome.publication.article.slug,
          href: outcome.publication.article.href,
          path: `/${articleRel}`,
          authorityPath: `content/knowledge/public/authority/articles/${outcome.locale}/${outcome.nodeCode}.json`,
          presentationPath: cprRel,
          carState: 'NOT_REQUIRED_NO_VISUAL_ASSET',
          status: 'published'
        };
        const manifestState = await ensureManifestRecord(root, manifestRecord, { apply: true });
        Object.assign(outcome, { publicReleaseCreated: true, authorityRecordCode: authorityRecord.authorityRecordCode, cprPath: cprRel, cprState, visualArticlePath: articleRel, articleState, routePath: routeRel, routeState, manifestState, carState: manifestRecord.carState });
      }
    }
  }

  const payload = {
    schemaVersion: APS7_SCHEMA_VERSION,
    work: 'APS-7', baselineCommit: APS7_BASELINE, batchCode,
    status: publicationOutcomes.every(item => item.decision === 'publish') ? 'PUBLICATION_ORCHESTRATION_COMPLETED' : 'PUBLICATION_ORCHESTRATION_COMPLETED_WITH_NON_PUBLISH_OUTCOMES',
    humanDecisionCount: built.bridge.humanDecisionCount,
    publishAuthorizedCount: publicationOutcomes.filter(item => item.decision === 'publish').length,
    deferCount: publicationOutcomes.filter(item => item.decision === 'defer').length,
    doNotPublishCount: publicationOutcomes.filter(item => item.decision === 'do_not_publish').length,
    pjaFrozenImplementationDigestPreserved: true,
    w11Applied: apply,
    outcomes: publicationOutcomes.map(item => ({
      nodeCode: item.nodeCode, locale: item.locale, decision: item.decision,
      publicationCreated: item.publicationCreated, publicationPath: item.publicationPath ?? null,
      publicReleaseCreated: item.publicReleaseCreated ?? false, authorityRecordCode: item.authorityRecordCode ?? null,
      carState: item.carState ?? (item.decision === 'publish' ? 'PENDING_APPLY' : 'NOT_APPLICABLE'),
      cprPath: item.cprPath ?? null, visualArticlePath: item.visualArticlePath ?? null, routePath: item.routePath ?? null
    })),
    governance: {
      explicitTlDecisionRequired: true,
      w11AuthorityReused: true,
      frozenPjaPublicationImplementationMutated: false,
      frozenBriefSuccessorValidationUsed: true,
      carAuthorityCreatedByAps: false,
      carBypassAllowedWhenVisualAssetRequired: false,
      cprCompositionAuthorityPreserved: true,
      localeAuthorityInheritanceAllowed: false,
      sameRouteLocaleReleaseRequired: true
    }
  };
  const result = { ...payload, runDigest: aps6Digest(payload) };
  if (apply) await atomicWrite(path.join(root, publicationRunPath(batchCode)), stable(result), { replace: true });
  return { result, bridge: built.bridge, w11, authority };
}

export { publicationRunPath, cprPath, visualArticlePath, buildCprArticleOnlyProjection, buildPublicVisualArticle, buildArticleHtml };
