import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';

const root='docs/guided-report-successor-r1/batch-6';
const locales=['zh-Hans','en','bilingual'];
const batches=[1,2,3,4,5].map(n=>JSON.parse(fs.readFileSync(`docs/guided-report-successor-r1/batch-${n}/cases.json`)));
const coverage=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/static-asset-coverage.json'));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const assets=coverage.rows.filter(a=>a.methodId==='BZR');
assert.equal(assets.length,15);
for(const locale of locales){
 const reports=batches.map(b=>b.reports[locale]);
 assert.deepEqual(reports.flatMap(r=>r.pages.map(p=>p.pageNumber)),Array.from({length:21},(_,i)=>i+6));
 for(const report of reports){
  assert.equal(report.sourceReportRef,reports[0].sourceReportRef);
  assert.equal(report.sourceProjectionId,reports[0].sourceProjectionId);
  assert.equal(report.reviewMode,true);
  assert.equal(report.customerPublishable,false);
  assert.equal(report.checkoutEnabled,false);
 }
 assert.deepEqual(assets.filter(a=>a.locale===locale).map(a=>a.page).sort((a,b)=>a-b),[1,2,3,4,5]);
}
fs.mkdirSync(root,{recursive:true});
const sourcePaths=['assets/css/tokens.css','assets/customer-ui/surfaces/visual-report.css',
 'content/registry/report-visual-reference-freeze-r1.json',
 ...[1,2,3,4,5].map(n=>`docs/guided-report-successor-r1/batch-${n}/cases.json`)];
const manifest={id:'BAZI-FULL-REPORT-VISUAL-FREEZE-R1',baseline:'a21d9ab23d4737849f1857af8fd55526cf407b80',
 purpose:'REVIEW_ONLY_WHOLE_BOOK_ASSEMBLY',humanReview:'PENDING',freezeStatus:'AUDIT_PENDING',successorBaselineActivated:false,
 customerPublishable:false,checkoutEnabled:false,locales,pageRange:[1,26],
 staticAssets:assets,staticBase:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev',
 sourceHashes:Object.fromEntries(sourcePaths.map(p=>[p,sha(fs.readFileSync(p))])),
 dynamicHtmlHashes:Object.fromEntries(locales.map(locale=>[locale,batches.map(b=>sha(renderVisualReportPages(b.reports[locale])))]))};
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(`${root}/review.html`, `<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BaZi Batch 6 · Whole-Book Visual Freeze</title>
<link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css">
<style>body{margin:0;background:#e8e5de}nav{max-width:940px;margin:auto;padding:16px;box-sizing:border-box;font:15px/1.6 system-ui}nav a{display:inline-block;margin:4px;padding:8px;color:#23364a}nav select,nav button{font:inherit;padding:8px;max-width:100%}.static-page{box-sizing:border-box;max-width:940px;margin:24px auto;background:var(--phi-report-ivory)}.static-page img{display:block;width:100%;height:auto}.status{padding:12px;border:1px solid #a17c38;background:#fcfaf5}.status strong{display:block}#gallery{max-width:1400px;margin:24px auto;padding:16px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}#gallery[hidden],#report[hidden]{display:none}#gallery img{display:block;width:100%}#gallery a{color:#23364a;font:14px system-ui}nav code{overflow-wrap:anywhere}@media(max-width:600px){#gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.static-page{margin:16px auto}}@page bazi-static-whole-book{size:A4;margin:0}@media print{nav,#gallery{display:none!important}body{background:white}.static-page{page:bazi-static-whole-book;width:210mm;height:297mm;max-width:none;margin:0;break-after:page;overflow:hidden}.static-page img{width:100%;height:100%;object-fit:contain}}
</style><nav><h1>BaZi · BATCH 6 · P01–P26</h1><div class="status"><strong id="status">审核材料 · 等待视觉审核</strong>P01–P05 已获用户批准。P06–P26 为同一合成测试命盘，非客户资料。整本验收尚未通过，不启用后续设计系统基线。</div><p><a href="?locale=zh-Hans">中文</a><a href="?locale=en">English</a><a href="?locale=bilingual">双语</a><a id="pdf">26 页 A4 PDF</a><a href="STATUS.md">整本审核结论</a><a href="findings.json">逐页问题清单</a></p><label>跳至 <select id="jump">${Array.from({length:26},(_,i)=>`<option value="${i+1}">P${String(i+1).padStart(2,'0')}</option>`).join('')}</select></label> <button id="jump-button">查看页面</button> <button id="gallery-button">查看全部截图</button><p>静态页保持原图比例；动态页沿用五批既有 Page IR、组件与样式。图像内文字在手机上不会自动重排。PDF 为审核快照，含已记录的视觉差异。</p><details id="audit-summary"><summary>整本审核问题与修改建议</summary><div id="audit-issues">审核结论见 STATUS.md。</div></details><p><a id="transition">P05 → P06 衔接对照</a> · <a id="contact">整本缩略图</a></p></nav><main id="report"></main><div id="gallery" hidden></div>
<script type="module">
import {renderVisualReportPages} from '/assets/customer-ui/js/personal-products/visual-report-pages.js';
const manifest=await(await fetch('./manifest.json')).json();
const locale=new URLSearchParams(location.search).get('locale')||'zh-Hans';if(!manifest.locales.includes(locale))throw Error('UNKNOWN_LOCALE');
document.documentElement.lang=locale==='bilingual'?'zh-Hans':locale;
const batches=await Promise.all([1,2,3,4,5].map(async n=>(await(await fetch('../batch-'+n+'/cases.json')).json()).reports[locale]));
const staticAssets=manifest.staticAssets.filter(a=>a.locale===locale).sort((a,b)=>a.page-b.page);
document.querySelector('#report').innerHTML=staticAssets.map(a=>'<section class="static-page" data-page-number="'+a.page+'"><img alt="BaZi '+locale+' P0'+a.page+' approved editorial" src="'+manifest.staticBase+'/'+a.object_key+'"></section>').join('')+batches.map(renderVisualReportPages).join('');
document.querySelector('#pdf').href='./bazi-p01-p26-'+locale+'.pdf';
document.querySelector('#transition').href='./screenshots/'+locale+'-transition.png';
document.querySelector('#contact').href='./pdf-review/'+locale+'-contact.png';
document.querySelector('#jump-button').onclick=()=>{document.querySelector('#report').hidden=false;document.querySelector('#gallery').hidden=true;document.querySelector('#report [data-page-number="'+document.querySelector('#jump').value+'"]').scrollIntoView();};
document.querySelector('#gallery-button').onclick=()=>{const gallery=document.querySelector('#gallery');gallery.hidden=!gallery.hidden;document.querySelector('#report').hidden=!gallery.hidden;if(!gallery.hidden)gallery.innerHTML=[1440,390].flatMap(width=>Array.from({length:26},(_,i)=>{const src='./screenshots/'+locale+'-'+width+'-P'+String(i+1).padStart(2,'0')+'.png';return '<a href="'+src+'"><img loading="lazy" alt="'+locale+' '+width+' P'+(i+1)+'" src="'+src+'">'+width+'px · P'+(i+1)+'</a>';})).join('');};
const findings=await fetch('./findings.json').then(r=>r.ok?r.json():null).catch(()=>null);if(findings){document.querySelector('#status').textContent=findings.status+' · 人工接受待确认';const list=document.querySelector('#audit-issues');list.replaceChildren();for(const issue of findings.issues){const section=document.createElement('section'),heading=document.createElement('h3'),note=document.createElement('p'),action=document.createElement('p');heading.textContent=issue.id+' · '+issue.status;note.textContent=issue.observation;action.textContent='建议：'+issue.recommendation;section.append(heading,note,action);list.append(section);}}
await Promise.all([...document.querySelectorAll('#report img')].map(img=>img.decode()));await document.fonts.ready;
window.batchReports=batches;window.batchReady=true;
</script></html>`);
console.log('Batch 6 assembled: 15 approved static assets, 63 unchanged dynamic pages across 3 locales. No customer publication or successor activation.');
