import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const [page, cxCss, en, zh, pricing, registry, services] =
  await Promise.all([
    read('professional/financial/index.html'),
    read('assets/customer-ui/surfaces/p1.css'),
    read('assets/js/locales/en/professional.js'),
    read('assets/js/locales/zh-Hans/professional.js'),
    read('content/registry/professional-pricing-policy.json').then(JSON.parse),
    read('content/registry/m4a-w6-financial-public-pages.json').then(JSON.parse),
    read('services.html')
  ]);

assert.equal(
  registry.baseline,
  '3b49824bc4ff14e970a46d9393c81e87103d7f92'
);
assert.equal(registry.route, '/professional/financial');
assert.equal(registry.page_sections.length, 12);
assert.equal(registry.service_comparison.length, 6);
assert.deepEqual(registry.responsive_viewports, [360, 768, 1440]);

const px2 = JSON.parse(await read('content/web-production/px2/successors/px2-w11-checker-successor-v1.json'));
assert.equal(px2.status, 'ACTIVE');
const cx = JSON.parse(await read('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v1.json'));
const cutover = JSON.parse(await read(cx.currentAuthority.priorityCutover));
const financialSurface = cutover.surfaces.find(surface => surface.surfaceId === 'FINANCIAL_REALITY');
assert.equal(cx.status, 'ACTIVE_CX_P1_PUBLIC_IA_SUCCESSOR');
assert.equal(financialSurface?.canonicalPath, '/professional/financial/');
assert.equal(financialSurface?.htmlPath, 'professional/financial/index.html');
for (const marker of [
  'data-cx-surface="FINANCIAL_REALITY"',
  '/assets/customer-ui/tokens.css',
  '/assets/customer-ui/surfaces/p1.css',
  '/assets/customer-ui/js/shell.js',
  '/assets/customer-ui/js/surfaces/financial-reality.js',
  'data-cx-financial-form',
  'data-cx-financial-results'
]) assert.ok(page.includes(marker), `CX financial surface missing: ${marker}`);
assert.equal(page.includes('/assets/css/phios-public-v2.css'), false);
assert.equal(page.includes('/assets/js/public-shell-v2.js'), false);
for (const visible of ['Financial Reality Navigation','Financial Stamina Analysis','Financial Consultation','Financial Navigation Plan','Implementation Follow-up','Annual Runtime Review']) {
  assert.ok(en.includes(visible), `M4A English service authority missing: ${visible}`);
}
assert.ok(page.includes('href="/professional/appointments/"'));
assert.ok(services.includes('href="/professional/financial/"') || services.includes('href="/professional/financial"'));

for (const key of [
  'qualificationsTitle', 'qualificationsCopy', 'priceTitle', 'priceCopy',
  'comparisonTitle', 'comparisonLead', 'boundary', 'boundaryDate',
  'boundaryGuarantee'
]) {
  assert.ok(en.includes(`${key}:`), `English key missing: ${key}`);
  assert.ok(zh.includes(`${key}:`), `Chinese key missing: ${key}`);
}
assert.ok(en.includes(
  'Calculations and projections depend on the information and assumptions'
));
assert.ok(zh.includes('报告日期当时可取得的资料与假设'));
assert.ok(en.includes(
  'do not guarantee investment, insurance, property or future financial outcomes'
));
assert.ok(zh.includes('不保证投资、保险、物业或任何未来财务结果'));
assert.ok(en.includes('appropriately licensed professional'));
assert.ok(zh.includes('具备相应资格的专业人士'));
assert.ok(en.includes('No product commission determines the fee'));
assert.ok(zh.includes('不会由任何产品佣金决定'));

assert.equal(pricing.amountsPublished, false);
assert.equal(pricing.checkoutEnabled, false);
assert.equal(page.includes('RM '), false);
assert.equal(page.includes('checkout'), false);
assert.equal(page.includes('guaranteed return'), false);
assert.equal(page.includes('guaranteed outcome'), false);
assert.equal(page.includes('send by email'), false);

assert.ok(cxCss.includes('.cx-p1-grid--3'));
assert.ok(cxCss.includes('@media(max-width:900px)'));
assert.ok(cxCss.includes('@media(max-width:620px)'));
for (const viewport of registry.responsive_viewports) {
  assert.ok(viewport >= 360 && viewport <= 1440);
}
for (const value of Object.values(registry.boundaries)) {
  assert.equal(value, false);
}

console.log('✓ M4A-W6 Financial Public Pages passed: M4A service authority and boundary copy remain bilingual while the responsive CX-P1 Financial Reality surface consumes the one customer design system.');
