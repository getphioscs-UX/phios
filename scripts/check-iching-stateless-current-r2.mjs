import assert from 'node:assert/strict';
import * as authority from '../functions/iching-full-production/iching-full-production-v1.js';
import {onRequestGet as contextGet} from '../functions/api/iching-full-context.js';
import {validateCurrentIChingInputs} from './lib/iching-stateless-source-successor-r2.mjs';
validateCurrentIChingInputs();
const sha='b'.repeat(40),payload=authority.createIChingFullProductionAuthorityPayload({approvedCommitSha:'a'.repeat(40),rightsReviewId:'LOCAL_SYNTHETIC_ONLY',promotedAt:'2026-08-27T00:00:00Z'});
let checks=0;
for(const key of ['', 'x'.repeat(31), 'LOCAL_FIXTURE_ONLY_SIGNING_KEY_1234567890']){
 const env={ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET:key},actual=authority.validateIChingFullProductionAuthorityRecord(payload,sha,env);
 assert.equal(actual.runAllowed,true);assert.equal(actual.guestPersistenceAllowed,key.length>=32);assert.equal(actual.clientMayGrantAuthority,false);checks++;
 if(key.length<32){await assert.rejects(()=>authority.createIChingGuestSession({env}),/SECRET_REQUIRED/);checks++;}
}
for(const field of ['runAllowed','fullProduction','globalPublicExecution','guestPersistenceAllowed','productionCapabilityPromoted']){assert.equal(authority.validateIChingFullProductionAuthorityRecord({...payload,[field]:false},sha,{}).runAllowed,false);checks++;}
for(const gate of Object.keys(payload.gates)){assert.equal(authority.validateIChingFullProductionAuthorityRecord({...payload,gates:{...payload.gates,[gate]:false}},sha,{}).runAllowed,false);checks++;}
for(const [field,value]of [['state','REVOKED'],['schemaVersion','UNKNOWN'],['methodCode','OTHER'],['releaseId','ICHING-9'],['authorityScope','CLIENT'],['promotionCommitSha','invalid']]){assert.equal(authority.validateIChingFullProductionAuthorityRecord({...payload,[field]:value},sha,{}).runAllowed,false);checks++;}
assert.equal(authority.validateIChingFullProductionAuthorityRecord(payload,sha,{ICHING_FULL_PRODUCTION_ENABLED:'false'}).runAllowed,false);checks++;
assert.equal((await authority.resolveIChingFullProductionAuthority({env:{CF_PAGES_COMMIT_SHA:sha}})).runAllowed,false);checks++;
let reads=0,writes=0;
const database=record=>({prepare(sql){if(!/^SELECT\s/i.test(sql)){writes++;assert.fail('Only synthetic SELECT is allowed');}return {bind(...ids){assert.equal(ids[0],authority.ICHING_FULL_PRODUCTION_AUTHORITY_RUNTIME_ID);return {async first(){reads++;return record?{payload:JSON.stringify(record)}:null;}};}};}});
for(const [record,key,allowed]of [[payload,'',true],[payload,'x'.repeat(31),true],[null,'',false],[{...payload,state:'REVOKED'},'',false]]){
 const response=await contextGet({request:new Request('https://phios.test/api/iching-full-context'),env:{CF_PAGES_COMMIT_SHA:sha,RUNTIME_DB:database(record),ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET:key}}),body=await response.json();
 assert.equal(response.status,200);assert.equal(body.production.runAllowed,allowed);assert.equal(body.guest.guestPersistenceAllowed,false);assert.equal(body.guest.saveContractAvailable,false);assert.equal(response.headers.get('set-cookie'),null);assert.equal(body.realityContext.usingCurrentRealityContext,false);assert.equal(body.realityContext.silentPrivateContextConsumption,false);checks++;
}
const configured=await contextGet({request:new Request('https://phios.test/api/iching-full-context'),env:{CF_PAGES_COMMIT_SHA:sha,RUNTIME_DB:database(payload),ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET:'LOCAL_FIXTURE_ONLY_SIGNING_KEY_1234567890'}}),configuredBody=await configured.json();
assert.equal(configured.status,200);assert.equal(configuredBody.production.runAllowed,true);assert.equal(configuredBody.guest.saveContractAvailable,true);assert.equal(configuredBody.guest.retentionConsentRequired,true);assert(configured.headers.get('set-cookie')?.startsWith('__Host-PHIOS_ICHING_GUEST='));checks++;
for(const consent of [{},{retentionConsent:{accepted:false,scope:'SYMBOLIC_READING',policyVersion:'ICHING-GUEST-RETENTION-v1'}},{retentionConsent:{accepted:true,scope:'OTHER',policyVersion:'ICHING-GUEST-RETENTION-v1'}},{retentionConsent:{accepted:true,scope:'SYMBOLIC_READING',policyVersion:'OLD'}}]){assert.equal(authority.explicitGuestRetentionConsent(consent),false);checks++;}
assert.equal(authority.explicitGuestRetentionConsent({retentionConsent:{accepted:true,scope:'SYMBOLIC_READING',policyVersion:'ICHING-GUEST-RETENTION-v1'}}),true);checks++;
assert.equal(writes,0);assert(reads>=5&&reads<=7);
console.log('IChing real current authority/context: '+checks+' rights/key/kill-switch/synthetic-D1 context/consent checks PASS; no production calls, writes or secrets.');
