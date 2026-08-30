import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {AST_CX_R3_CSS_HREF,AST_CX_R3_CSS_CONTRACT} from '../assets/customer-ui/js/specialists/ast/product-renderer.js';
import {AST_CX_R3_STYLE_OWNER,AST_CX_R3_PRINT_CONTRACT,AST_CX_R3_IA,buildAstPrintCoverHtml,buildAstrologySpecialistSurfaceV3} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';
import {assertAstCxR3CurrentSharedBoundary} from './lib/ast-cx-r3-shared-boundary.mjs';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const base='content/professional/ast-full-production/customer-product-v3';
const baseline='492ecdddc1f84e5a915f416c60c61ed23e4fcb7f';
globalThis.document={documentElement:{lang:'zh-Hans'}};

const shared=assertAstCxR3CurrentSharedBoundary('AST-CX-R3 W21-W23');
assert.equal(shared.baselineCommit,baseline);
const w21=json(`${base}/contracts/ast-cx-r3-w21-specialist-css-cutover-contract-v1.json`);
const w22=json(`${base}/contracts/ast-cx-r3-w22-responsive-professional-layout-contract-v1.json`);
const w23=json(`${base}/contracts/ast-cx-r3-w23-print-product-contract-v1.json`);
for(const [doc,work] of [[w21,'AST-CX-R3-W21'],[w22,'AST-CX-R3-W22'],[w23,'AST-CX-R3-W23']]){assert.equal(doc.workCode,work);assert.equal(doc.baselineCommit,baseline)}

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
const product=route.primaryProduct,p=product?.sourceProduct?.customerProductProjection,x=product?.sourceProduct?.customerExperienceProjection;
assert.equal(product?.methodId,'AST');assert(p);const plan=buildAstrologySpecialistSurfaceV3(p,x);assert.equal(plan.status,'RENDERED');

// W21 — the primary v3 surface is AST-owned CSS, loaded by the AST bridge, while legacy workspace styling stays compatibility-only.
assert.equal(AST_CX_R3_CSS_HREF,'/assets/customer-ui/surfaces/astrology-specialist-v3.css');
assert.equal(AST_CX_R3_CSS_CONTRACT,'PHI-OS-AST-CX-R3-SPECIALIST-CSS-v1.0.0');
assert.equal(plan.styleOwner,AST_CX_R3_STYLE_OWNER);assert.equal(plan.styleOwner,w21.styleOwner);
assert.match(plan.visualHtml,/data-astcx-style-owner="AST_CX_R3_SPECIALIST_V3"/);
assert.match(plan.navigationHtml,/class="ast-cx-r3-nav"/);assert.equal((plan.navigationHtml.match(/data-ppr-r3-nav-target=/g)||[]).length,AST_CX_R3_IA.length);
const css=text('assets/customer-ui/surfaces/astrology-specialist-v3.css');
const bridge=text('assets/customer-ui/js/specialists/ast/product-renderer.js');
assert.match(bridge,/AST_CX_R3_CSS_HREF/);assert.match(bridge,/dataset\.astCxR3CssContract=AST_CX_R3_CSS_CONTRACT/);
assert.doesNotMatch(css,/\.cx-astw-/);assert.match(css,/\.ast-cx-r3\{/);assert.match(css,/\.ast-cx-r3-nav/);
assert.equal(w21.boundaries.pprR3SharedCssModified,false);assert.equal(w21.boundaries.personalRealityCssModified,false);

// W22 — explicit responsive regimes, bounded internal scroll for dense SVG/matrix visuals, and touch-safe controls.
assert.deepEqual(w22.requiredViewports,[375,390,430,768,1024,1280,1440,1920]);
for(const token of ['@media(min-width:1180px)','@media(min-width:768px) and (max-width:1179px)','@media(max-width:767px)','@media(max-width:430px)','min-block-size:44px','inline-size:min(100%,74rem)','overflow-x:auto','min-inline-size:520px','min-inline-size:600px'])assert(css.includes(token),`responsive CSS token missing: ${token}`);
assert.match(css,/writing-mode:horizontal-tb/);assert.match(css,/word-break:normal/);assert.match(css,/overflow-wrap:break-word/);
assert.equal(w22.geometryOwnership.natalWheel,'AST');assert.equal(w22.geometryOwnership.sharedHostRail,'PPR-R3');

// W23 — print is a composed product, not raw browser UI: print cover, bounded chart/network, expanded evidence, technical appendix, no interaction-only chrome.
assert.equal(plan.printContract,AST_CX_R3_PRINT_CONTRACT);assert.equal(plan.printContract,w23.printContract);
const cover=buildAstPrintCoverHtml(p);assert.match(cover,/data-astcx-print-cover/);assert.match(cover,/专业占星打印版/);assert.match(plan.visualHtml,/data-astcx-print-contract="PHI-OS-AST-CX-R3-PRINT-PRODUCT-v1\.0\.0"/);
for(const token of ['@media print','@page{margin:14mm 13mm 16mm','break-after:page','break-before:page','details:not([open])>*:not(summary){display:block!important}','data-astcx-directory-pane="planets"','data-astcx-directory-pane="houses"','.ast-cx-r3-aspect-row[hidden]{display:grid!important}','orphans:3','widows:3','.ast-cx-r3-nav{display:none!important}'])assert(css.includes(token),`print CSS token missing: ${token}`);
assert.match(plan.technicalHtml,/data-astcx-technical-details/);assert.match(plan.technicalHtml,/<details/);
assert.equal(w23.boundaries.printCreatesMeaning,false);assert.equal(w23.boundaries.printRunsCalculation,false);

const source=text('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js');
assert.doesNotMatch(source,/executeAstTransitRequest|createAstronomyEngine|calculateBodies|fetch\(/);
assert.doesNotMatch(source,/window\.print\(/); // print contract is CSS/composition, not a browser-side semantic operation.

const acceptance=json(`${base}/acceptance/ast-cx-r3-w21-w23-layout-print-acceptance-v1.json`);
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED');
assert.equal(acceptance.w21SpecialistCssCutoverPassed,true);assert.equal(acceptance.w22ResponsiveContractPassed,true);assert.equal(acceptance.w23PrintProductPassed,true);
assert.equal(acceptance.pprR3SharedRuntimeModified,0);assert.equal(acceptance.sharedSingleMethodReadingModified,0);assert.equal(acceptance.otherMethodFilesModified,0);
console.log('✓ AST-CX-R3 W21-W23 passed: AST-owned CSS is the primary specialist style, 8 required viewport contracts are covered with bounded dense-visual scrolling, and the professional print composition includes a print cover, full evidence rows and a technical appendix without changing shared PPR-R3.');
console.log(`  Style owner ${AST_CX_R3_STYLE_OWNER}; navigation ${AST_CX_R3_IA.length} destinations; print contract ${AST_CX_R3_PRINT_CONTRACT}.`);
