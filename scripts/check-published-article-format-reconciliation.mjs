import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(read(relative));

const referencePath = 'articles/why-phi-os-is-needed.html';
const reference = read(referencePath);
const requiredShellTokens = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  '/assets/css/tokens.css',
  '/assets/css/design/foundation.css',
  '/assets/css/design/typography.css',
  '/assets/css/public-experience.css',
  '/assets/css/knowledge-release.css',
  '/assets/css/article-renderer.css',
  '/assets/css/pds-w9-knowledge-professional.css',
  '/assets/css/wpr-public-production.css',
  'data-i18n="knowledge.common.skip"',
  'class="knowledge-article-shell"',
  'data-wpr-production-surface="ARTICLE"',
  '/assets/js/public-shell.js',
  '/assets/js/pages/article.js'
];

for (const token of requiredShellTokens) {
  assert(reference.includes(token), `REFERENCE_SHELL_MISSING:${token}`);
}

const articleDir = path.join(root, 'articles');
const articleRoutes = fs.readdirSync(articleDir)
  .filter(name => name.endsWith('.html'))
  .sort();

for (const name of articleRoutes) {
  const html = read(`articles/${name}`);
  for (const token of requiredShellTokens) {
    assert(html.includes(token), `ARTICLE_SHELL_DRIFT:${name}:${token}`);
  }
  assert(
    html.indexOf('/assets/css/knowledge-release.css') < html.indexOf('/assets/css/article-renderer.css'),
    `ARTICLE_STYLE_ORDER_INVALID:${name}`
  );
}

const releaseGenerator = read('scripts/lib/visual-article-production/article-release-execution-v1.mjs');
for (const token of requiredShellTokens) {
  assert(releaseGenerator.includes(token), `FUTURE_RELEASE_SHELL_DRIFT:${token}`);
}

const layoutCss = read('assets/css/knowledge-release.css');
assert(
  layoutCss.includes('.knowledge-article__layout') &&
  layoutCss.includes('width: min(960px, calc(100% - 2.5rem));'),
  'CANONICAL_ARTICLE_READING_RAIL_MISSING'
);

const repair = readJson('content/knowledge/production/repairs/en/KN-PREFACE-001/repair-candidate.v1.json');
assert.equal(repair.locale, 'en');
assert.equal(repair.status, 'READY_FOR_HUMAN_REVIEW');
assert.equal(repair.governance.candidateOnly, true);
assert.equal(repair.governance.predecessorMutationAllowed, false);
assert.equal(repair.governance.automaticPublicationForbidden, true);
assert.equal(repair.figureReuseCandidate.reusePhysicalMedia, true);
assert.equal(repair.figureReuseCandidate.authorityStatus, 'REQUIRES_EN_CAR_PROJECTION_BEFORE_PUBLIC_RELEASE');

const englishText = [
  repair.article.title,
  repair.article.summary,
  repair.article.bodyMarkdown,
  repair.figureReuseCandidate.englishAltText,
  repair.figureReuseCandidate.englishCaption
].join('\n');
assert(!/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(englishText), 'EN_REPAIR_STILL_CONTAINS_HAN_TEXT');

const manifest = readJson('content/knowledge/public/visual-article-release.json');
assert(
  !(manifest.records || []).some(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'en'),
  'EN_REPAIR_MUST_NOT_BE_AUTO_PUBLISHED_BEFORE_HUMAN_REVIEW'
);

console.log(`✓ Published Article Format reconciliation passed for ${articleRoutes.length} article routes.`);
console.log('✓ Future VAP release generator now emits the canonical published-article shell.');
console.log('✓ Canonical 960px article reading rail is present through knowledge-release.css.');
console.log('✓ KN-PREFACE-001 English mixed-locale successor is English-only and remains review-gated.');
