import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(text(path), 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, code) => {
  const marker = source.indexOf(`data-hpc2-scene="${code}"`);
  assert.ok(marker >= 0, `${code} missing`);
  const start = source.lastIndexOf('<section', marker);
  const end = source.indexOf('</section>', marker);
  assert.ok(start >= 0 && end > marker, `${code} boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = {
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w14-composition-acceptance-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w14-composition-acceptance-audit-v1.json',
  v8Completion: 'content/web/homepage/hpc2/evidence/hpc2-w14-v8-successor-completion-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/homepage-composition-acceptance-v2.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w14-composition-acceptance-freeze-v1.json',
  w13Acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w13-homepage-responsive-locale-accessibility-acceptance-v1.json',
  scenes: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  capability: 'content/web/homepage/hpc2/homepage-capability-intake-v1.json',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  w11Migration: 'content/web/homepage/hpc2/v8-content-destination-migration-v1.json',
  visualProjection: 'content/web/homepage/hpc2/homepage-visual-consumption-v2.json',
  publicAssets: 'content/registry/public-assets.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  pkg: 'package.json'
};
for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing W14 dependency: ${path}`);
assert.ok(fs.existsSync('professional-boundary.html'), 'V8 boundary successor route is missing');
assert.ok(fs.existsSync('reality-journey.html'), 'V8 Journey overview successor route is missing');

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const v8Completion = read(paths.v8Completion);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const w13 = read(paths.w13Acceptance);
const scenes = read(paths.scenes);
const capability = read(paths.capability);
const v8Manifest = read(paths.v8Manifest);
const w11 = read(paths.w11Migration);
const visualProjection = read(paths.visualProjection);
const publicAssets = read(paths.publicAssets);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);
const pkg = read(paths.pkg);

assert.equal(contract.baselineCommit, '64ead9a9addf56f4f83c28736bf205cdc9380c10');
assert.equal(contract.allowedStatus, 'HPC2_COMPOSITION_READY');
assert.equal(contract.globalProductionFreezeOwnedHere, false);
for (const artifact of freeze.immutableArtifacts) {
  assert.equal(sha256(artifact.path), artifact.sha256, `W14 frozen artifact drift: ${artifact.path}`);
}
assert.equal(freeze.globalProductionFreezeDeclared, false);
assert.equal(acceptance.status, 'HPC2_COMPOSITION_READY');
assert.equal(acceptance.scope, 'HOMEPAGE_COMPOSITION_ONLY');
assert.equal(acceptance.globalProductionFreeze.claimed, false);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.deploymentAcceptance.claimed, false);
assert.equal(w13.state, 'HPC2_W13_REPOSITORY_MATRIX_SUBSET_READY_BROWSER_REVALIDATION_PENDING');
assert.equal(w13.matrix.primaryHomepageStateCount, 14);
assert.equal(w13.matrix.browserAccepted, false);

const requiredOrder = ['H01','H02','H03','H04','H05','H06','H07','H08','H09'];
const sceneCodes = [...html.matchAll(/data-hpc2-scene="(H\d\d)"/g)].map(match => match[1]);
assert.deepEqual(sceneCodes, requiredOrder, 'Homepage must expose exactly one continuous H01-H09 narrative');
assert.equal(sceneCodes.length, 9);
assert.doesNotMatch(html, /data-hpc2-scene="H(?:1\d|[2-9]\d)"/);
for (let index = 1; index < requiredOrder.length; index += 1) {
  assert.ok(html.indexOf(`data-hpc2-scene="${requiredOrder[index - 1]}"`) < html.indexOf(`data-hpc2-scene="${requiredOrder[index]}"`), 'Scene order drift');
}

// The old pre-HPC2 tail remains source-compatible but must not render after the final H09 endpoint.
const compatibilitySelectors = [
  '[data-hpc2-v8-teaser="FOUNDER"]',
  'section[aria-labelledby="value-title"]',
  'section[aria-labelledby="entries-title"]',
  '.wpr-production-band[aria-labelledby="wpr-platform-title"]',
  '.wpr-production-band[aria-labelledby="wpr-visual-title"]',
  'section[aria-labelledby="boundary-title"]'
];
for (const selector of compatibilitySelectors) assert.ok(css.includes(selector), `Compatibility tail not suppressed: ${selector}`);
assert.match(css, /HPC2-W14[\s\S]*?display:\s*none\s*!important;/);
assert.equal(count(html, /data-hpc2-v8-teaser="FOUNDER"/g), 1);
assert.match(html, /id="wpr-platform-title"[^>]*data-hpc2-compatibility-target="H04"/);
assert.equal(count(html, /id="wpr-platform-title"/g), 1, 'Current compatibility target must be unique');
assert.match(html, /id="wpr-platform-title-legacy"/);
assert.ok(html.indexOf('id="wpr-platform-title"') < html.indexOf('data-hpc2-scene="H04"'));

// The visible narrative itself must not contain a research dump or repeated service catalog.
const narrativeStart = html.lastIndexOf('<section', html.indexOf('data-hpc2-scene="H01"'));
const h09End = html.indexOf('</section>', html.indexOf('data-hpc2-scene="H09"')) + '</section>'.length;
const narrative = html.slice(narrativeStart, h09End);
assert.equal(count(narrative, /href="\/services"/g), 1, 'Professional/services explanation must remain singular in H01-H09');
assert.equal(count(narrative, /data-v8-block=/g), 0, 'Full V8/research blocks must not be dumped into Homepage scenes');
assert.equal(count(narrative, /href="\/research\//g), 0, 'Research stays contextual/destination-bound rather than a Homepage dump');

// Required Homepage capabilities: every P0 requirement has a scene assignment and an actual current consumer.
assert.equal(capability.recordCount, 13);
const requiredCapabilities = capability.records.map(record => record.capabilityCode);
const sceneCapabilities = new Set(scenes.scenes.flatMap(scene => scene.capabilitiesConsumed.map(record => record.capabilityCode)));
for (const code of requiredCapabilities) assert.ok(sceneCapabilities.has(code), `Required Homepage capability has no H01-H09 mapping: ${code}`);
assert.equal(requiredCapabilities.filter(code => !sceneCapabilities.has(code)).length, 0);
const currentEvidence = {
  REALITY_NAVIGATION_PLATFORM: /data-hpc2-scene="H01"/,
  FIVE_VOLUME_KNOWLEDGE_SYSTEM: /data-hpc2-scene="H07"/,
  PUBLISHED_KNOWLEDGE: /data-hpc2-knowledge-action="READ_PUBLISHED_KNOWLEDGE"/,
  REALITY_JOURNEY: /href="\/reality-journey"/,
  PERSONAL_REALITY: /href="\/personal-runtime"/,
  FINANCIAL_REALITY: /href="\/professional\/financial"/,
  READING_NAVIGATION: /data-hpc2-runtime-stage="READING"[\s\S]*?data-hpc2-runtime-stage="NAVIGATION"/,
  ASK_PHIOS: /data-cka-entry-surface="HOMEPAGE"/,
  ACADEMY: /href="\/academy"/,
  SERVICES: /href="\/services"/,
  PROFESSIONAL: /data-hpc2-authority-level="PHIOS_PROFESSIONAL"/,
  FIGURES_VISUAL_KNOWLEDGE: /data-hpc2-figure="FIG-054"/,
  CONTINUITY: /data-hpc2-continuity-loop="UNDERSTAND_CHOOSE_ACT_OBSERVE_REVIEW_CONTINUE"/
};
for (const code of requiredCapabilities) {
  assert.ok(currentEvidence[code], `W14 checker missing consumer rule for ${code}`);
  assert.match(narrative, currentEvidence[code], `Expected Homepage consumer is silent/missing: ${code}`);
}

// V8: preserve W0/W11 facts, then account for the five W11-pending blocks through current composition successors.
assert.equal(v8Manifest.semanticBlocks.length, 39);
assert.equal(w11.summary.repositoryVerifiedCount, 34);
assert.equal(w11.summary.pendingCount, 5);
assert.deepEqual(w11.pendingBlocks.map(record => record.blockCode).sort(), ['V8-BOUNDARY-001','V8-ECO-001','V8-HERO-002','V8-JOURNEY-001','V8-SYSTEM-001'].sort());
assert.equal(v8Completion.predecessorVerifiedCount, 34);
assert.equal(v8Completion.predecessorPendingCount, 5);
assert.equal(v8Completion.successorCompletions.length, 5);
assert.equal(v8Completion.summary.sourceBlockCount, 39);
assert.equal(v8Completion.summary.currentVerifiedOrSuccessorAccountedCount, 39);
assert.equal(v8Completion.summary.unaccountedCount, 0);
assert.equal(v8Completion.authority.w0ManifestRewritten, false);
assert.equal(v8Completion.authority.w11MigrationRewritten, false);
assert.match(sceneMarkup(html, 'H05'), /What is changing, difficult or unclear right now\?/);
const h04 = sceneMarkup(html, 'H04');
assert.match(h04, /The intelligence is not one model\. It is an architecture\./);
assert.match(h04, /data-hpc2-figure="FIG-056"/);
assert.match(h04, /data-hpc2-runtime-stage="READING"/);
assert.match(h04, /data-hpc2-runtime-stage="NAVIGATION"/);
assert.match(sceneMarkup(html, 'H07'), /data-hpc2-five-volume-state=/);
assert.match(sceneMarkup(html, 'H08'), /data-hpc2-authority-level="PHIOS_PROFESSIONAL"/);
assert.match(sceneMarkup(html, 'H09'), /data-hpc2-loop-stage="REVIEW"/);

// Public density boundary: references to professional judgment may explain limits, but no private/professional state is rendered.
for (const forbidden of [/data-runtime-id=/i, /data-customer-state=/i, /data-private-evidence=/i, /data-professional-workspace=/i, /client[_-]?id=/i]) {
  assert.doesNotMatch(narrative, forbidden);
}
const h05 = sceneMarkup(html, 'H05');
assert.equal(count(narrative, /<(?:form|textarea|input)\b/g), count(h05, /<(?:form|textarea|input)\b/g), 'Only H05 public first interaction may contain input controls');
assert.match(h05, /data-hpc2-persistence="NONE"/);

// Asset projection must remain governed through the existing registry + resolver.
assert.equal(visualProjection.authority.assetAuthorityCreated, false);
assert.equal(visualProjection.authority.assetRegistryCreated, false);
assert.equal(visualProjection.authority.assetResolverCreated, false);
assert.doesNotMatch(narrative, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);
assert.equal(count(narrative, /<img\b[^>]*src=/g), 0, 'Homepage source must not hardcode governed visual URLs');
for (const record of visualProjection.records.filter(record => record.assetCode)) {
  const asset = publicAssets.assets.find(candidate => candidate.asset_code === record.assetCode);
  assert.ok(asset, `Missing governed public asset ${record.assetCode}`);
  assert.equal(asset.object_key, record.objectKey);
}
assert.match(runtime, /resolveCanonicalVisual/);
assert.equal(fs.readdirSync('assets/js/runtime/web-production').filter(name => /asset.*resolver/i.test(name)).join(','), 'asset-resolver.js');

// CKA: required contextual entries exist, but the Hero remains free of Ask UI/primary routing.
const h01 = sceneMarkup(html, 'H01');
assert.doesNotMatch(h01, /knowledge-search|ASK_PHIOS|Ask PHI OS/i);
const ckaScenes = ['H04','H05','H07','H09'];
for (const code of ckaScenes) assert.match(sceneMarkup(html, code), /knowledge-search|data-cka-entry|ASK_PHIOS/i, `${code} missing required Ask PHI OS entry`);
assert.equal(acceptance.cka.forcedIntoHeroPrimary, false);

assert.equal(evidence.narrative.sceneCount, 9);
assert.equal(evidence.capability.silentExpectedHomepageConsumerCount, 0);
assert.equal(evidence.v8.accountedCount, 39);
assert.equal(evidence.v8.unaccountedCount, 0);
assert.equal(evidence.globalProductionFreezeDeclared, false);
assert.equal(pkg.scripts['check:hpc2-w14'], 'node scripts/check-hpc2-w14.mjs');
assert.ok(pkg.scripts['check:hpc2'].includes('npm run check:hpc2-w14'));

console.log('✓ HPC2-W14 Homepage Composition Acceptance passed: HPC2_COMPOSITION_READY.');
console.log('  Narrative: exactly H01-H09; historical compatibility tail is source-preserved but not rendered.');
console.log('  Capability: 13/13 required Homepage capabilities have current governed consumers; CKA appears in H04/H05/H07/H09, never Hero primary.');
console.log('  V8: 39/39 semantic blocks accounted (34 W11 verified + 5 current composition successors); no historical authority rewritten.');
console.log('  Public density/assets remain bounded; no global Production Freeze, Human, browser or deployment acceptance is synthesized.');
