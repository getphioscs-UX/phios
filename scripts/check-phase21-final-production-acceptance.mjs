import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const contract = readJson('content/production-integration/phase21/contracts/phase21-final-production-acceptance-contract-v1.json');
const acceptance = readJson('content/production-integration/phase21/acceptance/phase21-final-production-acceptance-v1.json');
const freeze = readJson('content/production-integration/phase21/freeze/phase21-final-production-acceptance-freeze-v1.json');
const phase20 = readJson('content/production-integration/phase20/acceptance/phase20-unified-production-integration-acceptance-v1.json');
const pkg = readJson('package.json');

const requiredDomains = {
  Knowledge: 4,
  Method: 5,
  HDR: 11,
  Input: 6,
  Projection: 3,
  'Guided Reading': 3,
  'Reality Journey': 3,
  'PJA / CAR': 3,
  AI: 6
};

assert.equal(contract.status, 'ACTIVE_FINAL_REPOSITORY_ACCEPTANCE_CONTRACT');
assert.deepEqual(contract.requiredDomains, requiredDomains);
assert.equal(contract.requiredFactCount, 44);
assert.equal(contract.rules.blockedStateMayNotBePromotedByFinalAcceptance, true);
assert.equal(contract.rules.globalProductionFreezeCreated, false);
assert.equal(phase20.status, 'PHASE20_UNIFIED_PRODUCTION_INTEGRATION_ACCEPTED_REPOSITORY_SCOPE');

assert.equal(acceptance.status, 'PHASE21_FINAL_PRODUCTION_ACCEPTED_REPOSITORY_SCOPE');
assert.deepEqual(Object.keys(acceptance.domains), Object.keys(requiredDomains));
let factCount = 0;
for (const [domain, requiredCount] of Object.entries(requiredDomains)) {
  const record = acceptance.domains[domain];
  const facts = Object.values(record.facts);
  assert.equal(facts.length, requiredCount, `${domain} fact count`);
  assert.equal(facts.every(Boolean), true, `${domain} has a failed fact`);
  factCount += facts.length;
  assert.ok(record.evidence.length > 0, `${domain} is missing evidence`);
  for (const evidencePath of record.evidence) assert.equal(fs.existsSync(evidencePath), true, `${domain} evidence missing: ${evidencePath}`);
}
assert.equal(factCount, 44);
assert.equal(acceptance.summary.acceptedFactCount, 44);
assert.equal(acceptance.summary.failedFactCount, 0);
assert.equal(acceptance.summary.allRequiredFactsPassed, true);
assert.equal(acceptance.acceptanceBoundary.globalProductionFreeze, false);
assert.equal(acceptance.acceptanceBoundary.liveDeploymentAccepted, false);
assert.equal(acceptance.acceptanceBoundary.hdrActivated, false);

const sourceBoundary = readJson('content/knowledge/source-access/contracts/knowledge-source-access-boundary-v1.json');
const ksar = readJson('content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json');
const kapFoundation = readJson('content/knowledge/answer-projection/acceptance/kap-w0-w3-authority-foundation-acceptance-v1.json');
const kapAnswer = readJson('content/knowledge/answer-projection/acceptance/kap-w11-w17-answer-composition-acceptance-v1.json');
assert.equal(kapAnswer.acceptance.deterministicAnswerActive, true);
assert.equal(kapAnswer.acceptance.realityJourneyRequired, false);
assert.equal(sourceBoundary.rules.completedManuscriptMayGroundClientKnowledge, true);
assert.equal(sourceBoundary.rules.manuscriptSourceMayAutoPublishArticle, false);
assert.equal(ksar.boundaries.manuscriptAccessDoesNotPublishArticle, true);
assert.equal(kapFoundation.acceptance.canonicalKnowledgeMutated, false);
assert.equal(kapAnswer.acceptance.questionScopedAnswerRemainsNonAuthoritative, true);
assert.equal(kapAnswer.acceptance.publicationCreated, false);

const mpa = readJson('content/professional/method-production-activation/acceptance/mpa-w29-full-acceptance-v1.json');
const mcd = readJson('content/professional/method-client-delivery/acceptance/mcd-8-production-acceptance-v1.json');
assert.equal(mcd.acceptedFacts.mpaSoleDispatchAuthority, true);
assert.equal(mcd.acceptedFacts.apiCannotGrant, true);
assert.equal(mcd.acceptedFacts.frontendCannotGrant, true);
assert.equal(mcd.acceptedFacts.adapterCannotGrant, true);
assert.equal(mcd.acceptedFacts.rendererCannotGrant, true);
assert.equal(mpa.acceptedFacts.blockedMethodCannotExecute, true);

const hdrAcceptance = readJson('content/professional/method-production-activation/acceptance/mpa-w24-hdr-boundary-acceptance-v1.json');
const hdrContract = readJson('content/professional/method-production-activation/contracts/mpa-hdr-restricted-boundary-v1.json');
const hdrHistory = readJson('content/professional/method-production-activation/registries/mpa-hdr-boundary-regression-freeze-v1.json');
const hdrRights = readJson('content/professional/method-production-activation/registries/mpa-hdr-rights-license-boundary-v1.json');
const hdrMapping = readJson('content/professional/method-production-activation/registries/mpa-hdr-mapping-authority-boundary-v1.json');
const hdrVocabulary = readJson('content/professional/method-production-activation/registries/mpa-hdr-public-vocabulary-boundary-v1.json');
assert.equal(hdrHistory.status, 'FROZEN_RESTRICTED_BOUNDARY_REGRESSION');
assert.ok(hdrHistory.frozenHistoricalAuthorities.some(item => item.path.endsWith('hdr-runtime-manifest-v1.json')));
assert.equal(hdrContract.calculationPolicy.astronomyMayBeSeparatelyValidated, true);
assert.equal(hdrAcceptance.acceptedFacts.hdrStateRemainsBlocked, true);
assert.equal(mcd.acceptedFacts.hdrProductionExecutionAllowed, false);
assert.equal(mcd.acceptedFacts.hdrProfessionalReleaseAllowed, false);
assert.equal(hdrAcceptance.acceptedFacts.publicRestrictedTermsAbsentFromAuditedSurfaces, true);
assert.ok(hdrMapping.forbiddenWorkarounds.includes('USE_LLM_OR_PROMPT_AS_MAPPING_AUTHORITY'));
assert.equal(hdrRights.repositoryEvidence.explicitCommercialLicenseArtifactPresent, false);
assert.equal(hdrRights.governanceDecision.commercialMethodActivationAllowed, false);
assert.equal(mcd.acceptedFacts.fixtureLeakage, 0);
assert.equal(mcd.acceptedFacts.hdrRenderer, 'VALIDATION_ONLY_NO_PRODUCTION_BINDING');
assert.equal(hdrVocabulary.presentationAuthority.renderPolicy, 'CONTROLLED_PUBLIC_LABEL_ONLY');
assert.equal(hdrVocabulary.surfaceAudit.restrictedRenderedTermCountExpected, 0);

const input = readJson('content/professional/method-client-delivery/acceptance/mcd-3-canonical-input-acceptance-v1.json');
const personal = readJson('content/professional/method-client-delivery/acceptance/mcd-7-personal-runtime-result-surface-acceptance-v1.json');
const consent = readJson('content/professional/method-production-activation/contracts/mpa-consent-data-purpose-v1.json');
const icr = readJson('content/runtime/input-case-runtime/contracts/icr-w0-w9-acceptance-contract-v1.json');
assert.equal(input.acceptedFacts.birthDataEnteredOnceContractually, true);
assert.equal(input.acceptedFacts.unknownBirthTimeRemainsNull, true);
assert.equal(input.acceptedFacts.historicalTimezoneAuthorityPinned, true);
assert.equal(input.acceptedFacts.coordinatesCannotBeGuessed, true);
assert.equal(consent.rules.withdrawnConsentCannotExecute, true);
assert.equal(consent.rules.expiredConsentCannotExecute, true);
assert.ok(icr.acceptanceGates.some(gate => gate.gate === 'NO_PERSISTENCE_OR_PRODUCTION_ACTIVATION' && gate.required));
assert.equal(personal.acceptedFacts.browserStorage, false);

const mr = readJson('content/professional/method-runtime/method-runtime-freeze-v1.json');
assert.equal(mr.freezeRules.calculationProjectionForbidden, true);
assert.equal(mr.freezeRules.projectionInterpretationSeparationRequired, true);
assert.equal(mcd.acceptedFacts.calculationProjectionInterpretationSeparated, true);

const guided = readJson('content/knowledge/answer-projection/acceptance/kap-w18-w22-guided-reading-acceptance-v1.json');
assert.equal(guided.acceptance.fullRealityIntakeAtEntry, false);
assert.equal(guided.acceptance.maximumClarifyingQuestions, 3);
assert.equal(guided.acceptance.methodAutoExecution, false);
assert.equal(guided.acceptance.methodClientOptInRequired, true);
assert.equal(guided.acceptance.hdrProductionConsumptionAllowed, false);
assert.equal(guided.acceptance.hdrValidationFixtureConsumptionAllowed, false);

const complexity = readJson('content/knowledge/answer-projection/acceptance/kap-w23-w25-reality-complexity-acceptance-v1.json');
const handoff = readJson('content/knowledge/answer-projection/acceptance/kap-w26-w29-reality-handoff-acceptance-v1.json');
const route = readJson('content/runtime/journey-runtime/phase19/rjx-phase19-route-strategy-v1.json');
const rjx = readJson('content/runtime/journey-runtime/phase19/rjx-phase19-w11-w18-technical-acceptance-v1.json');
assert.equal(complexity.acceptedFacts.w24RequirementTestDecisive, true);
assert.equal(complexity.acceptedFacts.requirementYesCreatesRealityJourneyCandidateOnly, true);
assert.equal(complexity.acceptedFacts.explicitEscalationConsentRequired, true);
assert.equal(route.runtimeStageEncodedInCanonicalUrl, false);
assert.equal(rjx.accepted.oneWorkspaceReviewSurface, true);
assert.equal(handoff.acceptedFacts.knowledgeGroundingBundleReferenceProjection, true);
assert.equal(handoff.acceptedFacts.knowledgeMethodProvenanceSeparated, true);
assert.equal(handoff.acceptedFacts.neitherAutomaticallyBecomesRealityTruth, true);

const pja = readJson('docs/pja/pja-w0-cross-system-boundary-freeze-v1.json');
const car = readJson('content/professional/canonical-asset-runtime/contracts/car-full-acceptance-v1.json');
const demand = readJson('content/knowledge/client-demand-feedback/mir10/acceptance/mir-10-acceptance-v1.json');
const priority = readJson('content/knowledge/client-demand-feedback/mir10/contracts/demand-priority-contract-v1.json');
assert.equal(pja.role.mayCreateCanonicalObjects, false);
assert.equal(pja.role.mayPromoteProjectionToCanonicalState, false);
assert.equal(car.invariants.carIsKnowledgeAuthority, false);
assert.equal(car.invariants.carIsMeaningAuthority, false);
assert.equal(demand.facts.clientDemandMayChangeProductionPriorityEvidence, true);
assert.equal(demand.facts.clientDemandMayChangeCanonicalTruth, false);
assert.equal(priority.rules.priorityIsTruth, false);
assert.equal(priority.rules.priorityMutatesCanonicalKnowledge, false);

const aiEligibility = readJson('content/knowledge/answer-projection/contracts/kap-w13-ai-eligibility-contract-v1.json');
const aiBoundary = readJson('content/knowledge/answer-projection/contracts/kap-w14-ai-authority-boundary-v1.json');
const aiRouting = readJson('content/knowledge/answer-projection/contracts/kap-w15-ai-cost-routing-contract-v1.json');
const aiBudget = readJson('content/knowledge/answer-projection/contracts/kap-w38-ai-budget-contract-v1.json');
assert.equal(aiEligibility.rules.aiRequiredStateExists, false);
assert.equal(mr.freezeRules.calculationAiForbidden, true);
assert.equal(mcd.acceptedFacts.aiRepairAllowed, false);
assert.ok(aiBoundary.aiMayNot.includes('CREATE_CANONICAL_KNOWLEDGE'));
assert.ok(aiBoundary.aiMayNot.includes('CREATE_METHOD_RESULT'));
assert.equal(aiBoundary.phase3.deterministicDeliveryIndependent, true);
assert.equal(aiRouting.rules.providerFailureMayDisableAskPhios, false);
assert.equal(aiBudget.rules.aiIsKnowledgeAuthority, false);
assert.equal(aiBudget.rules.deterministicFallbackRequired, true);

assert.equal(freeze.status, 'PHASE21_REPOSITORY_ACCEPTANCE_FROZEN_EXTERNAL_GATES_PRESERVED');
assert.equal(sha256(freeze.predecessor.path), freeze.predecessor.sha256, 'PHASE21_PREDECESSOR_DRIFT');
for (const artifact of freeze.artifacts) assert.equal(sha256(artifact.path), artifact.sha256, `PHASE21_DIGEST_DRIFT:${artifact.path}`);
assert.equal(freeze.accepted.factCount, 44);
assert.equal(freeze.accepted.hdrRemainsBlocked, true);
assert.equal(freeze.notClaimed.globalProductionFreeze, true);

assert.equal(pkg.scripts['check:phase21'], 'node scripts/check-phase21-final-production-acceptance.mjs');
const phase20Index = pkg.scripts.check.indexOf('npm run check:phase20');
const phase21Index = pkg.scripts.check.indexOf('npm run check:phase21');
assert.ok(phase20Index >= 0 && phase21Index > phase20Index, 'Top-level check must run PHASE 20 before PHASE 21');

console.log('✓ PHASE 21 Final Production Acceptance passed: 9 domains / 44 required facts are repository-evidence complete.');
console.log('  Knowledge, Method, Input, Projection, Guided Reading, Reality Journey, PJA/CAR and AI boundaries passed.');
console.log('  HDR history and validation are preserved while Production dispatch, Professional release and restricted public leakage remain blocked.');
console.log('  External deployment and human-browser gates remain visible; no global Production Freeze was synthesized.');
