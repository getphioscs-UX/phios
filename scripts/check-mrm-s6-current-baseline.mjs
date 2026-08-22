import assert from 'node:assert/strict';
import { PATHS, readJson, assertBaseline, byCapability, evaluateRm, readPackage } from './lib/runtime-maturity/mrm-s-phase-a-lib.mjs';
const inv=readJson(PATHS.s5), rm=readJson(PATHS.rmMatrix), em=readJson(PATHS.emMatrix), claims=readJson(PATHS.claimMatrix), summary=readJson(PATHS.runtimeSummary), acc=readJson(PATHS.acceptance), promotion=readJson(PATHS.promotion), claimContract=readJson(PATHS.claim);
for(const [d,w] of [[rm,'MRM_S6_RM'],[em,'MRM_S6_EM'],[claims,'MRM_S6_CLAIMS'],[summary,'MRM_S6_SUMMARY'],[acc,'MRM_S6_ACCEPTANCE']]) assertBaseline(d,w);
assert.equal(rm.capabilityCount,inv.capabilityCount); assert.equal(em.capabilityCount,inv.capabilityCount); assert.equal(claims.capabilityCount,inv.capabilityCount);
const rmMap=byCapability(rm.records), emMap=byCapability(em.records), claimMap=byCapability(claims.records);
for(const cap of inv.capabilities){
  const key=`${cap.runtimeCode}::${cap.capabilityCode}`, r=rmMap.get(key), e=emMap.get(key), c=claimMap.get(key); assert.ok(r&&e&&c,`MRM_S6_MATRIX_RECORD_MISSING_${key}`);
  assert.equal(r.currentRM,evaluateRm(cap),`MRM_S6_RM_RECALC_DRIFT_${key}`); assert.equal(r.highestSatisfiedRM,r.currentRM);
  assert.equal(e.currentEM,'EM-0',`MRM_S6_PREMATURE_EM_PROMOTION_${key}`); assert.equal(e.highestSatisfiedEM,'EM-0'); assert.equal(e.realCaseCount,0); assert.equal(e.longitudinalCaseCount,0); assert.equal(e.validationSetCount,0);
  const legacyCandidate=(cap.candidateEvidence.determinism.length && cap.candidateEvidence.fixtures.length)?'EM-2':(cap.candidateEvidence.determinism.length?'EM-1':'EM-0'); assert.equal(e.candidateHighestEMFromLegacyArtifacts,legacyCandidate,`MRM_S6_LEGACY_CANDIDATE_DRIFT_${key}`);
  assert.equal(c.evidenceMaturity,'EM-0'); for(const prohibited of ['PILOT_VERIFIED','VALIDATION_SUPPORTED','CALIBRATED','RESEARCH_SUPPORTED','PRODUCTION_MATURE','SCIENTIFICALLY_PROVEN']) assert.ok(c.prohibitedClaims.includes(prohibited),`MRM_S6_CLAIM_BOUNDARY_MISSING_${key}_${prohibited}`);
}
assert.equal(promotion.rules.passFailOnlyPromotionForbidden,true); assert.equal(promotion.rules.manualDirectEmAssignmentForbidden,true); assert.equal(claimContract.rules.claimCannotExceedEm,true);
assert.equal(summary.runtimeCount,34); assert.ok(summary.records.every(x=>x.runtimeBlanketMaturityAssigned===false),'MRM_S6_RUNTIME_BLANKET_SCORE_FORBIDDEN');
assert.equal(acc.status,'PHASE_A_MASTER_MATURITY_BASELINE_ACCEPTED_NOT_PILOT_VALIDATED'); assert.equal(acc.counts.capabilityCount,inv.capabilityCount); assert.ok(acc.notClaimed.includes('EM3_PILOT_VERIFIED'));
const pkg=readPackage(); assert.equal(Object.hasOwn(pkg.scripts||{},'check:mrm-s'),false,'MRM_S6_PACKAGE_ALIAS_PREMATURE_BEFORE_S18');
const rmDist={}; for(const x of rm.records) rmDist[x.currentRM]=(rmDist[x.currentRM]||0)+1;
const candidateEm2=em.records.filter(x=>x.candidateHighestEMFromLegacyArtifacts==='EM-2').length;
console.log('✓ MRM-S6 Current RM + EM Baseline Audit passed.');
console.log(`  ${inv.capabilityCount} capabilities: artifact-derived RM baseline ${JSON.stringify(rmDist)}; current admitted EM = EM-0; ${candidateEm2} legacy EM-2 candidates await S8/S9 standardized admission; 0 Pilot evidence claimed.`);
