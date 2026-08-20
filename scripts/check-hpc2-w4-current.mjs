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
  w5Contract: 'content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json',
  w5Evidence: 'content/web/homepage/hpc2/evidence/hpc2-w5-phios-runtime-composition-audit-v1.json',
  w5Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json',
  w6Contract: 'content/web/homepage/hpc2/contracts/hpc2-w6-first-interaction-composition-contract-v1.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json',
  frozenChecker: 'scripts/check-hpc2-w4.mjs'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing current HPC2-W4 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const w5Contract = read(paths.w5Contract);
const w5Evidence = read(paths.w5Evidence);
const w5Freeze = read(paths.w5Freeze);
const w6Contract = read(paths.w6Contract);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);

assert.equal(contract.work, 'HPC2-W4');
assert.equal(evidence.status, 'H03_SOURCE_AND_COMPOSITION_VERIFIED_HUMAN_BROWSER_ACCEPTANCE_NOT_CREATED');
assert.equal(acceptance.state, 'HPC2_W4_H03_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W4_H03_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W4 frozen artifact drift: ${artifact.path}`);
assert.equal(sha256(paths.frozenChecker), '7ffc7c06ac2eeb3832ef78af703cb4d329e37894f7385ba4f4bb575a2768d131');

assert.equal(w5Contract.predecessorAuthority.w4ContractSha256, sha256(paths.contract));
assert.equal(w5Contract.predecessorAuthority.w4FreezeSha256, sha256(paths.freeze));
assert.equal(w5Contract.predecessorProtection.h01ChangedByW5, false);
assert.equal(w5Contract.predecessorProtection.h02ChangedByW5, false);
assert.equal(w5Contract.predecessorProtection.h03ChangedByW5, false);
assert.equal(w5Evidence.implementationObservations.h03MarkupUnchangedFromW4, true);
assert.equal(w5Freeze.structuralFreeze.h03MarkupSha256, w5Contract.predecessorProtection.h03MarkupSha256);
assert.equal(w6Contract.predecessorAuthority.w5ContractSha256, sha256(paths.w5Contract));
assert.equal(w6Contract.predecessorAuthority.w5FreezeSha256, sha256(paths.w5Freeze));
assert.equal(w6Contract.predecessorProtection.h01H04ChangedByW6, false);

for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1);
assert.equal(count(html, /data-hpc2-scene="H09"/g), 1, 'H09 successor count drift after HPC2-W10');
assert.equal(digestText(sceneMarkup(html, 'H01')), w5Contract.predecessorProtection.h01MarkupSha256, 'Frozen H01 markup drift');
assert.equal(digestText(sceneMarkup(html, 'H02')), w5Contract.predecessorProtection.h02MarkupSha256, 'Frozen H02 markup drift');
const h03Html = sceneMarkup(html, 'H03');
assert.equal(digestText(h03Html), w5Contract.predecessorProtection.h03MarkupSha256, 'Frozen H03 markup drift');
assert.equal(count(h03Html, /data-hpc2-lens="/g), 5);
assert.equal(count(h03Html, /data-hpc2-category-stage="/g), 3);
assert.equal(count(h03Html, /data-hpc2-figure="FIG-055"/g), 1);
assert.doesNotMatch(h03Html, /\bhref=|<(?:form|input|textarea|button)\b/i);

assert.match(css, /\.hpc2-h03\s*\{/);
assert.match(runtime, /renderAssetTarget\(lensesFigureRoot, 'FIG-055', locale, visualRegistry\)/);
const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w4current`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w4current`)).default;
for (const [key, expected] of Object.entries(contract.copy.en)) assert.equal(en.discover.manyLenses[key], expected);
for (const [key, expected] of Object.entries(contract.copy['zh-Hans'])) assert.equal(zh.discover.manyLenses[key], expected);

assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(w5Contract.successorBoundary.askPhiOsHomepageConsumerCompleted, false);
assert.equal(w5Contract.successorBoundary.runtimeExecutionActivated, false);
assert.equal(/href=["']\/reality\/?["']/.test(html), false);

assert.equal(pkg.scripts['check:hpc2-w4-frozen'], 'node scripts/check-hpc2-w4.mjs');
assert.equal(pkg.scripts['check:hpc2-w4'], 'node scripts/check-hpc2-w4-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w5-frozen'], 'node scripts/check-hpc2-w5-frozen-artifacts.mjs');
assert.equal(pkg.scripts['check:hpc2-w5'], 'node scripts/check-hpc2-w5-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w6-frozen'], 'node scripts/check-hpc2-w6.mjs');
assert.equal(pkg.scripts['check:hpc2-w6'], 'node scripts/check-hpc2-w6-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w7'], 'node scripts/check-hpc2-w7-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w8-frozen'], 'node scripts/check-hpc2-w8.mjs');
assert.equal(pkg.scripts['check:hpc2-w8'], 'node scripts/check-hpc2-w8-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w9-frozen'], 'node scripts/check-hpc2-w9.mjs');
assert.equal(pkg.scripts['check:hpc2-w9'], 'node scripts/check-hpc2-w9-current.mjs');

console.log('HPC2-W4 current successor: ACCEPTED');
console.log('  frozen H01-H03 preserved byte-for-byte at scene scope; immutable W4 evidence preserved');
console.log('  additive H04-H08 are governed by HPC2-W5 through W9; H09 is governed by HPC2-W10; /reality/ remains independently governed');
console.log('  W4 Ask reservation is preserved as predecessor history; current Homepage consumers reuse CKA-W0-W17');
