import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';
const ir=await buildEcrHumanRuntime({canonicalInput:JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput});
assert.throws(()=>adaptEcrPersonalRealityProduct({humanRuntime:ir}),/HUMAN_REVIEW/);
const product=adaptEcrPersonalRealityProduct({humanRuntime:ir,runtimeReviewMode:true});assert.equal(product.methodId,'ECR');assert.equal(product.publication.customerPublishable,false);assert.equal(product.sourceProduct.fullReport.depth,'FREE');assert.equal(product.sourceProduct.phiCardSpread,null);assert.equal(renderEcrProduct({product}).status,'RENDERED');assert(!JSON.stringify(product.sourceProduct).includes('internalStages'));
const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');assert(api.includes('canonicalBirthInput:input'));assert(!api.includes('ecrRuntimeReview:body'));
console.log('PASS V4.1 W15: existing ECR product route and renderer consume successor only behind server admission.');
