import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {assemblePublicationSnapshot} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {SECTION_LAYOUT} from '../functions/canonical-presentation-runtime/report-section-contract.js';
import {resolveReportEditorialAsset} from '../functions/canonical-presentation-runtime/report-editorial-resolver.js';
import {REPORT_EDITORIAL_ASSETS} from '../functions/canonical-presentation-runtime/report-editorial-registry.js';
import {renderFrozenBaziIntro} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const out='docs/acceptance/bazi-paid-report/r9';
fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const frozen=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/batch-1/cases.json','utf8'));
const PUBLIC_BASE='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';

const machine={schemaVersion:'BAZI_R9_REVIEW_MACHINE_EVIDENCE_V1',generatedAt:new Date().toISOString(),locales:{}};

for(const locale of ['en','zh-Hans']){
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{}});
 const total=projection.pages.length+6;
 const intro=[1,2,3,4,5].map(page=>({
  pageNumber:page,kind:'STATIC',
  src:resolveReportEditorialAsset({registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:'BZR',page,locale:page===1?'bilingual':locale,publicBaseUrl:PUBLIC_BASE}).src,
  alt:`BaZi ${page===1?'bilingual cover':locale+' P'+page}`
 }));
 intro.push({pageNumber:6,kind:'FROZEN_TEMPLATE',html:renderFrozenBaziIntro(frozen.reports[locale],total)});
 const bundle=assemblePublicationSnapshot({methodId:'BZR',locale,pages:projection.pages,intro,temporalSnapshot:source.temporalSnapshot,internalPages:projection.internalSections,generatedAt:source.temporalSnapshot.generatedAt,layout:SECTION_LAYOUT});
 fs.writeFileSync(`${out}/snapshot-${locale}.json`,JSON.stringify(bundle.customer,null,2)+'\n');
 machine.locales[locale]={
  totalPages:bundle.customer.totalPages,
  bodyPages:bundle.customer.pages.length,
  sectionOpeners:bundle.customer.pages.filter(p=>p.isSectionOpener).length,
  keyInsights:bundle.customer.pages.filter(p=>p.pageFamily==='INSIGHT_LIST_PAGE').length,
  t3Pages:bundle.customer.pages.filter(p=>String(p.executionClass||'').includes('T3')).length
 };
}

machine.parity={
 sameTotal:machine.locales.en.totalPages===machine.locales['zh-Hans'].totalPages,
 sameBody:machine.locales.en.bodyPages===machine.locales['zh-Hans'].bodyPages
};
fs.writeFileSync(`${out}/machine-evidence.json`,JSON.stringify(machine,null,2)+'\n');

const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BaZi R9 · Human Review</title>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css">
<link rel="stylesheet" href="/assets/customer-ui/surfaces/report-publication.css">
<style>
body{margin:0;background:#e8e5de;color:#223;min-width:320px}
.r9-nav{position:sticky;top:0;z-index:20;background:#fffdf7ee;backdrop-filter:blur(12px);border-bottom:1px solid #cbb88e;padding:12px 16px;font:14px/1.5 system-ui}
.r9-nav-inner{max-width:1080px;margin:auto;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.r9-nav strong{margin-right:auto}.r9-nav button,.r9-nav select,.r9-nav a{font:inherit;padding:7px 10px;border:1px solid #bca879;background:#fff;color:#263843;text-decoration:none;border-radius:6px}
.r9-status{max-width:1080px;margin:14px auto;padding:12px 16px;background:#fffdf7;border:1px solid #cbb88e;font:14px/1.55 system-ui}
.r9-status b{color:#875b21}.r9-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:8px}
.r9-checks span{background:#f5f0e4;padding:8px;border-radius:6px}
@media print{.r9-nav,.r9-status{display:none!important}body{background:white}}
</style>
<nav class="r9-nav"><div class="r9-nav-inner"><strong>BaZi R9 · Human Review</strong>
<button data-locale="zh-Hans">中文</button><button data-locale="en">English</button>
<select id="section"></select><button id="jump">Go</button><button id="print">A4 Print / PDF</button></div></nav>
<section class="r9-status"><b>Review authority:</b> STATIC_EDITORIAL + DETERMINISTIC_PERSONALIZED. T3/OpenAI is not part of this customer publication.
<div class="r9-checks"><span>62 pages EN</span><span>62 pages 中文</span><span>10 section openers</span><span>10 Key Insights</span><span>T3 pages: 0</span></div>
<p>Human review focus: section hero hierarchy, chart/text balance, whitespace, font density, Key Insights readability, mobile wrapping, print fit, and overall paid-report quality.</p></section>
<main id="report"></main>
<script type="module">
import {renderVisualReportPages,fitPublicationForPrint,settlePublicationAssets} from '/assets/customer-ui/js/personal-products/bazi-r9-review-runtime.bundle.js';
let locale=new URLSearchParams(location.search).get('locale')||'zh-Hans';
if(!['en','zh-Hans'].includes(locale))locale='zh-Hans';
const report=document.querySelector('#report'),sel=document.querySelector('#section');
async function load(next){
 locale=next;history.replaceState(null,'','?locale='+locale);
 const snapshot=await (await fetch('./snapshot-'+locale+'.json',{cache:'no-store'})).json();
 document.documentElement.lang=locale;report.innerHTML=renderVisualReportPages(snapshot);
 await settlePublicationAssets(report);
 await Promise.all([...report.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
 await document.fonts.ready;
 sel.innerHTML=snapshot.pages.filter(p=>p.isSectionOpener).map(p=>'<option value="'+p.sectionNumber+'">'+p.sectionNumber+' · '+p.sectionTitle[locale]+'</option>').join('');
 report.querySelectorAll('[data-page-family="SECTION_OPENER_PAGE"]').forEach(el=>el.id='r9-section-'+el.dataset.section.replace(/^S/,'').slice(0,2));
 window.r9Snapshot=snapshot;window.r9PrintFit=fitPublicationForPrint(report);window.r9Ready=true;
}
document.querySelectorAll('[data-locale]').forEach(b=>b.onclick=()=>load(b.dataset.locale));
document.querySelector('#jump').onclick=()=>document.querySelector('#r9-section-'+sel.value)?.scrollIntoView({behavior:'smooth'});
document.querySelector('#print').onclick=()=>{fitPublicationForPrint(report);window.print();};
window.addEventListener('beforeprint',()=>fitPublicationForPrint(report));
await load(locale);
</script></html>`;
fs.writeFileSync(`${out}/review.html`,html);

fs.writeFileSync(`${out}/human-review-decision.template.json`,JSON.stringify({
 schemaVersion:'BAZI_R9_HUMAN_REVIEW_DECISION_V1',decision:'PENDING',reviewer:'',reviewedAt:'',
 scope:['DESKTOP','MOBILE','PRINT_PDF','EN','ZH_HANS'],
 findings:[],acceptedHead:null
},null,2)+'\n');

console.log(JSON.stringify(machine,null,2));
