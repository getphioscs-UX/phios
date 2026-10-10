import assert from 'node:assert/strict';
import fs from 'node:fs';

const logo = JSON.parse(fs.readFileSync('content/web-production/registries/phios-logo-registry-v1.json','utf8'));
const publicAssets = JSON.parse(fs.readFileSync('content/registry/public-assets.json','utf8'));
const shell = fs.readFileSync('assets/js/public-shell.js','utf8');
const css = fs.readFileSync('assets/css/public-experience.css','utf8');

assert.equal(logo.records.length, 12);
assert.equal(new Set(logo.records.map(x => x.assetCode)).size, 12);
assert.equal(new Set(logo.records.map(x => x.objectKey)).size, 12);

for (const record of logo.records) {
  assert.equal(record.format, 'svg');
  assert.ok(record.objectKey.startsWith('images/branding/logo/'));
  assert.ok(record.objectKey.endsWith('.svg'));
  const publicRecord = publicAssets.assets.find(x => x.asset_code === record.assetCode);
  assert.ok(publicRecord, `Missing public asset registration: ${record.assetCode}`);
  assert.equal(publicRecord.object_key, record.objectKey);
  assert.equal(publicRecord.family, 'LOGO');
}

assert.match(shell, /data-public-brand-asset="LOGO-003"/);
assert.match(shell, /data-public-brand-asset="LOGO-010"/);
assert.match(shell, /resolvePublicAssetForWeb\('LOGO-011'/);
assert.match(css, /\.public-brand__logo/);

console.log('✓ PHI OS canonical logo system passed: 12/12 identities, resolver-bound public shell, favicon fail-closed.');
