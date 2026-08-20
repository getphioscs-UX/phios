import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

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
  w5Contract: 'content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json',
  w5Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json',
  w0Contract: 'content/client/knowledge-ask/contracts/cka-w0-ask-entry-contract-v1.json',
  ckaFreeze: 'content/client/knowledge-ask/freeze/cka-w0-w4-batch-a-freeze-v1.json',
  historicalChecker: 'scripts/check-hpc2-w5.mjs',
  html: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json'
});
for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W5 current successor dependency: ${path}`);

const w5 = read(paths.w5Contract);
const w5Freeze = read(paths.w5Freeze);
const ckaW0 = read(paths.w0Contract);
const ckaFreeze = read(paths.ckaFreeze);
const html = text(paths.html);
const css = text(paths.css);
const runtime = text(paths.runtime);
const en = text(paths.localeEn);
const zh = text(paths.localeZh);
const pkg = read(paths.package);

assert.equal(w5.work, 'HPC2-W5');
assert.equal(w5.askBoundary.homepageConsumerState, 'MISSING_PENDING_CKA');
assert.equal(w5.successorBoundary.askPhiOsHomepageConsumerCompleted, false);
assert.equal(w5Freeze.status, 'HPC2_W5_H04_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(sha256(paths.w5Contract), '20cfd8990349e49cb28bd533646759e16042f1b0b4e859ff301ad36afdcf5c5c');
assert.equal(sha256(paths.w5Freeze), '046feb91025475aa76be7eccbe01c17a6797017075d3cf1e2dcb3606d3fc9439');
assert.equal(sha256(paths.historicalChecker), '204747fc5b9c9200965e9f39f06b2e89e0c334edda9a7b8f3f2675646d1fb703');

for (const scene of ['H01', 'H02', 'H03', 'H04']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1);
for (const scene of ['H05', 'H06', 'H07', 'H08', 'H09']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 0);
assert.equal(digestText(sceneMarkup(html, 'H01')), w5.predecessorProtection.h01MarkupSha256);
assert.equal(digestText(sceneMarkup(html, 'H02')), w5.predecessorProtection.h02MarkupSha256);
assert.equal(digestText(sceneMarkup(html, 'H03')), w5.predecessorProtection.h03MarkupSha256);

const h04 = sceneMarkup(html, 'H04');
const h04WithoutAsk = h04.replace(/\n\s*<aside class="hpc2-h04__ask-reservation"[\s\S]*?<\/aside>/, '');
assert.equal(digestText(h04WithoutAsk), 'dd2d9683c7ca5f00ce9ea5c1e7f06b61a93047a1d5765bdd72a0e16c4d0558e5');
assert.equal(count(h04, /data-hpc2-figure="FIG-056"/g), 1);
assert.equal(count(h04, /data-hpc2-runtime-stage="[A-Z_]+"/g), 8);
assert.equal(count(h04, /data-hpc2-runtime-value="[A-Z_]+"/g), 4);
assert.equal(count(h04, /data-hpc2-runtime-boundary="[A-Z_]+"/g), 4);
assert.match(h04, /data-hpc2-consumer-state="ACTIVE_CKA_W0"/);
assert.match(h04, /data-hpc2-route-state="HOMEPAGE_ENTRY_ACTIVE_CKA_W0"/);
assert.match(h04, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL"/);
assert.match(h04, /data-cka-entry-surface="HOMEPAGE"/);
assert.doesNotMatch(h04, /<(?:form|input|textarea|select)\b/i);
assert.equal(count(h04, /\bhref=/g), 1);

assert.equal(ckaW0.work, 'CKA-W0');
assert.equal(ckaW0.consumerActivation.homepage.state, 'ACTIVE');
assert.equal(ckaW0.governance.createsPersistentCase, false);
assert.equal(ckaFreeze.status, 'CKA_W0_W4_REPOSITORY_IMPLEMENTATION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.match(css, /\.hpc2-h04__ask-link\s*\{/);
assert.match(runtime, /renderAssetTarget\(phiosRuntimeFigureRoot, 'FIG-056', locale, visualRegistry\)/);
assert.doesNotMatch(runtime, /\/api\/ask-phios|createPersistentCase|startRealityJourney/i);
assert.match(en, /title:\s*'Begin with one question\. Keep the answer grounded and bounded\.'/);
assert.match(zh, /title:\s*'从一个问题开始，让回答保持有依据，也保持边界。'/);

assert.equal(pkg.scripts['check:hpc2-w5-frozen'], 'node scripts/check-hpc2-w5-frozen-artifacts.mjs');
assert.equal(pkg.scripts['check:hpc2-w5'], 'node scripts/check-hpc2-w5-current.mjs');
assert.equal(pkg.scripts['check:cka-a'], 'node scripts/check-cka-w0-w4.mjs ALL');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w5'));

console.log('HPC2-W5 current successor: ACCEPTED');
console.log('  frozen H01-H04 runtime composition preserved; historical W5 evidence and checker unchanged');
console.log('  H04 Ask reservation promoted by CKA-W0 to one governed Homepage link');
console.log('  Homepage API calls, Method execution, persistent case creation and Reality Journey activation = 0');
