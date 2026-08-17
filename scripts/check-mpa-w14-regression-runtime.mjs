import assert from 'node:assert/strict'; import { BASELINE, readJson, sha256File } from './lib/method-production-activation/mpa-validation-evidence-v1.mjs';
const c=readJson('content/professional/method-production-activation/contracts/mpa-regression-runtime-v1.json'); const r=readJson('content/professional/method-production-activation/registries/mpa-regression-trigger-registry-v1.json'); assert.equal(c.work,'MPA-W14'); assert.equal(c.baselineCommit,BASELINE); assert.deepEqual(r.triggers,['algorithm','dependency','registry','policy','timezone_library','ephemeris']);
const regressionSuccessor=readJson('content/professional/method-production-activation/successors/mpa-w14-mir3-dependency-regression-successor-v1.json');
const lunarNodeSuccessor=readJson('content/reconciliation/mir/mir-3-lunar-node-successor-v1.json');
assert.equal(regressionSuccessor.status,'AUTHORIZED_EXACT_DEPENDENCY_FINGERPRINT_SUCCESSOR');
assert.equal(regressionSuccessor.boundaries.historicalRegressionRegistryMutated,false);
assert.equal(regressionSuccessor.boundaries.unrelatedFingerprintDriftAllowed,false);
for(const f of r.fingerprints.filter(x=>x.path)){
  const actual=sha256File(f.path);
  if(actual===f.sha256)continue;
  assert.equal(f.path,'package-lock.json',`REGRESSION_FINGERPRINT_DRIFT:${f.path}`);
  assert.equal(f.sha256,regressionSuccessor.predecessor.packageLockSha256);
  assert.equal(lunarNodeSuccessor.status,'SOURCE_SUCCESSOR_COMPLETE_ENGINE_PACKAGE_INTEGRATION_CHECKER_PINNED');
  assert.equal(lunarNodeSuccessor.modelFreeze.engine,regressionSuccessor.authority.engine);
  assert.equal(lunarNodeSuccessor.modelFreeze.engineVersion,regressionSuccessor.authority.engineVersion);
  assert.equal(actual,lunarNodeSuccessor.successorArtifactSha256[f.path],`REGRESSION_FINGERPRINT_DRIFT:${f.path}`);
  assert.equal(actual,regressionSuccessor.successor.packageLockSha256,`REGRESSION_FINGERPRINT_DRIFT:${f.path}`);
}
assert.equal(r.rules.anyTriggerChangeRequiresRegression,true); assert.equal(r.rules.timezoneLibraryUpgradeRequiresBoundaryFixtures,true); assert.equal(r.rules.ephemerisUpgradeRequiresReferenceComparison,true); assert.equal(r.productionEligibilityChanged,false);
console.log('✓ MPA-W14 Regression Runtime passed.'); console.log('  Algorithm/dependency/registry/policy/TZDB/ephemeris changes are explicit regression triggers; unresolved external fingerprints fail closed.');
