import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASELINE = 'a6395ad926ce1bcd318b596d6f6ce028f5b96ae9';
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readText = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const sha256 = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

const contractPath = 'content/web-production/contracts/client-surface-global-invariants-v1.json';
const registryPath = 'content/web-production/registries/client-surface-global-invariant-enforcement-v1.json';
const reconciliationPath = 'content/web-production/reconciliation/client-surface-global-invariants-a6395ad-reconciliation-v1.json';
const acceptancePath = 'content/web-production/acceptance/client-surface-global-invariants-acceptance-v1.json';
const freezePath = 'content/web-production/freeze/client-surface-global-invariants-freeze-v1.json';

for (const rel of [contractPath, registryPath, reconciliationPath, acceptancePath, freezePath]) {
  assert.ok(exists(rel), `${rel} missing`);
}

const contract = readJson(contractPath);
const registry = readJson(registryPath);
const reconciliation = readJson(reconciliationPath);
const acceptance = readJson(acceptancePath);
const freeze = readJson(freezePath);

for (const artifact of [contract, registry, reconciliation, acceptance, freeze]) {
  assert.equal(artifact.work, 'CLIENT-SURFACE-INV-01-INV-10');
  assert.equal(artifact.baselineCommit, BASELINE);
}

assert.equal(contract.status, 'ACTIVE_CROSS_AUTHORITY_INVARIANT_CONTRACT');
assert.equal(contract.authorityBoundary.upstreamContractsMutatedByThisWork, false);
assert.equal(contract.authorityBoundary.secondRuntimeCreated, false);
assert.equal(contract.authorityBoundary.productionSurfaceActivationGranted, false);
for (const forbiddenAuthority of [
  'CANONICAL_KNOWLEDGE','METHOD_PRODUCTION_ELIGIBILITY','METHOD_EXECUTION','METHOD_PROJECTION',
  'INTERPRETATION','CANONICAL_MEANING','READING','REALITY_CASE','REALITY_VERSION',
  'REALITY_CONTINUITY','PROFESSIONAL_JUDGMENT','PDS','CPR','WPR_V1'
]) assert.ok(contract.authorityBoundary.doesNotOwn.includes(forbiddenAuthority), `Missing authority boundary: ${forbiddenAuthority}`);

const expectedCodes = Array.from({ length: 10 }, (_, i) => `INV-${String(i + 1).padStart(2, '0')}`);
assert.deepEqual(contract.invariants.map(x => x.code), expectedCodes);
assert.deepEqual(registry.entries.map(x => x.code), expectedCodes);
assert.equal(registry.entries.every(x => x.mayClaimProductionCompleteNow === false), true);
assert.equal(contract.globalRules.allTenInvariantsMustRemainEnforced, true);
assert.equal(contract.globalRules.downstreamCheckerMayStrengthenButNotWeakenWithoutVersionedSuccessor, true);
assert.equal(contract.globalRules.foundationAcceptanceDoesNotEqualProductionAcceptance, true);

const inv = Object.fromEntries(contract.invariants.map(x => [x.code, x]));

// INV-01 — backend existence never proves actual Client consumption.
assert.equal(inv['INV-01'].statement, 'BACKEND_EXISTS_NOT_EQUAL_FRONTEND_CONSUMES_IT');
assert.ok(inv['INV-01'].requirements.includes('SILENT_ORPHAN_FORBIDDEN'));
const runtimeConsumption = readJson('content/web-production/registries/wpr-runtime-consumption-registry-v1.json');
assert.equal(runtimeConsumption.orphanPolicy.productionRuntimeWithNoSurfaceConsumerRequiresExplicitNoWebSurfaceByDesign, true);
assert.equal(runtimeConsumption.orphanPolicy.runtimeExistenceDoesNotCreateCustomerAvailability, true);
for (const entry of runtimeConsumption.entries) {
  if (Array.isArray(entry.surfaceConsumers) && entry.surfaceConsumers.length === 0) {
    assert.match(String(entry.webProjectionState || ''), /NONE_BY_DESIGN/, `Silent runtime orphan: ${entry.runtimeCode}`);
  }
}

// INV-02 — Registry + Resolver is predecessor evidence, not a Visible claim.
assert.deepEqual(inv['INV-02'].requiredLineage, ['R2_ASSET','REGISTRY','RESOLVER','CONSUMER','VISIBLE']);
const publicAssets = readJson('content/registry/public-assets.json');
const assetContract = readJson('content/web-production/contracts/wpr-public-asset-resolution-v1.json');
assert.equal(publicAssets.bucket, 'phios-public-assets');
assert.equal(assetContract.resolver.implementation, 'assets/js/runtime/web-production/asset-resolver.js');
assert.equal(assetContract.resolutionRules.hardCodedGovernedAssetPathForbidden, true);
assert.equal(assetContract.nonActivation.surfaceActivation, false);
assert.ok(exists(assetContract.resolver.implementation));
assert.ok(readText(assetContract.resolver.implementation).includes('resolvePublicAssetForWeb'));

// INV-03 / INV-04 — Homepage composition is not one section per runtime.
assert.equal(inv['INV-03'].statement, 'HOMEPAGE_CAPABILITY_COVERAGE_HIGH_NOT_EQUAL_INFORMATION_DENSITY_HIGH');
assert.ok(inv['INV-03'].forbidden.includes('ONE_HOMEPAGE_SECTION_PER_BACKEND_CAPABILITY'));
assert.deepEqual(inv['INV-04'].allowedDeclarations, ['HOME_SCENE_CONSUMER','NONE_BY_DESIGN']);
const homepage = readJson('content/web-production/composition/public/homepage-composition-v1.1.json');
assert.ok(Array.isArray(homepage.sections) && homepage.sections.length > 0);
assert.ok(homepage.sections.length < runtimeConsumption.entries.length, 'Homepage appears runtime-per-section; successor reconciliation required.');

// INV-05 — Ask PHI OS remains question-scoped and non-authoritative, never generic chat authority.
assert.deepEqual(inv['INV-05'].requiredFlow, ['QUESTION','GROUNDED_ANSWER','OBSERVATION','UNKNOWN','RELATED_KNOWLEDGE','CONTEXT_IF_NEEDED','JOURNEY_ONLY_WHEN_COMPLEXITY_REQUIRES']);
const kapAnswer = readJson('content/knowledge/answer-projection/acceptance/kap-w11-w17-answer-composition-acceptance-v1.json');
assert.equal(kapAnswer.acceptance.askPhiosClientSurfaceActive, true);
assert.equal(kapAnswer.acceptance.questionScopedAnswerRemainsNonAuthoritative, true);
assert.equal(kapAnswer.acceptance.persistentCaseCreated, false);
assert.equal(kapAnswer.acceptance.mcdRequired, false);
assert.equal(kapAnswer.acceptance.realityJourneyRequired, false);

// INV-06 — simple/contextual questions do not become Reality Journey automatically.
const kapStop = readJson('content/knowledge/answer-projection/contracts/kap-w22-guided-stop-condition-contract-v1.json');
const kapComplexity = readJson('content/knowledge/answer-projection/acceptance/kap-w23-w25-reality-complexity-acceptance-v1.json');
assert.equal(kapStop.realityJourneyRule.automaticEscalation, false);
assert.equal(kapStop.realityJourneyRule.explicitEscalationConsentRequired, true);
assert.equal(kapComplexity.acceptedFacts.automaticRealityJourney, false);
assert.equal(kapComplexity.acceptedFacts.explicitEscalationConsentRequired, true);
assert.equal(kapComplexity.acceptedFacts.requirementNoKeepsAskOrGuidedReading, true);

// INV-07 — temporary Ask context is not a Canonical Reality Case.
const guidedContext = readJson('content/knowledge/answer-projection/contracts/kap-w20-guided-answer-context-contract-v1.json');
assert.equal(guidedContext.authorityClass, 'TEMPORARY_NON_CANONICAL_GUIDED_CONTEXT');
assert.equal(guidedContext.not, 'CANONICAL_CASE');
assert.equal(guidedContext.rules.persistentCaseCreated, false);
assert.equal(guidedContext.rules.contextMayExpireWithoutPersistence, true);
assert.equal(kapComplexity.acceptedFacts.realityTruthCreated, false);
assert.equal(kapComplexity.acceptedFacts.realityModelCreated, false);
assert.equal(kapComplexity.acceptedFacts.persistentCaseCreated, false);

// INV-08 — Ask cannot auto-execute Methods; MPA remains eligibility/dispatch authority.
assert.deepEqual(inv['INV-08'].requiredExecutionSequence, ['READINESS','DISCLOSURE','CONSENT','MPA_ELIGIBILITY','EXECUTION','NORMALIZATION']);
const kapMethodConsent = readJson('content/knowledge/answer-projection/contracts/kap-w18b-method-consent-gate-contract-v1.json');
const mpaConsent = readJson('content/professional/method-production-activation/contracts/mpa-consent-data-purpose-v1.json');
const mpaEligibility = readJson('content/professional/method-production-activation/contracts/mpa-production-eligibility-decision-v1.json');
const mcdProjection = readJson('content/professional/method-client-delivery/contracts/mcd-5-canonical-method-projection-contract-v1.json');
const mcdAcceptance = readJson('content/professional/method-client-delivery/acceptance/mcd-8-production-acceptance-v1.json');
assert.equal(kapMethodConsent.rules.allMethodsMayAutoExecute, false);
assert.equal(kapMethodConsent.rules.guidedReadingMayExecuteMethod, false);
assert.equal(kapMethodConsent.rules.clientOptInRequired, true);
assert.equal(mpaConsent.rules.singleGlobalConsentForbidden, true);
assert.equal(mpaConsent.rules.withdrawnConsentCannotExecute, true);
assert.equal(mpaEligibility.authority.ownsProductionEligibilityDecision, true);
assert.equal(mpaEligibility.rules.missingEvidenceFailsClosed, true);
assert.equal(mcdAcceptance.acceptedFacts.mpaSoleDispatchAuthority, true);
assert.equal(mcdAcceptance.acceptedFacts.frontendCannotGrant, true);
assert.equal(mcdAcceptance.acceptedFacts.consentRequired, true);
assert.equal(mcdProjection.coreIsolation.canonicalProjectionIsOnlyClientContract, true);
assert.equal(mcdProjection.interpretation.included, false);

// INV-09 — public Ask keeps a guest path and creates no persistent case.
assert.deepEqual(inv['INV-09'].guestAllowed, ['ASK','ANSWER','LIMITED_FOLLOW_UP','RELATED_KNOWLEDGE','TEMPORARY_CONTEXT']);
assert.deepEqual(inv['INV-09'].accountOrEntitlementRequiredFor, ['HISTORY','SAVED_RESULT','METHOD_EXECUTION','CASE_PERSISTENCE','JOURNEY_CONTINUITY']);
const askEndpoint = readText('functions/api/ask-phios.js');
assert.ok(askEndpoint.includes('export async function onRequestGet'));
assert.equal(/requireAccount|requireAuth|Authorization|ACCOUNT_REQUIRED/.test(askEndpoint), false, 'Current public Ask endpoint unexpectedly account-gated.');
assert.equal(kapAnswer.acceptance.persistentCaseCreated, false);

// INV-10 — freeze no-deletion rule now; semantic migration evidence remains HPC2-W0 work.
assert.equal(inv['INV-10'].sourceArtifact, 'PHIOS-market-positioning-founder-v8-no-pricing.html');
assert.ok(inv['INV-10'].requirements.includes('EVERY_V8_SEMANTIC_BLOCK_HAS_SUCCESSOR_DESTINATION_BEFORE_HOMEPAGE_REMOVAL'));
assert.ok(inv['INV-10'].requirements.includes('SUCCESSOR_VERIFIED_BEFORE_DELETION_ALLOWED_FROM_HOMEPAGE'));
assert.ok(inv['INV-10'].downstreamEvidenceRequired.includes('HPC2-W0_V8_CONTENT_PRESERVATION_ACCEPTANCE'));

// Reconciliation evidence must remain exact at this foundation boundary.
assert.equal(reconciliation.status, 'RECONCILED_WITH_EXISTING_WPR_KAP_MPA_MCD_AUTHORITIES');
for (const evidence of reconciliation.upstreamEvidence) {
  assert.ok(exists(evidence.path), `Missing upstream evidence: ${evidence.path}`);
  assert.equal(sha256(evidence.path), evidence.sha256, `Upstream invariant evidence drift: ${evidence.path}`);
}
for (const value of Object.values(reconciliation.noMutation)) assert.equal(value, true);

// Acceptance deliberately freezes rules without pretending later phases are done.
assert.equal(acceptance.status, 'ACCEPTED_GLOBAL_INVARIANTS_FROZEN_NO_PRODUCTION_COMPLETION_CLAIM');
assert.equal(acceptance.acceptedFacts.invariantCount, 10);
assert.equal(acceptance.acceptedFacts.allTenRulesRepresented, true);
assert.equal(acceptance.acceptedFacts.duplicateAuthorityCreated, false);
assert.equal(acceptance.acceptedFacts.productionCompletionClaimed, false);
assert.equal(acceptance.acceptedFacts.bfrHProductionComplete, false);
assert.equal(acceptance.acceptedFacts.hpc2ProductionComplete, false);
assert.equal(acceptance.acceptedFacts.ckaProductionComplete, false);
assert.equal(Object.keys(acceptance.deferredEvidence).length, 10);

// Freeze exact invariant artifacts; package remains successor-extensible for later phase scripts.
assert.equal(freeze.status, 'FROZEN_CLIENT_SURFACE_GLOBAL_INVARIANTS_FOUNDATION');
for (const evidence of freeze.frozenOutputs) {
  assert.ok(exists(evidence.path), `Missing frozen output: ${evidence.path}`);
  assert.equal(sha256(evidence.path), evidence.sha256, `Global invariant frozen output drift: ${evidence.path}`);
}
assert.equal(freeze.authorityFreeze.noSecondKnowledgeAuthority, true);
assert.equal(freeze.authorityFreeze.noSecondMethodAuthority, true);
assert.equal(freeze.authorityFreeze.noSecondMeaningAuthority, true);
assert.equal(freeze.authorityFreeze.noSecondRealityAuthority, true);
assert.equal(freeze.authorityFreeze.noSecondProfessionalAuthority, true);

const pkg = readJson('package.json');
assert.equal(pkg.scripts['check:client-surface-invariants'], 'node scripts/check-client-surface-global-invariants.mjs');
assert.equal(pkg.scripts['check:bfr-h-invariants'], 'npm run check:client-surface-invariants');
assert.equal(pkg.scripts['check:client-surface'], 'npm run check:client-surface-invariants');
assert.equal(String(pkg.scripts.check || '').includes('check:client-surface'), false, 'Foundation invariant checker must not claim global Production acceptance.');

console.log('✓ Client Surface Global Invariants INV-01–INV-10 passed.');
console.log('✓ Existing WPR, KAP, MPA and MCD authorities are reconciled rather than duplicated.');
console.log('✓ R2 Registry/Resolver, Ask boundaries, temporary context, Method gates and guest Ask predecessor facts are enforced.');
console.log('✓ BFR-H/HPC2/CKA production completion remains explicitly deferred; no false Production acceptance is created.');
