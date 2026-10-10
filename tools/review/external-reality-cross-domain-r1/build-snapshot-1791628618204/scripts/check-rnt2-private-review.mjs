import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {runBaZiS04PrivateReview,inspectBaZiS04Provider} from '../functions/personal-reading/narrative/bazi-s04-private-review.js';
import {auditFrozenCareerCandidate} from '../functions/personal-reading/narrative/bazi-s04-review-audit.js';
import {prepareBaZiS04T2} from '../functions/personal-reading/narrative/bazi-s04-t2-runtime.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {SEMANTIC_REVIEW_CHECKS} from '../functions/personal-reading/narrative/report-section-semantic-review.js';
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
let probes=0;
const probe=await inspectBaZiS04Provider({...base,fetcher:async(url,options)=>{probes++;assert(url.startsWith('https://api.openai.com/v1/models/'));assert.equal(options.body,undefined);return Response.json({error:{code:'model_not_found',type:'invalid_request_error',message:'synthetic-secret'}},{status:404});}});
assert.equal(probe.body.providerErrorCode,'model_not_found');assert.equal(probe.body.generationCalled,false);assert(!JSON.stringify(probe).includes('synthetic-secret'));assert.equal(probes,1);
assert.equal((await inspectBaZiS04Provider({...base,userId:'other',fetcher:()=>{throw Error('Unauthorized probe')}})).status,403);
const unreadable=await inspectBaZiS04Provider({...base,fetcher:async(url,options)=>{assert.equal(options.redirect,'manual');return new Response('not json',{status:502});}});
assert.equal(unreadable.body.providerStatus,502);assert.equal(unreadable.body.code,'PROVIDER_PROBE_UNREADABLE_RESPONSE');
assert.equal((await runBaZiS04PrivateReview({...base,env:{...env,RNT2_S04_REVIEW:''}})).status,409);
assert.equal((await runBaZiS04PrivateReview({...base,userId:'customer'})).status,403);
assert.equal((await runBaZiS04PrivateReview({...base,body:{...body,sectionKey:'S05_WEALTH'}})).status,400);
assert.equal((await runBaZiS04PrivateReview({...base,body:{...body,profileId:'BAZI-FP-W17-001'}})).body.code,'V4_BASELINE_ONLY');
assert.equal((await runBaZiS04PrivateReview({...base,env:{...env,OPENAI_API_KEY:''}})).status,503);
assert.equal(store.reservations.size,0);
assert.equal((await runBaZiS04PrivateReview({...base,body:{...body,action:'rnt2-s04-reverify'}})).body.code,'CSD_FROZEN_CANDIDATE_REQUIRED');
assert.equal(store.reservations.size,0,'Review action cannot create a generation reservation');
// Hold the first composer open so the second request tests an in-flight
// reservation, rather than legitimately reopening an already saved snapshot.
let releaseComposer,composerStarted;
const composerGate=new Promise(resolve=>{releaseComposer=resolve;});
const composerEntered=new Promise(resolve=>{composerStarted=resolve;});
const pending=runBaZiS04PrivateReview({...base,compose:async()=>{composerStarted();await composerGate;return compose();}});
await composerEntered;
const concurrent=await runBaZiS04PrivateReview(base);
releaseComposer();
const pair=[await pending,concurrent];
assert.deepEqual(pair.map(x=>x.status).sort(),[200,409]);assert.equal(calls,1);
const first=pair.find(x=>x.status===200);
assert.equal(first.body.result.productionActivated,false);assert.equal(first.body.result.ownerAcceptance,'PENDING');
const reopened=await runBaZiS04PrivateReview({...base,env:{...env,OPENAI_API_KEY:''}});
assert.equal(reopened.body.cacheHit,true);assert.deepEqual(reopened.body.result,first.body.result);assert.equal(calls,1);
assert(first.body.objectKey.startsWith('qa/rnt2/csd-v4/s04/'));
assert.equal(calls,1);
const key=first.body.objectKey,original=store.objects.get(key),tampered=JSON.parse(original);
tampered.result.status='PASS';store.objects.set(key,JSON.stringify(tampered));
assert.equal((await runBaZiS04PrivateReview(base)).body.code,'S04_SNAPSHOT_INTEGRITY_FAILED');assert.equal(calls,1);
store.objects.delete(key);assert.equal((await runBaZiS04PrivateReview(base)).status,409);assert.equal(calls,1);
const failing=storage(),failed={...base,env:{...env,...failing},compose:async()=>{throw Error('TEST');}};
await assert.rejects(runBaZiS04PrivateReview(failed));
assert.equal((await runBaZiS04PrivateReview(failed)).status,409,'interrupted run cannot spend twice');

const prepared=await prepareBaZiS04T2({...source,locale:'en',successor:true});
const frozenCandidate={sourceBriefDigest:prepared.brief.briefSemanticDigest,blocks:[]};
const prior={...Object.fromEntries(SEMANTIC_REVIEW_CHECKS.map(k=>[k,true])),candidateDigest:await sha256Stable(frozenCandidate),sourceBriefDigest:prepared.brief.briefSemanticDigest,meaningfullyUsedClaimRefs:[],reasons:[],editorialAssessments:[]};
const frozen={artifactDigest:'TEST_SOURCE_DIGEST',identity:{locale:'en'},result:{brief:prepared.brief,candidate:frozenCandidate,verification:{semanticReview:prior},internalOnly:{model:'gpt-5.6-luna',providerExecution:'INJECTED_TEST',actualTier:'DETERMINISTIC_FALLBACK'}}};
const auditStorage=storage(),auditInput={record:frozen,key:'qa/rnt2/csd-v2/s04/test.json',env:{...env,...auditStorage},registry,adapter:()=>{throw Error('Reused review must not call model')}};
const audit=await auditFrozenCareerCandidate(auditInput);assert.equal(audit.status,200);assert.equal(audit.body.result.result.reviewAudit.generationCalls,0);assert.equal(audit.body.result.result.reviewAudit.reviewCalls,0);assert.equal(audit.body.result.result.status,'FALLBACK','Malformed prose cannot pass through reuse');
assert.equal((await auditFrozenCareerCandidate(auditInput)).body.cacheHit,true);
assert.equal(auditStorage.reservations.size,1);assert.equal(auditStorage.objects.size,1);

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
for(const sectionKey of ['S02_PERSONALITY','S03_LIFE_STRUCTURE']){
 const response=await request({input:{action:'rnt2-'+sectionKey.slice(0,3).toLowerCase(),sectionKey,locale:'en'},overrides:{...storage()}});
 assert.equal((await response.json()).code,'PROVIDER_CREDENTIAL_NOT_CONFIGURED','Reconciled section must reach the private T2 lane, not the legacy T3 stage gate');
}
console.log('PASS: S04 QA auth/CSRF/input gates, reviewer allowlist, persistent reservation, immutable digest-bound reopen, tamper rejection; no live provider call or generated files.');
