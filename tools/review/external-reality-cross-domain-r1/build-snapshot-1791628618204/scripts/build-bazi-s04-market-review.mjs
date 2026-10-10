import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {MARKET_VERSION,MARKET_HEADINGS,evaluateMarketReading} from '../functions/personal-reading/narrative/bazi-s04-market-reading.js';
import {verifyReportLocaleParity} from '../functions/personal-reading/narrative/report-locale-parity.js';
import {editFrozenMarketCandidate} from '../functions/personal-reading/narrative/bazi-s04-market-editorial.js';
import {editFrozenWealthCandidate} from '../functions/personal-reading/narrative/bazi-s05-market-editorial.js';
import {WEALTH_VERSION,WEALTH_HEADINGS} from '../functions/personal-reading/narrative/bazi-s05-market-reading.js';
const wealth=process.env.RNT2_REVIEW_SECTION==='S05',version=wealth?WEALTH_VERSION:MARKET_VERSION,headings=wealth?WEALTH_HEADINGS:MARKET_HEADINGS;
const folder=process.env.RNT2_CSD_SNAPSHOT_DIR;
if(!folder)throw Error('FROZEN_V4_SNAPSHOT_FOLDER_REQUIRED');
const out='docs/acceptance/report-narrative-t2-r1/bazi/'+(wealth?'s05-market-v1':'s04-csd-v4'),records={},originals={};
for(const locale of ['zh-Hans','en']){
 const record=JSON.parse(fs.readFileSync(`${folder}/rnt2-csd-${locale}.json`)),{artifactDigest,...seed}=record;
 assert.equal(await sha256Stable(seed),artifactDigest);assert.equal(record.identity.successor,version);assert.equal(record.identity.locale,locale);
 assert.equal(record.result.brief.briefSemanticDigest,record.identity.briefDigest);
 assert.equal(record.result.internalOnly.providerAttemptCount,1);assert.equal(record.result.internalOnly.repairCount||0,0);
 originals[locale]=record;records[locale]=record;
 const auditFile=`${folder}/rnt2-csd-audit-${locale}.json`;
 if(fs.existsSync(auditFile)){
  const audit=JSON.parse(fs.readFileSync(auditFile)),{artifactDigest:auditDigest,...auditSeed}=audit;
  assert.equal(await sha256Stable(auditSeed),auditDigest);assert.equal(audit.sourceArtifactDigest,artifactDigest);
  assert.equal(await sha256Stable(audit.result.candidate),await sha256Stable((await (wealth?editFrozenWealthCandidate:editFrozenMarketCandidate)(record.result.candidate,locale)).candidate));
  assert.equal(audit.result.brief.briefSemanticDigest,record.result.brief.briefSemanticDigest);records[locale]=audit;
 }
}
const zh=records['zh-Hans'].result,en=records.en.result;
const parity=verifyReportLocaleParity({zhBrief:zh.brief,enBrief:en.brief,zhCandidate:zh.candidate,enCandidate:en.candidate});
assert.equal(zh.brief.sourceSemanticDigest,en.brief.sourceSemanticDigest);
const quality=Object.fromEntries(Object.entries(records).map(([l,r])=>[l,evaluateMarketReading({brief:r.result.brief,candidate:r.result.candidate,verification:r.result.verification})]));
const ready=parity.accepted&&Object.entries(records).every(([l,r])=>quality[l].accepted&&r.result.verification?.accepted&&r.result.internalOnly.providerExecution==='LIVE_ADAPTER'&&!r.result.internalOnly.fallbackUsed);
const usage=Object.values(records).flatMap(r=>[r.result.usageRecord,...(r.result.verificationUsageRecords||[]),...(r.result.reviewAudit?.usageRecords||[])]).filter(Boolean);
const predecessor=JSON.parse(fs.readFileSync('docs/acceptance/report-narrative-t2-r1/bazi/s04-csd-v3/REVIEW-EVIDENCE.json'));
const evidence={version,state:ready?'TECHNICAL_PASS / EDITORIAL_AUTOMATED_PASS / OWNER_ACCEPTANCE_PENDING':'NOT_READY_FOR_OWNER_REVIEW',ownerAcceptance:'PENDING',productionActivated:false,predecessor:{version:'V3',ownerAcceptance:'REJECT',reasons:['TOO_LONG','TOO_ABSTRACT','TOO_CONSULTING_LIKE','BAZI_IDENTITY_TOO_WEAK','CUSTOMER_CANNOT_SEE_HOW_THE_CHART_PRODUCED_THE_READING'],artifactDigests:Object.fromEntries(Object.entries(predecessor.records).map(([l,r])=>[l,r.artifactDigest]))},parity,quality,usage:{writerRequests:2,writerRepairs:0,regenerations:0,assistantEditorialRevisions:Object.values(records).filter(r=>r.result.reviewAudit?.editorialRevision).length,semanticReviews:Object.values(records).reduce((n,r)=>n+(r.result.internalOnly.semanticReviewCalls||0)+(r.result.reviewAudit?.reviewCalls||0),0),inputTokens:usage.reduce((n,r)=>n+r.inputTokens,0),outputTokens:usage.reduce((n,r)=>n+r.outputTokens,0),estimatedProviderCost:usage.reduce((n,r)=>n+r.estimatedProviderCost,0)},...(!wealth||Object.values(records).some(r=>r.result.reviewAudit)?{originals}:{}),records};
if(wealth)evidence.predecessor=JSON.parse(fs.readFileSync('docs/acceptance/report-narrative-t2-r1/bazi/s04-csd-v4/OWNER-ACCEPTANCE.json'));
let ownerAccepted=false;
if(fs.existsSync(out+'/OWNER-ACCEPTANCE.json')){const decision=JSON.parse(fs.readFileSync(out+'/OWNER-ACCEPTANCE.json'));const {acceptanceDigest,...seed}=decision;assert.equal(await sha256Stable(seed),acceptanceDigest);for(const l of ['zh-Hans','en'])assert.equal(decision.locales[l].artifactDigest,records[l].artifactDigest);ownerAccepted=decision.decision==='ACCEPT';if(ownerAccepted){evidence.ownerAcceptance='ACCEPT';evidence.state='TECHNICAL_PASS / EDITORIAL_AUTOMATED_PASS / OWNER_ACCEPTED';evidence.ownerDecision=decision;}}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(`${out}/REVIEW-EVIDENCE.json`,JSON.stringify(evidence)+'\n');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=Object.entries(records).map(([locale,record])=>`<section lang="${locale}" id="${locale}"><h2>${locale==='zh-Hans'?'中文':'English'}</h2>${(record.result.candidate?.blocks||[]).map((b,i)=>`<article><h3>${String(i+1).padStart(2,'0')}｜${esc(headings[b.role]?.[locale==='zh-Hans'?0:1]||b.role)}</h3>${b.text.split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join('')}</article>`).join('')}</section>`).join('');
const technical={state:evidence.state,ownerAcceptance:evidence.ownerAcceptance,productionActivated:false,predecessor:evidence.predecessor,parity,quality,usage:evidence.usage,locales:Object.fromEntries(Object.entries(records).map(([l,r])=>[l,{artifactDigest:r.artifactDigest,sourceClaims:r.result.brief.claims,IR:r.result.wealthNarrativeIR||r.result.careerNarrativeIR,verification:r.result.verification,provider:r.result.internalOnly,editorialRevision:r.result.reviewAudit}]))};
fs.writeFileSync(`${out}/review.html`,`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BaZi · ${wealth?'S05 财富解读':'S04 事业发展'} · T2 Human Review</title><style>body{margin:0;background:#f4f0e8;color:#243b45;font:18px/1.9 Georgia,"Noto Serif SC",serif}main{max-width:840px;margin:auto;padding:32px 22px}header,section,details{background:#fffdf8;border:1px solid #dfd4bf;padding:28px 38px;margin-bottom:24px}h1,h2,h3,nav,summary{font-family:system-ui;line-height:1.45}h1{font-size:26px}h2{font-size:23px}h3{font-size:20px;color:#796238;margin-top:30px}p{margin:14px 0}nav a{margin-right:24px;color:#28566b}small{font:13px/1.6 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 monospace}@media(max-width:600px){main{padding:12px}header,section,details{padding:20px}body{font-size:17px}}</style><main><header><h1>BaZi · ${wealth?'S05 财富解读':'S04 事业发展'} · T2 Human Review</h1><p>Market-Style BaZi ${wealth?'Wealth Reading V1':'Reading V4'}</p><small>${wealth?'单轮 T2 原稿 · 冻结编辑稿另行独立复核':'单轮 T2 原稿，经助手编辑并独立复核 · One T2 draft per language, edited and independently reviewed'}</small><nav><a href="#zh-Hans">中文</a><a href="#en">English</a></nav><small>${ownerAccepted?'人工验收通过 · OWNER_ACCEPTED · Review only':ready?'待人工验收 · Review only':'自动审核未通过 · 待修正，不可验收'} · 依据已保存的 2026-09-21 时间窗口</small></header>${sections}<details><summary>Technical Evidence</summary><pre>${esc(JSON.stringify(technical,null,2))}</pre></details></main></html>`);
console.log(JSON.stringify({state:evidence.state,quality,parity,usage:evidence.usage},null,2));
