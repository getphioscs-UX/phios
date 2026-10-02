import fs from 'node:fs';
import {build} from 'esbuild';
import {buildZiweiNaturalComposerR4} from '../functions/personal-reading/narrative/ziwei-natural-composer-r4.js';
import {buildZiweiContentDepthR3Publication} from '../functions/personal-reading/ziwei-production-publication-r3.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const registry=JSON.parse(fs.readFileSync('content/ai-economics/providers/ai-provider-cost-registry-v1.json','utf8'));
const env={OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_NARRATIVE_MODEL:process.env.OPENAI_NARRATIVE_MODEL||process.env.OPENAI_MODEL,OPENAI_MODEL:process.env.OPENAI_MODEL};
if(!env.OPENAI_API_KEY)throw Error('ZIWEI_R4_OPENAI_API_KEY_REQUIRED');
if(!env.OPENAI_NARRATIVE_MODEL&&!env.OPENAI_MODEL)throw Error('ZIWEI_R4_OPENAI_MODEL_REQUIRED');

const css=[
 'assets/customer-ui/surfaces/report-print-shell-v2.css',
 'assets/customer-ui/surfaces/ziwei-print-shell-v2.css',
 'assets/customer-ui/surfaces/ziwei-navigation-finalization.css'
].map(p=>fs.readFileSync(p,'utf8')).join('\n').replaceAll('url(/','url(../../');
const runtime=(await build({stdin:{contents:`
import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';
const root=document.querySelector('main');await document.fonts.ready;await settlePublicationAssets(root);
const fit=fitPublicationForPrint(root);window.reviewQuality={pageFit:fit,overflowPages:fit.filter(p=>!p.fits),humanDecision:null};window.batchReady=true;`,
resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',minify:true})).outputFiles[0].text.replaceAll('</script','<\\/script');

fs.mkdirSync('tools/review',{recursive:true});
fs.mkdirSync('docs/reports/ziwei/natural-composer-r4',{recursive:true});
const artifacts=[];
for(const [locale,suffix] of [['zh-Hans','ZH'],['en','EN']]){
 const sections=await buildZiweiNaturalComposerR4({evidence:fixture.evidence,locale,registry,env,requestIdPrefix:'ZIWEI-R4-REVIEW'});
 const report=buildZiweiContentDepthR3Publication({evidence:{structured:fixture.evidence},sections,locale,subjectPresentation:fixture.subject});
 const body=renderPublicationReport(report).replaceAll('src="/','src="../../').replaceAll('url(/','url(../../');
 const file=`tools/review/ZIWEI-NATURAL-COMPOSER-R4-${suffix}.html`;
 fs.writeFileSync(file,`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Zi Wei Natural Composer R4 · ${suffix}</title><style>${css}
.review-notice{max-width:210mm;margin:14px auto;padding:14px 18px;background:#fff;border:1px solid #d7c7aa;font:14px/1.5 system-ui;color:#263643}@media print{.review-notice{display:none!important}}</style></head><body><aside class="review-notice"><strong>Zi Wei Natural Composer R4 · ${suffix}</strong><br>OpenAI is writing provider only. Calculation, semantic authority and Print Shell V2 remain governed. Review content quality only; production cutover is NOT granted.</aside><main>${body}</main><script type="module">${runtime}</script></body></html>`);
 artifacts.push({locale,path:file,totalPages:report.totalPages,sections:sections.map(s=>({sectionId:s.sectionId,editorialVersion:s.editorialVersion,naturalComposition:s.naturalComposition})),humanDecision:null});
 console.log('PASS wrote',file,report.totalPages,'pages');
}
fs.writeFileSync('docs/reports/ziwei/natural-composer-r4/review-manifest.json',JSON.stringify({work:'ZIWEI-NATURAL-COMPOSER-R4',status:'READY_FOR_HUMAN_REVIEW',meaningAuthority:'UNCHANGED',providerAuthority:'WRITING_ONLY',printShell:'PHI-OS-REPORT-PRINT-SHELL-V2',artifacts,allowedDecision:['ACCEPT','REJECT'],productionCutover:'NOT_GRANTED'},null,2)+'\n');
console.log('READY Zi Wei Natural Composer R4 human review.');
