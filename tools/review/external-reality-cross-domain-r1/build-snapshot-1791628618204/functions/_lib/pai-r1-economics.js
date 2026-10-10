const EXECUTION_CLASSES = Object.freeze([
  'T0_DETERMINISTIC',
  'T1_CANONICAL_ASSEMBLY',
  'T2_LIGHT_COMPOSITION',
  'T3_DEEP_COMPOSITION'
]);

const clean = value => String(value ?? '').trim();
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const freeze = value => Object.freeze(value);

function fail(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  throw error;
}

export function selectPaiRoute(input = {}, registry = {}) {
  const executionClass = clean(input.aiExecutionClass);
  if (!EXECUTION_CLASSES.includes(executionClass)) fail('PAI_EXECUTION_CLASS_REQUIRED');
  const requiresProvider = executionClass === 'T2_LIGHT_COMPOSITION'
    || executionClass === 'T3_DEEP_COMPOSITION'
    || (executionClass === 'T1_CANONICAL_ASSEMBLY' && input.canonicalAssemblyQualityInsufficient === true);
  if (!requiresProvider) return freeze({
    aiExecutionClass: executionClass,
    providerRequired: false,
    selectedProvider: null,
    selectedModel: null,
    providerAttemptLimit: 0,
    fallbackAllowed: false,
    routingReason: executionClass === 'T0_DETERMINISTIC' ? 'DETERMINISTIC_SUFFICIENT' : 'CANONICAL_ASSEMBLY_SUFFICIENT'
  });

  const capabilityClass = executionClass === 'T3_DEEP_COMPOSITION' ? 'DEEP' : 'LIGHT';
  const available = (registry.models || []).filter(model =>
    model.status === 'AVAILABLE'
    && (model.capabilityClass === capabilityClass || model.capabilityClass === 'GENERAL')
  ).sort((a, b) => finite(a.planningCostRank) - finite(b.planningCostRank));
  const selected = available[0];
  if (!selected) return freeze({
    aiExecutionClass: executionClass,
    providerRequired: true,
    selectedProvider: null,
    selectedModel: null,
    providerAttemptLimit: 0,
    fallbackAllowed: false,
    degradedDisposition: input.deterministicFallbackAvailable ? 'DETERMINISTIC_FALLBACK' : 'CONTROLLED_UNAVAILABLE',
    routingReason: 'NO_ADMITTED_PROVIDER_AVAILABLE'
  });
  return freeze({
    aiExecutionClass: executionClass,
    providerRequired: true,
    selectedProvider: selected.providerId,
    selectedModel: selected.modelId,
    providerAttemptLimit: 1,
    fallbackAllowed: true,
    fallbackCapabilityClass: capabilityClass,
    routingReason: executionClass === 'T1_CANONICAL_ASSEMBLY' ? 'RECORDED_T1_QUALITY_UPGRADE' : 'MINIMUM_SUFFICIENT_CAPABILITY'
  });
}

export function selectPaiFailureFallback(route = {}, failedModelId, registry = {}) {
  if (!route.providerRequired || !failedModelId) return null;
  const failed = (registry.models || []).find(model => model.modelId === failedModelId);
  const capability = route.fallbackCapabilityClass || failed?.capabilityClass;
  const fallback = (registry.models || []).find(model =>
    model.status === 'AVAILABLE'
    && model.modelId !== failedModelId
    && model.capabilityClass === capability
    && finite(model.planningCostRank) <= finite(failed?.planningCostRank)
  );
  return fallback ? freeze({
    providerId: fallback.providerId,
    modelId: fallback.modelId,
    firstAttemptFailureRecorded: true,
    providerAttemptCount: 2,
    customerChargeMayIncrease: false
  }) : freeze({
    providerId: null,
    modelId: null,
    firstAttemptFailureRecorded: true,
    providerAttemptCount: 1,
    disposition: 'CONTROLLED_DEGRADED_OR_DETERMINISTIC',
    customerChargeMayIncrease: false
  });
}

export function disciplinePaiEvidence(evidence = [], policy = {}) {
  const seen = new Set();
  const rejected = [];
  const admitted = [];
  const maxEvidenceTokens = finite(policy.maxEvidenceTokens || 2400);
  let tokens = 0;
  for (const item of evidence) {
    const estimatedTokens = Math.max(1, finite(item.estimatedTokens || Math.ceil(clean(item.text).length / 4)));
    const identity = clean(item.canonicalMeaningId || item.nodeCode || item.sourceRef || item.text);
    let reason = null;
    if (item.sourceClass === 'FULL_BOOK') reason = 'WHOLE_BOOK_FORBIDDEN';
    else if (item.authorized === false) reason = 'UNAUTHORIZED_CONTEXT';
    else if (!identity) reason = 'MISSING_EVIDENCE_IDENTITY';
    else if (seen.has(identity)) reason = 'DUPLICATE_MEANING';
    else if (tokens + estimatedTokens > maxEvidenceTokens) reason = 'EVIDENCE_BUDGET_EXCEEDED';
    if (reason) rejected.push({identity: identity || null, reason});
    else {
      seen.add(identity);
      tokens += estimatedTokens;
      admitted.push({...item, estimatedTokens});
    }
  }
  return freeze({
    admitted,
    rejected,
    evidenceTokens: tokens,
    duplicateTokensRemoved: rejected.filter(item => item.reason === 'DUPLICATE_MEANING').length,
    wholeBookInjected: false,
    minimumSufficientEvidenceApplied: true
  });
}

export function estimatePaiProviderCost(model = {}, usage = {}) {
  const input = Math.max(0, finite(usage.inputTokens) - finite(usage.cachedInputTokens));
  const cached = Math.max(0, finite(usage.cachedInputTokens));
  const output = Math.max(0, finite(usage.outputTokens));
  return Number((
    input * finite(model.inputPricePerMillion)
    + cached * finite(model.cachedInputPricePerMillion)
    + output * finite(model.outputPricePerMillion)
  ) / 1_000_000).toFixed(8);
}

export function enforcePaiCostCeiling({estimatedCost = 0, ceiling = 0, evidenceCanReduce = false, deterministicFallbackAvailable = false} = {}) {
  if (finite(estimatedCost) <= finite(ceiling)) return freeze({allowed: true, disposition: 'WITHIN_CEILING'});
  if (evidenceCanReduce) return freeze({allowed: false, disposition: 'REDUCE_EVIDENCE_AND_REPRICE'});
  if (deterministicFallbackAvailable) return freeze({allowed: false, disposition: 'USE_DETERMINISTIC_FALLBACK'});
  return freeze({allowed: false, disposition: 'CONTROLLED_COST_BOUNDARY'});
}

export function createPaiUsageRecord(input = {}) {
  if (!clean(input.requestId)) fail('PAI_USAGE_REQUEST_ID_REQUIRED');
  if (!EXECUTION_CLASSES.includes(input.aiExecutionClass)) fail('PAI_USAGE_EXECUTION_CLASS_REQUIRED');
  const providerAttemptCount = finite(input.providerAttemptCount);
  if (input.requestType === 'PRODUCTION' && providerAttemptCount > 1 && input.firstAttemptFailureRecorded !== true) {
    fail('PAI_MULTI_PROVIDER_WITHOUT_RECORDED_FAILURE');
  }
  return freeze({
    schemaVersion: 'PHI-OS-PAI-R1-USAGE-EVENT-v1.0.0',
    requestId: input.requestId,
    timestamp: input.timestamp || new Date(0).toISOString(),
    aiExecutionClass: input.aiExecutionClass,
    provider: input.provider || null,
    model: input.model || null,
    inputTokens: finite(input.inputTokens),
    cachedInputTokens: finite(input.cachedInputTokens),
    outputTokens: finite(input.outputTokens),
    estimatedProviderCost: finite(input.estimatedProviderCost),
    finalProviderCost: input.finalProviderCost == null ? null : finite(input.finalProviderCost),
    customerTier: input.customerTier || 'FREE',
    entitlementClass: input.entitlementClass || 'FREE',
    creditsCharged: finite(input.creditsCharged),
    requestType: input.requestType || 'PRODUCTION',
    retrievalEvidenceTokens: finite(input.retrievalEvidenceTokens),
    authorizedContextTokens: finite(input.authorizedContextTokens),
    composerInputTokens: finite(input.composerInputTokens),
    cacheHit: input.cacheHit === true,
    fallbackUsed: input.fallbackUsed === true,
    fallbackFrom: input.fallbackFrom || null,
    fallbackTo: input.fallbackTo || null,
    providerAttemptCount,
    firstAttemptFailureRecorded: input.firstAttemptFailureRecorded === true,
    latencyMs: finite(input.latencyMs),
    success: input.success !== false,
    failureClass: input.failureClass || null
  });
}

export function applyPaiCreditTransaction({transactionId, requestId, balance, amount, kind, reason, entitlementClass, usageClass} = {}) {
  if (!clean(transactionId) || !clean(requestId)) fail('PAI_CREDIT_TRANSACTION_ID_REQUIRED');
  const beforeBalance = finite(balance);
  const units = finite(amount);
  if (units < 0 || !['GRANT', 'DEBIT', 'REFUND'].includes(kind)) fail('PAI_CREDIT_TRANSACTION_INVALID');
  if (kind === 'DEBIT' && units > beforeBalance) return freeze({
    transactionId, requestId, beforeBalance, afterBalance: beforeBalance,
    entitlementClass, usageClass, creditReason: reason,
    debitStatus: 'INSUFFICIENT_BALANCE', refundStatus: 'NOT_APPLICABLE'
  });
  const afterBalance = kind === 'DEBIT' ? beforeBalance - units : beforeBalance + units;
  return freeze({
    transactionId, requestId, beforeBalance, afterBalance,
    entitlementClass, usageClass, creditReason: reason,
    debitStatus: kind === 'DEBIT' ? 'APPLIED' : 'NOT_APPLICABLE',
    refundStatus: kind === 'REFUND' ? 'APPLIED' : 'NOT_APPLICABLE'
  });
}

export function evaluatePaiAbuse(input = {}, policy = {}) {
  const reasons = [];
  if (finite(input.dailyRequests) >= finite(policy.dailySoftLimit)) reasons.push('DAILY_SOFT_LIMIT');
  if (finite(input.monthlyRequests) >= finite(policy.monthlyHardLimit)) reasons.push('MONTHLY_HARD_LIMIT');
  if (finite(input.rapidRepeatCount) >= finite(policy.rapidRepeatLimit)) reasons.push('RAPID_REPEAT');
  if (input.identicalDeepReplay === true) reasons.push('IDENTICAL_DEEP_REPLAY');
  if (input.parallelRequest === true) reasons.push('PARALLEL_REQUEST');
  return freeze({
    allowed: !reasons.includes('MONTHLY_HARD_LIMIT') && !reasons.includes('IDENTICAL_DEEP_REPLAY') && !reasons.includes('PARALLEL_REQUEST'),
    reasons,
    reuseCachedGroundedResultFirst: reasons.includes('RAPID_REPEAT') || reasons.includes('IDENTICAL_DEEP_REPLAY')
  });
}

export function projectPaiUsageUx({label = 'Deep Ask', credits = 0, included = false, remaining = null} = {}) {
  return freeze({label, status: included ? 'Included' : `${finite(credits)} PHI Credits`, usageRemaining: remaining, upgradeAvailable: !included});
}

export function auditPaiClaims(claims = []) {
  const material = claims.filter(claim => claim.claimType !== 'TRANSITION');
  const audited = material.map(claim => ({
    ...claim,
    status: Array.isArray(claim.sourceRefs) && claim.sourceRefs.length
      ? (claim.overstated ? 'OVERSTATED' : 'SUPPORTED')
      : 'UNSUPPORTED'
  }));
  return freeze({claims: audited, unsupported: audited.filter(claim => ['UNSUPPORTED','OVERSTATED','OUT_OF_SCOPE'].includes(claim.status)).length});
}

export function createPaiTargetedRepairPlan(audit = {}, options = {}) {
  const affected = (audit.claims || []).filter(claim => ['UNSUPPORTED','OVERSTATED','OUT_OF_SCOPE'].includes(claim.status));
  const fullRegeneration = options.answerStructureInvalid === true || (audit.claims?.length > 0 && affected.length > audit.claims.length / 2);
  return freeze({
    mode: fullRegeneration ? 'STRUCTURAL_REGENERATION_REQUIRED' : 'TARGETED_SPAN_REPAIR',
    affectedClaimIds: affected.map(claim => claim.claimId),
    fullRegenerationCount: fullRegeneration ? 1 : 0,
    reloadAllAccountContext: false
  });
}

export function createPaiArticleUtilityEvent(input = {}) {
  return freeze({
    schemaVersion: 'PHI-OS-KIR-ARTICLE-UTILITY-EVENT-v1.0.0',
    articleId: input.articleId,
    nodeId: input.nodeId,
    requestId: input.requestId,
    retrievalRank: finite(input.retrievalRank),
    usageRole: input.usageRole || 'NOT_CONSUMED',
    canonicalAuthorityCreated: false
  });
}

export const PAI_R1_EXECUTION_CLASSES = EXECUTION_CLASSES;
