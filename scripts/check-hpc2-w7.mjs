import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import './check-pds-w0-current.mjs';
import './check-cka-w5-w17.mjs';

const canonicalText = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(canonicalText(path));
const sha256 = path => crypto.createHash('sha256').update(canonicalText(path), 'utf8').digest('hex');
const digestText = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, sceneCode) => {
  const markerIndex = source.indexOf(`data-hpc2-scene="${sceneCode}"`);
  assert.ok(markerIndex >= 0, `${sceneCode} marker missing`);
  const start = source.lastIndexOf('<section', markerIndex);
  const end = source.indexOf('</section>', markerIndex);
  assert.ok(start >= 0 && end > markerIndex, `${sceneCode} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = Object.freeze({
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w7-reality-surface-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w7-reality-surface-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w7-reality-surface-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w7-reality-surface-freeze-v1.json',
  successor: 'content/web-production/reconciliation/hpc2-w7-aab1844-current-successor-v1.json',
  pdsSuccessor: 'content/web-production/reconciliation/pds-w0-hpc2-pre-asset-resolver-successor-v1.json',
  pdsChecker: 'scripts/check-pds-w0-current.mjs',
  sceneRegistry: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  w6Contract: 'content/web/homepage/hpc2/contracts/hpc2-w6-first-interaction-composition-contract-v1.json',
  w6Evidence: 'content/web/homepage/hpc2/evidence/hpc2-w6-first-interaction-audit-v1.json',
  w6Acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w6-first-interaction-acceptance-v1.json',
  w6Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w6-first-interaction-freeze-v1.json',
  routeRegistry: 'content/web-production/registries/wpr-route-registry-v1.1.json',
  ckaContract: 'content/client/knowledge-ask/contracts/cka-w5-w17-batch-b-contract-v1.json',
  ckaFreeze: 'content/client/knowledge-ask/freeze/cka-w5-w17-batch-b-freeze-v1.json',
  ckaSuccessor: 'content/client/knowledge-ask/reconciliation/cka-w5-w17-current-successor-v1.json',
  ckaChecker: 'scripts/check-cka-w5-w17.mjs',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  knowledgeHtml: 'knowledge-search.html',
  knowledgeCss: 'assets/css/knowledge-search.css',
  ckaSourceCss: 'assets/knowledge-search.css',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  assetResolver: 'assets/js/runtime/web-production/asset-resolver.js',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W7 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const successor = read(paths.successor);
const pdsSuccessor = read(paths.pdsSuccessor);
const scenes = read(paths.sceneRegistry);
const w6Contract = read(paths.w6Contract);
const w6Freeze = read(paths.w6Freeze);
const routeRegistry = read(paths.routeRegistry);
const ckaContract = read(paths.ckaContract);
const ckaFreeze = read(paths.ckaFreeze);
const ckaSuccessor = read(paths.ckaSuccessor);
const v8Manifest = read(paths.v8Manifest);
const pkg = read(paths.package);
const html = canonicalText(paths.index);
const css = canonicalText(paths.css);
const runtime = canonicalText(paths.runtime);
const knowledgeHtml = canonicalText(paths.knowledgeHtml);

assert.equal(contract.work, 'HPC2-W7');
assert.equal(contract.baselineCommit, 'aab18446a012938ccd24043751469866831fe4e0');
assert.equal(contract.status, 'H01_H06_PRODUCTION_COMPOSITION_ACTIVE_H07_H09_DEFERRED');
assert.equal(evidence.status, 'H06_FOUR_CLIENT_FACING_REALITY_ANCHORS_VERIFIED_EXISTING_ROUTES_REUSED_NO_RUNTIME_ROUTE_OR_AUTHORITY_ACTIVATION');
assert.equal(acceptance.state, 'HPC2_W7_H06_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_DEPLOYMENT_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W7_H06_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(successor.status, 'ACTIVE_ADDITIVE_PDS_CKA_B_AND_H06_CURRENT_SUCCESSOR_HISTORICAL_AUTHORITIES_PRESERVED');

for (const artifact of freeze.immutableArtifacts) {
  assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W7 immutable artifact drift: ${artifact.path}`);
}
assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.sceneRegistry));
assert.equal(contract.predecessorAuthority.w6ContractSha256, sha256(paths.w6Contract));
assert.equal(contract.predecessorAuthority.w6FreezeSha256, sha256(paths.w6Freeze));
assert.equal(contract.predecessorAuthority.routeRegistrySha256, sha256(paths.routeRegistry));
assert.equal(contract.predecessorAuthority.ckaBatchBContractSha256, sha256(paths.ckaContract));
for (const artifact of w6Freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W6 frozen artifact drift: ${artifact.path}`);

assert.equal(successor.pdsTransition.successorSha256, sha256(paths.pdsSuccessor));
assert.equal(successor.pdsTransition.checkerSha256, sha256(paths.pdsChecker));
assert.equal(successor.pdsTransition.digestMode, 'UTF8_BOM_STRIPPED_LF');
assert.equal(pdsSuccessor.successorPolicy.textDigestNormalization, successor.pdsTransition.digestMode);
assert.equal(successor.pdsTransition.pdsContractCanonicalLfSha256, 'fce81ed714020127e8678c7c05c7cb836c101785eced35697a4f4db95828875b');
assert.equal(successor.pdsTransition.pdsContractObservedWindowsCrLfSha256, 'db4194ce577162add32e80494805175167f8cbac138715ee887f92661e5b3ee8');
assert.equal(successor.pdsTransition.semanticContentChanged, false);

assert.equal(successor.ckaBatchBTransition.batchBSuccessorSha256, sha256(paths.ckaSuccessor));
assert.equal(successor.ckaBatchBTransition.batchBCheckerSha256, sha256(paths.ckaChecker));
assert.equal(ckaContract.batch, 'BATCH-CKA-B');
assert.equal(ckaFreeze.immutableBoundaries.groundedAnswerOwner, 'KAP');
assert.match(knowledgeHtml, /href="\/assets\/css\/knowledge-search\.css"/);
assert.equal(sha256(paths.knowledgeCss), successor.ckaBatchBTransition.currentCanonicalConsumedStylesheetSha256);
assert.equal(sha256(paths.ckaSourceCss), successor.ckaBatchBTransition.batchBSourceStylesheetSha256);
assert.equal(sha256(paths.knowledgeCss), sha256(paths.ckaSourceCss));
assert.equal(successor.ckaBatchBTransition.stylesheetAuthorityDuplicated, false);
assert.equal(successor.ckaBatchBTransition.secondCkaRuntimeCreated, false);

const sceneAuthority = scenes.scenes.find(scene => scene.sceneCode === 'H06');
assert.ok(sceneAuthority, 'H06 scene authority missing');
assert.equal(sceneAuthority.sceneTitle, 'Reality Surfaces');
assert.deepEqual(sceneAuthority.primaryNarrativeBeats, ['CHOOSE']);
assert.deepEqual(sceneAuthority.supportingNarrativeBeats, ['UNDERSTAND']);
assert.equal(sceneAuthority.ckaRole, 'ASK_IS_CROSS_SURFACE_INTERACTION_NOT_A_FIFTH_GIANT_CARD');
assert.deepEqual(sceneAuthority.capabilitiesConsumed.map(record => record.capabilityCode), ['PERSONAL_REALITY', 'FINANCIAL_REALITY', 'REALITY_JOURNEY', 'PUBLISHED_KNOWLEDGE']);
assert.equal(contract.predecessorProtection.w1SceneAuthorityRewritten, false);
assert.deepEqual(sceneAuthority.visualAssets.map(record => record.assetCode), ['FIG-002', 'FIG-003', 'FIG-004', 'FIG-005']);
assert.equal(contract.visualKnowledgePolicy.h06FigureConsumersCreated, 0);
assert.deepEqual(contract.visualKnowledgePolicy.allowedConsumptionScenes, ['H02', 'H04', 'H07']);

for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06']) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1, `${scene} count drift`);
}
for (const scene of ['H07', 'H08', 'H09']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 0, `${scene} implemented prematurely`);
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05']) {
  assert.equal(digestText(sceneMarkup(html, scene)), contract.predecessorProtection[`${scene.toLowerCase()}MarkupSha256`], `Frozen ${scene} markup drift`);
}
const h06 = sceneMarkup(html, 'H06');
assert.equal(digestText(h06), freeze.structuralFreeze.h06MarkupSha256, 'Frozen H06 markup drift');
assert.match(h06, /data-hpc2-surface-anchor-count="4"/);
assert.match(h06, /data-hpc2-visual-mode="HTML_COMPOSITION_NO_FIGURE_SCENE"/);
const anchorCodes = [...h06.matchAll(/data-hpc2-reality-surface="([A-Z_]+)"/g)].map(match => match[1]);
assert.deepEqual(anchorCodes, contract.surfaceAnchors.map(anchor => anchor.code));
assert.equal(anchorCodes.length, 4);
for (const anchor of contract.surfaceAnchors) {
  assert.equal(count(h06, new RegExp(`href="${anchor.destination.replaceAll('/', '\\/')}"`, 'g')), 1, `${anchor.code} route link drift`);
  assert.equal(routeRegistry.entries.some(route => route.path === anchor.destination && route.implementationState.startsWith('EXISTING')), true, `${anchor.destination} is not an existing governed route`);
  assert.equal(count(h06, new RegExp(`data-i18n="discover\\.realitySurfaces\\.${({ PERSONAL_REALITY: 'personal', FINANCIAL_REALITY: 'financial', REALITY_JOURNEY: 'journey', KNOWLEDGE_AND_LEARNING: 'knowledge' })[anchor.code]}\\.[^"]+"`, 'g')) >= anchor.signals.length, true);
}
assert.equal(count(h06, /data-hpc2-reality-surface=/g), 4);
assert.equal(count(h06, /data-hpc2-cross-surface-ask="CKA_W5_W17_REUSED"/g), 1);
assert.equal(count(h06, /data-hpc2-visual-knowledge-cta="EXISTING_FIGURES_ROUTE"/g), 1);
assert.equal(count(h06, /data-hpc2-figure=|data-hpc2-icon=/g), 0);
assert.equal(count(h06, /<(?:form|input|textarea|select|button)\b/g), 0);
assert.doesNotMatch(h06, /href="\/reality\/?"/);
assert.match(h06, /href="\/reality-journey"[^>]*data-hpc2-route-state="EXISTING_WPR_W20_OVERVIEW_NO_CASE_ACTIVATION"/);
assert.match(h06, /href="\/figures"[^>]*data-hpc2-visual-knowledge-cta=/);
assert.match(h06, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL&amp;contextType=REALITY_SURFACE_ORIENTATION"/);
assert.equal(/href=["']\/reality\/?["']/.test(html), false, '/reality/ activated prematurely');

const h06End = html.indexOf('</section>', html.indexOf('data-hpc2-scene="H06"'));
for (const legacyMarker of ['aria-labelledby="value-title"', 'aria-labelledby="entries-title"', 'data-wpr-home-books', 'data-wpr-home-visuals']) {
  assert.ok(html.indexOf(legacyMarker) > h06End, `Legacy Homepage content deleted or moved before H06: ${legacyMarker}`);
}

assert.match(css, /\.hpc2-h06\s*\{/);
assert.match(css, /\.hpc2-h06__grid\s*\{[\s\S]*?repeat\(2,/);
assert.match(css, /\.hpc2-surface-card--journey\s*\{/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h06__grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-surface-card\s*\{/);
assert.equal(sha256(paths.runtime), evidence.currentConsumerSnapshots.find(record => record.path === paths.runtime).sha256);
assert.equal(contract.composition.homepageRuntimeChanged, false);
assert.doesNotMatch(runtime, /H06|REALITY_SURFACE_ORIENTATION|activateRealityRoute|\/api\/ask/i);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w7`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w7`)).default;
for (const [key, expected] of Object.entries(contract.copy.en)) assert.equal(en.discover.realitySurfaces[key], expected, `EN H06 copy drift: ${key}`);
for (const [key, expected] of Object.entries(contract.copy['zh-Hans'])) assert.equal(zh.discover.realitySurfaces[key], expected, `ZH H06 copy drift: ${key}`);
assert.deepEqual(Object.keys(en.discover.realitySurfaces).filter(key => ['personal', 'financial', 'journey', 'knowledge'].includes(key)), ['personal', 'financial', 'journey', 'knowledge']);
assert.equal(en.discover.realitySurfaces.personal.capacity, 'capacity');
assert.equal(en.discover.realitySurfaces.financial.scenarios, 'scenarios');
assert.equal(en.discover.realitySurfaces.journey.realityDependent, 'reality-dependent');
assert.equal(en.discover.realitySurfaces.knowledge.ask, 'Ask PHI OS');
assert.equal(zh.discover.realitySurfaces.personal.capacity, '承载能力');
assert.equal(zh.discover.realitySurfaces.financial.cashFlow, '现金流');
assert.equal(zh.discover.realitySurfaces.journey.caseSpecific, '特定案例');
assert.equal(zh.discover.realitySurfaces.knowledge.readingPaths, '阅读路径');

assert.equal(evidence.surfaceObservations.clientFacingAnchorCount, 4);
assert.equal(evidence.surfaceObservations.everyManifestRouteProjected, false);
assert.equal(evidence.surfaceObservations.askCardCount, 0);
assert.equal(evidence.surfaceObservations.h06FigureConsumerCount, 0);
assert.equal(evidence.routeObservations.newRouteDeclarationsCreated, 0);
assert.equal(evidence.preservationObservations.legacyHomepageSectionsDeleted, 0);
assert.equal(evidence.preservationObservations.homepageRuntimeChanges, 0);
assert.equal(v8Manifest.summary.successorVerifiedCount, 0);
assert.equal(v8Manifest.summary.deletionAllowedFromHomepageCount, 0);
assert.equal(acceptance.counts.implementedScenes, 6);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.deploymentAcceptance.claimed, false);
assert.equal(acceptance.globalHomepageProductionAcceptance.claimed, false);
for (const boundary of Object.values(successor.boundaries)) assert.equal(boundary, false);
assert.equal(successor.successorPolicy.additive, true);
assert.equal(successor.successorPolicy.failClosed, true);
assert.equal(successor.successorPolicy.deterministic, true);

assert.equal(pkg.scripts['check:pds-w0-current'], 'node scripts/check-pds-w0-current.mjs');
assert.equal(pkg.scripts['check:cka-w5-w17'], 'node scripts/check-cka-w5-w17.mjs');
assert.equal(pkg.scripts['check:cka'], 'npm run check:cka-a && npm run check:cka-w5-w17');
assert.equal(pkg.scripts['check:hpc2-w6-frozen'], 'node scripts/check-hpc2-w6.mjs');
assert.equal(pkg.scripts['check:hpc2-w6'], 'node scripts/check-hpc2-w6-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w7'], 'node scripts/check-hpc2-w7.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w7'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w7'));

console.log('HPC2-W7 Reality Surface composition: ACCEPTED (repository implementation)');
console.log('  scenes: frozen H01-H05 preserved; additive H06 active; H07-H09 remain deferred');
console.log('  anchors: Personal Reality + Financial Reality + Reality Journey + Knowledge & Learning = 4/4');
console.log('  visual knowledge: no separate scene and no H06 figure consumer; /figures CTA preserved for H07 continuity');
console.log('  boundaries: existing routes and runtimes reused; /reality/, persistence, Method execution and Human/browser acceptance = 0');
