import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

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
const hasPath = (object, path) => path.split('.').every((part, index, parts) => {
  object = index === 0 ? object : object?.[parts[index - 1]];
  return index === parts.length - 1 ? Object.prototype.hasOwnProperty.call(object ?? {}, part) : object != null;
});
const getPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

const paths = {
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w13-homepage-responsive-locale-accessibility-contract-v1.json',
  matrix: 'content/web/homepage/hpc2/homepage-responsive-locale-accessibility-matrix-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w13-homepage-responsive-locale-accessibility-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w13-homepage-responsive-locale-accessibility-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w13-homepage-responsive-locale-accessibility-freeze-v1.json',
  bfr12: 'content/web-production/bfr-responsive-production-matrix-v1.json',
  bfr13: 'content/web-production/bfr-responsive-acceptance-v1.json',
  bfr14: 'content/web-production/bfr-accessibility-acceptance-v1.json',
  visualProjection: 'content/web/homepage/hpc2/homepage-visual-consumption-v2.json',
  publicAssets: 'content/registry/public-assets.json',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  foundation: 'assets/css/design/foundation.css',
  publicCss: 'assets/css/public-experience.css',
  runtime: 'assets/js/pages/home-production.js',
  en: 'assets/js/locales/en/public.js',
  zh: 'assets/js/locales/zh-Hans/public.js',
  pkg: 'package.json'
};
for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing W13 dependency: ${path}`);

const contract = read(paths.contract);
const matrix = read(paths.matrix);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const bfr12 = read(paths.bfr12);
const bfr13 = read(paths.bfr13);
const bfr14 = read(paths.bfr14);
const visualProjection = read(paths.visualProjection);
const publicAssets = read(paths.publicAssets);
const html = text(paths.index);
const css = text(paths.css);
const foundation = text(paths.foundation);
const publicCss = text(paths.publicCss);
const runtime = text(paths.runtime);
const pkg = read(paths.pkg);

assert.equal(contract.baselineCommit, '64ead9a9addf56f4f83c28736bf205cdc9380c10');
assert.equal(contract.status, 'BFR_H12_H14_HOMEPAGE_SUBSET_ONLY_NO_SECOND_RESPONSIVE_SYSTEM');
for (const artifact of freeze.immutableArtifacts) {
  assert.equal(sha256(artifact.path), artifact.sha256, `W13 frozen artifact drift: ${artifact.path}`);
}
assert.equal(freeze.globalProductionFreezeDeclared, false);

assert.deepEqual(bfr12.viewports, [360, 390, 430, 768, 1024, 1280, 1440]);
assert.deepEqual(bfr12.locales, ['en', 'zh-Hans']);
assert.equal(bfr12.primaryCheckCount, 182);
assert.equal(bfr12.createsBreakpointAuthority, false);
assert.equal(bfr13.createsBreakpointAuthority, false);
assert.equal(bfr14.newAccessibilityAuthorityCreated, false);
const bfrHomepage = bfr12.matrix.filter(record => record.surfaceFamily === 'Homepage');
assert.equal(bfrHomepage.length, 14);
assert.equal(matrix.primaryStateCount, 14);
assert.deepEqual(matrix.viewports, bfr12.viewports);
assert.deepEqual(matrix.locales, bfr12.locales);
assert.equal(matrix.authority.secondResponsiveSystemCreated, false);
assert.equal(matrix.authority.secondBreakpointAuthorityCreated, false);
const matrixKeys = new Set(matrix.matrix.map(record => `${record.surfaceFamily}|${record.locale}|${record.viewport}`));
assert.equal(matrixKeys.size, 14);
for (const source of bfrHomepage) {
  const current = matrix.matrix.find(record => record.locale === source.locale && record.viewport === source.viewport);
  assert.ok(current, `Missing Homepage matrix state ${source.locale}/${source.viewport}`);
  assert.equal(current.bfrH12RepositoryContractState, source.repositoryContractState);
  assert.equal(current.productionBrowserState, 'REVALIDATION_REQUIRED');
  assert.equal(current.heroAssetCode, 'HERO-001');
  assert.equal(current.heroVariant, 'CANONICAL_ONLY_NO_UNREGISTERED_ALTERNATE');
}

const h01Projection = visualProjection.records.find(record => record.sceneCode === 'H01');
assert.ok(h01Projection);
assert.equal(h01Projection.assetCode, 'HERO-001');
assert.equal(h01Projection.objectKey, 'images/hero/PHIOS-HERO-REALITY-NAVIGATION-v1.webp');
assert.equal(h01Projection.resolver, 'CANONICAL_PUBLIC_ASSET_RESOLVER');
assert.equal(h01Projection.localeNeutral, true);
const heroAsset = publicAssets.assets.find(record => record.asset_code === 'HERO-001');
assert.ok(heroAsset);
assert.equal(heroAsset.canonical, true);
assert.equal(heroAsset.status, 'remote-verified');
assert.equal(heroAsset.object_key, h01Projection.objectKey);
assert.equal(count(sceneMarkup(html, 'H01'), /data-hpc2-hero="HERO-001"/g), 1);
assert.doesNotMatch(sceneMarkup(html, 'H01'), /<(?:picture|source)\b|srcset=/i, 'H01 must not hardcode an alternate/mobile visual');
assert.match(css, /\.hpc2-hero-visual\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;/);
assert.match(css, /\.hpc2-hero-visual img\s*\{[\s\S]*?object-fit:\s*cover;[\s\S]*?object-position:\s*center;/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-hero-visual img\s*\{[\s\S]*?object-position:\s*58% center;/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-hero-visual img\s*\{[\s\S]*?object-position:\s*62% center;/);
assert.match(css, /\.hpc2-h01__readability\s*\{[\s\S]*?linear-gradient/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h01__readability\s*\{[\s\S]*?linear-gradient/);
assert.match(css, /\.hpc2-h01 \.discover-hero__copy\s*\{[\s\S]*?width:\s*min\(100%,\s*64rem\)/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-h01 \.discover-hero__copy\s*\{[\s\S]*?48rem/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-h01__actions\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
assert.match(html, /id="wpr-platform-title"[^>]*data-hpc2-compatibility-target="H04"/);
assert.ok(html.indexOf('id="wpr-platform-title"') < html.indexOf('data-hpc2-scene="H04"'));

for (const code of ['H01','H02','H03','H04','H05','H06','H07','H08','H09']) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="${code}"`, 'g')), 1, `${code} count drift`);
}
const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.en}`).href}?hpc2w13`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.zh}`).href}?hpc2w13`)).default;
for (const code of ['H01','H02','H03','H04','H05','H06','H07','H08','H09']) {
  const scene = sceneMarkup(html, code);
  const keys = [...scene.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)].map(match => match[1]);
  for (const key of keys) {
    assert.notEqual(getPath(en, key), undefined, `EN missing H01-H09 key: ${key}`);
    assert.notEqual(getPath(zh, key), undefined, `ZH missing H01-H09 key: ${key}`);
  }
}

assert.match(html, /<a class="phi-skip-link" href="#discover-main"/);
assert.match(html, /<main id="discover-main">/);
for (const code of ['H02','H03','H04','H05','H06','H07','H08','H09']) {
  const scene = sceneMarkup(html, code);
  const labelled = scene.match(/aria-labelledby="([^"]+)"/);
  assert.ok(labelled, `${code} missing aria-labelledby`);
  assert.match(scene, new RegExp(`id="${labelled[1]}"`), `${code} labelledby target missing`);
}
const h05 = sceneMarkup(html, 'H05');
assert.match(h05, /<label[^>]*for="h05-situation"/);
assert.match(h05, /<(?:textarea|input)[^>]*id="h05-situation"/);
assert.match(foundation, /:where\(:focus-visible\)/);
assert.match(publicCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
assert.match(publicCss, /min-height:\s*44px/);
assert.match(sceneMarkup(html, 'H01'), /data-hpc2-decorative="true"[^>]*aria-hidden="true"/);
assert.match(runtime, /const decorative = target\.dataset\.hpc2Decorative !== 'false';/);
assert.match(runtime, /const alt = decorative \? '' :/);

assert.equal(evidence.observations.bfrHomepageSubsetStateCount, 14);
assert.equal(acceptance.matrix.primaryHomepageStateCount, 14);
assert.equal(acceptance.matrix.repositoryAccepted, true);
assert.equal(acceptance.matrix.browserAccepted, false);
assert.equal(acceptance.responsive.secondSystemCreated, false);
assert.equal(acceptance.globalProductionFreeze.claimed, false);
assert.equal(pkg.scripts['check:hpc2-w13'], 'node scripts/check-hpc2-w13.mjs');
assert.ok(pkg.scripts['check:hpc2'].includes('npm run check:hpc2-w13'));

console.log('✓ HPC2-W13 Homepage Responsive / Locale / Accessibility passed (repository subset).');
console.log('  Homepage = 7 viewports × 2 locales = 14 primary states inherited from BFR-H12–H14; no second responsive authority.');
console.log('  HERO-001 remains the single canonical hero; mobile art direction uses object-position/gradient/copy/CTA adaptation only.');
console.log('  EN/ZH H01-H09 locale keys and accessibility source contracts pass; production browser revalidation remains explicit.');
