import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const j = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => assert.ok(fs.existsSync(p), `missing file: ${p}`);
const BASE = '402f2e395845782c0833d057b3ce91d33cdd6559';
const PHASE_A = 'b872c4463c3e34e180cea53061c1ddc8e5b6f92c';

const paths = {
  sourceV1: 'content/interpretation/tarot/registries/tarot-source-registry-v1.json',
  sourceV2: 'content/interpretation/tarot/registries/tarot-source-registry-v2.json',
  rights: 'content/interpretation/tarot/rights/tarot-source-rights-registry-v1.json',
  tiers: 'content/interpretation/tarot/registries/tarot-source-tier-registry-v1.json',
  seed: 'content/interpretation/tarot/corpus/tarot-public-domain-seed-v1.json',
  privateRefs: 'content/interpretation/tarot/research/tarot-private-reference-source-registry-v1.json',
  successor: 'content/interpretation/tarot/reconciliation/tarot-source-authority-current-successor-v2.json',
  acceptance: 'content/production/symbolic-method/acceptance/tarot-product-activation-phase-b-acceptance-v1.json',
  phaseA: 'content/production/symbolic-method/acceptance/tarot-product-activation-phase-a-acceptance-v1.json',
  phaseAScope: 'content/production/symbolic-method/contracts/tarot-product-activation-scope-v1.json',
  corpusV1: 'content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json',
  tariState: 'content/interpretation/tarot/reconciliation/tarot-interpretation-runtime-state-successor-v1.json',
  tariAcceptance: 'content/interpretation/tarot/acceptance/tarot-interpretation-reality-acceptance-v1.json',
  pcm: 'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
  publicCatalog: 'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for (const p of Object.values(paths)) exists(p);

const sourceV1 = j(paths.sourceV1);
const sourceV2 = j(paths.sourceV2);
const rights = j(paths.rights);
const tiers = j(paths.tiers);
const seed = j(paths.seed);
const privateRefs = j(paths.privateRefs);
const successor = j(paths.successor);
const acceptance = j(paths.acceptance);
const phaseA = j(paths.phaseA);

// Phase A is a frozen predecessor, not silently rewritten onto the new HEAD.
assert.equal(phaseA.baselineCommit, PHASE_A);
assert.equal(phaseA.status, 'ACCEPTED_CURRENT_AUTHORITY_RECONCILIATION_NO_ACTIVATION');
assert.equal(phaseA.nextPhase, 'PHASE_B_TAROT_SOURCE_CORPUS_GOVERNANCE');

// TPA-W3 — source registry successor and source tier governance.
assert.equal(sourceV2.baselineCommit, BASE);
assert.equal(sourceV2.registryCode, 'TAROT_SOURCE_REGISTRY');
assert.equal(sourceV2.registryVersion, '2.0.0');
assert.equal(sourceV2.status, 'ACTIVE_SOURCE_GOVERNANCE_SUCCESSOR_RUNTIME_REBIND_NOT_YET_GRANTED');
assert.equal(sourceV2.predecessor.path, paths.sourceV1);
assert.equal(sourceV2.predecessor.sha256, sha(paths.sourceV1));
assert.equal(sourceV2.governance.runtimeConsumerRebindDeferredTo, 'TPA-W21');
assert.equal(sourceV2.governance.existingTariV1ConsumerMayContinueUsingPredecessorRegistry, true);
assert.equal(sourceV2.governance.sourceAdmissionDoesNotGrantProductionExecution, true);
assert.equal(sourceV2.governance.unknownRightsFailClosed, true);
assert.equal(sourceV2.sources.length, 5);
assert.equal(new Set(sourceV2.sources.map(x => x.sourceId)).size, 5, 'duplicate Phase B sourceId');

const waite = sourceV2.sources.find(x => x.sourceId === 'TAR-SRC-WAITE-PKT-1910');
assert.ok(waite, 'legacy Waite source identity must be preserved');
assert.ok(sourceV1.sources.some(x => x.sourceId === waite.sourceId), 'Waite legacy source identity no longer matches v1');
assert.equal(waite.legacyIdentityPreserved, true);
assert.equal(waite.rightsClass, 'PUBLIC_DOMAIN');
assert.equal(waite.authorityTier, 'T1');
assert.equal(waite.declaredCardCoverage, 78);
assert.equal(waite.meaningAuthority, 'SOURCE_BOUND_ONLY');
assert.equal(waite.provenance.witnessPageCount, 353);
assert.ok(waite.provenance.landingUrl.startsWith('https://en.wikisource.org/'));
assert.ok(waite.provenance.pdfWitnessUrl.startsWith('https://en.wikisource.org/'));

const artwork = sourceV2.sources.find(x => x.sourceId === 'TAR-ART-RWS-ORIGINAL-PD');
assert.ok(artwork);
assert.equal(artwork.rightsClass, 'PUBLIC_DOMAIN');
assert.equal(artwork.authorityTier, 'T0');
assert.equal(artwork.declaredCardCoverage, 78);
assert.equal(artwork.meaningAuthority, false);
assert.equal(artwork.provenance.modernRecolorWarning, 'SOME_COLORIZED_VERSIONS_MAY_REMAIN_COPYRIGHTED');
assert.ok(artwork.provenance.categoryUrl.startsWith('https://commons.wikimedia.org/'));

assert.equal(tiers.baselineCommit, BASE);
assert.deepEqual(tiers.tiers.map(x => x.tier), ['T0','T1','T2','T3','T4','T5']);
for (const tier of tiers.tiers) assert.equal(tier.automaticCanonicalPromotion, false, `${tier.tier} must not auto-promote`);
assert.equal(tiers.promotionRule, 'SOURCE_TIER_NEVER_OVERRIDES_RIGHTS_CLASS_OR_HUMAN_ADMISSION');
assert.ok(tiers.tiers.find(x => x.tier === 'T4').forbiddenRole.includes('PUBLIC_CORPUS_INGESTION'));
assert.ok(tiers.tiers.find(x => x.tier === 'T5').forbiddenRole.includes('SCRAPE_TO_CANONICAL'));

// TPA-W4 — rights classification is explicit and fail-closed.
assert.equal(rights.baselineCommit, BASE);
assert.equal(rights.status, 'FROZEN_RIGHTS_CLASSIFICATION_FAIL_CLOSED');
assert.deepEqual(rights.rightsClasses.map(x => x.rightsClass), ['PUBLIC_DOMAIN','OWNED_LICENSED','PRIVATE_REFERENCE','EXTRACTION_RESTRICTED','UNKNOWN_RIGHTS']);
for (const klass of ['PRIVATE_REFERENCE','EXTRACTION_RESTRICTED','UNKNOWN_RIGHTS']) {
  const entry = rights.rightsClasses.find(x => x.rightsClass === klass);
  assert.equal(entry.publicCorpusAdmissionAllowed, false, `${klass} public admission must fail closed`);
  assert.equal(entry.publicVendoringAllowed, false, `${klass} public vendoring must fail closed`);
}
assert.equal(rights.globalRules.availableOnlineDoesNotMeanPublicDomain, true);
assert.equal(rights.globalRules.freePdfDoesNotMeanPublicDomain, true);
assert.equal(rights.globalRules.userPossessionDoesNotTransferCopyright, true);
assert.equal(rights.globalRules.modernRecolorDoesNotInheritOriginalRwsPublicDomainAutomatically, true);
assert.equal(rights.sourceAssessments.length, 5);
const assessmentById = new Map(rights.sourceAssessments.map(x => [x.sourceId, x]));
assert.equal(assessmentById.get('TAR-SRC-WAITE-PKT-1910').publicAdmission, true);
assert.equal(assessmentById.get('TAR-ART-RWS-ORIGINAL-PD').publicAdmission, true);
for (const id of ['TAR-SRC-PRIV-LUA-01','TAR-SRC-PRIV-LUA-02','TAR-SRC-PRIV-LUA-03']) {
  assert.equal(assessmentById.get(id).rightsClass, 'PRIVATE_REFERENCE');
  assert.equal(assessmentById.get(id).underlyingRightsStatus, 'UNKNOWN_RIGHTS');
  assert.equal(assessmentById.get(id).publicAdmission, false);
}

// TPA-W5 — public-domain seed admits provenance for extraction, not a finished 78-card corpus or production execution.
assert.equal(seed.baselineCommit, BASE);
assert.equal(seed.status, 'ADMITTED_EXTRACTION_SEED_NOT_YET_RUNTIME_BOUND');
assert.equal(seed.deckFamily, 'RWS_1909_STRUCTURAL_FAMILY@1.0.0');
assert.equal(seed.textSeed.sourceId, 'TAR-SRC-WAITE-PKT-1910');
assert.equal(seed.textSeed.rightsClass, 'PUBLIC_DOMAIN');
assert.equal(seed.textSeed.declaredPlateCount, 78);
assert.equal(seed.artworkSeed.sourceId, 'TAR-ART-RWS-ORIGINAL-PD');
assert.equal(seed.artworkSeed.expectedCardCount, 78);
assert.equal(seed.artworkSeed.originalArtworkOnly, true);
assert.equal(seed.artworkSeed.modernRecolorsExcludedUnlessSeparatelyCleared, true);
assert.equal(seed.admissionRules.seedCreatesUniversalMeaning, false);
assert.equal(seed.admissionRules.seedGrantsProductionExecution, false);
assert.equal(seed.admissionRules.seedChangesRunAllowed, false);
assert.equal(seed.admissionRules.complete78CardVisualCorpusCreatedInThisPhase, false);
assert.equal(seed.admissionRules.complete78CardWaiteMappingCreatedInThisPhase, false);
assert.equal(seed.admissionRules.runtimeConsumerReboundInThisPhase, false);

// TPA-W6 — the three user-library scans are private research references only.
assert.equal(privateRefs.baselineCommit, BASE);
assert.equal(privateRefs.status, 'PRIVATE_REFERENCE_REGISTERED_NOT_PUBLICLY_INGESTED');
assert.equal(privateRefs.sources.length, 3);
const expectedPrivate = {
  'TAR-SRC-PRIV-LUA-01': ['T081-LUA【塔罗解牌研究所】繁体横版彩色扫描.pdf','ad7b35655ad2d83121ea3a204966c64e3e27bc51d2c8715776794457f08bff4c',46227503,227],
  'TAR-SRC-PRIV-LUA-02': ['T082-LUA【塔罗解牌研究所2】繁体横版彩色扫描.pdf','56c08be45149f930180a48b96b24a595432f768ee7dca36a5f584783374384bf',46249698,227],
  'TAR-SRC-PRIV-LUA-03': ['LUA 塔罗解牌研究所3 繁体横版.pdf','72195ba0ecb906bba250e2d0b4d25571effb88c2a962c319abb14b34e16a1cf5',54836519,163]
};
for (const entry of privateRefs.sources) {
  const exp = expectedPrivate[entry.sourceId]; assert.ok(exp, `unexpected private source ${entry.sourceId}`);
  assert.equal(entry.libraryFilename, exp[0]); assert.equal(entry.rawFileSha256, exp[1]); assert.equal(entry.sizeBytes, exp[2]); assert.equal(entry.pageCountFromPdfInfo, exp[3]);
}
assert.equal(privateRefs.rightsBoundary.rightsClass, 'PRIVATE_REFERENCE');
assert.equal(privateRefs.rightsBoundary.underlyingRightsStatus, 'UNKNOWN_RIGHTS');
assert.equal(privateRefs.rightsBoundary.publicVendoringAllowed, false);
assert.equal(privateRefs.rightsBoundary.publicCorpusIngestionAllowed, false);
assert.equal(privateRefs.rightsBoundary.publicQuotationAllowedByDefault, false);
assert.equal(privateRefs.rightsBoundary.internalCoverageAuditAllowed, true);
assert.equal(privateRefs.rightsBoundary.sourceTextBundlingAllowed, false);
assert.equal(privateRefs.copyProvenance.possessionDoesNotEstablishCopyrightLicense, true);
assert.equal(privateRefs.copyProvenance.scanWatermarkOrRedistributionMarkersDoNotGrantRights, true);

const privateInV2 = sourceV2.sources.filter(x => x.authorityTier === 'T4');
assert.equal(privateInV2.length, 3);
for (const entry of privateInV2) {
  assert.equal(entry.rightsClass, 'PRIVATE_REFERENCE');
  assert.equal(entry.underlyingRightsStatus, 'UNKNOWN_RIGHTS');
  assert.equal(entry.publicVendoringAllowed, false);
  assert.equal(entry.corpusExtractionAllowed, false);
  assert.equal(entry.meaningAuthority, 'NOT_ADMITTED_TO_PUBLIC_RUNTIME');
}

// Successor pins predecessors and does not silently rebind TARI or promote production.
assert.equal(successor.baselineCommit, BASE);
assert.equal(successor.status, 'SOURCE_GOVERNANCE_SUCCESSOR_ACTIVE_RUNTIME_REBIND_DEFERRED');
assert.equal(successor.phaseAPredecessor.baselineCommit, PHASE_A);
assert.equal(successor.phaseAPredecessor.acceptanceSha256, sha(paths.phaseA));
assert.equal(successor.phaseAPredecessor.scopeSha256, sha(paths.phaseAScope));
for (const item of Object.values(successor.preservedPredecessors)) {
  assert.equal(sha(item.path), item.sha256, `preserved predecessor drift: ${item.path}`);
}
assert.equal(successor.runtimeBinding.governanceRegistryV2IsCurrentForSourceAdmission, true);
assert.equal(successor.runtimeBinding.existingTariV1RuntimeConsumerRebound, false);
assert.equal(successor.runtimeBinding.existingTariV1MayContinueReadingSourceRegistryV1, true);
assert.equal(successor.runtimeBinding.rebindRequiredAt, 'TPA-W21');
assert.equal(successor.runtimeBinding.newUniversalMeaningAuthorityCreated, false);
assert.equal(successor.runtimeBinding.sourceBlendingGranted, false);

assert.equal(successor.productionBoundary.pcmSha256, sha(paths.pcm));
assert.equal(successor.productionBoundary.publicMethodCatalogSha256, sha(paths.publicCatalog));
for (const k of ['runAllowedChanged','productionCapabilityPromoted','persistenceActivated','humanAcceptanceClaimed','liveBrowserAcceptanceClaimed','liveProductionShaAlignmentClaimed']) assert.equal(successor.productionBoundary[k], false, `${k} must remain false in Phase B`);

const pcm = j(paths.pcm);
const tarPcm = pcm.capabilities.find(x => x.methodRuntime?.methodCode === 'TAROT');
assert.ok(tarPcm); assert.equal(tarPcm.classification, 'REGISTERED_NOT_IMPLEMENTED'); assert.equal(tarPcm.userExecutable, false); assert.equal(tarPcm.productionAccepted, false);
const catalog = j(paths.publicCatalog);
const publicTarot = catalog.methods.find(x => x.methodCode === 'TAROT');
assert.ok(publicTarot); assert.equal(publicTarot.runAllowed, false);

assert.equal(acceptance.baselineCommit, BASE);
assert.equal(acceptance.status, 'ACCEPTED_SOURCE_CORPUS_GOVERNANCE_NO_PRODUCT_ACTIVATION');
for (const [k,v] of Object.entries(acceptance.accepted)) assert.equal(v, true, `${k} not accepted`);
assert.equal(acceptance.nextPhase, 'PHASE_C_TAR_VIS_CANONICAL_VISUAL_CORPUS');

const pkg = j('package.json');
assert.equal(pkg.scripts['check:tarot-product-activation-phase-b'], 'npm run check:tarot-product-activation-phase-a && node scripts/check-tarot-product-activation-phase-b.mjs');

console.log('✓ TPA PHASE B / TPA-W3–W6 passed: Tarot source registry v2, rights classes, T0–T5 source tiers, public-domain Waite/RWS seed, and three private LUA research references are governed.');
console.log('  Waite legacy source identity is preserved; original RWS artwork is admitted only as a rights-cleared visual seed; modern recolors are excluded unless separately cleared.');
console.log('  LUA scans remain PRIVATE_REFERENCE / UNKNOWN_RIGHTS with no public vendoring, public corpus ingestion, or runtime meaning authority.');
console.log('  TARI v1 is not rebound yet, PCM/public runAllowed remain fail-closed, and Phase C TAR-VIS is the next gate.');
