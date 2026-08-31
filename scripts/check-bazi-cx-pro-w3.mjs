import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {renderBaziFiveElementSurface} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const contract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-ten-god-professional-composition-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w3-engineering-acceptance-v1.json');

assert.equal(contract.workId,'BAZI-CX-PRO-W3');
assert.equal(contract.status,'ADMITTED');
assert.equal(contract.surfaceOutput.moduleSchemaVersion,'PHI-OS-BAZI-CX-PRO-TEN-GOD-PROFESSIONAL-COMPOSITION-v1.0.0');
assert.equal(acceptance.work,'BAZI-CX-PRO-W3');
assert.equal(acceptance.requiredChecker,'scripts/check-bazi-cx-pro-w3.mjs');

const product=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(product.governance.tenGodProfessionalCompositionAuthorized,true);
const ten=product.professionalModules.tenGods;
assert.equal(ten.schemaVersion,contract.surfaceOutput.moduleSchemaVersion);
assert.equal(ten.work,'BAZI-CX-PRO-W3');
assert.equal(ten.items.length,10);
assert.equal(ten.functionGroups.length,5);
assert.equal(ten.totalTouches,ten.items.reduce((sum,item)=>sum+item.count,0));
assert.equal(ten.totalTouches,11);
assert.ok(Math.abs(ten.items.reduce((sum,item)=>sum+item.ratio,0)-100)<=0.2);
for(const item of ten.items){
 assert.equal(item.count,item.visibleCount+item.hiddenCount);
 assert.equal(item.sources.visible.length,item.visibleCount);
 assert.equal(item.sources.hidden.length,item.hiddenCount);
 assert.ok(['REPEATED','SINGLE_TOUCH','ABSENT'].includes(item.repeatState));
 assert.equal(item.ratio,ten.totalTouches?Math.round(item.count/ten.totalTouches*1000)/10:0);
}
assert.equal(ten.items.find(x=>x.tenGodCode==='PIAN_CAI').count,2);
assert.equal(ten.items.find(x=>x.tenGodCode==='PIAN_CAI').ratio,18.2);
assert.equal(ten.items.find(x=>x.tenGodCode==='ZHENG_GUAN').count,0);
assert.equal(ten.boundaries.ratioIsOccurrenceOnly,true);
assert.equal(ten.boundaries.hiddenStemWeightInvented,false);
assert.equal(ten.boundaries.goodBadScoreCreated,false);
assert.equal(ten.boundaries.personalityScoreCreated,false);
assert.equal(ten.boundaries.fortunePredictionCreated,false);

globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
const html=renderBaziFiveElementSurface(product,{embedded:true});
assert.match(html,/data-bazi-cx-pro-ten-gods="true"/);
assert.match(html,/十神结构预览 · 专业组合阅读/);
assert.match(html,/柱位与来源/);
assert.match(html,/重复与集中/);
assert.match(html,/月令与格局连接/);
assert.doesNotMatch(html,/吉凶评分[:：]|人格评分[:：]|必发财|必结婚/);

console.log('✓ BAZI-CX-PRO W3 Ten-God current contract and successor surface passed.');
console.log(`  Ten Gods 10/10; functional groups 5/5; structural touches ${ten.totalTouches}.`);
