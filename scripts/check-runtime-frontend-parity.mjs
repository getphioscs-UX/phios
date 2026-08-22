import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const p=(rel)=>path.join(root,rel);
const exists=(rel)=>fs.existsSync(p(rel));
const json=(rel)=>JSON.parse(fs.readFileSync(p(rel),'utf8'));
const assertFile=(rel)=>assert.equal(exists(rel),true,`missing file: ${rel}`);

const base='content/governance/production-capability-matrix';
const registryPath=`${base}/registries/production-capability-registry-v1.json`;
const rulePath=`${base}/contracts/pcm-backend-frontend-rule-v1.json`;
const statusContractPath=`${base}/contracts/pcm-status-projection-contract-v1.json`;
const statusProjectionPath=`${base}/projections/production-capability-status-projection-v1.json`;
const classificationPath=`${base}/audits/pcm-current-method-classification-v1.json`;
const acceptancePath=`${base}/acceptance/pcm-w0-w5-acceptance-v1.json`;
for(const f of [registryPath,rulePath,statusContractPath,statusProjectionPath,classificationPath,acceptancePath]) assertFile(f);

const registry=json(registryPath);
const rule=json(rulePath);
const statusContract=json(statusContractPath);
const statusProjection=json(statusProjectionPath);
const classification=json(classificationPath);
const acceptance=json(acceptancePath);
const required=['capabilityId','methodRuntime','authority','implemented','validated','projected','frontendRoute','userExecutable','persistent','productionAccepted','blockedReason'];
const allowedStatuses=new Set(['Available','Limited','Preview','Blocked','Coming later']);

assert.equal(registry.status,'ACTIVE_CURRENT_USER_EXECUTABILITY_AUTHORITY');
assert.deepEqual(rule.productionReadyRequirements,['authority','runtime','projection','frontend','acceptance']);
assert.deepEqual(statusContract.allowedStatuses,['Available','Limited','Preview','Blocked','Coming later']);
assert.equal(acceptance.exitGate.answerAuthority,registryPath);
assert.equal(acceptance.exitGate.checker,'npm run check:runtime-frontend-parity');

const ids=new Set();
const byPlugin=new Map();
for(const c of registry.capabilities){
  for(const key of required) assert.ok(Object.hasOwn(c,key),`capability missing ${key}: ${c.capabilityId||'UNKNOWN'}`);
  assert.ok(c.capabilityId && !ids.has(c.capabilityId),`duplicate capabilityId: ${c.capabilityId}`); ids.add(c.capabilityId);
  assert.ok(c.methodRuntime?.methodCode && c.methodRuntime?.pluginCode && c.methodRuntime?.runtimeId && c.methodRuntime?.methodVersion,`invalid methodRuntime: ${c.capabilityId}`);
  assert.equal(typeof c.implemented,'boolean'); assert.equal(typeof c.validated,'boolean'); assert.equal(typeof c.projected,'boolean');
  assert.equal(typeof c.userExecutable,'boolean'); assert.equal(typeof c.persistent,'boolean'); assert.equal(typeof c.productionAccepted,'boolean');
  assert.ok(Array.isArray(c.blockedReason),`blockedReason must be array: ${c.capabilityId}`);
  assert.ok(allowedStatuses.has(c.statusProjection),`invalid statusProjection: ${c.capabilityId}`);
  byPlugin.set(c.methodRuntime.pluginCode,c);
  assertFile(c.authority.registration);
  for(const ref of c.evidence||[]) assertFile(ref);

  // PCM-W1: backend implementation alone never creates user Production readiness.
  if(c.userExecutable || c.productionAccepted){
    assert.equal(c.implemented,true,`executable capability lacks runtime: ${c.capabilityId}`);
    assert.equal(c.validated,true,`executable capability lacks validation: ${c.capabilityId}`);
    assert.equal(c.projected,true,`executable capability lacks projection: ${c.capabilityId}`);
    assert.equal(c.productionAccepted,true,`frontend executable capability lacks Production acceptance: ${c.capabilityId}`);
    assert.ok(c.frontendRoute,`frontend executable capability lacks route: ${c.capabilityId}`);
    assert.ok(c.authority.productionDispatch,`frontend executable capability lacks dispatch authority: ${c.capabilityId}`);
    assert.ok(c.authority.clientDelivery,`frontend executable capability lacks client-delivery acceptance: ${c.capabilityId}`);
  }
  if(c.statusProjection==='Limited') assert.ok(Array.isArray(c.limitations)&&c.limitations.length>0,`Limited capability must expose limitations: ${c.capabilityId}`);
  if(c.statusProjection==='Blocked') assert.ok(c.blockedReason.length>0,`Blocked capability must expose reason: ${c.capabilityId}`);
  if(c.statusProjection==='Coming later'){
    assert.equal(c.implemented,false,`Coming later cannot be implemented Production capability: ${c.capabilityId}`);
    assert.equal(c.frontendRoute,null,`Coming later cannot expose executable route: ${c.capabilityId}`);
    assert.equal(c.userExecutable,false);
    assert.equal(c.productionAccepted,false);
  }
}

// PCM-W4 exact current classifications.
const expected={HDR:['BLOCKED','Blocked',false],AST:['LIMITED_SCOPED','Limited',true],BZR:['LIMITED_SCOPED','Limited',true],NUM:['LIMITED_SCOPED','Limited',true],ICH:['REGISTERED_NOT_IMPLEMENTED','Coming later',false],TAR:['REGISTERED_NOT_IMPLEMENTED','Coming later',false]};
assert.deepEqual([...byPlugin.keys()].sort(),Object.keys(expected).sort(),'PCM method set drift');
for(const [plugin,[state,status,executable]] of Object.entries(expected)){
  const c=byPlugin.get(plugin); assert.equal(c.classification,state,`${plugin} classification drift`); assert.equal(c.statusProjection,status,`${plugin} status drift`); assert.equal(c.userExecutable,executable,`${plugin} executable drift`);
}
assert.deepEqual(classification.finalMethodState,{HDR:'BLOCKED',AST:'LIMITED_SCOPED',BZR:'LIMITED_SCOPED',NUM:'LIMITED_SCOPED',I_CHING:'REGISTERED_NOT_IMPLEMENTED',TAROT:'REGISTERED_NOT_IMPLEMENTED'});

// Current Method registration authority must exist for all PCM methods.
const methodRegistry=json('content/professional/method-production-activation/registries/method-registry-v2.json');
for(const c of registry.capabilities){
  const m=methodRegistry.methods.find(x=>x.methodCode===c.methodRuntime.methodCode && x.pluginCode===c.methodRuntime.pluginCode);
  assert.ok(m,`Method Registry v2 missing ${c.methodRuntime.pluginCode}`);
}

// Frontend executable Methods must have MPA authority + current physical client delivery + canonical projection consumer.
const mpa=json('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');
const mcd2=json('content/professional/method-client-delivery/registries/mcd-2-canonical-runtime-adapter-registry-v1.json');
const mcd7=json('content/professional/method-client-delivery/registries/mcd-7-personal-runtime-result-surface-registry-v1.json');
const mcd8=json('content/professional/method-client-delivery/acceptance/mcd-8-production-acceptance-v1.json');
for(const c of registry.capabilities.filter(x=>x.userExecutable)){
  const method=c.methodRuntime.methodCode;
  const authority=mpa.methods.find(x=>x.methodCode===method && x.methodVersion===c.methodRuntime.methodVersion);
  assert.ok(authority,`MPA successor missing ${method}`);
  assert.equal(authority.productionEligible,true,`${method} lacks canonical production eligibility`);
  assert.equal(authority.dispatchAllowed,true,`${method} lacks canonical dispatch authority`);
  assert.ok(authority.dispatchableCapabilities.includes('CALCULATION')&&authority.dispatchableCapabilities.includes('PROJECTION'),`${method} lacks dispatchable CALCULATION/PROJECTION`);
  const adapter=mcd2.entries.find(x=>x.methodCode===method && x.methodVersion===c.methodRuntime.methodVersion);
  assert.ok(adapter,`MCD-2 binding missing ${method}`); assert.equal(adapter.productionAdapterBindingActive,true,`${method} production adapter not bound`);
  const tab=mcd7.productionTabs.find(x=>x.methodCode===method && x.productionTab===true && x.methodResult===true);
  assert.ok(tab,`Production frontend consumer missing ${method}`);
  assert.equal(c.frontendRoute,mcd7.route,`${method} frontend route drift`);
  const publicProjection=tab.publicMethodCode;
  assert.ok(mcd8.acceptedFacts.guidedReadingCanConsume.includes(publicProjection),`${method} canonical projection not accepted by MCD-8`);
}

// HDR must remain visible only as controlled availability, never a Production result tab.
const hdr=byPlugin.get('HDR');
const hdrAuthority=mpa.methods.find(x=>x.pluginCode==='HDR');
assert.equal(hdrAuthority.productionEligible,false); assert.equal(hdrAuthority.dispatchAllowed,false);
assert.equal(mcd7.productionTabs.some(x=>x.methodCode==='HUMAN_DESIGN'),false,'HDR leaked into Production result tabs');
assert.equal(mcd7.controlledAvailability.state,'CURRENTLY_UNAVAILABLE');
assert.equal(hdr.frontendRoute,null);

// I Ching / Tarot are registered but unimplemented and absent from executable frontend tabs.
for(const plugin of ['ICH','TAR']){
  const c=byPlugin.get(plugin); const m=methodRegistry.methods.find(x=>x.pluginCode===plugin);
  assert.equal(m.state,'REGISTERED');
  assert.ok(m.blockingReasons.includes('METHOD_NOT_IMPLEMENTED'));
  assert.equal(mcd7.productionTabs.some(x=>x.methodCode===c.methodRuntime.methodCode),false,`${plugin} leaked into frontend`);
}

// Physical Production path for executable Methods.
for(const f of ['functions/api/method-execute.js','functions/method-client-delivery/execution-runtime-current.js','functions/method-client-delivery/canonical-projection-runtime-current.js','assets/js/pages/personal-runtime.js','assets/js/method-client-delivery/personal-runtime-surface-runtime.js','personal-runtime.html']) assertFile(f);
const api=fs.readFileSync(p('functions/api/method-execute.js'),'utf8');
const page=fs.readFileSync(p('assets/js/method-client-delivery/personal-runtime-surface-runtime.js'),'utf8');
assert.match(api,/canonical-projection-runtime-current\.js/,'API not bound to current canonical projection runtime');
assert.match(page,/\/api\/method-execute/,'frontend does not call canonical method endpoint');
assert.doesNotMatch(page,/core-method-runtime/,'frontend directly imports Core Method runtime');

// PCM-W2 runtime-wide parity: any historical/current-system Production-accepted runtime must still have a declared consumer.
const runtimeInventory=json('content/governance/current-system-baseline/current-runtime-inventory.json');
const consumerMap=json('content/governance/current-system-baseline/runtime-consumer-map-v1.json');
for(const r of runtimeInventory.runtimes.filter(x=>x.productionAccepted===true)){
  const consumer=consumerMap.entries.find(x=>x.runtimeId===r.runtimeId);
  assert.ok(consumer,`productionAccepted runtime lacks production consumer: ${r.runtimeId}`);
  assert.equal(consumer.productionAccepted,true,`consumer acceptance mismatch: ${r.runtimeId}`);
  const hasConsumer=(consumer.routes||[]).length>0 || (consumer.components||[]).length>0 || ['INTERNAL_CHAIN','BOUNDARY_CONSUMER','NO_DIRECT_SURFACE_BY_DESIGN'].includes(consumer.consumerMode);
  assert.equal(hasConsumer,true,`productionAccepted runtime has no usable consumer trace: ${r.runtimeId}`);
}

// Status projection must be a 1:1 user-safe projection of registry state; no universal Available illusion.
assert.equal(statusProjection.source,registryPath);
assert.equal(statusProjection.items.length,registry.capabilities.length);
for(const item of statusProjection.items){
  const c=registry.capabilities.find(x=>x.capabilityId===item.capabilityId); assert.ok(c,`status projection orphan: ${item.capabilityId}`); assert.equal(item.status,c.statusProjection,`status projection mismatch: ${item.capabilityId}`); assert.equal(item.route,c.frontendRoute,`status route mismatch: ${item.capabilityId}`);
}
assert.ok(statusProjection.items.some(x=>x.status!=='Available'),'capability status projection falsely presents everything as Available');

console.log('✓ PCM-W0–W2 Production Capability Registry + runtime/frontend parity passed.');
console.log('  Production-ready user capability requires authority + runtime + projection + frontend + acceptance; backend implementation alone is insufficient.');
console.log('✓ PCM-W3 status projection passed: Available / Limited / Preview / Blocked / Coming later are explicit and fail-closed.');
console.log('✓ PCM-W4 current Method classification passed: HDR=BLOCKED; AST/BZR/NUM=LIMITED_SCOPED; I_CHING/TAROT=REGISTERED_NOT_IMPLEMENTED.');
console.log('✓ PCM-W5 Exit Gate passed: production-capability-registry-v1.json is the canonical answer to current user executability.');
