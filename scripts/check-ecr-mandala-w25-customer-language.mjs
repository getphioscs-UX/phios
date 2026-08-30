import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFixtureProjection} from './lib/ecr-mandala-acceptance-fixture.mjs';
import {esc} from '../assets/customer-ui/js/surfaces/runtime-ui.js';
import {renderPhiMandalaVisual} from '../assets/customer-ui/js/specialists/ecr/mandala-renderer.js';
import {customerLayerExplanation,customerLayerLabel,selectedCatalog} from '../assets/customer-ui/js/specialists/ecr/customer-language.js';

const policy=JSON.parse(fs.readFileSync('content/embodied-configuration/acceptance/ecr-mandala-w25-customer-language-acceptance-v1.json','utf8'));
const projection=buildFixtureProjection();
const visual={title:'你的 PHI 构型',payload:projection};
const html=renderPhiMandalaVisual(visual);
const selected=selectedCatalog(projection);
const sequence=[
 ['CC12',selected.context,'CC08'],['G16',selected.grammar,'G11'],['Q16',selected.question,'Q11'],['R9',selected.primaryCapability,'R7'],['D12',selected.topDriver,'D8'],['H64',selected.configuration,'ECR-H41'],['A8',selected.activation,'A1']
];
const summaryIndex=html.indexOf('data-ecr-mandala-summary');
const svgIndex=html.indexOf('data-ecr-phi-mandala');
assert(summaryIndex>=0&&svgIndex>summaryIndex,'W25 human-readable selected summary must precede Mandala SVG codes');
for(const [layer,item,code] of sequence){
 const label=customerLayerLabel(projection,layer,item,{role:layer==='R9'?'PRIMARY':null});
 const explanation=customerLayerExplanation(projection,layer,item,{role:layer==='R9'?'PRIMARY':null});
 assert(label.primary&&explanation,`W25 missing human label/explanation for ${code}`);
 const labelAt=html.indexOf(label.primary),codeAt=html.indexOf(code);
 assert(labelAt>=0&&codeAt>labelAt,`W25 ${code} must not precede human label`);
 assert(html.indexOf(esc(explanation))>=0,`W25 ${code} plain-language explanation missing`);
}
for(const phrase of policy.forbiddenDefaultRawPhrases)assert.equal(html.includes(phrase),false,`W25 raw internal phrase leaked: ${phrase}`);
const report=fs.readFileSync('assets/customer-ui/js/specialists/ecr/reading-report-renderer.js','utf8');
assert.doesNotMatch(report,/已获准的 ECR 解释|ACCEPTED ECR READING/);
assert.match(report,/PHI OS 解读/);
assert.match(report,/基于你上方的构型坐标/);
const mandala=fs.readFileSync('assets/customer-ui/js/specialists/ecr/mandala-renderer.js','utf8');
assert.doesNotMatch(mandala,/\$\{selected\.contextId\|\|''\} · \$\{selected\.grammarId/);
console.log('✓ ECR PHI Mandala W25 customer-language acceptance passed.');
console.log('  Human label + plain-language explanation precede current technical codes; governance/internal rule names stay out of default customer copy.');
