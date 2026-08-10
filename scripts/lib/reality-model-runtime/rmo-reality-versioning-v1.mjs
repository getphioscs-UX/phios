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
  assertRealityEvidenceBindingDigest,
  assertRealityReasoningBoundaryDigest
} from './rmo-evidence-reasoning-v1.mjs';
import {
  assertRealityActionDigest,
  assertRealityOutcomeDigest,
  assertRealityUnknownDigest
} from './rmo-reality-lifecycle-v1.mjs';

const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const REALITY_PATTERN = /^RMO-REALITY-[A-Z0-9-]{4,100}$/;
const DIFF_PATTERN = /^RMO-DIFF-[A-Z0-9-]{4,100}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

const clone = value => structuredClone(value);
const present = value => value !== undefined && value !== null && value !== '';

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
  const normalized = [...new Set(value.map(item => requireText(item, code)))].sort();
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

function semverParts(version, code) {
  return requirePattern(version, SEMVER_PATTERN, code).split('.').map(Number);
}

function compareSemver(left, right) {
  const leftParts = semverParts(left, 'RMO_VERSION_SEMVER_INVALID');
  const rightParts = semverParts(right, 'RMO_VERSION_SEMVER_INVALID');
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function realityReference(reality) {
  return freeze({
    realityCode: reality.realityCode,
    realityVersion: reality.realityVersion,
    realityVersionSequence: reality.realityVersionSequence,
    realityDigest: reality.realityDigest
  });
}

function referenceKey(reference) {
  return `${reference.realityCode}|${reference.realityVersion}|${reference.realityDigest}`;
}

function ancestryReferences(reality) {
  const inherited = reality.lineage?.ancestorRealityReferences ?? [];
  return [...inherited.map(clone), realityReference(reality)];
}

function assertRmoDataContract(registry) {
  const entry = (registry?.entries ?? []).find(candidate => candidate.runtimeCode === 'RMO');
  if (!entry || entry.activationState !== 'EXISTING') throw new TypeError('RMO_VERSION_RDG_CONTRACT_MISSING');
  if (!(entry.producedDataTypes ?? []).includes('RUNTIME_STATE_RECORD')) {
    throw new TypeError('RMO_VERSION_RDG_WRITE_AUTHORITY_MISSING');
  }
  if (entry.writeAuthority?.mode !== 'ALLOW_LIST' ||
      !(entry.writeAuthority?.dataTypes ?? []).includes('RUNTIME_STATE_RECORD')) {
    throw new TypeError('RMO_VERSION_RDG_WRITE_AUTHORITY_INVALID');
  }
  if (entry.permissions?.professionalDataWrite !== 'DENY' ||
      entry.permissions?.evidencePromotion !== 'DENY') {
    throw new TypeError('RMO_VERSION_RDG_AUTHORITY_BOUNDARY_INVALID');
  }
  return entry;
}

const FAMILY_CONFIG = freeze({
  entities: {
    type: 'REALITY_ENTITY', code: 'entityCode', version: 'entityVersion', digest: 'entityDigest',
    assertDigest: assertRealityEntityDigest
  },
  events: {
    type: 'REALITY_EVENT', code: 'eventCode', version: 'eventVersion', digest: 'eventDigest',
    assertDigest: assertRealityEventDigest
  },
  signals: {
    type: 'REALITY_SIGNAL', code: 'signalCode', version: 'signalVersion', digest: 'signalDigest',
    assertDigest: assertRealitySignalDigest
  },
  relationships: {
    type: 'REALITY_RELATIONSHIP', code: 'relationshipCode', version: 'relationshipVersion',
    digest: 'relationshipDigest', assertDigest: assertRealityRelationshipDigest
  },
  constraints: {
    type: 'REALITY_CONSTRAINT', code: 'constraintCode', version: 'constraintVersion',
    digest: 'constraintDigest', assertDigest: assertRealityConstraintDigest
  },
  states: {
    type: 'REALITY_STATE', code: 'stateCode', version: 'stateVersion', digest: 'stateDigest',
    assertDigest: assertRealityStateDigest
  },
  evidenceBindings: {
    type: 'REALITY_EVIDENCE_BINDING', code: 'bindingCode', version: 'bindingVersion',
    digest: 'evidenceBindingDigest', assertDigest: assertRealityEvidenceBindingDigest
  },
  reasoningBoundaries: {
    type: 'REALITY_REASONING_BOUNDARY', code: 'boundaryCode', version: 'boundaryVersion',
    digest: 'reasoningBoundaryDigest', assertDigest: assertRealityReasoningBoundaryDigest
  },
  unknowns: {
    type: 'REALITY_UNKNOWN', code: 'unknownCode', version: 'unknownVersion', digest: 'unknownDigest',
    assertDigest: assertRealityUnknownDigest
  },
  actions: {
    type: 'REALITY_ACTION', code: 'actionCode', version: 'actionVersion', digest: 'actionDigest',
    assertDigest: assertRealityActionDigest
  },
  outcomes: {
    type: 'REALITY_OUTCOME', code: 'outcomeCode', version: 'outcomeVersion', digest: 'outcomeDigest',
    assertDigest: assertRealityOutcomeDigest
  }
});

export const REALITY_COMPONENT_FAMILIES = freeze(Object.keys(FAMILY_CONFIG));

function assertComponentBundleShape(bundle) {
  assertAllowedFields(bundle, new Set(REALITY_COMPONENT_FAMILIES), 'RMO_VERSION_COMPONENT_BUNDLE_FIELD_FORBIDDEN');
  for (const family of REALITY_COMPONENT_FAMILIES) {
    if (!Array.isArray(bundle[family])) throw new TypeError(`RMO_VERSION_COMPONENT_FAMILY_REQUIRED:${family}`);
  }
}

function normalizeComponentBundle(currentReality, bundle) {
  assertComponentBundleShape(bundle);
  const allowedRealityReferences = new Set(ancestryReferences(currentReality).map(referenceKey));
  const codeIndex = new Map();
  const componentReferences = {};
  const componentVersionReferences = {};
  const recordsByCode = new Map();

  for (const [family, config] of Object.entries(FAMILY_CONFIG)) {
    const references = [];
    const familyCodes = new Set();
    for (const record of bundle[family]) {
      if (record?.componentType !== config.type) {
        throw new TypeError(`RMO_VERSION_COMPONENT_TYPE_INVALID:${family}`);
      }
      config.assertDigest(record);
      const componentCode = requireText(record[config.code], `RMO_VERSION_COMPONENT_CODE_INVALID:${family}`);
      const componentVersion = requirePattern(
        record[config.version],
        SEMVER_PATTERN,
        `RMO_VERSION_COMPONENT_VERSION_INVALID:${componentCode}`
      );
      const componentDigest = requirePattern(
        record[config.digest],
        DIGEST_PATTERN,
        `RMO_VERSION_COMPONENT_DIGEST_INVALID:${componentCode}`
      );
      if (familyCodes.has(componentCode) || codeIndex.has(componentCode)) {
        throw new TypeError(`RMO_VERSION_COMPONENT_IDENTITY_DUPLICATE:${componentCode}`);
      }
      familyCodes.add(componentCode);
      codeIndex.set(componentCode, family);
      if (!record.realityReference ||
          !allowedRealityReferences.has(referenceKey(record.realityReference))) {
        throw new TypeError(`RMO_VERSION_COMPONENT_REALITY_ANCESTRY_INVALID:${componentCode}`);
      }
      if (record.realityReference.realityCode !== currentReality.realityCode) {
        throw new TypeError(`RMO_VERSION_COMPONENT_REALITY_IDENTITY_INVALID:${componentCode}`);
      }
      references.push({
        componentCode,
        componentVersion,
        componentDigest,
        sourceRealityReference: clone(record.realityReference)
      });
      recordsByCode.set(componentCode, record);
    }
    references.sort((left, right) => left.componentCode.localeCompare(right.componentCode));
    componentVersionReferences[family] = references;
    componentReferences[family] = references.map(reference => reference.componentCode);
  }

  assertComponentClosure(recordsByCode, codeIndex);
  return freeze({
    componentReferences,
    componentVersionReferences,
    componentSnapshotDigest: stableDigest(componentVersionReferences)
  });
}

function requireInternalReference(codeIndex, reference, ownerCode, expectedFamily = null) {
  const family = codeIndex.get(reference);
  if (!family) throw new TypeError(`RMO_VERSION_COMPONENT_CLOSURE_MISSING:${ownerCode}:${reference}`);
  if (expectedFamily && family !== expectedFamily) {
    throw new TypeError(`RMO_VERSION_COMPONENT_CLOSURE_TYPE_INVALID:${ownerCode}:${reference}`);
  }
}

function requireInternalReferences(codeIndex, references, ownerCode, expectedFamily = null) {
  for (const reference of references ?? []) {
    requireInternalReference(codeIndex, reference, ownerCode, expectedFamily);
  }
}

function assertComponentClosure(recordsByCode, codeIndex) {
  for (const [code, record] of recordsByCode) {
    switch (record.componentType) {
      case 'REALITY_EVENT':
        requireInternalReferences(codeIndex, record.entityReferences, code, 'entities');
        break;
      case 'REALITY_SIGNAL':
        requireInternalReferences(codeIndex, record.entityReferences, code, 'entities');
        requireInternalReferences(codeIndex, record.eventReferences, code, 'events');
        break;
      case 'REALITY_RELATIONSHIP':
        requireInternalReference(codeIndex, record.sourceEntityReference, code, 'entities');
        requireInternalReference(codeIndex, record.targetEntityReference, code, 'entities');
        break;
      case 'REALITY_CONSTRAINT':
      case 'REALITY_STATE':
      case 'REALITY_EVIDENCE_BINDING':
        requireInternalReferences(codeIndex, record.componentReferences, code);
        break;
      case 'REALITY_REASONING_BOUNDARY':
        requireInternalReferences(codeIndex, record.componentReferences, code);
        requireInternalReferences(codeIndex, record.evidenceBindingReferences, code, 'evidenceBindings');
        break;
      case 'REALITY_UNKNOWN':
        requireInternalReferences(codeIndex, record.componentReferences, code);
        requireInternalReferences(codeIndex, record.evidenceBindingReferences, code, 'evidenceBindings');
        break;
      case 'REALITY_ACTION':
        requireInternalReference(codeIndex, record.actorEntityReference, code, 'entities');
        requireInternalReferences(codeIndex, record.componentReferences, code);
        requireInternalReferences(codeIndex, record.evidenceBindingReferences, code, 'evidenceBindings');
        requireInternalReferences(codeIndex, record.unknownReferences, code, 'unknowns');
        break;
      case 'REALITY_OUTCOME':
        requireInternalReference(codeIndex, record.actionReference?.actionCode, code, 'actions');
        requireInternalReferences(codeIndex, record.componentReferences, code);
        requireInternalReferences(codeIndex, record.evidenceBindingReferences, code, 'evidenceBindings');
        requireInternalReferences(codeIndex, record.unknownReferences, code, 'unknowns');
        break;
      default:
        break;
    }
  }
}

function exactReferences(reality) {
  if (reality.componentVersionReferences) return clone(reality.componentVersionReferences);
  const references = reality.componentReferences ?? {};
  const ambiguous = Object.values(references).some(values => (values ?? []).length > 0);
  if (ambiguous) throw new TypeError('RMO_VERSION_CURRENT_EXACT_COMPONENT_LINEAGE_REQUIRED');
  return Object.fromEntries(REALITY_COMPONENT_FAMILIES.map(family => [family, []]));
}

function familyDiff(fromReferences, toReferences) {
  const fromMap = new Map(fromReferences.map(reference => [reference.componentCode, reference]));
  const toMap = new Map(toReferences.map(reference => [reference.componentCode, reference]));
  const added = [];
  const removed = [];
  const replaced = [];
  const unchanged = [];
  const codes = [...new Set([...fromMap.keys(), ...toMap.keys()])].sort();
  for (const code of codes) {
    const from = fromMap.get(code);
    const to = toMap.get(code);
    if (!from) added.push(clone(to));
    else if (!to) removed.push(clone(from));
    else if (from.componentVersion !== to.componentVersion ||
             from.componentDigest !== to.componentDigest) {
      replaced.push({ componentCode: code, from: clone(from), to: clone(to) });
    } else {
      unchanged.push(clone(to));
    }
  }
  return freeze({ added, removed, replaced, unchanged });
}

function calculateComponentDiff(fromReality, toExactReferences) {
  const fromExactReferences = exactReferences(fromReality);
  const componentChanges = {};
  const summary = {
    addedCount: 0,
    removedCount: 0,
    replacedCount: 0,
    unchangedCount: 0,
    changedFamilies: []
  };
  for (const family of REALITY_COMPONENT_FAMILIES) {
    const change = familyDiff(fromExactReferences[family] ?? [], toExactReferences[family] ?? []);
    componentChanges[family] = change;
    summary.addedCount += change.added.length;
    summary.removedCount += change.removed.length;
    summary.replacedCount += change.replaced.length;
    summary.unchangedCount += change.unchanged.length;
    if (change.added.length + change.removed.length + change.replaced.length > 0) {
      summary.changedFamilies.push(family);
    }
  }
  return freeze({ componentChanges, summary });
}

function validateChangeType(changeType, registry, diff) {
  const definition = (registry?.changeTypes ?? []).find(entry => entry.changeType === changeType);
  if (!definition) throw new TypeError('RMO_VERSION_CHANGE_TYPE_UNKNOWN');
  const { addedCount, removedCount, replacedCount, changedFamilies } = diff.summary;
  if (addedCount + removedCount + replacedCount === 0) {
    throw new TypeError('RMO_VERSION_NO_STRUCTURAL_CHANGE');
  }
  if (definition.addOnly && (removedCount > 0 || replacedCount > 0)) {
    throw new TypeError('RMO_VERSION_CHANGE_TYPE_ADD_ONLY_VIOLATION');
  }
  if (definition.requiresRemovalOrReplacement && removedCount + replacedCount === 0) {
    throw new TypeError('RMO_VERSION_CHANGE_TYPE_REVISION_REQUIRED');
  }
  if (definition.allowedFamilies &&
      changedFamilies.some(family => !definition.allowedFamilies.includes(family))) {
    throw new TypeError('RMO_VERSION_CHANGE_TYPE_FAMILY_FORBIDDEN');
  }
  if (definition.requiresUnknownRemoval) {
    const unknownChange = diff.componentChanges.unknowns;
    if (unknownChange.removed.length + unknownChange.replaced.length === 0) {
      throw new TypeError('RMO_VERSION_UNKNOWN_RESOLUTION_TRANSITION_REQUIRED');
    }
  }
  if (definition.requiresEvidenceBindingAddition) {
    const evidenceChange = diff.componentChanges.evidenceBindings;
    if (evidenceChange.added.length + evidenceChange.replaced.length === 0) {
      throw new TypeError('RMO_VERSION_UNKNOWN_RESOLUTION_EVIDENCE_REQUIRED');
    }
  }
  return definition;
}

export function buildRealityVersion(
  currentReality,
  request,
  componentBundle,
  changeTypeRegistry,
  rdgDataContractRegistry
) {
  assertCanonicalRealityDigest(currentReality);
  assertRmoDataContract(rdgDataContractRegistry);
  assertAllowedFields(request, new Set([
    'realityCode', 'nextRealityVersion', 'nextRealityVersionSequence', 'changeType',
    'changeReferences', 'revisedAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_VERSION_REQUEST_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_VERSION_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  if (request.realityCode !== currentReality.realityCode) {
    throw new TypeError('RMO_VERSION_REALITY_IDENTITY_CHANGED');
  }
  if (request.nextRealityVersionSequence !== currentReality.realityVersionSequence + 1) {
    throw new TypeError('RMO_VERSION_SEQUENCE_INVALID');
  }
  const nextRealityVersion = requirePattern(
    request.nextRealityVersion,
    SEMVER_PATTERN,
    'RMO_VERSION_NEXT_VERSION_INVALID'
  );
  if (compareSemver(nextRealityVersion, currentReality.realityVersion) <= 0) {
    throw new TypeError('RMO_VERSION_NOT_INCREASED');
  }
  const revisedAt = requireIso(request.revisedAt, 'RMO_VERSION_REVISED_AT_INVALID');
  if (Date.parse(revisedAt) <= Date.parse(currentReality.updatedAt)) {
    throw new TypeError('RMO_VERSION_TIME_NOT_INCREASED');
  }
  if (currentReality.persistentStoreWriteAllowed !== false ||
      currentReality.productionExecutionAllowed !== false ||
      currentReality.operationalMode !== 'VALIDATION_ONLY') {
    throw new TypeError('RMO_VERSION_OPERATIONAL_BOUNDARY_INVALID');
  }

  const normalized = normalizeComponentBundle(currentReality, componentBundle);
  const allRecords = REALITY_COMPONENT_FAMILIES.flatMap(family => componentBundle[family]);
  if (allRecords.some(record => Date.parse(revisedAt) <= Date.parse(record.createdAt))) {
    throw new TypeError('RMO_VERSION_TIME_BEFORE_COMPONENT');
  }
  const diff = calculateComponentDiff(currentReality, normalized.componentVersionReferences);
  const changeDefinition = validateChangeType(request.changeType, changeTypeRegistry, diff);
  const changeReferences = requireReferenceArray(
    request.changeReferences,
    'RMO_VERSION_CHANGE_REFERENCES_INVALID'
  );
  const ancestorRealityReferences = ancestryReferences(currentReality);
  const unknownChange = diff.componentChanges.unknowns;
  const evidenceChange = diff.componentChanges.evidenceBindings;
  const resolvedUnknownReferences = changeDefinition.requiresUnknownRemoval
    ? [...unknownChange.removed, ...unknownChange.replaced.map(entry => entry.from)]
      .map(reference => reference.componentCode).sort()
    : [];
  const resolutionEvidenceBindingReferences = changeDefinition.requiresEvidenceBindingAddition
    ? [...evidenceChange.added, ...evidenceChange.replaced.map(entry => entry.to)]
      .map(reference => reference.componentCode).sort()
    : [];

  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-VERSION-v1.0.0',
    realityCode: requirePattern(currentReality.realityCode, REALITY_PATTERN, 'RMO_VERSION_REALITY_CODE_INVALID'),
    realityVersion: nextRealityVersion,
    realityVersionSequence: requirePositiveInteger(
      request.nextRealityVersionSequence,
      'RMO_VERSION_SEQUENCE_INVALID'
    ),
    dataDomain: 'RUNTIME_STATE',
    dataType: 'RUNTIME_STATE_RECORD',
    realityStatus: 'VERSIONED',
    subjectReference: currentReality.subjectReference,
    sourceInitialization: clone(currentReality.sourceInitialization),
    governanceReferences: clone(currentReality.governanceReferences),
    componentReferences: clone(normalized.componentReferences),
    componentVersionReferences: clone(normalized.componentVersionReferences),
    componentSnapshotDigest: normalized.componentSnapshotDigest,
    unknownResolution: {
      transitionPerformed: changeDefinition.requiresUnknownRemoval === true,
      resolvedUnknownReferences,
      resolutionEvidenceBindingReferences,
      silentResolutionPerformed: false,
      inferenceFilled: false,
      providerOrAiResolutionPerformed: false
    },
    authorityBoundary: clone(currentReality.authorityBoundary),
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    productionExecutionAllowed: false,
    createdAt: currentReality.createdAt,
    updatedAt: revisedAt,
    lineage: {
      rootRealityReference: currentReality.lineage.rootRealityReference,
      previousRealityVersion: currentReality.realityVersion,
      previousRealityDigest: currentReality.realityDigest,
      ancestorRealityReferences,
      changeType: request.changeType,
      changeReferences,
      structuralChangeSummary: clone(diff.summary)
    }
  };
  return freeze({ ...base, realityDigest: stableDigest(base) });
}

export function assertCanonicalRealityVersionDigest(reality) {
  assertCanonicalRealityDigest(reality);
  if (reality.schemaVersion !== 'PHI-OS-CANONICAL-REALITY-VERSION-v1.0.0' ||
      reality.realityStatus !== 'VERSIONED' || reality.realityVersionSequence < 2 ||
      stableDigest(reality.componentVersionReferences) !== reality.componentSnapshotDigest) {
    throw new TypeError('RMO_VERSION_SNAPSHOT_INVALID');
  }
  return true;
}

function assertAncestorComparison(fromReality, toReality) {
  if (fromReality.realityCode !== toReality.realityCode ||
      fromReality.lineage.rootRealityReference !== toReality.lineage.rootRealityReference ||
      fromReality.subjectReference !== toReality.subjectReference) {
    throw new TypeError('RMO_DIFF_REALITY_IDENTITY_MISMATCH');
  }
  if (toReality.realityVersionSequence <= fromReality.realityVersionSequence ||
      compareSemver(toReality.realityVersion, fromReality.realityVersion) <= 0) {
    throw new TypeError('RMO_DIFF_VERSION_ORDER_INVALID');
  }
  const ancestors = new Set((toReality.lineage?.ancestorRealityReferences ?? []).map(referenceKey));
  if (!ancestors.has(referenceKey(realityReference(fromReality)))) {
    throw new TypeError('RMO_DIFF_ANCESTRY_INVALID');
  }
}

export function buildRealityDiff(fromReality, toReality, request, rdgDataContractRegistry) {
  assertCanonicalRealityDigest(fromReality);
  assertCanonicalRealityVersionDigest(toReality);
  assertRmoDataContract(rdgDataContractRegistry);
  assertAncestorComparison(fromReality, toReality);
  assertAllowedFields(request, new Set([
    'diffCode', 'diffVersion', 'createdAt', 'providerUsed', 'aiUsed'
  ]), 'RMO_DIFF_REQUEST_FIELD_FORBIDDEN');
  assertNoProviderOrAi(request, 'RMO_DIFF_PROVIDER_OR_AI_AUTHORITY_FORBIDDEN');
  const createdAt = requireIso(request.createdAt, 'RMO_DIFF_CREATED_AT_INVALID');
  if (Date.parse(createdAt) <= Date.parse(toReality.updatedAt)) {
    throw new TypeError('RMO_DIFF_TIME_INVALID');
  }
  const calculated = calculateComponentDiff(fromReality, exactReferences(toReality));
  if (calculated.summary.addedCount + calculated.summary.removedCount +
      calculated.summary.replacedCount === 0) {
    throw new TypeError('RMO_DIFF_NO_CHANGE');
  }
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-REALITY-DIFF-v1.0.0',
    diffCode: requirePattern(request.diffCode, DIFF_PATTERN, 'RMO_DIFF_CODE_INVALID'),
    diffVersion: requirePattern(request.diffVersion, SEMVER_PATTERN, 'RMO_DIFF_VERSION_INVALID'),
    componentType: 'REALITY_DIFF',
    dataDomain: 'RUNTIME_STATE',
    dataType: 'RUNTIME_STATE_RECORD',
    dataNature: 'AUDIT',
    certainty: 'CONFIRMED',
    fromRealityReference: realityReference(fromReality),
    toRealityReference: realityReference(toReality),
    comparisonMode: toReality.realityVersionSequence === fromReality.realityVersionSequence + 1
      ? 'ADJACENT_VERSION'
      : 'ANCESTOR_VERSION',
    algorithmReference: 'RMO-REALITY-DIFF-STRUCTURAL-REFERENCE-v1',
    algorithmVersion: '1.0.0',
    componentChanges: clone(calculated.componentChanges),
    summary: clone(calculated.summary),
    changeDetected: true,
    interpretationPerformed: false,
    inferencePerformed: false,
    diagnosisCreated: false,
    causalityClaimed: false,
    successOrEffectivenessDetermined: false,
    professionalJudgmentCreated: false,
    navigationOrActionCreated: false,
    evidencePromotionPerformed: false,
    providerOrAiAuthorityUsed: false,
    authorityReference: 'content/runtime/reality-model-runtime/contracts/reality-diff-contract-v1.json',
    operationalMode: 'VALIDATION_ONLY',
    persistentStoreWriteAllowed: false,
    createdAt
  };
  return freeze({ ...base, diffDigest: stableDigest(base) });
}

export function assertRealityDiffDigest(diff) {
  if (stableDigest(withoutDigest(diff, 'diffDigest')) !== diff.diffDigest) {
    throw new TypeError('RMO_DIFF_DIGEST_INVALID');
  }
  return true;
}

export { stableDigest };
