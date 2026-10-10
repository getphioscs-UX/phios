import { clone, deepFreeze, sha256Stable, stableStringify } from '../interpretation-runtime/mir7-utils.js';
import { PROFILE_SIGNAL_SCHEMA, assertProfileSourceClass } from './profile-foundation-runtime.js';

export const PROFILE_REALITY_CORRELATION_SCHEMA = 'PHI-OS-PROFILE-CURRENT-REALITY-CORRELATION-v1';
export const CROSS_SOURCE_PERSPECTIVE_SCHEMA = 'PHI-OS-CROSS-SOURCE-PERSPECTIVE-IR-v1';
export const RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA = 'PHI-OS-RELATIONSHIP-PROFILE-EVIDENCE-IR-v1';
export const CROSS_SOURCE_RULE_REGISTRY_SCHEMA = 'PHI-OS-CROSS-SOURCE-TRANSLATION-RULE-REGISTRY-v1.0.0';
export const RELATIONSHIP_PROFILE_RULE_REGISTRY_SCHEMA = 'PHI-OS-RELATIONSHIP-PROFILE-COMPARISON-RULE-REGISTRY-v1.0.0';
export const ACADEMIC_BRIDGE_REGISTRY_SCHEMA = 'PHI-OS-ACADEMIC-BRIDGE-REGISTRY-v1.0.0';

export const PROFILE_REALITY_STATES = Object.freeze([
  'CURRENTLY_RESONANT',
  'PARTIALLY_RESONANT',
  'CURRENTLY_NOT_RESONANT',
  'OPEN'
]);

export const CROSS_SOURCE_GROUPS = Object.freeze([
  'SOURCE_ALIGNED',
  'SOURCE_COMPLEMENTARY',
  'SOURCE_TENSION',
  'SOURCE_CONTRADICTION',
  'CURRENTLY_SUPPORTED',
  'CURRENTLY_CONTRADICTED',
  'OPEN'
]);

export const RELATIONSHIP_PROFILE_CLASSES = Object.freeze([
  'SIMILAR_SELF_REPORTED_TENDENCY',
  'DIFFERENT_SELF_REPORTED_TENDENCY',
  'COMPLEMENTARY_PATTERN',
  'POTENTIAL_FRICTION_TARGET',
  'COMMUNICATION_OBSERVATION_TARGET',
  'OPEN'
]);

const REALITY_OBSERVATION_SCHEMA = 'PHI-OS-CURRENT-REALITY-OBSERVATION-v1';
const RELATIONSHIP_INTENT_SCHEMA = 'PHI-OS-RELATIONSHIP-INTENT-v1.0.0';
const PROFILE_REALITY_STATE_SET = new Set(PROFILE_REALITY_STATES);
const CROSS_SOURCE_GROUP_SET = new Set(CROSS_SOURCE_GROUPS);
const RELATIONSHIP_PROFILE_CLASS_SET = new Set(RELATIONSHIP_PROFILE_CLASSES);
const PROHIBITED_RELATIONSHIP_FIELDS = new Set([
  'compatibilityScore',
  'compatibilityPercentage',
  'matchPercentage',
  'soulmate',
  'destinedVerdict',
  'partnerHiddenState',
  'partnerHiddenFeeling',
  'relationshipFailurePrediction',
  'stayLeaveDirective'
]);

const fail = (code, details = null) => {
  const error = new Error(code);
  error.code = code;
  if (details !== null) error.details = details;
  throw error;
};

const cleanText = (value, max = 500) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
};

const requiredText = (value, code, max = 500) => {
  const text = cleanText(value, max);
  if (!text) fail(code);
  return text;
};

const list = value => Array.isArray(value) ? value : [];
const uniqueStrings = (value, code, max = 300) => [...new Set(list(value).map(item => requiredText(item, code, max)))];
const isIsoLikeDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && !Number.isNaN(Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value));

function assertNoProhibitedRelationshipFields(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_RELATIONSHIP_FIELDS.has(key)) fail('PRF_W9_PROHIBITED_RELATIONSHIP_FIELD', { path: `${path}.${key}` });
    assertNoProhibitedRelationshipFields(child, `${path}.${key}`);
  }
}

function normalizeProfileSignals(profileSignals) {
  const signals = list(profileSignals);
  const byId = new Map();
  for (const signal of signals) {
    if (signal?.schemaVersion !== PROFILE_SIGNAL_SCHEMA) fail('PROFILE_SIGNAL_ENVELOPE_V1_REQUIRED');
    assertProfileSourceClass(signal.sourceClass);
    if (!signal.profileSignalId || byId.has(signal.profileSignalId)) fail('PROFILE_SIGNAL_ID_UNIQUE_REQUIRED');
    byId.set(signal.profileSignalId, signal);
  }
  return { signals, byId };
}

function realityObservationMap(currentRealityIr) {
  if (currentRealityIr?.schemaVersion !== REALITY_OBSERVATION_SCHEMA) fail('CURRENT_REALITY_OBSERVATION_IR_V1_REQUIRED');
  const observations = list(currentRealityIr.observations);
  const byId = new Map();
  for (const observation of observations) {
    const id = requiredText(observation?.observationId, 'CURRENT_REALITY_OBSERVATION_ID_REQUIRED', 180);
    if (byId.has(id)) fail('CURRENT_REALITY_OBSERVATION_ID_UNIQUE_REQUIRED');
    if (observation?.source !== 'CUSTOMER' || observation?.confidence !== 'SELF_REPORTED') fail('CURRENT_REALITY_CUSTOMER_SELF_REPORT_REQUIRED');
    byId.set(id, observation);
  }
  return byId;
}

function freshnessDisclosure(signal, asOfDate) {
  const assessmentDate = signal.assessmentDate ?? null;
  const validityWindow = signal.validityWindow && typeof signal.validityWindow === 'object' ? clone(signal.validityWindow) : null;
  let state = assessmentDate ? 'DATED_NO_VALIDITY_WINDOW' : 'UNDATED';
  if (validityWindow) {
    const start = validityWindow.start ?? validityWindow.validFrom ?? null;
    const end = validityWindow.end ?? validityWindow.validUntil ?? null;
    const asOfMs = isIsoLikeDate(asOfDate) ? Date.parse(asOfDate.length === 10 ? `${asOfDate}T00:00:00Z` : asOfDate) : null;
    const startMs = isIsoLikeDate(start) ? Date.parse(start.length === 10 ? `${start}T00:00:00Z` : start) : null;
    const endMs = isIsoLikeDate(end) ? Date.parse(end.length === 10 ? `${end}T00:00:00Z` : end) : null;
    if (asOfMs !== null && endMs !== null && asOfMs > endMs) state = 'VALIDITY_WINDOW_EXPIRED';
    else if (asOfMs !== null && startMs !== null && asOfMs < startMs) state = 'VALIDITY_WINDOW_NOT_STARTED';
    else if (asOfMs !== null && (startMs !== null || endMs !== null)) state = 'VALIDITY_WINDOW_ACTIVE';
    else state = 'VALIDITY_WINDOW_DECLARED';
  }
  return deepFreeze({ assessmentDate, asOfDate: isIsoLikeDate(asOfDate) ? asOfDate : null, validityWindow, state, dateDisclosureRequired: true });
}

export async function buildProfileCurrentRealityCorrelation({ profileSignals = [], currentRealityIr, responses = [], asOfDate = null } = {}) {
  const { signals, byId } = normalizeProfileSignals(profileSignals);
  if (!signals.length) fail('PROFILE_REALITY_PROFILE_SIGNAL_REQUIRED');
  const participantRefs = [...new Set(signals.map(signal => signal.participantRef))];
  if (participantRefs.length !== 1) fail('PROFILE_REALITY_SINGLE_PARTICIPANT_SCOPE_REQUIRED', { participantRefs });
  const participantRef = participantRefs[0];
  const observationById = realityObservationMap(currentRealityIr);
  if (asOfDate !== null && !isIsoLikeDate(asOfDate)) fail('PROFILE_REALITY_AS_OF_DATE_INVALID');

  const responseBySignal = new Map();
  for (const raw of list(responses)) {
    const profileSignalId = requiredText(raw?.profileSignalId, 'PROFILE_REALITY_SIGNAL_REF_REQUIRED', 180);
    if (!byId.has(profileSignalId)) fail('PROFILE_REALITY_SIGNAL_REF_UNKNOWN', { profileSignalId });
    if (responseBySignal.has(profileSignalId)) fail('PROFILE_REALITY_ONE_RESPONSE_PER_SIGNAL_REQUIRED', { profileSignalId });
    const state = requiredText(raw?.state, 'PROFILE_REALITY_STATE_REQUIRED', 80).toUpperCase();
    if (!PROFILE_REALITY_STATE_SET.has(state)) fail('PROFILE_REALITY_STATE_INVALID', { state });
    const observationRefs = uniqueStrings(raw?.observationRefs, 'PROFILE_REALITY_OBSERVATION_REF_INVALID', 180);
    for (const ref of observationRefs) if (!observationById.has(ref)) fail('PROFILE_REALITY_OBSERVATION_REF_UNKNOWN', { ref });
    responseBySignal.set(profileSignalId, {
      state,
      observationRefs,
      customerNote: cleanText(raw?.customerNote, 500) || null
    });
  }

  const correlations = [];
  for (const signal of signals) {
    const response = responseBySignal.get(signal.profileSignalId) ?? { state: 'OPEN', observationRefs: [], customerNote: null };
    const semanticCore = {
      profileSignalRef: signal.profileSignalId,
      participantRef: signal.participantRef,
      sourceClass: signal.sourceClass,
      state: response.state,
      observationRefs: response.observationRefs,
      customerNote: response.customerNote,
      assessmentDate: signal.assessmentDate ?? null,
      asOfDate: asOfDate ?? null
    };
    const digest = await sha256Stable(semanticCore);
    correlations.push(deepFreeze({
      correlationId: `PRF-RC-${digest.slice(0, 24).toUpperCase()}`,
      profileSignalRef: signal.profileSignalId,
      participantRef: signal.participantRef,
      sourceClass: signal.sourceClass,
      state: response.state,
      observationRefs: deepFreeze([...response.observationRefs]),
      customerNote: response.customerNote,
      basis: 'EXPLICIT_CUSTOMER_COMPARISON',
      freshness: freshnessDisclosure(signal, asOfDate),
      governance: deepFreeze({
        customerControlled: true,
        automaticSemanticMatching: false,
        currentRealityMayContextualizeSignal: true,
        currentRealityMayContradictSignal: true,
        currentRealityProvesProfileModel: false,
        currentRealityDisprovesProfileModel: false,
        profileSignalRewritten: false,
        objectivePersonalityFactCreated: false
      }),
      semanticDigest: digest
    }));
  }

  const semanticDigest = await sha256Stable(correlations.map(item => ({
    profileSignalRef: item.profileSignalRef,
    state: item.state,
    observationRefs: item.observationRefs,
    semanticDigest: item.semanticDigest
  })));

  return deepFreeze({
    schemaVersion: PROFILE_REALITY_CORRELATION_SCHEMA,
    participantRef,
    asOfDate: asOfDate ?? null,
    allowedStates: PROFILE_REALITY_STATES,
    correlations: deepFreeze(correlations),
    governance: deepFreeze({
      explicitCustomerComparisonOnly: true,
      automaticSemanticMatching: false,
      unansweredRemainsOpen: true,
      assessmentDateDisclosureRequired: true,
      profileModelTruthConversionAllowed: false,
      customerPublishableBeforePrfW12: false
    }),
    semanticDigest
  });
}

function requireAdmittedRule(registry, expectedSchema, ruleId, codePrefix) {
  if (registry?.schemaVersion !== expectedSchema) fail(`${codePrefix}_RULE_REGISTRY_REQUIRED`);
  const rule = list(registry.rules).find(item => item.ruleId === ruleId);
  if (!rule) fail(`${codePrefix}_RULE_NOT_FOUND`, { ruleId });
  if (rule.status !== 'ADMITTED') fail(`${codePrefix}_RULE_NOT_ADMITTED`, { ruleId, status: rule.status });
  return rule;
}

function validateRuleSourceClasses(rule, sourceClasses, codePrefix) {
  const allowed = new Set(list(rule.allowedSourceClasses));
  for (const sourceClass of sourceClasses) if (!allowed.has(sourceClass)) fail(`${codePrefix}_SOURCE_CLASS_NOT_ALLOWED_BY_RULE`, { sourceClass, ruleId: rule.ruleId });
  const minimum = Number.isInteger(rule.minimumDistinctSourceClasses) ? rule.minimumDistinctSourceClasses : 1;
  if (new Set(sourceClasses).size < minimum) fail(`${codePrefix}_DISTINCT_SOURCE_CLASS_MINIMUM_NOT_MET`, { minimum, sourceClasses });
}

export async function buildCrossSourcePerspective({ profileSignals = [], profileRealityCorrelation = null, comparisons = [], translationRuleRegistry } = {}) {
  const { byId: signalById } = normalizeProfileSignals(profileSignals);
  const realityById = new Map();
  if (profileRealityCorrelation !== null) {
    if (profileRealityCorrelation?.schemaVersion !== PROFILE_REALITY_CORRELATION_SCHEMA) fail('PRF_W8_PROFILE_REALITY_CORRELATION_REQUIRED');
    for (const correlation of list(profileRealityCorrelation.correlations)) realityById.set(correlation.correlationId, correlation);
  }

  const perspectives = [];
  const seenIds = new Set();
  for (let index = 0; index < list(comparisons).length; index += 1) {
    const raw = comparisons[index];
    const ruleId = requiredText(raw?.ruleId, 'PRF_W8_RULE_ID_REQUIRED', 180);
    const rule = requireAdmittedRule(translationRuleRegistry, CROSS_SOURCE_RULE_REGISTRY_SCHEMA, ruleId, 'PRF_W8');
    const group = requiredText(raw?.group, 'PRF_W8_GROUP_REQUIRED', 80).toUpperCase();
    if (!CROSS_SOURCE_GROUP_SET.has(group) || !list(rule.allowedGroups).includes(group)) fail('PRF_W8_GROUP_NOT_ALLOWED_BY_RULE', { group, ruleId });
    const topicId = requiredText(raw?.topicId, 'PRF_W8_TOPIC_ID_REQUIRED', 180);
    const signalRefs = uniqueStrings(raw?.signalRefs, 'PRF_W8_SIGNAL_REF_INVALID', 180);
    const realityCorrelationRefs = uniqueStrings(raw?.realityCorrelationRefs, 'PRF_W8_REALITY_CORRELATION_REF_INVALID', 180);
    const signals = signalRefs.map(ref => {
      const signal = signalById.get(ref);
      if (!signal) fail('PRF_W8_SIGNAL_REF_UNKNOWN', { ref });
      return signal;
    });
    const realityCorrelations = realityCorrelationRefs.map(ref => {
      const correlation = realityById.get(ref);
      if (!correlation) fail('PRF_W8_REALITY_CORRELATION_REF_UNKNOWN', { ref });
      return correlation;
    });

    if (rule.requiresExplicitComparison === true && raw?.explicitComparison !== true) fail('PRF_W8_EXPLICIT_COMPARISON_REQUIRED');
    if (rule.requiresProfileRealityCorrelation === true && !realityCorrelations.length) fail('PRF_W8_REALITY_CORRELATION_REQUIRED_BY_RULE');
    if (group.startsWith('SOURCE_') && signalRefs.length < 2) fail('PRF_W8_SOURCE_GROUP_REQUIRES_TWO_SIGNALS');
    if (group.startsWith('CURRENTLY_') && !realityCorrelations.length) fail('PRF_W8_CURRENT_GROUP_REQUIRES_REALITY_CORRELATION');
    if (group === 'CURRENTLY_SUPPORTED' && realityCorrelations.some(item => !['CURRENTLY_RESONANT', 'PARTIALLY_RESONANT'].includes(item.state))) fail('PRF_W8_SUPPORTED_GROUP_REALITY_STATE_MISMATCH');
    if (group === 'CURRENTLY_CONTRADICTED' && realityCorrelations.some(item => item.state !== 'CURRENTLY_NOT_RESONANT')) fail('PRF_W8_CONTRADICTED_GROUP_REALITY_STATE_MISMATCH');
    if (group === 'OPEN' && realityCorrelations.length && realityCorrelations.some(item => item.state !== 'OPEN')) fail('PRF_W8_OPEN_GROUP_REALITY_STATE_MISMATCH');
    if (realityCorrelations.length && realityCorrelations.some(item => !signalRefs.includes(item.profileSignalRef))) fail('PRF_W8_REALITY_CORRELATION_SIGNAL_SCOPE_MISMATCH');
    if (!signalRefs.length && !realityCorrelations.length) fail('PRF_W8_EVIDENCE_REF_REQUIRED');

    const sourceClasses = [...new Set(signals.map(signal => signal.sourceClass))].sort();
    if (signalRefs.length) validateRuleSourceClasses(rule, sourceClasses, 'PRF_W8');
    const statement = requiredText(raw?.statement, 'PRF_W8_STATEMENT_REQUIRED', 900);
    const semanticCore = { ruleId, group, topicId, signalRefs: [...signalRefs].sort(), realityCorrelationRefs: [...realityCorrelationRefs].sort(), statement };
    const digest = await sha256Stable(semanticCore);
    const crossSourcePerspectiveId = raw?.crossSourcePerspectiveId
      ? requiredText(raw.crossSourcePerspectiveId, 'PRF_W8_PERSPECTIVE_ID_INVALID', 180)
      : `PRF-XSP-${digest.slice(0, 24).toUpperCase()}`;
    if (seenIds.has(crossSourcePerspectiveId)) fail('PRF_W8_PERSPECTIVE_ID_UNIQUE_REQUIRED');
    seenIds.add(crossSourcePerspectiveId);

    perspectives.push(deepFreeze({
      crossSourcePerspectiveId,
      ruleId,
      group,
      topicId,
      statement,
      signalRefs: deepFreeze(signalRefs),
      sourceClasses: deepFreeze(sourceClasses),
      realityCorrelationRefs: deepFreeze(realityCorrelationRefs),
      provenance: deepFreeze({
        profileSignalRefs: signalRefs,
        profileRealityCorrelationRefs: realityCorrelationRefs,
        translationRuleRef: rule.sourceRef ?? rule.ruleId
      }),
      governance: deepFreeze({
        explicitComparison: true,
        sourceClassesPreserved: true,
        sourceOriginErased: false,
        automaticSemanticMatching: false,
        consensusTruthCreated: false,
        scientificValidationCreated: false,
        symbolicMethodProven: false,
        objectivePersonalityFactCreated: false,
        customerPublishableBeforePrfW12: false
      }),
      semanticDigest: digest
    }));
  }

  const groupIndex = Object.fromEntries(CROSS_SOURCE_GROUPS.map(group => [group, perspectives.filter(item => item.group === group).map(item => item.crossSourcePerspectiveId)]));
  const semanticDigest = await sha256Stable(perspectives.map(item => item.semanticDigest));
  return deepFreeze({
    schemaVersion: CROSS_SOURCE_PERSPECTIVE_SCHEMA,
    perspectives: deepFreeze(perspectives),
    groupIndex: deepFreeze(groupIndex),
    governance: deepFreeze({
      sourceClassesAlwaysPreserved: true,
      sourceConvergenceIsProof: false,
      symbolicScientificValidationAllowed: false,
      disagreementMayRemainVisible: true,
      openMayRemainOpen: true,
      customerPublishableBeforePrfW12: false
    }),
    semanticDigest
  });
}

function satisfiesRelationshipRule(rule, signalA, signalB) {
  if (signalA.sourceClass !== signalB.sourceClass) fail('PRF_W9_CROSS_SOURCE_PARTNER_COMPARISON_NOT_ADMITTED');
  if (rule.sourceClass !== signalA.sourceClass) fail('PRF_W9_RULE_SOURCE_CLASS_MISMATCH');
  if (rule.requiresSameDomain === true && signalA.domainId !== signalB.domainId) fail('PRF_W9_SAME_DOMAIN_REQUIRED');
  if (rule.requiresSameFacet === true && (signalA.facetId ?? null) !== (signalB.facetId ?? null)) fail('PRF_W9_SAME_FACET_REQUIRED');
  if (rule.requiresSameProviderFamily === true && (signalA.providerFamily ?? null) !== (signalB.providerFamily ?? null)) fail('PRF_W9_SAME_PROVIDER_FAMILY_REQUIRED');
}

export async function buildRelationshipProfileEvidence({ relationshipIntent, participantARef, participantBRef, profileSignals = [], comparisons = [], comparisonRuleRegistry } = {}) {
  assertNoProhibitedRelationshipFields({ relationshipIntent, comparisons });
  if (relationshipIntent?.schemaVersion !== RELATIONSHIP_INTENT_SCHEMA) fail('PRF_W9_RELATIONSHIP_INTENT_V1_REQUIRED');
  if (relationshipIntent.mode !== 'SPECIFIC_PERSON_RELATIONSHIP' || relationshipIntent.participantBRequired !== true) fail('PRF_W9_SPECIFIC_PERSON_RELATIONSHIP_REQUIRED');
  const aRef = requiredText(participantARef, 'PRF_W9_PARTICIPANT_A_REQUIRED', 180);
  const bRef = requiredText(participantBRef, 'PRF_W9_PARTICIPANT_B_REQUIRED', 180);
  if (aRef === bRef) fail('PRF_W9_DISTINCT_PARTICIPANTS_REQUIRED');
  if (relationshipIntent.participantARef !== aRef) fail('PRF_W9_PARTICIPANT_A_INTENT_MISMATCH');

  const { byId: signalById } = normalizeProfileSignals(profileSignals);
  const evidence = [];
  for (const raw of list(comparisons)) {
    const ruleId = requiredText(raw?.ruleId, 'PRF_W9_RULE_ID_REQUIRED', 180);
    const rule = requireAdmittedRule(comparisonRuleRegistry, RELATIONSHIP_PROFILE_RULE_REGISTRY_SCHEMA, ruleId, 'PRF_W9');
    const comparisonClass = requiredText(raw?.comparisonClass, 'PRF_W9_COMPARISON_CLASS_REQUIRED', 100).toUpperCase();
    if (!RELATIONSHIP_PROFILE_CLASS_SET.has(comparisonClass) || !list(rule.allowedClasses).includes(comparisonClass)) fail('PRF_W9_COMPARISON_CLASS_NOT_ALLOWED_BY_RULE', { comparisonClass, ruleId });
    if (rule.requiresExplicitComparison === true && raw?.explicitComparison !== true) fail('PRF_W9_EXPLICIT_COMPARISON_REQUIRED');
    const signalARef = requiredText(raw?.signalARef, 'PRF_W9_SIGNAL_A_REF_REQUIRED', 180);
    const signalBRef = requiredText(raw?.signalBRef, 'PRF_W9_SIGNAL_B_REF_REQUIRED', 180);
    const signalA = signalById.get(signalARef);
    const signalB = signalById.get(signalBRef);
    if (!signalA || !signalB) fail('PRF_W9_PROFILE_SIGNAL_REF_UNKNOWN');
    if (signalA.participantRef !== aRef || signalB.participantRef !== bRef) fail('PRF_W9_PROFILE_SIGNAL_PARTICIPANT_SCOPE_MISMATCH');
    satisfiesRelationshipRule(rule, signalA, signalB);
    const topicId = requiredText(raw?.topicId || signalA.domainId, 'PRF_W9_TOPIC_ID_REQUIRED', 180);
    const statement = requiredText(raw?.statement, 'PRF_W9_STATEMENT_REQUIRED', 900);
    const semanticCore = { relationshipIntentId: relationshipIntent.relationshipIntentId, ruleId, comparisonClass, topicId, signalARef, signalBRef, statement };
    const digest = await sha256Stable(semanticCore);
    evidence.push(deepFreeze({
      relationshipProfileEvidenceId: `PRF-REL-${digest.slice(0, 24).toUpperCase()}`,
      relationshipIntentId: relationshipIntent.relationshipIntentId,
      ruleId,
      comparisonClass,
      topicId,
      statement,
      participants: deepFreeze({
        A: { participantRef: aRef, signalRef: signalARef, sourceClass: signalA.sourceClass },
        B: { participantRef: bRef, signalRef: signalBRef, sourceClass: signalB.sourceClass }
      }),
      sourceClass: signalA.sourceClass,
      providerFamily: signalA.providerFamily ?? null,
      claimStrength: comparisonClass === 'OPEN' ? 'OPEN' : 'OBSERVATION_TARGET',
      governance: deepFreeze({
        profileEvidenceLaneSeparateFromRelW4: true,
        explicitComparison: true,
        compatibilityScoreCreated: false,
        partnerHiddenStateInferred: false,
        relationshipFailurePredicted: false,
        stayLeaveDirectiveCreated: false,
        objectiveRelationshipFactCreated: false,
        crossSourcePartnerComparisonCreated: false,
        customerPublishableBeforePrfW12: false
      }),
      semanticDigest: digest
    }));
  }

  const semanticDigest = await sha256Stable(evidence.map(item => item.semanticDigest));
  return deepFreeze({
    schemaVersion: RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA,
    relationshipIntentId: relationshipIntent.relationshipIntentId,
    participants: deepFreeze({ A: aRef, B: bRef }),
    evidence: deepFreeze(evidence),
    governance: deepFreeze({
      separateEvidenceLane: true,
      relW4MethodCompositionUntouched: true,
      admittedComparisonRulesOnly: true,
      compatibilityScoreAllowed: false,
      partnerHiddenStateInferenceAllowed: false,
      relationshipOutcomePredictionAllowed: false,
      customerPublishableBeforePrfW12: false
    }),
    semanticDigest
  });
}

export function assertAcademicBridgeRegistry(registry) {
  if (registry?.schemaVersion !== ACADEMIC_BRIDGE_REGISTRY_SCHEMA) fail('PRF_W10_ACADEMIC_BRIDGE_REGISTRY_REQUIRED');
  const priorities = list(registry.instruments).map(item => item.priority);
  for (const priority of ['P1', 'P2', 'P3', 'P4']) if (!priorities.includes(priority)) fail('PRF_W10_ACADEMIC_BRIDGE_PRIORITY_REQUIRED', { priority });
  for (const entry of list(registry.instruments)) {
    requiredText(entry.instrumentFamily, 'PRF_W10_INSTRUMENT_FAMILY_REQUIRED', 180);
    assertProfileSourceClass(entry.sourceClass);
    requiredText(entry.licenseUsageStatus, 'PRF_W10_LICENSE_STATUS_REQUIRED', 180);
    requiredText(entry.scoringAuthority, 'PRF_W10_SCORING_AUTHORITY_REQUIRED', 180);
    requiredText(entry.normingStatus, 'PRF_W10_NORMING_STATUS_REQUIRED', 180);
    requiredText(entry.customerClaimBoundary, 'PRF_W10_CUSTOMER_BOUNDARY_REQUIRED', 700);
    requiredText(entry.relationshipUseBoundary, 'PRF_W10_RELATIONSHIP_BOUNDARY_REQUIRED', 700);
    requiredText(entry.professionalUseBoundary, 'PRF_W10_PROFESSIONAL_BOUNDARY_REQUIRED', 700);
    if (entry.customerAvailability === 'AVAILABLE' && entry.admissionState !== 'ADMITTED') fail('PRF_W10_AVAILABLE_REQUIRES_ADMITTED');
  }
  return registry;
}

export function stableProfileContextSnapshot(value) {
  return stableStringify(value);
}
