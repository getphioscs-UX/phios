import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {assertPprC1CurrentSuccessor} from './lib/ppr-c1-current-successor.mjs';

const BASE='content/customer-experience-rebuild/ppr-c1';
const baseline='343773fd6fb61fbf1b37aa861537d7e8f091ec24';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

// Current-main reconciliation must be explicit before accepting W4-W6.
const reconciliation=json(`${BASE}/audit/ppr-c1-current-main-reconciliation-343773f-v1.json`);
assert.equal(reconciliation.baselineCommit,baseline);
assert.equal(reconciliation.status,'RECONCILED_BEFORE_W4_W6');
assert.equal(reconciliation.resolution.canonicalApiBaziBranchRestoredToMethodNative,true);
assert.equal(reconciliation.resolution.singleRendererAuthorityRestored,true);

// W4: composeBzr may remain as historical implementation, but canonical BZR must bypass it.
const retirement=json(`${BASE}/authority/bazi-legacy-customer-composer-retirement-v1.json`);
assert.equal(retirement.baselineCommit,baseline);
assert.equal(retirement.status,'RETIRED_FROM_CANONICAL_CUSTOMER_PATH');
assert.equal(retirement.retiredComposer.canonicalCustomerConsumptionAllowed,false);
const api=read('functions/api/customer-personal-reality.js');
assert.match(api,/if\(spec\.methodCode==='BAZI'\)/);
const baziBranch=api.slice(api.indexOf("if(spec.methodCode==='BAZI')"),api.indexOf("const request=new Request",api.indexOf("if(spec.methodCode==='BAZI')")));
assert.match(baziBranch,/executeAndProjectMcd5CurrentRequest/);
assert.match(baziBranch,/nativeBackedReadingMethod/);
// The canonical BaZi product remains method-native. The separately named
// crossReadingMethod may reuse the admitted SMR composer for W21-W26 cross-method
// composition, but it must never become the primary BaZi readingMethod.
assert.match(baziBranch,/crossReadingMethod=await buildAcceptedMethodCustomerResult/);
assert.match(baziBranch,/readingMethod:nativeBackedReadingMethod\([^)]*\),crossReadingMethod/);
assert.doesNotMatch(baziBranch,/readingMethod\s*:\s*(?:await\s*)?buildAcceptedMethodCustomerResult/);
assert.match(api,/legacyComposerUsed:false/);
assert.match(api,/methodNativeReading\.BZR=await buildBaziMethodNativeReading/);
assert.match(api,/hasSingleNativeReport/);
assert.doesNotMatch(api,/CX-COMP-BZR-PILLAR-DAY-SEASON-v1/);
const legacyRuntime=read('functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js');
assert.match(legacyRuntime,/function composeBzr/,'historical compatibility implementation is expected to remain without canonical ownership');

// W5 current successor: the live generic renderer was retired by PPR-R3.
// BaZi is owned by the specialist renderer registered through the shared specialist host.
const successor=assertPprC1CurrentSuccessor();
const baziRenderer=read('assets/customer-ui/js/surfaces/bazi-professional-reading.js');
const personalClient=read('assets/customer-ui/js/surfaces/personal-reality.js');
const specialistRenderer=read('assets/customer-ui/js/specialists/bazi/product-renderer.js');
const css=read('assets/customer-ui/surfaces/bazi-professional-reading.css');
assert.match(specialistRenderer,/renderBaziProduct/);
assert.match(specialistRenderer,/renderBaziProfessionalStructure/);
assert.equal(successor.recon.historicalCheckerResolution.fileNamePresenceDoesNotDefineLiveRendererAuthority,true);
assert.match(baziRenderer,/data-ppr-bazi-professional-structure/);
assert.match(baziRenderer,/data-ppr-whole-chart-first/);
assert.match(baziRenderer,/hiddenStems/);
assert.match(baziRenderer,/stemRole/);
assert.match(baziRenderer,/Day Master|日主/);
assert.match(baziRenderer,/Month command|月令/);
assert.doesNotMatch(baziRenderer,/'结构项'/);
assert.doesNotMatch(baziRenderer,/\.stem\.code|\.branch\.code/);
assert.match(personalClient,/renderBaziProfessionalStructure/);
assert.match(personalClient,/m\.methodId==='BZR'&&isBaziNativeProduct\(baziNative\)/);
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:1050px\)/);
assert.match(css,/@media\(max-width:767px\)/);
assert.match(css,/writing-mode:horizontal-tb/);

const structureContract=json(`${BASE}/contracts/bazi-professional-structure-surface-contract-v1.json`);
assert.equal(structureContract.status,'FROZEN_PRESENTATION_CONTRACT');
assert.equal(structureContract.customerLanguage.genericStructureItemFallbackAllowedForBazi,false);
assert.equal(structureContract.customerLanguage.rawStemBranchPinyinAsPrimaryDisplayAllowed,false);
assert.equal(structureContract.boundaries.singlePillarEssayOwnerAllowed,false);

// W6: whole-chart-first IA consumes the frozen BAZI-FP product rather than creating meaning.
const ia=json(`${BASE}/registries/bazi-whole-chart-first-ia-registry-v1.json`);
assert.equal(ia.status,'ACTIVE_CANONICAL_IA');
assert.equal(ia.route,'/perspectives/personal/');
assert.deepEqual(ia.order.slice(0,6),['WHOLE_CHART_POSITIONING','KEY_STRUCTURES_3_TO_5','DAY_MASTER_AND_MONTH_COMMAND','ESTABLISHED_NATAL_RELATION','OPEN_VERDICTS','PROFESSIONAL_FOUR_PILLAR_CHART']);
assert.equal(ia.sourceOwnership.newInterpretationCreatedByPpr,false);
assert.equal(ia.prohibitions.pillarByPillarEssaySequence,true);

const natal=json('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const product=await buildBaziMethodNativeReading({canonicalProjection:natal,canonicalInput:{birthDate:'1989-11-15'},locale:'zh-Hans',targetContext:null});
assert.equal(product.methodId,'BZR');
// W12 is the additive specialist-surface successor of the W6 method-native
// product. Re-running the historical W4-W6 gate must accept that current
// envelope while continuing to validate every frozen W6 capability below.
assert.equal(product.productVersion,'BAZI-FP-v1.0.0@PPR-C1-W12');
assert.equal(product.publicationDecision.customerPublishable,true);
assert.equal(product.structuralModel.pillars.length,4);
assert.equal(product.structuralModel.pillars.find(x=>x.position==='DAY').stem.zh,'庚');
assert.equal(product.structuralModel.pillars.find(x=>x.position==='MONTH').branch.zh,'寅');
assert(product.structuralModel.pillars.every(x=>Array.isArray(x.hiddenStems)));
assert.equal(product.governance.legacyComposeBzrConsumed,false);
assert.equal(product.governance.professionalStructureSurfaceAuthorized,true);
assert.equal(product.governance.wholeChartFirstIaAuthorized,true);
assert.equal(product.readingSections.length,6);
assert.equal(product.readingSections.filter(x=>x.code==='PATTERNS').length,1);
assert.equal(product.readingSections.filter(x=>x.code==='SCHOOLS').length,1);

const acceptance=json(`${BASE}/acceptance/ppr-c1-w4-w6-engineering-acceptance-v1.json`);
assert.equal(acceptance.baselineCommit,baseline);
assert.equal(acceptance.status,'ENGINEERING_COMPLETE');
for(const [gate,value] of Object.entries(acceptance.gates)){
  if(gate==='BAZI_FP_V1_MEANING_REWRITTEN'||gate==='RENDERER_CREATES_MEANING')assert.equal(value,false,gate);
  else assert.equal(value,true,gate);
}
assert.equal(acceptance.nextWork,'PPR-C1-W7｜Pattern Surface Cutover');
const roadmap=json(`${BASE}/roadmap/ppr-c1-master-work-v2.json`);
assert.equal(roadmap.baselineCommit,baseline);
assert.equal(roadmap.status,'ACTIVE_W0_W6_COMPLETE_W7_NEXT');
for(const w of [4,5,6])assert.match(roadmap.works.find(x=>x.work===`PPR-C1-W${w}`).status,/ENGINEERING_COMPLETE/);
assert.equal(roadmap.works.find(x=>x.work==='PPR-C1-W7').status,'NEXT');

console.log('✓ PPR-C1 W4–W6 legacy BZR retirement + professional structure + whole-chart-first IA passed.');
console.log('  Canonical BZR no longer calls buildAcceptedMethodCustomerResult/composeBzr on /api/customer-personal-reality.');
console.log(`  Professional structure: ${product.structuralModel.pillars.length} pillars; Day Master ${product.structuralModel.pillars.find(x=>x.position==='DAY').stem.zh}; Month command ${product.structuralModel.pillars.find(x=>x.position==='MONTH').branch.zh}.`);
console.log(`  Whole-chart reading: ${product.summary.keyPoints.length} key structures; ${product.readingSections.length} governed W15 sections; ${product.openVerdicts.length} visible open verdicts.`);
