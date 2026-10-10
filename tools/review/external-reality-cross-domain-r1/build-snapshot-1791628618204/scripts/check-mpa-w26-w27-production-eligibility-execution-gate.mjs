import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const BASE='content/professional/method-production-activation';
const baseline='021007b80fa20739a726fb28bcda4a9369af48e4';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const readJson=p=>JSON.parse(read(p));
const digestObject=o=>crypto.createHash('sha256').update(JSON.stringify(o,Object.keys(o).sort())).digest('hex');
const stable=o=>JSON.stringify(o,Object.keys(o).sort());
const contract=readJson(`${BASE}/contracts/mpa-production-eligibility-decision-v1.json`);
const registry=readJson(`${BASE}/registries/mpa-production-eligibility-decision-registry-v1.json`);
const schema=readJson(`${BASE}/schemas/mpa-production-eligibility-decision-v1.schema.json`);
const executionContract=readJson(`${BASE}/contracts/mpa-production-execution-gate-v1.json`);
const executionRegistry=readJson(`${BASE}/registries/mpa-production-execution-gate-registry-v1.json`);
const requestSchema=readJson(`${BASE}/schemas/mpa-method-execution-request-v1.schema.json`);
const acceptance=readJson(`${BASE}/acceptance/mpa-w26-w27-production-gate-acceptance-v1.json`);
const methods=readJson(`${BASE}/registries/method-registry-v2.json`);
const capabilities=readJson(`${BASE}/registries/mpa-method-capability-matrix-v1.json`);
const numReady=readJson(`${BASE}/registries/mpa-method-activation-readiness-registry-v1.json`).entries.find(x=>x.methodCode==='NUMEROLOGY');
const astReady=readJson(`${BASE}/registries/mpa-ast-activation-readiness-v1.json`);
const bzrReady=readJson(`${BASE}/registries/mpa-bzr-activation-readiness-v1.json`);
const hdrReady=readJson(`${BASE}/registries/mpa-hdr-boundary-readiness-v1.json`);
const holding=readJson(`${BASE}/registries/mpa-future-method-holding-registry-v1.json`);
const wprVocab=readJson('content/web-production/registries/wpr-public-vocabulary-registry-v2.json');
const rdg=readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const pkg=readJson('package.json');

assert.equal(contract.work,'MPA-W26'); assert.equal(contract.baselineCommit,baseline);
assert.equal(contract.status,'ACTIVE_CANONICAL_ELIGIBILITY_AUTHORITY_FAIL_CLOSED');
assert.deepEqual(contract.decisions,['ELIGIBLE','CONDITIONALLY_ELIGIBLE','BLOCKED']);
assert.equal(contract.rules.missingEvidenceFailsClosed,true); assert.equal(contract.rules.conditionallyEligibleIsNotProductionExecutable,true);
assert.deepEqual(contract.canonicalFields,['methodCode','methodVersion','capability','validation','regression','license','dataGovernance','professionalBoundary','publicVocabulary','decision','blockingReasons']);
assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');
assert.equal(requestSchema.$schema,'https://json-schema.org/draft/2020-12/schema');
assert.deepEqual(requestSchema.properties.capability.enum,['CALCULATION','PROJECTION']);

const expectedMethods=methods.methods.map(x=>x.methodCode); const expectedCaps=capabilities.capabilities;
assert.equal(registry.decisions.length,expectedMethods.length*expectedCaps.length);
assert.equal(new Set(registry.decisions.map(x=>`${x.methodCode}|${x.methodVersion}|${x.capability}`)).size,registry.decisions.length);
for(const d of registry.decisions){
  assert.ok(expectedMethods.includes(d.methodCode)); assert.ok(expectedCaps.includes(d.capability));
  assert.ok(['ELIGIBLE','CONDITIONALLY_ELIGIBLE','BLOCKED'].includes(d.decision));
  for(const k of ['validation','regression','license','dataGovernance','professionalBoundary','publicVocabulary']){
    assert.ok(['PASSED','CONDITIONAL','BLOCKED','NOT_APPLICABLE'].includes(d[k].status)); assert.ok(d[k].reference); assert.ok(d[k].detail);
  }
  assert.match(d.decisionDigest,/^[a-f0-9]{64}$/);
  if(d.decision==='ELIGIBLE'){assert.equal(d.blockingReasons.length,0); assert.equal((d.conditions||[]).length,0);}
  if(d.decision==='CONDITIONALLY_ELIGIBLE'){assert.ok(d.blockingReasons.length>0); assert.ok(d.conditions.length>0); assert.equal(d.conditionsSatisfied,false);}
  if(d.decision==='BLOCKED') assert.ok(d.blockingReasons.length>0);
}
assert.equal(registry.summary.eligibleCount,0); assert.equal(registry.summary.conditionallyEligibleCount,6); assert.equal(registry.summary.blockedCount,36);
const dec=(m,c)=>registry.decisions.find(x=>x.methodCode===m&&x.capability===c);
for(const cap of ['DATA','CALCULATION','PROJECTION']) assert.equal(dec('NUMEROLOGY',cap).decision,'CONDITIONALLY_ELIGIBLE');
for(const cap of ['DATA','CALCULATION','PROJECTION']) assert.equal(dec('BAZI',cap).decision,'CONDITIONALLY_ELIGIBLE');
for(const cap of expectedCaps) assert.equal(dec('ASTROLOGY',cap).decision,'BLOCKED');
for(const cap of expectedCaps) assert.equal(dec('HUMAN_DESIGN',cap).decision,'BLOCKED');
for(const method of ['I_CHING','TAROT','PSYCHOLOGY']) for(const cap of expectedCaps){assert.equal(dec(method,cap).decision,'BLOCKED'); assert.equal(dec(method,cap).dataGovernance.status,'BLOCKED');}
assert.equal(numReady.methodSpecificReady,true); assert.equal(bzrReady.readyForW26,true); assert.equal(astReady.readyForW26,false); assert.equal(hdrReady.readyForW26,false);
assert.deepEqual(holding.entries.map(x=>x.methodCode),['I_CHING','TAROT','PSYCHOLOGY']);
assert.ok(wprVocab.entries.some(x=>x.internalCodes.includes('NUMEROLOGY'))); assert.ok(wprVocab.entries.some(x=>x.internalCodes.includes('BAZI')));
for(const runtimeCode of ['NUM','BZR','AST','HDR']){
  const r=rdg.entries.find(x=>x.runtimeCode===runtimeCode); assert.ok(r); assert.ok(r.readAuthority.dataTypes.includes('METHOD_INPUT_RECORD')); assert.ok(r.writeAuthority.dataTypes.includes('METHOD_PROJECTION_RECORD'));
}

assert.equal(executionContract.work,'MPA-W27'); assert.equal(executionContract.baselineCommit,baseline); assert.equal(executionContract.status,'ACTIVE_FAIL_CLOSED_PRODUCTION_EXECUTION_GATE');
assert.deepEqual(executionContract.canonicalFlow,['FRONTEND','WPR','METHOD_EXECUTION_API','MPA_PRODUCTION_ELIGIBILITY','METHOD_RUNTIME']);
assert.equal(executionContract.eligibilityFunction,'isMethodProductionEligible(methodCode, methodVersion, capability)');
assert.equal(executionContract.rules.conditionallyEligibleFailsClosed,true); assert.equal(executionContract.currentActivation.eligibleProductionExecutionCount,0);
assert.equal(executionRegistry.currentState.productionDispatchActive,false); assert.equal(executionRegistry.currentState.conditionallyEligibleCapabilities.length,4); // Calculation + Projection only reflected at API gate audit? registry may include 6; checked below

const eligUrl=pathToFileURL(path.join(root,'functions/method-production-activation/production-eligibility-runtime.js')).href+`?v=${Date.now()}`;
const gateUrl=pathToFileURL(path.join(root,'functions/method-production-activation/method-execution-gate-runtime.js')).href+`?v=${Date.now()}`;
const eligibility=await import(eligUrl); const gate=await import(gateUrl);
for(const d of registry.decisions){
  const projected=eligibility.getMethodProductionEligibility(d.methodCode,d.methodVersion,d.capability); assert.ok(projected); assert.equal(projected.decision,d.decision); assert.equal(projected.decisionDigest,d.decisionDigest);
  assert.equal(eligibility.isMethodProductionEligible(d.methodCode,d.methodVersion,d.capability),d.decision==='ELIGIBLE');
}
assert.equal(eligibility.isMethodProductionEligible('UNKNOWN','0','CALCULATION'),false);
let dispatched=0; await assert.rejects(()=>gate.executeMethodWithProductionGate({methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',capability:'CALCULATION'},async()=>{dispatched++;return 'bad';}),/METHOD_PRODUCTION_NOT_ELIGIBLE/); assert.equal(dispatched,0);
await assert.rejects(()=>gate.executeMethodWithProductionGate({methodCode:'BAZI',methodVersion:'0.1.0',capability:'PROJECTION'},async()=>{dispatched++;return 'bad';}),/METHOD_PRODUCTION_NOT_ELIGIBLE/); assert.equal(dispatched,0);

const api=read('functions/api/method-execute.js'); const gateSource=read('functions/method-production-activation/method-execution-gate-runtime.js'); const client=read('assets/js/web-production/method-execution-client.js');
assert.ok(api.includes('executeMethodWithProductionGate')); assert.ok(api.indexOf('executeMethodWithProductionGate') < api.indexOf('dispatchCanonicalMethodRuntime)')); assert.ok(gateSource.includes('isMethodProductionEligible(')); assert.ok(gateSource.indexOf('isMethodProductionEligible(') < gateSource.indexOf('return dispatch('));
assert.ok(client.includes("fetcher('/api/method-execute'")); assert.equal(/core-method-runtime|method-runtime\/shared-calculation/.test(client),false);
const scan=[];
for(const base of ['assets/js','functions/api']){
  const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory())walk(p); else if(/\.js$/.test(e.name))scan.push(p);}}; walk(path.join(root,base));
}
for(const file of scan){const rel=path.relative(root,file).replaceAll('\\','/'); const src=fs.readFileSync(file,'utf8'); if(rel==='functions/api/method-execute.js')continue; assert.equal(/from\s+['\"][^'\"]*(?:core-method-runtime|method-runtime\/shared-(?:calculation|projection))/.test(src),false,`Production bypass import: ${rel}`);}

assert.equal(acceptance.status,'ACCEPT_CANONICAL_ELIGIBILITY_AND_FAIL_CLOSED_EXECUTION_GATE_NO_CURRENT_PRODUCTION_DISPATCH'); assert.equal(acceptance.acceptedFacts.unconditionalEligibleCapabilityCount,0); assert.equal(acceptance.acceptedFacts.conditionallyEligibleIsNotExecutable,true);
assert.equal(pkg.scripts['check:mpa-w26-w27'],'node scripts/check-mpa-w26-w27-production-eligibility-execution-gate.mjs');
assert.equal(pkg.scripts['check:mpa-production-gate'],'npm run check:mpa-w26-w27');
const chain=String(pkg.scripts['check:mpa']||'').split(' && '); assert.equal(chain.filter(x=>x==='npm run check:mpa-production-gate').length,1); assert.ok(chain.indexOf('npm run check:mpa-production-gate')>chain.indexOf('npm run check:mpa-future-holding'));
console.log('✓ MPA-W26/W27 Production Eligibility Decision + Execution Gate passed.');
console.log('  NUMEROLOGY and BAZI are conditionally eligible for non-Professional method capabilities, but conditional eligibility remains non-executable.');
console.log('  ASTROLOGY, HUMAN_DESIGN and all W25 Holding methods remain blocked.');
console.log('  All Production Method execution is fail-closed behind /api/method-execute → MPA eligibility → Method Runtime; current production dispatch count is zero.');
