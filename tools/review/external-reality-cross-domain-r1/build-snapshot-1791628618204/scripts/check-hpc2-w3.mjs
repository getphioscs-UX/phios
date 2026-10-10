import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const exists = path => fs.existsSync(path);
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const digestText = value => crypto.createHash('sha256').update(value).digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const attributeValues = (source, attribute) => [...source.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map(match => match[1]);
const sceneMarkup = (source, sceneCode) => {
  const marker = `data-hpc2-scene="${sceneCode}"`;
  const markerIndex = source.indexOf(marker);
  assert.ok(markerIndex >= 0, `${sceneCode} marker missing`);
  const start = source.lastIndexOf('<section', markerIndex);
  const end = source.indexOf('</section>', markerIndex);
  assert.ok(start >= 0 && end > markerIndex, `${sceneCode} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = Object.freeze({
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w3-one-reality-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w3-one-reality-composition-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w3-one-reality-composition-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w3-one-reality-composition-freeze-v1.json',
  sceneRegistry: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  w2Contract: 'content/web/homepage/hpc2/contracts/hpc2-w2-hero-production-composition-contract-v1.json',
  w2Evidence: 'content/web/homepage/hpc2/evidence/hpc2-w2-hero-production-composition-audit-v1.json',
  w2Acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w2-hero-production-composition-acceptance-v1.json',
  w2Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w2-hero-production-composition-freeze-v1.json',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  v8Source: 'content/web/homepage/hpc2/sources/PHIOS-market-positioning-founder-v8-no-pricing.html',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  humanAssetReview: 'content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json',
  realityObject: 'content/runtime/reality-model-runtime/contracts/canonical-reality-object-v1.json',
  signalRuntime: 'content/runtime/reality-model-runtime/contracts/signal-runtime-contract-v1.json',
  unknownRuntime: 'content/runtime/reality-model-runtime/contracts/unknown-runtime-contract-v1.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(exists(path), `Missing HPC2-W3 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const sceneRegistry = read(paths.sceneRegistry);
const w2Contract = read(paths.w2Contract);
const w2Freeze = read(paths.w2Freeze);
const v8Manifest = read(paths.v8Manifest);
const publicAssets = read(paths.publicAssets);
const visualRegistry = read(paths.visualRegistry);
const humanAssetReview = read(paths.humanAssetReview);
const realityObject = read(paths.realityObject);
const signalRuntime = read(paths.signalRuntime);
const unknownRuntime = read(paths.unknownRuntime);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);
const v8Source = text(paths.v8Source);

assert.equal(contract.work, 'HPC2-W3');
assert.equal(contract.baselineCommit, '27e992346c8fca10e613598088abc092b353e392');
assert.equal(contract.status, 'H01_H02_PRODUCTION_COMPOSITION_ACTIVE_H03_H09_DEFERRED');
assert.equal(contract.predecessorAuthority.sceneRegistry, paths.sceneRegistry);
assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.sceneRegistry));
assert.equal(contract.predecessorAuthority.w2Contract, paths.w2Contract);
assert.equal(contract.predecessorAuthority.w2ContractSha256, sha256(paths.w2Contract));
assert.equal(contract.predecessorAuthority.w2Freeze, paths.w2Freeze);
assert.equal(contract.predecessorAuthority.w2FreezeSha256, sha256(paths.w2Freeze));
assert.equal(contract.predecessorAuthority.relationship, 'ADDITIVE_H02_COMPOSITION_CONSUMES_W1_AUTHORITY_AND_PRESERVES_W2_H01_NO_SECOND_HOMEPAGE_RUNTIME');
assert.equal(w2Contract.status, 'H01_HERO_PRODUCTION_COMPOSITION_ACTIVE_H02_H09_DEFERRED');
assert.equal(w2Freeze.status, 'HPC2_W2_H01_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');

assert.equal(sceneRegistry.scenePolicy.sceneCount, 9);
assert.deepEqual(sceneRegistry.sceneOrder, Array.from({ length: 9 }, (_, index) => `H0${index + 1}`));
const h02Authority = sceneRegistry.scenes.find(scene => scene.sceneCode === 'H02');
assert.ok(h02Authority);
assert.equal(h02Authority.sceneTitle, 'One Reality');
assert.deepEqual(h02Authority.primaryNarrativeBeats, ['SIGNALS']);
assert.equal(h02Authority.visualAssets.length, 1);
assert.equal(h02Authority.visualAssets[0].assetCode, 'FIG-054');
assert.equal(h02Authority.visualAssets[0].role, 'CURRENT_REALITY_MAP');
assert.equal(h02Authority.ckaRole, 'PUBLIC_EXAMPLE_QUESTIONS_ALLOWED_NO_PRIVATE_CONTEXT');
assert.deepEqual(h02Authority.v8NarrativeLineage, ['V8-REALITY-001', 'V8-REALITY-002', 'V8-REALITY-003', 'V8-REALITY-004']);

assert.equal(count(html, /data-hpc2-scene="H01"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H02"/g), 1);
for (let scene = 3; scene <= 9; scene += 1) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="H0${scene}"`, 'g')), 0, `H0${scene} was implemented prematurely`);
}
assert.equal(count(html, /data-hpc2-scene="H(?:1[0-9]|[2-9][0-9])"/g), 0, 'H10+ is forbidden');

const h01Html = sceneMarkup(html, 'H01');
const h02Html = sceneMarkup(html, 'H02');
assert.equal(digestText(h01Html), contract.predecessorProtection.h01MarkupSha256, 'H01 changed without a versioned successor');
assert.equal(contract.predecessorProtection.h01ChangedByW3, false);
assert.match(h01Html, /data-hpc2-hero="HERO-001"/);
assert.match(h01Html, /data-hpc2-action="START_WITH_MY_REALITY"/);
assert.match(h01Html, /data-hpc2-action="EXPLORE_PHI_OS"/);
assert.doesNotMatch(h01Html, /ASK_PHIOS|Ask PHI OS|\/knowledge-search/i);

assert.match(h02Html, /id="hpc2-h02-title"/);
assert.match(h02Html, /data-hpc2-reality-field="PUBLIC_SEMANTIC_COMPOSITION"/);
assert.match(h02Html, /data-i18n="discover\.oneReality\.core">CURRENT REALITY</);
assert.equal(count(h02Html, /data-hpc2-figure="FIG-054"/g), 1);
assert.equal(count(h02Html, /data-hpc2-domain=/g), 10);
assert.equal(count(h02Html, /data-hpc2-semantic=/g), 6);
assert.equal(count(h02Html, /data-hpc2-example=/g), 6);
assert.deepEqual(attributeValues(h02Html, 'data-hpc2-domain'), ['WORK', 'MONEY', 'FAMILY', 'BODY', 'RELATIONSHIP', 'TIME', 'IDENTITY', 'HISTORY', 'EVIDENCE', 'UNKNOWN']);
assert.deepEqual(attributeValues(h02Html, 'data-hpc2-semantic'), ['OBSERVED', 'EXPERIENCED', 'RELATIONAL_STRUCTURAL', 'DERIVED', 'PROJECTED', 'UNKNOWN']);
assert.deepEqual(attributeValues(h02Html, 'data-hpc2-example'), ['OBSERVED', 'EXPERIENCED', 'STRUCTURAL', 'PROJECTED', 'UNKNOWN', 'NAVIGATION']);
assert.match(h02Html, /data-hpc2-example-state="SYNTHETIC_PUBLIC_EXAMPLE_NO_PRIVATE_CASE_DATA"/);
assert.match(h02Html, /data-hpc2-planned-route="\/about\/reality-navigation"[^>]*data-hpc2-route-state="INACTIVE_PENDING_HPC2_W11"/);
assert.doesNotMatch(h02Html, /href="\/about\/reality-navigation\/?"/);
assert.doesNotMatch(h02Html, /href="\/reality\/?"/);
assert.doesNotMatch(h02Html, /https?:\/\//i);
assert.doesNotMatch(h02Html, /<(?:form|input|textarea|button|select|video|canvas)\b/i);
assert.doesNotMatch(h02Html, /data-hpc2-action=|ASK_PHIOS|Ask PHI OS|\/knowledge-search/i);
assert.ok(html.includes('href="/reality-journey"'), 'Legacy Reality Journey route was deleted prematurely');
assert.equal(exists('about/reality-navigation/index.html'), false, 'W3 must not activate the planned Reality definition route');

assert.equal(contract.realityField.core, 'CURRENT REALITY');
assert.equal(contract.realityField.domainCount, 10);
assert.equal(contract.realityField.semanticDistinctionCount, 6);
assert.deepEqual(contract.realityField.domains, ['Work', 'Money', 'Family', 'Body', 'Relationship', 'Time', 'Identity', 'History', 'Evidence', 'Unknown']);
assert.deepEqual(contract.realityField.semanticDistinctions, ['Observed', 'Experienced', 'Relational / Structural', 'Derived', 'Projected', 'Unknown']);
assert.equal(contract.realityField.htmlDoesNotCreateRealityRuntimeState, true);
assert.equal(contract.realityField.htmlDoesNotPromoteSignalToEvidence, true);
assert.equal(contract.realityField.htmlDoesNotResolveUnknown, true);

assert.match(css, /\.hpc2-h02\s*\{/);
assert.match(css, /\.hpc2-reality-field\s*\{[\s\S]*?position:\s*relative;/);
assert.match(css, /\.hpc2-reality-core\s*\{[\s\S]*?position:\s*absolute;/);
assert.match(css, /\.hpc2-reality-domains li:nth-child\(10\)/);
assert.match(css, /\.hpc2-reality-semantics\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6,/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-reality-domains\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
assert.match(css, /\.hpc2-h02__evidence-grid\s*\{/);
assert.match(css, /\.hpc2-reality-example__navigation/);

assert.match(runtime, /resolveCanonicalVisual/);
assert.match(runtime, /renderAssetTarget\(realityFigureRoot, 'FIG-054', locale, visualRegistry\)/);
assert.match(runtime, /H02_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED/);
assert.match(runtime, /H02_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED/);
assert.match(runtime, /H02_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);
const resolverCandidates = fs.readdirSync('assets/js/runtime/web-production').filter(file => /asset.*resolver/i.test(file));
assert.deepEqual(resolverCandidates, ['asset-resolver.js']);

const publicFigure = publicAssets.assets.find(asset => asset.asset_code === 'FIG-054');
assert.ok(publicFigure);
assert.equal(publicFigure.semantic_name, 'CURRENT-REALITY-MAP');
assert.equal(publicFigure.object_key, contract.figureAsset.objectKey);
assert.equal(publicFigure.format, 'svg');
assert.equal(publicFigure.content_type, 'image/svg+xml');
assert.equal(publicFigure.status, 'remote-verified');
assert.equal(publicFigure.verification, 'verified-remote-head-get');
assert.equal(publicFigure.remote.http_status, 200);
assert.match(publicFigure.remote.content_type, /image\/svg\+xml/i);
assert.equal(publicFigure.remote.svg.validSvg, true);
assert.equal(publicFigure.remote.svg.scriptPresent, false);
assert.equal(publicFigure.remote.svg.externalActiveContentPresent, false);
const visualFigure = visualRegistry.assets.find(asset => asset.sequence === 'FIG-054');
assert.ok(visualFigure);
assert.equal(visualFigure.canonicalFormat, 'SVG');
assert.equal(visualFigure.productionSpec.uiPolicy, 'NO_FAKE_UI');
assert.equal(visualFigure.r2.remoteVerified, true);
assert.equal(visualFigure.machineAcceptance.status, 'MACHINE_ACCEPTED');
const figureHumanReview = humanAssetReview.records.find(record => record.assetCode === 'FIG-054');
assert.ok(figureHumanReview);
assert.equal(figureHumanReview.decision, 'ACCEPTED');
assert.equal(figureHumanReview.visualAssetAcceptedOnly, true);
assert.equal(figureHumanReview.routeActivated, false);
assert.equal(contract.figureAsset.existingResolverReused, true);
assert.equal(contract.figureAsset.secondResolverCreated, false);
assert.equal(contract.figureAsset.directR2UrlInHomepageConsumer, false);

assert.ok(realityObject.componentFamilies.includes('SIGNAL'));
assert.ok(realityObject.componentFamilies.includes('RELATIONSHIP'));
assert.ok(realityObject.componentFamilies.includes('CONSTRAINT'));
assert.ok(realityObject.componentFamilies.includes('UNKNOWN'));
assert.equal(realityObject.rules.providerOrAiMayCreateRealityAuthority, false);
assert.equal(realityObject.rules.productionExecutionActivated, false);
assert.equal(signalRuntime.rules.signalIsEvidence, false);
assert.equal(signalRuntime.rules.signalIsInterpretation, false);
assert.equal(signalRuntime.rules.signalCreationPromotesEvidence, false);
assert.equal(unknownRuntime.rules.unknownIsFormalRealityComponent, true);
assert.equal(unknownRuntime.rules.unknownCannotBeFilledByInference, true);
assert.equal(unknownRuntime.rules.providerOrAiMayResolveUnknown, false);
assert.equal(contract.runtimeBoundary.projectionOnly, true);
assert.equal(contract.runtimeBoundary.runtimeExecutionActivated, false);
assert.equal(contract.runtimeBoundary.persistentRealityCreated, false);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w3`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w3`)).default;
for (const key of ['eyebrow', 'title', 'lead', 'core', 'coreNote', 'exampleEyebrow', 'boundary', 'definitionBoundary']) {
  assert.equal(en.discover.oneReality[key], contract.copy.en[key], `EN H02 copy mismatch: ${key}`);
  assert.equal(zh.discover.oneReality[key], contract.copy['zh-Hans'][key], `ZH-Hans H02 copy mismatch: ${key}`);
}
assert.deepEqual(Object.values(en.discover.oneReality.domains), contract.realityField.domains);
assert.deepEqual(Object.values(en.discover.oneReality.semantics), contract.realityField.semanticDistinctions);
assert.deepEqual(
  ['observedValue', 'experiencedValue', 'structuralValue', 'projectedValue', 'unknownValue', 'navigationValue'].map(key => en.discover.oneReality.examples[key]),
  contract.publicExample.records.map(record => record.en)
);
assert.deepEqual(
  ['observedValue', 'experiencedValue', 'structuralValue', 'projectedValue', 'unknownValue', 'navigationValue'].map(key => zh.discover.oneReality.examples[key]),
  contract.publicExample.records.map(record => record['zh-Hans'])
);

for (const blockCode of contract.v8AndRouteBoundary.sourceBlocks) {
  const block = v8Manifest.semanticBlocks.find(item => item.blockCode === blockCode);
  assert.ok(block, `Missing V8 block: ${blockCode}`);
  assert.equal(block.destinationRoute, '/about/reality-navigation');
  assert.equal(block.successorVerified, false);
  assert.equal(block.deletionAllowedFromHomepage, false);
  assert.equal(block.actualScene, null);
}
for (const phrase of ['PHI OS DEFINITION', 'Observed', 'Experienced', 'THE JADE METAPHOR', 'Reality is like working a piece of jade.']) {
  assert.ok(v8Source.includes(phrase), `V8 Reality source phrase was deleted: ${phrase}`);
}
assert.equal(contract.v8AndRouteBoundary.h02SummaryProjection, 'V8_REALITY_003_STATE_DISTINCTIONS_ONLY');
assert.equal(contract.v8AndRouteBoundary.destinationState, 'PLANNED_NOT_ACTIVATED_PENDING_HPC2_W11');
assert.equal(contract.v8AndRouteBoundary.destinationHrefAddedByW3, false);
assert.equal(contract.v8AndRouteBoundary.manifestRewritten, false);
assert.equal(contract.v8AndRouteBoundary.successorVerifiedPromotions, 0);
assert.equal(contract.v8AndRouteBoundary.deletionAllowedPromotions, 0);

assert.equal(evidence.status, 'H02_SOURCE_AND_RUNTIME_COMPOSITION_VERIFIED_HUMAN_BROWSER_ACCEPTANCE_NOT_CREATED');
assert.deepEqual(evidence.implementationObservations.sceneMarkers, { h01: 1, h02: 1, h03ThroughH09: 0 });
assert.equal(evidence.implementationObservations.h01MarkupUnchangedFromW2, true);
assert.equal(evidence.implementationObservations.domainCount, 10);
assert.equal(evidence.implementationObservations.semanticDistinctionCount, 6);
assert.equal(evidence.implementationObservations.syntheticPublicExampleCount, 6);
assert.equal(evidence.implementationObservations.resolverImportsAdded, 0);
assert.equal(evidence.implementationObservations.secondResolverCreated, false);
assert.equal(evidence.implementationObservations.directR2UrlsAddedToHomepageConsumer, 0);
assert.equal(evidence.privacyObservations.realPrivateCaseDataPresentOnHomepage, false);
assert.equal(evidence.privacyObservations.userInputCollectedInH02, false);
assert.equal(evidence.routeObservations.destinationHrefCreatedByW3, false);
assert.equal(evidence.routeObservations.candidateRealityRouteActivatedByW3, false);
assert.equal(evidence.v8Observations.manifestSuccessorVerifiedChanged, false);
assert.equal(evidence.v8Observations.manifestDeletionAllowedChanged, false);
assert.equal(evidence.verificationBoundary.humanVisualAcceptancePerformedByThisWork, false);
assert.equal(evidence.verificationBoundary.productionAcceptanceClaimed, false);

assert.equal(acceptance.state, 'HPC2_W3_H02_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(acceptance.counts.implementedScenes, 2);
assert.equal(acceptance.counts.newlyImplementedScenes, 1);
assert.equal(acceptance.counts.realPrivateCases, 0);
assert.equal(acceptance.counts.routesActivated, 0);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.exitGate.repositoryImplementationAccepted, true);
assert.equal(acceptance.exitGate.globalHomepageProductionAccepted, false);
assert.equal(acceptance.nextWork, 'HPC2-W4_MANY_LENSES_CATEGORY_TRANSITION');

assert.equal(freeze.status, 'HPC2_W3_H02_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W3 frozen artifact drift: ${artifact.path}`);
assert.equal(freeze.structuralFreeze.h01MarkupSha256, contract.predecessorProtection.h01MarkupSha256);
assert.equal(freeze.structuralFreeze.h01MayBeChangedOnlyByVersionedSuccessor, true);
assert.equal(freeze.structuralFreeze.h02MayBeChangedOnlyByVersionedSuccessor, true);
assert.equal(freeze.structuralFreeze.laterSceneCompositionMayExtendSharedConsumerFiles, true);
assert.equal(freeze.frozenPolicies.realPrivateCaseDataForbidden, true);
assert.equal(freeze.frozenPolicies.secondAssetResolverForbidden, true);
assert.equal(freeze.frozenPolicies.directR2UrlBypassForbidden, true);
assert.equal(freeze.preservedBoundaries.h03H09Implemented, false);
assert.equal(freeze.preservedBoundaries.realityCandidateRouteActivated, false);
assert.equal(freeze.preservedBoundaries.aboutRealityNavigationRouteActivated, false);
assert.equal(freeze.preservedBoundaries.humanVisualAcceptanceCreated, false);
assert.equal(freeze.successorRules.nextWork, 'HPC2-W4_MANY_LENSES_CATEGORY_TRANSITION');

assert.equal(pkg.scripts['check:hpc2-w2-frozen'], 'node scripts/check-hpc2-w2.mjs');
assert.equal(pkg.scripts['check:hpc2-w2'], 'node scripts/check-hpc2-w2-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w3'], 'node scripts/check-hpc2-w3.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w3'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w3'));

console.log('HPC2-W3 One Reality Composition: ACCEPTED (repository implementation)');
console.log('  scenes: H01 preserved + H02 implemented; H03-H09 remain deferred');
console.log('  visual: CURRENT REALITY + 10 domains + 6 distinctions; FIG-054 via existing resolver');
console.log('  example: 6 synthetic public signals; private case data = 0; input UI = 0');
console.log('  routes: /about/reality-navigation remains planned; /reality/ activations = 0');
console.log('  Human/browser acceptance: pending; no decision fabricated');
