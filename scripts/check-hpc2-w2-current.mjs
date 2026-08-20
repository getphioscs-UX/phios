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
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w2-hero-production-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w2-hero-production-composition-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w2-hero-production-composition-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w2-hero-production-composition-freeze-v1.json',
  w3Contract: 'content/web/homepage/hpc2/contracts/hpc2-w3-one-reality-composition-contract-v1.json',
  w3Evidence: 'content/web/homepage/hpc2/evidence/hpc2-w3-one-reality-composition-audit-v1.json',
  w3Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w3-one-reality-composition-freeze-v1.json',
  w4Contract: 'content/web/homepage/hpc2/contracts/hpc2-w4-many-lenses-category-transition-contract-v1.json',
  w4Evidence: 'content/web/homepage/hpc2/evidence/hpc2-w4-many-lenses-category-transition-audit-v1.json',
  w4Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w4-many-lenses-category-transition-freeze-v1.json',
  w5Contract: 'content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json',
  w5Evidence: 'content/web/homepage/hpc2/evidence/hpc2-w5-phios-runtime-composition-audit-v1.json',
  w5Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json',
  w6Contract: 'content/web/homepage/hpc2/contracts/hpc2-w6-first-interaction-composition-contract-v1.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  v8Source: 'content/web/homepage/hpc2/sources/PHIOS-market-positioning-founder-v8-no-pricing.html',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing current HPC2-W2 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const w3Contract = read(paths.w3Contract);
const w3Evidence = read(paths.w3Evidence);
const w3Freeze = read(paths.w3Freeze);
const w4Contract = read(paths.w4Contract);
const w4Evidence = read(paths.w4Evidence);
const w4Freeze = read(paths.w4Freeze);
const w5Contract = read(paths.w5Contract);
const w5Evidence = read(paths.w5Evidence);
const w5Freeze = read(paths.w5Freeze);
const w6Contract = read(paths.w6Contract);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);
const v8Source = text(paths.v8Source);

assert.equal(contract.work, 'HPC2-W2');
assert.equal(contract.baselineCommit, 'efc6c556107008cea495c2231e98f179436bd088');
assert.equal(contract.status, 'H01_HERO_PRODUCTION_COMPOSITION_ACTIVE_H02_H09_DEFERRED');
assert.equal(evidence.status, 'H01_SOURCE_AND_RUNTIME_COMPOSITION_VERIFIED_HUMAN_BROWSER_ACCEPTANCE_NOT_CREATED');
assert.equal(acceptance.state, 'HPC2_W2_H01_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W2_H01_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W2 immutable evidence drift: ${artifact.path}`);

assert.equal(w3Contract.baselineCommit, '27e992346c8fca10e613598088abc092b353e392');
assert.equal(w3Contract.predecessorAuthority.w2ContractSha256, sha256(paths.contract));
assert.equal(w3Contract.predecessorAuthority.w2FreezeSha256, sha256(paths.freeze));
assert.equal(w3Contract.predecessorProtection.h01ChangedByW3, false);
assert.equal(w3Evidence.implementationObservations.h01MarkupUnchangedFromW2, true);
assert.equal(w3Freeze.structuralFreeze.h01MayBeChangedOnlyByVersionedSuccessor, true);
assert.equal(w4Contract.predecessorAuthority.w3ContractSha256, sha256(paths.w3Contract));
assert.equal(w4Contract.predecessorAuthority.w3FreezeSha256, sha256(paths.w3Freeze));
assert.equal(w4Evidence.implementationObservations.h01MarkupUnchangedFromW2, true);
assert.equal(w4Freeze.structuralFreeze.h01MarkupSha256, w3Contract.predecessorProtection.h01MarkupSha256);
assert.equal(w5Contract.predecessorAuthority.w4ContractSha256, sha256(paths.w4Contract));
assert.equal(w5Contract.predecessorAuthority.w4FreezeSha256, sha256(paths.w4Freeze));
assert.equal(w5Evidence.implementationObservations.h01MarkupUnchangedFromW2, true);
assert.equal(w5Freeze.structuralFreeze.h01MarkupSha256, w3Contract.predecessorProtection.h01MarkupSha256);
assert.equal(w6Contract.predecessorAuthority.w5ContractSha256, sha256(paths.w5Contract));
assert.equal(w6Contract.predecessorAuthority.w5FreezeSha256, sha256(paths.w5Freeze));
assert.equal(w6Contract.predecessorProtection.h01H04ChangedByW6, false);

const expectedW2ConsumerSnapshots = {
  'index.html': 'c30e0fb9d5f17f9325b383c43a7040b6bb66e42146ad0865873b75199f308ebc',
  'assets/css/hpc2-pre-home-visuals.css': '7c3ea6ab9dc9cfaed85f106e4356e72cb16620ab446f945f0f061e38a028d236',
  'assets/js/pages/home-production.js': '8abc6cc87fd26d512fca5560ee67f3987097dc41af2e76fc7751d08b19406373',
  'assets/js/locales/en/public.js': '260c5b05d9ffde8e3706d5e6c4859262b3c517debcfa950959331d3770069b42',
  'assets/js/locales/zh-Hans/public.js': '03da329e561b37e3478742d88e4e1916d6d5eb8fb45bdfd11c6180eca717dc46',
  'package.json': '373e704596213e205efa9cd291f5d1b5c6b948e5e0b77595b78f16005845981c'
};
assert.deepEqual(Object.fromEntries(w3Evidence.baselineSnapshots.map(record => [record.path, record.sha256])), expectedW2ConsumerSnapshots);

assert.equal(count(html, /data-hpc2-scene="H01"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H02"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H03"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H04"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H05"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H06"/g), 1);
for (let scene = 7; scene <= 9; scene += 1) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="H0${scene}"`, 'g')), 0, `H0${scene} was implemented before its owner work`);
}
const h01Html = sceneMarkup(html, 'H01');
assert.equal(digestText(h01Html), w3Contract.predecessorProtection.h01MarkupSha256, 'Frozen W2 H01 markup drift');
assert.equal(count(h01Html, /data-hpc2-hero="HERO-001"/g), 1);
assert.match(h01Html, /href="\/reality-entry"[^>]*data-hpc2-action="START_WITH_MY_REALITY"/);
assert.match(h01Html, /href="#wpr-platform-title"[^>]*data-hpc2-action="EXPLORE_PHI_OS"/);
assert.doesNotMatch(h01Html, /ASK_PHIOS|Ask PHI OS|\/knowledge-search/i);
assert.doesNotMatch(h01Html, /<(?:form|input|textarea|button|video|canvas)\b/i);

assert.match(css, /\.hpc2-h01\s*\{[\s\S]*?min-height:\s*94svh;/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h01\s*\{[\s\S]*?min-height:\s*92svh;/);
assert.match(css, /\.hpc2-h01__readability\s*\{[\s\S]*?linear-gradient/);
assert.match(runtime, /renderAssetTarget\(heroRoot, 'HERO-001', locale, visualRegistry\)/);
assert.match(runtime, /H01_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED/);
assert.match(runtime, /H01_FAIL_CLOSED_HERO_ASSET_NOT_RENDERED/);
assert.match(runtime, /H01_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w2current`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w2current`)).default;
assert.deepEqual(Object.fromEntries(['brand', 'platform', 'line1', 'line2', 'principles'].map(key => [key, en.discover.hero[key]])), contract.copy.en);
assert.deepEqual(Object.fromEntries(['brand', 'platform', 'line1', 'line2', 'principles'].map(key => [key, zh.discover.hero[key]])), contract.copy['zh-Hans']);
assert.equal(en.discover.hero.primary, 'Start with my reality');
assert.equal(en.discover.hero.secondary, 'Explore PHI OS');
assert.equal(zh.discover.hero.primary, '从我的现实开始');
assert.equal(zh.discover.hero.secondary, '探索 PHI OS');

for (const phrase of ['AI can answer.', 'Reality still has to be navigated.', 'What is actually happening in my reality—and what should I do next?']) {
  assert.ok(v8Source.includes(phrase), `W2 V8 reservation was deleted: ${phrase}`);
}
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(w3Contract.successorBoundary.humanVisualAcceptanceClaimed, false);
assert.equal(w3Contract.successorBoundary.browserAcceptanceClaimed, false);
assert.equal(/href=["']\/reality\/?["']/.test(html), false, 'W3 must not activate /reality/');

assert.equal(pkg.scripts['check:hpc2-w2-frozen'], 'node scripts/check-hpc2-w2.mjs');
assert.equal(pkg.scripts['check:hpc2-w2'], 'node scripts/check-hpc2-w2-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w3-frozen'], 'node scripts/check-hpc2-w3.mjs');
assert.equal(pkg.scripts['check:hpc2-w3'], 'node scripts/check-hpc2-w3-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w4-frozen'], 'node scripts/check-hpc2-w4.mjs');
assert.equal(pkg.scripts['check:hpc2-w4'], 'node scripts/check-hpc2-w4-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w5-frozen'], 'node scripts/check-hpc2-w5-frozen-artifacts.mjs');
assert.equal(pkg.scripts['check:hpc2-w5'], 'node scripts/check-hpc2-w5-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w6-frozen'], 'node scripts/check-hpc2-w6.mjs');
assert.equal(pkg.scripts['check:hpc2-w6'], 'node scripts/check-hpc2-w6-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w7'], 'node scripts/check-hpc2-w7.mjs');

console.log('HPC2-W2 current successor: ACCEPTED');
console.log('  frozen H01 preserved byte-for-byte at scene scope; immutable W2 evidence preserved');
console.log('  additive H02-H06 are governed by HPC2-W3/W4/W5/W6/W7; Ask entries reuse CKA-W0-W17');
console.log('  H07-H09 and /reality/ remain inactive');
console.log('  W2 Human/browser acceptance remains pending; no decision fabricated');
