import { handlePublicKnowledgeRequest } from './public-knowledge-api.js';
import {
  MANUSCRIPT_SOURCE_LIMITS,
  loadR2RetrievalCorpus,
  queryTerms,
  manuscriptQueryTerms,
  searchManuscriptCorpus
} from '../knowledge-runtime/manuscript-source-runtime.js';
import {retrieveAtlasScope} from './atlas-retrieval-scope.js';

const MODES = new Set(['auto', 'overview', 'focused', 'full_article', 'continuity']);
const SOURCES = new Set(['auto', 'hybrid', 'published', 'manuscript']);
const LOCALES = new Set(['zh-Hans', 'en']);
const MAX_QUERY_LENGTH = 500;
const MAX_ANSWER_CHARS = 1600;

const response = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  }
});

async function readAssetJson(env, path) {
  if (!env?.ASSETS?.fetch) throw new Error('KNOWLEDGE_ACCESS_ASSETS_UNAVAILABLE');
  const result = await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));
  if (!result.ok) throw new Error(`KNOWLEDGE_ACCESS_ASSET_UNAVAILABLE:${path}`);
  return result.json();
}

async function validateSourceAcceptance(env, source) {
  if (!source.acceptancePath || !source.acceptanceSha256) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_REQUIRED');
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/${source.acceptancePath}`));
  if (!response.ok) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_UNAVAILABLE');
  const bytes = await response.text();
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const acceptance = JSON.parse(bytes);
  if (digest !== source.acceptanceSha256 || acceptance.sourceSha256 !== source.sourceSha256 || acceptance.corpusSha256 !== source.corpusSha256 || acceptance.allRecordsHumanAccepted !== true || Number(acceptance.recordCount) !== Number(source.recordCount)) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_IDENTITY_MISMATCH');
}

async function publishedProjection({ request, env, query, locale, mode }) {
  const url = new URL(request.url);
  url.pathname = '/api/public-knowledge';
  url.search = new URLSearchParams({ q: query, locale, mode }).toString();
  const result = await handlePublicKnowledgeRequest(new Request(url, { method: 'GET' }), env);
  return result.json();
}

async function manuscriptProjection({ env, query, locale, bookCode }) {
  // The Pages Preview checkpoint exercises public knowledge and private reports,
  // not production manuscript retrieval. R2 bindings are not inherited.
  if (env?.PHIOS_ENVIRONMENT === 'qa' && env.PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED !== 'true') {
    return { status: 'disabled_in_preview', records: [], errors: [] };
  }
  const [registry, reviewedRegistry, bindings, corrections, semanticProfiles] = await Promise.all([
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v3.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json'),
    readAssetJson(env, 'content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book4-a6/kir-r2-book-i-iv-semantic-retrieval-profiles-v2.json')
  ]);
  const sources = registry.records
    .filter(source => source.locale === locale && (source.runtimeAdmission !== 'NOT_ADMITTED' || (env.PHIOS_MANUSCRIPT_DERIVATIVE_QA === 'true' && source.sourceAcceptancePath && source.version?.startsWith('owner-final-20261011-'))) && (!bookCode || source.bookCode === bookCode))
    .map(source => {
      if (source.runtimeAdmission === 'ADMITTED_READABILITY_SOURCE_PENDING_REMOTE_OBJECT') return source;
      if (env.PHIOS_MANUSCRIPT_DERIVATIVE_QA === 'true' && source.sourceAcceptancePath) return source;
      const reviewed = reviewedRegistry.records.find(record => record.sourceCode === source.sourceCode && record.locale === source.locale);
      if (!reviewed || reviewed.humanReadabilityStatus !== 'HUMAN_REVIEW_COMPLETE') return null;
      return {
        ...source,
        r2ObjectKey: reviewed.r2ObjectKey,
        retrievalCorpusSha256: reviewed.retrievalCorpusSha256,
        activeCorpusAuthority: reviewed.corpusAuthority,
        humanReadabilityStatus: reviewed.humanReadabilityStatus
      };
    })
    .filter(Boolean);
  if (!sources.length) return { status: locale === 'en' ? 'locale_unavailable' : 'source_not_admitted', records: [], errors: [], bookCode: bookCode || null };
  if (!env?.MANUSCRIPTS?.get) return { status: 'storage_unavailable', records: [], errors: ['MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE'] };

  const settled = await Promise.allSettled(sources.map(async source => {
    if (source.sourceAcceptancePath) {
      const result = await env.ASSETS.fetch(new Request(`https://assets.local/${source.sourceAcceptancePath}`));
      if (!result.ok) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_UNAVAILABLE');
      const bytes = await result.text();
      const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes)))].map(b=>b.toString(16).padStart(2,'0')).join('');
      const acceptance = JSON.parse(bytes);
      if (actual !== source.sourceAcceptanceSha256 || acceptance.sourceSha256 !== source.sourceSha256 || acceptance.status !== 'HUMAN_ACCEPTED_SOURCE_IDENTITY' || acceptance.scope !== 'CURRENT_CHINESE_SOURCE_BINARY_ONLY') throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_IDENTITY_MISMATCH');
    }
    if (source.runtimeAdmission === 'ADMITTED_READABILITY_SOURCE_PENDING_REMOTE_OBJECT') await validateSourceAcceptance(env, source);
    const corpus = await loadR2RetrievalCorpus(env.MANUSCRIPTS, source);
    return searchManuscriptCorpus({ corpus, source, bindings, corrections, query, profiles: semanticProfiles.profiles });
  }));
  const records = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const errors = settled.filter(result => result.status === 'rejected').map(result => result.reason?.code || result.reason?.message || 'MANUSCRIPT_SOURCE_QUERY_FAILED');
  records.sort((a, b) => b.score - a.score || a.sectionCode.localeCompare(b.sectionCode));
  return {
    status: records.length ? 'covered' : (errors.length === sources.length ? 'unavailable' : 'no_match'),
    records: records.slice(0, MANUSCRIPT_SOURCE_LIMITS.maximumResults),
    errors
  };
}

function groundingFrom(published, manuscript) {
  const sources = [];
  for (const fragment of published?.projection?.fragments || []) {
    sources.push({
      sourceType: 'PUBLISHED_CANONICAL_ARTICLE',
      nodeCode: published.projection.nodeCode,
      fragmentCode: fragment.fragmentCode,
      digest: fragment.digest,
      text: fragment.text,
      // BOOK_VII_ADMISSION_METADATA: preserve governed projection metadata only.
      ...(fragment.bookId==='BOOK-7'?{nodeCode:fragment.nodeCode||published.projection.nodeCode,bookId:fragment.bookId,bookCode:fragment.bookCode,partCode:fragment.partCode,scopeMatch:fragment.scopeMatch,publicationStatus:fragment.publicationStatus,authorityOwner:fragment.authorityOwner,sourceType:fragment.sourceType,epistemicEvidence:fragment.epistemicEvidence,canonicalProseAuthority:fragment.canonicalProseAuthority,ocrAuthority:fragment.ocrAuthority}:{})
    });
  }
  for (const record of manuscript?.records || []) {
    const topScore = manuscript.records[0]?.score || 0;
    if (record.sourceVersion?.startsWith('owner-final-20261011-') && record !== manuscript.records[0]) continue;
    if (topScore >= 800 && record.score < topScore * 0.8) continue;
    sources.push({
      sourceType: record.sourceType,
      bookCode: record.bookCode,
      partCode: record.partCode,
      sectionCode: record.sectionCode,
      pageRange: record.pageRange,
      sourceDigest: record.sourceDigest,
      canonicalBinding: record.canonicalBinding,
      sourceCode: record.sourceCode,
      sourceVersion: record.sourceVersion,
      sourceBinaryDigest: record.sourceBinaryDigest,
      sourceAcceptanceDigest: record.sourceAcceptanceDigest,
      text: record.excerpt
    });
  }
  return {
    allowed: sources.length > 0,
    generatedAnswerPresent: false,
    policy: 'DOWNSTREAM_SUMMARY_OR_ANSWER_MUST_USE_ONLY_RETURNED_GROUNDING_AND_PRESERVE_SOURCE_BOUNDARIES',
    sources
  };
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .match(/[^。！？!?]+[。！？!?]?/g)
    ?.map(value => value.trim())
    .filter(value => value.length >= 12) || [];
}

export function deterministicGroundedAnswer(query, grounding, locale) {
  if (!grounding?.allowed) return null;
  const terms = manuscriptQueryTerms(query);
  if (!terms.length) return null;
  const candidates = [];
  for (const source of grounding.sources || []) {
    const sourceId = source.sourceId || (
      source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE'
        ? `PUBLISHED:${source.nodeCode}:${source.fragmentCode}`
        : `MANUSCRIPT:${source.sectionCode}`
    );
    for (const sentence of splitSentences(source.text)) {
      if (/^…|…$/.test(sentence)) continue;
      const normalized = sentence.toLocaleLowerCase();
      let score = source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE' ? 2 : 0;
      for (const term of terms) if (normalized.includes(term)) score += term.length > 2 ? 3 : 1;
      candidates.push({ sentence, score, sourceId });
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.sentence.length - right.sentence.length);
  const selected = []; const seen = new Set(); let characters = 0;
  for (const candidate of candidates) {
    const key = candidate.sentence.normalize('NFKC');
    if (seen.has(key) || candidate.score <= 0) continue;
    if (characters + candidate.sentence.length > MAX_ANSWER_CHARS) continue;
    seen.add(key); selected.push(candidate); characters += candidate.sentence.length;
    if (selected.length >= 4 || characters >= MAX_ANSWER_CHARS) break;
  }
  if (!selected.length) return null;
  return {
    present: true,
    projectionType: 'DETERMINISTIC_EXTRACTIVE_GROUNDED_ANSWER',
    generativeModelUsed: false,
    locale,
    text: selected.map(item => item.sentence).join(locale === 'zh-Hans' ? '\n\n' : ' '),
    sourceReferences: [...new Set(selected.map(item => item.sourceId))],
    authorityNotice: 'This answer is a question-scoped extractive projection from returned governed sources. It does not create Canonical Node or Published Article authority.'
  };
}

export async function handleKnowledgeAccessRequest(request, env = {}, options = {}) {
  if (request.method !== 'GET') return response({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const locale = url.searchParams.get('locale') || 'zh-Hans';
  const mode = url.searchParams.get('mode') || 'auto';
  const sourceMode = url.searchParams.get('source') || 'hybrid';
  const bookCode = url.searchParams.get('bookCode') || null;
  if (bookCode && !/^BOOK-[1-7]$/.test(bookCode)) return response({ ok: false, error: { code: 'BOOK_SCOPE_INVALID' } }, 400);
  if (!query || query.length > MAX_QUERY_LENGTH) return response({ ok: false, error: { code: 'QUERY_INVALID' } }, 400);
  if (!LOCALES.has(locale)) return response({ ok: false, error: { code: 'LOCALE_UNSUPPORTED' } }, 400);
  if (!MODES.has(mode)) return response({ ok: false, error: { code: 'MODE_UNSUPPORTED' } }, 400);
  if (!SOURCES.has(sourceMode)) return response({ ok: false, error: { code: 'SOURCE_MODE_UNSUPPORTED' } }, 400);

  let published = null;
  let manuscript = { status: 'not_requested', records: [], errors: [] };
  if (sourceMode !== 'manuscript') published = await publishedProjection({ request, env, query, locale, mode });
  if (sourceMode !== 'published') manuscript = await manuscriptProjection({ env, query, locale, bookCode });

  const publishedCovered = published?.coverage?.level && published.coverage.level !== 'none';
  const manuscriptCovered = manuscript.records.length > 0;
  const coverage = publishedCovered && manuscriptCovered
    ? 'hybrid'
    : publishedCovered
      ? 'published'
      : manuscriptCovered
        ? 'manuscript'
        : 'none';

  if (sourceMode === 'manuscript' && manuscript.status === 'storage_unavailable') {
    return response({ ok: false, error: { code: 'MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE' } }, 503);
  }

  const atlas = await retrieveAtlasScope({env, scope:options.retrievalScope, locale, question:query});
  const answerGrounding = groundingFrom(published, manuscript);
  answerGrounding.sources = atlas.scope ? atlas.sources : [...atlas.sources, ...answerGrounding.sources];
  // Explicit Atlas selection cannot obtain its answer from unrelated canonical
  // nodes or relationship expansion when the selected object has no evidence.
  if(atlas.scope){published={...published,results:[]};manuscript={...manuscript,records:[]};}
  answerGrounding.allowed = answerGrounding.sources.length > 0;
  const requiresComparativeUnit = sourceMode === 'manuscript' && /区别|比较|关联|之间.*关系|compare|difference|relationship between/i.test(query);
  const predictionCertainty = /肯定|保证|一定|guarantee|certainly|definitely/i.test(query) && !/不能保证|无法保证|不保证|不能确定|cannot guarantee|can.t guarantee|not guaranteed/i.test(query);
  const unsupportedPrediction = predictionCertainty && /明[天年]|将来|未来|下(?:周|星期|个?月|年)|tomorrow|future|next\s+(?:week|month|year)/i.test(query);
  const ambiguous = manuscriptQueryTerms(query).length === 0;
  const groundedAnswer = requiresComparativeUnit || unsupportedPrediction || ambiguous ? null : deterministicGroundedAnswer(query, answerGrounding, locale);
  answerGrounding.generatedAnswerPresent = Boolean(groundedAnswer);

  return response({
    ok: true,
    providerCalls: 0,
    providerCostUSD: 0,
    retrievalAssessment: { retrievedContent: manuscriptCovered || Boolean(publishedCovered), correctBookScope: !bookCode || manuscript.records.every(record => record.bookCode === bookCode) },
    answerAssessment: { state: unsupportedPrediction ? 'UNSUPPORTED_PREDICTION' : ambiguous ? 'NEEDS_CLARIFICATION' : requiresComparativeUnit ? 'COMPARATIVE_EXPLANATION_UNIT_REQUIRED' : groundedAnswer ? 'EXTRACTIVE_CANDIDATE_REQUIRES_QUESTION_FIT_VALIDATION' : 'NO_SUPPORTED_ANSWER', retrievalDoesNotProveAnswer: true },
    query: { text: query, locale, mode, source: sourceMode },
    coverage: {
      level: coverage,
      published: published?.coverage?.level || 'not_requested',
      manuscript: manuscript.status,
      answerGroundingAllowed: publishedCovered || manuscriptCovered
    },
    groundedAnswer,
    published,
    manuscript: {
      status: manuscript.status,
      records: manuscript.records,
      errors: manuscript.errors,
      exposure: {
        rawFullBookAvailable: false,
        rawSectionBodyAvailable: false,
        maximumExcerptCharsPerResult: MANUSCRIPT_SOURCE_LIMITS.maximumExcerptCharsPerResult,
        maximumTotalExcerptChars: MANUSCRIPT_SOURCE_LIMITS.maximumTotalExcerptChars
      }
    },
    retrievalScope: atlas.scope,
    retrievalChain: atlas.chain,
    answerGrounding,
    authorityBoundary: {
      publishedArticleAuthorityUnchanged: true,
      completedManuscriptIsValidKnowledgeSource: true,
      activeManuscriptCorpusIsHumanReviewed: true,
      sourceNativeSectionMayAnswerWithoutCanonicalNodeClaim: true,
      pendingCanonicalBindingIsNotCanonicalAuthority: true,
      bookPurchaseAndKnowledgeQueryAreSeparateCapabilities: true
    }
  });
}
