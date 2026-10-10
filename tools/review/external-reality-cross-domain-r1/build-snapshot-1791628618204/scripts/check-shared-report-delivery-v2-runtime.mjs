// This suite is wholly offline, including authentication fixtures.
globalThis.fetch=async()=>{throw Error('OFFLINE_TEST_NETWORK_FORBIDDEN');};
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash} from 'node:crypto';
import {saveCanonicalPerson,loadCanonicalPerson,loadCanonicalPersonSubject,listCanonicalPersons} from '../functions/account/canonical-person-store.js';
import {onRequest as personApi} from '../functions/api/account-persons.js';
import {generateAccountZiweiCandidate as generateProductionAccountZiweiCandidate} from '../functions/report-delivery/ziwei-canonical-person-binding.js';
import {releaseControlledZiweiReport,openControlledZiweiReport,listControlledZiweiReports} from '../functions/account/ziwei-controlled-report-material.js';
import {generateAndReleaseAccountZiwei as generateProductionAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from '../functions/account/ziwei-account-delivery.js';
import {digest} from '../functions/account/oidc-auth.js';
import {generateZiweiProductionCandidate,requireZiweiEntitlement} from '../functions/report-delivery/ziwei-production-generation-v1.js';
// Trusted server injection keeps this storage test offline; the production default is resolved separately from the current canonical cutover state.
const generateAccountZiweiCandidate=(context,selection)=>generateProductionAccountZiweiCandidate(context,selection,{generateCandidate:generateZiweiProductionCandidate});
const generateAndReleaseAccountZiwei=(context,selection)=>generateProductionAndReleaseAccountZiwei(context,selection,{generateCandidate:generateAccountZiweiCandidate});
const sqlite=new DatabaseSync(':memory:');
for(const file of fs.readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('db/migrations/'+file,'utf8'));
const db={prepare(sql){return {values:[],bind(...v){this.values=v;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;},async all(){return {results:sqlite.prepare(sql).all(...this.values)};},async run(){return sqlite.prepare(sql).run(...this.values);}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const objects=new Map(),env={PHIOS_ENVIRONMENT:'local',RUNTIME_DB:db,CANONICAL_PERSON_ENCRYPTION_KEY:randomBytes(32).toString('hex'),PRIVATE_REPORTS:{async put(k,v){objects.set(k,v);},async get(k){return objects.has(k)?{text:async()=>objects.get(k),json:async()=>JSON.parse(objects.get(k))}:null;}}};
const account=userId=>({env,data:{symbolicAccountIdentity:{userId,providerId:'ISOLATED_LOCAL_TEST',authenticated:true,verified:true}}});
const a=account('LOCAL-CPA-A'),b=account('LOCAL-CPA-B'),f=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/controlled-subject.json'));
const {birthDate,birthTime,birthPlace,timeAccuracy}=f.canonicalBirthInput;
const input={action:'save',expectedVersion:0,name:'Controlled owner A',birth:{birthDate,birthTime,birthPlace,timeAccuracy,timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00'}},calculationSex:'MALE',consent:{personalMethod:true,report:true,saveBirthInput:true},expiresAt:new Date(Date.now()+300*86400000).toISOString()};
const tests=[];
async function denied(name,call){await assert.rejects(call);tests.push({name,result:'DENIED'});}
await denied('guest cannot create',()=>saveCanonicalPerson({env,data:{}},input));
await denied('client owner cannot be supplied',()=>saveCanonicalPerson(a,{...input,ownerAccountId:'LOCAL-CPA-B'}));
await denied('missing consent',()=>saveCanonicalPerson(a,{...input,consent:{}}));
await denied('invalid date',()=>saveCanonicalPerson(a,{...input,birth:{...input.birth,birthDate:'2023-02-29'}}));
const p=await saveCanonicalPerson(a,input),q=await saveCanonicalPerson(b,{...input,name:'Controlled owner B'});
assert.equal(p.ownerAccountId,'LOCAL-CPA-A');assert.equal(p.version,1);
await denied('A cannot load B',()=>loadCanonicalPerson(env,'LOCAL-CPA-A',q.personId));
await denied('B cannot load A',()=>loadCanonicalPerson(env,'LOCAL-CPA-B',p.personId));
await denied('B cannot update A',()=>saveCanonicalPerson(b,{...input,personId:p.personId,expectedVersion:1}));
assert.equal((await listCanonicalPersons(a)).length,1);
assert.equal((await listCanonicalPersons(b))[0].personId,q.personId);
const row=sqlite.prepare('SELECT * FROM account_person_versions WHERE person_id=?').get(p.personId);
assert(!JSON.stringify(row).includes(p.name));assert(!JSON.stringify(row).includes(birthDate));
const request=(body,origin='https://qa.phios-github.pages.dev')=>new Request('https://qa.phios-github.pages.dev/api/account-persons',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
assert.equal((await personApi({...a,request:request(input,'https://wrong.example')})).status,403);
assert.equal((await personApi({env,data:{},request:request(input)})).status,401);
const selection={personId:p.personId,locale:'en',targetContext:f.targetContext};
await denied('no entitlement',()=>generateAccountZiweiCandidate(a,selection));
await denied('client birth replacement',()=>generateAccountZiweiCandidate(a,{...selection,birthDate:'2000-01-01'}));
// SQL fixture is local policy evidence only, never Stripe/QA purchase proof.
const product='COM-REPORT-ZIWEI-FULL';
sqlite.prepare("INSERT INTO commerce_products(product_id,product_version,title,language,format,currency,amount_minor,source_object_key,created_at,updated_at) VALUES(?,'1','Local test','bilingual','REPORT','MYR',3900,'local','2026-10-01','2026-10-01')").run(product);
sqlite.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,customer_id,product_id,idempotency_key_hash,status,order_state,environment,context_json,created_at,updated_at) VALUES('cpa-local-order',?,?,'cpa-local-idempotency','paid','FULFILLED','QA',?,'2026-10-01','2026-10-01')").run('LOCAL-CPA-A',product,JSON.stringify({reportPresentation:{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'}}));
sqlite.prepare("INSERT INTO commerce_purchases(purchase_id,customer_id,product_id,checkout_attempt_id,stripe_checkout_session_id,currency,amount_minor,purchase_state,created_at,updated_at) VALUES('cpa-local-purchase',?,?,'cpa-local-order','LOCAL-NOT-STRIPE','MYR',3900,'purchased','2026-10-01','2026-10-01')").run('LOCAL-CPA-A',product);
sqlite.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,customer_id,product_id,subject_hash,entitlement_code,entitlement_status,granted_at,created_at,updated_at) VALUES('cpa-local-entitlement','cpa-local-purchase',?,?,'controlled','REPORT_ZIWEI_FULL','active','2026-10-01','2026-10-01','2026-10-01')").run('LOCAL-CPA-A',product);
assert.equal((await requireZiweiEntitlement(a,'en')).purchase_id,'cpa-local-purchase');
const zwrCutoverPath='docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json';
if(fs.existsSync(zwrCutoverPath)){
 const cutover=JSON.parse(fs.readFileSync(zwrCutoverPath,'utf8'));
 assert.equal(cutover.schemaVersion,'ZWR-VFR-R1-DEEP-PRODUCTION-CUTOVER-v2');
 await assert.rejects(
  ()=>generateProductionAccountZiweiCandidate(a,selection),
  error=>error?.message==='VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED'||error?.code==='VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED'
 );
}else{
 await assert.rejects(()=>generateProductionAccountZiweiCandidate(a,selection),{code:'ZIWEI_R5_OPENAI_API_KEY_REQUIRED'});
}

import {generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION} from '../functions/report-delivery/ziwei-vfr-r1-generation.js';
import {createCustomerDeliverySnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
import {resolveMethodRenderContract,assertMethodGeneration,assertMethodRenderReceipt,assertMethodPresentationMode} from '../functions/report-delivery/method-render-contract.js';
import {parseHTML} from 'linkedom';
const saved=JSON.parse(fs.readFileSync('docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIRED-RESULT.json')).rawManuscriptSections;
let fakeTransportCalls=0;
const fakeTransport=async(_url,options)=>{
 fakeTransportCalls++;
 const payload=JSON.parse(options.body),batch=JSON.parse(payload.input.find(x=>x.role==='user').content).compactBatch;
 const sections=batch.sections.map(s=>saved.find(x=>x.sectionId===s.sectionId));
 assert(sections.every(Boolean));
 return Response.json({id:'SYNTHETIC_OFFLINE_RESPONSE',status:'completed',output_text:JSON.stringify({sections}),usage:{input_tokens:1,output_tokens:1}});
};
// Explicit fixture transport only; no global fetch and no real API key.
const fixtureContext={...a,env:{...env,REPORT_PROVIDER_LIVE_ALLOWED:'true',OPENAI_API_KEY:'SYNTHETIC_OFFLINE_KEY'}};
const fixtureGenerator=(context,selected)=>generateProductionAccountZiweiCandidate(context,selected,{generateCandidate:(ctx,s,deps)=>generateZiweiVfrR1Candidate(ctx,s,{...deps,fetcher:fakeTransport})});
const candidate=await fixtureGenerator(fixtureContext,selection);
assert.equal(fakeTransportCalls,5);
const [retry,parallel]=await Promise.all([fixtureGenerator(fixtureContext,selection),fixtureGenerator(fixtureContext,selection)]);
assert.equal(retry.snapshot.semanticSnapshotId,candidate.snapshot.semanticSnapshotId);assert.equal(parallel.snapshot.semanticSnapshotId,candidate.snapshot.semanticSnapshotId);assert.equal(fakeTransportCalls,5);
assert.equal(candidate.productionAdmissionGranted,false);
await assert.rejects(()=>fixtureGenerator({...fixtureContext,env:{...fixtureContext.env,REPORT_PROVIDER_LIVE_ALLOWED:'false'}},{...selection,personId:q.personId}));
assert.notEqual(candidate.snapshot.semanticContent.vfrCompactAuthoringPackDigest,JSON.parse(fs.readFileSync('docs/reports/ziwei/vfr-r1/COMPACT-AUTHORING-PACK.json')).authorityDigest,'New authority must auto-generate without per-customer Human ACCEPT');
assert.equal(candidate.snapshot.compositionVersion,ZIWEI_VFR_R1_GENERATION_VERSION);
assert.equal((await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId,candidate.snapshot.semanticSnapshotId,'VFR content must be included in the immutable snapshot digest');
await assertMethodGeneration(candidate);
const contract=resolveMethodRenderContract(candidate),html=contract.renderFunction();
const {document}=parseHTML('<main class="report-root">'+html+'</main>');
assert.equal(document.querySelectorAll('.zv-page').length,candidate.snapshot.semanticContent.vfrPagePlan.length);
assert.deepEqual([...document.querySelectorAll('[data-diagram-id]')].map(x=>x.dataset.diagramId).sort(),contract.requiredDiagramIds.slice().sort());
for(const section of candidate.snapshot.semanticContent.visualReportIr.sections)for(const locale of ['zhHans','en'])for(const paragraph of section[locale].paragraphs)assert(document.body?.textContent?.includes(paragraph)||document.documentElement.textContent.includes(paragraph),'All manuscript paragraphs must appear in the rendered DOM');
const verification={schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',semanticSnapshotId:candidate.snapshot.semanticSnapshotId,passed:true,snapshotId:candidate.snapshot.semanticSnapshotId,pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage.pagePlanDigest,expectedPageCount:contract.expectedPageCount,actualPageCount:contract.expectedPageCount,hiddenRequiredContentCount:0,pageCount:contract.expectedPageCount,brokenImages:0,overflowCount:0,errorCount:0,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,verificationMode:contract.verificationMode,pageSequenceValid:true,hiddenOrZeroGeometryCount:0,diagramRegistryValid:true,undefinedText:false,outputDigest:await digest(html)};
assertMethodRenderReceipt(candidate,verification);
for(const changed of [{pageCount:39},{rendererVersion:'OLD'},{diagramRegistryValid:false},{hiddenOrZeroGeometryCount:1},{undefinedText:true}])assert.throws(()=>assertMethodRenderReceipt(candidate,{...verification,...changed}));
const tampered=structuredClone(candidate);tampered.snapshot.semanticContent.visualReportIr.sections[0].zhHans.paragraphs.pop();
await assert.rejects(()=>assertMethodGeneration(tampered));
const wrongVersion=structuredClone(candidate);wrongVersion.snapshot.compositionVersion='ZIWEI-PRODUCTION-COMPOSER-V1';assert.throws(()=>resolveMethodRenderContract(wrongVersion),/ZIWEI_VFR_GENERATION_RENDERER_MISMATCH/);
const badPlan=structuredClone(candidate);badPlan.snapshot.semanticContent.vfrPagePlan[0].pageNumber=2;assert.throws(()=>resolveMethodRenderContract(badPlan));
for(const method of ['PROFILE','FINANCIAL','WILL']){
 assertMethodPresentationMode(method,'BILINGUAL');
 for(const mode of ['EN','ZH_HANS','en','zh-Hans'])assert.throws(()=>assertMethodPresentationMode(method,mode),/METHOD_BILINGUAL_ONLY/);
}
let renderCalls=0,generationCalls=0;
const generatedOnce=async()=>{generationCalls++;return candidate;};
const releaseContext={...a,env:{...env,METHOD_REPORT_RENDERER:{async fetch(){renderCalls++;return Response.json({html,verification});}}}};
const released=await generateProductionAndReleaseAccountZiwei(releaseContext,selection,{generateCandidate:generatedOnce});
const releasedRetry=await generateProductionAndReleaseAccountZiwei(releaseContext,selection,{generateCandidate:generatedOnce});assert.equal(releasedRetry.reportId,released.reportId);assert.equal(renderCalls,1);
const first=await openAccountZiweiMaterial(releaseContext,released.reportId);
const second=await openAccountZiweiMaterial(releaseContext,released.reportId);
assert.equal(first.row.output_digest,second.row.output_digest);assert.equal(first.html,second.html);
assert.equal((await listAccountZiweiMaterials(releaseContext))[0].presentationMode,'BILINGUAL');
assert.equal(renderCalls,1);assert.equal(fakeTransportCalls,5);
await assert.rejects(()=>openAccountZiweiMaterial(b,released.reportId));
assert.equal((await listAccountZiweiMaterials(b)).length,0);
objects.set(first.row.object_key,'TAMPERED');await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));objects.set(first.row.object_key,first.html);
sqlite.prepare("UPDATE digital_entitlements SET entitlement_status='revoked' WHERE entitlement_id='cpa-local-entitlement'").run();await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));

import {requireZwrVfrGenerationAdmission,ZWR_VFR_METHOD_PROFILE} from '../functions/report-delivery/ziwei-vfr-profile-policy.js';
await assert.rejects(()=>requireZwrVfrGenerationAdmission(env),/METHOD_GENERATION_ADMISSION_REQUIRED/);
const admissionKey='qa/method-delivery/ZWR/generation-admission.json';
objects.set(admissionKey,JSON.stringify({schemaVersion:'METHOD_GENERATION_ADMISSION_V1',methodCode:'ZWR',state:'ACCEPTED',scope:'DEPLOYED_PRIVATE_BROWSER',profileVersion:ZWR_VFR_METHOD_PROFILE.profileVersion,rendererVersion:ZWR_VFR_METHOD_PROFILE.rendererVersion,sourceAcceptanceDigest:createHash('sha256').update(fs.readFileSync('docs/reports/ziwei/vfr-r1/HUMAN-DECISION.json')).digest('hex'),rendererAcceptanceDigest:'0'.repeat(64)}));
await requireZwrVfrGenerationAdmission(env);objects.delete(admissionKey);
assert.equal(fakeTransportCalls,5,'Native admission preflight must not call a provider');
// Durable cache tests use isolated governed inputs, and never a provider transport.
import {cachedMethodDelivery,methodCacheIdentity} from '../functions/report-delivery/method-delivery-cache.js';
let cacheProductions=0;
const governed={method:'ZWR',product,version:ZIWEI_VFR_R1_GENERATION_VERSION,person:p.personId,revision:1,authority:'A',calculation:'C',prompt:'P',schema:'S',model:'M',plan:'FIVE'};
const cached=async(seed,owner='LOCAL-CPA-A')=>cachedMethodDelivery(env,{ownerAccountId:owner,kind:'SEMANTIC',key:await methodCacheIdentity(seed),produce:async()=>{cacheProductions++;await Promise.resolve();return {generationIdentity:await methodCacheIdentity({owner,...seed})};}});
const [cacheA,cacheB]=await Promise.all([cached(governed),cached(governed)]);assert.equal(cacheA.value.generationIdentity,cacheB.value.generationIdentity);assert.equal(cacheProductions,1);
assert.equal((await cached(governed)).value.generationIdentity,cacheA.value.generationIdentity);assert.equal(cacheProductions,1);
for(const variation of [{person:q.personId},{revision:2},{authority:'B'}])assert.notEqual((await cached({...governed,...variation})).value.generationIdentity,cacheA.value.generationIdentity);
assert.notEqual((await cached(governed,'LOCAL-CPA-B')).value.generationIdentity,cacheA.value.generationIdentity);
// All publication identity tampering fails even when the rendered bytes are intact.
const originalReceipt=first.row.verifier_receipt;
for(const field of ['manuscriptDigest','publicationIrDigest','pagePlanDigest','compositionVersion','ownerAccountId','subjectId','purchaseId','releaseStatus']){
 const corrupted=JSON.parse(originalReceipt);corrupted.materialIdentity[field]='TAMPERED';
 sqlite.prepare('UPDATE account_method_report_materials SET verifier_receipt=? WHERE report_id=?').run(JSON.stringify(corrupted),released.reportId);
 await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));
}
sqlite.prepare('UPDATE account_method_report_materials SET verifier_receipt=? WHERE report_id=?').run(originalReceipt,released.reportId);
const storedHtml=objects.get(first.row.object_key);objects.delete(first.row.object_key);await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));objects.set(first.row.object_key,storedHtml);
const releasePayload=sqlite.prepare('SELECT payload FROM runtime_artifacts WHERE artifact_id=?').get(released.reportId).payload;
const inactive=JSON.parse(releasePayload);inactive.releaseStatus='INACTIVE';sqlite.prepare('UPDATE runtime_artifacts SET payload=? WHERE artifact_id=?').run(JSON.stringify(inactive),released.reportId);await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));sqlite.prepare('UPDATE runtime_artifacts SET payload=? WHERE artifact_id=?').run(releasePayload,released.reportId);
for(const path of ['vfrDeepManuscriptDigest','vfrCompactAuthoringPackDigest']){const changed=structuredClone(candidate);changed.snapshot.semanticContent[path]='TAMPERED';await assert.rejects(()=>assertMethodGeneration(changed));}
const invalidProfileCalls=fakeTransportCalls;
await assert.rejects(()=>generateProductionAccountZiweiCandidate(fixtureContext,selection,{generateCandidate:(ctx,selected,deps)=>generateZiweiVfrR1Candidate(ctx,selected,{...deps,fetcher:fakeTransport,methodProfile:{unresolvedFields:['authority']}})}));assert.equal(fakeTransportCalls,invalidProfileCalls);
import {EncryptJWT} from 'jose';
import {onRequest as sharedProofApi} from '../functions/api/shared-report-e2e-proof.js';
import {onRequest as stabilityApi} from '../functions/api/shared-report-renderer-stability.js';
sqlite.prepare("UPDATE digital_entitlements SET entitlement_status='active' WHERE entitlement_id='cpa-local-entitlement'").run();
const proofEnv={...releaseContext.env,PHIOS_ENVIRONMENT:'qa',AUTH_PROVIDER:'auth0',AUTH_ISSUER:'https://synthetic-auth.example/',AUTH_CLIENT_ID:'offline-client',AUTH_CLIENT_SECRET:'offline-client-secret',AUTH_SESSION_SECRET:'offline-session-secret-at-least-32-characters'};
const origin='https://qa.phios-github.pages.dev';
for(const owner of ['LOCAL-CPA-A','LOCAL-CPA-B'])sqlite.prepare("INSERT INTO users(user_id,created_at,updated_at) VALUES(?, 'fixture','fixture') ON CONFLICT(user_id) DO NOTHING").run(owner);
const session=async(owner,sid)=>{
 const now=Math.floor(Date.now()/1000);
 sqlite.prepare('INSERT INTO account_verified_sessions(session_hash,user_id,issuer,expires_at,created_at) VALUES(?,?,?,?,?)').run(await digest(sid),owner,proofEnv.AUTH_ISSUER,now+1000,now);
 const key=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(['session',proofEnv.AUTH_ISSUER,proofEnv.AUTH_CLIENT_ID,origin,proofEnv.AUTH_SESSION_SECRET].join('\0'))));
 return new EncryptJWT({uid:owner,sid}).setProtectedHeader({alg:'dir',enc:'A256GCM'}).setIssuer(proofEnv.AUTH_ISSUER).setAudience(origin).setIssuedAt().setExpirationTime(now+1000).encrypt(key);
};
const sessionA=await session('LOCAL-CPA-A','OFFLINE-SESSION-A'),sessionA2=await session('LOCAL-CPA-A','OFFLINE-SESSION-A2'),sessionB=await session('LOCAL-CPA-B','OFFLINE-SESSION-B');
const call=async(body,cookie,owner='LOCAL-CPA-A')=>sharedProofApi({env:proofEnv,data:{symbolicAccountIdentity:{userId:owner,providerId:proofEnv.AUTH_ISSUER,verified:true,authenticated:true}},request:new Request(origin+'/api/shared-report-e2e-proof',{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie:'__Host-phios-session='+cookie}:{})},body:JSON.stringify(body)})});
assert.equal((await call({action:'reopen',reportId:released.reportId},null)).status,401);
assert.equal((await (await call({action:'generate-release-open',personId:p.personId,locale:'en'},sessionA)).json()).code,'SHARED_E2E_LIVE_NOT_AUTHORIZED');
const proofPath='qa/shared-report-e2e/v2/'+released.reportId+'.json';
const openedProof=await (await call({action:'open-released',reportId:released.reportId},sessionA)).json();
assert.equal(openedProof.ok,true);assert.equal(openedProof.proof.generationReleaseProven,false);assert.equal(openedProof.proof.releasedMaterialProven,true);
const sealedProof=objects.get(proofPath),modifiedProof=JSON.parse(sealedProof);modifiedProof.generationReleaseProven=true;
objects.set(proofPath,JSON.stringify(modifiedProof));assert.equal((await (await call({action:'reopen',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_PROOF_TAMPERED');objects.set(proofPath,sealedProof);
assert.equal((await (await call({action:'reopen',reportId:released.reportId},sessionA)).json()).code,'SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
assert.equal((await (await call({action:'reopen',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_LOGOUT_REQUIRED');
// Local session-revocation fixture only. Do not call identity-provider logout or discovery.
sqlite.prepare('UPDATE account_verified_sessions SET revoked_at=? WHERE session_hash=?').run(Math.floor(Date.now()/1000),await digest('OFFLINE-SESSION-A'));
const reopened=await (await call({action:'reopen',reportId:released.reportId},sessionA2)).json();assert.equal(reopened.ok,true);assert.equal(reopened.proof.sharedDeliveryAuthorityEligible,false);
assert.equal((await (await call({action:'account-isolation',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_SECOND_ACCOUNT_REQUIRED');
const isolated=await (await call({action:'account-isolation',reportId:released.reportId},sessionB,'LOCAL-CPA-B')).json();assert.equal(isolated.ok,true);assert.equal(isolated.proof.sharedDeliveryAuthorityEligible,false);
assert.equal((await (await call({action:'finalize',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED');
objects.set('qa/shared-report-e2e/v2/method-deltas.json',JSON.stringify({schemaVersion:'METHOD_DELIVERY_WAVE_PRIVATE_ADMISSION_V1',methods:['ZWR','AST','NUM','PROFILE','ECR','HD','FINANCIAL','WILL','CROSS'].map(methodCode=>({methodCode,status:'PASS',profileResolved:true,deployedProofDigest:'SYNTHETIC_LOCAL_ONLY'}))}));
assert.equal((await (await call({action:'finalize',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_REQUIRED_LIVE_PHASES_INCOMPLETE');
assert.equal(JSON.parse(objects.get(proofPath)).sharedDeliveryAuthorityEligible,false);
assert.equal((await stabilityApi({env:proofEnv,request:new Request(origin+'/api/shared-report-renderer-stability',{method:'POST',headers:{origin}})})).status,401);
assert.equal((await stabilityApi({env:proofEnv,request:new Request(origin+'/api/shared-report-renderer-stability',{method:'POST',headers:{origin,cookie:'__Host-phios-session='+sessionA2}})})).status,403);
assert.equal(renderCalls,1);assert.equal(fakeTransportCalls,5);
const revoked=await saveCanonicalPerson(a,{action:'revoke',personId:p.personId,expectedVersion:p.version});
await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));
await assert.rejects(()=>fixtureGenerator(fixtureContext,selection));assert.equal(fakeTransportCalls,5);
assert.equal((await (await call({action:'open-released',reportId:released.reportId},sessionA2)).json()).ok,false);
// A durable failed claim cannot initiate a second paid attempt automatically.
let failedProductions=0;
const failed=()=>cachedMethodDelivery(env,{ownerAccountId:'LOCAL-CPA-A',kind:'SEMANTIC',key:'FAILED-CLAIM',produce:async()=>{failedProductions++;throw Error('SYNTHETIC_FAILURE');}});
await assert.rejects(failed);await assert.rejects(failed,/METHOD_CACHE_RECONCILIATION_REQUIRED/);assert.equal(failedProductions,1);
// Separate database facades emulate two isolates: only one durable claim wins.
let isolateProductions=0;const alternateEnv={...env,RUNTIME_DB:{...db}};
const race=cacheEnv=>cachedMethodDelivery(cacheEnv,{ownerAccountId:'LOCAL-CPA-A',kind:'SEMANTIC',key:'CROSS-ISOLATE-CLAIM',produce:async()=>{isolateProductions++;await Promise.resolve();return {generationIdentity:'ONE'};}});
const raceResults=await Promise.allSettled([race(env),race(alternateEnv)]);assert.equal(isolateProductions,1);assert.equal(raceResults.filter(x=>x.status==='fulfilled').length,1);assert.equal(raceResults.find(x=>x.status==='rejected').reason.code,'METHOD_GENERATION_IN_PROGRESS');assert.equal((await race(alternateEnv)).value.generationIdentity,'ONE');assert.equal(isolateProductions,1);
sqlite.close();
console.log(JSON.stringify({scope:'LOCAL_SQL_AND_SYNTHETIC_TRANSPORT_ONLY',status:'PASS',providerCalls:0,newProviderCost:0,fakeTransportCalls,cacheProductions,semanticDedup:'SEQUENTIAL_AND_CONCURRENT_PASS',publicationCache:'PASS',openReleasedDoesNotProveGeneration:true,proofTamperDenied:true,rendererCalls:renderCalls,localGeneratedPageCount:contract.expectedPageCount,immutableVfrSnapshot:true,manuscriptParagraphCoverage:true,reopenGenerationCalls:0,reopenRendererCalls:0,accountIsolation:'LOCAL_PASS',deployedBrowserProof:false},null,2));
