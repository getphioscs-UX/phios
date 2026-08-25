import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const json = relativePath => JSON.parse(read(relativePath));
const exists = relativePath => fs.existsSync(path.join(root, relativePath));
const legacyComposition = [
  'puxr-v8.css', 'puxr-shell.js', 'knowledge-spine.css', 'runtime-spine.css',
  'service-continuity.css', 'knowledge-spine-visuals.js', 'runtime-spine-visuals.js',
  'service-continuity-visuals.js', 'client-production-surfaces.js'
];

// PX2 remains the presentation authority for surfaces that have not entered the
// governed CX-P1 cutover.
const px2Pages = [
  'index.html', 'library.html', 'articles.html', 'services.html',
  'knowledge-search.html', 'books/index.html',
  'professional/personal-runtime/index.html', 'search/index.html',
  'readings/index.html'
];
for (const relativePath of px2Pages) {
  const source = read(relativePath);
  assert.match(source, /\/assets\/css\/phios-public-v2\.css/, `${relativePath}: V2 CSS`);
  assert.match(source, /\/assets\/js\/public-shell-v2\.js/, `${relativePath}: V2 shell`);
  for (const legacy of legacyComposition) assert.ok(!source.includes(legacy), `${relativePath}: legacy composition ${legacy}`);
}

// The cutover registry, not a hard-coded exception list, owns which former PX2
// destinations now consume the one CX customer shell and design system.
const cx = json('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v1.json');
const cutover = json(cx.currentAuthority.priorityCutover);
assert.equal(cx.status, 'ACTIVE_CX_P1_PUBLIC_IA_SUCCESSOR');
assert.equal(cutover.status, 'CODE_CUTOVER_COMPLETE_PRODUCTION_BROWSER_ACCEPTANCE_PENDING');
assert.equal(cutover.surfaces.length, 4);
for (const surface of cutover.surfaces) {
  assert.ok(exists(surface.htmlPath), `missing CX surface: ${surface.htmlPath}`);
  const source = read(surface.htmlPath);
  for (const marker of [
    `data-cx-surface="${surface.surfaceId}"`,
    '<link rel="canonical"',
    `href="${surface.canonicalPath}"`,
    '/assets/customer-ui/tokens.css',
    '/assets/customer-ui/surfaces/p1.css',
    '/assets/customer-ui/js/shell.js',
    'data-cx-header',
    'data-cx-footer'
  ]) assert.ok(source.includes(marker), `${surface.surfaceId}: missing ${marker}`);
  assert.equal(source.includes('/assets/css/phios-public-v2.css'), false, `${surface.surfaceId}: legacy PX2 CSS`);
  assert.equal(source.includes('/assets/js/public-shell-v2.js'), false, `${surface.surfaceId}: legacy PX2 shell`);
  for (const legacy of legacyComposition) assert.ok(!source.includes(legacy), `${surface.surfaceId}: legacy composition ${legacy}`);
}

const redirects = read('_redirects');
for (const surface of cutover.surfaces) {
  for (const legacy of surface.legacyRoutes) {
    assert.ok(redirects.includes(`${legacy} ${surface.canonicalPath} 308`), `missing CX redirect: ${legacy}`);
  }
}

const audit = json('content/web-production/px2/audit/px2-w0-current-public-consumer-audit-v1.json');
assert.equal(audit.baselineCommit, '09329d4');
assert.ok(audit.surfaces.length >= 8);
const ia = json('content/web-production/px2/freeze/px2-w1-public-ia-freeze-v1.json');
assert.equal(ia.status, 'FROZEN');
assert.deepEqual(ia.primaryJourney, ['SEARCH', 'ASK', 'READ', 'FINANCIAL', 'MY_REALITY']);

const pointer = json('content/web-production/registries/current-client-visual-registry.json');
assert.match(pointer.currentRegistryPath, /client-visual-asset-registry-v1\.7\.json$/);
const visualRegistry = json(pointer.currentRegistryPath.replace(/^\//, ''));
for (const code of ['ILL-004', 'ILL-005', 'ILL-008', 'ILL-010']) {
  const asset = visualRegistry.assets.find(candidate => candidate.sequence === code);
  assert.ok(asset);
  assert.equal(asset.r2.remoteVerified, true, `${code} remote verified`);
}
const visualResolver = read('assets/js/public-v2/unified-public-visual-resolver.js');
assert.match(visualResolver, /current-client-visual-registry\.json/);
assert.ok(!/client-visual-asset-registry-v1\.[0-9]+\.json/.test(visualResolver));

// The Stage16 shell remains a compatibility consumer for non-cutover PX2 pages;
// the CX shell owns current customer navigation on the four P1 destinations.
const px2Shell = read('assets/js/public-shell-v2.js');
for (const href of ['/ask', '/library', '/personal-runtime', '/financial-reality', '/my-reality', '/reality-journey', '/account']) {
  assert.ok(px2Shell.includes(href), `PX2 compatibility shell route ${href}`);
}
for (const retiredPrimary of ["href: '/knowledge-search'", "href: '/readings/'", "href: '/professional/financial/'"]) {
  assert.equal(px2Shell.includes(retiredPrimary), false, `Stage16 shell retained retired primary route ${retiredPrimary}`);
}
const cxNavigation = read(cx.currentAuthority.navigationRuntime);
for (const href of ['/ask', '/reality/', '/perspectives/', '/professional/']) {
  assert.ok(cxNavigation.includes(`href:'${href}'`), `CX navigation route ${href}`);
}
for (const legacy of ['/knowledge-search', '/my-reality', '/personal-runtime', '/financial-reality']) {
  assert.equal(cxNavigation.includes(legacy), false, `CX navigation retained legacy route ${legacy}`);
}

const home = read('index.html');
for (const href of ['/ask', '/library', '/personal-runtime', '/financial-reality', '/my-reality', '/reality-journey']) {
  assert.ok(home.includes(`href="${href}"`), `Stage16 home route ${href}`);
}
assert.match(home, /data-cir-root/);
assert.equal((home.match(/data-cir-intent=/g) ?? []).length, 6);
assert.match(read('search/index.html'), /data-px2-search-results/);
assert.match(read('assets/js/pages/search-v2.js'), /public\/retrieval\/publications\.json/);
assert.match(read('assets/js/components/publications-v2.js'), /\.\.\/public-shell-v2\.js/);
assert.match(read('knowledge-search.html'), /knowledge-search-b\.js/);
assert.match(read('assets/js/pages/knowledge-search-b.js'), /isAnswerQuestionRelevant/);

const methods = json('content/web-production/px2/registries/public-method-catalog-v1.json');
assert.equal(methods.methods.length, 7);
assert.ok(methods.methods.every(method => method.runAllowed === false));
for (const methodCode of ['ASTROLOGY', 'BAZI', 'HUMAN_DESIGN', 'NUMEROLOGY', 'I_CHING', 'TAROT', 'ZI_WEI_DOU_SHU']) {
  assert.ok(methods.methods.some(method => method.methodCode === methodCode));
}

const financial = read('professional/financial/index.html');
for (const marker of ['data-cx-financial-form', 'data-cx-financial-results', '/assets/customer-ui/js/surfaces/financial-reality.js']) {
  assert.ok(financial.includes(marker), `Financial CX projection missing: ${marker}`);
}
for (const authorityLabel of ['Financial Reality Navigation', 'Financial Stamina Analysis', 'Financial Navigation Plan']) {
  assert.ok(read('assets/js/locales/en/professional.js').includes(authorityLabel), `Financial authority missing: ${authorityLabel}`);
}
assert.match(read('ask.html'), /data-cx-ask-form/);
assert.match(read('perspectives/personal/index.html'), /data-cx-personal-form/);
assert.match(read('articles.html'), /data-puxr-publications/);
assert.match(read('books/index.html'), /data-px2-five-volumes/);
const reality = read('reality/index.html');
assert.match(reality, /CURRENT REALITY/);
assert.match(reality, /ILL-010/);
assert.match(reality, /Start with my reality/);

const px2Successor = json('content/web-production/px2/successors/px2-w11-checker-successor-v1.json');
assert.equal(px2Successor.status, 'ACTIVE');
const zero = json('content/web-production/px2/deletion/px2-w12-zero-consumer-legacy-audit-v1.json');
assert.equal(zero.status, 'PASS');
const deletion = json('content/web-production/px2/deletion/px2-w13-physical-deletion-v1.json');
for (const relativePath of deletion.deleted) assert.equal(exists(relativePath), false, `deleted: ${relativePath}`);

console.log('✓ PX2 → Stage16 → CX-P1 current Public Experience passed.');
console.log('  Non-cutover surfaces retain strict PX2 composition; four governed P1 surfaces consume the one CX shell and customer design system.');
console.log('  M4A authority, public knowledge, visual resolution, redirects and zero-consumer deletion boundaries remain preserved.');
