import fs from 'node:fs';
import { normalizeBase, encodedKey, now, svgAudit, writeJson } from '../hpc2-pre/lib.mjs';

const PUBLIC = 'content/registry/public-assets.json';
const LOGO = 'content/web-production/registries/phios-logo-registry-v1.json';
const EVIDENCE = 'content/web-production/client-visual-consumption/evidence/branding-r2-live-verification-v1.json';
const REQUIRED = Object.freeze(['LOGO-003', 'LOGO-010', 'LOGO-011']);

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const publicRegistry = readJson(PUBLIC);
const logoRegistry = readJson(LOGO);
const baseUrl = normalizeBase(process.env.PHIOS_PUBLIC_ASSET_BASE_URL);
const logoCodes = logoRegistry.records.map(record => record.assetCode);
const publicByCode = new Map(publicRegistry.assets.map(asset => [asset.asset_code, asset]));

const results = [];
for (const code of logoCodes) {
  const logo = logoRegistry.records.find(record => record.assetCode === code);
  const asset = publicByCode.get(code);
  if (!asset || !logo || asset.object_key !== logo.objectKey) {
    results.push({ assetCode: code, state: 'AUTHORITY_MISMATCH', liveVerified: false });
    continue;
  }
  const url = `${baseUrl}/${encodedKey(asset.object_key)}`;
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow', headers: { Accept: 'image/svg+xml,image/*;q=0.8,*/*;q=0.1' } });
    const contentType = response.headers.get('content-type') || '';
    const bytes = Buffer.from(await response.arrayBuffer());
    const svg = /image\/svg\+xml/i.test(contentType) ? svgAudit(bytes.toString('utf8')) : null;
    const valid = response.ok && /image\/svg\+xml/i.test(contentType) && svg?.validSvg === true && svg.scriptPresent === false && svg.externalActiveContentPresent === false;
    results.push({
      assetCode: code,
      objectKey: asset.object_key,
      requestedUrl: url,
      httpStatus: response.status,
      contentType,
      contentLength: response.headers.get('content-length') || String(bytes.length),
      etag: response.headers.get('etag'),
      svg,
      state: valid ? 'LIVE_REMOTE_VERIFIED_CANDIDATE' : 'LIVE_REMOTE_NOT_ACCEPTED',
      liveVerified: valid,
      verifiedAt: now()
    });
  } catch (error) {
    results.push({
      assetCode: code,
      objectKey: asset.object_key,
      requestedUrl: url,
      state: 'LIVE_REMOTE_REQUEST_FAILED',
      liveVerified: false,
      error: error?.message || String(error),
      verifiedAt: now()
    });
  }
}

const requiredStates = Object.fromEntries(REQUIRED.map(code => {
  const result = results.find(record => record.assetCode === code);
  return [code, result?.liveVerified === true ? 'LIVE_REMOTE_VERIFIED_CANDIDATE' : 'REQUIRED_LIVE_EVIDENCE_MISSING'];
}));
const allRequiredReachable = Object.values(requiredStates).every(state => state === 'LIVE_REMOTE_VERIFIED_CANDIDATE');
writeJson(EVIDENCE, {
  schemaVersion: 'PHI-OS-PART-H5-BRANDING-R2-LIVE-VERIFICATION-EVIDENCE-v1.0.0',
  work: 'PART-H.5',
  status: allRequiredReachable ? 'REQUIRED_BRANDING_LIVE_VERIFIED_CANDIDATE_POC_A_MATERIALIZATION_REQUIRED' : 'REQUIRED_BRANDING_LIVE_EVIDENCE_INCOMPLETE',
  productionAssetBaseUrl: baseUrl,
  recordedAt: now(),
  requiredProductionBranding: REQUIRED,
  requiredStates,
  results,
  registryMaterialization: {
    performed: false,
    owner: 'POC-A_CURRENT_PUBLIC_ASSET_VERIFICATION_SUCCESSOR',
    reason: 'PART H.5 records live delivery evidence but does not rewrite the current public-asset or logo authority; materialization must be reconciled by the current POC-A successor so Book/HPC2/BFR current digests do not silently drift.'
  },
  rules: {
    liveVerificationDoesNotMutateRegistry: true,
    successfulIdentityIsCandidateEvidenceOnly: true,
    partialSuccessDoesNotCreateGlobalAcceptance: true,
    publicBaseUrlMaterializedIntoRegistry: false
  }
});

if (!allRequiredReachable) {
  console.error(`PART H.5 branding live verification incomplete: ${JSON.stringify(requiredStates)}`);
  process.exitCode = 1;
} else {
  console.log('✓ PART H.5 required branding is live-reachable: LOGO-003 + LOGO-010 + LOGO-011.');
  console.log('  Evidence only: registry promotion remains POC-A current-successor responsibility; no authority digest was silently rewritten.');
}
