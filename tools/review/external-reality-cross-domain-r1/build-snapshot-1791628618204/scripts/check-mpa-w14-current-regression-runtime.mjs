import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = 'content/professional/method-production-activation';
const contract = readJson(`${base}/contracts/mpa-regression-runtime-v2.json`);
const triggers = readJson(`${base}/registries/mpa-regression-trigger-registry-v2.json`);
const deps = readJson(`${base}/registries/mpa-method-dependency-registry-v2.json`);
const consolidation = readJson(`${base}/current/mpa-current-check-consolidation-v1.json`);
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');

assert.equal(contract.work, 'MPA-W14-CURRENT');
assert.equal(contract.status, 'ACTIVE_METHOD_SCOPED_NO_PRODUCTION_GRANT');
assert.equal(contract.rules.wholePackageJsonFingerprintForbidden, true);
assert.equal(contract.rules.wholePackageLockFingerprintForbidden, true);
assert.equal(contract.rules.pxrBfrVisualFingerprintCouplingForbidden, true);
assert.deepEqual(triggers.triggers, ['algorithm','dependency','registry','policy','timezone_library','ephemeris']);
assert.equal(triggers.rules.repositoryWidePackageFingerprintForbidden, true);
assert.equal(triggers.rules.packageScriptFingerprintForbidden, true);
assert.equal(triggers.rules.nonMethodDependencyFingerprintForbidden, true);

for (const item of triggers.fingerprints) {
  if (item.path) {
    assert.notEqual(item.path, 'package.json');
    assert.notEqual(item.path, 'package-lock.json');
    assert.equal(sha256File(item.path), item.sha256, `MPA_METHOD_REGRESSION_DRIFT:${item.path}`);
  }
  if (item.trigger === 'dependency') {
    assert.equal(item.registryPath, contract.methodDependencyRegistry);
    assert.equal(item.fingerprintMode, 'METHOD_DEPENDENCY_ENTRIES_ONLY');
  }
}

assert.equal(deps.wholePackageJsonFingerprint, false);
assert.equal(deps.wholePackageLockFingerprint, false);
for (const dep of deps.methodDependencies) {
  assert.equal(pkg[dep.packageJsonSection]?.[dep.package], dep.version, `MPA_METHOD_DEPENDENCY_VERSION_DRIFT:${dep.package}`);
  const entry = lock.packages?.[dep.packageLockPath];
  assert.ok(entry, `MPA_METHOD_DEPENDENCY_LOCK_ENTRY_MISSING:${dep.package}`);
  assert.equal(entry.version, dep.version, `MPA_METHOD_DEPENDENCY_LOCK_VERSION_DRIFT:${dep.package}`);
  assert.equal(entry.integrity, dep.integrity, `MPA_METHOD_DEPENDENCY_INTEGRITY_DRIFT:${dep.package}`);
}
for (const name of deps.explicitNonMethodDependenciesExcludedFromMpa) {
  assert.equal(deps.methodDependencies.some(x => x.package === name), false, `NON_METHOD_DEPENDENCY_ENTERED_MPA:${name}`);
}
assert.equal(consolidation.status, 'ACTIVE_CURRENT_SINGLE_ENTRY_NO_REPOSITORY_FINGERPRINT_COUPLING');
assert.equal(consolidation.boundaries.productionEligibilityChanged, false);
assert.equal(consolidation.boundaries.productionExecutionChanged, false);
assert.equal(triggers.productionEligibilityChanged, false);

console.log('✓ MPA-W14 Current Method-scoped Regression Runtime passed.');
console.log('  Repository-wide package/PXR/BFR/visual fingerprints are retired from current MPA; only method algorithms, registries, policies and pinned method dependencies can trigger regression.');
