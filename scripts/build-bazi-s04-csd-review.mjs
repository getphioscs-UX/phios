import {naturalizeCareerLabels} from '../functions/personal-reading/narrative/bazi-s04-career-compression.js';
import fs from 'node:fs';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {crossSubjectDistinguishability} from '../functions/personal-reading/narrative/report-editorial-quality-r4.js';
import {verifyReportLocaleParity} from '../functions/personal-reading/narrative/report-locale-parity.js';
const folder=process.env.RNT2_CSD_SNAPSHOT_DIR;
if(!folder)throw Error('RNT2_CSD_SNAPSHOT_DIR_REQUIRED: import existing frozen QA records; this command never generates');
const v3=process.env.RNT2_CSD_VERSION==='3';
const out='docs/acceptance/report-narrative-t2-r1/bazi/s04-csd-v'+(v3?'3':'2');
const ids=v3?['zh-Hans','en']:['zh-Hans','en','BAZI-FP-W17-001','BAZI-FP-W17-031'];
const records={},initialReviews={},auditHistory={};
for(const id of ids){
 const file=`${folder}/rnt2-csd-${id}.json`;
 if(!fs.existsSync(file))throw Error('MISSING_FROZEN_REVIEW:'+id);
 const record=JSON.parse(fs.readFileSync(file));const {artifactDigest,...payload}=record;
 if(await sha256Stable(payload)!==artifactDigest||!record.identity.successor?.startsWith('PHI-OS-BAZI-S04-CSD-v'+(v3?'3.':'2.'))||record.identity.briefDigest!==record.result.brief?.briefSemanticDigest)throw Error('SNAPSHOT_INTEGRITY_FAILED:'+id);
 if(record.identity.locale!==(id==='zh-Hans'?'zh-Hans':'en'))throw Error('SNAPSHOT_LOCALE_MISMATCH');
 initialReviews[id]={...(v3?{candidate:record.result.candidate}:{}),artifactDigest:record.artifactDigest,identity:record.identity,status:record.result.status,verification:record.result.verification,editorialQuality:record.result.editorialQuality,internalOnly:record.result.internalOnly};
 const auditFile=`${folder}/rnt2-csd-audit-${id}.json`;
 if(fs.existsSync(auditFile)){
  const audit=JSON.parse(fs.readFileSync(auditFile)),{artifactDigest:auditDigest,...auditSeed}=audit;
  if(await sha256Stable(auditSeed)!==auditDigest||audit.sourceArtifactDigest!==artifactDigest||await sha256Stable(audit.result.candidate)!==await sha256Stable(v3?(await naturalizeCareerLabels(record.result.candidate,record.result.locale)).candidate:record.result.candidate)||audit.result.brief.briefSemanticDigest!==record.result.brief.briefSemanticDigest)throw Error('AUDIT_INTEGRITY_FAILED:'+id);
  records[id]=audit;
  const priorFile=`${folder}/rnt2-csd-prior-audit-${id}.json`;
  if(fs.existsSync(priorFile)){
   const prior=JSON.parse(fs.readFileSync(priorFile)),{artifactDigest:priorDigest,...priorSeed}=prior;
   if(await sha256Stable(priorSeed)!==priorDigest||prior.sourceArtifactDigest!==artifactDigest||audit.result.reviewAudit.previousAuditDigest!==priorDigest)throw Error('PRIOR_AUDIT_INTEGRITY_FAILED:'+id);
   auditHistory[id]={artifactDigest:priorDigest,reviewAudit:prior.result.reviewAudit,status:prior.result.status,reasons:prior.result.verification.reasons};
  }
 }else records[id]=record;
}
const zh=records['zh-Hans'].result,en=records.en.result;
const rows=(v3?['en']:['en','BAZI-FP-W17-001','BAZI-FP-W17-031']).map(id=>({id,ir:records[id].result.careerNarrativeIR,text:records[id].result.candidate?.blocks.map(b=>b.text).join('\n')||''}));
const contractValidation=v3?JSON.parse(fs.readFileSync(out+'/CONTRACT-VALIDATION.json')):null;
const comparison=v3?contractValidation.crossSubject:crossSubjectDistinguishability(rows);
if(!v3){comparison.scope='THREE_FROZEN_LIVE_ENGLISH_CANDIDATES';comparison.liveCandidateComparison=true;comparison.comparisonMethod='Source-mechanism diversity and prose overlap, supported by each independent source-to-prose review; not owner acceptance';}
if(v3){comparison.liveCandidateComparison=false;comparison.limitation='Only the authorized baseline bilingual pair was generated; cross-subject evidence is deterministic source-derived IR, not live prose.';}
const parity=verifyReportLocaleParity({zhBrief:zh.brief,enBrief:en.brief,zhCandidate:zh.candidate,enCandidate:en.candidate});
const mechanismParity=JSON.stringify(zh.careerNarrativeIR.nodes.map(n=>[n.id,n.sourceClaimIds,n.scenarioClass]))===JSON.stringify(en.careerNarrativeIR.nodes.map(n=>[n.id,n.sourceClaimIds,n.scenarioClass]));
const localPass=Object.values(records).every(r=>r.result.verification?.technicalAccepted&&r.result.editorialQuality?.accepted&&r.result.internalOnly?.providerExecution==='LIVE_ADAPTER'&&!r.result.internalOnly?.fallbackUsed);
const ready=localPass&&comparison.accepted&&parity.accepted&&mechanismParity;
const usage=Object.values(records).flatMap(x=>[x.result.usageRecord,...(x.result.verificationUsageRecords||[]),...(x.result.reviewAudit?.usageRecords||[])]).concat(Object.values(auditHistory).flatMap(x=>x.reviewAudit.usageRecords||[])).filter(Boolean);
const requestSummary={initialGenerationRuns:Object.keys(records).length,writerRequests:Object.values(records).reduce((n,x)=>n+(x.result.internalOnly.providerAttemptCount||0),0),targetedRepairs:Object.values(records).reduce((n,x)=>n+(x.result.internalOnly.repairCount||0),0),transportRetries:Object.values(records).reduce((n,x)=>n+(x.result.internalOnly.attemptLog||[]).filter(a=>a.kind==='PROVIDER'&&a.state==='FAIL'&&a.retryAllowed).length,0),semanticReviewRequests:Object.values(records).reduce((n,x)=>n+(x.result.internalOnly.semanticReviewCalls||0)+(x.result.reviewAudit?.reviewCalls||0),0)+Object.values(auditHistory).reduce((n,x)=>n+(x.reviewAudit.reviewCalls||0),0),regenerationsAfterFreeze:0,inputTokens:usage.reduce((n,u)=>n+(u.inputTokens||0),0),outputTokens:usage.reduce((n,u)=>n+(u.outputTokens||0),0),estimatedProviderCost:usage.reduce((n,u)=>n+(u.estimatedProviderCost||0),0),finalProviderCost:null};
const evidence={version:v3?'RNT2-CSD-REVIEW-PACK-v3.0.0':'RNT2-CSD-REVIEW-PACK-v2.0.0',generatedAt:new Date().toISOString(),state:ready?'TECHNICAL_PASS / EDITORIAL_AUTOMATED_PASS / OWNER_ACCEPTANCE_PENDING':'MACHINE_REVIEW_REQUIRED',reviewOnly:true,ownerAcceptance:'PENDING',productionActivated:false,comparison,localeParity:{...parity,mechanismParity},requestSummary,initialReviews,auditHistory,records};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(`${out}/REVIEW-EVIDENCE.json`,JSON.stringify(evidence,null,2)+'\n');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={CAREER_THESIS:['职业主旨','Career thesis'],STRUCTURE:['事业格局','Career pattern'],MEANING:['工作中的含义','What it means at work'],CONDITIONS:['发挥条件','Role conditions'],COUNTERWEIGHTS:['优势与代价','Advantages and costs'],OBSERVABLE_EXPRESSION:['具体工作情境','Workplace scenarios'],TIMING_RELEVANCE:['当前阶段','Current timing'],NAVIGATION:['职业决策参考','Decision support']};
function readableParagraphs(value){
 const chunks=[];let paragraph='';for(const sentence of String(value).split(/(?<=[.!?。！？])\s+/u)){if(paragraph&&paragraph.length+sentence.length>700){chunks.push(paragraph);paragraph='';}paragraph+=(paragraph?' ':'')+sentence;}if(paragraph)chunks.push(paragraph);return chunks.map(x=>'<p>'+esc(x).replaceAll('\n','<br>')+'</p>').join('');
}
function section(r,locale){let prev=null;return `<section id="${locale}" lang="${locale}"><h2>${locale==='zh-Hans'?'中文完整解读':'English full reading'}</h2><p class="status">${esc(r.reviewState?.technicalStatus)} · ${esc(r.editorialQuality?.state)} · OWNER_ACCEPTANCE_PENDING</p>`+(r.candidate?.blocks||[]).map(b=>{const title=prev!==b.role?`<h3>${esc(titles[b.role]?.[locale==='zh-Hans'?0:1]||b.role)}</h3>`:'';prev=b.role;return `${title}${v3?readableParagraphs(b.text):'<p>'+esc(b.text).replaceAll('\n','<br>')+'</p>'}`;}).join('')+'</section>';}
const technical={state:evidence.state,requestSummary,localeParity:evidence.localeParity,comparison,locales:Object.fromEntries(['zh-Hans','en'].map(l=>{const r=records[l].result;return [l,{inputChartFacts:r.careerNarrativeIR.inputChartFacts,...(v3?{careerOperatingStyle:r.careerNarrativeIR.nodes.find(n=>n.kind==='CAREER_OPERATING_STYLE'),valueCreationMode:r.careerNarrativeIR.valueCreationMode,activeMechanisms:r.careerNarrativeIR.activeMechanisms,mechanismInteractions:r.careerNarrativeIR.mechanismInteractions,distinctAdvantages:r.careerNarrativeIR.distinctCareerAdvantages,roleSpectrum:r.careerNarrativeIR.roleSpectrum,timingContrast:r.careerNarrativeIR.nodes.find(n=>n.kind==='TIMING'),decisionPriorities:r.careerNarrativeIR.careerDecisionPriorities}:{}),causalChains:r.careerNarrativeIR.nodes.filter(n=>n.kind==='CAUSAL_CHAIN'),scenarios:r.careerNarrativeIR.nodes.filter(n=>n.kind==='SCENARIO'),timing:r.careerNarrativeIR.nodes.filter(n=>n.kind==='TIMING'),verification:r.verification,quality:r.editorialQuality,usage:r.usageRecord,reviewUsage:r.verificationUsageRecords,reviewAudit:r.reviewAudit,attempts:r.internalOnly,artifactDigest:records[l].artifactDigest}];}))};
fs.writeFileSync(`${out}/review.html`,`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BaZi · S04 Career · T2 Human Review</title><style>body{margin:0;background:#f4f0e8;color:#183246;font:18px/1.85 Georgia,"Noto Serif SC",serif}.wrap{max-width:880px;margin:auto;padding:36px 24px}header,section,details{background:#fffdf8;border:1px solid #d8c9aa;padding:30px 40px;margin-bottom:28px}h1,h2,h3{font-family:system-ui;line-height:1.4}h1{font-size:27px}h2{font-size:24px}h3{font-size:20px;margin-top:32px;color:#775c2d}p{margin:14px 0}.status,nav{font:14px/1.65 system-ui}nav a{margin-right:24px}pre{font:12px/1.6 monospace;white-space:pre-wrap;overflow-wrap:anywhere}a{color:#23526b}@media(max-width:600px){.wrap{padding:14px}header,section,details{padding:20px}body{font-size:17px}}</style><main class="wrap"><header><h1>BaZi · S04 Career · T2 Human Review</h1><p>${v3?'Customer Narrative Depth V3 · Career Identity + Multi-Mechanism Synthesis':'客户叙事深度 V2 · 职业解读'}</p><p class="status">Requested: T2 · Actual: ${esc(en.internalOnly?.actualTier)}<br>${esc(evidence.state)}<br>REVIEW_ONLY · 尚未获得人工验收，未上线生产</p><nav><a href="#zh-Hans">中文</a><a href="#en">English</a><a href="#evidence">验证记录</a></nav></header>${section(zh,'zh-Hans')}${section(en,'en')}<details id="evidence"><summary>命盘依据、职业机制、情境来源与验证记录</summary><pre>${esc(JSON.stringify(technical,null,2))}</pre></details></main></html>`);
console.log(JSON.stringify({state:evidence.state,comparison:comparison.accepted,parity:evidence.localeParity,locales:Object.fromEntries(Object.entries(records).map(([id,r])=>[id,{status:r.result.status,editorial:r.result.editorialQuality?.state,reasons:r.result.verification?.reasons}]))},null,2));
