import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readText = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const readJson = path => JSON.parse(readText(path));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const contractPath = 'content/web-production/final-client-experience/contracts/part-k-final-freeze-contract-v1.json';
const acceptancePath = 'content/web-production/final-client-experience/acceptance/part-k-final-freeze-acceptance-v1.json';
const freezePath = 'content/web-production/final-client-experience/freeze/part-k-client-surface-final-freeze-v1.json';
for (const path of [contractPath, acceptancePath, freezePath]) assert.ok(fs.existsSync(path), `PART K artifact missing: ${path}`);

const contract = readJson(contractPath);
const acceptance = readJson(acceptancePath);
const freeze = readJson(freezePath);

assert.equal(contract.work, 'PART-K');
assert.equal(contract.status, 'CLIENT_SURFACE_FINAL_MASTER_WORK_FREEZE_CONTRACT_ACTIVE');
assert.equal(contract.masterWork, 'PHI OS Client Surface Production Final Master Work v1.0');
assert.deepEqual(contract.definitions, {
  'BFR-H': 'Backend-to-Frontend Reconciliation & Production Consumption',
  HPC2: 'Homepage Narrative & Production Composition',
  CKA: 'Ask PHI OS Client Knowledge Ask Surface'
});
assert.deepEqual(contract.relationship, {
  'BFR-H': 'decides what must be consumed',
  HPC2: 'decides how Homepage composes it',
  CKA: 'decides how the client asks and receives grounded knowledge'
});
assert.equal(contract.freezeScope.clientExperienceContract, true);
assert.equal(contract.freezeScope.repositoryIntegration, true);
assert.equal(contract.freezeScope.machineBrowserResponsiveAcceptance, true);
assert.equal(contract.freezeScope.historicalFrozenArtifactsRewritten, false);
assert.equal(contract.freezeScope.liveAssistiveTechnologyAcceptance, false);
assert.equal(contract.freezeScope.humanVisualAcceptance, false);
assert.equal(contract.freezeScope.deploymentShaAcceptance, false);
assert.equal(contract.freezeScope.customDomainAcceptance, false);
assert.equal(contract.freezeScope.globalProductionAcceptance, false);
assert.equal(contract.successConditions.length, 9);

const bfr = readJson('content/web-production/acceptance/bfr-production-surface-acceptance-v1.json');
const hpc2 = readJson('content/web/homepage/hpc2/acceptance/homepage-composition-acceptance-v2.json');
const cka = readJson('content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json');
const partI = readJson('content/web-production/regression/bfr-h-critical-regression-contract-v1.json');
const partJ = readJson('content/web-production/final-client-experience/acceptance/part-j-final-client-experience-acceptance-v1.json');
const pocA10 = readJson('content/web-production/production-operational-closure/poc-a/acceptance/poc-a10-live-responsive-matrix-acceptance-v1.json');
assert.equal(bfr.status, contract.requiredPredecessorStates['BFR-H16']);
assert.equal(hpc2.status, contract.requiredPredecessorStates['HPC2-W14']);
assert.equal(cka.status, contract.requiredPredecessorStates['CKA-W33']);
assert.equal(partI.status, contract.requiredPredecessorStates['PART-I']);
assert.equal(partJ.status, contract.requiredPredecessorStates['PART-J']);
assert.equal(pocA10.status, contract.requiredPredecessorStates['POC-A10']);

assert.equal(acceptance.status, 'PART_K_CLIENT_SURFACE_FINAL_FREEZE_ACCEPTED_WITH_LIVE_BOUNDARIES_PRESERVED');
assert.equal(acceptance.accepted, true);
assert.deepEqual(acceptance.integratedSystems, ['BFR-H','HPC2','CKA']);
for (const [gate, value] of Object.entries(acceptance.checks)) assert.equal(value, true, `PART K acceptance gate failed: ${gate}`);
assert.equal(acceptance.liveAcceptanceBoundary.pocA10Responsive, 'ACCEPTED_182_OF_182_MACHINE_BROWSER_SCOPE');
assert.equal(acceptance.liveAcceptanceBoundary.accessibilityAssistiveTechnology, 'SEPARATE_REVALIDATION_REQUIRED');
assert.equal(acceptance.liveAcceptanceBoundary.globalProduction, 'NOT_CLAIMED');
assert.equal(acceptance.globalProductionAccepted, false);
assert.equal(acceptance.freezeReady, true);

assert.equal(freeze.schemaVersion, 'PHI-OS-PART-K-CLIENT-SURFACE-FINAL-FREEZE-v1.0.0');
assert.equal(freeze.work, 'PART-K');
assert.equal(freeze.status, 'FROZEN_CLIENT_SURFACE_FINAL_MASTER_WORK_REPOSITORY_PLUS_POC_A10_RESPONSIVE_SCOPE');
assert.equal(freeze.masterWork, contract.masterWork);
assert.equal(freeze.globalProductionAccepted, false);
assert.equal(freeze.authorityRelationshipFrozen, true);
assert.equal(freeze.successorRequiredForChange, true);
assert.ok(Array.isArray(freeze.immutableArtifacts) && freeze.immutableArtifacts.length >= 16, 'PART K freeze artifact set is unexpectedly small');
for (const artifact of freeze.immutableArtifacts) {
  assert.ok(fs.existsSync(artifact.path), `PART K frozen artifact missing: ${artifact.path}`);
  assert.equal(sha256(artifact.path), artifact.sha256, `PART K frozen artifact drift: ${artifact.path}`);
}
assert.equal(freeze.liveAcceptanceBoundary.pocA10ResponsiveAccepted, true);
assert.equal(freeze.liveAcceptanceBoundary.pocA10StateCount, 182);
assert.equal(freeze.liveAcceptanceBoundary.accessibilityAssistiveTechnologyAccepted, false);
assert.equal(freeze.liveAcceptanceBoundary.humanVisualAccepted, false);
assert.equal(freeze.liveAcceptanceBoundary.deploymentShaAccepted, false);
assert.equal(freeze.liveAcceptanceBoundary.customDomainAccepted, false);
assert.equal(freeze.liveAcceptanceBoundary.globalProductionAccepted, false);

const pkg = readJson('package.json');
assert.equal(pkg.scripts['check:part-j'], 'node scripts/check-part-j-final-client-experience.mjs');
assert.equal(pkg.scripts['check:part-k'], 'node scripts/check-part-k-final-freeze.mjs');
assert.equal(pkg.scripts['check:client-surface-final'], 'npm run check:bfr-h && npm run check:part-j && npm run check:part-k');
assert.equal(pkg.scripts['check:client-surface-production-final'], 'npm run check:client-surface-final');

console.log('✓ PART K Final Freeze passed.');
console.log('  BFR-H = what must be consumed; HPC2 = Homepage composition; CKA = grounded Ask client surface.');
console.log('  PART J client experience is frozen with predecessor authorities and current client surfaces digest-bound.');
console.log('  POC-A10 responsive acceptance remains 182/182 machine-browser scope; A11/live assistive-tech, Human visual, deployment SHA/custom-domain and global Production acceptance remain separate successor gates.');
