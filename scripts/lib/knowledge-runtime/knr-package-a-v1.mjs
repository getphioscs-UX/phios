import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const readJson = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const stable = value => JSON.stringify(value, (key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
  : item, 2) + '\n';
const sha = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');

export function normalizeQuery(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  const normalized = normalizeQuery(value);
  if (!normalized) return [];
  const latin = normalized.split(/\s+/).filter(Boolean);
  const han = [...normalized.replace(/[^\u3400-\u9fff]/g, '')];
  return [...new Set([...latin, ...han])];
}

function overlap(queryTokens, value) {
  if (!queryTokens.length) return 0;
  const target = new Set(tokenize(value));
  return queryTokens.filter(token => target.has(token)).length / queryTokens.length;
}

export async function loadPublishedRetrieval() {
  const names = ['nodes', 'fragments', 'aliases', 'relationships', 'questions', 'publications', 'locale-availability', 'books', 'parts'];
  const [manifest, routingPolicy, rankingPolicy, coveragePolicy, ...projections] = await Promise.all([
    readJson('content/knowledge/public/retrieval/published-retrieval-index.json'),
    readJson('content/knowledge/runtime/knr/package-a/routing-policy-v1.json'),
    readJson('content/knowledge/runtime/knr/package-a/ranking-policy-v1.json'),
    readJson('content/knowledge/runtime/knr/package-a/coverage-policy-v1.json'),
    ...names.map(name => readJson(`content/knowledge/public/retrieval/${name}.json`))
  ]);
  return {
    manifest,
    routingPolicy,
    rankingPolicy,
    coveragePolicy,
    projections: Object.fromEntries(names.map((name, index) => [name, projections[index].records]))
  };
}

export async function routePublishedQuery({ query, locale = 'zh-Hans', limit = 20 } = {}) {
  const data = await loadPublishedRetrieval();
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < data.routingPolicy.minimumQueryLength) {
    return {
      routeCode: 'KNR-ROUTE-NO-QUERY',
      query: String(query ?? ''),
      normalizedQuery,
      requestedLocale: locale,
      candidates: [],
      reason: 'query_too_short'
    };
  }
  if (!data.routingPolicy.supportedLocales.includes(locale)) {
    return {
      routeCode: 'KNR-ROUTE-UNSUPPORTED-LOCALE',
      query: String(query ?? ''),
      normalizedQuery,
      requestedLocale: locale,
      candidates: [],
      reason: 'unsupported_locale'
    };
  }
  const qTokens = tokenize(normalizedQuery);
  const byNode = new Map();
  const ensure = nodeCode => {
    const key = `${nodeCode}:${locale}`;
    if (!byNode.has(key)) byNode.set(key, { nodeCode, locale, evidence: [] });
    return byNode.get(key);
  };
  for (const alias of data.projections.aliases.filter(record => record.locale === locale)) {
    const exact = normalizeQuery(alias.value) === normalizedQuery;
    const ratio = overlap(qTokens, alias.value);
    if (exact || ratio > 0) ensure(alias.nodeCode).evidence.push({ source: 'alias', exact, ratio, code: alias.aliasCode, text: alias.value, aliasType: alias.aliasType });
  }
  for (const question of data.projections.questions.filter(record => record.locale === locale)) {
    const exact = normalizeQuery(question.question) === normalizedQuery;
    const ratio = overlap(qTokens, question.question);
    if (exact || ratio > 0) ensure(question.nodeCode).evidence.push({ source: 'question', exact, ratio, code: question.questionCode, text: question.question, questionType: question.questionType });
  }
  for (const node of data.projections.nodes.filter(record => record.locale === locale)) {
    const titleExact = normalizeQuery(node.title) === normalizedQuery;
    const titleRatio = overlap(qTokens, node.title);
    const summaryRatio = overlap(qTokens, node.summary || '');
    if (titleExact || titleRatio > 0 || summaryRatio > 0) ensure(node.nodeCode).evidence.push({ source: 'node', exact: titleExact, titleRatio, summaryRatio, code: node.authorityRecordCode, text: node.title });
  }
  for (const fragment of data.projections.fragments.filter(record => record.locale === locale)) {
    const ratio = overlap(qTokens, fragment.text);
    if (ratio > 0) ensure(fragment.nodeCode).evidence.push({ source: 'fragment', exact: false, ratio, code: fragment.fragmentCode, text: fragment.text });
  }
  const publishedPairs = new Set(data.projections.publications.map(record => `${record.nodeCode}:${record.locale}`));
  const candidates = [...byNode.values()]
    .filter(candidate => publishedPairs.has(`${candidate.nodeCode}:${candidate.locale}`))
    .slice(0, Math.min(Number(limit) || 20, data.routingPolicy.maximumCandidates));
  return {
    routeCode: candidates.length ? 'KNR-ROUTE-PUBLISHED-CANDIDATES' : 'KNR-ROUTE-NO-COVERAGE',
    query: String(query ?? ''),
    normalizedQuery,
    requestedLocale: locale,
    candidates,
    reason: candidates.length ? null : 'no_published_candidate'
  };
}

export async function rankPublishedCandidates(route) {
  const data = await loadPublishedRetrieval();
  const weights = data.rankingPolicy.weights;
  const nodeBy = new Map(data.projections.nodes.map(node => [`${node.nodeCode}:${node.locale}`, node]));
  const relBy = new Map();
  for (const rel of data.projections.relationships.filter(item => item.targetPublished)) {
    const key = `${rel.sourceNodeCode}:${rel.locale}`;
    relBy.set(key, (relBy.get(key) || 0) + 1);
  }
  const ranked = route.candidates.map(candidate => {
    let score = weights.localeExact;
    let bestRatio = 0;
    let exactMatch = false;
    const supportingFragments = [];
    for (const evidence of candidate.evidence) {
      if (evidence.source === 'alias') {
        if (evidence.exact) score += evidence.aliasType === 'title' ? weights.exactTitle : weights.exactAlias;
        score += evidence.ratio * weights.aliasToken;
        bestRatio = Math.max(bestRatio, evidence.ratio || 0);
        exactMatch ||= evidence.exact;
      } else if (evidence.source === 'question') {
        if (evidence.exact) score += weights.exactQuestion;
        score += evidence.ratio * weights.questionToken;
        bestRatio = Math.max(bestRatio, evidence.ratio || 0);
        exactMatch ||= evidence.exact;
      } else if (evidence.source === 'node') {
        if (evidence.exact) score += weights.exactTitle;
        score += (evidence.titleRatio || 0) * weights.titleToken;
        score += (evidence.summaryRatio || 0) * weights.summaryToken;
        bestRatio = Math.max(bestRatio, evidence.titleRatio || 0, evidence.summaryRatio || 0);
        exactMatch ||= evidence.exact;
      } else if (evidence.source === 'fragment') {
        score += evidence.ratio * weights.fragmentToken;
        bestRatio = Math.max(bestRatio, evidence.ratio || 0);
        supportingFragments.push(evidence.code);
      }
    }
    score += (relBy.get(`${candidate.nodeCode}:${candidate.locale}`) || 0) * weights.publishedRelationship;
    const node = nodeBy.get(`${candidate.nodeCode}:${candidate.locale}`);
    return {
      nodeCode: candidate.nodeCode,
      locale: candidate.locale,
      title: node?.title || null,
      href: node?.href || null,
      score: Number(score.toFixed(6)),
      exactMatch,
      bestMatchRatio: Number(bestRatio.toFixed(6)),
      supportingFragments: [...new Set(supportingFragments)].sort(),
      evidenceCount: candidate.evidence.length
    };
  }).filter(result => result.score >= data.rankingPolicy.minimumResultScore)
    .sort((a, b) => b.score - a.score || a.nodeCode.localeCompare(b.nodeCode) || a.locale.localeCompare(b.locale))
    .slice(0, data.rankingPolicy.maximumResults);
  return {
    rankingCode: ranked.length ? 'KNR-RANKED-PUBLISHED-RESULTS' : 'KNR-RANKED-NO-RESULTS',
    query: route.query,
    normalizedQuery: route.normalizedQuery,
    requestedLocale: route.requestedLocale,
    results: ranked
  };
}

export async function measurePublishedCoverage(ranking) {
  const data = await loadPublishedRetrieval();
  const top = ranking.results[0] || null;
  const ratio = top ? Math.min(1, top.exactMatch ? 1 : top.bestMatchRatio) : 0;
  const thresholds = data.coveragePolicy.thresholds;
  const level = ratio >= thresholds.exact ? 'exact'
    : ratio >= thresholds.strong ? 'strong'
      : ratio >= thresholds.partial ? 'partial'
        : ratio >= thresholds.limited ? 'limited' : 'none';
  const localeRecord = top
    ? data.projections['locale-availability'].find(record => record.nodeCode === top.nodeCode)
    : null;
  return {
    coverageCode: level === 'none' ? 'KNR-COVERAGE-NONE' : 'KNR-COVERAGE-PUBLISHED',
    level,
    ratio: Number(ratio.toFixed(6)),
    supported: level !== 'none' && (top?.supportingFragments.length || 0) >= data.coveragePolicy.minimumSupportingFragments,
    answerGenerationAllowed: false,
    requestedLocale: ranking.requestedLocale,
    topNodeCode: top?.nodeCode || null,
    supportingFragmentCount: top?.supportingFragments.length || 0,
    availableLocales: localeRecord?.locales.filter(item => item.available).map(item => item.locale).sort() || [],
    reason: level === 'none' ? 'no_published_support' : null
  };
}

export async function runPublishedRetrieval(query, locale = 'zh-Hans') {
  const route = await routePublishedQuery({ query, locale });
  const ranking = await rankPublishedCandidates(route);
  const coverage = await measurePublishedCoverage(ranking);
  const base = { query, locale, route, ranking, coverage };
  return { ...base, resultDigest: sha(base) };
}

export { stable, sha };
