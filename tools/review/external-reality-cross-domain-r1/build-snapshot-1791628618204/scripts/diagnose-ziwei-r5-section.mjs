import fs from 'node:fs';
import {buildZiweiProfessionalSynthesisR5} from '../functions/personal-reading/narrative/ziwei-professional-synthesis-r5.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../functions/personal-reading/narrative/ziwei-r5-provider-registry.js';

const sectionId=String(process.argv[2]||'S02').toUpperCase();
const locale=process.argv[3]==='en'?'en':'zh-Hans';
const allowed=new Set(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
if(!allowed.has(sectionId))throw Error('ZIWEI_R5_DIAG_SECTION_INVALID:'+sectionId);
if(!String(process.env.OPENAI_API_KEY||'').trim())throw Error('ZIWEI_R5_OPENAI_API_KEY_REQUIRED');

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
console.log('ZIWEI R5 SECTION DIAG START',locale,sectionId);
const sections=await buildZiweiProfessionalSynthesisR5({
  evidence:fixture.evidence,
  locale,
  registry:ZIWEI_R5_PAI_REGISTRY,
  env:{OPENAI_API_KEY:process.env.OPENAI_API_KEY},
  requestIdPrefix:'ZIWEI-R5-DIAG',
  onlySectionIds:[sectionId],
  onProgress:event=>{
    if(event.phase==='SECTION_START')console.log(event.sectionId,'START');
    if(event.phase==='SECTION_END')console.log(event.sectionId,'END',event.status);
  }
});
const row=sections.find(s=>s.sectionId===sectionId);
const p=row?.professionalSynthesis||{};
const out={
  sectionId,locale,
  status:p.status||null,
  composerStatus:p.composerStatus||null,
  provider:p.provider||null,
  model:p.model||null,
  actualTier:p.actualTier||null,
  fallbackReason:p.fallbackReason||null,
  transportCalls:p.transportCalls||0,
  semanticReviewCalls:p.semanticReviewCalls||0,
  verificationReasons:p.verificationReasons||[],
  semanticReviewReasons:p.semanticReviewReasons||[],
  editorialReasons:p.editorialQuality?.reasons||[],
  attemptLog:(p.attemptLog||[]).map(x=>({
    kind:x.kind||null,attempt:x.attempt??null,state:x.state||null,
    errorClass:x.errorClass||null,reasons:x.reasons||[],
    providerErrorCode:x.providerErrorCode||null,httpStatus:x.httpStatus??null
  }))
};
console.log(JSON.stringify(out,null,2));
if(out.status!=='PASS')process.exitCode=1;
