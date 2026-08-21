import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { BASELINE, readJson, sha256File } from './lib/method-production-activation/mpa-validation-evidence-v1.mjs';

const c=readJson('content/professional/method-production-activation/contracts/mpa-regression-runtime-v1.json');
const r=readJson('content/professional/method-production-activation/registries/mpa-regression-trigger-registry-v1.json');
const regressionSuccessor=readJson('content/professional/method-production-activation/successors/mpa-w14-mir3-dependency-regression-successor-v1.json');
const visualRasterSuccessor=readJson('content/professional/method-production-activation/successors/mpa-w14-visual-raster-dependency-regression-successor-v2.json');
const dependencySuccessor=readJson('content/professional/method-production-activation/successors/mpa-w14-mcd-package-script-regression-successor-v3.json');
const bfrCheckerSuccessor=readJson('content/professional/method-production-activation/successors/mpa-w14-bfr-h-central-checker-package-script-successor-v4.json');
const pxrCheckerSuccessor=readJson('content/professional/method-production-activation/successors/mpa-w14-pxr-checker-package-script-successor-v5.json');
const lunarNodeSuccessor=readJson('content/reconciliation/mir/mir-3-lunar-node-successor-v1.json');
const pkg=readJson('package.json');
const packageLock=readJson('package-lock.json');
const stableObject = value => Object.fromEntries(Object.entries(value || {}).sort(([a],[b]) => a.localeCompare(b)));
const sha256Json = value => crypto.createHash('sha256').update(JSON.stringify(stableObject(value)),'utf8').digest('hex');

assert.equal(c.work,'MPA-W14');
assert.equal(c.baselineCommit,BASELINE);
assert.deepEqual(r.triggers,['algorithm','dependency','registry','policy','timezone_library','ephemeris']);
assert.equal(regressionSuccessor.status,'AUTHORIZED_EXACT_DEPENDENCY_FINGERPRINT_SUCCESSOR');
assert.equal(regressionSuccessor.boundaries.historicalRegressionRegistryMutated,false);
assert.equal(regressionSuccessor.boundaries.unrelatedFingerprintDriftAllowed,false);

assert.equal(visualRasterSuccessor.status,'AUTHORIZED_EXPLICIT_NON_METHOD_DEPENDENCY_FINGERPRINT_SUCCESSOR');
assert.equal(visualRasterSuccessor.successor.packageJsonSha256,dependencySuccessor.predecessor.packageJsonSha256);
assert.equal(visualRasterSuccessor.successor.packageLockSha256,dependencySuccessor.predecessor.packageLockSha256);
assert.equal(visualRasterSuccessor.successor.checkerSha256,dependencySuccessor.predecessor.checkerSha256);

assert.equal(dependencySuccessor.status,'AUTHORIZED_PACKAGE_JSON_SCRIPT_SUCCESSOR_DEPENDENCY_FREEZE_PRESERVED');
assert.equal(dependencySuccessor.predecessor.source,'content/professional/method-production-activation/successors/mpa-w14-visual-raster-dependency-regression-successor-v2.json');
assert.equal(dependencySuccessor.boundaries.visualRasterSuccessorMutated,false);
assert.equal(dependencySuccessor.boundaries.historicalRegressionRegistryMutated,false);
assert.equal(dependencySuccessor.boundaries.mir3SuccessorMutated,false);
assert.equal(dependencySuccessor.boundaries.silentDependencyUpgradeAllowed,false);
assert.equal(dependencySuccessor.boundaries.methodProductionEligibilityChanged,false);
assert.equal(dependencySuccessor.boundaries.professionalEligibilityChanged,false);
assert.equal(dependencySuccessor.authorizedPackageJsonChange.scope,'SCRIPTS_ONLY');
assert.equal(dependencySuccessor.authorizedPackageJsonChange.dependenciesChanged,false);
assert.equal(dependencySuccessor.authorizedPackageJsonChange.devDependenciesChanged,false);
assert.equal(sha256Json(pkg.dependencies),dependencySuccessor.authorizedPackageJsonChange.dependenciesSha256);
assert.equal(sha256Json(pkg.devDependencies),dependencySuccessor.authorizedPackageJsonChange.devDependenciesSha256);
for(const [script,command] of Object.entries(dependencySuccessor.authorizedPackageJsonChange.scripts)) assert.equal(pkg.scripts[script],command,`AUTHORIZED_MCD_SCRIPT_DRIFT:${script}`);

assert.equal(lunarNodeSuccessor.status,'SOURCE_SUCCESSOR_COMPLETE_ENGINE_PACKAGE_INTEGRATION_CHECKER_PINNED');
assert.equal(lunarNodeSuccessor.modelFreeze.engine,regressionSuccessor.authority.engine);
assert.equal(lunarNodeSuccessor.modelFreeze.engineVersion,regressionSuccessor.authority.engineVersion);
assert.equal(lunarNodeSuccessor.successorArtifactSha256['package-lock.json'],regressionSuccessor.successor.packageLockSha256);
assert.deepEqual(dependencySuccessor.methodDependencyFreeze,visualRasterSuccessor.methodDependencyFreeze);
assert.deepEqual(dependencySuccessor.authorizedNonMethodDependency,visualRasterSuccessor.authorizedNonMethodDependency);
assert.equal(pkg.dependencies['astronomy-engine'],dependencySuccessor.methodDependencyFreeze.engineVersion);
assert.equal(packageLock.packages[''].dependencies['astronomy-engine'],dependencySuccessor.methodDependencyFreeze.engineVersion);
assert.equal(packageLock.packages['node_modules/astronomy-engine'].version,dependencySuccessor.methodDependencyFreeze.engineVersion);
assert.equal(packageLock.packages['node_modules/astronomy-engine'].integrity,dependencySuccessor.methodDependencyFreeze.npmIntegrity);
assert.equal(pkg.devDependencies.sharp,dependencySuccessor.authorizedNonMethodDependency.packageJsonRange);
assert.equal(packageLock.packages[''].devDependencies.sharp,dependencySuccessor.authorizedNonMethodDependency.packageLockRange);
assert.equal(packageLock.packages['node_modules/sharp'].version,dependencySuccessor.authorizedNonMethodDependency.resolvedVersion);
for(const consumer of dependencySuccessor.authorizedNonMethodDependency.allowedConsumers) assert.equal(sha256File(consumer.path),consumer.sha256,`AUTHORIZED_NON_METHOD_DEPENDENCY_CONSUMER_DRIFT:${consumer.path}`);

for(const f of r.fingerprints.filter(x=>x.path)){
  const actual=sha256File(f.path);
  if(actual===f.sha256)continue;
  assert.equal(f.path,'package-lock.json',`REGRESSION_FINGERPRINT_DRIFT:${f.path}`);
  assert.equal(f.sha256,regressionSuccessor.predecessor.packageLockSha256);
  assert.equal(dependencySuccessor.successor.packageLockSha256,actual,`REGRESSION_FINGERPRINT_DRIFT:${f.path}`);
}
assert.equal(bfrCheckerSuccessor.status,'AUTHORIZED_PACKAGE_JSON_SCRIPT_SUCCESSOR_BFR_H_CENTRAL_ENTRY_DEPENDENCY_FREEZE_PRESERVED');
assert.equal(bfrCheckerSuccessor.predecessor.path,'content/professional/method-production-activation/successors/mpa-w14-mcd-package-script-regression-successor-v3.json');
assert.equal(sha256File(bfrCheckerSuccessor.predecessor.path),bfrCheckerSuccessor.predecessor.sha256,'MPA_W14_V4_PREDECESSOR_DRIFT');
assert.equal(bfrCheckerSuccessor.predecessor.packageJsonSha256,dependencySuccessor.successor.packageJsonSha256);
assert.equal(bfrCheckerSuccessor.predecessor.checkerSha256,dependencySuccessor.successor.checkerSha256);
assert.equal(bfrCheckerSuccessor.authorizedPackageJsonChange.dependenciesChanged,false);
assert.equal(bfrCheckerSuccessor.authorizedPackageJsonChange.devDependenciesChanged,false);
assert.equal(sha256Json(pkg.dependencies),bfrCheckerSuccessor.authorizedPackageJsonChange.dependenciesSha256);
assert.equal(sha256Json(pkg.devDependencies),bfrCheckerSuccessor.authorizedPackageJsonChange.devDependenciesSha256);
for(const [script,command] of Object.entries(bfrCheckerSuccessor.authorizedPackageJsonChange.scripts)) {
  if(script==='postcheck:bfr-h') {
    assert.equal(command,pxrCheckerSuccessor.predecessor.postcheckBfrHCommand,'MPA_W14_V4_POSTCHECK_EVIDENCE_DRIFT');
  } else {
    assert.equal(pkg.scripts[script],command,`AUTHORIZED_BFR_H_SCRIPT_DRIFT:${script}`);
  }
}
for(const script of bfrCheckerSuccessor.authorizedPackageJsonChange.frozenPredecessorScriptsUnchanged) assert.ok(typeof pkg.scripts[script]==='string' && pkg.scripts[script].length>0,`FROZEN_PREDECESSOR_SCRIPT_MISSING:${script}`);
assert.equal(bfrCheckerSuccessor.boundaries.packageLockChanged,false);
assert.equal(bfrCheckerSuccessor.boundaries.dependencyChanged,false);
assert.equal(bfrCheckerSuccessor.boundaries.methodProductionEligibilityChanged,false);
assert.equal(bfrCheckerSuccessor.boundaries.professionalEligibilityChanged,false);
assert.equal(bfrCheckerSuccessor.successor.packageLockSha256,dependencySuccessor.successor.packageLockSha256);
assert.equal(bfrCheckerSuccessor.successor.packageJsonSha256,pxrCheckerSuccessor.predecessor.packageJsonSha256,'MPA_W14_V4_PACKAGE_JSON_EVIDENCE_DRIFT');
assert.equal(bfrCheckerSuccessor.successor.checkerSha256,pxrCheckerSuccessor.predecessor.checkerSha256,'MPA_W14_V4_CHECKER_EVIDENCE_DRIFT');

assert.equal(pxrCheckerSuccessor.status,'AUTHORIZED_PACKAGE_JSON_SCRIPT_SUCCESSOR_PXR_PUBLIC_EXPERIENCE_DEPENDENCY_FREEZE_PRESERVED');
assert.equal(pxrCheckerSuccessor.predecessor.path,'content/professional/method-production-activation/successors/mpa-w14-bfr-h-central-checker-package-script-successor-v4.json');
assert.equal(sha256File(pxrCheckerSuccessor.predecessor.path),pxrCheckerSuccessor.predecessor.sha256,'MPA_W14_V5_PREDECESSOR_DRIFT');
assert.equal(pxrCheckerSuccessor.predecessor.packageJsonSha256,bfrCheckerSuccessor.successor.packageJsonSha256);
assert.equal(pxrCheckerSuccessor.predecessor.checkerSha256,bfrCheckerSuccessor.successor.checkerSha256);
assert.equal(pxrCheckerSuccessor.authorizedPackageJsonChange.scope,'SCRIPTS_ONLY_PXR_PUBLIC_EXPERIENCE_CHECKERS_AND_BFR_H_ADDITIVE_INSERTION');
assert.equal(pxrCheckerSuccessor.authorizedPackageJsonChange.dependenciesChanged,false);
assert.equal(pxrCheckerSuccessor.authorizedPackageJsonChange.devDependenciesChanged,false);
assert.equal(sha256Json(pkg.dependencies),pxrCheckerSuccessor.authorizedPackageJsonChange.dependenciesSha256);
assert.equal(sha256Json(pkg.devDependencies),pxrCheckerSuccessor.authorizedPackageJsonChange.devDependenciesSha256);
for(const [script,command] of Object.entries(pxrCheckerSuccessor.authorizedPackageJsonChange.scripts)) assert.equal(pkg.scripts[script],command,`AUTHORIZED_PXR_SCRIPT_DRIFT:${script}`);
for(const script of pxrCheckerSuccessor.authorizedPackageJsonChange.frozenPredecessorScriptsUnchanged) assert.ok(typeof pkg.scripts[script]==='string' && pkg.scripts[script].length>0,`PXR_FROZEN_PREDECESSOR_SCRIPT_MISSING:${script}`);
assert.equal(pxrCheckerSuccessor.boundaries.packageLockChanged,false);
assert.equal(pxrCheckerSuccessor.boundaries.dependencyChanged,false);
assert.equal(pxrCheckerSuccessor.boundaries.methodProductionEligibilityChanged,false);
assert.equal(pxrCheckerSuccessor.boundaries.professionalEligibilityChanged,false);
assert.equal(pxrCheckerSuccessor.boundaries.secondMethodAuthorityCreated,false);
assert.equal(pxrCheckerSuccessor.successor.packageLockSha256,bfrCheckerSuccessor.successor.packageLockSha256);
assert.equal(pxrCheckerSuccessor.successor.packageJsonSha256,sha256File('package.json'),'PACKAGE_JSON_PXR_SUCCESSOR_DRIFT');
assert.equal(sha256File(pxrCheckerSuccessor.successor.checkerPath),pxrCheckerSuccessor.successor.checkerSha256,'MPA_W14_V5_SUCCESSOR_CHECKER_DRIFT');

assert.equal(r.rules.anyTriggerChangeRequiresRegression,true);
assert.equal(r.rules.timezoneLibraryUpgradeRequiresBoundaryFixtures,true);
assert.equal(r.rules.ephemerisUpgradeRequiresReferenceComparison,true);
assert.equal(r.productionEligibilityChanged,false);

console.log('✓ MPA-W14 Regression Runtime current successor passed.');
console.log('  Visual raster dependency authority remains frozen; AST/BZR MCD, PART G/H and PXR package.json evolution are scripts-only, astronomy-engine 2.1.19 and sharp 0.35.2 remain unchanged.');
