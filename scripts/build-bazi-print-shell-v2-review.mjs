import fs from 'node:fs';
import {build} from 'esbuild';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const css=[
 'assets/css/tokens.css',
 'assets/customer-ui/surfaces/visual-report.css',
 'assets/customer-ui/surfaces/report-publication.css',
 'assets/customer-ui/surfaces/report-print-shell-v2.css',
 'assets/customer-ui/surfaces/bazi-print-shell-v2.css'
].map(p=>fs.readFileSync(p,'utf8')).join('\n').replaceAll('url(/','url(../../');
const runtime=(await build({stdin:{contents:`
import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';
const root=document.querySelector('main');
await document.fonts.ready;
await settlePublicationAssets(root);
const fit=fitPublicationForPrint(root);
window.reviewQuality={pageFit:fit,overflowPages:fit.filter(p=>!p.fits),humanDecision:null};
window.measureReport=()=>{const f=fitPublicationForPrint(root);return {pageFit:f,overflowPages:f.filter(p=>!p.fits)}};
window.batchReady=true;`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',minify:true})).outputFiles[0].text.replaceAll('</script','<\\/script');

fs.mkdirSync('tools/review',{recursive:true});
const artifacts=[];
for(const [locale,suffix] of [['zh-Hans','ZH'],['en','EN']]){
 const report=await buildBaziCustomerPublication({reading:source.reading,locale,temporalSnapshot:source.temporalSnapshot,full:true,compositionR1:true});
 const body=renderPublicationReport(report).replaceAll('src="/','src="../../').replaceAll('url(/','url(../../');
 const file=`tools/review/BAZI-PRINT-SHELL-V2-${suffix}.html`;
 fs.writeFileSync(file,`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BaZi Print Shell V2 · ${suffix}</title><style>${css}
.review-notice{max-width:210mm;margin:14px auto;padding:14px 18px;background:#fff;border:1px solid #d7c7aa;font:14px/1.5 system-ui;color:#263643}@media print{.review-notice{display:none!important}}</style></head><body><aside class="review-notice"><strong>BaZi Print Shell V2 migration review · ${suffix}</strong><br>Accepted content and Composition R1 are unchanged. Review presentation / print only. Expected: 38 A4 pages, 10 existing Section Masters, no semantic rewrite.</aside><main>${body}</main><script type="module">${runtime}</script></body></html>`);
 artifacts.push({locale,path:file,totalPages:report.totalPages,sectionMasters:report.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,printShell:'PHI-OS-REPORT-PRINT-SHELL-V2',humanDecision:null});
 console.log('PASS wrote',file,report.totalPages,'pages');
}
fs.mkdirSync('docs/acceptance/bazi-paid-report/print-shell-v2',{recursive:true});
fs.writeFileSync('docs/acceptance/bazi-paid-report/print-shell-v2/review-manifest.json',JSON.stringify({work:'MR-W1.6-BAZI-PRINT-SHELL-V2-MIGRATION',status:'READY_FOR_VISUAL_PRINT_REVIEW',editorial:'FROZEN_UNCHANGED',compositionR1:'FROZEN_UNCHANGED',artifacts,allowedDecision:['ACCEPT','REJECT'],productionAdmission:'UNCHANGED'},null,2)+'\n');
console.log('READY BaZi Print Shell V2 human visual/print review.');
