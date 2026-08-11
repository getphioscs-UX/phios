import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildVapW5Acceptance, stableJson, VAP_W5_ACCEPTANCE, VAP_W5_BASELINE, VAP_W5_CONTRACT } from './lib/visual-article-production/pja-production-brief-export-acceptance-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const contract = readJson(VAP_W5_CONTRACT);
const actual = readJson(VAP_W5_ACCEPTANCE);
const expected = buildVapW5Acceptance(root);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W5-PJA-PRODUCTION-BRIEF-EXPORT-v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.implementationBaselineCommit, VAP_W5_BASELINE);
assert.equal(contract.existingRuntime.runtimeMustNotBeReimplemented, true);
assert.equal(contract.eligibilityBoundary.vapW4EligibilityRequired, true);
assert.equal(contract.eligibilityBoundary.vapW3AdapterRequirementMayNotBeBypassed, true);

assert.equal(stableJson(actual), stableJson(expected), 'VAP-W5 acceptance must rebuild deterministically from the accepted PJA runtime and current VAP-W4 eligibility output.');
assert.equal(actual.status, 'EXISTING_PJA_PRODUCTION_BRIEF_EXPORT_ACCEPTED_NO_REIMPLEMENTATION');
assert.equal(actual.existingRuntime.npmScript, 'knowledge:export-brief');
assert.equal(actual.existingRuntime.defaultOutputDirectory, 'dist/knowledge-production-briefs');
assert.equal(actual.existingRuntime.runtimeReimplementedByVapW5, false);
assert.equal(actual.briefContract.allRequiredMarkersPresent, true);
assert.equal(actual.briefContract.controlledInputSnapshotOnly, true);
assert.equal(actual.briefContract.sourceOfTruth, false);
assert.equal(actual.briefContract.approvalRecord, false);
assert.equal(actual.briefContract.publicationRecord, false);
assert.deepEqual(actual.vapEligibilityIntegration.wave1ArticleEligibleNodeCodes, ['KN-PREFACE-004', 'KN-B1-P4-004']);
assert.deepEqual(actual.vapEligibilityIntegration.wave1StandardPjaExporterTargetNodeCodes, []);
assert.deepEqual(actual.vapEligibilityIntegration.wave1PjaAdapterGatedNodeCodes, ['KN-PREFACE-004']);
assert.deepEqual(actual.vapEligibilityIntegration.wave1NonPjaEligibleNodeCodes, ['KN-B1-P4-004']);
assert.equal(actual.vapEligibilityIntegration.noWave1StandardPjaExportExecutedByVapW5, true);
assert.equal(actual.effects.productionBriefGeneratedByAcceptance, false);
assert.equal(actual.effects.candidateCreated, false);
assert.equal(actual.effects.providerInvoked, false);
assert.equal(actual.effects.publicationCreated, false);

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['knowledge:export-brief'], 'node scripts/export-knowledge-production-brief.mjs');
assert.equal(packageJson.scripts['build:vap-w5'], 'node scripts/build-vap-w5-pja-production-brief-export-acceptance.mjs');
assert.equal(packageJson.scripts['check:vap-w5'], 'node scripts/check-vap-w5-pja-production-brief-export.mjs');
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-w5'));
assert.equal(packageJson.scripts['check:vap'], 'npm run check:vap-w0');

console.log('✓ VAP-W5 PJA Production Brief Export acceptance passed.');
console.log('✓ Existing knowledge:export-brief remains the only accepted PJA Canonical Article Production Brief exporter; VAP-W5 does not reimplement it.');
console.log('✓ Default output remains dist/knowledge-production-briefs and the brief retains Identity, Thesis, Boundary, Editorial, Structure, Claims, Sources, Review and Package governance.');
console.log('✓ VAP-W4 eligibility is required, and VAP-W3 reconciliation/CAR adapter boundaries cannot be bypassed.');
console.log('✓ No Candidate, Provider invocation, network generation call or Publication is created by VAP-W5 acceptance.');
