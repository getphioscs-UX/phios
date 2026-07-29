import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const registry = await readJson('content/registry/pds-w6-reconstruction-experience.json');
assert.equal(registry.baseline.commit, '8a7b6cfab35252dd7dd080b5e57b1a1c42035955');
assert.equal(registry.scope.presentationOnly, true);
assert.equal(registry.scope.customerViews.length, 5);

for (const [file, expected] of Object.entries(registry.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected Reconstruction artifact changed: ${file}`);
}

const page = await read('reality-reconstruction.html');
for (const contract of [
  '/assets/css/reconstruction-pds-w6.css',
  'id="reconstructionUpdateNotice"',
  'role="status"',
  'aria-live="polite"',
  '<details class="technical-record" hidden>'
]) {
  assert.equal(page.includes(contract), true, `Missing W6 page contract: ${contract}`);
}

const renderer = await read('assets/js/modules/reconstruction-experience-render.js');
const customerBlock = renderer.slice(
  renderer.indexOf('function customerHTML'),
  renderer.indexOf('function downstreamArtifacts')
);
assert.equal((customerBlock.match(/class="w14-customer-card/g) || []).length, 5);
for (const key of [
  "t('reconstruction.customerChangeTitle')",
  "t('reconstruction.customerProcessTitle')",
  "t('reconstruction.customerConditionsTitle')",
  "t('reconstruction.customerConfirmedTitle')",
  "t('reconstruction.customerUnknownTitle')"
]) {
  assert.equal(customerBlock.includes(key), true, `Missing five-view key: ${key}`);
}

const evidenceBlock = renderer.slice(
  renderer.indexOf('function evidenceCardHTML'),
  renderer.indexOf('function customerHTML')
);
for (const forbidden of [
  'source.source_path',
  'source.source_evidence_id',
  'pair.raw_text',
  'pair.normalized_text'
]) {
  assert.equal(evidenceBlock.includes(forbidden), false, `Evidence View exposes: ${forbidden}`);
}
assert.equal(evidenceBlock.includes('sourceLabel('), true);
assert.equal(renderer.includes('experience.views?.technical?.evidence_items'), true);
assert.equal(renderer.includes('item.source_field'), true);
assert.equal(renderer.includes('uniquePresentationItems'), true);
assert.equal(renderer.includes("technicalRecord.hidden = selected !== 'technical'"), true);
assert.equal(renderer.includes("updateNotice.focus()"), true);

const css = await read('assets/css/reconstruction-pds-w6.css');
for (const contract of [
  '.w14-customer-card--change',
  '.w14-customer-card--confirmed',
  '.w14-customer-card--unknown',
  '.w14-evidence-kind',
  '[data-w14-view="technical"][hidden]',
  '@media (max-width: 360px)',
  '@media (max-width: 768px)',
  '@media (min-width: 1440px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(css.includes(contract), true, `Missing W6 style contract: ${contract}`);
}

for (const localeFile of [
  'assets/js/locales/en/reconstruction.js',
  'assets/js/locales/zh-Hans/reconstruction.js'
]) {
  const locale = await read(localeFile);
  for (const key of ['customerIntro:', 'evidenceIntro:', 'evidenceWhyShown:']) {
    assert.equal(locale.includes(key), true, `${localeFile} missing ${key}`);
  }
}

console.log('PDS-W6 Reconstruction Experience checks passed.');
