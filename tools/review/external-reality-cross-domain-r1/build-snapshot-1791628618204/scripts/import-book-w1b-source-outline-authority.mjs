import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE_AUTHORITY_PATH =
  'content/knowledge/migrations/book-w1b/source-authority/book-w1b-part-8-15-final-outline-authority-v1.json';

export const AUTHORIZED_SOURCE_SHA256 =
  '44d03dbed8f69dcdefb3c7127353ce5bbbf8e19554037dd1a054c099156551fd';

const PART_SPECS = [
  { partCode: 'P8', number: 8, chapterCount: 64, titleZhHans: '运行维持', titleEn: 'Runtime Maintenance' },
  { partCode: 'P9', number: 9, chapterCount: 43, titleZhHans: '协调运行', titleEn: 'Coordination Runtime' },
  { partCode: 'P10', number: 10, chapterCount: 81, titleZhHans: '运行扩展', titleEn: 'Runtime Expansion' },
  { partCode: 'P11', number: 11, chapterCount: 77, titleZhHans: '文明运行', titleEn: 'Civilization Runtime' },
  { partCode: 'P12', number: 12, chapterCount: 84, titleZhHans: '文明图谱', titleEn: 'Civilization Atlas' },
  { partCode: 'P13', number: 13, chapterCount: 87, titleZhHans: '读取科学', titleEn: 'Reading Science' },
  { partCode: 'P14', number: 14, chapterCount: 79, titleZhHans: '导航科学', titleEn: 'Navigation Science' },
  { partCode: 'P15', number: 15, chapterCount: 106, titleZhHans: '现实延续', titleEn: 'Reality Continuation' }
];

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const normalizeNewlines = value => value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const cleanHeading = value => value.replace(/\*+$/g, '').replace(/^#+\s*/, '').trim();
const cleanBold = value => value.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
const objectText = value => `${JSON.stringify(value, null, 2)}\n`;

const lineNumberAt = (lineStarts, offset) => {
  let low = 0;
  let high = lineStarts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (lineStarts[middle] <= offset) low = middle;
    else high = middle;
  }
  return low + 1;
};

const coreText = block => block
  .split(/^---\s*$/m)[0]
  .replace(/^#{1,6}.*$/gm, '')
  .replace(/^>.*$/gm, '')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export function parseBookW1BSourceOutline(rawBytes, sourceFileName) {
  const originalSha256 = sha256(rawBytes);
  assert.equal(
    originalSha256,
    AUTHORIZED_SOURCE_SHA256,
    'The source file must be the exact TL-authorized P8-P15 attachment.'
  );
  const rawText = rawBytes.toString('utf8');
  assert(!rawText.includes('\uFFFD'), 'The source must be valid UTF-8.');
  const text = normalizeNewlines(rawText);
  const lineStarts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') lineStarts.push(index + 1);
  }

  const sectionHeadings = [];
  const sectionPattern = /^#\s+([^\n]+)$/gm;
  let match;
  while ((match = sectionPattern.exec(text))) {
    if (!/第(?:8|9|10|11|12|13|14|15)部/.test(match[1])) {
      sectionHeadings.push({ offset: match.index, title: cleanHeading(match[1]) });
    }
  }

  const partHeaderVariants = new Map(PART_SPECS.map(spec => [spec.partCode, []]));
  const partHeaderPattern = /^#\s+[^\n]*第(8|9|10|11|12|13|14|15)部｜([^\n]+)$/gm;
  while ((match = partHeaderPattern.exec(text))) {
    const list = partHeaderVariants.get(`P${match[1]}`);
    const title = cleanHeading(match[2]);
    if (!list.includes(title)) list.push(title);
  }

  const mainPattern = /^#{3,4}\s+\*{0,2}((8|9|10|11|12|13|14|15)\.\d+)(?!\.)\s*(?:｜\s*)?([^\n]*?)\*{0,2}\s*$/gm;
  const occurrences = [];
  while ((match = mainPattern.exec(text))) {
    occurrences.push({
      chapterCode: match[1],
      partCode: `P${match[2]}`,
      sourceTitle: cleanHeading(match[3]),
      start: match.index,
      headingEnd: mainPattern.lastIndex,
      sourceLine: lineNumberAt(lineStarts, match.index)
    });
  }
  occurrences.forEach((occurrence, index) => {
    occurrence.end = occurrences[index + 1]?.start ?? text.length;
    const block = text.slice(occurrence.start, occurrence.end);
    const boundedBlock = block.split(/^---\s*$/m)[0];
    const boldQuestion = boundedBlock.match(/^\*\*([^\n]+)\*\*\s*$/m);
    occurrence.canonicalQuestion = boldQuestion ? cleanBold(boldQuestion[0]) : null;
    occurrence.chapterCoreSha256 = sha256(coreText(block));
    occurrence.sectionTitle = [...sectionHeadings]
      .reverse()
      .find(section => section.offset < occurrence.start)?.title ?? null;
    const subchapters = [];
    const subPattern = /^#{4,6}\s+\*{0,2}((?:8|9|10|11|12|13|14|15)\.\d+\.\d+)\s*(?:｜\s*)?([^\n]*?)\*{0,2}\s*$/gm;
    let subMatch;
    while ((subMatch = subPattern.exec(boundedBlock))) {
      subchapters.push({
        chapterCode: subMatch[1],
        sourceTitle: cleanHeading(subMatch[2]),
        sourceLine: occurrence.sourceLine + boundedBlock.slice(0, subMatch.index).split('\n').length - 1
      });
    }
    occurrence.subchapters = subchapters;
  });

  const byCode = new Map();
  for (const occurrence of occurrences) {
    if (!byCode.has(occurrence.chapterCode)) byCode.set(occurrence.chapterCode, []);
    byCode.get(occurrence.chapterCode).push(occurrence);
  }

  const parts = PART_SPECS.map(spec => {
    const chapters = [];
    for (let number = 1; number <= spec.chapterCount; number += 1) {
      const chapterCode = `${spec.number}.${number}`;
      const copies = byCode.get(chapterCode) ?? [];
      const expectedOccurrenceCount = spec.partCode === 'P13' ? 2 : 1;
      assert.equal(copies.length, expectedOccurrenceCount, `${chapterCode} occurrence count mismatch.`);
      assert.equal(
        new Set(copies.map(copy => copy.chapterCoreSha256)).size,
        1,
        `${chapterCode} repeated chapter cores must be identical.`
      );
      assert.equal(
        new Set(copies.map(copy => copy.sourceTitle)).size,
        1,
        `${chapterCode} repeated chapter titles must be identical.`
      );
      assert.equal(
        new Set(copies.map(copy => copy.canonicalQuestion)).size,
        1,
        `${chapterCode} repeated canonical questions must be identical.`
      );
      const primary = copies[0];
      chapters.push({
        chapterCode,
        sourceTitle: primary.sourceTitle,
        canonicalQuestion: primary.canonicalQuestion,
        sectionTitle: primary.sectionTitle,
        subchapters: primary.subchapters,
        chapterCoreSha256: primary.chapterCoreSha256,
        sourceOccurrences: copies.map(copy => ({ sourceLine: copy.sourceLine }))
      });
    }
    return {
      partCode: spec.partCode,
      titleZhHans: spec.titleZhHans,
      titleEn: spec.titleEn,
      sourceHeaderVariants: partHeaderVariants.get(spec.partCode),
      mainChapterCount: chapters.length,
      sourceOccurrenceCount: chapters.reduce((sum, chapter) => sum + chapter.sourceOccurrences.length, 0),
      subchapterCount: chapters.reduce((sum, chapter) => sum + chapter.subchapters.length, 0),
      inventorySha256: sha256(JSON.stringify(chapters)),
      chapters
    };
  });

  assert.equal(parts.reduce((sum, part) => sum + part.mainChapterCount, 0), 621);
  assert.equal(parts.reduce((sum, part) => sum + part.sourceOccurrenceCount, 0), 708);
  assert.equal(occurrences.length, 708);

  const p13 = parts.find(part => part.partCode === 'P13');
  assert(p13.chapters.every(chapter => chapter.sourceOccurrences.length === 2));

  return {
    schemaVersion: 'PHI-OS-BOOK-W1B-SOURCE-OUTLINE-AUTHORITY-v1.0.0',
    contractVersion: 'PHI-OS-BOOK-W1B-SOURCE-OUTLINE-AUTHORITY-CONTRACT-v1.0.0',
    phase: 'BOOK-W1',
    step: 'BOOK-W1B-SOURCE-AUTHORITY',
    status: 'TL_AUTHORIZED_SOURCE_AUTHORITY_REVIEW_CANDIDATES_ONLY',
    recordedAt: '2026-08-13',
    source: {
      suppliedFileName: sourceFileName,
      mediaType: 'text/plain',
      encoding: 'UTF-8',
      newlineStyle: rawText.includes('\r\n') ? 'CRLF' : 'LF',
      originalByteCount: rawBytes.length,
      originalLineBreakCount: (text.match(/\n/g) ?? []).length,
      originalSha256,
      sourceBodyStoredInPublicRepository: false,
      structuredOutlineAuthorityStored: true
    },
    humanAuthorization: {
      actorRole: 'TL',
      statement: 'P8-P15 complete chapter outline is the final sourceOutlineAuthority for BOOK-W1B; authorization is limited to source-authority establishment and migration-review candidate rebuilding.',
      sourceOutlineAuthorityAuthorized: true,
      migrationMapCandidateRebuildAuthorized: true,
      w1bAccepted: false,
      w1cAccepted: false,
      w1dAccepted: false
    },
    supersedes: {
      path: 'content/knowledge/reconciliation/kau-r2/future-volume-outline-upgrade-guard-v1.json',
      scope: 'BOOK-W1B P8-P15 outline source authority only',
      historicalAuthorityMutationAllowed: false
    },
    normalizationRecord: {
      sourceMainChapterOccurrenceCount: 708,
      normalizedUniqueMainChapterCount: 621,
      duplicateOccurrenceCount: 87,
      duplicateScope: 'P13 13.1-13.87 second exact-repeat sequence',
      duplicateDisposition: 'DEDUPLICATED_EXACT_REPEAT_FOR_REVIEW_CANDIDATE_ONLY',
      duplicateCoreMismatchCount: 0,
      sourceFileRemainsAuthoritativeByOriginalSha256: true
    },
    inventory: {
      partCount: parts.length,
      mainChapterCount: parts.reduce((sum, part) => sum + part.mainChapterCount, 0),
      subchapterCount: parts.reduce((sum, part) => sum + part.subchapterCount, 0),
      allExpectedChapterCodesPresent: true,
      duplicateChapterCodesAfterNormalization: 0
    },
    boundaries: {
      outlineChapterIsCanonicalNode: false,
      automaticCanonicalNodeApprovalAllowed: false,
      canonicalNodeRegistryMutationAllowed: false,
      successorBlueprintActivationAllowed: false,
      canonicalRegistryActivationAllowed: false
    },
    parts
  };
}

async function writeAuthority(root, sourcePath) {
  const rawBytes = await fs.readFile(sourcePath);
  const authority = parseBookW1BSourceOutline(rawBytes, path.basename(sourcePath));
  const outputPath = path.join(root, SOURCE_AUTHORITY_PATH);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, objectText(authority), 'utf8');
  console.log(`Imported ${authority.inventory.mainChapterCount} unique BOOK-W1B outline chapters from the TL-authorized source.`);
  console.log(`Normalized ${authority.normalizationRecord.duplicateOccurrenceCount} exact-repeat P13 occurrences without altering the source digest.`);
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  assert.equal(process.argv[2], '--write', 'Use --write followed by the TL-authorized source path.');
  assert(process.argv[3], 'The TL-authorized source path is required.');
  await writeAuthority(process.cwd(), path.resolve(process.argv[3]));
}
