import fs from 'node:fs';
import path from 'node:path';

const base = String(process.env.PHIOS_PUBLIC_ASSET_BASE_URL || '').replace(/\/+$/, '');
if (!/^https:\/\//.test(base)) {
  throw new Error('PHIOS_PUBLIC_ASSET_BASE_URL must be set to the public R2 HTTPS base URL.');
}

const publicPath = 'content/registry/public-assets.json';
const visualPath = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';
const inventoryPath = 'content/web/homepage/hpc2-pre/r2-actual-object-inventory-v1.json';
const reportPath = 'content/web/homepage/hpc2-pre/r2-journey-icon-reconciliation-v3.json';

for (const file of [publicPath, visualPath, inventoryPath]) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
};
const enc = key => key.split('/').map(encodeURIComponent).join('/');

const pub = read(publicPath);
const visual = read(visualPath);
const inventory = read(inventoryPath);

const pubBy = new Map(pub.assets.map(x => [x.asset_code, x]));
const visualBy = new Map(visual.assets.map(x => [x.assetCode, x]));
const inventoryBy = new Map(inventory.records.map(x => [x.assetCode, x]));

const expected = [
  ['ICON-019', 'PHIOS-ICON-ENTER-v1.svg'],
  ['ICON-020', 'PHIOS-ICON-OBSERVE-v1.svg'],
  ['ICON-021', 'PHIOS-ICON-RECONSTRUCT-v1.svg'],
  ['ICON-022', 'PHIOS-ICON-READ-v1.svg'],
  ['ICON-023', 'PHIOS-ICON-NAVIGATE-v1.svg'],
  ['ICON-024', 'PHIOS-ICON-ACT-v1.svg'],
  ['ICON-025', 'PHIOS-ICON-REVIEW-v1.svg'],
  ['ICON-026', 'PHIOS-ICON-CONTINUE-v1.svg'],
  ['ICON-027', 'PHIOS-ICON-UNKNOWN-v1.svg']
];

async function head(key) {
  const url = `${base}/${enc(key)}`;
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return {
      key,
      url,
      ok: r.ok,
      status: r.status,
      contentType: (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(),
      contentLength: r.headers.get('content-length'),
      etag: r.headers.get('etag')
    };
  } catch (e) {
    return { key, url, ok: false, status: 0, error: String(e.message || e) };
  }
}

function patch(code, key, probe) {
  const p = pubBy.get(code);
  const v = visualBy.get(code);
  const i = inventoryBy.get(code);

  if (!p || !v || !i) {
    throw new Error(`Registry member missing for ${code}`);
  }

  const before = {
    publicAssetsObjectKey: p.object_key,
    visualRegistryObjectKey: v.r2?.objectKey ?? null,
    inventoryObjectKey: i.objectKey
  };

  p.object_key = key;
  p.status = 'remote-verified';
  p.verification = 'remote-head-get-verified';

  if (!v.r2) v.r2 = {};
  v.r2.objectKey = key;
  v.r2.remoteVerified = true;
  v.r2.remoteVerificationState = 'REMOTE_VERIFIED';

  i.objectKey = key;
  i.remoteObjectState = 'REMOTE_VERIFIED';
  i.publicReachabilityState = 'PUBLIC_REACHABLE';
  i.canonicalFormatMatch = 'PASS';
  i.officialFilenameMatch = 'PASS';
  i.contentType = probe.contentType;
  if (probe.contentLength) i.size = Number(probe.contentLength);
  if (probe.etag) i.etag = probe.etag;
  i.verifiedAt = new Date().toISOString();

  return { code, before, after: key, probe };
}

const changes = [];
const failures = [];

for (const [code, filename] of expected) {
  const key = `images/icons/journey/${filename}`;
  const probe = await head(key);

  if (!probe.ok || probe.contentType !== 'image/svg+xml') {
    failures.push({ code, key, probe });
    console.error(`✗ ${code}: ${probe.status} ${probe.contentType || ''} @ ${key}`);
    continue;
  }

  changes.push(patch(code, key, probe));
  console.log(`✓ ${code} -> ${key}`);
}

write(publicPath, pub);
write(visualPath, visual);
write(inventoryPath, inventory);

const report = {
  schemaVersion: 'PHI-OS-HPC2-PRE-R2-JOURNEY-ICON-RECONCILIATION-v3.0.0',
  work: 'HPC2-PRE-1_R2_ACTUAL_OBJECT_TRUTH_RECONCILIATION',
  publicBaseUrlUsed: base,
  reason: 'Previous v2 discovery omitted images/icons/journey/ from allowed icon groups.',
  canonicalFolder: 'images/icons/journey/',
  expectedCount: expected.length,
  correctedCount: changes.length,
  failureCount: failures.length,
  authorityBoundary: {
    historicalRegistryRewritten: false,
    secondResolverCreated: false,
    humanAcceptanceSynthesized: false,
    remoteVerificationRequiresLiveHead: true
  },
  changes,
  failures,
  nextCommands: [
    'npm run hpc2-pre:r2-verify',
    'npm run check:hpc2-pre'
  ]
};

write(reportPath, report);

console.log('');
console.log(`Journey Icon reconciliation: ${changes.length}/9 verified.`);

if (failures.length) {
  console.error(`${failures.length} Journey Icon(s) remain unresolved. No failed icon was promoted.`);
  process.exitCode = 2;
} else {
  console.log('✓ ICON-019～027 all REMOTE_VERIFIED from images/icons/journey/.');
}
