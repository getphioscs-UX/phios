import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildZiweiFullProductionCustomerRuntime} from '../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {adaptZiweiPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ziwei-production-adapter.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {projectZiweiW9W11SpecialistPresentation,assertZiweiPresentationCustomerSafe,ziweiPublicLabel,ZIWEI_CX_R1_W9_W11_SPECIALIST_PRESENTATION_SCHEMA} from '../functions/personal-reality-product/adapters/ziwei-w9-w11-specialist-projection.js';
import {buildZiweiW9W11RenderPlan,isZiweiW9W11Product} from '../assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline='86854ae467ff7da836f45c424f3f6f0ce97b64ef';
const base='content/customer-experience-rebuild/ziwei-cx-r1/contracts';
const w9=j(`${base}/ziwei-cx-r1-w9-topic-reading-surface-contract-v1.json`),w10=j(`${base}/ziwei-cx-r1-w10-timing-pattern-counter-evidence-contract-v1.json`),w11=j(`${base}/ziwei-cx-r1-w11-raw-code-elimination-contract-v1.json`);
for(const x of [w9,w10,w11]){assert.equal(x.baselineCommit,baseline);assert.equal(x.sharedHostAuthority,'PPR-R3');}
assert.equal(w9.rules.topicCount,8);assert.equal(w9.rules.palaceLinksReturnToInteractivePalace,true);assert.equal(w9.rules.topicCreatesSecondReport,false);
assert.deepEqual(w10.timingLane.order,['本命','大限','流年']);assert.equal(w10.patternPresentation.humanAdmittedQualificationOnly,true);assert.equal(w10.counterEvidencePresentation.customerZh,'同时存在两类结构信号');assert.equal(w10.counterEvidencePresentation.overallStrongWeakWinnerForbidden,true);
assert.equal(w11.customerDefaults.rawCodesAllowedOnlyInsideCollapsedTechnicalDetails,true);assert.equal(w11.customerDefaults.genericLabelPatchExpansionAllowed,false);
const pprR3W11Path='content/professional/personal-reality/r3/authority/ppr-r3-w11-num-envelope-route-reconciliation-v1.json';
const pprR3W11=fs.existsSync(pprR3W11Path)?j(pprR3W11Path):null;
for(const [path,digest] of Object.entries(w11.frozenSharedFiles)){
 const successorDigest=path==='functions/personal-reality-product/product-envelope-core.js'&&pprR3W11?.status==='FROZEN_ROUTE_RECONCILIATION_ACTIVE'?pprR3W11.expected?.productEnvelopeCoreSha256:null;
 assert.equal(sha(path),successorDigest||digest,`PPR-R3/shared file drift: ${path}`);
}

function executionRequest({birthDate='2023-01-22',birthTime='05:00:00',locale='zh-Hans',id='STD'}={}){
 const consentRecordId=`CONSENT-ZIWEI-CX-R1-W9-W11-${id}`;
 const canonicalInput={birthDate,birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale,consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
 return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:'MALE'},consentRecordId,requestId:`REQ-ZIWEI-CX-R1-W9-W11-${id}`};
}
const targetContext={targetDate:'2026-08-28',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'};
async function build({birthDate,birthTime,locale='zh-Hans',id}){const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:executionRequest({birthDate,birthTime,locale,id}),targetContext,locale});const product=adaptZiweiPersonalRealityProduct({publicationEnvelope:full.customerProduct,locale});const presentation=product.visuals.find(v=>v.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload;return {full,product,presentation};}

const standard=await build({birthDate:'2023-01-22',birthTime:'05:00:00',id:'STD'});const {product,presentation}=standard;
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');assert.equal(product.specialistRenderer?.rendererId,'PPR_R3_ZIWEI_PRODUCT_V1');assert.equal(product.specialistRenderer?.ownerMethod,'ZWR');assert.equal(resolveSpecialistRendererDescriptor(product)?.ownerMethod,'ZWR');assert.equal(presentation.schemaVersion,ZIWEI_CX_R1_W9_W11_SPECIALIST_PRESENTATION_SCHEMA);assert.equal(assertZiweiPresentationCustomerSafe(presentation),true);
assert.equal(presentation.topics.length,8);assert.deepEqual(presentation.topics.map(x=>x.title),w9.topicOrderZh);assert.equal(presentation.palaces.length,12);assert.equal(new Set(presentation.palaces.map(x=>x.index)).size,12);for(const topic of presentation.topics){assert(topic.primary.length>0);for(const x of [...topic.primary,...topic.context]){assert(Number.isInteger(x.palaceIndex));assert(x.palaceIndex>=0&&x.palaceIndex<12);}for(const x of topic.timing)if(x.focusPalaceIndex!=null)assert(x.focusPalaceIndex>=0&&x.focusPalaceIndex<12);}
assert.deepEqual(presentation.timing.lane.map(x=>x.label),['本命','大限','流年']);assert.equal(presentation.timing.crossLayer.resolutionLabel,'同时存在两类结构信号');assert.match(presentation.timing.crossLayer.counterEvidenceCopy,/整体更强|整体更弱/);assert.doesNotMatch(presentation.timing.crossLayer.counterEvidenceCopy,/COUNTERBALANCED/);
assert.equal(presentation.patterns.items.length,0);assert.match(presentation.patterns.admissionLabel,/人工准入/);
assert.equal(ziweiPublicLabel('WATER_2','zh-Hans'),'水二局');assert.equal(ziweiPublicLabel('ZI','zh-Hans'),'子');assert.equal(ziweiPublicLabel('XU','zh-Hans'),'戌');assert.equal(ziweiPublicLabel('HAI','zh-Hans'),'亥');assert.equal(ziweiPublicLabel('SHEN','zh-Hans'),'申');
const projection2=projectZiweiW9W11SpecialistPresentation({product,locale:'zh-Hans'});assert.equal(projection2.presentationDigest,presentation.presentationDigest,'specialist projection must be deterministic');

assert.equal(isZiweiW9W11Product(product),true);const plan=buildZiweiW9W11RenderPlan(product);assert.equal(plan.status,'RENDERED');const plan2=renderZiweiProduct({product,mount:{host:null}});assert.equal(plan2.status,'RENDERED');
assert.equal((plan.visualHtml.match(/data-ziwei-palace-index=/g)||[]).length,12);assert.equal((plan.visualHtml.match(/data-ziwei-inspector-index=/g)||[]).length,12);assert.equal((plan.readingHtml.match(/data-ziwei-topic-index=/g)||[]).length,8);assert((plan.readingHtml.match(/data-ziwei-open-palace-index=/g)||[]).length>=24);for(const label of w9.topicOrderZh)assert(plan.readingHtml.includes(label),`missing topic ${label}`);for(const label of ['本命','大限','流年','同时存在两类结构信号'])assert((plan.readingHtml+plan.visualHtml).includes(label),`missing W10 customer label ${label}`);assert.match(plan.readingHtml,/仅显示人工准入的格局结构资格/);
const visibleHtml=`${plan.navigationHtml}${plan.visualHtml}${plan.readingHtml}`;for(const raw of ['WATER_2','COUNTERBALANCED','DISTINCT_DOMAIN_EMPHASIS','结构项'])assert(!visibleHtml.includes(raw),`raw code leaked: ${raw}`);for(const raw of ['>ZI<','>XU<','>HAI<','>SHEN<'])assert(!visibleHtml.includes(raw),`raw branch leaked: ${raw}`);assert.doesNotMatch(visibleHtml,/\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b/,'snake-case raw code leaked into default Zi Wei customer UI');assert.match(plan.technicalHtml,/Technical Details|技术详情/);assert.equal(typeof plan.afterMount,'function');

// The real PPR route can now assemble the Zi Wei product without touching any frozen shared PPR-R3 file.
const route=await buildPersonalRealityProductRoute({selectedKeys:['ziwei'],results:[{ok:true,key:'ziwei',spec:{methodCode:'ZI_WEI_DOU_SHU'},ziweiFullProduction:standard.full.customerProduct}],locale:'zh-Hans'});assert.equal(route.mode,'SINGLE_METHOD');assert.equal(route.primaryProduct?.methodId,'ZWR');assert.equal(route.primaryProduct?.specialistRenderer?.rendererId,'PPR_R3_ZIWEI_PRODUCT_V1');assert.equal(route.primaryProduct?.visuals?.some(v=>v.type==='ZIWEI_SPECIALIST_PRESENTATION'),true);

// Positive admitted-pattern fixture: structural qualification is visible, outcome prose is not invented.
const positive=await build({birthDate:'2023-01-02',birthTime:'07:00:00',id:'PATTERN'});assert(positive.presentation.patterns.items.some(x=>/紫府同宫/.test(x.title)),'positive admitted pattern missing');const positivePlan=buildZiweiW9W11RenderPlan(positive.product);assert.match(positivePlan.readingHtml,/紫府同宫/);assert.match(positivePlan.readingHtml,/人工准入格局资格/);assert.doesNotMatch(positivePlan.readingHtml,/必然发财|必然富贵|保证升迁|guaranteed wealth|guaranteed promotion/i);

const saved=j('content/customer-experience-rebuild/ziwei-cx-r1/projections/ziwei-cx-r1-w9-w11-specialist-presentation-v1.json');assert.equal(saved.schemaVersion,presentation.schemaVersion);assert.equal(saved.presentationDigest,presentation.presentationDigest);assert.equal(saved.topics.length,8);assert.equal(saved.palaces.length,12);assert.equal(saved.timing.crossLayer.resolutionLabel,'同时存在两类结构信号');

const adapterText=fs.readFileSync('functions/personal-reality-product/adapters/ziwei-production-adapter.js','utf8');assert.match(adapterText,/from '\.\/product-envelope-core\.js'/);assert.match(adapterText,/RAW_CODE_ELIMINATION/);assert.match(fs.readFileSync('assets/customer-ui/js/specialists/ziwei/product-renderer.js','utf8'),/buildZiweiW9W11RenderPlan/);assert.match(fs.readFileSync('assets/customer-ui/surfaces/ziwei-specialist-workspace.css','utf8'),/ZIWEI-CX-R1-W9-W11/);
console.log('✓ ZIWEI-CX-R1-W9–W11 specialist presentation passed.');
console.log(`  W9: ${presentation.topics.length}/8 on-demand topic surfaces; every palace link resolves to one of ${presentation.palaces.length}/12 governed palace owners.`);
console.log(`  W10: timing lane ${presentation.timing.lane.map(x=>x.label).join(' → ')}; cross-layer customer state = “${presentation.timing.crossLayer.resolutionLabel}”; patterns remain Human-admitted qualification only.`);
console.log('  W11: WATER_2 / branch enums / COUNTERBALANCED / DISTINCT_DOMAIN_EMPHASIS / generic “结构项” are absent from default customer HTML; raw lineage remains technical-only.');
console.log('  Frozen PPR-R3 shared route, host, Personal Reality, API and shared single-method-reading files remain byte-identical.');
