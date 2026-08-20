import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const digestText = value => crypto.createHash('sha256').update(value).digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, sceneCode) => {
  const markerIndex = source.indexOf(`data-hpc2-scene="${sceneCode}"`);
  assert.ok(markerIndex >= 0, `${sceneCode} marker missing`);
  const start = source.lastIndexOf('<section', markerIndex);
  const end = source.indexOf('</section>', markerIndex);
  assert.ok(start >= 0 && end > markerIndex, `${sceneCode} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = Object.freeze({
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w5-phios-runtime-composition-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w5-phios-runtime-composition-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json',
  successorContract: 'content/web-production/reconciliation/bfr-h-hpc2-w5-316a1bc-branding-registry-successor-v1.json',
  successorEvidence: 'content/web/homepage/hpc2/evidence/hpc2-w5-public-asset-registry-successor-audit-v1.json',
  ckaSuccessorContract: 'content/web-production/reconciliation/hpc2-w5-cka-w0-w4-current-successor-v1.json',
  ckaSuccessorEvidence: 'content/web/homepage/hpc2/evidence/hpc2-w5-cka-w0-homepage-entry-successor-audit-v1.json',
  ckaW0Contract: 'content/client/knowledge-ask/contracts/cka-w0-ask-entry-contract-v1.json',
  ckaRegistry: 'content/client/knowledge-ask/registries/cka-entry-surface-registry-v1.json',
  ckaAudit: 'content/client/knowledge-ask/evidence/cka-w0-w4-authority-and-consumer-audit-v1.json',
  ckaAcceptance: 'content/client/knowledge-ask/acceptance/cka-w0-w4-batch-a-acceptance-v1.json',
  ckaFreeze: 'content/client/knowledge-ask/freeze/cka-w0-w4-batch-a-freeze-v1.json',
  askApi: 'functions/api/ask-phios.js',
  sceneRegistry: 'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  w4Contract: 'content/web/homepage/hpc2/contracts/hpc2-w4-many-lenses-category-transition-contract-v1.json',
  w4Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w4-many-lenses-category-transition-freeze-v1.json',
  publicAssets: 'content/registry/public-assets.json',
  visualRegistry: 'content/web-production/registries/client-visual-asset-registry-v1.2.json',
  humanReview: 'content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json',
  resolver: 'assets/js/runtime/web-production/asset-resolver.js',
  invariants: 'content/web-production/contracts/client-surface-global-invariants-v1.json',
  v8Manifest: 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  v8Source: 'content/web/homepage/hpc2/sources/PHIOS-market-positioning-founder-v8-no-pricing.html',
  index: 'index.html',
  css: 'assets/css/hpc2-pre-home-visuals.css',
  runtime: 'assets/js/pages/home-production.js',
  localeEn: 'assets/js/locales/en/public.js',
  localeZh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json',
  frozenW4Checker: 'scripts/check-hpc2-w4.mjs',
  frozenW5Checker: 'scripts/check-hpc2-w5.mjs',
  frozenW5ArtifactChecker: 'scripts/check-hpc2-w5-frozen-artifacts.mjs'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing HPC2-W5 dependency: ${path}`);

const contract = read(paths.contract);
const evidence = read(paths.evidence);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const successor = read(paths.successorContract);
const successorEvidence = read(paths.successorEvidence);
const ckaSuccessor = read(paths.ckaSuccessorContract);
const ckaSuccessorEvidence = read(paths.ckaSuccessorEvidence);
const ckaW0 = read(paths.ckaW0Contract);
const ckaRegistry = read(paths.ckaRegistry);
const ckaAudit = read(paths.ckaAudit);
const ckaAcceptance = read(paths.ckaAcceptance);
const ckaFreeze = read(paths.ckaFreeze);
const scenes = read(paths.sceneRegistry);
const publicAssets = read(paths.publicAssets);
const visualRegistry = read(paths.visualRegistry);
const humanReview = read(paths.humanReview);
const invariants = read(paths.invariants);
const v8Manifest = read(paths.v8Manifest);
const pkg = read(paths.package);
const html = text(paths.index);
const css = text(paths.css);
const runtime = text(paths.runtime);
const v8Source = text(paths.v8Source);

assert.equal(contract.work, 'HPC2-W5');
assert.equal(contract.baselineCommit, '51d6a5ea141af8d2ecf24ded830387045d8026b0');
assert.equal(contract.baselineTruth, 'GIT_BASELINE_IS_HPC2_W3_W4_IS_LOCAL_ADDITIVE_PREDECESSOR_NOT_CLAIMED_AS_MAIN_COMMIT');
assert.equal(contract.status, 'H01_H04_PRODUCTION_COMPOSITION_ACTIVE_H05_H09_DEFERRED');
assert.equal(evidence.status, 'H04_SOURCE_AND_COMPOSITION_VERIFIED_RUNTIME_AND_ASK_EXECUTION_NOT_ACTIVATED');
assert.equal(acceptance.state, 'HPC2_W5_H04_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W5_H04_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(successor.status, 'ADDITIVE_BRANDING_REGISTRY_SUCCESSOR_ACTIVE_HISTORICAL_EVIDENCE_PRESERVED');
assert.equal(successor.observedBaselineCommit, '316a1bcc8adc817bb8c8fb005260462bb316efdf');
assert.equal(successorEvidence.status, 'W5_COMPOSITION_PRESERVED_PUBLIC_ASSET_BRANDING_SUCCESSOR_STRUCTURALLY_RECONCILED');
assert.equal(successorEvidence.successorContract.sha256, sha256(paths.successorContract));
assert.equal(successorEvidence.visualRegistryObservations.historicalSha256, successor.visualRegistryTransition.historicalW5ObservationSha256);
assert.equal(successorEvidence.visualRegistryObservations.currentSha256, successor.visualRegistryTransition.currentSuccessorSha256);
assert.equal(successorEvidence.visualRegistryObservations.predecessorProjectionSha256, successor.visualRegistryTransition.predecessorProjectionSha256);
assert.equal(successorEvidence.visualRegistryObservations.recordCountBefore, 152);
assert.equal(successorEvidence.visualRegistryObservations.recordCountAfter, 152);
assert.equal(successorEvidence.visualRegistryObservations.addedRecords, 0);
assert.equal(successorEvidence.visualRegistryObservations.removedRecords, 0);
assert.equal(successorEvidence.visualRegistryObservations.reorderedRecords, 0);
assert.equal(successorEvidence.visualRegistryObservations.changedMembers, 5);
assert.equal(successorEvidence.visualRegistryObservations.allowedFieldChanges, 50);
assert.equal(successorEvidence.visualRegistryObservations.unexpectedFieldChanges, 0);
assert.equal(successorEvidence.decisionObservations.ownerSuppliedBriDecisionInherited, true);
assert.equal(successorEvidence.decisionObservations.ownerSuppliedBriDecisionCreatedByThisReconciliation, false);
assert.equal(successorEvidence.decisionObservations.homepageHumanAcceptanceClaimed, false);
assert.equal(successorEvidence.decisionObservations.booksConsumerAcceptanceClaimed, false);
assert.equal(successor.hpc2W5Successor.frozenChecker, paths.frozenW5Checker);
assert.equal(successor.hpc2W5Successor.frozenCheckerSha256, sha256(paths.frozenW5Checker));
assert.equal(successor.hpc2W5Successor.frozenEvidence, paths.evidence);
assert.equal(successor.hpc2W5Successor.frozenEvidenceSha256, sha256(paths.evidence));
assert.equal(successor.hpc2W5Successor.historicalWholeRegistryDigestRetainedAsPredecessorObservation, true);
assert.equal(successor.hpc2W5Successor.currentValidationUsesPredecessorProjectionAndGovernedAddedMembers, true);
assert.equal(successor.hpc2W5Successor.homepageCompositionChanged, false);
assert.equal(ckaSuccessor.status, 'ACTIVE_ADDITIVE_CKA_HOMEPAGE_ENTRY_SUCCESSOR_W5_HISTORY_PRESERVED');
assert.equal(ckaSuccessor.baselineCommit, '316a1bcc8adc817bb8c8fb005260462bb316efdf');
assert.equal(ckaSuccessorEvidence.status, 'H04_CKA_ENTRY_ACTIVE_W5_FROZEN_PREDECESSOR_AND_AUTHORITY_BOUNDARIES_VERIFIED');
assert.equal(ckaSuccessorEvidence.successorContract.sha256, sha256(paths.ckaSuccessorContract));
for (const artifact of ckaSuccessor.predecessor.artifacts) {
  assert.equal(sha256(artifact.path), artifact.sha256, `CKA reconciliation predecessor drift: ${artifact.path}`);
}
for (const artifact of ckaSuccessor.successor.authorityArtifacts) {
  assert.equal(sha256(artifact.path), artifact.sha256, `CKA successor authority drift: ${artifact.path}`);
}
assert.equal(sha256(paths.askApi), ckaSuccessor.runtimeTransition.askApi.currentSuccessorSha256);
assert.equal(sha256(paths.frozenW5ArtifactChecker), ckaSuccessor.checkerRoutingTransition.frozenArtifactCheckerSha256);
assert.equal(ckaSuccessor.predecessor.historicalObservationRewritten, false);
assert.equal(ckaSuccessor.runtimeTransition.secondAnswerRuntimeCreated, false);
assert.equal(ckaSuccessor.runtimeTransition.secondRetrievalRuntimeCreated, false);
assert.equal(ckaSuccessor.runtimeTransition.secondHomepageRuntimeCreated, false);
for (const boundary of Object.values(ckaSuccessor.boundaries)) assert.equal(boundary, false);
assert.equal(ckaSuccessor.successorPolicy.failClosed, true);
assert.equal(ckaSuccessor.successorPolicy.deterministic, true);
assert.equal(ckaSuccessor.successorPolicy.duplicateAuthorityForbidden, true);
assert.equal(contract.predecessorAuthority.sceneRegistrySha256, sha256(paths.sceneRegistry));
assert.equal(contract.predecessorAuthority.w4ContractSha256, sha256(paths.w4Contract));
assert.equal(contract.predecessorAuthority.w4FreezeSha256, sha256(paths.w4Freeze));
assert.equal(sha256(paths.frozenW4Checker), '7ffc7c06ac2eeb3832ef78af703cb4d329e37894f7385ba4f4bb575a2768d131');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W5 frozen artifact drift: ${artifact.path}`);

const expectedBaselineSnapshots = {
  'index.html': '0b06da155f1804ed3b8ddddd42faef71c261044456f82adea5689a1c5c2c8a02',
  'assets/css/hpc2-pre-home-visuals.css': '1c8f4de676d44ec44fdb4052ba35281f6b7d251a70f53eb080b230a03bedb5c3',
  'assets/js/pages/home-production.js': '88962dfd3d115978a5d465e5d95eea625f3e08154afabf508d1baa70b078ee00',
  'assets/js/locales/en/public.js': '9b498b0a6a08ba937ad8970d46b1fc43efdcff00a3bc30c55de290e4c7283809',
  'assets/js/locales/zh-Hans/public.js': '4779a591218bb64667cba24c8b75695497c3dc8e384aeb8519cfdc4e5921903b',
  'package.json': '4c6ba823f9242425febd4732e257268a5a3891936544d9898aacf8bc6239f217',
  'scripts/check-hpc2-pre-current.mjs': '86d3f2f3958f5b56685192a6f7fc9747fba27f2b7e9843cf75757ae709b75cd8',
  'scripts/check-hpc2-w2-current.mjs': '9ed4fa44a4608c73659b64cc9459b902f66714b950c14341f7d01f4566b609f7',
  'scripts/check-hpc2-w3-current.mjs': 'a3372f9f14e41b2039fd2b70a8dba40b9b3397b0e82fe1a650e38443b1aa1684',
  'scripts/check-hpc2-w4.mjs': '7ffc7c06ac2eeb3832ef78af703cb4d329e37894f7385ba4f4bb575a2768d131'
};
assert.deepEqual(Object.fromEntries(evidence.baselineSnapshots.map(record => [record.path, record.sha256])), expectedBaselineSnapshots);
for (const record of evidence.immutableAuthoritySnapshots) {
  if (record.path === paths.publicAssets) {
    assert.equal(record.sha256, successor.registryTransition.predecessorProjectionSha256, 'Historical W5 Public Asset Registry observation changed');
  } else if (record.path === paths.visualRegistry) {
    assert.equal(record.sha256, successor.visualRegistryTransition.predecessorProjectionSha256, 'Historical W5 Visual Registry observation changed');
  } else {
    assert.equal(sha256(record.path), record.sha256, `Authority drift: ${record.path}`);
  }
}
for (const source of contract.runtimeSources) assert.equal(sha256(source.path), source.sha256, `Runtime source drift: ${source.path}`);

const h04Authority = scenes.scenes.find(scene => scene.sceneCode === 'H04');
assert.ok(h04Authority, 'H04 authority missing');
assert.equal(h04Authority.sceneTitle, 'PHI OS Runtime');
assert.deepEqual(h04Authority.primaryNarrativeBeats, ['PHI_OS']);
assert.deepEqual(h04Authority.supportingNarrativeBeats, ['UNDERSTAND', 'ACT', 'OUTCOME', 'REVIEW']);
assert.deepEqual(h04Authority.runtimeSources, contract.runtimeSources.map(source => source.path));
assert.equal(h04Authority.visualAssets[0].assetCode, 'FIG-056');
assert.equal(h04Authority.ckaRole, 'FIRST_FORMAL_CONTEXTUAL_ASK_ENTRY_AFTER_RUNTIME_EXPLANATION');
assert.equal(h04Authority.ctaDestinations[0].activationState, 'HOMEPAGE_ENTRY_BLOCKED_PENDING_CKA');
assert.deepEqual(h04Authority.v8NarrativeLineage, contract.v8AndRouteBoundary.sourceBlocks);

for (const scene of ['H01', 'H02', 'H03', 'H04']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1);
for (let scene = 5; scene <= 9; scene += 1) assert.equal(count(html, new RegExp(`data-hpc2-scene="H0${scene}"`, 'g')), 0, `H0${scene} implemented prematurely`);
assert.equal(digestText(sceneMarkup(html, 'H01')), contract.predecessorProtection.h01MarkupSha256, 'Frozen H01 markup drift');
assert.equal(digestText(sceneMarkup(html, 'H02')), contract.predecessorProtection.h02MarkupSha256, 'Frozen H02 markup drift');
assert.equal(digestText(sceneMarkup(html, 'H03')), contract.predecessorProtection.h03MarkupSha256, 'Frozen H03 markup drift');

const h04Html = sceneMarkup(html, 'H04');
assert.equal(count(h04Html, /data-hpc2-figure="FIG-056"/g), 1);
assert.deepEqual([...h04Html.matchAll(/data-hpc2-runtime-stage="([A-Z_]+)"/g)].map(match => match[1]), contract.runtimeCycle.stages.map(stage => stage.code));
assert.deepEqual([...h04Html.matchAll(/data-hpc2-runtime-value="([A-Z_]+)"/g)].map(match => match[1]), contract.valueArchitecture.records);
assert.deepEqual([...h04Html.matchAll(/data-hpc2-runtime-boundary="([A-Z_]+)"/g)].map(match => match[1]), contract.authorityBoundaries.records);
assert.equal(count(h04Html, /data-hpc2-ask-position="H04_CONTEXTUAL_ENTRY"/g), 1);
assert.match(h04Html, /data-hpc2-consumer-state="ACTIVE_CKA_W0"/);
assert.match(h04Html, /data-hpc2-planned-route="\/knowledge-search"/);
assert.match(h04Html, /data-hpc2-route-state="HOMEPAGE_ENTRY_ACTIVE_CKA_W0"/);
assert.match(h04Html, /data-hpc2-planned-route="\/about\/system"/);
assert.equal(count(h04Html, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL"/g), 1);
assert.match(h04Html, /data-cka-entry-surface="HOMEPAGE"/);
assert.match(h04Html, /data-cka-entry-mode="GLOBAL"/);
assert.doesNotMatch(h04Html, /aria-disabled=/i);
assert.doesNotMatch(h04Html, /<(?:form|input|textarea|button|select|video|canvas)\b/i);
assert.doesNotMatch(h04Html, /data-hpc2-action=|data-ask-root|data-ask-form/i);

assert.match(css, /\.hpc2-h04\s*\{/);
assert.match(css, /\.hpc2-runtime-cycle\s*\{[\s\S]*?repeat\(4,/);
assert.match(css, /\.hpc2-h04__value-grid\s*\{[\s\S]*?repeat\(4,/);
assert.match(css, /\.hpc2-h04__ask-reservation\s*\{/);
assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.hpc2-runtime-cycle/);
assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.hpc2-h04__heading/);

assert.match(runtime, /renderAssetTarget\(phiosRuntimeFigureRoot, 'FIG-056', locale, visualRegistry\)/);
assert.match(runtime, /H04_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED/);
assert.match(runtime, /H04_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED/);
assert.match(runtime, /H04_FAIL_CLOSED_HOME_SOURCE_ERROR/);
assert.match(runtime, /hpc2RuntimeFigureRendered/);
assert.match(runtime, /target !== realityFigureRoot && target !== lensesFigureRoot && target !== phiosRuntimeFigureRoot/);
assert.doesNotMatch(runtime, /askPhios|ask-phios|\/api\/ask|canonical-reality-object|canonical-runtime-readout|rne-authority-boundary/i);
assert.doesNotMatch(runtime, /pub-1967bc5812ee4164b19a806fb1427021|\.r2\.dev/i);
const resolverCandidates = fs.readdirSync('assets/js/runtime/web-production').filter(file => /asset.*resolver/i.test(file));
assert.deepEqual(resolverCandidates, ['asset-resolver.js']);

const [rmoSource, readoutSource, navigationSource, answerSource] = contract.runtimeSources.map(source => read(source.path));
assert.equal(rmoSource.rules.productionExecutionActivated, false);
assert.equal(rmoSource.rules.persistentStoreActivated, false);
assert.equal(rmoSource.rules.realityCreationDoesNotCreateInterpretation, true);
assert.equal(readoutSource.rules.readoutMayCreateDiagnosis, false);
assert.equal(readoutSource.rules.readoutMayCreateProfessionalJudgment, false);
assert.equal(readoutSource.rules.readoutMayCreateNavigationDecision, false);
assert.equal(navigationSource.rules.productionExecutionActivated, false);
assert.equal(navigationSource.rules.persistentStoreActivated, false);
for (const forbidden of ['AUTOMATIC_OPTION_SELECTION', 'AUTOMATIC_OPTION_EXECUTION', 'NAVIGATION_COMMAND', 'PROFESSIONAL_JUDGMENT']) assert.ok(navigationSource.forbidden.includes(forbidden));
assert.equal(answerSource.rules.createsCanonicalAuthority, false);
assert.equal(answerSource.rules.createsRealityReading, false);
assert.equal(answerSource.rules.createsPersistentCase, false);

for (const code of ['INV-05', 'INV-06', 'INV-07', 'INV-08', 'INV-09']) assert.ok(invariants.invariants.some(record => record.code === code));
assert.equal(contract.askBoundary.homepageConsumerState, 'MISSING_PENDING_CKA');
assert.equal(contract.askBoundary.interactiveElementCreated, false);
assert.equal(contract.askBoundary.hrefCreated, false);
assert.equal(contract.askBoundary.apiRequestCreated, false);
assert.equal(contract.askBoundary.homepageConsumerCompletionClaimed, false);
assert.equal(contract.askBoundary.genericChatAuthority, false);
assert.equal(contract.askBoundary.persistentCaseCreated, false);
assert.equal(contract.askBoundary.automaticMethodExecution, false);
assert.equal(contract.askBoundary.automaticRealityJourney, false);

// The W5 Ask boundary above is immutable predecessor evidence. CKA-W0 is the
// independently governed additive successor that now owns the live H04 link.
assert.equal(ckaW0.consumerActivation.homepage.state, 'ACTIVE');
assert.equal(ckaW0.consumerActivation.homepage.source, 'index.html#H04');
assert.equal(ckaW0.consumerActivation.homepage.href, ckaSuccessor.successor.route);
assert.equal(ckaW0.governance.createsShadowAccount, false);
assert.equal(ckaW0.governance.createsPersistentCase, false);
assert.equal(ckaW0.governance.executesMethod, false);
assert.equal(ckaW0.governance.startsRealityJourney, false);
const ckaHomepageEntry = ckaRegistry.records.find(record => record.entrySurface === 'HOMEPAGE');
assert.equal(ckaHomepageEntry.consumerState, 'ACTIVE_CKA_W0');
assert.equal(ckaHomepageEntry.defaultMode, 'GLOBAL');
assert.equal(ckaAudit.authorityResult.secondAnswerRuntimeCreated, false);
assert.equal(ckaAudit.authorityResult.secondRetrievalRuntimeCreated, false);
assert.equal(ckaAcceptance.state, 'REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_ACCEPTANCE_PENDING');
assert.equal(ckaAcceptance.humanAcceptance.claimed, false);
assert.equal(ckaAcceptance.browserAcceptance.claimed, false);
assert.equal(ckaAcceptance.productionDeploymentAcceptance.claimed, false);
assert.equal(ckaFreeze.successorRules.automaticJourneyActivationAllowed, false);

const brandingCodes = successor.registryTransition.addedAssetCodes;
const brandingCodeSet = new Set(brandingCodes);
const brandingAssets = publicAssets.assets.filter(asset => brandingCodeSet.has(asset.asset_code));
assert.equal(publicAssets.assets.length, successor.registryTransition.currentRecordCount);
assert.equal(new Set(publicAssets.assets.map(asset => asset.asset_code)).size, publicAssets.assets.length, 'Public asset identity collision');
assert.deepEqual(brandingAssets.map(asset => asset.asset_code), brandingCodes);
assert.equal(publicAssets.summary.registeredAssetRecords, successor.registryTransition.summary.registeredAssetRecords);
assert.equal(publicAssets.summary.concreteRenderableMembers, successor.registryTransition.summary.concreteRenderableMembers);
assert.equal(publicAssets.summary.directoryGroups, successor.registryTransition.summary.directoryGroups);
assert.equal(publicAssets.summary.canonicalBrandingMembers, successor.registryTransition.summary.canonicalBrandingMembers);
assert.equal(publicAssets.summary.remoteVerifiedBrandingMembers, successor.registryTransition.summary.remoteVerifiedBrandingMembers);

const predecessorProjection = structuredClone(publicAssets);
predecessorProjection.assets = predecessorProjection.assets.filter(asset => !brandingCodeSet.has(asset.asset_code));
predecessorProjection.summary.registeredAssetRecords = successor.registryTransition.predecessorRecordCount;
predecessorProjection.summary.concreteRenderableMembers = successor.predecessor.concreteRenderableMembers;
delete predecessorProjection.summary.canonicalBrandingMembers;
delete predecessorProjection.summary.remoteVerifiedBrandingMembers;
assert.equal(predecessorProjection.assets.length, successor.registryTransition.predecessorRecordCount);
assert.equal(digestText(`${JSON.stringify(predecessorProjection, null, 2)}\n`), successor.registryTransition.predecessorProjectionSha256, 'W5 Public Asset Registry predecessor projection changed');

assert.equal(visualRegistry.assets.length, successor.visualRegistryTransition.recordCount);
assert.equal(sha256(paths.visualRegistry), successor.visualRegistryTransition.currentSuccessorSha256);
assert.deepEqual(successor.visualRegistryTransition.changedAssetCodes, brandingCodes);
assert.deepEqual(successor.visualRegistryTransition.allowedChangedFields, [
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
assert.equal(projectedVisualBranding.length, successor.visualRegistryTransition.changedMemberCount);
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
assert.equal(digestText(`${JSON.stringify(visualPredecessorProjection, null, 2)}\n`), successor.visualRegistryTransition.predecessorProjectionSha256, 'W5 Visual Registry predecessor projection changed outside the governed five-branding transition');

for (const asset of brandingAssets) {
  const authority = visualRegistry.assets.find(record => record.assetCode === asset.asset_code);
  assert.ok(authority, `Missing existing branding authority: ${asset.asset_code}`);
  assert.equal(authority.assetType, successor.brandingAuthority.assetType);
  assert.equal(authority.r2.objectKey, asset.object_key);
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
  assert.equal(asset.family, 'BRANDING');
  assert.equal(asset.source_registry, paths.visualRegistry);
  assert.equal(asset.format, successor.brandingAuthority.publicDeliveryFormat);
  assert.equal(asset.width, successor.brandingAuthority.width);
  assert.equal(asset.height, successor.brandingAuthority.height);
  assert.equal(asset.aspect_ratio, successor.brandingAuthority.aspectRatio);
  assert.equal(asset.status, 'remote-verified');
  assert.equal(asset.verification, 'verified-remote-head-get');
  assert.equal(asset.canonical_state, 'BRI_BRANDING_OWNER_SUPPLIED_REMOTE_VERIFIED_HUMAN_ACCEPTANCE_PENDING');
  assert.equal(asset.remote.http_status, successor.remoteEvidenceBoundary.requiredHttpStatus);
  assert.equal(asset.remote.content_type, successor.remoteEvidenceBoundary.requiredContentType);
  assert.ok(Number(asset.remote.content_length) > 0);
  assert.ok(asset.remote.etag);
  assert.ok(Number.isFinite(Date.parse(asset.remote.verified_at)));
  assert.ok(asset.remote.requested_url.endsWith(asset.object_key));
}
assert.equal(successor.remoteEvidenceBoundary.visualPlanningRecordsAdvancedByExistingBriAuthority, true);
assert.equal(successor.remoteEvidenceBoundary.brandingOwnerSuppliedReviewInherited, true);
assert.equal(successor.remoteEvidenceBoundary.brandingOwnerSuppliedReviewRecords, 5);
assert.equal(successor.remoteEvidenceBoundary.booksResolverBindingsInherited, 5);
assert.equal(successor.remoteEvidenceBoundary.booksConsumerAcceptanceClaimed, false);
assert.equal(successor.remoteEvidenceBoundary.homepageHumanReviewPromoted, false);
assert.equal(successor.remoteEvidenceBoundary.homepageConsumerPromoted, false);
assert.equal(successor.successorPolicy.historicalHpc2W5EvidenceRewritten, false);
assert.equal(successor.successorPolicy.historicalCheckerRewritten, false);
assert.equal(successor.successorPolicy.visualRegistryUnexpectedFieldChangeFailsClosed, true);
assert.equal(successor.successorPolicy.visualRegistryMemberAdditionRemovalOrReorderFailsClosed, true);
assert.equal(successor.boundaries.homepageDomChanged, false);
assert.equal(successor.boundaries.homepageNarrativeChanged, false);
assert.equal(successor.boundaries.homepageRuntimeChanged, false);
assert.equal(successor.boundaries.realityRouteActivated, false);
assert.equal(successor.boundaries.askHomepageConsumerActivated, false);
assert.equal(successor.boundaries.humanDecisionCreated, false);
assert.equal(successor.boundaries.browserDecisionCreated, false);
assert.equal(ckaSuccessorEvidence.currentConsumerObservations.hrefCount, 1);
assert.equal(ckaSuccessorEvidence.currentConsumerObservations.formCountInH04, 0);
assert.equal(ckaSuccessorEvidence.currentConsumerObservations.directApiCallsFromHomepageRuntime, 0);
assert.equal(ckaSuccessorEvidence.boundaryObservations.realityRouteActivated, false);
assert.equal(ckaSuccessorEvidence.decisionObservations.humanAcceptanceClaimed, false);
assert.equal(ckaSuccessorEvidence.decisionObservations.browserAcceptanceClaimed, false);

const publicFigure = publicAssets.assets.find(asset => asset.asset_code === 'FIG-056');
const visualFigure = visualRegistry.assets.find(asset => asset.assetCode === 'FIG-056');
const humanFigure = humanReview.records.find(record => record.assetCode === 'FIG-056');
assert.equal(publicFigure.status, 'remote-verified');
assert.equal(publicFigure.object_key, contract.figureAsset.objectKey);
assert.equal(publicFigure.remote.http_status, 200);
assert.equal(publicFigure.remote.svg.validSvg, true);
assert.equal(publicFigure.remote.svg.scriptPresent, false);
assert.equal(publicFigure.remote.svg.externalActiveContentPresent, false);
assert.equal(visualFigure.productionSpec.uiPolicy, 'NO_FAKE_UI');
assert.equal(visualFigure.r2.remoteVerified, true);
assert.equal(visualFigure.machineAcceptance.status, 'MACHINE_ACCEPTED');
assert.equal(humanFigure.decision, 'ACCEPTED');
assert.equal(humanFigure.visualAssetAcceptedOnly, true);
assert.equal(humanFigure.knowledgeApproved, false);
assert.equal(humanFigure.methodApproved, false);
assert.equal(humanFigure.professionalJudgmentApproved, false);
assert.equal(humanFigure.routeActivated, false);

const en = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeEn}`).href}?hpc2w5current`)).default;
const zh = (await import(`${pathToFileURL(`${process.cwd()}/${paths.localeZh}`).href}?hpc2w5current`)).default;
for (const [key, expected] of Object.entries(contract.copy.en)) assert.equal(en.discover.phiosRuntime[key], expected, `EN H04 copy drift: ${key}`);
for (const [key, expected] of Object.entries(contract.copy['zh-Hans'])) assert.equal(zh.discover.phiosRuntime[key], expected, `ZH H04 copy drift: ${key}`);
const stageKeys = ['input', 'realityModel', 'reading', 'navigation', 'action', 'outcome', 'review', 'continuity'];
for (const [index, stage] of contract.runtimeCycle.stages.entries()) {
  assert.equal(en.discover.phiosRuntime.stages[stageKeys[index]].label, stage.en);
  assert.equal(zh.discover.phiosRuntime.stages[stageKeys[index]].label, stage['zh-Hans']);
}
assert.match(en.discover.phiosRuntime.ask.copy, /no generic chat authority/);
assert.match(zh.discover.phiosRuntime.ask.copy, /不建立持久案例/);
assert.equal(en.discover.phiosRuntime.ask.state, 'Ask PHI OS');
assert.equal(zh.discover.phiosRuntime.ask.state, '向 PHI OS 提问');

for (const phrase of ['Keep what people value.', 'Reality Resolution', 'Continuity', 'The intelligence is not one model. It is an architecture.', 'Reading → Navigation']) assert.ok(v8Source.includes(phrase), `V8 source phrase missing: ${phrase}`);
const reservedBlocks = v8Manifest.semanticBlocks.filter(block => contract.v8AndRouteBoundary.sourceBlocks.includes(block.blockCode));
assert.equal(reservedBlocks.length, 4);
for (const block of reservedBlocks) {
  assert.equal(block.sourceState, 'PRESERVED_CANONICAL_SOURCE_NOT_PRODUCTION_CONSUMER');
  assert.equal(block.successorVerified, false);
  assert.equal(block.deletionAllowedFromHomepage, false);
  assert.equal(block.actualScene, null);
}

assert.equal(acceptance.counts.implementedScenes, 4);
assert.equal(acceptance.counts.runtimeExecutions, 0);
assert.equal(acceptance.counts.functionalAskElements, 0);
assert.equal(acceptance.counts.routesActivated, 0);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(freeze.preservedBoundaries.h05H09Implemented, false);
assert.equal(freeze.preservedBoundaries.askHomepageConsumerCompleted, false);
assert.equal(freeze.preservedBoundaries.runtimeExecutionActivated, false);
assert.equal(freeze.preservedBoundaries.globalProductionAcceptanceCreated, false);
assert.equal(freeze.successorRules.nextWork, 'HPC2-W6_FIRST_INTERACTION_COMPOSITION');
assert.equal(/href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL"/.test(h04Html), true);
assert.equal(/href=["']\/reality\/?["']/.test(html), false);

assert.equal(pkg.scripts['check:hpc2-w4-frozen'], 'node scripts/check-hpc2-w4.mjs');
assert.equal(pkg.scripts['check:hpc2-w4'], 'node scripts/check-hpc2-w4-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w5-frozen'], 'node scripts/check-hpc2-w5-frozen-artifacts.mjs');
assert.equal(pkg.scripts['check:hpc2-w5'], 'node scripts/check-hpc2-w5-current.mjs');
assert.ok(pkg.scripts['check:hpc2'].endsWith('&& npm run check:hpc2-w5'));
assert.ok(pkg.scripts['check:bfr-h'].endsWith('&& npm run check:hpc2-w5'));

console.log('HPC2-W5 current successor: ACCEPTED (repository implementation)');
console.log('  scenes: H01-H03 preserved + H04 implemented; H05-H09 remain deferred');
console.log('  composition: 8-stage runtime cycle + 4 values + 4 authority boundaries; execution/persistence = 0');
console.log('  visual: FIG-056 remote-verified and rendered through the existing resolver with fail-closed states');
console.log('  registry: frozen 144-member observation preserved; additive 5-member branding successor reconciled at 149 records');
console.log('  visual authority: 152 identities preserved; 5 existing branding records advanced by BRI, Books consumer acceptance remains pending');
console.log('  Ask PHI OS: historical W5 reservation preserved; one H04 link is active under CKA-W0');
console.log('  Ask boundary: no Homepage form/API call, no persistent case, Method execution or forced Reality Journey');
console.log('  V8: 4 source blocks preserved; promotions/deletions = 0; Human/browser acceptance pending');
