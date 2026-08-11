import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  assertRecordDigest,
  buildCurrentPosition,
  buildNavigationConstraintGraph,
  buildTargetState,
  generateBoundedOptionSet
} from './lib/reality-navigation-engine/rne-navigation-foundation-v1.mjs';
import {
  buildDecisionSupportSet,
  buildNavigationRiskContext,
  buildOptionRecoverabilityAssessment,
  buildRouteCandidateSet,
  buildScenarioSimulationSet
} from './lib/reality-navigation-engine/rne-navigation-decision-support-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const exists = relative => fs.existsSync(path.join(root, relative));
const clone = value => structuredClone(value);
const sorted = values => [...values].sort();
const expectThrow = (fn, code) => assert.throws(
  fn,
  error => error?.message?.startsWith(code),
  `Expected error starting with ${code}`
);
const normalizedHash = relative => crypto.createHash('sha256')
  .update(readText(relative).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const base = 'content/runtime/reality-navigation-engine';
const audit = readJson(`${base}/audits/rne-w5-w9-authority-reconciliation-v1.json`);
const riskContract = readJson(`${base}/contracts/navigation-risk-context-contract-v1.json`);
const recoveryContract = readJson(`${base}/contracts/recovery-window-contract-v1.json`);
const decisionContract = readJson(`${base}/contracts/decision-support-contract-v1.json`);
const scenarioContract = readJson(`${base}/contracts/scenario-simulation-contract-v1.json`);
const routeContract = readJson(`${base}/contracts/route-runtime-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rne-w5-w9-acceptance-contract-v1.json`);
const riskRegistry = readJson(`${base}/registries/canonical-risk-context-kind-registry-v1.json`);
const recoverabilityRegistry = readJson(`${base}/registries/canonical-recoverability-class-registry-v1.json`);
const decisionRegistry = readJson(`${base}/registries/canonical-decision-support-pattern-registry-v1.json`);
const scenarioRegistry = readJson(`${base}/registries/canonical-scenario-mode-registry-v1.json`);
const routeRegistry = readJson(`${base}/registries/canonical-route-stage-registry-v1.json`);
const dependencyManifest = readJson(`${base}/freeze/rne-w0-w4-approved-foundation-dependency-manifest-v1.json`);
const preservation = readJson(`${base}/freeze/rne-w5-w9-content-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/rne-w5-w9-navigation-decision-support-freeze-v1.json`);

const positionContract = readJson(`${base}/contracts/current-position-contract-v1.json`);
const targetContract = readJson(`${base}/contracts/target-state-contract-v1.json`);
const graphContract = readJson(`${base}/contracts/navigation-constraint-graph-contract-v1.json`);
const optionContract = readJson(`${base}/contracts/bounded-option-generation-contract-v1.json`);
const targetSourceRegistry = readJson(`${base}/registries/canonical-target-source-registry-v1.json`);
const roleRegistry = readJson(`${base}/registries/canonical-navigation-constraint-role-registry-v1.json`);
const optionRegistry = readJson(`${base}/registries/canonical-option-class-registry-v1.json`);

const runtimeInventory = readJson('content/governance/operational-architecture/runtime-inventory-v1.json');
const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const rdgDataContracts = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const rreRecoveryContract = readJson('content/runtime/reality-readout-engine/contracts/recovery-reading-contract-v1.json');
const rreRecoveryRegistry = readJson('content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json');
const rmoUnknown = readJson('content/runtime/reality-model-runtime/contracts/unknown-runtime-contract-v1.json');
const rmoAction = readJson('content/runtime/reality-model-runtime/contracts/action-runtime-contract-v1.json');
const rmoOutcome = readJson('content/runtime/reality-model-runtime/contracts/outcome-runtime-contract-v1.json');
const rmoDiff = readJson('content/runtime/reality-model-runtime/contracts/reality-diff-contract-v1.json');
const jrRne = readJson('content/runtime/journey-runtime/contracts/rne-integration-contract-v1.json');
const packageJson = readJson('package.json');

assert.equal(audit.baselineCommit, '1ebd26901fb63db0753a8fc737ea6423155cf8b0');
assert.equal(audit.status, 'reconciled_validation_only_decision_support');
assert.equal(audit.foundationDependency.requiredWork, 'RNE-W0-W4');
assert.equal(audit.foundationDependency.approvedFoundationPackageSha256,
  'f654400e3b8cfe7879682b6a1b5eb2eff1e1c4c82fd18cbbeb7361c54df01fc7');
assert.equal(audit.foundationDependency.deliveryIncludesApprovedFoundationByteForByte, true);
assert.equal(audit.foundationDependency.foundationSemanticChangesByThisBatch, false);
for (const [key, value] of Object.entries(audit.authorityDecision)) {
  if (key.endsWith('Preserved')) assert.equal(value, true, key);
}
assert.equal(audit.authorityDecision.rneRiskProbabilityAuthorityGranted, false);
assert.equal(audit.authorityDecision.rneProfessionalJudgmentAuthorityGranted, false);
assert.equal(audit.authorityDecision.rneOptionSelectionAuthorityGranted, false);
assert.equal(audit.authorityDecision.rneExecutionAuthorityGranted, false);
assert.equal(audit.authorityDecision.scenarioPredictionAuthorityGranted, false);
assert.equal(audit.authorityDecision.jrStageMutationAuthorityGranted, false);
assert.equal(audit.authorityDecision.jrIntegrationActivated, false);
assert.equal(audit.authorityDecision.jrIntegrationDeferredTo, 'RNE-W10');
assert.equal(audit.authorityDecision.rdgRegistryMutationByThisBatch, false);
for (const entry of audit.inspectedAuthorities) {
  assert.ok(exists(entry.reference), `missing audited authority: ${entry.reference}`);
}

assert.equal(dependencyManifest.approvedPackageSha256,
  'f654400e3b8cfe7879682b6a1b5eb2eff1e1c4c82fd18cbbeb7361c54df01fc7');
assert.equal(dependencyManifest.rules.w5W9MayRewriteFoundationArtifacts, false);
for (const artifact of dependencyManifest.artifacts) {
  assert.ok(exists(artifact.reference), `missing approved foundation artifact: ${artifact.reference}`);
  assert.equal(normalizedHash(artifact.reference), artifact.sha256,
    `approved foundation drift: ${artifact.reference}`);
}

assert.equal(preservation.baselineCommit, '1ebd26901fb63db0753a8fc737ea6423155cf8b0');
for (const artifact of preservation.protectedArtifacts) {
  assert.ok(exists(artifact.reference), `missing protected artifact: ${artifact.reference}`);
  assert.equal(normalizedHash(artifact.reference), artifact.sha256,
    `protected authority drift: ${artifact.reference}`);
}

assert.ok(runtimeInventory.runtimeFamilies.operational.includes('RNE'));
assert.ok(runtimeInventory.runtimeFamilies.operational.includes('JR'));
assert.ok(runtimeInventory.runtimeFamilies.operational.includes('VAL'));
const rneWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'RNE');
assert.deepEqual(rneWorks.map(entry => entry.workCode), Array.from({ length: 15 }, (_, index) => `RNE-W${index}`));
assert.ok(rneWorks.every(entry => entry.status === 'PLANNED'));
assert.ok(rneWorks.every(entry => entry.migrationStatus === 'NEW'));

const rneData = rdgDataContracts.entries.find(entry => entry.runtimeCode === 'RNE');
assert.ok(rneData, 'RNE RDG data contract missing');
assert.equal(rneData.activationState, 'EXISTING');
assert.deepEqual(rneData.producedDataTypes, ['NAVIGATION_RECORD']);
assert.deepEqual(sorted(rneData.consumedDataTypes), sorted(['RUNTIME_STATE_RECORD', 'GOVERNANCE_RECORD']));
assert.equal(rneData.permissions.evidencePromotion, 'DENY');
assert.equal(rneData.permissions.professionalDataWrite, 'DENY');

assert.equal(rmoUnknown.rules.unknownCannotBeFilledByInference, true);
assert.equal(rmoUnknown.rules.providerOrAiMayResolveUnknown, false);
assert.equal(rmoAction.rules.actionMaySelectNavigationPath, false);
assert.equal(rmoAction.rules.actionMayPerformExecution, false);
assert.equal(rmoAction.rules.actionMayPredictOutcome, false);
assert.equal(rmoOutcome.rules.outcomeMayClaimCausality, false);
assert.equal(rmoOutcome.rules.outcomeMayDetermineSuccessOrEffectiveness, false);
assert.equal(rmoDiff.rules.diffClaimsCausality, false);
assert.equal(rmoDiff.rules.diffDeterminesSuccessOrEffectiveness, false);

assert.equal(rreRecoveryContract.work, 'RRE-W9');
assert.equal(rreRecoveryContract.rules.navigationActionCreated, false);
assert.equal(rreRecoveryContract.rules.unknownRecoveryMustRemainUnknown, true);
assert.equal(rreRecoveryContract.rules.professionalJudgmentCreated, false);

assert.equal(jrRne.separation.jr, 'WORKFLOW_RUNTIME');
assert.equal(jrRne.separation.rne, 'NAVIGATION_INTELLIGENCE');
for (const ref of ['navigationOptionReferences', 'tradeoffReferences', 'riskReferences', 'reversibilityReferences', 'scenarioReferences']) {
  assert.ok(jrRne.responseConsumption.includes(ref), `JR RNE response contract missing ${ref}`);
}
assert.equal(jrRne.rules.jrMayImplementRneReasoning, false);
assert.equal(jrRne.rules.rneMayMutateJourneyStage, false);
assert.equal(jrRne.currentBaseline.executionActivated, false);

assert.equal(riskContract.work, 'RNE-W5');
assert.equal(riskContract.rules.knownRiskMustRemainReferencedToGovernedSource, true);
assert.equal(riskContract.rules.unknownMustRemainExplicit, true);
assert.equal(riskContract.rules.dependencyDerivedOnlyFromConstraintGraph, true);
assert.equal(riskContract.rules.riskProbabilityCreated, false);
assert.equal(riskContract.rules.riskSeverityScoreCreated, false);
assert.deepEqual(riskRegistry.contextKinds.map(entry => entry.kind), ['KNOWN_RISK', 'UNKNOWN', 'DEPENDENCY']);
assert.equal(riskRegistry.rules.riskFactInventionAllowed, false);

assert.equal(recoveryContract.work, 'RNE-W6');
assert.equal(recoveryContract.upstreamRecoveryAuthority, 'RRE-W9');
assert.equal(recoveryContract.rules.recoveryViewReferenceMode, 'VALIDATION_VIEW_REFERENCE_ONLY');
assert.equal(recoveryContract.rules.rneMayRewriteRreRecoveryReading, false);
assert.equal(recoveryContract.rules.unknownRecoveryMustRemainUnknown, true);
assert.deepEqual(recoverabilityRegistry.classes.map(entry => entry.recoverabilityClass), [
  'NO_STATE_CHANGE_REQUIRED',
  'RECOVERY_WINDOW_OPEN',
  'RECOVERY_WINDOW_CONDITIONAL',
  'RECOVERY_NOT_OBSERVED',
  'RECOVERY_UNKNOWN'
]);

assert.equal(decisionContract.work, 'RNE-W7');
assert.deepEqual(decisionContract.outputs, ['tradeoff', 'dependency', 'reversibility', 'observationPoint']);
assert.equal(decisionContract.rules.optionSelectionCreated, false);
assert.equal(decisionContract.rules.recommendedDirectionCreated, false);
assert.equal(decisionRegistry.rules.rankingImplied, false);

assert.equal(scenarioContract.work, 'RNE-W8');
assert.equal(scenarioContract.simulationMode, 'CONDITIONAL_OPTION_SIMULATION');
assert.equal(scenarioContract.rules.simulationIsPrediction, false);
assert.equal(scenarioContract.rules.simulationIsRealityTruth, false);
assert.equal(scenarioContract.rules.probabilityCreated, false);
assert.equal(scenarioContract.rules.forecastCreated, false);
assert.equal(scenarioRegistry.modes[0].truthStatus, 'SIMULATION_ONLY');

assert.equal(routeContract.work, 'RNE-W9');
assert.deepEqual(routeContract.routeShape, ['CURRENT', 'INTERMEDIATE', 'TARGET']);
assert.equal(routeContract.rules.routeCandidatesRemainMultiple, true);
assert.equal(routeContract.rules.intermediateIsNavigationCheckpointNotRealityTruth, true);
assert.equal(routeContract.rules.routeCandidateSelectionCreated, false);
assert.equal(routeContract.rules.journeyStageMutationCreated, false);
assert.equal(routeContract.rules.executionCreated, false);
assert.equal(routeContract.rules.jrIntegrationDeferredTo, 'RNE-W10');
assert.deepEqual(routeRegistry.stages.map(entry => entry.stageType), ['CURRENT', 'INTERMEDIATE', 'TARGET']);
assert.equal(routeRegistry.rules.jrStageMutationAllowed, false);

assert.equal(acceptance.status, 'accept_validation_only_navigation_decision_support');
assert.equal(acceptance.requiredChecker, 'scripts/check-rne-w5-w9-navigation-decision-support.mjs');
assert.equal(freeze.status, 'FROZEN_VALIDATION_ONLY_NAVIGATION_DECISION_SUPPORT');
assert.deepEqual(freeze.completedWork, ['RNE-W5', 'RNE-W6', 'RNE-W7', 'RNE-W8', 'RNE-W9']);
assert.equal(freeze.authorityReconciliation.w0W4FoundationReopened, false);
assert.equal(freeze.blockingGate.jrIntegrationAllowedByThisFreeze, false);
assert.equal(freeze.blockingGate.requiredNextWork, 'RNE-W10');
assert.equal(freeze.implementedIntelligence.scenarioSimulation.prediction, false);
assert.equal(freeze.implementedIntelligence.routeRuntime.routeSelection, false);
assert.equal(freeze.nonActivation.professionalJudgment, false);
assert.equal(freeze.nonActivation.navigationExecution, false);
for (const output of freeze.frozenOutputs) assert.ok(exists(output), `missing frozen output: ${output}`);

const currentPositionRequest = readJson(`${base}/fixtures/current-position.request.valid.json`);
const targetRequest = readJson(`${base}/fixtures/target-state.request.valid.json`);
const graphRequest = readJson(`${base}/fixtures/navigation-constraint-graph.request.valid.json`);
const optionRequest = readJson(`${base}/fixtures/bounded-option-generation.request.valid.json`);
const riskRequest = readJson(`${base}/fixtures/navigation-risk-context.request.valid.json`);
const recoveryRequest = readJson(`${base}/fixtures/option-recoverability.request.valid.json`);
const decisionRequest = readJson(`${base}/fixtures/decision-support.request.valid.json`);
const scenarioRequest = readJson(`${base}/fixtures/scenario-simulation.request.valid.json`);
const routeRequest = readJson(`${base}/fixtures/route-runtime.request.valid.json`);

const position = buildCurrentPosition(currentPositionRequest, positionContract);
const target = buildTargetState(position, targetRequest, targetSourceRegistry, targetContract);
const graph = buildNavigationConstraintGraph(position, target, graphRequest, roleRegistry, graphContract);
const optionSet = generateBoundedOptionSet(position, target, graph, optionRequest, optionRegistry, optionContract);
const risk = buildNavigationRiskContext(position, graph, optionSet, riskRequest, riskContract);
const recovery = buildOptionRecoverabilityAssessment(
  optionSet,
  risk,
  recoveryRequest,
  rreRecoveryRegistry,
  recoverabilityRegistry,
  recoveryContract
);
const decision = buildDecisionSupportSet(
  optionSet,
  risk,
  recovery,
  decisionRequest,
  decisionRegistry,
  decisionContract
);
const scenario = buildScenarioSimulationSet(
  optionSet,
  decision,
  recovery,
  scenarioRequest,
  scenarioRegistry,
  scenarioContract
);
const routes = buildRouteCandidateSet(
  position,
  target,
  optionSet,
  decision,
  scenario,
  routeRequest,
  routeRegistry,
  routeContract
);

for (const [record, digestField] of [
  [position, 'positionDigest'],
  [target, 'targetDigest'],
  [graph, 'graphDigest'],
  [optionSet, 'optionSetDigest'],
  [risk, 'riskContextDigest'],
  [recovery, 'recoverabilityAssessmentDigest'],
  [decision, 'decisionSupportDigest'],
  [scenario, 'scenarioSetDigest'],
  [routes, 'routeSetDigest']
]) assert.equal(assertRecordDigest(record, digestField), true);

assert.deepEqual(risk.unknownReferences, [
  'RMO-UNKNOWN-VALIDATION-0001',
  'RMO-CONSTRAINT-DEPENDENCY-VALIDATION-0001',
  'RMO-CONSTRAINT-UNKNOWN-VALIDATION-0003'
]);
assert.equal(risk.knownRisks[0].riskReference, 'GOVERNED-RISK-VALIDATION-0001');
assert.equal(risk.riskProbabilityCreated, false);
assert.equal(risk.riskSeverityScoreCreated, false);
assert.ok(risk.dependencies.some(entry => entry.constraintReference === 'RMO-CONSTRAINT-DEPENDENCY-VALIDATION-0001'));

const observeRecovery = recovery.optionAssessments.find(entry => entry.optionClass === 'OBSERVE');
const reconfigureRecovery = recovery.optionAssessments.find(entry => entry.optionClass === 'RECONFIGURE');
assert.equal(observeRecovery.recoverabilityClass, 'NO_STATE_CHANGE_REQUIRED');
assert.equal(reconfigureRecovery.recoverabilityClass, 'RECOVERY_WINDOW_CONDITIONAL');
assert.equal(recovery.guaranteedRecoveryCreated, false);
assert.equal(recovery.medicalDiagnosisCreated, false);

for (const entry of decision.optionDecisionSupport) {
  assert.ok(entry.tradeoff);
  assert.ok(entry.reversibility.mode);
  assert.ok(entry.observationPoint);
  assert.equal(entry.selectionState, 'AVAILABLE_NOT_SELECTED');
}
assert.equal(decision.decisionAuthority, 'HUMAN_OR_AUTHORIZED_PROFESSIONAL');
assert.equal(decision.rankingCreated, false);
assert.equal(decision.selectionMade, false);
assert.equal(decision.recommendedDirectionCreated, false);

assert.equal(scenario.simulationIsPrediction, false);
assert.equal(scenario.simulationIsRealityTruth, false);
for (const entry of scenario.scenarios) {
  assert.equal(entry.truthStatus, 'SIMULATION_ONLY');
  assert.equal(entry.probabilityCreated, false);
  assert.equal(entry.forecastCreated, false);
  assert.equal(entry.causalityClaimed, false);
  assert.equal(entry.outcomeClaimed, false);
  assert.equal(entry.selectionMade, false);
  assert.equal(entry.executionCreated, false);
}

assert.equal(routes.routeCandidates.length, optionSet.options.length);
assert.equal(routes.routeSelectionMade, false);
assert.equal(routes.jrIntegrationActivated, false);
for (const route of routes.routeCandidates) {
  assert.deepEqual(route.stages.map(stage => stage.stageType), ['CURRENT', 'INTERMEDIATE', 'TARGET']);
  assert.equal(route.stages[0].stateReference, position.positionCode);
  assert.equal(route.stages[1].authority, 'RNE_NAVIGATION_CHECKPOINT');
  assert.equal(route.stages[1].realityTruthClaimed, false);
  assert.equal(route.stages[2].stateReference, target.targetCode);
  assert.equal(route.stages[2].targetSourceAuthority, 'CUSTOMER');
  assert.equal(route.selectionState, 'AVAILABLE_NOT_SELECTED');
  assert.equal(route.journeyStageMutationCreated, false);
  assert.equal(route.executionCreated, false);
  assert.equal(route.outcomePredictionCreated, false);
}

const unknownRecoveryRequest = clone(recoveryRequest);
unknownRecoveryRequest.recoveryState = {
  capacityState: 'UNKNOWN',
  windowState: 'UNKNOWN',
  uncertaintyState: 'UNKNOWN'
};
const unknownRecovery = buildOptionRecoverabilityAssessment(
  optionSet,
  risk,
  unknownRecoveryRequest,
  rreRecoveryRegistry,
  recoverabilityRegistry,
  recoveryContract
);
assert.equal(
  unknownRecovery.optionAssessments.find(entry => entry.optionClass === 'RECONFIGURE').recoverabilityClass,
  'RECOVERY_UNKNOWN'
);

const invalidRisk = clone(riskRequest);
invalidRisk.knownRisks[0].constraintReference = 'RMO-CONSTRAINT-NOT-IN-GRAPH';
expectThrow(
  () => buildNavigationRiskContext(position, graph, optionSet, invalidRisk, riskContract),
  'RNE_KNOWN_RISK_CONSTRAINT_NOT_IN_GRAPH'
);
const probabilityRisk = clone(riskRequest);
probabilityRisk.probability = 0.9;
expectThrow(
  () => buildNavigationRiskContext(position, graph, optionSet, probabilityRisk, riskContract),
  'RNE_FORBIDDEN_FIELD:probability'
);
const persistentRecovery = clone(recoveryRequest);
persistentRecovery.recoveryViewReference.mode = 'PERSISTENT_CANONICAL_READOUT';
expectThrow(
  () => buildOptionRecoverabilityAssessment(
    optionSet, risk, persistentRecovery, rreRecoveryRegistry, recoverabilityRegistry, recoveryContract
  ),
  'RNE_RECOVERY_VIEW_MODE_INVALID'
);
const predictionScenario = clone(scenarioRequest);
predictionScenario.prediction = 'target will occur';
expectThrow(
  () => buildScenarioSimulationSet(
    optionSet, decision, recovery, predictionScenario, scenarioRegistry, scenarioContract
  ),
  'RNE_FORBIDDEN_FIELD:prediction'
);
const unsafeRouteRegistry = clone(routeRegistry);
unsafeRouteRegistry.stages = [unsafeRouteRegistry.stages[0], unsafeRouteRegistry.stages[2]];
expectThrow(
  () => buildRouteCandidateSet(
    position, target, optionSet, decision, scenario, routeRequest, unsafeRouteRegistry, routeContract
  ),
  'RNE_ROUTE_STAGE_REGISTRY_MISMATCH'
);
const tamperedRisk = clone(risk);
tamperedRisk.unknownReferences.push('RMO-UNKNOWN-TAMPERED');
expectThrow(() => assertRecordDigest(tamperedRisk, 'riskContextDigest'), 'RNE_DIGEST_MISMATCH');

const repeatRisk = buildNavigationRiskContext(position, graph, optionSet, riskRequest, riskContract);
const repeatRecovery = buildOptionRecoverabilityAssessment(
  optionSet, repeatRisk, recoveryRequest, rreRecoveryRegistry, recoverabilityRegistry, recoveryContract
);
const repeatDecision = buildDecisionSupportSet(
  optionSet, repeatRisk, repeatRecovery, decisionRequest, decisionRegistry, decisionContract
);
const repeatScenario = buildScenarioSimulationSet(
  optionSet, repeatDecision, repeatRecovery, scenarioRequest, scenarioRegistry, scenarioContract
);
const repeatRoutes = buildRouteCandidateSet(
  position, target, optionSet, repeatDecision, repeatScenario, routeRequest, routeRegistry, routeContract
);
assert.equal(repeatRisk.riskContextDigest, risk.riskContextDigest);
assert.equal(repeatRecovery.recoverabilityAssessmentDigest, recovery.recoverabilityAssessmentDigest);
assert.equal(repeatDecision.decisionSupportDigest, decision.decisionSupportDigest);
assert.equal(repeatScenario.scenarioSetDigest, scenario.scenarioSetDigest);
assert.equal(repeatRoutes.routeSetDigest, routes.routeSetDigest);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const schemaPairs = [
  ['navigation-risk-context-v1.schema.json', risk],
  ['option-recoverability-assessment-v1.schema.json', recovery],
  ['decision-support-set-v1.schema.json', decision],
  ['scenario-simulation-set-v1.schema.json', scenario],
  ['route-candidate-set-v1.schema.json', routes]
];
for (const [schemaFile, record] of schemaPairs) {
  const schema = readJson(`${base}/schemas/${schemaFile}`);
  const validate = ajv.compile(schema);
  assert.equal(validate(record), true, `${schemaFile}: ${ajv.errorsText(validate.errors)}`);
}

const expectedScripts = {
  'check:rne-w0-w4': 'node scripts/check-rne-w0-w4-navigation-foundation.mjs',
  'check:rne-foundation': 'npm run check:rne-w0-w4',
  'check:rne-w5-w9': 'node scripts/check-rne-w5-w9-navigation-decision-support.mjs',
  'check:rne-decision-support': 'npm run check:rne-w5-w9',
  'check:rne-w0-w9': 'npm run check:rne-w0-w4 && npm run check:rne-w5-w9',
  'check:rne': 'npm run check:rne-foundation'
};
for (const [key, value] of Object.entries(expectedScripts)) {
  assert.equal(packageJson.scripts[key], value, `package script ${key}`);
}

console.log('✓ RNE-W5-W9 Navigation decision-support foundation passed.');
console.log('✓ Known risk, Unknown and Dependency remain distinct, referenced and unscored.');
console.log('✓ Option recoverability maps governed RRE recovery states without medical, treatment or guaranteed-recovery authority.');
console.log('✓ Decision Support exposes tradeoff, dependency, reversibility and observation point without ranking, selection or command.');
console.log('✓ Scenario outputs remain conditional simulations, never prediction, probability, forecast, causality or Reality Truth.');
console.log('✓ Route Runtime emits multiple CURRENT → INTERMEDIATE → TARGET candidates without JR stage mutation or execution.');
console.log('✓ JR integration remains deferred to RNE-W10; W0-W4 approved foundation remains byte-for-byte preserved.');
