const clean = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const optional = value => clean(value) || null;
const list = value => Array.isArray(value) ? value : [];
const freezeList = value => Object.freeze(list(value).map(item => typeof item === 'string' ? clean(item) : item).filter(Boolean));

export const CKA_CONSUMPTION_LOCALES = Object.freeze(['en', 'zh-Hans']);
export const CKA_RESPONSIVE_VIEWPORTS = Object.freeze([360, 390, 430, 768, 1024, 1280, 1440]);

export const CKA_ENTITLEMENT_MATRIX = Object.freeze({
  GUEST: Object.freeze(['LIMITED_ASK']),
  ACCOUNT: Object.freeze(['LIMITED_ASK', 'HISTORY', 'SAVE']),
  ELIGIBLE_CUSTOMER: Object.freeze(['LIMITED_ASK', 'HISTORY', 'SAVE', 'REALITY_AWARE_CONTEXT']),
  ELIGIBLE_METHOD_USER: Object.freeze(['LIMITED_ASK', 'HISTORY', 'SAVE', 'METHOD_HANDOFF']),
  JOURNEY_USER: Object.freeze(['LIMITED_ASK', 'HISTORY', 'SAVE', 'REALITY_AWARE_CONTEXT', 'CONTINUITY']),
  PROFESSIONAL: Object.freeze(['SEPARATE_PROFESSIONAL_SURFACE'])
});

export function normalizeTrustedCkaAccess(data = {}) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const accountState = clean(source.accountState).toUpperCase() === 'ACCOUNT' ? 'ACCOUNT' : 'GUEST';
  const roles = new Set(list(source.roles).map(value => clean(value).toUpperCase()).filter(Boolean));
  return Object.freeze({
    accountState,
    permission: source.permission === true,
    privacy: source.privacy === true,
    entitlement: source.entitlement === true,
    retentionPolicyAccepted: source.retentionPolicyAccepted === true,
    roles: Object.freeze([...roles]),
    source: 'TRUSTED_REQUEST_CONTEXT_ONLY'
  });
}

export function resolveCkaEntitlements(access = {}) {
  const normalized = normalizeTrustedCkaAccess(access);
  const capabilities = new Set(CKA_ENTITLEMENT_MATRIX.GUEST);
  if (normalized.accountState === 'ACCOUNT' && normalized.retentionPolicyAccepted) CKA_ENTITLEMENT_MATRIX.ACCOUNT.forEach(value => capabilities.add(value));
  if (normalized.roles.includes('ELIGIBLE_CUSTOMER') && normalized.permission && normalized.privacy && normalized.entitlement) {
    CKA_ENTITLEMENT_MATRIX.ELIGIBLE_CUSTOMER.forEach(value => capabilities.add(value));
  }
  if (normalized.roles.includes('ELIGIBLE_METHOD_USER') && normalized.entitlement) {
    CKA_ENTITLEMENT_MATRIX.ELIGIBLE_METHOD_USER.forEach(value => capabilities.add(value));
  }
  if (normalized.roles.includes('JOURNEY_USER') && normalized.entitlement) {
    CKA_ENTITLEMENT_MATRIX.JOURNEY_USER.forEach(value => capabilities.add(value));
  }
  if (normalized.roles.includes('PROFESSIONAL')) {
    capabilities.clear();
    CKA_ENTITLEMENT_MATRIX.PROFESSIONAL.forEach(value => capabilities.add(value));
  }
  return Object.freeze({
    accountState: normalized.accountState,
    capabilities: Object.freeze([...capabilities]),
    professionalSeparated: normalized.roles.includes('PROFESSIONAL'),
    retentionRequiredForHistoryAndSave: true,
    retentionAccepted: normalized.retentionPolicyAccepted,
    guestHiddenHistoryPersisted: false
  });
}

export function normalizeTrustedRealityContext(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const realityCaseId = optional(source.realityCaseId);
  const disclosureItems = list(source.disclosureItems).slice(0, 12).map(item => Object.freeze({
    label: clean(item?.label).slice(0, 120),
    value: clean(item?.value).slice(0, 240),
    category: clean(item?.category || 'CONTEXT').slice(0, 80)
  })).filter(item => item.label && item.value);
  return Object.freeze({
    realityCaseId,
    contextLabel: optional(source.contextLabel)?.slice(0, 180) || null,
    retrievalSummary: optional(source.retrievalSummary)?.slice(0, 1200) || null,
    disclosureItems: Object.freeze(disclosureItems),
    source: 'TRUSTED_REQUEST_CONTEXT_ONLY',
    analyticsProjectionAllowed: false
  });
}

export function assertCkaRealityContextAuthorization({ access, realityContext, useCurrentRealityContext } = {}) {
  const trustedAccess = normalizeTrustedCkaAccess(access);
  const trustedReality = normalizeTrustedRealityContext(realityContext);
  if (useCurrentRealityContext !== true) {
    return Object.freeze({ authorized: false, requested: false, reason: 'NOT_REQUESTED', trustedAccess, trustedReality });
  }
  const authorized = trustedAccess.accountState === 'ACCOUNT'
    && trustedAccess.permission
    && trustedAccess.privacy
    && trustedAccess.entitlement
    && Boolean(trustedReality.realityCaseId);
  if (!authorized) throw new Error('CKA_REALITY_CONTEXT_NOT_AUTHORIZED');
  return Object.freeze({ authorized: true, requested: true, reason: 'AUTHORIZED', trustedAccess, trustedReality });
}

export function composeCkaRealityAwareRetrievalQuestion(question, authorization = {}) {
  const currentQuestion = clean(question);
  if (!authorization?.authorized) return currentQuestion;
  const summary = clean(authorization?.trustedReality?.retrievalSummary);
  if (!summary) return currentQuestion;
  return `${currentQuestion}\n\nAuthorized current Reality context (user explicitly opted in; reference only):\n${summary}`;
}

export function projectCkaRealityContextDisclosure(authorization = {}) {
  const active = authorization?.authorized === true;
  return Object.freeze({
    usingCurrentRealityContext: active,
    label: active ? 'Using current Reality context' : 'Current Reality context is not being used',
    contextLabel: active ? authorization?.trustedReality?.contextLabel || null : null,
    contextItems: active ? authorization?.trustedReality?.disclosureItems || Object.freeze([]) : Object.freeze([]),
    source: active ? 'TRUSTED_REQUEST_CONTEXT_ONLY' : 'NONE',
    privateContextInAnalyticsPayload: false,
    silentPrivateContextConsumption: false
  });
}

export function buildCkaRjxHandoffRecord({
  sourceQuestion,
  sourceAnswer,
  userSelectedContext = [],
  observedSignals = [],
  unknowns = [],
  suggestedReasonForJourney,
  consentState = 'NOT_REQUESTED'
} = {}) {
  const allowedConsent = new Set(['NOT_REQUESTED', 'REQUIRED', 'GRANTED', 'DECLINED']);
  const consent = clean(consentState).toUpperCase();
  return Object.freeze({
    sourceQuestion: clean(sourceQuestion),
    sourceAnswer: clean(sourceAnswer),
    userSelectedContext: freezeList(userSelectedContext),
    observedSignals: Object.freeze(list(observedSignals).map(signal => Object.freeze({
      code: clean(signal?.code || signal),
      label: clean(signal?.label || signal),
      authorityClass: 'ROUTING_SIGNAL_NOT_REALITY_TRUTH'
    })).filter(signal => signal.code || signal.label)),
    unknowns: freezeList(unknowns),
    suggestedReasonForJourney: clean(suggestedReasonForJourney),
    consentState: allowedConsent.has(consent) ? consent : 'NOT_REQUESTED',
    governance: Object.freeze({
      preCreatedRealityTruth: false,
      canonicalRealityCreated: false,
      persistentCaseCreated: false,
      realityJourneyActivated: false,
      downstreamOwners: Object.freeze(['ICR', 'RDG', 'RMO'])
    })
  });
}

function publicationStateForSource(source = {}) {
  const type = clean(source.sourceType).toUpperCase();
  if (type.startsWith('PUBLISHED_')) return 'PUBLISHED';
  if (type.includes('MANUSCRIPT')) return 'REVIEWED_NON_PUBLIC';
  if (type.includes('FIGURE')) return source.href ? 'PUBLIC' : 'NON_PUBLIC';
  return source.href ? 'PUBLIC_GOVERNED' : 'NON_PUBLIC_GOVERNED';
}

function contentTypeForSource(source = {}) {
  const type = clean(source.sourceType).toUpperCase();
  if (type.includes('FIGURE')) return 'FIGURE';
  if (type.includes('BOOK') || type.includes('MANUSCRIPT')) return 'BOOK';
  return 'ARTICLE';
}

export function evaluateCkaKnowledgeCards(payload = {}, locale = 'zh-Hans') {
  const answerLocale = locale === 'en' ? 'en' : 'zh-Hans';
  const records = list(payload?.sources).filter(source => typeof source?.href === 'string' && source.href).map(source => {
    const record = Object.freeze({
      concept: clean(source.title || source.authorityLabel || 'PHI OS knowledge'),
      volume: clean(source.volumeLabel || source.bookCode || 'PHI OS'),
      part: clean(source.partLabel || source.partCode || 'Knowledge'),
      description: clean(source.questionScopedExcerpt || 'Continue with this governed source.'),
      publicationState: publicationStateForSource(source),
      locale: answerLocale,
      contentType: contentTypeForSource(source),
      href: source.href,
      ownershipSource: source.bookCode ? 'SOURCE_BOOK_CODE' : 'SOURCE_METADATA',
      ownershipInferredFromKnBPrefix: false
    });
    return Object.freeze({
      ...record,
      valid: Boolean(record.concept && record.volume && record.part && record.description && record.publicationState && record.locale && record.contentType && record.href)
    });
  });
  return Object.freeze(records);
}

export function evaluateCkaProductionAnswer(payload = {}, envelope = {}, cardAcceptance = []) {
  const answer = payload?.answer || {};
  const directAnswer = clean(answer?.content?.directAnswer);
  const unknowns = list(answer?.content?.unknowns);
  const boundaries = list(answer?.content?.boundaries);
  const sourceCount = list(payload?.sources).length;
  const groundingState = clean(envelope?.record?.groundingState);
  const unknownVisible = Boolean(clean(envelope?.record?.unknownState)) && (unknowns.length + boundaries.length > 0 || envelope?.answerState === 'UNKNOWN');
  const relatedRequired = sourceCount > 0 && list(payload?.sources).some(source => source?.href);
  const relatedValid = !relatedRequired || (cardAcceptance.length > 0 && cardAcceptance.every(card => card.valid));
  const groundingValid = groundingState === 'GROUNDED' && sourceCount > 0;
  return Object.freeze({
    directAnswerValid: Boolean(directAnswer),
    groundingValid,
    knowledgeSourceValid: sourceCount > 0,
    unknownVisible,
    authorityBoundaryValid: boundaries.length > 0 || Boolean(envelope?.externalAuthority),
    relatedKnowledgeValid: relatedValid,
    unverifiedGeneralGenerationPresentedAsPhiosKnowledge: false,
    productionAnswerAccepted: Boolean(directAnswer && groundingValid && sourceCount > 0 && unknownVisible && relatedValid)
  });
}

export function projectCkaW18W33Consumption(payload = {}, envelope = {}, {
  locale = 'zh-Hans',
  access = {},
  realityAuthorization = null
} = {}) {
  const knowledgeCards = evaluateCkaKnowledgeCards(payload, locale);
  const answerAcceptance = evaluateCkaProductionAnswer(payload, envelope, knowledgeCards);
  const entitlements = resolveCkaEntitlements(access);
  return Object.freeze({
    schemaVersion: 'PHI-OS-CKA-W18-W33-CONSUMPTION-v1.0.0',
    knowledgeCards,
    answerAcceptance,
    entitlements,
    realityContext: projectCkaRealityContextDisclosure(realityAuthorization || {}),
    governance: Object.freeze({
      structuredAnswerRequired: true,
      genericUnlimitedChat: false,
      automaticJourneyEscalation: false,
      simplePublicAskForcedLogin: false,
      methodExecutionLeakage: false,
      realityCaseLeakage: false,
      privateContextInAnalyticsPayload: false,
      globalProductionAccepted: false
    })
  });
}
