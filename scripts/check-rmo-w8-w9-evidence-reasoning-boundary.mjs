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
  assertRealityEvidenceBindingDigest,
  assertRealityReasoningBoundaryDigest,
  buildRealityEvidenceBinding,
  buildRealityReasoningBoundary,
  stableDigest
} from './lib/reality-model-runtime/rmo-evidence-reasoning-v1.mjs';

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
const audit = readJson(`${base}/audits/rmo-w8-w9-evidence-reasoning-authority-reconciliation-v1.json`);
const evidenceBindingContract = readJson(`${base}/contracts/evidence-binding-runtime-contract-v1.json`);
const reasoningBoundaryContract = readJson(`${base}/contracts/interpretation-inference-boundary-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rmo-w8-w9-acceptance-contract-v1.json`);
const bindingRoleRegistry = readJson(`${base}/registries/canonical-evidence-binding-role-registry-v1.json`);
const boundaryRegistry = readJson(`${base}/registries/canonical-reasoning-boundary-registry-v1.json`);
const priorFreeze = readJson(`${base}/freeze/rmo-w5-w7-reality-structure-freeze-v1.json`);
const preservation = readJson(`${base}/freeze/rmo-w5-w7-content-preservation-manifest-v1.json`);
const freeze = readJson(`${base}/freeze/rmo-w8-w9-evidence-reasoning-freeze-v1.json`);
const evidenceRecordFixture = readJson(`${base}/fixtures/rre-evidence-authority-record.accepted.valid.json`);
const evidenceBindingFixture = readJson(`${base}/fixtures/reality-evidence-binding.request.valid.json`);
const inferenceFixture = readJson(`${base}/fixtures/reality-reasoning-boundary.inference.valid.json`);
const interpretationFixture = readJson(`${base}/fixtures/reality-reasoning-boundary.interpretation.valid.json`);

assert.equal(audit.status, 'reconciled');
assert.equal(audit.baselineCommit, '6920c9efb164a6e29f7dcbd8575f7a54e9d28c2f');
assert.equal(audit.scope, 'RMO-W8 Evidence Binding and RMO-W9 Interpretation / Inference Boundary');
assert.equal(audit.digestMode, 'UTF8_NO_BOM_LF');
for (const authority of audit.inspectedAuthorities) {
  assert.ok(fs.existsSync(path.join(root, authority.reference)), `audited authority missing: ${authority.reference}`);
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority drift: ${authority.reference}`);
}
assert.equal(audit.authorityDecision.realityEvidenceRecordOwner, 'RRE');
assert.equal(audit.authorityDecision.evidenceEligibilityPromotionAndInferenceGovernanceOwner, 'RDG');
assert.equal(audit.authorityDecision.realityEvidenceBindingOwner, 'RMO');
assert.equal(audit.authorityDecision.reasoningBoundaryOwner, 'RMO');
assert.equal(audit.authorityDecision.professionalJudgmentOwner, 'PR');
assert.equal(audit.authorityDecision.evidenceBindingIsEvidence, false);
assert.equal(audit.authorityDecision.evidenceBindingPerformsPromotion, false);
assert.equal(audit.authorityDecision.boundedDecisionCreatesInterpretationOrInference, false);
assert.equal(audit.authorityDecision.sharedAuthorityOrOperationalRuntimeMutated, false);

assert.equal(priorFreeze.status, 'RMO-W5-W7-STRUCTURE-FROZEN');
assert.equal(preservation.sourceFreezeReference, `${base}/freeze/rmo-w5-w7-reality-structure-freeze-v1.json`);
assert.equal(preservation.digestMode, 'UTF8_NO_BOM_LF');
assert.deepEqual(
  sorted(preservation.files.map(entry => entry.path)),
  sorted(priorFreeze.frozenOutputs),
  'preservation manifest must cover every RMO-W5-W7 frozen output exactly once'
);
for (const entry of preservation.files) {
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W5-W7 content drift: ${entry.path}`);
}
assert.equal(preservation.rules.contentDriftFailsClosed, true);
assert.equal(preservation.rules.lineEndingConversionIgnored, true);
assert.equal(preservation.rules.substantiveChangeIgnored, false);

assert.equal(evidenceBindingContract.work, 'RMO-W8');
assert.equal(evidenceBindingContract.runtimeCode, 'RMO');
assert.equal(evidenceBindingContract.authorityBoundary.rreOwns[0], 'REALITY_EVIDENCE_RECORD identity');
assert.equal(evidenceBindingContract.rules.acceptedRreEvidenceRequired, true);
assert.equal(evidenceBindingContract.rules.bindingIsEvidence, false);
assert.equal(evidenceBindingContract.rules.bindingCreatesEvidence, false);
assert.equal(evidenceBindingContract.rules.bindingPromotesEvidence, false);
assert.equal(evidenceBindingContract.rules.bindingClaimsTruth, false);
assert.equal(evidenceBindingContract.rules.bindingStoresEvidencePayload, false);
assert.equal(evidenceBindingContract.rules.alrAssessmentCandidateMayBindDirectly, false);

assert.equal(reasoningBoundaryContract.work, 'RMO-W9');
assert.equal(reasoningBoundaryContract.rules.inferenceRequiresMethodVersionInputLineageEvidenceAndUncertainty, true);
assert.equal(reasoningBoundaryContract.rules.interpretationRequiresBoundaryAuthorityEvidenceAndBoundaryStatement, true);
assert.equal(reasoningBoundaryContract.rules.professionalJudgmentRequiresPrAuthority, true);
assert.equal(reasoningBoundaryContract.rules.unknownOrUnresolvedMayBeFilledByInference, false);
assert.equal(reasoningBoundaryContract.rules.disputedMayBeSilentlyResolved, false);
assert.equal(reasoningBoundaryContract.rules.allowBoundedIsPermissionNotContent, true);
assert.equal(reasoningBoundaryContract.rules.boundaryDecisionCreatesInterpretation, false);
assert.equal(reasoningBoundaryContract.rules.boundaryDecisionCreatesInference, false);
assert.equal(reasoningBoundaryContract.rules.boundaryDecisionCreatesProfessionalJudgment, false);

assert.deepEqual(bindingRoleRegistry.bindingRoles.map(entry => entry.bindingRole), [
  'SUPPORTS', 'CONTRADICTS', 'QUALIFIES', 'CONTEXTUALIZES'
]);
assert.equal(bindingRoleRegistry.runtimeAuthority, 'RMO');
assert.equal(bindingRoleRegistry.evidenceAuthority, 'RRE');
assert.equal(bindingRoleRegistry.containsUserData, false);
assert.deepEqual(bindingRoleRegistry.instances, []);
assert.deepEqual(boundaryRegistry.reasoningClasses.map(entry => entry.requestedDataNature), [
  'INFERRED', 'INTERPRETED', 'PROFESSIONAL_JUDGMENT'
]);
assert.deepEqual(boundaryRegistry.boundaryDecisions, [
  'ALLOW_BOUNDED', 'REQUIRE_CORROBORATION', 'REQUIRE_EXPLICIT_CONSENT',
  'REQUIRE_PROFESSIONAL_AUTHORITY', 'DENY', 'UNRESOLVED'
]);
assert.equal(boundaryRegistry.professionalJudgmentAuthority, 'PR');
assert.equal(boundaryRegistry.containsReasoningContentOrDecisions, false);
assert.deepEqual(boundaryRegistry.instances, []);

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
  dataContracts: readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json')
};
const entityRegistry = readJson(`${base}/registries/canonical-entity-type-registry-v1.json`);
const eventRegistry = readJson(`${base}/registries/canonical-event-type-registry-v1.json`);
const signalRegistry = readJson(`${base}/registries/canonical-signal-type-registry-v1.json`);
const relationshipRegistry = readJson(`${base}/registries/canonical-relationship-type-registry-v1.json`);
const constraintRegistry = readJson(`${base}/registries/canonical-constraint-type-registry-v1.json`);
const stateRegistry = readJson(`${base}/registries/canonical-reality-state-class-registry-v1.json`);
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

const canonicalInput = buildCanonicalInput(canonicalInputFixture, inputTypeRegistry, rdg, canonicalInputContract);
const verifiedInput = verifyCanonicalInput(canonicalInput, verificationFixture, inputTypeRegistry, rdg);
const canonicalCase = buildCanonicalCase(caseFixture, [verifiedInput], caseStateRegistry, rdg, rdgReferenceRegistry);
const initializationRequest = buildRealityInitializationRequest(
  canonicalCase,
  initializationFixture,
  caseStateRegistry
);
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

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateBinding = ajv.compile(readJson(`${base}/schemas/canonical-reality-evidence-binding-v1.schema.json`));
const validateBoundary = ajv.compile(readJson(`${base}/schemas/canonical-reality-reasoning-boundary-v1.schema.json`));

const binding = buildRealityEvidenceBinding(
  reality,
  evidenceBindingFixture,
  bindingRoleRegistry,
  rdg,
  allComponents,
  [evidenceRecordFixture]
);
assert.equal(validateBinding(binding), true, JSON.stringify(validateBinding.errors));
assertRealityEvidenceBindingDigest(binding);
assert.equal(binding.componentType, 'REALITY_EVIDENCE_BINDING');
assert.equal(binding.bindingRole, 'SUPPORTS');
assert.equal(binding.evidenceReference.producingRuntime, 'RRE');
assert.equal(binding.evidenceReference.dataType, 'REALITY_EVIDENCE_RECORD');
assert.equal(binding.evidenceStateSnapshot, 'ACCEPTED_EVIDENCE');
assert.equal(binding.eligibilityDecisionSnapshot, 'ELIGIBLE');
assert.equal(binding.evidencePayloadStored, false);
assert.equal(binding.evidencePromotionPerformed, false);
assert.equal(binding.truthClaimed, false);
assert.equal(binding.interpretationCreated, false);
assert.equal(binding.inferenceCreated, false);
assert.equal(binding.professionalJudgmentCreated, false);
assert.equal(binding.persistentStoreWriteAllowed, false);
assert.equal(Object.isFrozen(binding), true);
assert.equal(Object.hasOwn(binding, 'payload'), false);
assert.equal(Object.hasOwn(binding, 'promotionDecision'), false);
assert.deepEqual(
  buildRealityEvidenceBinding(
    reality,
    evidenceBindingFixture,
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  binding
);

const contraryFixture = {
  ...evidenceBindingFixture,
  bindingCode: 'RMO-EVIDENCE-BINDING-CONTRARY-VALIDATION-0001',
  bindingRole: 'CONTRADICTS'
};
const contraryBinding = buildRealityEvidenceBinding(
  reality,
  contraryFixture,
  bindingRoleRegistry,
  rdg,
  allComponents,
  [evidenceRecordFixture]
);
assert.equal(contraryBinding.bindingRole, 'CONTRADICTS');
assert.equal(contraryBinding.truthClaimed, false);

expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    { ...evidenceBindingFixture, bindingRole: 'PROVES' },
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  'RMO_EVIDENCE_BINDING_ROLE_UNKNOWN'
);
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    { ...evidenceBindingFixture, componentReferences: ['RMO-STATE-UNKNOWN-0001'] },
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  'RMO_EVIDENCE_BINDING_COMPONENT_REFERENCE_UNKNOWN:RMO-STATE-UNKNOWN-0001'
);
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    {
      ...evidenceBindingFixture,
      evidenceReference: { ...evidenceBindingFixture.evidenceReference, evidenceDigest: '0'.repeat(64) }
    },
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  'RMO_EVIDENCE_BINDING_EVIDENCE_REFERENCE_MISMATCH'
);
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    evidenceBindingFixture,
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture, clone(evidenceRecordFixture)]
  ),
  'RMO_EVIDENCE_BINDING_EVIDENCE_IDENTITY_AMBIGUOUS'
);
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    { ...evidenceBindingFixture, sourceReferences: ['RRE-LINEAGE-VALIDATION-0001'] },
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  'RMO_EVIDENCE_BINDING_SOURCE_EVIDENCE_REFERENCE_REQUIRED'
);
const tamperedEvidence = clone(evidenceRecordFixture);
tamperedEvidence.sourceReference = 'RRE-SOURCE-TAMPERED';
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    evidenceBindingFixture,
    bindingRoleRegistry,
    rdg,
    allComponents,
    [tamperedEvidence]
  ),
  'RMO_EVIDENCE_DIGEST_INVALID'
);
const nonRreEvidence = redigest({
  ...clone(evidenceRecordFixture),
  producingRuntime: 'ALR',
  dataType: 'CAPABILITY_EVIDENCE_RECORD'
}, 'evidenceDigest');
const nonRreFixture = clone(evidenceBindingFixture);
nonRreFixture.evidenceReference.evidenceDigest = nonRreEvidence.evidenceDigest;
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    nonRreFixture,
    bindingRoleRegistry,
    rdg,
    allComponents,
    [nonRreEvidence]
  ),
  'RMO_EVIDENCE_RRE_AUTHORITY_REQUIRED'
);
const disputedEvidence = redigest({
  ...clone(evidenceRecordFixture),
  evidenceState: 'DISPUTED',
  eligibilityDecision: 'DISPUTED'
}, 'evidenceDigest');
const disputedEvidenceFixture = clone(evidenceBindingFixture);
disputedEvidenceFixture.evidenceReference.evidenceDigest = disputedEvidence.evidenceDigest;
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    disputedEvidenceFixture,
    bindingRoleRegistry,
    rdg,
    allComponents,
    [disputedEvidence]
  ),
  'RMO_EVIDENCE_ACCEPTED_STATE_REQUIRED'
);
const wrongSubjectEvidence = redigest({
  ...clone(evidenceRecordFixture),
  subjectReference: 'SUBJECT-OTHER-0001'
}, 'evidenceDigest');
const wrongSubjectFixture = clone(evidenceBindingFixture);
wrongSubjectFixture.evidenceReference.evidenceDigest = wrongSubjectEvidence.evidenceDigest;
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    wrongSubjectFixture,
    bindingRoleRegistry,
    rdg,
    allComponents,
    [wrongSubjectEvidence]
  ),
  'RMO_EVIDENCE_SUBJECT_BINDING_INVALID'
);
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    { ...evidenceBindingFixture, evidencePromotionPerformed: true },
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  'RMO_EVIDENCE_BINDING_FIELD_FORBIDDEN:evidencePromotionPerformed'
);
expectThrow(
  () => buildRealityEvidenceBinding(
    reality,
    { ...evidenceBindingFixture, providerUsed: true },
    bindingRoleRegistry,
    rdg,
    allComponents,
    [evidenceRecordFixture]
  ),
  'RMO_EVIDENCE_BINDING_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
const tamperedBinding = clone(binding);
tamperedBinding.truthClaimed = true;
expectThrow(() => assertRealityEvidenceBindingDigest(tamperedBinding), 'RMO_EVIDENCE_BINDING_DIGEST_INVALID');

const inferenceBoundary = buildRealityReasoningBoundary(
  reality,
  inferenceFixture,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(validateBoundary(inferenceBoundary), true, JSON.stringify(validateBoundary.errors));
assertRealityReasoningBoundaryDigest(inferenceBoundary);
assert.equal(inferenceBoundary.requestedDataNature, 'INFERRED');
assert.equal(inferenceBoundary.boundaryDecision, 'ALLOW_BOUNDED');
assert.equal(inferenceBoundary.governanceContext.firewallDecision, 'ALLOW_PURPOSE_BOUND');
assert.deepEqual(inferenceBoundary.reasoning.inference.inputReferences, [
  binding.bindingCode,
  derivedState.stateCode
].sort());
assert.equal(inferenceBoundary.unknownStatePreserved, true);
assert.equal(inferenceBoundary.evidencePromotionAllowed, false);
assert.equal(inferenceBoundary.interpretationCreated, false);
assert.equal(inferenceBoundary.inferenceCreated, false);
assert.equal(inferenceBoundary.professionalJudgmentCreated, false);
assert.equal(inferenceBoundary.navigationOrActionCreated, false);
assert.equal(inferenceBoundary.persistentStoreWriteAllowed, false);
assert.equal(Object.isFrozen(inferenceBoundary), true);
assert.equal(Object.hasOwn(inferenceBoundary, 'interpretationContent'), false);
assert.equal(Object.hasOwn(inferenceBoundary, 'inferenceContent'), false);

const interpretationBoundary = buildRealityReasoningBoundary(
  reality,
  interpretationFixture,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(validateBoundary(interpretationBoundary), true, JSON.stringify(validateBoundary.errors));
assertRealityReasoningBoundaryDigest(interpretationBoundary);
assert.equal(interpretationBoundary.requestedDataNature, 'INTERPRETED');
assert.equal(interpretationBoundary.boundaryDecision, 'ALLOW_BOUNDED');
assert.equal(interpretationBoundary.reasoning.interpretation.interpretationAuthorityRuntime, 'RMO');
assert.equal(interpretationBoundary.interpretationCreated, false);

const disconnectedInterpretation = clone(interpretationFixture);
disconnectedInterpretation.componentReferences = [observedState.stateCode];
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    disconnectedInterpretation,
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  `RMO_REASONING_BOUNDARY_EVIDENCE_BINDING_COMPONENT_DISCONNECTED:${binding.bindingCode}`
);

const noEvidence = clone(inferenceFixture);
noEvidence.boundaryCode = 'RMO-REASONING-BOUNDARY-NO-EVIDENCE-VALIDATION-0001';
noEvidence.evidenceBindingReferences = [];
noEvidence.reasoning.inference.inputReferences = [derivedState.stateCode];
const noEvidenceBoundary = buildRealityReasoningBoundary(
  reality,
  noEvidence,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(noEvidenceBoundary.boundaryDecision, 'REQUIRE_CORROBORATION');
assert.ok(noEvidenceBoundary.decisionReasons.includes('EVIDENCE_BINDING_REQUIRED'));

const unknownRequest = clone(inferenceFixture);
unknownRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-UNKNOWN-VALIDATION-0001';
unknownRequest.sourceState = 'UNKNOWN';
const unknownBoundary = buildRealityReasoningBoundary(
  reality,
  unknownRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(unknownBoundary.boundaryDecision, 'UNRESOLVED');
assert.equal(unknownBoundary.unknownStatePreserved, true);

const disputedRequest = clone(inferenceFixture);
disputedRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-DISPUTED-VALIDATION-0001';
disputedRequest.sourceState = 'DISPUTED';
const disputedBoundary = buildRealityReasoningBoundary(
  reality,
  disputedRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(disputedBoundary.boundaryDecision, 'REQUIRE_CORROBORATION');

const materialRequest = clone(inferenceFixture);
materialRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-MATERIAL-VALIDATION-0001';
materialRequest.reasoning.inference.uncertainty = 'MATERIAL';
const materialBoundary = buildRealityReasoningBoundary(
  reality,
  materialRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(materialBoundary.boundaryDecision, 'REQUIRE_CORROBORATION');

const noConsentRequest = clone(inferenceFixture);
noConsentRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-NO-CONSENT-VALIDATION-0001';
noConsentRequest.governanceContext.explicitConsent = false;
const noConsentBoundary = buildRealityReasoningBoundary(
  reality,
  noConsentRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(noConsentBoundary.boundaryDecision, 'REQUIRE_EXPLICIT_CONSENT');
assert.equal(noConsentBoundary.governanceContext.firewallDecision, 'REQUIRE_EXPLICIT_CONSENT');

const protectedCategoryRequest = clone(interpretationFixture);
protectedCategoryRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-PROTECTED-CATEGORY-VALIDATION-0001';
protectedCategoryRequest.governanceContext.sensitivityClass = 'PERSONAL';
protectedCategoryRequest.governanceContext.sensitivityCategory = 'HEALTH';
protectedCategoryRequest.governanceContext.explicitConsent = false;
const protectedCategoryBoundary = buildRealityReasoningBoundary(
  reality,
  protectedCategoryRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(protectedCategoryBoundary.boundaryDecision, 'REQUIRE_EXPLICIT_CONSENT');

const professionalRequest = clone(inferenceFixture);
professionalRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-PROFESSIONAL-VALIDATION-0001';
professionalRequest.requestedDataNature = 'PROFESSIONAL_JUDGMENT';
professionalRequest.requestedCertainty = null;
professionalRequest.reasoning = {
  mode: 'PROFESSIONAL_JUDGMENT',
  inference: null,
  interpretation: null,
  professionalJudgment: { requiredAuthorityRuntime: 'PR' }
};
professionalRequest.governanceContext = {
  purposeCodes: ['SERVICE_DELIVERY'],
  sensitivityClass: 'RESTRICTED_PROFESSIONAL',
  sensitivityCategory: 'PROFESSIONAL_NOTES',
  explicitConsent: true
};
professionalRequest.createdAt = '2026-08-10T07:36:00.000Z';
const professionalBoundary = buildRealityReasoningBoundary(
  reality,
  professionalRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(validateBoundary(professionalBoundary), true, JSON.stringify(validateBoundary.errors));
assert.equal(professionalBoundary.boundaryDecision, 'REQUIRE_PROFESSIONAL_AUTHORITY');
assert.equal(professionalBoundary.reasoning.professionalJudgment.requiredAuthorityRuntime, 'PR');
assert.equal(professionalBoundary.professionalJudgmentCreated, false);

const secretRequest = clone(inferenceFixture);
secretRequest.boundaryCode = 'RMO-REASONING-BOUNDARY-SECRET-VALIDATION-0001';
secretRequest.governanceContext.sensitivityClass = 'SYSTEM_SECRET';
secretRequest.governanceContext.sensitivityCategory = 'AUTHENTICATION';
const secretBoundary = buildRealityReasoningBoundary(
  reality,
  secretRequest,
  boundaryRegistry,
  rdg,
  allComponents,
  [binding]
);
assert.equal(secretBoundary.boundaryDecision, 'DENY');

const incompleteLineage = clone(inferenceFixture);
incompleteLineage.reasoning.inference.inputReferences = [derivedState.stateCode];
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    incompleteLineage,
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  'RMO_REASONING_INFERENCE_EXACT_INPUT_LINEAGE_REQUIRED'
);
const missingStatement = clone(interpretationFixture);
delete missingStatement.reasoning.interpretation.boundaryStatementReference;
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    missingStatement,
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  'RMO_REASONING_INTERPRETATION_BOUNDARY_STATEMENT_INVALID'
);
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    { ...inferenceFixture, requestedCertainty: 'INTERPRETED' },
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  'RMO_REASONING_BOUNDARY_CERTAINTY_MISMATCH'
);
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    { ...inferenceFixture, requestedDataNature: 'DERIVED' },
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  'RMO_REASONING_BOUNDARY_CLASS_UNKNOWN'
);
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    { ...inferenceFixture, providerUsed: true },
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  'RMO_REASONING_BOUNDARY_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN'
);
expectThrow(
  () => buildRealityReasoningBoundary(
    reality,
    { ...interpretationFixture, interpretationContent: 'forbidden' },
    boundaryRegistry,
    rdg,
    allComponents,
    [binding]
  ),
  'RMO_REASONING_BOUNDARY_FIELD_FORBIDDEN:interpretationContent'
);
const tamperedBoundary = clone(inferenceBoundary);
tamperedBoundary.inferenceCreated = true;
expectThrow(() => assertRealityReasoningBoundaryDigest(tamperedBoundary), 'RMO_REASONING_BOUNDARY_DIGEST_INVALID');

assert.equal(acceptance.baselineCommit, '6920c9efb164a6e29f7dcbd8575f7a54e9d28c2f');
assert.deepEqual(acceptance.requiredWork, ['RMO-W8', 'RMO-W9']);
assert.equal(acceptance.acceptanceRules.w0W7Preserved, true);
assert.equal(acceptance.acceptanceRules.rreEvidenceAuthorityPreserved, true);
assert.equal(acceptance.acceptanceRules.rdgGovernanceAuthorityPreserved, true);
assert.equal(acceptance.acceptanceRules.prProfessionalJudgmentAuthorityPreserved, true);
assert.equal(acceptance.acceptanceRules.evidencePromotionActivated, false);
assert.equal(acceptance.acceptanceRules.interpretationOrInferenceContentActivated, false);
assert.equal(acceptance.acceptanceRules.packageJsonModifiedByDelivery, false);

assert.equal(freeze.status, 'RMO-W8-W9-EVIDENCE-REASONING-FROZEN');
assert.deepEqual(freeze.completedWork, ['RMO-W8', 'RMO-W9']);
assert.equal(freeze.previousStructurePreservation.allPriorFrozenOutputsPreserved, true);
assert.equal(freeze.deliveryBoundary.packageJsonModified, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
assert.equal(freeze.nextWork, 'RMO-W10');
for (const output of freeze.frozenOutputs) {
  assert.ok(fs.existsSync(path.join(root, output)), `frozen output missing: ${output}`);
}

const manualWiring = readText('docs/runtime/RMO-W8-W9-PACKAGE-MANUAL-WIRING.md');
assert.match(manualWiring, /"check:rmo-w8-w9": "node scripts\/check-rmo-w8-w9-evidence-reasoning-boundary\.mjs"/);
assert.match(manualWiring, /"check:rmo-evidence-reasoning": "npm run check:rmo-w8-w9"/);
assert.match(manualWiring, /"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning"/);
assert.match(manualWiring, /Keep `postcheck` unchanged/);
assert.equal(readText('package.json'), packageBefore, 'checker may not modify package.json');

for (const authority of audit.inspectedAuthorities) {
  assert.equal(normalizedHash(authority.reference), authority.sha256, `authority mutated during check: ${authority.reference}`);
}
for (const entry of preservation.files) {
  assert.equal(normalizedHash(entry.path), entry.sha256, `RMO-W5-W7 mutated during check: ${entry.path}`);
}

console.log('✓ RMO-W8 Evidence Binding passed with RRE / RDG authority, subject, digest, purpose and lineage enforcement.');
console.log('✓ RMO-W9 Interpretation / Inference Boundary passed with exact lineage, uncertainty and RDG firewall enforcement.');
console.log('✓ Evidence promotion, reasoning content, Professional Judgment, Unknown Runtime, persistence, Provider/AI, network and production execution remain inactive.');
