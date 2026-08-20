import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const exists = path => fs.existsSync(path);
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;

const paths = Object.freeze({
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w2-hero-production-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w2-hero-production-composition-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w2-hero-production-composition-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w2-hero-production-composition-freeze-v1.json',
  sceneRegistry: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  w1Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w1-narrative-scene-authority-freeze-v1.json',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  v8Source: 'content/web/homepage/hpc2/sources/PHIOS-market-positioning-founder-v8-no-pricing.html',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  humanAssetReview: 'content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json',
  routeRegistry: 'content/web-production/registries/wpr-route-registry-v1.1.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(exists(path), `Missing HPC2-W2 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const sceneRegistry = read(paths.sceneRegistry);
const w1Freeze = read(paths.w1Freeze);
const v8Manifest = read(paths.v8Manifest);
const publicAssets = read(paths.publicAssets);
const visualRegistry = read(paths.visualRegistry);
const humanAssetReview = read(paths.humanAssetReview);
const routeRegistry = read(paths.routeRegistry);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);
const v8Source = text(paths.v8Source);

assert.equal(contract.work, 'HPC2-W2');
assert.equal(contract.baselineCommit, 'efc6c556107008cea495c2231e98f179436bd088');
assert.equal(contract.status, 'H01_HERO_PRODUCTION_COMPOSITION_ACTIVE_H02_H09_DEFERRED');
assert.equal(contract.predecessorAuthority.sceneRegistry, paths.sceneRegistry);
assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.sceneRegistry));
assert.equal(contract.predecessorAuthority.w1Freeze, paths.w1Freeze);
assert.equal(contract.predecessorAuthority.relationship, 'ADDITIVE_H01_COMPOSITION_CONSUMES_W1_AUTHORITY_NO_SECOND_HOMEPAGE_RUNTIME');
assert.equal(w1Freeze.status, 'HPC2_W1_SINGLE_NARRATIVE_AND_H01_H09_AUTHORITY_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');

const h01 = sceneRegistry.scenes.find(scene => scene.sceneCode === 'H01');
assert.ok(h01);
assert.equal(sceneRegistry.scenePolicy.sceneCount, 9);
assert.deepEqual(sceneRegistry.sceneOrder, Array.from({length: 9}, (_, index) => `H0${index + 1}`));
assert.equal(h01.sceneTitle, 'Hero');
assert.equal(h01.runtimePolicy, 'NONE_BY_DESIGN_NO_RUNTIME_OR_FULL_ASK_UI_IN_HERO');
assert.equal(h01.visualAssets.length, 1);
assert.equal(h01.visualAssets[0].assetCode, 'HERO-001');
assert.equal(h01.ckaRole, 'NO_FULL_ASK_UI_AND_NO_ASK_PRIMARY');

assert.equal(count(html, /data-hpc2-scene="H01"/g), 1);
for (let scene = 2; scene <= 9; scene += 1) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="H0${scene}"`, 'g')), 0, `H0${scene} was implemented prematurely`);
}
const heroStart = html.indexOf('<section class="discover-hero hpc2-h01"');
const heroEnd = html.indexOf('</section>', heroStart);
assert.ok(heroStart >= 0 && heroEnd > heroStart, 'H01 section is missing');
const heroHtml = html.slice(heroStart, heroEnd + '</section>'.length);
assert.equal(count(heroHtml, /data-hpc2-hero="HERO-001"/g), 1);
assert.match(heroHtml, /<figure class="hpc2-hero-visual"[^>]*aria-hidden="true"><\/figure>/);
assert.doesNotMatch(heroHtml, /<img\b/i);
assert.doesNotMatch(heroHtml, /https?:\/\//i);
assert.doesNotMatch(heroHtml, /<(?:form|input|textarea|button|video|canvas)\b/i);
assert.match(heroHtml, /data-i18n="discover\.hero\.brand"/);
assert.match(heroHtml, /data-i18n="discover\.hero\.platform"/);
assert.match(heroHtml, /data-i18n="discover\.hero\.line1"/);
assert.match(heroHtml, /data-i18n="discover\.hero\.line2"/);
assert.match(heroHtml, /data-i18n="discover\.hero\.principles"/);
assert.equal(count(heroHtml, /data-hpc2-action=/g), 2);
assert.match(heroHtml, /href="\/reality-entry"[^>]*data-hpc2-action="START_WITH_MY_REALITY"/);
assert.match(heroHtml, /href="#wpr-platform-title"[^>]*data-hpc2-action="EXPLORE_PHI_OS"/);
assert.doesNotMatch(heroHtml, /ASK_PHIOS|Ask PHI OS|\/knowledge-search/i);
assert.doesNotMatch(heroHtml, /AI can answer|Reality still has to be navigated|What is actually happening in my reality/i);
assert.ok(html.includes('id="wpr-platform-title"'), 'Secondary H01 target must exist');

assert.match(css, /\.hpc2-h01\s*\{[\s\S]*?min-height:\s*94svh;/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h01\s*\{[\s\S]*?min-height:\s*92svh;/);
assert.match(css, /\.hpc2-hero-visual\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;/);
assert.match(css, /\.hpc2-hero-visual img\s*\{[\s\S]*?object-fit:\s*cover;/);
assert.match(css, /\.hpc2-h01__readability\s*\{[\s\S]*?linear-gradient/);
assert.match(css, /\.hpc2-h01__secondary\s*\{/);

assert.match(runtime, /resolveCanonicalVisual/);
assert.match(runtime, /renderAssetTarget\(heroRoot, 'HERO-001', locale, visualRegistry\)/);
assert.match(runtime, /H01_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED/);
assert.match(runtime, /H01_FAIL_CLOSED_HERO_ASSET_NOT_RENDERED/);
assert.match(runtime, /H01_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);

const publicHero = publicAssets.assets.find(asset => asset.asset_code === 'HERO-001');
assert.ok(publicHero);
assert.equal(publicHero.object_key, contract.heroAsset.objectKey);
assert.equal(publicHero.format, 'webp');
assert.equal(publicHero.content_type, 'image/webp');
assert.equal(publicHero.status, 'remote-verified');
assert.equal(publicHero.verification, 'verified-remote-head-get');
assert.equal(publicHero.width, 2560);
assert.equal(publicHero.height, 1440);
assert.equal(publicHero.aspect_ratio, '16:9');
assert.equal(publicHero.remote.http_status, 200);
assert.equal(publicHero.remote.content_type, 'image/webp');

const visualHero = visualRegistry.assets.find(asset => asset.sequence === 'HERO-001');
assert.ok(visualHero);
assert.equal(visualHero.productionSpec.masterFormat, 'WEBP');
assert.equal(visualHero.productionSpec.width, 2560);
assert.equal(visualHero.productionSpec.height, 1440);
assert.equal(visualHero.productionSpec.aspectRatio, '16:9');
assert.equal(visualHero.productionSpec.uiPolicy, 'NO_FAKE_UI');
assert.equal(visualHero.productionSpec.logoPolicy, 'NO_LOGO');
assert.equal(visualHero.productionSpec.ctaPolicy, 'HTML_OWNS_CTA');
assert.equal(visualHero.productionSpec.localeMode, 'NEUTRAL');
for (const forbidden of ['LONG_COPY', 'BUTTON', 'FAKE_UI', 'LOGO', 'EMBEDDED_CTA']) {
  assert.ok(visualHero.forbiddenElements.includes(forbidden), `HERO-001 missing forbidden element policy: ${forbidden}`);
}
assert.equal(contract.heroAsset.visualPolicy.embeddedText, 'FORBIDDEN');
assert.equal(contract.heroAsset.visualPolicy.language, 'LOCALE_NEUTRAL');
assert.equal(contract.heroAsset.existingResolverReused, true);
assert.equal(contract.heroAsset.secondResolverCreated, false);

const heroHumanReview = humanAssetReview.records.find(record => record.assetCode === 'HERO-001');
assert.ok(heroHumanReview);
assert.equal(heroHumanReview.decision, 'ACCEPTED');
assert.equal(heroHumanReview.visualAssetAcceptedOnly, true);
assert.equal(heroHumanReview.routeActivated, false);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w2`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w2`)).default;
assert.deepEqual(
  Object.fromEntries(['brand', 'platform', 'line1', 'line2', 'principles'].map(key => [key, en.discover.hero[key]])),
  contract.copy.en
);
assert.deepEqual(
  Object.fromEntries(['brand', 'platform', 'line1', 'line2', 'principles'].map(key => [key, zh.discover.hero[key]])),
  contract.copy['zh-Hans']
);
assert.equal(en.discover.hero.primary, 'Start with my reality');
assert.equal(en.discover.hero.secondary, 'Explore PHI OS');
assert.equal(zh.discover.hero.primary, '从我的现实开始');
assert.equal(zh.discover.hero.secondary, '探索 PHI OS');

const realityEntryRoute = routeRegistry.entries.find(route => route.path === '/reality-entry');
assert.ok(realityEntryRoute);
assert.equal(realityEntryRoute.implementationState, 'EXISTING');
assert.equal(contract.ctaHierarchy[0].destination, '/reality-entry');
assert.equal(contract.ctaHierarchy[0].activatesRealityCandidateRoute, false);
assert.equal(contract.ctaHierarchy[1].destination, '#wpr-platform-title');
assert.equal(contract.ctaHierarchy[1].activatesRoute, false);
assert.equal(contract.ctaBoundary.primaryCount, 1);
assert.equal(contract.ctaBoundary.secondaryCount, 1);
assert.equal(contract.ctaBoundary.askPhiosPresent, false);
assert.equal(contract.ctaBoundary.askPhiosPrimary, false);
assert.equal(contract.ctaBoundary.candidateRealityRouteActivated, false);

for (const phrase of [
  'AI can answer.',
  'Reality still has to be navigated.',
  'What is actually happening in my reality—and what should I do next?'
]) assert.ok(v8Source.includes(phrase), `V8 source phrase was deleted: ${phrase}`);
for (const blockCode of ['V8-HERO-001', 'V8-HERO-002']) {
  const block = v8Manifest.semanticBlocks.find(item => item.blockCode === blockCode);
  assert.ok(block);
  assert.equal(block.successorVerified, false);
  assert.equal(block.deletionAllowedFromHomepage, false);
}
assert.ok(sceneRegistry.scenes.find(scene => scene.sceneCode === 'H03').v8NarrativeLineage.includes('V8-HERO-001'));
assert.equal(contract.v8HeroMigrationBoundary.manifestRewritten, false);
assert.equal(contract.v8HeroMigrationBoundary.successorVerifiedPromotions, 0);
assert.equal(contract.v8HeroMigrationBoundary.deletionAllowedPromotions, 0);
assert.equal(contract.v8HeroMigrationBoundary.reservations[0].reservedDestination, 'H03_CATEGORY_TRANSITION');
assert.deepEqual(contract.v8HeroMigrationBoundary.reservations[1].reservedDestinations, ['/about/why-phios', 'REALITY_JOURNEY_ORIENTATION_PROMPT']);

assert.equal(evidence.status, 'H01_SOURCE_AND_RUNTIME_COMPOSITION_VERIFIED_HUMAN_BROWSER_ACCEPTANCE_NOT_CREATED');
assert.deepEqual(evidence.implementationObservations.sceneMarkers, { h01: 1, h02ThroughH09: 0 });
assert.equal(evidence.implementationObservations.resolverImportsAdded, 0);
assert.equal(evidence.implementationObservations.directR2UrlsAddedToHomepageConsumer, 0);
assert.equal(evidence.implementationObservations.fakeUiElementsInHero, 0);
assert.equal(evidence.routeObservations.candidateRealityRouteActivatedByW2, false);
assert.equal(evidence.v8Observations.manifestSuccessorVerifiedChanged, false);
assert.equal(evidence.v8Observations.manifestDeletionAllowedChanged, false);
assert.equal(evidence.w3BoundaryObservation.oneRealitySceneImplemented, false);
assert.equal(evidence.w3BoundaryObservation.privateCaseDataPresentOnHomepage, false);
assert.equal(evidence.verificationBoundary.humanVisualAcceptancePerformedByThisWork, false);
assert.equal(evidence.verificationBoundary.productionAcceptanceClaimed, false);

assert.equal(acceptance.state, 'HPC2_W2_H01_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(acceptance.counts.implementedScenes, 1);
assert.equal(acceptance.counts.authorizedScenes, 9);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.exitGate.repositoryImplementationAccepted, true);
assert.equal(acceptance.exitGate.globalHomepageProductionAccepted, false);
assert.equal(acceptance.nextWork, 'HPC2-W3_ONE_REALITY_COMPOSITION');

assert.equal(freeze.status, 'HPC2_W2_H01_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W2 frozen artifact drift: ${artifact.path}`);
assert.ok(freeze.mutableConsumersExcludedFromWholeFileDigestFreeze.includes(paths.index));
assert.equal(freeze.structuralFreeze.h01MayBeChangedOnlyByVersionedSuccessor, true);
assert.equal(freeze.structuralFreeze.laterSceneCompositionMayExtendSharedConsumerFiles, true);
assert.equal(freeze.frozenPolicies.askHeroPrimaryForbidden, true);
assert.equal(freeze.frozenPolicies.thirdPrimaryActionForbidden, true);
assert.equal(freeze.frozenPolicies.directR2UrlBypassForbidden, true);
assert.equal(freeze.frozenPolicies.secondAssetResolverForbidden, true);
assert.equal(freeze.preservedBoundaries.h02H09Implemented, false);
assert.equal(freeze.preservedBoundaries.realityCandidateRouteActivated, false);
assert.equal(freeze.preservedBoundaries.humanVisualAcceptanceCreated, false);
assert.equal(freeze.successorRules.nextWork, 'HPC2-W3_ONE_REALITY_COMPOSITION');
assert.equal(freeze.successorRules.w3MayNotUsePrivateCaseDataOnPublicHomepage, true);

assert.equal(pkg.scripts['check:hpc2-w2'], 'node scripts/check-hpc2-w2.mjs');
assert.equal(pkg.scripts['check:hpc2-pre-frozen'], 'node scripts/check-hpc2-pre.mjs');
assert.equal(pkg.scripts['check:hpc2-pre'], 'node scripts/check-hpc2-pre-current.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w2'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w2'));

console.log('HPC2-W2 Hero Production Composition: ACCEPTED (repository implementation)');
console.log('  H01: 1/9 implemented; H02-H09 remain deferred');
console.log('  visual: HERO-001 via existing resolver; full bleed 94/92svh; gradient + HTML locale copy/CTA');
console.log('  CTA: 1 primary + 1 secondary; Ask primary = 0; /reality/ activations = 0');
console.log('  V8: HERO-001/HERO-002 preserved and reserved; successor/deletion promotions = 0');
console.log('  Human/browser acceptance: pending; no decision fabricated');
