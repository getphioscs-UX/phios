import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {adaptBaziPersonalRealityProduct} from '../functions/personal-reality-product/adapters/bazi-production-adapter.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';
import {renderBaziRealityComparisonSurface} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const t=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline='86854ae467ff7da836f45c424f3f6f0ce97b64ef';
const BASE='content/customer-experience-rebuild/ppr-c1/contracts';
const w11=j(`${BASE}/bazi-reality-comparison-contract-v1.json`);
const w12=j(`${BASE}/bazi-overview-navigation-specialist-contract-v1.json`);
const guard=j(`${BASE}/bazi-ppr-r3-shared-freeze-guard-v1.json`);
const acceptance=j('content/customer-experience-rebuild/ppr-c1/acceptance/ppr-c1-w11-w12-engineering-acceptance-v1.json');
const fixture=j('content/customer-experience-rebuild/ppr-c1/fixtures/bazi-reality-comparison-navigation-fixture-v1.json');
const roadmap=j('content/customer-experience-rebuild/ppr-c1/roadmap/ppr-c1-master-work-v5.json');
for(const x of [w11,w12,guard,acceptance,fixture,roadmap])assert.equal(x.baselineCommit,baseline);
assert.equal(acceptance.status,'ENGINEERING_COMPLETE_USING_PPR_R3_SPECIALIST_RENDERER_PORT');
assert.equal(roadmap.status,'ACTIVE_W0_W12_COMPLETE_W13_NEXT');
assert.deepEqual(acceptance.customerInformationArchitecture,fixture.expectedNavigation);
assert.equal(w11.status,'ENGINEERING_COMPLETE');
assert.equal(w12.status,'ENGINEERING_COMPLETE_USING_PPR_R3_SPECIALIST_PORT');
assert.equal(guard.status,'FROZEN_SHARED_SURFACE_UNCHANGED');
for(const [path,digest] of Object.entries(guard.protectedFiles))assert.equal(sha(path),digest,`PPR-R3 shared freeze drift: ${path}`);

const natal=j('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const temporal=j('content/professional/bzr-full-production/fixtures/bazi-liu-nian-interaction-fixture-v1.json').temporalProjection;
const explicit=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans',temporalProjectionOverride:temporal});
const explicit2=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans',temporalProjectionOverride:temporal});
const noTarget=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans'});
for(const product of [explicit,explicit2,noTarget]){
 assert.equal(product.methodId,'BZR');
 assert.equal(product.publicationDecision.customerPublishable,true);
 assert.equal(product.professionalModules.moduleVersion,'PPR-C1-W12-v1.0.0');
 assert.equal(product.professionalModules.boundaries.usesPprR3SpecialistPort,true);
 assert.equal(product.professionalModules.boundaries.modifiesSharedPersonalRealitySurface,false);
 assert.equal(product.governance.realityComparisonRebuildAuthorized,true);
 assert.equal(product.governance.pprR3SpecialistNavigationAuthorized,true);
}
assert.deepEqual(explicit.professionalModules.realityComparison,explicit2.professionalModules.realityComparison,'W11 projection must be deterministic');
const rc=explicit.professionalModules.realityComparison;
assert.equal(rc.schemaVersion,'PHI-OS-PPR-C1-BAZI-REALITY-COMPARISON-v1.0.0');
assert.equal(rc.questionCount,7);assert.equal(rc.sourcePrimaryOwnerCount,7);
assert.equal(new Set(rc.questions.map(x=>x.sourceSemanticClusterId)).size,7,'one semantic cluster must own one primary question');
assert.deepEqual(rc.questions.map(x=>x.questionKey),['FOUNDATION','RELATIONSHIPS','PATTERN','SCHOOL_ZIPING','SCHOOL_TIYONG','SCHOOL_TIAOHOU','TIMING']);
assert(rc.questions.every(q=>q.boundaries.repeatedPillarPromptCreated===false));
assert(rc.questions.find(q=>q.questionKey==='TIMING').temporalCorrespondenceEnabled===true);
assert(noTarget.professionalModules.realityComparison.questions.find(q=>q.questionKey==='TIMING').temporalCorrespondenceEnabled===false);
for(const key of ['derivedFromDeduplicatedSemanticOwners','observableSignalsConsumed','pillarByPillarQuestionGeneration','customerResonanceIsEvidence','customerAnswerPromotesVerdict']){
 if(key==='derivedFromDeduplicatedSemanticOwners')assert.equal(rc.boundaries[key],true);else assert.equal(rc.boundaries[key],false);
}

const route=await buildPersonalRealityProductRoute({selectedKeys:['bazi'],results:[{ok:true,key:'bazi',spec:{methodCode:'BAZI'}}],methodNativeReading:{BZR:explicit},locale:'zh-Hans'});
assert.equal(route.mode,'SINGLE_METHOD');assert.equal(route.primaryProduct?.methodId,'BZR');assert.equal(route.primaryProduct?.specialistRenderer?.rendererId,'PPR_R3_BAZI_PRODUCT_V1');
const envelope=adaptBaziPersonalRealityProduct({report:explicit,locale:'zh-Hans'});
assert.equal(envelope.productType,'BAZI_PROFESSIONAL_READING');assert.equal(envelope.state,'CUSTOMER_PUBLISHABLE');
assert(envelope.sections.some(x=>x.sectionId==='REALITY_COMPARISON'),'W11 must be present in specialist product envelope');
assert(envelope.specialistRenderer.capabilities.includes('REALITY_COMPARISON'));
assert(envelope.specialistRenderer.capabilities.includes('METHOD_NAVIGATION_SLOT'));

globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild(){}}};
const rcHtml=renderBaziRealityComparisonSurface(explicit);
const plan=renderBaziProduct({product:envelope});
delete globalThis.document;
assert.equal(plan.status,'RENDERED');
for(const field of ['navigationHtml','readingHtml','technicalHtml'])assert(String(plan[field]||'').length>0,`${field} required`);
assert.equal(plan.visualHtml,'');
for(const label of ['总览','我的读取','命盘','核心结构','格局与平衡','大运与流年','现实对照','来源与技术'])assert(plan.navigationHtml.includes(label),`missing W12 nav label ${label}`);
for(const id of ['overview','reading','chart','core','pattern','timing','reality'])assert(plan.readingHtml.includes(`id="bazi-section-${id}"`),`missing reading target ${id}`);
assert(plan.technicalHtml.includes('id="bazi-section-technical"'));
assert(plan.readingHtml.includes('本次读取状态'));
assert(plan.readingHtml.includes('Full Production'));
assert.equal(plan.readingHtml.includes('资料验证'),false);
assert.equal(plan.readingHtml.includes('方法计算'),false);
assert(plan.readingHtml.includes('data-ppr-bazi-professional-structure="true"'));
assert(plan.readingHtml.includes('data-ppr-bazi-customer-safe-graph="true"'));
assert(plan.readingHtml.includes('data-ppr-bazi-pattern-professional="true"'));
assert(plan.readingHtml.includes('data-ppr-bazi-school-professional="true"'));
assert(plan.readingHtml.includes('data-ppr-bazi-temporal-experience="true"'));
assert(plan.readingHtml.includes('data-ppr-bazi-reality-comparison="true"'));
for(const text of ['重复支持','情境限定','反向证据','时间对应'])assert(rcHtml.includes(text),`missing W11 comparison probe ${text}`);
for(const bad of ['年柱在哪里比较明显','月柱在哪里比较明显','日柱在哪里比较明显','时柱在哪里比较明显','observableSignals'])assert.equal(rcHtml.includes(bad),false,`legacy pillar comparison leaked: ${bad}`);
for(const raw of ['BAZI-SEMCLUSTER-','BAZI-FINDING-','BAZI-EV-','BAZI-AUTH-','BAZI-UNK-'])assert.equal(rcHtml.includes(raw),false,`internal W11 lineage leaked to customer html: ${raw}`);

const projection=t('functions/personal-professional-reading/bazi-professional-surface-projection.js');
assert(projection.includes("questionKey:'FOUNDATION'"));assert(projection.includes("questionKey:'TIMING'"));assert.equal(projection.includes('observableSignals'),true,'boundary must explicitly record observableSignals non-consumption');
const specialist=t('assets/customer-ui/js/specialists/bazi/product-renderer.js');
assert(specialist.includes('data-ppr-r3-nav-target'));
assert(specialist.includes('cx-bazi-run-status'));
assert(specialist.includes('renderBaziRealityComparisonSurface'));
const css=t('assets/customer-ui/surfaces/bazi-professional-reading.css');
for(const token of ['.cx-bazi-w12-workspace','.cx-bazi-run-status','.cx-bazi-pillar-grid','grid-template-columns:repeat(4,minmax(0,1fr))','@media(max-width:1050px)','@media(max-width:767px)','@media(max-width:420px)','writing-mode:horizontal-tb'])assert(css.includes(token),`missing W12 specialist CSS token ${token}`);

console.log('✓ PPR-C1-W11/W12 BaZi Reality Comparison + PPR-R3 specialist Overview/Navigation passed.');
console.log(`  W11: ${rc.questionCount} deduplicated semantic owners → ${rc.questionCount} chart-level primary questions; repeated support, context specificity and counter-evidence preserved.`);
console.log('  W12: 8-section method-owned IA rendered through the committed PPR-R3 specialist port.');
console.log(`  Shared freeze: ${Object.keys(guard.protectedFiles).length} PPR-R3 shared files byte-stable; no shared Personal Reality file modified.`);
