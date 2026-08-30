import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {buildZiweiW12W13RenderPlan,ZIWEI_CX_R1_W12_W13_RENDERER_ID} from '../assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline='76c70e1fca0d69171959c77b46566235012ab615';
const base='content/customer-experience-rebuild/ziwei-cx-r1';
const w12=json(`${base}/contracts/ziwei-cx-r1-w12-responsive-reconstruction-contract-v1.json`);
const w13=json(`${base}/contracts/ziwei-cx-r1-w13-legacy-zwr-suppression-contract-v1.json`);
const legacy=json(`${base}/legacy/ziwei-cx-r1-legacy-renderer-registry-v2.json`);
const acceptance=json(`${base}/acceptance/ziwei-cx-r1-w12-w13-engineering-acceptance-v1.json`);
const roadmap=json(`${base}/roadmap/ziwei-cx-r1-master-work-v3.json`);
for(const x of [w12,w13,legacy,acceptance])assert.equal(x.baselineCommit,baseline);
assert.equal(roadmap.integrationBaselineCommit,baseline);
assert.deepEqual(w12.acceptedViewports,[375,430,768,1024,1280,1440,1920]);
assert.equal(w12.rules.pageHorizontalOverflowForbidden,true);
assert.equal(w12.rules.chartHorizontalOverflowForbidden,true);
assert.equal(w12.rules.twelvePalaceGridColumns,4);
assert.equal(w12.rules.twoByTwoCenterSummaryRetained,true);
assert.equal(w12.rules.mobileInspectorPlacement,'BELOW_CHART');
assert.equal(w12.rules.wideInspectorPlacement,'RIGHT_OF_CHART');
assert.equal(w12.rules.wideInspectorBreakpointPx,1440);
assert.equal(w12.rules.sharedPprResponsiveCssMutationAllowed,false);
assert.equal(w13.currentOwner.rendererId,ZIWEI_CX_R1_W12_W13_RENDERER_ID);
assert.equal(w13.currentOwner.visibleOwnerCount,1);
assert.equal(w13.rules.genericSingleMethodReadingMayOwnCurrentZiwei,false);
assert.equal(w13.rules.historicalRenderersMayBecomeVisibleFallback,false);
assert.equal(w13.rules.missingCurrentPresentationBehavior,'ZIWEI_SPECIALIST_FAIL_CLOSED');
assert.equal(legacy.currentOwner.rendererId,ZIWEI_CX_R1_W12_W13_RENDERER_ID);
assert.equal(legacy.legacyEntries.every(x=>x.mayOwnCurrentZiwei===false),true);
assert.equal(acceptance.gates.VISUAL_HUMAN_ACCEPTED,false);
assert.equal(roadmap.nextWork,'ZIWEI-CX-R1-W14｜Fail-Closed Customer Fallback');

for(const [path,digest] of Object.entries(w13.frozenSharedFiles))assert.equal(sha(path),digest,`frozen PPR-R3/shared file drift: ${path}`);

const css=read('assets/customer-ui/surfaces/ziwei-specialist-workspace.css');
assert.match(css,/ZIWEI-CX-R1-W9-W11/); // predecessor history remains mechanically visible
assert.match(css,/ZIWEI-CX-R1-W12-W13/);
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(min-width:1440px\)/);
assert.match(css,/@media\(max-width:767px\)/);
assert.match(css,/@media\(max-width:400px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.doesNotMatch(css,/min-width:(?:37|40|42)rem/,'forced mobile chart min-width returned');
assert.doesNotMatch(css,/writing-mode:vertical/,'vertical writing is forbidden');

const page=read('perspectives/personal/index.html');
assert.match(page,/data-cx-specialist-products/);
for(const marker of ['data-cx-single-method-reading','data-cx-personal-graphs','data-cx-personal-structure','data-cx-personal-patterns','data-cx-personal-context'])assert(!page.includes(marker),`legacy result mount still visible: ${marker}`);
const sharedJs=read('assets/customer-ui/js/surfaces/personal-reality.js');
const renderFn=sharedJs.match(/function render\(\)\{[^\n]+/s)?.[0]||'';
assert.match(renderFn,/renderProductRoute\(view\.productRoute/);
for(const call of ['renderSingleMethodReading(view)','renderGraphs()','renderStructure()','renderPatterns()','renderContext()'])assert(!renderFn.includes(call),`legacy renderer still called by current render(): ${call}`);

const saved=json(`${base}/projections/ziwei-cx-r1-w9-w11-specialist-presentation-v1.json`);
const product={methodId:'ZWR',productType:'ZIWEI_FULL_PRODUCTION',state:'CUSTOMER_PUBLISHABLE',locale:saved.locale||'zh-Hans',publication:{customerPublishable:true},lineage:{test:true},visuals:[{type:'ZIWEI_SPECIALIST_PRESENTATION',payload:saved}]};
const plan=buildZiweiW12W13RenderPlan(product);
assert.equal(plan.status,'RENDERED');
assert.equal(plan.rendererId,ZIWEI_CX_R1_W12_W13_RENDERER_ID);
assert.equal(plan.responsiveReconstruction,true);
assert.equal(plan.legacySuppression,true);
assert.equal((plan.visualHtml.match(/data-ziwei-palace-index=/g)||[]).length,12);
assert.match(plan.readingHtml,/data-ziwei-responsive-reconstruction="W12"/);
assert.match(plan.readingHtml,/data-ziwei-current-render-owner="W12_W13"/);
assert.equal(typeof plan.afterMount,'function');
const current=renderZiweiProduct({product,mount:{host:null}});
assert.equal(current.status,'RENDERED');
assert.equal(current.rendererId,ZIWEI_CX_R1_W12_W13_RENDERER_ID);

const malformed={...product,visuals:[]};
const failClosed=renderZiweiProduct({product:malformed,mount:{host:null}});
assert.equal(failClosed.status,'RENDERED','current Zi Wei must be owned even when current specialist presentation is missing');
assert.equal(failClosed.rendererId,ZIWEI_CX_R1_W12_W13_RENDERER_ID);
assert.match(failClosed.readingHtml,/完整紫微专业读取暂时无法生成|complete specialist reading is temporarily unavailable/i);
assert.match(failClosed.readingHtml,/不会退回旧版通用紫微结构图|will not fall back/i);
assert.doesNotMatch(failClosed.readingHtml,/cx-smr-report|data-smr-version|data-cx-ziwei-workspace/);

const rendererText=read('assets/customer-ui/js/specialists/ziwei/product-renderer.js');
assert.match(rendererText,/buildZiweiW12W13RenderPlan/);
assert.match(rendererText,/buildZiweiW9W11RenderPlan/); // frozen predecessor identifier retained for the W9-W11 checker
assert.match(rendererText,/product\?\.state!==['"]CUSTOMER_PUBLISHABLE['"]/,'W8 predecessor compatibility must be explicitly excluded from current customer-publishable Zi Wei');
const workspaceText=read('assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js');
assert.match(workspaceText,/suppressLegacyZiweiWithinSpecialistHost/);
assert.match(workspaceText,/prefers-reduced-motion: reduce/);
const adapter=read('functions/personal-reality-product/adapters/ziwei-production-adapter.js');
assert.match(adapter,/RESPONSIVE_RECONSTRUCTION/);
assert.match(adapter,/LEGACY_ZWR_SUPPRESSION/);

console.log('✓ ZIWEI-CX-R1-W12–W13 responsive reconstruction + legacy ZWR suppression passed.');
console.log(`  W12: accepted viewport contract = ${w12.acceptedViewports.join(' / ')}; 4×4 palace chart remains at mobile without legacy 37–42rem forced width.`);
console.log('  W13: current ZWR Full Production has one PPR-R3 specialist owner; generic SMR / graph / structure / pattern and W8 predecessor renderers are not visible fallbacks.');
console.log('  Missing current specialist presentation now renders a Zi Wei-owned fail-closed message instead of letting the shared host substitute an older generic interpretation.');
console.log(`  Frozen PPR-R3 shared / API / SMR files checked byte-for-byte: ${Object.keys(w13.frozenSharedFiles).length}.`);
