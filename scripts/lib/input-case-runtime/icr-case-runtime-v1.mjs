import {
  assertVerifiedInputDigest,
  stableDigest,
  validateRdgBindings
} from './icr-input-foundation-v1.mjs';

const clone = value => structuredClone(value);
const present = value => value !== undefined && value !== null && value !== '';
const uniqueSorted = values => [...new Set(values ?? [])].sort();

const CASE_CODE_PATTERN = /^ICR-CASE-[A-Z0-9-]{4,100}$/;
const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const PERSISTENCE_DECISION_PATTERN = /^RDG-PERSISTENCE-DECISION-[A-Z0-9-]{4,100}$/;

const RDG_REFERENCES = Object.freeze({
  authorityEntrypoint: 'content/governance/reality-data-governance/registries/reality-data-registry-v1.json',
  consentRegistry: 'content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json',
  persistenceRegistry: 'content/governance/reality-data-governance/registries/canonical-persistence-class-registry-v1.json',
  persistenceEligibilityGate: 'content/governance/reality-data-governance/contracts/persistence-eligibility-gate-v1.json',
  retentionRegistry: 'content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json',
  deletionRuntime: 'content/governance/reality-data-governance/contracts/deletion-tombstone-runtime-v1.json'
});

const CASE_FORBIDDEN_FIELDS = new Set([
  'customerDb', 'customerDatabase', 'customerRecord', 'accountRecord', 'payload',
  'rawInput', 'rawBirthData', 'rawDocument', 'reality', 'realityObject',
  'realityId', 'realityCode', 'runtimeState', 'password', 'accessToken', 'refreshToken'
]);

const RDG_POLICY_FIELDS = new Set([
  'duration', 'expiryBehavior', 'deletionDecision', 'legalHoldOverride',
  'retentionPolicy', 'consentGrant', 'persistenceEligibility'
]);

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function withoutDigest(value, field) {
  const copy = clone(value);
  delete copy[field];
  return copy;
}

function requireText(value, code) {
  if (!present(value) || typeof value !== 'string') throw new TypeError(code);
  return value.trim();
}

function requirePattern(value, pattern, code) {
  const text = requireText(value, code);
  if (!pattern.test(text)) throw new TypeError(code);
  return text;
}

function requireIso(value, code) {
  const text = requireText(value, code);
  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== text) throw new TypeError(code);
  return text;
}

function findForbiddenField(value, forbidden, path = '') {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenField(value[index], forbidden, `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (forbidden.has(key)) return childPath;
    const found = findForbiddenField(child, forbidden, childPath);
    if (found) return found;
  }
  return null;
}

function assertNoForbiddenFields(value, forbidden, code) {
  const path = findForbiddenField(value, forbidden);
  if (path) throw new TypeError(`${code}:${path}`);
}

function assertNoProviderOrAi(request) {
  if (request?.providerUsed !== false || request?.aiUsed !== false) {
    throw new TypeError('ICR_CASE_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  }
}

function assertReferenceRegistry(registry) {
  if (registry?.authority !== 'RDG' || registry?.status !== 'reference_only') {
    throw new TypeError('ICR_RDG_REFERENCE_REGISTRY_INVALID');
  }
  if ((registry.copiedPolicyEntries ?? []).length !== 0 || (registry.instances ?? []).length !== 0) {
    throw new TypeError('ICR_RDG_REFERENCE_REGISTRY_MUST_NOT_COPY_POLICY_OR_DATA');
  }
  for (const [key, expected] of Object.entries(RDG_REFERENCES)) {
    if (registry.references?.[key] !== expected) {
      throw new TypeError(`ICR_RDG_REFERENCE_DRIFT:${key}`);
    }
  }
}

export function buildRdgLifecycleReferences(
  governanceBindings,
  request,
  rdgRegistries,
  rdgReferenceRegistry
) {
  assertNoForbiddenFields(request, RDG_POLICY_FIELDS, 'ICR_RDG_POLICY_COPY_FORBIDDEN');
  assertReferenceRegistry(rdgReferenceRegistry);
  const governance = validateRdgBindings(governanceBindings, rdgRegistries, 'REALITY_INPUT_RECORD');
  const persistenceDecisionReference = requirePattern(
    request?.persistenceDecisionReference,
    PERSISTENCE_DECISION_PATTERN,
    'ICR_RDG_PERSISTENCE_DECISION_REFERENCE_INVALID'
  );
  return freeze({
    mode: 'RDG_REFERENCE_ONLY',
    rdgAuthorityReference: RDG_REFERENCES.authorityEntrypoint,
    persistenceClass: governance.persistenceClass,
    persistenceDecisionReference,
    persistenceRegistryReference: RDG_REFERENCES.persistenceRegistry,
    persistenceEligibilityGateReference: RDG_REFERENCES.persistenceEligibilityGate,
    consentClass: governance.consentClass,
    consentReference: governance.consentReference,
    consentRegistryReference: RDG_REFERENCES.consentRegistry,
    retentionClass: governance.retentionClass,
    retentionRegistryReference: RDG_REFERENCES.retentionRegistry,
    deletionState: governance.deletionState,
    deletionRuntimeReference: RDG_REFERENCES.deletionRuntime
  });
}

function normalizeVerifiedInputReferences(verifiedInputs) {
  if (!Array.isArray(verifiedInputs) || verifiedInputs.length === 0) {
    throw new TypeError('ICR_CASE_VERIFIED_INPUT_REQUIRED');
  }
  const seenCodes = new Set();
  const seenDigests = new Set();
  const references = verifiedInputs.map(input => {
    assertNoForbiddenFields(input, CASE_FORBIDDEN_FIELDS, 'ICR_CASE_VERIFIED_INPUT_PAYLOAD_FORBIDDEN');
    assertVerifiedInputDigest(input);
    if (input.verificationState !== 'VERIFIED' || input.projectionEligibility !== 'ELIGIBLE') {
      throw new TypeError('ICR_CASE_VERIFIED_INPUT_INELIGIBLE');
    }
    const verifiedInputCode = requireText(input.verifiedInputCode, 'ICR_CASE_VERIFIED_INPUT_CODE_REQUIRED');
    if (seenCodes.has(verifiedInputCode)) throw new TypeError('ICR_CASE_DUPLICATE_VERIFIED_INPUT_CODE');
    if (seenDigests.has(input.verifiedInputDigest)) throw new TypeError('ICR_CASE_DUPLICATE_VERIFIED_INPUT_DIGEST');
    seenCodes.add(verifiedInputCode);
    seenDigests.add(input.verifiedInputDigest);
    return {
      verifiedInputCode,
      verifiedInputVersion: requirePattern(
        input.verifiedInputVersion,
        SEMVER_PATTERN,
        'ICR_CASE_VERIFIED_INPUT_VERSION_INVALID'
      ),
      verifiedInputDigest: input.verifiedInputDigest,
      inputType: requireText(input.inputType, 'ICR_CASE_INPUT_TYPE_REQUIRED'),
      verificationState: 'VERIFIED',
      projectionEligibility: 'ELIGIBLE'
    };
  });
  return references.sort((a, b) => a.verifiedInputCode.localeCompare(b.verifiedInputCode));
}

function findState(registry, state) {
  return (registry?.states ?? []).find(entry => entry.state === state);
}

function assertKnownState(registry, state) {
  const entry = findState(registry, state);
  if (!entry) throw new TypeError('ICR_CASE_STATE_UNKNOWN');
  return entry;
}

export function buildCanonicalCase(
  request,
  verifiedInputs,
  stateRegistry,
  rdgRegistries,
  rdgReferenceRegistry
) {
  assertNoForbiddenFields(request, CASE_FORBIDDEN_FIELDS, 'ICR_CASE_DIRECT_DATA_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request);
  const caseCode = requirePattern(request.caseCode, CASE_CODE_PATTERN, 'ICR_CASE_CODE_INVALID');
  const caseVersion = requirePattern(request.caseVersion, SEMVER_PATTERN, 'ICR_CASE_VERSION_INVALID');
  if (request.caseVersionSequence !== 1 || caseVersion !== '1.0.0') {
    throw new TypeError('ICR_CASE_INITIAL_VERSION_INVALID');
  }
  if (request.caseType !== 'REALITY_INITIALIZATION') throw new TypeError('ICR_CASE_TYPE_INVALID');
  if (request.caseStatus !== stateRegistry?.initialSnapshotState || request.caseStatus !== 'READY_FOR_RMO') {
    throw new TypeError('ICR_CASE_INITIAL_STATE_INVALID');
  }
  assertKnownState(stateRegistry, request.caseStatus);
  const verifiedInputReferences = normalizeVerifiedInputReferences(verifiedInputs);
  const governanceBindings = validateRdgBindings(
    request.governanceBindings,
    rdgRegistries,
    'REALITY_INPUT_RECORD'
  );
  const rdgLifecycleReferences = buildRdgLifecycleReferences(
    governanceBindings,
    request.rdgLifecycleReferenceRequest,
    rdgRegistries,
    rdgReferenceRegistry
  );
  const createdAt = requireIso(request.createdAt, 'ICR_CASE_CREATED_AT_INVALID');
  const changeReferences = uniqueSorted(request.changeReferences);
  if (changeReferences.length === 0) throw new TypeError('ICR_CASE_CHANGE_REFERENCE_REQUIRED');
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-CASE-v1.0.0',
    caseCode,
    caseVersion,
    caseVersionSequence: 1,
    caseType: 'REALITY_INITIALIZATION',
    caseStatus: 'READY_FOR_RMO',
    subjectReference: requirePattern(
      request.subjectReference,
      /^SUBJECT-[A-Z0-9-]{4,80}$/,
      'ICR_CASE_SUBJECT_REFERENCE_INVALID'
    ),
    verifiedInputReferences,
    governanceBindings,
    rdgLifecycleReferences,
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    rmoRealityWriteAllowed: false,
    createdAt,
    updatedAt: createdAt,
    lineage: {
      rootCaseReference: caseCode,
      previousCaseVersion: null,
      previousCaseDigest: null,
      changeType: 'CASE_CREATED',
      changeReferences
    }
  };
  return freeze({ ...base, caseDigest: stableDigest(base) });
}

export function assertCanonicalCaseDigest(caseSnapshot) {
  if (stableDigest(withoutDigest(caseSnapshot, 'caseDigest')) !== caseSnapshot.caseDigest) {
    throw new TypeError('ICR_CASE_DIGEST_INVALID');
  }
  return true;
}

export function buildRealityInitializationRequest(caseSnapshot, request, stateRegistry) {
  assertNoForbiddenFields(request, CASE_FORBIDDEN_FIELDS, 'ICR_RMO_HANDOFF_DIRECT_DATA_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request);
  assertCanonicalCaseDigest(caseSnapshot);
  const state = assertKnownState(stateRegistry, caseSnapshot.caseStatus);
  if (caseSnapshot.caseType !== 'REALITY_INITIALIZATION' || state.rmoHandoffEligible !== true) {
    throw new TypeError('ICR_RMO_HANDOFF_CASE_INELIGIBLE');
  }
  if (caseSnapshot.rdgLifecycleReferences?.deletionState !== 'ACTIVE') {
    throw new TypeError('ICR_RMO_HANDOFF_RDG_DELETION_STATE_BLOCKED');
  }
  const requestedAt = requireIso(request.requestedAt, 'ICR_RMO_HANDOFF_REQUESTED_AT_INVALID');
  if (Date.parse(requestedAt) <= Date.parse(caseSnapshot.updatedAt)) {
    throw new TypeError('ICR_RMO_HANDOFF_TIME_NOT_AFTER_CASE');
  }
  const base = {
    schemaVersion: 'PHI-OS-REALITY-INITIALIZATION-REQUEST-v1.0.0',
    initializationRequestCode: requirePattern(
      request.initializationRequestCode,
      /^ICR-RMO-INIT-[A-Z0-9-]{4,100}$/,
      'ICR_RMO_HANDOFF_CODE_INVALID'
    ),
    initializationRequestVersion: requirePattern(
      request.initializationRequestVersion,
      SEMVER_PATTERN,
      'ICR_RMO_HANDOFF_VERSION_INVALID'
    ),
    sourceCaseCode: caseSnapshot.caseCode,
    sourceCaseVersion: caseSnapshot.caseVersion,
    sourceCaseDigest: caseSnapshot.caseDigest,
    verifiedInputReferences: clone(caseSnapshot.verifiedInputReferences),
    governanceReferences: clone(caseSnapshot.rdgLifecycleReferences),
    sourceRuntimeCode: 'ICR',
    targetRuntimeCode: 'RMO',
    targetWorkCode: 'RMO-W1',
    requestedObject: 'REALITY_V1',
    requestedOutputDataType: 'RUNTIME_STATE_RECORD',
    handoffState: 'READY_FOR_RMO_ACCEPTANCE',
    rmoAcceptanceRequired: true,
    rmoExecutionActivated: false,
    realityObjectCreated: false,
    requestedAt
  };
  return freeze({ ...base, requestDigest: stableDigest(base) });
}

export function assertRealityInitializationRequestDigest(request) {
  if (stableDigest(withoutDigest(request, 'requestDigest')) !== request.requestDigest) {
    throw new TypeError('ICR_RMO_HANDOFF_DIGEST_INVALID');
  }
  return true;
}

function semverParts(version) {
  requirePattern(version, SEMVER_PATTERN, 'ICR_CASE_VERSION_INVALID');
  return version.split('.').map(Number);
}

function compareSemver(left, right) {
  const leftParts = semverParts(left);
  const rightParts = semverParts(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

export function reviseCanonicalCase(
  currentCase,
  request,
  verifiedInputs,
  stateRegistry,
  rdgRegistries,
  rdgReferenceRegistry
) {
  assertCanonicalCaseDigest(currentCase);
  assertNoForbiddenFields(request, CASE_FORBIDDEN_FIELDS, 'ICR_CASE_REVISION_DIRECT_DATA_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request);
  if (request.caseCode !== currentCase.caseCode) throw new TypeError('ICR_CASE_REVISION_IDENTITY_CHANGED');
  if (request.nextCaseVersionSequence !== currentCase.caseVersionSequence + 1) {
    throw new TypeError('ICR_CASE_VERSION_SEQUENCE_INVALID');
  }
  const nextCaseVersion = requirePattern(
    request.nextCaseVersion,
    SEMVER_PATTERN,
    'ICR_CASE_NEXT_VERSION_INVALID'
  );
  if (compareSemver(nextCaseVersion, currentCase.caseVersion) <= 0) {
    throw new TypeError('ICR_CASE_VERSION_NOT_INCREASED');
  }
  const currentState = assertKnownState(stateRegistry, currentCase.caseStatus);
  assertKnownState(stateRegistry, request.nextStatus);
  if (!currentState.allowedNextStates.includes(request.nextStatus)) {
    throw new TypeError('ICR_CASE_STATE_TRANSITION_FORBIDDEN');
  }
  const changeTypes = new Set([
    'STATUS_TRANSITION', 'VERIFIED_INPUT_ADDED', 'VERIFIED_INPUT_REPLACED',
    'VERIFIED_INPUT_REMOVED', 'GOVERNANCE_REBIND', 'CASE_CORRECTION'
  ]);
  if (!changeTypes.has(request.changeType)) throw new TypeError('ICR_CASE_CHANGE_TYPE_INVALID');
  if (request.changeType === 'STATUS_TRANSITION' && request.nextStatus === currentCase.caseStatus) {
    throw new TypeError('ICR_CASE_STATUS_TRANSITION_MUST_CHANGE_STATE');
  }
  const changeReferences = uniqueSorted(request.changeReferences);
  if (changeReferences.length === 0) throw new TypeError('ICR_CASE_CHANGE_REFERENCE_REQUIRED');
  const revisedAt = requireIso(request.revisedAt, 'ICR_CASE_REVISED_AT_INVALID');
  if (Date.parse(revisedAt) <= Date.parse(currentCase.updatedAt)) {
    throw new TypeError('ICR_CASE_REVISION_TIME_NOT_INCREASED');
  }
  const verifiedInputReferences = normalizeVerifiedInputReferences(verifiedInputs);
  const governanceBindings = validateRdgBindings(
    request.governanceBindings,
    rdgRegistries,
    'REALITY_INPUT_RECORD'
  );
  const rdgLifecycleReferences = buildRdgLifecycleReferences(
    governanceBindings,
    request.rdgLifecycleReferenceRequest,
    rdgRegistries,
    rdgReferenceRegistry
  );
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-CASE-v1.0.0',
    caseCode: currentCase.caseCode,
    caseVersion: nextCaseVersion,
    caseVersionSequence: request.nextCaseVersionSequence,
    caseType: currentCase.caseType,
    caseStatus: request.nextStatus,
    subjectReference: currentCase.subjectReference,
    verifiedInputReferences,
    governanceBindings,
    rdgLifecycleReferences,
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    rmoRealityWriteAllowed: false,
    createdAt: currentCase.createdAt,
    updatedAt: revisedAt,
    lineage: {
      rootCaseReference: currentCase.lineage.rootCaseReference,
      previousCaseVersion: currentCase.caseVersion,
      previousCaseDigest: currentCase.caseDigest,
      changeType: request.changeType,
      changeReferences
    }
  };
  return freeze({ ...base, caseDigest: stableDigest(base) });
}
