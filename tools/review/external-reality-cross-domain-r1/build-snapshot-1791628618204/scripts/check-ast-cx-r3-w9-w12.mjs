import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
import {
  buildPlanetsHousesExplorerHtml,
  buildAspectsPatternsHtml,
  buildRulershipNetworkSvg,
  buildRulershipNetworkHtml,
  buildElementModalityMatrixHtml,
  buildAstExplorerInspectorHtml,
  buildAstrologySpecialistSurfaceV3,
  installAstrologySpecialistInteractions
} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';
import {renderAstrologyProduct} from '../assets/customer-ui/js/specialists/ast/product-renderer.js';
import {assertAstCxR3CurrentSharedBoundary} from './lib/ast-cx-r3-shared-boundary.mjs';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='content/professional/ast-full-production/customer-product-v3';
const baseline='76c70e1fca0d69171959c77b46566235012ab615';
globalThis.document={documentElement:{lang:'zh-Hans'}};

// Shared-host and SMR freeze remain byte-stable.
// Current-main shared successor boundary: AST does not own or mutate these bytes.
assertAstCxR3CurrentSharedBoundary('AST-CX-R3-W9-W12');

const docs=[
  json(`${base}/contracts/ast-cx-r3-w9-planets-houses-explorer-contract-v1.json`),
  json(`${base}/contracts/ast-cx-r3-w10-aspects-patterns-contract-v1.json`),
  json(`${base}/contracts/ast-cx-r3-w11-rulership-network-contract-v1.json`),
  json(`${base}/contracts/ast-cx-r3-w12-element-modality-matrix-contract-v1.json`)
];
assert.deepEqual(docs.map(x=>x.workCode),['AST-CX-R3-W9','AST-CX-R3-W10','AST-CX-R3-W11','AST-CX-R3-W12']);
for(const doc of docs){assert.equal(doc.baselineCommit,baseline);for(const v of Object.values(doc.boundaries))assert.equal(v,false,`${doc.workCode} boundary must remain false`)}
assert.equal(docs[2].schoolBoundary.primaryChainAuthority,'TRADITIONAL_SEVEN_PRIMARY_V1');
assert.equal(docs[2].schoolBoundary.silentSchoolMixingAllowed,false);
assert.equal(docs[3].sourceScope,'CORE_10_PLANETS_UNWEIGHTED');

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
assert.equal(route.mode,'SINGLE_METHOD');
const product=route.primaryProduct;
assert.equal(product.methodId,'AST');
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
assert.equal(resolveSpecialistRendererDescriptor(product)?.rendererId,'PPR_R3_AST_PRODUCT_V1');
for(const cap of ['AST_PLANETS_HOUSES_EXPLORER','AST_ASPECT_PATTERN_NETWORK','AST_RULERSHIP_NETWORK','AST_ELEMENT_MODALITY_MATRIX'])assert(product.specialistRenderer.capabilities.includes(cap),`missing W9-W12 capability ${cap}`);
const p=product.sourceProduct?.customerProductProjection;
assert.equal(p?.schemaVersion,'PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0');

// W9 Planets & Houses — one explorer, no second essays.
const ph=buildPlanetsHousesExplorerHtml(p);
assert.match(ph,/data-astcx-section="planets-houses"/);
assert.equal((ph.match(/data-astcx-directory-mode=/g)||[]).length,2);
assert.equal((ph.match(/data-astcx-directory-pane=/g)||[]).length,2);
assert.equal((ph.match(/data-astcx-select-kind="planet"/g)||[]).length,10);
assert.equal((ph.match(/data-astcx-select-kind="house"/g)||[]).length,12);
for(const x of p.planetHouseDirectory){assert(ph.includes(x.bodyLabel),`planet label missing ${x.bodyCode}`);for(const v of [x.functionLabel,x.directionLabel,x.domainLabel].filter(Boolean))assert(ph.includes(v),`projected planet semantic label missing ${v}`)}
for(const h of p.chart.houses){const r=p.rulership.houseRulers.find(x=>Number(x.houseNumber)===Number(h.houseNumber));assert(r,`house ruler missing ${h.houseNumber}`);assert(ph.includes(`data-astcx-ref="${h.houseNumber}"`));assert(ph.includes(p.chart.positions.find(x=>x.bodyCode===r.primaryRuler)?.bodyLabel||r.primaryRuler))}
const houseOneInspector=buildAstExplorerInspectorHtml(p,'house','1');
const houseOneRuler=p.rulership.houseRulers.find(x=>Number(x.houseNumber)===1).primaryRuler;
assert(houseOneInspector.includes(p.chart.positions.find(x=>x.bodyCode===houseOneRuler)?.bodyLabel||houseOneRuler),'house inspector must use primaryRuler');
assert.doesNotMatch(ph,/candidateMeaning|renderOwnerId|narrativeRef/);

// W10 Aspects & Patterns — render every governed edge/pattern; filtering is display only.
const ap=buildAspectsPatternsHtml(p);
assert.match(ap,/data-astcx-section="aspects-patterns"/);
assert.equal((ap.match(/data-astcx-aspect-row=/g)||[]).length,p.aspectNetwork.aspects.length);
assert.equal((ap.match(/class="ast-cx-r3-pattern-card"/g)||[]).length,p.aspectNetwork.patterns.length);
for(const dynamic of ['APPLYING','SEPARATING','EXACT','UNDETERMINED'])assert(ap.includes(`data-astcx-aspect-filter="${dynamic}"`));
for(const a of p.aspectNetwork.aspects){assert(ap.includes(`data-astcx-aspect-row="${a.aspectRef}"`));assert(ap.includes(`data-astcx-aspect-dynamic="${a.dynamicState}"`));assert(ap.includes(`${Number(a.orbDegrees).toFixed(Number(a.orbDegrees)%1?1:0)}°`))}
for(const pattern of p.aspectNetwork.patterns){assert(ap.includes(pattern.label));for(const code of pattern.bodyCodes)assert(ap.includes(p.chart.positions.find(x=>x.bodyCode===code)?.bodyLabel||code))}
assert.doesNotMatch(ap,/candidateMeaning/);

// W11 Rulership network — all upstream topology is visible with no hierarchy score.
const rn=buildRulershipNetworkHtml(p),svg=buildRulershipNetworkSvg(p);
assert.match(rn,/data-astcx-section="rulership"/);
assert.equal((svg.match(/data-astcx-rulership-node=/g)||[]).length,10);
assert.equal((svg.match(/data-astcx-ruler-edge=/g)||[]).length,p.rulership.planetaryDispositors.length);
assert.equal((rn.match(/class="ast-cx-r3-house-ruler"/g)||[]).length,12);
assert.equal((rn.match(/class="ast-cx-r3-chain-row"/g)||[]).length,10);
for(const code of p.rulership.finalDispositors)assert(rn.includes(p.chart.positions.find(x=>x.bodyCode===code)?.bodyLabel||code));
for(const cyc of p.rulership.cycles)for(const code of cyc.members)assert(rn.includes(p.chart.positions.find(x=>x.bodyCode===code)?.bodyLabel||code));
assert(rn.includes('传统七星主守护'));
assert.doesNotMatch(rn,/strength score|dominant planet|强度评分|主导行星/i);

// W12 Element × Modality — fixed 4x3 layout consumes projected counts only.
const em=buildElementModalityMatrixHtml(p);
assert.match(em,/data-astcx-section="elements-modes"/);
assert.equal((em.match(/data-astcx-matrix-sign=/g)||[]).length,12);
const signs=[...em.matchAll(/data-astcx-matrix-sign="([A-Z]+)"/g)].map(x=>x[1]);
assert.equal(new Set(signs).size,12);
for(const sign of ['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES'])assert.equal(signs.filter(x=>x===sign).length,1,`${sign} must appear once in matrix`);
for(const [sign,count] of Object.entries(p.distribution.signCounts)){const re=new RegExp(`data-astcx-matrix-sign="${sign}"[^>]*>[\\s\\S]*?<b>${count}<\\/b>`);assert(re.test(em),`matrix cell must use projected sign count ${sign}=${count}`)}
for(const [code,count] of Object.entries(p.distribution.elementCounts))assert(em.includes(`${count}</strong>`),`element total ${code} missing`);
for(const [code,count] of Object.entries(p.distribution.modalityCounts))assert(em.includes(`${count}</strong>`),`modality total ${code} missing`);
assert(em.includes('分布并列'),'fixture tie state must remain visible');
assert.doesNotMatch(em,/你的主导元素|你的主导模式|人格主导/);

// Interaction: planet/house mode and aspect dynamic filter work without route mutation.
class FakeEl{
  constructor(dataset={}){this.dataset={...dataset};this.attrs={};this.hidden=false;this.innerHTML=''}
  setAttribute(k,v){this.attrs[k]=String(v)}
  closest(selector){
    if(selector==='[data-astcx-directory-mode]'&&this.dataset.astcxDirectoryMode)return this;
    if(selector==='[data-astcx-aspect-filter]'&&this.dataset.astcxAspectFilter)return this;
    if(selector==='[data-astcx-select-kind]'&&this.dataset.astcxSelectKind)return this;
    return null;
  }
}
const directoryPlanet=new FakeEl({astcxDirectoryMode:'planets'}),directoryHouse=new FakeEl({astcxDirectoryMode:'houses'}),planetPane=new FakeEl({astcxDirectoryPane:'planets'}),housePane=new FakeEl({astcxDirectoryPane:'houses'});
const allFilter=new FakeEl({astcxAspectFilter:'ALL'}),applyFilter=new FakeEl({astcxAspectFilter:'APPLYING'}),aspectRows=p.aspectNetwork.aspects.slice(0,4).map(a=>new FakeEl({astcxAspectRow:a.aspectRef,astcxAspectDynamic:a.dynamicState}));
const fakeRoot={dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},querySelector(){return null},querySelectorAll(sel){if(sel==='[data-astcx-directory-mode]')return [directoryPlanet,directoryHouse];if(sel==='[data-astcx-directory-pane]')return [planetPane,housePane];if(sel==='[data-astcx-aspect-filter]')return [allFilter,applyFilter];if(sel==='[data-astcx-aspect-row]')return aspectRows;if(sel==='[data-astcx-state]'||sel==='[data-astcx-select-kind]'||sel==='[data-astcx-body]'||sel==='[data-astcx-aspect]'||sel==='[data-astcx-theme-card]'||sel==='[data-astcx-house]'||sel==='[data-astcx-pattern]')return [];return []}};
installAstrologySpecialistInteractions(fakeRoot,p);
fakeRoot.listeners.click({target:directoryHouse});
assert.equal(directoryHouse.attrs['aria-pressed'],'true');assert.equal(directoryPlanet.attrs['aria-pressed'],'false');assert.equal(planetPane.hidden,true);assert.equal(housePane.hidden,false);
fakeRoot.listeners.click({target:applyFilter});
assert.equal(applyFilter.attrs['aria-pressed'],'true');assert.equal(allFilter.attrs['aria-pressed'],'false');
for(const row of aspectRows)assert.equal(row.hidden,row.dataset.astcxAspectDynamic!=='APPLYING');
assert.equal(fakeRoot.dataset.astCxR3Interactions,'true');

const plan=buildAstrologySpecialistSurfaceV3(p),renderPlan=renderAstrologyProduct({product});
assert.equal(plan.status,'RENDERED');assert.equal(renderPlan.status,'RENDERED');assert.equal(renderPlan.compatibilityOnly,false);
for(const id of ['planets-houses','aspects-patterns','rulership','elements-modes'])assert(plan.readingHtml.includes(`data-astcx-section="${id}"`));
const source=text('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js');
assert.doesNotMatch(source,/calculatePlanet|calculateHouse|calculateAspect|ephemeris|buildAstProfessional|buildAstWholeChart|executeAst|uniqueLeader\(/);
assert.match(source,/ELEMENT_MODALITY_SIGN/);
assert.match(source,/node position is visual only|Node position is visual only|节点位置仅用于视觉排布/);
const css=text('assets/customer-ui/surfaces/astrology-specialist-v3.css');assert.match(css,/ast-cx-r3-rulership-network/);assert.match(css,/ast-cx-r3-matrix/);assert.doesNotMatch(css,/\.cx-astw/);

const acceptance=json(`${base}/acceptance/ast-cx-r3-w9-w12-professional-structure-acceptance-v1.json`);
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED');assert.equal(acceptance.baselineCommit,baseline);assert.equal(acceptance.pprR3SharedFilesModified,0);assert.equal(acceptance.sharedSingleMethodReadingModified,0);assert.equal(acceptance.otherMethodFilesModified,0);
const manifest=json(`${base}/manifest/ast-cx-r3-w9-w12-manifest-v1.json`);assert.equal(manifest.baselineCommit,baseline);assert.equal(manifest.sequence.length,4);

console.log('✓ AST-CX-R3 W9–W12 passed: Planets & Houses explorer, Aspects & Patterns professional surface, governed Rulership Network, and Element × Modality Matrix all consume the existing AST Customer Product Projection v3 inside the PPR-R3 specialist renderer.');
console.log(`  W9 ${p.planetHouseDirectory.length} planets / ${p.chart.houses.length} houses; W10 ${p.aspectNetwork.aspects.length} aspects / ${p.aspectNetwork.patterns.length} patterns; W11 ${p.rulership.houseRulers.length} house rulers / ${p.rulership.dispositorChains.length} chains / ${p.rulership.cycles.length} cycle(s); W12 4×3 zodiac matrix from governed ${p.distribution.scope}.`);
