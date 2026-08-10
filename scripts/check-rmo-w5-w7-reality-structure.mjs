import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  buildCanonicalInput,
  verifyCanonicalInput
} from './lib/input-case-runtime/icr-input-foundation-v1.mjs';
import {
  buildCanonicalCase,
  buildRealityInitializationRequest
} from './lib/input-case-runtime/icr-case-runtime-v1.mjs';
import {
  buildCanonicalReality,
  buildRealityEntity,
  buildRealityEvent,
  buildRealitySignal
} from './lib/reality-model-runtime/rmo-reality-foundation-v1.mjs';
import {
  assertRealityConstraintDigest,
  assertRealityRelationshipDigest,
  assertRealityStateDigest,
  buildRealityConstraint,
  buildRealityRelationship,
  buildRealityState,
  stableDigest
} from './lib/reality-model-runtime/rmo-reality-structure-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const normalizedHash = relative => crypto.createHash('sha256')
  .update(readText(relative).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const clone = value => structuredClone(value);
const sorted = values => [...values].sort();
const expectThrow = (fn, code) => assert.throws(
  fn,
  error => error?.message?.startsWith(code),
  `Expected error starting with ${code}`
);

const base = 'content/runtime/reality-model-runtime';
const audit = readJson(`${base}/audits/rmo-w5-w7-structure-authority-reconciliation-v1.json`);
const relationshipContract = readJson(`${base}/contracts/relationship-runtime-contract-v1.json`);
const constraintContract = readJson(`${base}/contracts/constraint-runtime-contract-v1.json`);
const stateContract = readJson(`${base}/contracts/reality-state-runtime-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rmo-w5-w7-acceptance-contract-v1.json`);
const relationshipRegistry = readJson(`${base}/registries/canonical-relationship-type-registry-v1.json`);
const constraintRegistry = readJson(`${base}/registries/canonical-constraint-type-registry-v1.json`);
const realityStateRegistry = readJson(`${base}/registries/canonical-reality-state-class-registry-v1.json`);
const priorFreeze = readJson(`${base}/freeze/rmo-w0-w4-reality-foundation-freeze-v1.json`);
const preservation = readJson(`${base}/freeze/rmo-w0-w4-content-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/rmo-w5-w7-reality-structure-freeze-v1.json`);

const relationshipContextEntityFixture = readJson(`${base}/fixtures/relationship-context-entity.request.valid.json`);
const relationshipFixture = readJson(`${base}/fixtures/reality-relationship.request.valid.json`);
const constraintFixture = readJson(`${base}/fixtures/reality-constraint.request.valid.json`);
const observedStateFixture = readJson(`${base}/fixtures/reality-state-observed.request.valid.json`);
const derivedStateFixture = readJson(`${base}/fixtures/reality-state-derived.request.valid.json`);
const projectedStateFixture = readJson(`${base}/fixtures/reality-state-projected.request.valid.json`);

assert.equal(audit.status, 'reconciled');
assert.equal(audit.baselineCommit, '5430224d5fb21232d77c19b0f854ba4f802a73a7');
assert.equal(audit.scope, 'RMO-W5-W7 Relationship, Constraint and Reality State Runtime');
assert.equal(audit.digestMode, 'UTF8_NO_BOM_LF');
for (const authority of audit.inspectedAuthorities) {
  assert.ok(fs.existsSync(path.join(root, authority.reference)), `audited authority missing: ${authority.reference}`);
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority drift: ${authority.reference}`);
}
assert.equal(audit.authorityDecision.realityRelationshipOwner, 'RMO');
assert.equal(audit.authorityDecision.pwsRegistryRelationshipOwner, 'PWS');
assert.equal(audit.authorityDecision.realityConstraintOwner, 'RMO');
assert.equal(audit.authorityDecision.navigationConstraintOwner, 'EXISTING_RUNTIME');
assert.equal(audit.authorityDecision.realityStateClassOwner, 'RMO');
assert.equal(audit.authorityDecision.dataNatureAndCertaintyOwner, 'RDG');
assert.deepEqual(audit.authorityDecision.stateClasses, ['OBSERVED', 'DERIVED', 'PROJECTED']);
assert.equal(audit.authorityDecision.projectedIsRdgDataNature, false);
assert.equal(audit.authorityDecision.projectedIsPredictionAuthority, false);
assert.equal(audit.existingRuntimeOrUserDataMutated, false);

assert.equal(priorFreeze.status, 'RMO-W0-W4-FOUNDATION-FROZEN');
assert.equal(preservation.sourceFreezeReference, `${base}/freeze/rmo-w0-w4-reality-foundation-freeze-v1.json`);
assert.equal(preservation.digestMode, 'UTF8_NO_BOM_LF');
assert.deepEqual(
  sorted(preservation.files.map(entry => entry.path)),
  sorted(priorFreeze.frozenOutputs),
  'preservation manifest must cover every RMO-W0-W4 frozen output exactly once'
);
for (const entry of preservation.files) {
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W0-W4 content drift: ${entry.path}`);
}
assert.equal(preservation.rules.contentDriftFailsClosed, true);
assert.equal(preservation.rules.lineEndingConversionIgnored, true);
assert.equal(preservation.rules.substantiveChangeIgnored, false);

assert.equal(relationshipContract.work, 'RMO-W5');
assert.equal(relationshipContract.rules.relationshipBindsTwoKnownRealityEntities, true);
assert.equal(relationshipContract.rules.relationshipIsPwsRegistryRelationship, false);
assert.equal(relationshipContract.rules.relationshipIsOperationalLineage, false);
assert.equal(relationshipContract.rules.relationshipCreatesSensitiveInference, false);
assert.equal(constraintContract.work, 'RMO-W6');
assert.equal(constraintContract.rules.constraintModeIsDescriptiveOnly, true);
assert.equal(constraintContract.rules.constraintIsNavigationRule, false);
assert.equal(constraintContract.rules.constraintCreatesNavigationPathOrChoice, false);
assert.equal(constraintContract.rules.constraintAutomaticallyEnforced, false);
assert.equal(stateContract.work, 'RMO-W7');
assert.deepEqual(stateContract.stateClasses, ['OBSERVED', 'DERIVED', 'PROJECTED']);
assert.equal(stateContract.rules.stateClassIsIndependentFromDataNature, true);
assert.equal(stateContract.rules.observedDoesNotEqualTruth, true);
assert.equal(stateContract.rules.derivedIsInference, false);
assert.equal(stateContract.rules.projectedIsRdgDataNature, false);
assert.equal(stateContract.rules.projectedIsPredictionAuthority, false);

for (const registry of [relationshipRegistry, constraintRegistry, realityStateRegistry]) {
  assert.equal(registry.runtimeAuthority, 'RMO');
  assert.equal(registry.containsUserData, false);
  assert.deepEqual(registry.instances, []);
}
assert.deepEqual(relationshipRegistry.relationshipTypes.map(entry => entry.relationshipType), [
  'ASSOCIATION', 'PARTICIPATION', 'DEPENDENCY', 'CONTAINMENT', 'RESOURCE_BINDING', 'CONTEXT_BINDING'
]);
assert.ok(relationshipRegistry.relationshipTypes.every(entry => entry.selfRelationshipAllowed === false));
assert.equal(relationshipRegistry.rules.sensitiveRelationshipInferenceDenied, true);
assert.deepEqual(constraintRegistry.constraintTypes.map(entry => entry.constraintType), [
  'BOUNDARY', 'REQUIREMENT', 'LIMIT', 'DEPENDENCY', 'CAPACITY', 'TEMPORAL_WINDOW'
]);
assert.equal(constraintRegistry.rules.allConstraintsDescriptiveOnly, true);
assert.equal(constraintRegistry.rules.navigationRulesUnaffected, true);
assert.deepEqual(realityStateRegistry.stateClasses.map(entry => entry.stateClass), [
  'OBSERVED', 'DERIVED', 'PROJECTED'
]);
assert.deepEqual(
  realityStateRegistry.stateClasses.find(entry => entry.stateClass === 'OBSERVED').allowedDataNatures,
  ['OBSERVED', 'USER_REPORTED', 'IMPORTED']
);
assert.deepEqual(
  realityStateRegistry.stateClasses.find(entry => entry.stateClass === 'DERIVED').allowedDataNatures,
  ['CALCULATED', 'DERIVED']
);
assert.deepEqual(
  realityStateRegistry.stateClasses.find(entry => entry.stateClass === 'PROJECTED').allowedDataNatures,
  ['CALCULATED', 'DERIVED']
);
assert.equal(realityStateRegistry.rules.projectedIsNotRdgDataNature, true);
assert.equal(realityStateRegistry.rules.projectedBasisMayIncludeProjectedState, false);

const icrBase = 'content/runtime/input-case-runtime';
const canonicalInputContract = readJson(`${icrBase}/contracts/canonical-input-contract-v1.json`);
const inputTypeRegistry = readJson(`${icrBase}/registries/canonical-input-type-registry-v1.json`);
const caseStateRegistry = readJson(`${icrBase}/registries/case-state-transition-registry-v1.json`);
const rdgReferenceRegistry = readJson(`${icrBase}/registries/icr-rdg-reference-registry-v1.json`);
const canonicalInputFixture = readJson(`${icrBase}/fixtures/canonical-input.request.valid.json`);
const verificationFixture = readJson(`${icrBase}/fixtures/input-verification.request.valid.json`);
const caseFixture = readJson(`${icrBase}/fixtures/canonical-case.request.valid.json`);
const initializationFixture = readJson(`${icrBase}/fixtures/reality-initialization.request.valid.json`);

const rdg = {
  purposes: readJson('content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json'),
  consents: readJson('content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json'),
  persistence: readJson('content/governance/reality-data-governance/registries/canonical-persistence-class-registry-v1.json'),
  retention: readJson('content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json'),
  sensitivity: readJson('content/governance/reality-data-governance/registries/canonical-data-sensitivity-registry-v1.json'),
  deletion: readJson('content/governance/reality-data-governance/contracts/deletion-tombstone-runtime-v1.json'),
  natures: readJson('content/governance/reality-data-governance/registries/canonical-data-nature-registry-v1.json'),
  certainties: readJson('content/governance/reality-data-governance/registries/canonical-data-certainty-registry-v1.json')
};

const entityRegistry = readJson(`${base}/registries/canonical-entity-type-registry-v1.json`);
const eventRegistry = readJson(`${base}/registries/canonical-event-type-registry-v1.json`);
const signalRegistry = readJson(`${base}/registries/canonical-signal-type-registry-v1.json`);
const realityAcceptanceFixture = readJson(`${base}/fixtures/reality-initialization.acceptance.valid.json`);
const entityFixture = readJson(`${base}/fixtures/reality-entity.request.valid.json`);
const eventFixture = readJson(`${base}/fixtures/reality-event.request.valid.json`);
const signalFixture = readJson(`${base}/fixtures/reality-signal.request.valid.json`);

const canonicalInput = buildCanonicalInput(
  canonicalInputFixture,
  inputTypeRegistry,
  rdg,
  canonicalInputContract
);
const verifiedInput = verifyCanonicalInput(
  canonicalInput,
  verificationFixture,
  inputTypeRegistry,
  rdg
);
const canonicalCase = buildCanonicalCase(
  caseFixture,
  [verifiedInput],
  caseStateRegistry,
  rdg,
  rdgReferenceRegistry
);
const initializationRequest = buildRealityInitializationRequest(
  canonicalCase,
  initializationFixture,
  caseStateRegistry
);
const reality = buildCanonicalReality(
  canonicalCase,
  initializationRequest,
  realityAcceptanceFixture
);
const subjectEntity = buildRealityEntity(reality, entityFixture, entityRegistry, rdg);
const contextEntity = buildRealityEntity(
  reality,
  relationshipContextEntityFixture,
  entityRegistry,
  rdg
);
const event = buildRealityEvent(reality, eventFixture, eventRegistry, rdg, [subjectEntity]);
const signal = buildRealitySignal(reality, signalFixture, signalRegistry, rdg, [subjectEntity], [event]);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateRelationship = ajv.compile(readJson(`${base}/schemas/canonical-reality-relationship-v1.schema.json`));
const validateConstraint = ajv.compile(readJson(`${base}/schemas/canonical-reality-constraint-v1.schema.json`));
const validateState = ajv.compile(readJson(`${base}/schemas/canonical-reality-state-v1.schema.json`));

const relationship = buildRealityRelationship(
  reality,
  relationshipFixture,
  relationshipRegistry,
  rdg,
  [subjectEntity, contextEntity]
);
assert.equal(validateRelationship(relationship), true, JSON.stringify(validateRelationship.errors));
assertRealityRelationshipDigest(relationship);
assert.equal(relationship.componentType, 'REALITY_RELATIONSHIP');
assert.equal(relationship.directionality, 'DIRECTED');
assert.equal(relationship.sourceEntityReference, subjectEntity.entityCode);
assert.equal(relationship.targetEntityReference, contextEntity.entityCode);
assert.equal(relationship.evidenceEligibility, 'NOT_EVALUATED');
assert.equal(relationship.interpretationState, 'NOT_INTERPRETED');
assert.equal(relationship.inferenceState, 'NOT_INFERRED');
assert.equal(relationship.professionalJudgmentCreated, false);
assert.equal(relationship.pwsRegistryWriteAllowed, false);
assert.equal(relationship.operationalLineageWriteAllowed, false);
assert.equal(Object.isFrozen(relationship), true);
assert.equal(Object.hasOwn(relationship, 'payload'), false);
assert.deepEqual(
  buildRealityRelationship(reality, relationshipFixture, relationshipRegistry, rdg, [subjectEntity, contextEntity]),
  relationship
);
expectThrow(
  () => buildRealityRelationship(
    reality,
    { ...relationshipFixture, targetEntityReference: 'RMO-ENTITY-UNKNOWN-0001' },
    relationshipRegistry,
    rdg,
    [subjectEntity, contextEntity]
  ),
  'RMO_RELATIONSHIP_TARGET_ENTITY_REFERENCE_UNKNOWN:RMO-ENTITY-UNKNOWN-0001'
);
const crossRealityEntity = clone(contextEntity);
crossRealityEntity.realityReference.realityCode = 'RMO-REALITY-OTHER-0001';
delete crossRealityEntity.entityDigest;
crossRealityEntity.entityDigest = stableDigest(crossRealityEntity);
expectThrow(
  () => buildRealityRelationship(
    reality,
    relationshipFixture,
    relationshipRegistry,
    rdg,
    [subjectEntity, crossRealityEntity]
  ),
  'RMO_RELATIONSHIP_TARGET_ENTITY_REFERENCE_REALITY_BINDING_INVALID'
);
expectThrow(
  () => buildRealityRelationship(
    reality,
    { ...relationshipFixture, targetEntityReference: relationshipFixture.sourceEntityReference },
    relationshipRegistry,
    rdg,
    [subjectEntity, contextEntity]
  ),
  'RMO_RELATIONSHIP_SELF_REFERENCE_FORBIDDEN'
);
expectThrow(
  () => buildRealityRelationship(
    reality,
    { ...relationshipFixture, dataNature: 'INFERRED' },
    relationshipRegistry,
    rdg,
    [subjectEntity, contextEntity]
  ),
  'RMO_RELATIONSHIP_DATA_NATURE_FORBIDDEN'
);
expectThrow(
  () => buildRealityRelationship(
    reality,
    { ...relationshipFixture, professionalJudgment: {} },
    relationshipRegistry,
    rdg,
    [subjectEntity, contextEntity]
  ),
  'RMO_RELATIONSHIP_FIELD_FORBIDDEN:professionalJudgment'
);
expectThrow(
  () => buildRealityRelationship(
    reality,
    { ...relationshipFixture, providerUsed: true },
    relationshipRegistry,
    rdg,
    [subjectEntity, contextEntity]
  ),
  'RMO_RELATIONSHIP_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedRelationship = clone(relationship);
tamperedRelationship.directionality = 'UNDIRECTED';
expectThrow(() => assertRealityRelationshipDigest(tamperedRelationship), 'RMO_RELATIONSHIP_DIGEST_INVALID');

const foundationComponents = [subjectEntity, contextEntity, event, signal, relationship];
const constraint = buildRealityConstraint(
  reality,
  constraintFixture,
  constraintRegistry,
  rdg,
  foundationComponents
);
assert.equal(validateConstraint(constraint), true, JSON.stringify(validateConstraint.errors));
assertRealityConstraintDigest(constraint);
assert.equal(constraint.componentType, 'REALITY_CONSTRAINT');
assert.equal(constraint.constraintMode, 'DESCRIPTIVE_ONLY');
assert.equal(constraint.enforcementState, 'NOT_ENFORCED');
assert.equal(constraint.navigationRestrictionCreated, false);
assert.equal(constraint.professionalJudgmentCreated, false);
assert.equal(constraint.evidenceEligibility, 'NOT_EVALUATED');
assert.equal(Object.isFrozen(constraint), true);
assert.equal(Object.hasOwn(constraint, 'severity'), false);
assert.deepEqual(
  buildRealityConstraint(reality, constraintFixture, constraintRegistry, rdg, foundationComponents),
  constraint
);
expectThrow(
  () => buildRealityConstraint(
    reality,
    { ...constraintFixture, componentReferences: ['RMO-RELATIONSHIP-UNKNOWN-0001'] },
    constraintRegistry,
    rdg,
    foundationComponents
  ),
  'RMO_CONSTRAINT_COMPONENT_REFERENCE_UNKNOWN:RMO-RELATIONSHIP-UNKNOWN-0001'
);
expectThrow(
  () => buildRealityConstraint(
    reality,
    { ...constraintFixture, constraintScope: 'EVENT' },
    constraintRegistry,
    rdg,
    foundationComponents
  ),
  'RMO_CONSTRAINT_SCOPE_BINDING_MISSING'
);
expectThrow(
  () => buildRealityConstraint(
    reality,
    { ...constraintFixture, dataNature: 'DERIVED' },
    constraintRegistry,
    rdg,
    foundationComponents
  ),
  'RMO_CONSTRAINT_DATA_NATURE_FORBIDDEN'
);
const invalidIntervalConstraint = clone(constraintFixture);
invalidIntervalConstraint.validity = {
  mode: 'INTERVAL',
  startsAt: '2026-08-12T00:00:00.000Z',
  endsAt: '2026-08-11T00:00:00.000Z'
};
expectThrow(
  () => buildRealityConstraint(
    reality,
    invalidIntervalConstraint,
    constraintRegistry,
    rdg,
    foundationComponents
  ),
  'RMO_CONSTRAINT_VALIDITY_INTERVAL_INVALID'
);
expectThrow(
  () => buildRealityConstraint(
    reality,
    { ...constraintFixture, navigationRestrictionCreated: true },
    constraintRegistry,
    rdg,
    foundationComponents
  ),
  'RMO_CONSTRAINT_FIELD_FORBIDDEN:navigationRestrictionCreated'
);
const tamperedConstraint = clone(constraint);
tamperedConstraint.enforcementState = 'ENFORCED';
expectThrow(() => assertRealityConstraintDigest(tamperedConstraint), 'RMO_CONSTRAINT_DIGEST_INVALID');

const observedState = buildRealityState(
  reality,
  observedStateFixture,
  realityStateRegistry,
  rdg,
  [...foundationComponents, constraint]
);
assert.equal(validateState(observedState), true, JSON.stringify(validateState.errors));
assertRealityStateDigest(observedState);
assert.equal(observedState.stateClass, 'OBSERVED');
assert.equal(observedState.binding.mode, 'OBSERVATION');
assert.equal(observedState.truthClaimed, false);
assert.equal(observedState.evidenceEligibility, 'NOT_EVALUATED');

const derivedState = buildRealityState(
  reality,
  derivedStateFixture,
  realityStateRegistry,
  rdg,
  [...foundationComponents, constraint, observedState]
);
assert.equal(validateState(derivedState), true, JSON.stringify(validateState.errors));
assertRealityStateDigest(derivedState);
assert.equal(derivedState.stateClass, 'DERIVED');
assert.equal(derivedState.dataNature, 'DERIVED');
assert.equal(derivedState.binding.mode, 'DERIVATION');
assert.equal(derivedState.binding.derivation.deterministic, true);
assert.deepEqual(derivedState.binding.derivation.inputReferences, derivedState.componentReferences);
assert.equal(derivedState.inferenceState, 'NOT_INFERRED');
assert.equal(derivedState.interpretationState, 'NOT_INTERPRETED');

const projectedStateComponents = [
  ...foundationComponents,
  constraint,
  observedState,
  derivedState
];
const projectedState = buildRealityState(
  reality,
  projectedStateFixture,
  realityStateRegistry,
  rdg,
  projectedStateComponents
);
assert.equal(validateState(projectedState), true, JSON.stringify(validateState.errors));
assertRealityStateDigest(projectedState);
assert.equal(projectedState.stateClass, 'PROJECTED');
assert.equal(projectedState.dataNature, 'DERIVED');
assert.equal(projectedState.binding.mode, 'PROJECTION');
assert.deepEqual(projectedState.binding.projection.basisReferences, projectedState.componentReferences);
assert.equal(projectedState.predictionClaimed, false);
assert.equal(projectedState.navigationChoiceCreated, false);
assert.equal(projectedState.actionExecutionCreated, false);
assert.equal(projectedState.professionalJudgmentCreated, false);
assert.equal(Object.isFrozen(projectedState), true);
assert.equal(Object.hasOwn(projectedState, 'probability'), false);
assert.deepEqual(
  buildRealityState(reality, projectedStateFixture, realityStateRegistry, rdg, projectedStateComponents),
  projectedState
);

assert.deepEqual(
  [observedState, derivedState, projectedState].map(state => state.stateClass),
  ['OBSERVED', 'DERIVED', 'PROJECTED']
);
assert.ok([observedState, derivedState, projectedState].every(state =>
  state.evidenceEligibility === 'NOT_EVALUATED' &&
  state.interpretationState === 'NOT_INTERPRETED' &&
  state.inferenceState === 'NOT_INFERRED' &&
  state.persistentStoreWriteAllowed === false
));

expectThrow(
  () => buildRealityState(
    reality,
    { ...observedStateFixture, stateClass: 'INFERRED' },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_CLASS_UNKNOWN'
);
expectThrow(
  () => buildRealityState(
    reality,
    { ...observedStateFixture, binding: clone(derivedStateFixture.binding) },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_CLASS_BINDING_MISMATCH'
);
const incompleteDerivation = clone(derivedStateFixture);
incompleteDerivation.binding.derivation.inputReferences = ['RMO-RELATIONSHIP-VALIDATION-0001'];
expectThrow(
  () => buildRealityState(
    reality,
    incompleteDerivation,
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_DERIVATION_INPUT_LINEAGE_INCOMPLETE'
);
expectThrow(
  () => buildRealityState(
    reality,
    { ...derivedStateFixture, dataNature: 'INFERRED' },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_DATA_NATURE_FORBIDDEN'
);
const incompleteProjection = clone(projectedStateFixture);
incompleteProjection.binding.projection.basisReferences = ['RMO-CONSTRAINT-VALIDATION-0001'];
expectThrow(
  () => buildRealityState(
    reality,
    incompleteProjection,
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_PROJECTION_BASIS_LINEAGE_INCOMPLETE'
);
expectThrow(
  () => buildRealityState(
    reality,
    { ...projectedStateFixture, dataNature: 'OBSERVED' },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_DATA_NATURE_FORBIDDEN'
);
expectThrow(
  () => buildRealityState(
    reality,
    { ...projectedStateFixture, dataNature: 'PROJECTED' },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_DATA_NATURE_FORBIDDEN'
);
const recursiveProjection = clone(projectedStateFixture);
recursiveProjection.stateCode = 'RMO-STATE-PROJECTED-VALIDATION-0002';
recursiveProjection.componentReferences = [projectedState.stateCode];
recursiveProjection.sourceReferences = [projectedState.stateCode];
recursiveProjection.binding.projection.basisReferences = [projectedState.stateCode];
recursiveProjection.binding.projection.generatedAt = '2026-08-10T07:31:00.000Z';
recursiveProjection.binding.projection.horizon = {
  startsAt: '2026-08-18T00:00:00.000Z',
  endsAt: '2026-08-24T00:00:00.000Z'
};
recursiveProjection.createdAt = '2026-08-10T07:32:00.000Z';
expectThrow(
  () => buildRealityState(
    reality,
    recursiveProjection,
    realityStateRegistry,
    rdg,
    [projectedState]
  ),
  'RMO_STATE_PROJECTED_BASIS_RECURSION_FORBIDDEN'
);
expectThrow(
  () => buildRealityState(
    reality,
    { ...projectedStateFixture, predictionClaimed: true },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_FIELD_FORBIDDEN:predictionClaimed'
);
expectThrow(
  () => buildRealityState(
    reality,
    { ...projectedStateFixture, aiUsed: true },
    realityStateRegistry,
    rdg,
    projectedStateComponents
  ),
  'RMO_STATE_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedState = clone(projectedState);
tamperedState.predictionClaimed = true;
expectThrow(() => assertRealityStateDigest(tamperedState), 'RMO_STATE_DIGEST_INVALID');

assert.ok(Object.values(reality.componentReferences).every(references => references.length === 0));
assert.equal(reality.realityVersion, '1.0.0');
assert.equal(reality.realityVersionSequence, 1);

assert.equal(acceptance.baselineCommit, '5430224d5fb21232d77c19b0f854ba4f802a73a7');
assert.deepEqual(acceptance.requiredWork, ['RMO-W5', 'RMO-W6', 'RMO-W7']);
assert.equal(acceptance.acceptanceRules.w0W4FoundationPreserved, true);
assert.equal(acceptance.acceptanceRules.observedDerivedProjectedRemainDistinct, true);
assert.equal(acceptance.acceptanceRules.projectedAddedAsRdgDataNature, false);
assert.equal(acceptance.acceptanceRules.evidencePromotionActivated, false);
assert.equal(acceptance.acceptanceRules.packageJsonModifiedByDelivery, false);
assert.equal(freeze.status, 'RMO-W5-W7-STRUCTURE-FROZEN');
assert.deepEqual(freeze.completedWork, ['RMO-W5', 'RMO-W6', 'RMO-W7']);
assert.equal(freeze.previousFoundationPreservation.allPriorFrozenOutputsPreserved, true);
assert.equal(freeze.deliveryBoundary.packageJsonModified, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
assert.equal(freeze.nextWork, 'RMO-W8');
for (const output of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(path.join(root, output)), `frozen output missing: ${output}`);
}

const manualWiring = readText('docs/runtime/RMO-W5-W7-PACKAGE-MANUAL-WIRING.md');
assert.match(manualWiring, /"check:rmo-w5-w7": "node scripts\/check-rmo-w5-w7-reality-structure\.mjs"/);
assert.match(manualWiring, /"check:rmo-structure": "npm run check:rmo-w5-w7"/);
assert.match(manualWiring, /"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure"/);
assert.match(manualWiring, /npm run check:icr-runtime && npm run check:rmo && npm run check:alr-knowledge-learning && npm run check:alr-practice/);

for (const authority of audit.inspectedAuthorities) {
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority mutated during check: ${authority.reference}`);
}
for (const entry of preservation.files) {
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W0-W4 mutated during check: ${entry.path}`);
}

console.log('✓ RMO-W5-W7 Relationship / Constraint / Reality State Runtime passed.');
console.log('✓ OBSERVED, DERIVED and PROJECTED remain distinct from RDG data nature, certainty, Evidence, Inference and Interpretation.');
console.log('✓ PWS relationships, Runtime lineage, Navigation, persistence, professional judgment, Provider/AI and production execution remain inactive.');
