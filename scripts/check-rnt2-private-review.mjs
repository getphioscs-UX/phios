import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {runBaZiS04PrivateReview} from '../functions/personal-reading/narrative/bazi-s04-private-review.js';
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const registry=JSON.parse(fs.readFileSync('content/ai-economics/providers/ai-provider-cost-registry-v1.json','utf8'));
function storage(){
 const objects=new Map(),reservations=new Set();
 return {objects,reservations,PRIVATE_REPORTS:{get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k))}:null,put:async(k,v,options)=>{assert.equal(options.onlyIf.get('If-None-Match'),'*');if(objects.has(k))return null;objects.set(k,v);return {key:k};}},RUNTIME_DB:{prepare(sql){return {bind(...args){return {async run(){if(sql.startsWith('INSERT OR IGNORE INTO runtime_artifacts')){if(reservations.has(args[0]))return {meta:{changes:0}};reservations.add(args[0]);}return {meta:{changes:1}};}};}}}}};
}
const store=storage(),body={action:'rnt2-s04',locale:'en',sectionKey:'S04_CAREER'};
const env={...store,PHIOS_ENVIRONMENT:'qa',BAZI_T3_PREVIEW_SHADOW:'enabled',RNT2_S04_REVIEW:'enabled',RNT2_REVIEWER_IDS:'reviewer',OPENAI_API_KEY:'TEST_ONLY_NEVER_SENT'};
let calls=0;
const compose=async()=>{calls++;return {status:'FALLBACK',candidate:null,internalOnly:{providerExecution:'INJECTED_TEST'}};};
const base={env,body,userId:'reviewer',source,registry,compose};
assert.equal((await runBaZiS04PrivateReview({...base,env:{...env,RNT2_S04_REVIEW:''}})).status,409);
assert.equal((await runBaZiS04PrivateReview({...base,userId:'customer'})).status,403);
assert.equal((await runBaZiS04PrivateReview({...base,body:{...body,sectionKey:'S05_WEALTH'}})).status,400);
assert.equal((await runBaZiS04PrivateReview({...base,env:{...env,OPENAI_API_KEY:''}})).status,503);
assert.equal(store.reservations.size,0);
const pair=await Promise.all([runBaZiS04PrivateReview(base),runBaZiS04PrivateReview(base)]);
assert.deepEqual(pair.map(x=>x.status).sort(),[200,409]);assert.equal(calls,1);
const first=pair.find(x=>x.status===200);
assert.equal(first.body.result.productionActivated,false);assert.equal(first.body.result.ownerAcceptance,'PENDING');
const reopened=await runBaZiS04PrivateReview({...base,env:{...env,OPENAI_API_KEY:''}});
assert.equal(reopened.body.cacheHit,true);assert.deepEqual(reopened.body.result,first.body.result);assert.equal(calls,1);
const key=first.body.objectKey,original=store.objects.get(key),tampered=JSON.parse(original);
tampered.result.status='PASS';store.objects.set(key,JSON.stringify(tampered));
assert.equal((await runBaZiS04PrivateReview(base)).body.code,'S04_SNAPSHOT_INTEGRITY_FAILED');assert.equal(calls,1);
store.objects.delete(key);assert.equal((await runBaZiS04PrivateReview(base)).status,409);assert.equal(calls,1);
const failing=storage(),failed={...base,env:{...env,...failing},compose:async()=>{throw Error('TEST');}};
await assert.rejects(runBaZiS04PrivateReview(failed));
assert.equal((await runBaZiS04PrivateReview(failed)).status,409,'interrupted run cannot spend twice');

// Bundle in memory: regression checks must not leave another generated artifact tree.
const compiled=await build({entryPoints:['functions/api/qa-bazi-t3.js'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const identity={verified:true,authenticated:true,userId:'reviewer',providerId:'TEST'};
async function request({input=body,overrides={},origin='https://qa.phios-github.pages.dev',url='https://qa.phios-github.pages.dev/api/qa-bazi-t3',account=identity}={}){
 return onRequest({request:new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)}),env:{...env,OPENAI_API_KEY:'',...overrides},data:{symbolicAccountIdentity:account}});
}
assert.equal((await request({account:null})).status,401);
assert.equal((await request({url:'https://phios-github.pages.dev/api/qa-bazi-t3'})).status,404);
assert.notEqual((await request({origin:'https://evil.example'})).status,200);
assert.equal((await request({input:{...body,prompt:'override'}})).status,400);
assert.equal((await request({input:{...body,profileId:'x'.repeat(300)}})).status,413);
assert.equal((await request({overrides:{RNT2_REVIEWER_IDS:''}})).status,403);
assert.equal((await request({overrides:{RNT2_S04_REVIEW:''}})).status,409);
// This bypasses the retired T3 experiment gate, but cannot spend without a secret.
const missing=await request({overrides:{...storage()}});
assert.equal((await missing.json()).code,'PROVIDER_CREDENTIAL_NOT_CONFIGURED');
console.log('PASS: S04 QA auth/CSRF/input gates, reviewer allowlist, persistent reservation, immutable digest-bound reopen, tamper rejection; no live provider call or generated files.');
