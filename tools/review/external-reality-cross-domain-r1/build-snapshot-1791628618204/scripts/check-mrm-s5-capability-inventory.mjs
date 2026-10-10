import assert from 'node:assert/strict';
import { PATHS, readJson, assertBaseline, assertRef, evaluateRm, RM_CODES } from './lib/runtime-maturity/mrm-s-phase-a-lib.mjs';
const s0=readJson(PATHS.s0), inv=readJson(PATHS.s5); assertBaseline(inv,'MRM_S5');
assert.equal(inv.work,'MRM-S5'); assert.equal(inv.capabilityCount,inv.capabilities.length); assert.ok(inv.capabilities.length>=100,'MRM_S5_CAPABILITY_COVERAGE_TOO_SMALL');
const runtimeCodes=new Set(s0.runtimes.map(x=>x.runtimeCode));
const keys=new Set(); const covered=new Set();
for(const cap of inv.capabilities){
  const key=`${cap.runtimeCode}::${cap.capabilityCode}`; assert.ok(!keys.has(key),`MRM_S5_DUPLICATE_CAPABILITY_${key}`); keys.add(key); covered.add(cap.runtimeCode);
  assert.ok(runtimeCodes.has(cap.runtimeCode),`MRM_S5_ORPHAN_RUNTIME_${cap.runtimeCode}`); assert.equal(cap.canonicalOwner,cap.runtimeCode,`MRM_S5_DUPLICATE_OWNER_${key}`);
  assertRef(cap.authorityReference,`MRM_S5_AUTHORITY_${key}`);
  for(const level of Object.keys(cap.rmEvidence)){ assert.ok(RM_CODES.includes(level),`MRM_S5_UNKNOWN_RM_${level}`); for(const p of cap.rmEvidence[level]) assert.ok((await import('node:fs')).default.existsSync(p),`MRM_S5_EVIDENCE_PATH_MISSING_${p}`); }
  for(const bucket of ['determinism','fixtures']) for(const ref of cap.candidateEvidence[bucket]) assertRef(ref,`MRM_S5_CANDIDATE_${key}_${bucket}`);
  assert.equal(evaluateRm(cap),cap.evaluatedCurrentRM,`MRM_S5_RM_DERIVATION_DRIFT_${key}`);
}
for(const code of runtimeCodes) assert.ok(covered.has(code),`MRM_S5_RUNTIME_WITHOUT_CAPABILITY_${code}`);
for(const reserved of inv.reservedFutureRuntimeCodes) assert.ok(!inv.capabilities.some(x=>x.runtimeCode===reserved),`MRM_S5_RESERVED_RUNTIME_FALSE_REGISTRATION_${reserved}`);
for(const method of ['AST','BZR','NUM','HDR']) {
  const rt=s0.runtimes.find(x=>x.runtimeCode===method); assert.equal(rt.productionEligible,false,`MRM_S5_METHOD_FALSE_PRODUCTION_${method}`);
  for(const c of inv.capabilities.filter(x=>x.runtimeCode===method)) assert.ok(Number(c.evaluatedCurrentRM.split('-')[1])<=5,`MRM_S5_METHOD_RM_OVERCLAIM_${c.capabilityCode}`);
}
console.log('✓ MRM-S5 Master Runtime Capability Inventory passed.');
console.log(`  ${inv.capabilities.length} capability records cover all ${runtimeCodes.size} current runtimes; 0 orphan or duplicate owner; future DAR/RRP/FDR/FCR/FAR/HFP/PFR remain reserved.`);
