import fs from 'node:fs';
import {build} from 'esbuild';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
import {adaptBaziPersonalRealityProduct} from '../functions/personal-reality-product/adapters/bazi-production-adapter.js';
import {BAZI_SECTION_REGISTRY} from '../functions/canonical-presentation-runtime/report-section-contract.js';
import {resolveReportProduct} from '../functions/pws/commercial/report-successor-contract.js';
const root='docs/guided-report-successor-r2/visual-commerce';fs.mkdirSync(root,{recursive:true});
const {reading,temporalSnapshot}=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
const price=resolveReportProduct('BAZI_FULL_REPORT');
for(const locale of ['en','zh-Hans'])for(const mode of ['free','locked','paid']){
 const full=mode==='paid',report=await buildBaziCustomerPublication({reading,locale,temporalSnapshot,full});
 const native=adaptBaziPersonalRealityProduct({report:reading,locale});
 const product={schemaVersion:native.schemaVersion,methodId:native.methodId,locale:native.locale,state:native.state,hero:native.hero,sections:[],visuals:[],navigation:[],sourceProduct:full?reading:null,publicationReport:report,lockedOutline:full?[]:BAZI_SECTION_REGISTRY.sections.map(s=>({title:s.title[locale]})),reportAccess:{state:full?'FULL_REPORT':'FREE_REPORT_PREVIEW',fullState:full?'OPEN':'PAID_LOCKED',verifiedPurchase:full,entitlementKey:price.entitlementKey,offer:{productId:'COM-REPORT-BAZI-FULL',contractProductId:price.productId,amountMinor:price.amountMinor,currency:price.currency,href:'/account/?product=COM-REPORT-BAZI-FULL#commerce'}},reviewEvidenceClass:'SYNTHETIC_PRESENTATION_ONLY_NOT_PURCHASE_EVIDENCE'};
 fs.writeFileSync(`${root}/${mode}-${locale}.json`,JSON.stringify(product,null,2)+'\n');
 const folder=`${root}/${mode}/${locale}`;fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(`${folder}/review.html`,html(mode,locale));
 if(full)fs.writeFileSync(`${root}/bazi-${locale}.json`,JSON.stringify(report,null,2)+'\n');
}
for(const mode of ['free','locked','paid']){fs.mkdirSync(`${root}/${mode}`,{recursive:true});fs.writeFileSync(`${root}/${mode}/review.html`,html(mode,'en'));}
fs.writeFileSync(`${root}/review.html`,html('paid',null));
await build({entryPoints:['assets/customer-ui/js/personal-products/bazi-visual-commerce-review.js'],outfile:'assets/customer-ui/js/personal-products/bazi-visual-commerce-review.bundle.js',format:'esm',bundle:true,platform:'browser',minify:true});
function html(mode,locale){return `<!doctype html><html lang="${locale||'en'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BaZi ${mode} · Visual review</title><link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css"><link rel="stylesheet" href="/assets/customer-ui/surfaces/report-publication.css"><style>body{margin:0;background:#e8e5de}nav{max-width:940px;margin:auto;padding:18px;font:16px/1.6 system-ui}.bazi-report-unlock{padding:24px;max-width:894px;margin:20px auto;background:#fffaf1}.cx-button{display:inline-block;padding:14px;background:#19364e;color:white}details[data-bazi-technical-detail]{max-width:940px;margin:auto}main{min-width:0}@media print{nav,.bazi-report-unlock,details[data-bazi-technical-detail]{display:none!important}body{background:white}}</style><nav><h1>BaZi ${mode.toUpperCase()} · 审阅</h1><p>Synthetic presentation fixture. Paid state here tests layout only; it is not a purchased entitlement or a released private report. T3 rejection never hides source-bound visuals. Production remains closed.</p>${['free','locked','paid'].map(m=>`<a href="/${root}/${m}/${locale||'en'}/review.html">${m.toUpperCase()}</a>`).join(' · ')} · <a href="/${root}/${mode}/en/review.html">EN</a> · <a href="/${root}/${mode}/zh-Hans/review.html">中文</a>${mode==='paid'?` · <a href="/${root}/bazi-paid-${locale||'en'}.pdf">PDF</a>`:''}</nav><main id="report"></main><script type="module" src="/assets/customer-ui/js/personal-products/bazi-visual-commerce-review.bundle.js" data-mode="${mode}" data-locale="${locale||''}"></script></html>`;}
console.log('Built six explicit synthetic review states; no entitlement written or activated.');
