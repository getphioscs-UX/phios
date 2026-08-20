const canonicalText = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');

export const CKA_ENTRY_SURFACES = Object.freeze([
  'HOMEPAGE',
  'KNOWLEDGE_SEARCH',
  'LIBRARY',
  'ARTICLE',
  'BOOK',
  'ACCOUNT',
  'REALITY_DASHBOARD',
  'FIGURE'
]);

export const CKA_ENTRY_MODES = Object.freeze(['GLOBAL', 'CONTEXTUAL', 'REALITY_AWARE']);
export const CKA_UNKNOWN_STATES = Object.freeze([
  'UNKNOWN',
  'INSUFFICIENT_EVIDENCE',
  'CONFLICTING_EVIDENCE',
  'OUTSIDE_AUTHORITY',
  'CURRENT_DATA_REQUIRED'
]);
export const CKA_GUEST_MAX_FOLLOW_UP_DEPTH = 1;

const surfaceSet = new Set(CKA_ENTRY_SURFACES);
const modeSet = new Set(CKA_ENTRY_MODES);
const cardForbiddenPattern = /(?:node|fragment|section|source)[-_ ]?code|sourceId|pipelineState|candidatePublicationState|\bKN-[A-Z0-9-]+\b|\bFRAGMENT-[A-Z0-9-]+\b/i;

const optionalText = value => canonicalText(value) || null;

export function normalizeCkaEntryContext(input = {}) {
  const entrySurface = canonicalText(input.entrySurface || 'KNOWLEDGE_SEARCH').toUpperCase();
  if (!surfaceSet.has(entrySurface)) throw new Error('CKA_ENTRY_SURFACE_UNSUPPORTED');
  const inferredMode = entrySurface === 'REALITY_DASHBOARD'
    ? 'REALITY_AWARE'
    : entrySurface === 'HOMEPAGE' || entrySurface === 'KNOWLEDGE_SEARCH' || entrySurface === 'ACCOUNT'
      ? 'GLOBAL'
      : 'CONTEXTUAL';
  const mode = canonicalText(input.mode || inferredMode).toUpperCase();
  if (!modeSet.has(mode)) throw new Error('CKA_ENTRY_MODE_UNSUPPORTED');

  const figureCode = optionalText(input.figureCode);
  if (entrySurface === 'FIGURE' && !figureCode) throw new Error('CKA_FIGURE_CONTEXT_REQUIRED');

  const authorization = Object.freeze({
    permissionVerified: input.permission === true,
    privacyVerified: input.privacy === true,
    entitlementVerified: input.entitlement === true,
    accountVerified: canonicalText(input.accountState).toUpperCase() === 'ACCOUNT',
    realityCaseBound: Boolean(optionalText(input.realityCaseId))
  });
  if (mode === 'REALITY_AWARE' && !Object.values(authorization).every(Boolean)) {
    throw new Error('CKA_REALITY_CONTEXT_NOT_AUTHORIZED');
  }

  return Object.freeze({
    entrySurface,
    entryRoute: optionalText(input.entryRoute),
    contextType: optionalText(input.contextType),
    contextId: optionalText(input.contextId),
    bookCode: optionalText(input.bookCode),
    partCode: optionalText(input.partCode),
    articleCode: optionalText(input.articleCode),
    figureCode,
    realityCaseId: optionalText(input.realityCaseId),
    accountState: canonicalText(input.accountState || 'GUEST').toUpperCase(),
    locale: input.locale === 'en' ? 'en' : 'zh-Hans',
    mode,
    authorization,
    governance: Object.freeze({
      createsPersistentCase: false,
      createsShadowAccount: false,
      executesMethod: false,
      startsRealityJourney: false
    })
  });
}

export function createCkaFollowUpContext(input = {}) {
  const followUpDepth = Number.parseInt(input.followUpDepth ?? 0, 10);
  if (!Number.isInteger(followUpDepth) || followUpDepth < 0) throw new Error('CKA_FOLLOW_UP_DEPTH_INVALID');
  const accountState = canonicalText(input.accountState || 'GUEST').toUpperCase();
  if (accountState === 'GUEST' && followUpDepth > CKA_GUEST_MAX_FOLLOW_UP_DEPTH) {
    throw new Error('CKA_GUEST_FOLLOW_UP_LIMIT_REACHED');
  }
  return Object.freeze({
    currentQuestion: canonicalText(input.currentQuestion),
    contextQuestion: optionalText(input.contextQuestion),
    parentAnswerId: optionalText(input.parentAnswerId),
    groundingBundleId: optionalText(input.groundingBundleId),
    followUpDepth,
    answerContext: Object.freeze({
      parentAnswerId: optionalText(input.parentAnswerId)
    }),
    knowledgeContext: Object.freeze({
      groundingBundleId: optionalText(input.groundingBundleId)
    }),
    temporaryOnly: true,
    historyPersisted: false,
    createsPersistentCase: false,
    accountState
  });
}

export function composeCkaRetrievalQuestion(context) {
  const currentQuestion = canonicalText(context?.currentQuestion);
  if (!currentQuestion) throw new Error('KAP_QUESTION_INVALID');
  const contextQuestion = canonicalText(context?.contextQuestion);
  if ((context?.followUpDepth || 0) < 1 || !contextQuestion) return currentQuestion;
  return `Context: ${contextQuestion}\nFollow-up: ${currentQuestion}`;
}

export function classifyCkaFollowUpBoundary(question) {
  const normalized = canonicalText(question).toLowerCase();
  const stopPatterns = [
    /(?:reconstruct|rebuild|map).*(?:my|personal).*(?:case|reality)/,
    /(?:persist|save|remember).*(?:context|case|history)/,
    /(?:track|monitor).*(?:action|outcome|result)/,
    /(?:review|compare).*(?:my )?(?:outcome|result).*(?:over time|later|next)/
  ];
  const simpleAskAllowed = !stopPatterns.some(pattern => pattern.test(normalized));
  return Object.freeze({
    simpleAskAllowed,
    classification: simpleAskAllowed ? 'SIMPLE_ASK' : 'REALITY_COMPLEXITY_BOUNDARY',
    automaticEscalation: false,
    persistentCaseCreated: false
  });
}

const unknownStateFor = payload => {
  const status = canonicalText(payload?.answer?.coverageStatus || payload?.coverage?.status).toUpperCase();
  if (status === 'INSUFFICIENT_COVERAGE') return 'INSUFFICIENT_EVIDENCE';
  if (status === 'OUT_OF_SCOPE') return 'OUTSIDE_AUTHORITY';
  if (status === 'CONFLICTING_EVIDENCE') return 'CONFLICTING_EVIDENCE';
  if (status === 'CURRENT_DATA_REQUIRED') return 'CURRENT_DATA_REQUIRED';
  return 'UNKNOWN';
};

const safeCardText = (value, fallback) => {
  const text = canonicalText(value);
  return text && !cardForbiddenPattern.test(text) ? text : fallback;
};

const relatedKnowledgeCards = payload => {
  const related = Array.isArray(payload?.answer?.content?.relatedKnowledge)
    ? payload.answer.content.relatedKnowledge
    : [];
  const publicSources = (payload?.sources || []).filter(source => source?.href);
  const count = Math.max(related.length, publicSources.length);
  return Array.from({ length: count }, (_, index) => {
    const source = publicSources[index] || publicSources[0] || {};
    const contentType = source.href ? 'ARTICLE' : 'CONCEPT';
    return Object.freeze({
      concept: safeCardText(source.title, 'Related PHI OS knowledge'),
      part: safeCardText(source.partLabel || source.partCode, 'Knowledge'),
      volume: safeCardText(source.volumeLabel || source.bookCode, 'PHI OS'),
      description: safeCardText(source.questionScopedExcerpt, 'Continue with governed related knowledge.'),
      contentType,
      href: source.href || null
    });
  });
};

export function projectCkaClientAnswer(payload, { entryContext, followUpContext, displayQuestion } = {}) {
  const content = payload?.answer?.content || {};
  const whyThisMayHappen = [...(content.mechanism || []), ...(content.whyItMatters || [])].map(canonicalText).filter(Boolean);
  const unknownDetails = [...(content.unknowns || []), ...(content.boundaries || [])].map(canonicalText).filter(Boolean);
  return Object.freeze({
    schemaVersion: 'PHI-OS-CKA-CLIENT-ANSWER-v1.0.0',
    question: canonicalText(displayQuestion || followUpContext?.currentQuestion || payload?.answer?.question),
    directAnswer: canonicalText(content.directAnswer),
    whyThisMayHappen: Object.freeze(whyThisMayHappen),
    whatToObserve: Object.freeze((content.whatToObserve || []).map(canonicalText).filter(Boolean)),
    unknown: Object.freeze({
      state: unknownStateFor(payload),
      details: Object.freeze(unknownDetails)
    }),
    relatedKnowledgeCards: Object.freeze(relatedKnowledgeCards(payload)),
    sourcesGrounding: Object.freeze((payload?.sources || []).map(source => Object.freeze({
      authorityLabel: canonicalText(source.authorityLabel),
      excerpt: canonicalText(source.questionScopedExcerpt),
      href: source.href || null
    }))),
    entryContext: entryContext || null,
    followUpDepth: followUpContext?.followUpDepth || 0,
    governance: Object.freeze({
      createsCanonicalAuthority: false,
      createsRealityReading: false,
      createsPersistentCase: false,
      internalNodeCodesProjectedToCards: false
    })
  });
}
