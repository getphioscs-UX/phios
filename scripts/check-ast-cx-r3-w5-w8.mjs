import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildAstCustomerWorkspaceCandidate} from '../functions/ast-full-production/ast-customer-reading-production.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
import {renderAstrologyProduct} from '../assets/customer-ui/js/specialists/ast/product-renderer.js';
import {AST_CX_R3_IA,buildNatalChartV2,buildAstExplorerInspectorHtml,buildCoreConfigurationHtml,buildAstrologySpecialistSurfaceV3,installAstrologySpecialistInteractions} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='content/professional/ast-full-production/customer-product-v3';
globalThis.document={documentElement:{lang:'zh-Hans'}};

const pprFreeze=json('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
const astCxCurrentBaselineAbsent=new Set(['assets/customer-ui/js/surfaces/single-method-reading.js']);for(const [p,d] of Object.entries(pprFreeze.protectedConvergenceFiles)){if(astCxCurrentBaselineAbsent.has(p)){assert.equal(fs.existsSync(p),false,`AST-CX-R3 current baseline retired path unexpectedly restored: ${p}`);continue}assert.equal(sha(p),d,`AST-CX-R3 W5-W8 protected PPR drift: ${p}`)};
for(const [p,d] of Object.entries(pprFreeze.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`AST-CX-R3 W5-W8 shared SMR drift: ${p}`);
for(const p of ['assets/customer-ui/js/personal-products/personal-product-renderers.js','assets/customer-ui/js/personal-products/specialist-renderer-host.js','assets/customer-ui/js/personal-products/specialist-renderer-registry.js','assets/customer-ui/surfaces/ppr-r3-specialist-host.css'])assert.equal(sha(p),pprFreeze.successorFiles[p],`AST-CX-R3 W5-W8 shared PPR-R3 host drift: ${p}`);

const ia=json(`${base}/registries/ast-cx-r3-w5-specialist-ia-v1.json`);
assert.equal(ia.workCode,'AST-CX-R3-W5');
assert.equal(ia.baselineCommit,'61cf2ac5a5f2570a161c64a051dc170b3574e74f');
assert.equal(ia.navigation.length,11);
assert.deepEqual(ia.navigation.map(x=>x.id),AST_CX_R3_IA.map(x=>x[0]));
assert.equal(ia.rules.sharedGenericGraphStructurePatternContextPrimary,false);

const w6=json(`${base}/contracts/ast-cx-r3-w6-natal-chart-v2-contract-v1.json`);
const w7=json(`${base}/contracts/ast-cx-r3-w7-chart-explorer-contract-v1.json`);
const w8=json(`${base}/contracts/ast-cx-r3-w8-core-configuration-contract-v1.json`);
for(const doc of [w6,w7,w8])for(const v of Object.values(doc.boundaries))assert.equal(v,false,`${doc.workCode} boundary drift`);
assert.equal(w8.leaderRule.includes('TIED_NO_SINGLE_LEADER'),true);

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
assert.equal(route.mode,'SINGLE_METHOD');
const product=route.primaryProduct;
assert.equal(product.methodId,'AST');
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
assert.equal(resolveSpecialistRendererDescriptor(product)?.rendererId,'PPR_R3_AST_PRODUCT_V1');
for(const cap of ['AST_CUSTOMER_PRODUCT_PROJECTION_V3','AST_PROFESSIONAL_IA','AST_NATAL_CHART_V2','AST_CHART_EXPLORER','AST_CORE_CONFIGURATION'])assert(product.specialistRenderer.capabilities.includes(cap),`missing capability ${cap}`);
const projection=product.sourceProduct?.customerProductProjection;
assert.equal(projection?.schemaVersion,'PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0');

const plan=buildAstrologySpecialistSurfaceV3(projection);
assert.equal(plan.status,'RENDERED');
assert.equal((plan.navigationHtml.match(/data-ppr-r3-nav-target=/g)||[]).length,11);
for(const label of ['总览','我的读取','出生星盘','核心配置','行星与宫位','相位与格局','守护星与命盘链','元素与模式','时间与激活','现实对照','来源与技术'])assert(plan.navigationHtml.includes(label),`IA label missing ${label}`);
const allHtml=`${plan.visualHtml}${plan.readingHtml}${plan.technicalHtml}`;
for(const id of AST_CX_R3_IA.map(x=>x[0]))assert(allHtml.includes(`data-astcx-section="${id}"`),`section missing ${id}`);
assert.doesNotMatch(plan.navigationHtml,/结构图|>结构<|>模式<|>情境</);
assert.match(plan.visualHtml,/data-ast-cx-r3-surface=/);
assert.match(plan.visualHtml,/data-astcx-section="overview"/);
assert.match(plan.visualHtml,/data-astcx-section="my-reading"/);

const wheel=buildNatalChartV2(projection);
assert.match(wheel,/data-astcx-section="natal-chart"/);
assert.equal((wheel.match(/data-house-cusp-longitude=/g)||[]).length,12);
assert.equal((wheel.match(/data-astcx-body=/g)||[]).length,10);
assert.equal((wheel.match(/data-astcx-aspect=/g)||[]).length,projection.chart.aspects.length);
for(const a of ['ASC','MC','DSC','IC'])assert(wheel.includes(`data-astcx-angle="${a}"`),`angle missing ${a}`);
assert.match(wheel,/整宫制/);
assert.doesNotMatch(wheel,/WHOLE_SIGN_V1/);
assert.doesNotMatch(wheel,/Structure only|结构；星盘图本身/);

const placidusLike=structuredClone(projection);
placidusLike.houseSystemId='PLACIDUS_V1';
placidusLike.chart.houses[0].longitude=67.25;
placidusLike.chart.houses[1].longitude=96.8;
placidusLike.chart.houses[2].longitude=124.15;
for(const h of placidusLike.chart.houses.slice(0,3))h.houseSystemId='PLACIDUS_V1';
const irregular=buildNatalChartV2(placidusLike);
assert.match(irregular,/普拉西德宫制/);
assert.match(irregular,/data-house-cusp-longitude="67.25"/);
assert.match(irregular,/data-house-cusp-longitude="96.8"/);
assert.match(irregular,/data-house-cusp-longitude="124.15"/);

const firstAspect=projection.aspectNetwork.aspects[0],firstPattern=projection.aspectNetwork.patterns[0],firstTheme=projection.keyConfigurations[0];
for(const [kind,ref] of [['planet','SUN'],['house','1'],['aspect',firstAspect.aspectRef],['pattern',`${firstPattern.patternCode}:${firstPattern.bodyCodes.join('|')}:0`],['theme',firstTheme.themeRef]]){
 const html=buildAstExplorerInspectorHtml(projection,kind,ref);assert(html.length>80,`${kind} inspector empty`);assert.doesNotMatch(html,/candidateMeaning/);
}
const aspectInspector=buildAstExplorerInspectorHtml(projection,'aspect',firstAspect.aspectRef);
assert(aspectInspector.includes('正在')||aspectInspector.includes('未确定')||aspectInspector.includes('精确'));
assert(aspectInspector.includes(`${Number(firstAspect.orbDegrees).toFixed(Number(firstAspect.orbDegrees)%1?1:0)}°`));
const patternInspector=buildAstExplorerInspectorHtml(projection,'pattern',`${firstPattern.patternCode}:${firstPattern.bodyCodes.join('|')}:0`);
assert(patternInspector.includes(firstPattern.label));
const themeInspector=buildAstExplorerInspectorHtml(projection,'theme',firstTheme.themeRef);
const narrativeOwnerSuccessor=fs.existsSync('content/professional/ast-full-production/customer-product-v3/contracts/ast-cx-r3-w14-one-narrative-owner-contract-v1.json');
if(narrativeOwnerSuccessor){assert(!themeInspector.includes(firstTheme.readerText));assert.match(themeInspector,/data-astcx-jump-theme-owner=/)}
else assert(themeInspector.includes(firstTheme.readerText));

const core=buildCoreConfigurationHtml(projection);
for(const label of ['太阳','月亮','上升点','天顶','命盘守护星','元素分布','模式分布'])assert(core.includes(label),`core config missing ${label}`);
assert(core.includes('分布并列'), 'tie state must remain visible for fixture');
assert.doesNotMatch(core,/你的主导元素|你的主导模式|人格主导/);
const linked=projection.aspectNetwork.patterns.filter(x=>x.themeRefs?.length).map(x=>x.label);for(const label of linked)assert(core.includes(label),`reading-linked pattern missing ${label}`);

class FakeEl{constructor(dataset={}){this.dataset={...dataset};this.attrs={};this.innerHTML='';}setAttribute(k,v){this.attrs[k]=String(v)}closest(selector){return selector==='[data-astcx-select-kind]'&&this.dataset.astcxSelectKind?this:null}}
const inspector=new FakeEl(),trigger=new FakeEl({astcxSelectKind:'planet',astcxRef:'SUN'}),sunMark=new FakeEl({astcxBody:'SUN'}),moonMark=new FakeEl({astcxBody:'MOON'}),aspectMark=new FakeEl({astcxAspect:firstAspect.aspectRef,from:firstAspect.fromCode,to:firstAspect.toCode}),themeMark=new FakeEl({astcxThemeCard:firstTheme.themeRef});
const fakeRoot={dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},querySelector(sel){return sel==='[data-astcx-inspector]'?inspector:null},querySelectorAll(sel){if(sel==='[data-astcx-select-kind]')return [trigger];if(sel==='[data-astcx-body]')return [sunMark,moonMark];if(sel==='[data-astcx-aspect]')return [aspectMark];if(sel==='[data-astcx-theme-card]')return [themeMark];if(sel==='[data-astcx-house]'||sel==='[data-astcx-pattern]')return [];if(sel==='[data-astcx-state]')return [sunMark,moonMark,aspectMark,themeMark,trigger];return []}};
installAstrologySpecialistInteractions(fakeRoot,projection);
assert.equal(fakeRoot.dataset.astCxR3Interactions,'true');
fakeRoot.listeners.click({target:trigger});
assert(inspector.innerHTML.includes('太阳'));
assert.equal(sunMark.dataset.astcxState,'selected');
assert.equal(aspectMark.dataset.astcxState,'related');
assert.equal(themeMark.dataset.astcxState,'related');
assert.equal(trigger.attrs['aria-pressed'],'true');

const renderPlan=renderAstrologyProduct({product});
assert.equal(renderPlan.status,'RENDERED');
assert.equal(renderPlan.navigationHtml,plan.navigationHtml);
assert.equal(renderPlan.compatibilityOnly,false);
assert.equal(typeof renderPlan.afterMount,'function');

const rendererSource=text('assets/customer-ui/js/specialists/ast/product-renderer.js');
assert.match(rendererSource,/ast-specialist-surface-v3\.js/);
assert.match(rendererSource,/ast-specialist-surface-v3\.js/);
assert.match(rendererSource,/legacyCompatibilityPlan/);
assert.match(rendererSource,/if\(!projection\)return legacyCompatibilityPlan/);
const surfaceSource=text('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js');
assert.doesNotMatch(surfaceSource,/calculatePlanet|calculateHouse|calculateAspect|ephemeris|buildAstProfessional|buildAstWholeChart|executeAst/);
assert.match(surfaceSource,/data-astcx-select-kind="planet"/);
assert.match(surfaceSource,/data-astcx-select-kind="aspect"/);
assert.match(surfaceSource,/data-astcx-select-kind="house"/);
assert.match(surfaceSource,/data-astcx-select-kind="pattern"/);
assert.match(surfaceSource,/data-astcx-select-kind="theme"/);
const css=text('assets/customer-ui/surfaces/astrology-specialist-v3.css');
assert.match(css,/\.ast-cx-r3/);
assert.doesNotMatch(css,/\.cx-astw/);

const acceptance=json(`${base}/acceptance/ast-cx-r3-w5-w8-specialist-surface-acceptance-v1.json`);
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED');
assert.equal(acceptance.oldAstrologyWorkspacePrimaryRenderer,false);
assert.equal(acceptance.sharedPprR3HostModified,0);
assert.equal(acceptance.sharedSingleMethodReadingModified,0);
assert.equal(acceptance.otherMethodFilesModified,0);

console.log('✓ AST-CX-R3 W5–W8 passed: method-native IA, Natal Chart v2, chart explorer, and Core Configuration are rendered by the AST-owned PPR-R3 specialist renderer from Customer Product Projection v3.');
console.log(`  IA ${ia.navigation.length} destinations; chart ${projection.chart.positions.length} planets / ${projection.chart.houses.length} actual cusps / ${projection.chart.aspects.length} aspects; ${projection.aspectNetwork.patterns.length} governed patterns; shared PPR-R3 host unchanged.`);
