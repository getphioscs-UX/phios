import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {renderBaziTimingSurface,renderBaziWholeChartFirst} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const contract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-da-yun-liu-nian-professional-timeline-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w9-engineering-acceptance-v1.json');
assert.equal(contract.workId,'BAZI-CX-PRO-W9');
assert.equal(acceptance.baseline.commit,'8c44a0e023a15a2e6f786306a83bd792b90bdb65');
assert.equal(acceptance.baseline.librarySnapshot,'index.zip');

const noTarget=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(noTarget.governance.daYunLiuNianProfessionalTimelineAuthorized,true);
assert.equal(noTarget.professionalModules.extensionVersion,'BAZI-CX-PRO-W8-v1.0.0');
assert.equal(noTarget.professionalModules.timelineExtensionVersion,'BAZI-CX-PRO-W9-v1.0.0');
const nt=noTarget.professionalModules.professionalTimeline;
assert.equal(nt.schemaVersion,'PHI-OS-BAZI-CX-PRO-DA-YUN-LIU-NIAN-PROFESSIONAL-TIMELINE-v1.0.0');
assert.equal(nt.state,'UNAVAILABLE');
assert.equal(nt.daYunTimeline.length,8);
assert.equal(nt.currentWindow.available,false);
assert.equal(nt.currentWindow.completeness,'NO_TARGET');
assert.equal(nt.topicCodes.length,7);
assert.equal(nt.boundaries.currentDateInferred,false);
assert.equal(nt.boundaries.browserTimezoneInferred,false);
assert.equal(nt.boundaries.eventPredictionCreated,false);

const first=buildInputs(generateCampaignCases()[0]);
const explicit=await buildBaziMethodNativeReading({canonicalProjection:first.canonicalProjection,temporalProjectionOverride:first.temporalProjection,locale:'zh-Hans'});
const t=explicit.professionalModules.professionalTimeline;
assert.equal(t.state,'EXPLICIT');
assert.equal(t.currentWindow.available,true);
assert.equal(t.currentWindow.completeness,'FULL');
assert.equal(t.daYunTimeline.length,8);
assert.equal(t.daYunTimeline.filter(x=>x.isSelected).length,1);
assert.equal(t.currentWindow.topicTimeline.length,7);
assert.equal(t.currentWindow.currentDaYun.cycleNumber,first.temporalProjection.currentLuckCycle.current.cycleNumber);
assert.equal(t.currentWindow.annual.year,first.temporalProjection.annualContext.annualPillar.year);
assert(t.daYunTimeline.every(x=>x.functionGroups.length>=1));
assert(t.daYunTimeline.every(x=>Array.isArray(x.topicActivations)));
assert(t.daYunTimeline.some(x=>x.priorityRefs.length>=1));
assert(t.currentWindow.topicTimeline.some(x=>x.activationState==='DA_YUN_LIU_NIAN_CONVERGENCE'));
for(const topic of t.currentWindow.topicTimeline){
 assert(['DA_YUN_LIU_NIAN_CONVERGENCE','DA_YUN_ACTIVE','LIU_NIAN_ACTIVE','NATAL_BASELINE_ONLY'].includes(topic.activationState));
 assert(['PRIMARY','SUPPORTING','CONTEXT','NONE'].includes(topic.daYun.activationBand));
 assert(['PRIMARY','SUPPORTING','CONTEXT','NONE'].includes(topic.liuNian.activationBand));
 assert.equal(topic.boundaries.activationIsNotPrediction,true);
}
assert.equal(t.boundaries.natalPriorityRemainsBaseline,true);
assert.equal(t.boundaries.daYunDoesNotOverwriteNatal,true);
assert.equal(t.boundaries.liuNianDoesNotOverwriteDaYun,true);
assert.equal(t.boundaries.convergenceIsNotCertainty,true);

// Browser-like rendering.
globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
globalThis.queueMicrotask=globalThis.queueMicrotask||((fn)=>fn());
const noTargetHtml=renderBaziTimingSurface(noTarget,{embedded:true});
assert.match(noTargetHtml,/data-bazi-cx-pro-professional-timeline="true"/);
assert.match(noTargetHtml,/大运专业时间轴/);
assert.match(noTargetHtml,/不推断“今天”/);
assert.doesNotMatch(noTargetHtml,/当前流年已建立/);
const explicitHtml=renderBaziTimingSurface(explicit,{embedded:true});
for(const token of ['原局 × 大运 × 流年 · Priority × 七大生活主题','所选时间窗口','大运专业时间轴','七大主题在这个时间窗口怎样变化','原局 × 大运','原局 × 流年','大运 × 流年','时间解释边界'])assert.match(explicitHtml,new RegExp(token));
for(const topic of ['事业与工作','财富与资源','关系','家庭与背景','能力与表达','压力与责任','生活运行'])assert.match(explicitHtml,new RegExp(topic));
assert.match(explicitHtml,/主轴进入|支持进入|情境进入|未直接进入/);
assert.doesNotMatch(explicitHtml,/大吉|大凶|必发财|必结婚|必离婚|一定成功|一定失败|事件概率|命运分数/);
const rendered=renderBaziProduct({product:{sourceProduct:explicit,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.readingHtml,/data-bazi-cx-pro-professional-timeline="true"/);
assert.match(renderBaziWholeChartFirst(explicit),/data-bazi-cx-pro-professional-timeline="true"/);

// 24-case explicit timing regression.
let checked=0;const states=new Set(),bands=new Set(),topicCodes=new Set();
for(const spec of generateCampaignCases().slice(0,24)){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:'zh-Hans'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 const tm=modules.professionalTimeline;
 assert.equal(tm.daYunTimeline.length,8);
 assert.equal(tm.currentWindow.topicTimeline.length,7);
 assert(['FULL','DA_YUN_ONLY','LIU_NIAN_ONLY','TARGET_ONLY'].includes(tm.currentWindow.completeness));
 assert.equal(tm.currentWindow.available,Boolean(tm.currentWindow.currentDaYun||tm.currentWindow.annual));
 assert.equal(tm.daYunTimeline.filter(x=>x.isSelected).length,tm.currentWindow.currentDaYun?1:0);
 for(const topic of tm.currentWindow.topicTimeline){states.add(topic.activationState);bands.add(topic.daYun.activationBand);bands.add(topic.liuNian.activationBand);topicCodes.add(topic.topicCode);}
 assert.equal(tm.boundaries.eventPredictionCreated,false);
 checked++;
}
assert.equal(checked,24);
assert.equal(topicCodes.size,7);
assert(states.size>=2);
assert(bands.has('PRIMARY'));
assert(bands.size>=2);

const css=fs.readFileSync(new URL('../assets/customer-ui/surfaces/bazi-professional-reading.css',import.meta.url),'utf8');
for(const token of ['.cx-bazi-professional-timeline','.cx-bazi-current-window','.cx-bazi-timeline-flow','.cx-bazi-professional-dayun-track','.cx-bazi-professional-cycle','.cx-bazi-timing-topic-grid','.cx-bazi-timeline-boundary'])assert(css.includes(token),`W9 CSS missing ${token}`);
assert.equal(acceptance.status,'MACHINE_VERIFIED');
assert.equal(acceptance.acceptance.daYunLiuNianProfessionalTimelineAuthorized,true);

console.log('✓ BAZI-CX-PRO W9 Da Yun / Liu Nian professional timeline passed.');
console.log(`  No-target Da Yun ${nt.daYunTimeline.length}/8; explicit seven-topic window ${t.currentWindow.topicTimeline.length}/7; 24-case timing regression PASS.`);
