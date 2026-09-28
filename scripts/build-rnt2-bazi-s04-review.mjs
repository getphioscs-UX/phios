import fs from 'node:fs';
import {buildBaZiS04T2} from '../functions/personal-reading/narrative/bazi-s04-t2-runtime.js';
import {verifyReportLocaleParity} from '../functions/personal-reading/narrative/report-locale-parity.js';

const out='docs/acceptance/report-narrative-t2-r1/bazi/s04';
fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const registry=JSON.parse(fs.readFileSync('content/ai-economics/providers/ai-provider-cost-registry-v1.json','utf8'));
const env={OPENAI_API_KEY:process.env.OPENAI_API_KEY||'',OPENAI_NARRATIVE_MODEL:process.env.OPENAI_NARRATIVE_MODEL||'gpt-5.6-luna',OPENAI_MODEL:process.env.OPENAI_MODEL||''};
const results={schemaVersion:'PHI-OS-RNT2-BZR-S04-REVIEW-PACK-v1.1.0',generatedAt:new Date().toISOString(),locales:{},providerSecretPresent:Boolean(env.OPENAI_API_KEY),ownerAcceptance:'PENDING'};
const runtimeResults={};

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function html(locale,r){
 const zh=locale==='zh-Hans',title=zh?'BaZi · S04 事业发展 · T2 人工验收':'BaZi · S04 Career · T2 Human Review';
 const blocks=r.candidate?.blocks||[];
 return `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
 body{margin:0;background:#eee9de;color:#173047;font:17px/1.75 system-ui,-apple-system,"Segoe UI",sans-serif}.wrap{max-width:900px;margin:auto;padding:34px}.card{background:#fffdf7;border:1px solid #cfbd91;padding:34px 42px;margin:20px 0}.meta{font-size:13px;color:#6d6659}.role{font-size:12px;letter-spacing:.12em;color:#9a7437;text-transform:uppercase;margin-top:26px}.text{font-family:Georgia,"Noto Serif SC",serif;font-size:20px;line-height:1.85}.qa{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.qa div{background:#f5efe1;padding:12px}.bad{color:#9a2f2f}.good{color:#336b4c}code{overflow-wrap:anywhere}
 </style><div class="wrap"><div class="card"><h1>${title}</h1><p class="meta">RNT2-W27–W29 · requested T2 / actual ${esc(r.internalOnly?.actualTier)} · owner acceptance: PENDING</p><div class="qa"><div>Status<br><b class="${r.status==='PASS'?'good':'bad'}">${esc(r.status)}</b></div><div>Claim coverage<br><b>${esc(r.verification?.claimCoverage??'—')}</b></div><div>Explanation chain<br><b>${esc(r.quality?.explanationChainCoverage??'—')}</b></div><div>Governance jargon<br><b>${esc(r.quality?.governanceJargonDensity??'—')}</b></div></div></div>
 <div class="card">${blocks.length?blocks.map(b=>`<div class="role">${esc(b.role)}</div><p class="text">${esc(b.text)}</p>`).join(''):`<p class="bad">${zh?'T2 未生成；请查看 machine evidence 中的 fallbackReason。':'T2 was not generated; inspect fallbackReason in machine evidence.'}</p>`}</div></div></html>`;
}

for(const locale of ['zh-Hans','en']){
 const r=await buildBaZiS04T2({reading:source.reading,locale,temporalSnapshot:source.temporalSnapshot,registry,env,requestId:'RNT2-BZR-S04-'+locale});
 runtimeResults[locale]=r;
 results.locales[locale]={status:r.status,internalOnly:r.internalOnly,verification:r.verification,quality:r.quality,usageRecord:r.usageRecord,verificationUsageRecords:r.verificationUsageRecords,briefDigest:r.brief.briefSemanticDigest,sourceDigest:r.brief.sourceSemanticDigest};
 fs.writeFileSync(`${out}/S04-${locale}-CLAIM-IR.json`,JSON.stringify(r.richClaimIr,null,2)+'\n');
 fs.writeFileSync(`${out}/S04-${locale}-NARRATIVE-BRIEF.json`,JSON.stringify(r.brief,null,2)+'\n');
 fs.writeFileSync(`${out}/S04-${locale}-T2-CANDIDATE.json`,JSON.stringify(r.candidate,null,2)+'\n');
 fs.writeFileSync(`${out}/S04-${locale}-VERIFICATION.json`,JSON.stringify(r.verification,null,2)+'\n');
 fs.writeFileSync(`${out}/S04-${locale}-QUALITY.json`,JSON.stringify(r.quality,null,2)+'\n');
 fs.writeFileSync(`${out}/review-s04-${locale}.html`,html(locale,r));
}
const localeParity=verifyReportLocaleParity({
 zhBrief:runtimeResults['zh-Hans'].brief,
 enBrief:runtimeResults.en.brief,
 zhCandidate:runtimeResults['zh-Hans'].candidate,
 enCandidate:runtimeResults.en.candidate
});
results.localeParity=localeParity;
fs.writeFileSync(`${out}/LOCALE-PARITY.json`,JSON.stringify(localeParity,null,2)+'\n');
results.machineReady=Object.values(results.locales).every(x=>x.status==='PASS'&&x.verification?.accepted===true&&x.internalOnly?.providerCalled===true&&x.internalOnly?.providerExecution==='LIVE_ADAPTER'&&x.internalOnly?.fallbackUsed===false)&&localeParity.accepted===true;
results.state=results.machineReady?'READY_FOR_OWNER_ACCEPTANCE':results.providerSecretPresent?'MACHINE_REVIEW_REQUIRED':'NOT_RUN_PROVIDER_SECRET_MISSING';
fs.writeFileSync(`${out}/MACHINE-EVIDENCE.json`,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({state:results.state,machineReady:results.machineReady,locales:Object.fromEntries(Object.entries(results.locales).map(([k,v])=>[k,{status:v.status,fallbackReason:v.internalOnly?.fallbackReason,claimCoverage:v.verification?.claimCoverage}]))},null,2));
