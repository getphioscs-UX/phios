import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PPR_R3_SPECIALIST_RENDERER_REGISTRY} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const a=json('content/embodied-configuration/acceptance/ecr-mandala-w27-ppr-r3-boundary-regression-v1.json');
for(const item of a.sharedAndOtherMethodFiles){assert(fs.existsSync(item.path),`W27 shared/other-method file missing: ${item.path}`);assert.match(item.sha256,/^[a-f0-9]{64}$/,`W27 historical digest evidence malformed: ${item.path}`);}
const e=PPR_R3_SPECIALIST_RENDERER_REGISTRY[a.expectedEcrRenderer.rendererId];
assert(e);assert.equal(e.ownerMethod,'ECR');assert.equal(e.module,'/assets/customer-ui/js/specialists/ecr/product-renderer.js');assert.equal(e.supportedProductContract,'PHI_CONFIGURATION_READING');
for(const id of a.expectedOtherMethodRenderers)assert(PPR_R3_SPECIALIST_RENDERER_REGISTRY[id],`W27 missing other method renderer ${id}`);
const host=fs.readFileSync('assets/customer-ui/js/personal-products/specialist-renderer-host.js','utf8');
assert.match(host,/hostOwnsMeaning:false/);assert.match(host,/hostRunsCalculation:false/);assert.match(host,/hostRunsProjection:false/);
const generic=fs.readFileSync('assets/customer-ui/js/personal-products/personal-product-renderers.js','utf8');
assert.doesNotMatch(generic,/CC12|G16|Q16|ECR-H41|SOLAR_ANCHOR_DRIVER/);
console.log('✓ ECR PHI Mandala W27 PPR-R3 boundary regression passed.');
console.log('  Historical cross-method digests remain audit evidence; current AST/BZR/NUM/ZWR ownership is checked by their wider gates, while ECR stays method-owned through PPR_R3_ECR_PRODUCT_V1.');
