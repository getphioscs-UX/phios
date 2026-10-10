import fs from 'node:fs';
import {presentVisualReport} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {REPORT_EDITORIAL_ASSETS} from '../functions/canonical-presentation-runtime/report-editorial-registry.js';
import {REPORT_EDITORIAL_COPY} from '../functions/canonical-presentation-runtime/report-editorial-copy.js';
const root='docs/guided-report-successor-r1';
fs.mkdirSync(`${root}/cases`,{recursive:true});
const registry={bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS};
fs.writeFileSync(`${root}/editorial-registry.json`,JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync(`${root}/editorial-copy.json`,JSON.stringify(REPORT_EDITORIAL_COPY,null,2)+'\n');
const cases=[],blockers=[];
for(const method of ['BZR','AST','ZWR','NUM','PROFILE','ECR','HD','CROSS']){
 const load=locale=>JSON.parse(fs.readFileSync(`docs/visual-report-r1/cases/${method}-01-${locale}.json`)).paid;
 const en=load('en'),zh=load('zh-Hans');
 for(const reportLocale of ['en','zh-Hans','bilingual']){
  const presentation={reportLanguageMode:reportLocale==='bilingual'?'BILINGUAL':'SINGLE',reportLocale};
  const source=reportLocale==='zh-Hans'?zh:en,localizedCopy={};
  // Review-only translation candidates from existing localized projections.
  // This verifies layout/binding, NOT semantic equivalence of the translations.
  if(reportLocale==='bilingual')for(const page of en.pages){
   const other=zh.pages.find(p=>p.pageId===page.pageId);if(!other)continue;
   let translatedInsights=other.insights;
   if(method==='HD'){translatedInsights=page.insights.map(i=>{const key=i.claimRef?.split('#').slice(1).join('#');const matches=zh.pages.flatMap(p=>p.insights).filter(j=>j.claimRef?.split('#').slice(1).join('#')===key);return matches.length===1?matches[0]:null;});}
   if(translatedInsights.length!==page.insights.length||translatedInsights.some(x=>!x)||other.visual.nodes.length!==page.visual.nodes.length)continue;
   localizedCopy[page.pageId]={sourceReportRef:source.sourceReportRef,evidenceRefs:page.evidenceRefs,claims:page.claims,locales:{'zh-Hans':{
    title:other.title,question:other.question,boundaryText:other.boundaryText,navigationPrompt:other.navigationPrompt,
    insights:page.insights.map((i,n)=>({...i,text:translatedInsights[n].text})),visual:{...page.visual,a11ySummary:other.visual.a11ySummary,nodes:page.visual.nodes.map((n,i)=>({...n,label:other.visual.nodes[i].label}))}
   }}};
  }
  try{
   const report=presentVisualReport({report:source,presentation,entitlement:{entitlement_status:'active',purchase_id:'SYNTHETIC_REVIEW_ONLY',reportPresentation:presentation},access:'PAID',editorialRegistry:registry,publicBaseUrl:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev',localizedCopy,reviewMode:true});
   const filename=`${method}-${reportLocale}.json`;fs.writeFileSync(`${root}/cases/${filename}`,JSON.stringify({...report,synthetic:true,translationSemanticAcceptance:'PENDING',translationSource:'EXISTING_LOCALIZED_REVIEW_FIXTURES_NOT_CUSTOMER_GENERATION'},null,2)+'\n');cases.push({method,reportLocale,path:`cases/${filename}`,pages:report.pages.length,missingEditorial:5});
  }catch(e){blockers.push({method,reportLocale,error:e.message});}
 }
}
fs.writeFileSync(`${root}/cases.json`,JSON.stringify({cases,blockers,humanReview:'PENDING',productionAccepted:false},null,2)+'\n');
fs.writeFileSync(`${root}/review.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Report successor candidate review</title><link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css"><style>body{margin:0;background:#edf1f3;font:16px/1.6 system-ui}main{max-width:1440px;margin:auto;padding:16px}select{max-width:100%;padding:12px}nav li{overflow-wrap:anywhere}</style><main><h1>Report candidate review / 报告候选审阅</h1><p>Static artwork missing. Translation meaning and visual acceptance pending. Synthetic data only. / 静态图缺失，语言含义与视觉待审核，仅使用测试资料。</p><label>Variant <select id="variant"></select></label><div id="report"></div></main><script type="module">import {renderVisualReportPages} from '/assets/customer-ui/js/personal-products/visual-report-pages.js';const m=await(await fetch('./cases.json')).json();variant.innerHTML=m.cases.map(c=>'<option value="'+c.path+'">'+c.method+' · '+c.reportLocale+'</option>').join('');async function show(){document.body.dataset.ready='false';const r=await(await fetch('./'+variant.value)).json();document.documentElement.lang=r.presentation.reportLocale==='bilingual'?'zh-Hans':r.presentation.reportLocale;document.getElementById('report').innerHTML=renderVisualReportPages(r);document.body.dataset.ready='true';}variant.value=new URLSearchParams(location.search).get('case')||m.cases[0].path;variant.onchange=show;await show();</script></html>`);
console.log(JSON.stringify({cases:cases.length,blockers},null,2));
