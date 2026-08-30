import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildMethodProductEnvelope,section,PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT} from '../functions/personal-reality-product/adapters/product-envelope-core.js';
import {PPR_R3_SPECIALIST_RENDERER_REGISTRY,PPR_R3_SPECIALIST_RENDERER_ROOT,resolveSpecialistRendererDescriptor,isApprovedSpecialistModulePath} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
import {assertPprC1CurrentSuccessor} from './lib/ppr-c1-current-successor.mjs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')),t=p=>fs.readFileSync(p,'utf8'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const commit='9b0eaeff8f88a1a78f5bc9395a88f28c4ceecb9c';
const base='content/professional/personal-reality/r3';
const w0=j(`${base}/audit/ppr-r3-w0-authority-reconciliation-v1.json`);assert.equal(w0.baselineCommit,commit);assert.equal(w0.status,'RECONCILED');assert(w0.cxR12R4bOwns.includes('Personal Reading Report IR'));assert(w0.cxR12R4bOwns.includes('Report cutover'));assert(w0.pprR3Owns.includes('specialist renderer port'));assert(!w0.pprR3Owns.includes('Personal Reading Report IR'));
const ecrMandalaSuccessor=j('content/embodied-configuration/ecr-customer-mandala-authority-audit-v1.json');
const {r4}=assertPprC1CurrentSuccessor();
function assertRetiredBaselineFile(p,label){
 const retired=ecrMandalaSuccessor?.baselineRetiredFiles?.[p];
 assert(retired,`${label} missing without baseline-retirement reconciliation: ${p}`);
 assert.equal(retired.baselineCommit,ecrMandalaSuccessor.baselineCommit,`${label} retirement baseline mismatch: ${p}`);
 assert.equal(retired.state,'ABSENT_ON_BASELINE',`${label} retirement state mismatch: ${p}`);
 assert.equal(retired.baselineFactOnly,true,`${label} retirement must remain a baseline fact: ${p}`);
 assert.equal(retired.createsRetirementAuthority,false,`${label} retirement record must not create new authority: ${p}`);
 for(const witness of retired.replacementWitnesses||[])assert(fs.existsSync(witness),`${label} retirement witness missing: ${witness}`);
 assert(fs.existsSync(retired.canonicalSurfaceWitness),`${label} canonical surface witness missing: ${retired.canonicalSurfaceWitness}`);
 const surface=t(retired.canonicalSurfaceWitness);assert.doesNotMatch(surface,/single-method-reading\.js/,`${label} canonical surface still references retired renderer: ${p}`);assert.match(surface,/renderProductRoute/,`${label} canonical surface does not witness the PPR product route: ${p}`);
}
for(const [p,d] of Object.entries(w0.protectedConvergenceFiles)){
 if(!fs.existsSync(p)){assertRetiredBaselineFile(p,'PPR-R3 W0 protected convergence');continue;}
 const current=sha(p);if(current===d)continue;
 const r4Proof=r4?.sharedFileSuccessorProof?.[p];
 const successor=ecrMandalaSuccessor?.protectedSuccessors?.[p];
 if(r4Proof){
  assert(successor,`PPR-R3 W0 missing predecessor successor chain before PPR-R4: ${p}`);
  assert.equal(successor.predecessorSha256,d,`PPR-R3 W0 predecessor-chain mismatch: ${p}`);
  assert.equal(successor.successorSha256,r4Proof.predecessorSha256,`PPR-R3 W0 PPR-R4 predecessor is not the admitted current-main predecessor: ${p}`);
  assert.equal(r4Proof.successorSha256,current,`PPR-R3 W0 PPR-R4 successor digest drift: ${p}`);
  assert.equal(r4Proof.changeClass,'PPR_R4_METHOD_INPUT_EXTENSION_ONLY',`PPR-R3 W0 PPR-R4 successor class not admitted: ${p}`);
  continue;
 }
 assert(successor,`PPR-R3 W0 protected convergence drift without governed successor: ${p}`);
 assert.equal(successor.predecessorSha256,d,`PPR-R3 W0 successor predecessor mismatch: ${p}`);
 assert.equal(successor.successorSha256,current,`PPR-R3 W0 successor digest drift: ${p}`);
 const admittedClass=p==='perspectives/personal/index.html'?'ECR_BRAND_ASSET_CORRECTION_ONLY':p==='assets/customer-ui/js/surfaces/personal-reality.js'?'BASELINE_RETIRED_RENDERER_DANGLING_IMPORT_REMOVAL_ONLY':null;assert.equal(successor.changeClass,admittedClass,`PPR-R3 W0 unapproved successor class: ${p}`);
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
