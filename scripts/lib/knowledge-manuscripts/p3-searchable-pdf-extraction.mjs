import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const P3_CANDIDATE_RELATIVE =
  '.tmp/knowledge-manuscripts/book-1/p3-runtime-dynamics-candidate.md';
export const P3_REPORT_RELATIVE =
  '.tmp/knowledge-manuscripts/book-1/p3-runtime-dynamics-extraction-report.json';
export const P3_R2_TARGET = 'books/book-1/extracted/p3-runtime-dynamics.md';
export const EXTRACTION_METHOD = 'searchable_pdf_text_layer';
export const EXTRACTION_TOOL_SCHEMA_VERSION =
  'PHI-OS-KNR-W2R1-P3-EXTRACTION-TOOL-v1.0.4';

const BOUNDARY_ALIAS_PROFILES = Object.freeze({
  start: Object.freeze([
    Object.freeze({ id: 'part_three_runtime_dynamics', tokens: Object.freeze(['runtimedynamics']), normalizedHeading: '第三部｜运行动力学' })
  ]),
  end: Object.freeze([
    Object.freeze({ id: 'part_four_human_runtime_carrier', tokens: Object.freeze(['humanruntimecarrier']), normalizedHeading: '第四部｜人类运行载体' })
  ])
});

const CONTENTS_HEADING_PROFILES = Object.freeze([
  Object.freeze(['prelude', 'realitybreakdown']),
  Object.freeze(['realityphysics']),
  Object.freeze(['projectionsystem']),
  Object.freeze(['realitydynamics']),
  Object.freeze(['humanruntimecarrier']),
  Object.freeze(['consciousruntime'])
]);

const PART_HEADING_PATTERN = /^(?:序部|第[一二三四五六七八九十百0-9]+部)(?:\s|[|｜:：])/u;
const CAPTION_PATTERN = /^(?:图|figure|fig\.?)\s*[A-ZIVXLC一二三四五六七八九十百0-9.-]+(?:\s|[|｜:：])/iu;
const PAGE_NUMBER_PATTERN = /^(?:[-–—]\s*)?(?:第\s*)?[0-9０-９一二三四五六七八九十百]+(?:\s*页)?(?:\s*[-–—])?$/u;
const SENTENCE_END_PATTERN = /[。！？；…!?;][”’」』】）》〉]?$/u;
const LIST_START_PATTERN = /^(?:[-*•·]|[0-9０-９]+[.)、]|[一二三四五六七八九十]+[、.)])/u;
const SUSPICIOUS_TEXT_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/u;

const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const cleanScalar = value => String(value ?? '')
  .replace(/[\u200b-\u200d\u2060\ufeff]/gu, '')
  .replace(/\u00a0/gu, ' ')
  .replace(/[ \t]+/gu, ' ')
  .trim();

export function normalizeOverprintedHeading(value) {
  const original = cleanScalar(value);
  const withoutMarker = original.replace(/^[◈◆◇]+\s*/u, '');
  const characters = [...withoutMarker];
  const maximumRepeats = Math.min(8, Math.floor(characters.length / 6));
  let collapsed = null;
  let repeatCount = 1;
  for (let repeats = maximumRepeats; repeats >= 2; repeats -= 1) {
    if (characters.length % repeats !== 0) continue;
    const unitLength = characters.length / repeats;
    if (unitLength < 6) continue;
    const unit = characters.slice(0, unitLength).join('');
    if (Array.from({ length: repeats }, (_, index) =>
      characters.slice(index * unitLength, (index + 1) * unitLength).join('') === unit).every(Boolean)) {
      collapsed = unit;
      repeatCount = repeats;
      break;
    }
  }
  if (!collapsed) return { text: original, actions: [], repeatCount: 1 };
  const actions = [];
  if (withoutMarker !== original) actions.push('decorative_heading_marker_removed');
  actions.push('exact_overlay_duplicate_collapsed');
  return { text: collapsed, actions, repeatCount };
}

export function anchorForm(value) {
  return cleanScalar(value)
    .toLocaleLowerCase('zh-Hans')
    .replace(/[\s|｜:：·•—–\-_.。，、！？!?；;“”‘’'"《》〈〉（）()【】\[\]]+/gu, '');
}

function median(values) {
  const numeric = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!numeric.length) return 0;
  const middle = Math.floor(numeric.length / 2);
  return numeric.length % 2 ? numeric[middle] : (numeric[middle - 1] + numeric[middle]) / 2;
}

function itemHeight(item) {
  const height = Math.abs(Number(item.height));
  if (height > 0) return height;
  const transform = Array.isArray(item.transform) ? item.transform : [];
  return Math.hypot(Number(transform[2]) || 0, Number(transform[3]) || 0) || 1;
}

function shouldSpace(left, right, gap, averageHeight) {
  if (!left || !right || /\s$/u.test(left) || /^\s/u.test(right)) return false;
  if (/\p{Script=Han}$/u.test(left) || /^\p{Script=Han}/u.test(right)) return false;
  if (/^[,.;:!?%)}\]〉》」』】]/u.test(right)) return false;
  if (/[({\[〈《「『【]$/u.test(left)) return false;
  return gap > Math.max(0.4, averageHeight * 0.12) || /[\p{L}\p{N}]$/u.test(left) && /^[\p{L}\p{N}]/u.test(right);
}

export function textItemsToLines(items, pageNumber, pageHeight) {
  const positioned = items
    .filter(item => typeof item?.str === 'string' && cleanScalar(item.str))
    .map(item => ({
      text: cleanScalar(item.str),
      x: Number(item.transform?.[4]) || 0,
      y: Number(item.transform?.[5]) || 0,
      width: Math.abs(Number(item.width)) || 0,
      height: itemHeight(item),
      fontName: String(item.fontName || '')
    }))
    .sort((a, b) => Math.abs(b.y - a.y) > 0.8 ? b.y - a.y : a.x - b.x);

  const lines = [];
  for (const item of positioned) {
    const tolerance = Math.max(1.5, item.height * 0.35);
    let line = lines.find(candidate => Math.abs(candidate.y - item.y) <= tolerance);
    if (!line) {
      line = { y: item.y, items: [] };
      lines.push(line);
    }
    line.items.push(item);
    line.y = median(line.items.map(part => part.y));
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map(line => {
      line.items.sort((a, b) => a.x - b.x);
      const averageHeight = median(line.items.map(item => item.height)) || 1;
      let text = '';
      let previous = null;
      for (const item of line.items) {
        const gap = previous ? item.x - (previous.x + previous.width) : 0;
        if (previous && shouldSpace(text, item.text, gap, averageHeight)) text += ' ';
        text += item.text;
        previous = item;
      }
      return {
        pageNumber,
        pageHeight,
        text: cleanScalar(text),
        xStart: Math.min(...line.items.map(item => item.x)),
        xEnd: Math.max(...line.items.map(item => item.x + item.width)),
        y: line.y,
        fontSize: Math.max(...line.items.map(item => item.height)),
        fontNames: [...new Set(line.items.map(item => item.fontName).filter(Boolean))]
      };
    })
    .filter(line => line.text);
}

export async function sha256File(file) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

export async function readSearchablePdfPages(pdfPath) {
  const loadingTask = getDocument({
    url: pdfPath,
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0
  });
  let document;
  try {
    document = await loadingTask.promise;
    const pages = [];
    let totalTextItems = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent({
          disableNormalization: false,
          includeMarkedContent: false
        });
        const textItems = content.items.filter(item => typeof item?.str === 'string' && cleanScalar(item.str));
        totalTextItems += textItems.length;
        pages.push({
          pageNumber,
          width: viewport.width,
          height: viewport.height,
          lines: textItemsToLines(textItems, pageNumber, viewport.height)
        });
      } finally {
        page.cleanup();
      }
    }
    if (totalTextItems === 0 || pages.every(page => page.lines.length === 0)) {
      throw coded('SEARCHABLE_TEXT_LAYER_REQUIRED', {
        pageCount: document.numPages,
        ocrFallbackUsed: false
      });
    }
    return { pageCount: document.numPages, totalTextItems, pages };
  } finally {
    await loadingTask.destroy();
  }
}

function pageBodyFont(page) {
  const sizes = page.lines.map(line => line.fontSize).filter(size => size > 0);
  const midpoint = median(sizes);
  return median(sizes.filter(size => size <= midpoint)) || midpoint || 1;
}

function partOneMarker(normalized) {
  return normalized.includes('第一部') || normalized.includes('第1部');
}

function aliasProfile(normalized, kind) {
  return BOUNDARY_ALIAS_PROFILES[kind].find(profile =>
    profile.tokens.every(token => normalized.includes(token)) &&
    (!profile.partOne || partOneMarker(normalized))) || null;
}

function candidateFromWindow(page, lines, index, kind, matchMode, matchProfile, normalizedHeading = null) {
  const combined = lines.map(line => line.text).join('');
  const fontSize = Math.max(...lines.map(line => line.fontSize));
  const bodyFont = pageBodyFont(page);
  const marginal = lines.every(line => line.y >= page.height * 0.9 || line.y <= page.height * 0.1);
  return {
    kind,
    pageNumber: page.pageNumber,
    startLineIndex: index,
    endLineIndex: index + lines.length - 1,
    text: normalizedHeading || lines.map(line => line.text).join(' '),
    fontSize,
    matchMode,
    matchProfile,
    strongHeading: fontSize >= bodyFont * 1.12 || PART_HEADING_PATTERN.test(cleanScalar(combined)),
    likelyRunningHeader: marginal && fontSize < bodyFont * 1.22
  };
}

function windowCandidates(page, anchor, kind) {
  const expected = anchorForm(anchor);
  const candidates = [];
  for (let index = 0; index < page.lines.length; index += 1) {
    let aliasCandidate = null;
    for (let length = 1; length <= 6 && index + length <= page.lines.length; length += 1) {
      const lines = page.lines.slice(index, index + length);
      const combined = lines.map(line => line.text).join('');
      const normalized = anchorForm(combined);
      if (normalized === expected) {
        candidates.push(candidateFromWindow(page, lines, index, kind, 'exact', 'manifest_title'));
        aliasCandidate = null;
        break;
      }
      const profile = aliasProfile(normalized, kind);
      if (!aliasCandidate && profile) {
        aliasCandidate = candidateFromWindow(
          page,
          lines,
          index,
          kind,
          'book_toc_alias',
          profile.id,
          profile.normalizedHeading || null
        );
      }
    }
    if (aliasCandidate) candidates.push(aliasCandidate);
  }
  return candidates;
}

function isContentsPage(page, partTitles) {
  const pageText = anchorForm(page.lines.map(line => line.text).join(''));
  if (pageText.includes(anchorForm('目录'))) return true;
  const canonicalMatches = partTitles.filter(title => pageText.includes(anchorForm(title))).length;
  const bookTocMatches = CONTENTS_HEADING_PROFILES.filter(tokens =>
    tokens.every(token => pageText.includes(token))).length;
  return canonicalMatches >= 3 || bookTocMatches >= 3;
}

function chooseCandidate(candidates, pageOverride, after = null) {
  let eligible = candidates.filter(candidate => !candidate.contentsPage && !candidate.likelyRunningHeader);
  if (pageOverride !== null) eligible = eligible.filter(candidate => candidate.pageNumber === pageOverride);
  if (after) {
    eligible = eligible.filter(candidate => candidate.pageNumber > after.pageNumber ||
      candidate.pageNumber === after.pageNumber && candidate.startLineIndex > after.endLineIndex);
  }
  const strong = eligible.filter(candidate => candidate.strongHeading);
  const pool = strong.length ? strong : eligible;
  if (!pool.length) return null;
  const matchPriority = candidate => candidate.matchMode === 'exact' ? 0 : 1;
  return pool.sort((a, b) => matchPriority(a) - matchPriority(b) ||
    a.pageNumber - b.pageNumber || a.startLineIndex - b.startLineIndex)[0];
}

export function headingDiagnostics(pages) {
  const diagnostics = [];
  for (const page of pages) {
    const bodyFont = pageBodyFont(page);
    for (const line of page.lines) {
      const text = cleanScalar(line.text);
      if (!text || text.length > 72 || SENTENCE_END_PATTERN.test(text)) continue;
      const normalized = anchorForm(text);
      const headingShape = line.fontSize >= bodyFont * 1.45 || PART_HEADING_PATTERN.test(text);
      const boundarySignal = normalized.includes('runtimedynamics') ||
        normalized.includes('第三部运行动力学') ||
        normalized.includes('humanruntimecarrier') ||
        normalized.includes('第四部人类运行载体');
      if (!headingShape && !boundarySignal) continue;
      diagnostics.push({
        pageNumber: page.pageNumber,
        text,
        fontSize: Number(line.fontSize.toFixed(2)),
        position: line.y >= page.height * 0.9 ? 'top_margin' : line.y <= page.height * 0.1 ? 'bottom_margin' : 'body'
      });
      if (diagnostics.length === 40) return diagnostics;
    }
  }
  return diagnostics;
}

export function locateP3Boundary(pages, manifest, overrides = {}) {
  const p3 = manifest.parts.find(part => part.partCode === 'P3');
  const p4 = manifest.parts.find(part => part.partCode === 'P4');
  if (!p3 || !p4) throw coded('P3_P4_MANIFEST_PARTS_REQUIRED');
  const partTitles = manifest.parts.map(part => part.title);
  const contentsPages = new Set(pages.filter(page => isContentsPage(page, partTitles)).map(page => page.pageNumber));
  const starts = pages.flatMap(page => windowCandidates(page, p3.title, 'start'))
    .map(candidate => ({ ...candidate, contentsPage: contentsPages.has(candidate.pageNumber) }));
  const ends = pages.flatMap(page => windowCandidates(page, p4.title, 'end'))
    .map(candidate => ({ ...candidate, contentsPage: contentsPages.has(candidate.pageNumber) }));
  const start = chooseCandidate(starts, overrides.startPage ?? null);
  const end = start ? chooseCandidate(ends, overrides.endPage ?? null, start) : null;
  if (!start || !end) {
    throw coded('P3_BOUNDARY_NOT_FOUND', {
      startAnchor: p3.title,
      endAnchor: p4.title,
      startCandidates: starts.map(candidate => ({
        pageNumber: candidate.pageNumber,
        matchMode: candidate.matchMode,
        matchProfile: candidate.matchProfile,
        contentsPage: candidate.contentsPage
      })),
      endCandidates: ends.map(candidate => ({
        pageNumber: candidate.pageNumber,
        matchMode: candidate.matchMode,
        matchProfile: candidate.matchProfile,
        contentsPage: candidate.contentsPage
      })),
      requestedStartPage: overrides.startPage ?? null,
      requestedEndPage: overrides.endPage ?? null,
      headingDiagnostics: headingDiagnostics(pages)
    });
  }
  const duplicateStrongStarts = starts.filter(candidate => candidate.strongHeading && !candidate.contentsPage &&
    !candidate.likelyRunningHeader &&
    (overrides.startPage === undefined || candidate.pageNumber === overrides.startPage));
  const duplicateStrongStartPages = [...new Set(duplicateStrongStarts.map(candidate => candidate.pageNumber))];
  if (duplicateStrongStartPages.length > 1 && overrides.startPage === undefined) {
    throw coded('P3_BOUNDARY_AMBIGUOUS', {
      boundary: 'start',
      candidatePages: duplicateStrongStartPages,
      requiredAction: 'rerun with --start-page <page>'
    });
  }
  return {
    startAnchor: p3.title,
    endAnchor: p4.title,
    contentsPages: [...contentsPages],
    start,
    end
  };
}

function sliceBoundaryPages(pages, boundary) {
  const selected = [];
  for (const page of pages) {
    if (page.pageNumber < boundary.start.pageNumber || page.pageNumber > boundary.end.pageNumber) continue;
    let lines = page.lines;
    if (page.pageNumber === boundary.start.pageNumber) {
      lines = lines.slice(boundary.start.startLineIndex);
    }
    if (page.pageNumber === boundary.end.pageNumber) {
      const cutoff = page.pageNumber === boundary.start.pageNumber
        ? boundary.end.startLineIndex - boundary.start.startLineIndex
        : boundary.end.startLineIndex;
      lines = lines.slice(0, Math.max(0, cutoff));
    }
    if (page.pageNumber === boundary.start.pageNumber && lines.length) {
      const headingLineCount = boundary.start.endLineIndex - boundary.start.startLineIndex + 1;
      const headingLines = lines.slice(0, headingLineCount);
      const first = headingLines[0];
      lines = [{
        ...first,
        text: boundary.start.text,
        xStart: Math.min(...headingLines.map(line => line.xStart)),
        xEnd: Math.max(...headingLines.map(line => line.xEnd)),
        y: Math.max(...headingLines.map(line => line.y)),
        fontSize: Math.max(...headingLines.map(line => line.fontSize)),
        fontNames: [...new Set(headingLines.flatMap(line => line.fontNames || []))]
      }, ...lines.slice(headingLineCount)];
    }
    if (lines.length) selected.push({ ...page, lines });
  }
  if (!selected.length) throw coded('P3_BOUNDARY_EMPTY');
  return selected;
}

function recurringMarginalSignatures(pages) {
  const counts = new Map();
  for (const page of pages) {
    const seen = new Set();
    for (const line of page.lines) {
      const marginal = line.y >= page.height * 0.9 || line.y <= page.height * 0.1;
      if (!marginal || PAGE_NUMBER_PATTERN.test(line.text)) continue;
      const signature = anchorForm(line.text);
      if (signature.length < 3 || seen.has(signature)) continue;
      seen.add(signature);
      counts.set(signature, (counts.get(signature) || 0) + 1);
    }
  }
  const threshold = Math.max(2, Math.ceil(pages.length * 0.5));
  return new Set([...counts.entries()].filter(([, count]) => count >= threshold).map(([signature]) => signature));
}

function isHeading(line, bodyFont, p3Title) {
  if (anchorForm(line.text) === anchorForm(p3Title)) return true;
  if (PART_HEADING_PATTERN.test(line.text)) return true;
  return line.text.length <= 48 && line.fontSize >= bodyFont * 1.22 && !SENTENCE_END_PATTERN.test(line.text);
}

function joinWrappedText(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (/\p{Script=Han}$/u.test(left) || /^\p{Script=Han}/u.test(right)) return `${left}${right}`;
  if (/[-‐‑]$/u.test(left)) return `${left}${right}`;
  return `${left} ${right}`;
}

function lineBreakRequired(previous, current, bodyX, medianGap) {
  if (!previous) return true;
  if (SENTENCE_END_PATTERN.test(previous.text)) return true;
  if (LIST_START_PATTERN.test(current.text)) return true;
  if (current.pageNumber === previous.pageNumber) {
    const verticalGap = previous.y - current.y;
    if (medianGap > 0 && verticalGap > medianGap * 1.65) return true;
    if (current.xStart > bodyX + current.fontSize * 0.9) return true;
  }
  return false;
}

function isHeadingContinuation(current, next, bodyFont, p3Title) {
  if (!next || current.pageNumber !== next.pageNumber) return false;
  if (!isHeading(next, bodyFont, p3Title) || PART_HEADING_PATTERN.test(next.text)) return false;
  if (SENTENCE_END_PATTERN.test(current.text)) return false;
  const currentLength = [...current.text].length;
  const nextLength = [...next.text].length;
  const shortSemanticContinuation =
    currentLength >= 20 &&
    nextLength <= 10 &&
    anchorForm(current.text) !== anchorForm(p3Title) &&
    !/[|｜:：]/u.test(next.text) &&
    !SENTENCE_END_PATTERN.test(next.text);
  if (shortSemanticContinuation) return true;
  if (currentLength < 20 || nextLength > 16) return false;
  const largerFont = Math.max(current.fontSize, next.fontSize, 1);
  if (Math.abs(current.fontSize - next.fontSize) / largerFont > 0.12) return false;
  if (Math.abs(current.xStart - next.xStart) > largerFont * 1.5) return false;
  const verticalGap = current.y - next.y;
  return verticalGap > 0 && verticalGap <= largerFont * 2.2;
}

export function cleanP3Pages(pages, p3Title) {
  const recurring = recurringMarginalSignatures(pages);
  const allLines = pages.flatMap(page => page.lines);
  const bodyFont = median(allLines.map(line => line.fontSize)) || 1;
  const bodyX = median(allLines.map(line => line.xStart));
  const gaps = pages.flatMap(page => page.lines.slice(1).map((line, index) => page.lines[index].y - line.y).filter(gap => gap > 0));
  const medianGap = median(gaps);
  const removed = [];
  const normalized = [];
  const retained = [];
  let titleSeen = false;
  let previousSignature = null;

  for (const page of pages) {
    for (const line of page.lines) {
      const proposed = normalizeOverprintedHeading(line.text);
      const proposedLine = { ...line, text: proposed.text };
      const workingLine = proposed.actions.length && isHeading(proposedLine, bodyFont, p3Title)
        ? proposedLine
        : line;
      if (workingLine !== line) {
        normalized.push({
          pageNumber: page.pageNumber,
          actions: proposed.actions,
          repeatCount: proposed.repeatCount,
          before: line.text,
          after: workingLine.text
        });
      }
      const marginal = workingLine.y >= page.height * 0.9 || workingLine.y <= page.height * 0.1;
      const signature = anchorForm(workingLine.text);
      let reason = null;
      if (SUSPICIOUS_TEXT_PATTERN.test(workingLine.text)) {
        throw coded('SEARCHABLE_TEXT_GARBLED', { pageNumber: page.pageNumber, line: workingLine.text });
      }
      if (marginal && PAGE_NUMBER_PATTERN.test(workingLine.text)) reason = 'page_number';
      else if (marginal && recurring.has(signature)) reason = 'recurring_header_or_footer';
      else if (CAPTION_PATTERN.test(workingLine.text)) reason = 'figure_caption';
      else if (signature === anchorForm(p3Title)) {
        if (titleSeen) reason = 'duplicate_title';
        else titleSeen = true;
      } else if (signature && signature === previousSignature) reason = 'adjacent_duplicate_line';

      if (reason) {
        removed.push({ pageNumber: page.pageNumber, reason, text: workingLine.text });
        continue;
      }
      retained.push(workingLine);
      previousSignature = signature;
    }
  }

  if (!retained.length || !titleSeen) {
    throw coded('P3_CLEANING_INVALID', { retainedLineCount: retained.length, titleSeen });
  }

  const blocks = [];
  let paragraph = '';
  let previous = null;
  const flush = () => {
    if (paragraph) blocks.push(paragraph);
    paragraph = '';
  };
  for (let index = 0; index < retained.length; index += 1) {
    const line = retained[index];
    if (isHeading(line, bodyFont, p3Title)) {
      flush();
      const headingLines = [line];
      while (isHeadingContinuation(headingLines.at(-1), retained[index + 1], bodyFont, p3Title)) {
        headingLines.push(retained[index + 1]);
        index += 1;
      }
      const headingText = headingLines.reduce((text, item) => joinWrappedText(text, item.text), '');
      if (headingLines.length > 1) {
        normalized.push({
          pageNumber: line.pageNumber,
          actions: ['wrapped_heading_continuation_merged'],
          repeatCount: 1,
          before: headingLines.map(item => item.text),
          after: headingText
        });
      }
      blocks.push(`${anchorForm(headingText) === anchorForm(p3Title) ? '#' : '##'} ${headingText}`);
      previous = null;
      continue;
    }
    if (lineBreakRequired(previous, line, bodyX, medianGap)) flush();
    paragraph = joinWrappedText(paragraph, line.text);
    previous = line;
  }
  flush();
  const body = blocks.join('\n\n').trim();
  if (body.length < 100) throw coded('P3_TEXT_LAYER_TOO_SHORT', { characterCount: body.length });
  return {
    body,
    retainedLineCount: retained.length,
    removed,
    normalized,
    bodyFont,
    bodyX,
    medianLineGap: medianGap
  };
}

export function buildCandidateMarkdown({ manifest, source, boundary, cleaned, sourcePageCount }) {
  const selectedPages = [...new Set(cleaned.pages.map(page => page.pageNumber))];
  const frontmatter = [
    '---',
    'schemaVersion: PHI-OS-KNR-W2R1-P3-EXTRACTION-CANDIDATE-v1.0.0',
    `bookCode: ${manifest.bookCode}`,
    'partCode: P3',
    `locale: ${manifest.locale}`,
    `manuscriptVersion: ${manifest.manuscriptVersion}`,
    `sourceObjectKey: ${source.objectKey}`,
    `sourceSha256: ${source.sha256}`,
    `extractionMethod: ${EXTRACTION_METHOD}`,
    'ocrUsed: false',
    `startAnchor: ${JSON.stringify(boundary.startAnchor)}`,
    `endAnchor: ${JSON.stringify(boundary.endAnchor)}`,
    `detectedStartHeading: ${JSON.stringify(boundary.start.text)}`,
    `detectedEndHeading: ${JSON.stringify(boundary.end.text)}`,
    `startMatchMode: ${boundary.start.matchMode}`,
    `endMatchMode: ${boundary.end.matchMode}`,
    `startPage: ${selectedPages[0]}`,
    `endPage: ${selectedPages.at(-1)}`,
    `sourcePageCount: ${sourcePageCount}`,
    'normalizationStatus: human_review_required',
    'humanVerified: false',
    `r2TargetObjectKey: ${P3_R2_TARGET}`,
    '---'
  ].join('\n');
  return `${frontmatter}\n\n${cleaned.body}\n`;
}

function assertPrivatePath(root, target) {
  const materializationRoot = path.resolve(root, '.tmp/knowledge-manuscripts/book-1');
  const resolved = path.resolve(root, target);
  if (!resolved.startsWith(`${materializationRoot}${path.sep}`)) {
    throw coded('PRIVATE_MATERIALIZATION_PATH_REQUIRED', { target });
  }
  return resolved;
}

async function writePrivatePair(candidatePath, candidate, reportPath, report) {
  if (fs.existsSync(candidatePath) || fs.existsSync(reportPath)) {
    throw coded('P3_CANDIDATE_ALREADY_EXISTS', {
      candidatePath,
      reportPath,
      requiredAction: 'preserve or rename the existing human-review candidate before rerunning'
    });
  }
  await fsp.mkdir(path.dirname(candidatePath), { recursive: true, mode: 0o700 });
  const candidatePartial = `${candidatePath}.partial-${process.pid}`;
  const reportPartial = `${reportPath}.partial-${process.pid}`;
  let candidatePublished = false;
  try {
    await fsp.writeFile(candidatePartial, candidate, { flag: 'wx', mode: 0o600 });
    await fsp.writeFile(reportPartial, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await fsp.rename(candidatePartial, candidatePath);
    candidatePublished = true;
    await fsp.rename(reportPartial, reportPath);
  } catch (error) {
    await Promise.allSettled([fsp.rm(candidatePartial, { force: true }), fsp.rm(reportPartial, { force: true })]);
    if (candidatePublished) await fsp.rm(candidatePath, { force: true });
    throw error;
  }
}

export async function extractP3Candidate({ root, manifest, mode = 'dry-run', overrides = {} }) {
  if (!['dry-run', 'apply'].includes(mode)) throw coded('P3_EXTRACTION_MODE_INVALID');
  if (manifest.authorityStatus !== 'verified' || manifest.verificationStatus !== 'content_verified') {
    throw coded('MANUSCRIPT_CONTENT_VERIFICATION_REQUIRED');
  }
  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  if (!source || source.verificationStatus !== 'content_verified') {
    throw coded('SOURCE_PDF_CONTENT_VERIFICATION_REQUIRED');
  }
  const sourceRelative = `.tmp/knowledge-manuscripts/book-1/${path.basename(source.objectKey)}`;
  const sourcePath = assertPrivatePath(root, sourceRelative);
  const candidatePath = assertPrivatePath(root, P3_CANDIDATE_RELATIVE);
  const reportPath = assertPrivatePath(root, P3_REPORT_RELATIVE);
  if (!fs.existsSync(sourcePath)) throw coded('MATERIALIZED_SOURCE_PDF_MISSING', { sourcePath: sourceRelative });
  const sourceStat = await fsp.lstat(sourcePath);
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) throw coded('MATERIALIZED_SOURCE_PDF_INVALID');
  if (sourceStat.size !== source.sizeBytes) {
    throw coded('MATERIALIZED_SOURCE_SIZE_MISMATCH', { expected: source.sizeBytes, actual: sourceStat.size });
  }
  const actualSha256 = await sha256File(sourcePath);
  if (actualSha256 !== source.sha256) {
    throw coded('MATERIALIZED_SOURCE_SHA256_MISMATCH', { expected: source.sha256, actual: actualSha256 });
  }

  const extracted = await readSearchablePdfPages(sourcePath);
  const boundary = locateP3Boundary(extracted.pages, manifest, overrides);
  const pages = sliceBoundaryPages(extracted.pages, boundary);
  const cleanedBase = cleanP3Pages(pages, boundary.start.text);
  const cleaned = { ...cleanedBase, pages };
  const candidate = buildCandidateMarkdown({
    manifest,
    source,
    boundary,
    cleaned,
    sourcePageCount: extracted.pageCount
  });
  const candidateSha256 = createHash('sha256').update(candidate).digest('hex');
  const report = {
    schemaVersion: 'PHI-OS-KNR-W2R1-P3-EXTRACTION-REPORT-v1.0.1',
    stage: 'KNR-W2R1-T09-P3',
    bookCode: manifest.bookCode,
    partCode: 'P3',
    sourceObjectKey: source.objectKey,
    sourceSha256: source.sha256,
    extractionMethod: EXTRACTION_METHOD,
    ocrUsed: false,
    sourcePageCount: extracted.pageCount,
    sourceTextItemCount: extracted.totalTextItems,
    boundary: {
      startAnchor: boundary.startAnchor,
      endAnchor: boundary.endAnchor,
      detectedStartHeading: boundary.start.text,
      detectedEndHeading: boundary.end.text,
      startMatchMode: boundary.start.matchMode,
      endMatchMode: boundary.end.matchMode,
      startMatchProfile: boundary.start.matchProfile,
      endMatchProfile: boundary.end.matchProfile,
      startPage: pages[0].pageNumber,
      endPage: pages.at(-1).pageNumber,
      nextPartHeadingPage: boundary.end.pageNumber,
      contentsPagesExcluded: boundary.contentsPages
    },
    cleaning: {
      retainedLineCount: cleaned.retainedLineCount,
      removedLineCount: cleaned.removed.length,
      removedLines: cleaned.removed,
      normalizedLineCount: cleaned.normalized.length,
      normalizedLines: cleaned.normalized
    },
    candidate: {
      path: P3_CANDIDATE_RELATIVE,
      sha256: candidateSha256,
      characterCount: candidate.length,
      normalizationStatus: 'human_review_required',
      humanVerified: false
    },
    r2TargetObjectKey: P3_R2_TARGET,
    r2UploadPerformed: false,
    publicEligibility: false,
    productionModified: false,
    humanReviewChecklist: [
      'title_and_heading_order',
      'paragraph_order_and_missing_segments',
      'garbled_or_reversed_character_order',
      'headers_footers_page_numbers_and_blank_pages',
      'figure_caption_exclusion',
      'theoretical_meaning_preserved'
    ]
  };

  if (mode === 'apply') await writePrivatePair(candidatePath, candidate, reportPath, report);
  return {
    schemaVersion: EXTRACTION_TOOL_SCHEMA_VERSION,
    stage: 'KNR-W2R1-T09-P3',
    command: 'extract-p3',
    mode,
    status: mode === 'apply' ? 'candidate_ready_for_human_review' : 'extraction_plan_validated',
    bookCode: manifest.bookCode,
    partCode: 'P3',
    extractionMethod: EXTRACTION_METHOD,
    ocrUsed: false,
    sourcePageCount: extracted.pageCount,
    selectedPageRange: { startPage: pages[0].pageNumber, endPage: pages.at(-1).pageNumber },
    boundaryAnchors: {
      start: {
        canonical: boundary.startAnchor,
        detected: boundary.start.text,
        matchMode: boundary.start.matchMode,
        matchProfile: boundary.start.matchProfile
      },
      end: {
        canonical: boundary.endAnchor,
        detected: boundary.end.text,
        matchMode: boundary.end.matchMode,
        matchProfile: boundary.end.matchProfile
      }
    },
    candidatePath: P3_CANDIDATE_RELATIVE,
    reportPath: P3_REPORT_RELATIVE,
    candidateSha256,
    candidateCharacterCount: candidate.length,
    removedLineCount: cleaned.removed.length,
    normalizedLineCount: cleaned.normalized.length,
    normalizationStatus: 'human_review_required',
    humanVerified: false,
    r2TargetObjectKey: P3_R2_TARGET,
    r2UploadPerformed: false,
    remoteRequestPerformed: false,
    writes: mode === 'apply' ? 2 : 0,
    gitEligible: false,
    publicBuildEligible: false,
    publicIndexEligible: false,
    publishedArticleEligible: false,
    productionPackageEligible: false,
    productionModified: false,
    nextAction: 'KNR-W2R1-T09-P3_HUMAN_NORMALIZATION_REVIEW'
  };
}

export { coded };
