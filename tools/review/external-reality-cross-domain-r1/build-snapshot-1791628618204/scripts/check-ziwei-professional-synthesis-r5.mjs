import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiContentDepthR3Sections} from '../functions/personal-reading/narrative/ziwei-production-composer-r3.js';
import {buildZiweiSynthesisIrR5,ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION} from '../functions/personal-reading/narrative/ziwei-professional-synthesis-r5.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../functions/personal-reading/ziwei-professional-publication-r5.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../functions/personal-reading/narrative/ziwei-r5-provider-registry.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const canonical=JSON.parse(fs.readFileSync('content/ai-economics/providers/ai-provider-cost-registry-v1.json','utf8'));
const sol=canonical.models.find(m=>m.providerId==='OPENAI'&&m.modelId==='gpt-5.6-sol');
assert(sol&&sol.capabilityClass==='DEEP','Canonical Sol deep route missing');
assert.deepEqual(ZIWEI_R5_PAI_REGISTRY.models,[sol],'R5 provider registry must project canonical Sol exactly');

const writer=fs.readFileSync('functions/personal-reading/narrative/narrative-writer.js','utf8');
assert(writer.includes("ZIWEI_PROFESSIONAL_SYNTHESIS_R5"));
assert(writer.includes("aiExecutionClass='T2_LIGHT_COMPOSITION'"));
assert(writer.includes("'T3_DEEP_COMPOSITION'"));
assert(writer.includes('Never organize the prose as “star A means'));
const t3=fs.readFileSync('functions/personal-reading/narrative/report-section-t3-composer.js','utf8');
assert(t3.includes("aiExecutionClass:'T3_DEEP_COMPOSITION'"));

const expectedRoles=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','NAVIGATION'];
for(const locale of ['zh-Hans','en']){
 const base=await buildZiweiContentDepthR3Sections({evidence:fixture.evidence,locale}),sections=[],prior=[];
 for(const section of base){
  if(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'].includes(section.sectionId)){
   const ir=await buildZiweiSynthesisIrR5({evidence:fixture.evidence,section,locale,priorSynthesis:prior});prior.push(ir);
   assert.equal(ir.version,ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION);
   assert(ir.claims.every(c=>c.sourceRefs.length>0),'R5 claim source lineage required');
   const roles=new Set(ir.claims.map(c=>c.explanationRole));
   for(const role of expectedRoles)assert(roles.has(role),section.sectionId+': missing '+role);
   if(['S02','S04','S05','S09','S10','S11'].includes(section.sectionId))assert(roles.has('TIMING_RELEVANCE'),section.sectionId+': timing synthesis missing');
   const prose=ir.claims.map(c=>c.text).join('\n');
   assert(!prose.includes('呈现「'),'R5 synthesis IR must not regress to star-glossary Chinese');
   assert(!/\b[A-Z][A-Za-z ]{1,18}\s+brings\b/.test(prose),'R5 synthesis IR must not regress to star-glossary English');
   sections.push({...section,synthesisIr:ir,editorialVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION});
  }else sections.push({...section,editorialVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION});
 }
 const s04=sections.find(s=>s.sectionId==='S04').synthesisIr;
 assert(s04.claims.some(c=>c.claimType==='PALACE_STAR_SYNTHESIS'));
 assert(s04.claims.some(c=>c.claimType==='PALACE_NETWORK_SYNTHESIS'));
 assert(s04.claims.some(c=>c.claimType==='TIMING_SYNTHESIS'));
 const report=buildZiweiProfessionalSynthesisR5Publication({evidence:{structured:fixture.evidence},sections,locale,subjectPresentation:fixture.subject});
 assert.equal(report.totalPages,39,locale+' R5 page count');
 assert.equal(report.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,12);
 assert(report.pages.every(p=>p.editorialVersion===ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION));
}
assert(writer.includes("r5StructuralReject=brief.styleIntent?.methodStyleProfile==='ZIWEI_PROFESSIONAL_SYNTHESIS_R5'&&semanticReviewCalls===0"),'R5 structural reject must not trigger paid repair');

const review=fs.readFileSync('scripts/build-ziwei-professional-synthesis-r5-review.mjs','utf8');
assert(review.includes('R5_GENERATION_REJECTED_NO_REVIEW_ARTIFACT'));
assert(review.includes('failFast:true'),'R5 human review must stop on first rejected section');
assert(review.includes("actualTier!=='T3_GOVERNED_DEEP_COMPOSITION'"));
assert(review.includes("model!=='gpt-5.6-sol'"));
assert(review.includes('semanticReviewCalls>0'));
assert(review.includes('transportCalls>1'));
const generation=fs.readFileSync('functions/report-delivery/ziwei-professional-synthesis-r5-generation.js','utf8');
assert(generation.includes('productionAdmissionGranted:false'));
assert(generation.includes("report.totalPages!==39"));
assert(!fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8').includes('ziwei-professional-synthesis-r5-generation.js'),'R5 must remain outside account cutover before human ACCEPT');
console.log('PASS Zi Wei R5: synthesis IR consumes palace/star/network/transformation/timing evidence; Sol deep composer is fail-closed; 39-page review architecture; no production cutover.');
