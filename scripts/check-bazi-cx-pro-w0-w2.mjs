import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {adaptBaziPersonalRealityProduct} from '../functions/personal-reality-product/adapters/bazi-production-adapter.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const fixture=json('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const purge=json('content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-customer-surface-language-purge-v1.json');
const ia=json('content/customer-experience-rebuild/bazi-cx-pro/registries/bazi-professional-reading-ia-v1.json');
const visual=json('content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-five-element-visual-projection-v1.json');
const acceptance=json('content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w0-w2-engineering-acceptance-v1.json');
const rendererSource=read('assets/customer-ui/js/specialists/bazi/product-renderer.js');
const surfaceSource=read('assets/customer-ui/js/surfaces/bazi-professional-reading.js');
const css=read('assets/customer-ui/surfaces/bazi-professional-reading.css');

assert.equal(purge.work,'BAZI-CX-PRO-W0');
assert.equal(ia.work,'BAZI-CX-PRO-W1');
assert.equal(visual.work,'BAZI-CX-PRO-W2');
assert.deepEqual(acceptance.workRange,['BAZI-CX-PRO-W0','BAZI-CX-PRO-W1','BAZI-CX-PRO-W2']);
assert.equal(acceptance.baseline.commit,'dae24c1dd8de49a6c238ddffb8d52b388e8da10d');

const expectedIa=[
 ['overview','总览'],['chart','命盘'],['elements','五行与十神'],['core','核心结构'],['pattern','格局与平衡'],
 ['relationships','关系结构'],['timing','大运流年'],['themes','人生主题'],['reality','现实对照'],['technical','来源技术']
];
assert.deepEqual(ia.canonicalOrder.map(x=>[x.key,x.labelZhHans]),expectedIa);
for(const [key,zh] of expectedIa){assert.ok(rendererSource.includes(`['${key}'`)&&rendererSource.includes(`'${zh}']`),`renderer NAV must declare ${key} / ${zh}`);}
assert.match(rendererSource,/renderBaziFiveElementSurface/);
assert.match(rendererSource,/id="bazi-section-elements"/);
assert.match(rendererSource,/id="bazi-section-technical"/);

const native=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(native.publicationDecision?.customerPublishable,true);
assert.equal(native.governance?.customerSurfaceLanguagePurgeAuthorized,true);
assert.equal(native.governance?.professionalReadingIaV2Authorized,true);
assert.equal(native.governance?.fiveElementVisualProjectionAuthorized,true);

const five=native.professionalModules?.fiveElements;
assert.equal(five?.schemaVersion,'PHI-OS-BAZI-CX-PRO-FIVE-ELEMENT-VISUAL-PROJECTION-v1.0.0');
assert.equal(five?.work,'BAZI-CX-PRO-W2');
assert.equal(five?.correction?.mode,'QUALITATIVE_MONTH_COMMAND_RELATION_ONLY');
assert.equal(five?.correction?.numericWeightedStrengthAvailable,false);
assert.equal(five?.correction?.weightedHiddenStemScoringApplied,false);
assert.equal(five?.boundaries?.rawRatioIsStrengthScore,false);
assert.equal(five?.boundaries?.seasonRelationIsFinalStrongWeakVerdict,false);
assert.equal(five?.boundaries?.hiddenStemWeightsInvented,false);
assert.equal(five?.boundaries?.goodBadScoreCreated,false);
assert.equal(five?.boundaries?.fortunePredictionCreated,false);
assert.equal(five?.items?.length,5);
assert.deepEqual(five.items.map(x=>x.element),['WOOD','FIRE','EARTH','METAL','WATER']);
assert.deepEqual(new Set(five.items.map(x=>x.dayMasterFunction)),new Set(['PEER','RESOURCE','OUTPUT','WEALTH','OFFICER']));
const rawCountSum=five.items.reduce((sum,x)=>sum+x.rawCount,0);
assert.equal(rawCountSum,five.rawInventory.total);
for(const item of five.items){
 assert.equal(item.rawCount,(item.breakdown.visibleStems||0)+(item.breakdown.visibleBranches||0)+(item.breakdown.hiddenStemsUnweighted||0));
 assert.ok(Math.abs(item.rawRatio-(item.rawCount/five.rawInventory.total*100))<=0.06,'raw ratio must be a direct raw-count ratio');
}
assert.ok(Math.abs(five.items.reduce((sum,x)=>sum+x.rawRatio,0)-100)<=0.2,'rounded Five Element ratios should sum to approximately 100%');
assert.equal(Object.values(five.rawInventory.visibleStems).reduce((a,b)=>a+b,0),4);
assert.equal(Object.values(five.rawInventory.visibleBranches).reduce((a,b)=>a+b,0),4);
assert.ok(Object.values(five.rawInventory.hiddenStemsUnweighted).reduce((a,b)=>a+b,0)>0);

for(const element of ['WOOD','FIRE','EARTH','METAL','WATER']){
 assert.ok(css.includes(`data-element=\"${element}\"`),`CSS must define ${element} visual token`);
}
assert.match(css,/--bazi-element-ratio/);
assert.match(css,/\.cx-bazi-element-grid/);
assert.match(css,/\.cx-bazi-five-element-explainer/);
assert.match(css,/\.cx-bazi-ten-god-preview/);
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:1050px\)/);
assert.match(css,/@media\(max-width:767px\)/);
assert.match(css,/writing-mode:horizontal-tb/);

// The actual canonical specialist renderer is exercised with a tiny DOM facade only for CSS-link installation.
globalThis.document={
 documentElement:{lang:'zh-Hans'},
 querySelector:()=>null,
 createElement:()=>({dataset:{}}),
 head:{appendChild:()=>{}}
};
const {renderBaziProduct}=await import('../assets/customer-ui/js/specialists/bazi/product-renderer.js');
const product=adaptBaziPersonalRealityProduct({report:native,locale:'zh-Hans'});
const rendered=renderBaziProduct({product});
assert.equal(rendered.status,'RENDERED');
assert.ok(rendered.readingHtml.length>1000);
assert.ok(rendered.navigationHtml.length>200);
assert.ok(rendered.technicalHtml.length>300);

let cursor=-1;
for(const [key,zh] of expectedIa){
 const target=`#bazi-section-${key}`;
 const pos=rendered.navigationHtml.indexOf(target);
 assert.ok(pos>cursor,`navigation must preserve exact IA order at ${key}`);
 cursor=pos;
 assert.ok(rendered.navigationHtml.includes(zh),`navigation must expose ${zh}`);
}
const primaryKeys=expectedIa.filter(([key])=>key!=='technical').map(([key])=>key);
cursor=-1;
for(const key of primaryKeys){
 const pos=rendered.readingHtml.indexOf(`id="bazi-section-${key}"`);
 assert.ok(pos>cursor,`primary reading must preserve IA order at ${key}`);
 cursor=pos;
}
assert.ok(!rendered.readingHtml.includes('id="bazi-section-technical"'),'technical section must not occupy the primary reading stream');
assert.ok(rendered.technicalHtml.includes('id="bazi-section-technical"'));

const visibleText=rendered.readingHtml.replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
const bannedMainLanguage=/Full Production|Reading IR|\bauthority\b|\badmitted\b|semantic owner|受治理|权威|准入|语义\s*owner|图谱编号|\bW\d+[A-Z0-9.-]*\b/i;
assert.doesNotMatch(visibleText,bannedMainLanguage,'W0 production language leaked into primary customer reading');
assert.match(rendered.technicalHtml,/Evidence records|证据记录/);
assert.match(rendered.technicalHtml,/Authority records|权威记录/);

assert.match(rendered.readingHtml,/五行 · 结构占比与季节校正/);
assert.match(rendered.readingHtml,/原始结构/);
assert.match(rendered.readingHtml,/校正倾向/);
assert.match(rendered.readingHtml,/相对日主/);
assert.match(rendered.readingHtml,/原始占比/);
assert.match(rendered.readingHtml,/季节校正/);
assert.match(rendered.readingHtml,/十神结构预览|十神 · 10 神分布/,'W2 preview or its W3 successor must remain customer-visible.');
assert.match(rendered.readingHtml,/不等同旺衰分数/);
assert.doesNotMatch(rendered.readingHtml,/五行力量百分比|五行旺衰百分比|吉凶分数|大吉|大凶|必发财|必结婚/);

// Historical PPR-C1 boundary language remains explicit; W0 is a customer-language purge, not an authority deletion.
assert.match(surfaceSource,/Support/);
assert.match(surfaceSource,/Defeat/);
assert.match(surfaceSource,/Rescue/);
assert.match(surfaceSource,/Unresolved/);
assert.match(surfaceSource,/THREE SCHOOLS/);
assert.match(surfaceSource,/NATAL × DA YUN × LIU NIAN/);
assert.match(surfaceSource,/Structure present ≠ transformation established|组合出现 ≠ 已经化成/);

console.log('✓ BAZI-CX-PRO W0-W2 customer language purge, professional IA cutover and Five Element visual projection passed.');
console.log(`  IA ${expectedIa.length}/10; Five Elements ${five.items.length}/5; raw inventory ${five.rawInventory.total}; main-surface banned production language 0.`);
