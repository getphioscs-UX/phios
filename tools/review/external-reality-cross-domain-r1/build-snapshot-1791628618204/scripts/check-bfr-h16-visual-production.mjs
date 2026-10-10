import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runBfrHCriticalRegressions } from './check-bfr-h-critical-regressions.mjs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const readText = (path) => readFileSync(path, 'utf8');
const mustExist = (path) => assert.ok(existsSync(path), `Missing evidence: ${path}`);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const h15Path = 'content/web-production/acceptance/bfr-capability-consumption-acceptance-v1.json';
const visualAcceptancePath = 'content/web-production/acceptance/wpr-post-freeze-visual-acceptance-v1.json';
const finalPath = 'content/web-production/acceptance/bfr-production-surface-acceptance-v1.json';
const visualRegistryPath = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';
const publicAssetsPath = 'content/registry/public-assets.json';
const currentPublicAssetVerificationSuccessorPath = 'content/knowledge/migrations/book-w1e/book-w1e-poc-a-public-asset-verification-successor-v1.json';
const partH5ABrandingSuccessorPath = 'content/web-production/client-visual-consumption/successors/part-h5a-current-branding-successor-v1.json';

for (const path of [h15Path, visualAcceptancePath, finalPath, visualRegistryPath, publicAssetsPath, currentPublicAssetVerificationSuccessorPath, partH5ABrandingSuccessorPath]) mustExist(path);
const h15 = readJson(h15Path);
const visualAcceptance = readJson(visualAcceptancePath);
const finalAcceptance = readJson(finalPath);
const visualRegistry = readJson(visualRegistryPath);
const publicAssets = readJson(publicAssetsPath);
const currentPublicAssetVerificationSuccessor = readJson(currentPublicAssetVerificationSuccessorPath);
const partH5ABrandingSuccessor = readJson(partH5ABrandingSuccessorPath);

runBfrHCriticalRegressions();

assert.equal(h15.status, 'BFR_H15_CAPABILITY_CONSUMPTION_ACCEPTED_CURRENT_SUCCESSOR');
assert.equal(h15.summary.silentProductionRuntimeOrphanCount, 0);
assert.equal(visualAcceptance.status, 'WPR_POST_FREEZE_VISUAL_ACCEPTED_REPOSITORY_SCOPE_LIVE_DELIVERY_REVALIDATION_REQUIRED');
assert.equal(finalAcceptance.status, 'BFR_H16_VISUAL_PRODUCTION_ACCEPTED_REPOSITORY_SCOPE_WPR_PF_NEXT');
assert.equal(finalAcceptance.globalProductionAccepted, false);

const requiredGates = [
  'backendCapabilityInventoryComplete', 'frontendSurfaceInventoryComplete', 'capabilitySurfaceGapsReconciled',
  'productionSurfaceManifestActive', 'pdsCprWprActualPageLineageValid', 'fiveVolumeVisualIdentityActive',
  'audienceDensityValid', 'homepageCapabilityCoverageHigh', 'libraryVisualCoverageMediumHigh', 'bookVisualCoverageHigh',
  'articleFigureConsumptionContentDependent', 'personalRealityProperlyConsumed', 'financialRealityProperlyConsumed',
  'askPhiosProperlyConsumed', 'academyProperlyConsumed', 'servicesAligned', 'professionalProperlyConsumed',
  'r2GovernedAssetsConsumed', 'responsiveMatrixAccepted', 'accessibilityAccepted', 'noSilentProductionRuntimeOrphan',
  'noGovernedVisualAssetSilentlyOrphaned'
];
assert.deepEqual(Object.keys(finalAcceptance.gates).sort(), requiredGates.sort());
for (const [gate, result] of Object.entries(finalAcceptance.gates)) {
  assert.equal(result.accepted, true, `${gate}: not accepted`);
  assert.ok(Array.isArray(result.evidence) && result.evidence.length > 0, `${gate}: evidence missing`);
  for (const path of result.evidence) mustExist(path);
}

const frontend = readJson('content/web-production/bfr-frontend-surface-inventory-v1.json');
const gap = readJson('content/web-production/bfr-capability-surface-gap-matrix-v1.json');
const manifest = readJson('content/web-production/surface-production-manifest-v1.json');
const lineage = readJson('content/web-production/bfr-pds-cpr-wpr-lineage-v1.json');
const fiveVolume = readJson('content/web-production/bfr-five-volume-visual-projection-v1.json');
const audience = readJson('content/web-production/bfr-audience-information-density-projection-v1.json');
const responsiveMatrix = readJson('content/web-production/bfr-responsive-production-matrix-v1.json');
const responsiveAcceptance = readJson('content/web-production/bfr-responsive-acceptance-v1.json');
const accessibilityAcceptance = readJson('content/web-production/bfr-accessibility-acceptance-v1.json');
const homepage = readJson('content/web/homepage/hpc2/acceptance/homepage-composition-acceptance-v2.json');
const cka = readJson('content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json');
const personal = readJson('content/web-production/acceptance/wpr-w21-personal-runtime-surface-acceptance-v1.json');
const professionalFinancial = readJson('content/web-production/acceptance/wpr-w22-professional-financial-acceptance-v1.json');

assert.equal(frontend.recordCount, 19);
assert.equal(gap.recordCount, 56);
assert.equal(manifest.recordCount, 18);
assert.ok(Array.isArray(lineage.pageLineage) && lineage.pageLineage.length > 0);
for (const page of lineage.pageLineage) {
  const serialized = JSON.stringify(page);
  for (const token of ['PDS', 'CPR', 'WPR']) assert.ok(serialized.includes(token), `Lineage entry missing ${token}`);
}
assert.ok(Array.isArray(lineage.actualPageParallelAuthorityForbidden) && lineage.actualPageParallelAuthorityForbidden.length > 0);
assert.equal(lineage.productionBrowserRevalidationRequired, true);
assert.equal(fiveVolume.volumes.length, 5);
assert.equal(fiveVolume.pdsAuthorityPreserved, true);
assert.equal(audience.sameAuthorityMultipleAudienceProjection, true);
assert.ok(['PUBLIC','CUSTOMER','PROFESSIONAL'].every((code) => Object.keys(audience.audiences).includes(code) || JSON.stringify(audience.audiences).includes(code)));

assert.equal(homepage.status, 'HPC2_COMPOSITION_READY');
assert.equal(homepage.capability.requiredMapped, '13/13');
assert.equal(homepage.capability.silentExpectedHomepageConsumerCount, 0);
assert.equal(homepage.asset.governedR2References, true);
assert.equal(homepage.publicDensity.accepted, true);
assert.equal(cka.status, 'CKA_PRODUCTION_READY');
assert.equal(cka.globalProductionAccepted, false);

const libraryHtml = readText('library.html');
const libraryJs = readText('assets/js/pages/library.js');
assert.ok(libraryHtml.includes('data-bfr-h16-library-visual="MEDIUM_HIGH"'));
assert.ok(libraryHtml.includes('data-bfr-library-hero="HERO-002"'));
for (const token of ['resolveBookCover', 'resolveCanonicalVisual', "'FIG-007'", "'HERO-002'"]) assert.ok(libraryJs.includes(token), `Library visual successor missing ${token}`);

const booksJs = readText('assets/js/pages/books.js');
const bookVolumeJs = readText('assets/js/pages/book-volume.js');
assert.ok(booksJs.includes('resolveBookBranding'));
assert.ok(booksJs.includes('resolveBookCover'));
assert.ok(bookVolumeJs.includes('resolveBookCover'));

const articleRenderer = readText('assets/js/knowledge/article-renderer.js');
assert.ok(articleRenderer.includes("case 'figure'"));
assert.ok(articleRenderer.includes('resolvePublishedVisualAsset'));
assert.ok(articleRenderer.includes('renderFigure'));

assert.equal(personal.acceptance.ephemeralNoPersistenceBoundary, true);
assert.equal(personal.nonActivation.methodExecutionActivated, false);
assert.equal(professionalFinancial.acceptance.financialDiscoveryProjected, true);
assert.equal(professionalFinancial.acceptance.prHumanAuthorityPreserved, true);
assert.equal(professionalFinancial.acceptance.publicPrivateBoundaryPreserved, true);
assert.equal(professionalFinancial.nonActivation.professionalJudgmentCreated, false);

assert.equal(responsiveMatrix.primaryCheckCount, 182);
assert.equal(responsiveMatrix.createsBreakpointAuthority, false);
assert.equal(responsiveAcceptance.productionBrowserRevalidationRequired, true);
assert.equal(accessibilityAcceptance.productionBrowserRevalidationRequired, true);
assert.equal(finalAcceptance.acceptanceSemantics.productionBrowserRevalidationPending, true);
assert.equal(finalAcceptance.acceptanceSemantics.r2LiveEnvironmentRevalidationPending, true);

assert.equal(visualAcceptance.currentVisualRegistry.recordCount, visualRegistry.assets.length);
assert.equal(visualRegistry.assets.length, 152);
assert.ok(visualRegistry.assets.every((asset) => Array.isArray(asset.expectedConsumers) && asset.expectedConsumers.length > 0), 'Every governed visual identity must have an explicit expected consumer');
const planned = visualRegistry.assets.filter((asset) => asset.state === 'PLANNED');
assert.equal(planned.length, visualAcceptance.assetAccounting.explicitPlannedCount);
assert.ok(planned.every((asset) => asset.r2?.remoteVerified === false), 'PLANNED visual identity may not be reported as remote-verified active consumption');
const unknownLifecycle = visualRegistry.assets.filter((asset) => !['UPLOADED','PLANNED','REMOTE_VERIFIED_AWAITING_CONSUMER_ACCEPTANCE'].includes(asset.state));
assert.equal(unknownLifecycle.length, 0, 'Unknown visual lifecycle creates a silent orphan');
assert.equal(visualAcceptance.assetAccounting.silentGovernedVisualOrphanCount, 0);

assert.equal(visualAcceptance.publicAssetRegistry.recordCount, 149);
assert.equal(visualAcceptance.publicAssetRegistry.computedRemoteVerifiedMemberCount, 123);
assert.equal(currentPublicAssetVerificationSuccessor.status, 'BOOK_W1E_HISTORICAL_ACCEPTANCE_PRESERVED_POC_A_REMOTE_VERIFICATION_MATERIALIZATION_RECONCILED');
assert.equal(currentPublicAssetVerificationSuccessor.publicAssetRegistry.path, publicAssetsPath);
assert.equal(currentPublicAssetVerificationSuccessor.publicAssetRegistry.predecessorSha256, visualAcceptance.publicAssetRegistry.sha256);
assert.equal(currentPublicAssetVerificationSuccessor.publicAssetRegistry.currentSha256, partH5ABrandingSuccessor.publicAssetRegistry.predecessorSha256);
assert.equal(partH5ABrandingSuccessor.publicAssetRegistry.currentSha256, sha256(publicAssetsPath));
assert.equal(currentPublicAssetVerificationSuccessor.publicAssetRegistry.recordCount, publicAssets.assets.length);
assert.equal(publicAssets.assets.length, 149);
const computedRemoteVerified = publicAssets.assets.filter((asset) => asset.verification === 'verified-remote-head-get').length;
assert.equal(currentPublicAssetVerificationSuccessor.remoteVerificationAdvancement.targetCount, 10);
assert.equal(partH5ABrandingSuccessor.remoteVerificationAdvancement.targetCount, 12);
assert.equal(computedRemoteVerified, visualAcceptance.publicAssetRegistry.computedRemoteVerifiedMemberCount + currentPublicAssetVerificationSuccessor.remoteVerificationAdvancement.targetCount + partH5ABrandingSuccessor.remoteVerificationAdvancement.targetCount);
assert.equal(currentPublicAssetVerificationSuccessor.authorityBoundary.verificationMaterializationOnly, true);
assert.equal(currentPublicAssetVerificationSuccessor.authorityBoundary.historicalBookW1eAcceptanceRewritten, false);
assert.equal(currentPublicAssetVerificationSuccessor.authorityBoundary.secondPublicProjectionAuthorityCreated, false);
assert.equal(currentPublicAssetVerificationSuccessor.authorityBoundary.globalProductionAccepted, false);
assert.equal(publicAssets.resolution_policy.fail_closed, true);
assert.equal(publicAssets.resolution_policy.environment_variable, 'PHIOS_PUBLIC_ASSET_BASE_URL');
assert.equal(publicAssets.resolution_policy.fallback, 'none');
assert.equal(visualAcceptance.r2DeliveryBoundary.environmentPublicBaseUrlStillRequired, true);
assert.equal(visualAcceptance.r2DeliveryBoundary.liveR2RevalidationRequired, true);

assert.equal(finalAcceptance.exitGate.silentProductionRuntimeOrphanCount, 0);
assert.equal(finalAcceptance.exitGate.silentGovernedVisualAssetOrphanCount, 0);
assert.equal(finalAcceptance.exitGate.accepted, true);
assert.equal(finalAcceptance.next, 'WPR-PF_PRODUCTION_ASSURANCE_THEN_POC-A_LIVE_PRODUCTION_CLOSURE');

console.log('✓ BFR-H16 Visual + Production Acceptance passed: repository consumption closed; 56 backend capabilities settled, Homepage HIGH, Library MEDIUM_HIGH, Book HIGH, Article figures CONTENT_DEPENDENT, 152 governed visual identities explicitly accounted, live browser/R2 assurance deferred to WPR-PF.');
