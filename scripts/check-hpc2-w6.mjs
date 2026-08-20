import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const digestText = value => crypto.createHash('sha256').update(value).digest('hex');
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
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w6-first-interaction-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w6-first-interaction-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w6-first-interaction-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w6-first-interaction-freeze-v1.json',
  ckaSuccessor: 'content/web-production/reconciliation/hpc2-w6-cka-client-surface-successor-v1.json',
  historicalCkaSuccessor: 'content/web-production/reconciliation/hpc2-w5-cka-w0-w4-current-successor-v1.json',
  sceneRegistry: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  w5Contract: 'content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json',
  w5Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json',
  ckaW0: 'content/client/knowledge-ask/contracts/cka-w0-ask-entry-contract-v1.json',
  ckaAcceptance: 'content/client/knowledge-ask/acceptance/cka-w0-w4-batch-a-acceptance-v1.json',
  kapW11: 'content/knowledge/answer-projection/contracts/kap-w11-deterministic-answer-first-contract-v1.json',
  personalRuntime: 'content/web-production/contracts/wpr-personal-runtime-surface-v1.json',
  personalRuntimeAcceptance: 'content/web-production/acceptance/wpr-w21-personal-runtime-surface-acceptance-v1.json',
  routeRegistry: 'content/web-production/registries/wpr-route-registry-v1.1.json',
  mcdBoundary: 'content/professional/method-client-delivery/contracts/mcd-0-method-client-delivery-authority-boundary-v1.json',
  invariants: 'content/web-production/contracts/client-surface-global-invariants-v1.json',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  ckaClient: 'assets/js/pages/knowledge-search.js',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W6 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const ckaSuccessor = read(paths.ckaSuccessor);
const historicalCka = read(paths.historicalCkaSuccessor);
const scenes = read(paths.sceneRegistry);
const ckaW0 = read(paths.ckaW0);
const ckaAcceptance = read(paths.ckaAcceptance);
const kapW11 = read(paths.kapW11);
const personalRuntime = read(paths.personalRuntime);
const personalRuntimeAcceptance = read(paths.personalRuntimeAcceptance);
const routeRegistry = read(paths.routeRegistry);
const mcdBoundary = read(paths.mcdBoundary);
const invariants = read(paths.invariants);
const v8Manifest = read(paths.v8Manifest);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);

assert.equal(contract.work, 'HPC2-W6');
assert.equal(contract.baselineCommit, '6b860d361c45745b2cb415ac897c5a9067585182');
assert.equal(contract.status, 'H01_H05_PRODUCTION_COMPOSITION_ACTIVE_H06_H09_DEFERRED');
assert.equal(evidence.status, 'H05_REAL_HTML_FIRST_INTERACTION_VERIFIED_EXISTING_CKA_AND_ROUTES_REUSED_NO_RUNTIME_OR_ROUTE_ACTIVATION');
assert.equal(acceptance.state, 'HPC2_W6_H05_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_DEPLOYMENT_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W6_H05_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W6 immutable artifact drift: ${artifact.path}`);
assert.equal(evidence.contract.sha256, sha256(paths.contract));
assert.equal(evidence.ckaSuccessor.sha256, sha256(paths.ckaSuccessor));

assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.sceneRegistry));
assert.equal(contract.predecessorAuthority.w5ContractSha256, sha256(paths.w5Contract));
assert.equal(contract.predecessorAuthority.w5FreezeSha256, sha256(paths.w5Freeze));
assert.equal(contract.predecessorAuthority.ckaW0ContractSha256, sha256(paths.ckaW0));
for (const source of contract.authoritySources) assert.equal(sha256(source.path), source.sha256, `HPC2-W6 authority drift: ${source.path}`);
assert.equal(contract.predecessorProtection.h01H04ChangedByW6, false);
assert.equal(contract.predecessorProtection.w0ThroughW5ImmutableEvidenceRewritten, false);
assert.equal(contract.predecessorProtection.ckaW0W4AuthorityRewritten, false);

const baselineSnapshots = {
  'index.html': '851f4d41c8e98473cd81d70f8c39edfccb032f1167f63cd3c0b0fd004a75c0e2',
  'assets/css/hpc2-pre-home-visuals.css': '3233d040b01edaa43b9f0481e70c5e3db3fe0140930851a48c7a1f28c3e60517',
  'assets/js/pages/home-production.js': 'e1cb899b2cd603ae608bdca15a10aca9246aa13bcee8596630cfe1208d587dda',
  'assets/js/locales/en/public.js': '89c8036b8c16ce43099c8cc8fb4baa96a8b5d7e05935710b4f188f923aac0dd8',
  'assets/js/locales/zh-Hans/public.js': 'c093e2011b49d0d803a451f898a9f65b5eaeeda5bec0ab2a80b8a8023d293cd9',
  'package.json': '38929952f8c4d211ff71110b979a92e3f5f6afe13b0565715c6407e5b1444aca'
};
assert.deepEqual(Object.fromEntries(evidence.baselineSnapshots.map(record => [record.path, record.sha256])), baselineSnapshots);
for (const snapshot of evidence.currentConsumerSnapshots) assert.equal(sha256(snapshot.path), snapshot.sha256, `HPC2-W6 current consumer drift: ${snapshot.path}`);
assert.equal(sha256(paths.runtime), baselineSnapshots[paths.runtime], 'HPC2-W6 must not change the existing Homepage runtime');

for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05']) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1, `${scene} must have one consumer`);
}
for (const scene of ['H06', 'H07', 'H08', 'H09']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 0, `${scene} implemented prematurely`);
for (const scene of ['H01', 'H02', 'H03', 'H04']) {
  const expected = contract.predecessorProtection[`${scene.toLowerCase()}MarkupSha256`];
  assert.equal(digestText(sceneMarkup(html, scene)), expected, `Frozen ${scene} markup drift`);
}
const h05Html = sceneMarkup(html, 'H05');
assert.equal(digestText(h05Html), freeze.structuralFreeze.h05MarkupSha256, 'Frozen H05 markup drift');
assert.equal(evidence.sceneObservations.h05MarkupSha256, freeze.structuralFreeze.h05MarkupSha256);

const h05Authority = scenes.scenes.find(scene => scene.sceneCode === 'H05');
assert.ok(h05Authority, 'H05 narrative authority missing');
assert.equal(h05Authority.sceneTitle, 'First Interaction');
assert.deepEqual(h05Authority.primaryNarrativeBeats, ['UNDERSTAND']);
assert.deepEqual(h05Authority.supportingNarrativeBeats, ['CHOOSE']);
assert.equal(h05Authority.visualMode, 'REAL_HTML_UI_NO_FAKE_UI_IMAGE');
assert.deepEqual(h05Authority.visualAssets, []);
assert.equal(h05Authority.density, 'LOW');
assert.equal(h05Authority.ckaRole, 'ASK_SITUATION_PERSONAL_RUNTIME_SPLIT_NO_FORCED_JOURNEY');
assert.equal(h05Authority.implementationState, 'AUTHORITY_FROZEN_FUNCTIONAL_HTML_UI_PENDING_HPC2_W6');
assert.deepEqual(h05Authority.v8NarrativeLineage, ['V8-JOURNEY-001']);

assert.match(h05Html, /id="h05-first-interaction"/);
assert.match(h05Html, /data-hpc2-visual-mode="REAL_HTML_UI_NO_FAKE_UI_IMAGE"/);
assert.equal(count(h05Html, /<form\b/g), 1);
assert.equal(count(h05Html, /<textarea\b/g), contract.composition.functionalUserInputCount);
assert.equal(count(h05Html, /<input type="hidden"/g), 3);
assert.equal(count(h05Html, /<button\b/g), 1);
assert.equal(count(h05Html, /data-hpc2-first-interaction=/g), 4);
assert.match(h05Html, /<form[^>]+id="h05-situation-entry"[^>]+action="\/knowledge-search"[^>]+method="get"/);
assert.match(h05Html, /name="entrySurface" value="HOMEPAGE"/);
assert.match(h05Html, /name="mode" value="GLOBAL"/);
assert.match(h05Html, /name="contextType" value="FIRST_INTERACTION_SITUATION"/);
assert.match(h05Html, /<textarea[^>]+name="q"[^>]+maxlength="500"[^>]+required/);
assert.match(h05Html, /data-hpc2-persistence="NONE"/);
assert.match(h05Html, /id="h05-situation-hint"/);
assert.match(h05Html, /contextType=FIRST_INTERACTION_QUESTION/);
assert.match(h05Html, /href="\/personal-runtime"[^>]+data-hpc2-route-state="EXISTING_WPR_W21_LIMITED_NO_METHOD_EXECUTION"/);
assert.match(h05Html, /href="\/professional\/financial"[^>]+data-hpc2-route-state="EXISTING_WPR_ROUTE"/);
assert.doesNotMatch(h05Html, /<(?:figure|img|picture|video|canvas|select|fieldset)\b/i);
assert.doesNotMatch(h05Html, /href=["']\/reality\/?["']|href=["']\/reality-journey\/?["']/i);
assert.equal(/href=["']\/reality\/?["']/.test(html), false, 'HPC2-W6 must not activate /reality/');

assert.equal(contract.inputPolicy.fields.length, 1);
assert.deepEqual(contract.inputPolicy.fields, ['q']);
assert.equal(contract.inputPolicy.maximumCharacters, 500);
for (const boundary of ['homepageJavaScriptSubmissionCreated', 'directApiRequestCreated', 'homepagePersistenceCreated', 'localStorageCreated', 'sessionStorageCreated', 'accountCreated', 'canonicalRealityCaseCreated']) {
  assert.equal(contract.inputPolicy[boundary], false, `Unexpected H05 input behavior: ${boundary}`);
}
assert.doesNotMatch(runtime, /\/api\/ask-phios|fetch\([^)]*knowledge-search/i);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);
const resolverCandidates = fs.readdirSync('assets/js/runtime/web-production').filter(file => /asset.*resolver/i.test(file));
assert.deepEqual(resolverCandidates, ['asset-resolver.js']);

assert.equal(ckaSuccessor.predecessor.contractSha256, sha256(paths.historicalCkaSuccessor));
assert.equal(historicalCka.clientSurfaceTransition.artifacts.find(record => record.path === paths.ckaClient).currentSuccessorSha256, ckaSuccessor.predecessor.historicalDeclaredCurrentSha256);
assert.equal(sha256(paths.ckaClient), ckaSuccessor.currentClientSurface.sha256);
const ckaClient = text(paths.ckaClient);
for (const marker of ckaSuccessor.currentClientSurface.requiredSemanticMarkers) assert.ok(ckaClient.includes(marker), `Missing current CKA marker: ${marker}`);
for (const marker of ckaSuccessor.currentClientSurface.forbiddenSemanticMarkers) assert.ok(!ckaClient.includes(marker), `Forbidden current CKA marker: ${marker}`);
assert.equal(ckaSuccessor.homepageConsumerTransition.consumers.length, 3);
assert.equal(ckaSuccessor.homepageConsumerTransition.consumers.filter(record => record.sceneCode === 'H05').length, 2);
assert.equal(ckaSuccessor.homepageConsumerTransition.secondHomepageRuntimeCreated, false);
assert.equal(ckaSuccessor.homepageConsumerTransition.secondAskAuthorityCreated, false);
for (const boundary of Object.values(ckaSuccessor.authorityBoundary)) assert.equal(boundary, false);
assert.equal(ckaSuccessor.successorPolicy.failClosed, true);
assert.equal(ckaSuccessor.successorPolicy.deterministic, true);
assert.equal(ckaSuccessor.successorPolicy.duplicateAuthorityForbidden, true);

assert.equal(ckaW0.route, '/knowledge-search');
assert.equal(ckaW0.governance.createsShadowAccount, false);
assert.equal(ckaW0.governance.createsPersistentCase, false);
assert.equal(ckaW0.governance.executesMethod, false);
assert.equal(ckaW0.governance.startsRealityJourney, false);
assert.equal(ckaAcceptance.humanAcceptance.claimed, false);
assert.equal(ckaAcceptance.browserAcceptance.claimed, false);
assert.equal(kapW11.rules.deterministicFirst, true);
assert.equal(kapW11.rules.createsCanonicalAuthority, false);
assert.equal(kapW11.rules.createsRealityReading, false);
assert.equal(kapW11.rules.createsPersistentCase, false);

const personalRoute = routeRegistry.entries.find(record => record.path === '/personal-runtime');
const financialRoute = routeRegistry.entries.find(record => record.path === '/professional/financial');
assert.equal(personalRoute.implementationState, 'EXISTING_WPR_W21_EPHEMERAL_INPUT_READINESS');
assert.equal(personalRoute.accessResolution, 'PUBLIC_SURFACE_RDG_FAIL_CLOSED_NO_EXECUTION');
assert.equal(financialRoute.implementationState, 'EXISTING');
assert.equal(personalRuntime.status, 'ACTIVE_LIMITED_PRODUCTION_INPUT_READINESS_NO_METHOD_EXECUTION');
assert.equal(personalRuntime.dataBoundary.surfacePersistence, 'EPHEMERAL');
assert.equal(personalRuntime.dataBoundary.serverSubmissionAllowed, false);
assert.equal(personalRuntime.methodBoundary.methodExecutionAllowed, false);
assert.equal(personalRuntimeAcceptance.nonActivation.methodExecutionActivated, false);
assert.equal(mcdBoundary.invariants.frontendCannotGrantAuthority, true);
assert.equal(mcdBoundary.invariants.mcdCannotOverrideMpa, true);

for (const code of ['INV-05', 'INV-06', 'INV-07', 'INV-08', 'INV-09', 'INV-10']) assert.ok(invariants.invariants.some(record => record.code === code));
const v8Journey = v8Manifest.semanticBlocks.find(block => block.blockCode === contract.v8Boundary.sourceBlock);
assert.equal(v8Journey.sourceState, 'PRESERVED_CANONICAL_SOURCE_NOT_PRODUCTION_CONSUMER');
assert.equal(v8Journey.successorVerified, false);
assert.equal(v8Journey.deletionAllowedFromHomepage, false);
assert.equal(v8Journey.actualScene, null);

assert.match(css, /\.hpc2-h05\s*\{/);
assert.match(css, /\.hpc2-h05__interaction-grid\s*\{/);
assert.match(css, /\.hpc2-h05__situation textarea\s*\{/);
assert.match(css, /\.hpc2-h05__situation textarea:focus-visible\s*\{/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h05__interaction-grid/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-h05__paths/);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w6`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w6`)).default;
for (const [key, expected] of Object.entries(contract.copy.en)) assert.equal(en.discover.firstInteraction[key], expected, `EN H05 copy drift: ${key}`);
for (const [key, expected] of Object.entries(contract.copy['zh-Hans'])) assert.equal(zh.discover.firstInteraction[key], expected, `ZH H05 copy drift: ${key}`);
assert.match(en.discover.firstInteraction.situationHint, /sensitive personal data/);
assert.match(en.discover.firstInteraction.simpleBoundary, /no account or persistent case/);
assert.match(zh.discover.firstInteraction.situationHint, /敏感个人资料/);
assert.match(zh.discover.firstInteraction.simpleBoundary, /不会执行 Method/);

assert.equal(acceptance.counts.implementedScenes, 5);
assert.equal(acceptance.counts.h05FunctionalForms, 1);
assert.equal(acceptance.counts.h05UserTextInputs, 1);
assert.equal(acceptance.counts.newRouteDeclarations, 0);
assert.equal(acceptance.counts.homepageRuntimeExecutions, 0);
assert.equal(acceptance.counts.methodExecutions, 0);
assert.equal(acceptance.counts.realityJourneyActivations, 0);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.deploymentAcceptance.claimed, false);
assert.equal(acceptance.globalHomepageProductionAcceptance.claimed, false);
assert.equal(freeze.preservedBoundaries.h06H09Implemented, false);
assert.equal(freeze.preservedBoundaries.legacyHomepageSectionsDeleted, false);
assert.equal(freeze.preservedBoundaries.globalProductionAcceptanceCreated, false);
assert.equal(freeze.successorRules.nextWork, 'HPC2-W7_REALITY_SURFACES_COMPOSITION');

assert.equal(pkg.scripts['check:hpc2-w6'], 'node scripts/check-hpc2-w6.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w6'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w6'));

console.log('HPC2-W6 First Interaction: ACCEPTED (repository implementation)');
console.log('  scenes: frozen H01-H04 preserved byte-for-byte; H05 real HTML UI active; H06-H09 deferred');
console.log('  interaction: 1 question-scoped situation field + existing CKA question entry + existing Personal Runtime and Financial routes');
console.log('  CKA: current a0b7… client reconciled by additive successor; historical d61d… observation preserved');
console.log('  runtimes: existing Homepage, CKA, WPR and MCD owners reused; duplicate runtimes/authorities = 0');
console.log('  boundaries: persistence, Method execution, forced Journey, /reality/ activation and V8 deletion/promotions = 0');
console.log('  decisions: Human, browser, deployment and global Homepage acceptance remain pending');
