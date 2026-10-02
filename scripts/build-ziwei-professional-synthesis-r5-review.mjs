import fs from 'node:fs';
import {build} from 'esbuild';
import {buildZiweiProfessionalSynthesisR5} from '../functions/personal-reading/narrative/ziwei-professional-synthesis-r5.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../functions/personal-reading/narrative/ziwei-r5-provider-registry.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../functions/personal-reading/ziwei-professional-publication-r5.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const env={OPENAI_API_KEY:process.env.OPENAI_API_KEY};
if(!env.OPENAI_API_KEY)throw Error('ZIWEI_R5_OPENAI_API_KEY_REQUIRED');
const css=['assets/customer-ui/surfaces/report-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-navigation-finalization.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n').replaceAll('url(/','url(../../');
const runtime=(await build({stdin:{contents:"import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';const root=document.querySelector('main');await document.fonts.ready;await settlePublicationAssets(root);const fit=fitPublicationForPrint(root);window.reviewQuality={pageFit:fit,overflowPages:fit.filter(p=>!p.fits),humanDecision:null};window.batchReady=true;",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',minify:true})).outputFiles[0].text.replaceAll('</script','<\\/script');
fs.mkdirSync('tools/review',{recursive:true});fs.mkdirSync('docs/reports/ziwei/professional-synthesis-r5',{recursive:true});
const artifacts=[];
for(const [locale,suffix] of [['zh-Hans','ZH'],['en','EN']]){
 console.log('R5 START',locale,'10 natural sections · OpenAI Sol deep composition');
 const sections=await buildZiweiProfessionalSynthesisR5({
  evidence:fixture.evidence,locale,registry:ZIWEI_R5_PAI_REGISTRY,env,requestIdPrefix:'ZIWEI-R5-REVIEW',
  onProgress:event=>{
   if(event.phase==='SECTION_START')console.log('R5',event.locale,event.sectionId,'START');
   if(event.phase==='SECTION_END')console.log('R5',event.locale,event.sectionId,event.status,'composer='+event.composerStatus,'model='+(event.model||'none'),'calls='+event.transportCalls,'semanticReviews='+event.semanticReviewCalls,'units='+event.totalUnits+(event.reasons?.length?' reasons='+event.reasons.join(','):'')+(event.fallbackReason?' fallback='+event.fallbackReason:''));
  }
 });
 const natural=sections.filter(s=>s.professionalSynthesis?.status!=='NOT_REQUESTED');
 const failed=natural.filter(s=>s.professionalSynthesis?.status!=='PASS'||s.professionalSynthesis?.composerStatus!=='PASS'||s.professionalSynthesis?.providerCalled!==true||s.professionalSynthesis?.verificationAccepted!==true||s.professionalSynthesis?.editorialQuality?.accepted!==true||s.professionalSynthesis?.actualTier!=='T3_GOVERNED_DEEP_COMPOSITION'||s.professionalSynthesis?.model!=='gpt-5.6-sol'||!(s.professionalSynthesis?.semanticReviewCalls>0)||!(s.professionalSynthesis?.transportCalls>1));
 if(failed.length){
  const evidence={locale,status:'R5_GENERATION_REJECTED_NO_REVIEW_ARTIFACT',failed:failed.map(s=>({sectionId:s.sectionId,status:s.professionalSynthesis.status,composerStatus:s.professionalSynthesis.composerStatus,model:s.professionalSynthesis.model,actualTier:s.professionalSynthesis.actualTier,reasons:s.professionalSynthesis.editorialQuality?.reasons||[],fallbackReason:s.professionalSynthesis.fallbackReason,verificationReasons:s.professionalSynthesis.verificationReasons||[],semanticReviewReasons:s.professionalSynthesis.semanticReviewReasons||[],attemptLog:s.professionalSynthesis.attemptLog||[],transportCalls:s.professionalSynthesis.transportCalls,semanticReviewCalls:s.professionalSynthesis.semanticReviewCalls}))};
  fs.writeFileSync('docs/reports/ziwei/professional-synthesis-r5/failure-'+suffix+'.json',JSON.stringify(evidence,null,2)+'\n');
  const summary=failed.map(s=>s.sectionId+':'+(s.professionalSynthesis.fallbackReason||s.professionalSynthesis.status)+':'+(s.professionalSynthesis.attemptLog?.at(-1)?.providerErrorCode||s.professionalSynthesis.verificationReasons?.[0]||'NO_DETAIL')).join('|');
  throw Error('ZIWEI_R5_REVIEW_BLOCKED:'+suffix+':'+summary);
 }
 const report=buildZiweiProfessionalSynthesisR5Publication({evidence:{structured:fixture.evidence},sections,locale,subjectPresentation:fixture.subject});
 if(report.totalPages!==39)throw Error('ZIWEI_R5_EXPECTED_39_PAGES:'+locale+':'+report.totalPages);
 const body=renderPublicationReport(report).replaceAll('src="/','src="../../').replaceAll('url(/','url(../../');
 const file='tools/review/ZIWEI-PROFESSIONAL-SYNTHESIS-R5-'+suffix+'.html';
 fs.writeFileSync(file,'<!doctype html><html lang="'+locale+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Zi Wei Professional Synthesis R5 · '+suffix+'</title><style>'+css+'.review-notice{max-width:210mm;margin:14px auto;padding:14px 18px;background:#fff;border:1px solid #d7c7aa;font:14px/1.5 system-ui;color:#263643}@media print{.review-notice{display:none!important}}</style></head><body><aside class="review-notice"><strong>Zi Wei Professional Synthesis R5 · '+suffix+'</strong><br>R5 Synthesis IR → OpenAI Sol deep composer → semantic review → verifier → editorial gate all PASS. Review professional content depth and page fit. Production cutover is NOT granted.</aside><main>'+body+'</main><script type="module">'+runtime+'</script></body></html>');
 artifacts.push({locale,path:file,totalPages:report.totalPages,model:'gpt-5.6-sol',sections:natural.map(s=>({sectionId:s.sectionId,status:s.professionalSynthesis.status,totalUnits:s.professionalSynthesis.editorialQuality.totalUnits,semanticReviewCalls:s.professionalSynthesis.semanticReviewCalls,transportCalls:s.professionalSynthesis.transportCalls})),humanDecision:null});
 console.log('PASS wrote',file,report.totalPages,'pages');
}
fs.writeFileSync('docs/reports/ziwei/professional-synthesis-r5/review-manifest.json',JSON.stringify({work:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5',status:'READY_FOR_HUMAN_REVIEW',predecessor:'ZIWEI-NATURAL-COMPOSER-R4_REJECTED_FOR_PROFESSIONAL_DEPTH',synthesisAuthority:'ZIWEI_R5_SYNTHESIS_IR',providerAuthority:'WRITING_ONLY',providerModel:'gpt-5.6-sol',printShell:'PHI-OS-REPORT-PRINT-SHELL-V2',artifacts,allowedDecision:['ACCEPT','REJECT'],productionCutover:'NOT_GRANTED'},null,2)+'\n');
console.log('READY Zi Wei R5 professional synthesis human review.');
