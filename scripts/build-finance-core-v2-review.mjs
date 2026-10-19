import fs from 'node:fs';
import assert from 'node:assert/strict';
import {localAccount} from '../tests/financial-preparation/local-account.mjs';
import {draftApi} from '../functions/account/financial-will-draft-store.js';
import {createFinancialGrant} from '../functions/professional/consent/financial-purpose-grants.js';
import {runFinancialReportJob,openFinancialReport} from '../functions/financial/holistic-planning-product/factual-report-job.js';
import {FINANCE_PUBLICATION_VERSION} from '../functions/financial/holistic-planning-product/report-publication-v2.js';
import {commerceProduct,commerceOrderProduct} from '../functions/pws/commercial/stripe-product-registry.js';
import {quoteReportPresentation} from '../functions/pws/commercial/report-successor-contract.js';
import {reportEconomics} from '../functions/pws/commercial/commerce-economics-policy.js';
import {onRequestPost as financialReportApi} from '../functions/api/account-financial-report.js';
const directory='tools/review/finance-core-v2';fs.mkdirSync(directory,{recursive:true});
const results=[];
for(const state of ['complete','shortfall','missing'])for(const language of ['zh-Hans','en']){
 const a=localAccount();
 try{
 const row=value=>({value,representation:'EXACT',disclosureState:'SELF_REPORTED',currency:'MYR'});
 const payload={asOfDate:'2026-10-20',baseCurrency:'MYR',inventory:{people:[{personId:'SELF',label:language==='en'?'Sample household':'合成样本家庭'}],assets:state==='missing'?[]:[{...row(18000),assetId:'bank',type:'BANK_ACCOUNT',ownershipMode:'SOLE'}],liabilities:state==='missing'?[]:[{...row(10000),liabilityId:'loan',repayment:row(500)}],incomeStreams:[{...row(8000),grossOrNet:'NET',frequency:'MONTHLY'}],expenses:state==='missing'?[]:[{...row(state==='shortfall'?9000:2500),type:'ESSENTIAL',frequency:'MONTHLY'}],guarantees:[],policies:[],goals:[],assumptions:[],disclosure:{guarantees:'NOT_APPLICABLE',policies:'NOT_APPLICABLE',goals:'NOT_APPLICABLE'}}};
 for(const liability of payload.inventory.liabilities)delete liability.repayment.currency;
 const response=await draftApi(a.context({action:'save',draftType:'FINANCIAL',purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString(),payload}));const saved=await response.json();assert(saved.savedDraftRef,JSON.stringify(saved));
 const grant=await createFinancialGrant(a.context({}),{source:saved.savedDraftRef,purpose:'REPORT',language,scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions'],expiresAt:saved.expiresAt});
 const request={savedDraftRef:saved.savedDraftRef,grantId:grant.grantId,language};
 const previewResponse=await financialReportApi(a.context({...request,action:'preview'}));assert.equal(previewResponse.status,200);const preview=await previewResponse.json();assert.equal(preview.providerCalls,0);assert.equal(preview.chapters.length,16);assert.equal(preview.price.includedFollowups,4);
 const legacy=await runFinancialReportJob(a.context({}),request,{synthetic:true});
 const result=await runFinancialReportJob(a.context({}),{...request,publicationVersion:FINANCE_PUBLICATION_VERSION},{synthetic:true});assert.notEqual(result.jobId,legacy.jobId);
 const opened=await openFinancialReport(a.context({}),{...request,jobId:result.jobId});
 assert.equal(opened.artifact.generatedCopy.length,16);assert.equal((opened.html.match(/data-finance-page=/g)||[]).length,16);
 const old=await openFinancialReport(a.context({}),{...request,jobId:legacy.jobId});assert.equal(old.artifact.generatedCopy.length,12);
 const again=await runFinancialReportJob(a.context({}),{...request,publicationVersion:FINANCE_PUBLICATION_VERSION},{synthetic:true});assert(again.cacheHit);
 const pages=opened.artifact.publicationIR.publication.pages;
 if(state==='missing'){assert.equal(pages[4].values.find(x=>x.metricRef==='cashFlowSurplus').value,null);assert(opened.html.includes(language==='en'?'Not provided':'待补充'));}
 if(state==='shortfall')assert(pages[4].values.find(x=>x.metricRef==='cashFlowDeficit').value>0);
 if(language==='en')assert(!/[\u3400-\u9fff]/u.test(opened.html.replace(/<style>[\s\S]*?<\/style>/,'')));
 const file=`${state}-${language}.html`;fs.writeFileSync(`${directory}/${file}`,opened.html);results.push({state,language,file,pages:16,immutableLegacyReopen:true,cacheHit:true,providerCalls:0});
 }finally{a.sql.close();}
}
const current=commerceProduct('COM-REPORT-FINANCIAL-FULL');assert.equal(current.amountMinor,6900);assert.equal(current.qaPriceId,null);assert(current.checkoutBlockedReason);
assert.equal(reportEconomics(current.productId).providerCapUsd,5);assert.equal(reportEconomics(current.productId).includedFollowups,4);
const presentation={reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'};
assert.equal(quoteReportPresentation('FINANCIAL_FULL_REPORT',presentation).amountMinor,6900);
assert.equal(quoteReportPresentation('FINANCIAL_FULL_REPORT',presentation,[],'PHIOS-COMMERCE-2026-10-09').amountMinor,15900);
const historical=commerceOrderProduct({product_id:current.productId,qa_price_id:'price_1UGr3gBEKXJyHMkKAmHkIrmz',context_json:'{}',environment:'QA'});assert.equal(historical.amountMinor,15900);assert.equal(historical.professionalReviewRequired,true);
fs.writeFileSync(`${directory}/index.html`,`<!doctype html><meta charset="utf-8"><title>Finance core v2 review</title><h1>RM69 · 16 页财务报告样页</h1><p>合成资料；版式候选。尚未开通付费生成。</p><ul>${results.map(r=>`<li><a href="${r.file}">${r.state} · ${r.language}</a></li>`).join('')}</ul>`);
const publicDirectory='professional/financial/report-preview';fs.mkdirSync(publicDirectory,{recursive:true});
for(const result of results)fs.copyFileSync(`${directory}/${result.file}`,`${publicDirectory}/${result.file}`);
fs.writeFileSync(`${publicDirectory}/index.html`,`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RM69 · Financial report preview</title><style>body{max-width:850px;margin:40px auto;padding:24px;font:18px/1.8 system-ui;color:#193d3a;background:#fffdf6}a{color:#235f50}li{margin:16px 0}</style><h1>RM69 · 个人与家庭财务准备报告</h1><p>16 页核心结构，中英文分别排版；贷款与租金专项作为附录。以下为合成资料样页，目前付费生成尚未开放。</p><h2>RM69 · Personal &amp; Household Financial Preparation Report</h2><p>Sixteen core pages, with separate Chinese and English layouts. Loan and rental details are optional appendices. These synthetic previews are layout candidates. Paid generation is not available yet.</p><ul>${results.map(r=>`<li><a href="${r.file}">${({complete:'完整资料 / Complete',shortfall:'结余不足 / Shortfall',missing:'明显缺失 / Missing'})[r.state]} · ${r.language==='en'?'English':'中文'}</a></li>`).join('')}</ul><a href="/professional/financial/">返回财务入口 / Back to finances</a></html>`);
fs.writeFileSync(`${directory}/verification.json`,JSON.stringify({status:'LOCAL_SYNTHETIC_ONLY',results,newOrderAmountMinor:6900,oldOrderAmountMinor:15900,checkout:'BLOCKED_UNTIL_NEW_PRICE_AND_PAID_DELIVERY_BINDING',visualReview:'PENDING'},null,2)+'\n');
console.log('PASS: six saved-source samples, 16 pages, legacy reopen, idempotence, missing/shortfall, RM69 and historical RM159');
