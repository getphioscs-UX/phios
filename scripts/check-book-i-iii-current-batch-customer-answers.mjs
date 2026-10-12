import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {build} from 'esbuild';
const root='tools/review/free-ask-manuscript-r1/',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const productionMetadata=process.argv.includes('--production-metadata');
const registry=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-'+(process.argv.includes('--bounded-explanation')?'v12-candidate.json':process.argv.includes('--release-baseline')?'v10.json':process.argv.includes('--whole-batch')?'v9-candidate.json':productionMetadata?'v7.json':'v7-candidate.json')));
if(process.argv.includes('--third-current')){
 const thirdCandidate=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v6-candidate.json')).records.find(r=>r.bookCode==='BOOK-3');
 registry.records[registry.records.findIndex(r=>r.bookCode==='BOOK-3')]=thirdCandidate;
}
const original=JSON.parse(fs.readFileSync('functions/knowledge-runtime/current-manuscript-server-metadata.js','utf8').match(/export const manuscriptMetadataRaw = ([\s\S]*);\s*$/)[1]);
const raw=productionMetadata?{...original}:{...original,ACTIVE_MANUSCRIPT_SOURCE_REGISTRY:'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json','content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json':JSON.stringify(registry)};
if(!productionMetadata)for(const source of registry.records)for(const key of ['sourceAcceptancePath','acceptancePath','scopeAdmissionPath'])if(source[key])raw[source[key]]=fs.readFileSync(source[key],'utf8');
const compiled=await build({entryPoints:['functions/api/customer-contextual-ask.js','functions/_lib/knowledge-access-api.js'],bundle:true,platform:'node',format:'esm',outdir:'.tmp/current-book-batch-qa',write:false,plugins:[{name:'candidate-metadata',setup(b){b.onLoad({filter:/current-manuscript-server-metadata\.js$/},()=>({contents:'export const manuscriptMetadataRaw = '+JSON.stringify(raw)+';',loader:'js'}));}}]});
const load=async n=>import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles.find(f=>f.path.endsWith(n+'.js')).text).toString('base64'));
const customer=await load('customer-contextual-ask'),knowledge=await load('knowledge-access-api');
const files=new Map();
const first=JSON.parse(fs.readFileSync(root+'BOOK-I-V3-INCREMENTAL-PRIVATE-RECEIPT.json'));files.set(first.objectKey,fs.readFileSync(JSON.parse(fs.readFileSync(root+'BOOK-I-V3-INCREMENTAL-CORPUS.json')).corpusPath));
const third=JSON.parse(fs.readFileSync(root+'BOOK-III-CURRENT-PRIVATE-CANDIDATE-RECEIPT.json'));files.set(third.objectKey,fs.readFileSync(JSON.parse(fs.readFileSync(root+'BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json')).corpusPath));
if(process.argv.includes('--release-baseline')){const legacy=registry.records.find(r=>r.bookCode==='BOOK-3');files.set(legacy.r2ObjectKey,fs.readFileSync('.tmp/free-ask-manuscripts/books/book-3/materialized/v1/reviewed/retrieval-corpus.json'));}
let providerCalls=0;globalThis.fetch=()=>{providerCalls++;throw Error('ZERO_PROVIDER_BOUNDARY');};
const env={PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'true',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'false',PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:'false',PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',MANUSCRIPTS:{async get(k){return files.has(k)?{body:files.get(k)}:null;}},ASSETS:{async fetch(req){const p='.'+new URL(req.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}}};
const cases=[
 {id:'I-SALE',q:'第八册还会公开出售吗？',section:'B1V3-P0-S001',must:['不作为独立公开出版物出售']},
 {id:'I-REASON',q:'第八册为什么不对外销售？',section:'B1V3-P0-S001',must:['没有明确说明','不作为独立公开出版物出售']},
 {id:'I-NOT-DELETED',q:'第八册不卖了是否表示它已经不存在？',section:'B1V3-P0-S001',must:['私有导航','不作为独立公开出版物出售']},
 {id:'I-WATER',q:'既然水还在流动，为什么容器里的形态还能保持？',section:'B1V3-P1-S003',must:['流动开始被限制','稳定关系','不是静止物体']},
 {id:'I-CAPACITY',q:'资源充足是不是就代表承载能力没有上限？',section:'B1V3-P4-S032',must:['能量充足并不意味着','都是有限的','时间始终有限']},
 {id:'I-UNKNOWN',q:'火星玻璃鲸的确切寿命是多少年？',state:'SOURCE_INSUFFICIENT'},
 {id:'I-OUTSIDE',q:'载体尺度整合如何形成共同运行？',state:'SOURCE_INSUFFICIENT'},
 {id:'I-CLIENT-QA-EXPANSION',q:'载体尺度整合如何形成共同运行？',state:'SOURCE_INSUFFICIENT',extra:{qa:true,scope:'ALL',PHIOS_MANUSCRIPT_DERIVATIVE_QA:true,PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:true}},
 {id:'I-UNVERIFIED-FIGURE',q:'请解释第一册第56页图中的所有箭头',state:'SOURCE_INSUFFICIENT'},
 {id:'I-EN-BOUNDARY',q:'Why is Volume Eight not sold?',locale:'en',state:'SOURCE_INSUFFICIENT'},
 ...[['MAINTENANCE','维持出现','为什么运行形成以后仍然需要维护？'],['RESIDUAL','残余负荷','已经结束的事情为什么还会消耗当前容量？'],['CAPACITY','维持容量','为什么维持容量不是一个固定能力值？'],['COORDINATION','共享资源','共同使用资源会怎样改变运行？'],['CONTINUITY','可持续连续','还在运行就能证明可持续吗？'],['SATURATION','运行饱和','运行饱和与完全停止有什么区别？']].map(([id,heading,q])=>({id:'III-'+id,q,book:'BOOK-3',heading})),
];
const fresh=process.argv.includes('--fresh');
if(fresh)cases.splice(0,cases.length,
 {id:'F-I-SALE',q:'我能购买第八册这本公开出版物吗？',section:'B1V3-P0-S001',must:['不作为独立公开出版物出售']},
 {id:'F-I-REASON',q:'不公开出售第八册的原因是什么？',section:'B1V3-P0-S001',must:['没有明确说明','私有导航']},
 {id:'F-I-WATER',q:'虽然水仍然流动，容器为什么还能留下稳定形态？',section:'B1V3-P1-S003',must:['限制','稳定关系']},
 {id:'F-I-CAPACITY',q:'能量充足是否就能同时处理无限的现实？',section:'B1V3-P4-S032',must:['能量充足并不意味着','有限']},
 {id:'F-I-UNSUPPORTED',q:'第一册证明我的考试必定成功吗？',state:'SOURCE_LIMIT'},
 {id:'F-III-CAPACITY',book:'BOOK-3',q:'维持容量为何随着当前资源与恢复条件改变？',heading:'维持容量'},
 {id:'F-III-MAINTENANCE',book:'BOOK-3',q:'为什么不能靠最初形成的结构永远维持运行？',heading:'维持出现',must:['持续本身具有成本','修改下一次运行的起点']},
 );
const results=[];
if(process.argv.includes('--third-holdout'))cases.splice(0,cases.length,
 {id:'H-III-MAINTENANCE-COST',book:'BOOK-3',q:'为什么长期运行本身会产生维护需求，而不是坏了才需要维护？',heading:'维持出现',must:['持续本身具有成本','维护并不是因为运行失败才出现']},
 {id:'H-III-CAPACITY-CURRENT',book:'BOOK-3',q:'维持容量是否取决于现在的恢复和环境，不能只看过去的最好表现？',heading:'维持容量',must:['当前这一刻','恢复与环境']},
 {id:'H-III-PREDICTION',book:'BOOK-3',q:'第三册能确定预测明天战争一定发生在哪里吗？',state:'SOURCE_LIMIT'}
);
const unseen=process.argv.includes('--unseen');
const finalHoldout=process.argv.includes('--final-holdout');
if(unseen)cases.splice(0,cases.length,
 {id:'U-I-SALE',q:'《世界将如何继续》现在是公开卖的书吗？',section:'B1V3-P0-S001',must:['不作为独立公开出版物出售']},
 {id:'U-I-REASON',q:'第八册不公开出售的原因，原稿有明确解释吗？',section:'B1V3-P0-S001',must:['没有明确说明']},
 {id:'U-I-WATER',q:'水仍然流动时，容器如何使形态稳定下来？',section:'B1V3-P1-S003',must:['流动开始被限制','稳定关系']},
 {id:'U-I-CAPACITY',q:'在能量充足的条件下，注意和时间还会限制承载能力吗？',section:'B1V3-P4-S032',must:['有限','时间']},
 {id:'U-I-NO-SOURCE',q:'第一册如何证明木星冰雕能延年益寿？',state:'SOURCE_INSUFFICIENT'},
 );
if(finalHoldout)cases.splice(0,cases.length,
 {id:'H-I-STATUS',q:'第八册停止出售，是否仍然是平台的导航运行层？',section:'B1V3-P0-S001',must:['私有导航','不作为独立公开出版物出售']},
 {id:'H-I-SHAPE',q:'即使水正在流动，形态为什么仍能在容器中持续？',section:'B1V3-P1-S003',must:['稳定关系','不是静止物体']},
 {id:'H-I-LIMIT',q:'承载能力是不是只需要能量充足就能不受限制？',section:'B1V3-P4-S032',must:['能量充足并不意味着','有限']},
 );
for(const test of cases.filter(test=>(!process.argv.includes('--book-i-only')||!test.book)&&(!process.argv.includes('--book-iii-only')||test.book==='BOOK-3'))){
 const book=test.book||'BOOK-1',locale=test.locale||'zh-Hans';
 const url=new URL('https://isolated.qa/api/knowledge-access');url.search=new URLSearchParams({q:test.q,bookCode:book,source:'manuscript',locale});
 const retrieval=await(await knowledge.handleKnowledgeAccessRequest(new Request(url),env)).json();
 const response=await customer.onRequestPost({request:new Request('https://isolated.qa/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:'KNOWLEDGE_BASIC',question:test.q,locale,contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:'+book}],guidedRouting:false,methodGuidanceRequested:false,...test.extra})}),env,data:{}});
 const body=await response.json(),answer=body.view?.answer?.text||'',top=retrieval.manuscript?.records?.[0],compact=answer.normalize('NFKC').replace(/\s+/gu,'');
 const source=registry.records.find(r=>r.bookCode===book);
 const pass=(!test.section||top?.sectionCode===test.section)&&(!test.heading||top?.heading.includes(test.heading))&&(!test.must||test.must.every(t=>compact.includes(t)))&&(!test.state||body.view?.state===test.state)&&(!top||top.sourceBinaryDigest===source.sourceSha256)&&body.execution?.providerCalls===0;
 results.push({...test,pass,retrieval:top||null,actualAnswer:answer,customerState:body.view?.state,sourceReferences:body.view?.basedOn?.sources,providerCalls:body.execution?.providerCalls});
}
assert.equal(providerCalls,0);
const path=root+(process.argv.includes('--release-baseline')?'BOOK-III-RESTORED-BASELINE-SOURCE-REGRESSION.json':process.argv.includes('--third-holdout')?'BOOK-III-CURRENT-BATCH-INDEPENDENT-ANSWERS.json':process.argv.includes('--book-iii-only')?'BOOK-III-CURRENT-BATCH-ANSWER-REGRESSION.json':productionMetadata?'BOOK-I-CURRENT-PRODUCTION-METADATA-QA.json':finalHoldout?'BOOK-I-CURRENT-BATCH-FINAL-HOLDOUT.json':unseen?'BOOK-I-CURRENT-BATCH-UNSEEN-ANSWERS.json':fresh?'BOOK-I-III-CURRENT-BATCH-FRESH-ANSWERS.json':'BOOK-I-III-CURRENT-BATCH-REGRESSION.json');
if(fs.existsSync(path)){const previous=JSON.parse(fs.readFileSync(path));if(previous.results.some(r=>!r.pass)&&!fs.existsSync(path.replace('.json','-INITIAL-FAILURES.json')))fs.copyFileSync(path,path.replace('.json','-INITIAL-FAILURES.json'));}
const initialFailureExists=fs.existsSync(path.replace('.json','-INITIAL-FAILURES.json'));
fs.writeFileSync(path,JSON.stringify({at:new Date().toISOString(),candidateRegistrySha256:sha(JSON.stringify(registry)),testRole:initialFailureExists?'REGRESSION_AFTER_RETAINED_INITIAL_FAILURE':finalHoldout||unseen?'UNSEEN_FIRST_RUN':fresh?'NEW_QUESTIONS_FIRST_RUN_OR_REGRESSION_AFTER_INITIAL_FAILURE':'REGRESSION',productionEquivalentFlags:true,providerCalls,cases:results.length,passed:results.filter(r=>r.pass).length,wholeChapterCompletion:false,results},null,2)+'\n');
console.log(results.map(r=>({id:r.id,pass:r.pass,heading:r.retrieval?.heading,state:r.customerState,answer:r.actualAnswer.slice(0,230)})));if(results.some(r=>!r.pass))process.exitCode=1;
