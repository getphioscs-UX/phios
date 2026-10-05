import fs from 'node:fs';
import {ZWR_VFR_PAGE_PLAN} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';

const root='docs/reports/ziwei/vfr-r1';
const livePath=root+'/LIVE-RESULT.json',diagramPath=root+'/DIAGRAM-DATA.json';
if(!fs.existsSync(livePath)||!fs.existsSync(diagramPath))throw Error('ZWR_VFR_LIVE_EVIDENCE_REQUIRED');
const live=JSON.parse(fs.readFileSync(livePath,'utf8')),diagrams=JSON.parse(fs.readFileSync(diagramPath,'utf8'));
if(live.status!=='PASS')throw Error('ZWR_VFR_LIVE_RESULT_NOT_PASS');
const bySection=new Map((live.reportIr?.sections||[]).map(s=>[s.sectionId,s]));
const byDiagram=new Map((diagrams.diagrams||[]).map(d=>[d.id,d]));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const localized=(x,locale)=>locale==='zh'?x?.zhHans:x?.en;
function sectionCopy(id){
 const s=bySection.get(id); if(!s)return '';
 return ['zh','en'].map(locale=>{const x=localized(s,locale);return '<div class="locale"><h3>'+esc(locale==='zh'?'中文':'English')+'</h3><h2>'+esc(x?.headline)+'</h2><p class="sub">'+esc(x?.subheadline)+'</p><ul>'+((x?.keyInsights)||[]).map(k=>'<li><b>'+esc(k.label)+'</b> '+esc(k.text)+'</li>').join('')+'</ul>'+((x?.interpretation)||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'</div>';}).join('');
}
function diagramCopy(ids){
 return ids.map(id=>{const d=byDiagram.get(id);return '<div class="diagram"><h3>'+esc(id)+' · '+esc(d?.type)+'</h3><pre>'+esc(JSON.stringify(d?.data||{},null,2))+'</pre></div>';}).join('');
}
const pages=ZWR_VFR_PAGE_PLAN.map(p=>'<section class="page" data-page-number="'+p.pageNumber+'"><header><span>'+String(p.pageNumber).padStart(2,'0')+' / 47</span><b>'+esc(p.pageKey)+'</b></header><main>'+(p.sectionId?sectionCopy(p.sectionId):'<h1>'+esc(p.pageKey)+'</h1>')+diagramCopy(p.diagramIds||[])+'</main><footer>PHI OS · Zi Wei VFR R1 · HUMAN REVIEW ONLY</footer></section>').join('');
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zi Wei VFR R1 Human Review</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#171a19;color:#eadfbd;font-family:system-ui,"Microsoft YaHei",sans-serif}.review{max-width:980px;margin:24px auto;padding:24px;background:#202522}.review button{padding:10px 18px}.page{width:210mm;min-height:297mm;margin:12px auto;background:#111714;padding:16mm;break-after:page;position:relative}.page header,.page footer{display:flex;justify-content:space-between;opacity:.7}.page footer{position:absolute;left:16mm;right:16mm;bottom:10mm}.locale{margin:14px 0;padding:12px;border:1px solid #756b50}.sub{opacity:.8}.diagram{margin:14px 0;padding:12px;border:1px solid #4d5c55}.diagram pre{white-space:pre-wrap;max-height:90mm;overflow:hidden;font-size:10px;color:#d5d7ce}.page p,.page li{line-height:1.55}@media print{body{background:#fff}.review{display:none}.page{margin:0;box-shadow:none}}@media(max-width:900px){.page{width:100%;min-height:auto;margin:0;padding:22px}.page footer{position:static;margin-top:30px}}</style></head><body><section class="review"><h1>Zi Wei VFR R1 · Browser / Print Human Review</h1><p>47 pages · 15 deterministic diagram bindings · bilingual one-call Sol result. 此页只用于人工验收，不代表 production cutover。</p><button onclick="window.print()">打印／保存 PDF</button><p>审阅后显式运行：<code>npm run accept:vfr:zwr-human-review -- ACCEPT</code></p></section>'+pages+'</body></html>';
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html',html);
console.log('PASS built ZWR-VFR-R1-HUMAN-REVIEW.html with 47 pages; production cutover remains disabled.');
