import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const [page, css, en, zh, pricing, registry, services, shell] =
  await Promise.all([
    read('professional/financial/index.html'),
    read('assets/css/public-experience.css'),
    read('assets/js/locales/en/professional.js'),
    read('assets/js/locales/zh-Hans/professional.js'),
    read('content/registry/professional-pricing-policy.json').then(JSON.parse),
    read('content/registry/m4a-w6-financial-public-pages.json').then(JSON.parse),
    read('services.html'),
    read('assets/js/public-shell.js')
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
assert.ok(page.includes('/assets/css/phios-public-v2.css'));
for (const visible of ['Financial Reality Navigation','Financial Stamina Analysis','Financial Consultation','Financial Navigation Plan','Implementation Follow-up','Annual Runtime Review']) {
  assert.ok(page.includes(visible), `PX2 financial surface missing: ${visible}`);
}
assert.ok(page.includes('href="/professional-appointments"'));
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

const px2css = await read('assets/css/phios-public-v2.css');
assert.ok(px2css.includes('.puxr-grid-3'));
assert.ok(px2css.includes('@media(max-width:1040px)'));
assert.ok(px2css.includes('@media(max-width:620px)'));
for (const viewport of registry.responsive_viewports) {
  assert.ok(viewport >= 360 && viewport <= 1440);
}
assert.ok(page.includes('data-px2-surface="FINANCIAL"'));
assert.ok(page.includes('/assets/js/public-shell-v2.js'));
for (const value of Object.values(registry.boundaries)) {
  assert.equal(value, false);
}

console.log('✓ M4A-W6 Financial Public Pages passed: complete service orientation, six-service comparison, transparent pricing policy and three-part public boundary are bilingual and responsive.');
