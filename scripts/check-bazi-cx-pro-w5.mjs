import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {renderBaziRelationshipInteractionSurface,renderBaziWholeChartFirst} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';

const readJson=url=>JSON.parse(fs.readFileSync(new URL(url,import.meta.url),'utf8'));
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const product=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
global.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:()=>{}},querySelectorAll:()=>[]};
global.queueMicrotask=global.queueMicrotask||((fn)=>fn());

assert.equal(product.governance.relationshipPillarInteractionProfessionalCompositionAuthorized,true);
assert.equal(product.professionalModules.moduleVersion,'BAZI-CX-PRO-W5-v1.0.0');
const rel=product.professionalModules.relationships;
assert.equal(rel.schemaVersion,'PHI-OS-BAZI-CX-PRO-RELATIONSHIP-PILLAR-INTERACTION-v1.0.0');
assert.equal(rel.work,'BAZI-CX-PRO-W5');
assert.equal(rel.pillarContexts.length,4);
assert.equal(rel.summary.relationCount,1);
assert.equal(rel.summary.directToDayMasterCount,1);
assert.equal(rel.summary.directToMonthCommandCount,1);
assert.equal(rel.items[0].type,'BRANCH_CLASH');
assert.equal(rel.items[0].relationFamily,'TENSION');
assert.equal(rel.items[0].positionThemeCode,'ENVIRONMENT_SELF_INTERFACE');
assert.equal(rel.items[0].priorityBand,'DAY_MASTER_MONTH_COMMAND_DIRECT');
assert.deepEqual(rel.items[0].positions,['MONTH','DAY']);
assert.equal(rel.items[0].dayMasterDirect,true);
assert.equal(rel.items[0].monthCommandDirect,true);
assert.equal(rel.items[0].context.dayMasterCarryingTendency,product.professionalModules.dayMasterStrength.carriers.overallTendency);
assert(rel.items[0].context.visibleTenGods.some(x=>x.code==='QI_SHA'));
assert(rel.items[0].context.hiddenTenGodCodes.includes('PIAN_CAI'));
assert.equal(rel.boundaries.relationPresenceDoesNotPredictEvent,true);
assert.equal(rel.boundaries.combinationDoesNotEstablishTransformation,true);
assert.equal(rel.boundaries.pillarThemeDoesNotEqualLifeEvent,true);

const html=renderBaziRelationshipInteractionSurface(product,{embedded:true});
assert.match(html,/data-bazi-cx-pro-relationships="true"/);
assert.match(html,/关系结构 · 柱位互动/);
assert.match(html,/月令环境 ↔ 自我锚点/);
assert.match(html,/十神上下文/);
assert.match(html,/日主承载连接/);
assert.match(html,/关系出现 ≠ 合化成立 ≠ 现实事件结果/);
assert.doesNotMatch(html,/配偶宫|父母宫|子女宫|必婚|必离|必发财/);

const whole=renderBaziWholeChartFirst(product);
assert.match(whole,/data-bazi-cx-pro-relationships="true"/);
const rendered=renderBaziProduct({product:{sourceProduct:product,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.readingHtml,/id="bazi-section-relationships"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-relationships="true"/);

const expectedTypes=['BRANCH_CLASH','BRANCH_SIX_COMBINATION','BRANCH_HARM','BRANCH_BREAK','BRANCH_PUNISHMENT_GROUP','BRANCH_SELF_PUNISHMENT','BRANCH_PUNISHMENT_PAIR','BRANCH_THREE_HARMONY','BRANCH_THREE_MEETING'];
const specs=generateCampaignCases();
const selected=[];for(const typeScenario of ['CLASH_NETWORK','SIX_COMBINATION','HARM_NETWORK','BREAK_NETWORK','THREE_HARMONY_WATER','THREE_MEETING_WOOD','THREE_PUNISHMENT','SELF_PUNISHMENT_REPEAT','ZI_MAO_PUNISHMENT'])selected.push(specs.find(x=>x.scenarioCode===typeScenario&&x.variantCode==='COMPLETE_ACTIVE'));
const seen=new Set();
for(const spec of selected){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:'zh-Hans'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 for(const item of modules.relationships.items){seen.add(item.type);assert(item.positions.length>=2);assert(item.relationFamily);assert(item.positionThemeCode);assert(item.priorityBand);assert.equal(item.boundaries.relationPresenceIsEventPrediction,false);assert.equal(item.boundaries.combinationMeansTransformation,false);assert.equal(item.boundaries.relationMeansGoodBad,false);}
}
for(const type of expectedTypes)assert(seen.has(type),`W5 synthetic coverage missing ${type}`);

const css=fs.readFileSync(new URL('../assets/customer-ui/surfaces/bazi-professional-reading.css',import.meta.url),'utf8');
for(const token of ['.cx-bazi-pillar-interaction-rail','.cx-bazi-relation-card-grid','.cx-bazi-relation-card','.cx-bazi-relationship-theme-section'])assert(css.includes(token),`CSS missing ${token}`);
const contract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-relationship-pillar-interaction-professional-composition-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w5-engineering-acceptance-v1.json');
assert.equal(contract.status,'ADMITTED');
assert.equal(contract.workId,'BAZI-CX-PRO-W5');
assert.equal(acceptance.status,'MACHINE_VERIFIED');
assert.equal(acceptance.acceptance.relationshipPillarInteractionProfessionalCompositionAuthorized,true);

console.log('✓ BAZI-CX-PRO W5 Relationship / Pillar Interaction Professional Composition passed.');
console.log(`  Fixture: ${rel.items[0].type} ${rel.items[0].positions.join('↔')} · ${rel.items[0].positionThemeCode}; synthetic relationship coverage ${expectedTypes.length}/${expectedTypes.length}.`);
