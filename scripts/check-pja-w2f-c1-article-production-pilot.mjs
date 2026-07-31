import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ARTICLE_PACKAGE_FILES,
  ARTICLE_STATES,
  parseProductionBrief
} from './lib/knowledge-production/article-package.mjs';
import { validateArticleDraftPackage } from './lib/knowledge-production/article-validator.mjs';
import {
  compileReadinessSchema,
  loadKnowledgeInventory,
  readReadiness,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';
import { evaluateArticleEligibility } from './lib/knowledge-production/article-package.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const nodeCode = 'KN-PREFACE-001';
const locale = 'zh-Hans';
const packageDirectory = path.join(
  root,
  'content/knowledge/production/articles/kn-preface-001/zh-Hans/1.0.0'
);
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

assert.equal(
  packageJson.scripts['check:pja-w2f-c1'],
  'npm run check:pja-w2f-b2b && node scripts/check-pja-w2f-c1-article-production-pilot.mjs'
);

const knowledge = await loadKnowledgeInventory(root);
const [item] = resolveKnowledgeScope(knowledge, { nodeCode });
const schema = await compileReadinessSchema(root);
const loaded = await readReadiness(root, item, locale);
const assessment = validateReadinessRecord(item, loaded, schema);
const eligibility = evaluateArticleEligibility(item, loaded, assessment, locale);
assert.equal(eligibility.articleProductionEligibility, 'eligible');
assert.equal(eligibility.humanEditorialFreeze, true);
assert.equal(eligibility.productionState, 'production_ready');

const files = (await fs.readdir(packageDirectory)).sort();
assert.deepEqual(files, [...ARTICLE_PACKAGE_FILES].sort());

const article = JSON.parse(await fs.readFile(path.join(packageDirectory, 'article.json'), 'utf8'));
const claims = JSON.parse(await fs.readFile(path.join(packageDirectory, 'claim-ledger.json'), 'utf8'));
const sources = JSON.parse(await fs.readFile(path.join(packageDirectory, 'source-ledger.json'), 'utf8'));
const coverage = JSON.parse(await fs.readFile(path.join(packageDirectory, 'supporting-question-coverage.json'), 'utf8'));
const media = JSON.parse(await fs.readFile(path.join(packageDirectory, 'media-brief.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(packageDirectory, 'package-manifest.json'), 'utf8'));

assert.equal(article.canonicalNodeCode, nodeCode);
assert.equal(article.locale, locale);
assert.equal(article.articleVersion, '1.0.0');
assert.equal(article.articleState, ARTICLE_STATES.article);
assert.equal(article.reviewState, ARTICLE_STATES.review);
assert.equal(article.approvalState, ARTICLE_STATES.approval);
assert.equal(article.publicationState, ARTICLE_STATES.publication);
assert(article.sections.length >= 7);
assert(claims.claims.length > 0);
assert(sources.sources.length > 0);
assert(coverage.questions.length === 2);
assert.equal(media.assetState, 'not_created');
assert.equal(media.assetCode, null);
assert.equal(media.articleFigureState, 'deferred');
assert.equal(manifest.packageStatus, 'draft');
assert.equal(manifest.status, 'draft');
assert.equal(manifest.productionBriefHash, article.productionBriefHash);

for (const claim of claims.claims) {
  assert.notEqual(claim.reviewState, 'approved');
}
for (const source of sources.sources) {
  assert.equal(source.verificationState, 'not_verified');
  assert.equal(source.reviewState, 'not_reviewed');
}

const temporary = path.join(root, '.tmp/pja-w2f-c1-check');
await fs.rm(temporary, { recursive: true, force: true });
await fs.mkdir(temporary, { recursive: true });
try {
  const briefDirectory = path.join(temporary, 'brief');
  await execFileAsync(process.execPath, [
    'scripts/export-knowledge-production-brief.mjs',
    nodeCode,
    '--output',
    briefDirectory
  ], { cwd: root, windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
  const brief = parseProductionBrief(await fs.readFile(
    path.join(briefDirectory, `${nodeCode}-production-brief.md`),
    'utf8'
  ));
  assert.equal(brief.productionBriefHash, article.productionBriefHash);
  const validation = await validateArticleDraftPackage({
    packageDirectory,
    nodeCode,
    locale,
    brief,
    eligibility
  });
  assert.equal(validation.valid, true, validation.errors.join('; '));
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}

await assert.rejects(
  fs.access(path.join(root, 'content/knowledge/production/articles/kn-preface-001/en'))
);
assert.equal(
  knowledge.inventory.filter(entry => entry.nodeCode !== nodeCode)
    .every(entry => entry.nodeCode.startsWith('KN-PREFACE-')),
  true
);

console.log('✓ PJA-W2F-C1 Article Production Contract and Preface Pilot passed.');
console.log('  KN-PREFACE-001 generated one governed zh-Hans Draft Package version 1.0.0.');
console.log('  Article, Claim, Source, Supporting Question, Media and Manifest contracts validate.');
console.log('  States remain draft, not_reviewed, not_approved and not_publication_ready.');
console.log('  No English package, approval, publication, Registry asset or Runtime integration was created.');
console.log('  State: PJA-W2F-C1-v1.0.0-Pilot-Ready-for-Human-Review.');
