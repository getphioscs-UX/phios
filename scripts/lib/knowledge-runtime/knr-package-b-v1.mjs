import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { runPublishedRetrieval, normalizeQuery, stable, sha } from './knr-package-a-v1.mjs';

const root = process.cwd();
const readJson = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

async function loadPackageB() {
  const [projectionPolicy, pathPolicy, nodes, fragments, relationships, availability] = await Promise.all([
    readJson('content/knowledge/runtime/knr/package-b/adaptive-projection-policy-v1.json'),
    readJson('content/knowledge/runtime/knr/package-b/reading-path-policy-v1.json'),
    readJson('content/knowledge/public/retrieval/nodes.json'),
    readJson('content/knowledge/public/retrieval/fragments.json'),
    readJson('content/knowledge/public/retrieval/relationships.json'),
    readJson('content/knowledge/public/retrieval/locale-availability.json')
  ]);
  return { projectionPolicy, pathPolicy, nodes: nodes.records, fragments: fragments.records, relationships: relationships.records, availability: availability.records };
}

function tokens(value) {
  const normalized = normalizeQuery(value);
  const words = normalized.split(/\s+/).filter(Boolean);
  const han = [...normalized.replace(/[^\u3400-\u9fff]/g, '')];
  return [...new Set([...words, ...han])];
}

function overlap(query, text) {
  const q = tokens(query);
  if (!q.length) return 0;
  const t = new Set(tokens(text));
  return q.filter(token => t.has(token)).length / q.length;
}

export async function classifyProjectionIntent(query, locale, requestedMode = 'auto') {
  const { projectionPolicy } = await loadPackageB();
  if (requestedMode !== 'auto') {
    if (!projectionPolicy.modes.includes(requestedMode)) throw new Error(`KNR_PROJECTION_MODE_INVALID: ${requestedMode}`);
    return { mode: requestedMode, reason: 'explicit_mode' };
  }
  const normalized = normalizeQuery(query);
  for (const mode of ['full_article', 'continuity', 'overview', 'focused']) {
    const phrases = projectionPolicy.intentRules[mode]?.[locale] || [];
    if (phrases.some(phrase => normalized.includes(normalizeQuery(phrase)))) return { mode, reason: `matched_${mode}_intent` };
  }
  return { mode: projectionPolicy.defaultMode, reason: 'default_mode' };
}

function uniqueSorted(records) {
  return [...new Map(records.map(record => [record.fragmentCode, record])).values()].sort((a, b) => a.ordinal - b.ordinal || a.fragmentCode.localeCompare(b.fragmentCode));
}

function selectFragments({ all, query, mode, policy }) {
  const heading = all.filter(item => item.kind === 'heading');
  const paragraphs = all.filter(item => item.kind === 'paragraph');
  if (mode === 'full_article') return all;
  if (mode === 'overview') return uniqueSorted([
    ...(policy.selection.overview.includeHeading ? heading.slice(0, 1) : []),
    ...paragraphs.slice(0, policy.selection.overview.leadingParagraphs),
    ...paragraphs.slice(-policy.selection.overview.trailingParagraphs)
  ]);
  if (mode === 'continuity') return uniqueSorted([
    ...(policy.selection.continuity.includeHeading ? heading.slice(0, 1) : []),
    ...paragraphs.slice(-policy.selection.continuity.trailingParagraphs)
  ]);
  const scored = paragraphs.map((fragment, index) => ({ fragment, index, score: overlap(query, fragment.text) }))
    .sort((a, b) => b.score - a.score || a.fragment.ordinal - b.fragment.ordinal)
    .slice(0, policy.selection.focused.bestMatchingParagraphs);
  const selected = [...(policy.selection.focused.includeHeading ? heading.slice(0, 1) : [])];
  for (const item of scored) {
    for (let offset = -policy.selection.focused.neighborRadius; offset <= policy.selection.focused.neighborRadius; offset += 1) {
      if (paragraphs[item.index + offset]) selected.push(paragraphs[item.index + offset]);
    }
  }
  return uniqueSorted(selected).slice(0, policy.maximumFragments);
}

export async function buildAdaptiveProjection({ query, locale = 'zh-Hans', mode = 'auto' } = {}) {
  const data = await loadPackageB();
  const retrieval = await runPublishedRetrieval(query, locale);
  const intent = await classifyProjectionIntent(query, locale, mode);
  const top = retrieval.ranking.results[0] || null;
  if (!top || !retrieval.coverage.supported) {
    const empty = { projectionCode: 'KNR-PROJECTION-NO-COVERAGE', query: String(query ?? ''), locale, mode: intent.mode, coverage: retrieval.coverage, node: null, fragments: [], sourceFragmentDigests: [], answerGenerated: false, reason: 'no_published_coverage' };
    return { ...empty, projectionDigest: sha(empty) };
  }
  const node = data.nodes.find(item => item.nodeCode === top.nodeCode && item.locale === locale);
  const all = data.fragments.filter(item => item.nodeCode === top.nodeCode && item.locale === locale).sort((a, b) => a.ordinal - b.ordinal);
  const fragments = selectFragments({ all, query, mode: intent.mode, policy: data.projectionPolicy });
  const base = {
    projectionCode: 'KNR-PROJECTION-PUBLISHED-FRAGMENTS',
    query: String(query ?? ''), locale, mode: intent.mode, modeReason: intent.reason,
    coverage: retrieval.coverage,
    node: { nodeCode: node.nodeCode, title: node.title, href: node.href, bookCode: node.bookCode, partCode: node.partCode, authorityDigest: node.authorityDigest },
    fragments: fragments.map(({ fragmentCode, kind, ordinal, text, digest }) => ({ fragmentCode, kind, ordinal, text, digest })),
    sourceFragmentDigests: fragments.map(item => item.digest),
    answerGenerated: false,
    textRewritten: false
  };
  return { ...base, projectionDigest: sha(base) };
}

export async function buildPublishedReadingPath({ query, locale = 'zh-Hans', mode = 'auto' } = {}) {
  const data = await loadPackageB();
  const projection = await buildAdaptiveProjection({ query, locale, mode });
  if (!projection.node) {
    const empty = { pathCode: 'KNR-READING-PATH-NO-COVERAGE', query: String(query ?? ''), locale, entryNodeCode: null, steps: [], blockedContinuations: [], answerGenerated: false };
    return { ...empty, pathDigest: sha(empty) };
  }
  const entryKey = `${projection.node.nodeCode}:${locale}`;
  const steps = [{ step: 1, stepType: 'article', nodeCode: projection.node.nodeCode, locale, title: projection.node.title, href: projection.node.href, reason: 'top_ranked_published_node' }];
  const blockedContinuations = [];
  const relations = data.relationships.filter(item => item.sourceNodeCode === projection.node.nodeCode && item.locale === locale)
    .sort((a, b) => data.pathPolicy.relationshipOrder.indexOf(a.type) - data.pathPolicy.relationshipOrder.indexOf(b.type) || a.targetNodeCode.localeCompare(b.targetNodeCode));
  const seen = new Set([entryKey]);
  for (const relation of relations) {
    const targetKey = `${relation.targetNodeCode}:${locale}`;
    const target = data.nodes.find(item => item.nodeCode === relation.targetNodeCode && item.locale === locale);
    if (relation.targetPublished && target && !seen.has(targetKey) && steps.length < data.pathPolicy.maximumSteps) {
      steps.push({ step: steps.length + 1, stepType: 'published_relationship', relationshipType: relation.type, nodeCode: target.nodeCode, locale, title: target.title, href: target.href, reason: 'published_relationship' });
      seen.add(targetKey);
    } else if (data.pathPolicy.includeBlockedContinuations && !relation.targetPublished) {
      blockedContinuations.push({ relationshipType: relation.type, targetNodeCode: relation.targetNodeCode, locale, reason: data.pathPolicy.blockedReason });
    }
  }
  if (data.pathPolicy.includeLocaleSwitch) {
    const availability = data.availability.find(item => item.nodeCode === projection.node.nodeCode);
    for (const item of availability?.locales || []) {
      if (item.available && item.locale !== locale && steps.length < data.pathPolicy.maximumSteps) {
        const alternate = data.nodes.find(node => node.nodeCode === projection.node.nodeCode && node.locale === item.locale);
        if (alternate) steps.push({ step: steps.length + 1, stepType: 'locale_switch', nodeCode: alternate.nodeCode, locale: alternate.locale, title: alternate.title, href: alternate.href, reason: 'independently_published_locale_available' });
      }
    }
  }
  const base = { pathCode: 'KNR-READING-PATH-PUBLISHED', query: String(query ?? ''), locale, entryNodeCode: projection.node.nodeCode, projectionDigest: projection.projectionDigest, steps, blockedContinuations, answerGenerated: false };
  return { ...base, pathDigest: sha(base) };
}

export async function runPackageB(query, locale = 'zh-Hans', mode = 'auto') {
  const projection = await buildAdaptiveProjection({ query, locale, mode });
  const readingPath = await buildPublishedReadingPath({ query, locale, mode });
  const base = { query, locale, mode, projection, readingPath };
  return { ...base, resultDigest: sha(base) };
}
