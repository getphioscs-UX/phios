import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildVapW4Eligibility, stableJson, VAP_W4_BASELINE, VAP_W4_CONTRACT, VAP_W4_ELIGIBILITY } from './lib/visual-article-production/node-production-eligibility-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const contract = readJson(VAP_W4_CONTRACT);
const actual = readJson(VAP_W4_ELIGIBILITY);
const expected = buildVapW4Eligibility(root);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W4-NODE-PRODUCTION-ELIGIBILITY-v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.implementationBaselineCommit, VAP_W4_BASELINE);
assert.deepEqual(contract.eligibleProductionRoles, ['ARTICLE', 'MULTI_ASSET']);
assert.ok(contract.preservedFailureCodes.includes('C2_THESIS_BOUNDARY_NOT_FROZEN'));
assert.equal(contract.boundary.eligibilityDoesNotResolveVapW3AdapterRequirements, true);

assert.equal(stableJson(actual), stableJson(expected), 'VAP-W4 eligibility must rebuild deterministically from the cdcb11b baseline authorities.');
assert.equal(actual.status, 'ARTICLE_PRODUCTION_ELIGIBILITY_ACTIVE');
assert.equal(actual.scope.evaluatedNodeCount, 4);
assert.equal(actual.scope.articleEligibleNodeCount, 2);
assert.deepEqual(actual.scope.articleEligibleNodeCodes, ['KN-PREFACE-004', 'KN-B1-P4-004']);
assert.deepEqual(actual.scope.supportingWaveOutputNodeCodes, ['KN-B1-P1-003', 'KN-B1-P4-003']);
assert.equal(actual.authorityGate.dispatchAllowed, true);
assert.equal(actual.authorityGate.candidateCreationAllowed, false);
assert.equal(actual.authorityGate.providerInvocationAllowed, false);
assert.equal(actual.authorityGate.publicationAllowed, false);
assert.equal(actual.invariants.c2ThesisBoundaryGatePreserved, true);
assert.equal(actual.invariants.c2ThesisBoundaryFailureCode, 'C2_THESIS_BOUNDARY_NOT_FROZEN');

for (const entry of actual.entries) {
  for (const gate of ['canonicalNodeExists','canonicalThesisFrozen','boundaryFrozen','productionReadinessPassed','humanProductionDecisionApproved','productionPlanFrozen','productionWaveFrozen','executionAuthorityValid','dispatchAllowed','localeSupported']) {
    assert.equal(entry.gates[gate], true, `${entry.nodeCode}: ${gate}`);
  }
  assert.equal(entry.executionBoundary.eligibilityDoesNotOverrideW3AdapterRequirement, true);
}

const preface = actual.entries.find(entry => entry.nodeCode === 'KN-PREFACE-004');
assert.equal(preface.articleProductionEligible, true);
assert.equal(preface.productionRole, 'ARTICLE');
assert.equal(preface.executionBoundary.standardPjaArticleDraftExporterAllowed, false);
assert.equal(preface.executionBoundary.adapterRequirement, 'PJA_EXISTING_ARTICLE_RECONCILIATION_BRIEF_ADAPTER_REQUIRED');

const multi = actual.entries.find(entry => entry.nodeCode === 'KN-B1-P4-004');
assert.equal(multi.articleProductionEligible, true);
assert.equal(multi.productionRole, 'MULTI_ASSET');
assert.equal(multi.dispatchTarget, 'CAR');

for (const code of ['KN-B1-P1-003', 'KN-B1-P4-003']) {
  const entry = actual.entries.find(item => item.nodeCode === code);
  assert.equal(entry.articleProductionEligible, false);
  assert.equal(entry.gates.productionRoleEligible, false);
  assert.ok(entry.failureCodes.includes('KPP_ROLE_NOT_ARTICLE_OR_MULTI_ASSET'));
  assert.equal(entry.eligibilityStatus, 'WAVE1_SUPPORTING_OUTPUT_NOT_ARTICLE_ELIGIBLE');
}

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['build:vap-w4'], 'node scripts/build-vap-w4-node-production-eligibility.mjs');
assert.equal(packageJson.scripts['check:vap-w4'], 'node scripts/check-vap-w4-node-production-eligibility.mjs');
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-w4'));
assert.equal(packageJson.scripts['check:vap'], 'npm run check:vap-w0');

console.log('✓ VAP-W4 Node Production Eligibility passed.');
console.log('✓ C2 frozen thesis/boundary, C3 production readiness, Human Production Decision, frozen plan/wave, execution authority and dispatch gates are preserved.');
console.log('✓ Wave 1 ARTICLE/MULTI_ASSET nodes eligible for Article Production: KN-PREFACE-004, KN-B1-P4-004.');
console.log('✓ FRAGMENT/FIGURE remain governed Wave 1 supporting outputs and are not misclassified as Article production roles.');
console.log('✓ Eligibility does not override VAP-W3 adapter requirements or open candidate/provider/publication authority.');
