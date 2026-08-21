import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { matchClientVisualRecord, normalizeClientVisualPath, routePatternMatches } from '../assets/js/client-visual-consumption.js';

const ROOT = process.cwd();
const readJson = p => JSON.parse(fs.readFileSync(`${ROOT}/${p}`, 'utf8'));
const text = p => fs.readFileSync(`${ROOT}/${p}`, 'utf8');
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(`${ROOT}/${p}`)).digest('hex');

const paths = Object.freeze({
  contract: 'content/web-production/client-visual-consumption/contracts/part-h5-client-visual-consumption-contract-v1.json',
  reconciliation: 'content/web-production/client-visual-consumption/reconciliation/part-h5-client-visual-consumption-reconciliation-v1.json',
  acceptance: 'content/web-production/client-visual-consumption/acceptance/part-h5-client-visual-consumption-acceptance-v1.json',
  freeze: 'content/web-production/client-visual-consumption/freeze/part-h5-client-visual-consumption-freeze-v1.json',
  consumerMap: 'content/web-production/registries/client-visual-consumer-map-v1.json',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  logoRegistry: 'content/web-production/registries/phios-logo-registry-v1.json',
  frontendInventory: 'content/web-production/bfr-frontend-surface-inventory-v1.json',
  w11Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w11-v8-destination-page-migration-freeze-v1.json',
  runtime: 'assets/js/client-visual-consumption.js',
  css: 'assets/css/client-visual-consumption.css',
  i18n: 'assets/js/i18n.js',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  publicShell: 'assets/js/public-shell.js',
  home: 'index.html',
  library: 'library.html',
  verifier: 'scripts/client-visual/verify-branding-r2.mjs',
  liveChecker: 'scripts/check-client-visual-consumption-live.mjs',
  package: 'package.json'
});
for (const p of Object.values(paths)) assert.ok(fs.existsSync(`${ROOT}/${p}`), `PART H.5 missing required file: ${p}`);

const contract = readJson(paths.contract);
const reconciliation = readJson(paths.reconciliation);
const acceptance = readJson(paths.acceptance);
const freeze = readJson(paths.freeze);
const map = readJson(paths.consumerMap);
const publicAssets = readJson(paths.publicAssets);
const visualRegistry = readJson(paths.visualRegistry);
const logoRegistry = readJson(paths.logoRegistry);
const frontend = readJson(paths.frontendInventory);
const w11Freeze = readJson(paths.w11Freeze);
const runtime = text(paths.runtime);
const css = text(paths.css);
const i18n = text(paths.i18n);
const resolver = text(paths.resolver);
const shell = text(paths.publicShell);
const home = text(paths.home);
const library = text(paths.library);
const pkg = readJson(paths.package);

assert.equal(contract.schemaVersion, 'PHI-OS-PART-H5-CLIENT-VISUAL-CONSUMPTION-CONTRACT-v1.0.0');
assert.equal(contract.work, 'PART-H.5');
assert.equal(contract.baselineCommit, '4e018485935ab090f1bd72eb9636b28686b42693');
assert.equal(contract.status, 'ACTIVE_CLIENT_VISUAL_CONSUMPTION_SUCCESSOR');
assert.equal(contract.authority.secondVisualRegistryCreated, false);
assert.equal(contract.authority.secondAssetResolverCreated, false);
assert.equal(contract.authority.frozenDestinationHtmlMutationAllowed, false);
assert.deepEqual(contract.branding.requiredProductionBranding, ['LOGO-003', 'LOGO-010', 'LOGO-011']);
assert.equal(contract.liveBoundary.repositoryCompletionMayPrecedeExternalR2BrandingVerification, true);
assert.equal(contract.liveBoundary.pocARevalidationRequiredAfterDeployment, true);

assert.equal(map.schemaVersion, 'PHI-OS-CLIENT-VISUAL-CONSUMER-MAP-v1.0.0');
assert.equal(map.work, 'PART-H.5');
assert.equal(map.baselineCommit, contract.baselineCommit);
assert.equal(map.status, 'ACTIVE_ADDITIVE_CLIENT_VISUAL_CONSUMPTION_SUCCESSOR');
assert.equal(map.records.length, map.summary.recordCount);
assert.equal(new Set(map.records.map(r => r.surfaceCode)).size, map.records.length, 'Duplicate Client visual surfaceCode');

// Route matcher behavior is part of the current consumer contract.
assert.equal(normalizeClientVisualPath('/books/'), '/books');
assert.equal(routePatternMatches('/articles/*', '/articles/example'), true);
assert.equal(routePatternMatches('/articles/*', '/library'), false);
assert.equal(matchClientVisualRecord(map, '/articles/example')?.surfaceCode, 'ARTICLE');
assert.equal(matchClientVisualRecord(map, '/articles')?.surfaceCode, 'ARTICLES');
assert.equal(matchClientVisualRecord(map, '/books/reality-formation/')?.surfaceCode, 'BOOK_1');

const publicByCode = new Map(publicAssets.assets.map(a => [a.asset_code, a]));
const visualByCode = new Map(visualRegistry.assets.map(a => [a.assetCode, a]));
const heroRefs = new Set();
const iconRefs = new Set();
const allRoutePatterns = [];
for (const record of map.records) {
  assert.ok(Array.isArray(record.routes) && record.routes.length > 0, `${record.surfaceCode} requires a route`);
  assert.ok(['ACTIVE_REQUIRED', 'NONE_BY_DESIGN'].includes(record.visualState), `${record.surfaceCode} invalid visualState`);
  for (const route of record.routes) {
    assert.ok(String(route).startsWith('/'), `${record.surfaceCode} route must be absolute`);
    allRoutePatterns.push(route);
  }
  const hero = record.hero?.assetCode ?? null;
  const icons = record.icons?.assetCodes ?? [];
  if (record.visualState === 'NONE_BY_DESIGN') {
    assert.equal(hero, null, `${record.surfaceCode} NONE_BY_DESIGN must not require a hero`);
    assert.equal(icons.length, 0, `${record.surfaceCode} NONE_BY_DESIGN must not require icons`);
    continue;
  }
  assert.ok(hero || icons.length, `${record.surfaceCode} ACTIVE_REQUIRED has no governed visual consumer`);
  if (hero) {
    heroRefs.add(hero);
    const asset = publicByCode.get(hero);
    assert.ok(asset, `${record.surfaceCode}: ${hero} missing from public-assets`);
    assert.equal(asset.category, 'hero', `${hero} must be hero category`);
    assert.equal(asset.verification, 'verified-remote-head-get', `${hero} must be remote verified before active consumption`);
    assert.equal(asset.remote?.http_status, 200, `${hero} remote evidence must be HTTP 200`);
    assert.ok(visualByCode.has(hero), `${hero} missing from canonical Client visual registry`);
    assert.ok(['AUTO_MASTHEAD', 'EXISTING_MANAGED'].includes(record.hero.mode), `${record.surfaceCode} invalid hero mode`);
  }
  for (const code of icons) {
    iconRefs.add(code);
    const asset = publicByCode.get(code);
    assert.ok(asset, `${record.surfaceCode}: ${code} missing from public-assets`);
    assert.equal(asset.category, 'icon', `${code} must be icon category`);
    assert.equal(asset.verification, 'verified-remote-head-get', `${code} must be remote verified before active consumption`);
    assert.equal(asset.remote?.http_status, 200, `${code} remote evidence must be HTTP 200`);
    assert.ok(visualByCode.has(code), `${code} missing from canonical Client visual registry`);
  }
}

const expectedHeroes = new Set(Array.from({ length: 23 }, (_, i) => `HERO-${String(i + 1).padStart(3, '0')}`));
const expectedIcons = new Set(Array.from({ length: 43 }, (_, i) => `ICON-${String(i + 1).padStart(3, '0')}`));
assert.deepEqual([...heroRefs].sort(), [...expectedHeroes].sort(), 'Every HERO-001..023 must have an actual Client consumer mapping');
assert.deepEqual([...iconRefs].sort(), [...expectedIcons].sort(), 'Every ICON-001..043 must have an actual Client consumer mapping');
assert.equal(map.summary.heroIdentityCoverage, '23/23');
assert.equal(map.summary.iconIdentityCoverage, '43/43');

// Every BFR current surface route must be covered by an H.5 route consumer (aliases may share a record).
for (const record of frontend.records) {
  const route = record.route;
  if (!route || route === '/') {
    assert.ok(matchClientVisualRecord(map, '/') || record.surfaceCode === 'ASK_PHIOS');
    continue;
  }
  const sample = route.replace('/:volume-slug', '/reality-formation').replace('/:slug', '/why-phi-os-is-needed');
  const mapped = matchClientVisualRecord(map, sample);
  assert.ok(mapped, `BFR current surface route lacks H.5 visual consumer: ${record.surfaceCode} ${route}`);
}

// A consumer map is not enough: every mapped production route must have an executable bootstrap path to H.5.
function routeFiles(route) {
  const value = String(route || '');
  if (value.includes('*')) {
    const base = value.split('*')[0].replace(/^\/+|\/+$/g, '');
    if (!base || !fs.existsSync(`${ROOT}/${base}`)) return [];
    return fs.readdirSync(`${ROOT}/${base}`).filter(file => file.endsWith('.html')).map(file => `${base}/${file}`).sort();
  }
  const relative = value.replace(/^\/+|\/+$/g, '');
  if (!relative) return ['index.html'];
  const candidates = [`${relative}.html`, `${relative}/index.html`];
  return candidates.filter(file => fs.existsSync(`${ROOT}/${file}`));
}
function htmlReachesH5Bootstrap(file) {
  const source = text(file);
  if (/assets\/js\/(?:public-shell|journey-shell|i18n)\.js/.test(source)) return true;
  const scriptSources = [...source.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map(match => match[1].split('?')[0].replace(/^\//, ''));
  return scriptSources.some(scriptPath => {
    if (!fs.existsSync(`${ROOT}/${scriptPath}`)) return false;
    const js = text(scriptPath);
    return /from\s+["'](?:\.\.\/)+i18n\.js["']|import\(["'](?:\.\.\/)+i18n\.js["']/.test(js);
  });
}
let bootstrapFileCount = 0;
for (const record of map.records.filter(record => record.visualState === 'ACTIVE_REQUIRED')) {
  const files = [...new Set(record.routes.flatMap(routeFiles))];
  assert.ok(files.length > 0, `${record.surfaceCode} has no materialized Client route file for H.5 consumption`);
  for (const file of files) {
    assert.equal(htmlReachesH5Bootstrap(file), true, `${record.surfaceCode} mapped visual is not executable because ${file} cannot reach the H.5 bootstrap`);
    bootstrapFileCount += 1;
  }
}
assert.ok(bootstrapFileCount >= map.records.filter(record => record.visualState === 'ACTIVE_REQUIRED').length, 'H.5 executable bootstrap coverage incomplete');

// HOME and LIBRARY retain their existing managed hero ownership; H.5 only hydrates/adds governed support visuals.
assert.match(home, /data-hpc2-hero="HERO-001"/);
assert.match(library, /data-bfr-library-hero="HERO-002"/);
assert.equal(map.records.find(r => r.surfaceCode === 'HOME').hero.mode, 'EXISTING_MANAGED');
assert.equal(map.records.find(r => r.surfaceCode === 'LIBRARY').hero.mode, 'EXISTING_MANAGED');

// Seven W11 semantic destination page outputs remain byte-frozen; H.5 upgrades them additively.
const destinationRecords = map.records.filter(r => r.destinationVisualUpgrade === true);
assert.equal(destinationRecords.length, 7);
for (const output of w11Freeze.pageOutputs) {
  assert.equal(sha256(output.path), output.sha256, `PART H.5 mutated frozen W11 destination page: ${output.path}`);
}
const expectedDestinationRoutes = new Set(['/about/why-phios','/about/reality-navigation','/research/why-reality-navigation','/research/human-reading-systems','/professional','/professional/authority','/about/founder']);
assert.deepEqual(new Set(destinationRecords.flatMap(r => r.routes)), expectedDestinationRoutes);

// Runtime must consume the existing authority/resolver and must never hard-code the R2 public host.
assert.match(runtime, /from '\.\/runtime\/web-production\/asset-resolver\.js'/);
assert.match(runtime, /client-visual-consumer-map-v1\.json/);
assert.match(runtime, /AUTO_MASTHEAD/);
assert.match(runtime, /EXISTING_MANAGED/);
assert.match(runtime, /destinationVisualUpgrade/);
assert.match(runtime, /LOGO-003/);
assert.match(runtime, /LOGO-010/);
assert.doesNotMatch(runtime, /\.r2\.dev|pub-[a-z0-9]+/i);
assert.match(resolver, /UPSTREAM_VERIFICATION_REQUIRED/);
assert.match(i18n, /import\('\.\/client-visual-consumption\.js'\)/);
assert.match(css, /\.client-visual-masthead/);
assert.match(css, /\.client-visual-icon-rail/);
assert.match(css, /client-visual-destination-upgraded/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /prefers-contrast/);

// Branding keeps existing canonical bindings. Current checker permits only explicit fail-closed pending states;
// live acceptance is a separate external-evidence gate.
assert.match(shell, /data-public-brand-asset="LOGO-003"/);
assert.match(shell, /data-public-brand-asset="LOGO-010"/);
assert.match(shell, /resolvePublicAssetForWeb\('LOGO-011'/);
for (const code of contract.branding.requiredProductionBranding) {
  const pub = publicByCode.get(code);
  const logo = logoRegistry.records.find(r => r.assetCode === code);
  assert.ok(pub && logo, `${code} missing from branding authorities`);
  assert.equal(pub.object_key, logo.objectKey, `${code} branding object key divergence`);
  const verified = pub.verification === 'verified-remote-head-get' && pub.remote?.http_status === 200;
  if (!verified) {
    assert.ok(['pending-remote-verification', 'pending-owner-upload'].includes(pub.verification), `${code} invalid fail-closed pending verification state`);
  }
}

assert.equal(reconciliation.status, 'PART_H5_REPOSITORY_RECONCILED_LIVE_BRANDING_REVALIDATION_REQUIRED');
assert.equal(reconciliation.coverage.heroIdentityCoverage, '23/23');
assert.equal(reconciliation.coverage.iconIdentityCoverage, '43/43');
assert.equal(reconciliation.coverage.frozenV8DestinationPagesPreserved, '7/7');
assert.equal(reconciliation.authority.secondVisualRegistryCreated, false);
assert.equal(reconciliation.authority.secondAssetResolverCreated, false);
assert.equal(acceptance.status, 'PART_H5_REPOSITORY_VISUAL_CONSUMPTION_ACCEPTED_LIVE_REVALIDATION_REQUIRED');
assert.equal(acceptance.gates.heroConsumers23of23, true);
assert.equal(acceptance.gates.iconConsumers43of43, true);
assert.equal(acceptance.gates.v8DestinationAdditiveUpgrade7of7, true);
assert.equal(acceptance.gates.canonicalLogoBindingsPreserved, true);
assert.equal(acceptance.liveGates.brandingR2LiveAccepted, false);
assert.equal(acceptance.liveGates.pocAResponsiveRevalidationAccepted, false);
assert.equal(acceptance.globalProductionAccepted, false);

for (const artifact of freeze.immutableArtifacts) {
  assert.equal(sha256(artifact.path), artifact.sha256, `PART H.5 frozen artifact drift: ${artifact.path}`);
}
assert.equal(freeze.status, 'PART_H5_REPOSITORY_SUCCESSOR_FROZEN_EXTERNAL_LIVE_EVIDENCE_MUTABLE');
assert.equal(freeze.mutableLiveEvidence.publicAssetsMayAdvanceByVerifiedR2EvidenceOnly, true);
assert.equal(freeze.mutableLiveEvidence.pocA10EvidenceMayAdvanceAfterDeployment, true);

assert.equal(pkg.scripts['check:client-visual-consumption-current'], 'node scripts/check-client-visual-consumption-current.mjs');
assert.equal(pkg.scripts['check:client-visual-consumption-live'], 'node scripts/check-client-visual-consumption-live.mjs');
assert.equal(pkg.scripts['check:part-h5'], 'npm run check:client-visual-consumption-current');
assert.equal(pkg.scripts['client-visual:verify-branding'], 'node scripts/client-visual/verify-branding-r2.mjs');

const brandingStates = Object.fromEntries(contract.branding.requiredProductionBranding.map(code => {
  const a = publicByCode.get(code);
  return [code, a.verification === 'verified-remote-head-get' && a.remote?.http_status === 200 ? 'REMOTE_VERIFIED' : `FAIL_CLOSED:${a.verification}`];
}));
console.log('✓ PART H.5 Client Visual Consumption current repository gate passed.');
console.log('  HERO consumers: 23/23 canonical identities mapped and remote verified.');
console.log('  ICON consumers: 43/43 canonical identities mapped and remote verified.');
console.log('  V8 destination pages: 7/7 byte-frozen and upgraded only through additive runtime/CSS.');
console.log(`  Branding live state: ${JSON.stringify(brandingStates)}.`);
console.log('  Live branding + POC-A browser acceptance remain external evidence gates; no fake acceptance created.');
