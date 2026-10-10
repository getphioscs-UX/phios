import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExtractionArgs } from './extract-book-i-p0.mjs';
import {
  EXTRACTION_METHOD,
  P0_CANDIDATE_RELATIVE,
  P0_R2_TARGET,
  anchorForm,
  buildCandidateMarkdown,
  cleanP0Pages,
  headingDiagnostics,
  locateP0Boundary,
  normalizeOverprintedHeading,
  textItemsToLines
} from './lib/knowledge-manuscripts/searchable-pdf-extraction.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const line = (pageNumber, text, y, fontSize = 12, xStart = 72, pageHeight = 842) => ({
  pageNumber,
  pageHeight,
  text,
  xStart,
  xEnd: xStart + Math.max(20, text.length * fontSize),
  y,
  fontSize,
  fontNames: ['FixtureFont']
});
const page = (pageNumber, lines) => ({ pageNumber, width: 595, height: 842, lines });

const packageJson = json('package.json');
const manifest = json('content/knowledge/manuscripts/book-1/manuscript-manifest.json');
const gitignore = read('.gitignore');
const extractionSource = read('scripts/lib/knowledge-manuscripts/searchable-pdf-extraction.mjs');
const cliSource = read('scripts/extract-book-i-p0.mjs');

assert.equal(packageJson.scripts['knowledge:manuscript:extract-p0'], 'node scripts/extract-book-i-p0.mjs');
assert.equal(
  packageJson.scripts['check:knr-w2r1-t04'],
  'node scripts/check-knr-w2r1-t04-searchable-pdf-extraction.mjs'
);
assert.equal(packageJson.devDependencies['pdfjs-dist'], '6.2.108');
assert(gitignore.split(/\r?\n/u).includes('.tmp/knowledge-manuscripts/'));
assert.equal(manifest.authorityStatus, 'verified');
assert.equal(manifest.verificationStatus, 'content_verified');
assert.equal(manifest.objects.find(object => object.objectRole === 'source_pdf').verificationStatus, 'content_verified');
assert.equal(EXTRACTION_METHOD, 'searchable_pdf_text_layer');
assert.equal(P0_CANDIDATE_RELATIVE, '.tmp/knowledge-manuscripts/book-1/p0-preface-candidate.md');
assert.equal(P0_R2_TARGET, 'books/book-1/extracted/p0-preface.md');
assert(!/@aws-sdk|PutObjectCommand|UploadPartCommand/u.test(extractionSource));
assert(!/tesseract|ocrmypdf|paddleocr|easyocr/iu.test(`${extractionSource}\n${cliSource}`));
assert(extractionSource.includes("ocrUsed: false"));
assert(extractionSource.includes("r2UploadPerformed: false"));
assert(extractionSource.includes("verbosity: 0"));
assert(extractionSource.includes("why_phios_heading"));
assert(extractionSource.includes("prelude_reality_breakdown"));
assert(extractionSource.includes("part_one_reality_physics"));
assert(extractionSource.includes("exact_overlay_duplicate_collapsed"));
assert(extractionSource.includes("wrapped_heading_continuation_merged"));
assert(extractionSource.includes("shortSemanticContinuation"));

assert.deepEqual(parseExtractionArgs([]), { mode: 'dry-run', overrides: {} });
assert.deepEqual(parseExtractionArgs(['--dry-run', '--start-page', '8', '--end-page=31']), {
  mode: 'dry-run',
  overrides: { startPage: 8, endPage: 31 }
});
assert.deepEqual(parseExtractionArgs(['--apply']), { mode: 'apply', overrides: {} });
assert.throws(() => parseExtractionArgs(['--dry-run', '--apply']), error => error.code === 'P0_EXTRACTION_MODE_CONFLICT');
assert.throws(() => parseExtractionArgs(['--start-page', '0']), error => error.code === 'P0_PAGE_OVERRIDE_INVALID');
assert.throws(
  () => parseExtractionArgs(['--start-page', '12', '--end-page', '11']),
  error => error.code === 'P0_PAGE_OVERRIDE_ORDER_INVALID'
);

const ordered = textItemsToLines([
  { str: '需要', transform: [1, 0, 0, 12, 44, 700], width: 24, height: 12, fontName: 'F1' },
  { str: '为什么', transform: [1, 0, 0, 12, 8, 700], width: 36, height: 12, fontName: 'F1' }
], 1, 842);
assert.equal(ordered.length, 1);
assert.equal(ordered[0].text, '为什么需要');

assert.deepEqual(normalizeOverprintedHeading(
  '◈◈文明断裂不是未来，而是正在发生文明断裂不是未来，而是正在发生'
), {
  text: '文明断裂不是未来，而是正在发生',
  actions: ['decorative_heading_marker_removed', 'exact_overlay_duplicate_collapsed'],
  repeatCount: 2
});
assert.deepEqual(normalizeOverprintedHeading('长期运行长期运行'), {
  text: '长期运行长期运行',
  actions: [],
  repeatCount: 1
});

const pages = [
  page(1, [line(1, '现实如何形成', 430, 28, 150)]),
  page(2, [
    line(2, '目录', 790, 24, 250),
    line(2, '序部｜为什么需要 PHI OS', 730),
    line(2, '第一部｜现实物理学', 700),
    line(2, '第二部｜投影系统', 670),
    line(2, '第三部｜运行动力学', 640),
    line(2, '第四部｜人类运行载体', 610),
    line(2, '第五部｜意识运行', 580)
  ]),
  page(3, [
    line(3, '序部｜', 760, 24, 165),
    line(3, '为什么需要 PHI OS', 725, 24, 145),
    line(3, '人工智能不是脱离文明而独立出现的能力，而是文明长期积累后的结构性结果。', 655),
    line(3, '理解这一点，需要把技术放回知识、制度、语言与协作共同形成的现实中。', 632),
    line(3, '当这些条件被忽略时，工具容易被误解为自行产生方向的主体。', 595),
    line(3, '3', 18, 10, 292)
  ]),
  page(4, [
    line(4, 'PHI OS Book I', 822, 9, 250),
    line(4, '文明能力并不是单一技术组件，而是多层结构持续互动所形成的运行能力。', 748),
    line(4, '它包含概念、记录、判断、纠错与跨代传递等相互依赖的条件。', 725),
    line(4, '图 0.1：文明能力结构示意图', 680, 10, 180),
    line(4, '这些条件共同决定技术能够处理什么，也决定技术不能替代什么。', 640),
    line(4, '4', 18, 10, 292)
  ]),
  page(5, [
    line(5, 'PHI OS Book I', 822, 9, 250),
    line(5, '因此，提取书稿时必须保留原有论证顺序，不得把解释重新写成新的理论。', 748),
    line(5, '本阶段只建立可供人工核对的候选文本，任何规范化结论仍由人工确认。', 725),
    line(5, '5', 18, 10, 292)
  ]),
  page(6, [
    line(6, '第一部｜现实物理学', 760, 24, 155),
    line(6, '现实不是随机信息的简单集合。', 690)
  ])
];

const boundary = locateP0Boundary(pages, manifest);
assert.equal(boundary.start.pageNumber, 3);
assert.equal(boundary.end.pageNumber, 6);
assert.equal(boundary.start.matchMode, 'exact');
assert.equal(boundary.end.matchMode, 'exact');
assert.deepEqual(boundary.contentsPages, [2]);

const actualBookTocPages = [
  page(7, [
    line(7, 'Prelude', 780, 12),
    line(7, 'Reality Breakdown', 755, 12),
    line(7, '第一部｜Reality Physics', 725, 12),
    line(7, '第二部｜Projection System', 695, 12),
    line(7, '第三部｜Reality Dynamics', 665, 12),
    line(7, '第四部｜Human Runtime Carrier', 635, 12)
  ]),
  page(8, [
    line(8, 'Prelude', 770, 28, 175),
    line(8, 'Reality', 735, 28, 175),
    line(8, 'Breakdown', 700, 28, 175),
    line(8, '文明断裂序章', 655, 20, 175),
    line(8, '文明断裂不是未来，而是正在发生。', 600)
  ]),
  page(12, [
    line(12, '📙 第一部｜', 770, 26, 160),
    line(12, 'Reality Physics', 735, 26, 160),
    line(12, 'Reality 如何形成可持续现实', 690, 18, 160),
    line(12, '差异如何形成结构。', 630)
  ])
];
const actualBookBoundary = locateP0Boundary(actualBookTocPages, manifest);
assert.equal(actualBookBoundary.start.pageNumber, 8);
assert.equal(actualBookBoundary.end.pageNumber, 12);
assert.equal(actualBookBoundary.start.matchMode, 'book_toc_alias');
assert.equal(actualBookBoundary.start.matchProfile, 'prelude_reality_breakdown');
assert.equal(actualBookBoundary.end.matchMode, 'book_toc_alias');
assert.equal(actualBookBoundary.end.matchProfile, 'part_one_reality_physics');
assert.deepEqual(actualBookBoundary.contentsPages, [7]);
assert.equal(actualBookBoundary.start.text, 'Prelude Reality Breakdown');
assert.equal(actualBookBoundary.end.text, '📙 第一部｜ Reality Physics');

const actualPdfOverprintPages = [
  page(2, [
    line(2, '◈◈为什么需要 PHI OS为什么需要 PHI OS', 790, 16, 160),
    line(2, '现实系统必须被放回完整结构中理解。', 700, 12, 72),
    line(2, '局部知识能够解释局部现象，但无法单独说明整体如何持续运行。', 675, 12, 72)
  ]),
  page(34, [
    line(34, '第一部｜Reality Physics', 760, 24, 155),
    line(34, 'Reality 如何形成可持续现实', 710, 18, 155)
  ])
];
const actualPdfOverprintBoundary = locateP0Boundary(actualPdfOverprintPages, manifest);
assert.equal(actualPdfOverprintBoundary.start.pageNumber, 2);
assert.equal(actualPdfOverprintBoundary.end.pageNumber, 34);
assert.equal(actualPdfOverprintBoundary.start.matchMode, 'book_toc_alias');
assert.equal(actualPdfOverprintBoundary.start.matchProfile, 'why_phios_heading');
assert.equal(actualPdfOverprintBoundary.start.text, '为什么需要 PHI OS');
assert.equal(actualPdfOverprintBoundary.start.likelyRunningHeader, false);
assert.equal(actualPdfOverprintBoundary.end.matchProfile, 'part_one_reality_physics');

const aliasDiagnostics = headingDiagnostics(actualBookTocPages);
assert(aliasDiagnostics.some(item => item.text === 'Prelude'));
assert(aliasDiagnostics.some(item => item.text === 'Reality Physics'));
assert(aliasDiagnostics.every(item => item.text.length <= 72));
const overprintDiagnostics = headingDiagnostics(actualPdfOverprintPages);
assert(overprintDiagnostics.some(item => item.text.includes('为什么需要 PHI OS')));
assert(!overprintDiagnostics.some(item => item.text.includes('局部知识能够解释')));

const aliasCleanedBase = cleanP0Pages([
  page(8, [
    line(8, actualBookBoundary.start.text, 770, 28, 175),
    line(8, '文明断裂序章', 720, 20, 175),
    line(8, '文明断裂不是未来，而是正在发生。', 650),
    line(8, '系统能力的失配会先表现为结果不稳定，再逐渐显露出结构层级的问题。', 625),
    line(8, '候选文本必须保留原有论证顺序，并等待人工逐页核对。', 600)
  ])
], actualBookBoundary.start.text);
assert(aliasCleanedBase.body.startsWith('# Prelude Reality Breakdown'));
assert(aliasCleanedBase.body.includes('文明断裂序章'));
assert(!aliasCleanedBase.body.startsWith('# 序部｜为什么需要 PHI OS'));

const overprintedHeadingCleaned = cleanP0Pages([
  page(20, [
    line(20, manifest.parts.find(part => part.partCode === 'P0').title, 770, 24, 72),
    line(20, '◈◈为什么现实不是一个对象，而是一种持续形成自为什么现实不是一个对象，而是一种持续形成自', 700, 20, 72),
    line(20, '己的生命过程己的生命过程', 630, 19, 120),
    line(20, '现实的形成需要经过连续的结构变化，并在不同条件之间保持可辨认的关系。', 575, 12, 72),
    line(20, '候选文本必须保留原有论证顺序，任何文字规范化都不能改变理论含义。', 550, 12, 72),
    line(20, '人工复核还需要检查标题、段落、页码、图注以及跨页连接是否完整。', 525, 12, 72)
  ])
], manifest.parts.find(part => part.partCode === 'P0').title);
assert(overprintedHeadingCleaned.body.includes(
  '## 为什么现实不是一个对象，而是一种持续形成自己的生命过程'
));
assert(!overprintedHeadingCleaned.body.includes('◈'));
assert(!overprintedHeadingCleaned.body.includes('## 己的生命过程'));
assert.equal(overprintedHeadingCleaned.normalized.length, 3);

const distinctHeadingCleaned = cleanP0Pages([
  page(21, [
    line(21, manifest.parts.find(part => part.partCode === 'P0').title, 770, 24, 72),
    line(21, '为什么持续变化会形成新的系统层级与可辨认的现实边界', 700, 20, 72),
    line(21, '结论：继续', 630, 19, 120),
    line(21, '不同标题必须维持独立结构，不能仅因相邻位置而被错误合并。', 575, 12, 72),
    line(21, '受控规范化只处理可以由文本形态与页面关系共同确认的断行。', 550, 12, 72),
    line(21, '人工复核仍然负责确认理论含义、章节层级与最终发布边界。', 525, 12, 72)
  ])
], manifest.parts.find(part => part.partCode === 'P0').title);
assert(distinctHeadingCleaned.body.includes(
  '## 为什么持续变化会形成新的系统层级与可辨认的现实边界'
));
assert(distinctHeadingCleaned.body.includes('## 结论：继续'));
assert(!distinctHeadingCleaned.body.includes('现实边界结论：继续'));

const selectedPages = pages.slice(2, 5).map((fixturePage, index) => {
  if (index !== 0) return fixturePage;
  return {
    ...fixturePage,
    lines: [
      line(3, manifest.parts.find(part => part.partCode === 'P0').title, 760, 24, 145),
      ...fixturePage.lines.slice(2)
    ]
  };
});
const cleanedBase = cleanP0Pages(selectedPages, boundary.startAnchor);
const cleaned = { ...cleanedBase, pages: selectedPages };
assert(cleaned.body.startsWith('# 序部｜为什么需要 PHI OS'));
assert(!cleaned.body.includes('PHI OS Book I'));
assert(!cleaned.body.includes('图 0.1'));
assert(!/^\s*[345]\s*$/mu.test(cleaned.body));
assert(cleaned.removed.some(item => item.reason === 'figure_caption'));
assert(cleaned.removed.filter(item => item.reason === 'recurring_header_or_footer').length === 2);
assert(cleaned.removed.filter(item => item.reason === 'page_number').length === 3);

const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
const candidate = buildCandidateMarkdown({
  manifest,
  source,
  boundary,
  cleaned,
  sourcePageCount: 120
});
assert(candidate.includes('extractionMethod: searchable_pdf_text_layer'));
assert(candidate.includes('ocrUsed: false'));
assert(candidate.includes('detectedStartHeading:'));
assert(candidate.includes('startMatchMode: exact'));
assert(candidate.includes('normalizationStatus: human_review_required'));
assert(candidate.includes('humanVerified: false'));
assert(candidate.includes(`r2TargetObjectKey: ${P0_R2_TARGET}`));
assert(!candidate.includes('PHI OS Book I'));
assert(!candidate.includes('图 0.1'));

const noEnd = pages.filter(fixturePage => fixturePage.pageNumber !== 6);
assert.throws(() => locateP0Boundary(noEnd, manifest), error => {
  assert.equal(error.code, 'P0_BOUNDARY_NOT_FOUND');
  assert(Array.isArray(error.details.headingDiagnostics));
  assert(error.details.headingDiagnostics.every(item => item.text.length <= 72));
  assert(!error.details.headingDiagnostics.some(item => item.text.includes('人工智能不是脱离文明')));
  return true;
});
const garbled = [page(3, [line(3, boundary.startAnchor, 760, 24), line(3, `异常字符�${'内容'.repeat(60)}`, 700)])];
assert.throws(() => cleanP0Pages(garbled, boundary.startAnchor), error => error.code === 'SEARCHABLE_TEXT_GARBLED');
assert.equal(anchorForm('第一部｜现实物理学'), anchorForm('第一部：现实物理学'));

console.log('✓ KNR-W2R1-T04 Searchable PDF Extraction Pilot contract passed.');
console.log('  P0 uses the searchable PDF text layer only; OCR fallback and remote upload are disabled.');
console.log('  Manifest anchors and controlled Book I TOC aliases select P0; contents matches remain excluded.');
console.log('  Candidate Markdown and its audit report are private .tmp outputs requiring T05 human review.');
