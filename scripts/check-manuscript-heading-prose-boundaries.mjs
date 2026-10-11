import fs from 'node:fs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundled = await build({entryPoints:['functions/_lib/knowledge-access-api.js'],bundle:true,platform:'node',format:'esm',write:false});
const { manuscriptAnswerProse } = await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const path = '.tmp/knowledge-manuscripts/book-1-v3/positioned-candidate-r2/retrieval-corpus.json';
const corpus = JSON.parse(fs.readFileSync(path));
const results = corpus.records.map(record => {
  const prose = manuscriptAnswerProse(record.text, record.heading);
  const removed = record.text.length - prose.length;
  const prefix = record.text.slice(0, removed);
  return { sectionCode: record.sectionCode, heading: record.heading, removedCharacters: removed,
    pageBoundaryRemoved: prefix.includes('\f'), remainingCharacters: prose.length,
    state: prefix.includes('\f') ? 'FAIL' : 'PASS_HEADING_REMOVAL_BOUNDARY_ONLY' };
});
assert.equal(manuscriptAnswerProse('✦定义\n首段定义必须保留。\n\f\n第二页。', '定义'), '首段定义必须保留。\n\f\n第二页。');
assert.equal(manuscriptAnswerProse('✦未知标题\n首段定义必须保留。\n\f\n第二页。', '其他标题'), '✦未知标题\n首段定义必须保留。\n\f\n第二页。');
assert.equal(manuscriptAnswerProse('✦条件\n\n只有条件成立才适用。', '条件'), '\n只有条件成立才适用。');
assert.equal(manuscriptAnswerProse('🤖算法协调 |\n自动协调的条件\n正文必须保留。', '算法协调 |自动协调的条件'), '正文必须保留。');
assert.equal(manuscriptAnswerProse('◆第一部\n差异 Difference｜形成条件\n正文必须保留。', '差异 Difference｜形成条件'), '正文必须保留。');
assert(results.every(result => !result.pageBoundaryRemoved));
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-I-V3-HEADING-PROSE-BOUNDARY-QA.json', JSON.stringify({
  at: new Date().toISOString(), sourceSha256: corpus.sourceSha256, corpusSha256: corpus.corpusSha256,
  testedRecords: results.length, results, providerCalls: 0,
  scope: 'Header removal only; NOT answer quality, complete PDF fidelity or production admission',
}, null, 2) + '\n');
console.log(`PASS ${results.length} Book I v3 heading-removal boundaries; no page prose removed. Answer QA remains separate.`);
