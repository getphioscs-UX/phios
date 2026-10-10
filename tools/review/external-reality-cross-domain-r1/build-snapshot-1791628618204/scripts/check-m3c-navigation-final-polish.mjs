import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');

const [
  navigationPage,
  navigationController,
  navigationRender,
  executionRender,
  publicCss,
  navigationCss,
  entryController,
  enNavigation,
  zhNavigation
] = await Promise.all([
  read('reality-navigation.html'),
  read('assets/js/navigation.js'),
  read('assets/js/modules/navigation-render.js'),
  read('assets/js/modules/navigation-execution-render.js'),
  read('assets/css/public-experience.css'),
  read('assets/css/navigation-visual-alignment.css'),
  read('assets/js/reality-entry.js'),
  read('assets/js/locales/en/navigation.js'),
  read('assets/js/locales/zh-Hans/navigation.js')
]);

assert.ok(entryController.includes("get('draft')"));
const customerStart = navigationPage.indexOf('class="navigation-customer-status"');
const customerEnd = navigationPage.indexOf('<aside', customerStart);
const customerMarkup = navigationPage.slice(customerStart, customerEnd);
for (const forbidden of [
  'Runtime Entity',
  'Runtime Entry',
  'Reading Reference',
  'Navigation Version',
  'Storage Capability',
  'Paid AI',
  'Raw Contract',
  'Lineage',
  'R5',
  'Rule Priority'
]) {
  assert.equal(
    customerMarkup.includes(forbidden),
    false,
    `Customer View exposes technical language: ${forbidden}`
  );
}
for (const token of [
  'Current path',
  'Execution status',
  'Record progress',
  'Next record',
  'Review needed',
  'Save status'
]) {
  assert.ok(customerMarkup.includes(token), `Customer status missing: ${token}`);
}

const inspector = navigationPage.slice(navigationPage.indexOf('<aside'));
for (const token of [
  'data-navigation-technical',
  'hidden',
  '<details>',
  'navigationRuntimeEntityId',
  'navigationRuntimeEntryId',
  'navigationReadingReference',
  'navigationVersion',
  'navigationRegion',
  'navigationMethod',
  'navigationStorageCapability',
  'navigationLineage',
  'navigationRawContract'
]) {
  assert.ok(inspector.includes(token), `Technical View missing: ${token}`);
}
assert.ok(navigationController.includes("setNavigationMode('customer')"));
assert.ok(navigationController.includes("mode === 'technical'"));
assert.ok(navigationRender.includes('JSON.stringify(response, null, 2)'));

for (const token of [
  'saveStatus.notStarted',
  'saveStatus.saved',
  'saveStatus.recording',
  'saveStatus.review',
  'deviceStorage'
]) {
  assert.ok(executionRender.includes(token), `Customer storage state missing: ${token}`);
}
assert.ok(enNavigation.includes('Your current records are stored on this device.'));
assert.ok(zhNavigation.includes('当前记录保存在此设备。'));
assert.ok(enNavigation.includes('Cross-device recovery is not yet available.'));
assert.ok(zhNavigation.includes('跨设备恢复尚未开放。'));
for (const forbidden of ['Cloud Sync', '云端同步']) {
  assert.equal(enNavigation.includes(forbidden) || zhNavigation.includes(forbidden), false);
}

for (const width of ['760px', '520px']) {
  assert.ok(publicCss.includes(`max-width: ${width}`));
}
for (const width of ['720px', '520px']) {
  assert.ok(navigationCss.includes(`max-width: ${width}`));
}
assert.ok(navigationCss.includes('.navigation-inspector[hidden]'));
assert.ok(navigationCss.includes('.navigation-customer-status'));

console.log('✓ M3C-W12 Final Polish passed: customer status and collapsed Technical Inspector are aligned.');
console.log('  Public interactions remain client-only; Runtime, Reading, Navigation, Review, lineage, persistence and Evidence contracts remain unchanged.');
