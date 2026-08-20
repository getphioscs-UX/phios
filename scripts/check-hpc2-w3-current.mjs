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
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w3-one-reality-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w3-one-reality-composition-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w3-one-reality-composition-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w3-one-reality-composition-freeze-v1.json',
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
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing current HPC2-W3 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
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

assert.equal(contract.work, 'HPC2-W3');
assert.equal(contract.baselineCommit, '27e992346c8fca10e613598088abc092b353e392');
assert.equal(evidence.status, 'H02_SOURCE_AND_RUNTIME_COMPOSITION_VERIFIED_HUMAN_BROWSER_ACCEPTANCE_NOT_CREATED');
assert.equal(acceptance.state, 'HPC2_W3_H02_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W3_H02_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W3 frozen artifact drift: ${artifact.path}`);

assert.equal(w4Contract.predecessorAuthority.w3ContractSha256, sha256(paths.contract));
assert.equal(w4Contract.predecessorAuthority.w3FreezeSha256, sha256(paths.freeze));
assert.equal(w4Contract.predecessorProtection.h01ChangedByW4, false);
assert.equal(w4Contract.predecessorProtection.h02ChangedByW4, false);
assert.equal(w4Evidence.implementationObservations.h02MarkupUnchangedFromW3, true);
assert.equal(w4Freeze.structuralFreeze.h02MarkupSha256, w4Contract.predecessorProtection.h02MarkupSha256);
assert.equal(w5Contract.predecessorAuthority.w4ContractSha256, sha256(paths.w4Contract));
assert.equal(w5Contract.predecessorAuthority.w4FreezeSha256, sha256(paths.w4Freeze));
assert.equal(w5Evidence.implementationObservations.h02MarkupUnchangedFromW3, true);
assert.equal(w5Freeze.structuralFreeze.h02MarkupSha256, w4Contract.predecessorProtection.h02MarkupSha256);
assert.equal(w6Contract.predecessorAuthority.w5ContractSha256, sha256(paths.w5Contract));
assert.equal(w6Contract.predecessorAuthority.w5FreezeSha256, sha256(paths.w5Freeze));
assert.equal(w6Contract.predecessorProtection.h01H04ChangedByW6, false);

assert.equal(count(html, /data-hpc2-scene="H01"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H02"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H03"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H04"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H05"/g), 1);
assert.equal(count(html, /data-hpc2-scene="H06"/g), 1);
for (const scene of ['H07', 'H08']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1, `${scene} successor count drift`);
assert.equal(count(html, /data-hpc2-scene="H09"/g), 0, 'H09 was implemented before HPC2-W10');

const h01Html = sceneMarkup(html, 'H01');
const h02Html = sceneMarkup(html, 'H02');
assert.equal(digestText(h01Html), contract.predecessorProtection.h01MarkupSha256, 'Frozen H01 markup drift');
assert.equal(digestText(h02Html), w4Contract.predecessorProtection.h02MarkupSha256, 'Frozen H02 markup drift');
assert.equal(count(h02Html, /data-hpc2-figure="FIG-054"/g), 1);
assert.equal(count(h02Html, /data-hpc2-domain=/g), 10);
assert.equal(count(h02Html, /data-hpc2-semantic=/g), 6);
assert.equal(count(h02Html, /data-hpc2-example=/g), 6);
assert.match(h02Html, /data-hpc2-example-state="SYNTHETIC_PUBLIC_EXAMPLE_NO_PRIVATE_CASE_DATA"/);
assert.doesNotMatch(h02Html, /<(?:form|input|textarea|button|video|canvas)\b/i);

assert.match(css, /\.hpc2-h02\s*\{/);
assert.match(css, /\.hpc2-reality-field\s*\{/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-reality-field/);
assert.match(runtime, /renderAssetTarget\(realityFigureRoot, 'FIG-054', locale, visualRegistry\)/);
assert.match(runtime, /H02_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED/);
assert.match(runtime, /H02_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED/);
assert.match(runtime, /H02_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w3current`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w3current`)).default;
for (const [key, expected] of Object.entries(contract.copy.en)) assert.equal(en.discover.oneReality[key], expected, `EN H02 copy drift: ${key}`);
for (const [key, expected] of Object.entries(contract.copy['zh-Hans'])) assert.equal(zh.discover.oneReality[key], expected, `ZH H02 copy drift: ${key}`);

assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(w5Contract.successorBoundary.humanVisualAcceptanceClaimed, false);
assert.equal(w5Contract.successorBoundary.browserAcceptanceClaimed, false);
assert.equal(/href=["']\/reality\/?["']/.test(html), false, 'W5 must not activate /reality/');

assert.equal(pkg.scripts['check:hpc2-w3-frozen'], 'node scripts/check-hpc2-w3.mjs');
assert.equal(pkg.scripts['check:hpc2-w3'], 'node scripts/check-hpc2-w3-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w4-frozen'], 'node scripts/check-hpc2-w4.mjs');
assert.equal(pkg.scripts['check:hpc2-w4'], 'node scripts/check-hpc2-w4-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w5-frozen'], 'node scripts/check-hpc2-w5-frozen-artifacts.mjs');
assert.equal(pkg.scripts['check:hpc2-w5'], 'node scripts/check-hpc2-w5-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w6-frozen'], 'node scripts/check-hpc2-w6.mjs');
assert.equal(pkg.scripts['check:hpc2-w6'], 'node scripts/check-hpc2-w6-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w7'], 'node scripts/check-hpc2-w7-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w8'], 'node scripts/check-hpc2-w8.mjs');
assert.equal(pkg.scripts['check:hpc2-w9'], 'node scripts/check-hpc2-w9.mjs');

console.log('HPC2-W3 current successor: ACCEPTED');
console.log('  frozen H01/H02 preserved byte-for-byte at scene scope; immutable W3 evidence preserved');
console.log('  additive H03-H08 are governed by HPC2-W4 through W9; Ask entries reuse CKA-W0-W17');
console.log('  H09 and /reality/ remain inactive');
console.log('  W3 Human/browser acceptance remains pending; no decision fabricated');
