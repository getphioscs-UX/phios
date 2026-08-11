import crypto from 'node:crypto';

export const CANONICAL_JOURNEY_STAGES = Object.freeze([
  'entry', 'orientation', 'reading', 'reconstruction', 'navigation', 'review', 'continuity', 'closed'
]);

const STAGE_SET = new Set(CANONICAL_JOURNEY_STAGES);
const REF_ONLY_CONTEXT_FIELDS = Object.freeze([
  'canonicalRealityReferences', 'meaningReferences', 'knowledgeReferences',
  'readoutReferences', 'publishedAssetReferences', 'previousStateReferences'
]);
const ALLOWED_WORKFLOW_STEPS = new Set([
  'COLLECT_INPUT','COLLECT_CONSENT','ORIENT','READ','RECONSTRUCT','NAVIGATE','REVIEW','CONTINUE','CLOSE','PROFESSIONAL_HANDOFF','PAUSE'
]);
const FORBIDDEN_DECISION_KEYS = new Set([
  'realityTruth','professionalJudgment','lifeDecision','financialDecision','medicalDecision','legalDecision',
  'diagnosis','treatmentAdvice','navigationDecision','identityTruth'
]);

const clone = value => structuredClone(value);
const required = (value, code) => {
  const v = String(value ?? '').trim();
  if (!v) throw new Error(code);
  return v;
};
const uniqueStrings = (values, code, { allowEmpty = true } = {}) => {
  if (!Array.isArray(values)) throw new Error(`${code}_ARRAY_REQUIRED`);
  const out = values.map(value => {
    if (typeof value !== 'string') throw new Error(`${code}_REFERENCE_STRING_REQUIRED`);
    const v = value.trim();
    if (!v) throw new Error(`${code}_REFERENCE_EMPTY`);
    return v;
  });
  if (new Set(out).size !== out.length) throw new Error(`${code}_DUPLICATE_REFERENCE`);
  if (!allowEmpty && !out.length) throw new Error(`${code}_REFERENCE_REQUIRED`);
  return out;
};
const deepAssertNoForbiddenDecision = (value, path = '$') => {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_DECISION_KEYS.has(key)) throw new Error(`JR_FORBIDDEN_DECISION_FIELD:${path}.${key}`);
    deepAssertNoForbiddenDecision(child, `${path}.${key}`);
  }
};
const deepFreeze = value => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};
export const stableDigest = value => {
  const stable = input => {
    if (Array.isArray(input)) return input.map(stable);
    if (input && typeof input === 'object') return Object.fromEntries(Object.keys(input).sort().map(k => [k, stable(input[k])]));
    return input;
  };
  return crypto.createHash('sha256').update(JSON.stringify(stable(value)), 'utf8').digest('hex');
};

export function normalizeJourneyStage(stage, compatibilityRegistry, mode = 'CANONICAL') {
  const raw = required(stage, 'JR_STAGE_REQUIRED');
  if (mode === 'CANONICAL') {
    if (!STAGE_SET.has(raw)) throw new Error(`JR_STAGE_UNKNOWN:${raw}`);
    return raw;
  }
  if (mode === 'LEGACY_M3C') {
    const mapped = compatibilityRegistry?.legacyM3cStageMappings?.[raw];
    if (!mapped || !STAGE_SET.has(mapped)) throw new Error(`JR_LEGACY_M3C_STAGE_UNREGISTERED:${raw}`);
    return mapped;
  }
  if (mode === 'LEGACY_PDS_SHELL') {
    const mapped = compatibilityRegistry?.legacyPdsShellMappings?.[raw];
    if (!mapped || !STAGE_SET.has(mapped)) throw new Error(`JR_LEGACY_PDS_STAGE_UNREGISTERED:${raw}`);
    return mapped;
  }
  throw new Error(`JR_STAGE_MODE_UNKNOWN:${mode}`);
}

export function buildJourneyContext(input = {}) {
  const source = clone(input);
  const keys = Object.keys(source);
  for (const key of keys) if (!REF_ONLY_CONTEXT_FIELDS.includes(key)) throw new Error(`JR_CONTEXT_INLINE_OR_UNKNOWN_FIELD:${key}`);
  const out = {};
  for (const field of REF_ONLY_CONTEXT_FIELDS) out[field] = uniqueStrings(source[field] ?? [], `JR_CONTEXT_${field.toUpperCase()}`);
  return deepFreeze(out);
}

export function assertCanonicalJourney(journey, stageRegistry, rdgPurposeRegistry) {
  deepAssertNoForbiddenDecision(journey);
  if (!journey || typeof journey !== 'object') throw new Error('JR_JOURNEY_REQUIRED');
  if (journey.schemaVersion !== 'phi-os.canonical-journey.v2') throw new Error('JR_SCHEMA_VERSION_INVALID');
  required(journey.journeyId, 'JR_JOURNEY_ID_REQUIRED');
  required(journey.customerReference, 'JR_CUSTOMER_REFERENCE_REQUIRED');
  const stages = stageRegistry?.canonicalOrder ?? [];
  if (!stages.includes(journey.stage)) throw new Error(`JR_STAGE_UNKNOWN:${journey.stage}`);
  const purposeCodes = new Set(rdgPurposeRegistry?.purposeCodes ?? []);
  if (!purposeCodes.has(journey.dataPurpose)) throw new Error(`JR_DATA_PURPOSE_NOT_GOVERNED:${journey.dataPurpose}`);
  if (!['SERVICE_DELIVERY','RUNTIME_CONTINUITY','RUNTIME_RECOVERY'].includes(journey.dataPurpose)) throw new Error('JR_DATA_PURPOSE_OUTSIDE_JOURNEY_SCOPE');
  if (journey.realityReference != null && typeof journey.realityReference !== 'string') throw new Error('JR_REALITY_REFERENCE_STRING_REQUIRED');
  uniqueStrings(journey.readoutReferences ?? [], 'JR_READOUT');
  uniqueStrings(journey.consentReferences ?? [], 'JR_CONSENT');
  buildJourneyContext(journey.context);
  if (!journey.session || typeof journey.session !== 'object') throw new Error('JR_SESSION_REQUIRED');
  required(journey.session.sessionId, 'JR_SESSION_ID_REQUIRED');
  if (!['EPHEMERAL','SESSION','RECOVERY','RUNTIME'].includes(journey.session.persistenceClass)) throw new Error('JR_SESSION_PERSISTENCE_INVALID');
  if (!journey.progress || !Array.isArray(journey.progress.completedStages)) throw new Error('JR_PROGRESS_REQUIRED');
  uniqueStrings(journey.progress.completedStages, 'JR_PROGRESS_STAGE');
  for (const stage of journey.progress.completedStages) if (!stages.includes(stage)) throw new Error(`JR_PROGRESS_STAGE_UNKNOWN:${stage}`);
  return true;
}

export function evaluateJourneySafety(input = {}) {
  const signals = {
    emergencySignal: Boolean(input.emergencySignal),
    regulatedAdviceRequest: Boolean(input.regulatedAdviceRequest),
    missingRequiredConsent: Boolean(input.missingRequiredConsent),
    professionalEscalation: Boolean(input.professionalEscalation),
    dataPurposeViolation: Boolean(input.dataPurposeViolation)
  };
  let state = 'ALLOW'; let nextWorkflowStep = 'CONTINUE_WORKFLOW'; let blockingReasons = [];
  if (signals.emergencySignal) { state = 'ESCALATE'; nextWorkflowStep = 'PAUSE'; blockingReasons.push('EMERGENCY_SIGNAL'); }
  else if (signals.dataPurposeViolation) { state = 'BLOCK'; nextWorkflowStep = 'PAUSE'; blockingReasons.push('DATA_PURPOSE_VIOLATION'); }
  else if (signals.missingRequiredConsent) { state = 'BLOCK'; nextWorkflowStep = 'COLLECT_CONSENT'; blockingReasons.push('MISSING_REQUIRED_CONSENT'); }
  else if (signals.regulatedAdviceRequest) { state = 'ESCALATE'; nextWorkflowStep = 'PROFESSIONAL_HANDOFF'; blockingReasons.push('REGULATED_ADVICE_REQUEST'); }
  else if (signals.professionalEscalation) { state = 'ESCALATE'; nextWorkflowStep = 'PROFESSIONAL_HANDOFF'; blockingReasons.push('PROFESSIONAL_ESCALATION'); }
  return deepFreeze({ state, nextWorkflowStep, blockingReasons, explicitSignalsOnly: true, professionalResponsibilityCreated: false });
}

export function resolveJourneyPriority(input = {}) {
  deepAssertNoForbiddenDecision(input);
  const safety = input.safetyState ?? evaluateJourneySafety(input);
  const currentStage = required(input.currentStage, 'JR_PRIORITY_CURRENT_STAGE_REQUIRED');
  if (!STAGE_SET.has(currentStage)) throw new Error('JR_PRIORITY_STAGE_UNKNOWN');
  let priorityState = 'READY'; let nextRelevantWorkflowStep = input.nextCandidateWorkflowStep ?? null; const blockingReasons = [...(safety.blockingReasons ?? [])];
  if (safety.state === 'BLOCK') { priorityState = 'BLOCKED'; nextRelevantWorkflowStep = safety.nextWorkflowStep; }
  else if (safety.state === 'ESCALATE') { priorityState = 'ESCALATION_REQUIRED'; nextRelevantWorkflowStep = safety.nextWorkflowStep; }
  else if (input.missingRequiredContext) { priorityState = 'WAITING_FOR_CONTEXT'; nextRelevantWorkflowStep = 'COLLECT_INPUT'; blockingReasons.push('MISSING_REQUIRED_CONTEXT'); }
  else if (currentStage === 'closed') { priorityState = 'COMPLETE'; nextRelevantWorkflowStep = 'CLOSE'; }
  if (nextRelevantWorkflowStep && !ALLOWED_WORKFLOW_STEPS.has(nextRelevantWorkflowStep) && nextRelevantWorkflowStep !== 'CONTINUE_WORKFLOW') throw new Error('JR_PRIORITY_WORKFLOW_STEP_INVALID');
  return deepFreeze({ priorityState, nextRelevantWorkflowStep, supportReferences: uniqueStrings(input.supportReferences ?? [], 'JR_PRIORITY_SUPPORT'), blockingReasons, realityTruthDecided: false, professionalJudgmentCreated: false });
}

export function buildBoundedReadingPath(authorityPath, { maxNodeReferences = 7, maxBlockReferences = 12 } = {}) {
  if (!authorityPath || typeof authorityPath !== 'object') throw new Error('JR_READING_PATH_AUTHORITY_REQUIRED');
  if (authorityPath.publishedOnly === false) throw new Error('JR_READING_PATH_UNPUBLISHED_FORBIDDEN');
  const pathReference = required(authorityPath.pathCode ?? authorityPath.catalogPathCode, 'JR_READING_PATH_REFERENCE_REQUIRED');
  const nodes = uniqueStrings(authorityPath.nodeCodes ?? (authorityPath.nodeCode ? [authorityPath.nodeCode] : []), 'JR_READING_PATH_NODE').slice(0, maxNodeReferences);
  const blocks = uniqueStrings(authorityPath.blockCodes ?? [], 'JR_READING_PATH_BLOCK').slice(0, maxBlockReferences);
  if (!nodes.length && !blocks.length) throw new Error('JR_READING_PATH_EMPTY');
  return deepFreeze({
    pathReference, locale: authorityPath.locale ?? null, purpose: authorityPath.purpose ?? 'published_reading_path',
    nodeReferences: nodes, blockReferences: blocks, bounded: true,
    terminationReason: ((authorityPath.nodeCodes?.length ?? (authorityPath.nodeCode ? 1 : 0)) > maxNodeReferences || (authorityPath.blockCodes?.length ?? 0) > maxBlockReferences) ? 'AUTHORITY_PATH_TRUNCATED_TO_BOUND' : 'AUTHORITY_PATH_END'
  });
}

export function deriveJourneyProgress({ completionEvents = [], currentStage = null, compatibilityMode = 'CANONICAL' } = {}, compatibilityRegistry = null) {
  if (!Array.isArray(completionEvents)) throw new Error('JR_PROGRESS_EVENTS_ARRAY_REQUIRED');
  const completedStages = [];
  for (const event of completionEvents) {
    if (!event || event.completed !== true) throw new Error('JR_PROGRESS_REQUIRES_COMPLETION_EVENT');
    required(event.eventReference, 'JR_PROGRESS_EVENT_REFERENCE_REQUIRED');
    if (event.pageVisit === true || event.routeLoad === true) throw new Error('JR_PROGRESS_PAGE_VISIT_NOT_COMPLETION');
    const stage = normalizeJourneyStage(event.stage, compatibilityRegistry, compatibilityMode === 'CANONICAL' ? 'CANONICAL' : compatibilityMode);
    if (!completedStages.includes(stage)) completedStages.push(stage);
  }
  if (compatibilityMode === 'CANONICAL') {
    const ordinals = completedStages.map(stage => CANONICAL_JOURNEY_STAGES.indexOf(stage));
    for (let i = 1; i < ordinals.length; i++) if (ordinals[i] <= ordinals[i-1]) throw new Error('JR_PROGRESS_CANONICAL_ORDER_INVALID');
  }
  const stage = currentStage ? normalizeJourneyStage(currentStage, compatibilityRegistry, compatibilityMode === 'CANONICAL' ? 'CANONICAL' : compatibilityMode) : (completedStages.at(-1) ?? 'entry');
  return deepFreeze({ currentStage: stage, completedStages, completionCount: completedStages.length, canonicalStageCount: CANONICAL_JOURNEY_STAGES.length, completionRatio: completedStages.length / CANONICAL_JOURNEY_STAGES.length, lastCompletionReference: completionEvents.at(-1)?.eventReference ?? null, basedOnPageVisits: false });
}

export function buildProfessionalHandoffPackage(input = {}) {
  deepAssertNoForbiddenDecision(input);
  const out = {
    handoffId: required(input.handoffId, 'JR_HANDOFF_ID_REQUIRED'),
    journeyReference: required(input.journeyReference, 'JR_HANDOFF_JOURNEY_REQUIRED'),
    realityReferences: uniqueStrings(input.realityReferences ?? [], 'JR_HANDOFF_REALITY', {allowEmpty:false}),
    readoutReferences: uniqueStrings(input.readoutReferences ?? [], 'JR_HANDOFF_READOUT'),
    evidenceReferences: uniqueStrings(input.evidenceReferences ?? [], 'JR_HANDOFF_EVIDENCE'),
    unknownReferences: uniqueStrings(input.unknownReferences ?? [], 'JR_HANDOFF_UNKNOWN'),
    journeyContextReference: required(input.journeyContextReference, 'JR_HANDOFF_CONTEXT_REQUIRED'),
    customerQuestionReference: required(input.customerQuestionReference, 'JR_HANDOFF_QUESTION_REQUIRED'),
    consentReferences: uniqueStrings(input.consentReferences ?? [], 'JR_HANDOFF_CONSENT', {allowEmpty:false}),
    dataPurpose: input.dataPurpose ?? 'PROFESSIONAL_SERVICE',
    professionalEntitlementCreated: false,
    professionalAssignmentCreated: false,
    professionalResponsibilityCreated: false
  };
  if (out.dataPurpose !== 'PROFESSIONAL_SERVICE') throw new Error('JR_HANDOFF_PROFESSIONAL_PURPOSE_REQUIRED');
  return deepFreeze(out);
}

export function buildJourneyRecommendation(input = {}) {
  deepAssertNoForbiddenDecision(input);
  const safety = input.safetyState ?? evaluateJourneySafety(input);
  let step = input.nextWorkflowStep ?? null;
  if (safety.state !== 'ALLOW') step = safety.nextWorkflowStep;
  if (step === 'CONTINUE_WORKFLOW') step = 'CONTINUE';
  step = required(step, 'JR_RECOMMENDATION_STEP_REQUIRED').toUpperCase();
  if (!ALLOWED_WORKFLOW_STEPS.has(step)) throw new Error(`JR_RECOMMENDATION_STEP_INVALID:${step}`);
  return deepFreeze({ recommendationCode: required(input.recommendationCode, 'JR_RECOMMENDATION_CODE_REQUIRED'), nextWorkflowStep: step, supportReferences: uniqueStrings(input.supportReferences ?? [], 'JR_RECOMMENDATION_SUPPORT', {allowEmpty:false}), workflowOnly: true, lifeDecisionCreated: false, financialDecisionCreated: false, medicalDecisionCreated: false, legalDecisionCreated: false, professionalJudgmentCreated: false });
}

export function prepareRneRequest(input = {}, { executionActivated = false } = {}) {
  const envelope = {
    journeyReference: required(input.journeyReference, 'JR_RNE_JOURNEY_REQUIRED'),
    realityReference: required(input.realityReference, 'JR_RNE_REALITY_REQUIRED'),
    readoutReferences: uniqueStrings(input.readoutReferences ?? [], 'JR_RNE_READOUT'),
    constraintReferences: uniqueStrings(input.constraintReferences ?? [], 'JR_RNE_CONSTRAINT'),
    unknownReferences: uniqueStrings(input.unknownReferences ?? [], 'JR_RNE_UNKNOWN'),
    customerGoalReference: input.customerGoalReference ? required(input.customerGoalReference, 'JR_RNE_GOAL_REQUIRED') : null,
    dataPurpose: required(input.dataPurpose, 'JR_RNE_PURPOSE_REQUIRED'),
    consentReferences: uniqueStrings(input.consentReferences ?? [], 'JR_RNE_CONSENT', {allowEmpty:false})
  };
  return deepFreeze({ executionState: executionActivated ? 'READY_FOR_RNE_EXECUTOR' : 'NOT_EXECUTED_RNE_UNAVAILABLE', envelope, fabricatedResponse: false, jrNavigationIntelligenceCreated: false });
}

export function buildLrmEventIntents({ journeyReference, dataPurpose, consentReferences = [], events = [] } = {}, { executorActivated = false } = {}) {
  const j = required(journeyReference, 'JR_LRM_JOURNEY_REQUIRED');
  const purpose = required(dataPurpose, 'JR_LRM_PURPOSE_REQUIRED');
  const consents = uniqueStrings(consentReferences, 'JR_LRM_CONSENT');
  if (!Array.isArray(events)) throw new Error('JR_LRM_EVENTS_ARRAY_REQUIRED');
  const allowed = new Set(['JOURNEY_STARTED','JOURNEY_STAGE_COMPLETED','PROFESSIONAL_HANDOFF_CREATED','JOURNEY_ACTION_REFERENCED','JOURNEY_REVIEW_RECORDED','JOURNEY_CLOSED']);
  const intents = events.map(event => {
    if (!allowed.has(event.eventType)) throw new Error(`JR_LRM_EVENT_TYPE_INVALID:${event.eventType}`);
    if (event.payload || event.reality || event.readout || event.evidence) throw new Error('JR_LRM_AUTHORITY_PAYLOAD_COPY_FORBIDDEN');
    const stage = event.stage ?? null;
    if (stage && !STAGE_SET.has(stage)) throw new Error('JR_LRM_STAGE_INVALID');
    return {
      eventType: event.eventType,
      journeyReference: j,
      stage,
      sourceReference: required(event.sourceReference, 'JR_LRM_SOURCE_REFERENCE_REQUIRED'),
      occurredAt: required(event.occurredAt, 'JR_LRM_OCCURRED_AT_REQUIRED'),
      dataPurpose: purpose,
      consentReferences: consents
    };
  });
  return deepFreeze({ deliveryState: executorActivated ? 'READY_FOR_LRM_EXECUTOR' : 'DEFERRED_LRM_EXECUTOR_NOT_ACTIVATED', intents, persistedByJr: false, timelineAuthorityClaimedByJr: false });
}
