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
  buildRealityConstraint,
  buildRealityRelationship,
  buildRealityState
} from './lib/reality-model-runtime/rmo-reality-structure-v1.mjs';
import {
  buildRealityEvidenceBinding,
  buildRealityReasoningBoundary
} from './lib/reality-model-runtime/rmo-evidence-reasoning-v1.mjs';
import {
  buildRealityAction,
  buildRealityOutcome,
  buildRealityUnknown
} from './lib/reality-model-runtime/rmo-reality-lifecycle-v1.mjs';
import {
  REALITY_COMPONENT_FAMILIES,
  assertCanonicalRealityVersionDigest,
  assertRealityDiffDigest,
  buildRealityDiff,
  buildRealityVersion,
  stableDigest
} from './lib/reality-model-runtime/rmo-reality-versioning-v1.mjs';

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
const redigest = (record, field) => {
  delete record[field];
  record[field] = stableDigest(record);
  return record;
};

const packageBefore = readText('package.json');
const base = 'content/runtime/reality-model-runtime';
const audit = readJson(`${base}/audits/rmo-w13-w15-version-diff-freeze-authority-reconciliation-v1.json`);
const versioningContract = readJson(`${base}/contracts/reality-versioning-contract-v1.json`);
const diffContract = readJson(`${base}/contracts/reality-diff-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rmo-w13-w15-acceptance-contract-v1.json`);
const changeTypeRegistry = readJson(`${base}/registries/canonical-reality-change-type-registry-v1.json`);
const previousFreeze = readJson(`${base}/freeze/rmo-w10-w12-reality-lifecycle-freeze-v1.json`);
const preservation = readJson(`${base}/freeze/rmo-w0-w14-content-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/rmo-v1-freeze-v1.json`);
const versionRequestFixture = readJson(`${base}/fixtures/reality-version.request.valid.json`);
const diffRequestFixture = readJson(`${base}/fixtures/reality-diff.request.valid.json`);

assert.equal(audit.status, 'reconciled');
assert.equal(audit.baselineCommit, '94fd1887e75c4b4c95a9c2dc4fe010c3e350d0ec');
assert.equal(audit.scope, 'RMO-W13 Reality Versioning, RMO-W14 Reality Diff and RMO-W15 RMO Freeze');
assert.equal(audit.digestMode, 'UTF8_NO_BOM_LF');
for (const authority of audit.inspectedAuthorities) {
  assert.ok(fs.existsSync(path.join(root, authority.reference)), `audited authority missing: ${authority.reference}`);
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority drift: ${authority.reference}`);
}
assert.equal(audit.authorityDecision.realitySnapshotAndVersionLineageOwner, 'RMO');
assert.equal(audit.authorityDecision.realityStructuralDiffOwner, 'RMO');
assert.equal(audit.authorityDecision.realityVersionAndDiffDataType, 'RUNTIME_STATE_RECORD');
assert.equal(audit.authorityDecision.evidenceAuthorityOwner, 'RRE');
assert.equal(audit.authorityDecision.dataAndUnknownGovernanceOwner, 'RDG');
assert.equal(audit.authorityDecision.professionalJudgmentOwner, 'PR');
assert.equal(audit.authorityDecision.realityDiffMayInterpretOrDiagnose, false);
assert.equal(audit.authorityDecision.realityDiffMayClaimCausalityOrSuccess, false);
assert.equal(audit.authorityDecision.unknownMayBeSilentlyResolved, false);
assert.equal(audit.authorityDecision.providerOrAiMayGrantAuthority, false);

assert.equal(previousFreeze.status, 'RMO-W10-W12-LIFECYCLE-FROZEN');
assert.equal(versioningContract.work, 'RMO-W13');
assert.equal(versioningContract.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(versioningContract.rules.realityIdentityStable, true);
assert.equal(versioningContract.rules.semanticVersionMustIncrease, true);
assert.equal(versioningContract.rules.versionSequenceMustBeContiguous, true);
assert.equal(versioningContract.rules.previousSnapshotImmutable, true);
assert.equal(versioningContract.rules.exactComponentCodeVersionDigestRequired, true);
assert.equal(versioningContract.rules.completeComponentDependencyClosureRequired, true);
assert.equal(versioningContract.rules.statesAndReasoningBoundariesIncluded, true);
assert.equal(versioningContract.rules.unknownResolutionMayUseInferenceOrSilentDefault, false);
assert.equal(diffContract.work, 'RMO-W14');
assert.equal(diffContract.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(diffContract.rules.sameRealityIdentityRequired, true);
assert.equal(diffContract.rules.orderedAncestorLineageRequired, true);
assert.equal(diffContract.rules.addedRemovedReplacedUnchangedRemainDistinct, true);
assert.equal(diffContract.rules.diffInterpretsMeaning, false);
assert.equal(diffContract.rules.diffDiagnosesReality, false);
assert.equal(diffContract.rules.diffClaimsCausality, false);
assert.equal(diffContract.rules.diffDeterminesSuccessOrEffectiveness, false);
assert.equal(diffContract.rules.diffCreatesProfessionalJudgment, false);

assert.deepEqual(changeTypeRegistry.changeTypes.map(entry => entry.changeType), [
  'COMPONENTS_INCORPORATED',
  'LIFECYCLE_ADVANCED',
  'COMPONENTS_REVISED',
  'UNKNOWN_RESOLUTION_RECORDED',
  'CORRECTION_RECORDED'
]);
assert.equal(changeTypeRegistry.runtimeAuthority, 'RMO');
assert.equal(changeTypeRegistry.rules.changeTypeDoesNotExplainCause, true);
assert.equal(changeTypeRegistry.rules.changeTypeDoesNotDetermineQuality, true);
assert.equal(changeTypeRegistry.containsUserData, false);
assert.deepEqual(changeTypeRegistry.instances, []);
assert.deepEqual(REALITY_COMPONENT_FAMILIES, [
  'entities', 'events', 'signals', 'relationships', 'constraints', 'states',
  'evidenceBindings', 'reasoningBoundaries', 'unknowns', 'actions', 'outcomes'
]);

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
  certainties: readJson('content/governance/reality-data-governance/registries/canonical-data-certainty-registry-v1.json'),
  dataContracts: readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json'),
  unknownDisputed: readJson('content/governance/reality-data-governance/contracts/unknown-disputed-runtime-v1.json')
};
const entityRegistry = readJson(`${base}/registries/canonical-entity-type-registry-v1.json`);
const eventRegistry = readJson(`${base}/registries/canonical-event-type-registry-v1.json`);
const signalRegistry = readJson(`${base}/registries/canonical-signal-type-registry-v1.json`);
const relationshipRegistry = readJson(`${base}/registries/canonical-relationship-type-registry-v1.json`);
const constraintRegistry = readJson(`${base}/registries/canonical-constraint-type-registry-v1.json`);
const stateRegistry = readJson(`${base}/registries/canonical-reality-state-class-registry-v1.json`);
const bindingRoleRegistry = readJson(`${base}/registries/canonical-evidence-binding-role-registry-v1.json`);
const reasoningBoundaryRegistry = readJson(`${base}/registries/canonical-reasoning-boundary-registry-v1.json`);
const unknownKindRegistry = readJson(`${base}/registries/canonical-unknown-kind-registry-v1.json`);
const actionClassRegistry = readJson(`${base}/registries/canonical-action-class-registry-v1.json`);
const outcomeClassRegistry = readJson(`${base}/registries/canonical-outcome-class-registry-v1.json`);

const canonicalInput = buildCanonicalInput(
  canonicalInputFixture,
  inputTypeRegistry,
  rdg,
  canonicalInputContract
);
const verifiedInput = verifyCanonicalInput(canonicalInput, verificationFixture, inputTypeRegistry, rdg);
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
  readJson(`${base}/fixtures/reality-initialization.acceptance.valid.json`)
);
const subjectEntity = buildRealityEntity(
  reality,
  readJson(`${base}/fixtures/reality-entity.request.valid.json`),
  entityRegistry,
  rdg
);
const contextEntity = buildRealityEntity(
  reality,
  readJson(`${base}/fixtures/relationship-context-entity.request.valid.json`),
  entityRegistry,
  rdg
);
const event = buildRealityEvent(
  reality,
  readJson(`${base}/fixtures/reality-event.request.valid.json`),
  eventRegistry,
  rdg,
  [subjectEntity]
);
const signal = buildRealitySignal(
  reality,
  readJson(`${base}/fixtures/reality-signal.request.valid.json`),
  signalRegistry,
  rdg,
  [subjectEntity],
  [event]
);
const relationship = buildRealityRelationship(
  reality,
  readJson(`${base}/fixtures/reality-relationship.request.valid.json`),
  relationshipRegistry,
  rdg,
  [subjectEntity, contextEntity]
);
const foundationComponents = [subjectEntity, contextEntity, event, signal, relationship];
const constraint = buildRealityConstraint(
  reality,
  readJson(`${base}/fixtures/reality-constraint.request.valid.json`),
  constraintRegistry,
  rdg,
  foundationComponents
);
const observedState = buildRealityState(
  reality,
  readJson(`${base}/fixtures/reality-state-observed.request.valid.json`),
  stateRegistry,
  rdg,
  [...foundationComponents, constraint]
);
const derivedState = buildRealityState(
  reality,
  readJson(`${base}/fixtures/reality-state-derived.request.valid.json`),
  stateRegistry,
  rdg,
  [...foundationComponents, constraint, observedState]
);
const projectedState = buildRealityState(
  reality,
  readJson(`${base}/fixtures/reality-state-projected.request.valid.json`),
  stateRegistry,
  rdg,
  [...foundationComponents, constraint, observedState, derivedState]
);
const structuralComponents = [
  ...foundationComponents,
  constraint,
  observedState,
  derivedState,
  projectedState
];
const evidenceRecord = readJson(`${base}/fixtures/rre-evidence-authority-record.accepted.valid.json`);
const evidenceBindingFixture = readJson(`${base}/fixtures/reality-evidence-binding.request.valid.json`);
const evidenceBinding = buildRealityEvidenceBinding(
  reality,
  evidenceBindingFixture,
  bindingRoleRegistry,
  rdg,
  structuralComponents,
  [evidenceRecord]
);
const reasoningBoundary = buildRealityReasoningBoundary(
  reality,
  readJson(`${base}/fixtures/reality-reasoning-boundary.inference.valid.json`),
  reasoningBoundaryRegistry,
  rdg,
  structuralComponents,
  [evidenceBinding]
);
const unknown = buildRealityUnknown(
  reality,
  readJson(`${base}/fixtures/reality-unknown.request.valid.json`),
  unknownKindRegistry,
  rdg,
  structuralComponents,
  [evidenceBinding]
);
const action = buildRealityAction(
  reality,
  readJson(`${base}/fixtures/reality-action.request.valid.json`),
  actionClassRegistry,
  rdg,
  structuralComponents,
  [evidenceBinding],
  [unknown]
);
const outcomeEvidenceRecord = redigest({
  ...clone(evidenceRecord),
  evidenceCode: 'RRE-EVIDENCE-OUTCOME-VALIDATION-0001',
  sourceReference: 'ICR-VERIFIED-OUTCOME-VALIDATION-0001',
  lineageReferences: ['RRE-LINEAGE-OUTCOME-VALIDATION-0001'],
  acceptedAt: '2026-08-10T07:38:00.000Z'
}, 'evidenceDigest');
const outcomeBindingRequest = clone(evidenceBindingFixture);
outcomeBindingRequest.bindingCode = 'RMO-EVIDENCE-BINDING-OUTCOME-VALIDATION-0001';
outcomeBindingRequest.evidenceReference = {
  evidenceCode: outcomeEvidenceRecord.evidenceCode,
  evidenceVersion: outcomeEvidenceRecord.evidenceVersion,
  evidenceDigest: outcomeEvidenceRecord.evidenceDigest
};
outcomeBindingRequest.sourceReferences = [outcomeEvidenceRecord.evidenceCode];
outcomeBindingRequest.createdAt = '2026-08-10T07:39:00.000Z';
const outcomeEvidenceBinding = buildRealityEvidenceBinding(
  reality,
  outcomeBindingRequest,
  bindingRoleRegistry,
  rdg,
  structuralComponents,
  [outcomeEvidenceRecord]
);
const outcome = buildRealityOutcome(
  reality,
  readJson(`${base}/fixtures/reality-outcome.request.valid.json`),
  outcomeClassRegistry,
  rdg,
  structuralComponents,
  [evidenceBinding, outcomeEvidenceBinding],
  [unknown],
  [action]
);

const componentBundle = {
  entities: [contextEntity, subjectEntity],
  events: [event],
  signals: [signal],
  relationships: [relationship],
  constraints: [constraint],
  states: [projectedState, observedState, derivedState],
  evidenceBindings: [outcomeEvidenceBinding, evidenceBinding],
  reasoningBoundaries: [reasoningBoundary],
  unknowns: [unknown],
  actions: [action],
  outcomes: [outcome]
};

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateVersionRequest = ajv.compile(readJson(`${base}/schemas/reality-version-request-v1.schema.json`));
const validateVersion = ajv.compile(readJson(`${base}/schemas/canonical-reality-version-v1.schema.json`));
const validateDiffRequest = ajv.compile(readJson(`${base}/schemas/reality-diff-request-v1.schema.json`));
const validateDiff = ajv.compile(readJson(`${base}/schemas/canonical-reality-diff-v1.schema.json`));

assert.equal(validateVersionRequest(versionRequestFixture), true, JSON.stringify(validateVersionRequest.errors));
const originalReality = clone(reality);
const versionedReality = buildRealityVersion(
  reality,
  versionRequestFixture,
  componentBundle,
  changeTypeRegistry,
  rdg.dataContracts
);
assert.deepEqual(reality, originalReality, 'Reality v1 must not be mutated by versioning');
assert.equal(validateVersion(versionedReality), true, JSON.stringify(validateVersion.errors));
assertCanonicalRealityVersionDigest(versionedReality);
assert.equal(versionedReality.realityCode, reality.realityCode);
assert.equal(versionedReality.realityVersion, '1.1.0');
assert.equal(versionedReality.realityVersionSequence, 2);
assert.equal(versionedReality.realityStatus, 'VERSIONED');
assert.equal(versionedReality.lineage.previousRealityVersion, reality.realityVersion);
assert.equal(versionedReality.lineage.previousRealityDigest, reality.realityDigest);
assert.equal(versionedReality.lineage.ancestorRealityReferences.length, 1);
assert.equal(versionedReality.lineage.ancestorRealityReferences[0].realityDigest, reality.realityDigest);
assert.equal(versionedReality.lineage.structuralChangeSummary.addedCount, 15);
assert.equal(versionedReality.lineage.structuralChangeSummary.removedCount, 0);
assert.equal(versionedReality.lineage.structuralChangeSummary.replacedCount, 0);
assert.deepEqual(versionedReality.lineage.structuralChangeSummary.changedFamilies, REALITY_COMPONENT_FAMILIES);
assert.equal(versionedReality.componentReferences.states.length, 3);
assert.equal(versionedReality.componentReferences.reasoningBoundaries.length, 1);
assert.equal(versionedReality.componentVersionReferences.entities[0].componentCode, contextEntity.entityCode);
assert.equal(
  versionedReality.componentVersionReferences.outcomes[0].componentDigest,
  outcome.outcomeDigest
);
assert.equal(
  stableDigest(versionedReality.componentVersionReferences),
  versionedReality.componentSnapshotDigest
);
assert.equal(versionedReality.unknownResolution.transitionPerformed, false);
assert.equal(versionedReality.persistentStoreWriteAllowed, false);
assert.equal(versionedReality.productionExecutionAllowed, false);
assert.equal(Object.isFrozen(versionedReality), true);

const shuffledBundle = clone(componentBundle);
shuffledBundle.entities.reverse();
shuffledBundle.states.reverse();
shuffledBundle.evidenceBindings.reverse();
assert.deepEqual(
  buildRealityVersion(reality, versionRequestFixture, shuffledBundle, changeTypeRegistry, rdg.dataContracts),
  versionedReality,
  'component input ordering must not change the canonical snapshot'
);

expectThrow(
  () => buildRealityVersion(
    reality,
    { ...versionRequestFixture, nextRealityVersionSequence: 4 },
    componentBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_SEQUENCE_INVALID'
);
expectThrow(
  () => buildRealityVersion(
    reality,
    { ...versionRequestFixture, nextRealityVersion: '1.0.0' },
    componentBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_NOT_INCREASED'
);
expectThrow(
  () => buildRealityVersion(
    reality,
    { ...versionRequestFixture, realityCode: 'RMO-REALITY-OTHER-VALIDATION-0001' },
    componentBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_REALITY_IDENTITY_CHANGED'
);
expectThrow(
  () => buildRealityVersion(
    reality,
    { ...versionRequestFixture, providerUsed: true },
    componentBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const missingDependencyBundle = clone(componentBundle);
missingDependencyBundle.entities = [contextEntity];
expectThrow(
  () => buildRealityVersion(
    reality,
    versionRequestFixture,
    missingDependencyBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_COMPONENT_CLOSURE_MISSING:'
);
const duplicateIdentityBundle = clone(componentBundle);
duplicateIdentityBundle.entities.push(subjectEntity);
expectThrow(
  () => buildRealityVersion(
    reality,
    versionRequestFixture,
    duplicateIdentityBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_COMPONENT_IDENTITY_DUPLICATE:'
);
const noChangeRequest = {
  ...versionRequestFixture,
  nextRealityVersion: '1.2.0',
  nextRealityVersionSequence: 3,
  changeType: 'COMPONENTS_REVISED',
  revisedAt: '2026-08-10T08:10:00.000Z'
};
expectThrow(
  () => buildRealityVersion(
    versionedReality,
    noChangeRequest,
    componentBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_NO_STRUCTURAL_CHANGE'
);
const removedReasoningBundle = clone(componentBundle);
removedReasoningBundle.reasoningBoundaries = [];
expectThrow(
  () => buildRealityVersion(
    versionedReality,
    { ...noChangeRequest, changeType: 'COMPONENTS_INCORPORATED' },
    removedReasoningBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_CHANGE_TYPE_ADD_ONLY_VIOLATION'
);

const resolutionEvidenceRecord = redigest({
  ...clone(evidenceRecord),
  evidenceCode: 'RRE-EVIDENCE-RESOLUTION-VALIDATION-0001',
  sourceReference: 'ICR-VERIFIED-RESOLUTION-VALIDATION-0001',
  lineageReferences: ['RRE-LINEAGE-RESOLUTION-VALIDATION-0001'],
  acceptedAt: '2026-08-10T07:40:00.000Z'
}, 'evidenceDigest');
const resolutionBindingRequest = clone(evidenceBindingFixture);
resolutionBindingRequest.bindingCode = 'RMO-EVIDENCE-BINDING-RESOLUTION-VALIDATION-0001';
resolutionBindingRequest.evidenceReference = {
  evidenceCode: resolutionEvidenceRecord.evidenceCode,
  evidenceVersion: resolutionEvidenceRecord.evidenceVersion,
  evidenceDigest: resolutionEvidenceRecord.evidenceDigest
};
resolutionBindingRequest.sourceReferences = [resolutionEvidenceRecord.evidenceCode];
resolutionBindingRequest.createdAt = '2026-08-10T07:41:00.000Z';
const resolutionEvidenceBinding = buildRealityEvidenceBinding(
  reality,
  resolutionBindingRequest,
  bindingRoleRegistry,
  rdg,
  structuralComponents,
  [resolutionEvidenceRecord]
);
const resolvedBundle = clone(componentBundle);
resolvedBundle.unknowns = [];
resolvedBundle.evidenceBindings.push(resolutionEvidenceBinding);
const resolutionVersionRequest = {
  ...noChangeRequest,
  changeType: 'UNKNOWN_RESOLUTION_RECORDED',
  changeReferences: [
    unknown.unknownCode,
    resolutionEvidenceBinding.bindingCode,
    resolutionEvidenceRecord.evidenceCode
  ]
};
const resolvedReality = buildRealityVersion(
  versionedReality,
  resolutionVersionRequest,
  resolvedBundle,
  changeTypeRegistry,
  rdg.dataContracts
);
assert.equal(validateVersion(resolvedReality), true, JSON.stringify(validateVersion.errors));
assertCanonicalRealityVersionDigest(resolvedReality);
assert.equal(resolvedReality.realityVersion, '1.2.0');
assert.equal(resolvedReality.realityVersionSequence, 3);
assert.equal(resolvedReality.lineage.ancestorRealityReferences.length, 2);
assert.equal(resolvedReality.unknownResolution.transitionPerformed, true);
assert.deepEqual(resolvedReality.unknownResolution.resolvedUnknownReferences, [unknown.unknownCode]);
assert.deepEqual(
  resolvedReality.unknownResolution.resolutionEvidenceBindingReferences,
  [resolutionEvidenceBinding.bindingCode]
);
assert.equal(resolvedReality.unknownResolution.silentResolutionPerformed, false);
assert.equal(resolvedReality.unknownResolution.inferenceFilled, false);
assert.equal(resolvedReality.unknownResolution.providerOrAiResolutionPerformed, false);

const resolutionWithoutEvidenceBundle = clone(componentBundle);
resolutionWithoutEvidenceBundle.unknowns = [];
expectThrow(
  () => buildRealityVersion(
    versionedReality,
    resolutionVersionRequest,
    resolutionWithoutEvidenceBundle,
    changeTypeRegistry,
    rdg.dataContracts
  ),
  'RMO_VERSION_UNKNOWN_RESOLUTION_EVIDENCE_REQUIRED'
);

assert.equal(validateDiffRequest(diffRequestFixture), true, JSON.stringify(validateDiffRequest.errors));
const diff = buildRealityDiff(reality, versionedReality, diffRequestFixture, rdg.dataContracts);
assert.equal(validateDiff(diff), true, JSON.stringify(validateDiff.errors));
assertRealityDiffDigest(diff);
assert.equal(diff.componentType, 'REALITY_DIFF');
assert.equal(diff.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(diff.dataNature, 'AUDIT');
assert.equal(diff.certainty, 'CONFIRMED');
assert.equal(diff.comparisonMode, 'ADJACENT_VERSION');
assert.equal(diff.summary.addedCount, 15);
assert.equal(diff.summary.removedCount, 0);
assert.equal(diff.summary.replacedCount, 0);
assert.equal(diff.summary.unchangedCount, 0);
assert.deepEqual(diff.summary.changedFamilies, REALITY_COMPONENT_FAMILIES);
assert.equal(diff.componentChanges.states.added.length, 3);
assert.equal(diff.componentChanges.reasoningBoundaries.added.length, 1);
assert.equal(diff.interpretationPerformed, false);
assert.equal(diff.inferencePerformed, false);
assert.equal(diff.diagnosisCreated, false);
assert.equal(diff.causalityClaimed, false);
assert.equal(diff.successOrEffectivenessDetermined, false);
assert.equal(diff.professionalJudgmentCreated, false);
assert.equal(diff.navigationOrActionCreated, false);
assert.equal(diff.evidencePromotionPerformed, false);
assert.equal(diff.providerOrAiAuthorityUsed, false);
assert.equal(diff.persistentStoreWriteAllowed, false);
assert.equal(Object.isFrozen(diff), true);

const adjacentResolutionDiffRequest = {
  ...diffRequestFixture,
  diffCode: 'RMO-DIFF-RESOLUTION-VALIDATION-0001',
  createdAt: '2026-08-10T08:15:00.000Z'
};
const adjacentResolutionDiff = buildRealityDiff(
  versionedReality,
  resolvedReality,
  adjacentResolutionDiffRequest,
  rdg.dataContracts
);
assert.equal(validateDiff(adjacentResolutionDiff), true, JSON.stringify(validateDiff.errors));
assert.equal(adjacentResolutionDiff.summary.addedCount, 1);
assert.equal(adjacentResolutionDiff.summary.removedCount, 1);
assert.equal(adjacentResolutionDiff.summary.replacedCount, 0);
assert.equal(adjacentResolutionDiff.summary.unchangedCount, 14);
assert.deepEqual(adjacentResolutionDiff.summary.changedFamilies, ['evidenceBindings', 'unknowns']);
assert.equal(adjacentResolutionDiff.componentChanges.unknowns.removed[0].componentCode, unknown.unknownCode);
assert.equal(
  adjacentResolutionDiff.componentChanges.evidenceBindings.added[0].componentCode,
  resolutionEvidenceBinding.bindingCode
);
const ancestorDiff = buildRealityDiff(
  reality,
  resolvedReality,
  { ...adjacentResolutionDiffRequest, diffCode: 'RMO-DIFF-ANCESTOR-VALIDATION-0001' },
  rdg.dataContracts
);
assert.equal(ancestorDiff.comparisonMode, 'ANCESTOR_VERSION');

expectThrow(
  () => buildRealityDiff(versionedReality, reality, diffRequestFixture, rdg.dataContracts),
  'RMO_VERSION_SNAPSHOT_INVALID'
);
expectThrow(
  () => buildRealityDiff(
    reality,
    versionedReality,
    { ...diffRequestFixture, aiUsed: true },
    rdg.dataContracts
  ),
  'RMO_DIFF_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedDiff = clone(diff);
tamperedDiff.causalityClaimed = true;
expectThrow(() => assertRealityDiffDigest(tamperedDiff), 'RMO_DIFF_DIGEST_INVALID');
const tamperedVersion = clone(versionedReality);
tamperedVersion.componentReferences.entities = [];
expectThrow(() => assertCanonicalRealityVersionDigest(tamperedVersion), 'RMO_REALITY_DIGEST_INVALID');

assert.equal(acceptance.scope, 'RMO-W13-W15 Reality Versioning, Diff and Freeze');
assert.deepEqual(acceptance.requiredWork, ['RMO-W13', 'RMO-W14', 'RMO-W15']);
assert.equal(acceptance.acceptanceRules.w0W12Preserved, true);
assert.equal(acceptance.acceptanceRules.realityV1RemainsImmutable, true);
assert.equal(acceptance.acceptanceRules.diffIsStructuralAndDeterministic, true);
assert.equal(acceptance.acceptanceRules.diffInterpretationDiagnosisOrCausalityActivated, false);
assert.equal(acceptance.acceptanceRules.persistentStoreActivated, false);
assert.equal(acceptance.acceptanceRules.databaseMigrationCreated, false);
assert.equal(acceptance.acceptanceRules.userDataCreated, false);
assert.equal(acceptance.acceptanceRules.packageJsonWired, true);

assert.equal(preservation.scope, 'RMO-W0-W14');
assert.equal(preservation.digestMode, 'UTF8_NO_BOM_LF');
assert.equal(preservation.rules.contentDriftFailsClosed, true);
assert.equal(preservation.rules.lineEndingConversionIgnored, true);
assert.equal(preservation.rules.substantiveChangeIgnored, false);
assert.equal(new Set(preservation.files.map(entry => entry.path)).size, preservation.files.length);
for (const entry of preservation.files) {
  assert.ok(fs.existsSync(path.join(root, entry.path)), `preserved RMO output missing: ${entry.path}`);
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W0-W14 content drift: ${entry.path}`);
}

assert.equal(freeze.status, 'RMO-v1.0.0-FROZEN');
assert.deepEqual(freeze.completedWork, Array.from({ length: 16 }, (_, index) => `RMO-W${index}`));
assert.equal(freeze.preservationManifestReference, `${base}/freeze/rmo-w0-w14-content-preservation-manifest-v1.json`);
assert.equal(freeze.authorityBoundary.rmoOwnsRealityModelOnly, true);
assert.equal(freeze.authorityBoundary.rreOwnsRealityEvidence, true);
assert.equal(freeze.authorityBoundary.rdgOwnsDataGovernance, true);
assert.equal(freeze.authorityBoundary.prOwnsProfessionalJudgment, true);
assert.equal(freeze.authorityBoundary.jrRneOwnJourneyNavigationAndExecution, true);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
assert.equal(freeze.deliveryBoundary.packageJsonModified, true);
assert.equal(freeze.deliveryBoundary.packageJsonFrozen, false);
assert.equal(freeze.nextPhase, 'RRE-W0');
for (const output of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(path.join(root, output)), `freeze output missing: ${output}`);
}

const wiring = readText('docs/runtime/RMO-W13-W15-PACKAGE-WIRING.md');
assert.match(wiring, /"check:rmo-w13-w15": "node scripts\/check-rmo-w13-w15-reality-versioning-diff-freeze\.mjs"/);
assert.match(wiring, /"check:rmo-versioning-diff-freeze": "npm run check:rmo-w13-w15"/);
assert.match(wiring, /"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning && npm run check:rmo-lifecycle && npm run check:rmo-versioning-diff-freeze"/);
const packageJson = readJson('package.json');
assert.equal(
  packageJson.scripts['check:rmo-w13-w15'],
  'node scripts/check-rmo-w13-w15-reality-versioning-diff-freeze.mjs'
);
assert.equal(packageJson.scripts['check:rmo-versioning-diff-freeze'], 'npm run check:rmo-w13-w15');
assert.equal(
  packageJson.scripts['check:rmo'],
  'npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning && npm run check:rmo-lifecycle && npm run check:rmo-versioning-diff-freeze'
);
assert.match(packageJson.scripts.postcheck, /npm run check:rmo/);
assert.equal(readText('package.json'), packageBefore, 'checker must not mutate package.json');

console.log('✓ RMO-W13 Reality Versioning passed; immutable snapshots carry exact component version, digest, source Reality and ancestor lineage.');
console.log('✓ RMO-W14 Reality Diff passed; added, removed, replaced and unchanged references are deterministic without interpretation, diagnosis or causality.');
console.log('✓ RMO-W15 RMO Freeze passed; RMO-W0-W15 and all authority, non-activation and content-preservation gates are closed.');
