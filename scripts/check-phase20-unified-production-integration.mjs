import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const contractPath = 'content/production-integration/phase20/contracts/phase20-unified-production-integration-contract-v1.json';
const registryPath = 'content/production-integration/phase20/registries/phase20-system-integration-registry-v1.json';
const acceptancePath = 'content/production-integration/phase20/acceptance/phase20-unified-production-integration-acceptance-v1.json';
const freezePath = 'content/production-integration/phase20/freeze/phase20-unified-production-integration-freeze-v1.json';

const contract = readJson(contractPath);
const registry = readJson(registryPath);
const acceptance = readJson(acceptancePath);
const freeze = readJson(freezePath);
const pkg = readJson('package.json');

const requiredSystems = [
  'Knowledge Runtime', 'KAP', 'MR', 'MPA', 'MCD', 'Personal Runtime',
  'Guided Reading', 'Reality Journey', 'PJA', 'CAR', 'Academy',
  'Professional Runtime', 'CPR', 'PDS', 'WPR'
];

assert.equal(contract.status, 'ACTIVE_REPOSITORY_INTEGRATION_CONTRACT');
assert.deepEqual(contract.requiredSystems, requiredSystems);
assert.equal(contract.authorityRules.duplicateAuthorityAllowed, false);
assert.equal(contract.acceptanceBoundary.globalProductionFreezeCreated, false);
assert.equal(contract.acceptanceBoundary.liveDeploymentAcceptanceCreated, false);
assert.equal(contract.acceptanceBoundary.humanBrowserAcceptanceSynthesized, false);
assert.equal(contract.acceptanceBoundary.restrictedHdrMethodActivated, false);
assert.equal(contract.handoffRules.length, 15);

assert.equal(registry.status, 'ACTIVE_UNIFIED_REFERENCE_REGISTRY_NO_SECOND_AUTHORITY');
assert.deepEqual(registry.systems.map(item => item.system), requiredSystems);
assert.equal(new Set(registry.systems.map(item => item.system)).size, requiredSystems.length);
for (const system of registry.systems) {
  assert.ok(system.owner.length > 0, `${system.system} is missing an owner`);
  assert.ok(system.state.length > 0, `${system.system} is missing a state`);
  assert.ok(system.evidence.length > 0, `${system.system} is missing evidence`);
  for (const evidencePath of system.evidence) {
    assert.equal(fs.existsSync(evidencePath), true, `${system.system} evidence is missing: ${evidencePath}`);
  }
}
assert.equal(registry.rules.runtimeAuthorityMutation, false);
assert.equal(registry.rules.presentationAuthorityMutation, false);
assert.equal(registry.rules.webProductionAuthorityMutation, false);
assert.equal(registry.rules.silentActivation, false);

const knowledge = readJson('content/knowledge/runtime/public-question-contract.json');
const ksar = readJson('content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json');
const kap = readJson('content/knowledge/answer-projection/acceptance/kap-w11-w17-answer-composition-acceptance-v1.json');
const cka = readJson('content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json');
const mr = readJson('content/professional/method-runtime/method-runtime-freeze-v1.json');
const mpa = readJson('content/professional/method-production-activation/acceptance/mpa-w30-freeze-acceptance-v1.json');
const mcd = readJson('content/professional/method-client-delivery/acceptance/mcd-8-production-acceptance-v1.json');
const personal = readJson('content/professional/method-client-delivery/acceptance/mcd-7-personal-runtime-result-surface-acceptance-v1.json');
const guided = readJson('content/knowledge/answer-projection/acceptance/kap-w18-w22-guided-reading-acceptance-v1.json');
const rjx = readJson('content/runtime/journey-runtime/phase19/rjx-phase19-w11-w18-technical-acceptance-v1.json');
const pja = readJson('docs/pja/pja-w0-cross-system-boundary-freeze-v1.json');
const car = readJson('content/professional/canonical-asset-runtime/contracts/car-full-acceptance-v1.json');
const academy = readJson('content/academy/academy-learning-runtime/freeze/alr-v2-freeze-v1.json');
const professional = readJson('content/runtime/professional-runtime/extensions/production/freeze/pr-production-extension-freeze-v1.json');
const cpr = readJson('content/professional/canonical-presentation-runtime/freeze/cpr-w7-w30-full-freeze-v1.json');
const pds = readJson('content/registry/pds-w10-full-site-acceptance.json');
const wpr = readJson('content/web-production/acceptance/wpr-w29-full-production-acceptance-v1.json');

assert.equal(knowledge.authority.mayCreateCanonicalNode, false);
assert.equal(knowledge.authority.mayPublish, false);
assert.equal(ksar.status, 'PRODUCTION_FROZEN');
assert.equal(ksar.acceptance.reviewedCorpusActiveForKnowledgeAccess, true);
assert.equal(kap.acceptance.deterministicAnswerActive, true);
assert.equal(kap.acceptance.questionScopedAnswerRemainsNonAuthoritative, true);
assert.equal(cka.status, 'CKA_PRODUCTION_READY');
assert.equal(cka.authorityBoundary.ckaCreatesAuthority, false);
assert.equal(cka.globalProductionAccepted, false);
assert.equal(mr.status, 'MR Frozen v1');
assert.equal(mr.freezeRules.calculationMustRemainDeterministic, true);
assert.equal(mpa.acceptedFacts.currentProductionDispatchCount, 0);
assert.equal(mpa.acceptedFacts.blockedMethodsPreserved, true);
assert.equal(mcd.acceptedFacts.mpaSoleDispatchAuthority, true);
assert.equal(mcd.acceptedFacts.frontendDirectCoreImports, 0);
assert.equal(personal.acceptedFacts.frontendMayGrantDispatch, false);
assert.equal(personal.acceptedFacts.hdrProductionResultTab, false);
assert.equal(guided.acceptance.methodClientOptInRequired, true);
assert.equal(guided.acceptance.onlyRealityModelRequiredMayEscalate, true);
assert.equal(rjx.status, 'TECHNICALLY_ACCEPTED_HUMAN_UX_ACCEPTANCE_PENDING');
assert.equal(rjx.accepted.runtimeWriteAuthorityCreated, false);
assert.ok(rjx.pending.includes('PHASE20_PRODUCTION_RUNTIME_CONSUMPTION_INTEGRATION'));
assert.deepEqual(pja.role.allowedCapabilities, ['read', 'render', 'route', 'link']);
assert.equal(pja.role.mayCreateCanonicalObjects, false);
assert.equal(car.productionStatus, 'validation_only');
assert.equal(car.invariants.providersEnabled, false);
assert.equal(academy.activationState.liveAcademyDelivery, false);
assert.equal(academy.activationState.providerAiOrNetworkAuthority, false);
assert.equal(professional.authorityClosure.professionalJudgment, 'PR_HUMAN_ATTRIBUTABLE_ONLY');
assert.equal(professional.nonActivation.aiProfessionalJudgmentAuthorityActivated, false);
assert.equal(cpr.productionStatus, 'contract_frozen');
assert.equal(cpr.invariants.productionPresentationRecordsCreated, false);
assert.equal(pds.status, 'implementation-complete-production-revalidation-required');
assert.equal(pds.scope.presentationOnly, true);
assert.equal(wpr.currentProductionState, 'LIMITED_PRODUCTION');
assert.equal(wpr.fullProductionPromotion, false);
assert.equal(wpr.externalOperationalVerificationComplete, false);

assert.equal(acceptance.status, 'PHASE20_UNIFIED_PRODUCTION_INTEGRATION_ACCEPTED_REPOSITORY_SCOPE');
assert.equal(acceptance.accepted.requiredSystemCount, requiredSystems.length);
assert.equal(acceptance.accepted.mappedSystemCount, requiredSystems.length);
assert.equal(acceptance.accepted.missingSystemCount, 0);
assert.equal(acceptance.accepted.duplicateSystemCount, 0);
assert.equal(acceptance.accepted.restrictedHdrStateRemainsBlocked, true);
assert.equal(acceptance.accepted.secondRuntimeCreated, false);
assert.equal(acceptance.accepted.secondAuthorityCreated, false);
assert.equal(acceptance.acceptanceBoundary.globalProductionFreeze, false);
assert.equal(acceptance.acceptanceBoundary.liveDeploymentAccepted, false);
assert.ok(acceptance.externalGatesPreserved.length >= 6);

assert.equal(freeze.status, 'PHASE20_REPOSITORY_INTEGRATION_FROZEN_EXTERNAL_GATES_PRESERVED');
for (const artifact of freeze.artifacts) assert.equal(sha256(artifact.path), artifact.sha256, `PHASE20_DIGEST_DRIFT:${artifact.path}`);
assert.equal(freeze.preserved.upstreamFreezesRewritten, false);
assert.equal(freeze.preserved.globalProductionFreezeCreated, false);

assert.equal(pkg.scripts['check:phase20'], 'node scripts/check-phase20-unified-production-integration.mjs');
assert.ok(pkg.scripts.check.includes('npm run check:phase20'));

console.log('✓ PHASE 20 Unified Production Integration passed: 15/15 systems mapped through existing authorities and governed handoffs.');
console.log('  HDR remains blocked; Academy live delivery, RJX human UX, PDS browser and WPR operational gates remain explicit.');
console.log('  Repository integration is frozen without creating a global Production Freeze.');
