import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const root='tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/',read=p=>JSON.parse(fs.readFileSync(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const publication=read('tools/review/free-ask-manuscript-r1/CURRENT-ASK-PRESERVED-CONFIG-PUBLICATION.json');
const registry=read(publication.registry);
assert.equal(publication.exitCode,0);assert(publication.configurationUnchanged||publication.configurationComparison?.runtimeChanges?.length===0);
const newPath=root+'LIVE-UNSEEN-QUESTIONS.json';
const newQuestions=[
 {id:'LIVE-NEW-I-RENEWAL',book:'BOOK-1',section:'B1V3-P1-S006',q:'结构的成员一直换，怎样理解它还能持续存在？',must:['运行']},
 {id:'LIVE-NEW-V-UNITY',book:'BOOK-5',section:'B5-S002',q:'一个国家的行政统一能自动消除语言和历史记忆的差别吗？',must:['不会自动抹除','差异']}
];
if(!fs.existsSync(newPath))fs.writeFileSync(newPath,JSON.stringify({at:new Date().toISOString(),role:'FROZEN_BEFORE_FIRST_PRODUCTION_EXECUTION',cases:newQuestions},null,2)+'\n');
assert.deepEqual(read(newPath).cases,newQuestions);
const followupPath=root+'LIVE-FOLLOWUP-UNSEEN-QUESTIONS.json',followup=[
 {id:'LIVE-FRESH-I-DISTURBANCE',book:'BOOK-1',section:'B1V3-P1-S006',q:'结构面对扰动时，什么能力让它仍然能够持续运行？',must:['扰动','组织']},
 {id:'LIVE-FRESH-V-PEACE',book:'BOOK-5',section:'B5-S002',q:'文明很相近的两个国家，为什么仍不能据此保证政治和平？',must:['不意味着政治和平']}
];
if(process.argv.includes('--followup')){if(!fs.existsSync(followupPath))fs.writeFileSync(followupPath,JSON.stringify({at:new Date().toISOString(),role:'FROZEN_BEFORE_FIRST_PRODUCTION_EXECUTION',cases:followup},null,2)+'\n');assert.deepEqual(read(followupPath).cases,followup);}
const cases=[...read(root+'DEVELOPMENT-QUESTIONS.json').cases.filter(q=>q.book!=='BOOK-3').map(q=>({...q,role:'REGRESSION'})),...newQuestions.map(q=>({...q,role:'NEW_PRODUCTION_QUESTION'})),
 {id:'LIVE-UNADMITTED',book:'BOOK-1',q:'差异为什么是世界开始的唯一条件？',state:'SOURCE_INSUFFICIENT'},
 {id:'LIVE-PREDICTION',book:'BOOK-5',q:'第五册保证明天哪个国家会发生战争？',state:'SOURCE_LIMIT',must:['不能支持','确定预测'],originalOracle:'Expected zero references; initial failure retained. A boundary answer may identify the rejected source without making a prediction.'},
 {id:'LIVE-ENGLISH',book:'BOOK-5',q:'How is civilization different from a state?',locale:'en',state:'SOURCE_INSUFFICIENT'},
 {id:'LIVE-CLIENT-EXPANSION',book:'BOOK-1',q:'差异为什么是世界开始的唯一条件？',state:'SOURCE_INSUFFICIENT',extra:{qa:true,allowAllChapters:true,PHIOS_MANUSCRIPT_DERIVATIVE_QA:true}}
];
if(process.argv.includes('--followup'))cases.push(...followup.map(q=>({...q,role:'NEW_PRODUCTION_QUESTION_AFTER_FAILURE_FIX'})));
const outputPath=root+'LIVE-ANSWERS.json',hadOutput=fs.existsSync(outputPath);if(hadOutput){const old=fs.readFileSync(outputPath);fs.writeFileSync(root+'LIVE-ANSWERS-HISTORY-'+sha(old).slice(0,16)+'.json',old);}
const results=[];
for(const c of cases){
 const response=await fetch('https://getphios.com/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json','cache-control':'no-cache'},body:JSON.stringify({task:'KNOWLEDGE_BASIC',question:c.q,locale:c.locale||'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:'+c.book}],guidedRouting:false,...c.extra})});
 const actual=await response.json(),answer=actual.view?.answer?.text||'',refs=actual.view?.basedOn?.sources?.filter(s=>s.sectionCode)||[],source=registry.records.find(s=>s.bookCode===c.book),compact=answer.normalize('NFKC').replace(/\s+/gu,'');
 const pass=response.ok&&actual.execution?.providerCalls===0&&(!c.section||refs.some(r=>r.sectionCode===c.section&&r.sourceSha256===source.sourceSha256))&&(!c.state||actual.view?.state===c.state)&&(c.must||[]).every(s=>compact.includes(s))&&(c.mustAny||[]).every(g=>g.some(s=>compact.includes(s)))&&(!c.noNativeAnswer||refs.length===0);
 results.push({...c,role:hadOutput&&c.role==='NEW_PRODUCTION_QUESTION'?'REGRESSION_OF_PRESERVED_FIRST_PRODUCTION_QUESTION':c.role,status:response.status,pass,error:actual.error||null,actualAnswer:answer,state:actual.view?.state,sourceReferences:refs,execution:actual.execution,semanticReview:'PENDING_ACTUAL_OUTPUT_REVIEW'});
}
fs.writeFileSync(outputPath,JSON.stringify({at:new Date().toISOString(),deploymentId:publication.deploymentId,workerSha256:publication.build.workerSha256,registrySha256:publication.registrySha256,questionSetSha256:sha(fs.readFileSync(newPath)),results,total:results.length,passed:results.filter(r=>r.pass).length,providerCalls:results.reduce((n,r)=>n+(r.execution?.providerCalls||0),0),firstExecution:!hadOutput},null,2)+'\n');
console.log(JSON.stringify(results.map(r=>({id:r.id,pass:r.pass,state:r.state,answer:r.actualAnswer.slice(0,260),refs:r.sourceReferences.map(s=>({section:s.sectionCode,version:s.sourceVersion,sha:s.sourceSha256,pages:s.pageRange}))})),null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
