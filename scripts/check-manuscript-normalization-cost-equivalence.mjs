import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
const path='functions/knowledge-runtime/manuscript-source-runtime.js';
const current=fs.readFileSync(path,'utf8');
const reference=current.replace('prepared?.heading ?? normalized(record.heading)','normalized(record.heading)').replace('prepared?.text ?? normalized(record.text)','normalized(record.text)').replace('compactText.includes(compact(term))','compact(text).includes(compact(term))').replace('item.prepared.dfText.includes(term)','normalized(item.record.text).includes(term)');
const load=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const modules=[await load(reference),await load(current)];
const corpus=JSON.parse(fs.readFileSync('functions/_source-material/books/book-2-registered-reviewed-corpus.json'));
const source={bookCode:'BOOK-2',version:'v1_REGISTERED',sourceCode:'MKS-BOOK-2-V1-ZH-HANS',sourceSha256:corpus.sourceSha256};
const questions=['主观现实是什么？','意识是一个瞬间发生的状态吗？','水星早餐的精准矿物配方是什么？','我看到的世界为何不能代表世界的全部？','意识是否是一种静止不动的存在？'];
const results=[];
for(const question of questions){const runs=[];for(const runtime of modules){const times=[];let output;for(let i=0;i<5;i++){const start=performance.now();output=runtime.searchManuscriptCorpus({corpus,source,query:question});times.push(performance.now()-start);}times.sort((a,b)=>a-b);runs.push({medianMs:times[2],maxMs:times.at(-1),output});}assert.deepEqual(runs[1].output,runs[0].output,question);results.push({question,equivalent:true,referenceMedianMs:runs[0].medianMs,optimizedMedianMs:runs[1].medianMs,referenceMaxMs:runs[0].maxMs,optimizedMaxMs:runs[1].maxMs,resultSections:runs[1].output.map(r=>r.sectionCode)});}
fs.writeFileSync('tools/review/free-ask-manuscript-r1/MANUSCRIPT-NORMALIZATION-COST-EQUIVALENCE.json',JSON.stringify({at:new Date().toISOString(),scope:'Local algorithm normalization strategy, not Cloudflare CPU quota or memory evidence',reference:'Reconstructed previous repeated-normalization strategy; NOT an archived deployed binary',results,providerCalls:0,productionAdmission:false},null,2)+'\n');console.log(results);
