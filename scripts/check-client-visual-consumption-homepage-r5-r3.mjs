import {retiredResearchTopicPath,wrapFinalReleaseWorker} from '../functions/_lib/final-release-scope.js';
import {onRequest as currentRootRequest} from '../functions/_middleware.js';
import {currentFounderPositioningPredecessor,currentR5ProtectedCheckerPredecessor} from './lib/pr22-release-r5-exact-successor-r1.mjs';
import {validateH5HomepageR5Successor} from './lib/client-visual-h5-homepage-r5-successor-r3.mjs';
import {effectivePackageScripts} from './lib/effective-package-scripts.mjs';
import './check-homepage-r5.mjs';
import {currentFooterLogo} from './lib/branding-footer-successor.mjs';
const footerLogo=currentFooterLogo();
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
const inheritedFreeze = readJson(paths.freeze);
const currentH5 = validateH5HomepageR5Successor();
const freeze = {...inheritedFreeze,immutableArtifacts:currentH5.currentImmutableArtifacts};
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
const pkg = effectivePackageScripts(readJson(paths.package));

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
    assert.equal(asset.category, hero === 'FOUNDER-HERO-001' ? 'founder-portrait' : 'hero', `${hero} must be hero category`);
    assert.equal(asset.verification, hero === 'PHIOS-HERO-HOMEPAGE-D-v1' ? 'verified-owner-r4-get-decode' : hero === 'FOUNDER-HERO-001' ? 'verified-public-get-and-browser-decode' : 'verified-remote-head-get', `${hero} must be remote verified before active consumption`);
    assert.equal(hero === 'PHIOS-HERO-HOMEPAGE-D-v1' ? asset.remote?.httpStatus : asset.remote?.http_status, 200, `${hero} remote evidence must be HTTP 200`);
    if(hero==='FOUNDER-HERO-001'){assert.equal(asset.source_selection,'USER_SELECTED_FOUNDER_R2_ADDENDUM_20261010');assert.equal(record.sourceSuccessor,'content/web/index-surfaces/founder-human-presence-origin-successor-r2.json');assert.equal(asset.remote.sha256,'7826530cc7f41f7cd4a589e90c89f57ae603898583d9801657b7840b40b3db95');}else if(hero==='PHIOS-HERO-HOMEPAGE-D-v1'){assert.equal(asset.source_registry,'content/web/homepage/homepage-hero-r4-acceptance.json');assert.equal(asset.owner_approval.scope,'HOME_H01_ONLY');}else assert.ok(visualByCode.has(hero), `${hero} missing from canonical Client visual registry`);
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
assert.deepEqual([...heroRefs].sort(), [...expectedHeroes,'PHIOS-HERO-HOMEPAGE-D-v1','FOUNDER-HERO-001'].sort(), 'Every HERO-001..023 must have an actual Client consumer mapping');
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
function routeFiles(route,seen=new Set()) {
  assert(!seen.has(route),'H5_REDIRECT_CYCLE:'+route);seen.add(route);const match=text('_redirects').split(/\r?\n/).map(x=>x.trim().split(/\s+/)).find(x=>(x[0]===route||x[0]===route+'/')&&x[1]?.startsWith('/')&&x[1].split('#')[0]!==route);if(match)return routeFiles(match[1].split('#')[0],seen);
  const value = String(route || '');
  if (value.includes('*')) {
    const base = value.split('*')[0].replace(/^\/+|\/+$/g, '');
    if (!base || !fs.existsSync(`${ROOT}/${base}`)) return [];
    return fs.readdirSync(`${ROOT}/${base}`).filter(file => file.endsWith('.html')).map(file => `${base}/${file}`).sort();
  }
  const relative = value.replace(/^\/+|\/+$/g, '');
  if (!relative) return ['index.html'];
  const candidates = relative.endsWith(".html") ? [relative] : [`${relative}.html`, `${relative}/index.html`];
  return candidates.filter(file => fs.existsSync(`${ROOT}/${file}`));
}
function htmlReachesH5Bootstrap(file,seen=new Set()) {
  if(seen.has(file))return false;seen.add(file);
  const source=text(file);
  if(file==='explore/index.html'&&source.includes('/assets/js/explore-about-compat.js')){assert.match(text('assets/js/explore-about-compat.js'),/location\.replace\('\/about\/founder\//);return htmlReachesH5Bootstrap('about/founder/index.html',seen);}
  const redirect=source.match(/data-consolidation-target=["']([^"']+)/);
  if(redirect){const target=redirect[1].split('#')[0];return routeFiles(target).some(f=>htmlReachesH5Bootstrap(f,seen));}
  if (/assets\/js\/(?:public-shell|journey-shell|i18n)\.js/.test(source)) return true;
  function reaches(scriptPath,visited=new Set()) {
    if(visited.has(scriptPath)||!fs.existsSync(`${ROOT}/${scriptPath}`))return false;visited.add(scriptPath);
    if(scriptPath==='assets/js/client-visual-consumption.js'){assert.match(text(scriptPath),/scheduleClientVisualConsumption\(\)/);return true;}
    const js=text(scriptPath);
    if(/from\s+["'](?:\.\.\/)+i18n\.js["']|import\(["'](?:\.\.\/)+i18n\.js["']/.test(js))return true;
    const imports=[...js.matchAll(/(?:from\s*|import\s*\(?)["']([^"']+\.js)["']/g)].map(x=>x[1]);
    return imports.some(ref=>{if(!ref.startsWith('.'))return false;const normalized=new URL(ref,'file:///'+scriptPath).pathname.slice(1);return reaches(normalized,visited);});
  }
  return [...source.matchAll(/<script[^>]+src=["']([^"']+)/gi)].some(match=>reaches(match[1].split('?')[0].replace(/^\//,'')));
}
let bootstrapFileCount = 0;
for (const record of map.records.filter(record => record.visualState === 'ACTIVE_REQUIRED')) {
  if(record.surfaceCode==='THESIS'){
    // Owner-retired topic: historical visual identity remains, current page does not publish.
    assert(record.routes.every(route=>retiredResearchTopicPath(route)), 'ONLY_EXACT_RETIRED_THESIS_CONSUMER');
    for(const file of ['thesis.html','functions/api/thesis-download.js','content/registry/thesis.json','assets/js/thesis.js','assets/js/pages/thesis.js','assets/js/pages/thesis-seven.js','assets/js/locales/en/thesis.js','assets/js/locales/zh-Hans/thesis.js'])assert(!fs.existsSync(file),'RETIRED_THESIS_FILE_REAPPEARED:'+file);
    for(const file of ['assets/js/public-shell.js','assets/js/knowledge/catalog.js','assets/js/pages/library.js','about/index.html','research/index.html'])assert(!new RegExp("[\"'`]/thesis(?:\\.html)?[\"'`?#/]").test(text(file)),'RETIRED_THESIS_CURRENT_ENTRY:'+file);
    for(const route of record.routes){assert.equal((await currentRootRequest({request:new Request('https://qa.invalid'+route),env:{},next:()=>{throw Error('RETIRED_TOPIC_ROOT_DOWNSTREAM_FORBIDDEN')}})).status,404);const worker=wrapFinalReleaseWorker({fetch:()=>{throw Error('RETIRED_TOPIC_FINAL_DOWNSTREAM_FORBIDDEN')}},{active:true,preview:true,commit:'0'.repeat(40)});assert.equal((await worker.fetch(new Request('https://qa.invalid'+route),{},{})).status,404);}
    continue;
  }
  const files = [...new Set(record.routes.flatMap(route=>routeFiles(route)))];
  assert.ok(files.length > 0, `${record.surfaceCode} has no materialized Client route file for H.5 consumption`);
  for (const file of files) {
    assert.equal(htmlReachesH5Bootstrap(file), true, `${record.surfaceCode} mapped visual is not executable because ${file} cannot reach the H.5 bootstrap`);
    bootstrapFileCount += 1;
  }
}
assert.ok(bootstrapFileCount >= map.records.filter(record => record.visualState === 'ACTIVE_REQUIRED').length, 'H.5 executable bootstrap coverage incomplete');

// HOME and LIBRARY retain their existing managed hero ownership; H.5 only hydrates/adds governed support visuals.
assert.equal(map.records.find(r=>r.surfaceCode==='HOME').hero.slot,'H01');assert.equal(map.records.find(r=>r.surfaceCode==='HOME').hero.mobileAssetCode,'PHIOS-HERO-HOMEPAGE-M-v1');
assert.match(library, /data-bfr-library-hero="HERO-002"/);
assert.equal(map.records.find(r => r.surfaceCode === 'HOME').hero.mode, 'EXISTING_MANAGED');
assert.equal(map.records.find(r => r.surfaceCode === 'LIBRARY').hero.mode, 'EXISTING_MANAGED');

// Seven W11 semantic destination page outputs remain byte-frozen; H.5 upgrades them additively.
const destinationRecords = map.records.filter(r => r.destinationVisualUpgrade === true);
assert.equal(destinationRecords.length, 7);
for (const output of currentH5.currentDestinationOutputs) {
  assert.equal(crypto.createHash('sha256').update(currentR5ProtectedCheckerPredecessor(output.path,fs.readFileSync(`${ROOT}/${output.path}`))).digest('hex'), output.sha256, `PART H.5 mutated frozen W11 destination page: ${output.path}`);
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
assert.match(runtime, new RegExp(footerLogo));
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
assert.match(shell, new RegExp('data-public-brand-asset="'+footerLogo+'"'));
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
console.log('✓ PART H.5 Homepage R5 versioned current successor passed; final Cloud/customer acceptance remains pending.');
console.log('  HERO registry identities: 23/23 retained; the retired THESIS point has no current public page.');
console.log('  ICON consumers: 43/43 canonical identities mapped and remote verified.');
console.log('  V8 destination ancestors: 7/7 exact registered ancestry; current approved topic changes and THESIS retirement are checked separately.');
console.log(`  Branding live state: ${JSON.stringify(brandingStates)}.`);
console.log('  Live branding + POC-A browser acceptance remain external evidence gates; no fake acceptance created.');
