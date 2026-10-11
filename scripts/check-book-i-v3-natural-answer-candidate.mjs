import fs from 'node:fs';
import {build} from 'esbuild';
import {searchManuscriptCorpus} from '../functions/knowledge-runtime/manuscript-source-runtime.js';
const bundled=await build({entryPoints:['functions/_lib/knowledge-access-api.js'],bundle:true,platform:'node',format:'esm',write:false});
const {deterministicGroundedAnswer}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const corpus=JSON.parse(fs.readFileSync('.tmp/knowledge-manuscripts/book-1-v3/positioned-candidate-r2/retrieval-corpus.json'));
const source={bookCode:'BOOK-1',version:'v3',sourceCode:'BOOK-I-V3-LOCAL-CURRENT-CANDIDATE',sourceSha256:corpus.sourceSha256};
const questions=['差异为什么是世界形成的起点？','信息和差异是什么关系？','一个结构如何维持稳定？','为什么变化不一定意味着结构已经改变？','怎样区分事实和对事实的解释？','承载能力有没有条件和边界？','第一问题究竟要先确认什么？','意识是否等于全部现实？','可以根据模型确定明天战争在哪里发生吗？','这到底是什么？'];
const results=questions.map(question=>{
  const retrieved=searchManuscriptCorpus({corpus,source,query:question});
  const selected=retrieved[0];
  const answer=selected?deterministicGroundedAnswer(question,{allowed:true,sources:[{...selected,text:selected.excerpt,sourceType:'COMPLETED_MANUSCRIPT',bookCode:'BOOK-1'}]},'zh-Hans'):null;
  return {question,selectedChapter:selected?.sectionCode,heading:selected?.heading,sourceVersion:'v3',sourceSha256:corpus.sourceSha256,answer:answer?.text||null,retrieved:retrieved.slice(0,3).map(r=>({sectionCode:r.sectionCode,heading:r.heading})),answerAssessment:'PENDING_SEMANTIC_REVIEW_NOT_CUSTOMER_API_ADMISSION'};
});
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-I-V3-NATURAL-ANSWER-CANDIDATE.json',JSON.stringify({at:new Date().toISOString(),sourceSha256:corpus.sourceSha256,corpusSha256:corpus.corpusSha256,results,providerCalls:0,scope:'Real retrieval/answer-organizer output from local current v3 corpus; not admitted production API or final acceptance',state:'PARTIAL'},null,2)+'\n');
console.log(results.map(r=>({q:r.question,heading:r.heading,answer:r.answer?.slice(0,280)})));
