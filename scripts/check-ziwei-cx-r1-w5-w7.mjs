import assert from 'node:assert/strict';
import fs from 'node:fs';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {buildZiweiProfessionalViewModel,isSingleZiweiFullProduction,renderZiweiPalaceComponentHtml} from '../assets/customer-ui/js/surfaces/ziwei-professional-reading.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const txt=p=>fs.readFileSync(p,'utf8');
const integration='a06506cbbc9bf0bdd11ff1c740f7be65276d84d9';
const semantic='d16d757a477e2a9f7e3c7a38e4e5d044ce7e4aaf';
const cx='content/customer-experience-rebuild/ziwei-cx-r1';

const ia=j(`${cx}/registries/ziwei-cx-r1-professional-ia-registry-v1.json`);
const hero=j(`${cx}/contracts/ziwei-cx-r1-reading-first-contract-v1.json`);
const palace=j(`${cx}/contracts/ziwei-cx-r1-live-palace-component-contract-v1.json`);
const authority=j(`${cx}/authority/ziwei-cx-r1-professional-surface-authority-v1.json`);
const acceptance=j(`${cx}/acceptance/ziwei-cx-r1-w5-w7-engineering-acceptance-v1.json`);
const roadmap=j(`${cx}/roadmap/ziwei-cx-r1-master-work-v2.json`);
for(const x of [ia,hero,palace,authority,acceptance,roadmap])assert.equal(x.integrationBaselineCommit,integration);
for(const x of [ia,authority,roadmap])assert.equal(x.ziweiFullProductionSemanticBaselineCommit,semantic);
assert.deepEqual(ia.sections.map(x=>x.zhHans),['概览','命盘','十二宫','主题读取','格局','大限与流年','现实对照','证据与边界']);
assert.equal(ia.genericPersonalRealityIa.retainedForMultiMethod,true);
assert.equal(ia.genericPersonalRealityIa.allowedAsPrimaryForSingleZiweiFullProduction,false);
assert.equal(ia.pageOwnerCount,1);
assert.equal(hero.hero.requiredTitleZhHans,'紫微斗数专业读取');
assert.deepEqual(hero.hero.requiredAnchors,['LIFE_PALACE','BODY_PALACE','DA_XIAN_FOCUS','LIU_NIAN_FOCUS']);
assert.deepEqual(hero.hero.primaryActions,['ziwei-palaces','ziwei-topics']);
assert.equal(palace.layout.palaceCount,12);
assert.equal(palace.ownership.oneFullExplanationOwnerPerPalace,true);
assert.equal(palace.ownership.secondPalaceEssayForbidden,true);
assert.equal(authority.rules.singleZiweiUsesProfessionalIa,true);
assert.equal(authority.rules.multiMethodKeepsGenericPersonalRealityIa,true);
assert.equal(authority.rules.genericSmrOwnsCompleteSingleZiweiReport,false);
assert.equal(authority.rules.genericZwrGraphOwnsSingleZiweiChart,false);
assert.equal(acceptance.gates.W7_TWELVE_PALACE_BUTTONS,true);
assert.equal(acceptance.gates.CUSTOMER_SURFACE_VISUAL_HUMAN_ACCEPTED,false);
assert.equal(roadmap.nextWork,'ZIWEI-CX-R1-W8｜W18 Full Customer Report Renderer');

const html=txt('perspectives/personal/index.html');
const client=txt('assets/customer-ui/js/surfaces/personal-reality.js');
const renderer=txt('assets/customer-ui/js/surfaces/ziwei-professional-reading.js');
const css=txt('assets/customer-ui/surfaces/personal-reality.css');
assert.match(html,/data-cx-ziwei-workspace/);
assert.match(html,/data-cx-generic-workspace/);
const ziweiBlock=html.slice(html.indexOf('data-cx-ziwei-workspace'),html.indexOf('data-cx-generic-workspace'));
for(const label of ['概览','命盘','十二宫','主题读取','格局','大限与流年','现实对照','证据与边界'])assert.ok(ziweiBlock.includes(`data-cx-zh="${label}"`),`missing Zi Wei IA label ${label}`);
for(const legacy of ['data-cx-zh="结构图"','data-cx-zh="结构"','data-cx-zh="情境"'])assert.ok(!ziweiBlock.includes(legacy),`generic IA leaked into single Zi Wei IA: ${legacy}`);
assert.match(html,/data-cx-zh="结构图"/); // generic multi-method IA remains.
assert.match(client,/isSingleZiweiFullProduction\(view\)/);
assert.match(client,/generic\.hidden=singleZiwei/);
assert.match(client,/ziwei\.hidden=!singleZiwei/);
assert.match(client,/renderZiweiProfessionalReading\(view\.ziweiFullProduction,ziwei\)/);
assert.match(renderer,/紫微斗数专业读取/);
assert.match(renderer,/data-cx-ziwei-nav-target="ziwei-palaces"/);
assert.match(renderer,/data-cx-ziwei-nav-target="ziwei-topics"/);
assert.match(renderer,/data-cx-ziwei-palace-inspector/);
assert.match(renderer,/emptyMainStarPalace/);
assert.match(renderer,/oppositeMainStarReference/);
assert.match(css,/grid-template-columns:minmax\(38rem,1\.15fr\) minmax\(19rem,\.85fr\)/);
assert.match(css,/@media\(max-width:1120px\).*\.cx-ziwei-chart-stage\{grid-template-columns:1fr\}/s);
assert.match(css,/\.cx-ziwei-palace-inspector\{position:sticky/);
assert.match(css,/@media\(max-width:620px\).*\.cx-ziwei-palace-inspector\{margin-top:/s);

const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
  const url=String(input?.url||input);
  if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});
  throw new Error(`ZIWEI_CX_R1_W5_W7_UNEXPECTED_FETCH:${url}`);
};
let view;
try{
  const body={birthDate:'2023-01-22',birthTime:'05:00',birthTimeUnknown:false,placeRef:'N123',methods:['ziwei'],traditionalCalculationSex:'MALE',ziweiTargetDate:'2026-08-28',ziweiTargetTime:'12:00',ziweiTargetTimezoneIana:'Asia/Kuala_Lumpur',ziweiTargetUtcOffset:'+08:00',ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:'zh-Hans'};
  const request=new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const response=await customerPersonalReality({request,env:{}});assert.equal(response.status,200);const payload=await response.json();assert.equal(payload.ok,true);view=payload.view;
}finally{globalThis.fetch=originalFetch}
assert.equal(isSingleZiweiFullProduction(view),true);
const model=buildZiweiProfessionalViewModel(view.ziweiFullProduction,'zh-Hans');
assert.equal(model.hero.title,'紫微斗数专业读取');
assert.deepEqual(model.hero.anchors.map(x=>x.code),['LIFE_PALACE','BODY_PALACE','DA_XIAN_FOCUS','LIU_NIAN_FOCUS']);
assert.equal(model.surface.palaces.length,12);
assert.equal(model.topics.topics.length,8);
assert.equal(model.timing.items.length,3);
const chartHtml=renderZiweiPalaceComponentHtml(model.surface,'zh-Hans');
assert.equal((chartHtml.match(/data-cx-ziwei-palace="/g)||[]).length,12);
assert.match(chartHtml,/十二宫命盘/);
assert.match(chartHtml,/data-cx-ziwei-palace-inspector/);
assert.match(chartHtml,/星曜与状态/);
assert.match(chartHtml,/宫位网络/);
assert.match(chartHtml,/空宫 · 借对宫参照/);
assert.match(chartHtml,/仍保留的解释空白/);
for(const raw of ['WATER_2','>HAI<','>XU<','>ZI<'])assert.ok(!chartHtml.includes(raw),`raw customer code leaked: ${raw}`);
const life=model.surface.palaces.find(x=>x.palaceCode==='LIFE');assert.ok(life);assert.ok((Array.isArray(life.inspector?.paragraphs)?life.inspector.paragraphs:[]).length>0);assert.equal(model.surface.boundaries.oneInspectorOwnerPerPalace,true);
assert.equal(model.surface.boundaries.secondEssayCreated,false);

// Multi-method remains generic by API design: only an explicitly declared primary Zi Wei product activates the professional surface.
assert.equal(isSingleZiweiFullProduction({...view,primaryCustomerProduct:null}),false);

console.log('✓ ZIWEI-CX-R1-W5–W7 professional customer surface passed.');
console.log('  W5: single Zi Wei -> 概览 / 命盘 / 十二宫 / 主题读取 / 格局 / 大限与流年 / 现实对照 / 证据与边界; generic IA remains for multi-method.');
console.log(`  W6: Reading First hero resolves ${model.hero.anchors.length} governed anchors and exposes direct 12-palace/topic actions; readiness is progressive disclosure.`);
console.log(`  W7: live W19 browser model renders ${model.surface.palaces.length}/12 palace buttons with one W18-owned inspector; current fixture has ${model.openBoundaries.items.length} visible meaning gaps.`);
console.log('  Visual Human acceptance is intentionally still pending; next work is W8 Full Customer Report Renderer.');
