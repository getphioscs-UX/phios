import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import {build} from 'esbuild';
const bundled=await build({entryPoints:['functions/customer-projection/canonical-navigation-handoff.js'],bundle:true,platform:'node',format:'esm',write:false});
const m=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('db/migrations/0012_report_context_admission.sql','utf8'));
const objects=new Map();const db={prepare(q){return {bind(...args){return {async run(){const r=sql.prepare(q).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sql.prepare(q).get(...args)},async all(){return {results:sql.prepare(q).all(...args)}}}}}}};
const env={PHIOS_CANONICAL_NAVIGATION_HANDOFF_ENABLED:'true',REPORT_CONTEXT_ENCRYPTION_KEY:'ab'.repeat(32),RUNTIME_DB:db,PRIVATE_REPORTS:{async put(k,v){objects.set(k,v)},async get(k){return objects.has(k)?{async text(){return objects.get(k)}}:null}}};
const context=userId=>({env,request:new Request('https://phios.test/api/customer-navigation-handoff',{headers:{origin:'https://phios.test'}}),data:userId?{symbolicAccountIdentity:{userId,providerId:'CONTROLLED_QA',verified:true,authenticated:true}}:{}});
const selection={productFamily:'ACADEMY',objectId:'NAV-01',currentRealityConsent:{processing:true,persistence:true,retention:true},retentionDays:7};
const results=[];async function check(name,fn){await fn();results.push({name,state:'PASS_LOCAL'});}
await check('Public Academy resolves real accepted catalog; missing video remains unavailable',async()=>{let r=await m.createCanonicalNavigationHandoff(context(),selection);assert.equal(r.direction,null);assert.equal(r.historyState,'NOT_SUPPLIED');assert.ok(r.limitations.includes('VIDEO_ASSET_NOT_AVAILABLE'));});
let saved;await check('Actual existing SQLite metadata and AES-GCM object save/reopen',async()=>{saved=await m.saveCanonicalNavigationHandoff(context('QA-A'),selection);let r=await m.reopenCanonicalNavigationHandoff(context('QA-A'),saved.recordId);assert.equal(r.sourceVersion,saved.sourceVersion);assert.equal(r.persistenceState,'ESTABLISHED');assert.ok(r.handoffTargets.some(t=>t.href.includes('navigationRecordId=')));assert.ok(![...objects.values()][0].includes('NAV-01'));});
await check('Cross-account existing storage denial',async()=>{await assert.rejects(()=>m.reopenCanonicalNavigationHandoff(context('QA-B'),saved.recordId));});
await check('Anonymous private source denies before owner read',async()=>{await assert.rejects(()=>m.createCanonicalNavigationHandoff(context(),{productFamily:'BAZI',objectId:'unknown'}),e=>e.status===401);});
await check('Client-injected authority rejected',async()=>{await assert.rejects(()=>m.createCanonicalNavigationHandoff(context(),{...selection,acceptedEvidence:{state:'ACCEPTED'}}),e=>e.status===400);});
await check('Stale source version denied',async()=>{await assert.rejects(()=>m.createCanonicalNavigationHandoff(context('QA-A'),{...selection,sourceVersion:'old'}),e=>e.status===409);});
await check('Persistence needs explicit retention',async()=>{await assert.rejects(()=>m.saveCanonicalNavigationHandoff(context('QA-A'),{...selection,currentRealityConsent:{processing:true}}),e=>e.status===403);});
await check('Production activation remains disabled by default',async()=>{await assert.rejects(()=>m.createCanonicalNavigationHandoff({...context(),env:{}},selection),e=>e.status===503);});
writeFileSync('tools/review/phi-configuration-deep-reading-r2-integrated/r2-1-gap-closure/navigation-legacy-results.json',JSON.stringify({at:new Date().toISOString(),scope:'CONTROLLED_QA_ACCOUNT; REAL_EXISTING_STORAGE_SCHEMA; REAL_PUBLIC_ACADEMY_OWNER',results,providerCalls:0,providerCostUSD:0,browser:'NOT_RUN'},null,2));console.log(JSON.stringify(results));

export {m,env,context,saved,sql};
