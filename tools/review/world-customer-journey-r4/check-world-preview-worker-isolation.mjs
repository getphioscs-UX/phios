import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter} from "file:///C:/Users/Guest%20Account/.codex/worktrees/world-customer-experience-r3/phios/scripts/runtime-migration-loader.mjs";
import {worldPreviewBuildPolicy,isolateWorldPreviewWorker} from "file:///C:/Users/Guest%20Account/.codex/worktrees/world-customer-experience-r3/phios/scripts/lib/world-preview-worker-isolation.mjs";
const dir=path.resolve('C:/phios/tools/review/world-customer-journey-r4/worker-isolation');fs.mkdirSync(dir,{recursive:true});
const base=path.join(dir,'fixture-worker.mjs'),output=path.join(dir,'scoped-worker.mjs');
const abs=p=>path.resolve(p).replaceAll('\\','/');
fs.writeFileSync(base,`import {onRequest} from ${JSON.stringify(abs('functions/_middleware.js'))};
import {onRequestGet} from ${JSON.stringify(abs('functions/api/current-facts.js'))};
export default {fetch(request,env){return onRequest({request,env,next:async()=>{
 if(new URL(request.url).pathname==='/trap'){try{await env.RUNTIME_DB.prepare('INSERT INTO isolation_probe VALUES(1)').run();}catch{}return Response.json({swallowed:true});}
 if(request.method==='GET')return onRequestGet({request});return Response.json({safePost:true});
}})}};`);
const identity={CF_PAGES:'1',CF_PAGES_BRANCH:'codex/world-market-wmda-r2-integration',CF_PAGES_URL:'https://fixture.phios-github.pages.dev',CF_PAGES_COMMIT_SHA:'a'.repeat(40)};
const rows=[];async function test(id,fn){try{await fn();rows.push({id,status:'PASS'});}catch(e){rows.push({id,status:'FAIL',reason:e.message});}}
await test('OTHER_BRANCH_MAIN_AND_LOCAL_KEEP_ORIGINAL_WORKER_BYTES',()=>{for(const env of [{},{...identity,CF_PAGES_BRANCH:'main'},{...identity,CF_PAGES_BRANCH:'codex/profile-visual-r1'},{...identity,CF_PAGES_BRANCH:'codex/commerce-qa'}]){const policy=worldPreviewBuildPolicy(env);assert.equal(policy.active,false);assert.equal(isolateWorldPreviewWorker(base,policy),fs.readFileSync(base,'utf8'));}});
await test('WORLD_BUILD_REQUIRES_PROJECT_URL_AND_COMMIT',()=>{for(const env of [{...identity,CF_PAGES_URL:'https://getphios.com'},{...identity,CF_PAGES_COMMIT_SHA:'unknown'}])assert.throws(()=>worldPreviewBuildPolicy(env));});
const policy=worldPreviewBuildPolicy(identity);fs.writeFileSync(output,isolateWorldPreviewWorker(base,policy));const worker=(await import(pathToFileURL(output).href)).default;
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE isolation_probe(id INTEGER)');const binding=createSqliteD1Adapter(db);let networkCalls=0;globalThis.fetch=()=>{networkCalls++;throw Error('NETWORK_FORBIDDEN');};
const env={PHIOS_ENVIRONMENT:'qa',RUNTIME_DB:binding};
await test('EXISTING_PUBLIC_GET_REAL_SOURCE_UNCHANGED',async()=>{const r=await worker.fetch(new Request('https://fixture.invalid/api/current-facts?operation=company&symbol=MYX:0338'),env,{});assert.equal(r.status,200);assert.equal((await r.json()).result.company.metrics.revenue.value,156626000);assert.equal(r.headers.get('X-PHIOS-Review-Scope'),'WORLD_BRANCH_BUILD');assert.equal(env.PHIOS_D1_MAINTENANCE_MODE,undefined);assert.equal(env.RUNTIME_DB,binding);});
for(const method of ['POST','PUT','PATCH','DELETE'])await test('EXISTING_GUARD_'+method,async()=>{const r=await worker.fetch(new Request('https://fixture.invalid/api/current-facts?maintenance=OFF',{method,headers:{'X-Bypass-Maintenance':'true'},body:'{}'}),env,{});assert.equal(r.status,503);assert.deepEqual(await r.json(),{ok:false,status:'temporarily_unavailable'});});
await test('ACTUAL_SQLITE_GET_WRITE_TRAP_AND_SWALLOWED_ERROR_DENIED',async()=>{const r=await worker.fetch(new Request('https://fixture.invalid/trap'),env,{});assert.equal(r.status,503);assert.equal(db.prepare('SELECT COUNT(*) n FROM isolation_probe').get().n,0);});
await test('NO_PROVIDER_NETWORK_OR_SHARED_ENV_MUTATION',()=>{assert.equal(networkCalls,0);assert.equal(env.PHIOS_D1_MAINTENANCE_MODE,undefined);});db.close();
const receipt={status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',rows,policy,networkCalls,productionWrites:0,sharedConfigurationWrites:0,fullPagesBuildRun:false};fs.writeFileSync(path.join(dir,'RESULT.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));if(receipt.status!=='PASS')process.exitCode=1;
