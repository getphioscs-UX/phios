import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {editFrozenWealthCandidate,WEALTH_EDIT_VERSION} from '../functions/personal-reading/narrative/bazi-s05-market-editorial.js';
import {evaluateMarketReading} from '../functions/personal-reading/narrative/bazi-s04-market-reading.js';
import {WEALTH_HEADINGS} from '../functions/personal-reading/narrative/bazi-s05-market-reading.js';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';
const folder='docs/acceptance/report-narrative-t2-r1/bazi/s05-market-v1';
const source=JSON.parse(fs.readFileSync(folder+'/REVIEW-EVIDENCE.json'));
const drafts={};
for(const locale of ['zh-Hans','en']){
 const record=(source.originals||source.records)[locale],{artifactDigest,...seed}=record;
 assert.equal(await sha256Stable(seed),artifactDigest);
 const {candidate,audit}=await editFrozenWealthCandidate(record.result.candidate,locale);
 assert.deepEqual(candidate.blocks.map(({text,...metadata})=>metadata),record.result.candidate.blocks.map(({text,...metadata})=>metadata));
 const structural=evaluateMarketReading({brief:record.result.brief,candidate});
 assert(structural.reasons.every(reason=>reason.startsWith('MARKET_REVIEW:')),JSON.stringify(structural));
 assert.equal(structural.accepted,false,'A draft must not inherit the original semantic approval');
 const verification=await verifyReportSectionComposition({brief:record.result.brief,candidate});
 assert(verification.reasons.every(r=>r==='SEMANTIC_REVIEW_REQUIRED'||r.startsWith('CLAIM_MEANING_NOT_VERIFIED:')||r.startsWith('MARKET_REVIEW:')),JSON.stringify(verification.reasons));
 await assert.rejects(()=>editFrozenWealthCandidate({...record.result.candidate,untrusted:true},locale),/SOURCE_MISMATCH/);
 drafts[locale]={sourceArtifactDigest:artifactDigest,sourceBriefDigest:record.identity.briefDigest,candidate,audit,structural};
}
const payload={version:WEALTH_EDIT_VERSION,state:'EDITORIAL_DRAFT_PENDING_FRESH_INDEPENDENT_REVIEW',ownerAcceptance:'PENDING',productionActivated:false,additionalProviderCalls:0,drafts};
fs.writeFileSync(folder+'/EDITORIAL-DRAFT.json',JSON.stringify({...payload,draftDigest:await sha256Stable(payload)})+'\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=Object.entries(drafts).map(([l,r])=>`<section lang="${l}" id="${l}"><h2>${l==='en'?'English':'中文'}</h2>${r.candidate.blocks.map((b,i)=>`<article><h3>${i+1}｜${esc(WEALTH_HEADINGS[b.role][l==='en'?1:0])}</h3>${b.text.split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join('')}</article>`).join('')}</section>`).join('');
fs.writeFileSync(folder+'/editorial-draft.html',`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>S05 财富解读 · 精简修改稿</title><style>body{margin:0;background:#f4f0e8;color:#243b45;font:18px/1.9 Georgia,"Noto Serif SC",serif}main{max-width:840px;margin:auto;padding:28px 20px}header,section{background:#fffdf8;border:1px solid #dfd4bf;padding:28px 36px;margin-bottom:24px}h1,h2,h3,nav,small{font-family:system-ui;line-height:1.5}h1{font-size:26px}h3{font-size:20px;color:#796238;margin-top:30px}nav a{margin-right:24px;color:#28566b}small{font-size:13px}p{margin:14px 0}@media(max-width:600px){main{padding:12px}header,section{padding:20px}body{font-size:17px}}</style><main><header><h1>S05 财富解读 · 精简修改稿</h1><p>助手编辑 · 尚未独立复核，不可验收或发布</p><small>原稿及原始审核记录另行保留。本稿没有继承原稿的审核结论。依据已保存的 2026-09-21 时间窗口。</small><nav><a href="#zh-Hans">中文</a><a href="#en">English</a></nav></header>${sections}</main></html>`);
console.log(JSON.stringify({state:payload.state,locales:Object.fromEntries(Object.entries(drafts).map(([l,r])=>[l,{hanCharacters:r.structural.hanCharacters,words:r.structural.words,candidateDigest:r.audit.afterDigest}]))},null,2));
