import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const inv0='content/runtime-maturity/registries/master-runtime-capability-inventory-v1.json';
const inv1p='content/runtime-maturity/registries/master-runtime-capability-inventory-v1.1.json';
const rm1p='content/runtime-maturity/matrices/master-runtime-maturity-matrix-v1.1.json';
const em1p='content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.2.json';
const claim1p='content/runtime-maturity/matrices/runtime-claim-eligibility-matrix-v1.1.json';
const succ=j('content/runtime-maturity/successors/rrp-w27-mrm-binding-successor-v1.json');
const inv1=j(inv1p), rm1=j(rm1p), em1=j(em1p), claim1=j(claim1p);
const localClaim=j('content/products/runtime-reading/maturity/runtime-reading-claim-eligibility-v1.json');
const stale=j('content/products/runtime-reading/maturity/runtime-reading-evidence-staleness-binding-v1.json');
const emLevels=j('content/runtime-maturity/registries/evidence-maturity-level-registry-v1.json');
const evidenceContract=j('content/runtime-maturity/contracts/evidence-object-contract-v1.json');
const promotion=j('content/runtime-maturity/contracts/maturity-promotion-contract-v1.json');

assert.ok(succ.baselineCommit.startsWith('f010b29'));
assert.equal(succ.registeredRuntime,'RRP');
assert.equal(succ.registeredCapabilityCount,9);
assert.equal(succ.rules.historicalMrmFilesMutated,false);
assert.equal(succ.rules.emDerivedFromGovernedEvidence,true);
assert.equal(succ.rules.manualDirectEmAssignmentForbidden,true);
assert.equal(succ.rules.passAloneCannotPromote,true);
assert.equal(succ.rules.globalMRMS8S9CompletionClaimed,false);
assert.equal(succ.predecessors.capabilityInventory.sha256,sha(inv0));
assert.equal(inv1.supersedes.sha256,sha(inv0));
assert.equal(inv1.capabilityCount,j(inv0).capabilityCount+9);
assert.ok(!inv1.reservedFutureRuntimeCodes.includes('RRP'));
const caps=inv1.capabilities.filter(x=>x.runtimeCode==='RRP');
assert.equal(caps.length,9);
assert.equal(new Set(caps.map(x=>x.capabilityCode)).size,9);
assert.deepEqual(caps.map(x=>x.capabilityCode),[
 'RRP-INPUT-BUNDLE','RRP-PROJECTION-INTAKE','RRP-MEANING-ADMISSION','RRP-CONVERGENCE','RRP-REALITY-BINDING','RRP-CARRIER-BINDING','RRP-REPORT-COMPOSITION','RRP-VISUAL-REFERENCE','RRP-RR-HANDOFF'
]);
for (const c of caps) { assert.equal(c.canonicalOwner,'RRP'); assert.ok(fs.existsSync(c.authorityReference.path)); assert.equal(c.authorityReference.sha256,sha(c.authorityReference.path)); }

const rm=rm1.records.filter(x=>x.runtimeCode==='RRP'); assert.equal(rm.length,9);
const em=em1.records.filter(x=>x.runtimeCode==='RRP'); assert.equal(em.length,9);
const emOrd=new Map(emLevels.levels.map(x=>[x.code,x.ordinal]));
for (const r of em) { assert.ok(emOrd.has(r.currentEM)); assert.equal(r.realCaseCount,0); assert.equal(r.longitudinalCaseCount,0); assert.notEqual(r.currentEM,'EM-3'); }
const classesFor=cap=>{
 const ids=new Set(em.find(x=>x.capabilityCode===cap).admittedEvidenceIds||[]), out=new Set();
 const regs=[
  'content/runtime-maturity/evidence/architecture/architectural-evidence-registry-v1.1.json',
  'content/runtime-maturity/evidence/determinism/determinism-evidence-registry-v1.json',
  'content/runtime-maturity/evidence/fixtures/reference-fixture-registry-v1.json',
  'content/runtime-maturity/evidence/fixtures/edge-case-fixture-registry-v1.json',
  'content/runtime-maturity/evidence/fixtures/negative-fixture-registry-v1.json',
  'content/runtime-maturity/evidence/fixtures/regression-fixture-registry-v1.json'];
 for(const p of regs) for(const e of j(p).evidenceObjects) if(ids.has(e.evidenceId)) out.add(e.evidenceClass);
 return out;
};
const requiredObjFields=evidenceContract.requiredFields;
for (const p of [
 'content/runtime-maturity/evidence/architecture/architectural-evidence-registry-v1.1.json',
 'content/runtime-maturity/evidence/determinism/determinism-evidence-registry-v1.json',
 'content/runtime-maturity/evidence/fixtures/reference-fixture-registry-v1.json',
 'content/runtime-maturity/evidence/fixtures/edge-case-fixture-registry-v1.json',
 'content/runtime-maturity/evidence/fixtures/negative-fixture-registry-v1.json',
 'content/runtime-maturity/evidence/fixtures/regression-fixture-registry-v1.json']) {
  for(const e of j(p).evidenceObjects.filter(x=>x.runtimeCode==='RRP')) for(const f of requiredObjFields) assert.ok(Object.hasOwn(e,f),`${e.evidenceId}: missing ${f}`);
}
const comp=em.find(x=>x.capabilityCode==='RRP-REPORT-COMPOSITION');
assert.equal(comp.currentEM,'EM-2');
assert.deepEqual([...classesFor('RRP-REPORT-COMPOSITION')].sort(),['ARCHITECTURE','DETERMINISM','EDGE_FIXTURE','NEGATIVE_FIXTURE','REFERENCE_FIXTURE','REGRESSION_FIXTURE'].sort());
const hand=em.find(x=>x.capabilityCode==='RRP-RR-HANDOFF'); assert.equal(hand.currentEM,'EM-1');
assert.deepEqual([...classesFor('RRP-RR-HANDOFF')].sort(),['ARCHITECTURE','DETERMINISM']);
for (const cap of caps.map(x=>x.capabilityCode).filter(x=>!['RRP-REPORT-COMPOSITION','RRP-RR-HANDOFF'].includes(x))) assert.equal(em.find(x=>x.capabilityCode===cap).currentEM,'EM-0');

assert.equal(promotion.rules.emDerivedFromGovernedEvidence,true);
assert.equal(promotion.rules.manualDirectEmAssignmentForbidden,true);
assert.equal(promotion.rules.passFailOnlyPromotionForbidden,true);
const claims=claim1.records.filter(x=>x.runtimeCode==='RRP'); assert.equal(claims.length,9);
for(const c of claims){ const er=em.find(x=>x.capabilityCode===c.capabilityCode); assert.equal(c.evidenceMaturity,er.currentEM); assert.ok(c.prohibitedClaims.some(x=>/Pilot|Validated|Production|Published/i.test(x))); }
for(const c of localClaim.records){ assert.equal(c.derivedEM,em.find(x=>x.capabilityCode===c.capabilityCode).currentEM); }
assert.equal(localClaim.manualAssignmentAuthority,false);
assert.equal(stale.requiredResult,'REVALIDATION_REQUIRED');
assert.equal(stale.rules.oldEvidenceAutomaticallyInherited,false);

console.log('✓ RRP-W27 MRM-S / Evidence Maturity binding passed.');
console.log('  9 RRP capabilities are registered via successor matrices; RM and EM remain capability-level and evidence-derived. Report Composition is EM-2, RR Handoff EM-1, other current RRP boundaries EM-0; no Pilot/EM-3 claim exists.');
