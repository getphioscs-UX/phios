import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiR5AcceptedCopySections} from '../functions/personal-reading/narrative/ziwei-r5-accepted-copy-runtime.js';
import {buildZiweiProfessionalSynthesisR5Publication} from '../functions/personal-reading/ziwei-professional-publication-r5.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const runtimeSource=fs.readFileSync('functions/personal-reading/narrative/ziwei-r5-accepted-copy-runtime.js','utf8');
const generationSource=fs.readFileSync('functions/report-delivery/ziwei-r5-accepted-copy-generation.js','utf8');
assert(runtimeSource.includes("ZIWEI_R5_ACCEPTED_REFERENCE_SUBJECT='ZPA-CONTROLLED-01'"),'accepted copy must be bound to controlled reference subject');
assert(runtimeSource.includes('ZIWEI_R5_ACCEPTED_COPY_REFERENCE_ONLY'),'accepted copy must reject arbitrary customer evidence');
assert(generationSource.includes("ZIWEI_R5_ACCEPTED_GENERATION_SCOPE='CONTROLLED_REFERENCE_ONLY'"),'accepted generation must remain reference-only');
for(const source of [runtimeSource,generationSource]){
 assert(!source.includes('OPENAI_API_KEY'),'accepted-copy runtime must not depend on API key');
 assert(!source.includes('ZIWEI_R5_PAI_REGISTRY'),'accepted-copy runtime must not use provider registry');
 assert(!source.includes('composeReportSectionT3'),'accepted-copy runtime must not call live composer');
}
const forbidden=['Authoring Pack','Candidate','ZIWEI-R5','ZWR-R5:','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
for(const locale of ['zh-Hans','en']){
 const sections=await buildZiweiR5AcceptedCopySections({evidence:fixture.evidence,locale});
 const accepted=sections.filter(s=>['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'].includes(s.sectionId));
 assert.equal(accepted.length,10);
 assert(accepted.every(s=>s.humanDecision==='ACCEPT'));
 assert(accepted.every(s=>s.professionalSynthesis?.providerCalled===false));
 assert(accepted.every(s=>s.professionalSynthesis?.transportCalls===0));
 const report=buildZiweiProfessionalSynthesisR5Publication({evidence:{structured:fixture.evidence},sections,locale,subjectPresentation:fixture.subject});
 assert.equal(report.totalPages,39,locale+' accepted publication page count');
 assert.equal(report.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,12);
 const html=renderPublicationReport(report);
 for(const token of forbidden)assert(!html.includes(token),locale+' customer token leak: '+token);
}
const generator=fs.readFileSync('functions/report-delivery/ziwei-r5-accepted-copy-generation.js','utf8');
assert(generator.includes('providerCalls:0'));
assert(generator.includes('productionAdmissionGranted:false'));
assert(!fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8').includes('ziwei-r5-accepted-copy-generation.js'),'accepted-copy lane must remain outside account cutover before final browser/print acceptance');
console.log('PASS Zi Wei accepted publication reference: 39 pages bilingual, frozen gold-standard copy, provider calls 0, reference subject locked, no internal-token leakage, production cutover closed.');
