import fs from 'node:fs';import assert from 'node:assert/strict';import {build}from'esbuild';
const dir='tools/review/free-ask-manuscript-r1/',bytes=fs.readFileSync('functions/_source-material/books/book-2-registered-reviewed-corpus.json');
const developmentCases=[
{id:'II-DEFINITION',q:'主观现实是什么？',terms:['现实']},
{id:'II-MECHANISM',q:'为什么意识会误把自己的现实当成全部现实？',terms:['模型','现实']},
{id:'II-CONDITION',q:'意识是一个瞬间发生的状态吗？',terms:['持续']},
{id:'II-NO-SOURCE',q:'水星早餐的精准矿物配方是什么？',closed:true},
{id:'II-FALSE-PREDICT',q:'保证明天任何人都会快乐可以吗？',state:'SOURCE_LIMIT',terms:['不能支持']}
];const heldout=false,fresh=process.argv.includes('--fresh'),independent=process.argv.includes('--independent');
const freshCases=[
{id:'II-FRESH-TEMPORAL',q:'意识能像一件东西那样固定不变吗？',heading:'Continuous Conscious Process | 为什么意识是一',terms:['持续','过程']},
{id:'II-FRESH-SUBJECTIVE',q:'同一件事为什么不同的人会有不同的感受？',heading:'Subjective Reality |',terms:['不同']},
{id:'II-FRESH-ILLUSION',q:'我看到的世界为何不能代表世界的全部？',heading:'Conscious Illusion |',terms:['现实']},
{id:'II-FRESH-UNSUPPORTED',q:'怎样测量月球精灵对我的意识的影响？',state:'SOURCE_INSUFFICIENT'},
{id:'II-FRESH-PREDICTION',q:'确定下周所有人的意识会发生什么变化？',state:'SOURCE_LIMIT'},
];
const independentCases=[
{id:'II-INDEPENDENT-CONTINUITY',q:'意识是否是一种静止不动的存在？',heading:'Continuous Conscious Process | 为什么意识是一',terms:['持续','过程']},
{id:'II-INDEPENDENT-COMPLETENESS',q:'我感受到的现实就代表完整世界吗？',heading:'Conscious Illusion |',terms:['现实']},
{id:'II-INDEPENDENT-BOUNDARY',q:'保证未来三个月每个人都想同样的事情，可以吗？',state:'SOURCE_LIMIT'},
{id:'II-INDEPENDENT-ENGLISH',q:'Is consciousness a fixed object?',locale:'en',state:'SOURCE_INSUFFICIENT'},
];
const cases=independent?independentCases:fresh?freshCases:developmentCases;
let calls=0;globalThis.fetch=()=>{calls++;throw Error('PROVIDER_FORBIDDEN');};const b=await build({entryPoints:['functions/api/customer-contextual-ask.js','functions/_lib/knowledge-access-api.js'],bundle:true,platform:'node',format:'esm',outdir:'.tmp/book3-customer-qa',write:false});const load=name=>import('data:text/javascript;base64,'+Buffer.from(b.outputFiles.find(p=>p.path.endsWith(name+'.js')).text).toString('base64'));const customer=await load('customer-contextual-ask'),knowledge=await load('knowledge-access-api');const env={PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:'false',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'false',ASSETS:{async fetch(req){const p='.'+new URL(req.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}},MANUSCRIPTS:{async get(key){return key==='books/book-2/materialized/v1/reviewed/retrieval-corpus.json'?{body:bytes}:null;}}};const results=[];
for(const c of cases){const u=new URL('https://local.qa/api/knowledge-access');u.search=new URLSearchParams({q:c.q,bookCode:'BOOK-2',source:'manuscript',locale:c.locale||'zh-Hans'});const k=await(await knowledge.handleKnowledgeAccessRequest(new Request(u),env)).json();const r=await customer.onRequestPost({request:new Request('https://local.qa/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:'KNOWLEDGE_BASIC',question:c.q,locale:c.locale||'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-2'}],guidedRouting:false,methodGuidanceRequested:false})}),env,data:{}});const body=await r.json(),answer=body.view?.answer?.text||'',top=k.manuscript.records[0];const pass=body.execution?.providerCalls===0&&(!c.heading||top?.heading===c.heading)&&(!c.terms||c.terms.every(t=>answer.includes(t)))&&(!c.forbid||c.forbid.every(t=>!answer.includes(t)))&&(!c.closed||!k.groundedAnswer)&&(!c.state||body.view?.state===c.state);results.push({...c,retrievalHeading:top?.heading,pass,answer,state:body.view?.state,citations:body.view?.basedOn?.sources,assessment:k.answerAssessment,execution:body.execution});}
const result={at:new Date().toISOString(),sourceSha256:'1ae413dbfddae604f65af3e9b16a28a923899e3ebe8f419d9b7f3ff10bfa41fe',results,passed:results.filter(r=>r.pass).length,total:results.length,providerCalls:calls};const file=dir+(independent?'BOOK-II-INDEPENDENT-ANSWERS.json':fresh?'BOOK-II-FRESH-ANSWERS.json':heldout?'BOOK-II-HELDOUT-ANSWERS.json':'BOOK-II-CUSTOMER-ANSWERS.json');if(results.some(r=>!r.pass)&&!fs.existsSync(dir+'BOOK-II-INITIAL-ANSWER-FAILURES.json'))fs.writeFileSync(dir+'BOOK-II-INITIAL-ANSWER-FAILURES.json',JSON.stringify(result,null,2));fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');console.log(results.map(r=>({id:r.id,pass:r.pass,heading:r.retrievalHeading,state:r.state,answer:r.answer.slice(0,180)})));assert.equal(calls,0);if(results.some(r=>!r.pass))process.exitCode=1;
