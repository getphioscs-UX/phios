import fs from 'node:fs';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
const dir='tools/review/membership-ask-credit-r1';
await build({entryPoints:['functions/_lib/knowledge-access-api.js','functions/personal-reading/continuity/membership-authority-pack.js'],entryNames:'[name]',bundle:true,platform:'node',format:'esm',outdir:'.tmp/member-offline-trace'});
const api=await import(pathToFileURL(process.cwd()+'/.tmp/member-offline-trace/knowledge-access-api.js'));
const packing=await import(pathToFileURL(process.cwd()+'/.tmp/member-offline-trace/membership-authority-pack.js'));
const registry=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v12-candidate.json'));
const objects=new Map(registry.records.filter(r=>r.localPath&&fs.existsSync(r.localPath)).map(r=>[r.r2ObjectKey,fs.readFileSync(r.localPath)]));
const env={PHIOS_ENVIRONMENT:'local',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'false',MANUSCRIPTS:{async get(key){return objects.has(key)?{body:objects.get(key)}:null;}},ASSETS:{async fetch(request){const path='.'+new URL(request.url).pathname;return fs.existsSync(path)?new Response(fs.readFileSync(path)):new Response('',{status:404});}}};
globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
const plan=JSON.parse(fs.readFileSync(dir+'/EXECUTABLE-REQUESTS-FROZEN.json'));
const questions=plan.requests.filter(r=>r.body?.model==='gpt-5.6-luna').map(r=>({id:r.caseId,q:JSON.parse(r.body.input[1].content).question,role:r.caseId.startsWith('FRESH')?'REGRESSION_AFTER_REPAIR':'HISTORICAL_REGRESSION'}));
if(process.env.TRACE_HELD_OUT==='true')questions.push(...[
 ['HOLD-1','组成要素陆续替换，组织的延续是否等于所有要素从来不变？'],
 ['HOLD-2','一套组织更替内部元素时，要怎样适应扰动而保持运行？'],
 ['HOLD-3','未出故障时的维护，与损坏以后的修理有什么不同？'],
 ['HOLD-4','维护是否只能在设备损坏以后进行？']
].map(([id,q])=>({id,q,role:'UNUSED_OFFLINE_RETRIEVAL_HOLD_OUT_NOT_MODEL_ANSWER_TEST'})));
const rows=[];
for(const item of questions){const scopes=[];for(const bookCode of [null,'BOOK-1','BOOK-3']){
 const query=new URLSearchParams({q:item.q,locale:'zh-Hans',source:'manuscript'});if(bookCode)query.set('bookCode',bookCode);
 const response=await api.handleKnowledgeAccessRequest(new Request('http://localhost/api/knowledge-access?'+query),env);const result=await response.json();
 const records=result.manuscript?.records||[];const pack=await packing.buildMembershipAuthorityPack({question:item.q,locale:'zh-Hans',records});
 scopes.push({bookCode,status:response.status,errors:result.manuscript?.errors,records:records.map(r=>({chapter:r.sectionCode,book:r.bookCode,score:r.score,argument:r.selectedArgumentUnit,explanation:r.explanationUnit,evidence:r.scopeMatch})),pack});
 }rows.push({...item,scopes});}
const output=process.env.TRACE_OUTPUT||'RETRIEVAL-TRACE-BEFORE.json';fs.writeFileSync(dir+'/'+output,JSON.stringify({providerCalls:0,productionRead:false,permissionBypass:false,rows},null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({id:r.id,results:r.scopes.map(s=>({book:s.bookCode,chapters:s.pack.sources.map(x=>x.chapterId),ranked:s.records.map(x=>[x.chapter,Math.round(x.score)])}))}))));
