import fs from 'node:fs';import assert from 'node:assert/strict';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';
import {projectEcrHumanRuntimeCards} from '../functions/ecr-phi-card/ecr-human-runtime-cards-v4-1.js';

const input=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput;
const ir=await buildEcrHumanRuntime({canonicalInput:input});
assert.equal(ir.initialization.activations.filter(a=>a.bodyCode==='CHIRON').length,0);
const earth=ir.initialization.activations.filter(a=>a.bodyCode==='EARTH');
assert.equal(earth.length,2);assert(earth.every(a=>a.status==='CALCULATED'&&a.p64));
assert.equal(ir.driverField.drivers[10].driverId,'D11');assert.deepEqual(ir.driverField.drivers[10].bodyBinding,['EARTH']);assert.equal(ir.driverField.drivers[10].status,'CALCULATED');
assert(ir.semanticDepth.length>0);assert(ir.semanticDepth.every(x=>x.customerSurfaceAllowed===true&&x.semanticTags.length>0&&x.missingAdmissions.length===0));

const cards=projectEcrHumanRuntimeCards(ir);
assert.equal(cards.cards.length,6);assert.equal(cards.randomDraw,false);
assert(cards.cards.every(c=>['ADMITTED_SELECTION','UNKNOWN'].includes(c.status)));
for(const c of cards.cards.filter(c=>c.status==='ADMITTED_SELECTION'))assert(c.asset?.objectKey);

const entitlement={schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}};
for(const locale of ['en','zh-Hans']){
 const product=adaptEcrPersonalRealityProduct({humanRuntime:ir,runtimeReviewMode:true,locale,sharedEntitlement:entitlement});
 const rendered=renderEcrProduct({product});
 assert.equal(rendered.status,'RENDERED');
 const html=rendered.visualHtml+rendered.readingHtml;
 assert(html.includes('data-ecr-v41-cards'));
 assert.match(html,/EARTH/);
 assert.doesNotMatch(html,/CHIRON/i);
 assert.doesNotMatch(html,/compositional semantic resolver has no human-admitted rules|组合语义解析器在此字段还没有经过人工准入的规则/);
 assert(html.includes('UNBOUND'));
}
console.log('PASS R8 runtime alignment: Earth D11, admitted semantic tags, governed Phi Cards, accepted bilingual copy, Mandala/report render path aligned.');
