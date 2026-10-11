import fs from 'node:fs';
import crypto from 'node:crypto';
const dir = 'tools/review/free-ask-manuscript-r1/';
const read = path => JSON.parse(fs.readFileSync(path));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const master = read(dir + 'SEVEN-BOOK-COVERAGE.json');
const registry = read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json');
const scopes = read('content/knowledge/source-access/registries/manuscript-text-scope-candidates-v3.json').records;
const paths = {
  'BOOK-1': '.tmp/knowledge-manuscripts/book-1-v3/positioned-candidate-r2/retrieval-corpus.json',
  'BOOK-2': 'functions/_source-material/books/book-2-registered-reviewed-corpus.json',
  'BOOK-3': '.tmp/knowledge-manuscripts/book-3-owner-final-20261011-efbfdd21fa21/positioned-candidate/retrieval-corpus.json',
  'BOOK-5': '.tmp/knowledge-manuscripts/book-5-v1/positioned-candidate-r2/retrieval-corpus.json',
  'BOOK-7': '.tmp/knowledge-manuscripts/book-7-v2/positioned-candidate-r2/retrieval-corpus.json',
};
const books = master.currentSevenBookTruth.rows.map(row => {
  const source = registry.records.find(r => r.bookCode === row.bookCode);
  const corpusPath = paths[row.bookCode] || source.localPath;
  const corpus = read(corpusPath);
  const records = corpus.records.map(record => {
    const classification = row.bookCode === 'BOOK-6' && record.sectionCode === 'CM-B6-owner-final-20261011-15d80720d10c-S061'
      ? 'PART_INTRODUCTION' : record.segmentType;
    const admitted = scopes.filter(scope => scope.bookCode === row.bookCode && scope.sectionCode === record.sectionCode);
    const nonProse = classification !== 'SECTION' || record.retrievalEligible === false;
    const sameSource = source.sourceSha256 === corpus.sourceSha256;
    const reason = nonProse ? 'Front matter / part heading is preserved; not an independent answer unit.'
      : admitted.length ? (sameSource ? 'Only listed offsets are live-verified; remainder of this chapter is not admitted.' : 'Historical live offsets retained. Current source comparison and new offset/answer binding required before cutover.')
      : row.bookCode === 'BOOK-1' ? 'Current v3 structure candidate; production still consumes historical v2. Answer fit and dependent visuals pending.'
      : row.bookCode === 'BOOK-2' ? 'Current corpus is consumed; definition/mechanism/condition answer-fit failures remain. No chapter-level answer acceptance claimed.'
      : row.bookCode === 'BOOK-3' ? 'Current final PDF source accepted; all 103 chapters re-extracted. Historical six live ranges retained; new source binding and answer fit pending.'
      : row.bookCode === 'BOOK-7' ? 'Private full reading remains protected; bounded knowledge derivative permission/quality and consumer wiring pending.'
      : 'Chapter answer-fit and figure/footnote dependencies not individually verified; not automatically blocked by unrelated OCR.';
    return { sectionCode: record.sectionCode, heading: record.heading, segmentType: classification,
      pages: [record.startPage, record.endPage], textSha256: record.textSha256 || sha(record.text || ''),
      retrievable: nonProse ? 'EXPLICITLY_RESTRICTED' : sameSource && ['BOOK-2','BOOK-3'].includes(row.bookCode)
        ? (admitted.length || row.bookCode === 'BOOK-2' ? 'RUNTIME_WIRED' : 'CANDIDATE_NOT_ADMITTED') : 'LOCAL_CANDIDATE_NOT_CURRENT_RUNTIME',
      answerable: nonProse ? 'EXPLICITLY_RESTRICTED' : admitted.length && sameSource ? 'PARTIAL_LIVE_OFFSETS_ONLY' : 'PENDING_VERIFICATION',
      historicalLiveRangesRetained: !sameSource && admitted.length > 0,
      acceptedLiveRanges: admitted.map(s => ({scopeId:s.scopeId || s.id, startOffset:s.startOffset, endOffset:s.endOffset})),
      wholeChapterAnswerVerified: false, reason,
      next: nonProse ? 'Retain source structure; do not count as answerable chapter.' : 'Verify complete chapter prose, dependent figures/notes, then natural and unseen question fit before admission.',
    };
  });
  return {bookCode:row.bookCode, currentSourceVersion:row.currentSourceVersion, sourceSha256:corpus.sourceSha256,
    corpusPath, corpusBytesSha256:sha(fs.readFileSync(corpusPath)), records:records.length,
    chapterRecords:records.filter(r=>r.segmentType==='SECTION').length,
    partialLiveChapterRecords:records.filter(r=>r.answerable==='PARTIAL_LIVE_OFFSETS_ONLY').length,
    historicalLiveChapterRecords:records.filter(r=>r.historicalLiveRangesRetained).length,
    wholeChapterAnswerVerified:0, chapters:records};
});
const receipt = {at:new Date().toISOString(), unit:'COMPLETE_SOURCE_CHAPTER_WITH_SEPARATE_OFFSET_ADMISSION', books,
  providerCalls:0, claim:'Coverage accounting, not a retrieval/answer PASS; existing live offset evidence remains in original receipts.'};
const output = dir+'SEVEN-BOOK-CHAPTER-COVERAGE.json';
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
master.currentSevenBookTruth.chapterCoverage = {path:output, at:receipt.at, books:books.map(({chapters,...summary})=>summary)};
fs.writeFileSync(dir+'SEVEN-BOOK-COVERAGE.json',JSON.stringify(master,null,2)+'\n');
const htmlPath='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/<section id="seven-manuscript-full-chapter-coverage">[\s\S]*?<\/section>/,'');
const section='<section id="seven-manuscript-full-chapter-coverage"><h2>七册完整章节覆盖 · 逐章工作单位</h2><p>当前线上十个正文范围继续有效，但不等于十章完整通过。章节表逐项区分可检索、可回答、待核验和明确受限；未核验的整章不写 PASS。第三册六范围保留历史来源线上证据，新最终稿接入尚待验收。</p><table><tr><th>册</th><th>记录／章节</th><th>当前／历史来源部分线上范围的章</th><th>整章回答验收</th></tr>'+books.map(b=>`<tr><td>${b.bookCode}</td><td>${b.records} / ${b.chapterRecords}</td><td>${b.partialLiveChapterRecords} / ${b.historicalLiveChapterRecords}</td><td>${b.wholeChapterAnswerVerified}</td></tr>`).join('')+'</table><p>第一册标题移除修复尚待回答验收和 v3 切换；第三册新最终稿已接受并重新提取全部103章：101章正文归一化一致，维持出现重复拼接及可持续连续箭头顺序已在新派生文本修正。五个旧范围文本一致，一个范围待差异验收。均不自动扩大生产准入。</p><a href="../../../'+output+'">逐章原因、实际 corpus 摘要、准入偏移和下一步</a><p><a href="../../../tools/review/free-ask-manuscript-r1/BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json">第三册全部章节及六范围实际比较</a></p></section>';
html=html.replace('</main>',section+'</main>');fs.writeFileSync(htmlPath,html);
console.log(books.map(b=>({book:b.bookCode,records:b.records,chapters:b.chapterRecords,partialLive:b.partialLiveChapterRecords,wholeVerified:0})));
