import test from 'node:test';
import assert from 'node:assert/strict';
import {draftApi,loadOwnedDraft} from '../../functions/account/financial-will-draft-store.js';
import {onRequestPost as summary} from '../../functions/api/account-financial-summary.js';
import {FW_V1,FW_V2} from '../../functions/account/financial-will-draft-v2.js';
import {digest} from '../../functions/account/oidc-auth.js';
import {localAccount} from './local-account.mjs';
const payload={asOfDate:'2026-10-19',baseCurrency:'MYR',monthlyIncome:'8000',monthlyExpenses:'2000',liquidAssets:'12000',investments:'0',property:'0',liabilities:'1000',monthlyDebtRepayment:'100'};
async function save(a,p=payload,prior){const response=await draftApi(a.context({action:'save',draftType:'FINANCIAL',payload:p,purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString(),expectedVersion:prior?.version||0,draftId:prior?.draftId}));return {status:response.status,...await response.json()};}
test('real SQLite + AES exact versions, saved-reference summary and CAS preserve history',async()=>{
 const a=localAccount(),v1=await save(a);assert.equal(v1.status,200);assert.equal(v1.schemaVersion,FW_V2);
 const v2=await save(a,{...payload,liquidAssets:'14000'},v1);assert.equal(v2.version,2);
 const old=await loadOwnedDraft(a.context({}),{draftId:v1.draftId,version:1,expectedRef:v1.savedDraftRef});assert.equal(old.payload.liquidAssets,'12000');
 const response=await summary(a.context({consent:true,savedDraftRef:v1.savedDraftRef}));assert.equal(response.status,200,await response.clone().text());const result=await response.json();assert.equal(result.lineage.calculation.metrics.netWorth,11000);assert.equal(result.savedDraftRef.version,1);
 assert.equal((await save(a,payload,v1)).code,'DRAFT_VERSION_CONFLICT');
 await assert.rejects(loadOwnedDraft(a.context({},{owner:'synthetic-other'}),{draftId:v1.draftId,version:1}),{code:'DRAFT_NOT_FOUND'});
 await assert.rejects(loadOwnedDraft(a.context({}),{draftId:v1.draftId,version:9}),{code:'DRAFT_NOT_FOUND'});
 await assert.rejects(loadOwnedDraft(a.context({}),{draftId:v1.draftId,version:1,expectedRef:{...v1.savedDraftRef,contentDigest:'forged'}}),{code:'DRAFT_REFERENCE_MISMATCH'});
 a.sql.prepare('UPDATE account_financial_will_drafts SET legal_hold_reference=? WHERE draft_id=?').run('synthetic-hold',v1.draftId);
 assert.equal((await loadOwnedDraft(a.context({}),{draftId:v1.draftId,version:1})).version,1);
 assert.equal((await save(a,payload,v2)).code,'DRAFT_RIGHTS_REVIEW_REQUIRED');a.sql.close();
});
test('historical v1 AAD remains readable; unsupported, corrupt and expired are distinct',async()=>{
 const a=localAccount(),expires=Date.now()+86400000,text=JSON.stringify(payload),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await crypto.subtle.importKey('raw',Buffer.from('a'.repeat(64),'hex'),{name:'AES-GCM'},false,['encrypt']);
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(JSON.stringify([FW_V1,'synthetic-owner','FINANCIAL','old-draft',1,expires]))},key,new TextEncoder().encode(text));
 a.sql.prepare('INSERT INTO account_financial_will_drafts VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('old-draft','synthetic-owner','FINANCIAL',FW_V1,1,Buffer.from(encrypted).toString('base64'),Buffer.from(iv).toString('base64'),'v1',await digest(text),null,'retention','storage-consent',expires,Date.now(),null);
 const original=a.sql.prepare('SELECT * FROM account_financial_will_drafts').get();assert.equal((await loadOwnedDraft(a.context({}),{draftId:'old-draft',version:1})).payload.monthlyIncome,'8000');assert.deepEqual(a.sql.prepare('SELECT * FROM account_financial_will_drafts').get(),original);
 const upgraded=await save(a,payload,{draftId:'old-draft',version:1});assert.equal(upgraded.schemaVersion,FW_V2);assert.equal(upgraded.version,2);assert.equal((await loadOwnedDraft(a.context({}),{draftId:'old-draft',version:1})).schemaVersion,FW_V1);
 a.sql.exec("UPDATE account_financial_will_drafts SET schema_version='future'");await assert.rejects(loadOwnedDraft(a.context({}),{draftId:'old-draft',version:1}),{code:'DRAFT_SCHEMA_UNSUPPORTED'});
 a.sql.prepare('UPDATE account_financial_will_drafts SET schema_version=?,digest=?').run(FW_V1,'bad');await assert.rejects(loadOwnedDraft(a.context({}),{draftId:'old-draft',version:1}),{code:'DRAFT_INTEGRITY_FAILED'});
 a.sql.exec("UPDATE account_financial_will_drafts SET ciphertext='broken'");await assert.rejects(loadOwnedDraft(a.context({}),{draftId:'old-draft',version:1}),{code:'DRAFT_DECRYPTION_FAILED'});
 a.sql.exec('UPDATE account_financial_will_drafts SET expires_at=1');await assert.rejects(loadOwnedDraft(a.context({}),{draftId:'old-draft',version:1}),{code:'DRAFT_EXPIRED'});a.sql.close();
});
test('v2 rejects identity persistence, malformed relationships and duplicate IDs',async()=>{
 const a=localAccount();assert.equal((await save(a,{...payload,passportNumber:'forbidden'})).ok,false);
 assert.equal((await save(a,{...payload,inventory:{assets:[{recordId:'same'},{recordId:'same'}]}})).code,'DRAFT_STABLE_ID_DUPLICATE');
 assert.equal((await save(a,{...payload,inventory:{assets:[{recordId:'one',relatedAssetRefs:'not-array'}]}})).code,'DRAFT_REFERENCE_INVALID');a.sql.close();
});
