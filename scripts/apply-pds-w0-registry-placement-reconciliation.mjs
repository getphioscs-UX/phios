import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const oldRegistry = 'content/registry/pds-w0-post-freeze-protected-path-additions-v1.json';
const newRegistry = 'docs/design-system/pds-w0-post-freeze-protected-path-additions-v1.json';
const checker = 'scripts/check-pds-w0-baseline-boundary.mjs';

const oldPath = path.join(root, oldRegistry);
const newPath = path.join(root, newRegistry);
const checkerPath = path.join(root, checker);

assert.ok(fs.existsSync(checkerPath), 'PDS_W0_CHECKER_MISSING');

let sourceRegistryPath = null;
if (fs.existsSync(oldPath)) sourceRegistryPath = oldPath;
else if (fs.existsSync(newPath)) sourceRegistryPath = newPath;
else throw new Error('PDS_W0_POST_FREEZE_AUTHORIZATION_REGISTRY_MISSING');

const registry = JSON.parse(fs.readFileSync(sourceRegistryPath, 'utf8'));
assert.equal(registry.status, 'canonical');
assert.equal(registry.authorizationMode, 'ADD_ONLY_EXACT_GIT_BLOB');
assert.equal(
  registry.pdsBaseline?.commit,
  '3311262b377fb1e936fe39cfdd0528e6f3ce3e2e'
);

const required = new Map([
  ['assets/js/runtime/web-production/asset-resolver.js',
   'bb61dc08b10f562530c335a48aa46accffbd7bcb'],
  ['assets/js/runtime/web-production/composition-resolver.js',
   '8ec22b86c38fed83aa30fb09a7f427c89bf6de26'],
  ['assets/js/runtime/web-production/locale-resolver.js',
   'e21aa7ae47883b730557cbc21d831dbf4ba829c4'],
  ['assets/js/runtime/web-production/vocabulary-resolver.js',
   '63eae597812259925d1a8151819671cdad683549']
]);

for (const [file, blob] of required) {
  const entry = registry.entries?.find(item => item.path === file);
  assert.ok(entry, `PDS_W0_AUTHORIZATION_ENTRY_MISSING:${file}`);
  assert.equal(entry.gitBlobSha, blob, `PDS_W0_AUTHORIZATION_BLOB_MISMATCH:${file}`);
}

registry.registryLocation = newRegistry;
registry.registryPlacement = {
  owner: 'PDS',
  classification: 'POST_FREEZE_RECONCILIATION_METADATA',
  canonicalContentRegistryMember: false,
  reason:
    'PWS-I2-W0 freezes content/registry JSON inventory at 113; PDS post-freeze protected-path authorization is PDS governance metadata, not a canonical platform registry.'
};

fs.mkdirSync(path.dirname(newPath), { recursive: true });
fs.writeFileSync(newPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');

let checkerSource = fs.readFileSync(checkerPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const oldRef = "'content/registry/pds-w0-post-freeze-protected-path-additions-v1.json'";
const newRef = "'docs/design-system/pds-w0-post-freeze-protected-path-additions-v1.json'";

if (checkerSource.includes(oldRef)) {
  checkerSource = checkerSource.replaceAll(oldRef, newRef);
} else {
  assert.ok(
    checkerSource.includes(newRef),
    'PDS_W0_POST_FREEZE_REGISTRY_REFERENCE_NOT_FOUND'
  );
}
fs.writeFileSync(checkerPath, checkerSource, 'utf8');

if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

console.log('✓ PDS-W0 post-freeze authorization registry placement reconciled.');
console.log('✓ Authorization metadata moved from content/registry to docs/design-system.');
console.log('✓ PWS-I2 canonical content/registry inventory can return from 114 to frozen 113.');
console.log('✓ WPR-B/WPR-C exact-blob protected-path authorizations remain preserved.');
