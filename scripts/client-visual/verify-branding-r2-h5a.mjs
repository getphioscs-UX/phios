import fs from 'node:fs';
import { normalizeBase, encodedKey, now, svgAudit, writeJson } from '../hpc2-pre/lib.mjs';

const PUBLIC = 'content/registry/public-assets.json';
const LOGO = 'content/web-production/registries/phios-logo-registry-v1.json';
const EVIDENCE = 'content/web-production/client-visual-consumption/evidence/branding-r2-live-verification-v1.json';
const REQUIRED = Object.freeze(Array.from({ length: 12 }, (_, index) => `LOGO-${String(index + 1).padStart(3, '0')}`));
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const publicRegistry = readJson(PUBLIC);
const logoRegistry = readJson(LOGO);
const baseUrl = normalizeBase(process.env.PHIOS_PUBLIC_ASSET_BASE_URL);
const publicByCode = new Map(publicRegistry.assets.map(asset => [asset.asset_code, asset]));
const results = [];
for (const code of REQUIRED) {
  const logo = logoRegistry.records.find(record => record.assetCode === code);
  const asset = publicByCode.get(code);
  if (!asset || !logo || asset.object_key !== logo.objectKey) {
    results.push({ assetCode: code, state: 'AUTHORITY_MISMATCH', liveVerified: false });
    continue;
  }
  const requestedUrl = `${baseUrl}/${encodedKey(asset.object_key)}`;
  try {
    const response = await fetch(requestedUrl, { method: 'GET', redirect: 'follow', headers: { Accept: 'image/svg+xml,image/*;q=0.8,*/*;q=0.1' } });
    const contentType = response.headers.get('content-type') || '';
    const bytes = Buffer.from(await response.arrayBuffer());
    const svg = /image\/svg\+xml/i.test(contentType) ? svgAudit(bytes.toString('utf8')) : null;
    const liveVerified = response.ok && /image\/svg\+xml/i.test(contentType) && svg?.validSvg === true && svg.scriptPresent === false && svg.externalActiveContentPresent === false;
    results.push({ assetCode: code, objectKey: asset.object_key, requestedUrl, httpStatus: response.status, contentType, contentLength: response.headers.get('content-length') || String(bytes.length), etag: response.headers.get('etag'), svg, state: liveVerified ? 'REMOTE_VERIFIED' : 'LIVE_REMOTE_NOT_ACCEPTED', liveVerified, verifiedAt: now(), evidenceSource: 'PART_H5A_FRESH_LIVE_REVALIDATION' });
  } catch (error) {
    results.push({ assetCode: code, objectKey: asset.object_key, requestedUrl, state: 'LIVE_REMOTE_REQUEST_FAILED', liveVerified: false, error: error?.message || String(error), verifiedAt: now() });
  }
}
const requiredStates = Object.fromEntries(REQUIRED.map(code => [code, results.find(item => item.assetCode === code)?.liveVerified ? 'REMOTE_VERIFIED' : 'REQUIRED_LIVE_EVIDENCE_MISSING']));
const all12RemoteVerified = Object.values(requiredStates).every(state => state === 'REMOTE_VERIFIED');
const prior = fs.existsSync(EVIDENCE) ? readJson(EVIDENCE) : {};
writeJson(EVIDENCE, {
  ...prior,
  schemaVersion: 'PHI-OS-PART-H5A-BRANDING-R2-REMOTE-VERIFICATION-EVIDENCE-v1.1.0',
  work: 'PART-H.5', successorWork: 'PART-H.5A',
  status: all12RemoteVerified ? 'REQUIRED_BRANDING_REMOTE_VERIFIED' : 'REQUIRED_BRANDING_LIVE_EVIDENCE_INCOMPLETE',
  productionAssetBaseUrl: baseUrl, recordedAt: now(), observedAt: now(), method: 'HTTP_GET_SVG_AUDIT',
  requiredProductionBranding: REQUIRED, requiredStates, results, all12RemoteVerified,
  freshRevalidation: true,
  globalProductionAccepted: false
});
if (!all12RemoteVerified) {
  console.error(`PART H.5A branding live verification incomplete: ${JSON.stringify(requiredStates)}`);
  process.exitCode = 1;
} else {
  console.log('✓ PART H.5A fresh live branding revalidation passed: LOGO-001..012.');
}
