import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {RECONCILIATION_SECTIONS} from '../functions/personal-reading/narrative/bazi-s02-s03-reconciliation.js';
import {evaluateMarketReading} from '../functions/personal-reading/narrative/bazi-s04-market-reading.js';
import {verifyReportLocaleParity} from '../functions/personal-reading/narrative/report-locale-parity.js';
const input=process.env.RNT2_RECONCILED_SNAPSHOT_DIR;
if(!input)throw Error('FROZEN_RECONCILED_SNAPSHOTS_REQUIRED');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [sectionKey,spec] of Object.entries(RECONCILIATION_SECTIONS)){
 const short=sectionKey.slice(0,3).toLowerCase(),records={},quality={};
 for(const l of ['zh-Hans','en']){
  const r=JSON.parse(fs.readFileSync(`${input}/${short}-${l}.json`)),{artifactDigest,...seed}=r;
  assert.equal(await sha256Stable(seed),artifactDigest);assert.equal(r.identity.locale,l);assert.equal(r.result.brief.sectionKey,sectionKey);
  assert.equal(r.result.brief.briefSemanticDigest,r.identity.briefDigest);assert.equal(r.result.internalOnly.providerAttemptCount,1);assert.equal(r.result.internalOnly.repairCount||0,0);
  records[l]=r;quality[l]=evaluateMarketReading({brief:r.result.brief,candidate:r.result.candidate,verification:r.result.verification});
 }
 const zh=records['zh-Hans'].result,en=records.en.result;
 const parity=verifyReportLocaleParity({zhBrief:zh.brief,enBrief:en.brief,zhCandidate:zh.candidate,enCandidate:en.candidate});
 const ready=parity.accepted&&Object.entries(records).every(([l,r])=>quality[l].accepted&&r.result.verification?.accepted&&!r.result.internalOnly.fallbackUsed&&r.result.internalOnly.providerExecution==='LIVE_ADAPTER');
 const usageRecords=Object.values(records).flatMap(r=>[r.result.usageRecord,...(r.result.verificationUsageRecords||[])]).filter(Boolean);
 const usage={writers:2,independentReviews:Object.values(records).reduce((n,r)=>n+(r.result.internalOnly.semanticReviewCalls||0),0),repairs:0,regenerations:0,inputTokens:usageRecords.reduce((n,r)=>n+r.inputTokens,0),outputTokens:usageRecords.reduce((n,r)=>n+r.outputTokens,0),estimatedProviderCost:usageRecords.reduce((n,r)=>n+r.estimatedProviderCost,0)};
 const evidence={version:zh.brief.successorVersion,sectionKey,state:ready?'TECHNICAL_PASS / EDITORIAL_AUTOMATED_PASS / OWNER_ACCEPTANCE_PENDING':'NOT_READY_FOR_OWNER_REVIEW',ownerAcceptance:'PENDING',productionActivated:false,parity,quality,usage,records};
 const out=`docs/acceptance/report-narrative-t2-r1/bazi/${short}-market-v1`;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/REVIEW-EVIDENCE.json',JSON.stringify(evidence)+'\n');
 const content=Object.entries(records).map(([l,r])=>`<section id="${l}" lang="${l}"><h2>${l==='en'?'English':'中文'}</h2>${(r.result.candidate?.blocks||[]).map((b,i)=>`<article><h3>${i+1}｜${esc(r.result.brief.marketContract.headings[b.role][l==='en'?1:0])}</h3>${b.text.split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join('')}</article>`).join('')}</section>`).join('');
 fs.writeFileSync(out+'/review.html',`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${short.toUpperCase()} · ${spec.title[0]}</title><style>body{margin:0;background:#f4f0e8;color:#243b45;font:18px/1.9 Georgia,"Noto Serif SC",serif}main{max-width:840px;margin:auto;padding:28px 20px}header,section,details{background:#fffdf8;border:1px solid #dfd4bf;padding:28px 36px;margin-bottom:24px}h1,h2,h3,nav,summary,small{font-family:system-ui;line-height:1.5}h1{font-size:26px}h3{font-size:20px;color:#796238;margin-top:30px}nav a{margin-right:24px;color:#28566b}small{font-size:13px}p{margin:14px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 monospace}@media(max-width:600px){main{padding:12px}header,section,details{padding:20px}body{font-size:17px}}</style><main><header><h1>${short.toUpperCase()} · ${spec.title[0]}</h1><p>${spec.title[1]}</p><nav><a href="#zh-Hans">中文</a><a href="#en">English</a></nav><small>${ready?'待人工验收 · Review only':'自动审核未通过 · 待修正，不可验收'} · 单轮 T2 原稿 · 依据已保存的 2026-09-21 时间窗口</small></header>${content}<details><summary>Technical Evidence</summary><pre>${esc(JSON.stringify({state:evidence.state,parity,quality,usage,artifacts:Object.fromEntries(Object.entries(records).map(([l,r])=>[l,r.artifactDigest]))},null,2))}</pre></details></main></html>`);
 console.log(JSON.stringify({sectionKey,state:evidence.state,quality,usage},null,2));
}
