import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {editorialQualityMetrics,classifyEditorialText} from '../functions/personal-reading/narrative/bazi-editorial-quality.js';
const root='docs/guided-report-successor-r2/editorial-f';fs.mkdirSync(root,{recursive:true});
const extracted=JSON.parse(fs.readFileSync('.tmp/bazi-f-pdf-text.json','utf8'));
const audit=[];
// Visual inspection of the frozen raster introductions; these labels are not
// OCR claims and do not constitute the owner's editorial acceptance.
const introClasses={1:['TECHNICAL_DATA'],2:['METHOD_EXPLANATION','OBSERVATION','BOUNDARY'],3:['METHOD_EXPLANATION'],4:['METHOD_EXPLANATION','CUSTOMER_MEANING','BOUNDARY'],5:['METHOD_EXPLANATION','OBSERVATION','BOUNDARY'],6:['TECHNICAL_DATA','BOUNDARY']};
for(const locale of ['en','zh-Hans']){
 const report=JSON.parse(execFileSync('git',['show',`c6ab7321:docs/guided-report-successor-r2/visual-commerce/bazi-${locale}.json`],{encoding:'utf8'}));
 const narratives=report.pages.filter(p=>p.pageFamily==='NARRATIVE_ANALYSIS_PAGE');
 for(const pdf of extracted.filter(p=>p.locale===locale)){
  const page=report.pages.find(p=>p.pageNumber===pdf.page),previous=report.pages.find(p=>p.pageNumber===pdf.page-1);
  const blocks=page?[...(page.paragraphs||[]).map(text=>({text,category:classifyEditorialText(text)})),...(page.items||[]).map(text=>({text,category:classifyEditorialText(text)})),...(page.observations||[]).map(text=>({text,category:'OBSERVATION'})),...(page.boundary?[{text:page.boundary,category:'BOUNDARY'}]:[])]:[];
  const text=blocks.map(b=>b.text).join(' ');
  audit.push({locale,page:pdf.page,pageFamily:page?.pageFamily||'FROZEN_INTRO',sectionKey:page?.sectionKey||null,title:page?.title||`P${pdf.page}`,
   baselineCommit:pdf.baselineCommit,pdfSha256:pdf.pdfSha256,pdfExtractedCharacters:pdf.text.length,pdfText:pdf.text,classification:page?.primaryVisualRef?'TECHNICAL_DATA':page?.pageFamily==='SECTION_OPENER_PAGE'?'METHOD_EXPLANATION':null,blocks,
   rasterTextAudit:pdf.page<=5?`VISUAL CLASSIFICATION (Codex; not OCR or human acceptance): ${introClasses[pdf.page].join(', ')}`:null,
   introVisualClassifications:pdf.page<=6?introClasses[pdf.page]:null,
   metrics:editorialQualityMetrics(text,{precedingVisualText:previous?.primaryVisualRef?extracted.find(p=>p.locale===locale&&p.page===previous.pageNumber)?.text||'':'',sectionTerms:page?.title.match(/[A-Za-z]{4,}|[\u3400-\u9fff]{2,}/g)||[],otherSections:narratives.filter(p=>p.sectionKey!==page?.sectionKey).map(p=>p.paragraphs.join(' '))}),
   immediatelyPrecedingVisual:previous?.primaryVisualRef||null,sourcePdf:pdf.pdf});
 }
}
fs.writeFileSync(`${root}/paid-pdf-page-audit.json`,JSON.stringify({version:'BAZI_EDITORIAL_QUALITY_F_V1',evidenceClass:'EXISTING_SYNTHETIC_PAID_LAYOUT_PDF',humanAccepted:false,pages:audit},null,2)+'\n');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fs.writeFileSync(`${root}/audit.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BaZi Addendum F · Page audit</title><style>body{max-width:1000px;margin:auto;padding:24px;font:16px/1.7 system-ui;background:#faf8f1;color:#213547}article{border-top:1px solid #ccc;padding:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#59656d}li{margin:12px 0}</style><h1>BaZi paid PDF · Editorial audit</h1><p>96 existing layout-fixture pages. Classification and metrics are deterministic review aids, not human acceptance. Frozen raster introductions were visually classified by Codex; this is not owner acceptance.</p>${audit.map(p=>`<article><h2>${esc(p.locale)} · P${p.page} · ${esc(p.title)}</h2><small>${esc(p.pageFamily)} · ${esc(p.classification||'MIXED_PROSE')}</small>${p.rasterTextAudit?`<p>${esc(p.rasterTextAudit)}</p>`:''}<ul>${p.blocks.map(b=>`<li><strong>${b.category}</strong> — ${esc(b.text)}</li>`).join('')}</ul><details><summary>Metrics / PDF text</summary><pre>${esc(JSON.stringify(p.metrics,null,2))}</pre><pre>${esc(p.pdfText)}</pre></details></article>`).join('')}</html>`);
console.log(JSON.stringify({pages:audit.length,narrativePages:audit.filter(p=>p.pageFamily==='NARRATIVE_ANALYSIS_PAGE').map(p=>({locale:p.locale,page:p.page,section:p.sectionKey,metrics:p.metrics,blocks:p.blocks}))},null,2));
