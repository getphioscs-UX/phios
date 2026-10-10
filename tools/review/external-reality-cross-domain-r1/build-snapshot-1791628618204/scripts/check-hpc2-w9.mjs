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
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w9-academy-services-professional-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w9-academy-services-professional-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w9-academy-services-professional-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w9-academy-services-professional-freeze-v1.json',
  successor: 'content/web-production/reconciliation/hpc2-w9-91e0094-current-successor-v1.json',
  w8Contract: 'content/web/homepage/hpc2/contracts/hpc2-w8-five-volume-knowledge-composition-contract-v1.json',
  w8Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w8-five-volume-knowledge-freeze-v1.json',
  reconciliation: 'content/web-production/bfr-academy-services-professional-reconciliation-v1.json',
  scenes: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  routes: 'content/web-production/registries/wpr-route-registry-v1.1.json',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  v8: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  package: 'package.json'
});
for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W9 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const successor = read(paths.successor);
const w8Freeze = read(paths.w8Freeze);
const reconciliation = read(paths.reconciliation);
const scenes = read(paths.scenes);
const routes = read(paths.routes);
const publicAssets = read(paths.publicAssets);
const visualRegistry = read(paths.visualRegistry);
const v8 = read(paths.v8);
const pkg = read(paths.package);
const html = text(paths.index);
const h08 = sceneMarkup(html, 'H08');
const css = text(paths.css);
const runtime = text(paths.runtime);

assert.equal(contract.work, 'HPC2-W9');
assert.equal(contract.baselineCommit, '91e00947dbcca4cbc22901fabcf8f0ffd41f8378');
assert.equal(contract.status, 'H01_H08_PRODUCTION_COMPOSITION_ACTIVE_H09_DEFERRED');
assert.equal(evidence.status, 'H08_TWO_PATH_COMPOSITION_AND_THREE_LEVEL_AUTHORITY_BOUNDARY_VERIFIED_NO_ROUTE_CATALOG_PRICE_OR_JUDGMENT_PROMOTION');
assert.equal(acceptance.state, 'HPC2_W9_H08_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_DEPLOYMENT_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W9_H08_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(successor.status, 'ACTIVE_ADDITIVE_H08_CAPABILITY_SUPPORT_SUCCESSOR_HISTORICAL_AUTHORITIES_PRESERVED');
for (const artifact of w8Freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W8 immutable artifact drift: ${artifact.path}`);
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W9 immutable artifact drift: ${artifact.path}`);
assert.equal(contract.predecessorAuthority.w8ContractSha256, sha256(paths.w8Contract));
assert.equal(contract.predecessorAuthority.w8FreezeSha256, sha256(paths.w8Freeze));
assert.equal(contract.predecessorAuthority.academyServicesProfessionalReconciliationSha256, sha256(paths.reconciliation));
assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.scenes));
assert.equal(contract.predecessorAuthority.routeRegistrySha256, sha256(paths.routes));
assert.equal(contract.predecessorAuthority.publicAssetRegistrySha256, sha256(paths.publicAssets));
assert.equal(contract.predecessorAuthority.visualRegistrySha256, sha256(paths.visualRegistry));
assert.equal(contract.predecessorAuthority.assetResolverSha256, sha256(paths.resolver));

const h08Authority = scenes.scenes.find(scene => scene.sceneCode === 'H08');
assert.equal(h08Authority.sceneTitle, 'Academy / Services / Professional');
assert.deepEqual(h08Authority.visualAssets.map(record => record.assetCode), contract.composition.visualAssetCodes);
assert.deepEqual(h08Authority.capabilitiesConsumed.map(record => record.capabilityCode), ['ACADEMY', 'SERVICES', 'PROFESSIONAL']);
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1, `${scene} count drift`);
assert.equal(count(html, /data-hpc2-scene="H09"/g), 0, 'H09 implemented before HPC2-W10');
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08']) assert.equal(digest(sceneMarkup(html, scene)), freeze.structuralFreeze[`${scene.toLowerCase()}MarkupSha256`], `Frozen ${scene} markup drift`);

assert.equal(count(h08, /data-hpc2-support-path=/g), 2);
assert.deepEqual([...h08.matchAll(/data-hpc2-support-path="([A-Z_]+)"/g)].map(match => match[1]), ['BUILD_CAPABILITY', 'GET_SUPPORT']);
assert.equal(count(h08, /data-hpc2-authority-level=/g), 3);
assert.deepEqual([...h08.matchAll(/data-hpc2-authority-level="([A-Z_]+)"/g)].map(match => match[1]), ['PHIOS', 'PHIOS_PROFESSIONAL', 'QUALIFIED_EXTERNAL_PROFESSIONAL']);
assert.equal(count(h08, /data-hpc2-figure="FIG-006"/g), 1);
assert.equal(count(h08, /data-hpc2-icon="ICON-014"/g), 1);
assert.equal(count(h08, /data-hpc2-icon="ICON-015"/g), 1);
assert.match(h08, /href="\/academy"[^>]*data-hpc2-route-state="DISCOVERY_ACTIVE_LIVE_LEARNING_GATED"/);
assert.match(h08, /href="\/services"[^>]*data-hpc2-route-state="EXISTING_LIMITED_PRODUCTION_ACTIVE"/);
assert.doesNotMatch(h08, /href=["']\/professional(?:\/boundaries)?\/?["']/);
assert.doesNotMatch(h08, /href=["']\/professional-workspace\/?["']/);
assert.doesNotMatch(h08, /data-price=|data-pricing=|\$\s*\d|£\s*\d|€\s*\d/);
assert.doesNotMatch(h08, /<(?:form|input|textarea|select|button)\b/i);
assert.equal(reconciliation.services.canonicalServiceRegistryRecordCount, 0);
assert.equal(reconciliation.services.state, 'STATIC_PROJECTION_REQUIRES_HPC2_SUCCESSOR_ALIGNMENT');
assert.equal(reconciliation.professional.professionalUiEqualsPublicUiPlusMoreFields, false);
assert.equal(reconciliation.professional.authorizedPayloadRequired, true);
for (const destination of ['/academy', '/services']) assert.equal(routes.entries.some(route => route.path === destination && route.implementationState === 'EXISTING'), true, `${destination} is not an existing route`);
assert.equal(routes.entries.some(route => route.path === '/professional'), false, 'Planned /professional route activated');
assert.equal(routes.entries.some(route => route.path === '/professional/boundaries'), false, 'Planned professional boundaries route activated');

for (const assetCode of contract.composition.visualAssetCodes) {
  const publicRecord = publicAssets.assets.find(record => record.asset_code === assetCode);
  const visualRecord = visualRegistry.assets.find(record => record.assetCode === assetCode || record.sequence === assetCode);
  assert.ok(publicRecord, `Missing public asset record: ${assetCode}`);
  assert.equal(publicRecord.status, 'remote-verified', `${assetCode} is not remote-verified`);
  assert.ok(visualRecord, `Missing visual registry record: ${assetCode}`);
  assert.equal(visualRecord.r2.remoteVerified, true, `${assetCode} visual authority is not remote verified`);
}
assert.match(runtime, /capabilitySupportRenderedCount === 3/);
assert.match(runtime, /H08_FAIL_CLOSED_GOVERNED_ASSET_NOT_RENDERED/);
assert.match(runtime, /H08_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev|professional-workspace/i);
assert.match(css, /\.hpc2-h08\s*\{/);
assert.match(css, /\.hpc2-h08__paths\s*\{[\s\S]*?repeat\(2,/);
assert.match(css, /\.hpc2-support-path--support\s*\{/);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w9`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w9`)).default;
assert.equal(en.discover.capabilitySupport.build.title, 'Learn how Reality Navigation works.');
assert.equal(en.discover.capabilitySupport.support.title, 'Some realities need human judgment.');
assert.equal(en.discover.capabilitySupport.authority.externalTitle, 'Qualified External Professional');
assert.equal(zh.discover.capabilitySupport.build.title, '学习 Reality Navigation 如何运作。');
assert.equal(zh.discover.capabilitySupport.support.title, '有些现实需要人类判断。');
assert.equal(zh.discover.capabilitySupport.authority.externalTitle, '合资格外部专业人士');
assert.equal(v8.summary.successorVerifiedCount, 0);
assert.equal(v8.summary.deletionAllowedFromHomepageCount, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.deploymentAcceptance.claimed, false);
assert.equal(/href=["']\/reality\/?["']/.test(html), false);
for (const value of Object.values(successor.boundaries)) assert.equal(value, false);
assert.equal(pkg.scripts['check:hpc2-w9'], 'node scripts/check-hpc2-w9.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w9'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w9'));

console.log('HPC2-W9 Academy / Services / Professional composition: ACCEPTED (repository implementation)');
console.log('  H08: BUILD CAPABILITY + GET SUPPORT = 2/2; authority ladder = 3/3');
console.log('  routes: existing /academy and /services reused; planned /professional routes and private workspace exposure = 0');
console.log('  services: canonical registry records = 0 and remains explicit; price menus and professional judgments = 0');
console.log('  decisions: Human/browser/deployment acceptance remain pending; H09 remains inactive');
