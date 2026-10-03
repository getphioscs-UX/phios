import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {deriveStructuralChange} from './lib/runtime-position-w8e-p5-b3.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'content/civilization-atlas/reconfiguration');
const read=f=>JSON.parse(fs.readFileSync(path.join(base,f),'utf8').replace(/^\uFEFF/,''));
const inputName='runtime-position-w8e-p5-b2-comparable-period-extraction-v1.json';
const bytes=fs.readFileSync(path.join(base,inputName));const b2=read(inputName);
const manifest=read('runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json');
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(b2.status,'COMPARABLE_PERIOD_EXTRACTION_COMPLETE_B3_PENDING');
const eventSpecs={
 MSFT:{year:2025,type:'SEGMENT_RECLASSIFICATION',anchors:['In August 2024, we announced changes to the composition of our segments.','bringing the commercial components of Microsoft 365 together in the Productivity and Business Processes segment.','Prior period segment information has been recast'],
  summary:'Microsoft reports an August 2024 change to segment composition, bringing Microsoft 365 commercial components together in Productivity and Business Processes. FY2025 internal reporting reflects the changed composition, with prior segment information recast. This establishes a reported organizational/reporting-composition event, not a revenue increase caused by reclassification.'},
 JPM:{year:2024,type:'ISSUER_STRUCTURE_SHIFT',anchors:['Effective in the second quarter of 2024','combining the former Corporate & Investment Bank and Commercial Banking business segments','Prior-period amounts have been revised to conform'],
  summary:'JPM reports combining Corporate & Investment Bank and Commercial Banking into one Commercial & Investment Bank reportable segment from Q2 2024. Use revised historical data for revenue comparisons; the change in partition must remain separately visible.'}};
const records=b2.packets.map(p=>{
 for(const f of p.filings){const s=manifest.records.find(s=>s.sourceId===f.sourceId);assert(s);assert.equal(hash(fs.readFileSync(path.join(base,'p5-b1-filings',s.file))),f.sha256);}
 let event=null;const spec=eventSpecs[p.issuer];
 if(spec){const f=p.filings.find(f=>f.filingFiscalYear===spec.year),s=manifest.records.find(s=>s.sourceId===f.sourceId);
  const raw=fs.readFileSync(path.join(base,'p5-b1-filings',s.file),'utf8');
  const plain=raw.replace(/<[^>]+>/g,' ').replace(/&#160;|&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  const locators=spec.anchors.map(anchor=>{const offset=plain.indexOf(anchor);assert(offset>=0,p.issuer+':mechanism anchor missing');return {searchAnchor:anchor,normalizedTextOffset:offset};});
  event={type:spec.type,sourceId:f.sourceId,sourceSha256:f.sha256,url:f.url,verified:true,admissionState:'NOT_ADMITTED',locators,summary:spec.summary};
 }
 return deriveStructuralChange(p,{officialEvent:event});
});
const output={version:'1.0.0',work:'R1-W8E-P5-B3',status:'STRUCTURAL_CHANGE_DERIVATION_COMPLETE_GOVERNED_ADMISSION_PENDING',
 predecessor:{file:inputName,sha256:hash(bytes)},rule:{mixScreenPp:10,authority:'PROVISIONAL_ANALYTICAL_SCREEN',purpose:'Triage revenue-composition movement for review, not establish materiality or G14.',concentrationMetric:'Sum of squared revenue shares, fraction scale; partition dependent.'},records,
 completed:{issuerReadouts:records.length,structuralChangeCandidates:records.filter(r=>r.candidate).length,officialReportingStructureEvents:records.filter(r=>r.officialEvent).length,revenueMixScreenCandidates:records.filter(r=>r.candidate?.types.includes('BUSINESS_MIX_MIGRATION')).length,
  observationsOnly:records.filter(r=>!r.candidate).length,g14Candidates:0,dossierGlobalPromotions:0,runtimePositionCandidates:0},
 next:'Carry bounded source/claims through W8A/W8B/W8C/W8D. B4 assess cross-issuer scope and representativeness; keep G14 fail-closed until admission and human review.'};
fs.writeFileSync(path.join(base,'runtime-position-w8e-p5-b3-structural-change-derivation-v1.json'),JSON.stringify(output,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const cards=records.map(r=>'<section><h2>'+r.issuer+'</h2><p>'+esc(r.candidate?.types.join(' · ')||'收入变化观察；未生成结构变化候选')+'</p><p>'+esc(r.officialEvent?.summary||'以可比口径计算收入组合变化；没有在本轮验证正式分部重组事件。')+'</p><table><tr><th>分部</th><th>FY2023</th><th>FY2024</th><th>FY2025</th><th>变化（百分点）</th></tr>'+r.metrics.segmentChanges.map(s=>'<tr><td>'+esc(s.name)+'</td>'+s.sharesPercent.map(v=>'<td>'+v.toFixed(2)+'%</td>').join('')+'<td>'+s.netShareChangePp.toFixed(2)+'</td></tr>').join('')+'</table><p>10 个百分点仅为临时分析筛选线，不是 G14 门槛。占比分母：'+esc(r.denominator)+'.</p><p>收入集中度 HHI（0–1）：'+r.metrics.hhiFractionScale.map(v=>v.toFixed(4)).join(' → ')+'</p><p>'+esc(r.candidate?.reasoning.join(' ')||'未跨筛选线不表示不存在结构变化。')+'</p><details><summary>来源、筛选敏感性与限制</summary><pre>'+esc(JSON.stringify({sourceRefs:r.sourceRefs,sensitivity:r.metrics.thresholdSensitivity,limitations:r.limitations},null,2))+'</pre></details></section>').join('');
fs.mkdirSync(path.join(root,'tools/review'),{recursive:true});
fs.writeFileSync(path.join(root,'tools/review/PHI-OS-W8E-P5-B3-STRUCTURAL-CHANGE.html'),'<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B3 结构变化推导</title><style>body{max-width:1100px;margin:auto;padding:28px;font:16px/1.65 system-ui;background:#121820;color:#e8e2d6}h1,h2{color:#dcc18a}section{padding:24px;margin:24px 0;border:1px solid #665840;border-radius:10px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #4d4d4d}pre{white-space:pre-wrap}</style><h1>B3｜结构变化推导</h1><p>5 家企业 · 3 个结构变化候选 · 2 个仅观察结果。历史窗口 FY2023–FY2025。</p><p>正式报告分部变化与同口径收入迁移分别保留。收入增长、报告重列、收入集中度都不自动等于 G14。CWA/RRE 准入及后续人审待完成；G14=0，RP=0。</p>'+cards+'</html>');
console.log('PASS B3: issuer readouts='+records.length+', structural candidates='+output.completed.structuralChangeCandidates+', official events=2, mix screen=1; G14=0; RP=0.');
