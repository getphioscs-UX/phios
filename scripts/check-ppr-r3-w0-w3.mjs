import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildMethodProductEnvelope,section,PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT} from '../functions/personal-reality-product/adapters/product-envelope-core.js';
import {PPR_R3_SPECIALIST_RENDERER_REGISTRY,PPR_R3_SPECIALIST_RENDERER_ROOT,resolveSpecialistRendererDescriptor,isApprovedSpecialistModulePath} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
import {assertPprC1CurrentSuccessor} from './lib/ppr-c1-current-successor.mjs';
import {assertPprR3GovernedPath,assertPprR3RetiredPath,assertPprR4AstInputSuccessorIntegrity} from './ppr-r3-governed-successor-support.mjs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')),t=p=>fs.readFileSync(p,'utf8'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const commit='9b0eaeff8f88a1a78f5bc9395a88f28c4ceecb9c';
const base='content/professional/personal-reality/r3';
const w0=j(`${base}/audit/ppr-r3-w0-authority-reconciliation-v1.json`);assert.equal(w0.baselineCommit,commit);assert.equal(w0.status,'RECONCILED');assert(w0.cxR12R4bOwns.includes('Personal Reading Report IR'));assert(w0.cxR12R4bOwns.includes('Report cutover'));assert(w0.pprR3Owns.includes('specialist renderer port'));assert(!w0.pprR3Owns.includes('Personal Reading Report IR'));
const {r4}=assertPprC1CurrentSuccessor();
assertPprR4AstInputSuccessorIntegrity();
for(const [p,d] of Object.entries(w0.protectedConvergenceFiles)){
 if(!fs.existsSync(p)){assertPprR3RetiredPath(p,'PPR-R3 W0 protected convergence');continue;}
 assertPprR3GovernedPath(p,d,'PPR-R3 W0 protected convergence');
}
for(const [p,d] of Object.entries(w0.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`PPR-R3 W0 SMR drift: ${p}`);
const port=j(`${base}/contracts/ppr-r3-w1-specialist-renderer-port-contract-v1.json`);assert.equal(port.baselineCommit,commit);assert.equal(port.callerContract,'renderProductRoute(route,node)');assert.equal(port.callerContractStable,true);assert.equal(port.boundaries.createsMeaning,false);assert.equal(port.boundaries.arbitraryRemoteModuleAllowed,false);
const registry=j(`${base}/registries/ppr-r3-w2-specialist-renderer-registry-v1.json`);assert.equal(registry.approvedModuleRoot,PPR_R3_SPECIALIST_RENDERER_ROOT);assert.equal(registry.entries.length,5);assert.equal(registry.remoteModulesAllowed,false);assert.equal(registry.envelopeSuppliedExecutablePathAllowed,false);
for(const entry of registry.entries){const live=PPR_R3_SPECIALIST_RENDERER_REGISTRY[entry.rendererId];assert.deepEqual(live,entry);assert(isApprovedSpecialistModulePath(entry.module));const rel=entry.module.replace(/^\//,'');assert(fs.existsSync(rel),`missing renderer module ${rel}`);assert.match(t(rel),new RegExp(`export function ${entry.export}\\b`));}
assert.equal(isApprovedSpecialistModulePath('https://example.com/a.js'),false);assert.equal(isApprovedSpecialistModulePath('/assets/customer-ui/js/specialists/../evil.js'),false);assert.equal(isApprovedSpecialistModulePath('/assets/customer-ui/js/specialists/num/product-renderer.js'),true);
const product=buildMethodProductEnvelope({methodId:'NUM',productType:'NUMEROLOGY_PROFESSIONAL_READING',state:'CUSTOMER_PUBLISHABLE',publication:{customerPublishable:true},hero:{title:'NUM'},navigation:['READING'],sections:[section({sectionId:'READING',title:'Reading'})],specialistRenderer:{rendererId:'PPR_R3_NUM_PRODUCT_V1',surfaceContract:PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT,capabilities:['TEST']}});assert.equal(resolveSpecialistRendererDescriptor(product)?.ownerMethod,'NUM');assert.equal(Object.hasOwn(product.specialistRenderer,'module'),false);assert.equal(Object.hasOwn(product.specialistRenderer,'export'),false);
assert.throws(()=>buildMethodProductEnvelope({methodId:'NUM',productType:'NUMEROLOGY_PROFESSIONAL_READING',state:'CUSTOMER_PUBLISHABLE',publication:{customerPublishable:true},hero:{title:'NUM'},navigation:['READING'],sections:[section({sectionId:'READING',title:'Reading'})],specialistRenderer:{rendererId:'PPR_R3_NUM_PRODUCT_V1',surfaceContract:PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT,module:'/evil.js'}}),/PPR_R3_EXECUTABLE_RENDERER_DESCRIPTOR_FORBIDDEN/);
const mount=j(`${base}/contracts/ppr-r3-w3-specialist-mount-contract-v1.json`);assert.deepEqual(mount.contextFields,['mount','product','locale','surfaceContext','disclosureContext','navigationContext']);for(const x of ['meaning creation','calculation','projection','cross-method composition','route mutation'])assert(mount.forbidden.includes(x));
const host=t('assets/customer-ui/js/personal-products/specialist-renderer-host.js');assert.match(host,/resolveSpecialistRendererDescriptor/);assert.match(host,/import\(descriptor\.module\)/);assert.match(host,/GENERIC_FALLBACK/);assert.match(host,/FAIL_CLOSED_UPSTREAM/);assert.match(host,/canonicalRoute:'\/perspectives\/personal\/'/);
console.log('✓ PPR-R3 W0–W3 passed: authority reconciled, executable renderer paths are registry-owned, and the stable renderProductRoute caller now has a governed specialist renderer port + mount contract.');
