import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  buildCurrentPosition,
  buildTargetState,
  buildNavigationConstraintGraph,
  generateBoundedOptionSet
} from './lib/reality-navigation-engine/rne-navigation-foundation-v1.mjs';
import {
  buildNavigationRiskContext,
  buildOptionRecoverabilityAssessment,
  buildDecisionSupportSet,
  buildScenarioSimulationSet,
  buildRouteCandidateSet
} from './lib/reality-navigation-engine/rne-navigation-decision-support-v1.mjs';
import {
  buildJrNavigationIntelligenceHandoff,
  buildProfessionalReviewGate,
  buildNavigationOutcomeFeedback,
  buildNavigationValidationRequest
} from './lib/reality-navigation-engine/rne-integration-feedback-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const exists = relative => fs.existsSync(path.join(root, relative));
const clone = value => structuredClone(value);
const normalizedHash = relative => crypto.createHash('sha256')
  .update(readText(relative).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const expectThrow = (fn, code) => assert.throws(
  fn,
  error => error?.message?.startsWith(code),
  `Expected error starting with ${code}`
);

const base = 'content/runtime/reality-navigation-engine';
const baseline = '9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed';
const audit = readJson(`${base}/audits/rne-w10-w14-authority-reconciliation-v1.json`);
const w10Audit = readJson(`${base}/audits/rne-w10-jr-integration-reconciliation-v1.json`);
const rdgAudit = readJson('content/governance/reality-data-governance/extensions/rne-navigation/audits/rne-navigation-data-authority-reconciliation-v1.json');
const rdgExtension = readJson('content/governance/reality-data-governance/extensions/rne-navigation/registries/rne-navigation-consumer-read-successor-v1.json');
const readoutResolution = readJson(`${base}/contracts/rne-readout-integration-gap-resolution-v1.json`);
const jrContract = readJson(`${base}/contracts/rne-jr-integration-contract-v1.json`);
const professionalContract = readJson(`${base}/contracts/professional-boundary-contract-v1.json`);
const feedbackContract = readJson(`${base}/contracts/outcome-feedback-contract-v1.json`);
const validationContract = readJson(`${base}/contracts/navigation-effectiveness-validation-contract-v1.json`);
const acceptanceContract = readJson(`${base}/contracts/rne-w10-w14-acceptance-contract-v1.json`);
const triggerRegistry = readJson(`${base}/registries/canonical-professional-review-trigger-registry-v1.json`);
const validationRegistry = readJson(`${base}/registries/canonical-navigation-validation-check-registry-v1.json`);
const preservation = readJson(`${base}/freeze/rne-w10-w14-content-preservation-manifest-v1.json`);
const dependency = readJson(`${base}/freeze/rne-w0-w9-approved-dependency-manifest-v1.json`);
const acceptance = readJson(`${base}/acceptance/rne-v1-full-acceptance-v1.json`);
const freeze = readJson(`${base}/freeze/rne-v1-freeze-v1.json`);

const frozenJrIntegration = readJson('content/runtime/journey-runtime/contracts/rne-integration-contract-v1.json');
const jrFreeze = readJson('content/runtime/journey-runtime/freeze/jr-v2-freeze-v1.json');
const pwsBoundary = readJson('docs/pws/architecture/pws-entry-professional-handoff-boundary-v1.json');
const rdgBase = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const rreReadoutSuccessor = readJson('content/governance/reality-data-governance/extensions/rre-readout/registries/rre-readout-data-contract-successor-v1.json');
const rreReadoutContract = readJson('content/governance/reality-data-governance/extensions/rre-readout/contracts/reality-readout-record-data-contract-v1.json');
const rmoAction = readJson('content/runtime/reality-model-runtime/contracts/action-runtime-contract-v1.json');
const rmoOutcome = readJson('content/runtime/reality-model-runtime/contracts/outcome-runtime-contract-v1.json');
const rmoDiff = readJson('content/runtime/reality-model-runtime/contracts/reality-diff-contract-v1.json');
const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const runtimeInventory = readJson('content/governance/operational-architecture/runtime-inventory-v1.json');
const packageJson = readJson('package.json');

assert.equal(audit.baselineCommit, baseline);
assert.equal(audit.status, 'RECONCILED_FOR_RNE_V1_FREEZE');
for (const [key, value] of Object.entries(audit.decisions)) {
  if (key.endsWith('Preserved')) assert.equal(value, true, key);
}
assert.equal(audit.decisions.consumerWriteAuthorityExpanded, false);
assert.equal(audit.decisions.rneExecutionAuthorityGranted, false);
assert.equal(audit.decisions.rneCommandAuthorityGranted, false);
assert.equal(audit.decisions.rnePredictionAuthorityGranted, false);
assert.equal(audit.decisions.rneCausalityAuthorityGranted, false);
assert.equal(audit.effectivenessValidationExecution, 'NOT_CLAIMED_BY_RNE');

assert.equal(preservation.baselineCommit, baseline);
for (const artifact of preservation.protectedArtifacts) {
  assert.ok(exists(artifact.reference), `missing protected artifact: ${artifact.reference}`);
  assert.equal(normalizedHash(artifact.reference), artifact.sha256, `protected authority drift: ${artifact.reference}`);
}
assert.equal(dependency.baselineCommit, baseline);
assert.ok(dependency.artifactCount >= 40, 'RNE W0-W9 dependency inventory unexpectedly small');
for (const artifact of dependency.artifacts) {
  assert.ok(exists(artifact.reference), `missing approved RNE dependency: ${artifact.reference}`);
  assert.equal(normalizedHash(artifact.reference), artifact.sha256, `approved RNE W0-W9 drift: ${artifact.reference}`);
}

assert.equal(frozenJrIntegration.status, 'CONTRACT_READY_RNE_EXECUTION_NOT_ACTIVATED');
assert.equal(frozenJrIntegration.rules.jrMayImplementRneReasoning, false);
assert.equal(frozenJrIntegration.rules.rneMayMutateJourneyStage, false);
assert.equal(jrFreeze.boundaries?.rneNavigationIntelligenceAuthorityPreserved ?? jrFreeze.authority?.rneNavigationIntelligenceAuthorityPreserved ?? true, true);
assert.equal(w10Audit.frozenJrContractMutated, false);
assert.equal(w10Audit.jrFreezeMutated, false);
assert.equal(w10Audit.activationDecision.referenceIntegrationActivatedByRne, true);
assert.equal(w10Audit.activationDecision.liveCustomerExecutionActivated, false);

assert.equal(rdgAudit.baselineCommit, baseline);
assert.equal(rdgAudit.decision.writeAuthorityExpanded, false);
assert.equal(rdgExtension.rules.baseRegistryMutated, false);
assert.equal(rdgExtension.rules.rreReadoutSuccessorMutated, false);
assert.equal(rdgExtension.rules.consumerWriteAuthorityExpanded, false);
assert.equal(rdgExtension.consumerReadExtensions.length, 4);
const extensionByRuntime = Object.fromEntries(rdgExtension.consumerReadExtensions.map(entry => [entry.runtimeCode, entry]));
assert.equal(extensionByRuntime.RNE.dataType, 'REALITY_READOUT_RECORD');
assert.deepEqual(extensionByRuntime.RNE.allowedPurposes, ['SERVICE_DELIVERY']);
assert.equal(extensionByRuntime.RNE.writeAuthorityExpanded, false);
for (const runtime of ['JR', 'PR', 'VAL']) {
  assert.equal(extensionByRuntime[runtime].dataType, 'NAVIGATION_RECORD');
  assert.equal(extensionByRuntime[runtime].sourceRuntimeCode, 'RNE');
  assert.equal(extensionByRuntime[runtime].writeAuthorityExpanded, false);
}

const rneBaseData = rdgBase.entries.find(entry => entry.runtimeCode === 'RNE');
assert.deepEqual(rneBaseData.producedDataTypes, ['NAVIGATION_RECORD']);
assert.deepEqual(rneBaseData.consumedDataTypes.sort(), ['GOVERNANCE_RECORD', 'RUNTIME_STATE_RECORD']);
assert.equal(rneBaseData.permissions.professionalDataWrite, 'DENY');
assert.ok(rreReadoutSuccessor.addedDataTypes.some(entry => entry.dataType === 'REALITY_READOUT_RECORD'));
assert.equal(rreReadoutContract.payloadAuthority, 'RRE_CANONICAL_RUNTIME_READOUT');
assert.equal(rreReadoutContract.rules.readoutIsNavigationDecision, false);
assert.equal(readoutResolution.status, 'RESOLVED_BY_VERSIONED_RDG_CONSUMER_READ_EXTENSION');
assert.equal(readoutResolution.resolution.rneReadoutWriteAuthorityGranted, false);
assert.equal(readoutResolution.resolution.historicalW1ValidationViewContractRewritten, false);

assert.equal(jrContract.work, 'RNE-W10');
assert.equal(jrContract.status, 'REFERENCE_INTEGRATION_ACTIVE');
for (const field of frozenJrIntegration.responseConsumption) assert.ok(jrContract.responseConsumption.includes(field));
assert.equal(jrContract.rules.jrOwnsWorkflow, true);
assert.equal(jrContract.rules.rneOwnsNavigationIntelligence, true);
assert.equal(jrContract.rules.rneMayMutateJourneyStage, false);
assert.equal(jrContract.rules.productionExecutionActivated, false);

assert.equal(professionalContract.work, 'RNE-W11');
assert.equal(professionalContract.pwsRequiredGateCount, pwsBoundary.acceptance.requiredGateCount);
assert.equal(pwsBoundary.handoffPolicy.professionalResponsibilityStartsBeforeAcceptance, false);
assert.equal(pwsBoundary.handoffPolicy.automaticProfessionalSelectionAllowed, false);
assert.equal(professionalContract.rules.rneMayClassifyRiskAsHighWithoutAuthority, false);
assert.equal(professionalContract.rules.professionalJudgmentCreated, false);
assert.equal(triggerRegistry.triggerClasses[0].triggerClass, 'HIGH_RISK_NAVIGATION');
assert.equal(triggerRegistry.rules.rneMayInventHighRiskClassification, false);

assert.equal(feedbackContract.work, 'RNE-W12');
assert.deepEqual(feedbackContract.consumes, ['RMO_ACTION_REFERENCE', 'RMO_OUTCOME_REFERENCE', 'RMO_REALITY_DIFF_REFERENCE']);
assert.equal(rmoAction.rules.actionMaySelectNavigationPath, false);
assert.equal(rmoOutcome.rules.outcomeMayDetermineSuccessOrEffectiveness, false);
assert.equal(rmoDiff.rules.diffDeterminesSuccessOrEffectiveness, false);
assert.equal(feedbackContract.rules.feedbackMayClaimCausality, false);
assert.equal(feedbackContract.rules.feedbackMayDetermineEffectiveness, false);

assert.equal(validationContract.work, 'RNE-W13');
assert.equal(validationContract.validatorRuntime, 'VAL');
assert.equal(validationContract.rules.rneMayPerformEffectivenessValidation, false);
assert.equal(validationContract.rules.rneMayClaimSuccess, false);
assert.equal(validationContract.rules.valResultExpectedDataType, 'SYSTEM_OPERATION_RECORD');
assert.equal(validationRegistry.rules.valOwnsEffectivenessValidation, true);
const valWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'VAL');
assert.equal(valWorks.length, 17);
assert.ok(valWorks.every(entry => entry.status === 'PLANNED'));
assert.ok(runtimeInventory.runtimeFamilies.operational.includes('VAL'));
const valData = rdgBase.entries.find(entry => entry.runtimeCode === 'VAL');
assert.deepEqual(valData.producedDataTypes, ['SYSTEM_OPERATION_RECORD']);

const rneWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'RNE');
assert.deepEqual(rneWorks.map(entry => entry.workCode), Array.from({ length: 15 }, (_, index) => `RNE-W${index}`));
assert.ok(rneWorks.every(entry => entry.status === 'PLANNED'));

// Build the approved W0-W9 chain, then the W10-W13 integration outputs.
const positionContract = readJson(`${base}/contracts/current-position-contract-v1.json`);
const targetContract = readJson(`${base}/contracts/target-state-contract-v1.json`);
const graphContract = readJson(`${base}/contracts/navigation-constraint-graph-contract-v1.json`);
const optionContract = readJson(`${base}/contracts/bounded-option-generation-contract-v1.json`);
const riskContract = readJson(`${base}/contracts/navigation-risk-context-contract-v1.json`);
const recoveryContract = readJson(`${base}/contracts/recovery-window-contract-v1.json`);
const decisionContract = readJson(`${base}/contracts/decision-support-contract-v1.json`);
const scenarioContract = readJson(`${base}/contracts/scenario-simulation-contract-v1.json`);
const routeContract = readJson(`${base}/contracts/route-runtime-contract-v1.json`);
const targetSourceRegistry = readJson(`${base}/registries/canonical-target-source-registry-v1.json`);
const roleRegistry = readJson(`${base}/registries/canonical-navigation-constraint-role-registry-v1.json`);
const optionRegistry = readJson(`${base}/registries/canonical-option-class-registry-v1.json`);
const recoverabilityRegistry = readJson(`${base}/registries/canonical-recoverability-class-registry-v1.json`);
const decisionRegistry = readJson(`${base}/registries/canonical-decision-support-pattern-registry-v1.json`);
const scenarioRegistry = readJson(`${base}/registries/canonical-scenario-mode-registry-v1.json`);
const routeRegistry = readJson(`${base}/registries/canonical-route-stage-registry-v1.json`);
const rreRecoveryRegistry = readJson('content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json');

const position = buildCurrentPosition(readJson(`${base}/fixtures/current-position.request.valid.json`), positionContract);
const target = buildTargetState(position, readJson(`${base}/fixtures/target-state.request.valid.json`), targetSourceRegistry, targetContract);
const graph = buildNavigationConstraintGraph(position, target, readJson(`${base}/fixtures/navigation-constraint-graph.request.valid.json`), roleRegistry, graphContract);
const optionSet = generateBoundedOptionSet(position, target, graph, readJson(`${base}/fixtures/bounded-option-generation.request.valid.json`), optionRegistry, optionContract);
const risk = buildNavigationRiskContext(position, graph, optionSet, readJson(`${base}/fixtures/navigation-risk-context.request.valid.json`), riskContract);
const recovery = buildOptionRecoverabilityAssessment(optionSet, risk, readJson(`${base}/fixtures/option-recoverability.request.valid.json`), rreRecoveryRegistry, recoverabilityRegistry, recoveryContract);
const decision = buildDecisionSupportSet(optionSet, risk, recovery, readJson(`${base}/fixtures/decision-support.request.valid.json`), decisionRegistry, decisionContract);
const scenario = buildScenarioSimulationSet(optionSet, decision, recovery, readJson(`${base}/fixtures/scenario-simulation.request.valid.json`), scenarioRegistry, scenarioContract);
const routes = buildRouteCandidateSet(position, target, optionSet, decision, scenario, readJson(`${base}/fixtures/route-runtime.request.valid.json`), routeRegistry, routeContract);
const jrHandoff = buildJrNavigationIntelligenceHandoff(position, target, optionSet, risk, decision, scenario, routes, readJson(`${base}/fixtures/jr-navigation-integration.request.valid.json`), jrContract);
const professionalGate = buildProfessionalReviewGate(risk, routes, readJson(`${base}/fixtures/professional-boundary.request.valid.json`), triggerRegistry, professionalContract);
const feedback = buildNavigationOutcomeFeedback(routes, readJson(`${base}/fixtures/outcome-feedback.request.valid.json`), feedbackContract);
const validationRequest = buildNavigationValidationRequest(jrHandoff, professionalGate, feedback, readJson(`${base}/fixtures/navigation-validation.request.valid.json`), validationRegistry, validationContract);

assert.equal(jrHandoff.integrationState, 'REFERENCE_ONLY_ACTIVE');
assert.equal(jrHandoff.journeyStageMutationCreated, false);
assert.equal(jrHandoff.navigationReasoningImplementedByJr, false);
assert.equal(jrHandoff.rawReadoutCopied, false);
assert.equal(jrHandoff.canonicalReadoutReference.dataType, 'REALITY_READOUT_RECORD');
assert.equal(professionalGate.professionalReviewState, 'REQUIRED_BY_GOVERNED_TRIGGER');
assert.equal(professionalGate.professionalResponsibilityCreated, false);
assert.equal(professionalGate.assignmentCreated, false);
assert.equal(professionalGate.continuationWithoutRequiredReviewAllowed, false);
assert.equal(feedback.feedbackState, 'REFERENCES_BOUND_FOR_REPOSITIONING');
assert.equal(feedback.causalityClaimed, false);
assert.equal(feedback.effectivenessDetermined, false);
assert.equal(feedback.targetChangedAutomatically, false);
assert.equal(validationRequest.validatorRuntime, 'VAL');
assert.equal(validationRequest.validationStatus, 'PENDING_VAL_EXECUTION');
assert.equal(validationRequest.rneSelfValidationPerformed, false);
assert.equal(validationRequest.effectivenessDetermined, false);

const badReadout = clone(readJson(`${base}/fixtures/jr-navigation-integration.request.valid.json`));
badReadout.canonicalReadoutReference.dataType = 'RUNTIME_STATE_RECORD';
expectThrow(() => buildJrNavigationIntelligenceHandoff(position, target, optionSet, risk, decision, scenario, routes, badReadout, jrContract), 'RNE_CANONICAL_READOUT_REFERENCE_DATA_TYPE_INVALID');
const ungovernedTrigger = clone(readJson(`${base}/fixtures/professional-boundary.request.valid.json`));
ungovernedTrigger.professionalReviewTriggers[0].riskReference = 'RISK-NOT-IN-GOVERNED-CONTEXT';
expectThrow(() => buildProfessionalReviewGate(risk, routes, ungovernedTrigger, triggerRegistry, professionalContract), 'RNE_PROFESSIONAL_TRIGGER_RISK_UNKNOWN');
const wrongActionAuthority = clone(readJson(`${base}/fixtures/outcome-feedback.request.valid.json`));
wrongActionAuthority.actionReference.authorityRuntime = 'RNE';
expectThrow(() => buildNavigationOutcomeFeedback(routes, wrongActionAuthority, feedbackContract), 'RNE_ACTION_REFERENCE_AUTHORITY_INVALID');
const selfValidation = clone(readJson(`${base}/fixtures/navigation-validation.request.valid.json`));
selfValidation.prediction = 'effective';
expectThrow(() => buildNavigationValidationRequest(jrHandoff, professionalGate, feedback, selfValidation, validationRegistry, validationContract), 'RNE_FORBIDDEN_FIELD:prediction');

const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const [schemaFile, record] of [
  ['jr-navigation-intelligence-handoff-v1.schema.json', jrHandoff],
  ['professional-review-gate-v1.schema.json', professionalGate],
  ['navigation-outcome-feedback-v1.schema.json', feedback],
  ['navigation-validation-request-v1.schema.json', validationRequest]
]) {
  const validate = ajv.compile(readJson(`${base}/schemas/${schemaFile}`));
  assert.equal(validate(record), true, `${schemaFile}: ${ajv.errorsText(validate.errors)}`);
}

assert.equal(acceptanceContract.status, 'ACCEPT_RNE_V1_FREEZE_WITH_VAL_AUTHORITY_PRESERVED');
assert.equal(acceptance.status, 'ACCEPTED_FOR_RNE_V1_CONTRACT_FREEZE');
assert.deepEqual(acceptance.completedWork, Array.from({ length: 15 }, (_, index) => `RNE-W${index}`));
assert.equal(acceptance.activation.liveRouteExecutionActive, false);
assert.equal(acceptance.activation.automaticDecisionActive, false);
assert.equal(acceptance.activation.effectivenessClaimActive, false);

assert.equal(freeze.freezeCode, 'PHI-OS-RNE-v1-FREEZE');
assert.equal(freeze.status, 'RNE_FROZEN_v1');
assert.deepEqual(freeze.completedWork, Array.from({ length: 15 }, (_, index) => `RNE-W${index}`));
assert.equal(freeze.authority.navigationDecisionCommand, false);
assert.equal(freeze.authority.professionalJudgment, false);
assert.equal(freeze.authority.effectivenessValidation, 'VAL');
assert.equal(freeze.validation.effectivenessStatus, 'PENDING_VAL_RUNTIME_EXECUTION');
assert.equal(freeze.validation.rneSelfValidation, false);
assert.equal(freeze.activation.liveRouteExecution, false);
assert.equal(freeze.activation.productionDecisionCommand, false);
assert.equal(freeze.aliases.historicalCheckRnePreserved, true);
assert.equal(freeze.aliases.canonicalV1Alias, 'check:rne-v1');
for (const artifact of freeze.frozenArtifacts) {
  assert.ok(exists(artifact.reference), `missing frozen RNE v1 artifact: ${artifact.reference}`);
  assert.equal(normalizedHash(artifact.reference), artifact.sha256, `RNE v1 frozen artifact drift: ${artifact.reference}`);
}

const expectedScripts = {
  'check:rne-w0-w4': 'node scripts/check-rne-w0-w4-navigation-foundation.mjs',
  'check:rne-w5-w9': 'node scripts/check-rne-w5-w9-navigation-decision-support.mjs',
  'check:rne-w10-w14': 'node scripts/check-rne-w10-w14-integration-feedback-freeze.mjs',
  'check:rne-w0-w14': 'npm run check:rne-w0-w4 && npm run check:rne-w5-w9 && npm run check:rne-w10-w14',
  'check:rne-v1': 'npm run check:rne-w0-w14',
  'check:rne-final': 'npm run check:rne-v1',
  'check:rne': 'npm run check:rne-foundation'
};
for (const [key, value] of Object.entries(expectedScripts)) assert.equal(packageJson.scripts[key], value, `package script ${key}`);

console.log('✓ RNE-W10-W14 integration, feedback, validation handoff and v1 freeze passed.');
console.log('✓ JR consumes RNE navigation intelligence by reference; JR workflow authority and Journey stage authority remain unchanged.');
console.log('✓ Canonical RRE Readout reference consumption is authorized through an RDG successor extension without write-authority expansion.');
console.log('✓ Governed high-risk triggers can require Professional Review without professional selection, assignment, responsibility or judgment creation.');
console.log('✓ Action, Outcome and Reality Diff feedback is bound without causality, success, effectiveness or automatic route-selection claims.');
console.log('✓ Navigation effectiveness remains VAL authority; RNE emits a validation request and does not self-validate.');
console.log('✓ RNE Frozen v1: decision-support intelligence frozen; live route execution and production decision command remain inactive.');
