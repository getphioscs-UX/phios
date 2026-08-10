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
  evaluateEvidenceEligibility,
  evaluateSensitiveInference
} from '../reality-data-governance/rdg-evidence-inference-v1.mjs';

const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const BINDING_PATTERN = /^RMO-EVIDENCE-BINDING-[A-Z0-9-]{4,100}$/;
const BOUNDARY_PATTERN = /^RMO-REASONING-BOUNDARY-[A-Z0-9-]{4,100}$/;
const EVIDENCE_PATTERN = /^RRE-EVIDENCE-[A-Z0-9-]{4,100}$/;
const INFERENCE_METHOD_PATTERN = /^RMO-INFERENCE-METHOD-[A-Z0-9-]{4,120}-v[1-9][0-9]*$/;
const BOUNDARY_STATEMENT_PATTERN = /^RMO-BOUNDARY-STATEMENT-[A-Z0-9-]{4,140}$/;
const EVIDENCE_BINDING_AUTHORITY =
  'content/runtime/reality-model-runtime/contracts/evidence-binding-runtime-contract-v1.json';
const REASONING_BOUNDARY_AUTHORITY =
  'content/runtime/reality-model-runtime/contracts/interpretation-inference-boundary-contract-v1.json';
const EVIDENCE_ELIGIBILITY_AUTHORITY =
  'content/governance/reality-data-governance/contracts/evidence-eligibility-contract-v1.json';
const EVIDENCE_PROMOTION_AUTHORITY =
  'content/governance/reality-data-governance/contracts/evidence-promotion-runtime-v1.json';
const SENSITIVITY_ORDER = [
  'PUBLIC',
  'INTERNAL',
  'PERSONAL',
  'SENSITIVE',
  'HIGHLY_SENSITIVE',
  'RESTRICTED_PROFESSIONAL',
  'SYSTEM_SECRET'
];

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

function assertSameReferences(left, right, code) {
  if (stableDigest(sortedUnique(left)) !== stableDigest(sortedUnique(right))) throw new TypeError(code);
}

function componentDescriptor(component) {
  switch (component?.componentType) {
    case 'REALITY_ENTITY':
      return { code: component.entityCode, assertDigest: assertRealityEntityDigest };
    case 'REALITY_EVENT':
      return { code: component.eventCode, assertDigest: assertRealityEventDigest };
    case 'REALITY_SIGNAL':
      return { code: component.signalCode, assertDigest: assertRealitySignalDigest };
    case 'REALITY_RELATIONSHIP':
      return { code: component.relationshipCode, assertDigest: assertRealityRelationshipDigest };
    case 'REALITY_CONSTRAINT':
      return { code: component.constraintCode, assertDigest: assertRealityConstraintDigest };
    case 'REALITY_STATE':
      return { code: component.stateCode, assertDigest: assertRealityStateDigest };
    default:
      throw new TypeError('RMO_EVIDENCE_REASONING_COMPONENT_TYPE_UNSUPPORTED');
  }
}

function buildComponentMap(reality, components, code) {
  const map = new Map([
    [reality.realityCode, { record: reality, createdAt: reality.updatedAt }]
  ]);
  for (const component of components ?? []) {
    const descriptor = componentDescriptor(component);
    if (map.has(descriptor.code)) throw new TypeError(`${code}_DUPLICATE:${descriptor.code}`);
    descriptor.assertDigest(component);
    assertRealityReference(component, reality, `${code}_REALITY_BINDING_INVALID:${descriptor.code}`);
    map.set(descriptor.code, { record: component, createdAt: component.createdAt });
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

function registryValues(registry, field, code) {
  const values = registry?.[field];
  if (!Array.isArray(values) || values.length === 0) throw new TypeError(code);
  return new Set(values);
}

function rmoDataContract(rdg) {
  const contract = (rdg?.dataContracts?.entries ?? []).find(entry => entry.runtimeCode === 'RMO');
  if (!contract) throw new TypeError('RMO_RDG_DATA_CONTRACT_MISSING');
  if (contract.permissions?.evidencePromotion !== 'DENY') {
    throw new TypeError('RMO_RDG_EVIDENCE_PROMOTION_BOUNDARY_INVALID');
  }
  return contract;
}

function assertKnownPurposes(purposeCodes, rdg, code) {
  const known = registryValues(rdg?.purposes, 'purposeCodes', 'RMO_RDG_PURPOSE_REGISTRY_INVALID');
  for (const purposeCode of purposeCodes) {
    if (!known.has(purposeCode)) throw new TypeError(`${code}_UNKNOWN:${purposeCode}`);
  }
}

function assertKnownSensitivity(sensitivityClass, sensitivityCategory, rdg, code) {
  const classes = registryValues(rdg?.sensitivity, 'classes', 'RMO_RDG_SENSITIVITY_REGISTRY_INVALID');
  if (!classes.has(sensitivityClass)) throw new TypeError(`${code}_CLASS_UNKNOWN`);
  if (sensitivityCategory !== undefined) {
    const categories = registryValues(
      rdg?.sensitivity,
      'categories',
      'RMO_RDG_SENSITIVITY_CATEGORY_REGISTRY_INVALID'
    );
    if (!categories.has(sensitivityCategory)) throw new TypeError(`${code}_CATEGORY_UNKNOWN`);
  }
}

function assertWithinRmoSensitivityCeiling(sensitivityClass, contract, code) {
  const actual = SENSITIVITY_ORDER.indexOf(sensitivityClass);
  const ceiling = SENSITIVITY_ORDER.indexOf(contract.sensitivityCeiling);
  if (actual < 0 || ceiling < 0 || actual > ceiling) throw new TypeError(code);
}

function assertKnownNatureAndCertainty(dataNature, certainty, rdg, code) {
  const natures = registryValues(rdg?.natures, 'natures', 'RMO_RDG_NATURE_REGISTRY_INVALID');
  const certainties = registryValues(
    rdg?.certainties,
    'certaintyValues',
    'RMO_RDG_CERTAINTY_REGISTRY_INVALID'
  );
  if (!natures.has(dataNature)) throw new TypeError(`${code}_DATA_NATURE_INVALID`);
  if (!certainties.has(certainty)) throw new TypeError(`${code}_CERTAINTY_INVALID`);
}

function assertEvidenceAuthorityRecord(record, reality, rdg) {
  assertAllowedFields(record, new Set([
    'schemaVersion', 'evidenceCode', 'evidenceVersion', 'dataType', 'producingRuntime',
    'subjectReference', 'dataNature', 'certainty', 'sourceReference', 'sourceType',
    'lineageReferences', 'purposeCodes', 'sensitivityClass', 'evidenceState',
    'eligibilityDecision', 'eligibilityAuthorityReference', 'promotionAuthorityReference',
    'promotionAuthorityRuntime', 'acceptedAt', 'evidenceDigest'
  ]), 'RMO_EVIDENCE_AUTHORITY_RECORD_FIELD_FORBIDDEN');
  if (record.schemaVersion !== 'PHI-OS-RRE-EVIDENCE-AUTHORITY-SNAPSHOT-v1.0.0') {
    throw new TypeError('RMO_EVIDENCE_AUTHORITY_SCHEMA_INVALID');
  }
  requirePattern(record.evidenceCode, EVIDENCE_PATTERN, 'RMO_EVIDENCE_CODE_INVALID');
  requirePattern(record.evidenceVersion, SEMVER_PATTERN, 'RMO_EVIDENCE_VERSION_INVALID');
  if (record.dataType !== 'REALITY_EVIDENCE_RECORD' || record.producingRuntime !== 'RRE') {
    throw new TypeError('RMO_EVIDENCE_RRE_AUTHORITY_REQUIRED');
  }
  if (record.subjectReference !== reality.subjectReference) {
    throw new TypeError('RMO_EVIDENCE_SUBJECT_BINDING_INVALID');
  }
  assertKnownNatureAndCertainty(record.dataNature, record.certainty, rdg, 'RMO_EVIDENCE');
  const lineageReferences = requireReferenceArray(
    record.lineageReferences,
    'RMO_EVIDENCE_LINEAGE_REFERENCES_INVALID'
  );
  const purposeCodes = requireReferenceArray(record.purposeCodes, 'RMO_EVIDENCE_PURPOSE_CODES_INVALID');
  assertKnownPurposes(purposeCodes, rdg, 'RMO_EVIDENCE_PURPOSE');
  assertKnownSensitivity(record.sensitivityClass, undefined, rdg, 'RMO_EVIDENCE_SENSITIVITY');
  if (record.evidenceState !== 'ACCEPTED_EVIDENCE') {
    throw new TypeError('RMO_EVIDENCE_ACCEPTED_STATE_REQUIRED');
  }
  if (record.eligibilityDecision !== 'ELIGIBLE') {
    throw new TypeError('RMO_EVIDENCE_ELIGIBILITY_REQUIRED');
  }
  if (record.eligibilityAuthorityReference !== EVIDENCE_ELIGIBILITY_AUTHORITY) {
    throw new TypeError('RMO_EVIDENCE_ELIGIBILITY_AUTHORITY_INVALID');
  }
  if (
    record.promotionAuthorityReference !== EVIDENCE_PROMOTION_AUTHORITY ||
    record.promotionAuthorityRuntime !== 'RRE'
  ) {
    throw new TypeError('RMO_EVIDENCE_PROMOTION_AUTHORITY_INVALID');
  }
  requireText(record.sourceReference, 'RMO_EVIDENCE_SOURCE_REFERENCE_INVALID');
  requireText(record.sourceType, 'RMO_EVIDENCE_SOURCE_TYPE_INVALID');
  requireIso(record.acceptedAt, 'RMO_EVIDENCE_ACCEPTED_AT_INVALID');
  if (evaluateEvidenceEligibility({ ...record, dataReference: record.evidenceCode }) !== 'ELIGIBLE') {
    throw new TypeError('RMO_EVIDENCE_RDG_ELIGIBILITY_RECONCILIATION_FAILED');
  }
  if (stableDigest(withoutDigest(record, 'evidenceDigest')) !== record.evidenceDigest) {
    throw new TypeError('RMO_EVIDENCE_DIGEST_INVALID');
  }
  return { lineageReferences, purposeCodes };
}

function evidenceReference(record) {
  return freeze({
    evidenceCode: record.evidenceCode,
    evidenceVersion: record.evidenceVersion,
    evidenceDigest: record.evidenceDigest,
    producingRuntime: record.producingRuntime,
    dataType: record.dataType
  });
}

export function buildRealityEvidenceBinding(
  reality,
  request,
  bindingRoleRegistry,
  rdg,
  components,
  evidenceRecords
) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'bindingCode', 'bindingVersion', 'bindingRole', 'componentReferences', 'evidenceReference',
    'purposeCodes', 'sourceReferences', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_EVIDENCE_BINDING_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_EVIDENCE_BINDING_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const role = (bindingRoleRegistry?.bindingRoles ?? [])
    .find(entry => entry.bindingRole === request.bindingRole);
  if (!role) throw new TypeError('RMO_EVIDENCE_BINDING_ROLE_UNKNOWN');
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_EVIDENCE_BINDING_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_EVIDENCE_BINDING_COMPONENT_REFERENCE'
  );
  assertAllowedFields(request.evidenceReference, new Set([
    'evidenceCode', 'evidenceVersion', 'evidenceDigest'
  ]), 'RMO_EVIDENCE_BINDING_EVIDENCE_REFERENCE_FIELD_FORBIDDEN');
  const requestedEvidenceCode = requirePattern(
    request.evidenceReference.evidenceCode,
    EVIDENCE_PATTERN,
    'RMO_EVIDENCE_BINDING_EVIDENCE_CODE_INVALID'
  );
  const matchingRecords = (evidenceRecords ?? [])
    .filter(candidate => candidate.evidenceCode === requestedEvidenceCode);
  if (matchingRecords.length > 1) {
    throw new TypeError('RMO_EVIDENCE_BINDING_EVIDENCE_IDENTITY_AMBIGUOUS');
  }
  const [record] = matchingRecords;
  if (!record) throw new TypeError('RMO_EVIDENCE_BINDING_EVIDENCE_UNKNOWN');
  assertEvidenceAuthorityRecord(record, reality, rdg);
  if (
    request.evidenceReference.evidenceVersion !== record.evidenceVersion ||
    request.evidenceReference.evidenceDigest !== record.evidenceDigest
  ) {
    throw new TypeError('RMO_EVIDENCE_BINDING_EVIDENCE_REFERENCE_MISMATCH');
  }
  const purposeCodes = requireReferenceArray(
    request.purposeCodes,
    'RMO_EVIDENCE_BINDING_PURPOSE_CODES_INVALID'
  );
  assertKnownPurposes(purposeCodes, rdg, 'RMO_EVIDENCE_BINDING_PURPOSE');
  const contract = rmoDataContract(rdg);
  if (purposeCodes.some(code => !contract.allowedPurposes.includes(code))) {
    throw new TypeError('RMO_EVIDENCE_BINDING_PURPOSE_NOT_ALLOWED');
  }
  if (purposeCodes.some(code => !record.purposeCodes.includes(code))) {
    throw new TypeError('RMO_EVIDENCE_BINDING_PURPOSE_NOT_BOUND_TO_EVIDENCE');
  }
  assertWithinRmoSensitivityCeiling(
    record.sensitivityClass,
    contract,
    'RMO_EVIDENCE_BINDING_SENSITIVITY_CEILING_EXCEEDED'
  );
  const createdAt = requireIso(request.createdAt, 'RMO_EVIDENCE_BINDING_CREATED_AT_INVALID');
  if (
    Date.parse(createdAt) <= Date.parse(record.acceptedAt) ||
    componentReferences.some(reference =>
      Date.parse(createdAt) <= Date.parse(componentMap.get(reference).createdAt))
  ) {
    throw new TypeError('RMO_EVIDENCE_BINDING_TIME_INVALID');
  }
  const sourceReferences = requireReferenceArray(
    request.sourceReferences,
    'RMO_EVIDENCE_BINDING_SOURCE_REFERENCES_INVALID'
  );
  if (!sourceReferences.includes(record.evidenceCode)) {
    throw new TypeError('RMO_EVIDENCE_BINDING_SOURCE_EVIDENCE_REFERENCE_REQUIRED');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-EVIDENCE-BINDING-v1.0.0',
    bindingCode: requirePattern(request.bindingCode, BINDING_PATTERN, 'RMO_EVIDENCE_BINDING_CODE_INVALID'),
    bindingVersion: requirePattern(
      request.bindingVersion,
      SEMVER_PATTERN,
      'RMO_EVIDENCE_BINDING_VERSION_INVALID'
    ),
    componentType: 'REALITY_EVIDENCE_BINDING',
    bindingRole: request.bindingRole,
    realityReference: realityReference(reality),
    componentReferences,
    evidenceReference: evidenceReference(record),
    dataNatureSnapshot: record.dataNature,
    certaintySnapshot: record.certainty,
    evidenceStateSnapshot: record.evidenceState,
    eligibilityDecisionSnapshot: record.eligibilityDecision,
    purposeCodes,
    sensitivityClass: record.sensitivityClass,
    sourceReferences,
    bindingState: 'BOUND',
    evidencePayloadStored: false,
    evidencePromotionPerformed: false,
    truthClaimed: false,
    interpretationCreated: false,
    inferenceCreated: false,
    professionalJudgmentCreated: false,
    authorityReference: EVIDENCE_BINDING_AUTHORITY,
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, evidenceBindingDigest: stableDigest(base) });
}

export function assertRealityEvidenceBindingDigest(binding) {
  if (stableDigest(withoutDigest(binding, 'evidenceBindingDigest')) !== binding.evidenceBindingDigest) {
    throw new TypeError('RMO_EVIDENCE_BINDING_DIGEST_INVALID');
  }
  return true;
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

function normalizeReasoning(request, definition, componentReferences, evidenceBindingReferences, registry) {
  assertAllowedFields(request.reasoning, new Set([
    'mode', 'inference', 'interpretation', 'professionalJudgment'
  ]), 'RMO_REASONING_FIELD_FORBIDDEN');
  if (request.reasoning.mode !== definition.mode) throw new TypeError('RMO_REASONING_MODE_MISMATCH');
  if (definition.mode === 'INFERENCE') {
    if (request.reasoning.interpretation !== null || request.reasoning.professionalJudgment !== null) {
      throw new TypeError('RMO_REASONING_INFERENCE_EXCLUSIVITY_INVALID');
    }
    assertAllowedFields(request.reasoning.inference, new Set([
      'methodReference', 'methodVersion', 'inputReferences', 'uncertainty'
    ]), 'RMO_REASONING_INFERENCE_FIELD_FORBIDDEN');
    const inputReferences = requireReferenceArray(
      request.reasoning.inference.inputReferences,
      'RMO_REASONING_INFERENCE_INPUT_REFERENCES_INVALID'
    );
    assertSameReferences(
      inputReferences,
      [...componentReferences, ...evidenceBindingReferences],
      'RMO_REASONING_INFERENCE_EXACT_INPUT_LINEAGE_REQUIRED'
    );
    if (!(registry?.uncertaintyStates ?? []).includes(request.reasoning.inference.uncertainty)) {
      throw new TypeError('RMO_REASONING_INFERENCE_UNCERTAINTY_UNKNOWN');
    }
    return freeze({
      mode: 'INFERENCE',
      inference: {
        methodReference: requirePattern(
          request.reasoning.inference.methodReference,
          INFERENCE_METHOD_PATTERN,
          'RMO_REASONING_INFERENCE_METHOD_REFERENCE_INVALID'
        ),
        methodVersion: requirePattern(
          request.reasoning.inference.methodVersion,
          SEMVER_PATTERN,
          'RMO_REASONING_INFERENCE_METHOD_VERSION_INVALID'
        ),
        inputReferences,
        uncertainty: request.reasoning.inference.uncertainty
      },
      interpretation: null,
      professionalJudgment: null
    });
  }
  if (definition.mode === 'INTERPRETATION') {
    if (request.reasoning.inference !== null || request.reasoning.professionalJudgment !== null) {
      throw new TypeError('RMO_REASONING_INTERPRETATION_EXCLUSIVITY_INVALID');
    }
    assertAllowedFields(request.reasoning.interpretation, new Set([
      'interpretationAuthorityRuntime', 'interpretationAuthorityReference', 'boundaryStatementReference'
    ]), 'RMO_REASONING_INTERPRETATION_FIELD_FORBIDDEN');
    if (
      request.reasoning.interpretation.interpretationAuthorityRuntime !== 'RMO' ||
      request.reasoning.interpretation.interpretationAuthorityReference !== REASONING_BOUNDARY_AUTHORITY
    ) {
      throw new TypeError('RMO_REASONING_INTERPRETATION_AUTHORITY_INVALID');
    }
    return freeze({
      mode: 'INTERPRETATION',
      inference: null,
      interpretation: {
        interpretationAuthorityRuntime: 'RMO',
        interpretationAuthorityReference: REASONING_BOUNDARY_AUTHORITY,
        boundaryStatementReference: requirePattern(
          request.reasoning.interpretation.boundaryStatementReference,
          BOUNDARY_STATEMENT_PATTERN,
          'RMO_REASONING_INTERPRETATION_BOUNDARY_STATEMENT_INVALID'
        )
      },
      professionalJudgment: null
    });
  }
  if (request.reasoning.inference !== null || request.reasoning.interpretation !== null) {
    throw new TypeError('RMO_REASONING_PROFESSIONAL_JUDGMENT_EXCLUSIVITY_INVALID');
  }
  assertAllowedFields(
    request.reasoning.professionalJudgment,
    new Set(['requiredAuthorityRuntime']),
    'RMO_REASONING_PROFESSIONAL_JUDGMENT_FIELD_FORBIDDEN'
  );
  if (request.reasoning.professionalJudgment.requiredAuthorityRuntime !== 'PR') {
    throw new TypeError('RMO_REASONING_PROFESSIONAL_JUDGMENT_PR_REQUIRED');
  }
  return freeze({
    mode: 'PROFESSIONAL_JUDGMENT',
    inference: null,
    interpretation: null,
    professionalJudgment: { requiredAuthorityRuntime: 'PR' }
  });
}

function evaluateBoundaryDecision({
  requestedDataNature,
  sourceState,
  evidenceBindingReferences,
  reasoning,
  purposeAllowed,
  firewallDecision
}) {
  const reasons = [];
  let decision = 'ALLOW_BOUNDED';
  if (requestedDataNature === 'PROFESSIONAL_JUDGMENT') {
    decision = 'REQUIRE_PROFESSIONAL_AUTHORITY';
    reasons.push('PROFESSIONAL_JUDGMENT_ROUTES_TO_PR');
  } else if (sourceState === 'UNKNOWN' || sourceState === 'UNRESOLVED') {
    decision = 'UNRESOLVED';
    reasons.push('UNKNOWN_OR_UNRESOLVED_STATE_PRESERVED');
  } else if (purposeAllowed !== true) {
    decision = firewallDecision === 'DENY' ? 'DENY' : 'UNRESOLVED';
    reasons.push('PURPOSE_NOT_ALLOWED_FOR_RMO');
  } else if (firewallDecision !== 'ALLOW_PURPOSE_BOUND') {
    decision = firewallDecision;
    reasons.push(`RDG_FIREWALL_${firewallDecision}`);
  } else if (evidenceBindingReferences.length === 0) {
    decision = 'REQUIRE_CORROBORATION';
    reasons.push('EVIDENCE_BINDING_REQUIRED');
  } else if (sourceState === 'DISPUTED') {
    decision = 'REQUIRE_CORROBORATION';
    reasons.push('DISPUTED_STATE_REQUIRES_CORROBORATION');
  } else if (reasoning.mode === 'INFERENCE' && reasoning.inference.uncertainty === 'MATERIAL') {
    decision = 'REQUIRE_CORROBORATION';
    reasons.push('MATERIAL_UNCERTAINTY_REQUIRES_CORROBORATION');
  } else if (
    reasoning.mode === 'INFERENCE' &&
    ['UNKNOWN', 'UNRESOLVED'].includes(reasoning.inference.uncertainty)
  ) {
    decision = 'UNRESOLVED';
    reasons.push('INFERENCE_UNCERTAINTY_UNRESOLVED');
  } else {
    reasons.push('BOUNDARY_REQUIREMENTS_SATISFIED');
  }
  return { decision, reasons: sortedUnique(reasons) };
}

export function buildRealityReasoningBoundary(
  reality,
  request,
  boundaryRegistry,
  rdg,
  components,
  evidenceBindings
) {
  assertCanonicalRealityDigest(reality);
  assertAllowedFields(request, new Set([
    'boundaryCode', 'boundaryVersion', 'requestedDataNature', 'requestedCertainty', 'sourceState',
    'componentReferences', 'evidenceBindingReferences', 'reasoning', 'governanceContext',
    'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_REASONING_BOUNDARY_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_REASONING_BOUNDARY_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const definition = (boundaryRegistry?.reasoningClasses ?? [])
    .find(entry => entry.requestedDataNature === request.requestedDataNature);
  if (!definition) throw new TypeError('RMO_REASONING_BOUNDARY_CLASS_UNKNOWN');
  if (request.requestedCertainty !== definition.expectedCertainty) {
    throw new TypeError('RMO_REASONING_BOUNDARY_CERTAINTY_MISMATCH');
  }
  if (!(boundaryRegistry?.sourceStates ?? []).includes(request.sourceState)) {
    throw new TypeError('RMO_REASONING_BOUNDARY_SOURCE_STATE_UNKNOWN');
  }
  if (request.requestedCertainty !== null) {
    assertKnownNatureAndCertainty(
      request.requestedDataNature,
      request.requestedCertainty,
      rdg,
      'RMO_REASONING_BOUNDARY'
    );
  } else if (!registryValues(rdg?.natures, 'natures', 'RMO_RDG_NATURE_REGISTRY_INVALID')
    .has(request.requestedDataNature)) {
    throw new TypeError('RMO_REASONING_BOUNDARY_DATA_NATURE_INVALID');
  }
  const componentReferences = requireReferenceArray(
    request.componentReferences,
    'RMO_REASONING_BOUNDARY_COMPONENT_REFERENCES_INVALID'
  );
  const componentMap = validateComponentReferences(
    reality,
    componentReferences,
    components,
    'RMO_REASONING_BOUNDARY_COMPONENT_REFERENCE'
  );
  const evidenceBindingReferences = optionalReferenceArray(
    request.evidenceBindingReferences,
    'RMO_REASONING_BOUNDARY_EVIDENCE_BINDING_REFERENCES_INVALID'
  );
  const bindingMap = buildEvidenceBindingMap(
    reality,
    evidenceBindings,
    'RMO_REASONING_BOUNDARY_EVIDENCE_BINDING_REFERENCE'
  );
  for (const reference of evidenceBindingReferences) {
    if (!bindingMap.has(reference)) {
      throw new TypeError(`RMO_REASONING_BOUNDARY_EVIDENCE_BINDING_REFERENCE_UNKNOWN:${reference}`);
    }
    if (!bindingMap.get(reference).componentReferences.some(component =>
      componentReferences.includes(component))) {
      throw new TypeError(
        `RMO_REASONING_BOUNDARY_EVIDENCE_BINDING_COMPONENT_DISCONNECTED:${reference}`
      );
    }
  }
  const reasoning = normalizeReasoning(
    request,
    definition,
    componentReferences,
    evidenceBindingReferences,
    boundaryRegistry
  );
  assertAllowedFields(request.governanceContext, new Set([
    'purposeCodes', 'sensitivityClass', 'sensitivityCategory', 'explicitConsent'
  ]), 'RMO_REASONING_GOVERNANCE_CONTEXT_FIELD_FORBIDDEN');
  const purposeCodes = requireReferenceArray(
    request.governanceContext.purposeCodes,
    'RMO_REASONING_PURPOSE_CODES_INVALID'
  );
  assertKnownPurposes(purposeCodes, rdg, 'RMO_REASONING_PURPOSE');
  assertKnownSensitivity(
    request.governanceContext.sensitivityClass,
    request.governanceContext.sensitivityCategory,
    rdg,
    'RMO_REASONING_SENSITIVITY'
  );
  if (typeof request.governanceContext.explicitConsent !== 'boolean') {
    throw new TypeError('RMO_REASONING_EXPLICIT_CONSENT_INVALID');
  }
  const contract = rmoDataContract(rdg);
  const purposeAllowed = purposeCodes.every(code => contract.allowedPurposes.includes(code));
  const professionalCategory =
    request.governanceContext.sensitivityClass === 'RESTRICTED_PROFESSIONAL' ||
    request.governanceContext.sensitivityCategory === 'PROFESSIONAL_NOTES';
  const protectedCategories = new Set([
    'HEALTH', 'FINANCIAL', 'RELATIONSHIP', 'FAMILY', 'LOCATION', 'BIRTH_DATA', 'PROFESSIONAL_NOTES'
  ]);
  const firewallSensitivityClass =
    protectedCategories.has(request.governanceContext.sensitivityCategory) &&
    ['PUBLIC', 'INTERNAL', 'PERSONAL'].includes(request.governanceContext.sensitivityClass)
      ? 'SENSITIVE'
      : request.governanceContext.sensitivityClass;
  let firewallDecision = evaluateSensitiveInference({
    sensitivityClass: firewallSensitivityClass,
    professionalCategory,
    professionalAuthority: request.requestedDataNature === 'PROFESSIONAL_JUDGMENT' ? 'RMO' : null,
    purposeAllowed,
    explicitConsent: request.governanceContext.explicitConsent
  });
  if (request.governanceContext.sensitivityClass === 'SYSTEM_SECRET') firewallDecision = 'DENY';
  if (
    request.governanceContext.sensitivityClass === 'RESTRICTED_PROFESSIONAL' &&
    firewallDecision === 'ALLOW_PURPOSE_BOUND'
  ) {
    firewallDecision = 'REQUIRE_PROFESSIONAL_AUTHORITY';
  }
  const { decision, reasons } = evaluateBoundaryDecision({
    requestedDataNature: request.requestedDataNature,
    sourceState: request.sourceState,
    evidenceBindingReferences,
    reasoning,
    purposeAllowed,
    firewallDecision
  });
  const createdAt = requireIso(request.createdAt, 'RMO_REASONING_BOUNDARY_CREATED_AT_INVALID');
  if (
    componentReferences.some(reference =>
      Date.parse(createdAt) <= Date.parse(componentMap.get(reference).createdAt)) ||
    evidenceBindingReferences.some(reference =>
      Date.parse(createdAt) <= Date.parse(bindingMap.get(reference).createdAt))
  ) {
    throw new TypeError('RMO_REASONING_BOUNDARY_TIME_INVALID');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-REASONING-BOUNDARY-v1.0.0',
    boundaryCode: requirePattern(request.boundaryCode, BOUNDARY_PATTERN, 'RMO_REASONING_BOUNDARY_CODE_INVALID'),
    boundaryVersion: requirePattern(
      request.boundaryVersion,
      SEMVER_PATTERN,
      'RMO_REASONING_BOUNDARY_VERSION_INVALID'
    ),
    componentType: 'REALITY_REASONING_BOUNDARY',
    requestedDataNature: request.requestedDataNature,
    requestedCertainty: request.requestedCertainty,
    sourceState: request.sourceState,
    realityReference: realityReference(reality),
    componentReferences,
    evidenceBindingReferences,
    reasoning,
    governanceContext: {
      purposeCodes,
      sensitivityClass: request.governanceContext.sensitivityClass,
      sensitivityCategory: request.governanceContext.sensitivityCategory,
      explicitConsent: request.governanceContext.explicitConsent,
      purposeAllowed,
      firewallDecision
    },
    boundaryDecision: decision,
    decisionReasons: reasons,
    recordStatus: 'EVALUATED',
    unknownStatePreserved: true,
    evidencePromotionAllowed: false,
    interpretationCreated: false,
    inferenceCreated: false,
    professionalJudgmentCreated: false,
    navigationOrActionCreated: false,
    authorityReference: REASONING_BOUNDARY_AUTHORITY,
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, reasoningBoundaryDigest: stableDigest(base) });
}

export function assertRealityReasoningBoundaryDigest(boundary) {
  if (stableDigest(withoutDigest(boundary, 'reasoningBoundaryDigest')) !== boundary.reasoningBoundaryDigest) {
    throw new TypeError('RMO_REASONING_BOUNDARY_DIGEST_INVALID');
  }
  return true;
}

export { stableDigest };
