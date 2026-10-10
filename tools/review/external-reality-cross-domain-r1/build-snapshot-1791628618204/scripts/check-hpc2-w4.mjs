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
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w4-many-lenses-category-transition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w4-many-lenses-category-transition-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w4-many-lenses-category-transition-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w4-many-lenses-category-transition-freeze-v1.json',
  sceneRegistry: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  w3Contract: 'content/web/homepage/hpc2/contracts/hpc2-w3-one-reality-composition-contract-v1.json',
  w3Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w3-one-reality-composition-freeze-v1.json',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  humanReview: 'content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  v8Source: 'content/web/homepage/hpc2/sources/PHIOS-market-positioning-founder-v8-no-pricing.html',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json',
  frozenW3Checker: 'scripts/check-hpc2-w3.mjs'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W4 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const scenes = read(paths.sceneRegistry);
const w3Contract = read(paths.w3Contract);
const publicAssets = read(paths.publicAssets);
const visualRegistry = read(paths.visualRegistry);
const humanReview = read(paths.humanReview);
const v8Manifest = read(paths.v8Manifest);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);
const v8Source = text(paths.v8Source);

assert.equal(contract.work, 'HPC2-W4');
assert.equal(contract.baselineCommit, '51d6a5ea141af8d2ecf24ded830387045d8026b0');
assert.equal(contract.status, 'H01_H03_PRODUCTION_COMPOSITION_ACTIVE_H04_H09_DEFERRED');
assert.equal(evidence.status, 'H03_SOURCE_AND_COMPOSITION_VERIFIED_HUMAN_BROWSER_ACCEPTANCE_NOT_CREATED');
assert.equal(acceptance.state, 'HPC2_W4_H03_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W4_H03_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.sceneRegistry));
assert.equal(contract.predecessorAuthority.w3ContractSha256, sha256(paths.w3Contract));
assert.equal(contract.predecessorAuthority.w3FreezeSha256, sha256(paths.w3Freeze));
assert.equal(sha256(paths.frozenW3Checker), '41d52f0f4cff479e16bdebb0164d3ff4d435e8d42bd290656ecf4885581b8ab8');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W4 frozen artifact drift: ${artifact.path}`);

const expectedBaselineSnapshots = {
  'index.html': 'bb1513aad7f6e0f461eb897b351c6ea522d671699d617ef1d340992dad3ba279',
  'assets/css/hpc2-pre-home-visuals.css': 'b9054705f36a7bc7e1757df6764353af6e191bdff148c599ffc644f61880f625',
  'assets/js/pages/home-production.js': 'a42ff6369e72488a0a9799fc3471726ecdf2ea7d8342e824686cc5ad0bf62eb5',
  'assets/js/locales/en/public.js': '38322a9bd26cf829a11c8a4b768950c1f2736d69237ae9e55aa19e8c3fd78370',
  'assets/js/locales/zh-Hans/public.js': 'f86923fa08af19eaae21338c6fa5198f368245e36d4b8ee9d5675285e464e498',
  'package.json': '8d11369dc7a4d4e13fb3a204a403732d51725da34624c40dd6a3721197cfac4e',
  'scripts/check-hpc2-pre-current.mjs': '6abdd9d4f33746164783e64df9951b68285c9bcdffa5c260ac148025c8636d15',
  'scripts/check-hpc2-w2-current.mjs': 'e128906efaad2034710a22d4ac8f39ecc38f6aec2ffebff5a229ef7be79b3c64',
  'scripts/check-hpc2-w3.mjs': '41d52f0f4cff479e16bdebb0164d3ff4d435e8d42bd290656ecf4885581b8ab8'
};
assert.deepEqual(Object.fromEntries(evidence.baselineSnapshots.map(record => [record.path, record.sha256])), expectedBaselineSnapshots);
for (const record of evidence.immutableAuthoritySnapshots) assert.equal(sha256(record.path), record.sha256, `Authority drift: ${record.path}`);

const h03Authority = scenes.scenes.find(scene => scene.sceneCode === 'H03');
assert.ok(h03Authority, 'H03 authority missing');
assert.equal(h03Authority.sceneTitle, 'Many Lenses / Fragmentation');
assert.deepEqual(h03Authority.primaryNarrativeBeats, ['FRAGMENTATION']);
assert.equal(h03Authority.runtimeSources.length, 0);
assert.equal(h03Authority.runtimePolicy, 'NONE_BY_DESIGN_CATEGORY_EXPLANATION_NOT_RUNTIME_EXECUTION');
assert.equal(h03Authority.visualAssets[0].assetCode, 'FIG-055');
assert.deepEqual(h03Authority.v8NarrativeLineage, contract.v8AndRouteBoundary.sourceBlocks);
assert.ok(h03Authority.ctaDestinations.every(route => route.activationState === 'INACTIVE_PENDING_HPC2_W11'));

assert.equal(count(html, /data-hpc2-scene="H01"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H02"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H03"/g), 1);
for (let scene = 4; scene <= 9; scene += 1) assert.equal(count(html, new RegExp(`data-hpc2-scene="H0${scene}"`, 'g')), 0, `H0${scene} implemented prematurely`);

const h01Html = sceneMarkup(html, 'H01');
const h02Html = sceneMarkup(html, 'H02');
const h03Html = sceneMarkup(html, 'H03');
assert.equal(digestText(h01Html), contract.predecessorProtection.h01MarkupSha256, 'Frozen H01 markup drift');
assert.equal(digestText(h02Html), contract.predecessorProtection.h02MarkupSha256, 'Frozen H02 markup drift');
assert.equal(count(h03Html, /data-hpc2-figure="FIG-055"/g), 1);
assert.deepEqual([...h03Html.matchAll(/data-hpc2-lens="([A-Z_]+)"/g)].map(match => match[1]), contract.lenses.records.map(record => record.code));
assert.deepEqual([...h03Html.matchAll(/data-hpc2-category-stage="([A-Z]+)"/g)].map(match => match[1]), contract.categoryTransition.stages.map(record => record.code));
assert.equal(count(h03Html, /data-hpc2-guardrail="/g), 3);
assert.match(h03Html, /AI can answer\./);
assert.match(h03Html, /Reality still has to be navigated\./);
assert.match(h03Html, /too many disconnected answers/);
assert.match(h03Html, /Self-discovery is where many people begin\./);
assert.match(h03Html, /data-hpc2-planned-route="\/about\/why-phios"/);
assert.match(h03Html, /data-hpc2-secondary-planned-route="\/research\/human-reading-systems"/);
assert.match(h03Html, /data-hpc2-route-state="INACTIVE_PENDING_HPC2_W11"/);
assert.doesNotMatch(h03Html, /\bhref=/i);
assert.doesNotMatch(h03Html, /<(?:form|input|textarea|button|video|canvas)\b/i);
assert.doesNotMatch(h03Html, /ASK_PHIOS|Ask PHI OS|data-ask|knowledge-search/i);

assert.match(css, /\.hpc2-h03\s*\{/);
assert.match(css, /\.hpc2-h03__lens-grid\s*\{[\s\S]*?repeat\(5,/);
assert.match(css, /\.hpc2-h03__transition\s*\{/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h03__lens-grid/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-h03__heading/);

assert.match(runtime, /renderAssetTarget\(lensesFigureRoot, 'FIG-055', locale, visualRegistry\)/);
assert.match(runtime, /H03_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED/);
assert.match(runtime, /H03_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED/);
assert.match(runtime, /H03_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.match(runtime, /hpc2LensesFigureRendered/);
assert.match(runtime, /target !== realityFigureRoot && target !== lensesFigureRoot/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);
const resolverCandidates = fs.readdirSync('assets/js/runtime/web-production').filter(file => /asset.*resolver/i.test(file));
assert.deepEqual(resolverCandidates, ['asset-resolver.js']);

const publicFigure = publicAssets.assets.find(asset => asset.asset_code === 'FIG-055');
const visualFigure = visualRegistry.assets.find(asset => asset.assetCode === 'FIG-055');
const humanFigure = humanReview.records.find(record => record.assetCode === 'FIG-055');
assert.equal(publicFigure.status, 'remote-verified');
assert.equal(publicFigure.object_key, contract.figureAsset.objectKey);
assert.equal(publicFigure.remote.http_status, 200);
assert.equal(publicFigure.remote.svg.validSvg, true);
assert.equal(publicFigure.remote.svg.scriptPresent, false);
assert.equal(publicFigure.remote.svg.externalActiveContentPresent, false);
assert.equal(visualFigure.canonicalFormat, 'SVG');
assert.equal(visualFigure.productionSpec.uiPolicy, 'NO_FAKE_UI');
assert.equal(visualFigure.r2.remoteVerified, true);
assert.equal(visualFigure.machineAcceptance.status, 'MACHINE_ACCEPTED');
assert.equal(humanFigure.decision, 'ACCEPTED');
assert.equal(humanFigure.visualAssetAcceptedOnly, true);
assert.equal(humanFigure.knowledgeApproved, false);
assert.equal(humanFigure.methodApproved, false);
assert.equal(humanFigure.professionalJudgmentApproved, false);
assert.equal(humanFigure.routeActivated, false);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w4`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w4`)).default;
for (const [key, expected] of Object.entries(contract.copy.en)) assert.equal(en.discover.manyLenses[key], expected, `EN H03 copy drift: ${key}`);
for (const [key, expected] of Object.entries(contract.copy['zh-Hans'])) assert.equal(zh.discover.manyLenses[key], expected, `ZH H03 copy drift: ${key}`);
for (const [index, lens] of contract.lenses.records.entries()) {
  const key = ['knowledge', 'ai', 'method', 'experience', 'professionalEvidence'][index];
  assert.deepEqual(en.discover.manyLenses.lenses[key], { label: lens.enLabel, question: lens.enQuestion, role: lens.enRole });
  assert.deepEqual(zh.discover.manyLenses.lenses[key], { label: lens.zhHansLabel, question: lens.zhHansQuestion, role: lens.zhHansRole });
}
for (const [index, stage] of contract.categoryTransition.stages.entries()) {
  const key = ['find', 'explain', 'navigate'][index];
  assert.equal(en.discover.manyLenses.stages[key].copy, stage.en);
  assert.equal(zh.discover.manyLenses.stages[key].copy, stage['zh-Hans']);
}

for (const phrase of ['AI can answer.', 'Reality still has to be navigated.', 'too many disconnected answers', 'Self-discovery is where many people begin.', 'Reality Navigation is what comes next.']) {
  assert.ok(v8Source.includes(phrase), `V8 source phrase missing: ${phrase}`);
}
const reservedBlocks = v8Manifest.semanticBlocks.filter(block => contract.v8AndRouteBoundary.sourceBlocks.includes(block.blockCode));
assert.equal(reservedBlocks.length, 5);
for (const block of reservedBlocks) {
  assert.equal(block.sourceState, 'PRESERVED_CANONICAL_SOURCE_NOT_PRODUCTION_CONSUMER');
  assert.equal(block.successorVerified, false);
  assert.equal(block.deletionAllowedFromHomepage, false);
  assert.equal(block.actualScene, null);
}

assert.equal(acceptance.counts.implementedScenes, 3);
assert.equal(acceptance.counts.routesActivated, 0);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(freeze.preservedBoundaries.h04H09Implemented, false);
assert.equal(freeze.preservedBoundaries.aboutWhyPhiOsRouteActivated, false);
assert.equal(freeze.preservedBoundaries.humanReadingSystemsRouteActivated, false);
assert.equal(freeze.preservedBoundaries.globalProductionAcceptanceCreated, false);
assert.equal(freeze.successorRules.nextWork, 'HPC2-W5_PHI_OS_RUNTIME_COMPOSITION');
assert.equal(/href=["']\/reality\/?["']/.test(html), false, 'W4 must not activate /reality/');

assert.equal(pkg.scripts['check:hpc2-w3-frozen'], 'node scripts/check-hpc2-w3.mjs');
assert.equal(pkg.scripts['check:hpc2-w3'], 'node scripts/check-hpc2-w3-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w4'], 'node scripts/check-hpc2-w4.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w4'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w4'));

console.log('HPC2-W4 Many Lenses / Category Transition: ACCEPTED (repository implementation)');
console.log('  scenes: H01/H02 preserved + H03 implemented; H04-H09 remain deferred');
console.log('  composition: 5 bounded lenses + FIND/EXPLAIN/NAVIGATE; runtime execution and Ask UI = 0');
console.log('  visual: FIG-055 remote-verified and rendered through the existing resolver with fail-closed states');
console.log('  V8: 5 source blocks preserved; summary projection present; promotions/deletions = 0');
console.log('  routes: planned boundaries only; Human/browser acceptance pending; no decision fabricated');
