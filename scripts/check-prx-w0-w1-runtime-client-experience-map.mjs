import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const BASELINE='6f2b4c6791c552c065ac699b12e08ebe4aa1e7fe';
const inv=read('content/runtime-maturity/registries/master-runtime-capability-inventory-v1.3.json');
const rm=read('content/runtime-maturity/matrices/master-runtime-maturity-matrix-v1.3.json');
const em=read('content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.5.json');
const state=read('content/product-activation/prx/state/prx-current-capability-state-model-v2.json');
const ex=read('content/product-activation/prx/registries/prx-client-experience-registry-v1.json');
const truth=read('content/product-activation/prx/audit/prx-w0-current-truth-successor-v2.json');
const map=read('content/product-activation/prx/matrices/prx-w1-runtime-client-experience-map-v1.json');

assert.equal(inv.capabilityCount,186);
assert.equal(inv.capabilities.length,186);
assert.equal(new Set(inv.capabilities.map(x=>x.runtimeCode)).size,42);
assert.equal(rm.records.length,186);
assert.equal(em.records.length,186);

for (const doc of [state,ex,truth,map]) assert.equal(doc.baselineCommit,BASELINE);
assert.deepEqual(state.states,['REGISTERED','IMPLEMENTED','VALIDATED','PROJECTED','CLIENT_CONSUMED','PRODUCTION_ACCEPTED','DEPLOYED','LIVE_VERIFIED','PILOT_VERIFIED','BLOCKED','DEFERRED']);
assert.deepEqual(state.truthPlanes,['runtimeTruth','productTruth','liveTruth']);
assert.equal(state.rules.repositoryAcceptanceDoesNotEqualLiveVerification,true);
assert.equal(state.rules.liveTruthCannotBeInferredFromRepositoryCheckers,true);

const allowedExp=new Set(ex.experiences.map(x=>x.code));
assert.equal(allowedExp.size,8);
assert.equal(map.capabilities.length,186);
assert.equal(map.runtimeFamilies.length,42);
assert.equal(new Set(map.capabilities.map(x=>x.capabilityCode)).size,186);
assert.deepEqual(new Set(map.capabilities.map(x=>x.capabilityCode)),new Set(inv.capabilities.map(x=>x.capabilityCode)));
for(const c of map.capabilities){
  assert.ok(allowedExp.has(c.productTruth.primaryClientExperience),`${c.capabilityCode} missing governed client experience`);
  assert.ok(state.states.includes(c.currentState),`${c.capabilityCode} has invalid current state`);
  assert.ok(c.productTruth.lensRole,`${c.capabilityCode} missing lensRole`);
  assert.equal(c.liveTruth.liveVerified,false,`${c.capabilityCode} must not infer live verification from repo evidence`);
  if(c.productTruth.primaryClientExperience==='NONE_BY_DESIGN') assert.deepEqual(c.productTruth.clientExperiences,[]);
}
const families=new Set(map.runtimeFamilies.map(x=>x.runtimeFamily));
for(const f of ['AST','BZR','HDR','NUM','CKA','FDR','FCR','FAR','RMO','RNE','ALR','PR']) assert.ok(families.has(f));
const lensByFamily=Object.fromEntries(map.runtimeFamilies.map(x=>[x.runtimeFamily,x.lensRole]));
assert.equal(lensByFamily.AST,'FUNCTIONAL_DYNAMICS');
assert.equal(lensByFamily.BZR,'TEMPORAL_STRUCTURE');
assert.equal(lensByFamily.HDR,'OPERATING_STRATEGY');
assert.equal(lensByFamily.NUM,'CYCLE_RHYTHM');

assert.equal(map.postInventoryFamilies.length,4);
const post=Object.fromEntries(map.postInventoryFamilies.map(x=>[x.runtimeFamily,x]));
assert.equal(post.ZWR.lensRole,'REALITY_DOMAIN_TOPOLOGY');
assert.equal(post.ZWR.currentState,'PRODUCTION_ACCEPTED');
assert.equal(post.ZWR.liveVerified,false);
assert.equal(post.ICH.currentState,'VALIDATED');
assert.equal(post.TAR.currentState,'VALIDATED');
assert.equal(post.HRX.currentState,'VALIDATED');
for(const x of Object.values(post)) assert.equal(x.inventoryRelation,'POST_MRM_V1_3_NOT_COUNTED_IN_42_186');

const zwr=read('content/zi-wei-runtime/acceptance/zi-wei-production-acceptance-v1.json');
assert.equal(zwr.productionDispatchAllowed,true);
assert.equal(zwr.liveDeploymentVerified,false);
const hrx=read('content/health/health-reality-runtime/acceptance/hrx-w0-w14-acceptance-v1.json');
assert.equal(hrx.activation.productionAccepted,false);
assert.equal(hrx.activation.liveDeploymentVerified,false);
const ich=read('content/professional/core-method-runtime/iching-machine-acceptance-v1.json');
assert.equal(ich.productionActivationGranted,false);
const tar=read('content/interpretation/tarot/acceptance/tarot-interpretation-reality-acceptance-v1.json');
assert.equal(tar.production.publicRunAllowed,false);

assert.equal(truth.counts.runtimeFamilies,42);
assert.equal(truth.counts.capabilities,186);
assert.equal(truth.counts.postInventoryFamiliesTracked,4);
console.log('✓ PRX-W0/W1 Current Capability Truth + 42/186 Client Experience Map passed.');
console.log(`  ${map.counts.capabilities}/186 capabilities across ${map.counts.runtimeFamilies}/42 runtime families are mapped.`);
console.log('  AST/BZR/HDR/NUM lens roles are classified without freezing ML-W0 authority ahead of Stage 2.');
console.log('  ZWR/ICH/TAR/HRX are tracked as post-inventory families and are not silently inserted into the frozen 42/186 inventory.');
console.log('  Repository acceptance is explicitly not treated as live verification.');
