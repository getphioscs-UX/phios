import {
  assertCanonicalRealityDigest,
  assertRealityEntityDigest,
  assertRealityEventDigest,
  assertRealitySignalDigest,
  stableDigest
} from './rmo-reality-foundation-v1.mjs';

const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const RELATIONSHIP_PATTERN = /^RMO-RELATIONSHIP-[A-Z0-9-]{4,100}$/;
const CONSTRAINT_PATTERN = /^RMO-CONSTRAINT-[A-Z0-9-]{4,100}$/;
const STATE_PATTERN = /^RMO-STATE-[A-Z0-9-]{4,100}$/;
const ENTITY_PATTERN = /^RMO-ENTITY-[A-Z0-9-]{4,100}$/;
const STATE_DEFINITION_PATTERN = /^STATE-DEFINITION-[A-Z0-9-]{4,120}-v[1-9][0-9]*$/;
const STATE_VALUE_PATTERN = /^STATE-VALUE-[A-Z0-9-]{4,120}$/;
const METHOD_REFERENCE_PATTERN = /^RMO-METHOD-[A-Z0-9-]{4,120}-v[1-9][0-9]*$/;
const SCENARIO_REFERENCE_PATTERN = /^RMO-SCENARIO-[A-Z0-9-]{4,120}$/;
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
    throw new TypeError(`${code}_INFERENCE_OR_DERIVATION_FORBIDDEN`);
  }
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

function assertSameReferences(left, right, code) {
  if (stableDigest(sortedUnique(left)) !== stableDigest(sortedUnique(right))) throw new TypeError(code);
}

function validateEntityReference(reality, entityMap, reference, code) {
  const entity = entityMap.get(reference);
  if (!entity) throw new TypeError(`${code}_UNKNOWN:${reference}`);
  assertRealityEntityDigest(entity);
  assertRealityReference(entity, reality, `${code}_REALITY_BINDING_INVALID`);
  return entity;
}

export function buildRealityRelationship(reality, request, relationshipTypeRegistry, rdg, entities) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'relationshipCode', 'relationshipVersion', 'relationshipType', 'sourceEntityReference',
    'targetEntityReference', 'sourceReferences', 'evidenceReferences', 'dataNature', 'certainty',
    'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_RELATIONSHIP_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_RELATIONSHIP_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (relationshipTypeRegistry?.relationshipTypes ?? [])
    .find(entry => entry.relationshipType === request.relationshipType);
  if (!definition) throw new TypeError('RMO_RELATIONSHIP_TYPE_UNKNOWN');
  if (!definition.allowedDataNatures.includes(request.dataNature)) {
    throw new TypeError('RMO_RELATIONSHIP_DATA_NATURE_FORBIDDEN');
  }
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_RELATIONSHIP');
  assertNonInferentialNature(request.dataNature, 'RMO_RELATIONSHIP');
  const sourceEntityReference = requirePattern(
    request.sourceEntityReference,
    ENTITY_PATTERN,
    'RMO_RELATIONSHIP_SOURCE_ENTITY_REFERENCE_INVALID'
  );
  const targetEntityReference = requirePattern(
    request.targetEntityReference,
    ENTITY_PATTERN,
    'RMO_RELATIONSHIP_TARGET_ENTITY_REFERENCE_INVALID'
  );
  if (sourceEntityReference === targetEntityReference && definition.selfRelationshipAllowed !== true) {
    throw new TypeError('RMO_RELATIONSHIP_SELF_REFERENCE_FORBIDDEN');
  }
  const entityMap = new Map((entities ?? []).map(entity => [entity.entityCode, entity]));
  const sourceEntity = validateEntityReference(
    reality,
    entityMap,
    sourceEntityReference,
    'RMO_RELATIONSHIP_SOURCE_ENTITY_REFERENCE'
  );
  const targetEntity = validateEntityReference(
    reality,
    entityMap,
    targetEntityReference,
    'RMO_RELATIONSHIP_TARGET_ENTITY_REFERENCE'
  );
  const createdAt = requireIso(request.createdAt, 'RMO_RELATIONSHIP_CREATED_AT_INVALID');
  if ([sourceEntity, targetEntity].some(entity => Date.parse(createdAt) <= Date.parse(entity.createdAt))) {
    throw new TypeError('RMO_RELATIONSHIP_TIME_INVALID');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-RELATIONSHIP-v1.0.0',
    relationshipCode: requirePattern(
      request.relationshipCode,
      RELATIONSHIP_PATTERN,
      'RMO_RELATIONSHIP_CODE_INVALID'
    ),
    relationshipVersion: requirePattern(
      request.relationshipVersion,
      SEMVER_PATTERN,
      'RMO_RELATIONSHIP_VERSION_INVALID'
    ),
    componentType: 'REALITY_RELATIONSHIP',
    relationshipType: request.relationshipType,
    directionality: definition.directionality,
    realityReference: realityReference(reality),
    sourceEntityReference,
    targetEntityReference,
    sourceReferences: requireReferenceArray(
      request.sourceReferences,
      'RMO_RELATIONSHIP_SOURCE_REFERENCES_INVALID'
    ),
    evidenceReferences: optionalReferenceArray(
      request.evidenceReferences,
      'RMO_RELATIONSHIP_EVIDENCE_REFERENCES_INVALID'
    ),
    dataNature: request.dataNature,
    certainty: request.certainty,
    recordStatus: 'RECORDED',
    evidenceEligibility: 'NOT_EVALUATED',
    interpretationState: 'NOT_INTERPRETED',
    inferenceState: 'NOT_INFERRED',
    professionalJudgmentCreated: false,
    authorityReference: 'content/runtime/reality-model-runtime/contracts/relationship-runtime-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    pwsRegistryWriteAllowed: false,
    operationalLineageWriteAllowed: false,
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, relationshipDigest: stableDigest(base) });
}

export function assertRealityRelationshipDigest(relationship) {
  if (stableDigest(withoutDigest(relationship, 'relationshipDigest')) !== relationship.relationshipDigest) {
    throw new TypeError('RMO_RELATIONSHIP_DIGEST_INVALID');
  }
  return true;
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
      throw new TypeError('RMO_COMPONENT_TYPE_UNSUPPORTED');
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

function validateValidity(validity) {
  assertAllowedFields(
    validity,
    new Set(['mode', 'startsAt', 'endsAt']),
    'RMO_CONSTRAINT_VALIDITY_FIELD_FORBIDDEN'
  );
  if (validity.mode === 'UNBOUNDED') {
    if (validity.startsAt !== null || validity.endsAt !== null) {
      throw new TypeError('RMO_CONSTRAINT_UNBOUNDED_VALIDITY_INVALID');
    }
    return freeze({ mode: 'UNBOUNDED', startsAt: null, endsAt: null });
  }
  if (validity.mode !== 'INTERVAL') throw new TypeError('RMO_CONSTRAINT_VALIDITY_MODE_INVALID');
  const startsAt = requireIso(validity.startsAt, 'RMO_CONSTRAINT_VALIDITY_START_INVALID');
  const endsAt = requireIso(validity.endsAt, 'RMO_CONSTRAINT_VALIDITY_END_INVALID');
  if (Date.parse(startsAt) >= Date.parse(endsAt)) throw new TypeError('RMO_CONSTRAINT_VALIDITY_INTERVAL_INVALID');
  return freeze({ mode: 'INTERVAL', startsAt, endsAt });
}

export function buildRealityConstraint(reality, request, constraintTypeRegistry, rdg, components) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'constraintCode', 'constraintVersion', 'constraintType', 'constraintScope', 'componentReferences',
    'sourceReferences', 'evidenceReferences', 'dataNature', 'certainty', 'validity', 'createdAt',
    'providerUsed', 'aiUsed'
  ]), 'RMO_CONSTRAINT_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_CONSTRAINT_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (constraintTypeRegistry?.constraintTypes ?? [])
    .find(entry => entry.constraintType === request.constraintType);
  if (!definition) throw new TypeError('RMO_CONSTRAINT_TYPE_UNKNOWN');
  if (!definition.allowedScopes.includes(request.constraintScope)) {
    throw new TypeError('RMO_CONSTRAINT_SCOPE_FORBIDDEN');
  }
  if (!definition.allowedDataNatures.includes(request.dataNature)) {
    throw new TypeError('RMO_CONSTRAINT_DATA_NATURE_FORBIDDEN');
  }
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_CONSTRAINT');
  assertNonInferentialNature(request.dataNature, 'RMO_CONSTRAINT');
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_CONSTRAINT_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_CONSTRAINT_COMPONENT_REFERENCE'
  );
  if (!componentReferences.some(reference => componentMap.get(reference).kind === request.constraintScope)) {
    throw new TypeError('RMO_CONSTRAINT_SCOPE_BINDING_MISSING');
  }
  const createdAt = requireIso(request.createdAt, 'RMO_CONSTRAINT_CREATED_AT_INVALID');
  if (componentReferences.some(reference =>
    Date.parse(createdAt) <= Date.parse(componentMap.get(reference).createdAt))) {
    throw new TypeError('RMO_CONSTRAINT_TIME_INVALID');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-CONSTRAINT-v1.0.0',
    constraintCode: requirePattern(
      request.constraintCode,
      CONSTRAINT_PATTERN,
      'RMO_CONSTRAINT_CODE_INVALID'
    ),
    constraintVersion: requirePattern(
      request.constraintVersion,
      SEMVER_PATTERN,
      'RMO_CONSTRAINT_VERSION_INVALID'
    ),
    componentType: 'REALITY_CONSTRAINT',
    constraintType: request.constraintType,
    constraintScope: request.constraintScope,
    constraintMode: 'DESCRIPTIVE_ONLY',
    realityReference: realityReference(reality),
    componentReferences,
    sourceReferences: requireReferenceArray(
      request.sourceReferences,
      'RMO_CONSTRAINT_SOURCE_REFERENCES_INVALID'
    ),
    evidenceReferences: optionalReferenceArray(
      request.evidenceReferences,
      'RMO_CONSTRAINT_EVIDENCE_REFERENCES_INVALID'
    ),
    dataNature: request.dataNature,
    certainty: request.certainty,
    validity: validateValidity(request.validity),
    recordStatus: 'RECORDED',
    enforcementState: 'NOT_ENFORCED',
    evidenceEligibility: 'NOT_EVALUATED',
    interpretationState: 'NOT_INTERPRETED',
    inferenceState: 'NOT_INFERRED',
    navigationRestrictionCreated: false,
    professionalJudgmentCreated: false,
    authorityReference: 'content/runtime/reality-model-runtime/contracts/constraint-runtime-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, constraintDigest: stableDigest(base) });
}

export function assertRealityConstraintDigest(constraint) {
  if (stableDigest(withoutDigest(constraint, 'constraintDigest')) !== constraint.constraintDigest) {
    throw new TypeError('RMO_CONSTRAINT_DIGEST_INVALID');
  }
  return true;
}

function validateObservationBinding(binding, createdAt) {
  assertAllowedFields(
    binding,
    new Set(['mode', 'observedAt', 'derivation', 'projection']),
    'RMO_STATE_BINDING_FIELD_FORBIDDEN'
  );
  if (binding.mode !== 'OBSERVATION' || binding.derivation !== null || binding.projection !== null) {
    throw new TypeError('RMO_STATE_OBSERVATION_BINDING_INVALID');
  }
  const observedAt = requireIso(binding.observedAt, 'RMO_STATE_OBSERVED_AT_INVALID');
  if (Date.parse(observedAt) > Date.parse(createdAt)) throw new TypeError('RMO_STATE_OBSERVATION_TIME_INVALID');
  return freeze({ mode: 'OBSERVATION', observedAt, derivation: null, projection: null });
}

function validateDerivationBinding(binding, componentReferences) {
  assertAllowedFields(
    binding,
    new Set(['mode', 'observedAt', 'derivation', 'projection']),
    'RMO_STATE_BINDING_FIELD_FORBIDDEN'
  );
  if (binding.mode !== 'DERIVATION' || binding.observedAt !== null || binding.projection !== null) {
    throw new TypeError('RMO_STATE_DERIVATION_BINDING_INVALID');
  }
  assertAllowedFields(
    binding.derivation,
    new Set(['methodReference', 'methodVersion', 'inputReferences', 'deterministic']),
    'RMO_STATE_DERIVATION_FIELD_FORBIDDEN'
  );
  if (binding.derivation.deterministic !== true) throw new TypeError('RMO_STATE_DERIVATION_NOT_DETERMINISTIC');
  const inputReferences = requireReferenceArray(
    binding.derivation.inputReferences,
    'RMO_STATE_DERIVATION_INPUT_REFERENCES_INVALID'
  );
  assertSameReferences(
    inputReferences,
    componentReferences,
    'RMO_STATE_DERIVATION_INPUT_LINEAGE_INCOMPLETE'
  );
  return freeze({
    mode: 'DERIVATION',
    observedAt: null,
    derivation: {
      methodReference: requirePattern(
        binding.derivation.methodReference,
        METHOD_REFERENCE_PATTERN,
        'RMO_STATE_DERIVATION_METHOD_REFERENCE_REQUIRED'
      ),
      methodVersion: requirePattern(
        binding.derivation.methodVersion,
        SEMVER_PATTERN,
        'RMO_STATE_DERIVATION_METHOD_VERSION_INVALID'
      ),
      inputReferences,
      deterministic: true
    },
    projection: null
  });
}

function validateProjectionBinding(binding, componentReferences, componentMap, createdAt) {
  assertAllowedFields(
    binding,
    new Set(['mode', 'observedAt', 'derivation', 'projection']),
    'RMO_STATE_BINDING_FIELD_FORBIDDEN'
  );
  if (binding.mode !== 'PROJECTION' || binding.observedAt !== null || binding.derivation !== null) {
    throw new TypeError('RMO_STATE_PROJECTION_BINDING_INVALID');
  }
  assertAllowedFields(
    binding.projection,
    new Set([
      'methodReference', 'methodVersion', 'basisReferences', 'scenarioReference',
      'generatedAt', 'horizon', 'deterministic'
    ]),
    'RMO_STATE_PROJECTION_FIELD_FORBIDDEN'
  );
  if (binding.projection.deterministic !== true) throw new TypeError('RMO_STATE_PROJECTION_NOT_DETERMINISTIC');
  const basisReferences = requireReferenceArray(
    binding.projection.basisReferences,
    'RMO_STATE_PROJECTION_BASIS_REFERENCES_INVALID'
  );
  assertSameReferences(
    basisReferences,
    componentReferences,
    'RMO_STATE_PROJECTION_BASIS_LINEAGE_INCOMPLETE'
  );
  if (basisReferences.some(reference => componentMap.get(reference)?.record?.stateClass === 'PROJECTED')) {
    throw new TypeError('RMO_STATE_PROJECTED_BASIS_RECURSION_FORBIDDEN');
  }
  const generatedAt = requireIso(binding.projection.generatedAt, 'RMO_STATE_PROJECTION_GENERATED_AT_INVALID');
  if (Date.parse(generatedAt) > Date.parse(createdAt)) throw new TypeError('RMO_STATE_PROJECTION_GENERATED_TIME_INVALID');
  assertAllowedFields(
    binding.projection.horizon,
    new Set(['startsAt', 'endsAt']),
    'RMO_STATE_PROJECTION_HORIZON_FIELD_FORBIDDEN'
  );
  const startsAt = requireIso(
    binding.projection.horizon.startsAt,
    'RMO_STATE_PROJECTION_HORIZON_START_INVALID'
  );
  const endsAt = requireIso(
    binding.projection.horizon.endsAt,
    'RMO_STATE_PROJECTION_HORIZON_END_INVALID'
  );
  if (Date.parse(startsAt) <= Date.parse(generatedAt) || Date.parse(startsAt) >= Date.parse(endsAt)) {
    throw new TypeError('RMO_STATE_PROJECTION_HORIZON_INVALID');
  }
  return freeze({
    mode: 'PROJECTION',
    observedAt: null,
    derivation: null,
    projection: {
      methodReference: requirePattern(
        binding.projection.methodReference,
        METHOD_REFERENCE_PATTERN,
        'RMO_STATE_PROJECTION_METHOD_REFERENCE_REQUIRED'
      ),
      methodVersion: requirePattern(
        binding.projection.methodVersion,
        SEMVER_PATTERN,
        'RMO_STATE_PROJECTION_METHOD_VERSION_INVALID'
      ),
      basisReferences,
      scenarioReference: requirePattern(
        binding.projection.scenarioReference,
        SCENARIO_REFERENCE_PATTERN,
        'RMO_STATE_PROJECTION_SCENARIO_REFERENCE_REQUIRED'
      ),
      generatedAt,
      horizon: { startsAt, endsAt },
      deterministic: true
    }
  });
}

export function buildRealityState(reality, request, stateClassRegistry, rdg, components) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'stateCode', 'stateVersion', 'stateClass', 'stateDefinitionReference', 'stateValueReference',
    'componentReferences', 'sourceReferences', 'evidenceReferences', 'dataNature', 'certainty',
    'binding', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_STATE_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_STATE_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (stateClassRegistry?.stateClasses ?? [])
    .find(entry => entry.stateClass === request.stateClass);
  if (!definition) throw new TypeError('RMO_STATE_CLASS_UNKNOWN');
  if (!definition.allowedDataNatures.includes(request.dataNature)) {
    throw new TypeError('RMO_STATE_DATA_NATURE_FORBIDDEN');
  }
  assertKnownNatureAndCertainty(request.dataNature, request.certainty, rdg, 'RMO_STATE');
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_STATE_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_STATE_COMPONENT_REFERENCE'
  );
  const createdAt = requireIso(request.createdAt, 'RMO_STATE_CREATED_AT_INVALID');
  if (componentReferences.some(reference =>
    Date.parse(createdAt) <= Date.parse(componentMap.get(reference).createdAt))) {
    throw new TypeError('RMO_STATE_TIME_INVALID');
  }
  let binding;
  if (request.stateClass === 'OBSERVED') {
    if (request.binding?.mode !== definition.bindingMode) throw new TypeError('RMO_STATE_CLASS_BINDING_MISMATCH');
    binding = validateObservationBinding(request.binding, createdAt);
  } else if (request.stateClass === 'DERIVED') {
    if (request.binding?.mode !== definition.bindingMode) throw new TypeError('RMO_STATE_CLASS_BINDING_MISMATCH');
    binding = validateDerivationBinding(request.binding, componentReferences);
  } else {
    if (request.binding?.mode !== definition.bindingMode) throw new TypeError('RMO_STATE_CLASS_BINDING_MISMATCH');
    binding = validateProjectionBinding(
      request.binding,
      componentReferences,
      componentMap,
      createdAt
    );
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-STATE-v1.0.0',
    stateCode: requirePattern(request.stateCode, STATE_PATTERN, 'RMO_STATE_CODE_INVALID'),
    stateVersion: requirePattern(request.stateVersion, SEMVER_PATTERN, 'RMO_STATE_VERSION_INVALID'),
    componentType: 'REALITY_STATE',
    stateClass: request.stateClass,
    stateDefinitionReference: requirePattern(
      request.stateDefinitionReference,
      STATE_DEFINITION_PATTERN,
      'RMO_STATE_DEFINITION_REFERENCE_REQUIRED'
    ),
    stateValueReference: requirePattern(
      request.stateValueReference,
      STATE_VALUE_PATTERN,
      'RMO_STATE_VALUE_REFERENCE_REQUIRED'
    ),
    realityReference: realityReference(reality),
    componentReferences,
    sourceReferences: requireReferenceArray(
      request.sourceReferences,
      'RMO_STATE_SOURCE_REFERENCES_INVALID'
    ),
    evidenceReferences: optionalReferenceArray(
      request.evidenceReferences,
      'RMO_STATE_EVIDENCE_REFERENCES_INVALID'
    ),
    dataNature: request.dataNature,
    certainty: request.certainty,
    binding,
    recordStatus: 'RECORDED',
    evidenceEligibility: 'NOT_EVALUATED',
    interpretationState: 'NOT_INTERPRETED',
    inferenceState: 'NOT_INFERRED',
    truthClaimed: false,
    predictionClaimed: false,
    professionalJudgmentCreated: false,
    navigationChoiceCreated: false,
    actionExecutionCreated: false,
    authorityReference: 'content/runtime/reality-model-runtime/contracts/reality-state-runtime-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, stateDigest: stableDigest(base) });
}

export function assertRealityStateDigest(state) {
  if (stableDigest(withoutDigest(state, 'stateDigest')) !== state.stateDigest) {
    throw new TypeError('RMO_STATE_DIGEST_INVALID');
  }
  return true;
}

export { stableDigest };
