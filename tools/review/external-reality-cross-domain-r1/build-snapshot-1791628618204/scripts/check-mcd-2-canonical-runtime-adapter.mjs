import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {getMcd1MpaSuccessorDecision,MPA_MCD1_SUCCESSOR_METHODS} from '../functions/method-production-activation/mcd1-production-authority-successor-runtime.js';
import {validateMethodAdapterRegistration,dispatchMethodThroughCanonicalAdapter,CANONICAL_METHOD_ADAPTERS} from '../functions/method-client-delivery/adapter-registry-runtime.js';
import {onRequestPost} from '../functions/api/method-execute.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const contract=j('content/professional/method-client-delivery/contracts/mcd-2-canonical-runtime-adapter-contract-v1.json');
const registry=j('content/professional/method-client-delivery/registries/mcd-2-canonical-runtime-adapter-registry-v1.json');
const hdr=j('content/professional/method-client-delivery/resolutions/mcd-2-hdr-adapter-registration-v1.json');
const acceptance=j('content/professional/method-client-delivery/acceptance/mcd-2-canonical-runtime-adapter-acceptance-v1.json');
const mpa=j('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');

assert.equal(contract.work,'MCD-2');
assert.deepEqual(contract.authorityChain,['API','MPA','ADAPTER_REGISTRY','METHOD_ADAPTER','CORE_METHOD_RUNTIME']);
assert.equal(contract.rules.mpaSuccessorControlsDispatchAllowed,true);
assert.equal(contract.rules.rawClientPayloadMayEnterCoreBeforeMcd3,false);
assert.equal(contract.rules.customerProductionCalculationMayExecuteBeforeMcd4,false);
assert.equal(contract.hdr.registrationMode,'VALIDATION_ONLY');
assert.equal(contract.hdr.productionInvocationAllowed,false);

assert.equal(registry.status,'ACTIVE_CANONICAL_BINDINGS_MPA_GATED_CUSTOMER_EXECUTION_DEFERRED');
assert.deepEqual(registry.entries.map(x=>x.pluginCode),['AST','BZR','NUM','HDR']);
for (const code of ['AST','BZR','NUM']) {
  const x=registry.entries.find(v=>v.pluginCode===code);
  assert.equal(x.mpaDispatchAllowed,true); assert.equal(x.productionAdapterBindingActive,true);
  assert.equal(x.customerCalculationActive,false); assert.equal(x.canonicalInputRequiredBeforeCalculation,'MCD-3');
  assert.equal(x.customerCalculationDeferredTo,'MCD-4'); assert.equal(x.interpretationIncluded,false); assert.equal(x.professionalIncluded,false);
}
const hr=registry.entries.find(x=>x.pluginCode==='HDR');
assert.equal(hr.registrationStatus,'REGISTERED_VALIDATION_ONLY'); assert.equal(hr.mpaDispatchAllowed,false);
assert.equal(hr.productionAdapterBindingActive,false); assert.equal(hr.productionInvocation,'FORBIDDEN'); assert.equal(hr.executionMode,'validation_only');

assert.equal(MPA_MCD1_SUCCESSOR_METHODS.length,4);
for (const source of mpa.methods) {
  const cap='CALCULATION', d=getMcd1MpaSuccessorDecision(source.methodCode,source.methodVersion,cap);
  assert.ok(d); assert.equal(d.authorityOwner,'MPA');
  assert.equal(d.dispatchAllowed,source.dispatchAllowed===true && source.dispatchableCapabilities.includes(cap));
}
for (const [method,version,expected] of [
  ['ASTROLOGY','0.1.0',['AST_ASTRONOMY_RUNTIME','AST_PLANET_RUNTIME']],
  ['BAZI','0.1.0',['BZR_SOLAR_CALENDAR_RUNTIME','BZR_FOUR_PILLARS_RUNTIME','BZR_LUCK_CYCLE_RUNTIME','BZR_PROJECTION_NORMALIZATION_RUNTIME','BZR_PROJECTION_RUNTIME']],
  ['NUMEROLOGY','0.1.0-candidate',['NUM_BIRTH_NUMBER_RUNTIME','NUM_NUMBER_STRUCTURE_RUNTIME','NUM_CYCLE_RUNTIME','NUM_PROJECTION_RUNTIME']]
]) {
  const probe=validateMethodAdapterRegistration(method,version);
  assert.equal(probe.coreFactoriesBound,true); assert.deepEqual([...probe.coreRuntimeCodes],expected);
  assert.equal(probe.customerCalculationActive,false);
}
const hp=validateMethodAdapterRegistration('HUMAN_DESIGN','1.0.0');
assert.equal(hp.registrationStatus,'REGISTERED_VALIDATION_ONLY'); assert.equal(hp.productionInvocationAllowed,false); assert.equal(hp.customerResultAllowed,false);

await assert.rejects(
  ()=>dispatchMethodThroughCanonicalAdapter(
    {methodCode:'HUMAN_DESIGN',methodVersion:'1.0.0',capability:'CALCULATION'},
    {authorityOwner:'MPA',decision:'ELIGIBLE',dispatchAllowed:true}
  ),
  e=>e?.code==='MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN'
);

async function api(methodCode,methodVersion,capability='CALCULATION'){
  const request=new Request('https://example.invalid/api/method-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
    schemaVersion:'PHI-OS-MPA-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode,methodVersion,capability,purposeCode:'MCD2_BINDING_PROBE',input:{},consentRecordId:'CONSENT-MCD2-PROBE',requestId:`REQ-${methodCode}`
  })});
  const response=await onRequestPost({request}); return {status:response.status,body:await response.json()};
}
for (const [code,version] of [['ASTROLOGY','0.1.0'],['BAZI','0.1.0'],['NUMEROLOGY','0.1.0-candidate']]) {
  const r=await api(code,version); assert.equal(r.status,409); assert.equal(r.body.error,'MCD_CANONICAL_INPUT_NOT_ESTABLISHED');
}
const hdrApi=await api('HUMAN_DESIGN','1.0.0');
assert.equal(hdrApi.status,423); assert.equal(hdrApi.body.error,'METHOD_PRODUCTION_NOT_ELIGIBLE');

const apiText=fs.readFileSync('functions/api/method-execute.js','utf8');
assert.match(apiText,/dispatchMethodThroughCanonicalAdapter/); assert.doesNotMatch(apiText,/core-method-runtime/);
const clientText=fs.readFileSync('assets/js/web-production/method-execution-client.js','utf8');
assert.doesNotMatch(clientText,/core-method-runtime/);
const adapterText=[
 'functions/method-client-delivery/adapters/ast-adapter.js',
 'functions/method-client-delivery/adapters/bzr-adapter.js',
 'functions/method-client-delivery/adapters/num-adapter.js',
 'functions/method-client-delivery/adapters/hdr-adapter.js'
].map(p=>fs.readFileSync(p,'utf8')).join('\n');
assert.doesNotMatch(adapterText,/openai|workersAI|provider/i);
assert.equal(hdr.status,'REGISTERED_VALIDATION_ONLY_PRODUCTION_INVOCATION_FORBIDDEN');
assert.equal(hdr.invariants.directAdapterBypassStillBlocksProductionInvocation,true);
assert.equal(acceptance.status,'ACCEPTED_API_MPA_ADAPTER_REGISTRY_CORE_BINDING');


const freeze=j('content/professional/method-client-delivery/freeze/mcd-2-canonical-runtime-adapter-freeze-v1.json');
assert.equal(freeze.status,'FROZEN_ADAPTER_BINDING_MCD3_MCD4_NOT_ACTIVATED');
for(const item of [...freeze.frozenOutputs,...freeze.predecessorEvidence]) assert.equal(sha(item.path),item.sha256,`MCD-2 freeze drift: ${item.path}`);
for(const value of Object.values(freeze.nonActivation)) assert.equal(value,false);

console.log('✓ MCD-2 Canonical Runtime Adapter passed.');
console.log('  /api/method-execute → MPA successor gate → canonical Adapter Registry → Core Runtime factory binding is established for AST/BZR/NUM.');
console.log('  Raw client payload cannot execute Core calculation before MCD-3/MCD-4; HDR is validation-registration-only and Production invocation fails closed at both MPA and Adapter layers.');
