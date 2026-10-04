import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {buildZiweiReportEvidence} from '../functions/personal-reading/narrative/ziwei-publication-adapter.js';
import {buildZiweiContentDepthR3Sections} from '../functions/personal-reading/narrative/ziwei-production-composer-r3.js';
import {buildZiweiR5AuthoringPack} from '../functions/personal-reading/narrative/ziwei-r5-authoring-pack.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../functions/personal-reading/ziwei-professional-publication-r5.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';

const campaignPath='docs/reports/ziwei/production-admission/zwr-pro-w10-live-campaign.json';
if(!fs.existsSync(campaignPath))throw Error('ZWR_PRO_W11_W10_LIVE_EVIDENCE_REQUIRED');
const campaign=JSON.parse(fs.readFileSync(campaignPath,'utf8'));
if(campaign.status!=='PASS_LIVE_CAMPAIGN')throw Error('ZWR_PRO_W11_W10_LIVE_PASS_REQUIRED');

const css=['assets/customer-ui/surfaces/report-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-navigation-finalization.css']
 .map(p=>fs.readFileSync(p,'utf8')).join('\n').replaceAll('url(/','url(../../');
const runtime=(await build({stdin:{contents:"import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';const root=document.querySelector('main');await document.fonts.ready;await settlePublicationAssets(root);const fit=fitPublicationForPrint(root);window.reviewQuality={pageFit:fit,overflowPages:fit.filter(p=>!p.fits),humanDecision:null};window.batchReady=true;",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',minify:true})).outputFiles[0].text.replaceAll('</script','<\\/script');

const ids=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
const forbidden=['Authoring Pack','Candidate','ZIWEI-R5','ZWR-R5:','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
fs.mkdirSync('tools/review',{recursive:true});
fs.mkdirSync('docs/reports/ziwei/production-admission',{recursive:true});

function requestForLocale(input,locale){
 const r=structuredClone(input.executionRequest);r.canonicalInput.locale=locale;return r;
}
function customerSections({base,pack,candidates}){
 const map=new Map(candidates.map(c=>[c.sectionId,c]));
 return base.map(section=>{
  if(!ids.includes(section.sectionId))return section;
  const c=map.get(section.sectionId),p=pack.sections.find(x=>x.sectionId===section.sectionId);
  if(!c||!p)throw Error('ZWR_PRO_W11_SECTION_MISSING:'+section.sectionId);
  return {
   ...section,
   paragraphs:c.paragraphs.map(x=>x.text),
   claims:p.claims,
   synthesisIr:{
    sectionId:p.sectionId,locale:p.locale,keyInsights:p.keyInsights,
    primaryPalaces:p.primaryPalaces,contextPalaces:p.contextPalaces,
    claims:p.claims,evidenceSummary:p.evidenceSummary
   },
   publicationIr:{
    blocks:c.paragraphs.map((x,i)=>({
     blockId:`ZWR-PRO:${section.sectionId}:B${i+1}`,
     prose:x.text,claimRefs:x.claimRefs||[],supportRefs:x.supportRefs||[]
    }))
   },
   editorialVersion:'ZWR-PRO-W4-LLM-PROFESSIONAL-COMPOSER-v1',
   professionalSynthesis:{status:'PASS',w5:true,w6:true,w7:true,w8:true,source:'W10_LIVE_CAMPAIGN'}
  };
 });
}

const artifacts=[];
for(const row of campaign.results){
 const id=row.fixtureId;
 const input=JSON.parse(fs.readFileSync(`docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-${id}-input.json`,'utf8'));
 const evidence=await buildZiweiReportEvidence({subjectId:`ZPA-CONTROLLED-${id}`,executionRequest:requestForLocale(input,'en'),targetContext:input.targetContext,locale:'en'});
 const subjectPresentation={
  displayName:`Controlled QA ${id}`,
  birthDate:input.executionRequest.canonicalInput.birthDate,
  birthTime:input.executionRequest.canonicalInput.birthTime
 };
 for(const [locale,suffix] of [['zh-Hans','ZH'],['en','EN']]){
  const candidates=row.snapshot.localeSnapshots[locale].semanticContent.candidates;
  const base=await buildZiweiContentDepthR3Sections({evidence,locale});
  const pack=await buildZiweiR5AuthoringPack({evidence,locale});
  const sections=customerSections({base,pack,candidates});
  const report=buildZiweiProfessionalSynthesisR5Publication({evidence,sections,locale,subjectPresentation});
  if(report.totalPages!==39)throw Error('ZWR_PRO_W11_PAGE_COUNT_DRIFT:'+id+':'+locale+':'+report.totalPages);
  const customer=renderPublicationReport(report).replaceAll('src="/','src="../../').replaceAll('url(/','url(../../');
  for(const token of forbidden)if(customer.includes(token))throw Error('ZWR_PRO_W11_CUSTOMER_TOKEN_LEAK:'+id+':'+locale+':'+token);
  const file=`tools/review/ZWR-PRO-W11-${id}-${suffix}.html`;
  const notice=locale==='zh-Hans'
   ?`紫微斗数生产候选 · Controlled ${id} · W10 live snapshot ${row.reportSnapshotId.slice(0,24)}… · 请检查正文质量、重复、视觉、39页及打印溢出。此页尚未生产开放。`
   :`Zi Wei production candidate · Controlled ${id} · W10 live snapshot ${row.reportSnapshotId.slice(0,24)}… · Review prose quality, repetition, visuals, all 39 pages and print overflow. Production is still closed.`;
  fs.writeFileSync(file,'<!doctype html><html lang="'+locale+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ZWR-PRO W11 '+id+' '+suffix+'</title><style>'+css+'.review-notice{max-width:210mm;margin:14px auto;padding:14px 18px;background:#fff;border:1px solid #d7c7aa;font:14px/1.5 system-ui;color:#263643}@media print{.review-notice{display:none!important}}</style></head><body><aside class="review-notice">'+notice+'</aside><main>'+customer+'</main><script type="module">'+runtime+'</script></body></html>');
  artifacts.push({fixtureId:id,locale,file,totalPages:39,reportSnapshotId:row.reportSnapshotId,humanDecision:null});
 }
}
const manifestSeed={
 schemaVersion:'ZWR-PRO-W11-HUMAN-REVIEW-MANIFEST-v1',
 status:'READY_FOR_HUMAN_REVIEW',
 sourceCampaign:'ZWR-PRO-W10-LIVE-CAMPAIGN-v1',
 campaignCompletedAt:campaign.completedAt,
 subjectCount:campaign.subjectCount,
 artifacts,
 requiredDecision:'HUMAN_ACCEPT_ALL_BROWSER_PRINT_ARTIFACTS',
 productionAdmissionGranted:false
};
const manifest={...manifestSeed,manifestDigest:await sha256Stable(manifestSeed)};
fs.writeFileSync('docs/reports/ziwei/production-admission/zwr-pro-w11-review-manifest.json',JSON.stringify(manifest,null,2)+'\n');

const cards=artifacts.map(a=>'<a class="card" href="../../'+a.file+'"><strong>Controlled '+a.fixtureId+' · '+(a.locale==='zh-Hans'?'中文':'English')+'</strong><span>39 pages · '+a.reportSnapshotId.slice(0,18)+'…</span></a>').join('');
const index='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZWR-PRO W11 Human Review</title><style>body{margin:0;background:#111827;color:#f4efe6;font:15px/1.55 system-ui}main{max-width:1000px;margin:0 auto;padding:48px 24px 80px}h1{font:600 32px/1.2 Georgia,serif}p{color:#c9c2b5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:28px}.card{display:flex;flex-direction:column;gap:8px;padding:18px;border:1px solid #6f5d3d;background:#1b2230;color:#f4efe6;text-decoration:none}.card span{color:#c9c2b5;font-size:13px}.gate{margin-top:28px;padding:18px;border-left:3px solid #b8985f;background:#171d28}</style></head><body><main><h1>ZWR-PRO W11 · Browser / Print Human Acceptance</h1><p>Review every generated controlled report in both languages. W10 machine gates have passed; production remains closed until explicit human ACCEPT.</p><div class="gate">Acceptance requires: professional Zi Wei depth comparable to the gold standard; subject-specific differences; no template repetition; no internal language; correct visuals; 39-page completeness; no browser/print overflow.</div><div class="grid">'+cards+'</div></main></body></html>';
fs.writeFileSync('tools/review/ZWR-PRO-W11-HUMAN-REVIEW.html',index);
console.log('READY ZWR-PRO W11:',artifacts.length,'browser/print artifacts; open tools/review/ZWR-PRO-W11-HUMAN-REVIEW.html');
