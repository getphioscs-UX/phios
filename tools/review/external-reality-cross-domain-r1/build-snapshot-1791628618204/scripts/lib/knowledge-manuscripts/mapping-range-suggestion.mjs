import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PART_META = Object.freeze({
  P1: { slug: 'p1-reality-physics' },
  P2: { slug: 'p2-projection-system' },
  P3: { slug: 'p3-runtime-dynamics' },
  P4: { slug: 'p4-human-runtime-carrier' },
  P5: { slug: 'p5-conscious-runtime' }
});

const clean = value => typeof value === 'string' ? value.trim() : '';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });

function resolveWithin(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw coded('MAPPING_RANGE_PATH_ESCAPE', { path: relativePath });
  }
  return resolved;
}

function normalizeTitle(value) {
  return clean(value)
    .normalize('NFKC')
    .replace(/PHI\s*OS/giu, '')
    .replace(/Solar\s+Driver/giu, '')
    .replace(/[A-Za-z0-9_-]+/gu, '')
    .replace(/[｜|·•—–:：,，。！？?、（）()《》「」『』【】\s]/gu, '');
}

function grams(value) {
  const text = normalizeTitle(value);
  const result = new Set();
  for (let index = 0; index < text.length; index += 1) {
    result.add(text[index]);
    if (index + 1 < text.length) result.add(text.slice(index, index + 2));
  }
  return result;
}

function lexicalScore(nodeTitle, headingTitle) {
  const a = grams(nodeTitle);
  const b = grams(headingTitle);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += token.length === 2 ? 2 : 1;
  const denominator = [...a].reduce((sum, token) => sum + (token.length === 2 ? 2 : 1), 0);
  return denominator ? overlap / denominator : 0;
}

export function parseCandidateHeadingIndex(text) {
  const lines = text.split(/\r?\n/u);
  const headings = [];
  let offset = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/u);
    if (match) {
      headings.push({
        index: headings.length,
        level: match[1].length,
        title: match[2].trim(),
        rawLine: line,
        lineNumber: lineIndex + 1,
        startOffset: offset
      });
    }
    offset += line.length + 1;
  }
  for (let index = 0; index < headings.length; index += 1) {
    headings[index].endOffset = index + 1 < headings.length
      ? headings[index + 1].startOffset
      : text.length;
  }
  return headings;
}


function occurrenceCount(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= text.length) {
    const found = text.indexOf(needle, offset);
    if (found === -1) break;
    count += 1;
    offset = found + Math.max(needle.length, 1);
  }
  return count;
}

function uniqueAnchor(text, heading) {
  const maximum = Math.min(text.length, heading.startOffset + 320);
  for (let end = heading.startOffset + heading.rawLine.length; end <= maximum; end += 16) {
    const candidate = text.slice(heading.startOffset, end).trimEnd();
    if (occurrenceCount(text, candidate) === 1) return candidate;
  }
  const fallback = text.slice(heading.startOffset, maximum).trimEnd();
  if (occurrenceCount(text, fallback) === 1) return fallback;
  throw coded('MAPPING_RANGE_UNIQUE_ANCHOR_NOT_FOUND', {
    heading: heading.title,
    lineNumber: heading.lineNumber
  });
}

function contentHeadings(headings) {
  const h2 = headings.filter(item => item.level === 2);
  return h2.length ? h2 : headings.filter(item => item.level > 1);
}

function chooseMonotonicStarts(nodes, headings) {
  const m = nodes.length;
  const n = headings.length;
  if (!m || !n) return [];
  if (n < m) {
    throw coded('MAPPING_RANGE_HEADING_COVERAGE_INSUFFICIENT', {
      nodeCount: m,
      headingCount: n
    });
  }

  const NEG = -1e12;
  const dp = Array.from({ length: m }, () => Array(n).fill(NEG));
  const prev = Array.from({ length: m }, () => Array(n).fill(-1));

  for (let i = 0; i < m; i += 1) {
    const expected = m === 1 ? 0 : (i / (m - 1)) * (n - 1);
    const minJ = i;
    const maxJ = n - (m - i);
    for (let j = minJ; j <= maxJ; j += 1) {
      const lexical = lexicalScore(nodes[i].titleZhHans, headings[j].title);
      const positionPenalty = Math.abs(j - expected) / Math.max(n - 1, 1);
      const score = lexical * 8 - positionPenalty * 1.5;
      if (i === 0) {
        dp[i][j] = score - (j === 0 ? 0 : 2.5);
        continue;
      }
      for (let k = i - 1; k < j; k += 1) {
        const span = j - k;
        const idealSpan = n / m;
        const spanPenalty = Math.abs(span - idealSpan) / Math.max(idealSpan, 1) * 0.35;
        const candidate = dp[i - 1][k] + score - spanPenalty;
        if (candidate > dp[i][j]) {
          dp[i][j] = candidate;
          prev[i][j] = k;
        }
      }
    }
  }

  let cursor = n - 1;
  let best = NEG;
  for (let j = m - 1; j < n; j += 1) {
    const tailPenalty = (n - 1 - j) * 0.15;
    if (dp[m - 1][j] - tailPenalty > best) {
      best = dp[m - 1][j] - tailPenalty;
      cursor = j;
    }
  }
  const starts = Array(m).fill(0);
  for (let i = m - 1; i >= 0; i -= 1) {
    starts[i] = cursor;
    cursor = prev[i][cursor];
  }
  starts[0] = 0;
  return starts;
}

function confidence(nodeTitle, headingTitle) {
  const score = lexicalScore(nodeTitle, headingTitle);
  if (score >= 0.55) return 'high';
  if (score >= 0.25) return 'medium';
  return 'low';
}

export function suggestPartNodeRanges({ root, partCode, blueprintNodes, sectionHash }) {
  const meta = PART_META[partCode];
  if (!meta) throw coded('MAPPING_RANGE_PART_INVALID', { partCode });
  const relativePath = `.tmp/knowledge-manuscripts/book-1/${meta.slug}-candidate.md`;
  const file = resolveWithin(root, relativePath);
  if (!fs.existsSync(file)) throw coded(`${partCode}_MAPPING_RANGE_CANDIDATE_MISSING`, { path: relativePath });
  const bytes = fs.readFileSync(file);
  const text = bytes.toString('utf8');
  const candidateSha256 = sha256(bytes);
  if (candidateSha256 !== sectionHash) {
    throw coded(`${partCode}_MAPPING_RANGE_SECTION_HASH_MISMATCH`, {
      candidateSha256,
      sectionHash
    });
  }
  const allHeadings = parseCandidateHeadingIndex(text);
  const headings = contentHeadings(allHeadings);
  const starts = chooseMonotonicStarts(blueprintNodes, headings);
  const suggestions = blueprintNodes.map((node, nodeIndex) => {
    const startIndex = starts[nodeIndex];
    const endIndex = nodeIndex + 1 < starts.length ? starts[nodeIndex + 1] : headings.length;
    const start = headings[startIndex];
    const end = endIndex < headings.length ? headings[endIndex] : null;
    const included = headings.slice(startIndex, endIndex);
    const matchConfidence = confidence(node.titleZhHans, start.title);
    return {
      nodeCode: node.nodeCode,
      titleZhHans: node.titleZhHans,
      matchConfidence,
      headingSpanCount: included.length,
      includedHeadings: included.map(item => item.title),
      ranges: [{
        rangeCode: `${node.nodeCode}-R01`,
        startHeading: start.title,
        endHeading: end?.title ?? null,
        startAnchor: uniqueAnchor(text, start),
        endAnchor: end ? uniqueAnchor(text, end) : null,
        sectionHash,
        rangeRole: 'primary'
      }],
      unresolved: [
        'range_sufficiency_requires_tl_confirmation',
        'supporting_ranges_not_assessed',
        'cross_section_references_not_assessed',
        ...(matchConfidence === 'low' ? ['low_lexical_heading_match_requires_tl_attention'] : [])
      ]
    };
  });
  return {
    candidatePath: relativePath,
    candidateSha256,
    headingAuthority: 'candidate_markdown',
    headingCount: headings.length,
    suggestions
  };
}

export function mappingReviewIdentityMatches(review, context) {
  return Boolean(
    review &&
    review.candidate?.path === context.candidate.path &&
    review.candidate?.sha256 === context.candidate.sha256 &&
    review.mapping?.path &&
    review.mapping?.sha256 === context.mappingSha256
  );
}

export function archiveStaleMappingReview(file, root, partCode, now = new Date()) {
  const archiveRelative = '.tmp/knowledge-manuscripts/book-1/mapping-review-archive';
  const archiveRoot = resolveWithin(root, archiveRelative);
  fs.mkdirSync(archiveRoot, { recursive: true, mode: 0o700 });
  const timestamp = new Date(now).toISOString().replace(/[:.]/gu, '-');
  const target = path.join(archiveRoot, `${partCode.toLowerCase()}-node-mapping-review-${timestamp}.json`);
  fs.renameSync(file, target);
  return path.relative(path.resolve(root), target).replaceAll(path.sep, '/');
}
