/**
 * PHI OS RJX-W19 provider cost gate.
 *
 * Successor orchestration policy only. It does not mutate the historical
 * PDS-W5 protected Runtime Entry provider router. The canonical Journey must
 * call this gate before any metered provider integration is activated.
 */

const bool = value => value === true;
const nonNegative = value => Number.isFinite(Number(value)) && Number(value) >= 0;

export function resolveJourneyProviderCostGate(input = {}) {
  const requested = String(input.requestedProvider || 'rule_engine').trim().toLowerCase();
  const eligible = bool(input.providerEligible);
  const providerAvailable = input.providerAvailable !== false;
  const budgetReserved = bool(input.budgetReserved);
  const usageTrackingReady = bool(input.usageTrackingReady);
  const paidOverageAllowed = false;

  const workersAIAllowed =
    requested === 'workers_ai' &&
    eligible &&
    providerAvailable &&
    budgetReserved &&
    usageTrackingReady &&
    nonNegative(input.reservedUnits);

  const openAIAllowed =
    requested === 'openai' &&
    bool(input.explicitOpenAIOptIn) &&
    bool(input.openAIEntitled) &&
    eligible &&
    providerAvailable &&
    budgetReserved &&
    usageTrackingReady &&
    nonNegative(input.reservedUnits);

  const selectedProvider = openAIAllowed
    ? 'openai'
    : workersAIAllowed
      ? 'workers_ai'
      : 'rule_engine';

  return Object.freeze({
    selectedProvider,
    ruleOnly: selectedProvider === 'rule_engine',
    workersAIAllowed,
    openAIAllowed,
    paidOverageAllowed,
    providerFailureBlocksBaseJourney: false,
    initialReadingMayUseModel: false,
    modelOutputAuthority: 'candidate_only',
    unknownMayBeModelFilled: false,
    observedEvidenceMayBeModelCreated: false,
    automaticProviderEscalationToOpenAI: false,
    usageTrackingRequired: selectedProvider !== 'rule_engine',
    reservationRequired: selectedProvider !== 'rule_engine'
  });
}

export function providerUsageEvent(input = {}) {
  return Object.freeze({
    provider: String(input.provider || 'rule_engine'),
    operation: String(input.operation || 'journey_enrichment'),
    reservedUnits: Math.max(0, Number(input.reservedUnits) || 0),
    actualUnits: Math.max(0, Number(input.actualUnits) || 0),
    meteredCost: Math.max(0, Number(input.meteredCost) || 0),
    budgetPeriod: String(input.budgetPeriod || 'UNSET'),
    requestId: String(input.requestId || ''),
    recorded: true
  });
}
