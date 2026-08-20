import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists = path => fs.existsSync(path);

const reconciliationPath = 'content/web-production/reconciliation/bfr-h-part-a-7e2b212-current-source-successor-v1.json';
const acceptancePath = 'content/web-production/acceptance/bfr-h-part-a-acceptance-v1.json';
const freezePath = 'content/web-production/freeze/bfr-h-part-a-freeze-v1.json';
const h0Path = 'content/web-production/bfr-backend-capability-inventory-v1.json';
const h1Path = 'content/web-production/bfr-frontend-surface-inventory-v1.json';
const h2Path = 'content/web-production/bfr-capability-surface-gap-matrix-v1.json';
const h3Path = 'content/web-production/surface-production-manifest-v1.json';
const h11Path = 'content/web-production/bfr-r2-visual-consumption-v1.json';
const publicAssetsPath = 'content/registry/public-assets.json';
const hpc2PreR2SuccessorPath = 'content/web-production/reconciliation/wpr-w7-w10-hpc2-pre-successor-v1.json';
const prePath = 'content/web/homepage/hpc2-pre/hpc2-pre-final-readiness-v1.json';

for (const path of [reconciliationPath, acceptancePath, freezePath, h0Path, h1Path, h2Path, h3Path, h11Path, publicAssetsPath, hpc2PreR2SuccessorPath, prePath]) {
  assert.ok(exists(path), `Missing BFR-H current dependency: ${path}`);
}

const reconciliation = read(reconciliationPath);
const acceptance = read(acceptancePath);
const freeze = read(freezePath);
const h0 = read(h0Path);
const h1 = read(h1Path);
const h2 = read(h2Path);
const h3 = read(h3Path);
const h11 = read(h11Path);
const publicAssets = read(publicAssetsPath);
const hpc2PreR2Successor = read(hpc2PreR2SuccessorPath);
const pre = read(prePath);

assert.equal(reconciliation.status, 'ADDITIVE_CURRENT_SOURCE_SUCCESSOR_ACTIVE_HISTORICAL_EVIDENCE_PRESERVED');
assert.equal(reconciliation.historicalBaselineCommit, '3b5ff152d1cdfe479ed4daf7c772e3faa926dc17');
assert.equal(reconciliation.currentBaselineCommit, '7e2b21290d6f4a628f034533a5ca4b89c144db8f');
assert.equal(reconciliation.historicalArtifactsRewritten, false);
assert.equal(reconciliation.historicalCheckerRewritten, false);
assert.equal(reconciliation.snapshotPolicy.currentDriftAllowedOnlyWhenExplicitlyReconciled, true);
assert.equal(reconciliation.snapshotPolicy.unknownCurrentDriftFailsClosed, true);

const allowedDrift = new Map(reconciliation.reconciledDrifts.map(item => [item.path, item]));
assert.equal(allowedDrift.size, 3);
const observedDrift = [];
for (const snapshot of h0.sourceSnapshot) {
  assert.ok(exists(snapshot.path), `Historical H0 source missing: ${snapshot.path}`);
  const currentSha256 = sha256(snapshot.path);
  if (currentSha256 === snapshot.sha256) continue;
  const successor = allowedDrift.get(snapshot.path);
  assert.ok(successor, `Unreconciled BFR-H0 current source drift: ${snapshot.path}`);
  assert.equal(successor.historicalSha256, snapshot.sha256, `Historical digest mismatch: ${snapshot.path}`);
  assert.equal(successor.currentSha256, currentSha256, `Current digest mismatch: ${snapshot.path}`);
  assert.equal(successor.authorityRecreated, false, `Authority recreation is forbidden: ${snapshot.path}`);
  observedDrift.push(snapshot.path);
}
assert.deepEqual(observedDrift.sort(), [...allowedDrift.keys()].sort(), 'Registered and observed BFR-H0 drifts differ');

assert.equal(h0.work, 'BFR-H0');
assert.equal(h0.recordCount, 56);
assert.equal(h0.records.length, 56);
assert.equal(new Set(h0.records.map(item => item.capabilityCode)).size, 56);
assert.equal(h0.authorityBoundary.newBackendAuthorityCreated, false);
assert.equal(h0.authorityBoundary.productionEligibilityChanged, false);
const h0Categories = new Set(h0.records.map(item => item.category));
for (const category of ['BOOKS', 'KNOWLEDGE', 'VISUAL', 'REALITY', 'METHOD', 'ACADEMY', 'SERVICES', 'PROFESSIONAL']) {
  assert.ok(h0Categories.has(category), `Missing H0 category: ${category}`);
}
const h0RequiredFields = [
  'capabilityCode', 'runtimeCode', 'authoritySource', 'productionState', 'dataSource',
  'endpoint', 'localeAvailability', 'audience', 'visualAssets', 'expectedSurface',
  'actualConsumer', 'consumerState'
];
const h0ConsumerStates = new Set(['ACTIVE', 'PARTIAL', 'MISSING', 'NONE_BY_DESIGN', 'DEPRECATED']);
for (const record of h0.records) {
  for (const field of h0RequiredFields) assert.ok(Object.hasOwn(record, field), `${record.capabilityCode} missing ${field}`);
  assert.ok(h0ConsumerStates.has(record.consumerState), `${record.capabilityCode} invalid consumer state`);
  assert.ok(Array.isArray(record.expectedSurface) && record.expectedSurface.length > 0, `${record.capabilityCode} missing intended surface`);
  if (typeof record.authoritySource === 'string' && !record.authoritySource.startsWith('/')) assert.ok(exists(record.authoritySource), `${record.capabilityCode} authority source missing`);
  if (typeof record.dataSource === 'string' && record.dataSource && !record.dataSource.startsWith('/')) assert.ok(exists(record.dataSource), `${record.capabilityCode} data source missing`);
}
assert.equal(h0.exitGate.invisibleCapabilitiesOmitted, false);
assert.equal(h1.work, 'BFR-H1');
assert.equal(h1.recordCount, 19);
assert.equal(h2.work, 'BFR-H2');
assert.equal(h2.records.length, 56);
assert.equal(h2.exitGate.silentOrphanCount, 0);
assert.equal(h3.work, 'BFR-H3');
assert.equal(h3.canonicalCurrentManifest, true);
assert.equal(h3.recordCount, 18);

for (let step = 1; step <= 14; step += 1) {
  if (step === 11) continue;
  const result = spawnSync(process.execPath, ['scripts/check-bfr-h-part-a.mjs', `BFR-H${step}`], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `Historical BFR-H${step} contract check failed`);
}

assert.equal(h11.work, 'BFR-H11');
assert.equal(h11.recordCount, 8);
assert.equal(h11.frontendIntegrationComplete, false);
assert.equal(h11.productionPromotionClaimed, false);
assert.equal(hpc2PreR2Successor.historicalRegisteredAssetObservation, 7);
assert.equal(hpc2PreR2Successor.preHpc2CurrentRegistryRecordCount, 8);
assert.equal(hpc2PreR2Successor.successorRules.registryMayAddConcreteMembersWithoutRewritingHistoricalObservation, true);
assert.equal(hpc2PreR2Successor.successorRules.existingAssetResolverRemainsSingleAuthority, true);
assert.equal(publicAssets.assets.length, 132);
assert.equal(pre.state, 'HPC2_PRE_READY');
assert.equal(pre.counts.plannedRegistryIdentities, 152);
assert.equal(pre.gates.noSecondAssetResolver, true);
assert.equal(pre.gates.customerVisibleDelta, true);

assert.equal(acceptance.partAExecutionComplete, true);
assert.deepEqual(acceptance.completedSteps, Array.from({length: 15}, (_, index) => `BFR-H${index}`));
assert.equal(acceptance.facts.duplicateAuthorityCreated, false);
assert.equal(acceptance.facts.pdsReopened, false);
assert.equal(acceptance.facts.cprReopened, false);
assert.equal(acceptance.facts.wprV1Reopened, false);
assert.equal(acceptance.exitGate.openGapsExplicitNotHidden, true);
assert.equal(acceptance.exitGate.fullProductionPromotion, false);
assert.equal(acceptance.facts.globalProductionAcceptanceClaimed, false);
assert.equal(acceptance.nextWork, 'HPC2-P0_BFR_H_HOMEPAGE_CAPABILITY_INTAKE');
assert.equal(freeze.globalProductionFreezeDeclared, false);
assert.equal(freeze.frozenBoundaries.pdsAuthority, false);
assert.equal(freeze.frozenBoundaries.cprAuthority, false);
assert.equal(freeze.frozenBoundaries.wprV1Authority, false);
assert.equal(freeze.successorRules.homepageNarrativeComposition, 'HPC2');
assert.equal(pre.state, 'HPC2_PRE_READY');
assert.equal(pre.gates.noDuplicateAuthority, true);
assert.equal(pre.gates.noSecondAssetResolver, true);
assert.equal(pre.gates.noPrematureRealityActivation, true);

assert.equal(reconciliation.boundaries.bfrH0H14DecisionPreserved, true);
assert.equal(reconciliation.boundaries.hpc2PreReadyPreserved, true);
assert.equal(reconciliation.boundaries.duplicateKnowledgeAuthorityCreated, false);
assert.equal(reconciliation.boundaries.duplicateAssetRegistryCreated, false);
assert.equal(reconciliation.boundaries.duplicateAssetResolverCreated, false);
assert.equal(reconciliation.boundaries.productionRouteActivated, false);
assert.equal(reconciliation.boundaries.humanDecisionCreated, false);
assert.equal(reconciliation.boundaries.globalProductionAcceptanceClaimed, false);

console.log('✓ BFR-H current successor passed: historical H0-H14 evidence preserved; 3/3 mutable source drifts explicitly reconciled.');
console.log('✓ Current foundation remains 56 backend capabilities, 19 frontend surfaces, 18 manifest surfaces, and zero silent H2 orphans.');
console.log('✓ Historical BFR-H11 8-record observation is preserved; HPC2-PRE reconciles the 132-member Public Asset Registry and 152-identity Visual Registry successor.');
console.log('✓ HPC2_PRE_READY is consumed as successor evidence without a second Knowledge, Asset Registry, Resolver or Homepage authority.');
