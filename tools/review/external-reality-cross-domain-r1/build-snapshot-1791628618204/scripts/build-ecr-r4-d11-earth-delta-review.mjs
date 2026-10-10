import fs from 'node:fs';

const casesPath='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-cases-v1.json';
const resultsPath='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-results-v1.json';
const outPath='tools/review/ECR-R4-D11-EARTH-DELTA-HUMAN-REVIEW.html';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const cases=read(casesPath),results=read(resultsPath);
const resultById=new Map((results.results||[]).map(x=>[x.caseId,x]));
const pending=(cases.cases||[]).filter(c=>{
 const r=resultById.get(c.caseId);
 return !r||['methodFidelityAccepted','customerClarityAccepted','nonFortuneTellingBoundaryAccepted','lineageAccepted'].some(k=>r[k]!==true);
});
const driverUnit=c=>(c.interpretationUnits||[]).find(u=>(u.ruleRefs||[]).includes('CX-COMP-ECR-DRIVER-PRIORITY-v1'));
const primary=c=>(c.coordinate?.ECR_DRIVER_PRIORITY||[]).slice().sort((a,b)=>(a.meta?.rank||99)-(b.meta?.rank||99))[0];

const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ECR R4 · D11 Earth Delta Human Review</title><style>body{margin:0;background:#f4f0e8;color:#20333b;font:17px/1.75 system-ui,-apple-system,"Segoe UI","Noto Sans SC",sans-serif}main{max-width:980px;margin:auto;padding:28px 18px}header,.case{background:#fffdf8;border:1px solid #d9cfbf;border-radius:14px;padding:26px;margin-bottom:20px}h1,h2,h3{line-height:1.35}h1{font-size:28px}h2{font-size:22px}h3{font-size:18px;margin:22px 0 8px}.meta{font:14px/1.5 ui-monospace,Consolas,monospace;background:#f2eee6;padding:12px;border-radius:8px}.boundary{color:#6c6255}.checks{margin-top:20px;padding-top:14px;border-top:1px solid #ddd}.checks li{margin:8px 0}.old{color:#8c463c}.new{color:#285e47;font-weight:600}</style><main><header><h1>ECR R4 · D11 Earth / Embodiment Delta Review</h1><p>Only cases whose previously accepted human-review content changed after the owner-approved D11 correction are shown. Unchanged cases retain their prior acceptance.</p><p><span class="old">Retired:</span> D11 Chiron / Recovery · <span class="new">Current:</span> D11 Earth / Embodiment.</p><div class="meta">accepted inherited: ${results.acceptedCaseCount}/48 · pending: ${results.pendingCaseCount}/48 · rejected: ${results.rejectedCaseCount}/48</div></header>${pending.map(c=>{const p=primary(c),u=driverUnit(c);return `<section class="case"><h2>${esc(c.caseId)} · ${esc(c.locale)}</h2><div class="meta">reviewCaseDigest: ${esc(c.reviewCaseDigest)}<br>primary driver: ${esc(p?.code)} · ${esc(p?.meta?.label)} / ${esc(p?.meta?.labelZhHans)} · rank ${esc(p?.meta?.rank)}</div><h3>Customer-facing driver interpretation</h3><p>${esc(u?.plainLanguageExplanation)}</p><h3>Structural reason</h3><p>${esc(u?.structuralReason)}</p><h3>Relation context</h3><p>${esc(u?.relationContext)}</p><h3>Constructive expression</h3><p>${esc(u?.constructiveExpression)}</p><h3>Friction / boundary</h3><p>${esc(u?.frictionExpression)}</p><p class="boundary">${esc(u?.confidenceBoundary)}</p><h3>Observe</h3><p>${esc((u?.observableSignals||[]).join(' '))}</p><p><b>Reality question:</b> ${esc((u?.realityComparisonQuestions||[]).join(' '))}</p><div class="checks"><b>Human review dimensions</b><ul><li>Method fidelity: Earth/Embodiment meaning, no Recovery residue</li><li>Customer clarity</li><li>Non-fortune-telling boundary</li><li>Lineage / D11 meaning reference preserved</li></ul></div></section>`}).join('')}</main></html>`;
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync(outPath,html);
console.log(`PASS: wrote ${outPath}`);
console.log(`  inherited ${results.acceptedCaseCount}/48 · pending ${pending.length}/48`);
console.log('  pending cases: '+pending.map(x=>x.caseId).join(', '));
