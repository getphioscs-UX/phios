import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  PATHS, BASELINE_COMMIT, readJson, assertBaseline, assertRef, exists, sha256,
  byCapability, readPackage
} from './lib/runtime-maturity/mrm-s-phase-a-lib.mjs';

const REG = 'content/runtime-maturity/evidence/architecture/architectural-evidence-registry-v1.json';
const MATRIX = 'content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.1.json';
const SUCCESSOR = 'content/runtime-maturity/successors/mrm-s7-em0-architectural-backfill-successor-v1.json';
const ACCEPTANCE = 'content/runtime-maturity/acceptance/mrm-s7-architectural-evidence-acceptance-v1.json';

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function digestObject(value) {
  return crypto.createHash('sha256').update(stable(value), 'utf8').digest('hex');
}

const inv = readJson(PATHS.s5);
const s0 = readJson(PATHS.s0);
const contract = readJson(PATHS.s3contract);
const classes = readJson(PATHS.s3classes);
const oldMatrix = readJson(PATHS.emMatrix);
const reg = readJson(REG);
const matrix = readJson(MATRIX);
const successor = readJson(SUCCESSOR);
const acceptance = readJson(ACCEPTANCE);
for (const [doc,label] of [[reg,'MRM_S7_REGISTRY'],[matrix,'MRM_S7_MATRIX'],[successor,'MRM_S7_SUCCESSOR'],[acceptance,'MRM_S7_ACCEPTANCE']]) {
  assertBaseline(doc,label);
  assert.equal(doc.work,'MRM-S7',`${label}_WORK_DRIFT`);
}
assert.ok(classes.evidenceClasses.some(x => x.code === 'ARCHITECTURE'),'MRM_S7_ARCHITECTURE_CLASS_MISSING');
assert.equal(reg.predecessorEvidenceMatrix.path,PATHS.emMatrix,'MRM_S7_PREDECESSOR_PATH_DRIFT');
assert.equal(reg.predecessorEvidenceMatrix.sha256,sha256(PATHS.emMatrix),'MRM_S7_PREDECESSOR_DIGEST_DRIFT');
assert.equal(matrix.supersedes.path,PATHS.emMatrix,'MRM_S7_MATRIX_SUPERSEDES_PATH_DRIFT');
assert.equal(matrix.supersedes.sha256,sha256(PATHS.emMatrix),'MRM_S7_MATRIX_SUPERSEDES_DIGEST_DRIFT');
assert.equal(successor.predecessor.sha256,sha256(PATHS.emMatrix),'MRM_S7_SUCCESSOR_PREDECESSOR_DIGEST_DRIFT');
assert.equal(reg.counts.capabilityCount,inv.capabilityCount);
assert.equal(reg.counts.evidenceObjectCount,inv.capabilityCount);
assert.equal(matrix.capabilityCount,inv.capabilityCount);
assert.equal(reg.evidenceObjects.length,inv.capabilityCount);
assert.equal(matrix.records.length,inv.capabilityCount);

const required = contract.requiredFields;
const capMap = byCapability(inv.capabilities);
const oldMap = byCapability(oldMatrix.records);
const newMap = byCapability(matrix.records);
const runtimeMap = new Map(s0.runtimes.map(r => [r.runtimeCode,r]));
const evidenceKeys = new Set();
const evidenceIds = new Set();
const reserved = new Set(inv.reservedFutureRuntimeCodes);
let candidateEm2 = 0;
for (const obj of reg.evidenceObjects) {
  for (const field of required) assert.ok(Object.hasOwn(obj,field),`MRM_S7_REQUIRED_FIELD_MISSING_${obj.evidenceId}_${field}`);
  assert.equal(obj.evidenceClass,'ARCHITECTURE',`MRM_S7_NON_ARCHITECTURE_EVIDENCE_${obj.evidenceId}`);
  assert.equal(obj.environment,`REPOSITORY_BASELINE_${BASELINE_COMMIT}`,`MRM_S7_ENVIRONMENT_DRIFT_${obj.evidenceId}`);
  assert.equal(obj.evidenceState,'CURRENT',`MRM_S7_EVIDENCE_STATE_DRIFT_${obj.evidenceId}`);
  assert.equal(obj.result,'ARCHITECTURAL_EVIDENCE_PRESENT',`MRM_S7_RESULT_DRIFT_${obj.evidenceId}`);
  assert.ok(!Object.hasOwn(obj,'caseId'),`MRM_S7_ARCHITECTURE_CASE_ID_FORBIDDEN_${obj.evidenceId}`);
  assert.ok(!Object.hasOwn(obj,'fixtureId'),`MRM_S7_ARCHITECTURE_FIXTURE_ID_FORBIDDEN_${obj.evidenceId}`);
  assert.ok(!reserved.has(obj.runtimeCode),`MRM_S7_RESERVED_FUTURE_RUNTIME_SYNTHETIC_EVIDENCE_${obj.runtimeCode}`);
  assert.ok(!evidenceIds.has(obj.evidenceId),`MRM_S7_DUPLICATE_EVIDENCE_ID_${obj.evidenceId}`); evidenceIds.add(obj.evidenceId);
  const key = `${obj.runtimeCode}::${obj.capabilityCode}`;
  assert.ok(!evidenceKeys.has(key),`MRM_S7_DUPLICATE_CAPABILITY_EVIDENCE_${key}`); evidenceKeys.add(key);
  const cap = capMap.get(key); assert.ok(cap,`MRM_S7_UNKNOWN_CAPABILITY_${key}`);
  assert.equal(obj.version,cap.currentVersion,`MRM_S7_VERSION_BINDING_DRIFT_${key}`);
  assert.deepEqual(obj.scope,[cap.capabilityCode],`MRM_S7_SCOPE_DRIFT_${key}`);
  for (const limitation of ['ARCHITECTURE_ONLY','DOES_NOT_ADMIT_DETERMINISM_EVIDENCE','DOES_NOT_ADMIT_FIXTURE_VALIDATION_EVIDENCE','DOES_NOT_ESTABLISH_PILOT_OR_REAL_WORLD_VALIDATION','DOES_NOT_CHANGE_DOMAIN_PRODUCTION_AUTHORITY']) {
    assert.ok(obj.limitations.includes(limitation),`MRM_S7_LIMITATION_MISSING_${key}_${limitation}`);
  }
  assert.ok(Array.isArray(obj.artifactReferences) && obj.artifactReferences.length >= 2,`MRM_S7_PROVENANCE_TOO_THIN_${key}`);
  let hasAuthority=false, hasChecker=false;
  const digestInput=[];
  for (const ref of obj.artifactReferences) {
    assert.ok(exists(ref.path),`MRM_S7_ARTIFACT_PATH_MISSING_${key}_${ref.path}`);
    assert.equal(sha256(ref.path),ref.sha256,`MRM_S7_ARTIFACT_DIGEST_DRIFT_${key}_${ref.path}`);
    assert.ok(Array.isArray(ref.roles) && ref.roles.length>0,`MRM_S7_ARTIFACT_ROLE_MISSING_${key}_${ref.path}`);
    if (ref.roles.includes('CAPABILITY_AUTHORITY')) hasAuthority=true;
    if (ref.roles.includes('CHECKER_AUTHORITY')) hasChecker=true;
    digestInput.push({path:ref.path,sha256:ref.sha256,selector:ref.selector ?? null,roles:[...ref.roles].sort()});
  }
  digestInput.sort((a,b)=>a.path.localeCompare(b.path) || String(a.selector??'').localeCompare(String(b.selector??'')));
  assert.equal(digestObject(digestInput),obj.artifactDigest,`MRM_S7_ARTIFACT_SET_DIGEST_DRIFT_${key}`);
  assert.ok(hasAuthority,`MRM_S7_CAPABILITY_AUTHORITY_REFERENCE_MISSING_${key}`);
  assert.ok(hasChecker,`MRM_S7_CHECKER_AUTHORITY_REFERENCE_MISSING_${key}`);
  const rt=runtimeMap.get(obj.runtimeCode); assert.ok(rt,`MRM_S7_RUNTIME_AUTHORITY_MISSING_${obj.runtimeCode}`);
  assert.equal(obj.authoritySnapshot.canonicalOwner,cap.canonicalOwner,`MRM_S7_OWNER_DRIFT_${key}`);
  assert.equal(obj.authoritySnapshot.productionStatus,cap.productionStatus,`MRM_S7_PRODUCTION_STATUS_DRIFT_${key}`);
  assert.equal(obj.authoritySnapshot.evaluatedRuntimeMaturity,cap.evaluatedCurrentRM,`MRM_S7_RM_SNAPSHOT_DRIFT_${key}`);
}
assert.equal(evidenceKeys.size,inv.capabilityCount,'MRM_S7_NOT_ALL_CAPABILITIES_BACKFILLED');

for (const cap of inv.capabilities) {
  const key=`${cap.runtimeCode}::${cap.capabilityCode}`;
  const old=oldMap.get(key), cur=newMap.get(key); assert.ok(old&&cur,`MRM_S7_MATRIX_RECORD_MISSING_${key}`);
  assert.equal(cur.currentEM,'EM-0',`MRM_S7_PREMATURE_EM_PROMOTION_${key}`);
  assert.equal(cur.highestSatisfiedEM,'EM-0',`MRM_S7_PREMATURE_HIGHEST_EM_${key}`);
  assert.equal(cur.currentEM,old.currentEM,`MRM_S7_EM_CHANGED_FROM_S6_${key}`);
  assert.equal(cur.candidateHighestEMFromLegacyArtifacts,old.candidateHighestEMFromLegacyArtifacts,`MRM_S7_LEGACY_CANDIDATE_CHANGED_${key}`);
  if(cur.candidateHighestEMFromLegacyArtifacts==='EM-2') candidateEm2++;
  assert.equal(cur.evidenceNormalizationState,'FORMAL_ARCHITECTURAL_EVIDENCE_OBJECT_ADMITTED_MRM_S7',`MRM_S7_NORMALIZATION_STATE_DRIFT_${key}`);
  assert.equal(cur.architecturalEvidenceIds.length,1,`MRM_S7_ARCHITECTURE_EVIDENCE_ID_COUNT_${key}`);
  assert.ok(!cur.promotionBlockedBy.includes('MRM_S7_FORMAL_ARCHITECTURAL_EVIDENCE_BACKFILL_PENDING'),`MRM_S7_PENDING_BLOCKER_NOT_CLEARED_${key}`);
  assert.equal(cur.nextPromotion,'EM-1',`MRM_S7_NEXT_PROMOTION_DRIFT_${key}`);
  assert.equal(cur.realCaseCount,0,`MRM_S7_REAL_CASE_EVIDENCE_FORBIDDEN_${key}`);
  assert.equal(cur.longitudinalCaseCount,0,`MRM_S7_LONGITUDINAL_EVIDENCE_FORBIDDEN_${key}`);
  assert.equal(cur.validationSetCount,0,`MRM_S7_VALIDATION_EVIDENCE_FORBIDDEN_${key}`);
}
assert.equal(candidateEm2,10,'MRM_S7_LEGACY_EM2_CANDIDATE_COUNT_DRIFT');
assert.equal(successor.changes.formalArchitectureEvidenceObjectsCreated,inv.capabilityCount);
assert.equal(successor.changes.evidenceMaturityPromotionsAboveEM0,0);
assert.equal(successor.changes.runtimeMaturityChanged,false);
assert.equal(successor.changes.productionAuthorityChanged,false);
assert.equal(successor.changes.domainAuthorityChanged,false);
assert.equal(successor.changes.historicalFreezeMutated,false);
assert.equal(successor.changes.reservedFutureRuntimeSyntheticEvidenceCreated,false);
assert.equal(acceptance.status,'MRM_S7_EM0_ARCHITECTURAL_BACKFILL_ACCEPTED');
assert.equal(acceptance.counts.formalArchitecturalEvidenceObjectCount,inv.capabilityCount);
assert.equal(acceptance.counts.em1OrHigherPromotedCount,0);
assert.equal(acceptance.counts.reservedFutureRuntimeEvidenceObjectCount,0);
assert.ok(acceptance.notClaimed.includes('EM1_FORMALLY_ADMITTED'));
assert.ok(acceptance.notClaimed.includes('EM2_FORMALLY_ADMITTED'));
assert.ok(acceptance.notClaimed.includes('EM3_PILOT_VERIFIED'));
const pkg=readPackage(); assert.equal(Object.hasOwn(pkg.scripts||{},'check:mrm-s'),false,'MRM_S7_PACKAGE_ALIAS_PREMATURE_BEFORE_S18');

console.log('✓ MRM-S7 EM-0 Architectural Evidence Object Backfill passed.');
console.log(`  ${inv.capabilityCount} current capabilities now have one formal ARCHITECTURE evidence object with verified artifact provenance; current EM remains EM-0 for all capabilities.`);
console.log(`  ${candidateEm2} legacy EM-2 candidates remain candidates only until MRM-S8/S9 standardized determinism/fixture admission; 0 reserved future runtimes received synthetic EM-0 evidence.`);
