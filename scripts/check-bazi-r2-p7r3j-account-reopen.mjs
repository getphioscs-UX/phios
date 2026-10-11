import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter} from './runtime-migration-loader.mjs';
import {p7r3jStorage,persistentPrivateReportsQa} from './lib/persistent-private-reports-qa.mjs';
const base='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/';
const handoff=JSON.parse(fs.readFileSync(base+'P7R3J-HANDOFF.json','utf8'));
const processA=JSON.parse(fs.readFileSync(base+'P7R3J-PROCESS-A-EXIT.json','utf8').replace(/^\uFEFF/,''));
assert.equal(processA.exited,true);assert.equal(processA.exitCode,0);assert.notEqual(process.pid,handoff.processAPid);
const counters={providerCalls:0,generationCalls:0,rendererCalls:0,publicationCompileCalls:0},instrumented=[];
globalThis.__p7r3jForbidden=(boundary)=>{counters[boundary]++;throw Error('REOPEN_FORBIDDEN_'+boundary);};
const hook=registerHooks({load(url,context,next){const out=next(url,context);if(out.format!=='module')return out;let source=String(out.source);const targets=[['compileBaziDeepPublication','publicationCompileCalls'],['generatePaidBaziManuscript','generationCalls'],['generateAndReleaseAccountBazi','generationCalls'],['invokeBaziDeepManuscript','providerCalls']];for(const [name,boundary]of targets){const regex=new RegExp('(export async function '+name+'\\([^\\n]*?\\)\\s*\\{)');if(regex.test(source)){source=source.replace(regex,'$1globalThis.__p7r3jForbidden('+JSON.stringify(boundary)+');');instrumented.push({name,boundary,url});}}return {...out,source};}});
globalThis.fetch=async()=>{counters.providerCalls++;throw Error('PROCESS_B_NETWORK_FORBIDDEN');};
const {openAccountBaziMaterial,listAccountBaziMaterials}=await import('../functions/account/bazi-account-delivery.js');
for(const name of ['compileBaziDeepPublication','generatePaidBaziManuscript','generateAndReleaseAccountBazi','invokeBaziDeepManuscript'])assert(instrumented.some(x=>x.name===name),'REOPEN_BOUNDARY_NOT_INSTRUMENTED_'+name);
const storage=p7r3jStorage(),db=new DatabaseSync(storage.databasePath);
const env={...storage.config,RUNTIME_DB:createSqliteD1Adapter(db),PRIVATE_REPORTS:storage.privateReports,PHIOS_ENVIRONMENT:'local',STRIPE_ENVIRONMENT:'QA',PHIOS_COMMERCE_QA_ENABLED:'true',METHOD_REPORT_RENDERER:{fetch:async()=>{counters.rendererCalls++;throw Error('PROCESS_B_RENDERER_FORBIDDEN');}}};
const context=(currentEnv=env,owner=handoff.ownerId)=>({env:currentEnv,data:{symbolicAccountIdentity:{userId:owner,providerId:'P7_LOCAL_FIXTURE',verified:true,authenticated:true}},request:new Request('https://local.invalid/api/account/material')});
const hash=html=>crypto.createHash('sha256').update(html).digest('hex');
const result={freshRuntime:true,processBPid:process.pid,processAPid:handoff.processAPid,instrumentedBoundaries:instrumented,directFileReadUsedForPassAssertion:false};
try{
 const opened=await openAccountBaziMaterial(context(),handoff.reportId);
 assert.equal(opened.row.report_id,handoff.reportId);assert.equal(opened.row.owner_account_id,handoff.ownerId);assert.equal(opened.row.person_id,handoff.personId);assert.equal(opened.row.snapshot_id,handoff.snapshotDigest);assert.equal(opened.row.output_digest,handoff.outputDigest);assert.equal(hash(opened.html),handoff.htmlSha256);assert(opened.artifact);assert.equal(opened.artifact.htmlSnapshotOrRenderState.outputDigest,handoff.outputDigest);
 result.accountReopen={status:'PASS',reportId:opened.row.report_id,owner:opened.row.owner_account_id,personId:opened.row.person_id,snapshotDigest:opened.row.snapshot_id,outputDigest:opened.row.output_digest,htmlSha256:hash(opened.html),artifactDigest:opened.artifact.artifactDigest,personDecryption:'PASS_THROUGH_PRODUCTION_API',entitlement:'PASS_THROUGH_PRODUCTION_API',materialSeal:'PASS_THROUGH_PRODUCTION_API'};
 const listed=await listAccountBaziMaterials(context());const rows=listed.filter(r=>r.reportId===handoff.reportId);assert.equal(rows.length,1);assert.equal(rows[0].method,'BZR');assert.equal(rows[0].status,'RELEASED');assert.equal(rows[0].locale,'bilingual');result.listResult={status:'PASS',rows};
 assert.deepEqual(counters,{providerCalls:0,generationCalls:0,rendererCalls:0,publicationCompileCalls:0});
 const negative=[];
 async function expectClosed(name,ctx,expected){try{await openAccountBaziMaterial(ctx,handoff.reportId);throw Error('NEGATIVE_ACCEPTED');}catch(error){assert.notEqual(error.message,'NEGATIVE_ACCEPTED');if(expected)assert.equal(error.code||error.message,expected);assert(error.status>=400||error.code,'NO_FAIL_CLOSED_ERROR');negative.push({case:name,status:'PASS',code:error.code||error.message,httpStatus:error.status});}}
 const objects=env.PRIVATE_REPORTS;
 await expectClosed('A_HTML_OBJECT_MISSING',context({...env,PRIVATE_REPORTS:{get:async key=>key===opened.row.object_key?null:objects.get(key)}}),'REPORT_UNAVAILABLE');
 await expectClosed('B_HTML_BYTES_CHANGED',context({...env,PRIVATE_REPORTS:{get:async key=>key===opened.row.object_key?{text:async()=>opened.html+'tampered'}:objects.get(key)}}),'REPORT_UNAVAILABLE');
 await expectClosed('D_WRONG_OWNER',context(env,'P7R3J-OWNER-B'),'REPORT_UNAVAILABLE');
 db.close();
 for(const [name,sql]of [['C_MATERIAL_SEAL_CHANGED',"UPDATE account_method_report_materials SET verifier_receipt=json_set(verifier_receipt,'$.integritySeal','tampered')"],['E_PERSON_UNAVAILABLE','DELETE FROM account_person_versions'],['F_ENTITLEMENT_UNAVAILABLE',"UPDATE digital_entitlements SET entitlement_status='revoked'"]]){
  const clone=path.join(storage.root,'clones',name);assert(!fs.existsSync(clone),'CLONE_ALREADY_EXISTS');fs.mkdirSync(clone,{recursive:true});const clonedDb=path.join(clone,'runtime.sqlite');fs.copyFileSync(storage.databasePath,clonedDb);const isolated=new DatabaseSync(clonedDb);isolated.exec(sql);
  try{await expectClosed(name,context({...env,RUNTIME_DB:createSqliteD1Adapter(isolated)}),name==='E_PERSON_UNAVAILABLE'?'PERSON_NOT_FOUND':'REPORT_UNAVAILABLE');}finally{isolated.close();}
 }
 const lastDb=new DatabaseSync(storage.databasePath),lastEnv={...env,RUNTIME_DB:createSqliteD1Adapter(lastDb),PRIVATE_REPORTS:persistentPrivateReportsQa(storage.privateReportsRoot)};
 try{const again=await openAccountBaziMaterial(context(lastEnv),handoff.reportId);assert.equal(hash(again.html),handoff.htmlSha256);result.positiveStoreUnchangedAfterNegatives=true;}finally{lastDb.close();}
 assert.deepEqual(counters,{providerCalls:0,generationCalls:0,rendererCalls:0,publicationCompileCalls:0});Object.assign(result,{status:'PASS_LOCAL',tamperNegatives:negative,...counters});
}catch(error){result.status='FAILED';result.firstFailure={code:error.code||error.message,layer:'ACCOUNT_REOPEN_OR_TAMPER_GATE'};throw error;}
finally{try{db.close();}catch{}hook.deregister();fs.writeFileSync(base+'P7R3J-PROCESS-B.json',JSON.stringify({...result,...counters},null,2)+'\n');}
console.log('P7R3J cross-process account reopen and six tamper cases PASS_LOCAL');
