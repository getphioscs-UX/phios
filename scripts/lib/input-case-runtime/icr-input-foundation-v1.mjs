import crypto from 'node:crypto';

const present = value => value !== undefined && value !== null && value !== '';
const uniqueSorted = values => [...new Set(values ?? [])].sort();
const clone = value => structuredClone(value);

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, stableValue(value[key])])
    );
  }
  return value;
}

export function stableDigest(value) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(stableValue(value)), 'utf8')
    .digest('hex');
}

function withoutDigest(value, field) {
  const copy = clone(value);
  delete copy[field];
  return copy;
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function requireText(value, code) {
  if (!present(value) || typeof value !== 'string') throw new TypeError(code);
  return value.trim();
}

function requireIso(value, code) {
  const text = requireText(value, code);
  const time = Date.parse(text);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== text) throw new TypeError(code);
  return text;
}

function findForbiddenField(value, forbidden, path = '') {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const result = findForbiddenField(value[index], forbidden, `${path}[${index}]`);
      if (result) return result;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (forbidden.has(key)) return childPath;
    const result = findForbiddenField(child, forbidden, childPath);
    if (result) return result;
  }
  return null;
}

export function validateRdgBindings(bindings, registries, expectedDataType) {
  if (!bindings || typeof bindings !== 'object') throw new TypeError('ICR_RDG_BINDINGS_REQUIRED');
  if (bindings.dataType !== expectedDataType) throw new TypeError('ICR_RDG_DATA_TYPE_INVALID');
  const purposes = new Set(registries?.purposes?.purposeCodes ?? []);
  const consentClasses = new Set(registries?.consents?.consentClasses ?? []);
  const persistenceClasses = new Set(registries?.persistence?.persistenceClasses ?? []);
  const sensitivityClasses = new Set(registries?.sensitivity?.classes ?? []);
  const deletionStates = new Set(registries?.deletion?.states ?? []);
  const purposeCodes = uniqueSorted(bindings.purposeCodes);
  if (purposeCodes.length === 0 || purposeCodes.some(code => !purposes.has(code))) {
    throw new TypeError('ICR_RDG_PURPOSE_INVALID');
  }
  if (!consentClasses.has(bindings.consentClass) || !present(bindings.consentReference)) {
    throw new TypeError('ICR_RDG_CONSENT_INVALID');
  }
  if (!persistenceClasses.has(bindings.persistenceClass)) {
    throw new TypeError('ICR_RDG_PERSISTENCE_INVALID');
  }
  const retention = (registries?.retention?.entries ?? [])
    .find(entry => entry.retentionClass === bindings.retentionClass);
  if (!retention || !retention.allowedPersistenceClasses.includes(bindings.persistenceClass)) {
    throw new TypeError('ICR_RDG_RETENTION_INVALID');
  }
  if (!sensitivityClasses.has(bindings.sensitivityClass)) {
    throw new TypeError('ICR_RDG_SENSITIVITY_INVALID');
  }
  if (!deletionStates.has(bindings.deletionState)) {
    throw new TypeError('ICR_RDG_DELETION_STATE_INVALID');
  }
  if (bindings.rdgAuthorityReference !== 'content/governance/reality-data-governance/registries/reality-data-registry-v1.json') {
    throw new TypeError('ICR_RDG_AUTHORITY_REFERENCE_INVALID');
  }
  return freeze({
    dataType: expectedDataType,
    purposeCodes,
    consentClass: bindings.consentClass,
    consentReference: bindings.consentReference,
    persistenceClass: bindings.persistenceClass,
    retentionClass: bindings.retentionClass,
    sensitivityClass: bindings.sensitivityClass,
    deletionState: bindings.deletionState,
    rdgAuthorityReference: bindings.rdgAuthorityReference
  });
}

export function normalizeBirthData(input = {}) {
  const allowedPrecisions = new Set(['exact', 'minute', 'hour', 'date_only', 'estimated', 'unknown']);
  const precision = input.precision;
  if (!allowedPrecisions.has(precision)) throw new TypeError('ICR_BIRTH_PRECISION_INVALID');
  const nullableText = value => present(value) ? String(value).trim() : null;
  const localDate = nullableText(input.localDate);
  const localTime = nullableText(input.localTime);
  const placeName = nullableText(input.placeName);
  const sourceTimezoneText = nullableText(input.sourceTimezoneText);
  if (localDate && !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new TypeError('ICR_BIRTH_DATE_INVALID');
  if (localTime && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(localTime)) {
    throw new TypeError('ICR_BIRTH_TIME_INVALID');
  }
  if (precision === 'date_only' && localTime !== null) throw new TypeError('ICR_BIRTH_DATE_ONLY_TIME_FORBIDDEN');
  if (precision === 'unknown' && (localTime !== null || input.uncertaintyMinutes !== null)) {
    throw new TypeError('ICR_BIRTH_UNKNOWN_REPRESENTATION_INVALID');
  }
  if (['exact', 'minute', 'hour', 'estimated'].includes(precision) && (!localDate || !localTime || !placeName)) {
    throw new TypeError('ICR_BIRTH_REQUIRED_DECLARATION_MISSING');
  }
  const uncertaintyMinutes = input.uncertaintyMinutes;
  if (uncertaintyMinutes !== null && (!Number.isInteger(uncertaintyMinutes) || uncertaintyMinutes < 0)) {
    throw new TypeError('ICR_BIRTH_UNCERTAINTY_INVALID');
  }
  let coordinate = null;
  if (input.coordinate !== null && input.coordinate !== undefined) {
    const latitude = Number(input.coordinate.latitude);
    const longitude = Number(input.coordinate.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new TypeError('ICR_BIRTH_COORDINATE_INVALID');
    }
    if (input.coordinate.datum !== 'WGS84' ||
        !['DECLARED_PLACE_GEOCODE', 'VERIFIED_GEOCODE', 'MEASURED'].includes(input.coordinate.sourceMethod)) {
      throw new TypeError('ICR_BIRTH_COORDINATE_GOVERNANCE_INVALID');
    }
    coordinate = {
      latitude,
      longitude,
      datum: 'WGS84',
      sourceMethod: input.coordinate.sourceMethod
    };
  }
  return freeze({
    birthDataVersion: '1.0.0',
    localDate,
    localTime,
    precision,
    calendarCode: requireText(input.calendarCode, 'ICR_BIRTH_CALENDAR_REQUIRED'),
    placeName,
    sourceTimezoneText,
    uncertaintyMinutes,
    coordinate,
    subjectConfirmed: input.subjectConfirmed === true,
    evidenceReferences: uniqueSorted(input.evidenceReferences)
  });
}

export function buildCanonicalInput(input, inputTypeRegistry, rdgRegistries, canonicalInputContract) {
  const forbidden = new Set(canonicalInputContract?.forbiddenPayloadFields ?? []);
  const forbiddenPath = findForbiddenField(input, forbidden);
  if (forbiddenPath) throw new TypeError(`ICR_FORBIDDEN_INPUT_FIELD:${forbiddenPath}`);
  const type = (inputTypeRegistry?.inputTypes ?? []).find(entry => entry.inputType === input?.inputType);
  if (!type) throw new TypeError('ICR_INPUT_TYPE_UNKNOWN');
  if (!type.sourceChannels.includes(input.sourceChannel)) throw new TypeError('ICR_SOURCE_CHANNEL_INELIGIBLE');
  const governanceBindings = validateRdgBindings(input.governanceBindings, rdgRegistries, 'REALITY_INPUT_RECORD');
  if (input.inputType === 'BIRTH_DATA' && governanceBindings.sensitivityClass !== 'HIGHLY_SENSITIVE') {
    throw new TypeError('ICR_BIRTH_SENSITIVITY_MUST_BE_HIGHLY_SENSITIVE');
  }
  if (input.provenance?.providerUsed !== false || input.provenance?.aiUsed !== false) {
    throw new TypeError('ICR_PROVIDER_OR_AI_CANONICAL_INPUT_FORBIDDEN');
  }
  const payload = input.inputType === 'BIRTH_DATA'
    ? { birthData: normalizeBirthData(input.payload?.birthData) }
    : clone(input.payload);
  const base = {
    schemaVersion: 'PHI-OS-CANONICAL-INPUT-v1.0.0',
    canonicalInputCode: requireText(input.canonicalInputCode, 'ICR_CANONICAL_INPUT_CODE_REQUIRED'),
    canonicalInputVersion: requireText(input.canonicalInputVersion, 'ICR_CANONICAL_INPUT_VERSION_REQUIRED'),
    inputType: input.inputType,
    inputStatus: 'DECLARED',
    subjectReference: requireText(input.subjectReference, 'ICR_SUBJECT_REFERENCE_REQUIRED'),
    sourceChannel: input.sourceChannel,
    declaredAt: requireIso(input.declaredAt, 'ICR_DECLARED_AT_INVALID'),
    locale: input.locale,
    payload,
    provenance: {
      sourceType: input.provenance.sourceType,
      sourceReferences: uniqueSorted(input.provenance.sourceReferences),
      capturedBy: 'ICR_OPERATIONAL_INTAKE',
      providerUsed: false,
      aiUsed: false
    },
    governanceBindings,
    lineage: {
      upstreamIntakeReferences: uniqueSorted(input.lineage?.upstreamIntakeReferences),
      previousCanonicalInputReference: input.lineage?.previousCanonicalInputReference ?? null
    }
  };
  return freeze({ ...base, canonicalInputDigest: stableDigest(base) });
}

export function assertCanonicalInputDigest(input) {
  if (stableDigest(withoutDigest(input, 'canonicalInputDigest')) !== input.canonicalInputDigest) {
    throw new TypeError('ICR_CANONICAL_INPUT_DIGEST_INVALID');
  }
  return true;
}

function normalizeFieldDecisions(decisions = []) {
  const states = new Set(['VERIFIED', 'DECLARED_NOT_VERIFIED', 'UNKNOWN', 'DISPUTED', 'INVALID']);
  const seen = new Set();
  const normalized = decisions.map(decision => {
    const fieldPath = requireText(decision.fieldPath, 'ICR_FIELD_PATH_REQUIRED');
    if (seen.has(fieldPath)) throw new TypeError('ICR_DUPLICATE_FIELD_DECISION');
    seen.add(fieldPath);
    if (!states.has(decision.state)) throw new TypeError('ICR_FIELD_DECISION_STATE_INVALID');
    const evidenceReferences = uniqueSorted(decision.evidenceReferences);
    if (decision.state === 'VERIFIED' && evidenceReferences.length === 0) {
      throw new TypeError('ICR_VERIFIED_FIELD_EVIDENCE_REQUIRED');
    }
    return { fieldPath, state: decision.state, evidenceReferences };
  });
  return normalized.sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
}

function normalizeAuthorityBindings(bindings = []) {
  const allowedTypes = new Set([
    'BIRTH_RECORD', 'COORDINATE', 'TIMEZONE', 'DST', 'TRUE_SOLAR_TIME',
    'ASTRONOMY', 'CALENDAR', 'SOLAR_TERMS', 'REFERENCE_TABLES'
  ]);
  const seenTypes = new Set();
  const seenCodes = new Set();
  return bindings.map(binding => {
    if (binding.authority !== 'SHARED_DATA_AUTHORITY') throw new TypeError('ICR_SHARED_DATA_AUTHORITY_REQUIRED');
    if (!allowedTypes.has(binding.recordType)) throw new TypeError('ICR_SHARED_RECORD_TYPE_INVALID');
    if (seenTypes.has(binding.recordType)) throw new TypeError('ICR_DUPLICATE_SHARED_RECORD_TYPE');
    seenTypes.add(binding.recordType);
    const bindingCode = requireText(binding.bindingCode, 'ICR_BINDING_CODE_REQUIRED');
    if (seenCodes.has(bindingCode)) throw new TypeError('ICR_DUPLICATE_BINDING_CODE');
    seenCodes.add(bindingCode);
    if (!/^SDA-[A-Z0-9-]{4,64}$/.test(binding.recordId ?? '') || !/^[a-f0-9]{64}$/.test(binding.recordDigest ?? '')) {
      throw new TypeError('ICR_SHARED_RECORD_REFERENCE_INVALID');
    }
    return {
      bindingCode,
      authority: 'SHARED_DATA_AUTHORITY',
      recordType: binding.recordType,
      recordId: binding.recordId,
      recordVersion: requireText(binding.recordVersion, 'ICR_SHARED_RECORD_VERSION_REQUIRED'),
      recordDigest: binding.recordDigest
    };
  }).sort((a, b) => a.recordType.localeCompare(b.recordType));
}

export function verifyCanonicalInput(canonicalInput, request, inputTypeRegistry, rdgRegistries) {
  assertCanonicalInputDigest(canonicalInput);
  if (['AI', 'PROVIDER'].includes(request.verifierClass)) throw new TypeError('ICR_PROVIDER_VERIFIER_FORBIDDEN');
  const allowedVerifiers = new Set([
    'SUBJECT_CONFIRMATION', 'DOCUMENT_REVIEW', 'PROFESSIONAL_REVIEW', 'GOVERNED_SYSTEM_CONSISTENCY'
  ]);
  if (!allowedVerifiers.has(request.verifierClass)) throw new TypeError('ICR_VERIFIER_CLASS_INVALID');
  const type = (inputTypeRegistry?.inputTypes ?? []).find(entry => entry.inputType === canonicalInput.inputType);
  if (!type) throw new TypeError('ICR_INPUT_TYPE_UNKNOWN');
  validateRdgBindings(canonicalInput.governanceBindings, rdgRegistries, 'REALITY_INPUT_RECORD');
  const fieldDecisions = normalizeFieldDecisions(request.fieldDecisions);
  const decisionMap = new Map(fieldDecisions.map(decision => [decision.fieldPath, decision]));
  for (const path of type.requiredVerificationPaths) {
    if (!decisionMap.has(path)) throw new TypeError(`ICR_REQUIRED_FIELD_DECISION_MISSING:${path}`);
  }
  const authorityBindings = normalizeAuthorityBindings(request.authorityBindings);
  const requiredDecisions = type.requiredVerificationPaths.map(path => decisionMap.get(path));
  let verificationState = 'VERIFIED';
  if (fieldDecisions.some(decision => decision.state === 'INVALID')) verificationState = 'REJECTED';
  else if (fieldDecisions.some(decision => decision.state === 'DISPUTED')) verificationState = 'DISPUTED';
  else if (fieldDecisions.some(decision => ['UNKNOWN', 'DECLARED_NOT_VERIFIED'].includes(decision.state)) ||
           requiredDecisions.some(decision => decision.state !== 'VERIFIED') || authorityBindings.length === 0) {
    verificationState = 'PARTIALLY_VERIFIED';
  }
  const projectionEligibility = verificationState === 'VERIFIED' ? 'ELIGIBLE' : 'BLOCKED';
  const verificationEvidenceReferences = uniqueSorted(
    fieldDecisions.flatMap(decision => decision.evidenceReferences)
  );
  const base = {
    schemaVersion: 'PHI-OS-VERIFIED-INPUT-v1.0.0',
    verifiedInputCode: requireText(request.verifiedInputCode, 'ICR_VERIFIED_INPUT_CODE_REQUIRED'),
    verifiedInputVersion: requireText(request.verifiedInputVersion, 'ICR_VERIFIED_INPUT_VERSION_REQUIRED'),
    sourceCanonicalInputCode: canonicalInput.canonicalInputCode,
    sourceCanonicalInputDigest: canonicalInput.canonicalInputDigest,
    inputType: canonicalInput.inputType,
    verificationState,
    projectionEligibility,
    verificationCode: requireText(request.verificationCode, 'ICR_VERIFICATION_CODE_REQUIRED'),
    verifierClass: request.verifierClass,
    verifierReference: requireText(request.verifierReference, 'ICR_VERIFIER_REFERENCE_REQUIRED'),
    verifiedAt: requireIso(request.verifiedAt, 'ICR_VERIFIED_AT_INVALID'),
    fieldDecisions,
    authorityBindings,
    governanceBindings: clone(canonicalInput.governanceBindings),
    lineage: {
      canonicalInputReference: canonicalInput.canonicalInputCode,
      canonicalInputDigest: canonicalInput.canonicalInputDigest,
      verificationEvidenceReferences
    }
  };
  return freeze({ ...base, verifiedInputDigest: stableDigest(base) });
}

export function assertVerifiedInputDigest(input) {
  if (stableDigest(withoutDigest(input, 'verifiedInputDigest')) !== input.verifiedInputDigest) {
    throw new TypeError('ICR_VERIFIED_INPUT_DIGEST_INVALID');
  }
  return true;
}

export function projectMethodInput(verifiedInput, request, requirementRegistry, rdgRegistries) {
  const forbiddenPath = findForbiddenField(request, new Set([
    'customerDb', 'customerDatabase', 'customerRecord', 'accountRecord', 'payload', 'rawBirthData'
  ]));
  if (forbiddenPath) throw new TypeError(`ICR_METHOD_DIRECT_DATA_FIELD_FORBIDDEN:${forbiddenPath}`);
  assertVerifiedInputDigest(verifiedInput);
  if (verifiedInput.verificationState !== 'VERIFIED' || verifiedInput.projectionEligibility !== 'ELIGIBLE') {
    throw new TypeError('ICR_VERIFIED_INPUT_REQUIRED');
  }
  const requirement = (requirementRegistry?.entries ?? [])
    .find(entry => entry.methodCode === request.methodCode);
  if (!requirement || requirement.foundationProjectionAllowed !== true) {
    throw new TypeError('ICR_METHOD_INPUT_REQUIREMENT_UNRESOLVED');
  }
  if (!requirement.acceptedInputTypes.includes(verifiedInput.inputType)) {
    throw new TypeError('ICR_METHOD_INPUT_TYPE_INELIGIBLE');
  }
  const bindingByType = new Map(verifiedInput.authorityBindings.map(binding => [binding.recordType, binding]));
  for (const recordType of requirement.requiredBindingTypes) {
    if (!bindingByType.has(recordType)) throw new TypeError(`ICR_METHOD_BINDING_REQUIRED:${recordType}`);
  }
  const bindingReferences = requirement.requiredBindingTypes
    .map(recordType => clone(bindingByType.get(recordType)))
    .sort((a, b) => a.recordType.localeCompare(b.recordType));
  const governanceBindings = validateRdgBindings(
    { ...verifiedInput.governanceBindings, dataType: 'METHOD_INPUT_RECORD' },
    rdgRegistries,
    'METHOD_INPUT_RECORD'
  );
  const base = {
    schemaVersion: 'PHI-OS-METHOD-INPUT-PROJECTION-v1.0.0',
    methodInputCode: requireText(request.methodInputCode, 'ICR_METHOD_INPUT_CODE_REQUIRED'),
    methodInputVersion: requireText(request.methodInputVersion, 'ICR_METHOD_INPUT_VERSION_REQUIRED'),
    methodCode: requirement.methodCode,
    pluginCode: requirement.pluginCode,
    inputType: verifiedInput.inputType,
    status: 'VALIDATION_ONLY',
    sourceCanonicalInputCode: verifiedInput.sourceCanonicalInputCode,
    sourceCanonicalInputDigest: verifiedInput.sourceCanonicalInputDigest,
    sourceVerifiedInputCode: verifiedInput.verifiedInputCode,
    sourceVerifiedInputDigest: verifiedInput.verifiedInputDigest,
    bindingReferences,
    governanceBindings,
    dataAccessMode: 'REFERENCE_ONLY_VIA_ICR',
    customerDatabaseReadAllowed: false,
    canonicalInputDirectReadAllowed: false,
    persistentMethodCopyAllowed: false,
    productionExecutionAllowed: false,
    projectedAt: requireIso(request.projectedAt, 'ICR_PROJECTED_AT_INVALID'),
    projectionPolicyVersion: requirementRegistry.projectionPolicyVersion
  };
  return freeze({ ...base, methodInputDigest: stableDigest(base) });
}
