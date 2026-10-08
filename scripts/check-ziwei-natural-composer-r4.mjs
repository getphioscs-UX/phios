import {HISTORICAL_ZIWEI_PAGE_COUNTS,resolveMethodRenderContract} from '../functions/report-delivery/ziwei-vfr-method-profile.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZIWEI_R4_PAI_REGISTRY} from '../functions/personal-reading/narrative/ziwei-r4-provider-registry.js';

const r4=fs.readFileSync('functions/personal-reading/narrative/ziwei-natural-composer-r4.js','utf8');
assert(r4.includes('composeReportSectionT2'));
assert(!r4.includes('composePublicationNarrative'));
assert(r4.includes('buildReportSectionNarrativeBrief'));
assert(r4.includes('PROFESSIONAL_ZIWEI_PERSONAL_READING'));
assert(r4.includes('providerCalled'));
assert(r4.includes('verificationAccepted'));
assert(r4.includes('semanticReviewCalls'));
assert(r4.includes('evaluateZiweiR4Editorial'));
assert(r4.includes("'EDITORIAL_REJECTED'"));
assert(r4.includes("'R4_LONG_FORM_TOO_THIN'"));
assert(r4.includes("'R4_STAR_GLOSSARY_PATTERN'"));

const writer=fs.readFileSync('functions/personal-reading/narrative/narrative-writer.js','utf8');
assert(writer.includes("brief.methodId==='ZWR'"));
assert(writer.includes('ZI WEI R4 PROFESSIONAL READING'));
assert(writer.includes('not as a star glossary'));
assert(writer.includes('semantic verifier'));

const reviewBuilder=fs.readFileSync('scripts/build-ziwei-natural-composer-r4-review.mjs','utf8');
assert(reviewBuilder.includes('ZIWEI_R4_OPENAI_API_KEY_REQUIRED'));
assert(!reviewBuilder.includes('ZIWEI_R4_OPENAI_MODEL_REQUIRED'),'Canonical PAI registry must own model selection');

const generation=fs.readFileSync('functions/report-delivery/ziwei-natural-composer-r4-generation.js','utf8');
assert(generation.includes("generateZiweiProductionCandidate"));
assert(generation.includes('buildZiweiNaturalComposerR4'));
assert(generation.includes("naturalComposition?.status!=='PASS'"));
assert(generation.includes("composerStatus!=='PASS'"));
assert(generation.includes("providerCalled!==true"));
assert(generation.includes("verificationAccepted!==true"));
assert(generation.includes("editorialQuality?.accepted!==true"));
assert(generation.includes("semanticReviewCalls>0"));
assert(generation.includes("transportCalls>1"));
assert(generation.includes("productionAdmissionGranted:false"));

const publication=fs.readFileSync('functions/personal-reading/ziwei-production-publication-r3.js','utf8');
assert(publication.includes("sections.find(section=>section.sectionId===p.sectionId)?.editorialVersion||'ZIWEI-CONTENT-DEPTH-R3'"),'R4 publication pages must preserve successor editorial lineage');

const privateRenderer=fs.readFileSync('workers/method-report-renderer/index.js','utf8');
assert(Object.isFrozen(HISTORICAL_ZIWEI_PAGE_COUNTS));
for(const version of ['ZIWEI-PRODUCTION-COMPOSER-V1','ZIWEI-NATURAL-COMPOSER-R4'])for(const locale of ['en','zh-Hans']){
 assert.equal(HISTORICAL_ZIWEI_PAGE_COUNTS[version],33);
 const candidate={locale,snapshot:{methodId:'ZWR',compositionVersion:version,semanticContent:{report:{totalPages:33}}}};
 const contract=resolveMethodRenderContract(candidate);assert.equal(contract.expectedPageCount,33);assert.equal(contract.rendererId,'ZIWEI_HISTORICAL');
 for(const pages of [32,34])assert.throws(()=>resolveMethodRenderContract({...candidate,snapshot:{...candidate.snapshot,semanticContent:{report:{totalPages:pages}}}}),/METHOD_RENDER_CONTRACT_UNADMITTED/);
 assert.throws(()=>resolveMethodRenderContract({...candidate,snapshot:{...candidate.snapshot,compositionVersion:'UNAUTHORIZED_VERSION'}}),/METHOD_RENDER_CONTRACT_UNADMITTED/);
 assert.throws(()=>resolveMethodRenderContract({...candidate,snapshot:{...candidate.snapshot,semanticContent:{...candidate.snapshot.semanticContent,visualReportIr:{}}}}),/ZIWEI_VFR_GENERATION_RENDERER_MISMATCH/);
}
assert(privateRenderer.includes("import {assertMethodGeneration} from '../../functions/report-delivery/method-render-contract.js'"));
assert(privateRenderer.includes('await assertMethodGeneration(candidate)'));
assert(privateRenderer.includes('method!==contract.methodCode'));
assert(privateRenderer.includes('compositionVersion!==contract.compositionVersion'));
assert(privateRenderer.includes('semanticSnapshotId!==candidate.snapshot.semanticSnapshotId'));


const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
const cutoverPath='docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json';
if(fs.existsSync(cutoverPath)){
 const cutover=JSON.parse(fs.readFileSync(cutoverPath,'utf8'));
 assert.equal(cutover.schemaVersion,'ZWR-VFR-R1-DEEP-PRODUCTION-CUTOVER-v2');
 assert(binding.includes("ziwei-vfr-r1-generation.js"),'post-cutover canonical binding must use Zi Wei VFR generator');
 assert(binding.includes('generateZiweiVfrR1Candidate'),'post-cutover canonical binding generator drift');
}else{
 assert(binding.includes("ziwei-professional-synthesis-r5-generation.js"),'pre-cutover canonical binding must remain on R5');
 assert(binding.includes('generateZiweiProfessionalSynthesisR5Candidate'),'pre-cutover R5 binding drift');
}
assert(fs.existsSync('functions/report-delivery/ziwei-natural-composer-r4-generation.js'));
const account=fs.readFileSync('functions/account/ziwei-account-delivery.js','utf8');
assert(account.includes('compositionVersion:candidate.snapshot.compositionVersion'));
assert(!account.includes("compositionVersion:'ZIWEI-PRODUCTION-COMPOSER-V1'"));

const canonical=JSON.parse(fs.readFileSync('content/ai-economics/providers/ai-provider-cost-registry-v1.json','utf8'));
const luna=canonical.models.find(model=>model.providerId==='OPENAI'&&model.modelId==='gpt-5.6-luna');
assert(luna,'Canonical OpenAI Luna route missing');
assert.deepEqual(ZIWEI_R4_PAI_REGISTRY.models,[luna],'Zi Wei R4 Cloudflare provider projection drifted from canonical PAI registry');

const v1=fs.readFileSync('functions/personal-reading/narrative/ziwei-production-composer-v1.js','utf8');
assert(!v1.includes('ZIWEI-NATURAL-COMPOSER-R4'));
const frozen=JSON.parse(fs.readFileSync('content/reports/ziwei/production-v1-acceptance.json','utf8'));
assert.equal(frozen.frozen,true);
assert.equal(frozen.productionAdmission,'NOT_GRANTED');

const bazi=fs.readFileSync('assets/customer-ui/surfaces/bazi-print-shell-v2.css','utf8');
for(const selector of ['.pub-opener-heading','.pub-narrative','.pub-master-insights'])assert(bazi.includes(`[data-section="S07_HEALTH"][data-page-family="SECTION_OPENER_PAGE"] ${selector}`));
assert(bazi.includes('left:auto!important;right:17mm!important;width:92mm!important'));

console.log('PASS historical Zi Wei R4 governed composition and 33-page renderer remain compatible; canonical account binding matches the current cutover state; Production V1 remains frozen; BaZi S07 safe-zone bound.');
