import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveEcrCoordinateFromSolarLongitude} from '../functions/embodied-configuration/ecr-calculation-runtime.js';
import {buildEcrCustomerMandalaProjection} from '../functions/embodied-configuration/ecr-customer-mandala-projection.js';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {PHI_MANDALA_VIEWBOX_SIZE,PHI_MANDALA_LAYER_GEOMETRY,sectorAngles,ringSegmentGeometry,radialBarGeometry,geometrySummary} from '../assets/customer-ui/js/specialists/ecr/mandala-geometry.js';
import {renderPhiMandalaVisual} from '../assets/customer-ui/js/specialists/ecr/mandala-renderer.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';

const read=p=>fs.readFileSync(p,'utf8');
const occurrences=(s,pattern)=>(s.match(pattern)||[]).length;
const item=(code,value,meta={})=>({code,value,rawValue:null,meta});

const geometrySource=read('assets/customer-ui/js/specialists/ecr/mandala-geometry.js');
for(const forbidden of ['anchorLongitude','resolveEcrCoordinateFromSolarLongitude','questionCapabilityMatrix','contextId===','grammarId===','configurationId==='])assert.equal(geometrySource.includes(forbidden),false,`W4 geometry must stay semantic-free: ${forbidden}`);
const summary=geometrySummary();assert.equal(summary.viewBoxSize,800);assert.equal(summary.semanticSelectionPerformed,false);assert.equal(summary.longitudeToSemanticMappingPerformed,false);assert.deepEqual(Object.keys(PHI_MANDALA_LAYER_GEOMETRY),['CC12','G16','Q16','R9','D12','M8','H64','A8','CORE']);
const cc8=sectorAngles(8,12);assert.equal(cc8.ordinal,8);assert.equal(cc8.count,12);assert.equal(cc8.step,30);const g11=sectorAngles(11,16);assert.equal(g11.step,22.5);const h41=ringSegmentGeometry(41,64,PHI_MANDALA_LAYER_GEOMETRY.H64);assert.equal(h41.ordinal,41);assert.equal(h41.count,64);assert.match(h41.path,/^M /);const bar=radialBarGeometry(8,12,.8,1);assert(bar.endRadius>PHI_MANDALA_LAYER_GEOMETRY.D12.innerRadius);assert(bar.endRadius<=PHI_MANDALA_LAYER_GEOMETRY.D12.outerRadius);assert.equal(PHI_MANDALA_VIEWBOX_SIZE,800);

const resolved=resolveEcrCoordinateFromSolarLongitude(225.3515625);
const readingIR={schemaVersion:'PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0',sourceProjectionId:'CMP-ECR-W4W5FIXTURE000000000001',sourceMeaningBundleCode:'ECR-MEANING-W4W5',locale:'zh-Hans',sections:{coordinate:{anchorLongitude:225.3515625,context:[item('CC08','SCORPIO')],grammar:[item('G11','G11')],question:[item('Q11','Q11')]},response:{capabilities:[item('R7','PRIMARY',{priority:'PRIMARY'}),item('R5','SUPPORTING',{priority:'SUPPORTING'})],driverPriority:resolved.driverPriority.drivers.map(x=>item(x.driverId,x.baselineAffinity,{rank:x.rank,angularDistanceDegrees:x.angularDistanceDegrees,classification:resolved.driverPriority.classification}))},change:{motion:[item('M6','M6')],configuration:[item('ECR-H41','ECR-H41')],activation:[item('A1','A1')]}}};
const projection=buildEcrCustomerMandalaProjection(readingIR),product=adaptEcrPersonalRealityProduct({readingIR,mandalaProjection:projection,locale:'zh-Hans'}),visual=product.visuals.find(x=>x.type==='ECR_PHI_MANDALA_V1');
assert(visual);const html=renderPhiMandalaVisual(visual);assert.match(html,/data-ecr-phi-mandala="true"/);assert.match(html,/role="img"/);assert.match(html,/aria-live="polite"/);assert.match(html,/data-ecr-mandala-detail/);assert.match(html,/tabindex="0" role="button"/);assert.match(html,/CC08/);assert.match(html,/G11/);assert.match(html,/Q11/);assert.match(html,/R7/);assert.match(html,/R5/);assert.match(html,/D8/);assert.match(html,/M6/);assert.match(html,/ECR-H41/);assert.match(html,/A1/);assert.match(html,/225\.352°/);
assert.equal(occurrences(html,/data-layer="CC12"/g),12);assert.equal(occurrences(html,/data-layer="G16"/g),16);assert.equal(occurrences(html,/data-layer="Q16"/g),16);assert.equal(occurrences(html,/data-layer="R9"/g),9);assert.equal(occurrences(html,/data-layer="D12"/g),12);assert.equal(occurrences(html,/data-layer="M8"/g),8);assert.equal(occurrences(html,/data-layer="H64"/g),64);assert.equal(occurrences(html,/data-layer="A8"/g),8);
assert.match(html,/不是对当前现实优先级的判断/);assert.match(html,/不导入星座人格意义/);assert.match(html,/不导入易经吉凶意义/);assert.match(html,/本图只计算视觉几何，不会重新计算你的 ECR 结果/);

const rendererSource=read('assets/customer-ui/js/specialists/ecr/mandala-renderer.js');for(const forbidden of ['ecr-calculation-runtime','resolveEcrCoordinateFromSolarLongitude','getEcrCanonicalOntology','questionCapabilityMatrix'])assert.equal(rendererSource.includes(forbidden),false,`W5 browser renderer must not recalculate/invent semantics: ${forbidden}`);assert.match(rendererSource,/installPhiMandalaInteractions/);assert.match(rendererSource,/pointerover/);assert.match(rendererSource,/focusin/);const specialistCss=read('assets/customer-ui/surfaces/ecr-specialist.css');assert.match(specialistCss,/prefers-reduced-motion/);
const productSource=read('assets/customer-ui/js/specialists/ecr/product-renderer.js');assert.match(productSource,/renderPhiMandalaVisual/);assert.match(productSource,/installPhiMandalaInteractions/);assert.match(productSource,/ECR_PHI_MANDALA_V1/);assert.match(productSource,/afterMount/);
globalThis.document={documentElement:{lang:'zh-Hans'}};
const rendered=renderEcrProduct({product});assert.equal(rendered.status,'RENDERED');assert.match(rendered.visualHtml,/data-ecr-phi-mandala/);assert.equal(typeof rendered.afterMount,'function');

console.log('✓ ECR PHI Mandala W4–W5 passed.');
console.log('  Geometry is ordinal/count/radius based and contains no longitude→semantic mapping.');
console.log('  Interactive SVG renders 12 CC + 16 G + 16 Q + 9 R + 12 D + 8 M + 64 H + 8 A with keyboard/focus parity.');
console.log('  Selected CC08/G11/Q11/R7+R5/D8/M6/ECR-H41/A1 are projection-owned; the browser renderer performs presentation only.');
