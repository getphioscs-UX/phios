import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { deriveWprObservation } from './lib/web-production/wpr-observability-v1.mjs';

const read = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const sha256 = path => crypto.createHash('sha256')
  .update(read(path).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const record = json('content/knowledge/migrations/book-w1f/wpr-book-w1-successor-compatibility-v1.json');
const materializationReconciliation = json('content/knowledge/migrations/book-w1e/book-w1e-public-assets-materialization-reconciliation-v1.json');
const w30ReconciliationV1 = json('docs/wpr/reconciliation/wpr-w30-post-freeze-checker-reconciliation-v1.json');
const w30ReconciliationV2 = json('docs/wpr/reconciliation/wpr-w30-post-freeze-checker-reconciliation-v2.json');
const w30ReconciliationV3 = json('docs/wpr/reconciliation/wpr-w30-post-freeze-checker-reconciliation-v3.json');
const packageJson = json('package.json');
const currentSuccessorV2 = json('content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v2.json');
const currentSuccessorV3 = json('content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v3.json');
const currentSuccessorV4 = json('content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v4.json');
const currentSuccessor = json('content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v5.json');
const partH5ABrandingSuccessor = json('content/web-production/client-visual-consumption/successors/part-h5a-current-branding-successor-v1.json');
const publicAssetVerificationSuccessor = json('content/knowledge/migrations/book-w1e/book-w1e-poc-a-public-asset-verification-successor-v1.json');
assert.equal(record.status, 'accepted-successor-web-production-runtime-active');
assert.equal(record.predecessor.freeze.status, 'HISTORICAL_ALLOWED');
assert.equal(record.predecessor.freeze.rewritten, false);
assert.equal(sha256(record.predecessor.freeze.path), record.predecessor.freeze.sha256);
assert.equal(sha256(record.predecessor.baselineAudit.path), record.predecessor.baselineAudit.sha256);
assert.equal(currentSuccessor.status, 'BOOK_W1F_CURRENT_WPR_CHECKER_SUCCESSOR_V5_ACTIVE_PART_H5A_BRANDING_REMOTE_VERIFICATION_PRESERVED');
assert.equal(currentSuccessor.predecessorCurrentSuccessor.path, 'content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v4.json');
assert.equal(currentSuccessor.predecessorCurrentSuccessor.sha256, sha256('content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v4.json'));
assert.equal(currentSuccessorV4.status, 'BOOK_W1F_CURRENT_WPR_CHECKER_SUCCESSOR_V4_ACTIVE_POC_A_PUBLIC_ASSET_VERIFICATION_V3_PRESERVED');
assert.equal(currentSuccessorV3.status, 'BOOK_W1F_CURRENT_WPR_CHECKER_SUCCESSOR_V3_ACTIVE_HISTORICAL_V2_PRESERVED');
assert.equal(currentSuccessor.predecessorCurrentSuccessor.rewritten, false);
assert.equal(publicAssetVerificationSuccessor.status, 'BOOK_W1E_HISTORICAL_ACCEPTANCE_PRESERVED_POC_A_REMOTE_VERIFICATION_MATERIALIZATION_RECONCILED');
assert.equal(publicAssetVerificationSuccessor.publicAssetRegistry.currentSha256, partH5ABrandingSuccessor.publicAssetRegistry.predecessorSha256);
assert.equal(partH5ABrandingSuccessor.publicAssetRegistry.currentSha256, sha256('content/registry/public-assets.json'));
assert.equal(partH5ABrandingSuccessor.remoteVerificationAdvancement.targetCount, 12);
assert.equal(publicAssetVerificationSuccessor.remoteVerificationAdvancement.targetCount, 10);
assert.equal(currentSuccessor.publicAssets.governancePath, 'content/web-production/client-visual-consumption/successors/part-h5a-current-branding-successor-v1.json');
assert.equal(currentSuccessor.publicAssets.governanceSha256, sha256(currentSuccessor.publicAssets.governancePath));
assert.equal(currentSuccessor.publicAssets.historicalGovernanceRewritten, false);
assert.equal(currentSuccessor.authority.pocARemoteVerificationMaterializationOnly, true);
assert.equal(currentSuccessor.authority.partH5aBrandingRemoteVerificationOnly, true);
assert.equal(currentSuccessor.historicalW1F.sha256, sha256('content/knowledge/migrations/book-w1f/wpr-book-w1-successor-compatibility-v1.json'));
assert.equal(currentSuccessor.historicalW1F.historicalW0CheckerRecordedSha256, record.predecessor.historicalChecker.w0Sha256);
assert.equal(currentSuccessor.currentCheckerSuccessor.w0CurrentSha256, sha256(record.predecessor.historicalChecker.w0Path));
assert.equal(currentSuccessor.currentCheckerSuccessor.historicalRecordedDigestRewritten, false);
assert.equal(
  w30ReconciliationV1.entries.find(entry => entry.workCode === 'WPR-W30')?.successorDigest,
  record.predecessor.historicalChecker.w30Sha256
);
assert.equal(w30ReconciliationV2.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');
assert.equal(w30ReconciliationV2.authorityExpansionGranted, false);
assert.equal(
  w30ReconciliationV2.entries.find(entry => entry.workCode === 'WPR-W30')?.successorDigest,
  currentSuccessorV2.currentCheckerSuccessor?.w30CurrentSha256 ?? w30ReconciliationV2.entries.find(entry => entry.workCode === 'WPR-W30')?.successorDigest
);
assert.equal(w30ReconciliationV3.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');
assert.equal(w30ReconciliationV3.predecessorReconciliation, 'docs/wpr/reconciliation/wpr-w30-post-freeze-checker-reconciliation-v2.json');
assert.equal(w30ReconciliationV3.authorityExpansionGranted, false);
assert.equal(
  sha256(record.predecessor.historicalChecker.w30Path),
  w30ReconciliationV3.entries.find(entry => entry.workCode === 'WPR-W30')?.successorDigest
);
assert.equal(currentSuccessor.currentCheckerSuccessor.w30CurrentSha256, sha256(record.predecessor.historicalChecker.w30Path));
assert.equal(currentSuccessor.currentCheckerSuccessor.w30ReconciliationSha256, sha256(currentSuccessor.currentCheckerSuccessor.w30ReconciliationPath));
assert.equal(packageJson.scripts['check:wpr-final'], 'npm run check:wpr');
assert.equal(packageJson.scripts['check:web-production-runtime'], 'npm run check:book-w1-web-production-runtime');
assert.equal(packageJson.scripts['check:book-w1-web-production-runtime'], 'node scripts/check-book-w1f-wpr-successor-current.mjs');
assert.equal(
  String(packageJson.scripts.postcheck).split('&&').map(value => value.trim())
    .filter(value => value === 'npm run check:web-production-runtime').length,
  1
);

assert.equal(
  sha256(record.successor.publicProjectionAuthority.path),
  record.successor.publicProjectionAuthority.sha256
);
const currentSourceByPath = new Map(currentSuccessor.currentSources.map(source => [source.path, source]));
assert.equal(currentSourceByPath.size, record.successor.currentSources.length);
for (const source of record.successor.currentSources) {
  const current = currentSourceByPath.get(source.path);
  assert(current, `Missing BOOK-W1F current successor source: ${source.path}`);
  assert.equal(current.w1fRecordedSha256, source.sha256);
  assert.equal(current.currentSha256, sha256(source.path), `BOOK-W1F current source drift: ${source.path}`);
  const restoredMaterialization = [materializationReconciliation.publicAssets, materializationReconciliation.bookComposition, materializationReconciliation.routeRegistry, materializationReconciliation.publicDiscoveryRegistry].find(entry => entry.path === source.path);
  assert(restoredMaterialization, `Missing materialization reconciliation: ${source.path}`);
  assert.equal(source.sha256, restoredMaterialization.recordedButUnmaterializedSha256);
}


const assets = json('content/registry/public-assets.json');
assert.equal(currentSuccessor.publicAssets.currentSha256, sha256('content/registry/public-assets.json'));
assert.equal(currentSuccessor.publicAssets.governanceSha256, sha256(currentSuccessor.publicAssets.governancePath));
assert.equal(assets.assets.length, currentSuccessor.publicAssets.currentRecordCount);
assert.equal(assets.assets.length, 149);
assert(assets.assets.some(asset => asset.asset_code === 'BOOK-5-HARDCOVER'));
assert.deepEqual(assets.book_visual_vocabulary['BOOK-3'].primary, [
  'maintenance', 'reconfiguration', 'recovery', 'coordination', 'emergence', 'continuity'
]);
assert(!assets.book_visual_vocabulary['BOOK-5'].primary.includes('ai'));
assert(assets.book_visual_vocabulary['BOOK-5'].retainedNonPrimary.includes('ai'));

const routes = json('content/web-production/registries/wpr-route-registry-v1.json');
assert.equal(routes.entries.length, 28);
const canonicalBookRoutes = routes.entries.filter(entry => /^BOOK_REALITY_/.test(entry.routeCode));
assert.equal(canonicalBookRoutes.length, 5);
const maintenanceRoute = routes.legacyCompatibility.find(entry => entry.legacyPath === '/books/reality-maintenance/');
assert.equal(maintenanceRoute.targetRouteCode, 'BOOK_REALITY_CONTINUITY');
assert.equal(maintenanceRoute.redirectStatus, 308);
assert.equal(maintenanceRoute.canonicalAuthority, false);

const discovery = json('content/web-production/registries/wpr-public-discovery-registry-v1.json');
assert.equal(discovery.entries.length, 18);
const maintenanceDiscovery = discovery.entries.find(entry => entry.path === '/books/reality-maintenance/');
assert.deepEqual(
  {
    indexable: maintenanceDiscovery.indexable,
    sitemap: maintenanceDiscovery.sitemap,
    redirectTarget: maintenanceDiscovery.redirectTarget,
    canonicalAuthority: maintenanceDiscovery.canonicalAuthority
  },
  {
    indexable: false,
    sitemap: false,
    redirectTarget: '/books/reality-continuity/',
    canonicalAuthority: false
  }
);
for (const path of [
  '/books/reality-formation',
  '/books/reality-runtime',
  '/books/reality-continuity',
  '/books/reality-civilization',
  '/books/reality-navigation'
]) {
  const entry = discovery.entries.find(candidate => candidate.path === path);
  assert.equal(entry.indexable, true, path);
  assert.equal(entry.sitemap, true, path);
}

const observation = deriveWprObservation();
assert.equal(observation.productionRecordCount, 38);
assert.equal(observation.routeEntryCount, 28);
assert.deepEqual(observation.productionStates, ['LIMITED_PRODUCTION']);
assert.equal(observation.cprProductionRecordCount, 0);
assert.equal(observation.carPublicationCount, 0);

const compatibleHistoricalChecks = [
  'scripts/check-wpr-w1-authority-boundary.mjs',
  'scripts/check-wpr-w2-canonical-web-production.mjs',
  'scripts/check-wpr-w3-surface-registry.mjs',
  'scripts/check-wpr-w4-route-registry.mjs',
  'scripts/check-wpr-w5-production-source-registry.mjs',
  'scripts/check-wpr-w6-runtime-consumption-registry.mjs',
  'scripts/check-wpr-w7-public-asset-resolution.mjs',
  'scripts/check-wpr-w9-responsive-asset-runtime.mjs',
  'scripts/check-wpr-w10-visual-production-projection.mjs',
  'scripts/check-wpr-w11-canonical-composition-resolver.mjs',
  'scripts/check-wpr-w12-locale-projection.mjs',
  'scripts/check-wpr-w13-public-vocabulary.mjs',
  'scripts/check-wpr-w14-homepage-production.mjs',
  'scripts/check-wpr-w15-library-production.mjs',
  'scripts/check-wpr-w16-article-production.mjs',
  'scripts/check-wpr-w17-figure-diagram-production.mjs',
  'scripts/check-wpr-w18-books-production.mjs',
  'scripts/check-wpr-w19-academy-production.mjs',
  'scripts/check-wpr-w20-reality-journey-production.mjs',
  'scripts/check-wpr-w21-mcd7-successor.mjs',
  'scripts/check-wpr-w22-professional-financial-production.mjs',
  'scripts/check-wpr-w23-report-workspace-production.mjs',
  'scripts/check-wpr-w24-hydration-runtime.mjs',
  'scripts/check-wpr-w26-privacy-security-production.mjs',
  'scripts/check-wpr-w27-pds-responsive-accessibility.mjs',
  'scripts/check-wpr-w29-full-production-acceptance.mjs'
];
for (const checker of compatibleHistoricalChecks) {
  const result = spawnSync(process.execPath, [checker], { stdio: 'inherit' });
  assert.equal(result.status, 0, `Successor-compatible WPR checker failed: ${checker}`);
}

console.log('✓ BOOK-W1F current WPR successor compatibility passed; historical WPR/BOOK-W1F records preserved.');
console.log('  WPR v1 freeze/history remains immutable; current WPR validates five canonical routes plus one noindex compatibility redirect.');
