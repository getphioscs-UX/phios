import fs from 'node:fs';
import {buildRelationshipBrief} from '../functions/personal-reading/narrative/bazi-s06-market-reading.js';
import {buildHealthBrief} from '../functions/personal-reading/narrative/bazi-s07-health-market-reading.js';
import {buildTimingBrief} from '../functions/personal-reading/narrative/bazi-s08-timing-market-reading.js';
import {buildGuidanceBrief} from '../functions/personal-reading/narrative/bazi-s09-guidance-market-reading.js';
import {buildAppendixBrief} from '../functions/personal-reading/narrative/bazi-s10-appendix-market-reading.js';
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const specs=[
 ['S06 Relationship｜关系',buildRelationshipBrief],
 ['S07 Health｜健康',buildHealthBrief],
 ['S08 Timing｜时运',buildTimingBrief],
 ['S09 Guidance｜导航建议',buildGuidanceBrief],
 ['S10 Appendix｜附录',buildAppendixBrief]
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=[];
for(const [label,fn] of specs){
 const en=await fn({...source,locale:'en'}),zh=await fn({...source,locale:'zh-Hans'});
 sections.push({label,en,zh});
}
const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BaZi S06-S10 Remaining Sections Review</title><style>body{margin:0;background:#f4f0e8;color:#20333b;font:16px/1.7 system-ui,-apple-system,"Segoe UI","Noto Sans SC",sans-serif}main{max-width:1180px;margin:auto;padding:28px 18px}header,.section{background:#fffdf8;border:1px solid #d9cfbf;border-radius:16px;padding:26px;margin:0 0 22px}h1{font-size:30px}h2{font-size:24px;border-bottom:1px solid #ded6ca;padding-bottom:10px}h3{font-size:18px;margin:24px 0 8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.card{background:#f9f6f0;border-radius:12px;padding:16px}.meta{font:13px/1.5 ui-monospace,Consolas,monospace;color:#6b6258}.claim{border-top:1px solid #e5ddd1;padding:14px 0}.claim:first-of-type{border-top:0}.boundary{background:#f1ede4;padding:12px;border-radius:10px}@media(max-width:800px){.grid{grid-template-columns:1fr}}</style><main><header><h1>BaZi Remaining Sections｜S06–S10</h1><p>Deterministic source-bound review workspace. This page reviews section semantics and content plans only; it does not call a provider and is not production activation.</p><div class="meta">S02–S05 owner accepted · S06–S10 review pending · provider calls: 0</div></header>${sections.map(s=>`<section class="section"><h2>${esc(s.label)}</h2><div class="grid"><div class="card"><h3>中文</h3>${s.zh.claims.map((c,i)=>`<div class="claim"><b>${esc(s.zh.marketContract.headings[c.role]?.[0]||c.role)}</b><p>${esc(c.text)}</p><div class="meta">${esc(c.claimId)}</div></div>`).join('')}</div><div class="card"><h3>English contract / parity</h3>${s.en.claims.map(c=>`<div class="claim"><b>${esc(s.en.marketContract.headings[c.role]?.[1]||c.role)}</b><p>${esc(c.text)}</p><div class="meta">${esc(c.claimId)}</div></div>`).join('')}</div></div><h3>Guardrails</h3><div class="boundary">${esc(s.en.marketContract.dimensions.join(' · '))}</div><div class="meta">briefDigest EN: ${esc(s.en.briefSemanticDigest)}<br>sourceDigest: ${esc(s.en.sourceSemanticDigest)}</div></section>`).join('')}</main></html>`;
fs.mkdirSync('tools/review',{recursive:true});fs.writeFileSync('tools/review/BAZI-S06-S10-REMAINING-SECTIONS-REVIEW.html',html);
console.log('PASS: wrote tools/review/BAZI-S06-S10-REMAINING-SECTIONS-REVIEW.html');
console.log('  Sections: S06-S10 · locales: zh-Hans + en · provider calls: 0');
