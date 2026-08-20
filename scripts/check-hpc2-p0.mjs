import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const exists = path => fs.existsSync(path);
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const files = {
  intake: 'content/web/homepage/hpc2/homepage-capability-intake-v1.json',
  contract: 'content/web/homepage/hpc2/contracts/hpc2-p0-successor-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-p0-baseline-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-p0-capability-intake-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-p0-capability-intake-freeze-v1.json',
  h0: 'content/web-production/bfr-backend-capability-inventory-v1.json',
  h7: 'content/web-production/bfr-homepage-recomposition-requirement-v1.json',
  preFinal: 'content/web/homepage/hpc2-pre/hpc2-pre-final-readiness-v1.json',
  preBoundary: 'content/web/homepage/hpc2-pre/hpc2-pre-authority-boundary-v1.json',
  inv: 'content/web-production/contracts/client-surface-global-invariants-v1.json'
};

for (const path of Object.values(files)) assert.ok(exists(path), `Missing HPC2-P0 dependency: ${path}`);

const intake = read(files.intake);
const contract = read(files.contract);
const evidence = read(files.evidence);
const acceptance = read(files.acceptance);
const freeze = read(files.freeze);
const h0 = read(files.h0);
const h7 = read(files.h7);
const preFinal = read(files.preFinal);
const preBoundary = read(files.preBoundary);
const invariants = read(files.inv);

assert.equal(intake.work, 'HPC2-P0');
assert.equal(intake.status, 'HPC2_P0_CAPABILITY_INTAKE_READY_NO_COMPOSITION_AUTHORITY');
assert.deepEqual(intake.homepageDepthEnum, ['PRIMARY', 'TEASER', 'DISCOVERY', 'VISUAL', 'NONE_BY_DESIGN']);
assert.deepEqual(intake.consumerStateEnum, ['ACTIVE', 'PARTIAL', 'MISSING', 'NONE_BY_DESIGN']);
assert.equal(intake.recordCount, 13);
assert.equal(intake.records.length, intake.recordCount);
assert.equal(new Set(intake.records.map(record => record.capabilityCode)).size, intake.recordCount);

const requiredFields = [
  'capabilityCode', 'authoritySource', 'expectedSurface', 'homepageRole',
  'requiredVisibility', 'homepageDepth', 'actualScene', 'consumerState'
];
for (const record of intake.records) {
  for (const field of requiredFields) assert.ok(Object.hasOwn(record, field), `${record.capabilityCode} missing ${field}`);
  assert.ok(exists(record.authoritySource), `${record.capabilityCode} authority source missing`);
  assert.equal(record.expectedSurface, 'HOMEPAGE');
  assert.equal(record.requiredVisibility, true);
  assert.ok(intake.homepageDepthEnum.includes(record.homepageDepth));
  assert.ok(intake.consumerStateEnum.includes(record.consumerState));
  assert.equal(record.actualScene, null, `${record.capabilityCode} prematurely assigned to a final scene`);
  assert.ok(Array.isArray(record.lineageCodes) && record.lineageCodes.length > 0, `${record.capabilityCode} missing BFR lineage`);
}

assert.deepEqual(
  Object.fromEntries(intake.consumerStateEnum.map(state => [state, intake.records.filter(record => record.consumerState === state).length])),
  intake.currentConsumerSummary
);
assert.deepEqual(intake.records.filter(record => record.consumerState === 'MISSING').map(record => record.capabilityCode), ['ASK_PHIOS']);

const intakeCodes = new Set(intake.records.map(record => record.capabilityCode));
for (const requirement of h7.requiredCapabilities) {
  assert.ok(intakeCodes.has(requirement.capabilityCode), `BFR-H7 Homepage requirement omitted: ${requirement.capabilityCode}`);
}
assert.deepEqual(intake.requiredBfrH7CompositeCoverage, h7.requiredCapabilities.map(record => record.capabilityCode));

const h0ByCode = new Map(h0.records.map(record => [record.capabilityCode, record]));
const lineageCodes = new Set(intake.records.flatMap(record => record.lineageCodes));
const directHomepageExpected = h0.records.filter(record => record.expectedSurface.includes('HOMEPAGE'));
assert.equal(directHomepageExpected.length, 14);
for (const capability of directHomepageExpected) {
  assert.ok(lineageCodes.has(capability.capabilityCode), `H0 Homepage expectation has no HPC2-P0 intake lineage: ${capability.capabilityCode}`);
}
for (const code of lineageCodes) {
  if (code === 'HOMEPAGE') continue;
  assert.ok(h0ByCode.has(code), `Unknown H0 lineage code: ${code}`);
}

assert.equal(preFinal.state, 'HPC2_PRE_READY');
assert.equal(preFinal.counts.criticalHumanAccepted, 16);
assert.equal(preFinal.counts.criticalRemoteVerified, 16);
assert.equal(preFinal.gates.customerVisibleDelta, true);
assert.ok(preBoundary.doesNotOwn.includes('FINAL_9_SCENE_DOM_COMPOSITION'));
assert.equal(preBoundary.secondResolverAllowed, false);
assert.equal(intake.actualScenePolicy.finalNineSceneAuthorityEstablished, false);
assert.equal(intake.exitGate.finalNineSceneAuthorityClaimed, false);
assert.equal(intake.exitGate.homepageRuntimeCreated, false);
assert.equal(intake.exitGate.routeActivated, false);
assert.equal(intake.exitGate.humanDecisionCreated, false);

assert.equal(invariants.invariants.find(item => item.code === 'INV-10').sourceArtifact, 'PHIOS-market-positioning-founder-v8-no-pricing.html');
assert.equal(evidence.baselineFacts.v8SourceArtifactPresentInRepository, false);
assert.equal(evidence.migrationNotDeletion.deletionAllowedFromHomepage, false);
assert.equal(evidence.migrationNotDeletion.migrationState, 'BLOCKED_PENDING_HPC2_W0_SOURCE_INGEST_AND_SUCCESSOR_VERIFICATION');
assert.equal(evidence.currentHomepage.sectionCount, 7);
assert.equal(evidence.currentHomepage.localeOwnership.missingEnKeys, 0);
assert.equal(evidence.currentHomepage.localeOwnership.missingZhHansKeys, 0);
assert.equal(evidence.boundaryFinding.indexHtmlModifiedByHpc2P0, false);
assert.equal(evidence.boundaryFinding.homeProductionJsModifiedByHpc2P0, false);

assert.equal(contract.status, 'ACTIVE_ADDITIVE_SUCCESSOR_NO_HOMEPAGE_RUNTIME_CREATED');
assert.equal(contract.successorRules.additiveSuccessorOnly, true);
assert.equal(contract.successorRules.secondHomepageRuntimeForbidden, true);
assert.equal(contract.successorRules.secondAssetResolverForbidden, true);
assert.equal(contract.successorRules.finalSceneAssignmentBeforeHpc2W1Forbidden, true);
assert.equal(contract.successorRules.realityRouteActivationOwnedHere, false);
assert.equal(contract.minimumContinuousExecutionOrder[0], 'HPC2-P0_CAPABILITY_INTAKE');
assert.equal(contract.minimumContinuousExecutionOrder[1], 'HPC2-W0_V8_CONTENT_PRESERVATION_FREEZE');
assert.equal(contract.minimumContinuousExecutionOrder[2], 'HPC2-W1_SINGLE_NARRATIVE_AND_9_SCENE_AUTHORITY');

assert.equal(acceptance.status, 'HPC2_P0_REPOSITORY_IMPLEMENTED_MACHINE_ACCEPTED_NO_COMPOSITION_OR_ROUTE_ACTIVATION');
assert.equal(acceptance.acceptedFacts.bfrH7RequirementCoverage, '10/10');
assert.equal(acceptance.acceptedFacts.h0DirectHomepageExpectationCoverage, '14/14');
assert.equal(acceptance.acceptedFacts.finalSceneAssignmentsCreated, 0);
assert.equal(acceptance.acceptedFacts.finalNineSceneAuthorityEstablished, false);
assert.equal(acceptance.acceptedFacts.v8PreservationClaimedComplete, false);
assert.equal(acceptance.acceptedFacts.humanDecisionCreated, false);
assert.equal(acceptance.acceptedFacts.globalProductionAcceptanceClaimed, false);

assert.equal(freeze.status, 'HPC2_P0_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const item of freeze.frozenOutputs) {
  assert.ok(exists(item.path), `Frozen HPC2-P0 output missing: ${item.path}`);
  assert.equal(sha256(item.path), item.sha256, `Frozen HPC2-P0 output drift: ${item.path}`);
}

const pkg = read('package.json');
assert.equal(pkg.scripts['check:hpc2-p0'], 'node scripts/check-hpc2-p0.mjs');
assert.equal(pkg.scripts['check:hpc2'], 'npm run check:hpc2-pre-ready && npm run check:hpc2-p0');
assert.equal(pkg.scripts['check:bfr-h-current'], 'node scripts/check-bfr-h-current.mjs');
assert.equal(pkg.scripts['check:bfr-h'], 'npm run check:client-surface-invariants && npm run check:bfr-h-current && npm run check:hpc2-p0');

console.log('✓ HPC2-P0 Homepage Capability Intake passed: 13 requirements, BFR-H7 10/10, H0 Homepage lineage 14/14.');
console.log('✓ Current baseline remains explicit: ACTIVE 9, PARTIAL 3, MISSING ASK_PHIOS 1; no silent promotion.');
console.log('✓ FINAL 9-scene authority, V8 preservation completion, /reality/ activation and Human decision remain unclaimed.');
console.log('✓ Existing Homepage consumer, locale ownership, visual registry and single public asset resolver are preserved.');
