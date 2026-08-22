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
const routePromotion = json('content/web-production/successors/mir-11-route-promotion-successor-v1.json');
const canonicalReality = routePromotion.routes.find(item => item.capability === 'REALITY_WORKSPACE');

assert.equal(contract.work, 'PXR-P0-P3');
assert.equal(contract.p0.realityReviewOnlyRoutePubliclyRedirected, true);
assert.equal(contract.p0.bookPreviewBrokenNativeImageForbidden, true);
assert.equal(contract.p0.rawBooleanStatusForbidden, true);
assert.equal(canonicalReality?.canonicalRoute, '/reality/');
assert.equal(canonicalReality?.state, 'CURRENT_CANONICAL_WORKSPACE_CONFIRMED');
assert.doesNotMatch(redirects, /^\/reality\/?\s+/m);
assert.doesNotMatch(internalReality, /noindex,nofollow/);
assert.doesNotMatch(internalReality, /data-rjx19-review-only="true"/);
assert.match(internalReality, /assets\/js\/pages\/reality-workspace\.js/);
assert.match(internalReality, /data-rw-stage="UNDERSTAND"/);
assert.match(internalReality, /data-rw-stage="CHOOSE"/);
assert.match(internalReality, /data-rw-stage="REVIEW"/);
assert.match(compatibilityEntry, /url=\/reality\//); // historical shell now hands off to the promoted canonical workspace.

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
console.log('  Historical PXR redirect shielding is preserved as predecessor evidence; MIR-11 promotes /reality/ to the canonical customer workspace while Book Preview and technical/raw state guards remain active.');
