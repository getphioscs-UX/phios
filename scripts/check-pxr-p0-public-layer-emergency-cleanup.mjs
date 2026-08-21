import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(text(path));
const exists = path => assert.ok(fs.existsSync(path), `PXR-P0 missing ${path}`);

const contractPath = 'content/web-production/pxr/contracts/pxr-public-experience-contract-v1.json';
const registryPath = 'content/web-production/pxr/registries/pxr-public-surface-registry-v1.json';
const runtimePath = 'assets/js/public-experience/pxr-public-experience.js';
const resolverPath = 'assets/js/runtime/web-production/asset-resolver.js';
const previewPath = 'assets/js/pages/book-one-preview.js';
for (const path of [contractPath, registryPath, runtimePath, resolverPath, previewPath, '_redirects', 'reality/index.html', 'reality-entry.html']) exists(path);

const contract = json(contractPath);
const runtime = text(runtimePath);
const resolver = text(resolverPath);
const preview = text(previewPath);
const redirects = text('_redirects');
const internalReality = text('reality/index.html');
const compatibilityEntry = text('reality-entry.html');

assert.equal(contract.work, 'PXR-P0-P3');
assert.equal(contract.p0.realityReviewOnlyRoutePubliclyRedirected, true);
assert.equal(contract.p0.bookPreviewBrokenNativeImageForbidden, true);
assert.equal(contract.p0.rawBooleanStatusForbidden, true);
assert.match(redirects, /^\/reality\s+\/reality-journey\s+308$/m);
assert.match(redirects, /^\/reality\/\s+\/reality-journey\s+308$/m);
assert.match(internalReality, /noindex,nofollow/);
assert.match(internalReality, /data-rjx19-review-only="true"/);
assert.match(compatibilityEntry, /url=\/reality\//); // historical shell preserved; public /reality now redirects.

assert.match(resolver, /resolvePublicAssetGroupMember/);
assert.match(resolver, /REGISTERED_GROUP_MEMBER_RUNTIME_PROBE_REQUIRED/);
assert.doesNotMatch(resolver, /pub-[a-z0-9]+\.r2\.dev/i);
assert.match(preview, /resolvePublicAssetGroupMember/);
assert.match(preview, /objectKeyPattern/);
assert.match(preview, /data-preview-page-media/);
assert.match(preview, /data-state="loading"/);
assert.match(preview, /image\.addEventListener\('error'/);
assert.doesNotMatch(preview, /\/assets\/images\/books\/book-1\/preview\/page-/);

for (const token of contract.p0.internalTerminologyForbidden) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(runtime, new RegExp(escaped, 'i'), `PXR runtime does not protect public copy from ${token}`);
}
assert.match(runtime, /RAW_STATE_PATTERN/);
assert.match(runtime, /MutationObserver/);
assert.match(runtime, /customerSafeText/);
assert.match(runtime, /data\.pxrHidden|dataset\.pxrHidden/);

console.log('✓ PXR-P0 Public Layer Emergency Cleanup passed.');
console.log('  /reality review-only route is shielded by public redirect; Book Preview uses the registered R2 collection path with runtime image-load probing; public technical/raw state guard is active.');
