import fs from 'node:fs';
import {build} from 'esbuild';
import {buildZiweiR5AcceptedCopySections} from '../functions/personal-reading/narrative/ziwei-r5-accepted-copy-runtime.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../functions/personal-reading/ziwei-professional-publication-r5.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const css=['assets/customer-ui/surfaces/report-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-navigation-finalization.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n').replaceAll('url(/','url(../../');
const runtime=(await build({stdin:{contents:"import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';const root=document.querySelector('main');await document.fonts.ready;await settlePublicationAssets(root);const fit=fitPublicationForPrint(root);window.reviewQuality={pageFit:fit,overflowPages:fit.filter(p=>!p.fits),humanDecision:null};window.batchReady=true;",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',minify:true})).outputFiles[0].text.replaceAll('</script','<\\/script');
fs.mkdirSync('tools/review',{recursive:true});
fs.mkdirSync('docs/reports/ziwei/accepted-publication',{recursive:true});
const forbidden=['Authoring Pack','Candidate','ZIWEI-R5','ZWR-R5:','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
const artifacts=[];
for(const [locale,suffix] of [['zh-Hans','ZH'],['en','EN']]){
 const sections=await buildZiweiR5AcceptedCopySections({evidence:fixture.evidence,locale});
 const report=buildZiweiProfessionalSynthesisR5Publication({evidence:{structured:fixture.evidence},sections,locale,subjectPresentation:fixture.subject});
 if(report.totalPages!==39)throw Error('ZIWEI_ACCEPTED_EXPECTED_39_PAGES:'+locale+':'+report.totalPages);
 const customer=renderPublicationReport(report).replaceAll('src="/','src="../../').replaceAll('url(/','url(../../');
 for(const token of forbidden)if(customer.includes(token))throw Error('ZIWEI_ACCEPTED_CUSTOMER_TOKEN_LEAK:'+locale+':'+token);
 const customerFile='tools/review/ZIWEI-ACCEPTED-CUSTOMER-'+suffix+'.html';
 fs.writeFileSync(customerFile,'<!doctype html><html lang="'+locale+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Zi Wei Dou Shu · '+suffix+'</title><style>'+css+'</style></head><body><main>'+customer+'</main><script type="module">'+runtime+'</script></body></html>');
 const reviewFile='tools/review/ZIWEI-ACCEPTED-PUBLICATION-REVIEW-'+suffix+'.html';
 const notice=locale==='zh-Hans'?'紫微斗数 · 已验收正文出版预览。正文来自冻结 accepted copy；运行时 provider calls = 0。请检查 39 页、A4 fit、视觉与客户可见文字。Production 仍未开放。':'Zi Wei Dou Shu · accepted-copy publication review. Body copy is frozen; runtime provider calls = 0. Review all 39 pages, A4 fit, visuals and customer-visible wording. Production remains closed.';
 fs.writeFileSync(reviewFile,'<!doctype html><html lang="'+locale+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Zi Wei Accepted Publication Review · '+suffix+'</title><style>'+css+'.review-notice{max-width:210mm;margin:14px auto;padding:14px 18px;background:#fff;border:1px solid #d7c7aa;font:14px/1.5 system-ui;color:#263643}@media print{.review-notice{display:none!important}}</style></head><body><aside class="review-notice">'+notice+'</aside><main>'+customer+'</main><script type="module">'+runtime+'</script></body></html>');
 artifacts.push({locale,totalPages:report.totalPages,customerFile,reviewFile,providerCalls:0,semanticReviewCalls:0,humanEditorial:'ACCEPT',productionAdmissionGranted:false});
 console.log('PASS wrote',customerFile,'39 pages');
 console.log('PASS wrote',reviewFile,'39 pages');
}
const manifest={work:'ZIWEI-ACCEPTED-PUBLICATION',status:'READY_FOR_BROWSER_PRINT_REVIEW',source:'HUMAN_ACCEPTED_FROZEN_COPY',providerCalls:0,artifacts,productionAdmissionGranted:false};
fs.writeFileSync('docs/reports/ziwei/accepted-publication/review-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('READY Zi Wei accepted-copy bilingual publication review · no OpenAI API required.');
