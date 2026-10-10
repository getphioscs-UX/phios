import { stableSerialize, sha256 } from '../method-runtime/shared-calculation-runtime.js';

export const MPA_PROJECTION_FREEZE_SCHEMA_VERSION =
  'PHI-OS-MPA-PROJECTION-FREEZE-RECORD-v1.0.0';
export const MPA_MEANING_KNOWLEDGE_REFERENCE_SCHEMA_VERSION =
  'PHI-OS-MPA-MEANING-KNOWLEDGE-REFERENCE-v1.0.0';
export const MPA_PROFESSIONAL_INTEGRATION_DECISION_SCHEMA_VERSION =
  'PHI-OS-MPA-PROFESSIONAL-INTEGRATION-DECISION-v1.0.0';

const CANONICAL_PROJECTION_SCHEMAS = new Set([
  'PHI-OS-CANONICAL-PROJECTION-v1.0.0',
  'PHI-OS-CANONICAL-NUMERIC-PROJECTION-v1.0.0'
]);

const FORBIDDEN_PROJECTION_KEYS = new Set([
  'interpretation', 'interpretationCandidate', 'realityFact', 'diagnosis',
  'professionalJudgment', 'professionalConclusion', 'finalConclusion'
]);

const PROFESSIONAL_GATE_FIELDS = Object.freeze([
  'methodProfessionalEligible',
  'separateProfessionalEligibility',
  'activeAssignment',
  'activeServiceConsent',
  'boundaryAcknowledged',
  'workspaceAccess'
]);

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
function string(value, message) {
  if (typeof value !== 'string' || !value) throw new TypeError(message);
}
function digest(value, message) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new TypeError(message);
}
function noKeys(value, forbidden, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key)) throw new TypeError(`Forbidden field at ${path}.${key}`);
    noKeys(child, forbidden, `${path}.${key}`);
  }
}
function getPath(root, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], root);
}

export function assertCanonicalProjectionForFreeze(projection) {
  object(projection, 'Canonical Projection is required.');
  if (!CANONICAL_PROJECTION_SCHEMAS.has(projection.schemaVersion)) {
    throw new TypeError(`Unsupported Canonical Projection schema: ${projection.schemaVersion}`);
  }
  for (const key of ['projectionType', 'projectionCode', 'projectionVersion',
    'projectionValue', 'projectionSource', 'projectionConfidence']) {
    if (!Object.hasOwn(projection, key)) throw new TypeError(`Projection field missing: ${key}`);
  }
  if (projection.deterministic !== true || projection.providerUsed !== false ||
      projection.aiUsed !== false || projection.interpretationCreated !== false ||
      projection.knowledgeCreated !== false || projection.realityConclusionCreated !== false ||
      projection.professionalConclusionCreated !== false) {
    throw new TypeError('Projection boundary is invalid.');
  }
  object(projection.projectionSource, 'Projection source is required.');
  for (const key of ['calculationId', 'calculationRuntimeCode', 'calculationRuntimeVersion',
    'methodCode', 'pluginCode', 'algorithmCode', 'algorithmVersion', 'inputDigest', 'outputDigest']) {
    string(projection.projectionSource[key], `Projection source lineage missing: ${key}`);
  }
  digest(projection.projectionSource.inputDigest, 'Projection inputDigest is invalid.');
  digest(projection.projectionSource.outputDigest, 'Projection outputDigest is invalid.');
  noKeys(projection, FORBIDDEN_PROJECTION_KEYS);
  return true;
}

export async function createProjectionFreezeRecord(request) {
  object(request, 'Projection Freeze request is required.');
  assertCanonicalProjectionForFreeze(request.projection);
  for (const key of ['methodVersion', 'calculationPolicyCode', 'calculationPolicyVersion',
    'projectionPolicyCode', 'projectionPolicyVersion']) {
    string(request[key], `${key} is required.`);
  }
  const source = request.projection.projectionSource;
  const projectionDigest = await sha256(request.projection);
  const frozenCore = {
    methodReference: {
      methodCode: source.methodCode,
      pluginCode: source.pluginCode,
      methodVersion: request.methodVersion
    },
    calculationReference: {
      calculationId: source.calculationId,
      runtimeCode: source.calculationRuntimeCode,
      runtimeVersion: source.calculationRuntimeVersion,
      algorithmCode: source.algorithmCode,
      algorithmVersion: source.algorithmVersion,
      inputDigest: source.inputDigest,
      outputDigest: source.outputDigest
    },
    policyReferences: {
      calculationPolicyCode: request.calculationPolicyCode,
      calculationPolicyVersion: request.calculationPolicyVersion,
      projectionPolicyCode: request.projectionPolicyCode,
      projectionPolicyVersion: request.projectionPolicyVersion
    },
    projectionReference: {
      schemaVersion: request.projection.schemaVersion,
      projectionType: request.projection.projectionType,
      projectionCode: request.projection.projectionCode,
      projectionVersion: request.projection.projectionVersion,
      projectionDigest
    },
    projectionSnapshot: structuredClone(request.projection)
  };
  const freezeDigest = await sha256(frozenCore);
  return Object.freeze({
    schemaVersion: MPA_PROJECTION_FREEZE_SCHEMA_VERSION,
    freezeVersion: '1.0.0',
    freezeCode: `MPA-PRJ-FRZ-${freezeDigest.slice(0, 24).toUpperCase()}`,
    ...frozenCore,
    freezeDigest,
    immutable: true,
    validationArtifactOnly: true,
    productionAuthorityCreated: false,
    interpretationCreated: false,
    realityFactCreated: false,
    diagnosisCreated: false,
    professionalJudgmentCreated: false
  });
}

export function assertInterpretationBoundary({ projectionFreeze, interpretationCandidate = null } = {}) {
  object(projectionFreeze, 'Projection Freeze is required.');
  if (projectionFreeze.schemaVersion !== MPA_PROJECTION_FREEZE_SCHEMA_VERSION ||
      projectionFreeze.immutable !== true || projectionFreeze.interpretationCreated !== false ||
      projectionFreeze.realityFactCreated !== false || projectionFreeze.diagnosisCreated !== false ||
      projectionFreeze.professionalJudgmentCreated !== false) {
    throw new TypeError('Projection Freeze boundary is invalid.');
  }
  if (interpretationCandidate !== null) {
    object(interpretationCandidate, 'Interpretation Candidate must be an object.');
    if (interpretationCandidate.schemaVersion !==
      'PHI-OS-CANONICAL-INTERPRETATION-CANDIDATE-v1.0.0' ||
      interpretationCandidate.candidateStatus !== 'candidate') {
      throw new TypeError('Interpretation Candidate boundary is invalid.');
    }
    for (const key of ['realityFact', 'diagnosis', 'professionalJudgment', 'finalConclusion']) {
      if (Object.hasOwn(interpretationCandidate, key)) {
        throw new TypeError(`Interpretation Candidate may not create ${key}.`);
      }
    }
  }
  return Object.freeze({
    projectionIsInterpretation: false,
    projectionIsRealityFact: false,
    interpretationIsRealityFact: false,
    interpretationIsDiagnosis: false,
    interpretationIsProfessionalJudgment: false,
    aiArithmeticAuthorityAllowed: false,
    aiProjectionAuthorityAllowed: false,
    aiInterpretationCandidateOnly: true
  });
}

export async function resolveMeaningKnowledgeReferences({
  projectionFreeze,
  meaningMappingRegistry,
  meaningKnowledgeMap
} = {}) {
  object(projectionFreeze, 'Projection Freeze is required.');
  object(meaningMappingRegistry, 'Meaning Mapping Registry is required.');
  object(meaningKnowledgeMap, 'Meaning Knowledge Map is required.');
  const projection = projectionFreeze.projectionSnapshot;
  assertCanonicalProjectionForFreeze(projection);
  const mappings = meaningMappingRegistry.mappings ?? [];
  const matched = mappings.filter(mapping => {
    const source = mapping.sourceProjectionValue;
    if (!source || source.operator !== 'equals') return false;
    if (mapping.sourceMethodCode !== projection.projectionSource.methodCode ||
        mapping.sourcePluginCode !== projection.projectionSource.pluginCode ||
        mapping.sourceProjectionType !== projection.projectionType) return false;
    return getPath(projection, source.path) === source.value;
  });
  const meaningCodes = [...new Set(matched.map(item => item.meaningCode))].sort();
  const knowledge = meaningCodes.map(meaningCode => {
    const entry = (meaningKnowledgeMap.mappings ?? []).find(item => item.meaningCode === meaningCode);
    if (!entry) return { meaningCode, coverage: 'UNMAPPED', knowledgeReferences: [] };
    return {
      meaningCode,
      coverage: 'REFERENCE_AVAILABLE_VALIDATION_ONLY',
      knowledgeReferences: [
        ...(entry.knowledgeAuthority?.primaryNodeCodes ?? []),
        ...(entry.knowledgeAuthority?.supportingNodeCodes ?? [])
      ],
      knowledgeHash: entry.knowledgeHash
    };
  });
  const result = {
    schemaVersion: MPA_MEANING_KNOWLEDGE_REFERENCE_SCHEMA_VERSION,
    projectionFreezeCode: projectionFreeze.freezeCode,
    mappingRegistryCode: meaningMappingRegistry.registryCode,
    mappingRegistryVersion: meaningMappingRegistry.registryVersion,
    meaningKnowledgeMapCode: meaningKnowledgeMap.registryCode,
    meaningKnowledgeMapVersion: meaningKnowledgeMap.registryVersion,
    meaningCodes,
    knowledge,
    articleBodyStored: false,
    publishedFragmentTextStored: false,
    meaningCreated: false,
    meaningRewritten: false,
    knowledgeRewritten: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    validationReferenceOnly: true
  };
  return Object.freeze({ ...result, referenceDigest: await sha256(result) });
}

export function evaluateProfessionalIntegration(request = {}) {
  object(request, 'Professional Integration request is required.');
  string(request.methodCode, 'methodCode is required.');
  if (request.mode === 'CUSTOMER_CALCULATION') {
    return Object.freeze({
      schemaVersion: MPA_PROFESSIONAL_INTEGRATION_DECISION_SCHEMA_VERSION,
      decision: 'CUSTOMER_CALCULATION_SEPARATE_FROM_PROFESSIONAL_INTERPRETATION',
      methodCode: request.methodCode,
      professionalRuntimeHandoffAllowed: false,
      professionalReleaseAllowed: false,
      professionalConclusionCreated: false,
      professionalAuthorityCreatedByMpa: false
    });
  }
  if (request.mode !== 'PROFESSIONAL_INTERPRETATION') {
    throw new TypeError('Unsupported Professional Integration mode.');
  }
  const missing = PROFESSIONAL_GATE_FIELDS.filter(field => request[field] !== true);
  if (request.prV2AuthorityResolved !== true) missing.push('prV2AuthorityResolved');
  if (missing.length) {
    return Object.freeze({
      schemaVersion: MPA_PROFESSIONAL_INTEGRATION_DECISION_SCHEMA_VERSION,
      decision: 'PROFESSIONAL_INTEGRATION_BLOCKED',
      methodCode: request.methodCode,
      blockingReasons: [...new Set(missing)].sort(),
      professionalRuntimeHandoffAllowed: false,
      professionalReleaseAllowed: false,
      professionalConclusionCreated: false,
      professionalAuthorityCreatedByMpa: false
    });
  }
  return Object.freeze({
    schemaVersion: MPA_PROFESSIONAL_INTEGRATION_DECISION_SCHEMA_VERSION,
    decision: 'READY_FOR_SHARED_PROFESSIONAL_RUNTIME_HANDOFF',
    methodCode: request.methodCode,
    blockingReasons: [],
    professionalRuntimeHandoffAllowed: true,
    professionalReleaseAllowed: false,
    professionalConclusionCreated: false,
    professionalAuthorityCreatedByMpa: false,
    releaseAuthority: 'PR_V2_AND_SHARED_PROFESSIONAL_RUNTIME'
  });
}

export function projectionFreezeStableSerialize(value) {
  return stableSerialize(value);
}
