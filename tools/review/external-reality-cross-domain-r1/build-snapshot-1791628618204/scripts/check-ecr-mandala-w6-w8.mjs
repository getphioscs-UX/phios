import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.document={documentElement:{lang:'zh-Hans'}};

const {resolveEcrCoordinateFromSolarLongitude}=await import('../functions/embodied-configuration/ecr-calculation-runtime.js');
const {buildEcrCustomerMandalaProjection}=await import('../functions/embodied-configuration/ecr-customer-mandala-projection.js');
const {adaptEcrPersonalRealityProduct}=await import('../functions/personal-reality-product/adapters/ecr-production-adapter.js');
const {renderCoordinateStoryVisual}=await import('../assets/customer-ui/js/specialists/ecr/coordinate-story-renderer.js');
const {renderEcrProduct}=await import('../assets/customer-ui/js/specialists/ecr/product-renderer.js');

const coordinateStorySource=fs.readFileSync('assets/customer-ui/js/specialists/ecr/coordinate-story-renderer.js','utf8');
const productRendererSource=fs.readFileSync('assets/customer-ui/js/specialists/ecr/product-renderer.js','utf8');

assert.match(productRendererSource,/renderCoordinateStoryVisual/);
assert.match(productRendererSource,/renderCoordinateStoryVisual\(mandala\)/);
for(const forbidden of ['resolveEcrCoordinateFromSolarLongitude','calculateEcrSolarAnchor','ECR_CALCULATION_SPEC_RUNTIME']){
  assert.equal(coordinateStorySource.includes(forbidden),false,`W6-W8 renderer must not recalculate ECR: ${forbidden}`);
}
assert.match(coordinateStorySource,/data-ecr-selected-coordinate-spine/);
assert.match(coordinateStorySource,/data-ecr-grammar-question-diagram/);
const capabilitySource=fs.readFileSync('assets/customer-ui/js/specialists/ecr/capability-network-renderer.js','utf8');assert.match(capabilitySource,/data-ecr-capability-network/);
assert.match(coordinateStorySource,/View all 16 grammar-question positions|查看全部 16 个运行位置/);
assert.match(capabilitySource,/Explore the full question-capability map|查看完整问题—能力图/);
assert.match(coordinateStorySource,/Baseline driver stack|出生基线驱动/);

const item=(code,value,meta={})=>({code,value,rawValue:null,meta});
const resolved=resolveEcrCoordinateFromSolarLongitude(225.3515625);
const readingIR={schemaVersion:'PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0',sourceProjectionId:'CMP-ECR-W6W8000000000000001',sourceMeaningBundleCode:'ECR-MEANING-W6W8',locale:'zh-Hans',sections:{coordinate:{anchorLongitude:225.3515625,context:[item('CC08','SCORPIO',{label:'Scorpio',labelZhHans:'天蝎'})],grammar:[item('G11','G11',{label:'Identity',labelZhHans:'身份'})],question:[item('Q11','Q11',{question:'What is worth carrying together?',questionZhHans:'什么值得共同承载？'})]},response:{capabilities:[item('R7','PRIMARY',{priority:'PRIMARY'}),item('R5','SUPPORTING',{priority:'SUPPORTING'})],driverPriority:resolved.driverPriority.drivers.map(x=>item(x.driverId,x.baselineAffinity,{rank:x.rank,angularDistanceDegrees:x.angularDistanceDegrees,classification:resolved.driverPriority.classification}))},change:{motion:[item('M6','M6')],configuration:[item('ECR-H41','ECR-H41')],activation:[item('A1','A1')]}}};
const projection=buildEcrCustomerMandalaProjection(readingIR);
const storyHtml=renderCoordinateStoryVisual({payload:projection});
assert.match(storyHtml,/Selected Coordinate Spine|构型坐标主线/i);
assert.match(storyHtml,/为什么这些坐标会一起出现/);
assert.match(storyHtml,/CC08/);
assert.match(storyHtml,/G11/);
assert.match(storyHtml,/Q11/);
assert.match(storyHtml,/R7/);
assert.match(storyHtml,/R5/);
assert.match(storyHtml,/D8/);
assert.match(storyHtml,/M6/);
assert.match(storyHtml,/ECR-H41/);
assert.match(storyHtml,/A1/);
assert.match(storyHtml,/查看全部 16 个运行位置/);
assert.match(storyHtml,/查看完整问题—能力图/);
const pairCount=(storyHtml.match(/data-grammar-id=/g)||[]).length;
const capabilityCount=(storyHtml.match(/class="cx-ecr-capability-card/g)||[]).length;
assert.equal(pairCount,17,'W7 should show current pair preview + 16-pair full diagram');
assert.equal(capabilityCount,16,'W8 should expose the full Q16 × R9 matrix as 16 question rows');

const product=adaptEcrPersonalRealityProduct({readingIR,mandalaProjection:projection,locale:'zh-Hans'});
const rendered=renderEcrProduct({product});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.visualHtml,/data-ecr-selected-coordinate-spine/);
assert.match(rendered.visualHtml,/data-ecr-grammar-question-diagram/);
assert.match(rendered.visualHtml,/data-ecr-capability-network/);
assert.match(rendered.visualHtml,/PHI OS 原生体系 · 互动构型图/);

console.log('✓ ECR PHI Mandala W6–W8 passed.');
console.log('  W6 adds a selected-coordinate spine for CC/G/Q/R/D/M/H/A continuity.');
console.log('  W7 adds the governed G1–G16 × Q1–Q16 living relationship diagram with the current pair highlighted.');
console.log('  W8 adds a readable Q16 × R9 capability network while preserving the no-recalculation boundary.');
