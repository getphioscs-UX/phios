import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const visualRegistry = read('content/web-production/registries/client-visual-asset-registry-v1.2.json');
const publicAssets = read('content/registry/public-assets.json');
const critical = read('content/web/homepage/hpc2-pre/hpc2-pre-critical-asset-registry-v1.json');
const finalReadiness = read('content/web/homepage/hpc2-pre/hpc2-pre-final-readiness-v1.json');
const browser = read('content/web/homepage/hpc2-pre/review/browser-visual-review-v1.json');
const human = read('content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json');
const preFreeze = read('content/web/homepage/hpc2-pre/freeze/hpc2-pre-v2-freeze-v1.json');
const w2Contract = read('content/web/homepage/hpc2/contracts/hpc2-w2-hero-production-composition-contract-v1.json');
const w2Evidence = read('content/web/homepage/hpc2/evidence/hpc2-w2-hero-production-composition-audit-v1.json');
const w2Freeze = read('content/web/homepage/hpc2/freeze/hpc2-w2-hero-production-composition-freeze-v1.json');
const w3Contract = read('content/web/homepage/hpc2/contracts/hpc2-w3-one-reality-composition-contract-v1.json');
const w3Evidence = read('content/web/homepage/hpc2/evidence/hpc2-w3-one-reality-composition-audit-v1.json');
const w3Freeze = read('content/web/homepage/hpc2/freeze/hpc2-w3-one-reality-composition-freeze-v1.json');
const index = fs.readFileSync('index.html', 'utf8');
const home = fs.readFileSync('assets/js/pages/home-production.js', 'utf8');
const data = fs.readFileSync('assets/js/web-production/public-surface-data.js', 'utf8');
const resolver = fs.readFileSync('assets/js/runtime/web-production/asset-resolver.js', 'utf8');

assert.equal(visualRegistry.schemaVersion, '1.2.0');
assert.equal(visualRegistry.assets.length, 152, 'Visual registry must preserve 152 planned identities.');
const heroes = visualRegistry.assets.filter(asset => asset.assetType === 'HERO');
const figures = visualRegistry.assets.filter(asset => asset.assetType === 'FIGURE');
const icons = visualRegistry.assets.filter(asset => asset.assetType === 'ICON');
assert.equal(heroes.length, 23);
assert.equal(figures.length, 57);
assert.equal(heroes.length + figures.length, 80);
assert.equal(icons.length, 43);
for (const hero of heroes) {
  assert.equal(hero.canonicalFormat, 'WebP', `${hero.assetCode} canonical format`);
  assert.deepEqual(hero.masterSize, { width: 2560, height: 1440 }, `${hero.assetCode} master size`);
  assert.equal(hero.aspectRatio, '16:9');
  assert.match(hero.r2.objectKey, /^images\/hero\/(?:books\/)?PHIOS-HERO-.*-v1\.webp$/);
  for (const forbidden of ['LONG_COPY', 'BUTTON', 'FAKE_UI', 'LOGO', 'EMBEDDED_CTA']) {
    assert.ok(hero.forbiddenElements.includes(forbidden), `${hero.assetCode} forbids ${forbidden}`);
  }
}
for (const figure of figures) {
  assert.equal(figure.canonicalFormat, 'SVG', `${figure.assetCode} canonical format`);
  assert.match(figure.officialFilename, /^PHIOS-FIGURE-.*-v1\.svg$/);
  assert.ok(figure.masterSize?.viewBox, `${figure.assetCode} viewBox missing`);
  assert.equal(figure.machineAcceptance?.status, 'MACHINE_ACCEPTED', `${figure.assetCode} machine acceptance missing`);
  assert.equal(figure.machineAcceptance?.scriptPresent, false);
  assert.equal(figure.machineAcceptance?.externalActiveContentPresent, false);
}
const canonicalKeys = [...heroes, ...figures].map(asset => asset.r2.objectKey);
assert.equal(new Set(canonicalKeys).size, canonicalKeys.length);

const expectedCritical = ['HERO-001', 'BOOK-1-HARDCOVER', 'BOOK-2-HARDCOVER', 'BOOK-3-HARDCOVER', 'BOOK-4-HARDCOVER', 'BOOK-5-HARDCOVER', 'FIG-001', 'FIG-002', 'FIG-003', 'FIG-004', 'FIG-005', 'FIG-006', 'FIG-054', 'FIG-055', 'FIG-056', 'FIG-057'];
assert.equal(critical.records.length, 16);
assert.deepEqual(critical.records.map(record => record.assetCode), expectedCritical);
for (const code of [...heroes.map(asset => asset.assetCode), ...figures.map(asset => asset.assetCode), ...icons.map(asset => asset.assetCode), ...expectedCritical.filter(code => code.startsWith('BOOK-'))]) {
  const record = publicAssets.assets.find(asset => asset.asset_code === code);
  assert.ok(record, `Concrete public member missing: ${code}`);
  assert.ok(record.object_key && !record.object_key.endsWith('/'), `${code} cannot resolve from a folder prefix`);
}
assert.equal(publicAssets.bucket, 'phios-public-assets');
assert.match(publicAssets.resolution_policy?.browser_runtime?.resolver || publicAssets.resolution_policy?.runtime_resolver || 'assets/js/runtime/web-production/asset-resolver.js', /asset-resolver\.js$/);

assert.ok(index.includes('/assets/css/hpc2-pre-home-visuals.css'));
assert.ok(index.includes('data-hpc2-hero="HERO-001"'));
for (const code of ['FIG-001', 'FIG-002', 'FIG-003', 'FIG-004', 'FIG-005', 'FIG-006']) assert.ok(index.includes(`data-hpc2-figure="${code}"`), `${code} static Homepage consumer missing`);
for (const code of ['FIG-054', 'FIG-055', 'FIG-056', 'FIG-057']) assert.ok(home.includes(`'${code}'`), `${code} gallery consumer missing`);
for (const code of ['ICON-006', 'ICON-007', 'ICON-008', 'ICON-009', 'ICON-014', 'ICON-015']) assert.ok(index.includes(`data-hpc2-icon="${code}"`), `${code} Homepage icon consumer missing`);
assert.ok(home.includes('resolveCanonicalVisual'));
assert.ok(home.includes('resolveBookCover'));
assert.equal(home.includes('figurePublicSrc'), false);
assert.ok(data.includes('resolvePublicAssetForWeb'));
assert.ok(resolver.includes('PUBLIC_ASSET_BASE_URL_UNAVAILABLE'));
assert.equal(/href=["']\/reality\/?["']/.test(index), false, 'HPC2-PRE successor must not activate /reality/.');
assert.ok(index.includes('href="/reality-journey"'), 'Legacy Reality Journey route must remain available below H01.');
const resolverCandidates = fs.readdirSync('assets/js/runtime/web-production').filter(file => /asset.*resolver/i.test(file));
assert.deepEqual(resolverCandidates, ['asset-resolver.js']);

assert.equal(preFreeze.schemaVersion, '1.1.0');
const successorMutablePaths = new Set(['index.html', 'assets/css/hpc2-pre-home-visuals.css', 'assets/js/pages/home-production.js']);
const baselineSnapshots = new Map(w2Evidence.baselineSnapshots.map(snapshot => [snapshot.path, snapshot.sha256]));
for (const [file, frozenDigest] of Object.entries(preFreeze.implementationDigests)) {
  if (successorMutablePaths.has(file)) {
    assert.equal(baselineSnapshots.get(file), frozenDigest, `HPC2-W2 did not originate from the frozen HPC2-PRE consumer: ${file}`);
  } else {
    assert.equal(digest(file), frozenDigest, `HPC2-PRE immutable implementation freeze drift outside W2 scope: ${file}`);
  }
}
assert.equal(w2Contract.predecessorAuthority.relationship, 'ADDITIVE_H01_COMPOSITION_CONSUMES_W1_AUTHORITY_NO_SECOND_HOMEPAGE_RUNTIME');
assert.equal(w2Contract.heroAsset.existingResolverReused, true);
assert.equal(w2Contract.heroAsset.secondResolverCreated, false);
assert.equal(w2Freeze.structuralFreeze.h01MayBeChangedOnlyByVersionedSuccessor, true);
assert.equal(w2Freeze.preservedBoundaries.h02H09Implemented, false);
assert.equal(w2Freeze.preservedBoundaries.realityCandidateRouteActivated, false);
assert.equal(w3Contract.predecessorAuthority.w2FreezeSha256, digest('content/web/homepage/hpc2/freeze/hpc2-w2-hero-production-composition-freeze-v1.json'));
assert.equal(w3Contract.figureAsset.assetCode, 'FIG-054');
assert.equal(w3Contract.figureAsset.existingResolverReused, true);
assert.equal(w3Contract.figureAsset.secondResolverCreated, false);
assert.equal(w3Evidence.implementationObservations.h01MarkupUnchangedFromW2, true);
assert.deepEqual(w3Evidence.implementationObservations.sceneMarkers, { h01: 1, h02: 1, h03ThroughH09: 0 });
assert.equal(w3Evidence.routeObservations.candidateRealityRouteActivatedByW3, false);
assert.equal(w3Freeze.preservedBoundaries.h03H09Implemented, false);
assert.equal(w3Freeze.preservedBoundaries.realityCandidateRouteActivated, false);
assert.ok(index.includes('data-hpc2-scene="H02"'));
assert.ok(index.includes('data-hpc2-figure="FIG-054"'));
for (let scene = 3; scene <= 9; scene += 1) assert.equal(index.includes(`data-hpc2-scene="H0${scene}"`), false);

assert.equal(human.records.length, 16);
assert.ok(human.records.every(record => ['PENDING', 'ACCEPTED', 'REVISION_REQUIRED'].includes(record.decision)));
assert.equal(browser.matrix.length, 6);
assert.deepEqual(browser.matrix.map(record => `${record.viewportWidth}:${record.locale}`), ['390:en', '390:zh-Hans', '768:en', '768:zh-Hans', '1440:en', '1440:zh-Hans']);
assert.ok(['BLOCKED', 'VISUAL_ASSETS_READY_NOT_CONSUMED', 'CONSUMED_NOT_BROWSER_ACCEPTED', 'HPC2_PRE_READY'].includes(finalReadiness.state));
const accepted = critical.records.filter(record => record.humanAccepted).length;
const remote = critical.records.filter(record => record.remoteVerified).length;
if (finalReadiness.state === 'HPC2_PRE_READY') {
  assert.equal(accepted, 16);
  assert.equal(remote, 16);
  assert.ok(browser.matrix.every(record => record.decision === 'ACCEPTED'));
}

console.log('✓ HPC2-PRE current successor passed: frozen visual authority preserved; W2 H01 and W3 H02 consumer drift is explicitly additive and structurally governed.');
console.log(`✓ Current truth state: ${finalReadiness.state}; critical Human Accepted ${accepted}/16; Remote Verified ${remote}/16; historical PRE browser matrix ${browser.matrix.filter(record => record.decision === 'ACCEPTED').length}/6.`);
console.log('✓ Single resolver preserved; H03-H09 and /reality/ remain independently gated.');
