import { handleKnowledgeAccessRequest } from './knowledge-access-api.js';
import { queryTerms } from '../knowledge-runtime/manuscript-source-runtime.js';

const SUPPORTED_LOCALES = new Set(['zh-Hans', 'en']);
const MAX_QUERY_LENGTH = 500;
const DEFAULT_SOURCE_MODE = 'hybrid';
const DEFAULT_RETRIEVAL_MODE = 'auto';
const MAX_NODE_MATCHES = 8;
const MAX_RELATIONSHIPS = 8;
const MAX_MECHANISM_FACETS = 12;

const canonicalText = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const searchText = value => canonicalText(value).toLocaleLowerCase();
const unique = values => [...new Set(values.filter(Boolean))];

function compactObject(value = {}, allowed = []) {
  const output = {};
  for (const key of allowed) {
    const current = value?.[key];
    if (current !== undefined && current !== null && current !== '') output[key] = current;
  }
  return output;
}

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function createKapQuestionIntake(input = {}) {
  const rawQuestion = typeof input === 'string' ? input : input.question;
  const question = canonicalText(rawQuestion);
  const locale = typeof input === 'string' ? 'zh-Hans' : (input.locale || 'zh-Hans');
  if (!question || question.length > MAX_QUERY_LENGTH) throw new Error('KAP_QUESTION_INVALID');
  if (!SUPPORTED_LOCALES.has(locale)) throw new Error('KAP_LOCALE_UNSUPPORTED');
  const surfaceContext = compactObject(typeof input === 'string' ? {} : input.surfaceContext, [
    'surfaceType', 'articleSlug', 'bookCode', 'nodeCode'
  ]);
  const sessionRef = canonicalText(typeof input === 'string' ? '' : input.sessionRef).slice(0, 128) || null;
  return {
    schemaVersion: 'PHI-OS-KAP-QUESTION-INTAKE-v1.0.0',
    capability: 'ASK_PHIOS',
    question: {
      originalText: String(rawQuestion ?? ''),
      canonicalText: question
    },
    locale,
    sessionRef,
    surfaceContext,
    governance: {
      createsCanonicalKnowledge: false,
      createsPublication: false,
      createsRealityReading: false,
      createsPersistentCase: false,
      requiresBirthInput: false,
      requiresMethodExecution: false
    }
  };
}

function questionTypeFor(text, locale) {
  const v = searchText(text);
  if (locale === 'zh-Hans') {
    if (/为什么|为何/.test(v)) return 'CAUSAL';
    if (/如何|怎么|怎样/.test(v)) return 'HOW';
    if (/什么是|何谓|是什么意思/.test(v)) return 'DEFINITION';
    if (/区别|差异|比较|不同/.test(v)) return 'COMPARISON';
  } else {
    if (/\bwhy\b/.test(v)) return 'CAUSAL';
    if (/\bhow\b/.test(v)) return 'HOW';
    if (/\bwhat is\b|\bwhat does\b.*\bmean\b/.test(v)) return 'DEFINITION';
    if (/\bdifference\b|\bcompare\b|\bversus\b|\bvs\b/.test(v)) return 'COMPARISON';
  }
  return 'OTHER';
}

function subjectHintFor(text, locale) {
  const v = searchText(text);
  if (locale === 'zh-Hans') {
    if (/我|我的|我们|自己/.test(v)) return 'SELF';
    if (/团队|公司|组织|家庭|伴侣|关系/.test(v)) return 'GROUP_OR_RELATIONSHIP';
  } else {
    if (/\b(i|me|my|mine|myself)\b/.test(v)) return 'SELF';
    if (/\b(team|company|organization|family|partner|relationship)\b/.test(v)) return 'GROUP_OR_RELATIONSHIP';
  }
  return 'GENERAL';
}

function timeScopeFor(text, locale) {
  const v = searchText(text);
  if (locale === 'zh-Hans') {
    if (/最近|近期|这几天|这段时间/.test(v)) return 'RECENT';
    if (/长期|一直|多年|这些年/.test(v)) return 'LONG_TERM';
  } else {
    if (/\brecent(ly)?\b|\blately\b|\bthese days\b/.test(v)) return 'RECENT';
    if (/\blong[- ]term\b|\bfor years\b|\balways\b/.test(v)) return 'LONG_TERM';
  }
  return 'UNSPECIFIED';
}

export function normalizeKapQuestion(intake) {
  if (!intake?.question?.canonicalText) throw new Error('KAP_INTAKE_REQUIRED');
  const text = canonicalText(intake.question.canonicalText);
  return {
    schemaVersion: 'PHI-OS-KAP-NORMALIZED-QUESTION-v1.0.0',
    capability: 'ASK_PHIOS',
    locale: intake.locale,
    originalText: intake.question.originalText,
    canonicalText: text,
    searchText: searchText(text),
    tokens: queryTerms(text),
    hints: {
      intent: 'UNDERSTAND_KNOWLEDGE',
      questionType: questionTypeFor(text, intake.locale),
      subject: subjectHintFor(text, intake.locale),
      timeScope: timeScopeFor(text, intake.locale),
      containsPersonalContextHint: subjectHintFor(text, intake.locale) !== 'GENERAL'
    },
    authority: {
      hintsAreMeaningAuthority: false,
      hintsAreRealityEvidence: false,
      normalizationCreatesKnowledge: false,
      normalizationCreatesReading: false
    }
  };
}

export function buildKapRetrievalRequest(normalized, options = {}) {
  if (!normalized?.canonicalText) throw new Error('KAP_NORMALIZED_QUESTION_REQUIRED');
  const source = options.source || DEFAULT_SOURCE_MODE;
  const mode = options.mode || DEFAULT_RETRIEVAL_MODE;
  return {
    authority: 'KSAR_KNOWLEDGE_ACCESS',
    endpoint: '/api/knowledge-access',
    method: 'GET',
    params: {
      q: normalized.canonicalText,
      locale: normalized.locale,
      mode,
      source
    },
    governance: {
      directCanonicalRegistryScanAllowed: false,
      rawFullBookRequested: false,
      answerCompositionRequested: false,
      aiRequested: false,
      publicationRequested: false,
      realityReadingRequested: false
    }
  };
}

export async function retrieveKapKnowledge({ request, env = {}, normalized, options = {} }) {
  const retrievalRequest = buildKapRetrievalRequest(normalized, options);
  const baseUrl = request?.url || 'https://kap.local/';
  const url = new URL('/api/knowledge-access', baseUrl);
  url.search = new URLSearchParams(retrievalRequest.params).toString();
  const response = await handleKnowledgeAccessRequest(new Request(url, { method: 'GET' }), env);
  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error || { code: 'KAP_KNOWLEDGE_RETRIEVAL_FAILED' },
      retrievalRequest,
      upstreamGroundedAnswerConsumed: false
    };
  }
  return {
    ok: true,
    status: response.status,
    authority: 'KSAR_KNOWLEDGE_ACCESS',
    retrievalRequest,
    query: payload.query,
    coverage: payload.coverage,
    published: payload.published ? {
      coverage: payload.published.coverage,
      results: payload.published.results || [],
      projection: payload.published.projection,
      readingPath: payload.published.readingPath,
      indexDigest: payload.published.indexDigest
    } : null,
    manuscript: payload.manuscript || { status: 'not_requested', records: [], errors: [] },
    groundingSources: payload.answerGrounding?.sources || [],
    authorityBoundary: payload.authorityBoundary || {},
    upstreamGroundedAnswerPresent: Boolean(payload.groundedAnswer),
    upstreamGroundedAnswerConsumed: false,
    governance: {
      rawFullBookAvailable: payload.manuscript?.exposure?.rawFullBookAvailable === true,
      rawSectionBodyAvailable: payload.manuscript?.exposure?.rawSectionBodyAvailable === true,
      answerComposedByKapPhase2: false,
      canonicalAuthorityCreated: false
    }
  };
}

export function deriveKapNodeMatches(retrieval) {
  if (!retrieval?.ok) return {
    primaryNodes: [], supportingNodes: [], matchedNodeCodes: [], pendingManuscriptSections: [], canonicalAuthorityCreated: false
  };
  const byCode = new Map();
  const pendingManuscriptSections = [];
  for (const [index, result] of (retrieval.published?.results || []).entries()) {
    const record = byCode.get(result.nodeCode) || {
      nodeCode: result.nodeCode,
      title: result.title || null,
      score: Number(result.score || 0),
      sources: [],
      published: true,
      approvedManuscriptBinding: false,
      relationshipExpansionEligible: true
    };
    record.score = Math.max(record.score, Number(result.score || 0));
    record.sources.push({ sourceType: 'PUBLISHED_RETRIEVAL', rank: index + 1, href: result.href || null });
    byCode.set(result.nodeCode, record);
  }
  for (const record of retrieval.manuscript?.records || []) {
    const binding = record.canonicalBinding || { status: 'PENDING', nodeCodes: [] };
    if (binding.status !== 'APPROVED' || !Array.isArray(binding.nodeCodes) || !binding.nodeCodes.length) {
      pendingManuscriptSections.push({ sectionCode: record.sectionCode, canonicalBindingStatus: binding.status || 'PENDING' });
      continue;
    }
    for (const nodeCode of binding.nodeCodes) {
      const node = byCode.get(nodeCode) || {
        nodeCode,
        title: null,
        score: Number(record.score || 0),
        sources: [],
        published: false,
        approvedManuscriptBinding: true,
        relationshipExpansionEligible: false
      };
      node.score = Math.max(node.score, Number(record.score || 0));
      node.approvedManuscriptBinding = true;
      node.sources.push({ sourceType: 'APPROVED_MANUSCRIPT_BINDING', sectionCode: record.sectionCode, mappingCodes: binding.mappingCodes || [] });
      byCode.set(nodeCode, node);
    }
  }
  const ranked = [...byCode.values()]
    .sort((a, b) => b.score - a.score || Number(b.published) - Number(a.published) || a.nodeCode.localeCompare(b.nodeCode))
    .slice(0, MAX_NODE_MATCHES);
  return {
    primaryNodes: ranked.length ? [{ ...ranked[0], matchRole: 'PRIMARY' }] : [],
    supportingNodes: ranked.slice(1).map(node => ({ ...node, matchRole: 'SUPPORTING' })),
    matchedNodeCodes: ranked.map(node => node.nodeCode),
    pendingManuscriptSections,
    canonicalAuthorityCreated: false,
    automaticSemanticBindingUsed: false
  };
}

export function expandKapRelationships({ nodeMatches, relationshipRecords = [], mechanismExpansions = [], locale, limits = {} }) {
  const maxRelationships = Math.min(Number(limits.maximumRelationships || MAX_RELATIONSHIPS), MAX_RELATIONSHIPS);
  const maxFacets = Math.min(Number(limits.maximumMechanismFacets || MAX_MECHANISM_FACETS), MAX_MECHANISM_FACETS);
  const eligibleSourceNodes = new Set([
    ...(nodeMatches?.primaryNodes || []),
    ...(nodeMatches?.supportingNodes || [])
  ].filter(node => node.relationshipExpansionEligible && node.published).map(node => node.nodeCode));
  const selectedRelationships = relationshipRecords
    .filter(row => row.locale === locale && eligibleSourceNodes.has(row.sourceNodeCode))
    .slice(0, maxRelationships);
  const relatedPublishedNodes = unique(selectedRelationships.filter(row => row.targetPublished).map(row => row.targetNodeCode));
  const blockedContinuations = selectedRelationships.filter(row => !row.targetPublished).map(row => ({
    relationshipCode: row.relationshipCode,
    sourceNodeCode: row.sourceNodeCode,
    targetNodeCode: row.targetNodeCode,
    type: row.type,
    reason: 'TARGET_NOT_PUBLISHED_IN_REQUESTED_LOCALE',
    groundingEligible: false
  }));
  const mechanismFacets = [];
  for (const expansion of mechanismExpansions) {
    if (expansion.locale !== locale || !eligibleSourceNodes.has(expansion.nodeCode)) continue;
    if (expansion.providerUsed || expansion.unsupportedInferenceAllowed) continue;
    for (const facet of expansion.mechanismFacets || []) {
      mechanismFacets.push({
        nodeCode: expansion.nodeCode,
        facetCode: facet.facetCode,
        facetKind: facet.facetKind,
        evidenceMode: facet.evidenceMode,
        evidenceFragmentCodes: facet.evidenceFragmentCodes || [],
        groundingEligible: true
      });
      if (mechanismFacets.length >= maxFacets) break;
    }
    if (mechanismFacets.length >= maxFacets) break;
  }
  return {
    depth: 1,
    authority: 'PUBLISHED_GRAPH_ONLY_WITH_CONTROLLED_EVIDENCE_BACKED_MECHANISM_FACETS',
    relatedPublishedNodes,
    relationships: selectedRelationships.filter(row => row.targetPublished).map(row => ({ ...row, groundingEligible: true })),
    blockedContinuations,
    mechanismFacets,
    providerUsed: false,
    unsupportedInferenceUsed: false,
    unpublishedTargetContentInjected: false,
    transitiveExpansionUsed: false
  };
}

async function readAssetJson(env, path) {
  if (!env?.ASSETS?.fetch) return null;
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));
  if (!response.ok) return null;
  return response.json();
}

export async function loadKapRelationshipAuthority(env = {}) {
  const [relationships, expansions] = await Promise.all([
    readAssetJson(env, 'content/knowledge/public/retrieval/relationships.json'),
    readAssetJson(env, 'content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json')
  ]);
  return {
    relationshipRecords: relationships?.records || [],
    mechanismExpansions: expansions?.records || [],
    relationshipProjectionDigest: relationships?.digest || null,
    mechanismExpansionDigest: expansions?.digest || null
  };
}

function groundingSourceId(source) {
  if (source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE') return `PUBLISHED:${source.nodeCode}:${source.fragmentCode}`;
  return `MANUSCRIPT:${source.sectionCode}`;
}

export function buildKnowledgeGroundingBundle({ intake, normalized, retrieval, nodeMatches, expansion }) {
  const sources = (retrieval?.groundingSources || []).map(source => ({
    sourceId: groundingSourceId(source),
    ...source
  }));
  const unknowns = [];
  for (const item of nodeMatches?.pendingManuscriptSections || []) unknowns.push({ code: 'CANONICAL_BINDING_PENDING', ...item });
  for (const item of expansion?.blockedContinuations || []) unknowns.push({
    code: 'RELATED_TARGET_NOT_PUBLISHED',
    targetNodeCode: item.targetNodeCode,
    relationshipCode: item.relationshipCode
  });
  for (const error of retrieval?.manuscript?.errors || []) unknowns.push({ code: error });
  if (!sources.length) unknowns.push({ code: 'NO_GROUNDED_SOURCE_MATCH' });
  const key = `${normalized.locale}|${normalized.searchText}|${sources.map(source => source.sourceId).join('|')}`;
  return {
    schemaVersion: 'PHI-OS-KNOWLEDGE-GROUNDING-BUNDLE-v1.0.0',
    objectType: 'KnowledgeGroundingBundle',
    bundleId: `KGB-v1-${stableHash(key)}`,
    authorityClass: 'GROUNDED_NON_AUTHORITATIVE_INPUT',
    question: {
      capability: intake.capability,
      text: normalized.canonicalText,
      locale: normalized.locale
    },
    normalization: {
      searchText: normalized.searchText,
      tokens: normalized.tokens,
      hints: normalized.hints,
      hintsAreMeaningAuthority: false
    },
    retrieval: {
      authority: retrieval?.authority || 'KSAR_KNOWLEDGE_ACCESS',
      sourceMode: retrieval?.retrievalRequest?.params?.source || DEFAULT_SOURCE_MODE,
      upstreamCoverage: retrieval?.coverage || null,
      upstreamGroundedAnswerPresent: Boolean(retrieval?.upstreamGroundedAnswerPresent),
      upstreamGroundedAnswerConsumed: false
    },
    nodeMatches: {
      primaryNodes: nodeMatches?.primaryNodes || [],
      supportingNodes: nodeMatches?.supportingNodes || [],
      relatedPublishedNodeCodes: expansion?.relatedPublishedNodes || [],
      canonicalAuthorityCreated: false,
      automaticSemanticBindingUsed: false
    },
    relationships: expansion || {
      depth: 0, relationships: [], blockedContinuations: [], mechanismFacets: [], providerUsed: false,
      unsupportedInferenceUsed: false, unpublishedTargetContentInjected: false, transitiveExpansionUsed: false
    },
    sources,
    unknowns,
    excludedMaterial: [
      'RAW_FULL_BOOK',
      'RAW_SECTION_BODY',
      'UNPUBLISHED_RELATIONSHIP_TARGET_CONTENT',
      'UPSTREAM_GROUNDED_ANSWER_TEXT',
      'CLIENT_REALITY_EVIDENCE',
      'METHOD_CALCULATION_RESULT',
      'AI_GENERATED_KNOWLEDGE'
    ],
    governance: {
      answerComposed: false,
      aiUsed: false,
      canonicalAuthorityCreated: false,
      publicationCreated: false,
      realityReadingCreated: false,
      persistentCaseCreated: false,
      rawFullBookExposed: false,
      unpublishedTargetContentInjected: false
    }
  };
}

export function evaluateKapCoverage({ bundle, retrieval, scopeDisposition = 'KNOWLEDGE_QUERY' }) {
  const sourceCount = bundle?.sources?.length || 0;
  const publishedLevel = retrieval?.published?.coverage?.level || retrieval?.coverage?.published || 'none';
  const manuscriptCount = (retrieval?.manuscript?.records || []).length;
  let status;
  const reasonCodes = [];
  if (scopeDisposition === 'OUT_OF_SCOPE') {
    status = 'OUT_OF_SCOPE';
    reasonCodes.push('EXPLICIT_SCOPE_DISPOSITION_OUT_OF_SCOPE');
  } else if (!sourceCount) {
    status = 'INSUFFICIENT_COVERAGE';
    reasonCodes.push('NO_GROUNDED_SOURCE_MATCH');
  } else if (['exact', 'strong'].includes(publishedLevel)) {
    status = 'STRONG_COVERAGE';
    reasonCodes.push('PUBLISHED_MATCH_STRONG_OR_EXACT');
  } else if (retrieval?.coverage?.level === 'hybrid' && manuscriptCount > 0 && publishedLevel !== 'none' && publishedLevel !== 'not_requested') {
    status = 'STRONG_COVERAGE';
    reasonCodes.push('HYBRID_GROUNDED_COVERAGE');
  } else {
    status = 'PARTIAL_COVERAGE';
    reasonCodes.push(manuscriptCount > 0 ? 'MANUSCRIPT_GROUNDING_AVAILABLE' : 'LIMITED_PUBLISHED_GROUNDING_AVAILABLE');
  }
  return {
    schemaVersion: 'PHI-OS-KAP-COVERAGE-DECISION-v1.0.0',
    status,
    reasonCodes,
    sourceCount,
    publishedCoverage: publishedLevel,
    manuscriptResultCount: manuscriptCount,
    answerCompositionEligible: status === 'STRONG_COVERAGE' || status === 'PARTIAL_COVERAGE',
    unknownDisclosureRequired: status !== 'STRONG_COVERAGE' || Boolean(bundle?.unknowns?.length),
    realityJourneyRequired: false,
    guidedReadingRequired: false,
    aiRequired: false,
    createsAuthority: false
  };
}

export async function runKapGroundingPipeline({ input, request, env = {}, retrievalOptions = {}, scopeDisposition = 'KNOWLEDGE_QUERY' }) {
  const intake = createKapQuestionIntake(input);
  const normalized = normalizeKapQuestion(intake);
  const retrieval = await retrieveKapKnowledge({ request, env, normalized, options: retrievalOptions });
  const nodeMatches = deriveKapNodeMatches(retrieval);
  const relationshipAuthority = await loadKapRelationshipAuthority(env);
  const expansion = expandKapRelationships({ nodeMatches, locale: normalized.locale, ...relationshipAuthority });
  const groundingBundle = buildKnowledgeGroundingBundle({ intake, normalized, retrieval, nodeMatches, expansion });
  const coverageDecision = evaluateKapCoverage({ bundle: groundingBundle, retrieval, scopeDisposition });
  return {
    phase: 'KAP-W4-W10',
    answerCompositionPerformed: false,
    intake,
    normalized,
    retrieval,
    nodeMatches,
    relationshipExpansion: expansion,
    groundingBundle,
    coverageDecision
  };
}

export const KAP_GROUNDING_LIMITS = Object.freeze({
  maximumQueryLength: MAX_QUERY_LENGTH,
  maximumNodeMatches: MAX_NODE_MATCHES,
  maximumRelationships: MAX_RELATIONSHIPS,
  maximumMechanismFacets: MAX_MECHANISM_FACETS
});
