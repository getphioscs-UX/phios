import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const sha256Bytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const exists = path => fs.existsSync(path);

const predecessorReconciliationPath = 'content/web-production/reconciliation/bfr-h-part-a-7e2b212-current-source-successor-v1.json';
const logoSuccessorPath = 'content/web-production/reconciliation/bfr-h-part-a-1e0ecd38-logo-registry-successor-v2.json';
const brandingSuccessorPath = 'content/web-production/reconciliation/bfr-h-hpc2-w5-316a1bc-branding-registry-successor-v1.json';
const pocAVerificationSuccessorPath = 'content/knowledge/migrations/book-w1e/book-w1e-poc-a-public-asset-verification-successor-v1.json';
const bfrCurrentVerificationSuccessorPath = 'content/web-production/reconciliation/bfr-h-current-poc-a-public-asset-verification-successor-v1.json';
const acceptancePath = 'content/web-production/acceptance/bfr-h-part-a-acceptance-v1.json';
const freezePath = 'content/web-production/freeze/bfr-h-part-a-freeze-v1.json';
const h0Path = 'content/web-production/bfr-backend-capability-inventory-v1.json';
const h1Path = 'content/web-production/bfr-frontend-surface-inventory-v1.json';
const h2Path = 'content/web-production/bfr-capability-surface-gap-matrix-v1.json';
const h3Path = 'content/web-production/surface-production-manifest-v1.json';
const h11Path = 'content/web-production/bfr-r2-visual-consumption-v1.json';
const publicAssetsPath = 'content/registry/public-assets.json';
const hpc2PreR2SuccessorPath = 'content/web-production/reconciliation/wpr-w7-w10-hpc2-pre-successor-v1.json';
const prePath = 'content/web/homepage/hpc2-pre/hpc2-pre-final-readiness-v1.json';
const logoRegistryPath = 'content/web-production/registries/phios-logo-registry-v1.json';
const visualRegistryPath = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';

for (const path of [predecessorReconciliationPath, logoSuccessorPath, brandingSuccessorPath, pocAVerificationSuccessorPath, bfrCurrentVerificationSuccessorPath, acceptancePath, freezePath, h0Path, h1Path, h2Path, h3Path, h11Path, publicAssetsPath, hpc2PreR2SuccessorPath, prePath, logoRegistryPath, visualRegistryPath]) {
  assert.ok(exists(path), `Missing BFR-H current dependency: ${path}`);
}

const reconciliation = read(predecessorReconciliationPath);
const logoSuccessor = read(logoSuccessorPath);
const brandingSuccessor = read(brandingSuccessorPath);
const pocAVerificationSuccessor = read(pocAVerificationSuccessorPath);
const bfrCurrentVerificationSuccessor = read(bfrCurrentVerificationSuccessorPath);
const acceptance = read(acceptancePath);
const freeze = read(freezePath);
const h0 = read(h0Path);
const h1 = read(h1Path);
const h2 = read(h2Path);
const h3 = read(h3Path);
const h11 = read(h11Path);
const publicAssets = read(publicAssetsPath);
const hpc2PreR2Successor = read(hpc2PreR2SuccessorPath);
const pre = read(prePath);
const logoRegistry = read(logoRegistryPath);
const visualRegistry = read(visualRegistryPath);

assert.equal(reconciliation.status, 'ADDITIVE_CURRENT_SOURCE_SUCCESSOR_ACTIVE_HISTORICAL_EVIDENCE_PRESERVED');
assert.equal(reconciliation.historicalBaselineCommit, '3b5ff152d1cdfe479ed4daf7c772e3faa926dc17');
assert.equal(reconciliation.currentBaselineCommit, '7e2b21290d6f4a628f034533a5ca4b89c144db8f');
assert.equal(reconciliation.historicalArtifactsRewritten, false);
assert.equal(reconciliation.historicalCheckerRewritten, false);
assert.equal(reconciliation.snapshotPolicy.currentDriftAllowedOnlyWhenExplicitlyReconciled, true);
assert.equal(reconciliation.snapshotPolicy.unknownCurrentDriftFailsClosed, true);

assert.equal(logoSuccessor.status, 'ADDITIVE_LOGO_REGISTRY_SUCCESSOR_ACTIVE_HISTORICAL_EVIDENCE_PRESERVED');
assert.equal(logoSuccessor.observedBaselineCommit, 'a90b21456b7f2b2ef1e60e0bd5e65495ee069e6b');
assert.equal(logoSuccessor.governedChangeCommit, '1e0ecd38aec76f663175d28342e3044d12ea0608');
assert.equal(logoSuccessor.predecessor.path, predecessorReconciliationPath);
assert.equal(logoSuccessor.predecessor.sha256, sha256(predecessorReconciliationPath));
assert.equal(logoSuccessor.registryTransition.path, publicAssetsPath);
assert.equal(logoSuccessor.registryTransition.predecessorSha256, '5ee6a00031ce0d6bd722f9b46bf21e69f1a983b67b0eab8050cb9cf33ecb265f');
assert.equal(logoSuccessor.registryTransition.logoCommitSha256, '03183d189748bc6ca7504c8d36a85276a2fa42727d18b28c39f4de8a916f4518');
assert.equal(logoSuccessor.registryTransition.predecessorRecordCount, 132);
assert.equal(logoSuccessor.registryTransition.currentRecordCount, 144);
assert.equal(logoSuccessor.registryTransition.addedRecordCount, 12);
assert.equal(logoSuccessor.registryTransition.changeClassification, 'ADDITIVE_LOGO_MEMBERS_PLUS_SUMMARY_RECONCILIATION');
assert.equal(logoSuccessor.registryTransition.digestPolicy, 'STRUCTURAL_FAIL_CLOSED_WITH_GOVERNED_REMOTE_EVIDENCE_PROGRESS');
assert.equal(logoSuccessor.logoAuthority.registry, logoRegistryPath);
assert.equal(logoSuccessor.logoAuthority.recordCount, 12);
assert.equal(logoSuccessor.logoAuthority.existingPublicAssetRegistryReused, true);
assert.equal(logoSuccessor.logoAuthority.existingPublicAssetResolverReused, true);
assert.equal(logoSuccessor.logoAuthority.secondLogoAuthorityCreated, false);
assert.equal(logoSuccessor.logoAuthority.secondAssetRegistryCreated, false);
assert.equal(logoSuccessor.logoAuthority.secondAssetResolverCreated, false);
assert.equal(logoSuccessor.successorPolicy.historicalBfrEvidenceRewritten, false);
assert.equal(logoSuccessor.successorPolicy.predecessorReconciliationRewritten, false);
assert.equal(logoSuccessor.successorPolicy.nonLogoPredecessorProjectionMustRemainByteEquivalent, true);
assert.equal(logoSuccessor.successorPolicy.unknownRegistryMemberFailsClosed, true);
assert.equal(logoSuccessor.successorPolicy.predecessorMemberRemovalFailsClosed, true);
assert.equal(logoSuccessor.successorPolicy.predecessorMemberMutationFailsClosed, true);
assert.equal(logoSuccessor.successorPolicy.logoIdentityOrObjectKeyMutationFailsClosed, true);
assert.equal(logoSuccessor.successorPolicy.logoRemoteEvidenceMayAdvanceOnlyThroughGovernedVerification, true);
assert.equal(logoSuccessor.successorPolicy.remoteVerifiedEvidenceMayNotBeDowngraded, true);

assert.equal(brandingSuccessor.status, 'ADDITIVE_BRANDING_REGISTRY_SUCCESSOR_ACTIVE_HISTORICAL_EVIDENCE_PRESERVED');
assert.equal(brandingSuccessor.observedBaselineCommit, '316a1bcc8adc817bb8c8fb005260462bb316efdf');
assert.equal(brandingSuccessor.predecessor.path, logoSuccessorPath);
assert.equal(brandingSuccessor.predecessor.publicAssetRegistrySha256, logoSuccessor.registryTransition.initialReconciledSha256);
assert.equal(brandingSuccessor.predecessor.recordCount, 144);
assert.equal(brandingSuccessor.observedRegistryState.sha256, '0cad2bf65a413cab9af8ef06ef17d03ec5f739dfb357364758c2d21eaa63225a');
assert.equal(brandingSuccessor.observedRegistryState.recordCount, 149);
assert.equal(brandingSuccessor.registryTransition.predecessorProjectionSha256, logoSuccessor.registryTransition.initialReconciledSha256);
assert.equal(brandingSuccessor.registryTransition.predecessorRecordCount, 144);
assert.equal(brandingSuccessor.registryTransition.currentRecordCount, 149);
assert.equal(brandingSuccessor.registryTransition.addedRecordCount, 5);
assert.equal(brandingSuccessor.registryTransition.changeClassification, 'ADDITIVE_EXISTING_BRANDING_IDENTITIES_PLUS_SUMMARY_RECONCILIATION');
assert.equal(brandingSuccessor.registryTransition.digestPolicy, 'STRUCTURAL_PREDECESSOR_PROJECTION_AND_MEMBER_LEVEL_FAIL_CLOSED_VALIDATION');
assert.equal(brandingSuccessor.brandingAuthority.registry, visualRegistryPath);
assert.equal(brandingSuccessor.brandingAuthority.historicalRegistrySha256AtW5Observation, '3eccd56490936164a0f0aa31b1ecece38eceedda0e613403784fdc9c6ff53772');
assert.equal(brandingSuccessor.brandingAuthority.currentRegistrySha256AtSuccessor, sha256(visualRegistryPath));
assert.equal(brandingSuccessor.visualRegistryTransition.path, visualRegistryPath);
assert.equal(brandingSuccessor.visualRegistryTransition.historicalW5ObservationSha256, brandingSuccessor.brandingAuthority.historicalRegistrySha256AtW5Observation);
assert.equal(brandingSuccessor.visualRegistryTransition.currentSuccessorSha256, brandingSuccessor.brandingAuthority.currentRegistrySha256AtSuccessor);
assert.equal(brandingSuccessor.visualRegistryTransition.predecessorProjectionSha256, brandingSuccessor.visualRegistryTransition.historicalW5ObservationSha256);
assert.equal(brandingSuccessor.visualRegistryTransition.recordCount, 152);
assert.equal(brandingSuccessor.visualRegistryTransition.addedRecords, 0);
assert.equal(brandingSuccessor.visualRegistryTransition.removedRecords, 0);
assert.equal(brandingSuccessor.visualRegistryTransition.reorderedRecords, 0);
assert.equal(brandingSuccessor.visualRegistryTransition.changedMemberCount, 5);
assert.equal(brandingSuccessor.visualRegistryTransition.fieldChangesPerMember, 10);
assert.equal(brandingSuccessor.visualRegistryTransition.totalFieldChanges, 50);
assert.equal(brandingSuccessor.visualRegistryTransition.changeClassification, 'FIVE_EXISTING_BRANDING_IDENTITIES_OWNER_SUPPLIED_REMOTE_DELIVERY_SUCCESSOR');
assert.equal(brandingSuccessor.visualRegistryTransition.digestPolicy, 'STRUCTURAL_PREDECESSOR_PROJECTION_AND_EXACT_ALLOWED_FIELD_TRANSITION');
assert.equal(brandingSuccessor.brandingAuthority.existingVisualAuthorityReused, true);
assert.equal(brandingSuccessor.brandingAuthority.existingPublicAssetRegistryReused, true);
assert.equal(brandingSuccessor.brandingAuthority.existingPublicAssetResolverReused, true);
assert.equal(brandingSuccessor.brandingAuthority.secondBrandingAuthorityCreated, false);
assert.equal(brandingSuccessor.brandingAuthority.secondAssetRegistryCreated, false);
assert.equal(brandingSuccessor.brandingAuthority.secondAssetResolverCreated, false);
assert.equal(brandingSuccessor.hpc2W5Successor.frozenCheckerSha256, sha256(brandingSuccessor.hpc2W5Successor.frozenChecker));
assert.equal(brandingSuccessor.hpc2W5Successor.frozenEvidenceSha256, sha256(brandingSuccessor.hpc2W5Successor.frozenEvidence));
assert.equal(brandingSuccessor.successorPolicy.historicalBfrEvidenceRewritten, false);
assert.equal(brandingSuccessor.successorPolicy.historicalHpc2W5EvidenceRewritten, false);
assert.equal(brandingSuccessor.successorPolicy.historicalCheckerRewritten, false);
assert.equal(brandingSuccessor.successorPolicy.predecessorMemberRemovalFailsClosed, true);
assert.equal(brandingSuccessor.successorPolicy.predecessorMemberMutationFailsClosed, true);
assert.equal(brandingSuccessor.successorPolicy.unknownRegistryMemberFailsClosed, true);
assert.equal(brandingSuccessor.successorPolicy.summaryDriftFailsClosed, true);
assert.equal(brandingSuccessor.successorPolicy.visualRegistryUnexpectedFieldChangeFailsClosed, true);
assert.equal(brandingSuccessor.successorPolicy.visualRegistryMemberAdditionRemovalOrReorderFailsClosed, true);
assert.equal(bfrCurrentVerificationSuccessor.status, 'BFR_H_CURRENT_HISTORICAL_LOGO_BRANDING_PREDECESSORS_PRESERVED_POC_A_REMOTE_VERIFICATION_RECONCILED');
assert.equal(bfrCurrentVerificationSuccessor.upstreamVerificationSuccessor.path, pocAVerificationSuccessorPath);
assert.equal(bfrCurrentVerificationSuccessor.upstreamVerificationSuccessor.sha256, sha256(pocAVerificationSuccessorPath));
assert.equal(bfrCurrentVerificationSuccessor.upstreamVerificationSuccessor.targetCount, pocAVerificationSuccessor.remoteVerificationAdvancement.targetCount);
assert.equal(bfrCurrentVerificationSuccessor.upstreamVerificationSuccessor.rewritten, false);
assert.equal(bfrCurrentVerificationSuccessor.historicalBrandingSuccessor.path, brandingSuccessorPath);
assert.equal(bfrCurrentVerificationSuccessor.historicalBrandingSuccessor.sha256, sha256(brandingSuccessorPath));
assert.equal(bfrCurrentVerificationSuccessor.historicalBrandingSuccessor.predecessorProjectionSha256, brandingSuccessor.registryTransition.predecessorProjectionSha256);
assert.equal(bfrCurrentVerificationSuccessor.historicalBrandingSuccessor.rewritten, false);
assert.equal(bfrCurrentVerificationSuccessor.historicalLogoSuccessor.path, logoSuccessorPath);
assert.equal(bfrCurrentVerificationSuccessor.historicalLogoSuccessor.sha256, sha256(logoSuccessorPath));
assert.equal(bfrCurrentVerificationSuccessor.historicalLogoSuccessor.predecessorProjectionSha256, logoSuccessor.registryTransition.predecessorSha256);
assert.equal(bfrCurrentVerificationSuccessor.historicalLogoSuccessor.rewritten, false);
assert.equal(bfrCurrentVerificationSuccessor.currentProjectionFacts.publicAssetRegistryPath, publicAssetsPath);
assert.equal(bfrCurrentVerificationSuccessor.currentProjectionFacts.publicAssetRegistrySha256, sha256(publicAssetsPath));
assert.equal(bfrCurrentVerificationSuccessor.currentProjectionFacts.recordCount, publicAssets.assets.length);
assert.equal(pocAVerificationSuccessor.publicAssetRegistry.currentSha256, sha256(publicAssetsPath));
assert.equal(pocAVerificationSuccessor.publicAssetRegistry.recordCount, publicAssets.assets.length);
assert.equal(pocAVerificationSuccessor.remoteVerificationAdvancement.targetCount, 10);
assert.equal(bfrCurrentVerificationSuccessor.authorityBoundary.remoteVerificationEvidenceOnly, true);
assert.equal(bfrCurrentVerificationSuccessor.authorityBoundary.historicalBfrEvidenceRewritten, false);
assert.equal(bfrCurrentVerificationSuccessor.authorityBoundary.globalProductionAccepted, false);

const expectedLogoCodes = Array.from({length: 12}, (_, index) => `LOGO-${String(index + 1).padStart(3, '0')}`);
assert.deepEqual(logoSuccessor.registryTransition.addedAssetCodes, expectedLogoCodes);
assert.equal(logoRegistry.records.length, 12);
assert.deepEqual(logoRegistry.records.map(record => record.assetCode), expectedLogoCodes);
assert.equal(new Set(logoRegistry.records.map(record => record.assetCode)).size, 12);
assert.equal(new Set(logoRegistry.records.map(record => record.objectKey)).size, 12);

const logoCodeSet = new Set(expectedLogoCodes);
const logoAssets = publicAssets.assets.filter(asset => logoCodeSet.has(asset.asset_code));
const expectedBrandingCodes = brandingSuccessor.registryTransition.addedAssetCodes;
const brandingCodeSet = new Set(expectedBrandingCodes);
const brandingAssets = publicAssets.assets.filter(asset => brandingCodeSet.has(asset.asset_code));
assert.equal(publicAssets.assets.length, 149);
assert.equal(new Set(publicAssets.assets.map(asset => asset.asset_code)).size, 149, 'Public asset identity collision');
assert.equal(new Set(publicAssets.assets.map(asset => asset.object_key)).size, 149, 'Public asset object-key collision');
assert.equal(logoAssets.length, 12);
assert.deepEqual(logoAssets.map(asset => asset.asset_code), expectedLogoCodes);
assert.equal(brandingAssets.length, 5);
assert.deepEqual(brandingAssets.map(asset => asset.asset_code), expectedBrandingCodes);
assert.equal(publicAssets.summary.registeredAssetRecords, 149);
assert.equal(publicAssets.summary.concreteRenderableMembers, 145);
assert.equal(publicAssets.summary.directoryGroups, 4);
assert.equal(publicAssets.summary.canonicalLogoMembers, 12);
assert.equal(publicAssets.summary.canonicalBrandingMembers, 5);
assert.equal(publicAssets.summary.remoteVerifiedBrandingMembers, 5);

const brandingPredecessorProjection = structuredClone(publicAssets);
brandingPredecessorProjection.assets = brandingPredecessorProjection.assets.filter(asset => !brandingCodeSet.has(asset.asset_code));
brandingPredecessorProjection.summary.registeredAssetRecords = 144;
brandingPredecessorProjection.summary.concreteRenderableMembers = 140;
delete brandingPredecessorProjection.summary.canonicalBrandingMembers;
delete brandingPredecessorProjection.summary.remoteVerifiedBrandingMembers;
const brandingPredecessorProjectionSha256 = sha256Bytes(Buffer.from(`${JSON.stringify(brandingPredecessorProjection, null, 2)}\n`));
assert.equal(brandingPredecessorProjection.assets.length, 144);
assert.equal(brandingSuccessor.registryTransition.predecessorProjectionSha256, bfrCurrentVerificationSuccessor.historicalBrandingSuccessor.predecessorProjectionSha256, 'Historical branding predecessor authority changed');
assert.equal(brandingPredecessorProjectionSha256, bfrCurrentVerificationSuccessor.currentProjectionFacts.brandingRemovedCurrentProjectionSha256, 'Current branding-removed projection drifted outside the governed POC-A verification successor');

const predecessorProjection = structuredClone(brandingPredecessorProjection);
predecessorProjection.assets = predecessorProjection.assets.filter(asset => !logoCodeSet.has(asset.asset_code));
predecessorProjection.summary.registeredAssetRecords = 132;
predecessorProjection.summary.concreteRenderableMembers = 128;
delete predecessorProjection.summary.canonicalLogoMembers;
const predecessorProjectionSha256 = sha256Bytes(Buffer.from(`${JSON.stringify(predecessorProjection, null, 2)}\n`));
assert.equal(predecessorProjection.assets.length, 132);
assert.equal(logoSuccessor.registryTransition.predecessorSha256, bfrCurrentVerificationSuccessor.historicalLogoSuccessor.predecessorProjectionSha256, 'Historical non-logo predecessor authority changed');
assert.equal(predecessorProjectionSha256, bfrCurrentVerificationSuccessor.currentProjectionFacts.brandingAndLogoRemovedCurrentProjectionSha256, 'Current non-logo/non-branding projection drifted outside the governed POC-A verification successor');
const verificationTargetCodes = pocAVerificationSuccessor.remoteVerificationAdvancement.targetAssetCodes;
assert.equal(verificationTargetCodes.length, 10);
assert.equal(new Set(verificationTargetCodes).size, 10);
assert.equal(verificationTargetCodes.some(code => brandingCodeSet.has(code) || logoCodeSet.has(code)), false, 'POC-A verification successor may not rewrite logo/branding identities');
for (const evidence of pocAVerificationSuccessor.remoteVerificationAdvancement.evidence) {
  const current = publicAssets.assets.find(asset => asset.asset_code === evidence.assetCode);
  assert.ok(current, `Missing POC-A verification target: ${evidence.assetCode}`);
  assert.equal(current.object_key, evidence.objectKey);
  assert.equal(current.status, evidence.status);
  assert.equal(current.verification, evidence.verification);
  assert.equal(current.remote?.http_status, evidence.httpStatus);
  assert.equal(current.remote?.content_type, evidence.contentType);
  assert.equal(current.remote?.content_length, evidence.contentLength);
  assert.equal(current.remote?.etag, evidence.etag);
}

assert.equal(visualRegistry.assets.length, brandingSuccessor.visualRegistryTransition.recordCount);
assert.deepEqual(brandingSuccessor.visualRegistryTransition.changedAssetCodes, expectedBrandingCodes);
assert.deepEqual(brandingSuccessor.visualRegistryTransition.allowedChangedFields, [
  'actualConsumerState',
  'humanReview.evidence',
  'humanReview.status',
  'productionSpec.embeddedTextPolicy',
  'productionSpec.localeMode',
  'productionSpec.logoPolicy',
  'productionSpec.masterFormat',
  'productionSpec.productionFormat',
  'r2.remoteVerified',
  'state'
]);
const visualPredecessorProjection = structuredClone(visualRegistry);
const projectedVisualBranding = visualPredecessorProjection.assets.filter(record => brandingCodeSet.has(record.assetCode));
assert.equal(projectedVisualBranding.length, 5);
for (const record of projectedVisualBranding) {
  record.actualConsumerState = 'MISSING';
  delete record.humanReview.evidence;
  record.humanReview.status = 'PENDING';
  record.productionSpec.embeddedTextPolicy = 'NO_LONG_COPY';
  record.productionSpec.localeMode = 'NEUTRAL';
  delete record.productionSpec.logoPolicy;
  record.productionSpec.masterFormat = 'PNG_OR_SVG';
  record.productionSpec.productionFormat = 'WEBP_OR_SVG';
  record.r2.remoteVerified = false;
  record.state = 'PLANNED';
}
const visualPredecessorProjectionSha256 = sha256Bytes(Buffer.from(`${JSON.stringify(visualPredecessorProjection, null, 2)}\n`));
assert.equal(visualPredecessorProjectionSha256, brandingSuccessor.visualRegistryTransition.predecessorProjectionSha256, 'Visual Registry predecessor projection changed outside the governed five-branding transition');

for (const asset of brandingAssets) {
  const authority = visualRegistry.assets.find(record => record.assetCode === asset.asset_code);
  assert.ok(authority, `Missing existing branding authority: ${asset.asset_code}`);
  assert.equal(authority.assetType, 'BRANDING');
  assert.equal(authority.r2.objectKey, asset.object_key);
  assert.equal(authority.productionSpec.width, 1600);
  assert.equal(authority.productionSpec.height, 2000);
  assert.equal(authority.productionSpec.masterFormat, 'PNG');
  assert.equal(authority.productionSpec.productionFormat, 'WEBP');
  assert.equal(authority.productionSpec.embeddedTextPolicy, 'FIXED_BILINGUAL_VOLUME_IDENTITY');
  assert.equal(authority.productionSpec.localeMode, 'BILINGUAL_FIXED_EN_ZH_HANS');
  assert.equal(authority.productionSpec.logoPolicy, 'CANONICAL_PHI_COORDINATE_EMBEDDED_IN_OWNER_SUPPLIED_BRANDING');
  assert.equal(authority.r2.remoteVerified, true);
  assert.equal(authority.state, 'REMOTE_VERIFIED_AWAITING_CONSUMER_ACCEPTANCE');
  assert.equal(authority.actualConsumerState, 'BOOKS_RESOLVER_BOUND_FAIL_CLOSED');
  assert.equal(authority.humanReview.status, 'OWNER_SUPPLIED_ACCEPTED_FOR_BRI');
  assert.equal(authority.humanReview.evidence, 'User supplied final branding artwork with PHI OS logo on 2026-08-20.');
  assert.equal(asset.category, 'branding');
  assert.equal(asset.family, 'BRANDING');
  assert.equal(asset.format, 'webp');
  assert.equal(asset.content_type, 'image/webp');
  assert.equal(asset.width, 1600);
  assert.equal(asset.height, 2000);
  assert.equal(asset.aspect_ratio, '4:5');
  assert.equal(asset.canonical, true);
  assert.equal(asset.canonical_state, 'BRI_BRANDING_OWNER_SUPPLIED_REMOTE_VERIFIED_HUMAN_ACCEPTANCE_PENDING');
  assert.equal(asset.source_registry, visualRegistryPath);
  assert.equal(asset.status, 'remote-verified');
  assert.equal(asset.verification, 'verified-remote-head-get');
  assert.equal(asset.remote.http_status, 200);
  assert.match(asset.remote.content_type, /image\/webp/i);
  assert.ok(Number(asset.remote.content_length) > 0);
  assert.ok(asset.remote.etag);
  assert.ok(Number.isFinite(Date.parse(asset.remote.verified_at)));
  assert.ok(asset.remote.requested_url.endsWith(asset.object_key));
}
assert.equal(brandingSuccessor.remoteEvidenceBoundary.visualPlanningRecordsAdvancedByExistingBriAuthority, true);
assert.equal(brandingSuccessor.remoteEvidenceBoundary.brandingOwnerSuppliedReviewInherited, true);
assert.equal(brandingSuccessor.remoteEvidenceBoundary.brandingOwnerSuppliedReviewRecords, 5);
assert.equal(brandingSuccessor.remoteEvidenceBoundary.booksResolverBindingsInherited, 5);
assert.equal(brandingSuccessor.remoteEvidenceBoundary.booksConsumerAcceptanceClaimed, false);
assert.equal(brandingSuccessor.remoteEvidenceBoundary.homepageHumanReviewPromoted, false);
assert.equal(brandingSuccessor.remoteEvidenceBoundary.homepageConsumerPromoted, false);

let remoteVerifiedLogoCount = 0;
for (const record of logoRegistry.records) {
  const asset = publicAssets.assets.find(item => item.asset_code === record.assetCode);
  assert.ok(asset, `Missing additive logo member: ${record.assetCode}`);
  assert.equal(asset.category, 'logo');
  assert.equal(asset.family, 'LOGO');
  assert.equal(asset.semantic_name, record.semanticName);
  assert.equal(asset.official_filename, record.officialFilename);
  assert.equal(asset.object_key, record.objectKey);
  assert.equal(asset.format, 'svg');
  assert.equal(asset.content_type, 'image/svg+xml');
  assert.equal(asset.canonical, true);
  assert.equal(asset.source_registry, logoRegistryPath);
  assert.equal(asset.status, record.status);

  if (asset.status === 'remote-verified') {
    remoteVerifiedLogoCount += 1;
    assert.equal(asset.verification, 'verified-remote-head-get');
    assert.equal(record.verification, 'verified-remote-head-get');
    assert.equal(asset.remote.http_status, 200);
    assert.match(asset.remote.content_type, /image\/svg\+xml/i);
    assert.ok(asset.remote.etag);
    assert.ok(Number.isFinite(Date.parse(asset.remote.verified_at)));
    assert.equal(record.remote.httpStatus, 200);
    assert.match(record.remote.contentType, /image\/svg\+xml/i);
    assert.equal(record.remote.requestedURL, asset.remote.requested_url);
    assert.equal(record.remote.etag, asset.remote.etag);
    assert.equal(record.remote.verifiedAt, asset.remote.verified_at);
    assert.ok(asset.remote.requested_url.endsWith(asset.object_key));
  } else if (asset.status === 'uploaded-reported-by-owner') {
    assert.equal(asset.verification, 'pending-remote-verification');
    assert.equal(Object.hasOwn(asset, 'remote'), false);
    assert.equal(Object.hasOwn(record, 'remote'), false);
  } else {
    assert.equal(asset.status, 'production-ready-awaiting-upload');
    assert.equal(asset.verification, 'pending-owner-upload');
    assert.equal(Object.hasOwn(asset, 'remote'), false);
    assert.equal(Object.hasOwn(record, 'remote'), false);
  }
}

if (remoteVerifiedLogoCount === 0) {
  assert.equal(logoAssets.filter(asset => asset.status === 'uploaded-reported-by-owner').length, logoSuccessor.initialVerificationObservation.uploadedReportedByOwner);
  assert.equal(logoAssets.filter(asset => asset.status === 'production-ready-awaiting-upload').length, logoSuccessor.initialVerificationObservation.productionReadyAwaitingUpload);
  assert.equal(logoSuccessor.registryTransition.initialReconciledSha256, bfrCurrentVerificationSuccessor.historicalBrandingSuccessor.predecessorProjectionSha256);
  assert.equal(brandingPredecessorProjectionSha256, bfrCurrentVerificationSuccessor.currentProjectionFacts.brandingRemovedCurrentProjectionSha256);
  assert.equal(sha256(logoRegistryPath), logoSuccessor.logoAuthority.registrySha256AtObservation);
}
assert.equal(logoSuccessor.initialVerificationObservation.remoteVerificationFabricated, false);
assert.equal(logoSuccessor.initialVerificationObservation.humanAcceptanceCreated, false);

const allowedDrift = new Map(reconciliation.reconciledDrifts.map(item => [item.path, item]));
assert.equal(allowedDrift.size, 3);
const observedDrift = [];
for (const snapshot of h0.sourceSnapshot) {
  assert.ok(exists(snapshot.path), `Historical H0 source missing: ${snapshot.path}`);
  const currentSha256 = sha256(snapshot.path);
  if (currentSha256 === snapshot.sha256) continue;
  const successor = allowedDrift.get(snapshot.path);
  assert.ok(successor, `Unreconciled BFR-H0 current source drift: ${snapshot.path}`);
  assert.equal(successor.historicalSha256, snapshot.sha256, `Historical digest mismatch: ${snapshot.path}`);
  if (snapshot.path === publicAssetsPath) {
    assert.equal(successor.currentSha256, logoSuccessor.registryTransition.predecessorSha256, `Logo successor predecessor mismatch: ${snapshot.path}`);
  } else {
    assert.equal(successor.currentSha256, currentSha256, `Current digest mismatch: ${snapshot.path}`);
  }
  assert.equal(successor.authorityRecreated, false, `Authority recreation is forbidden: ${snapshot.path}`);
  observedDrift.push(snapshot.path);
}
assert.deepEqual(observedDrift.sort(), [...allowedDrift.keys()].sort(), 'Registered and observed BFR-H0 drifts differ');

assert.equal(h0.work, 'BFR-H0');
assert.equal(h0.recordCount, 56);
assert.equal(h0.records.length, 56);
assert.equal(new Set(h0.records.map(item => item.capabilityCode)).size, 56);
assert.equal(h0.authorityBoundary.newBackendAuthorityCreated, false);
assert.equal(h0.authorityBoundary.productionEligibilityChanged, false);
const h0Categories = new Set(h0.records.map(item => item.category));
for (const category of ['BOOKS', 'KNOWLEDGE', 'VISUAL', 'REALITY', 'METHOD', 'ACADEMY', 'SERVICES', 'PROFESSIONAL']) {
  assert.ok(h0Categories.has(category), `Missing H0 category: ${category}`);
}
const h0RequiredFields = [
  'capabilityCode', 'runtimeCode', 'authoritySource', 'productionState', 'dataSource',
  'endpoint', 'localeAvailability', 'audience', 'visualAssets', 'expectedSurface',
  'actualConsumer', 'consumerState'
];
const h0ConsumerStates = new Set(['ACTIVE', 'PARTIAL', 'MISSING', 'NONE_BY_DESIGN', 'DEPRECATED']);
for (const record of h0.records) {
  for (const field of h0RequiredFields) assert.ok(Object.hasOwn(record, field), `${record.capabilityCode} missing ${field}`);
  assert.ok(h0ConsumerStates.has(record.consumerState), `${record.capabilityCode} invalid consumer state`);
  assert.ok(Array.isArray(record.expectedSurface) && record.expectedSurface.length > 0, `${record.capabilityCode} missing intended surface`);
  if (typeof record.authoritySource === 'string' && !record.authoritySource.startsWith('/')) assert.ok(exists(record.authoritySource), `${record.capabilityCode} authority source missing`);
  if (typeof record.dataSource === 'string' && record.dataSource && !record.dataSource.startsWith('/')) assert.ok(exists(record.dataSource), `${record.capabilityCode} data source missing`);
}
assert.equal(h0.exitGate.invisibleCapabilitiesOmitted, false);
assert.equal(h1.work, 'BFR-H1');
assert.equal(h1.recordCount, 19);
assert.equal(h2.work, 'BFR-H2');
assert.equal(h2.records.length, 56);
assert.equal(h2.exitGate.silentOrphanCount, 0);
assert.equal(h3.work, 'BFR-H3');
assert.equal(h3.canonicalCurrentManifest, true);
assert.equal(h3.recordCount, 18);

for (let step = 1; step <= 14; step += 1) {
  if (step === 11) continue;
  const result = spawnSync(process.execPath, ['scripts/check-bfr-h-part-a.mjs', `BFR-H${step}`], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `Historical BFR-H${step} contract check failed`);
}

assert.equal(h11.work, 'BFR-H11');
assert.equal(h11.recordCount, 8);
assert.equal(h11.frontendIntegrationComplete, false);
assert.equal(h11.productionPromotionClaimed, false);
assert.equal(hpc2PreR2Successor.historicalRegisteredAssetObservation, 7);
assert.equal(hpc2PreR2Successor.preHpc2CurrentRegistryRecordCount, 8);
assert.equal(hpc2PreR2Successor.successorRules.registryMayAddConcreteMembersWithoutRewritingHistoricalObservation, true);
assert.equal(hpc2PreR2Successor.successorRules.existingAssetResolverRemainsSingleAuthority, true);
assert.equal(publicAssets.assets.length, 149);
assert.equal(pre.state, 'HPC2_PRE_READY');
assert.equal(pre.counts.plannedRegistryIdentities, 152);
assert.equal(pre.gates.noSecondAssetResolver, true);
assert.equal(pre.gates.customerVisibleDelta, true);

assert.equal(acceptance.partAExecutionComplete, true);
assert.deepEqual(acceptance.completedSteps, Array.from({length: 15}, (_, index) => `BFR-H${index}`));
assert.equal(acceptance.facts.duplicateAuthorityCreated, false);
assert.equal(acceptance.facts.pdsReopened, false);
assert.equal(acceptance.facts.cprReopened, false);
assert.equal(acceptance.facts.wprV1Reopened, false);
assert.equal(acceptance.exitGate.openGapsExplicitNotHidden, true);
assert.equal(acceptance.exitGate.fullProductionPromotion, false);
assert.equal(acceptance.facts.globalProductionAcceptanceClaimed, false);
assert.equal(acceptance.nextWork, 'HPC2-P0_BFR_H_HOMEPAGE_CAPABILITY_INTAKE');
assert.equal(freeze.globalProductionFreezeDeclared, false);
assert.equal(freeze.frozenBoundaries.pdsAuthority, false);
assert.equal(freeze.frozenBoundaries.cprAuthority, false);
assert.equal(freeze.frozenBoundaries.wprV1Authority, false);
assert.equal(freeze.successorRules.homepageNarrativeComposition, 'HPC2');
assert.equal(pre.state, 'HPC2_PRE_READY');
assert.equal(pre.gates.noDuplicateAuthority, true);
assert.equal(pre.gates.noSecondAssetResolver, true);
assert.equal(pre.gates.noPrematureRealityActivation, true);

assert.equal(reconciliation.boundaries.bfrH0H14DecisionPreserved, true);
assert.equal(reconciliation.boundaries.hpc2PreReadyPreserved, true);
assert.equal(reconciliation.boundaries.duplicateKnowledgeAuthorityCreated, false);
assert.equal(reconciliation.boundaries.duplicateAssetRegistryCreated, false);
assert.equal(reconciliation.boundaries.duplicateAssetResolverCreated, false);
assert.equal(reconciliation.boundaries.productionRouteActivated, false);
assert.equal(reconciliation.boundaries.humanDecisionCreated, false);
assert.equal(reconciliation.boundaries.globalProductionAcceptanceClaimed, false);
assert.equal(logoSuccessor.boundaries.hpc2PreReadyPreserved, true);
assert.equal(logoSuccessor.boundaries.hpc2W0Preserved, true);
assert.equal(logoSuccessor.boundaries.hpc2W1Preserved, true);
assert.equal(logoSuccessor.boundaries.homepageDomChanged, false);
assert.equal(logoSuccessor.boundaries.homepageNarrativeChanged, false);
assert.equal(logoSuccessor.boundaries.productionRouteActivated, false);
assert.equal(logoSuccessor.boundaries.realityRouteActivated, false);
assert.equal(logoSuccessor.boundaries.humanDecisionCreated, false);
assert.equal(logoSuccessor.boundaries.globalProductionAcceptanceClaimed, false);
assert.equal(brandingSuccessor.boundaries.hpc2PreReadyPreserved, true);
assert.equal(brandingSuccessor.boundaries.hpc2W0ThroughW5Preserved, true);
assert.equal(brandingSuccessor.boundaries.homepageDomChanged, false);
assert.equal(brandingSuccessor.boundaries.homepageNarrativeChanged, false);
assert.equal(brandingSuccessor.boundaries.homepageRuntimeChanged, false);
assert.equal(brandingSuccessor.boundaries.productionRouteActivated, false);
assert.equal(brandingSuccessor.boundaries.realityRouteActivated, false);
assert.equal(brandingSuccessor.boundaries.askHomepageConsumerActivated, false);
assert.equal(brandingSuccessor.boundaries.humanDecisionCreated, false);
assert.equal(brandingSuccessor.boundaries.browserDecisionCreated, false);
assert.equal(brandingSuccessor.boundaries.globalProductionAcceptanceClaimed, false);

console.log('✓ BFR-H current successor passed: historical H0-H14 evidence preserved; 3/3 mutable source paths plus additive logo and five-volume branding transitions are explicitly reconciled.');
console.log('✓ Current foundation remains 56 backend capabilities, 19 frontend surfaces, 18 manifest surfaces, and zero silent H2 orphans.');
console.log(`✓ Historical BFR-H11 8-record observation is preserved; Public Asset Registry = 132 predecessor + 12 logo + 5 governed branding members; remote-verified logos = ${remoteVerifiedLogoCount}/12.`);
console.log('✓ Visual Registry remains 152 identities; only 5 existing branding records advanced through the exact BRI owner-supplied + remote-delivery successor fields.');
console.log('✓ HPC2_PRE_READY and the existing 152-identity Visual Registry remain preserved without a second Knowledge, Branding, Logo, Asset Registry, Resolver or Homepage authority.');
