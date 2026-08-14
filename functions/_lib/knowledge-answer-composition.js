import { runKapGroundingPipeline } from './knowledge-answer-grounding.js';

const DEPTHS = Object.freeze({
  QUICK: Object.freeze({ directSentences: 1, mechanismItems: 1, whyItems: 0, relatedItems: 2, sourceItems: 3 }),
  STANDARD: Object.freeze({ directSentences: 1, mechanismItems: 3, whyItems: 1, relatedItems: 4, sourceItems: 6 }),
  DEEP: Object.freeze({ directSentences: 2, mechanismItems: 4, whyItems: 2, relatedItems: 6, sourceItems: 10 })
});
const DEFAULT_DEPTH = 'STANDARD';
const SUPPORTED_DEPTHS = new Set(Object.keys(DEPTHS));

const canonicalText = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const unique = values => [...new Set(values.map(canonicalText).filter(Boolean))];

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function splitSentences(text) {
  const source = canonicalText(text);
  if (!source) return [];
  return unique(source.match(/[^。！？.!?]+[。！？.!?]?/g) || [source]);
}

function localeCopy(locale) {
  if (locale === 'zh-Hans') {
    return Object.freeze({
      insufficient: 'PHI OS 目前没有足够的受治理知识来可靠回答这个问题。',
      outOfScope: '这个问题目前超出 PHI OS 已治理的知识范围。',
      questionScopedBoundary: '这是基于受治理 PHI OS Knowledge 的问题范围回答，不是 Published Article，也不是 Reality Reading。',
      personalBoundary: '一般知识机制不能证明这就是你现实里正在发生的情况；个人结论需要额外证据。',
      observe: '如果这个问题与你本人有关，可以先观察上述机制是否真的出现在你的情境中，而不要把一般机制直接当作个人结论。',
      pendingBinding: '有相关手稿内容仍在等待 Canonical binding，因此没有被提升为 Canonical Node 结论。',
      unpublishedRelated: '存在相关知识关系，但目标知识尚未在当前语言发布，因此没有被注入本次回答。',
      sourceUnavailable: '当前没有可用于回答的受治理来源。',
      partial: '现有知识可以回答一部分，但仍有重要边界或未知需要保留。'
    });
  }
  return Object.freeze({
    insufficient: 'PHI OS does not currently have enough governed knowledge to answer this question reliably.',
    outOfScope: 'This question is currently outside the governed PHI OS knowledge scope.',
    questionScopedBoundary: 'This is a question-scoped answer grounded in governed PHI OS Knowledge; it is not a Published Article or a Reality Reading.',
    personalBoundary: 'A general knowledge mechanism does not establish that it is what is happening in your reality; a personal conclusion requires additional evidence.',
    observe: 'If this question is personal, observe whether the mechanisms above are actually present in your situation rather than treating a general mechanism as a personal conclusion.',
    pendingBinding: 'Relevant manuscript material still has a pending Canonical binding, so it was not promoted into a Canonical Node claim.',
    unpublishedRelated: 'A governed knowledge relationship exists, but the target is not published in this locale and was not injected into this answer.',
    sourceUnavailable: 'No governed source is currently available for this answer.',
    partial: 'The available knowledge can answer part of the question, but important boundaries or unknowns remain.'
  });
}

function sourcePriority(source) {
  if (source?.sourceType === 'PUBLISHED_CANONICAL_ARTICLE') return 0;
  if (source?.sourceType === 'COMPLETED_MANUSCRIPT') return 1;
  return 2;
}

function groundedSentences(bundle) {
  return (bundle?.sources || [])
    .slice()
    .sort((a, b) => sourcePriority(a) - sourcePriority(b) || String(a.sourceId).localeCompare(String(b.sourceId)))
    .filter(source => !/^#{1,6}\s+/.test(canonicalText(source.text)))
    .flatMap(source => splitSentences(source.text).map(text => ({ text, source })));
}

function facetBackedSentences(bundle, allSentences) {
  const fragmentCodes = new Set(
    (bundle?.relationships?.mechanismFacets || [])
      .filter(facet => facet.groundingEligible)
      .flatMap(facet => facet.evidenceFragmentCodes || [])
  );
  return allSentences.filter(item => item.source?.fragmentCode && fragmentCodes.has(item.source.fragmentCode));
}

function mapUnknowns(bundle, locale) {
  const copy = localeCopy(locale);
  return unique((bundle?.unknowns || []).map(item => {
    switch (item.code) {
      case 'CANONICAL_BINDING_PENDING': return copy.pendingBinding;
      case 'RELATED_TARGET_NOT_PUBLISHED': return copy.unpublishedRelated;
      case 'NO_GROUNDED_SOURCE_MATCH': return copy.sourceUnavailable;
      default: return canonicalText(item.code).replaceAll('_', ' ').toLowerCase();
    }
  }));
}

function relatedKnowledge(bundle, maximum) {
  const candidates = [
    ...(bundle?.nodeMatches?.supportingNodes || []).map(node => node.title || node.nodeCode),
    ...(bundle?.nodeMatches?.relatedPublishedNodeCodes || [])
  ];
  return unique(candidates).slice(0, maximum);
}

export function normalizeAnswerDepth(value) {
  const depth = canonicalText(value || DEFAULT_DEPTH).toUpperCase();
  if (!SUPPORTED_DEPTHS.has(depth)) throw new Error('KAP_ANSWER_DEPTH_UNSUPPORTED');
  return depth;
}

export function evaluateKapAiEligibility({ bundle, coverageDecision, depth = DEFAULT_DEPTH }) {
  const normalizedDepth = normalizeAnswerDepth(depth);
  const sourceCount = bundle?.sources?.length || 0;
  const nodeCount = (bundle?.nodeMatches?.primaryNodes?.length || 0) + (bundle?.nodeMatches?.supportingNodes?.length || 0);
  const relationshipCount = bundle?.relationships?.relationships?.length || 0;
  let status = 'AI_NOT_REQUIRED';
  const reasonCodes = [];
  if (!coverageDecision?.answerCompositionEligible) {
    reasonCodes.push('NO_COMPOSITION_BENEFIT_WITHOUT_GROUNDED_COVERAGE');
  } else if (normalizedDepth === 'DEEP' && (sourceCount > 5 || nodeCount > 3 || relationshipCount > 3)) {
    status = 'AI_RECOMMENDED';
    reasonCodes.push('DEEP_MULTI_SOURCE_SYNTHESIS');
  } else if (sourceCount > 3 || nodeCount > 1 || relationshipCount > 1) {
    status = 'AI_OPTIONAL';
    reasonCodes.push('MULTI_SOURCE_OR_MULTI_NODE_SYNTHESIS');
  } else {
    reasonCodes.push('DETERMINISTIC_COMPOSITION_SUFFICIENT');
  }
  return {
    schemaVersion: 'PHI-OS-KAP-AI-ELIGIBILITY-DECISION-v1.0.0',
    status,
    reasonCodes,
    aiRequired: false,
    aiIsKnowledgeAuthority: false,
    providerInvocationAuthorizedByPhase3: false,
    deterministicFallbackRequired: true
  };
}

export function routeKapAiCost({ eligibility }) {
  const requestedTier = eligibility?.status === 'AI_RECOMMENDED'
    ? 'TIER_2_ADVANCED_SYNTHESIS'
    : eligibility?.status === 'AI_OPTIONAL'
      ? 'TIER_1_LOW_COST_SYNTHESIS'
      : 'TIER_0_DETERMINISTIC';
  return {
    schemaVersion: 'PHI-OS-KAP-AI-COST-ROUTING-v1.0.0',
    requestedTier,
    activeTier: 'TIER_0_DETERMINISTIC',
    providerInvoked: false,
    paidProviderRequired: false,
    fallbackReason: requestedTier === 'TIER_0_DETERMINISTIC' ? null : 'PHASE3_PROVIDER_INVOCATION_NOT_ACTIVATED',
    answerMayStillBeDelivered: true
  };
}

export function projectKapSources(bundle, depth = DEFAULT_DEPTH) {
  const profile = DEPTHS[normalizeAnswerDepth(depth)];
  const hrefByNode = new Map();
  for (const node of [...(bundle?.nodeMatches?.primaryNodes || []), ...(bundle?.nodeMatches?.supportingNodes || [])]) {
    const href = (node.sources || []).find(source => source.href)?.href || null;
    if (href) hrefByNode.set(node.nodeCode, href);
  }
  return (bundle?.sources || []).slice(0, profile.sourceItems).map(source => Object.freeze({
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    authorityLabel: source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE'
      ? 'PUBLISHED_CANONICAL_KNOWLEDGE'
      : 'REVIEWED_MANUSCRIPT_KNOWLEDGE',
    nodeCode: source.nodeCode || null,
    fragmentCode: source.fragmentCode || null,
    sectionCode: source.sectionCode || null,
    bookCode: source.bookCode || null,
    partCode: source.partCode || null,
    pageRange: source.pageRange || null,
    href: source.nodeCode ? (hrefByNode.get(source.nodeCode) || null) : null,
    questionScopedExcerpt: canonicalText(source.text),
    rawFullSourceExposed: false
  }));
}

export function projectKapUnknownBoundary({ bundle, coverageDecision, locale }) {
  const copy = localeCopy(locale);
  const unknowns = mapUnknowns(bundle, locale);
  const status = coverageDecision?.status || 'INSUFFICIENT_COVERAGE';
  const knowledgeStatus = status === 'STRONG_COVERAGE'
    ? 'KNOWN_WITH_DECLARED_BOUNDARIES'
    : status === 'PARTIAL_COVERAGE'
      ? 'PARTIALLY_KNOWN'
      : status === 'OUT_OF_SCOPE'
        ? 'OUT_OF_SCOPE'
        : 'INSUFFICIENT';
  const limits = [copy.questionScopedBoundary];
  if (bundle?.normalization?.hints?.containsPersonalContextHint) limits.push(copy.personalBoundary);
  if (status === 'PARTIAL_COVERAGE') limits.push(copy.partial);
  return {
    schemaVersion: 'PHI-OS-KAP-UNKNOWN-BOUNDARY-PROJECTION-v1.0.0',
    knowledgeStatus,
    coverageStatus: status,
    knownSourceCount: bundle?.sources?.length || 0,
    unknowns,
    limits: unique(limits),
    guidedReadingRoutingActivated: false,
    realityJourneyRoutingActivated: false
  };
}

export function composeDeterministicKapAnswer({ bundle, coverageDecision, depth = DEFAULT_DEPTH, now = new Date() }) {
  if (!bundle?.bundleId) throw new Error('KAP_GROUNDING_BUNDLE_REQUIRED');
  const normalizedDepth = normalizeAnswerDepth(depth);
  const profile = DEPTHS[normalizedDepth];
  const locale = bundle.question?.locale || 'zh-Hans';
  const copy = localeCopy(locale);
  const all = groundedSentences(bundle);
  const direct = all.slice(0, profile.directSentences);
  const directTexts = new Set(direct.map(item => item.text));
  const mechanismPool = unique([
    ...facetBackedSentences(bundle, all).map(item => item.text),
    ...all.map(item => item.text)
  ]).filter(text => !directTexts.has(text));
  const mechanisms = mechanismPool.slice(0, profile.mechanismItems);
  const used = new Set([...directTexts, ...mechanisms]);
  const remaining = all.map(item => item.text).filter(text => !used.has(text));
  const whyItMatters = remaining.slice(0, profile.whyItems);
  const unknowns = mapUnknowns(bundle, locale);
  const boundaries = [copy.questionScopedBoundary];
  if (bundle?.normalization?.hints?.containsPersonalContextHint) boundaries.push(copy.personalBoundary);
  const eligible = coverageDecision?.answerCompositionEligible === true;
  const directAnswer = eligible
    ? direct.map(item => item.text).join(locale === 'zh-Hans' ? '' : ' ')
    : coverageDecision?.status === 'OUT_OF_SCOPE' ? copy.outOfScope : copy.insufficient;
  const whatToObserve = eligible && bundle?.normalization?.hints?.containsPersonalContextHint && normalizedDepth !== 'QUICK'
    ? [copy.observe]
    : [];
  const primaryNodeCodes = (bundle?.nodeMatches?.primaryNodes || []).map(node => node.nodeCode);
  const supportingNodeCodes = (bundle?.nodeMatches?.supportingNodes || []).map(node => node.nodeCode);
  const relatedNodeCodes = bundle?.nodeMatches?.relatedPublishedNodeCodes || [];
  const manuscriptRefs = (bundle?.sources || []).filter(source => source.sourceType === 'COMPLETED_MANUSCRIPT').map(source => source.sectionCode).filter(Boolean);
  const publishedRefs = (bundle?.sources || []).filter(source => source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE').map(source => source.fragmentCode || source.nodeCode).filter(Boolean);
  const answerIdKey = `${bundle.bundleId}|${normalizedDepth}|${coverageDecision?.status || 'UNKNOWN'}`;
  return {
    schemaVersion: 'PHI-OS-QUESTION-SCOPED-KNOWLEDGE-ANSWER-v1.0.0',
    answerId: `KAP-A-v1-${stableHash(answerIdKey)}`,
    question: bundle.question?.text || '',
    normalizedQuestion: bundle.normalization?.searchText || bundle.question?.text || '',
    locale,
    answerMode: 'KNOWLEDGE_ANSWER',
    authorityClass: 'QUESTION_SCOPED_NON_AUTHORITATIVE_PROJECTION',
    coverageStatus: coverageDecision?.status || 'INSUFFICIENT_COVERAGE',
    groundingBundleId: bundle.bundleId,
    knowledgeRefs: {
      primaryNodeCodes,
      supportingNodeCodes,
      relatedNodeCodes,
      manuscriptRefs,
      publishedRefs
    },
    content: {
      directAnswer,
      mechanism: eligible ? mechanisms : [],
      whyItMatters: eligible ? whyItMatters : [],
      whatToObserve,
      boundaries: unique(boundaries),
      unknowns,
      relatedKnowledge: relatedKnowledge(bundle, profile.relatedItems)
    },
    generation: {
      generationMode: 'DETERMINISTIC',
      generativeModelUsed: false,
      modelRef: null
    },
    lifecycle: {
      createdAt: now.toISOString(),
      expiresAt: null,
      persistentCaseCreated: false
    },
    governance: {
      publicationStatus: 'NOT_PUBLICATION',
      canonicalAuthorityStatus: 'NONE',
      realityReadingStatus: 'NOT_REALITY_READING'
    }
  };
}

export function composeKapAnswerProjection({ bundle, coverageDecision, depth = DEFAULT_DEPTH, now = new Date() }) {
  const normalizedDepth = normalizeAnswerDepth(depth);
  const aiEligibility = evaluateKapAiEligibility({ bundle, coverageDecision, depth: normalizedDepth });
  const aiRouting = routeKapAiCost({ eligibility: aiEligibility });
  const answer = composeDeterministicKapAnswer({ bundle, coverageDecision, depth: normalizedDepth, now });
  const sources = projectKapSources(bundle, normalizedDepth);
  const boundary = projectKapUnknownBoundary({ bundle, coverageDecision, locale: answer.locale });
  return {
    schemaVersion: 'PHI-OS-ASK-PHIOS-RESPONSE-v1.0.0',
    capability: 'ASK_PHIOS',
    answerDepth: normalizedDepth,
    answer,
    sources,
    boundary,
    coverage: coverageDecision,
    ai: {
      eligibility: aiEligibility,
      routing: aiRouting,
      providerInvoked: false,
      generativeModelUsed: false
    },
    production: {
      independentlyDeliverable: true,
      requiresMcd: false,
      requiresGuidedReading: false,
      requiresRealityJourney: false,
      deterministicFallbackAvailable: true
    },
    governance: {
      knowledgeAuthorityUnchanged: true,
      publicationAuthorityUnchanged: true,
      realityReadingAuthorityUnchanged: true,
      persistentCaseCreated: false,
      upstreamGroundedAnswerConsumed: false
    }
  };
}

export async function runAskPhiosPipeline({ input, request, env = {}, depth = DEFAULT_DEPTH, retrievalOptions = {}, scopeDisposition = 'KNOWLEDGE_QUERY', now = new Date() }) {
  const grounding = await runKapGroundingPipeline({ input, request, env, retrievalOptions, scopeDisposition });
  const projection = composeKapAnswerProjection({
    bundle: grounding.groundingBundle,
    coverageDecision: grounding.coverageDecision,
    depth,
    now
  });
  return {
    ...projection,
    grounding: {
      bundleId: grounding.groundingBundle.bundleId,
      retrievalAuthority: grounding.retrieval?.authority || 'KSAR_KNOWLEDGE_ACCESS',
      sourceCount: grounding.groundingBundle.sources.length,
      upstreamGroundedAnswerPresent: grounding.groundingBundle.retrieval.upstreamGroundedAnswerPresent,
      upstreamGroundedAnswerConsumed: false
    }
  };
}

export const KAP_ANSWER_DEPTHS = Object.freeze(Object.keys(DEPTHS));
