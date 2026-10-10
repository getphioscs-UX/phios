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
  buildRealityEvidenceBinding
} from './lib/reality-model-runtime/rmo-evidence-reasoning-v1.mjs';
import {
  assertRealityActionDigest,
  assertRealityOutcomeDigest,
  assertRealityUnknownDigest,
  buildRealityAction,
  buildRealityOutcome,
  buildRealityUnknown,
  stableDigest
} from './lib/reality-model-runtime/rmo-reality-lifecycle-v1.mjs';

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
const audit = readJson(`${base}/audits/rmo-w10-w12-lifecycle-authority-reconciliation-v1.json`);
const unknownContract = readJson(`${base}/contracts/unknown-runtime-contract-v1.json`);
const actionContract = readJson(`${base}/contracts/action-runtime-contract-v1.json`);
const outcomeContract = readJson(`${base}/contracts/outcome-runtime-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rmo-w10-w12-acceptance-contract-v1.json`);
const unknownKindRegistry = readJson(`${base}/registries/canonical-unknown-kind-registry-v1.json`);
const actionClassRegistry = readJson(`${base}/registries/canonical-action-class-registry-v1.json`);
const outcomeClassRegistry = readJson(`${base}/registries/canonical-outcome-class-registry-v1.json`);
const priorFreeze = readJson(`${base}/freeze/rmo-w8-w9-evidence-reasoning-freeze-v1.json`);
const preservation = readJson(`${base}/freeze/rmo-w8-w9-content-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/rmo-w10-w12-reality-lifecycle-freeze-v1.json`);
const unknownFixture = readJson(`${base}/fixtures/reality-unknown.request.valid.json`);
const actionFixture = readJson(`${base}/fixtures/reality-action.request.valid.json`);
const outcomeFixture = readJson(`${base}/fixtures/reality-outcome.request.valid.json`);

assert.equal(audit.status, 'reconciled');
assert.equal(audit.baselineCommit, '0375a0c14f044e8bdc6622ce44270ff57f9ebf0e');
assert.equal(audit.scope, 'RMO-W10 Unknown, RMO-W11 Action and RMO-W12 Outcome Runtime');
assert.equal(audit.digestMode, 'UTF8_NO_BOM_LF');
for (const authority of audit.inspectedAuthorities) {
  assert.ok(fs.existsSync(path.join(root, authority.reference)), `audited authority missing: ${authority.reference}`);
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority drift: ${authority.reference}`);
}
assert.equal(audit.authorityDecision.unknownRepresentationOwner, 'RMO');
assert.equal(audit.authorityDecision.unknownGovernanceOwner, 'RDG');
assert.equal(audit.authorityDecision.realityActionRepresentationOwner, 'RMO');
assert.equal(audit.authorityDecision.navigationPathAndExecutionOwner, 'JR_RNE_EXISTING_RUNTIME');
assert.equal(audit.authorityDecision.realityOutcomeRepresentationOwner, 'RMO');
assert.equal(audit.authorityDecision.professionalOutcomeRecordOwner, 'PR');
assert.equal(audit.authorityDecision.rmoLifecycleDataType, 'RUNTIME_STATE_RECORD');
assert.equal(audit.authorityDecision.rmoMayWriteNavigationRecord, false);
assert.equal(audit.authorityDecision.rmoMayWriteOutcomeRecord, false);
assert.equal(audit.authorityDecision.rmoMayExecuteAction, false);
assert.equal(audit.authorityDecision.rmoMayClaimCausalityOrSuccess, false);

assert.equal(priorFreeze.status, 'RMO-W8-W9-EVIDENCE-REASONING-FROZEN');
assert.equal(preservation.sourceFreezeReference, `${base}/freeze/rmo-w8-w9-evidence-reasoning-freeze-v1.json`);
assert.equal(preservation.digestMode, 'UTF8_NO_BOM_LF');
assert.deepEqual(
  sorted(preservation.files.map(entry => entry.path)),
  sorted(priorFreeze.frozenOutputs),
  'preservation manifest must cover every RMO-W8-W9 frozen output exactly once'
);
for (const entry of preservation.files) {
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W8-W9 content drift: ${entry.path}`);
}
assert.equal(preservation.rules.contentDriftFailsClosed, true);
assert.equal(preservation.rules.lineEndingConversionIgnored, true);
assert.equal(preservation.rules.substantiveChangeIgnored, false);

assert.equal(unknownContract.work, 'RMO-W10');
assert.equal(unknownContract.rdgDataType, 'RUNTIME_STATE_RECORD');
assert.equal(unknownContract.rules.unknownIsFormalRealityComponent, true);
assert.equal(unknownContract.rules.unknownCannotBeSilentlyDefaulted, true);
assert.equal(unknownContract.rules.unknownCannotBeFilledByInference, true);
assert.equal(unknownContract.rules.resolutionTransitionPerformedByW10, false);
assert.equal(unknownContract.rules.resolutionRequiresLaterRealityVersioning, true);
assert.equal(actionContract.work, 'RMO-W11');
assert.equal(actionContract.rdgDataType, 'RUNTIME_STATE_RECORD');
assert.equal(actionContract.rules.observedActionRequiresAcceptedEvidenceBinding, true);
assert.equal(actionContract.rules.reportedActionRemainsUserReported, true);
assert.equal(actionContract.rules.declaredIntentIsNotExecution, true);
assert.equal(actionContract.rules.actionMaySelectNavigationPath, false);
assert.equal(actionContract.rules.actionMayPerformExecution, false);
assert.equal(actionContract.rules.actionMayCreateProfessionalRecommendation, false);
assert.equal(outcomeContract.work, 'RMO-W12');
assert.equal(outcomeContract.rdgDataType, 'RUNTIME_STATE_RECORD');
assert.equal(outcomeContract.rules.observedChangeRequiresPostActionAcceptedEvidenceBinding, true);
assert.equal(outcomeContract.rules.reportedChangeRemainsUserReported, true);
assert.equal(outcomeContract.rules.noObservedChangeDoesNotEqualFailure, true);
assert.equal(outcomeContract.rules.outcomeMayClaimCausality, false);
assert.equal(outcomeContract.rules.outcomeMayDetermineSuccessOrEffectiveness, false);
assert.equal(outcomeContract.rules.outcomeMayCreatePrOutcomeRecord, false);

assert.deepEqual(unknownKindRegistry.unknownStates, ['UNKNOWN', 'UNRESOLVED', 'DISPUTED']);
assert.deepEqual(unknownKindRegistry.unknownKinds.map(entry => entry.unknownKind), [
  'MISSING_DATA', 'UNVERIFIED_CLAIM', 'CONFLICTING_EVIDENCE',
  'UNBOUNDED_UNCERTAINTY', 'OPEN_QUESTION', 'PROFESSIONAL_BOUNDARY'
]);
assert.deepEqual(actionClassRegistry.actionClasses.map(entry => entry.actionClass), [
  'OBSERVED_ACTION', 'REPORTED_ACTION', 'DECLARED_INTENT', 'UNKNOWN_ACTION'
]);
assert.deepEqual(outcomeClassRegistry.outcomeClasses.map(entry => entry.outcomeClass), [
  'OBSERVED_CHANGE', 'REPORTED_CHANGE', 'NO_OBSERVED_CHANGE',
  'UNEXPECTED_CHANGE', 'UNKNOWN_OUTCOME'
]);
for (const registry of [unknownKindRegistry, actionClassRegistry, outcomeClassRegistry]) {
  assert.equal(registry.runtimeAuthority, 'RMO');
  assert.equal(registry.containsUserData, false);
  assert.deepEqual(registry.instances, []);
}

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
const realityAcceptanceFixture = readJson(`${base}/fixtures/reality-initialization.acceptance.valid.json`);
const entityFixture = readJson(`${base}/fixtures/reality-entity.request.valid.json`);
const contextEntityFixture = readJson(`${base}/fixtures/relationship-context-entity.request.valid.json`);
const eventFixture = readJson(`${base}/fixtures/reality-event.request.valid.json`);
const signalFixture = readJson(`${base}/fixtures/reality-signal.request.valid.json`);
const relationshipFixture = readJson(`${base}/fixtures/reality-relationship.request.valid.json`);
const constraintFixture = readJson(`${base}/fixtures/reality-constraint.request.valid.json`);
const observedStateFixture = readJson(`${base}/fixtures/reality-state-observed.request.valid.json`);
const derivedStateFixture = readJson(`${base}/fixtures/reality-state-derived.request.valid.json`);
const projectedStateFixture = readJson(`${base}/fixtures/reality-state-projected.request.valid.json`);
const evidenceRecordFixture = readJson(`${base}/fixtures/rre-evidence-authority-record.accepted.valid.json`);
const evidenceBindingFixture = readJson(`${base}/fixtures/reality-evidence-binding.request.valid.json`);

const canonicalInput = buildCanonicalInput(canonicalInputFixture, inputTypeRegistry, rdg, canonicalInputContract);
const verifiedInput = verifyCanonicalInput(canonicalInput, verificationFixture, inputTypeRegistry, rdg);
const canonicalCase = buildCanonicalCase(caseFixture, [verifiedInput], caseStateRegistry, rdg, rdgReferenceRegistry);
const initializationRequest = buildRealityInitializationRequest(canonicalCase, initializationFixture, caseStateRegistry);
const reality = buildCanonicalReality(canonicalCase, initializationRequest, realityAcceptanceFixture);
const subjectEntity = buildRealityEntity(reality, entityFixture, entityRegistry, rdg);
const contextEntity = buildRealityEntity(reality, contextEntityFixture, entityRegistry, rdg);
const event = buildRealityEvent(reality, eventFixture, eventRegistry, rdg, [subjectEntity]);
const signal = buildRealitySignal(reality, signalFixture, signalRegistry, rdg, [subjectEntity], [event]);
const relationship = buildRealityRelationship(
  reality,
  relationshipFixture,
  relationshipRegistry,
  rdg,
  [subjectEntity, contextEntity]
);
const foundationComponents = [subjectEntity, contextEntity, event, signal, relationship];
const constraint = buildRealityConstraint(reality, constraintFixture, constraintRegistry, rdg, foundationComponents);
const observedState = buildRealityState(
  reality,
  observedStateFixture,
  stateRegistry,
  rdg,
  [...foundationComponents, constraint]
);
const derivedState = buildRealityState(
  reality,
  derivedStateFixture,
  stateRegistry,
  rdg,
  [...foundationComponents, constraint, observedState]
);
const projectedState = buildRealityState(
  reality,
  projectedStateFixture,
  stateRegistry,
  rdg,
  [...foundationComponents, constraint, observedState, derivedState]
);
const allComponents = [
  ...foundationComponents,
  constraint,
  observedState,
  derivedState,
  projectedState
];
const evidenceBinding = buildRealityEvidenceBinding(
  reality,
  evidenceBindingFixture,
  bindingRoleRegistry,
  rdg,
  allComponents,
  [evidenceRecordFixture]
);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateUnknown = ajv.compile(readJson(`${base}/schemas/canonical-reality-unknown-v1.schema.json`));
const validateAction = ajv.compile(readJson(`${base}/schemas/canonical-reality-action-v1.schema.json`));
const validateOutcome = ajv.compile(readJson(`${base}/schemas/canonical-reality-outcome-v1.schema.json`));

const unknown = buildRealityUnknown(
  reality,
  unknownFixture,
  unknownKindRegistry,
  rdg,
  allComponents,
  [evidenceBinding]
);
assert.equal(validateUnknown(unknown), true, JSON.stringify(validateUnknown.errors));
assertRealityUnknownDigest(unknown);
assert.equal(unknown.componentType, 'REALITY_UNKNOWN');
assert.equal(unknown.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(unknown.unknownState, 'UNKNOWN');
assert.equal(unknown.certaintySnapshot, 'UNKNOWN');
assert.equal(unknown.recordStatus, 'OPEN');
assert.equal(unknown.defaultValueApplied, false);
assert.equal(unknown.inferenceFilled, false);
assert.equal(unknown.silentResolutionPerformed, false);
assert.equal(unknown.resolutionTransitionPerformed, false);
assert.equal(unknown.truthClaimed, false);
assert.equal(unknown.actionCreated, false);
assert.equal(unknown.outcomeCreated, false);
assert.equal(unknown.professionalJudgmentCreated, false);
assert.equal(unknown.persistentStoreWriteAllowed, false);
assert.equal(Object.isFrozen(unknown), true);

const professionalUnknownRequest = clone(unknownFixture);
professionalUnknownRequest.unknownCode = 'RMO-UNKNOWN-PROFESSIONAL-VALIDATION-0001';
professionalUnknownRequest.unknownKind = 'PROFESSIONAL_BOUNDARY';
professionalUnknownRequest.unknownState = 'UNRESOLVED';
professionalUnknownRequest.statementReference = 'RMO-UNKNOWN-STATEMENT-PROFESSIONAL-VALIDATION-0001';
professionalUnknownRequest.resolutionRequirements.professionalAuthorityRequired = true;
professionalUnknownRequest.createdAt = '2026-08-10T07:35:00.000Z';
const professionalUnknown = buildRealityUnknown(
  reality,
  professionalUnknownRequest,
  unknownKindRegistry,
  rdg,
  allComponents,
  [evidenceBinding]
);
assert.equal(professionalUnknown.resolutionRequirements.professionalAuthorityRequired, true);
assert.equal(professionalUnknown.professionalJudgmentCreated, false);

const conflictingUnknownRequest = clone(unknownFixture);
conflictingUnknownRequest.unknownCode = 'RMO-UNKNOWN-CONFLICTING-VALIDATION-0001';
conflictingUnknownRequest.unknownKind = 'CONFLICTING_EVIDENCE';
conflictingUnknownRequest.unknownState = 'UNRESOLVED';
conflictingUnknownRequest.statementReference = 'RMO-UNKNOWN-STATEMENT-CONFLICTING-VALIDATION-0001';
conflictingUnknownRequest.resolutionRequirements.requiredEvidenceCount = 2;
conflictingUnknownRequest.createdAt = '2026-08-10T07:35:00.000Z';
const conflictingUnknown = buildRealityUnknown(
  reality,
  conflictingUnknownRequest,
  unknownKindRegistry,
  rdg,
  allComponents,
  [evidenceBinding]
);
assert.equal(conflictingUnknown.resolutionRequirements.requiredEvidenceCount, 2);

expectThrow(
  () => buildRealityUnknown(
    reality,
    { ...unknownFixture, unknownKind: 'NOT_KNOWN' },
    unknownKindRegistry,
    rdg,
    allComponents,
    [evidenceBinding]
  ),
  'RMO_UNKNOWN_KIND_UNKNOWN'
);
expectThrow(
  () => buildRealityUnknown(
    reality,
    { ...unknownFixture, unknownState: 'RESOLVED' },
    unknownKindRegistry,
    rdg,
    allComponents,
    [evidenceBinding]
  ),
  'RMO_UNKNOWN_STATE_FORBIDDEN_FOR_KIND'
);
const disputedWithoutEvidence = clone(unknownFixture);
disputedWithoutEvidence.unknownKind = 'UNVERIFIED_CLAIM';
disputedWithoutEvidence.unknownState = 'DISPUTED';
expectThrow(
  () => buildRealityUnknown(
    reality,
    disputedWithoutEvidence,
    unknownKindRegistry,
    rdg,
    allComponents,
    [evidenceBinding]
  ),
  'RMO_UNKNOWN_DISPUTED_EVIDENCE_BINDING_REQUIRED'
);
const insufficientConflict = clone(conflictingUnknownRequest);
insufficientConflict.resolutionRequirements.requiredEvidenceCount = 1;
expectThrow(
  () => buildRealityUnknown(
    reality,
    insufficientConflict,
    unknownKindRegistry,
    rdg,
    allComponents,
    [evidenceBinding]
  ),
  'RMO_UNKNOWN_RESOLUTION_EVIDENCE_COUNT_INVALID'
);
expectThrow(
  () => buildRealityUnknown(
    reality,
    { ...unknownFixture, defaultValueApplied: true },
    unknownKindRegistry,
    rdg,
    allComponents,
    [evidenceBinding]
  ),
  'RMO_UNKNOWN_FIELD_FORBIDDEN:defaultValueApplied'
);
expectThrow(
  () => buildRealityUnknown(
    reality,
    { ...unknownFixture, aiUsed: true },
    unknownKindRegistry,
    rdg,
    allComponents,
    [evidenceBinding]
  ),
  'RMO_UNKNOWN_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedUnknown = clone(unknown);
tamperedUnknown.defaultValueApplied = true;
expectThrow(() => assertRealityUnknownDigest(tamperedUnknown), 'RMO_UNKNOWN_DIGEST_INVALID');

const action = buildRealityAction(
  reality,
  actionFixture,
  actionClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding],
  [unknown]
);
assert.equal(validateAction(action), true, JSON.stringify(validateAction.errors));
assertRealityActionDigest(action);
assert.equal(action.componentType, 'REALITY_ACTION');
assert.equal(action.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(action.actionClass, 'OBSERVED_ACTION');
assert.equal(action.dataNature, 'OBSERVED');
assert.equal(action.certainty, 'OBSERVED');
assert.equal(action.navigationPathSelected, false);
assert.equal(action.requiredActionCreated, false);
assert.equal(action.actionExecutionPerformed, false);
assert.equal(action.recommendationCreated, false);
assert.equal(action.professionalJudgmentCreated, false);
assert.equal(action.outcomePredicted, false);
assert.equal(action.evidencePromotionPerformed, false);
assert.equal(action.navigationExecutionAuthority, 'JR_RNE_EXISTING_RUNTIME');
assert.equal(Object.isFrozen(action), true);

const reportedActionRequest = clone(actionFixture);
reportedActionRequest.actionCode = 'RMO-ACTION-REPORTED-VALIDATION-0001';
reportedActionRequest.actionClass = 'REPORTED_ACTION';
reportedActionRequest.actionStateSnapshot = 'REPORTED_IN_PROGRESS';
reportedActionRequest.evidenceBindingReferences = [];
reportedActionRequest.sourceReferences = ['ICR-REPORTED-ACTION-VALIDATION-0001'];
reportedActionRequest.dataNature = 'USER_REPORTED';
reportedActionRequest.certainty = 'REPORTED';
reportedActionRequest.occurredAt = '2026-08-10T07:31:00.000Z';
reportedActionRequest.createdAt = '2026-08-10T07:37:00.000Z';
const reportedAction = buildRealityAction(
  reality,
  reportedActionRequest,
  actionClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding],
  [unknown]
);
assert.equal(reportedAction.dataNature, 'USER_REPORTED');
assert.equal(reportedAction.actionExecutionPerformed, false);

const intentRequest = clone(reportedActionRequest);
intentRequest.actionCode = 'RMO-ACTION-INTENT-VALIDATION-0001';
intentRequest.actionClass = 'DECLARED_INTENT';
intentRequest.actionStateSnapshot = 'DECLARED_NOT_EXECUTED';
intentRequest.occurredAt = null;
intentRequest.createdAt = '2026-08-10T07:38:00.000Z';
const declaredIntent = buildRealityAction(
  reality,
  intentRequest,
  actionClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding],
  [unknown]
);
assert.equal(declaredIntent.occurredAt, null);
assert.equal(declaredIntent.actionExecutionPerformed, false);

const unknownActionRequest = clone(intentRequest);
unknownActionRequest.actionCode = 'RMO-ACTION-UNKNOWN-VALIDATION-0001';
unknownActionRequest.actionClass = 'UNKNOWN_ACTION';
unknownActionRequest.actionStateSnapshot = 'UNKNOWN';
unknownActionRequest.unknownReferences = [unknown.unknownCode];
unknownActionRequest.dataNature = 'SYSTEM_STATE';
unknownActionRequest.certainty = 'UNKNOWN';
unknownActionRequest.createdAt = '2026-08-10T07:37:00.000Z';
const unknownAction = buildRealityAction(
  reality,
  unknownActionRequest,
  actionClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding],
  [unknown]
);
assert.deepEqual(unknownAction.unknownReferences, [unknown.unknownCode]);

const observedWithoutEvidence = clone(actionFixture);
observedWithoutEvidence.evidenceBindingReferences = [];
expectThrow(
  () => buildRealityAction(
    reality,
    observedWithoutEvidence,
    actionClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding],
    [unknown]
  ),
  'RMO_ACTION_EVIDENCE_BINDING_REQUIRED'
);
expectThrow(
  () => buildRealityAction(
    reality,
    { ...actionFixture, dataNature: 'INFERRED' },
    actionClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding],
    [unknown]
  ),
  'RMO_ACTION_DATA_NATURE_FORBIDDEN'
);
const missingUnknownAction = clone(unknownActionRequest);
missingUnknownAction.unknownReferences = [];
expectThrow(
  () => buildRealityAction(
    reality,
    missingUnknownAction,
    actionClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding],
    [unknown]
  ),
  'RMO_ACTION_UNKNOWN_REFERENCE_REQUIRED'
);
expectThrow(
  () => buildRealityAction(
    reality,
    { ...actionFixture, requiredActionCreated: true },
    actionClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding],
    [unknown]
  ),
  'RMO_ACTION_FIELD_FORBIDDEN:requiredActionCreated'
);
expectThrow(
  () => buildRealityAction(
    reality,
    { ...actionFixture, providerUsed: true },
    actionClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding],
    [unknown]
  ),
  'RMO_ACTION_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedAction = clone(action);
tamperedAction.actionExecutionPerformed = true;
expectThrow(() => assertRealityActionDigest(tamperedAction), 'RMO_ACTION_DIGEST_INVALID');

const outcomeEvidenceRecord = redigest({
  ...clone(evidenceRecordFixture),
  evidenceCode: 'RRE-EVIDENCE-OUTCOME-VALIDATION-0001',
  sourceReference: 'ICR-VERIFIED-OUTCOME-VALIDATION-0001',
  lineageReferences: ['RRE-LINEAGE-OUTCOME-VALIDATION-0001'],
  acceptedAt: '2026-08-10T07:38:00.000Z'
}, 'evidenceDigest');
const outcomeEvidenceBindingRequest = clone(evidenceBindingFixture);
outcomeEvidenceBindingRequest.bindingCode = 'RMO-EVIDENCE-BINDING-OUTCOME-VALIDATION-0001';
outcomeEvidenceBindingRequest.evidenceReference = {
  evidenceCode: outcomeEvidenceRecord.evidenceCode,
  evidenceVersion: outcomeEvidenceRecord.evidenceVersion,
  evidenceDigest: outcomeEvidenceRecord.evidenceDigest
};
outcomeEvidenceBindingRequest.sourceReferences = [outcomeEvidenceRecord.evidenceCode];
outcomeEvidenceBindingRequest.createdAt = '2026-08-10T07:39:00.000Z';
const outcomeEvidenceBinding = buildRealityEvidenceBinding(
  reality,
  outcomeEvidenceBindingRequest,
  bindingRoleRegistry,
  rdg,
  allComponents,
  [outcomeEvidenceRecord]
);

const outcome = buildRealityOutcome(
  reality,
  outcomeFixture,
  outcomeClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding, outcomeEvidenceBinding],
  [unknown],
  [action]
);
assert.equal(validateOutcome(outcome), true, JSON.stringify(validateOutcome.errors));
assertRealityOutcomeDigest(outcome);
assert.equal(outcome.componentType, 'REALITY_OUTCOME');
assert.equal(outcome.dataType, 'RUNTIME_STATE_RECORD');
assert.equal(outcome.outcomeClass, 'OBSERVED_CHANGE');
assert.equal(outcome.actionReference.actionDigest, action.actionDigest);
assert.equal(outcome.causalityClaimed, false);
assert.equal(outcome.successClaimed, false);
assert.equal(outcome.actionEffectivenessDetermined, false);
assert.equal(outcome.actionMutationPerformed, false);
assert.equal(outcome.continuityDecisionCreated, false);
assert.equal(outcome.professionalOutcomeRecordCreated, false);
assert.equal(outcome.professionalJudgmentCreated, false);
assert.equal(outcome.evidencePromotionPerformed, false);
assert.equal(outcome.professionalOutcomeAuthorityRuntime, 'PR');
assert.equal(Object.isFrozen(outcome), true);

const reportedOutcomeRequest = clone(outcomeFixture);
reportedOutcomeRequest.outcomeCode = 'RMO-OUTCOME-REPORTED-VALIDATION-0001';
reportedOutcomeRequest.outcomeClass = 'REPORTED_CHANGE';
reportedOutcomeRequest.evidenceBindingReferences = [];
reportedOutcomeRequest.sourceReferences = ['REVIEW-REPORTED-OUTCOME-VALIDATION-0001'];
reportedOutcomeRequest.dataNature = 'USER_REPORTED';
reportedOutcomeRequest.certainty = 'REPORTED';
reportedOutcomeRequest.createdAt = '2026-08-10T07:38:00.000Z';
const reportedOutcome = buildRealityOutcome(
  reality,
  reportedOutcomeRequest,
  outcomeClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding, outcomeEvidenceBinding],
  [unknown],
  [action]
);
assert.equal(reportedOutcome.dataNature, 'USER_REPORTED');
assert.equal(reportedOutcome.successClaimed, false);

const noChangeRequest = clone(reportedOutcomeRequest);
noChangeRequest.outcomeCode = 'RMO-OUTCOME-NO-CHANGE-VALIDATION-0001';
noChangeRequest.outcomeClass = 'NO_OBSERVED_CHANGE';
const noChangeOutcome = buildRealityOutcome(
  reality,
  noChangeRequest,
  outcomeClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding, outcomeEvidenceBinding],
  [unknown],
  [action]
);
assert.equal(noChangeOutcome.successClaimed, false);
assert.equal(noChangeOutcome.actionEffectivenessDetermined, false);

const unexpectedRequest = clone(reportedOutcomeRequest);
unexpectedRequest.outcomeCode = 'RMO-OUTCOME-UNEXPECTED-VALIDATION-0001';
unexpectedRequest.outcomeClass = 'UNEXPECTED_CHANGE';
unexpectedRequest.unknownReferences = [unknown.unknownCode];
const unexpectedOutcome = buildRealityOutcome(
  reality,
  unexpectedRequest,
  outcomeClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding, outcomeEvidenceBinding],
  [unknown],
  [action]
);
assert.equal(unexpectedOutcome.causalityClaimed, false);

const unknownOutcomeRequest = clone(reportedOutcomeRequest);
unknownOutcomeRequest.outcomeCode = 'RMO-OUTCOME-UNKNOWN-VALIDATION-0001';
unknownOutcomeRequest.outcomeClass = 'UNKNOWN_OUTCOME';
unknownOutcomeRequest.unknownReferences = [unknown.unknownCode];
unknownOutcomeRequest.dataNature = 'SYSTEM_STATE';
unknownOutcomeRequest.certainty = 'UNKNOWN';
unknownOutcomeRequest.observedAt = null;
unknownOutcomeRequest.createdAt = '2026-08-10T07:41:00.000Z';
const unknownOutcome = buildRealityOutcome(
  reality,
  unknownOutcomeRequest,
  outcomeClassRegistry,
  rdg,
  allComponents,
  [evidenceBinding, outcomeEvidenceBinding],
  [unknown],
  [action]
);
assert.equal(unknownOutcome.observedAt, null);
assert.deepEqual(unknownOutcome.unknownReferences, [unknown.unknownCode]);

const observedOutcomeWithoutEvidence = clone(outcomeFixture);
observedOutcomeWithoutEvidence.evidenceBindingReferences = [];
expectThrow(
  () => buildRealityOutcome(
    reality,
    observedOutcomeWithoutEvidence,
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_EVIDENCE_BINDING_REQUIRED'
);
const reusedActionEvidence = clone(outcomeFixture);
reusedActionEvidence.evidenceBindingReferences = [evidenceBinding.bindingCode];
reusedActionEvidence.sourceReferences = [evidenceRecordFixture.evidenceCode];
expectThrow(
  () => buildRealityOutcome(
    reality,
    reusedActionEvidence,
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_POST_ACTION_EVIDENCE_BINDING_REQUIRED'
);
const unknownOutcomeWithoutUnknown = clone(unknownOutcomeRequest);
unknownOutcomeWithoutUnknown.unknownReferences = [];
expectThrow(
  () => buildRealityOutcome(
    reality,
    unknownOutcomeWithoutUnknown,
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_UNKNOWN_REFERENCE_REQUIRED'
);
expectThrow(
  () => buildRealityOutcome(
    reality,
    { ...outcomeFixture, successClaimed: true },
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_FIELD_FORBIDDEN:successClaimed'
);
const wrongActionVersion = clone(outcomeFixture);
wrongActionVersion.actionReference.actionVersion = '2.0.0';
expectThrow(
  () => buildRealityOutcome(
    reality,
    wrongActionVersion,
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_ACTION_REFERENCE_VERSION_MISMATCH'
);
const wrongComponentLineage = clone(outcomeFixture);
wrongComponentLineage.componentReferences = [observedState.stateCode];
expectThrow(
  () => buildRealityOutcome(
    reality,
    wrongComponentLineage,
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_ACTION_COMPONENT_LINEAGE_INVALID'
);
const earlyOutcome = clone(outcomeFixture);
earlyOutcome.observedAt = '2026-08-10T07:29:00.000Z';
expectThrow(
  () => buildRealityOutcome(
    reality,
    earlyOutcome,
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_OBSERVED_AT_BEFORE_ACTION'
);
expectThrow(
  () => buildRealityOutcome(
    reality,
    { ...outcomeFixture, aiUsed: true },
    outcomeClassRegistry,
    rdg,
    allComponents,
    [evidenceBinding, outcomeEvidenceBinding],
    [unknown],
    [action]
  ),
  'RMO_OUTCOME_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedOutcome = clone(outcome);
tamperedOutcome.causalityClaimed = true;
expectThrow(() => assertRealityOutcomeDigest(tamperedOutcome), 'RMO_OUTCOME_DIGEST_INVALID');

assert.equal(acceptance.baselineCommit, '0375a0c14f044e8bdc6622ce44270ff57f9ebf0e');
assert.deepEqual(acceptance.requiredWork, ['RMO-W10', 'RMO-W11', 'RMO-W12']);
assert.equal(acceptance.acceptanceRules.w0W9Preserved, true);
assert.equal(acceptance.acceptanceRules.rmoWritesRuntimeStateRecordOnly, true);
assert.equal(acceptance.acceptanceRules.unknownResolutionActivated, false);
assert.equal(acceptance.acceptanceRules.navigationOrActionExecutionActivated, false);
assert.equal(acceptance.acceptanceRules.outcomeRecordActivated, false);
assert.equal(acceptance.acceptanceRules.packageJsonModifiedByDelivery, false);

assert.equal(freeze.status, 'RMO-W10-W12-LIFECYCLE-FROZEN');
assert.deepEqual(freeze.completedWork, ['RMO-W10', 'RMO-W11', 'RMO-W12']);
assert.equal(freeze.previousEvidenceReasoningPreservation.allPriorFrozenOutputsPreserved, true);
assert.equal(freeze.deliveryBoundary.packageJsonModified, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
assert.equal(freeze.nextWork, 'RMO-W13');
for (const output of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(path.join(root, output)), `frozen output missing: ${output}`);
}

const manualWiring = readText('docs/runtime/RMO-W10-W12-PACKAGE-MANUAL-WIRING.md');
assert.match(manualWiring, /"check:rmo-w10-w12": "node scripts\/check-rmo-w10-w12-reality-lifecycle\.mjs"/);
assert.match(manualWiring, /"check:rmo-lifecycle": "npm run check:rmo-w10-w12"/);
assert.match(manualWiring, /"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning && npm run check:rmo-lifecycle"/);
assert.match(manualWiring, /Keep `postcheck` unchanged/);
assert.equal(readText('package.json'), packageBefore, 'checker may not modify package.json');

for (const authority of audit.inspectedAuthorities) {
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority mutated during check: ${authority.reference}`);
}
for (const entry of preservation.files) {
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W8-W9 mutated during check: ${entry.path}`);
}

console.log('✓ RMO-W10 Unknown Runtime passed; UNKNOWN, UNRESOLVED and DISPUTED remain formal, unresolved Reality components.');
console.log('✓ RMO-W11 Action Runtime passed; observed, reported, declared and unknown Actions remain representations without execution authority.');
console.log('✓ RMO-W12 Outcome Runtime passed; Action lineage and post-Action Evidence are enforced without causality, success, PR Outcome or Continuity authority.');
console.log('✓ RMO-W0-W9, RDG, Navigation, Review, Memory, Continuity, PR, Provider/AI, persistence and production boundaries remain preserved.');
