import fs from 'node:fs';
import path from 'node:path';

const base = String(process.env.PHIOS_PUBLIC_ASSET_BASE_URL || '').replace(/\/+$/, '');
if (!/^https:\/\//.test(base)) {
  throw new Error('PHIOS_PUBLIC_ASSET_BASE_URL must be set to the public R2 HTTPS base URL.');
}

const publicPath = 'content/registry/public-assets.json';
const visualPath = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';
const inventoryPath = 'content/web/homepage/hpc2-pre/r2-actual-object-inventory-v1.json';
const reportPath = 'content/web/homepage/hpc2-pre/r2-layout-reconciliation-v2.json';

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

async function head(key) {
  const url = `${base}/${enc(key)}`;
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return {
      key,
      url,
      ok: r.ok,
      status: r.status,
      contentType: (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    };
  } catch (e) {
    return { key, url, ok: false, status: 0, error: String(e.message || e) };
  }
}

function patchObjectKey(code, key) {
  const p = pubBy.get(code);
  const v = visualBy.get(code);
  const i = inventoryBy.get(code);
  if (!p || !v || !i) throw new Error(`Registry member missing for ${code}`);

  const before = {
    publicAssets: p.object_key,
    visualRegistry: v.r2?.objectKey,
    inventory: i.objectKey
  };

  p.object_key = key;
  if (!v.r2) v.r2 = {};
  v.r2.objectKey = key;
  i.objectKey = key;

  // This is path reconciliation only. Do not synthesize verification.
  // A subsequent hpc2-pre:r2-verify run is authoritative.
  if (!p.remote || p.status !== 'remote-verified') {
    p.status = 'uploaded-reported-by-owner';
    p.verification = 'owner-reported-upload-awaiting-remote-verification';
  }
  if (!v.r2.remoteVerified) {
    v.r2.remoteVerificationState = 'PENDING_REMOTE_HEAD_GET';
  }
  if (i.remoteObjectState !== 'REMOTE_VERIFIED') {
    i.remoteObjectState = 'OWNER_REPORTED_PRESENT_REMOTE_HEAD_NOT_EXECUTED';
    i.publicReachabilityState = 'PENDING_PUBLIC_BASE_URL_AND_REMOTE_CHECK';
    i.canonicalFormatMatch = 'EXPECTED_NOT_REMOTE_VERIFIED';
    i.officialFilenameMatch = 'EXPECTED_FROM_RECONCILED_R2_TRUTH';
    i.verifiedAt = null;
  }

  return { code, before, after: key };
}

const changes = [];
const errors = [];

// User-confirmed R2 truth:
// FIG-007..011 are intentionally stored in images/figures/global/.
for (const code of ['FIG-007','FIG-008','FIG-009','FIG-010','FIG-011']) {
  const a = pubBy.get(code);
  if (!a) throw new Error(`Missing ${code}`);
  const key = `images/figures/global/${a.official_filename}`;
  const probe = await head(key);
  if (!probe.ok || probe.contentType !== 'image/svg+xml') {
    errors.push({ code, expectedKey: key, probe });
    console.error(`✗ ${code}: actual global object not verified (${probe.status} ${probe.contentType || ''})`);
    continue;
  }
  changes.push({ ...patchObjectKey(code, key), probe });
  console.log(`✓ ${code} -> ${key}`);
}

// User-confirmed Icon directory taxonomy from R2 screenshots.
// Discover the exact group from R2 instead of inventing semantic folder rules.
const iconGroups = [
  'global',
  'account',
  'academy',
  'financial',
  'knowledge',
  'personal',
  'professional'
];

const iconAssets = pub.assets
  .filter(a => /^ICON-\d{3}$/.test(a.asset_code))
  .sort((a,b) => a.asset_code.localeCompare(b.asset_code));

for (const a of iconAssets) {
  const probes = [];
  for (const group of iconGroups) {
    const key = `images/icons/${group}/${a.official_filename}`;
    const r = await head(key);
    if (r.ok && r.contentType === 'image/svg+xml') probes.push(r);
  }

  if (probes.length === 1) {
    const probe = probes[0];
    changes.push({ ...patchObjectKey(a.asset_code, probe.key), probe });
    console.log(`✓ ${a.asset_code} -> ${probe.key}`);
  } else if (probes.length === 0) {
    errors.push({
      code: a.asset_code,
      reason: 'NO_MATCH_IN_CONFIRMED_ICON_GROUPS',
      filename: a.official_filename,
      searchedGroups: iconGroups
    });
    console.error(`✗ ${a.asset_code}: not found in confirmed icon groups`);
  } else {
    errors.push({
      code: a.asset_code,
      reason: 'DUPLICATE_CANONICAL_OBJECT_CANDIDATES',
      matches: probes.map(x => x.key)
    });
    console.error(`✗ ${a.asset_code}: duplicate matches (${probes.map(x=>x.key).join(', ')})`);
  }
}

write(publicPath, pub);
write(visualPath, visual);
write(inventoryPath, inventory);

const report = {
  schemaVersion: 'PHI-OS-HPC2-PRE-R2-LAYOUT-RECONCILIATION-v2.0.0',
  work: 'HPC2-PRE-1_R2_ACTUAL_OBJECT_TRUTH_RECONCILIATION',
  publicBaseUrlUsed: base,
  authorityBoundary: {
    actualR2ObjectTruthMayCorrectSuccessorObjectKeys: true,
    historicalRegistryRewritten: false,
    remoteVerificationSynthesized: false,
    humanAcceptanceSynthesized: false,
    secondResolverCreated: false
  },
  confirmedFigureReconciliation: {
    codes: ['FIG-007','FIG-008','FIG-009','FIG-010','FIG-011'],
    canonicalR2FolderAfterReconciliation: 'images/figures/global/'
  },
  confirmedIconFolderTaxonomy: iconGroups.map(x => `images/icons/${x}/`),
  changedCount: changes.length,
  errorCount: errors.length,
  changes,
  errors,
  nextCommand: 'npm run hpc2-pre:r2-verify'
};
write(reportPath, report);

console.log('');
console.log(`R2 layout reconciliation: ${changes.length} corrected, ${errors.length} unresolved.`);
console.log(`Report: ${reportPath}`);

if (errors.length) {
  console.error('Some non-critical R2 layout items remain unresolved. No unresolved asset was promoted.');
  process.exitCode = 2;
} else {
  console.log('✓ All confirmed Figure/Icon R2 object keys reconciled to actual bucket truth.');
}
