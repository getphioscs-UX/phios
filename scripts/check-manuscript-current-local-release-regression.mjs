import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const dir='tools/review/free-ask-manuscript-r1/';
const manifest=JSON.parse(fs.readFileSync(dir+'CURRENT-IV-VI-CORPUS-MANIFEST.json'));
const store=new Map(manifest.records.map(r=>[r.r2ObjectKey,fs.readFileSync(r.localPath)]));
let calls=0;globalThis.fetch=()=>{calls++;throw Error('PROVIDER_FORBIDDEN');};
const bundle=await build({entryPoints:['functions/api/customer-contextual-ask.js'],bundle:true,platform:'node',format:'esm',write:false});
const customer=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const env={PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:'false',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'false',ASSETS:{async fetch(req){const p='.'+new URL(req.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}},MANUSCRIPTS:{async get(key){return store.has(key)?{body:store.get(key)}:null;}}};
// Reuse the exact accepted production regression cases, never their answers.
const text=fs.readFileSync('scripts/check-current-manuscript-live-release.mjs','utf8');
const cases=Function('return '+text.match(/const cases=(\[[\s\S]*?\]);/)[1])();
const results=[];
for(const c of cases){const payload={task:'KNOWLEDGE_BASIC',question:c.q,locale:c.locale||'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:'+c.book}],guidedRouting:false,methodGuidanceRequested:false,...c.extra};const r=await customer.onRequestPost({request:new Request('https://local.qa/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),env,data:{}});const b=await r.json(),answer=b.view?.answer?.text||'',citations=(b.view?.basedOn?.sources||[]).filter(s=>s.sectionCode);const pass=r.ok&&b.execution?.providerCalls===0&&(!c.heading||citations.some(s=>s.supportRange))&&(!c.required||c.required.every(t=>answer.includes(t)))&&(!c.closed||citations.length===0)&&(!c.state||b.view?.state===c.state);results.push({id:c.id,pass,answer,citations,state:b.view?.state});}
fs.writeFileSync(dir+'CURRENT-IV-VI-LOCAL-RELEASE-REGRESSION.json',JSON.stringify({at:new Date().toISOString(),environment:'LOCAL_CURRENT_SERVER_RUNTIME_NOT_LIVE',results,passed:results.filter(r=>r.pass).length,total:results.length,providerCalls:calls},null,2)+'\n');
console.log(results.map(r=>({id:r.id,pass:r.pass,state:r.state})));assert.equal(calls,0);assert(results.every(r=>r.pass));
