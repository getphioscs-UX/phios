// Native PDF text only. Input is a local pypdf extraction, never OCR or an R2 image.
import fs from 'node:fs';
import crypto from 'node:crypto';
const [pdfPath, pagesPath] = process.argv.slice(2);
if (!pdfPath || !pagesPath) throw new Error('Usage: node scripts/build-book-v-pka-r1-source-inventory.mjs PDF_PATH PAGES_JSON');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const pages = JSON.parse(fs.readFileSync(pagesPath));
if (pages.some((p, i) => p.page !== i + 1 || typeof p.text !== 'string')) throw new Error('Invalid page extraction');
const sourcePdfSha256 = hash(fs.readFileSync(pdfPath));
if (sourcePdfSha256 !== '011996e36225e6ec1d7bba8b368d3b5d2c3b8c1567dab7ea5cd6f51f1ac069be') {
  throw new Error('SOURCE_CHANGED: visually reviewed TOC and figure metadata must be reconciled before extraction of a different PDF.');
}
const sections = [];
const seen = new Set();
for (const page of pages) {
  for (const segment of page.text.split('✦').slice(1)) {
    const heading = segment.split(/\n[ \t]{4,}|时间锚点|时 间 锚 点|区 域 锚 点|区域锚点/)[0].replace(/\s/g, '');
    if (!heading.includes('|')) continue;
    const title = heading.split('|')[0];
    if (seen.has(title)) continue; // PDF repeats display headings; retain the first location.
    seen.add(title);
    sections.push({sourceSectionId: `B5-S${String(sections.length + 1).padStart(3, '0')}`, title, heading, pdfPageStart: page.page});
  }
}
for (let i = 0; i < sections.length; i++) {
  // Inclusive page windows intentionally overlap when a page contains two sections.
  sections[i].pdfPageEnd = sections[i + 1]?.pdfPageStart ?? pages.findLast(p => p.text.trim())?.page;
}
if (pages.length !== 410 || sections.length !== 126) throw new Error('SOURCE_EXTRACTION_DRIFT: expected 410 pages and 126 native headings.');
const sourcePath = 'functions/_source-material/books/book-5-desktop-text-v1.json';
fs.writeFileSync(sourcePath, JSON.stringify({bookCode: 'BOOK-5', sourceFileName: 'PHI-OS-Book-5-v1.pdf', sourcePdfSha256, pageCount: pages.length, extractionEngine: 'pypdf', role: 'USER_SUPPLIED_REVIEW_SOURCE', publicationAuthority: true, canonicalAuthority: false, rawDeliveryAllowed: false, pages: pages.map(p => ({pdfPage: p.page, text: p.text, textSha256: hash(p.text)}))}, null, 2) + '\n');
// Manually inspected PDF page 2: editorial table of contents only. No dates,
// measurements, diagram coordinates or historical facts are transcribed from images.
const partRows = [
  ['12.A','文明图谱基础',1,12],['12.B','分化的起点',13,24],
  ['12.C','文明第一次出现',25,36],['12.D','青铜、铁与帝国',37,48],
  ['12.E','古典文明世界',49,60],['12.F','信仰、知识与普遍文明',61,72],
  ['12.G','大陆网络',73,84],['12.H','征服、瘟疫与重新连接',85,92],
  ['12.I','海洋把世界连成一个系统',93,102],['12.J','工业文明',103,114],
  ['12.K','现代化并没有只有一种答案',115,126]
];
const parts = partRows.map(([code,title,first,last])=>({code,title,tocPdfPage:2,titleEvidence:'VISUALLY_REVIEWED_EDITORIAL_TOC',sectionGrouping:'EDITORIAL_MATCH_BY_TOPIC_AND_ORDER',sourceSections:sections.slice(first-1,last).map(s=>s.sourceSectionId)}));
const figures = [[49,'FIG 12A','文明图谱的观察空间'],[96,'FIG 12B','文明分化条件场'],[124,'FIG 12C','第一代城市文明比较图谱'],[191,'FIG 12D','古典文明 Runtime 比较图'],[362,'FIG 12E','能源密度与文明尺度转换'],[409,'FIG 12F','现代性的多条道路']].map(([pdfPage,label,title])=>({pdfPage,label,title,evidence:'VISUALLY_REVIEWED_EDITORIAL_CAPTION_ONLY',historicalDataTranscribed:false,r2Binding:'UNRESOLVED_UNTIL_W6'}));
const inventory = {schemaVersion: 'PHI-OS-BOOK-V-FINAL-SOURCE-INVENTORY-v1', sourcePath, sourcePdfSha256, pageCount: pages.length, sectionCount: sections.length, extraction: 'NATIVE_PDF_TEXT_NO_OCR', identityPolicy: 'B5-S identifiers locate manuscript sections; they are not canonical Knowledge node IDs or printed chapter numbers.', pageWindowPolicy: 'Inclusive overlapping page windows; use exact heading to disambiguate shared pages.', printedSectionNumbers: [], numberingStatus: 'Visual TOC lists 12.A–12.K. No 12.L–12.N found. Native body headings omit 12.x numbering; poster chapter labels must not become canonical identities.', parts, figures, endBoundary: {pdfPage: 408, text: '这就是下一册【世界如何重组】真正的起点'}, sections};
fs.mkdirSync('content/books/book-5/source', {recursive: true});
fs.writeFileSync('content/books/book-5/source/final-manuscript-structure-v1.json', JSON.stringify(inventory, null, 2) + '\n');
console.log(`Book V source inventory: ${pages.length} pages, ${sections.length} unique native-text headings.`);
