import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {renderBaziWholeChartPrioritySurface,renderBaziProfessionalTopicSurface,renderBaziWholeChartFirst} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const priorityContract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-whole-chart-priority-engine-v1.json');
const topicContract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-professional-topic-reading-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w7-w8-engineering-acceptance-v1.json');

assert.equal(priorityContract.workId,'BAZI-CX-PRO-W7');
assert.equal(topicContract.workId,'BAZI-CX-PRO-W8');
assert.equal(acceptance.baseline.commit,'d86589d0be33ace066b29f300959cfdc27ced6e6');
assert.equal(acceptance.baseline.librarySnapshot,'db(3).zip');

const product=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(product.governance.wholeChartPriorityEngineAuthorized,true);
assert.equal(product.governance.professionalTopicReadingAuthorized,true);
assert.equal(product.professionalModules.moduleVersion,'BAZI-CX-PRO-W6-v1.0.0');
assert.equal(product.professionalModules.extensionVersion,'BAZI-CX-PRO-W8-v1.0.0');

const priority=product.professionalModules.wholeChartPriority;
assert.equal(priority.schemaVersion,'PHI-OS-BAZI-CX-PRO-WHOLE-CHART-PRIORITY-v1.0.0');
assert.equal(priority.work,'BAZI-CX-PRO-W7');
assert(priority.themeCount>=3&&priority.themeCount<=5);
assert.equal(priority.themes.length,priority.themeCount);
assert.deepEqual(priority.themes.map(x=>x.rank),Array.from({length:priority.themeCount},(_,i)=>i+1));
assert.equal(new Set(priority.themes.map(x=>x.priorityId)).size,priority.themeCount);
assert(priority.themes.some(x=>x.themeType==='RELATIONSHIP'&&x.themeKey==='ENVIRONMENT_SELF_INTERFACE'));
assert(priority.themes.some(x=>x.themeType==='PATTERN'&&x.themeKey==='CAI'));
assert(priority.themes.some(x=>x.themeType==='TEN_GOD_GROUP'&&x.themeKey==='OUTPUT'));
assert(priority.themes.some(x=>x.themeType==='CARRYING'));
assert.equal(priority.boundaries.priorityIsReadingOrderNotFateRank,true);
assert.equal(priority.boundaries.numericSalienceNotCustomerExposed,true);

const topics=product.professionalModules.professionalTopics;
assert.equal(topics.schemaVersion,'PHI-OS-BAZI-CX-PRO-PROFESSIONAL-TOPIC-READING-v1.0.0');
assert.equal(topics.work,'BAZI-CX-PRO-W8');
assert.equal(topics.topicCount,7);
const expectedTopics=['CAREER','WEALTH','RELATIONSHIPS','FAMILY','CAPABILITY','PRESSURE','LIFE_OPERATION'];
assert.deepEqual(topics.topics.map(x=>x.topicCode),expectedTopics);
for(const topic of topics.topics){
 assert(topic.compositionDimensions.includes('CARRYING'));
 assert(topic.relevantGroups.length>=1);
 assert(topic.relevantTenGods.length>=1);
 assert.equal(topic.boundaries.topicIsCompositionNotPrediction,true);
 assert.equal(topic.boundaries.topicDoesNotEqualSingleTenGod,true);
 assert.equal(topic.boundaries.pillarDoesNotEqualFamilyMember,true);
 assert.equal(topic.boundaries.relationshipDoesNotGuaranteeOutcome,true);
}
assert.equal(topics.topics.find(x=>x.topicCode==='PRESSURE')?.leadGroup?.groupCode,'OFFICER');
assert.equal(topics.topics.find(x=>x.topicCode==='CAREER')?.state,'COMPOSED_MULTI_FACTOR');
assert(topics.topics.find(x=>x.topicCode==='WEALTH')?.patternCandidates.some(x=>x.patternFamily==='CAI'));
assert(topics.topics.find(x=>x.topicCode==='RELATIONSHIPS')?.relationshipInterfaces.some(x=>x.positionThemeCode==='ENVIRONMENT_SELF_INTERFACE'));
assert.equal(topics.boundaries.singleSymbolVerdictAllowed,false);

// Browser-like customer rendering.
globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
globalThis.queueMicrotask=globalThis.queueMicrotask||((fn)=>fn());
const priorityHtml=renderBaziWholeChartPrioritySurface(product,{embedded:true});
assert.match(priorityHtml,/data-bazi-cx-pro-whole-chart-priority="true"/);
assert.match(priorityHtml,/整盘优先主题/);
assert.match(priorityHtml,/不要把所有符号用同样音量逐项罗列/);
assert.match(priorityHtml,/现实观察/);
assert.doesNotMatch(priorityHtml,/salience|吉凶分数|优先评分[:：]/);
const topicHtml=renderBaziProfessionalTopicSurface(product,{embedded:true});
assert.match(topicHtml,/data-bazi-cx-pro-professional-topics="true"/);
for(const text of ['事业与工作','财富与资源','关系','家庭与背景','能力与表达','压力与责任','生活运行'])assert.match(topicHtml,new RegExp(text));
assert.match(topicHtml,/十神／功能组/);
assert.match(topicHtml,/格局路径/);
assert.match(topicHtml,/柱位接口/);
assert.match(topicHtml,/主题解读不是事件预测/);
assert.doesNotMatch(topicHtml,/配偶宫|父母宫|子女宫|必发财|必结婚|必离婚|一定成功|大吉|大凶/);
const rendered=renderBaziProduct({product:{sourceProduct:product,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.readingHtml,/data-bazi-cx-pro-whole-chart-priority="true"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-professional-topics="true"/);
const whole=renderBaziWholeChartFirst(product);
assert.match(whole,/data-bazi-cx-pro-whole-chart-priority="true"/);
assert.match(whole,/data-bazi-cx-pro-professional-topics="true"/);

// 24-case regression: priority stays bounded and topic composition remains structurally complete.
let checked=0;const typeSeen=new Set(),topicStateSeen=new Set();
for(const spec of generateCampaignCases().slice(0,24)){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:'zh-Hans'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 assert(modules.wholeChartPriority.themeCount>=3&&modules.wholeChartPriority.themeCount<=5);
 assert.equal(modules.wholeChartPriority.themes.length,modules.wholeChartPriority.themeCount);
 assert.equal(new Set(modules.wholeChartPriority.themes.map(x=>x.priorityId)).size,modules.wholeChartPriority.themeCount);
 for(const x of modules.wholeChartPriority.themes)typeSeen.add(x.themeType);
 assert.equal(modules.professionalTopics.topicCount,7);
 assert.deepEqual(modules.professionalTopics.topics.map(x=>x.topicCode),expectedTopics);
 for(const topic of modules.professionalTopics.topics){assert(topic.compositionDimensions.includes('CARRYING'));topicStateSeen.add(topic.state);assert.equal(topic.boundaries.topicDoesNotEqualSingleTenGod,true);}
 checked++;
}
assert.equal(checked,24);
assert(typeSeen.has('CARRYING'));
assert(typeSeen.has('TEN_GOD_GROUP'));
assert(typeSeen.has('PATTERN'));
assert(topicStateSeen.size>=1);

const css=fs.readFileSync(new URL('../assets/customer-ui/surfaces/bazi-professional-reading.css',import.meta.url),'utf8');
for(const token of ['.cx-bazi-whole-chart-priority','.cx-bazi-priority-grid','.cx-bazi-priority-card','.cx-bazi-professional-topics','.cx-bazi-topic-grid','.cx-bazi-topic-card','.cx-bazi-topic-evidence'])assert(css.includes(token),`W7/W8 CSS missing ${token}`);
assert.equal(acceptance.status,'MACHINE_VERIFIED');
assert.equal(acceptance.acceptance.wholeChartPriorityEngineAuthorized,true);
assert.equal(acceptance.acceptance.professionalTopicReadingAuthorized,true);

console.log('✓ BAZI-CX-PRO W7/W8 Whole-Chart Priority + Professional Topic Reading passed.');
console.log(`  Fixture priority ${priority.themeCount}/5; professional topics ${topics.topicCount}/7; 24-case regression PASS.`);
