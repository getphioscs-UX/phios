import crypto from 'node:crypto';

const FORBIDDEN_INPUT_FIELDS = new Set([
  'rawData', 'rawArbitraryData', 'payload', 'customerRecord', 'customerDatabase',
  'medicalDiagnosis', 'legalConclusion', 'financialRecommendation',
  'identityTruth', 'professionalJudgment', 'navigationDecision', 'navigationCommand'
]);

const clone = value => structuredClone(value);
const sortUnique = values => [...new Set((values ?? []).map(String).filter(Boolean))].sort();

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
  }
  return value;
}

export function stableDigest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value)), 'utf8').digest('hex');
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function assertNoForbiddenFields(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_INPUT_FIELDS.has(key)) throw new Error(`RRE_FORBIDDEN_INPUT_FIELD:${path}.${key}`);
    assertNoForbiddenFields(child, `${path}.${key}`);
  }
}

function normalizeReferenceObject(reference, code) {
  if (!reference || typeof reference !== 'object') throw new Error(`${code}_REFERENCE_REQUIRED`);
  const normalized = {
    code: String(reference.code ?? '').trim(),
    version: String(reference.version ?? '').trim(),
    digest: String(reference.digest ?? '').trim()
  };
  if (!normalized.code || !normalized.version || !/^[a-f0-9]{64}$/i.test(normalized.digest)) {
    throw new Error(`${code}_REFERENCE_INVALID`);
  }
  return normalized;
}

function normalizeOptionalReference(reference, code) {
  return reference == null ? null : normalizeReferenceObject(reference, code);
}

function normalizeRefList(values, code) {
  const refs = sortUnique(values);
  if ((values ?? []).length !== refs.length) throw new Error(`${code}_DUPLICATE_REFERENCE`);
  return refs;
}

export function buildReadoutInput(request, contract) {
  assertNoForbiddenFields(request);
  if (contract?.runtimeCode !== 'RRE' || contract?.work !== 'RRE-W1') throw new Error('RRE_INPUT_CONTRACT_INVALID');
  const dataQuality = String(request.dataQuality ?? '').trim().toUpperCase();
  if (!contract.allowedDataQuality.includes(dataQuality)) throw new Error('RRE_DATA_QUALITY_INVALID');
  const timeReference = request.timeReference ?? {};
  if (!timeReference.observedAt || !Number.isFinite(Date.parse(timeReference.observedAt))) {
    throw new Error('RRE_TIME_REFERENCE_INVALID');
  }
  const normalized = {
    inputCode: String(request.inputCode ?? '').trim(),
    inputVersion: '1.0.0',
    runtimeCode: 'RRE',
    objectFamily: 'READOUT_INPUT',
    realityReference: normalizeReferenceObject(request.realityReference, 'RRE_REALITY'),
    observationReferences: normalizeRefList(request.observationReferences, 'RRE_OBSERVATION'),
    evidenceReferences: normalizeRefList(request.evidenceReferences, 'RRE_EVIDENCE'),
    methodProjectionReferences: normalizeRefList(request.methodProjectionReferences, 'RRE_METHOD_PROJECTION'),
    meaningReferences: normalizeRefList(request.meaningReferences, 'RRE_MEANING'),
    knowledgeReferences: normalizeRefList(request.knowledgeReferences, 'RRE_KNOWLEDGE'),
    previousRealityReference: normalizeOptionalReference(request.previousRealityReference, 'RRE_PREVIOUS_REALITY'),
    timeReference: {
      observedAt: new Date(timeReference.observedAt).toISOString(),
      timezone: String(timeReference.timezone ?? 'UTC')
    },
    dataQuality,
    governanceReferences: normalizeRefList(request.governanceReferences, 'RRE_GOVERNANCE'),
    validationOnly: true,
    persistentStoreWriteAllowed: false,
    productionExecutionAllowed: false
  };
  if (!normalized.inputCode) throw new Error('RRE_INPUT_CODE_REQUIRED');
  if (!normalized.governanceReferences.length) throw new Error('RRE_GOVERNANCE_REFERENCE_REQUIRED');
  normalized.inputDigest = stableDigest(normalized);
  return deepFreeze(normalized);
}

export function assertReadoutInputDigest(input) {
  const copy = clone(input);
  const digest = copy.inputDigest;
  delete copy.inputDigest;
  if (digest !== stableDigest(copy)) throw new Error('RRE_INPUT_DIGEST_INVALID');
  return true;
}

export function extractObservableRuntime(input, realityView, dimensionRegistry) {
  assertReadoutInputDigest(input);
  assertNoForbiddenFields(realityView);
  if (realityView?.realityReference?.digest !== input.realityReference.digest) {
    throw new Error('RRE_REALITY_VIEW_REFERENCE_MISMATCH');
  }
  const dimensions = new Set(dimensionRegistry.observableDimensions.map(entry => entry.dimension));
  const source = Array.isArray(realityView.observables) ? realityView.observables : [];
  const supported = [];
  let omittedUnsupported = 0;
  for (const item of source) {
    const dimension = String(item.dimension ?? '').toUpperCase();
    if (!dimensions.has(dimension)) throw new Error(`RRE_OBSERVABLE_DIMENSION_UNKNOWN:${dimension}`);
    const supportReferences = sortUnique(item.supportReferences);
    if (String(item.supportState ?? '').toUpperCase() !== 'SUPPORTED' || supportReferences.length === 0) {
      omittedUnsupported += 1;
      continue;
    }
    supported.push({
      observableCode: String(item.observableCode ?? '').trim(),
      dimension,
      valueClass: String(item.valueClass ?? '').trim().toUpperCase(),
      supportReferences,
      timeReference: item.timeReference ?? null,
      sourceComponentReferences: sortUnique(item.sourceComponentReferences)
    });
  }
  if (supported.some(item => !item.observableCode)) throw new Error('RRE_OBSERVABLE_CODE_REQUIRED');
  const byDimension = Object.fromEntries([...dimensions].map(dimension => [
    dimension,
    supported.filter(item => item.dimension === dimension).sort((a, b) => a.observableCode.localeCompare(b.observableCode))
  ]));
  const result = {
    extractionCode: `RRE-OBS-${input.inputCode}`,
    realityReference: input.realityReference,
    observableStates: byDimension.STATE,
    observableTransitions: byDimension.TRANSITION,
    observableDependencies: byDimension.DEPENDENCY,
    observablePersistence: byDimension.PERSISTENCE,
    observableLoad: byDimension.LOAD,
    observableConstraints: byDimension.CONSTRAINT,
    omittedUnsupported,
    supportOnly: true,
    interpretationCreated: false,
    diagnosisCreated: false,
    professionalJudgmentCreated: false
  };
  result.extractionDigest = stableDigest(result);
  return deepFreeze(result);
}

function observableIndex(extraction) {
  const all = [
    ...extraction.observableStates,
    ...extraction.observableTransitions,
    ...extraction.observableDependencies,
    ...extraction.observablePersistence,
    ...extraction.observableLoad,
    ...extraction.observableConstraints
  ];
  return new Map(all.map(item => [item.observableCode, item]));
}

export function buildRuntimeSignature(extraction, request, roleRegistry) {
  assertNoForbiddenFields(request);
  const roles = new Set(roleRegistry.signatureRoles.map(entry => entry.role));
  const index = observableIndex(extraction);
  const fragments = (request.fragments ?? []).map(fragment => {
    const role = String(fragment.role ?? '').toUpperCase();
    if (!roles.has(role)) throw new Error(`RRE_SIGNATURE_ROLE_UNKNOWN:${role}`);
    const observableReferences = normalizeRefList(fragment.observableReferences, 'RRE_SIGNATURE_OBSERVABLE');
    if (!observableReferences.length) throw new Error('RRE_SIGNATURE_SUPPORT_REQUIRED');
    for (const ref of observableReferences) if (!index.has(ref)) throw new Error(`RRE_SIGNATURE_OBSERVABLE_UNKNOWN:${ref}`);
    const supportReferences = sortUnique(observableReferences.flatMap(ref => index.get(ref).supportReferences));
    return {
      signatureFragmentCode: String(fragment.signatureFragmentCode ?? '').trim(),
      role,
      descriptorCode: String(fragment.descriptorCode ?? '').trim(),
      observableReferences,
      supportReferences
    };
  });
  if (fragments.some(item => !item.signatureFragmentCode || !item.descriptorCode)) throw new Error('RRE_SIGNATURE_FRAGMENT_INVALID');
  const grouped = role => fragments.filter(item => item.role === role).sort((a, b) => a.signatureFragmentCode.localeCompare(b.signatureFragmentCode));
  const signature = {
    signatureCode: String(request.signatureCode ?? '').trim(),
    whatPersists: grouped('PERSISTS'),
    whatRepeats: grouped('REPEATS'),
    whatActivates: grouped('ACTIVATES'),
    whatDeactivates: grouped('DEACTIVATES'),
    whatRemainsUnstable: grouped('REMAINS_UNSTABLE'),
    personalityProfile: false,
    identityTruth: false,
    supportOnly: true
  };
  if (!signature.signatureCode) throw new Error('RRE_SIGNATURE_CODE_REQUIRED');
  signature.signatureDigest = stableDigest(signature);
  return deepFreeze(signature);
}

export function buildPatternRuntime(extraction, request, patternRegistry) {
  assertNoForbiddenFields(request);
  const types = new Set(patternRegistry.patternTypes.map(entry => entry.patternType));
  const states = new Set(patternRegistry.evidenceStates);
  const index = observableIndex(extraction);
  const patterns = (request.patterns ?? []).map(pattern => {
    const patternType = String(pattern.patternType ?? '').toUpperCase();
    const evidenceState = String(pattern.evidenceState ?? '').toUpperCase();
    if (!types.has(patternType)) throw new Error(`RRE_PATTERN_TYPE_UNKNOWN:${patternType}`);
    if (!states.has(evidenceState)) throw new Error(`RRE_PATTERN_EVIDENCE_STATE_UNKNOWN:${evidenceState}`);
    const observableReferences = normalizeRefList(pattern.observableReferences, 'RRE_PATTERN_OBSERVABLE');
    for (const ref of observableReferences) if (!index.has(ref)) throw new Error(`RRE_PATTERN_OBSERVABLE_UNKNOWN:${ref}`);
    const supportReferences = sortUnique(observableReferences.flatMap(ref => index.get(ref).supportReferences));
    if (evidenceState === 'OBSERVED_PATTERN' && supportReferences.length < 2) throw new Error('RRE_PATTERN_OBSERVED_SUPPORT_INSUFFICIENT');
    if (evidenceState === 'CANDIDATE_PATTERN' && supportReferences.length < 1) throw new Error('RRE_PATTERN_CANDIDATE_SUPPORT_INSUFFICIENT');
    return {
      patternCode: String(pattern.patternCode ?? '').trim(),
      patternType,
      evidenceState,
      descriptorCode: String(pattern.descriptorCode ?? '').trim(),
      observableReferences,
      supportReferences
    };
  });
  if (patterns.some(item => !item.patternCode || !item.descriptorCode)) throw new Error('RRE_PATTERN_INVALID');
  const result = {
    patternRuntimeCode: String(request.patternRuntimeCode ?? '').trim(),
    patterns: patterns.sort((a, b) => a.patternCode.localeCompare(b.patternCode)),
    observedPatternCount: patterns.filter(item => item.evidenceState === 'OBSERVED_PATTERN').length,
    candidatePatternCount: patterns.filter(item => item.evidenceState === 'CANDIDATE_PATTERN').length,
    insufficientEvidenceCount: patterns.filter(item => item.evidenceState === 'INSUFFICIENT_EVIDENCE').length,
    interpretationCreated: false,
    diagnosisCreated: false,
    recommendationCreated: false
  };
  if (!result.patternRuntimeCode) throw new Error('RRE_PATTERN_RUNTIME_CODE_REQUIRED');
  result.patternRuntimeDigest = stableDigest(result);
  return deepFreeze(result);
}
