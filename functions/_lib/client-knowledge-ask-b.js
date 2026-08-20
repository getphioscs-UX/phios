const clean = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const optional = value => clean(value) || null;
const unique = values => [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];

export const CKA_ANSWER_STATES = Object.freeze([
  'ANSWERED',
  'PARTIALLY_ANSWERED',
  'UNKNOWN',
  'OUTSIDE_SCOPE',
  'NEEDS_CONTEXT',
  'NEEDS_CURRENT_AUTHORITY',
  'PROFESSIONAL_HANDOFF'
]);

export const CKA_AUTHORITY_PRIORITY = Object.freeze([
  'CANONICAL_OR_PUBLISHED_PHI_OS',
  'REVIEWED_MANUSCRIPT_OR_KSAR',
  'GOVERNED_EXTERNAL_AUTHORITY',
  'AUTHORIZED_CLIENT_CONTEXT'
]);

export const CKA_ACCOUNT_BOUNDARY = Object.freeze({
  guestAllowed: Object.freeze([
    'ASK',
    'ANSWER',
    'ONE_LIMITED_FOLLOW_UP',
    'RELATED_KNOWLEDGE',
    'TEMPORARY_GUIDED_CONTEXT'
  ]),
  accountRequired: Object.freeze([
    'ANSWER_HISTORY',
    'SAVE_RESULT_OR_KNOWLEDGE',
    'METHOD_RESULT_PERSISTENCE',
    'CASE_PERSISTENCE',
    'REALITY_VERSION_HISTORY',
    'JOURNEY_CONTINUITY'
  ]),
  featureGates: Object.freeze(['ENTITLEMENT', 'PRIVACY', 'CONSENT', 'RETENTION']),
  shadowAccountCreated: false,
  guestHistoryPersisted: false
});

export const CKA_GUIDED_FIELDS = Object.freeze([
  'whatIsHappening',
  'howLong',
  'whoOrWhatIsInvolved',
  'whatChanged',
  'whatTried',
  'whatMattersMostNow'
]);

export function normalizeCkaKnowledgeContext(input = {}) {
  const context = Object.freeze({
    contextLabel: optional(input.contextLabel)?.slice(0, 180) || null,
    contextSummary: optional(input.contextSummary)?.slice(0, 320) || null,
    readingPath: optional(input.readingPath)?.slice(0, 240) || null,
    relatedKnowledgeRef: optional(input.relatedKnowledgeRef)?.slice(0, 180) || null
  });
  return Object.freeze({
    ...context,
    temporaryOnly: true,
    authorityChanged: false,
    realityCaseCreated: false
  });
}

export function composeCkaContextualRetrievalQuestion(question, knowledgeContext = {}) {
  const currentQuestion = clean(question);
  const values = [
    knowledgeContext.contextLabel ? `Context label: ${knowledgeContext.contextLabel}` : null,
    knowledgeContext.contextSummary ? `Published context summary: ${knowledgeContext.contextSummary}` : null,
    knowledgeContext.readingPath ? `Reading path: ${knowledgeContext.readingPath}` : null,
    knowledgeContext.relatedKnowledgeRef ? `Related canonical knowledge: ${knowledgeContext.relatedKnowledgeRef}` : null
  ].filter(Boolean);
  return values.length
    ? `${currentQuestion}\n\nAuthorized public knowledge context (reference only):\n${values.join('\n')}`
    : currentQuestion;
}

const currentAuthorityPattern = /(?:\b(?:today|current|currently|latest|now|live|price|rate|law|regulation|market|election|product availability)\b|今天|目前|现在|最新|即时|价格|利率|法律|法规|市场|选举|产品现况)/i;
const unstableDomainPattern = /(?:\b(?:medical|medicine|legal|financial|tax|regulatory|current affairs|product specification)\b|医疗|医学|法律|财务|金融|税务|监管|时事|产品规格)/i;
const professionalJudgmentPattern = /(?:\b(?:diagnose|prescribe|legal advice|investment advice|should i (?:buy|sell)|medical emergency)\b|诊断|处方|法律意见|投资建议|我该(?:买|卖)|医疗急症)/i;
const persistencePattern = /(?:\b(?:for years|for months|long[- ]?term|persistent|recurring|keeps happening|still unresolved)\b|多年|几个月|长期|持续|反复|一直没有解决)/i;
const multiFactorPattern = /(?:\b(?:multiple|several|conflicting|interdependent|feedback loop|many factors)\b|多个|多方|冲突|互相影响|反馈循环|很多因素)/i;
const caseSpecificPattern = /(?:\b(?:my|me|our|personally|in my situation)\b|我的|我现在|我们|在我的情况)/i;
const realityDependentPattern = /(?:\b(?:track over time|case history|reality model|journey continuity)\b|持续追踪|案例历史|现实模型|旅程连续性)/i;

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function normalizeCkaGuidedContext(input = {}) {
  const fields = Object.fromEntries(CKA_GUIDED_FIELDS.map(key => [key, optional(input[key])?.slice(0, 240) || null]));
  const filled = CKA_GUIDED_FIELDS.filter(key => fields[key]);
  const corpus = [input.question, ...Object.values(fields)].map(clean).filter(Boolean).join(' ');
  const signals = Object.freeze({
    persistent: persistencePattern.test(corpus),
    multiFactor: multiFactorPattern.test(corpus)
      || [fields.whoOrWhatIsInvolved, fields.whatChanged, fields.whatTried].filter(Boolean).length >= 3,
    caseSpecific: caseSpecificPattern.test(corpus) || Boolean(fields.whatIsHappening),
    realityDependent: realityDependentPattern.test(corpus),
    personalized: Boolean(fields.whoOrWhatIsInvolved || fields.whatMattersMostNow)
  });
  const classifications = unique([
    filled.length ? 'CONTEXTUAL' : 'SIMPLE',
    signals.personalized ? 'PERSONALIZED' : null,
    signals.persistent ? 'PERSISTENT' : null,
    signals.multiFactor ? 'MULTI_FACTOR' : null,
    signals.realityDependent || (signals.persistent && signals.multiFactor) ? 'COMPLEX' : null
  ]);
  return Object.freeze({
    schemaVersion: 'PHI-OS-CKA-GUIDED-CONTEXT-v1.0.0',
    fields: Object.freeze(fields),
    filledFields: Object.freeze(filled),
    classifications: Object.freeze(classifications),
    signals,
    temporaryOnly: true,
    fullIcrCreated: false,
    classificationIsDiagnosis: false,
    canonicalRealityCreated: false
  });
}

export function composeCkaGuidedRetrievalQuestion(question, guidedContext) {
  const currentQuestion = clean(question);
  if (!currentQuestion) throw new Error('KAP_QUESTION_INVALID');
  if (!guidedContext?.filledFields?.length) return currentQuestion;
  const labels = {
    whatIsHappening: 'What is happening',
    howLong: 'How long',
    whoOrWhatIsInvolved: 'Who or what is involved',
    whatChanged: 'What changed',
    whatTried: 'What has been tried',
    whatMattersMostNow: 'What matters most now'
  };
  const lines = guidedContext.filledFields.map(key => `${labels[key]}: ${guidedContext.fields[key]}`);
  return `${currentQuestion}\n\nTemporary client-declared context (not observed fact, not Canonical Reality):\n${lines.join('\n')}`;
}

function sourceAuthorityClass(source = {}) {
  const type = clean(source.sourceType || source.authorityLabel).toUpperCase();
  if (/PUBLISHED|CANONICAL_ARTICLE/.test(type)) return 'CANONICAL_OR_PUBLISHED_PHI_OS';
  if (/MANUSCRIPT|KSAR|REVIEWED/.test(type)) return 'REVIEWED_MANUSCRIPT_OR_KSAR';
  if (/EXTERNAL|CURRENT_AUTHORITY/.test(type)) return 'GOVERNED_EXTERNAL_AUTHORITY';
  return 'CANONICAL_OR_PUBLISHED_PHI_OS';
}

export function evaluateCkaExternalAuthority(question, payload = {}) {
  const text = clean(question);
  const required = currentAuthorityPattern.test(text) || unstableDomainPattern.test(text);
  const professionalJudgmentRequested = professionalJudgmentPattern.test(text);
  const authoritySources = (Array.isArray(payload.sources) ? payload.sources : [])
    .filter(source => sourceAuthorityClass(source) === 'GOVERNED_EXTERNAL_AUTHORITY');
  return Object.freeze({
    required,
    professionalJudgmentRequested,
    governedCurrentAuthorityAvailable: authoritySources.length > 0,
    authoritySourceCount: authoritySources.length,
    ckaMakesProfessionalJudgment: false,
    liveAuthorityInvented: false
  });
}

export function resolveCkaAnswerState(payload = {}, { guidedContext, authorityDecision } = {}) {
  const coverage = clean(payload?.answer?.coverageStatus || payload?.coverage?.status).toUpperCase();
  if (authorityDecision?.professionalJudgmentRequested) return 'PROFESSIONAL_HANDOFF';
  if (authorityDecision?.required && !authorityDecision.governedCurrentAuthorityAvailable) return 'NEEDS_CURRENT_AUTHORITY';
  const grounded = Boolean(clean(payload?.answer?.groundingBundleId || payload?.grounding?.bundleId))
    && (Array.isArray(payload?.sources) ? payload.sources.length : 0) > 0;
  if (!grounded) return guidedContext?.filledFields?.length ? 'UNKNOWN' : 'NEEDS_CONTEXT';
  if (coverage === 'STRONG_COVERAGE') return 'ANSWERED';
  if (coverage === 'PARTIAL_COVERAGE') return 'PARTIALLY_ANSWERED';
  if (coverage === 'OUT_OF_SCOPE') return 'OUTSIDE_SCOPE';
  if (coverage === 'INSUFFICIENT_COVERAGE' && !guidedContext?.filledFields?.length) return 'NEEDS_CONTEXT';
  if (coverage === 'INSUFFICIENT_COVERAGE') return 'UNKNOWN';
  return 'UNKNOWN';
}

function governedRelatedCards(payload = {}) {
  return (Array.isArray(payload.sources) ? payload.sources : [])
    .filter(source => typeof source?.href === 'string' && source.href)
    .map(source => Object.freeze({
      concept: clean(source.title || source.authorityLabel || 'PHI OS knowledge'),
      volume: clean(source.volumeLabel || source.bookCode || 'PHI OS'),
      part: clean(source.partLabel || source.partCode || 'Knowledge'),
      description: clean(source.questionScopedExcerpt || 'Continue with this governed source.'),
      contentType: /figure/i.test(clean(source.sourceType)) ? 'FIGURE'
        : /book|manuscript/i.test(clean(source.sourceType)) ? 'BOOK'
          : 'ARTICLE',
      href: source.href
    }));
}

export function projectCkaW5W17Envelope(payload = {}, {
  displayQuestion,
  locale = 'zh-Hans',
  guidedContext,
  knowledgeContext
} = {}) {
  const answer = payload?.answer || {};
  if (!clean(answer.answerId)) throw new Error('CKA_UPSTREAM_ANSWER_ID_REQUIRED');
  const question = clean(displayQuestion || answer.question);
  const authorityDecision = evaluateCkaExternalAuthority(question, payload);
  const answerState = resolveCkaAnswerState(payload, { guidedContext, authorityDecision });
  const groundingBundleId = clean(answer.groundingBundleId || payload?.grounding?.bundleId);
  const sourceGroups = new Map();
  for (const source of Array.isArray(payload.sources) ? payload.sources : []) {
    const authorityClass = sourceAuthorityClass(source);
    if (!sourceGroups.has(authorityClass)) sourceGroups.set(authorityClass, []);
    sourceGroups.get(authorityClass).push(Object.freeze({
      authorityLabel: clean(source.authorityLabel),
      description: clean(source.questionScopedExcerpt),
      volume: clean(source.volumeLabel || source.bookCode),
      part: clean(source.partLabel || source.partCode),
      href: source.href || null
    }));
  }
  const retrievalContext = Object.freeze({
    pipeline: Object.freeze(['QUESTION', 'INTENT', 'KNOWLEDGE_RETRIEVAL', 'PUBLISHED_OR_AUTHORIZED_KNOWLEDGE', 'GROUNDING', 'ANSWER']),
    authorityPriority: CKA_AUTHORITY_PRIORITY,
    authorityGroups: Object.freeze(CKA_AUTHORITY_PRIORITY.map(authorityClass => Object.freeze({
      authorityClass,
      sources: Object.freeze(sourceGroups.get(authorityClass) || [])
    }))),
    llmMemoryOnlyAnswerAllowed: false,
    authoritiesSilentlyCollapsed: false
  });
  const knowledgeRefs = Object.freeze({
    primaryNodeCodes: Object.freeze(unique(answer?.knowledgeRefs?.primaryNodeCodes)),
    supportingNodeCodes: Object.freeze(unique(answer?.knowledgeRefs?.supportingNodeCodes)),
    relatedNodeCodes: Object.freeze(unique(answer?.knowledgeRefs?.relatedNodeCodes)),
    manuscriptRefs: Object.freeze(unique(answer?.knowledgeRefs?.manuscriptRefs)),
    publishedRefs: Object.freeze(unique(answer?.knowledgeRefs?.publishedRefs))
  });
  const unknownState = answerState === 'NEEDS_CURRENT_AUTHORITY' ? 'CURRENT_DATA_REQUIRED'
    : answerState === 'OUTSIDE_SCOPE' ? 'OUTSIDE_AUTHORITY'
      : answerState === 'ANSWERED' ? 'BOUNDED_KNOWN'
        : 'UNKNOWN';
  return Object.freeze({
    schemaVersion: 'PHI-OS-CKA-W5-W17-CLIENT-ENVELOPE-v1.0.0',
    answerState,
    record: Object.freeze({
      answerId: answer.answerId,
      questionId: `CKA-Q-v1-${stableHash(`${locale}|${question}`)}`,
      retrievalContext,
      knowledgeRefs,
      groundingState: groundingBundleId && (payload?.sources?.length || 0) > 0 ? 'GROUNDED' : 'INSUFFICIENT_GROUNDING',
      groundingBundleId: groundingBundleId || null,
      unknownState,
      locale: locale === 'en' ? 'en' : 'zh-Hans'
    }),
    guidedContext: guidedContext || null,
    knowledgeContext: knowledgeContext || null,
    externalAuthority: authorityDecision,
    relatedKnowledgeCards: Object.freeze(governedRelatedCards(payload)),
    accountBoundary: CKA_ACCOUNT_BOUNDARY,
    methodBoundary: Object.freeze({
      askIsMethodExecution: false,
      birthDataTriggersMethod: false,
      executionPath: Object.freeze(['READINESS', 'DISCLOSURE', 'CONSENT', 'MPA_ELIGIBILITY', 'EXECUTION', 'NORMALIZATION']),
      owner: 'PERSONAL_RUNTIME'
    }),
    realityBoundary: Object.freeze({
      questionContextIsCanonicalRealityCase: false,
      simpleContextEphemeral: true,
      newCaseOnlyThroughRealityFlow: true
    }),
    navigationBoundary: Object.freeze({
      searchPurpose: 'FIND_KNOWLEDGE',
      askPurpose: 'UNDERSTAND_KNOWLEDGE',
      libraryPurpose: 'BROWSE_DISCOVER_COMPARE_FOLLOW_READING_PATHS'
    }),
    governance: Object.freeze({
      groundedAnswerRuntimeConsumed: true,
      authoritativeAnswerGeneratedByCka: false,
      secondAnswerRuntimeCreated: false,
      secondRetrievalRuntimeCreated: false,
      persistentHistoryCreated: false,
      shadowAccountCreated: false,
      methodExecuted: false,
      realityJourneyActivated: false
    })
  });
}

export function ckaComplexityInput(question, guidedContext, clientAnswer = {}) {
  const fields = guidedContext?.fields || {};
  const clarifyingAnswers = CKA_GUIDED_FIELDS
    .filter(key => fields[key])
    .map(key => Object.freeze({ questionId: key, response: fields[key], selectedOptionCodes: Object.freeze([]) }));
  return Object.freeze({
    question: clean(question),
    guidedContext: Object.freeze({
      originalQuestion: clean(question),
      clarifyingAnswers: Object.freeze(clarifyingAnswers),
      temporaryObservations: Object.freeze([
        fields.whatIsHappening,
        fields.whatChanged,
        fields.whatTried
      ].filter(Boolean)),
      unknownMechanisms: Object.freeze(unique(clientAnswer?.unknown?.details)),
      candidateMechanisms: Object.freeze([]),
      escalationSignals: guidedContext?.signals || {}
    }),
    structuredContext: Object.freeze({
      notes: Object.freeze(Object.values(fields).filter(Boolean)),
      longTimeline: guidedContext?.signals?.persistent === true,
      persistentUnresolvedState: guidedContext?.signals?.persistent === true,
      unclearCausalStructure: guidedContext?.signals?.multiFactor === true,
      multiplePeople: Boolean(fields.whoOrWhatIsInvolved && /,|、| and |与|和/.test(fields.whoOrWhatIsInvolved)),
      multipleConstraints: guidedContext?.signals?.multiFactor === true,
      multipleInterventions: Boolean(fields.whatTried && /,|、| and |与|和/.test(fields.whatTried)),
      highConsequenceDecision: guidedContext?.signals?.realityDependent === true
    })
  });
}
