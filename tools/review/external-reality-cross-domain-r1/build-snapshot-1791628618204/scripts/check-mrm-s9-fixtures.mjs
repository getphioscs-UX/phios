import assert from 'node:assert/strict';
import { json, assertRef, assertCurrent, exists, sha, byCapability, runNode } from './lib/runtime-maturity/mrm-s-current-lib.mjs';
const regs=[
 'content/runtime-maturity/evidence/fixtures/reference-fixture-registry-v2.json',
 'content/runtime-maturity/evidence/fixtures/edge-case-fixture-registry-v2.json',
 'content/runtime-maturity/evidence/fixtures/negative-fixture-registry-v2.json',
 'content/runtime-maturity/evidence/fixtures/regression-fixture-registry-v2.json'];
const expectedClasses=['REFERENCE_FIXTURE','EDGE_FIXTURE','NEGATIVE_FIXTURE','REGRESSION_FIXTURE'];
for(let i=0;i<regs.length;i++){
 const d=json(regs[i]);assertCurrent(d,`S9_${i}`);assertRef(d.supersedes,`S9_PREDECESSOR_${i}`);assert.equal(d.evidenceObjectCount,d.evidenceObjects.length);
 for(const e of d.evidenceObjects){assert.equal(e.evidenceClass,expectedClasses[i]);assert.ok(e.fixtureId);assert.equal(e.evidenceState,'CURRENT');assert.equal(e.result,'PASS');for(const r of e.artifactReferences){assert.ok(exists(r.path));assert.equal(sha(r.path),r.sha256);}if(e.evidenceClass==='REFERENCE_FIXTURE'){for(const k of ['referenceSource','referenceVersion','referenceDate','expectedValue','tolerance','comparisonPolicy'])assert.ok(Object.hasOwn(e,k),`REFERENCE_FIELD_MISSING:${e.evidenceId}:${k}`);}}
}
for(const script of ['scripts/check-fcr-runtime.mjs','scripts/check-dar-w15-w24-document-assembly-runtime.mjs','scripts/check-far-fixtures.mjs','scripts/check-hfp-fixtures.mjs','scripts/check-pfr-fixtures.mjs','scripts/check-rrp-w26-product-fixtures.mjs']) runNode(script);
const m=json('content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.4.json');assertCurrent(m,'S9_MATRIX');assertRef(m.supersedes,'S9_MATRIX_PREDECESSOR');assert.equal(m.capabilityCount,177);assert.deepEqual(m.countsByEM,{'EM-0':140,'EM-1':15,'EM-2':22});
const map=byCapability(m.records);for(const code of ['FCR-RETIREMENT','FCR-NET-WORTH','DAR-DOCUMENT-ASSEMBLY','DAR-DOCUMENT-VALIDATION'])assert.equal(map.get((code.startsWith('FCR')?'FCR':'DAR')+'::'+code).currentEM,'EM-2');
for(const r of m.records.filter(x=>x.runtimeCode==='FAR')){assert.equal(r.currentEM,'EM-0');assert.ok(r.promotionBlockedBy.includes('EM1_DETERMINISM_PREREQUISITE_NOT_FORMALLY_ADMITTED'));}
assert.equal(m.records.some(r=>Number(r.currentEM.split('-')[1])>=3),false);
const a=json('content/runtime-maturity/acceptance/mrm-s9-fixture-validation-acceptance-v1.json');assertCurrent(a,'S9_ACCEPT');assert.equal(a.proofs.contiguousPromotionEnforced,true);assert.equal(a.proofs.fixturesNotPilotEvidence,true);
console.log('✓ MRM-S9 EM-2 Fixture Validation Campaign passed.');
console.log('  FCR 16 + DAR 5 deterministic capabilities are EM-2 fixture-validated; RRP Report Composition preserves EM-2. FAR/PFR fixture evidence is governed without skipping EM-1 or converting human judgment into determinism.');
