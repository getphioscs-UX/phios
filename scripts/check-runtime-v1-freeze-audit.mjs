import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const audit = read('content/registry/runtime-v1-freeze-audit.json');
const acceptance = read('content/registry/runtime-v1-acceptance.json');
const bugs = read('content/registry/runtime-bugs.json');
const freeze = read('content/registry/runtime-freeze-audit.json');
const provider = read('content/registry/provider-closure.json');

assert.equal(audit.release, 'runtime-engine-v1.0.0');
assert.match(audit.auditedCommit, /^[0-9a-f]{7,40}$/);
assert.equal(audit.production.status, 'passed');
assert.match(audit.production.deploymentUrl, /^https:\/\/[a-z0-9-]+\.phios-github\.pages\.dev$/);
assert.equal(audit.automatedGates.npmCheck, 'passed');
assert.equal(audit.automatedGates.fullJourneyCases, 36);
assert.equal(audit.automatedGates.p0Open, 0);
assert.equal(audit.automatedGates.p1Open, 0);
assert.equal(bugs.openCounts.P0, 0);
assert.equal(bugs.openCounts.P1, 0);
assert.equal(freeze.decision, 'freeze_ready');
assert.equal(freeze.newRuntimeStagesAllowed, false);
assert.equal(provider.status, 'closed');
assert.equal(acceptance.release, audit.release);

const expectedJourney = [
  'entry', 'reconstruction', 'return_to_entry', 'edit', 'reading',
  'navigation', 'review', 'memory', 'continuity'
];
assert.deepEqual(audit.requiredJourney, expectedJourney);

const deployedStatuses = Object.values(audit.deployedAcceptance);
const invalidStatus = deployedStatuses.find(status => !['pending', 'passed', 'failed'].includes(status));
assert.equal(invalidStatus, undefined, 'Unknown deployed acceptance status.');
const allDeployedPassed = deployedStatuses.every(status => status === 'passed');

if (audit.status === 'passed') {
  assert.equal(allDeployedPassed, true, 'Final freeze audit cannot pass while deployed acceptance is pending.');
  assert.equal(audit.decision, 'freeze_audited');
} else {
  assert.equal(audit.status, 'deployed_acceptance_pending');
  assert.equal(audit.decision, 'release_candidate');
  assert.equal(audit.tag.created, false, 'Do not create the Runtime v1 tag before deployed acceptance passes.');
}

console.log('✓ M1-W7 Runtime Freeze Audit gates are structurally valid.');
if (allDeployedPassed) {
  console.log('  Deployed acceptance passed; Runtime v1.0.0 is eligible for the final freeze tag.');
} else {
  console.log(`  Release candidate ${audit.auditedCommit}: Production deployed; ${deployedStatuses.filter(status => status === 'pending').length} deployed acceptance gates pending.`);
}
