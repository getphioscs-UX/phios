import {assertPprR3GovernedPath,assertPprR3AstInputSuccessorIntegrity} from './ppr-r3-governed-successor-support.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')),t=p=>fs.readFileSync(p,'utf8'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const base='content/professional/personal-reality/r3';
const w8=j(`${base}/acceptance/ppr-r3-w8-canonical-route-integration-v1.json`);assert.equal(w8.status,'ENGINEERING_ACCEPTED');assert.equal(w8.directBuilderExecutionCountsAsCustomerRoutePass,false);assert.deepEqual(w8.canonicalPath,['POST /api/customer-personal-reality','PPR product router','Accepted specialist product envelope','PPR-R3 specialist host port','approved method renderer','DOM']);
const api=t('functions/api/customer-personal-reality.js');assert.match(api,/buildPersonalRealityProductRoute/);assert.match(api,/productRoute/);const client=t('assets/customer-ui/js/surfaces/personal-reality.js');assert.match(client,/renderProductRoute\(view\.productRoute/);const shared=t('assets/customer-ui/js/personal-products/personal-product-renderers.js');assert.match(shared,/mountApprovedSpecialistRenderer/);
// Real current BZR product assembly path: method-native product -> PPR adapter -> route -> specialist renderer reference.
const natal=j('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');const bzr=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans'});const bzrRoute=await buildPersonalRealityProductRoute({selectedKeys:['bazi'],results:[{ok:true,key:'bazi',spec:{methodCode:'BAZI'}}],methodNativeReading:{BZR:bzr},locale:'zh-Hans'});assert.equal(bzrRoute.mode,'SINGLE_METHOD');assert.equal(bzrRoute.primaryProduct?.methodId,'BZR');assert.equal(bzrRoute.primaryProduct?.sourceProduct?.schemaVersion,'PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1.0.0');assert.equal(resolveSpecialistRendererDescriptor(bzrRoute.primaryProduct)?.rendererId,'PPR_R3_BAZI_PRODUCT_V1');
// Current NUM chart-first customer envelope can now travel inside the product route without exposing canonicalProjection.
const numReading={schemaVersion:'PHI-OS-NUM-INTEGRATED-READING-IR-v1.0.0',customerPublishable:true,publicationState:'CUSTOMER_PUBLISHABLE',sourceProjectionId:'NUM-P',sourceMeaningBundleCode:'NUM-M',sections:{snapshot:[{role:'LIFE_PATH',label:'Life Path',value:8}],standoutThemes:[],relationships:[],integratedNarrative:['Integrated'],timing:null,realityReflection:[],expansion:null,depth:null},boundaries:{}};
const numEnvelope={schemaVersion:'PHI-OS-NUM-CX-CUSTOMER-READING-ENVELOPE-v1.0.0',methodId:'NUM',locale:'zh-Hans',canonicalProjection:{private:true},chartModel:{overviewTiles:[],priorityNarrative:{items:[]},coreNumberMap:{nodes:[],relations:[]}},integratedReading:{customerPublishable:true},calculationSummary:[],sourceLineage:{},inputCoverage:{},boundaries:{},readingDigest:'NUM-TEST'};const numRoute=await buildPersonalRealityProductRoute({selectedKeys:['numeric'],results:[{ok:true,key:'numeric',spec:{methodCode:'NUMEROLOGY'},numerologyIntegratedReading:numReading,numerologyEnvelope:numEnvelope}],locale:'zh-Hans'});assert.equal(numRoute.primaryProduct?.methodId,'NUM');assert.equal(numRoute.primaryProduct?.sourceProduct?.schemaVersion,'PHI-OS-NUM-CX-CUSTOMER-READING-ENVELOPE-v1.0.0');assert.equal(Object.hasOwn(numRoute.primaryProduct.sourceProduct,'canonicalProjection'),false);assert.equal(resolveSpecialistRendererDescriptor(numRoute.primaryProduct)?.rendererId,'PPR_R3_NUM_PRODUCT_V1');
const w9=j(`${base}/acceptance/ppr-r3-w9-ownership-regression-v1.json`);for(const v of Object.values(w9.assertions))assert.equal(v,false);const host=t('assets/customer-ui/js/personal-products/specialist-renderer-host.js');assert.doesNotMatch(host,/tenGod|palaceCode|Life Path|planet|aspect|ECR_SIX_CARD_SPREAD/i);assert.doesNotMatch(host,/fetch\(|customer-personal-reality/);assert.match(host,/hostOwnsMeaning:false/);assert.match(host,/hostRunsCalculation:false/);assert.match(host,/hostRunsProjection:false/);
const freeze=j(`${base}/authority/ppr-r3-w10-successor-freeze-v1.json`);assert.equal(freeze.status,'FROZEN_PPR_R3_SPECIALIST_HOST');const ecrMandalaSuccessor=j('content/embodied-configuration/ecr-customer-mandala-authority-audit-v1.json');
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
assertPprR3AstInputSuccessorIntegrity();
for(const [p,d] of Object.entries(freeze.protectedConvergenceFiles))assertPprR3GovernedPath(p,d,'PPR-R3 W10 protected convergence');
for(const [p,d] of Object.entries(freeze.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`W10 SMR drift ${p}`);
// W10 freezes the shared PPR-R3 host. Its own successor rule explicitly permits
// method-owned specialist adapters/renderers to evolve behind the approved port.
// Package/checker files are governance wiring rather than frozen runtime payload.
const methodOwnedOrGovernanceSuccessor=p=>
  p.startsWith('functions/personal-reality-product/adapters/')||
  p.startsWith('assets/customer-ui/js/specialists/')||
  p==='assets/customer-ui/js/surfaces/astrology-workspace.js'||
  p==='package.json'||p.startsWith('scripts/');
for(const [p,d] of Object.entries(freeze.successorFiles)){
  assert(fs.existsSync(p),`W10 successor file missing ${p}`);
  if(methodOwnedOrGovernanceSuccessor(p))continue;
  assertPprR3GovernedPath(p,d,'PPR-R3 W10 frozen shared-host');
}
assert.equal(freeze.successorRule,'Future specialist work must use the governed renderer registry and method-owned modules. Shared host changes require a later PPR successor; CX-R12R4B report authorities remain separate.');assert.equal(freeze.summary.protectedConvergenceFilesModified,0);assert.equal(freeze.summary.sharedSingleMethodReadingFilesModified,0);assert.equal(freeze.summary.specialistRendererCount,5);
const manifest=j(`${base}/manifest/ppr-r3-w0-w10-manifest-v1.json`);assert.equal(manifest.status,'W0_W10_ENGINEERING_COMPLETE');assert.equal(manifest.works.length,11);assert(manifest.works.every(x=>x.status==='ENGINEERING_COMPLETE'));
console.log('✓ PPR-R3 W8–W10 passed: canonical API → product route → governed renderer reference is live for BZR/NUM, ownership regressions are absent, and the PPR-R3 specialist host successor is frozen.');
