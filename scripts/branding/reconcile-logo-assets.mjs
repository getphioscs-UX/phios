import assert from 'node:assert/strict';
import fs from 'node:fs';

const PUBLIC = 'content/registry/public-assets.json';
const LOGO = 'content/web-production/registries/phios-logo-registry-v1.json';

const publicRegistry = JSON.parse(fs.readFileSync(PUBLIC, 'utf8'));
const logoRegistry = JSON.parse(fs.readFileSync(LOGO, 'utf8'));

const rawBase = String(process.env.PHIOS_PUBLIC_ASSET_BASE_URL ?? '').trim();
assert.ok(rawBase, 'PHIOS_PUBLIC_ASSET_BASE_URL is required.');
const parsed = new URL(rawBase);
assert.equal(parsed.protocol, 'https:');
const baseUrl = parsed.toString().replace(/\/$/, '');

const logoCodes = new Set(logoRegistry.records.map(record => record.assetCode));
const targets = publicRegistry.assets.filter(asset => logoCodes.has(asset.asset_code));
assert.equal(targets.length, logoRegistry.records.length);

const results = [];
for (const asset of targets) {
  const url = `${baseUrl}/${asset.object_key.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  assert.ok(response.ok, `LOGO_REMOTE_HEAD_FAILED ${asset.asset_code} ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  assert.match(contentType, /image\/svg\+xml/i, `LOGO_CONTENT_TYPE_MISMATCH ${asset.asset_code}: ${contentType}`);
  results.push({
    assetCode: asset.asset_code,
    url,
    status: response.status,
    contentType,
    contentLength: response.headers.get('content-length'),
    etag: response.headers.get('etag'),
    verifiedAt: new Date().toISOString()
  });
}

for (const result of results) {
  const asset = publicRegistry.assets.find(item => item.asset_code === result.assetCode);
  asset.status = 'remote-verified';
  asset.verification = 'verified-remote-head-get';
  asset.remote = {
    requested_url: result.url,
    http_status: result.status,
    content_type: result.contentType,
    content_length: result.contentLength,
    etag: result.etag,
    verified_at: result.verifiedAt
  };

  const logo = logoRegistry.records.find(item => item.assetCode === result.assetCode);
  logo.status = 'remote-verified';
  logo.verification = 'verified-remote-head-get';
  logo.remote = {
    requestedURL: result.url,
    httpStatus: result.status,
    contentType: result.contentType,
    contentLength: result.contentLength,
    etag: result.etag,
    verifiedAt: result.verifiedAt
  };
}

fs.writeFileSync(PUBLIC, JSON.stringify(publicRegistry, null, 2) + '\n');
fs.writeFileSync(LOGO, JSON.stringify(logoRegistry, null, 2) + '\n');
console.log(`✓ PHI OS logo R2 verification passed: ${results.length}/${results.length}.`);
