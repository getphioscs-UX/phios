import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildVisualArticleReleaseCandidate } from './article-release-v1.mjs';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const executionPaths = {
  authority: 'content/production/visual-article/release/authority/VAP-W26-KN-PREFACE-001-ZH-HANS.json',
  publicArticle: 'content/knowledge/public/visual-articles/zh-Hans/ai-formation-from-civilizational-capability.json',
  manifest: 'content/knowledge/public/visual-article-release.json',
  route: 'articles/ai-formation-from-civilizational-capability.html',
  website: 'content/production/visual-article/release/website/VAP-W27-KN-PREFACE-001-ZH-HANS.json'
};

function markdownSections(markdown) {
  const sections = []; let current = null;
  for (const chunk of markdown.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean)) {
    const heading = chunk.match(/^#{2,3}\s+(.+)$/)?.[1];
    if (heading) { current = { heading, blocks: [] }; sections.push(current); continue; }
    if (/^#\s+/.test(chunk)) continue;
    if (!current) { current = { heading: '人工智能并不是凭空出现的智慧', blocks: [] }; sections.push(current); }
    current.blocks.push({ type: 'paragraph', text: chunk.replace(/\n/g, ' ') });
  }
  const target = sections[Math.min(1, sections.length - 1)];
  target.blocks.push({ type: 'figure', assetCode: 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002', displayMode: 'wide' });
  const boundary = sections.at(-1);
  boundary.blocks.push({ type: 'insight', heading: '能力与责任必须保持区分', statement: '能力增加 ≠ 方向出现 ≠ 价值判断 ≠ 责任主体' });
  return sections;
}

export function buildArticleReleaseExecution() {
  const w25 = buildVisualArticleReleaseCandidate({ root });
  if (w25.status !== 'READY_FOR_RELEASE') throw new Error(`VAP_W26_REQUIRES_READY_W25:${w25.status}`);
  const article = read('content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json');
  const figure = read('content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.json');
  const presentation = read('content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v2.json');
  const figureReference = { assetCode: figure.assetCode, publishedAssetCode: figure.publishedAssetCode, publicationCode: figure.carPublicationRecord.publicationCode, publicationDigest: figure.carPublicationRecord.publicationDigest, publicSrc: figure.publicSrc, placement: 'after_fragment:FRAGMENT-KN-PREFACE-001-ZH-HANS-006', presentationCode: presentation.presentationCode };
  const authorityBody = {
    schemaVersion: 'PHI-OS-VAP-PUBLISHED-KNOWLEDGE-AUTHORITY-v1.0.0', work: 'VAP-W26', status: 'EXECUTED', executionPerformed: true,
    nodeCode: article.nodeCode, locale: article.locale, title: article.article.title, summary: article.article.summary,
    body: article.article.bodyMarkdown, figureReferences: [figureReference], href: article.article.href,
    slug: article.article.slug, version: article.article.version, lineage: { ...article.lineage, carApprovalCode: figure.carPublicationRecord.approvalCode, carPublicationCode: figure.carPublicationRecord.publicationCode, presentationCode: presentation.presentationCode },
    sourceAuthorityCode: article.authorityRecordCode, sourceAuthorityDigest: article.authorityDigest,
    governance: { knowledgeContentMutated: false, figureAuthorityOwnedByCAR: true, presentationAuthorityOwnedByCPR: true }
  };
  const authority = { ...authorityBody, projectionDigest: digest(authorityBody) };
  const publicArticle = {
    schemaVersion: 'PHI-OS-PUBLIC-VISUAL-ARTICLE-v1.0.0', assetCode: article.article.articleCode, nodeCode: article.nodeCode,
    locale: article.locale, slug: article.article.slug, publicHref: article.article.href, title: article.article.title,
    summary: article.article.summary, answer: article.article.summary, publicationOrder: 1, contentStatus: 'content_reviewed', reviewStatus: 'approved', publicationStatus: 'published',
    version: article.article.version, sections: markdownSections(article.article.bodyMarkdown),
    visualAssets: [{ assetCode: figure.assetCode, assetType: 'mechanism_diagram', publicSrc: figure.publicSrc, altText: figure.altText, caption: figure.altText, width: figure.width, height: figure.height, publicProjection: true }],
    figureReferences: authority.figureReferences, provenance: { bookCode: 'BOOK-1', partCode: 'P0', nodeCode: article.nodeCode, locale: article.locale, version: article.article.version, lineage: authority.lineage },
    seo: { title: `${article.article.title}｜PHI OS Knowledge`, description: article.article.summary }
  };
  const manifest = { schemaVersion: 'PHI-OS-PUBLIC-VISUAL-ARTICLE-RELEASE-v1.0.0', records: [{ nodeCode: article.nodeCode, locale: article.locale, slug: article.article.slug, href: article.article.href, path: `/${executionPaths.publicArticle}`, authorityPath: executionPaths.authority, status: 'published' }] };
  const route = `<!doctype html>\n<html lang="zh-Hans">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="description" content="${article.article.summary.replaceAll('"','&quot;')}">\n  <title>${article.article.title}｜PHI OS Knowledge</title>\n  <link rel="canonical" href="https://phios-github.pages.dev${article.article.href}">\n  <link rel="stylesheet" href="/assets/css/tokens.css">\n  <link rel="stylesheet" href="/assets/css/design/foundation.css">\n  <link rel="stylesheet" href="/assets/css/design/typography.css">\n  <link rel="stylesheet" href="/assets/css/public-experience.css">\n  <link rel="stylesheet" href="/assets/css/article-renderer.css">\n  <link rel="stylesheet" href="/assets/css/pds-w9-knowledge-professional.css">\n</head>\n<body class="knowledge-page" data-public-section="knowledge" data-page="knowledge-article">\n  <a class="skip-link" href="#article-main">跳至主要内容</a>\n  <header data-public-header-placeholder></header>\n  <main id="article-main" class="knowledge-article-shell" data-wpr-production-surface="ARTICLE" data-article-slug="${article.article.slug}" aria-busy="true"></main>\n  <footer data-public-footer-placeholder></footer>\n  <script type="module" src="/assets/js/public-shell.js"></script>\n  <script type="module" src="/assets/js/pages/article.js"></script>\n</body>\n</html>\n`;
  const websiteBody = { schemaVersion: 'PHI-OS-VAP-WEBSITE-ARTICLE-RELEASE-v1.0.0', work: 'VAP-W27', status: 'EXECUTED', executionPerformed: true, nodeCode: article.nodeCode, locale: article.locale, slug: article.article.slug, href: article.article.href, routePath: executionPaths.route, publicArticlePath: executionPaths.publicArticle, authorityProjectionPath: executionPaths.authority, publishedAssetPath: figure.publicSrc, deploymentPerformed: false, productionUrl: `https://phios-github.pages.dev${article.article.href}`, nextGate: 'VAP-W28_PRODUCTION_VISUAL_ACCEPTANCE_AFTER_DEPLOYMENT' };
  const website = { ...websiteBody, releaseDigest: digest(websiteBody) };
  return { authority, publicArticle, manifest, route, website };
}

export function writeArticleReleaseExecution() {
  const output = buildArticleReleaseExecution();
  for (const [key, relative] of Object.entries(executionPaths)) { const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, key === 'route' ? output[key] : `${JSON.stringify(output[key], null, 2)}\n`); }
  return output;
}
