const ENTRY_SURFACES = Object.freeze([
  'HOMEPAGE',
  'KNOWLEDGE_SEARCH',
  'LIBRARY',
  'ARTICLE',
  'BOOK',
  'ACCOUNT',
  'REALITY_DASHBOARD',
  'FIGURE'
]);

const ENTRY_MODES = Object.freeze(['GLOBAL', 'CONTEXTUAL', 'REALITY_AWARE']);
const UNKNOWN_STATES = Object.freeze([
  'UNKNOWN',
  'INSUFFICIENT_EVIDENCE',
  'CONFLICTING_EVIDENCE',
  'OUTSIDE_AUTHORITY',
  'CURRENT_DATA_REQUIRED'
]);
const MAX_QUESTION_LENGTH = 500;
const GUEST_MAX_FOLLOW_UP_DEPTH = 1;

const canonicalText = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const truthy = value => value === true || value === 'true' || value === '1';

function enumValue(value, allowed, fallback, errorCode) {
  const normalized = canonicalText(value || fallback).toUpperCase();
  if (!allowed.includes(normalized)) throw new Error(errorCode);
  return normalized;
}

function nullable(value, maximum = 160) {
  return canonicalText(value).slice(0, maximum) || null;
}

function publicLabel(value, fallback) {
  const text = canonicalText(value);
  if (!text || /^(?:KN|CM|FRAGMENT|NODE|KGB|KAP|PJA|KSAR)[-_][A-Z0-9_-]+$/i.test(text)) return fallback;
  return text;
}

function volumeLabel(bookCode, locale) {
  const match = canonicalText(bookCode).match(/(?:BOOK|VOLUME)[-_ ]?(\d+)/i);
  if (!match) return locale === 'zh-Hans' ? '未指定卷册' : 'Volume not specified';
  const roman = ['I', 'II', 'III', 'IV', 'V'][Number(match[1]) - 1] || match[1];
  return locale === 'zh-Hans' ? `第 ${match[1]} 册` : `Volume ${roman}`;
}

function partLabel(partCode, locale) {
  const match = canonicalText(partCode).match(/(?:PART|P)[-_ ]?(\d+)/i);
  if (!match) return locale === 'zh-Hans' ? '未指定部分' : 'Part not specified';
  return locale === 'zh-Hans' ? `第 ${match[1]} 部分` : `Part ${match[1]}`;
}

function unknownState(result) {
  const status = canonicalText(result?.boundary?.knowledgeStatus || result?.answer?.coverageStatus).toUpperCase();
  if (/CONFLICT/.test(status)) return 'CONFLICTING_EVIDENCE';
  if (/CURRENT_DATA|STALE/.test(status)) return 'CURRENT_DATA_REQUIRED';
  if (/OUT_OF_SCOPE|OUTSIDE/.test(status)) return 'OUTSIDE_AUTHORITY';
  if (/INSUFFICIENT|PARTIAL/.test(status)) return 'INSUFFICIENT_EVIDENCE';
  return 'UNKNOWN';
}

export function normalizeCkaEntryContext(input = {}) {
  const entrySurface = enumValue(input.entrySurface, ENTRY_SURFACES, 'KNOWLEDGE_SEARCH', 'CKA_ENTRY_SURFACE_UNSUPPORTED');
  const mode = enumValue(input.mode, ENTRY_MODES, entrySurface === 'FIGURE' ? 'CONTEXTUAL' : 'GLOBAL', 'CKA_ENTRY_MODE_UNSUPPORTED');
  const accountState = canonicalText(input.accountState || 'GUEST').toUpperCase() === 'ACCOUNT' ? 'ACCOUNT' : 'GUEST';
  const context = {
    entrySurface,
    entryRoute: nullable(input.entryRoute, 240) || '/knowledge-search',
    contextType: nullable(input.contextType, 80),
    contextId: nullable(input.contextId, 160),
    bookCode: nullable(input.bookCode, 80),
    partCode: nullable(input.partCode, 80),
    articleCode: nullable(input.articleCode, 120),
    figureCode: nullable(input.figureCode, 120),
    realityCaseId: nullable(input.realityCaseId, 160),
    accountState,
    locale: input.locale === 'en' ? 'en' : 'zh-Hans',
    mode
  };
  if (entrySurface === 'FIGURE' && (mode !== 'CONTEXTUAL' || !context.figureCode)) throw new Error('CKA_FIGURE_CONTEXT_REQUIRED');
  if (mode === 'CONTEXTUAL' && !context.contextType && !context.contextId && !context.bookCode && !context.articleCode && !context.figureCode) {
    throw new Error('CKA_CONTEXT_REQUIRED');
  }
  if (mode === 'REALITY_AWARE') {
    const authorized = accountState === 'ACCOUNT'
      && Boolean(context.realityCaseId)
      && truthy(input.permission)
      && truthy(input.privacy)
      && truthy(input.entitlement);
    if (!authorized) throw new Error('CKA_REALITY_CONTEXT_NOT_AUTHORIZED');
  }
  return Object.freeze({
    ...context,
    authorization: Object.freeze({
      permissionVerified: mode === 'REALITY_AWARE' ? truthy(input.permission) : false,
      privacyVerified: mode === 'REALITY_AWARE' ? truthy(input.privacy) : false,
      entitlementVerified: mode === 'REALITY_AWARE' ? truthy(input.entitlement) : false
    }),
    governance: Object.freeze({
      createsPersistentCase: false,
      createsShadowAccount: false,
      executesMethod: false,
      startsRealityJourney: false
    })
  });
}

export function createCkaFollowUpContext(input = {}) {
  const currentQuestion = canonicalText(input.currentQuestion);
  const contextQuestion = canonicalText(input.contextQuestion);
  const followUpDepth = Math.max(0, Number.parseInt(input.followUpDepth || 0, 10) || 0);
  const accountState = canonicalText(input.accountState || 'GUEST').toUpperCase() === 'ACCOUNT' ? 'ACCOUNT' : 'GUEST';
  if (!currentQuestion || currentQuestion.length > MAX_QUESTION_LENGTH) throw new Error('CKA_QUESTION_INVALID');
  if (accountState === 'GUEST' && followUpDepth > GUEST_MAX_FOLLOW_UP_DEPTH) throw new Error('CKA_GUEST_FOLLOW_UP_LIMIT_REACHED');
  return Object.freeze({
    currentQuestion,
    contextQuestion: contextQuestion || null,
    answerContext: Object.freeze({ parentAnswerId: nullable(input.parentAnswerId, 160) }),
    knowledgeContext: Object.freeze({ groundingBundleId: nullable(input.groundingBundleId, 160) }),
    followUpDepth,
    accountState,
    temporaryOnly: true,
    historyPersisted: false
  });
}

export function composeCkaRetrievalQuestion(followUp) {
  if (!followUp?.contextQuestion || followUp.followUpDepth === 0) return followUp.currentQuestion;
  const combined = `${followUp.contextQuestion} — Follow-up: ${followUp.currentQuestion}`;
  return combined.slice(0, MAX_QUESTION_LENGTH);
}

export function classifyCkaFollowUpBoundary(question) {
  const text = canonicalText(question).toLocaleLowerCase();
  const signals = [];
  const patterns = [
    ['PERSONAL_CASE_RECONSTRUCTION', /(?:完整|重建|reconstruct).*(?:情况|处境|case|situation)|(?:我的经历|my case|my situation)/i],
    ['PERSISTENT_CONTEXT', /(?:长期记住|持续记录|保存.*历史|remember.*later|keep.*history|persistent context)/i],
    ['MULTI_FACTOR_RELATIONSHIPS', /(?:多因素|多个因素|彼此影响|multi[- ]factor|interacting factors)/i],
    ['ACTION_TRACKING', /(?:追踪.*行动|行动记录|track.*action|action tracking)/i],
    ['OUTCOME_REVIEW', /(?:结果复盘|回顾.*结果|review.*outcome|outcome review)/i]
  ];
  for (const [code, pattern] of patterns) if (pattern.test(text)) signals.push(code);
  return Object.freeze({
    simpleAskAllowed: signals.length === 0,
    signals,
    guidedContextActivated: false,
    realityJourneyActivated: false,
    classificationIsDiagnosis: false
  });
}

function cardFromSource(source, relatedLabel, locale) {
  const published = source?.sourceType === 'PUBLISHED_CANONICAL_ARTICLE';
  const fallbackConcept = locale === 'zh-Hans'
    ? (published ? '已发布的 PHI OS 知识' : '已审核的 PHI OS 知识')
    : (published ? 'Published PHI OS knowledge' : 'Reviewed PHI OS knowledge');
  return Object.freeze({
    concept: publicLabel(source?.title || relatedLabel, fallbackConcept),
    part: partLabel(source?.partCode, locale),
    volume: volumeLabel(source?.bookCode, locale),
    description: canonicalText(source?.questionScopedExcerpt) || (locale === 'zh-Hans' ? '与当前问题相关的受治理知识。' : 'Governed knowledge related to the current question.'),
    contentType: published ? 'ARTICLE' : 'BOOK_SECTION',
    href: nullable(source?.href, 300)
  });
}

export function projectCkaClientAnswer(result, { entryContext, followUpContext, displayQuestion } = {}) {
  const locale = entryContext?.locale || result?.answer?.locale || 'zh-Hans';
  const content = result?.answer?.content || {};
  const related = Array.isArray(content.relatedKnowledge) ? content.relatedKnowledge : [];
  const sources = Array.isArray(result?.sources) ? result.sources : [];
  const cards = sources.map((source, index) => cardFromSource(source, related[index], locale));
  const unknown = unknownState(result);
  if (!UNKNOWN_STATES.includes(unknown)) throw new Error('CKA_UNKNOWN_STATE_INVALID');
  const safeSources = sources.map(source => Object.freeze({
    authorityLabel: source.authorityLabel,
    description: canonicalText(source.questionScopedExcerpt),
    volume: volumeLabel(source.bookCode, locale),
    part: partLabel(source.partCode, locale),
    href: nullable(source.href, 300),
    rawFullSourceExposed: false
  }));
  return Object.freeze({
    schemaVersion: 'PHI-OS-CKA-CLIENT-ANSWER-v1.0.0',
    question: canonicalText(displayQuestion || followUpContext?.currentQuestion || result?.answer?.question),
    directAnswer: canonicalText(content.directAnswer),
    whyThisMayHappen: Object.freeze({
      authorityClass: 'GROUNDED_OR_BOUNDED_EXPLANATION_NOT_OBSERVED_FACT',
      items: Object.freeze([...(content.mechanism || []), ...(content.whyItMatters || [])].map(canonicalText).filter(Boolean))
    }),
    whatToObserve: Object.freeze((content.whatToObserve || []).map(canonicalText).filter(Boolean)),
    unknown: Object.freeze({ state: unknown, items: Object.freeze((content.unknowns || result?.boundary?.unknowns || []).map(canonicalText).filter(Boolean)) }),
    relatedKnowledgeCards: Object.freeze(cards),
    grounding: Object.freeze({ sources: Object.freeze(safeSources), collapsible: true }),
    boundary: Object.freeze((result?.boundary?.limits || content.boundaries || []).map(canonicalText).filter(Boolean)),
    answerContext: Object.freeze({ answerId: nullable(result?.answer?.answerId, 160) }),
    knowledgeContext: Object.freeze({ groundingBundleId: nullable(result?.answer?.groundingBundleId, 160), sourceCount: safeSources.length }),
    governance: Object.freeze({
      createsCanonicalAuthority: false,
      createsRealityReading: false,
      createsPersistentCase: false,
      executesMethod: false,
      startsRealityJourney: false,
      internalNodeCodesProjectedToCards: false
    })
  });
}

export const CKA_ENTRY_SURFACES = ENTRY_SURFACES;
export const CKA_ENTRY_MODES = ENTRY_MODES;
export const CKA_UNKNOWN_STATES = UNKNOWN_STATES;
export const CKA_GUEST_MAX_FOLLOW_UP_DEPTH = GUEST_MAX_FOLLOW_UP_DEPTH;
