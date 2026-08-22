import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);

const freeze = read('content/governance/current-system-baseline/current-system-baseline-freeze-v1.json');
const baseline = read('content/governance/current-system-baseline/current-system-baseline-v1.json');
const lifecycle = read('content/governance/current-authority-reconciliation/carc-w6-checker-lifecycle-registry-v1.json');
const currentAuthority = read('content/governance/current-authority-reconciliation/current-authority-successor-registry-v1.json');
const pkg = read('package.json');

assert.equal(freeze.status, 'FROZEN_CBS_W0_W8');
assert.equal(freeze.baselineCommit, '1fcbb4216db77cbc6d0e2cabb85dafcce1488bdf');
for (const item of freeze.frozenArtifacts) {
  assert.ok(exists(item.path), `Missing frozen CBS artifact: ${item.path}`);
  assert.equal(sha(item.path), item.sha256, `Historical CBS artifact mutated: ${item.path}`);
}
assert.equal(sha('package-lock.json'), baseline.digests.packageLock.sha256, 'package-lock drifted beyond CBS baseline');
assert.equal(lifecycle.historicalFreeze.checkerSha256, sha('scripts/check-current-system-baseline.mjs'));
assert.equal(lifecycle.historicalFreeze.preserved, true);
assert.equal(currentAuthority.baselineCommit, '3e4f22cf33e55a93b4eaf9764ab17202acf3b844');
assert.equal(currentAuthority.summary.duplicateCurrentDomainCount, 0);
assert.equal(currentAuthority.summary.unknownProductionAuthorityCount, 0);

assert.equal(pkg.scripts['check:current-system-baseline'], 'node scripts/check-current-system-baseline.mjs');
assert.equal(pkg.scripts['check:current-system-baseline-historical'], 'node scripts/check-current-system-baseline.mjs');
assert.equal(pkg.scripts['check:current-system-baseline-current'], 'node scripts/check-current-system-baseline-current.mjs');
assert.notEqual(pkg.scripts['check:current-system-baseline-current'], pkg.scripts['check:current-system-baseline']);

for (const authority of currentAuthority.authorities) {
  assert.ok(authority.currentFile && exists(authority.currentFile), `Missing current authority file for ${authority.authorityId}`);
  assert.equal(sha(authority.currentFile), authority.currentSha256, `Current authority drift: ${authority.authorityId}`);
  assert.ok(authority.productionStatus && !/UNKNOWN/.test(authority.productionStatus), `Unknown current production status: ${authority.authorityId}`);
}

console.log('✓ CURRENT SYSTEM BASELINE successor passed.');
console.log(`  Historical CBS ${freeze.baselineCommit.slice(0, 7)} remains byte-stable; package evolution is isolated by CARC-W6.`);
console.log(`  ${currentAuthority.summary.authorityCount} current authorities across ${currentAuthority.summary.domainCount} unique domains; 0 unknown production authority.`);
