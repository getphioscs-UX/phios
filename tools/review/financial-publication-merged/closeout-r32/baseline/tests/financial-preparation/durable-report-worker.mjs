import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {localAccount} from './local-account.mjs';
import {draftApi} from '../../functions/account/financial-will-draft-store.js';
import {createFinancialGrant,FINANCIAL_REPORT_SCOPES} from '../../functions/professional/consent/financial-purpose-grants.js';
import {runFinancialReportJob,openFinancialReport} from '../../functions/financial/holistic-planning-product/factual-report-job.js';
const [mode,root]=process.argv.slice(2);if(!['prepare','resume','open'].includes(mode)||!root?.includes('finance-durable-'))throw Error('LOCAL_FIXTURE_ARGUMENTS_REQUIRED');fs.mkdirSync(root,{recursive:true});
const a=localAccount({databasePath:path.join(root,'state.sqlite'),privateDirectory:path.join(root,'private')}),file=path.join(root,'request.json');
try{
 if(mode==='prepare'){
  const r=await draftApi(a.context({action:'save',draftType:'FINANCIAL',purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString(),payload:{asOfDate:'2026-10-19',baseCurrency:'MYR',monthlyIncome:8000,monthlyExpenses:2000,liquidAssets:12000,investments:0,property:0,liabilities:1000,monthlyDebtRepayment:100}}));const saved=await r.json();assert.equal(r.status,200);
  const grant=await createFinancialGrant(a.context({}),{source:saved.savedDraftRef,purpose:'REPORT',language:'en',scopes:FINANCIAL_REPORT_SCOPES,expiresAt:saved.expiresAt});const request={savedDraftRef:saved.savedDraftRef,grantId:grant.grantId,language:'en'};fs.writeFileSync(file,JSON.stringify(request));const job=await runFinancialReportJob(a.context({}),request,{synthetic:true,renderFailure:true});assert.equal(job.state,'RETRYABLE');console.log('RETRYABLE_CANDIDATE_DURABLE');
 }else{
  const request=JSON.parse(fs.readFileSync(file));const result=await runFinancialReportJob(a.context({}),request,{synthetic:true});assert.equal(result.state,'ACCOUNT_AVAILABLE');assert.equal(result.history.filter(x=>x==='DISPATCHED').length,1);const opened=await openFinancialReport(a.context({}),{...request,jobId:result.jobId});assert.equal(opened.providerCalls,0);
  const receipt={state:result.state,jobId:result.jobId,artifactDigest:opened.artifact.artifactDigest,generatedSections:opened.artifact.generatedCopy.length,dispatchCount:result.history.filter(x=>x==='DISPATCHED').length,providerCalls:0};if(mode==='resume')fs.writeFileSync(path.join(root,'artifact-receipt.json'),JSON.stringify(receipt));else assert.deepEqual(receipt,JSON.parse(fs.readFileSync(path.join(root,'artifact-receipt.json'))));console.log(mode==='resume'?'ACCOUNT_AVAILABLE_NEW_PROCESS':'OPENED_SAME_ARTIFACT_THIRD_PROCESS');
 }
}finally{a.sql.close();}
