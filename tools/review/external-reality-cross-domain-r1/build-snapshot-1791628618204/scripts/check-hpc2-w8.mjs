import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(text(path), 'utf8').digest('hex');
const digest = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, code) => {
  const marker = source.indexOf(`data-hpc2-scene="${code}"`);
  assert.ok(marker >= 0, `${code} marker missing`);
  const start = source.lastIndexOf('<section', marker);
  const end = source.indexOf('</section>', marker);
  assert.ok(start >= 0 && end > marker, `${code} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = Object.freeze({
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w8-five-volume-knowledge-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w8-five-volume-knowledge-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w8-five-volume-knowledge-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w8-five-volume-knowledge-freeze-v1.json',
  successor: 'content/web-production/reconciliation/hpc2-w8-91e0094-current-successor-v1.json',
  scenes: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  books: 'content/registry/books.json',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  surfaceData: 'assets/js/web-production/public-surface-data.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  v8: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  package: 'package.json'
});
for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W8 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const successor = read(paths.successor);
const scenes = read(paths.scenes);
const books = read(paths.books);
const publicAssets = read(paths.publicAssets);
const visualRegistry = read(paths.visualRegistry);
const v8 = read(paths.v8);
const pkg = read(paths.package);
const html = text(paths.index);
const h07 = sceneMarkup(html, 'H07');
const css = text(paths.css);
const runtime = text(paths.runtime);
const surfaceData = text(paths.surfaceData);

assert.equal(contract.work, 'HPC2-W8');
assert.equal(contract.baselineCommit, '91e00947dbcca4cbc22901fabcf8f0ffd41f8378');
assert.equal(contract.status, 'H01_H07_PRODUCTION_COMPOSITION_ACTIVE_H08_H09_DEFERRED_AT_W8_GATE');
assert.equal(evidence.status, 'H07_FIVE_CANONICAL_VOLUMES_AND_GOVERNED_VISUAL_CONSUMERS_VERIFIED_NO_DUPLICATE_AUTHORITY');
assert.equal(acceptance.state, 'HPC2_W8_H07_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_DEPLOYMENT_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W8_H07_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(successor.status, 'ACTIVE_ADDITIVE_H07_FIVE_VOLUME_KNOWLEDGE_SUCCESSOR_HISTORICAL_AUTHORITIES_PRESERVED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W8 immutable artifact drift: ${artifact.path}`);
for (const [key, path] of [['sceneRegistrySha256', paths.scenes], ['booksRegistrySha256', paths.books], ['publicAssetRegistrySha256', paths.publicAssets], ['visualRegistrySha256', paths.visualRegistry], ['assetResolverSha256', paths.resolver]]) {
  assert.equal(contract.predecessorAuthority[key], sha256(path), `HPC2-W8 authority drift: ${path}`);
}

const h07Authority = scenes.scenes.find(scene => scene.sceneCode === 'H07');
assert.equal(h07Authority.sceneTitle, 'Five-Volume Knowledge');
assert.deepEqual(h07Authority.visualAssets.map(record => record.assetCode), contract.composition.visualAssetCodes);
assert.deepEqual(h07Authority.capabilitiesConsumed.map(record => record.capabilityCode), ['FIVE_VOLUME_KNOWLEDGE_SYSTEM', 'PUBLISHED_KNOWLEDGE', 'ASK_PHIOS', 'FIGURES_VISUAL_KNOWLEDGE']);
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1, `${scene} count drift`);
assert.equal(count(html, /data-hpc2-scene="H09"/g), 0, 'H09 implemented before HPC2-W10');
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07']) assert.equal(digest(sceneMarkup(html, scene)), freeze.structuralFreeze[`${scene.toLowerCase()}MarkupSha256`], `Frozen ${scene} markup drift`);

assert.equal(books.books.length, 5);
assert.deepEqual(books.books.map(book => book.volume), [1, 2, 3, 4, 5]);
assert.deepEqual(books.books.map(book => book.title.en), contract.volumeSequence.map(volume => volume.titleEn));
assert.deepEqual(books.books.map(book => book.title['zh-Hans']), contract.volumeSequence.map(volume => volume.titleZhHans));
assert.equal(count(html, /data-wpr-home-books/g), 1, 'Canonical Homepage books consumer duplicated');
assert.equal(count(h07, /data-hpc2-volume-stage=/g), 5);
assert.equal(count(h07, /data-hpc2-knowledge-action=/g), 4);
assert.equal(count(h07, /data-hpc2-figure="FIG-001"/g), 1);
assert.match(h07, /href="\/library"[^>]*data-hpc2-knowledge-action="READ_PUBLISHED_KNOWLEDGE"/);
assert.match(h07, /href="\/figures"[^>]*data-hpc2-knowledge-action="SEE_FIGURES_AND_DIAGRAMS"/);
assert.match(h07, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=CONTEXTUAL&amp;contextType=FIVE_VOLUME_KNOWLEDGE"/);
assert.match(h07, /href="\/academy"[^>]*data-hpc2-knowledge-action="LEARN_IN_ACADEMY"/);
assert.doesNotMatch(h07, /<(?:form|input|textarea|select|button)\b/i);

for (const assetCode of contract.composition.visualAssetCodes) {
  const publicRecord = publicAssets.assets.find(record => record.asset_code === assetCode);
  assert.ok(publicRecord, `Missing public asset record: ${assetCode}`);
  assert.equal(publicRecord.status, 'remote-verified', `${assetCode} is not remote-verified`);
  if (assetCode === 'FIG-001') {
    const visualRecord = visualRegistry.assets.find(record => record.assetCode === assetCode || record.sequence === assetCode);
    assert.ok(visualRecord, `Missing visual registry record: ${assetCode}`);
    assert.equal(visualRecord.r2.remoteVerified, true, `${assetCode} visual authority is not remote verified`);
  }
}
assert.match(surfaceData, /export async function resolveBookCover/);
assert.match(surfaceData, /resolvePublicAssetForWeb\(assetCode/);
assert.match(runtime, /loadCanonicalBooks\(\)/);
assert.match(runtime, /resolveBookCover\(book\.book_id/);
assert.match(runtime, /renderAssetTarget\(fiveVolumeFigureRoot, 'FIG-001', locale, visualRegistry\)/);
assert.match(runtime, /H07_FAIL_CLOSED_GOVERNED_ASSET_NOT_RENDERED/);
assert.match(runtime, /H07_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);
assert.match(css, /\.hpc2-h07\s*\{/);
assert.match(css, /\.hpc2-h07__books\s*\{[\s\S]*?repeat\(5,/);
assert.match(css, /\.hpc2-h07 \.wpr-volume-1/);
assert.match(css, /\.hpc2-h07 \.wpr-volume-5/);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w8`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w8`)).default;
assert.equal(en.discover.fiveVolumeKnowledge.progression.navigation, 'How Reality Is Read & Navigated');
assert.equal(zh.discover.fiveVolumeKnowledge.progression.navigation, '现实如何被读取与导航');
assert.deepEqual(Object.keys(en.discover.fiveVolumeKnowledge.actions), ['read', 'see', 'ask', 'learn']);
assert.equal(v8.summary.successorVerifiedCount, 0);
assert.equal(v8.summary.deletionAllowedFromHomepageCount, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.deploymentAcceptance.claimed, false);
assert.equal(/href=["']\/reality\/?["']/.test(html), false);
for (const value of Object.values(successor.boundaries)) assert.equal(value, false);
assert.equal(pkg.scripts['check:hpc2-w8'], 'node scripts/check-hpc2-w8.mjs');

console.log('HPC2-W8 Five-Volume Knowledge composition: ACCEPTED (repository implementation)');
console.log('  H07: 5 canonical volumes + 5 governed covers + FIG-001 + READ/SEE/ASK/LEARN');
console.log('  authority: canonical registries and existing resolver/runtime reused; duplicate authorities = 0');
console.log('  decisions: Human/browser/deployment acceptance remain pending; H09 remains inactive');
