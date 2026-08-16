import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { publishAbl } from './lib/article-bilingual-production/abl-v1.mjs';
import { makeFixtureRoot, removeFixtureRoot, progressFixtureTo, json, shaFile, verifyKnrL10nFreeze, runChecker } from './lib/article-bilingual-production/check-fixture-v1.mjs';
const source = process.cwd(); const fixture = makeFixtureRoot(source, 'abl5');
const visualManifest = 'content/knowledge/public/visual-article-release.json';
const freeze = json(source, 'content/production/article-simplification/bilingual/freeze/abl-5-production-freeze-v1.json');
const acceptance = json(source, 'content/production/article-simplification/bilingual/acceptance/abl-5-production-acceptance-v1.json');
assert.equal(freeze.status, 'ABL_BILINGUAL_BATCH_PRODUCTION_CAPABILITY_FROZEN');
assert.equal(acceptance.status, 'ACCEPTED_CAPABILITY_CURRENT_BATCH_AWAITING_TL_IDENTITY_REVIEW');
for (const [relative, expected] of Object.entries(freeze.immutableAblDigests)) assert.equal(shaFile(path.join(source, relative)), expected, `ABL-5 frozen implementation digest mismatch: ${relative}`);
const packageJson = json(source, 'package.json');
assert.equal(packageJson.scripts['article:bilingual'], 'node scripts/article-bilingual.mjs');
assert.equal(packageJson.scripts['article:bilingual:publish'], 'node scripts/article-bilingual-publish.mjs');
assert.match(packageJson.scripts['check:abl'], /check:abl-1/);
const sharedLoader = fs.readFileSync(path.join(source, 'assets/js/knowledge/published-content.js'), 'utf8');
assert.match(sharedLoader, /abl-bilingual-release\.json/);
const pkaChecker = fs.readFileSync(path.join(source, 'scripts/check-step63-published-knowledge-authority.mjs'), 'utf8');
assert.match(pkaChecker, /abl5RunPath/);
assert.equal(shaFile(path.join(source, 'scripts/lib/knowledge-production/english-brief-v1.mjs')), freeze.historicalDrift.baseline25ab44bEnglishBriefSha256);
try {
  const protectedPaths = [
    'content/knowledge/production/registry/publication-registry.json',
    'content/knowledge/public/authority/published-knowledge-authority.json',
    'content/knowledge/public/abl-bilingual-release.json',
    visualManifest
  ];
  const beforeBlocked = new Map(protectedPaths.map(relative => [relative, shaFile(path.join(fixture, relative))]));
  let blockedCode = null;
  try { await publishAbl(fixture, 'BATCH-001', { apply: true }); } catch (error) { blockedCode = error.code; }
  assert.equal(blockedCode, 'ABL5_EXPLICIT_ENGLISH_HUMAN_DECISIONS_REQUIRED');
  for (const relative of protectedPaths) assert.equal(shaFile(path.join(fixture, relative)), beforeBlocked.get(relative), `Blocked ABL-5 changed protected publication state: ${relative}`);
  const ready = await progressFixtureTo(fixture, 'ABL-4'); assert.equal(ready.status, 'READY_FOR_ABL_5_PUBLICATION');
  const batch = json(fixture, 'content/production/article-simplification/batches/BATCH-001/batch-plan.v1.json');
  const l10n = json(fixture, 'content/knowledge/l10n/multilingual-node-projection-registry.json');
  const routes = new Map();
  for (const entry of batch.entries) { const lr=l10n.records.find(x=>x.nodeCode===entry.nodeCode); const slug=lr.locales['zh-Hans'].slug; routes.set(slug,shaFile(path.join(fixture,`articles/${slug}.html`))); }
  const frozenVisualDigest = shaFile(path.join(fixture, visualManifest));
  const first = await publishAbl(fixture, 'BATCH-001', { apply: true });
  assert.equal(first.publishAuthorizedCount, 6); assert.equal(first.outcomes.every(x => x.publicationCreated && x.publicReleaseCreated && x.locale === 'en' && x.carState === 'NOT_REQUIRED_NO_VISUAL_ASSET'), true);
  const second = await publishAbl(fixture, 'BATCH-001', { apply: true }); assert.equal(second.runDigest, first.runDigest);
  assert.equal(shaFile(path.join(fixture, visualManifest)), frozenVisualDigest);
  const manifest = json(fixture, 'content/knowledge/public/abl-bilingual-release.json'); assert.equal(manifest.records.filter(x=>x.locale==='en'&&x.source==='ABL-5').length, 6);
  const pka = json(fixture, 'content/knowledge/public/authority/published-knowledge-authority.json'); assert.equal(pka.recordCount, 14);
  for (const outcome of first.outcomes) {
    assert.equal(routes.get(path.basename(outcome.routePath, '.html')), shaFile(path.join(fixture,outcome.routePath)));
    const article = json(fixture, outcome.visualArticlePath); assert.equal(article.locale,'en'); assert.equal(article.slug, path.basename(outcome.routePath,'.html')); assert.equal(/[\u3400-\u9FFF\uF900-\uFAFF]/u.test(JSON.stringify({title:article.title,summary:article.summary,sections:article.sections,seo:article.seo})), false);
  }
  const loader = fs.readFileSync(path.join(fixture,'assets/js/knowledge/published-content.js'),'utf8'); assert.match(loader,/abl-bilingual-release\.json/); assert.match(loader,/record\.locale === normalizedLocale/);
  verifyKnrL10nFreeze(fixture);
  assert.match(runChecker(fixture,'scripts/check-vap-l10n-r1-r5.mjs'),/VAP-L10N-R5/);
  assert.match(runChecker(fixture,'scripts/check-pja-publication-w1-runtime.mjs'),/Publication Contract passed/);
  assert.match(runChecker(fixture,'scripts/check-step63-published-knowledge-authority.mjs'),/ABL-5 successor publication authority/);
  assert.match(runChecker(fixture,'scripts/check-published-article-format-reconciliation.mjs'),/Published Article Format reconciliation passed/);
  console.log('✓ ABL-5 Bilingual Publication + Same-Route Release Successor passed.');
  console.log('✓ ABL-1～ABL-5 capability acceptance/freeze digests and shared successor semantics passed.');
  console.log('✓ ABL-5 fail-closed path creates no Publication / PKA / release-manifest authority before explicit English Human decisions.');
  console.log('✓ Six English publications add PJA Publication → PKA → CPR → public article projections without changing the six existing zh-Hans route files.');
  console.log('✓ Frozen VAP-L10N manifest remains byte-identical; additive ABL manifest is merged by public runtime locale selection.');
  console.log('✓ ABL-5 rerun is idempotent and CAR remains NOT_REQUIRED only because these six article packages contain no visual asset.');
} finally { removeFixtureRoot(fixture); }
