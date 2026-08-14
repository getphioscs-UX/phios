import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, PATHS, HREF, SLUG, containsCjk, digest, fileDigest, humanGateState,
  buildR1Authority, buildR2Projection, buildR3Presentation, buildR4VisualArticle,
  buildR5Acceptance, buildR5Freeze, presentationDigest, readJson
} from './lib/visual-article-production/vap-l10n-r1-r5-v1.mjs';

const required = [PATHS.successorAuthority, PATHS.carProjection, PATHS.cprPresentation, PATHS.cprRegistryV3, PATHS.visualArticle, PATHS.r5Acceptance, PATHS.r5Freeze];
for (const relative of required) assert.equal(fs.existsSync(path.join(ROOT, relative)), true, `missing ${relative}`);

const gates = humanGateState(ROOT);
assert.equal(gates.review.accepted, true, 'R1 Human Review must be ACCEPT');
assert.equal(gates.approval.approved, true, 'R1 Human Approval must be APPROVE');
assert.equal(gates.publication.published, true, 'R1 Human Publication decision must be PUBLISH');

const r1 = readJson(ROOT, PATHS.successorAuthority);
const expectedR1 = buildR1Authority(ROOT);
assert.deepEqual(r1, expectedR1);
assert.equal(r1.article.slug, SLUG);
assert.equal(r1.article.href, HREF);
assert.equal(containsCjk(JSON.stringify(r1.article)), false);
const predecessor = readJson(ROOT, PATHS.predecessorAuthority);
assert.equal(r1.lineage.predecessorAuthorityDigest, predecessor.authorityDigest);

const r2 = readJson(ROOT, PATHS.carProjection);
assert.deepEqual(r2, buildR2Projection(ROOT, { active: true }));
assert.equal(r2.physicalMedia.sharedPhysicalMedia, true);
assert.equal(r2.physicalMedia.binaryDuplicated, false);
assert.equal(r2.physicalMedia.generationPerformed, false);
assert.equal(r2.physicalMedia.publicSrc, readJson(ROOT, PATHS.zhFigure).publicSrc);
assert.equal(containsCjk(r2.accessibilityProjection.altText + r2.accessibilityProjection.caption), false);

const r3 = readJson(ROOT, PATHS.cprPresentation);
assert.deepEqual(r3, buildR3Presentation(ROOT, { active: true }));
assert.equal(r3.presentationIdentity, readJson(ROOT, PATHS.zhPresentation).presentationIdentity);
assert.deepEqual(r3.pdsReferences, readJson(ROOT, PATHS.zhPresentation).pdsReferences);
assert.deepEqual(r3.responsiveProjection, readJson(ROOT, PATHS.zhPresentation).responsiveProjection);
assert.equal(r3.renderState, 'ready_for_render');
const registryV3 = readJson(ROOT, PATHS.cprRegistryV3);
assert(registryV3.productionRecords.some(record => record.presentationCode === r3.presentationCode && record.presentationDigest === presentationDigest(r3)));

const r4 = readJson(ROOT, PATHS.visualArticle);
assert.deepEqual(r4, buildR4VisualArticle(ROOT, { active: true }));
assert.equal(r4.slug, SLUG);
assert.equal(r4.publicHref, HREF);
assert.equal(r4.locale, 'en');
assert.equal(r4.publicationStatus, 'published');
assert.equal(containsCjk(JSON.stringify({title:r4.title,summary:r4.summary,sections:r4.sections,seo:r4.seo})), false);
assert.equal(r4.visualAssets[0].publicSrc, readJson(ROOT, PATHS.zhFigure).publicSrc);

const manifest = readJson(ROOT, PATHS.visualManifest);
const zh = manifest.records.find(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'zh-Hans');
const en = manifest.records.find(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'en');
assert(zh && en);
assert.equal(zh.slug, en.slug);
assert.equal(zh.href, en.href);
assert.equal(en.status, 'published');

const route = fs.readFileSync(path.join(ROOT, PATHS.route), 'utf8');
const articleJs = fs.readFileSync(path.join(ROOT, PATHS.articlePage), 'utf8');
const publishedContent = fs.readFileSync(path.join(ROOT, PATHS.publishedContent), 'utf8');
assert(route.includes(`data-article-slug="${SLUG}"`));
assert(/getLocale\(\)/.test(articleJs));
assert(/record\.locale === normalizedLocale/.test(publishedContent));
assert(/visualArticles/.test(publishedContent));

const acceptance = readJson(ROOT, PATHS.r5Acceptance);
assert.deepEqual(acceptance, buildR5Acceptance(ROOT, { successorAuthority:r1, carProjection:r2, presentation:r3, visualArticle:r4 }));
const freeze = readJson(ROOT, PATHS.r5Freeze);
assert.deepEqual(freeze, buildR5Freeze(acceptance));
assert.equal(freeze.status, 'FROZEN');
assert.equal(freeze.governance.zhHansFrozenVerticalSliceMutated, false);
assert.equal(freeze.governance.predecessorEnglishAuthorityMutated, false);

console.log('✓ VAP-L10N-R1 English Article Successor Authority passed.');
console.log('✓ VAP-L10N-R2 Shared Physical Figure / EN CAR Projection passed.');
console.log('✓ VAP-L10N-R3 EN CPR Production Presentation passed.');
console.log('✓ VAP-L10N-R4 EN Visual Article Projection passed.');
console.log('✓ VAP-L10N-R5 Same-Route Locale Acceptance & Freeze passed.');
console.log(`✓ Same canonical route: ${HREF} → zh-Hans / en by runtime locale.`);
