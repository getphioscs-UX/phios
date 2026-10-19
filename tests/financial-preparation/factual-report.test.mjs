import test from 'node:test';import assert from 'node:assert/strict';
import {localAccount} from './local-account.mjs';
import {draftApi} from '../../functions/account/financial-will-draft-store.js';
import {createFinancialGrant,revokeFinancialGrant} from '../../functions/professional/consent/financial-purpose-grants.js';
import {buildFinancialReportEvidence,runFinancialReportJob,openFinancialReport} from '../../functions/financial/holistic-planning-product/factual-report-job.js';
import {syntheticFactualCandidate,validateFactualCandidate,compileFactualNarrative} from '../../functions/financial/holistic-planning-product/factual-report-narrative.js';
async function fixture(){const a=localAccount();const response=await draftApi(a.context({action:'save',draftType:'FINANCIAL',purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString(),payload:{asOfDate:'2026-10-19',baseCurrency:'MYR',monthlyIncome:'8000',monthlyExpenses:'2000',liquidAssets:'12000',investments:'0',property:'0',liabilities:'1000',monthlyDebtRepayment:'100'}}));const saved=await response.json();const grant=await createFinancialGrant(a.context({}),{source:saved.savedDraftRef,purpose:'REPORT',language:'en',scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions'],expiresAt:saved.expiresAt});return {a,request:{savedDraftRef:saved.savedDraftRef,grantId:grant.grantId,language:'en'}};}
test('report rejects fabricated value, unsupported prose, evidence drift and personalized action',async()=>{
 const {a,request}=await fixture(),e=await buildFinancialReportEvidence(a.context({}),request),valid=syntheticFactualCandidate(e,'en');assert.equal(compileFactualNarrative(valid,e).sections.length,12);
 for(const mutate of [c=>c.sections[0].nodes[1].value=999999,c=>c.sections[0].nodes[0].text='Buy this stock now',c=>c.sections[0].nodes[0].claimCode='GUARANTEED_RETURN',c=>c.evidenceDigest='old',c=>c.sourceRef='other-version',c=>c.sections.pop(),c=>c.sections[0].nodes[1].metricRef='invented']){const c=structuredClone(valid);mutate(c);assert.throws(()=>validateFactualCandidate(c,e));}a.sql.close();
});
test('candidate persists through render failure; new invocation reuses it and account open never regenerates',async()=>{
 const {a,request}=await fixture();const failed=await runFinancialReportJob(a.context({}),request,{synthetic:true,renderFailure:true});assert.equal(failed.state,'RETRYABLE');
 const result=await runFinancialReportJob(a.context({}),request,{synthetic:true});assert.equal(result.state,'ACCOUNT_AVAILABLE');assert.equal(result.providerCalls,0);assert.equal(result.history.filter(x=>x==='DISPATCHED').length,1);
 const opened=await openFinancialReport(a.context({}),{...request,jobId:result.jobId});assert.equal(opened.artifact.generatedCopy.length,12);assert(opened.html.includes('11,000.00 MYR'));assert(opened.artifact.publicationIR.report.sourceReferences[0].immutableLocator.evidenceDigest);
 const again=await runFinancialReportJob(a.context({}),request,{synthetic:true});assert.equal(again.cacheHit,true);
 await revokeFinancialGrant(a.context({}),request.grantId);await assert.rejects(openFinancialReport(a.context({}),{...request,jobId:result.jobId}),{code:'PURPOSE_GRANT_INACTIVE'});a.sql.close();
});
test('production and caller-supplied synthetic flag cannot dispatch a provider',async()=>{const {a,request}=await fixture();a.env.PHIOS_ENVIRONMENT='production';const result=await runFinancialReportJob(a.context({}),request,{synthetic:true});assert.equal(result.state,'BLOCKED');assert.equal(result.providerCalls,0);assert.equal(a.sql.prepare('SELECT COUNT(*) AS n FROM report_generation_state').get().n,0);a.sql.close();});

test('missing REPORT grant, injected prose, uncertain dispatch and expired source stay fail-closed',async()=>{
 const {a,request}=await fixture();await assert.rejects(buildFinancialReportEvidence(a.context({}),{...request,grantId:'missing'}),{code:'PURPOSE_GRANT_INACTIVE'});
 const e=await buildFinancialReportEvidence(a.context({}),request),candidate=syntheticFactualCandidate(e,'en');candidate.sections[0].nodes[0].text='<script>fetch("https://example.invalid/private")</script>';assert.throws(()=>validateFactualCandidate(candidate,e));
 const result=await runFinancialReportJob(a.context({}),request,{synthetic:true,renderFailure:true});const row=a.sql.prepare("SELECT * FROM report_generation_state WHERE state_key='FINANCE_JOB'").get(),job=JSON.parse(row.value_json);job.state='DISPATCHED_OUTCOME_UNKNOWN';a.sql.prepare("UPDATE report_generation_state SET value_json=? WHERE state_key='FINANCE_JOB'").run(JSON.stringify(job));
 await assert.rejects(runFinancialReportJob(a.context({}),request,{synthetic:true}),{code:'FINANCE_PROVIDER_RECONCILIATION_REQUIRED'});assert.equal(JSON.parse(a.sql.prepare("SELECT value_json FROM report_generation_state WHERE state_key='FINANCE_JOB'").get().value_json).history.filter(s=>s==='DISPATCHED').length,1);
 a.sql.prepare("UPDATE account_financial_will_drafts SET expires_at=1 WHERE draft_id=?").run(request.savedDraftRef.draftId);await assert.rejects(openFinancialReport(a.context({}),{...request,jobId:result.jobId}),{code:'DRAFT_EXPIRED'});a.sql.close();
});
