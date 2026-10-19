import test from 'node:test';import assert from 'node:assert/strict';
import {localAccount} from './local-account.mjs';
import {draftApi} from '../../functions/account/financial-will-draft-store.js';
import {evaluateFinancialCapabilities,readOwnerRegistry} from '../../functions/professional/access/financial-capability-owner.js';
import {inspectOfficialSource,reviewOfficialSource} from '../../functions/financial/professional-review/official-source-lifecycle.js';
test('server capability owner ignores client runtime claims; preparation stays available',async()=>{
 const a=localAccount();const r=await draftApi(a.context({action:'save',draftType:'FINANCIAL',payload:{asOfDate:'2026-10-19',baseCurrency:'MYR',monthlyIncome:'100'},purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString()}));const saved=await r.json();assert.equal(r.status,200);
 const p=await evaluateFinancialCapabilities(a.context({runtime:{allReady:true}}),{savedDraftRef:saved.savedDraftRef});
 assert.equal(p.decisions.find(x=>x.feature==='BASIC_PREPARATION').status,'READY');assert.equal(p.decisions.find(x=>x.feature==='WILL_PREPARATION').status,'READY');assert.notEqual(p.decisions.find(x=>x.feature==='WILL_SIGNING_TEXT').status,'READY');assert.equal(p.authorizationReusable,false);
 a.env.ASSETS={fetch:async()=>Response.json({environment:'TEST_ONLY'})};await assert.rejects(readOwnerRegistry(a.context({}),'/content/anything'),{code:'TEST_REGISTRY_FORBIDDEN'});a.sql.close();
});
test('official source diff is archived and queued; fetch never promotes approval',()=>{const source={id:'fixture',url:'https://example.invalid/official',impacts:['RENTAL']};const first=inspectOfficialSource(source,new TextEncoder().encode('TEST_ONLY_V1'));const next=inspectOfficialSource(source,new TextEncoder().encode('TEST_ONLY_V2'),first);assert.equal(next.state,'CHANGE_DETECTED');assert.equal(next.effectiveApproval,false);assert.throws(()=>reviewOfficialSource(next,{action:'APPROVE_EFFECTIVE'}));const withdrawn=reviewOfficialSource(next,{reviewerRef:'TEST_ONLY_REVIEWER',receiptRef:'TEST_ONLY_RECEIPT',sourceDigest:next.digest,action:'WITHDRAW'});assert.equal(withdrawn.state,'WITHDRAWN');});
