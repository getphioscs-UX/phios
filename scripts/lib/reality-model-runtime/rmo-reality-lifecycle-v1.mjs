import {
  assertCanonicalRealityDigest,
  assertRealityEntityDigest,
  assertRealityEventDigest,
  assertRealitySignalDigest,
  stableDigest
} from './rmo-reality-foundation-v1.mjs';
import {
  assertRealityConstraintDigest,
  assertRealityRelationshipDigest,
  assertRealityStateDigest
} from './rmo-reality-structure-v1.mjs';
import {
  assertRealityEvidenceBindingDigest
} from './rmo-evidence-reasoning-v1.mjs';

const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const UNKNOWN_PATTERN = /^RMO-UNKNOWN-[A-Z0-9-]{4,100}$/;
const UNKNOWN_STATEMENT_PATTERN = /^RMO-UNKNOWN-STATEMENT-[A-Z0-9-]{4,140}$/;
const ACTION_PATTERN = /^RMO-ACTION-[A-Z0-9-]{4,100}$/;
const ACTION_DEFINITION_PATTERN = /^RMO-ACTION-DEFINITION-[A-Z0-9-]{4,140}$/;
const OUTCOME_PATTERN = /^RMO-OUTCOME-[A-Z0-9-]{4,100}$/;
const ENTITY_PATTERN = /^RMO-ENTITY-[A-Z0-9-]{4,100}$/;
const UNKNOWN_AUTHORITY =
  'content/runtime/reality-model-runtime/contracts/unknown-runtime-contract-v1.json';
const RDG_UNKNOWN_AUTHORITY =
  'content/governance/reality-data-governance/contracts/unknown-disputed-runtime-v1.json';
const ACTION_AUTHORITY =
  'content/runtime/reality-model-runtime/contracts/action-runtime-contract-v1.json';
const OUTCOME_AUTHORITY =
  'content/runtime/reality-model-runtime/contracts/outcome-runtime-contract-v1.json';

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

function realityReference(reality) {
  return freeze({
    realityCode: reality.realityCode,
    realityVersion: reality.realityVersion,
    realityDigest: reality.realityDigest
  });
}

function assertRealityReference(component, reality, code) {
  if (stableDigest(component.realityReference) !== stableDigest(realityReference(reality))) {
    throw new TypeError(code);
  }
}

function componentDescriptor(component) {
  switch (component?.componentType) {
    case 'REALITY_ENTITY':
      return { code: component.entityCode, kind: 'ENTITY', assertDigest: assertRealityEntityDigest };
    case 'REALITY_EVENT':
      return { code: component.eventCode, kind: 'EVENT', assertDigest: assertRealityEventDigest };
    case 'REALITY_SIGNAL':
      return { code: component.signalCode, kind: 'SIGNAL', assertDigest: assertRealitySignalDigest };
    case 'REALITY_RELATIONSHIP':
      return { code: component.relationshipCode, kind: 'RELATIONSHIP', assertDigest: assertRealityRelationshipDigest };
    case 'REALITY_CONSTRAINT':
      return { code: component.constraintCode, kind: 'CONSTRAINT', assertDigest: assertRealityConstraintDigest };
    case 'REALITY_STATE':
      return { code: component.stateCode, kind: 'STATE', assertDigest: assertRealityStateDigest };
    default:
      throw new TypeError('RMO_LIFECYCLE_COMPONENT_TYPE_UNSUPPORTED');
  }
}

function buildComponentMap(reality, components, code) {
  const map = new Map([
    [reality.realityCode, { record: reality, kind: 'REALITY', createdAt: reality.updatedAt }]
  ]);
  for (const component of components ?? []) {
    const descriptor = componentDescriptor(component);
    if (map.has(descriptor.code)) throw new TypeError(`${code}_DUPLICATE:${descriptor.code}`);
    descriptor.assertDigest(component);
    assertRealityReference(component, reality, `${code}_REALITY_BINDING_INVALID:${descriptor.code}`);
    map.set(descriptor.code, {
      record: component,
      kind: descriptor.kind,
      createdAt: component.createdAt
    });
  }
  return map;
}

function validateComponentReferences(reality, references, components, code) {
  const componentMap = buildComponentMap(reality, components, code);
  for (const reference of references) {
    if (!componentMap.has(reference)) throw new TypeError(`${code}_UNKNOWN:${reference}`);
  }
  return componentMap;
}

function buildEvidenceBindingMap(reality, evidenceBindings, code) {
  const map = new Map();
  for (const binding of evidenceBindings ?? []) {
    if (binding?.componentType !== 'REALITY_EVIDENCE_BINDING') {
      throw new TypeError(`${code}_TYPE_INVALID`);
    }
    if (map.has(binding.bindingCode)) throw new TypeError(`${code}_DUPLICATE:${binding.bindingCode}`);
    assertRealityEvidenceBindingDigest(binding);
    assertRealityReference(binding, reality, `${code}_REALITY_BINDING_INVALID:${binding.bindingCode}`);
    map.set(binding.bindingCode, binding);
  }
  return map;
}

function validateEvidenceBindingReferences(
  reality,
  references,
  componentReferences,
  evidenceBindings,
  code
) {
  const map = buildEvidenceBindingMap(reality, evidenceBindings, code);
  for (const reference of references) {
    const binding = map.get(reference);
    if (!binding) throw new TypeError(`${code}_UNKNOWN:${reference}`);
    if (!binding.componentReferences.some(component => componentReferences.includes(component))) {
      throw new TypeError(`${code}_COMPONENT_DISCONNECTED:${reference}`);
    }
  }
  return map;
}

function buildUnknownMap(reality, unknowns, code) {
  const map = new Map();
  for (const unknown of unknowns ?? []) {
    if (unknown?.componentType !== 'REALITY_UNKNOWN') throw new TypeError(`${code}_TYPE_INVALID`);
    if (map.has(unknown.unknownCode)) throw new TypeError(`${code}_DUPLICATE:${unknown.unknownCode}`);
    assertRealityUnknownDigest(unknown);
    assertRealityReference(unknown, reality, `${code}_REALITY_BINDING_INVALID:${unknown.unknownCode}`);
    map.set(unknown.unknownCode, unknown);
  }
  return map;
}

function validateUnknownReferences(reality, references, componentReferences, unknowns, code) {
  const map = buildUnknownMap(reality, unknowns, code);
  for (const reference of references) {
    const unknown = map.get(reference);
    if (!unknown) throw new TypeError(`${code}_UNKNOWN:${reference}`);
    if (!unknown.componentReferences.some(component => componentReferences.includes(component))) {
      throw new TypeError(`${code}_COMPONENT_DISCONNECTED:${reference}`);
    }
  }
  return map;
}

function buildActionMap(reality, actions, code) {
  const map = new Map();
  for (const action of actions ?? []) {
    if (action?.componentType !== 'REALITY_ACTION') throw new TypeError(`${code}_TYPE_INVALID`);
    if (map.has(action.actionCode)) throw new TypeError(`${code}_DUPLICATE:${action.actionCode}`);
    assertRealityActionDigest(action);
    assertRealityReference(action, reality, `${code}_REALITY_BINDING_INVALID:${action.actionCode}`);
    map.set(action.actionCode, action);
  }
  return map;
}

function rmoDataContract(rdg) {
  const contract = (rdg?.dataContracts?.entries ?? []).find(entry => entry.runtimeCode === 'RMO');
  if (!contract) throw new TypeError('RMO_LIFECYCLE_RDG_DATA_CONTRACT_MISSING');
  if (
    !contract.producedDataTypes?.includes('RUNTIME_STATE_RECORD') ||
    contract.producedDataTypes.includes('NAVIGATION_RECORD') ||
    contract.producedDataTypes.includes('OUTCOME_RECORD') ||
    contract.writeAuthority?.dataTypes?.some(type => type !== 'RUNTIME_STATE_RECORD')
  ) {
    throw new TypeError('RMO_LIFECYCLE_RDG_WRITE_AUTHORITY_INVALID');
  }
  if (
    contract.permissions?.evidencePromotion !== 'DENY' ||
    contract.permissions?.professionalDataWrite !== 'DENY'
  ) {
    throw new TypeError('RMO_LIFECYCLE_RDG_PERMISSION_BOUNDARY_INVALID');
  }
  return contract;
}

function assertKnownNatureAndCertainty(dataNature, certainty, rdg, code) {
  const natures = new Set(rdg?.natures?.natures ?? []);
  const certainties = new Set(rdg?.certainties?.certaintyValues ?? []);
  if (!natures.has(dataNature)) throw new TypeError(`${code}_DATA_NATURE_INVALID`);
  if (!certainties.has(certainty)) throw new TypeError(`${code}_CERTAINTY_INVALID`);
}

function latestTime(records) {
  return Math.max(...records.map(record => Date.parse(record.createdAt)));
}

export function buildRealityUnknown(
  reality,
  request,
  unknownKindRegistry,
  rdg,
  components,
  evidenceBindings
) {
  assertCanonicalRealityDigest(reality);
  rmoDataContract(rdg);
  assertAllowedFields(request, new Set([
    'unknownCode', 'unknownVersion', 'unknownKind', 'unknownState', 'componentReferences',
    'evidenceBindingReferences', 'statementReference', 'sourceReferences',
    'resolutionRequirements', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_UNKNOWN_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_UNKNOWN_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (unknownKindRegistry?.unknownKinds ?? [])
    .find(entry => entry.unknownKind === request.unknownKind);
  if (!definition) throw new TypeError('RMO_UNKNOWN_KIND_UNKNOWN');
  if (!definition.allowedStates.includes(request.unknownState)) {
    throw new TypeError('RMO_UNKNOWN_STATE_FORBIDDEN_FOR_KIND');
  }
  if (!(rdg?.unknownDisputed?.states ?? []).includes(request.unknownState)) {
    throw new TypeError('RMO_UNKNOWN_RDG_STATE_INVALID');
  }
  if (!(rdg?.certainties?.certaintyValues ?? []).includes(request.unknownState)) {
    throw new TypeError('RMO_UNKNOWN_CERTAINTY_INVALID');
  }
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_UNKNOWN_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_UNKNOWN_COMPONENT_REFERENCE'
  );
  const evidenceBindingReferences = optionalReferenceArray(
    request.evidenceBindingReferences,
    'RMO_UNKNOWN_EVIDENCE_BINDING_REFERENCES_INVALID'
  );
  const bindingMap = validateEvidenceBindingReferences(
    reality,
    evidenceBindingReferences,
    componentReferences,
    evidenceBindings,
    'RMO_UNKNOWN_EVIDENCE_BINDING_REFERENCE'
  );
  if (request.unknownState === 'DISPUTED' && evidenceBindingReferences.length === 0) {
    throw new TypeError('RMO_UNKNOWN_DISPUTED_EVIDENCE_BINDING_REQUIRED');
  }
  assertAllowedFields(request.resolutionRequirements, new Set([
    'requiredEvidenceCount', 'requiredEvidenceRoles', 'resolutionAuthorityRuntime',
    'evidenceAuthorityRuntime', 'dataGovernanceAuthorityRuntime', 'professionalAuthorityRequired'
  ]), 'RMO_UNKNOWN_RESOLUTION_REQUIREMENT_FIELD_FORBIDDEN');
  if (
    !Number.isInteger(request.resolutionRequirements.requiredEvidenceCount) ||
    request.resolutionRequirements.requiredEvidenceCount < definition.minimumResolutionEvidenceCount
  ) {
    throw new TypeError('RMO_UNKNOWN_RESOLUTION_EVIDENCE_COUNT_INVALID');
  }
  const requiredEvidenceRoles = requireReferenceArray(
    request.resolutionRequirements.requiredEvidenceRoles,
    'RMO_UNKNOWN_RESOLUTION_EVIDENCE_ROLES_INVALID'
  );
  if (requiredEvidenceRoles.some(role =>
    !(unknownKindRegistry?.allowedResolutionEvidenceRoles ?? []).includes(role))) {
    throw new TypeError('RMO_UNKNOWN_RESOLUTION_EVIDENCE_ROLE_UNKNOWN');
  }
  if (
    request.resolutionRequirements.resolutionAuthorityRuntime !== 'RMO' ||
    request.resolutionRequirements.evidenceAuthorityRuntime !== 'RRE' ||
    request.resolutionRequirements.dataGovernanceAuthorityRuntime !== 'RDG'
  ) {
    throw new TypeError('RMO_UNKNOWN_RESOLUTION_AUTHORITY_INVALID');
  }
  if (
    request.resolutionRequirements.professionalAuthorityRequired !==
    definition.professionalAuthorityRequired
  ) {
    throw new TypeError('RMO_UNKNOWN_PROFESSIONAL_AUTHORITY_REQUIREMENT_INVALID');
  }
  const createdAt = requireIso(request.createdAt, 'RMO_UNKNOWN_CREATED_AT_INVALID');
  const dependencies = [
    ...componentReferences.map(reference => componentMap.get(reference).record),
    ...evidenceBindingReferences.map(reference => bindingMap.get(reference))
  ];
  if (Date.parse(createdAt) <= latestTime(dependencies)) throw new TypeError('RMO_UNKNOWN_TIME_INVALID');
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-UNKNOWN-v1.0.0',
    unknownCode: requirePattern(request.unknownCode, UNKNOWN_PATTERN, 'RMO_UNKNOWN_CODE_INVALID'),
    unknownVersion: requirePattern(request.unknownVersion, SEMVER_PATTERN, 'RMO_UNKNOWN_VERSION_INVALID'),
    componentType: 'REALITY_UNKNOWN',
    dataType: 'RUNTIME_STATE_RECORD',
    unknownKind: request.unknownKind,
    unknownState: request.unknownState,
    certaintySnapshot: request.unknownState,
    realityReference: realityReference(reality),
    componentReferences,
    evidenceBindingReferences,
    statementReference: requirePattern(
      request.statementReference,
      UNKNOWN_STATEMENT_PATTERN,
      'RMO_UNKNOWN_STATEMENT_REFERENCE_INVALID'
    ),
    sourceReferences: requireReferenceArray(request.sourceReferences, 'RMO_UNKNOWN_SOURCE_REFERENCES_INVALID'),
    resolutionRequirements: {
      requiredEvidenceCount: request.resolutionRequirements.requiredEvidenceCount,
      requiredEvidenceRoles,
      resolutionAuthorityRuntime: 'RMO',
      evidenceAuthorityRuntime: 'RRE',
      dataGovernanceAuthorityRuntime: 'RDG',
      professionalAuthorityRequired: definition.professionalAuthorityRequired
    },
    recordStatus: 'OPEN',
    defaultValueApplied: false,
    inferenceFilled: false,
    silentResolutionPerformed: false,
    resolutionTransitionPerformed: false,
    truthClaimed: false,
    evidencePromotionPerformed: false,
    actionCreated: false,
    outcomeCreated: false,
    professionalJudgmentCreated: false,
    authorityReference: UNKNOWN_AUTHORITY,
    rdgAuthorityReference: RDG_UNKNOWN_AUTHORITY,
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, unknownDigest: stableDigest(base) });
}

export function assertRealityUnknownDigest(unknown) {
  if (stableDigest(withoutDigest(unknown, 'unknownDigest')) !== unknown.unknownDigest) {
    throw new TypeError('RMO_UNKNOWN_DIGEST_INVALID');
  }
  return true;
}

export function buildRealityAction(
  reality,
  request,
  actionClassRegistry,
  rdg,
  components,
  evidenceBindings,
  unknowns
) {
  assertCanonicalRealityDigest(reality);
  rmoDataContract(rdg);
  assertAllowedFields(request, new Set([
    'actionCode', 'actionVersion', 'actionClass', 'actionStateSnapshot',
    'actionDefinitionReference', 'actorEntityReference', 'componentReferences',
    'evidenceBindingReferences', 'unknownReferences', 'sourceReferences', 'dataNature',
    'certainty', 'occurredAt', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_ACTION_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_ACTION_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (actionClassRegistry?.actionClasses ?? [])
    .find(entry => entry.actionClass === request.actionClass);
  if (!definition) throw new TypeError('RMO_ACTION_CLASS_UNKNOWN');
  if (!definition.allowedDataNatures.includes(request.dataNature)) {
    throw new TypeError('RMO_ACTION_DATA_NATURE_FORBIDDEN');
  }
  if (!definition.allowedCertainties.includes(request.certainty)) {
    throw new TypeError('RMO_ACTION_CERTAINTY_FORBIDDEN');
  }
  if (!definition.allowedActionStates.includes(request.actionStateSnapshot)) {
    throw new TypeError('RMO_ACTION_STATE_FORBIDDEN');
  }
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_ACTION');
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_ACTION_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_ACTION_COMPONENT_REFERENCE'
  );
  const actorEntityReference = requirePattern(
    request.actorEntityReference,
    ENTITY_PATTERN,
    'RMO_ACTION_ACTOR_ENTITY_REFERENCE_INVALID'
  );
  const actor = buildComponentMap(reality, components, 'RMO_ACTION_ACTOR_ENTITY_REFERENCE')
    .get(actorEntityReference);
  if (!actor || actor.kind !== 'ENTITY') throw new TypeError('RMO_ACTION_ACTOR_ENTITY_REFERENCE_UNKNOWN');
  const evidenceBindingReferences = optionalReferenceArray(
    request.evidenceBindingReferences,
    'RMO_ACTION_EVIDENCE_BINDING_REFERENCES_INVALID'
  );
  const bindingMap = validateEvidenceBindingReferences(
    reality,
    evidenceBindingReferences,
    componentReferences,
    evidenceBindings,
    'RMO_ACTION_EVIDENCE_BINDING_REFERENCE'
  );
  if (definition.evidenceBindingRequired && evidenceBindingReferences.length === 0) {
    throw new TypeError('RMO_ACTION_EVIDENCE_BINDING_REQUIRED');
  }
  const unknownReferences = optionalReferenceArray(
    request.unknownReferences,
    'RMO_ACTION_UNKNOWN_REFERENCES_INVALID'
  );
  const unknownMap = validateUnknownReferences(
    reality,
    unknownReferences,
    componentReferences,
    unknowns,
    'RMO_ACTION_UNKNOWN_REFERENCE'
  );
  if (definition.unknownReferenceRequired && unknownReferences.length === 0) {
    throw new TypeError('RMO_ACTION_UNKNOWN_REFERENCE_REQUIRED');
  }
  let occurredAt = null;
  if (definition.occurredAtMode === 'REQUIRED') {
    occurredAt = requireIso(request.occurredAt, 'RMO_ACTION_OCCURRED_AT_INVALID');
    if (componentReferences.some(reference =>
      Date.parse(occurredAt) <= Date.parse(componentMap.get(reference).createdAt))) {
      throw new TypeError('RMO_ACTION_OCCURRED_AT_BEFORE_COMPONENT');
    }
  } else if (request.occurredAt !== null) {
    throw new TypeError('RMO_ACTION_OCCURRED_AT_FORBIDDEN');
  }
  const sourceReferences = requireReferenceArray(
    request.sourceReferences,
    'RMO_ACTION_SOURCE_REFERENCES_INVALID'
  );
  if (
    definition.evidenceBindingRequired &&
    !evidenceBindingReferences.some(reference =>
      sourceReferences.includes(bindingMap.get(reference).evidenceReference.evidenceCode))
  ) {
    throw new TypeError('RMO_ACTION_SOURCE_EVIDENCE_REFERENCE_REQUIRED');
  }
  const createdAt = requireIso(request.createdAt, 'RMO_ACTION_CREATED_AT_INVALID');
  const dependencies = [
    actor.record,
    ...componentReferences.map(reference => componentMap.get(reference).record),
    ...evidenceBindingReferences.map(reference => bindingMap.get(reference)),
    ...unknownReferences.map(reference => unknownMap.get(reference))
  ];
  if (Date.parse(createdAt) <= latestTime(dependencies)) throw new TypeError('RMO_ACTION_TIME_INVALID');
  if (occurredAt !== null && Date.parse(createdAt) <= Date.parse(occurredAt)) {
    throw new TypeError('RMO_ACTION_RECORDING_TIME_INVALID');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-ACTION-v1.0.0',
    actionCode: requirePattern(request.actionCode, ACTION_PATTERN, 'RMO_ACTION_CODE_INVALID'),
    actionVersion: requirePattern(request.actionVersion, SEMVER_PATTERN, 'RMO_ACTION_VERSION_INVALID'),
    componentType: 'REALITY_ACTION',
    dataType: 'RUNTIME_STATE_RECORD',
    actionClass: request.actionClass,
    actionStateSnapshot: request.actionStateSnapshot,
    actionDefinitionReference: requirePattern(
      request.actionDefinitionReference,
      ACTION_DEFINITION_PATTERN,
      'RMO_ACTION_DEFINITION_REFERENCE_INVALID'
    ),
    realityReference: realityReference(reality),
    actorEntityReference,
    componentReferences,
    evidenceBindingReferences,
    unknownReferences,
    sourceReferences,
    dataNature: request.dataNature,
    certainty: request.certainty,
    occurredAt,
    recordStatus: 'RECORDED',
    navigationPathSelected: false,
    requiredActionCreated: false,
    actionExecutionPerformed: false,
    recommendationCreated: false,
    professionalJudgmentCreated: false,
    outcomePredicted: false,
    evidencePromotionPerformed: false,
    authorityReference: ACTION_AUTHORITY,
    navigationExecutionAuthority: 'JR_RNE_EXISTING_RUNTIME',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, actionDigest: stableDigest(base) });
}

export function assertRealityActionDigest(action) {
  if (stableDigest(withoutDigest(action, 'actionDigest')) !== action.actionDigest) {
    throw new TypeError('RMO_ACTION_DIGEST_INVALID');
  }
  return true;
}

export function buildRealityOutcome(
  reality,
  request,
  outcomeClassRegistry,
  rdg,
  components,
  evidenceBindings,
  unknowns,
  actions
) {
  assertCanonicalRealityDigest(reality);
  rmoDataContract(rdg);
  assertAllowedFields(request, new Set([
    'outcomeCode', 'outcomeVersion', 'outcomeClass', 'actionReference',
    'componentReferences', 'evidenceBindingReferences', 'unknownReferences',
    'sourceReferences', 'dataNature', 'certainty', 'observedAt', 'createdAt',
    'providerUsed', 'aiUsed'
  ]), 'RMO_OUTCOME_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_OUTCOME_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (outcomeClassRegistry?.outcomeClasses ?? [])
    .find(entry => entry.outcomeClass === request.outcomeClass);
  if (!definition) throw new TypeError('RMO_OUTCOME_CLASS_UNKNOWN');
  if (!definition.allowedDataNatures.includes(request.dataNature)) {
    throw new TypeError('RMO_OUTCOME_DATA_NATURE_FORBIDDEN');
  }
  if (!definition.allowedCertainties.includes(request.certainty)) {
    throw new TypeError('RMO_OUTCOME_CERTAINTY_FORBIDDEN');
  }
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_OUTCOME');
  assertAllowedFields(
    request.actionReference,
    new Set(['actionCode', 'actionVersion']),
    'RMO_OUTCOME_ACTION_REFERENCE_FIELD_FORBIDDEN'
  );
  const requestedActionCode = requirePattern(
    request.actionReference.actionCode,
    ACTION_PATTERN,
    'RMO_OUTCOME_ACTION_CODE_INVALID'
  );
  const actionMap = buildActionMap(reality, actions, 'RMO_OUTCOME_ACTION_REFERENCE');
  const action = actionMap.get(requestedActionCode);
  if (!action) throw new TypeError('RMO_OUTCOME_ACTION_REFERENCE_UNKNOWN');
  if (request.actionReference.actionVersion !== action.actionVersion) {
    throw new TypeError('RMO_OUTCOME_ACTION_REFERENCE_VERSION_MISMATCH');
  }
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_OUTCOME_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_OUTCOME_COMPONENT_REFERENCE'
  );
  if (componentReferences.some(reference => !action.componentReferences.includes(reference))) {
    throw new TypeError('RMO_OUTCOME_ACTION_COMPONENT_LINEAGE_INVALID');
  }
  const evidenceBindingReferences = optionalReferenceArray(
    request.evidenceBindingReferences,
    'RMO_OUTCOME_EVIDENCE_BINDING_REFERENCES_INVALID'
  );
  const bindingMap = validateEvidenceBindingReferences(
    reality,
    evidenceBindingReferences,
    componentReferences,
    evidenceBindings,
    'RMO_OUTCOME_EVIDENCE_BINDING_REFERENCE'
  );
  if (definition.evidenceBindingRequired && evidenceBindingReferences.length === 0) {
    throw new TypeError('RMO_OUTCOME_EVIDENCE_BINDING_REQUIRED');
  }
  if (
    evidenceBindingReferences.some(reference => action.evidenceBindingReferences.includes(reference)) ||
    evidenceBindingReferences.some(reference =>
      action.occurredAt === null ||
      Date.parse(bindingMap.get(reference).createdAt) <= Date.parse(action.occurredAt))
  ) {
    throw new TypeError('RMO_OUTCOME_POST_ACTION_EVIDENCE_BINDING_REQUIRED');
  }
  const unknownReferences = optionalReferenceArray(
    request.unknownReferences,
    'RMO_OUTCOME_UNKNOWN_REFERENCES_INVALID'
  );
  const unknownMap = validateUnknownReferences(
    reality,
    unknownReferences,
    componentReferences,
    unknowns,
    'RMO_OUTCOME_UNKNOWN_REFERENCE'
  );
  if (definition.unknownReferenceRequired && unknownReferences.length === 0) {
    throw new TypeError('RMO_OUTCOME_UNKNOWN_REFERENCE_REQUIRED');
  }
  let observedAt = null;
  if (definition.observedAtMode === 'REQUIRED') {
    observedAt = requireIso(request.observedAt, 'RMO_OUTCOME_OBSERVED_AT_INVALID');
    if (action.occurredAt === null || Date.parse(observedAt) <= Date.parse(action.occurredAt)) {
      throw new TypeError('RMO_OUTCOME_OBSERVED_AT_BEFORE_ACTION');
    }
  } else if (request.observedAt !== null) {
    throw new TypeError('RMO_OUTCOME_OBSERVED_AT_FORBIDDEN');
  }
  const sourceReferences = requireReferenceArray(
    request.sourceReferences,
    'RMO_OUTCOME_SOURCE_REFERENCES_INVALID'
  );
  if (
    definition.evidenceBindingRequired &&
    !evidenceBindingReferences.some(reference =>
      sourceReferences.includes(bindingMap.get(reference).evidenceReference.evidenceCode))
  ) {
    throw new TypeError('RMO_OUTCOME_SOURCE_EVIDENCE_REFERENCE_REQUIRED');
  }
  const createdAt = requireIso(request.createdAt, 'RMO_OUTCOME_CREATED_AT_INVALID');
  const dependencies = [
    action,
    ...componentReferences.map(reference => componentMap.get(reference).record),
    ...evidenceBindingReferences.map(reference => bindingMap.get(reference)),
    ...unknownReferences.map(reference => unknownMap.get(reference))
  ];
  if (Date.parse(createdAt) <= latestTime(dependencies)) throw new TypeError('RMO_OUTCOME_TIME_INVALID');
  if (observedAt !== null && Date.parse(createdAt) <= Date.parse(observedAt)) {
    throw new TypeError('RMO_OUTCOME_RECORDING_TIME_INVALID');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-OUTCOME-v1.0.0',
    outcomeCode: requirePattern(request.outcomeCode, OUTCOME_PATTERN, 'RMO_OUTCOME_CODE_INVALID'),
    outcomeVersion: requirePattern(request.outcomeVersion, SEMVER_PATTERN, 'RMO_OUTCOME_VERSION_INVALID'),
    componentType: 'REALITY_OUTCOME',
    dataType: 'RUNTIME_STATE_RECORD',
    outcomeClass: request.outcomeClass,
    realityReference: realityReference(reality),
    actionReference: {
      actionCode: action.actionCode,
      actionVersion: action.actionVersion,
      actionDigest: action.actionDigest
    },
    componentReferences,
    evidenceBindingReferences,
    unknownReferences,
    sourceReferences,
    dataNature: request.dataNature,
    certainty: request.certainty,
    observedAt,
    recordStatus: 'RECORDED',
    causalityClaimed: false,
    successClaimed: false,
    actionEffectivenessDetermined: false,
    actionMutationPerformed: false,
    continuityDecisionCreated: false,
    professionalOutcomeRecordCreated: false,
    professionalJudgmentCreated: false,
    evidencePromotionPerformed: false,
    authorityReference: OUTCOME_AUTHORITY,
    professionalOutcomeAuthorityRuntime: 'PR',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, outcomeDigest: stableDigest(base) });
}

export function assertRealityOutcomeDigest(outcome) {
  if (stableDigest(withoutDigest(outcome, 'outcomeDigest')) !== outcome.outcomeDigest) {
    throw new TypeError('RMO_OUTCOME_DIGEST_INVALID');
  }
  return true;
}

export { stableDigest };
