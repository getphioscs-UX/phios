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
assert(generation.includes("providerCalled!==true"));
assert(generation.includes("verificationAccepted!==true"));
assert(generation.includes("productionAdmissionGranted:false"));

const privateRenderer=fs.readFileSync('workers/method-report-renderer/index.js','utf8');
assert(privateRenderer.includes("ALLOWED_ZIWEI_COMPOSITIONS=new Set(['ZIWEI-PRODUCTION-COMPOSER-V1','ZIWEI-NATURAL-COMPOSER-R4'])"));
assert(privateRenderer.includes("compositionVersion!==candidate?.snapshot?.compositionVersion"));

const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
assert(binding.includes("ziwei-natural-composer-r4-generation.js"));
assert(binding.includes('generateZiweiNaturalComposerR4Candidate'));
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

console.log('PASS Zi Wei R4 uses governed T2/OpenAI + semantic verification in QA successor; Production V1 remains frozen; BaZi S07 safe-zone bound.');
