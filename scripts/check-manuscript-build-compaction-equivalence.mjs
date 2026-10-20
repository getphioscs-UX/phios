import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {build, transformSync, version} from 'esbuild';
import {pagesWorkerCompactionOptions} from './lib/pages-worker-compaction.mjs';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const output='tools/review/free-ask-manuscript-r1/';
const compiled=await build({entryPoints:['functions/api/customer-contextual-ask.js'],bundle:true,platform:'node',format:'esm',write:false});
const before=compiled.outputFiles[0].text;
const after=transformSync(before,pagesWorkerCompactionOptions).code;
const load=text=>import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const modules=[await load(before),await load(after)];
const manifest=JSON.parse(fs.readFileSync(output+'CURRENT-IV-VI-CORPUS-MANIFEST.json'));
const store=new Map(manifest.records.map(r=>[r.r2ObjectKey,fs.readFileSync(r.localPath)]));
const source=fs.readFileSync('scripts/check-current-manuscript-live-release.mjs','utf8');
const cases=Function('return '+source.match(/const cases=(\[[\s\S]*?\]);/)[1])();
const env={PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:'false',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'false',ASSETS:{async fetch(req){const p='.'+new URL(req.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}},MANUSCRIPTS:{async get(key){return store.has(key)?{body:store.get(key)}:null;}}};
let calls=0;globalThis.fetch=()=>{calls++;throw Error('PROVIDER_FORBIDDEN');};
const results=[];
for(const c of cases){
  const responses=[];
  for(const runtime of modules){
    const payload={task:'KNOWLEDGE_BASIC',question:c.q,locale:c.locale||'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:'+c.book}],guidedRouting:false,methodGuidanceRequested:false,...c.extra};
    const response=await runtime.onRequestPost({request:new Request('https://local.qa/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),env,data:{}});
    const body=await response.json();
    responses.push({status:response.status,state:body.view?.state,answer:body.view?.answer?.text,sources:body.view?.basedOn?.sources,execution:body.execution});
  }
  assert.deepEqual(responses[1],responses[0],c.id);
  results.push({id:c.id,equivalent:true,state:responses[0].state,responseDigest:sha(JSON.stringify(responses[0]))});
}
assert.equal(calls,0);
fs.writeFileSync(output+'MANUSCRIPT-BUILD-COMPACTION-EQUIVALENCE-current.json',JSON.stringify({at:new Date().toISOString(),tool:'esbuild',version,options:pagesWorkerCompactionOptions,beforeSha256:sha(before),afterSha256:sha(after),beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),scope:'Actual customer Ask consumer bundle; not every Worker route',results,providerCalls:calls},null,2)+'\n');
console.log(`PASS esbuild deployment compaction equivalence: ${results.length} actual customer Ask paths; providerCalls=0.`);
