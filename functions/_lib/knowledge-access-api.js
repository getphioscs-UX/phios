import { handlePublicKnowledgeRequest } from './public-knowledge-api.js';
import {
  MANUSCRIPT_SOURCE_LIMITS,
  MANUSCRIPT_GROUNDING_LIMITS,
  loadR2RetrievalCorpus,
  queryTerms,
  searchManuscriptCorpus
} from '../knowledge-runtime/manuscript-source-runtime.js';

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

async function publishedProjection({ request, env, query, locale, mode }) {
  const url = new URL(request.url);
  url.pathname = '/api/public-knowledge';
  url.search = new URLSearchParams({ q: query, locale, mode }).toString();
  const result = await handlePublicKnowledgeRequest(new Request(url, { method: 'GET' }), env);
  return result.json();
}

async function manuscriptProjection({ env, query, locale }) {
  const [registry, bindings, readability] = await Promise.all([
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-readability-review-v1.json')
  ]);
  const sources = registry.records.filter(source => source.locale === locale);
  if (!sources.length) return { status: 'locale_unavailable', records: [], groundingRecords: [], errors: [] };
  if (!env?.MANUSCRIPTS?.get) return { status: 'storage_unavailable', records: [], groundingRecords: [], errors: ['MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE'] };

  const settled = await Promise.allSettled(sources.map(async source => {
    const corpus = await loadR2RetrievalCorpus(env.MANUSCRIPTS, source);
    const publicRecords = searchManuscriptCorpus({ corpus, source, bindings, readability, query });
    const groundingRecords = searchManuscriptCorpus({
      corpus,
      source,
      bindings,
      readability,
      query,
      maximumResults: MANUSCRIPT_GROUNDING_LIMITS.maximumResults,
      maximumExcerptChars: MANUSCRIPT_GROUNDING_LIMITS.maximumExcerptCharsPerResult,
      maximumTotalExcerptChars: MANUSCRIPT_GROUNDING_LIMITS.maximumTotalExcerptChars
    });
    return { publicRecords, groundingRecords };
  }));
  const records = settled.flatMap(result => result.status === 'fulfilled' ? result.value.publicRecords : []);
  const groundingRecords = settled.flatMap(result => result.status === 'fulfilled' ? result.value.groundingRecords : []);
  const errors = settled.filter(result => result.status === 'rejected').map(result => result.reason?.code || 'MANUSCRIPT_SOURCE_QUERY_FAILED');
  records.sort((a, b) => b.score - a.score || a.sectionCode.localeCompare(b.sectionCode));
  groundingRecords.sort((a, b) => b.score - a.score || a.sectionCode.localeCompare(b.sectionCode));
  return {
    status: records.length ? 'covered' : (errors.length === sources.length ? 'unavailable' : 'no_match'),
    records: records.slice(0, MANUSCRIPT_SOURCE_LIMITS.maximumResults),
    groundingRecords: groundingRecords.slice(0, MANUSCRIPT_GROUNDING_LIMITS.maximumResults),
    errors
  };
}

function groundingFrom(published, manuscript) {
  const sources = [];
  for (const fragment of published?.projection?.fragments || []) {
    sources.push({
      sourceId: `PUBLISHED:${published.projection.nodeCode}:${fragment.fragmentCode}`,
      sourceType: 'PUBLISHED_CANONICAL_ARTICLE',
      nodeCode: published.projection.nodeCode,
      fragmentCode: fragment.fragmentCode,
      digest: fragment.digest,
      text: fragment.text
    });
  }
  for (const record of manuscript?.groundingRecords || manuscript?.records || []) {
    sources.push({
      sourceId: `MANUSCRIPT:${record.sectionCode}`,
      sourceType: record.sourceType,
      bookCode: record.bookCode,
      partCode: record.partCode,
      sectionCode: record.sectionCode,
      heading: record.heading,
      pageRange: record.pageRange,
      sourceDigest: record.sourceDigest,
      canonicalBinding: record.canonicalBinding,
      readability: record.readability,
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
    .match(/[^。！？!?]+[。！？!?]?/g)?.map(value => value.trim()).filter(value => value.length >= 12) || [];
}

function deterministicGroundedAnswer(query, grounding, locale) {
  if (!grounding.allowed) return null;
  const terms = queryTerms(query);
  const candidates = [];
  for (const source of grounding.sources) {
    for (const sentence of splitSentences(source.text)) {
      const lower = sentence.toLocaleLowerCase();
      let score = 0;
      for (const term of terms) if (lower.includes(term)) score += term.length > 2 ? 3 : 1;
      if (source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE') score += 2;
      candidates.push({ sentence, score, source });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);
  const selected = [];
  const seen = new Set();
  let chars = 0;
  for (const item of candidates) {
    const key = item.sentence.normalize('NFKC');
    if (seen.has(key)) continue;
    if (selected.length && item.score <= 0) continue;
    const next = chars + item.sentence.length;
    if (next > MAX_ANSWER_CHARS && selected.length) continue;
    seen.add(key);
    selected.push(item);
    chars = next;
    if (selected.length >= 4 || chars >= MAX_ANSWER_CHARS) break;
  }
  if (!selected.length && candidates.length) selected.push(candidates[0]);
  if (!selected.length) return null;
  return {
    present: true,
    projectionType: 'DETERMINISTIC_EXTRACTIVE_GROUNDED_ANSWER',
    generativeModelUsed: false,
    locale,
    text: selected.map(item => item.sentence).join(locale === 'zh-Hans' ? '\n\n' : ' '),
    sourceReferences: [...new Set(selected.map(item => item.source.sourceId))],
    authorityNotice: 'This answer is a question-scoped extractive projection from returned governed sources. It does not create Canonical Node or Published Article authority.'
  };
}

export async function handleKnowledgeAccessRequest(request, env = {}) {
  if (request.method !== 'GET') return response({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const locale = url.searchParams.get('locale') || 'zh-Hans';
  const mode = url.searchParams.get('mode') || 'auto';
  const sourceMode = url.searchParams.get('source') || 'hybrid';
  if (!query || query.length > MAX_QUERY_LENGTH) return response({ ok: false, error: { code: 'QUERY_INVALID' } }, 400);
  if (!LOCALES.has(locale)) return response({ ok: false, error: { code: 'LOCALE_UNSUPPORTED' } }, 400);
  if (!MODES.has(mode)) return response({ ok: false, error: { code: 'MODE_UNSUPPORTED' } }, 400);
  if (!SOURCES.has(sourceMode)) return response({ ok: false, error: { code: 'SOURCE_MODE_UNSUPPORTED' } }, 400);

  let published = null;
  let manuscript = { status: 'not_requested', records: [], groundingRecords: [], errors: [] };
  if (sourceMode !== 'manuscript') published = await publishedProjection({ request, env, query, locale, mode });
  if (sourceMode !== 'published') manuscript = await manuscriptProjection({ env, query, locale });

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

  const answerGrounding = groundingFrom(published, manuscript);
  const groundedAnswer = deterministicGroundedAnswer(query, answerGrounding, locale);
  answerGrounding.generatedAnswerPresent = Boolean(groundedAnswer);

  return response({
    ok: true,
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
    answerGrounding,
    authorityBoundary: {
      publishedArticleAuthorityUnchanged: true,
      completedManuscriptIsValidKnowledgeSource: true,
      sourceNativeSectionMayAnswerWithoutCanonicalNodeClaim: true,
      pendingCanonicalBindingIsNotCanonicalAuthority: true,
      manuscriptReadabilityReviewIsSeparateFromCanonicalAcceptance: true,
      bookPurchaseAndKnowledgeQueryAreSeparateCapabilities: true
    }
  });
}

export { deterministicGroundedAnswer, groundingFrom };
