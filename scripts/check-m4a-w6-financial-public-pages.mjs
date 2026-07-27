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

for (const key of [
  'whatTitle', 'forTitle', 'reviewTitle', 'differenceTitle',
  'optionsTitle', 'informationTitle', 'processTitle',
  'qualificationsTitle', 'privacyTitle', 'limitTitle',
  'priceTitle', 'book'
]) {
  assert.ok(
    page.includes(`financialPublic.${key}`),
    `Public section missing: ${key}`
  );
}

for (const key of [
  'snapshot', 'stamina', 'consultation',
  'navigation', 'followup', 'annual'
]) {
  assert.ok(
    page.includes(`financialPublic.services.${key}`),
    `Comparison service missing: ${key}`
  );
  assert.ok(
    page.includes(`financialPublic.services.${key}Copy`),
    `Comparison copy missing: ${key}`
  );
}
assert.equal(
  (page.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g) || []).length,
  6
);
assert.ok(page.includes('professional-public-comparison'));
assert.ok(page.includes('professional-comparison-wrap'));
assert.ok(page.includes('tabindex="0"'));
assert.ok(page.includes('href="/professional-appointments"'));
assert.ok(services.includes('href="/professional/financial"'));

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

assert.ok(css.includes('.professional-detail-grid'));
assert.ok(css.includes('.professional-public-comparison'));
assert.ok(css.includes('.professional-comparison-wrap'));
assert.ok(css.includes('overflow-x: auto'));
assert.ok(css.includes('@media (max-width: 768px)'));
assert.ok(css.includes('@media (max-width: 520px)'));
for (const viewport of registry.responsive_viewports) {
  assert.ok(viewport >= 360 && viewport <= 1440);
}
assert.ok(page.includes('data-public-section="professional"'));
assert.ok(shell.includes('public-header'));
for (const value of Object.values(registry.boundaries)) {
  assert.equal(value, false);
}

console.log('✓ M4A-W6 Financial Public Pages passed: complete service orientation, six-service comparison, transparent pricing policy and three-part public boundary are bilingual and responsive.');
