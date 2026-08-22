import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists = path => assert.ok(fs.existsSync(path), `Reality Workspace missing ${path}`);

const successorPath = 'content/web-production/successors/reality-workspace-canonical-customer-successor-v1.json';
const visual12Path = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';
const visual13Path = 'content/web-production/registries/client-visual-asset-registry-v1.3.json';
const publicAssetsPath = 'content/registry/public-assets.json';
const currentHtmlPath = 'reality/index.html';
const currentJsPath = 'assets/js/pages/reality-workspace.js';
const currentCssPath = 'assets/css/reality-workspace.css';
for (const path of [successorPath, visual12Path, visual13Path, publicAssetsPath, currentHtmlPath, currentJsPath, currentCssPath, '_redirects']) exists(path);

const successor = json(successorPath);
const visual12 = json(visual12Path);
const visual13 = json(visual13Path);
const publicAssets = json(publicAssetsPath);
const html = read(currentHtmlPath);
const js = read(currentJsPath);
const redirects = read('_redirects');
const freeze = json(successor.phase19Predecessor.freezePath);

assert.equal(successor.baselineCommit, 'f97d6f3e6fc3d5e18fedc2133d207f2e07c605ec');
assert.equal(successor.route.canonical, '/reality/');
assert.equal(successor.route.surface, currentHtmlPath);
assert.equal(successor.route.indexable, true);
assert.deepEqual(successor.clientStages, ['UNDERSTAND','CHOOSE','REVIEW']);
assert.doesNotMatch(redirects, /^\/reality\/?\s+/m, 'Canonical /reality/ may not be redirected away');
assert.match(html, /<meta name="robots" content="index,follow">/);
assert.doesNotMatch(html, /data-rjx19-review-only|Phase 19 technical review|noindex,nofollow/i);
for (const stage of successor.clientStages) assert.match(html, new RegExp(`data-rw-stage="${stage}"`));
for (const asset of ['HERO-006','ILL-010','FIG-012','FIG-020']) assert.match(html, new RegExp(`data-rw-asset="${asset}"`));
assert.match(html, /assets\/js\/public-shell\.js/);
assert.match(html, /assets\/js\/pages\/reality-workspace\.js/);
assert.match(html, /assets\/css\/reality-workspace\.css/);

// Current customer surface consumes existing projections; writes remain with existing governed flows.
for (const token of ['RuntimeKernel','buildJourneyDashboardProjection','buildReadingCustomerProjection','buildNavigationCustomerProjection','resolvePublicAssetForWeb']) assert.match(js, new RegExp(token));
assert.doesNotMatch(js, /\bsetSession\s*\(|\bpostJSON\s*\(|fetch\([^\n]+method\s*:\s*['"]POST/i);
assert.equal(successor.runtimeConsumption.directRuntimeWriteFromWorkspace, false);
assert.equal(successor.runtimeConsumption.createsSecondRuntimeAuthority, false);
assert.equal(successor.runtimeConsumption.createsSecondReadingAuthority, false);
assert.equal(successor.runtimeConsumption.createsSecondNavigationAuthority, false);
assert.equal(successor.runtimeConsumption.createsSecondReviewAuthority, false);

// Historical Phase 19 technical candidate remains byte-for-byte preserved in archive.
const phase19Map = {
  'reality/index.html':'content/runtime/journey-runtime/phase19/frozen-artifacts/reality-index-phase19.html',
  'assets/js/pages/reality-workspace-phase19.js':'content/runtime/journey-runtime/phase19/frozen-artifacts/reality-workspace-phase19.js',
  'assets/css/reality-workspace-phase19.css':'content/runtime/journey-runtime/phase19/frozen-artifacts/reality-workspace-phase19.css'
};
for (const [oldPath, archivedPath] of Object.entries(phase19Map)) {
  exists(archivedPath);
  assert.equal(sha(archivedPath), freeze.protectedDigests[oldPath], `${oldPath} historical predecessor drift`);
}
assert.equal(successor.authorityBoundary.historicalPhase19FreezeRewritten, false);

// V1.2 remains predecessor evidence; V1.3 is the explicit current visual successor.
assert.equal(sha(visual12Path), successor.visualRegistrySuccessor.predecessorSha256);
assert.equal(sha(visual13Path), successor.visualRegistrySuccessor.successorSha256);
assert.equal(visual12.assets.length, 152);
assert.equal(visual13.assets.length, 152);
const oldIll = visual12.assets.find(asset => asset.sequence === 'ILL-010');
const newIll = visual13.assets.find(asset => asset.sequence === 'ILL-010');
assert.equal(oldIll.state, 'PLANNED');
assert.equal(oldIll.r2.remoteVerified, false);
assert.equal(newIll.assetCode, 'PHIOS-ILLUSTRATION-REALITY-WORKSPACE-CONTINUITY-V1');
assert.equal(newIll.r2.objectKey, 'images/illustrations/reality/PHIOS-ILLUSTRATION-REALITY-WORKSPACE-CONTINUITY-v1.webp');
assert.equal(newIll.r2.ownerReportedUploaded, true);
assert.equal(newIll.r2.remoteVerified, false);
assert.equal(newIll.state, 'UPLOADED');
assert.ok(newIll.expectedConsumers.some(item => item.surfaceCode === 'REALITY_WORKSPACE'));
assert.equal(successor.ill010.independentRemoteVerification, false);

// Existing global public-assets registry remains byte-preserved; ILL-010 resolves from the additive visual successor using the existing resolver/config contract.
assert.equal(sha(publicAssetsPath), '4b3a01e259b4df39a45d56d1f9d0d9162fa9d7d8d31a59ab2488670a471a4d13');
assert.match(js, /client-visual-asset-registry-v1\.3\.json/);
assert.match(js, /fetchPublicAssetConfig/);
assert.match(js, /resolvePublicAsset\(/);
assert.match(js, /verified-owner-reported-upload/);
assert.equal(successor.visualConsumption.publicAssetRegistryPredecessorPreserved, true);

for (const [path, digest] of Object.entries(successor.currentSurfaceDigests)) assert.equal(sha(path), digest, `${path} successor digest drift`);
for (const [key, value] of Object.entries(successor.authorityBoundary)) if (typeof value === 'boolean') assert.equal(value, false, `${key} must remain false`);
assert.ok(successor.pending.includes('INDEPENDENT_ILL010_R2_REMOTE_VERIFICATION'));

console.log('✓ Canonical Reality Workspace current successor passed.');
console.log('✓ /reality/ is indexable and presents Understand → Choose → Review from existing governed projections without creating a second write authority.');
console.log('✓ Phase 19 predecessor bytes, Client Visual Registry v1.2 and public-assets predecessor remain preserved.');
console.log('✓ ILL-010 Reality Workspace Continuity is registered in v1.3 from owner-reported R2 upload; independent remote/browser verification remains explicit.');
