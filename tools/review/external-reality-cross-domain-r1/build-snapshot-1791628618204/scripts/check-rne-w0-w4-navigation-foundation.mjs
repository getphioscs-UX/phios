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
const audit = readJson(`${base}/audits/rne-w0-w4-authority-reconciliation-v1.json`);
const boundary = readJson(`${base}/contracts/rne-authority-boundary-v1.json`);
const readoutGap = readJson(`${base}/contracts/rne-readout-integration-gap-v1.json`);
const positionContract = readJson(`${base}/contracts/current-position-contract-v1.json`);
const targetContract = readJson(`${base}/contracts/target-state-contract-v1.json`);
const graphContract = readJson(`${base}/contracts/navigation-constraint-graph-contract-v1.json`);
const optionContract = readJson(`${base}/contracts/bounded-option-generation-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rne-w0-w4-acceptance-contract-v1.json`);
const targetSourceRegistry = readJson(`${base}/registries/canonical-target-source-registry-v1.json`);
const roleRegistry = readJson(`${base}/registries/canonical-navigation-constraint-role-registry-v1.json`);
const optionRegistry = readJson(`${base}/registries/canonical-option-class-registry-v1.json`);
const preservation = readJson(`${base}/freeze/rne-w0-w4-content-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/rne-w0-w4-navigation-foundation-freeze-v1.json`);

const runtimeInventory = readJson('content/governance/operational-architecture/runtime-inventory-v1.json');
const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const rdgDataContracts = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const rmoConstraint = readJson('content/runtime/reality-model-runtime/contracts/constraint-runtime-contract-v1.json');
const rreConstraintReading = readJson('content/runtime/reality-readout-engine/contracts/constraint-reading-contract-v1.json');
const publicJourney = readJson('content/registry/m3c-public-journey.json');
const packageJson = readJson('package.json');

assert.equal(audit.baselineCommit, '3dd903344945ecd3b585c8aafe48b93d7894caa9');
assert.equal(audit.status, 'reconciled_validation_only_foundation');
assert.equal(audit.authorityDecision.rneRuntimeIdentityAlreadyRegistered, true);
assert.equal(audit.authorityDecision.rneCanonicalDataAuthorityAlreadyExists, true);
assert.equal(audit.authorityDecision.rneProducedDataType, 'NAVIGATION_RECORD');
assert.equal(audit.authorityDecision.jrOwnsJourneyWorkflowAndStageTransitions, true);
assert.equal(audit.authorityDecision.rneSupportsDecision, true);
assert.equal(audit.authorityDecision.rneCommandsDecision, false);
assert.equal(audit.authorityDecision.rneMayInventTarget, false);
assert.equal(audit.authorityDecision.rneMayAutoSelectOption, false);
assert.equal(audit.authorityDecision.rneMayExecuteOption, false);
assert.equal(audit.authorityDecision.legacyNavigationCutoverByThisBatch, false);
assert.equal(audit.authorityDecision.rdgRegistryMutationByThisBatch, false);
assert.equal(audit.readoutIntegrationGap.w1ReadoutMode, 'VALIDATION_VIEW_REFERENCE_ONLY');
assert.equal(audit.readoutIntegrationGap.persistentCanonicalReadoutConsumptionActivated, false);
for (const entry of audit.inspectedAuthorities) {
  assert.ok(exists(entry.reference), `missing audited authority: ${entry.reference}`);
}

assert.ok(runtimeInventory.runtimeFamilies.operational.includes('RNE'));
assert.ok(runtimeInventory.runtimeFamilies.operational.includes('JR'));
assert.ok(runtimeInventory.runtimeFamilies.operational.includes('VAL'));
const rneWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'RNE');
assert.deepEqual(
  rneWorks.map(entry => entry.workCode),
  Array.from({ length: 15 }, (_, index) => `RNE-W${index}`)
);
assert.ok(rneWorks.every(entry => entry.status === 'PLANNED'));
assert.ok(rneWorks.every(entry => entry.migrationStatus === 'NEW'));

const rneData = rdgDataContracts.entries.find(entry => entry.runtimeCode === 'RNE');
assert.ok(rneData, 'RNE RDG data contract missing');
assert.equal(rneData.activationState, 'EXISTING');
assert.deepEqual(rneData.producedDataTypes, ['NAVIGATION_RECORD']);
assert.deepEqual(sorted(rneData.consumedDataTypes), sorted(['RUNTIME_STATE_RECORD', 'GOVERNANCE_RECORD']));
assert.equal(rneData.permissions.evidencePromotion, 'DENY');
assert.equal(rneData.permissions.professionalDataWrite, 'DENY');

assert.equal(rmoConstraint.rules.constraintIsNavigationRule, false);
assert.equal(rmoConstraint.rules.constraintCreatesNavigationPathOrChoice, false);
assert.equal(rmoConstraint.rules.constraintCreatesProfessionalJudgment, false);
assert.equal(rreConstraintReading.rules.navigationRestrictionCreated, false);
assert.equal(rreConstraintReading.rules.recommendationCreated, false);
assert.equal(rreConstraintReading.rules.professionalJudgmentCreated, false);

const navigationStage = publicJourney.stages.find(stage => stage.id === 'navigation');
assert.ok(navigationStage, 'legacy navigation journey stage missing');
assert.equal(navigationStage.automaticAdvance, false);
assert.equal(publicJourney.boundaries.userChoiceRequiredForTransition, true);
assert.equal(publicJourney.boundaries.aiAuthorityClaimed, false);
assert.equal(publicJourney.boundaries.financialRecommendationProvided, false);

assert.equal(boundary.work, 'RNE-W0');
assert.equal(boundary.runtimeName, 'Reality Navigation Engine');
assert.equal(boundary.objectFamily, 'RNE_NAVIGATION_INTELLIGENCE');
assert.equal(boundary.doesNotOwn.journeyWorkflow, 'JR');
assert.equal(boundary.doesNotOwn.realityTruthAndConstraintRepresentation, 'RMO');
assert.equal(boundary.doesNotOwn.readoutAndEvidenceEvaluation, 'RRE');
assert.equal(boundary.doesNotOwn.professionalJudgment, 'PR');
assert.equal(boundary.doesNotOwn.navigationEffectivenessValidation, 'VAL');
assert.equal(boundary.legacyCompatibility.automaticCutoverAllowed, false);
assert.equal(boundary.legacyCompatibility.jrIntegrationDeferredTo, 'RNE-W10');
assert.ok(boundary.forbidden.includes('NAVIGATION_COMMAND'));
assert.ok(boundary.forbidden.includes('AUTOMATIC_OPTION_SELECTION'));
assert.ok(boundary.forbidden.includes('PROFESSIONAL_JUDGMENT'));
assert.equal(boundary.rules.multipleBoundedOptionsRequired, true);
assert.equal(boundary.rules.productionExecutionActivated, false);

assert.equal(readoutGap.status, 'governance_extension_required_before_persistent_readout_binding');
assert.deepEqual(readoutGap.currentCanonicalRneDataContract.producedDataTypes, rneData.producedDataTypes);
assert.deepEqual(
  sorted(readoutGap.currentCanonicalRneDataContract.consumedDataTypes),
  sorted(rneData.consumedDataTypes)
);
assert.equal(readoutGap.currentRreState.persistentCanonicalReadoutActivated, false);
assert.equal(readoutGap.w0W4Resolution.readoutReferenceMode, 'VALIDATION_VIEW_REFERENCE_ONLY');
assert.equal(readoutGap.w0W4Resolution.readoutPayloadCopiedIntoRne, false);
assert.equal(readoutGap.rules.thisContractDoesNotAmendRdgAuthority, true);
assert.equal(readoutGap.rules.w10PersistentJrIntegrationMustRecheckDataAuthority, true);

assert.equal(positionContract.work, 'RNE-W1');
assert.equal(positionContract.rules.rawRealityPayloadAccepted, false);
assert.equal(positionContract.rules.rawReadoutPayloadAccepted, false);
assert.equal(positionContract.rules.targetCreated, false);
assert.equal(positionContract.rules.navigationCommandCreated, false);
assert.equal(targetContract.work, 'RNE-W2');
assert.deepEqual(targetContract.rules.allowedTargetSources, ['CUSTOMER', 'PROFESSIONAL', 'AUTHORIZED_SERVICE']);
assert.equal(targetContract.rules.rneMayInventTarget, false);
assert.equal(targetContract.rules.providerOrAiMayBecomeTargetAuthority, false);
assert.equal(graphContract.work, 'RNE-W3');
assert.equal(graphContract.rules.graphMayClassifyNavigationRoleWithoutChangingRmoConstraintAuthority, true);
assert.equal(graphContract.rules.cyclesAllowed, false);
assert.equal(graphContract.rules.graphCreatesRealityConstraint, false);
assert.equal(optionContract.work, 'RNE-W4');
assert.equal(optionContract.generationModel, 'DETERMINISTIC_RULE_FIRST');
assert.deepEqual(optionContract.baseOptions, ['OBSERVE', 'CLARIFY']);
assert.equal(optionContract.rules.minimumBoundedOptions, 2);
assert.equal(optionContract.rules.optionSelectionMade, false);
assert.equal(optionContract.rules.optionRankingCreated, false);
assert.equal(optionContract.rules.recommendedDirectionCreated, false);
assert.equal(optionContract.rules.riskAssessmentCreated, false);
assert.equal(optionContract.rules.recoverabilityAssessmentCreated, false);
assert.equal(optionContract.rules.scenarioPredictionCreated, false);

assert.deepEqual(
  targetSourceRegistry.targetSources.map(entry => entry.sourceType),
  ['CUSTOMER', 'PROFESSIONAL', 'AUTHORIZED_SERVICE']
);
assert.ok(targetSourceRegistry.targetSources.every(entry => entry.rneMayInvent === false));
assert.equal(targetSourceRegistry.rules.providerOrAiIsNotTargetAuthority, true);
assert.deepEqual(
  roleRegistry.roles.map(entry => entry.role),
  ['HARD_BOUNDARY', 'SOFT_LIMIT', 'DEPENDENCY', 'UNKNOWN_LIMIT', 'OBSERVATION_REQUIREMENT']
);
assert.equal(roleRegistry.rules.roleDoesNotRewriteRmoConstraintType, true);
assert.deepEqual(
  optionRegistry.optionClasses.map(entry => entry.optionClass),
  ['OBSERVE', 'CLARIFY', 'VERIFY', 'REPOSITION', 'RECONFIGURE']
);
assert.equal(optionRegistry.rules.rankingImpliedByOrder, false);
assert.equal(optionRegistry.rules.selectionAuthorityGranted, false);

assert.equal(preservation.baselineCommit, '3dd903344945ecd3b585c8aafe48b93d7894caa9');
for (const artifact of preservation.protectedArtifacts) {
  assert.ok(exists(artifact.reference), `missing protected artifact: ${artifact.reference}`);
  assert.equal(normalizedHash(artifact.reference), artifact.sha256, `protected artifact drift: ${artifact.reference}`);
}
assert.ok(Object.values(preservation.rules).every(value => value === false));

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validatePosition = ajv.compile(readJson(`${base}/schemas/current-position-v1.schema.json`));
const validateTarget = ajv.compile(readJson(`${base}/schemas/target-state-v1.schema.json`));
const validateGraph = ajv.compile(readJson(`${base}/schemas/navigation-constraint-graph-v1.schema.json`));
const validateOptionSet = ajv.compile(readJson(`${base}/schemas/bounded-navigation-option-set-v1.schema.json`));

const currentRequest = readJson(`${base}/fixtures/current-position.request.valid.json`);
const currentPosition = buildCurrentPosition(currentRequest, positionContract);
assert.equal(validatePosition(currentPosition), true, JSON.stringify(validatePosition.errors));
assertRecordDigest(currentPosition, 'positionDigest');
assert.equal(currentPosition.objectType, 'CURRENT_POSITION');
assert.equal(currentPosition.dataType, 'NAVIGATION_RECORD');
assert.equal(currentPosition.readoutViewReference.mode, 'VALIDATION_VIEW_REFERENCE_ONLY');
assert.equal(currentPosition.validationOnly, true);
assert.equal(currentPosition.persistentStoreWriteAllowed, false);
assert.equal(currentPosition.productionExecutionAllowed, false);
assert.equal(Object.hasOwn(currentPosition, 'rawReality'), false);
assert.equal(Object.hasOwn(currentPosition, 'rawReadout'), false);
assert.deepEqual(buildCurrentPosition(clone(currentRequest), positionContract), currentPosition);

const forbiddenCurrent = clone(currentRequest);
forbiddenCurrent.rawData = { secret: true };
expectThrow(() => buildCurrentPosition(forbiddenCurrent, positionContract), 'RNE_FORBIDDEN_FIELD:rawData');
const badReadoutMode = clone(currentRequest);
badReadoutMode.readoutViewReference.mode = 'PERSISTED_CANONICAL_READOUT';
expectThrow(() => buildCurrentPosition(badReadoutMode, positionContract), 'RNE_READOUT_VIEW_MODE_INVALID');
const duplicateConstraints = clone(currentRequest);
duplicateConstraints.constraintReferences.push(duplicateConstraints.constraintReferences[0]);
expectThrow(() => buildCurrentPosition(duplicateConstraints, positionContract), 'RNE_CONSTRAINT_REFERENCES_INVALID_DUPLICATE');

const targetRequest = readJson(`${base}/fixtures/target-state.request.valid.json`);
const targetState = buildTargetState(currentPosition, targetRequest, targetSourceRegistry, targetContract);
assert.equal(validateTarget(targetState), true, JSON.stringify(validateTarget.errors));
assertRecordDigest(targetState, 'targetDigest');
assert.equal(targetState.source.sourceType, 'CUSTOMER');
assert.equal(targetState.targetStatement, targetRequest.targetStatement);
assert.deepEqual(targetState.targetCriteria, targetRequest.targetCriteria);
assert.equal(targetState.targetInventedByRne, false);
assert.equal(targetState.predictionCreated, false);
assert.equal(targetState.guaranteedOutcomeCreated, false);
assert.deepEqual(
  buildTargetState(currentPosition, clone(targetRequest), targetSourceRegistry, targetContract),
  targetState
);

const inventedTarget = clone(targetRequest);
inventedTarget.source.sourceType = 'RNE';
expectThrow(
  () => buildTargetState(currentPosition, inventedTarget, targetSourceRegistry, targetContract),
  'RNE_TARGET_SOURCE_UNAUTHORIZED:RNE'
);
const missingSourceAuthority = clone(targetRequest);
missingSourceAuthority.source.sourceAuthorityReference = '';
expectThrow(
  () => buildTargetState(currentPosition, missingSourceAuthority, targetSourceRegistry, targetContract),
  'RNE_TARGET_SOURCE_AUTHORITY_REFERENCE_REQUIRED'
);

const graphRequest = readJson(`${base}/fixtures/navigation-constraint-graph.request.valid.json`);
const graph = buildNavigationConstraintGraph(
  currentPosition,
  targetState,
  graphRequest,
  roleRegistry,
  graphContract
);
assert.equal(validateGraph(graph), true, JSON.stringify(validateGraph.errors));
assertRecordDigest(graph, 'graphDigest');
assert.equal(graph.nodes.length, 3);
assert.equal(graph.edgeCount, 1);
assert.ok(graph.unknownConstraintReferences.includes('RMO-CONSTRAINT-UNKNOWN-VALIDATION-0003'));
assert.ok(graph.unknownConstraintReferences.includes('RMO-CONSTRAINT-DEPENDENCY-VALIDATION-0001'));
assert.equal(graph.authorityBoundary.constraintTruthAuthority, 'RMO');
assert.equal(graph.authorityBoundary.constraintNavigationRoleAuthority, 'RNE');
assert.equal(graph.realityConstraintCreated, false);
assert.equal(graph.professionalJudgmentCreated, false);
assert.deepEqual(
  buildNavigationConstraintGraph(currentPosition, targetState, clone(graphRequest), roleRegistry, graphContract),
  graph
);

const unknownConstraint = clone(graphRequest);
unknownConstraint.nodes[0].authorityConstraintReference = 'RMO-CONSTRAINT-NOT-IN-CURRENT-POSITION';
expectThrow(
  () => buildNavigationConstraintGraph(currentPosition, targetState, unknownConstraint, roleRegistry, graphContract),
  'RNE_CONSTRAINT_GRAPH_UNKNOWN_CURRENT_CONSTRAINT:RMO-CONSTRAINT-NOT-IN-CURRENT-POSITION'
);
const cyclicGraph = clone(graphRequest);
cyclicGraph.nodes[0].dependsOnConstraintReferences = ['RMO-CONSTRAINT-SOFT-VALIDATION-0002'];
expectThrow(
  () => buildNavigationConstraintGraph(currentPosition, targetState, cyclicGraph, roleRegistry, graphContract),
  'RNE_CONSTRAINT_GRAPH_CYCLE:'
);

const optionRequest = readJson(`${base}/fixtures/bounded-option-generation.request.valid.json`);
const optionSet = generateBoundedOptionSet(
  currentPosition,
  targetState,
  graph,
  optionRequest,
  optionRegistry,
  optionContract
);
assert.equal(validateOptionSet(optionSet), true, JSON.stringify(validateOptionSet.errors));
assertRecordDigest(optionSet, 'optionSetDigest');
assert.deepEqual(
  optionSet.options.map(option => option.optionClass),
  ['OBSERVE', 'CLARIFY', 'VERIFY', 'RECONFIGURE']
);
assert.ok(optionSet.options.length >= 2);
assert.equal(optionSet.selectionMade, false);
assert.equal(optionSet.rankingCreated, false);
assert.equal(optionSet.recommendedDirectionCreated, false);
assert.equal(optionSet.commandCreated, false);
assert.equal(optionSet.executionCreated, false);
assert.equal(optionSet.riskAssessmentCreated, false);
assert.equal(optionSet.recoverabilityAssessmentCreated, false);
assert.equal(optionSet.scenarioPredictionCreated, false);
assert.equal(optionSet.professionalJudgmentCreated, false);
assert.ok(optionSet.options.every(option => option.selectionState === 'AVAILABLE_NOT_SELECTED'));
assert.ok(optionSet.options.every(option => option.commandCreated === false));
assert.ok(optionSet.options.every(option => option.executionCreated === false));
assert.deepEqual(
  generateBoundedOptionSet(currentPosition, targetState, graph, clone(optionRequest), optionRegistry, optionContract),
  optionSet
);

const hardGraphRequest = clone(graphRequest);
hardGraphRequest.nodes[1].navigationRole = 'HARD_BOUNDARY';
hardGraphRequest.nodes[1].blockingClass = 'BLOCKING';
const hardGraph = buildNavigationConstraintGraph(
  currentPosition,
  targetState,
  hardGraphRequest,
  roleRegistry,
  graphContract
);
const hardOptions = generateBoundedOptionSet(
  currentPosition,
  targetState,
  hardGraph,
  { optionSetCode: 'RNE-OPTION-SET-VALIDATION-HARD-0002' },
  optionRegistry,
  optionContract
);
assert.ok(hardOptions.options.some(option => option.optionClass === 'REPOSITION'));
assert.equal(hardOptions.options.some(option => option.optionClass === 'RECONFIGURE'), false);

const tamperedTarget = clone(targetState);
tamperedTarget.targetStatement = 'tampered';
expectThrow(
  () => buildNavigationConstraintGraph(currentPosition, tamperedTarget, graphRequest, roleRegistry, graphContract),
  'RNE_DIGEST_MISMATCH:targetDigest'
);

assert.equal(acceptance.status, 'accept_validation_only_navigation_foundation');
assert.equal(acceptance.requiredChecker, 'scripts/check-rne-w0-w4-navigation-foundation.mjs');
assert.equal(freeze.status, 'FROZEN_VALIDATION_ONLY_NAVIGATION_FOUNDATION');
assert.deepEqual(freeze.completedWork, ['RNE-W0', 'RNE-W1', 'RNE-W2', 'RNE-W3', 'RNE-W4']);
assert.equal(freeze.authorityReconciliation.jrDistinctFromRne, true);
assert.equal(freeze.authorityReconciliation.existingRneRdgAuthorityPreserved, true);
assert.equal(freeze.authorityReconciliation.legacyNavigationCutover, false);
assert.equal(freeze.blockingGate.persistentRreReadoutBindingAllowed, false);
assert.equal(freeze.blockingGate.jrProductionIntegrationAllowedByThisFreeze, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
for (const output of freeze.frozenOutputs) assert.ok(exists(output), `missing frozen output: ${output}`);

assert.equal(packageJson.scripts['check:rne-w0-w4'], 'node scripts/check-rne-w0-w4-navigation-foundation.mjs');
assert.equal(packageJson.scripts['check:rne-foundation'], 'npm run check:rne-w0-w4');
assert.equal(packageJson.scripts['check:rne'], 'npm run check:rne-foundation');

console.log('✓ RNE-W0-W4 Reality Navigation Engine foundation passed.');
console.log('✓ JR workflow and RNE navigation intelligence remain explicitly separate.');
console.log('✓ Current Position, authorized Target, Constraint Graph and multiple bounded Options are validation-only.');
console.log('✓ No target invention, option selection, ranking, command, execution, risk, recovery, scenario or Professional Judgment authority was activated.');
console.log('✓ Persistent RRE Readout binding remains blocked pending versioned governance reconciliation.');
