import { clone, deepFreeze, sha256Stable, stableStringify } from '../interpretation-runtime/mir7-utils.js';

export const PROFILE_SOURCE_CLASSES = Object.freeze([
  'MEASURED_TASK_PERFORMANCE',
  'STANDARDIZED_SELF_REPORT',
  'CUSTOMER_SELF_REPORT',
  'EXTERNAL_PROFILE_RESULT',
  'SYMBOLIC_INTERPRETATION',
  'CURRENT_REALITY_OBSERVATION',
  'PROFESSIONAL_EVIDENCE'
]);

export const EXTERNAL_PROFILE_PROVIDER_FAMILIES = Object.freeze([
  'MBTI_OFFICIAL',
  '16P_NERIS',
  'IPIP_BIG_FIVE',
  'OTHER_BIG_FIVE',
  'OTHER_EXTERNAL_PROFILE'
]);

export const REASONING_TASK_FAMILIES = Object.freeze([
  'PATTERN_COMPLETION',
  'ABSTRACT_RELATION',
  'SEQUENCE_REASONING',
  'SPATIAL_TRANSFORMATION',
  'RELATIONAL_MATRIX'
]);

export const PROFILE_SIGNAL_SCHEMA = 'PHI-OS-PROFILE-SIGNAL-ENVELOPE-v1';
export const EXTERNAL_PROFILE_INPUT_SCHEMA = 'PHI-OS-EXTERNAL-PROFILE-INPUT-v1';
export const SELF_ASSESSMENT_RESULT_SCHEMA = 'PHI-OS-SELF-ASSESSMENT-RESULT-IR-v1';
export const REASONING_TASK_PERFORMANCE_SCHEMA = 'PHI-OS-REASONING-TASK-PERFORMANCE-v1';
export const PROFILE_CONTEXT_PURPOSE = 'PROFILE_CONTEXT';
export const SELF_ASSESSMENT_PURPOSE = 'PROFILE_SELF_REFLECTION';

const fail = (code, details = null) => {
  const error = new Error(code);
  error.code = code;
  if (details !== null) error.details = details;
  throw error;
};

const cleanText = (value, max = 240) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
};

const requiredText = (value, code, max = 240) => {
  const text = cleanText(value, max);
  if (!text) fail(code);
  return text;
};

const finite = value => typeof value === 'number' && Number.isFinite(value);
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function assertIsoDateOrNull(value, code) {
  if (value === null || value === undefined || value === '') return null;
  const text = requiredText(value, code, 40);
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text) || Number.isNaN(Date.parse(text.length === 10 ? `${text}T00:00:00Z` : text))) fail(code);
  return text;
}

function normalizeProvenance(items, fallbackSource) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [{ source: fallbackSource }];
  return list.slice(0, 12).map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail('PROFILE_PROVENANCE_OBJECT_REQUIRED');
    const source = requiredText(item.source || fallbackSource, 'PROFILE_PROVENANCE_SOURCE_REQUIRED', 120);
    const out = { source };
    for (const [key, value] of Object.entries(item)) {
      if (key === 'source') continue;
      if (typeof value === 'string') out[key] = cleanText(value, 300);
      else if (typeof value === 'number' || typeof value === 'boolean' || value === null) out[key] = value;
    }
    return out;
  });
}

export function assertProfileSourceClass(sourceClass) {
  if (!PROFILE_SOURCE_CLASSES.includes(sourceClass)) fail('PROFILE_SOURCE_CLASS_NOT_ADMITTED', { sourceClass });
  return sourceClass;
}

export function normalizeExternalProfileInput(input = {}, providerRegistry = null) {
  if (input.consent !== true) fail('EXTERNAL_PROFILE_EXPLICIT_CONSENT_REQUIRED');
  if (input.purpose !== PROFILE_CONTEXT_PURPOSE) fail('EXTERNAL_PROFILE_PURPOSE_REQUIRED');
  const providerFamily = requiredText(input.providerFamily, 'EXTERNAL_PROFILE_PROVIDER_FAMILY_REQUIRED', 80);
  if (!EXTERNAL_PROFILE_PROVIDER_FAMILIES.includes(providerFamily)) fail('EXTERNAL_PROFILE_PROVIDER_FAMILY_NOT_ADMITTED', { providerFamily });

  if (providerRegistry) {
    const entry = (providerRegistry.providers || []).find(item => item.providerFamily === providerFamily);
    if (!entry) fail('EXTERNAL_PROFILE_PROVIDER_REGISTRY_ENTRY_REQUIRED', { providerFamily });
    if (entry.manualResultImportAllowed !== true) fail('EXTERNAL_PROFILE_MANUAL_IMPORT_NOT_ALLOWED', { providerFamily });
    if (entry.itemBankReproductionAllowed === true || entry.firstPartyAssessmentAllowed === true) {
      fail('EXTERNAL_PROFILE_FOUNDATION_MUST_NOT_ACTIVATE_FIRST_PARTY_PROVIDER_TESTING', { providerFamily });
    }
  }

  if (input.customerConfirmed !== true) fail('EXTERNAL_PROFILE_CUSTOMER_CONFIRMATION_REQUIRED');
  const resultPrecision = input.resultPrecision || 'CONFIRMED';
  if (!['CONFIRMED', 'APPROXIMATE', 'UNKNOWN'].includes(resultPrecision)) fail('EXTERNAL_PROFILE_RESULT_PRECISION_INVALID');
  const resultDimensions = input.resultDimensions && typeof input.resultDimensions === 'object' && !Array.isArray(input.resultDimensions)
    ? clone(input.resultDimensions)
    : {};
  const participantRef = requiredText(input.participantRef, 'EXTERNAL_PROFILE_PARTICIPANT_REQUIRED', 160);
  const providerName = requiredText(input.providerName, 'EXTERNAL_PROFILE_PROVIDER_NAME_REQUIRED', 160);
  const resultLabel = requiredText(input.resultLabel, 'EXTERNAL_PROFILE_RESULT_LABEL_REQUIRED', 160);
  const assessmentDate = assertIsoDateOrNull(input.assessmentDate, 'EXTERNAL_PROFILE_ASSESSMENT_DATE_INVALID');
  const persistencePreference = input.persistencePreference || 'SESSION_ONLY';
  if (!['SESSION_ONLY', 'SAVE_TO_ACCOUNT', 'DO_NOT_SAVE'].includes(persistencePreference)) fail('EXTERNAL_PROFILE_PERSISTENCE_PREFERENCE_INVALID');

  const externalProfileId = cleanText(input.externalProfileId, 160) || `EXT-${providerFamily}-${participantRef}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 160);
  return deepFreeze({
    schemaVersion: EXTERNAL_PROFILE_INPUT_SCHEMA,
    externalProfileId,
    participantRef,
    providerFamily,
    providerName,
    resultLabel,
    resultDimensions,
    assessmentDate,
    resultPrecision,
    customerConfirmed: true,
    sourceClass: 'EXTERNAL_PROFILE_RESULT',
    purpose: PROFILE_CONTEXT_PURPOSE,
    consent: true,
    persistencePreference,
    provenance: normalizeProvenance(input.provenance, 'CUSTOMER_ENTRY'),
    governance: {
      proprietaryItemBankReproduced: false,
      phiOsProviderRescoringPerformed: false,
      providerFamilyEquivalenceAssumed: false,
      automaticPersistence: false,
      objectivePersonalityFactCreated: false
    }
  });
}

export function scoreSelfAssessment({ instrument, responses, participantRef, assessmentDate, customerConfirmed = false, consent = false, sensitiveConsent = false, purpose = null } = {}) {
  if (instrument?.schemaVersion !== 'PHI-OS-SELF-ASSESSMENT-INSTRUMENT-v2.0.0') fail('SELF_ASSESSMENT_INSTRUMENT_V2_REQUIRED');
  if (consent !== true) fail('SELF_ASSESSMENT_EXPLICIT_CONSENT_REQUIRED');
  if (purpose !== SELF_ASSESSMENT_PURPOSE) fail('SELF_ASSESSMENT_PURPOSE_REQUIRED');
  if (instrument?.diagnosticInstrument !== false || instrument?.normedInstrument !== false) fail('SELF_ASSESSMENT_FOUNDATION_BOUNDARY_DRIFT');
  const person = requiredText(participantRef, 'SELF_ASSESSMENT_PARTICIPANT_REQUIRED', 160);
  const date = assertIsoDateOrNull(assessmentDate, 'SELF_ASSESSMENT_DATE_REQUIRED');
  if (!date) fail('SELF_ASSESSMENT_DATE_REQUIRED');
  const answerMap = responses && typeof responses === 'object' && !Array.isArray(responses) ? responses : {};
  const items = Array.isArray(instrument.items) ? instrument.items : [];
  if (!items.length) fail('SELF_ASSESSMENT_ITEMS_REQUIRED');

  const domainValues = new Map();
  const facetValues = new Map();
  const scoredResponses = [];
  let answered = 0;
  let sensitiveResponseCount = 0;

  for (const item of items) {
    const raw = answerMap[item.itemId];
    if (raw === undefined || raw === null || raw === '') continue;
    const numeric = Number(raw);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) fail('SELF_ASSESSMENT_RESPONSE_OUT_OF_RANGE', { itemId: item.itemId });
    const scored = item.reverseKeyed === true ? 6 - numeric : numeric;
    answered += 1;
    if (item.sensitive === true) sensitiveResponseCount += 1;
    if (!domainValues.has(item.domainId)) domainValues.set(item.domainId, []);
    domainValues.get(item.domainId).push(scored);
    const facetKey = `${item.domainId}.${item.facetId}`;
    if (!facetValues.has(facetKey)) facetValues.set(facetKey, []);
    facetValues.get(facetKey).push(scored);
    scoredResponses.push({ itemId: item.itemId, domainId: item.domainId, facetId: item.facetId, rawResponse: numeric, scoredResponse: scored });
  }

  if (!answered) fail('SELF_ASSESSMENT_AT_LEAST_ONE_RESPONSE_REQUIRED');
  if (sensitiveResponseCount > 0 && sensitiveConsent !== true) fail('SELF_ASSESSMENT_SENSITIVE_CONSENT_REQUIRED', { sensitiveResponseCount });
  const domainRawScore = {};
  const byDomain = {};
  for (const [domainId, values] of [...domainValues.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const mean = average(values);
    domainRawScore[domainId] = round(mean);
    byDomain[domainId] = round(((mean - 1) / 4) * 100, 2);
  }
  const facetRawScore = {};
  for (const [facetKey, values] of [...facetValues.entries()].sort(([a], [b]) => a.localeCompare(b))) facetRawScore[facetKey] = round(average(values));
  const overall = average(scoredResponses.map(item => item.scoredResponse));
  const ratio = answered / items.length;
  const uncertaintyFlags = [];
  if (ratio < 1) uncertaintyFlags.push('PARTIAL_RESPONSE_SET');
  if (ratio < 0.8) uncertaintyFlags.push('LOW_RESPONSE_COMPLETENESS');
  if (customerConfirmed !== true) uncertaintyFlags.push('CUSTOMER_NOT_YET_CONFIRMED');

  return deepFreeze({
    schemaVersion: SELF_ASSESSMENT_RESULT_SCHEMA,
    assessmentResultId: `PHI-SA2-RESULT-${person}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 160),
    participantRef: person,
    instrumentCode: instrument.instrumentCode,
    instrumentVersion: instrument.instrumentVersion,
    assessmentDate: date,
    sourceClass: 'CUSTOMER_SELF_REPORT',
    purpose: SELF_ASSESSMENT_PURPOSE,
    consent: true,
    sensitiveConsent: sensitiveResponseCount > 0 ? true : sensitiveConsent === true,
    sensitiveResponseCount,
    domainRawScore,
    facetRawScore,
    normalizedSelfReportIndex: { overall: round(((overall - 1) / 4) * 100, 2), byDomain },
    responseCompleteness: { answered, total: items.length, ratio: round(ratio, 4) },
    uncertaintyFlags,
    customerConfirmed: customerConfirmed === true,
    scoredResponses,
    governance: {
      selfReportedProfile: true,
      explicitConsentCaptured: true,
      sensitiveConsentCapturedIfRequired: sensitiveResponseCount === 0 || sensitiveConsent === true,
      automaticPersistence: false,
      objectivePersonalityFactCreated: false,
      diagnosisCreated: false,
      scientificPercentileCreated: false,
      normingClaimCreated: false,
      quotientLabelCreated: false,
      professionalJudgmentCreated: false
    }
  });
}

export function normalizeReasoningTaskPerformance({ participantRef, assessmentDate, taskBankAuthority, attempts, itemVersion, fixtureMode = false } = {}) {
  const person = requiredText(participantRef, 'REASONING_TASK_PARTICIPANT_REQUIRED', 160);
  const date = assertIsoDateOrNull(assessmentDate, 'REASONING_TASK_ASSESSMENT_DATE_REQUIRED');
  if (!date) fail('REASONING_TASK_ASSESSMENT_DATE_REQUIRED');
  const taskBankAdmitted = taskBankAuthority?.status === 'ADMITTED' || (fixtureMode === true && taskBankAuthority?.status === 'ADMITTED_FIXTURE_ONLY');
  if (!taskBankAdmitted) fail('REASONING_TASK_ADMITTED_TASK_BANK_REQUIRED');
  const taskBankAuthorityRef = requiredText(taskBankAuthority.sourceRef, 'REASONING_TASK_BANK_AUTHORITY_REF_REQUIRED', 300);
  const taskBankVersion = requiredText(taskBankAuthority.version, 'REASONING_TASK_BANK_VERSION_REQUIRED', 80);
  const rows = Array.isArray(attempts) ? attempts : [];
  if (!rows.length) fail('REASONING_TASK_ATTEMPTS_REQUIRED');

  const byFamily = new Map();
  let rawCorrect = 0;
  let completionTotal = 0;
  let completionCount = 0;
  const normalizedAttempts = rows.map((attempt, index) => {
    const family = requiredText(attempt.family, 'REASONING_TASK_FAMILY_REQUIRED', 80);
    if (!REASONING_TASK_FAMILIES.includes(family)) fail('REASONING_TASK_FAMILY_NOT_ADMITTED', { family });
    if (typeof attempt.correct !== 'boolean') fail('REASONING_TASK_CORRECT_BOOLEAN_REQUIRED', { index });
    const completionTime = attempt.completionTime === undefined || attempt.completionTime === null ? null : Number(attempt.completionTime);
    if (completionTime !== null && (!finite(completionTime) || completionTime < 0)) fail('REASONING_TASK_COMPLETION_TIME_INVALID', { index });
    if (!byFamily.has(family)) byFamily.set(family, { attempted: 0, correct: 0 });
    const bucket = byFamily.get(family);
    bucket.attempted += 1;
    if (attempt.correct) { bucket.correct += 1; rawCorrect += 1; }
    if (completionTime !== null) { completionTotal += completionTime; completionCount += 1; }
    return { taskId: requiredText(attempt.taskId || `TASK-${index + 1}`, 'REASONING_TASK_ID_REQUIRED', 120), family, correct: attempt.correct, completionTime };
  });

  const taskFamilyPerformance = [...byFamily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([family, stats]) => ({
    family, rawCorrect: stats.correct, rawAttempted: stats.attempted, rawAccuracy: round(stats.correct / stats.attempted, 4)
  }));
  const rawAttempted = normalizedAttempts.length;

  return deepFreeze({
    schemaVersion: REASONING_TASK_PERFORMANCE_SCHEMA,
    performanceId: `PRF-REASON-${person}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 160),
    participantRef: person,
    taskBankAuthorityRef,
    taskBankVersion,
    assessmentDate: date,
    rawCorrect,
    rawAttempted,
    taskFamilyPerformance,
    completionTime: completionCount ? round(completionTotal / completionCount, 2) : null,
    itemVersion: requiredText(itemVersion || taskBankVersion, 'REASONING_TASK_ITEM_VERSION_REQUIRED', 80),
    sourceClass: 'MEASURED_TASK_PERFORMANCE',
    attempts: normalizedAttempts,
    governance: {
      taskBankAuthorityState: taskBankAuthority.status,
      rawPerformanceIsIq: false,
      percentileCreated: false,
      cognitiveDiagnosisCreated: false,
      normingClaimCreated: false,
      selfRatedCognitiveProfileMerged: false
    }
  });
}

function inferValueType(value) {
  if (typeof value === 'number') return 'NUMBER';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'string') return 'TEXT';
  if (value && typeof value === 'object') return 'OBJECT';
  return 'LABEL';
}

export async function buildProfileSignalEnvelope(input = {}) {
  const sourceClass = assertProfileSourceClass(input.sourceClass);
  const participantRef = requiredText(input.participantRef, 'PROFILE_SIGNAL_PARTICIPANT_REQUIRED', 160);
  const sourceRef = requiredText(input.sourceRef, 'PROFILE_SIGNAL_SOURCE_REF_REQUIRED', 300);
  const domainId = requiredText(input.domainId, 'PROFILE_SIGNAL_DOMAIN_REQUIRED', 160);
  const facetId = input.facetId ? requiredText(input.facetId, 'PROFILE_SIGNAL_FACET_INVALID', 160) : undefined;
  const providerFamily = input.providerFamily ? requiredText(input.providerFamily, 'PROFILE_SIGNAL_PROVIDER_FAMILY_INVALID', 80) : undefined;
  if (providerFamily && !EXTERNAL_PROFILE_PROVIDER_FAMILIES.includes(providerFamily)) fail('PROFILE_SIGNAL_PROVIDER_FAMILY_NOT_ADMITTED');
  const valueType = input.valueType || inferValueType(input.value);
  if (!['NUMBER', 'TEXT', 'LABEL', 'OBJECT', 'BOOLEAN'].includes(valueType)) fail('PROFILE_SIGNAL_VALUE_TYPE_INVALID');
  const confidence = input.confidence || 'UNKNOWN';
  if (!['SELF_REPORTED', 'CUSTOMER_CONFIRMED', 'TASK_OBSERVED', 'EXTERNAL_RESULT_CONFIRMED', 'APPROXIMATE', 'UNKNOWN'].includes(confidence)) fail('PROFILE_SIGNAL_CONFIDENCE_INVALID');
  const assessmentDate = assertIsoDateOrNull(input.assessmentDate, 'PROFILE_SIGNAL_ASSESSMENT_DATE_INVALID');
  const precisionBoundary = Array.isArray(input.precisionBoundary) ? input.precisionBoundary.map(item => requiredText(item, 'PROFILE_SIGNAL_PRECISION_BOUNDARY_INVALID', 200)).slice(0, 20) : [];
  const provenance = normalizeProvenance(input.provenance, sourceRef);
  const semanticCore = {
    participantRef, sourceClass, sourceRef, providerFamily: providerFamily || null, domainId, facetId: facetId || null,
    value: clone(input.value), valueType, confidence, assessmentDate, validityWindow: input.validityWindow ? clone(input.validityWindow) : null,
    customerConfirmed: input.customerConfirmed === true, precisionBoundary, provenance
  };
  const semanticDigest = await sha256Stable(semanticCore);
  const profileSignalId = `PRF-SIG-${semanticDigest.slice(0, 24).toUpperCase()}`;
  const envelope = {
    schemaVersion: PROFILE_SIGNAL_SCHEMA,
    profileSignalId,
    participantRef,
    sourceClass,
    sourceRef,
    ...(providerFamily ? { providerFamily } : {}),
    domainId,
    ...(facetId ? { facetId } : {}),
    value: clone(input.value),
    valueType,
    confidence,
    assessmentDate,
    ...(input.validityWindow ? { validityWindow: clone(input.validityWindow) } : {}),
    customerConfirmed: input.customerConfirmed === true,
    precisionBoundary,
    provenance,
    governance: {
      commonTranslationEnvelopeOnly: true,
      newPersonalityTruthAuthorityCreated: false,
      sourceClassErased: false,
      crossSourceProofCreated: false,
      customerPublishableBeforePrfW12: false
    },
    semanticDigest
  };
  return deepFreeze(envelope);
}

export async function buildSelfAssessmentProfileSignals(result) {
  if (result?.schemaVersion !== SELF_ASSESSMENT_RESULT_SCHEMA) fail('PROFILE_SIGNAL_SELF_ASSESSMENT_RESULT_REQUIRED');
  const signals = [];
  for (const [domainId, value] of Object.entries(result.normalizedSelfReportIndex?.byDomain || {}).sort(([a], [b]) => a.localeCompare(b))) {
    signals.push(await buildProfileSignalEnvelope({
      participantRef: result.participantRef,
      sourceClass: 'CUSTOMER_SELF_REPORT',
      sourceRef: result.assessmentResultId,
      domainId,
      value,
      valueType: 'NUMBER',
      confidence: result.customerConfirmed ? 'CUSTOMER_CONFIRMED' : 'SELF_REPORTED',
      assessmentDate: result.assessmentDate,
      customerConfirmed: result.customerConfirmed,
      precisionBoundary: [...(result.uncertaintyFlags || []), 'SELF_REPORTED_INDEX_NOT_OBJECTIVE_TRAIT_SCORE'],
      provenance: [{ source: result.assessmentResultId, instrumentCode: result.instrumentCode, instrumentVersion: result.instrumentVersion }]
    }));
  }
  return deepFreeze(signals);
}

export async function buildExternalProfileSignals(profile) {
  if (profile?.schemaVersion !== EXTERNAL_PROFILE_INPUT_SCHEMA) fail('PROFILE_SIGNAL_EXTERNAL_PROFILE_INPUT_REQUIRED');
  const entries = Object.entries(profile.resultDimensions || {});
  const signals = [];
  if (!entries.length) {
    signals.push(await buildProfileSignalEnvelope({
      participantRef: profile.participantRef,
      sourceClass: 'EXTERNAL_PROFILE_RESULT',
      sourceRef: profile.externalProfileId,
      providerFamily: profile.providerFamily,
      domainId: `EXTERNAL_PROFILE::${profile.providerFamily}::RESULT_LABEL`,
      value: profile.resultLabel,
      valueType: 'LABEL',
      confidence: profile.resultPrecision === 'CONFIRMED' ? 'EXTERNAL_RESULT_CONFIRMED' : profile.resultPrecision,
      assessmentDate: profile.assessmentDate,
      customerConfirmed: profile.customerConfirmed,
      precisionBoundary: ['PROVIDER_RESULT_LABEL_ONLY', 'NO_CROSS_PROVIDER_EQUIVALENCE_ASSUMED'],
      provenance: profile.provenance
    }));
    return deepFreeze(signals);
  }
  for (const [dimensionId, value] of entries.sort(([a], [b]) => a.localeCompare(b))) {
    signals.push(await buildProfileSignalEnvelope({
      participantRef: profile.participantRef,
      sourceClass: 'EXTERNAL_PROFILE_RESULT',
      sourceRef: profile.externalProfileId,
      providerFamily: profile.providerFamily,
      domainId: `EXTERNAL_PROFILE::${profile.providerFamily}::${dimensionId}`,
      value,
      valueType: typeof value === 'number' ? 'NUMBER' : typeof value === 'string' ? 'LABEL' : 'OBJECT',
      confidence: profile.resultPrecision === 'CONFIRMED' ? 'EXTERNAL_RESULT_CONFIRMED' : profile.resultPrecision,
      assessmentDate: profile.assessmentDate,
      customerConfirmed: profile.customerConfirmed,
      precisionBoundary: ['PROVIDER_DIMENSION_SEMANTICS_PRESERVED', 'NO_CROSS_PROVIDER_EQUIVALENCE_ASSUMED'],
      provenance: profile.provenance
    }));
  }
  return deepFreeze(signals);
}

export async function buildReasoningPerformanceSignals(performance) {
  if (performance?.schemaVersion !== REASONING_TASK_PERFORMANCE_SCHEMA) fail('PROFILE_SIGNAL_REASONING_PERFORMANCE_REQUIRED');
  const signals = [];
  for (const family of performance.taskFamilyPerformance || []) {
    signals.push(await buildProfileSignalEnvelope({
      participantRef: performance.participantRef,
      sourceClass: 'MEASURED_TASK_PERFORMANCE',
      sourceRef: performance.performanceId,
      domainId: 'REASONING_TASK_PERFORMANCE',
      facetId: family.family,
      value: { rawCorrect: family.rawCorrect, rawAttempted: family.rawAttempted, rawAccuracy: family.rawAccuracy },
      valueType: 'OBJECT',
      confidence: 'TASK_OBSERVED',
      assessmentDate: performance.assessmentDate,
      customerConfirmed: true,
      precisionBoundary: ['RAW_TASK_PERFORMANCE_ONLY', 'NOT_IQ', 'NOT_PERCENTILE', 'NOT_COGNITIVE_DIAGNOSIS'],
      provenance: [{ source: performance.taskBankAuthorityRef, taskBankVersion: performance.taskBankVersion, performanceId: performance.performanceId }]
    }));
  }
  return deepFreeze(signals);
}

export function stableProfileSnapshot(value) {
  return stableStringify(value);
}
