import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const ROOT = process.cwd();
const read = p => JSON.parse(fs.readFileSync(`${ROOT}/${p}`, 'utf8'));
const text = p => fs.readFileSync(`${ROOT}/${p}`, 'utf8');
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(`${ROOT}/${p}`)).digest('hex');
const codes = Object.freeze(Array.from({ length: 12 }, (_, i) => `LOGO-${String(i + 1).padStart(3, '0')}`));
const paths = Object.freeze({
  publicAssets: 'content/registry/public-assets.json',
  logoRegistry: 'content/web-production/registries/phios-logo-registry-v1.json',
  evidence: 'content/web-production/client-visual-consumption/evidence/branding-r2-live-verification-v1.json',
  reconciliation: 'content/web-production/client-visual-consumption/reconciliation/part-h5a-branding-r2-evidence-reconciliation-v1.json',
  successor: 'content/web-production/client-visual-consumption/successors/part-h5a-current-branding-successor-v1.json',
  shell: 'assets/js/public-shell.js'
});
for (const path of Object.values(paths)) assert.ok(fs.existsSync(`${ROOT}/${path}`), `PART H.5A missing: ${path}`);
const publicAssets = read(paths.publicAssets);
const logoRegistry = read(paths.logoRegistry);
const evidence = read(paths.evidence);
const reconciliation = read(paths.reconciliation);
const successor = read(paths.successor);
const shell = text(paths.shell);
const publicByCode = new Map(publicAssets.assets.map(asset => [asset.asset_code, asset]));
const logoByCode = new Map(logoRegistry.records.map(record => [record.assetCode, record]));

assert.equal(evidence.status, 'REQUIRED_BRANDING_REMOTE_VERIFIED');
assert.equal(evidence.successorWork, 'PART-H.5A');
assert.equal(evidence.all12RemoteVerified, true);
assert.deepEqual(evidence.requiredProductionBranding, codes);
assert.equal(evidence.results.length, 12);
assert.equal(reconciliation.status, 'PART_H5A_LOGO_001_012_REMOTE_VERIFICATION_MATERIALIZED_CURRENT_SUCCESSOR');
assert.equal(successor.status, 'PART_H5A_CURRENT_BRANDING_REMOTE_VERIFIED_AND_CLIENT_BOUND');
assert.equal(successor.reconciliation.sha256, sha256(paths.reconciliation));
assert.equal(successor.publicAssetRegistry.currentSha256, sha256(paths.publicAssets));
assert.equal(successor.logoRegistry.currentSha256, sha256(paths.logoRegistry));
assert.equal(successor.remoteVerificationAdvancement.targetCount, 12);
assert.deepEqual(successor.remoteVerificationAdvancement.targetAssetCodes, codes);
assert.equal(reconciliation.evidence.sha256, sha256(paths.evidence));
assert.equal(reconciliation.evidence.targetCount, 12);
assert.equal(reconciliation.evidenceBoundary.etagInvented, false);
assert.equal(reconciliation.evidenceBoundary.contentLengthInvented, false);

for (const code of codes) {
  const asset = publicByCode.get(code);
  const logo = logoByCode.get(code);
  const result = evidence.results.find(item => item.assetCode === code);
  assert.ok(asset && logo && result, `${code}: missing materialized authority/evidence`);
  assert.equal(asset.object_key, logo.objectKey, `${code}: object key divergence`);
  assert.equal(asset.status, 'remote-verified');
  assert.equal(asset.verification, 'verified-remote-head-get');
  assert.equal(logo.status, 'remote-verified');
  assert.equal(logo.verification, 'verified-remote-head-get');
  assert.equal(asset.remote?.http_status, 200);
  assert.equal(asset.remote?.content_type, 'image/svg+xml');
  assert.equal(logo.remote?.httpStatus, 200);
  assert.equal(logo.remote?.contentType, 'image/svg+xml');
  assert.equal(asset.remote?.requested_url, result.requestedUrl);
  assert.equal(logo.remote?.requestedURL, result.requestedUrl);
  assert.equal(result.httpStatus, 200);
  assert.equal(result.contentType, 'image/svg+xml');
  assert.equal(result.liveVerified, true);
  assert.equal(evidence.requiredStates[code], 'REMOTE_VERIFIED');
  assert.equal(asset.remote?.etag_recorded, false);
  assert.equal(logo.remote?.etagRecorded, false);
}

assert.equal(reconciliation.consumerActivation.header, 'LOGO-003');
assert.equal(reconciliation.consumerActivation.footerDark, 'LOGO-010');
assert.equal(reconciliation.consumerActivation.favicon, 'LOGO-011');
assert.equal(reconciliation.consumerActivation.appIcon, 'LOGO-012');
assert.match(shell, /data-public-brand-asset="LOGO-003"/);
assert.match(shell, /public-brand--footer/);
assert.match(shell, /data-public-brand-asset="LOGO-010"/);
assert.match(shell, /resolvePublicAssetForWeb\('LOGO-011'/);
assert.match(shell, /resolvePublicAssetForWeb\('LOGO-012'/);
assert.match(shell, /apple-touch-icon/);
assert.equal((shell.match(/data-public-brand-asset="LOGO-003"/g) || []).length, 1, 'Header logo binding must be unique');
assert.equal((shell.match(/data-public-brand-asset="LOGO-010"/g) || []).length, 1, 'Footer logo binding must be unique');
assert.equal((shell.match(/class="public-brand__fallback"/g) || []).length, 2, 'Header/footer each retain exactly one fail-closed textual fallback');

console.log('✓ PART H.5A Branding R2 Evidence Reconciliation passed.');
console.log('  LOGO-001..012: 12/12 HTTP 200 image/svg+xml evidence materialized without inventing ETag/content-length.');
console.log('  Client bindings: header LOGO-003, footer LOGO-010, favicon LOGO-011, app icon LOGO-012.');
