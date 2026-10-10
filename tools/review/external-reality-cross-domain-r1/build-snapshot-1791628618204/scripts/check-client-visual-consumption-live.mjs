import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const required = Object.freeze(['LOGO-003', 'LOGO-010', 'LOGO-011']);
const publicAssets = read('content/registry/public-assets.json');
const assets = new Map(publicAssets.assets.map(a => [a.asset_code, a]));
const evidencePath = 'content/web-production/client-visual-consumption/evidence/branding-r2-live-verification-v1.json';

assert.ok(fs.existsSync(evidencePath), 'PART H.5 live branding evidence missing. Run npm run client-visual:verify-branding with PHIOS_PUBLIC_ASSET_BASE_URL.');
const evidence = read(evidencePath);
assert.equal(evidence.work, 'PART-H.5');
for (const code of required) {
  const asset = assets.get(code);
  assert.ok(asset, `${code} missing from public asset registry`);
  assert.equal(asset.verification, 'verified-remote-head-get', `${code} is not remote verified`);
  assert.equal(asset.remote?.http_status, 200, `${code} lacks HTTP 200 live evidence`);
  assert.equal(evidence.requiredStates?.[code], 'REMOTE_VERIFIED', `${code} live evidence not accepted`);
}
assert.equal(evidence.status, 'REQUIRED_BRANDING_REMOTE_VERIFIED');
console.log('✓ PART H.5 live branding gate passed: canonical header/footer/favicon assets are remote verified.');
console.log('  POC-A10 browser rendering/reflow acceptance remains owned by POC-A and must be rerun on the deployed H.5 commit.');
