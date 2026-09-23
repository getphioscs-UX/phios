import fs from 'node:fs';
import {build} from 'esbuild';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {assemblePublicationSnapshot} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {SECTION_LAYOUT} from '../functions/canonical-presentation-runtime/report-section-contract.js';
import {extractPublicationDiagram} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {COMPOSITION_VERSION,VERIFIER_VERSION,EDITORIAL_VERSION,T3_SECTIONS} from '../functions/personal-reading/narrative/bazi-editorial-contract.js';
const root='docs/guided-report-successor-r2/bazi-t3',read=p=>JSON.parse(fs.readFileSync(p));
fs.mkdirSync(root,{recursive:true});
// Pages does not serve functions/** as static modules. Bundle the canonical
// presentation imports into this review entry without copying their authority.
await build({entryPoints:['assets/customer-ui/js/personal-products/bazi-t3-review.js'],outfile:'assets/customer-ui/js/personal-products/bazi-t3-review.bundle.js',bundle:true,format:'esm',platform:'browser',minify:true,logLevel:'silent'});
const {reading,temporalSnapshot}=read('docs/guided-report-successor-r2/bazi-source.json');
const registry=read('content/ai-economics/providers/ai-provider-cost-registry-v1.json');
const records={},snapshots={en:{},'zh-Hans':{}};
if(fs.existsSync('.tmp/bazi-t3-live'))for(const file of fs.readdirSync('.tmp/bazi-t3-live').filter(n=>n.endsWith('.json'))){const r=read(`.tmp/bazi-t3-live/${file}`);if(r.snapshot){snapshots[r.snapshot.locale][r.snapshot.sectionKey]=r.snapshot;}records[file]=r;}
const summaries=[];
for(const locale of ['en','zh-Hans']){
 const baseline=read(`docs/guided-report-successor-r2/addendum-b/bazi-${locale}.json`);
 const projection=await projectBaziSectionPublication({reading,locale,temporalContext:temporalSnapshot,composition:{registry,t3:{stage:'QA',environment:'qa',snapshots:snapshots[locale]}}});
 for(const p of projection.pages)if(p.sourcePages?.length){const n=projection.legacy.pages.find(x=>x.pageNumber===p.sourcePages[0]).sourcePageNumber,source=projection.legacy.reports.find(r=>r.pages.some(x=>x.pageNumber===n));p.primaryVisualHtml=extractPublicationDiagram(source,n);}
 const bundle=assemblePublicationSnapshot({methodId:'BZR',locale,pages:projection.pages,intro:baseline.intro,temporalSnapshot,internalPages:projection.internalSections,generatedAt:temporalSnapshot.generatedAt,layout:SECTION_LAYOUT});
 fs.writeFileSync(`${root}/bazi-${locale}.json`,JSON.stringify(bundle.customer,null,2)+'\n');
 fs.writeFileSync(`${root}/bazi-${locale}-internal.json`,JSON.stringify(bundle.internalOnly,null,2)+'\n');
 const status=projection.internalSections.filter(s=>s.t3).map(s=>({locale,sectionKey:s.sectionKey,status:projection.t3Fallback?'FALLBACK':s.t3.status,reason:projection.t3Fallback||s.t3.internalOnly?.fallbackReason||null,snapshotDigest:s.t3.snapshot?.snapshotDigest||null}));summaries.push(...status);
 const comparison=T3_SECTIONS.map(sectionKey=>({sectionKey,status:status.find(s=>s.sectionKey===sectionKey).status,current:baseline.pages.filter(p=>p.sectionKey===sectionKey).flatMap(p=>[...p.paragraphs,...(p.items||[])]),candidate:projection.pages.filter(p=>p.sectionKey===sectionKey).flatMap(p=>[...p.paragraphs,...(p.items||[])])}));
 fs.writeFileSync(`${root}/comparison-${locale}.json`,JSON.stringify(comparison,null,2)+'\n');
 fs.mkdirSync(`${root}/${locale}`,{recursive:true});
 fs.writeFileSync(`${root}/${locale}/review.html`,review(locale));
}
fs.writeFileSync(`${root}/review.html`,review(null));
fs.writeFileSync(`${root}/generation-evidence.json`,JSON.stringify({summaries,liveRecords:records,productionActivated:false},null,2)+'\n');
const acceptancePath=`${root}/acceptance.json`;
if(!fs.existsSync(acceptancePath))fs.writeFileSync(acceptancePath,JSON.stringify({compositionVersion:COMPOSITION_VERSION,verifierVersion:VERIFIER_VERSION,editorialVersion:EDITORIAL_VERSION,stage:'SHADOW',BAZI_R2_T3_ACCEPTED:false,BAZI_PRODUCTION_SUCCESSOR_ACTIVE:false,humanReviews:[],snapshotDigests:{}},null,2)+'\n');
function review(locale){return `<!doctype html><html lang="${locale||'en'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BaZi T3 · Editorial review</title><link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css"><link rel="stylesheet" href="/assets/customer-ui/surfaces/report-publication.css"><style>body{margin:0;background:#e8e5de}nav{max-width:1000px;margin:auto;padding:20px;font:16px/1.6 system-ui}button,select{font:inherit;padding:9px}#comparison{max-width:1400px;margin:auto;padding:20px}#comparison article{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:30px}#comparison article>div{padding:20px;background:#fffcf4}#comparison h2{grid-column:1/-1}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:650px){#comparison article{grid-template-columns:1fr}}@media print{nav,#comparison{display:none!important}body{background:white}}</style><nav><h1>BaZi T3 · Editorial review</h1><p>合成测试盘 / Synthetic benchmark. T3 is admitted only after semantic and editorial checks. Unavailable sections retain the existing T2 text; these are not accepted T3 candidates. Production remains unchanged.</p><a href="/docs/guided-report-successor-r2/bazi-t3/en/review.html">English</a> · <a href="/docs/guided-report-successor-r2/bazi-t3/zh-Hans/review.html">中文</a> · <a id="pdf">PDF</a> · <a href="/docs/guided-report-successor-r2/bazi-t3/STATUS.md">Evidence and remaining gates</a><p><button id="compare">T2 CURRENT | T3 CANDIDATE</button></p><details><summary>Preview shadow generation — authenticated QA only</summary><p>Uses only the fixed synthetic benchmark. A saved result is reopened without another provider call.</p><select id="section">${T3_SECTIONS.map(s=>`<option>${s}</option>`).join('')}</select> <button id="generate">Generate selected section</button><pre id="generation-status"></pre></details></nav><main id="report"></main><section id="comparison" hidden></section><script type="module" src="/assets/customer-ui/js/personal-products/bazi-t3-review.bundle.js" data-locale="${locale||''}"></script></html>`;}
console.log(JSON.stringify({reviewBuilt:true,sections:summaries,productionActivated:false},null,2));
