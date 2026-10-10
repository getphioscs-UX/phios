const EXECUTION_CLASSES = new Set([
  'T0_DETERMINISTIC', 'T1_CANONICAL_ASSEMBLY',
  'T2_LIGHT_COMPOSITION', 'T3_DEEP_COMPOSITION'
]);
const COHORTS = new Set(['FREE', 'CREDIT', 'PLUS', 'REALITY']);
const REAL = 'REAL_PRODUCTION_EVENT';
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const clean = value => String(value ?? '').trim();

function fail(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  throw error;
}

export function createPaidAskPilotEvent(input = {}) {
  if (!clean(input.eventId) || !clean(input.requestId)) fail('PASK_EVENT_ID_REQUIRED');
  if (!COHORTS.has(input.cohort)) fail('PASK_COHORT_INVALID');
  if (!EXECUTION_CLASSES.has(input.aiExecutionClass)) fail('PASK_EXECUTION_CLASS_INVALID');
  if (!['REAL_PRODUCTION_EVENT','REAL_PROVIDER_CALIBRATION','CONTROLLED_REPLAY','SYNTHETIC'].includes(input.evidenceClass)) fail('PASK_EVIDENCE_CLASS_INVALID');
  if (input.personalContextConsumed === true && input.explicitContextAuthorization !== true) fail('PASK_SILENT_CONTEXT_FORBIDDEN');
  if (input.providerAttemptCount > 1 && input.firstAttemptFailureRecorded !== true) fail('PASK_MULTI_PROVIDER_WITHOUT_FAILURE');
  return Object.freeze({
    schemaVersion: 'PHI-OS-PAID-ASK-PILOT-EVENT-v1.0.0',
    eventId: input.eventId,
    requestId: input.requestId,
    occurredAt: input.occurredAt || new Date(0).toISOString(),
    evidenceClass: input.evidenceClass,
    cohort: input.cohort,
    aiExecutionClass: input.aiExecutionClass,
    providerId: input.providerId || null,
    providerAttemptCount: finite(input.providerAttemptCount),
    firstAttemptFailureRecorded: input.firstAttemptFailureRecorded === true,
    inputTokens: finite(input.inputTokens),
    cachedInputTokens: finite(input.cachedInputTokens),
    outputTokens: finite(input.outputTokens),
    providerCostUsd: input.providerCostUsd == null ? null : finite(input.providerCostUsd),
    latencyMs: finite(input.latencyMs),
    answerDelivered: input.answerDelivered === true,
    directAnswerAccepted: input.directAnswerAccepted ?? null,
    claimGuardPassed: input.claimGuardPassed ?? null,
    humanAccepted: input.humanAccepted ?? null,
    creditsGranted: finite(input.creditsGranted),
    creditsDebited: finite(input.creditsDebited),
    creditDebitCorrect: input.creditDebitCorrect ?? null,
    upgradeOffered: input.upgradeOffered === true,
    upgradeCompleted: input.upgradeCompleted === true,
    abandoned: input.abandoned === true,
    repeatUse: input.repeatUse === true,
    revenueMyr: input.revenueMyr == null ? null : finite(input.revenueMyr),
    personalContextConsumed: input.personalContextConsumed === true,
    explicitContextAuthorization: input.explicitContextAuthorization === true,
    customerContentStored: false
  });
}

export function aggregatePaidAskPilot(events = []) {
  const real = events.filter(event => event.evidenceClass === REAL);
  const count = predicate => real.filter(predicate).length;
  const providerEvents = real.filter(event => event.providerAttemptCount > 0);
  const paid = real.filter(event => event.revenueMyr != null && event.revenueMyr > 0);
  const knownCost = real.filter(event => event.providerCostUsd != null);
  const executionClassDistribution = Object.fromEntries([...EXECUTION_CLASSES].map(code => [code, count(event => event.aiExecutionClass === code)]));
  const totalProviderCostUsd = knownCost.reduce((sum, event) => sum + event.providerCostUsd, 0);
  const totalRevenueMyr = paid.reduce((sum, event) => sum + event.revenueMyr, 0);
  return Object.freeze({
    realEventCount: real.length,
    nonRealEventCount: events.length - real.length,
    cohortsObserved: [...new Set(real.map(event => event.cohort))].sort(),
    executionClassDistribution,
    providerCallCount: providerEvents.length,
    providerCostKnownCount: knownCost.length,
    totalProviderCostUsd,
    averageProviderCostUsd: knownCost.length ? totalProviderCostUsd / knownCost.length : null,
    averageLatencyMs: real.length ? real.reduce((sum,event)=>sum+event.latencyMs,0)/real.length : null,
    directAnswerRate: real.filter(event=>event.directAnswerAccepted!=null).length ? count(event=>event.directAnswerAccepted===true)/real.filter(event=>event.directAnswerAccepted!=null).length : null,
    claimGuardPassRate: real.filter(event=>event.claimGuardPassed!=null).length ? count(event=>event.claimGuardPassed===true)/real.filter(event=>event.claimGuardPassed!=null).length : null,
    humanAcceptanceRate: real.filter(event=>event.humanAccepted!=null).length ? count(event=>event.humanAccepted===true)/real.filter(event=>event.humanAccepted!=null).length : null,
    creditDebitCorrectRate: real.filter(event=>event.creditDebitCorrect!=null).length ? count(event=>event.creditDebitCorrect===true)/real.filter(event=>event.creditDebitCorrect!=null).length : null,
    upgradeConversionRate: real.filter(event=>event.upgradeOffered).length ? count(event=>event.upgradeCompleted===true)/real.filter(event=>event.upgradeOffered).length : null,
    abandonmentRate: real.length ? count(event=>event.abandoned===true)/real.length : null,
    repeatUseRate: real.length ? count(event=>event.repeatUse===true)/real.length : null,
    totalRevenueMyr,
    actualGrossMarginMyr: knownCost.length === real.length && paid.length ? totalRevenueMyr - totalProviderCostUsd * 4.3 : null
  });
}

export function evaluatePaidAskPilotGate(summary = {}, contract = {}) {
  const reasons = [];
  const requiredCohorts = contract.requiredCohorts || [...COHORTS];
  if (summary.realEventCount < finite(contract.minimumRealRequests)) reasons.push('REAL_REQUEST_MINIMUM_NOT_MET');
  if (!requiredCohorts.every(cohort => summary.cohortsObserved?.includes(cohort))) reasons.push('COHORT_COVERAGE_INCOMPLETE');
  if (Object.values(summary.executionClassDistribution || {}).some(count => count < finite(contract.minimumPerExecutionClass))) reasons.push('EXECUTION_CLASS_COVERAGE_INCOMPLETE');
  if (summary.providerCostKnownCount !== summary.realEventCount) reasons.push('REAL_COST_INCOMPLETE');
  if (summary.directAnswerRate == null || summary.directAnswerRate < finite(contract.minimumDirectAnswerRate)) reasons.push('RELEVANCE_GATE_NOT_MET');
  if (summary.claimGuardPassRate == null || summary.claimGuardPassRate < finite(contract.minimumClaimGuardPassRate)) reasons.push('CLAIM_SAFETY_GATE_NOT_MET');
  if (summary.creditDebitCorrectRate == null || summary.creditDebitCorrectRate < 1) reasons.push('CREDIT_BEHAVIOR_NOT_VERIFIED');
  if (summary.actualGrossMarginMyr == null) reasons.push('ACTUAL_MARGIN_NOT_OBSERVED');
  if (summary.humanAcceptanceRate == null || summary.humanAcceptanceRate < finite(contract.minimumHumanAcceptanceRate)) reasons.push('PAID_ASK_HUMAN_ACCEPTANCE_NOT_MET');
  return Object.freeze({
    accepted: reasons.length === 0,
    status: reasons.length === 0 ? 'PAID_ASK_PILOT_ACCEPTED' : 'PAID_ASK_PILOT_PENDING_REAL_EVIDENCE',
    reasons,
    syntheticEvidenceMaySatisfyGate: false
  });
}

export const PAID_ASK_REAL_EVIDENCE_CLASS = REAL;
