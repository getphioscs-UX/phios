import {
  stableDigest
} from '../input-case-runtime/icr-input-foundation-v1.mjs';
import {
  assertCanonicalCaseDigest,
  assertRealityInitializationRequestDigest
} from '../input-case-runtime/icr-case-runtime-v1.mjs';

const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const REALITY_PATTERN = /^RMO-REALITY-[A-Z0-9-]{4,100}$/;
const ENTITY_PATTERN = /^RMO-ENTITY-[A-Z0-9-]{4,100}$/;
const EVENT_PATTERN = /^RMO-EVENT-[A-Z0-9-]{4,100}$/;
const SIGNAL_PATTERN = /^RMO-SIGNAL-[A-Z0-9-]{4,100}$/;
const NON_INFERENTIAL_NATURES = new Set([
  'OBSERVED',
  'USER_REPORTED',
  'IMPORTED',
  'MAPPED'
]);

const clone = value => structuredClone(value);
const present = value => value !== undefined && value !== null && value !== '';
const sortedUnique = values => [...new Set(values ?? [])].sort();

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
  const time = Date.parse(text);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== text) throw new TypeError(code);
  return text;
}

function requirePositiveInteger(value, code) {
  if (!Number.isInteger(value) || value < 1) throw new TypeError(code);
  return value;
}

function requireReferenceArray(value, code) {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => !present(item))) {
    throw new TypeError(code);
  }
  const normalized = sortedUnique(value.map(item => requireText(item, code)));
  if (normalized.length !== value.length) throw new TypeError(`${code}_DUPLICATE`);
  return normalized;
}

function optionalReferenceArray(value, code) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(item => !present(item))) throw new TypeError(code);
  const normalized = sortedUnique(value.map(item => requireText(item, code)));
  if (normalized.length !== value.length) throw new TypeError(`${code}_DUPLICATE`);
  return normalized;
}

function assertAllowedFields(value, allowed, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(code);
  const forbidden = Object.keys(value).filter(key => !allowed.has(key));
  if (forbidden.length > 0) throw new TypeError(`${code}:${forbidden.sort().join(',')}`);
}

function assertNoProviderOrAi(value, code) {
  if (value?.providerUsed !== false || value?.aiUsed !== false) throw new TypeError(code);
}

function assertKnownNatureAndCertainty(dataNature, certainty, rdg, code) {
  const natures = new Set(rdg?.natures?.natures ?? []);
  const certainties = new Set(rdg?.certainties?.certaintyValues ?? []);
  if (!natures.has(dataNature)) throw new TypeError(`${code}_DATA_NATURE_INVALID`);
  if (!certainties.has(certainty)) throw new TypeError(`${code}_CERTAINTY_INVALID`);
}

function assertNonInferentialNature(dataNature, code) {
  if (!NON_INFERENTIAL_NATURES.has(dataNature)) {
    throw new TypeError(`${code}_INFERENCE_OR_DERIVATION_BOUNDARY_NOT_IMPLEMENTED`);
  }
}

function assertSameReferences(left, right, code) {
  if (stableDigest(left) !== stableDigest(right)) throw new TypeError(code);
}

function realityReference(reality) {
  return freeze({
    realityCode: reality.realityCode,
    realityVersion: reality.realityVersion,
    realityDigest: reality.realityDigest
  });
}

function assertRealityReference(component, reality, code) {
  const expected = realityReference(reality);
  if (stableDigest(component.realityReference) !== stableDigest(expected)) throw new TypeError(code);
}

export function buildCanonicalReality(caseSnapshot, initializationRequest, acceptance) {
  assertAllowedFields(acceptance, new Set([
    'realityCode',
    'realityVersion',
    'realityVersionSequence',
    'acceptedAt',
    'changeReferences',
    'providerUsed',
    'aiUsed'
  ]), 'RMO_REALITY_ACCEPTANCE_FIELD_FORBIDDEN');
  assertNoProviderOrAi(acceptance, 'RMO_REALITY_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  assertCanonicalCaseDigest(caseSnapshot);
  assertRealityInitializationRequestDigest(initializationRequest);

  if (caseSnapshot.caseStatus !== 'READY_FOR_RMO' || caseSnapshot.caseType !== 'REALITY_INITIALIZATION') {
    throw new TypeError('RMO_REALITY_CASE_INELIGIBLE');
  }
  if (caseSnapshot.rdgLifecycleReferences?.deletionState !== 'ACTIVE' ||
      initializationRequest.governanceReferences?.deletionState !== 'ACTIVE') {
    throw new TypeError('RMO_REALITY_RDG_DELETION_STATE_BLOCKED');
  }
  if (initializationRequest.targetRuntimeCode !== 'RMO' ||
      initializationRequest.targetWorkCode !== 'RMO-W1' ||
      initializationRequest.requestedObject !== 'REALITY_V1' ||
      initializationRequest.requestedOutputDataType !== 'RUNTIME_STATE_RECORD' ||
      initializationRequest.handoffState !== 'READY_FOR_RMO_ACCEPTANCE' ||
      initializationRequest.rmoAcceptanceRequired !== true ||
      initializationRequest.rmoExecutionActivated !== false ||
      initializationRequest.realityObjectCreated !== false) {
    throw new TypeError('RMO_REALITY_INITIALIZATION_REQUEST_INELIGIBLE');
  }
  if (initializationRequest.sourceCaseCode !== caseSnapshot.caseCode ||
      initializationRequest.sourceCaseVersion !== caseSnapshot.caseVersion ||
      initializationRequest.sourceCaseDigest !== caseSnapshot.caseDigest) {
    throw new TypeError('RMO_REALITY_CASE_REQUEST_BINDING_INVALID');
  }
  assertSameReferences(
    initializationRequest.verifiedInputReferences,
    caseSnapshot.verifiedInputReferences,
    'RMO_REALITY_VERIFIED_INPUT_BINDING_INVALID'
  );
  assertSameReferences(
    initializationRequest.governanceReferences,
    caseSnapshot.rdgLifecycleReferences,
    'RMO_REALITY_RDG_BINDING_INVALID'
  );

  const acceptedAt = requireIso(acceptance.acceptedAt, 'RMO_REALITY_ACCEPTED_AT_INVALID');
  if (Date.parse(acceptedAt) <= Date.parse(initializationRequest.requestedAt)) {
    throw new TypeError('RMO_REALITY_ACCEPTANCE_TIME_INVALID');
  }
  const realityCode = requirePattern(acceptance.realityCode, REALITY_PATTERN, 'RMO_REALITY_CODE_INVALID');
  const realityVersion = requirePattern(acceptance.realityVersion, SEMVER_PATTERN, 'RMO_REALITY_VERSION_INVALID');
  if (realityVersion !== '1.0.0' || acceptance.realityVersionSequence !== 1) {
    throw new TypeError('RMO_REALITY_V1_REQUIRED');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-v1.0.0',
    realityCode,
    realityVersion,
    realityVersionSequence: requirePositiveInteger(
      acceptance.realityVersionSequence,
      'RMO_REALITY_VERSION_SEQUENCE_INVALID'
    ),
    dataDomain: 'RUNTIME_STATE',
    dataType: 'RUNTIME_STATE_RECORD',
    realityStatus: 'INITIALIZED',
    subjectReference: requireText(caseSnapshot.subjectReference, 'RMO_REALITY_SUBJECT_REFERENCE_REQUIRED'),
    sourceInitialization: {
      initializationRequestCode: initializationRequest.initializationRequestCode,
      initializationRequestVersion: initializationRequest.initializationRequestVersion,
      initializationRequestDigest: initializationRequest.requestDigest,
      sourceCaseCode: caseSnapshot.caseCode,
      sourceCaseVersion: caseSnapshot.caseVersion,
      sourceCaseDigest: caseSnapshot.caseDigest,
      verifiedInputReferences: clone(initializationRequest.verifiedInputReferences)
    },
    governanceReferences: clone(initializationRequest.governanceReferences),
    componentReferences: {
      entities: [],
      events: [],
      signals: [],
      relationships: [],
      constraints: [],
      evidenceBindings: [],
      unknowns: [],
      actions: [],
      outcomes: []
    },
    authorityBoundary: {
      inputAuthority: 'ICR',
      realityModelAuthority: 'RMO',
      dataGovernanceAuthority: 'RDG',
      operationalRuntimeAuthority: 'EXISTING_RUNTIME'
    },
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    productionExecutionAllowed: false,
    createdAt: acceptedAt,
    updatedAt: acceptedAt,
    lineage: {
      rootRealityReference: realityCode,
      previousRealityVersion: null,
      previousRealityDigest: null,
      changeType: 'REALITY_INITIALIZED',
      changeReferences: requireReferenceArray(
        acceptance.changeReferences,
        'RMO_REALITY_CHANGE_REFERENCES_INVALID'
      )
    }
  };
  return freeze({ ...base, realityDigest: stableDigest(base) });
}

export function assertCanonicalRealityDigest(reality) {
  if (stableDigest(withoutDigest(reality, 'realityDigest')) !== reality.realityDigest) {
    throw new TypeError('RMO_REALITY_DIGEST_INVALID');
  }
  return true;
}

export function buildRealityEntity(reality, request, entityTypeRegistry, rdg) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'entityCode', 'entityVersion', 'entityType', 'entityRole', 'canonicalReference',
    'dataNature', 'certainty', 'sourceReferences', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_ENTITY_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_ENTITY_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (entityTypeRegistry?.entityTypes ?? [])
    .find(entry => entry.entityType === request.entityType);
  if (!definition) throw new TypeError('RMO_ENTITY_TYPE_UNKNOWN');
  if (!definition.allowedRoles.includes(request.entityRole)) throw new TypeError('RMO_ENTITY_ROLE_INVALID');
  if (request.entityRole === 'PRIMARY_SUBJECT' && request.canonicalReference !== reality.subjectReference) {
    throw new TypeError('RMO_ENTITY_PRIMARY_SUBJECT_MISMATCH');
  }
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_ENTITY');
  assertNonInferentialNature(request.dataNature, 'RMO_ENTITY');
  const createdAt = requireIso(request.createdAt, 'RMO_ENTITY_CREATED_AT_INVALID');
  if (Date.parse(createdAt) <= Date.parse(reality.updatedAt)) throw new TypeError('RMO_ENTITY_TIME_INVALID');
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-ENTITY-v1.0.0',
    entityCode: requirePattern(request.entityCode, ENTITY_PATTERN, 'RMO_ENTITY_CODE_INVALID'),
    entityVersion: requirePattern(request.entityVersion, SEMVER_PATTERN, 'RMO_ENTITY_VERSION_INVALID'),
    componentType: 'REALITY_ENTITY',
    entityType: request.entityType,
    entityRole: request.entityRole,
    canonicalReference: requireText(request.canonicalReference, 'RMO_ENTITY_CANONICAL_REFERENCE_REQUIRED'),
    realityReference: realityReference(reality),
    dataNature: request.dataNature,
    certainty: request.certainty,
    sourceReferences: requireReferenceArray(request.sourceReferences, 'RMO_ENTITY_SOURCE_REFERENCES_INVALID'),
    recordStatus: 'REGISTERED',
    authorityReference: 'content/runtime/reality-model-runtime/contracts/entity-runtime-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, entityDigest: stableDigest(base) });
}

export function assertRealityEntityDigest(entity) {
  if (stableDigest(withoutDigest(entity, 'entityDigest')) !== entity.entityDigest) {
    throw new TypeError('RMO_ENTITY_DIGEST_INVALID');
  }
  return true;
}

function validateTemporal(temporal, allowedModes, createdAt) {
  if (!temporal || typeof temporal !== 'object' || !allowedModes.includes(temporal.mode)) {
    throw new TypeError('RMO_EVENT_TEMPORAL_MODE_INVALID');
  }
  if (temporal.mode === 'INSTANT') {
    const occurredAt = requireIso(temporal.occurredAt, 'RMO_EVENT_OCCURRED_AT_INVALID');
    if (temporal.startedAt !== null || temporal.endedAt !== null) throw new TypeError('RMO_EVENT_INSTANT_SHAPE_INVALID');
    if (Date.parse(createdAt) < Date.parse(occurredAt)) throw new TypeError('RMO_EVENT_TIME_INVALID');
    return freeze({ mode: 'INSTANT', occurredAt, startedAt: null, endedAt: null });
  }
  const startedAt = requireIso(temporal.startedAt, 'RMO_EVENT_STARTED_AT_INVALID');
  const endedAt = requireIso(temporal.endedAt, 'RMO_EVENT_ENDED_AT_INVALID');
  if (temporal.occurredAt !== null || Date.parse(startedAt) > Date.parse(endedAt) ||
      Date.parse(createdAt) < Date.parse(endedAt)) {
    throw new TypeError('RMO_EVENT_INTERVAL_INVALID');
  }
  return freeze({ mode: 'INTERVAL', occurredAt: null, startedAt, endedAt });
}

export function buildRealityEvent(reality, request, eventTypeRegistry, rdg, entities) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'eventCode', 'eventVersion', 'eventType', 'entityReferences', 'sourceReferences',
    'evidenceReferences', 'dataNature', 'certainty', 'temporal', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_EVENT_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_EVENT_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (eventTypeRegistry?.eventTypes ?? [])
    .find(entry => entry.eventType === request.eventType);
  if (!definition) throw new TypeError('RMO_EVENT_TYPE_UNKNOWN');
  if (!definition.allowedDataNatures.includes(request.dataNature)) throw new TypeError('RMO_EVENT_DATA_NATURE_FORBIDDEN');
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_EVENT');
  assertNonInferentialNature(request.dataNature, 'RMO_EVENT');
  const entityReferences = requireReferenceArray(request.entityReferences, 'RMO_EVENT_ENTITY_REFERENCES_INVALID');
  const entityMap = new Map((entities ?? []).map(entity => [entity.entityCode, entity]));
  for (const reference of entityReferences) {
    const entity = entityMap.get(reference);
    if (!entity) throw new TypeError(`RMO_EVENT_ENTITY_REFERENCE_UNKNOWN:${reference}`);
    assertRealityEntityDigest(entity);
    assertRealityReference(entity, reality, 'RMO_EVENT_ENTITY_REALITY_BINDING_INVALID');
  }
  const createdAt = requireIso(request.createdAt, 'RMO_EVENT_CREATED_AT_INVALID');
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-EVENT-v1.0.0',
    eventCode: requirePattern(request.eventCode, EVENT_PATTERN, 'RMO_EVENT_CODE_INVALID'),
    eventVersion: requirePattern(request.eventVersion, SEMVER_PATTERN, 'RMO_EVENT_VERSION_INVALID'),
    componentType: 'REALITY_EVENT',
    eventType: request.eventType,
    realityReference: realityReference(reality),
    entityReferences,
    sourceReferences: requireReferenceArray(request.sourceReferences, 'RMO_EVENT_SOURCE_REFERENCES_INVALID'),
    evidenceReferences: optionalReferenceArray(request.evidenceReferences, 'RMO_EVENT_EVIDENCE_REFERENCES_INVALID'),
    dataNature: request.dataNature,
    certainty: request.certainty,
    temporal: validateTemporal(request.temporal, definition.allowedTemporalModes, createdAt),
    recordStatus: 'RECORDED',
    evidenceEligibility: 'NOT_EVALUATED',
    authorityReference: 'content/runtime/reality-model-runtime/contracts/event-runtime-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    operationalTimelineWriteAllowed: false,
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, eventDigest: stableDigest(base) });
}

export function assertRealityEventDigest(event) {
  if (stableDigest(withoutDigest(event, 'eventDigest')) !== event.eventDigest) {
    throw new TypeError('RMO_EVENT_DIGEST_INVALID');
  }
  return true;
}

export function buildRealitySignal(reality, request, signalTypeRegistry, rdg, entities, events) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'signalCode', 'signalVersion', 'signalType', 'signalDirection', 'entityReferences',
    'eventReferences', 'sourceReferences', 'evidenceReferences', 'dataNature', 'certainty',
    'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_SIGNAL_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_SIGNAL_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (signalTypeRegistry?.signalTypes ?? [])
    .find(entry => entry.signalType === request.signalType);
  if (!definition) throw new TypeError('RMO_SIGNAL_TYPE_UNKNOWN');
  if (!definition.allowedDirections.includes(request.signalDirection)) throw new TypeError('RMO_SIGNAL_DIRECTION_INVALID');
  if (!definition.allowedDataNatures.includes(request.dataNature)) throw new TypeError('RMO_SIGNAL_DATA_NATURE_FORBIDDEN');
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_SIGNAL');
  assertNonInferentialNature(request.dataNature, 'RMO_SIGNAL');
  const entityReferences = requireReferenceArray(request.entityReferences, 'RMO_SIGNAL_ENTITY_REFERENCES_INVALID');
  const eventReferences = requireReferenceArray(request.eventReferences, 'RMO_SIGNAL_EVENT_REFERENCES_INVALID');
  const entityMap = new Map((entities ?? []).map(entity => [entity.entityCode, entity]));
  const eventMap = new Map((events ?? []).map(event => [event.eventCode, event]));
  for (const reference of entityReferences) {
    const entity = entityMap.get(reference);
    if (!entity) throw new TypeError(`RMO_SIGNAL_ENTITY_REFERENCE_UNKNOWN:${reference}`);
    assertRealityEntityDigest(entity);
    assertRealityReference(entity, reality, 'RMO_SIGNAL_ENTITY_REALITY_BINDING_INVALID');
  }
  for (const reference of eventReferences) {
    const event = eventMap.get(reference);
    if (!event) throw new TypeError(`RMO_SIGNAL_EVENT_REFERENCE_UNKNOWN:${reference}`);
    assertRealityEventDigest(event);
    assertRealityReference(event, reality, 'RMO_SIGNAL_EVENT_REALITY_BINDING_INVALID');
  }
  const createdAt = requireIso(request.createdAt, 'RMO_SIGNAL_CREATED_AT_INVALID');
  if (eventReferences.some(reference => Date.parse(createdAt) <= Date.parse(eventMap.get(reference).createdAt))) {
    throw new TypeError('RMO_SIGNAL_TIME_INVALID');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-SIGNAL-v1.0.0',
    signalCode: requirePattern(request.signalCode, SIGNAL_PATTERN, 'RMO_SIGNAL_CODE_INVALID'),
    signalVersion: requirePattern(request.signalVersion, SEMVER_PATTERN, 'RMO_SIGNAL_VERSION_INVALID'),
    componentType: 'REALITY_SIGNAL',
    signalType: request.signalType,
    signalDirection: request.signalDirection,
    realityReference: realityReference(reality),
    entityReferences,
    eventReferences,
    sourceReferences: requireReferenceArray(request.sourceReferences, 'RMO_SIGNAL_SOURCE_REFERENCES_INVALID'),
    evidenceReferences: optionalReferenceArray(request.evidenceReferences, 'RMO_SIGNAL_EVIDENCE_REFERENCES_INVALID'),
    dataNature: request.dataNature,
    certainty: request.certainty,
    recordStatus: 'RECORDED',
    evidenceEligibility: 'NOT_EVALUATED',
    interpretationState: 'NOT_INTERPRETED',
    inferenceState: 'NOT_INFERRED',
    authorityReference: 'content/runtime/reality-model-runtime/contracts/signal-runtime-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, signalDigest: stableDigest(base) });
}

export function assertRealitySignalDigest(signal) {
  if (stableDigest(withoutDigest(signal, 'signalDigest')) !== signal.signalDigest) {
    throw new TypeError('RMO_SIGNAL_DIGEST_INVALID');
  }
  return true;
}

export { stableDigest };
