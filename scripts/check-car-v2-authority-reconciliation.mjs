import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const sha256 = async file =>
  crypto.createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
    .digest('hex');

const base = 'content/professional/canonical-asset-runtime';
const [audit, reconciliation, acceptance, authorityMap, planeClassification,
  slidesAcademy, websiteModule, providerIntegration, providerPolicy,
  candidate, review, approval, media, publication, publicationGate,
  surface, quality, pdsIntegration, fullAcceptance, freeze, cprReconciliation] =
  await Promise.all([
    readJson(`${base}/audits/car-v2-authority-reconciliation-v1.json`),
    readJson(`${base}/contracts/car-alr-cpr-authority-reconciliation-v1.json`),
    readJson(`${base}/audits/car-v2-reconciliation-acceptance-v1.json`),
    readJson('content/governance/operational-architecture/runtime-authority-map-v1.json'),
    readJson('content/governance/operational-architecture/runtime-plane-classification-v1.json'),
    readJson(`${base}/contracts/car-slides-academy-contract-v1.json`),
    readJson(`${base}/contracts/car-website-module-projection-v1.json`),
    readJson(`${base}/contracts/car-provider-routing-integration-v1.json`),
    readJson(`${base}/policies/car-provider-execution-policy-v1.json`),
    readJson(`${base}/contracts/car-asset-candidate-runtime-v1.json`),
    readJson(`${base}/contracts/car-independent-asset-review-v1.json`),
    readJson(`${base}/contracts/car-independent-asset-approval-v1.json`),
    readJson(`${base}/contracts/car-asset-media-registry-v1.json`),
    readJson(`${base}/contracts/car-asset-publication-runtime-v1.json`),
    readJson(`${base}/policies/car-asset-publication-gate-policy-v1.json`),
    readJson(`${base}/contracts/car-surface-projection-runtime-v1.json`),
    readJson(`${base}/policies/car-quality-drift-policy-v1.json`),
    readJson(`${base}/contracts/car-presentation-pds-integration-v1.json`),
    readJson(`${base}/contracts/car-full-acceptance-v1.json`),
    readJson(`${base}/freeze/car-w18-freeze-v1.json`),
    readJson('content/professional/canonical-presentation-runtime/audits/cpr-car-reconciliation-v1.json')
  ]);

assert.equal(audit.baselineCommit, 'd5266251b43fc1497ab60959203c7a21b129acdf');
assert.equal(audit.phaseStatus, 'PRESERVED');
assert.equal(audit.status, 'reconciled_delta_only');
for (const value of Object.values(audit.preservationFinding)) assert.equal(value, false);
for (const [file, digest] of Object.entries(audit.preservedArtifactDigests)) {
  assert.equal(await sha256(file), digest, `Preserved CAR authority artifact drifted: ${file}`);
}

const authorityByClass = Object.fromEntries(
  authorityMap.authorities.map(item => [item.authorityClass, item.sourceOfTruth])
);
assert.equal(authorityByClass.ASSET_PRODUCTION, 'CAR');
assert.equal(authorityByClass.LEARNING_CAPABILITY, 'ALR');
assert.equal(authorityByClass.PRESENTATION, 'CPR');
assert.ok(planeClassification.planes.RUNTIME.includes('CAR'));
assert.ok(planeClassification.planes.RUNTIME.includes('ALR'));
assert.ok(planeClassification.planes.PRESENTATION.includes('CPR'));
assert.equal(reconciliation.authorityModel.CAR.canonicalRole, 'Asset Production Authority');
assert.equal(reconciliation.authorityModel.ALR.canonicalRole, 'Learning Runtime');
assert.equal(reconciliation.authorityModel.CPR.canonicalRole, 'Presentation Runtime');

const w7 = reconciliation.workInterpretation['CAR-W7'];
assert.deepEqual(w7.outputs, ['Lesson Brief', 'Slides Brief', 'Quiz Brief', 'Assignment Brief']);
assert.deepEqual(w7.outputs, slidesAcademy.outputs);
for (const value of Object.values(w7.equations)) assert.equal(value, false);
for (const value of Object.values(w7.rules)) assert.equal(value, false);
assert.equal(reconciliation.authorityModel.ALR.activationState, 'NOT_ACTIVATED_BY_THIS_RECONCILIATION');

const w8 = reconciliation.workInterpretation['CAR-W8'];
assert.equal(websiteModule.invariants.publishedOnly, true);
assert.equal(websiteModule.invariants.candidateAssetReadable, false);
for (const value of Object.values(w8.rules)) assert.equal(value, false);

const requiredProviderFlags = {
  providersEnabled: false,
  networkCallsEnabled: false,
  paidOverageDisabled: true,
  providerMayCreatePublishedContent: false
};
assert.deepEqual(reconciliation.workInterpretation['CAR-W9'].effectiveFlags, requiredProviderFlags);
for (const [flag, expected] of Object.entries(requiredProviderFlags)) {
  assert.equal(providerIntegration.effectiveFlags[flag], expected, `CAR-W9 integration flag drift: ${flag}`);
  assert.equal(providerPolicy[flag], expected, `CAR-W9 execution flag drift: ${flag}`);
}

const expectedLifecycle = [
  'Asset Brief',
  'Candidate',
  'Independent Review',
  'Independent Approval',
  'Rights Gate',
  'Accessibility Gate',
  'Published Asset'
];
assert.deepEqual(reconciliation.workInterpretation['CAR-W10-W14'].chain, expectedLifecycle);
assert.equal(candidate.invariants.candidateMaySelfApprove, false);
assert.equal(review.invariants.reviewIsApproval, false);
assert.equal(approval.invariants.approvalIsPublication, false);
assert.equal(media.invariants.mediaRegistrationIsPublication, false);
assert.deepEqual(publication.chain, expectedLifecycle.slice(1));
assert.equal(publicationGate.failClosed, true);
assert.equal(publicationGate.providerMayCreatePublishedContent, false);

const w15w17 = reconciliation.workInterpretation['CAR-W15-W17'];
assert.equal(w15w17.canonicalInterpretation, 'Published Asset Eligibility / Projection');
assert.equal(w15w17.downstreamAuthority, 'CPR Canonical Presentation');
assert.equal(w15w17.rules.carMayDetermineSurfaceEligibility, true);
assert.equal(w15w17.rules.carMayProjectPublishedAssetReferences, true);
for (const key of [
  'carMayCreateCanonicalPresentation',
  'carMayComposePresentation',
  'carMayOwnLayout',
  'carMayMapPdsTokens',
  'carMayRenderSurface',
  'cprMayRecomputeCarPublicationState',
  'cprMayExpandCarPublicationEligibility'
]) assert.equal(w15w17.rules[key], false, `CAR/CPR authority drift: ${key}`);
assert.equal(surface.rules.sourceMustAlreadyBePublishedForSameSurface, true);
assert.equal(surface.rules.candidateOrApprovedOnlyAssetReadable, false);
assert.ok(quality.failClosedOn.includes('accessibility'));
assert.ok(quality.failClosedOn.includes('rightsStatus'));
assert.equal(pdsIntegration.rules.pdsMayChangeMeaning, false);
assert.equal(cprReconciliation.rules.carPublicationStateIsNeverRecomputed, true);
assert.equal(cprReconciliation.rules.cprSurfaceRegistryDoesNotExpandCarPublicationEligibility, true);

assert.equal(fullAcceptance.status, 'frozen');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.productionActivationAllowed, false);
assert.equal(reconciliation.workInterpretation['CAR-W18'].rules.replacementFreezeCreated, false);
assert.equal(acceptance.replacementFreezeCreated, false);
assert.equal(acceptance.existingRuntimeDataMutated, false);
assert.equal(acceptance.alrRuntimeActivated, false);
assert.ok(acceptance.acceptanceGates.every(gate => gate.status === 'PASS'));
assert.ok(reconciliation.handoffs.every(handoff =>
  handoff.writeThroughAllowed === false && handoff.authorityTransferAllowed === false
));
for (const value of Object.values(reconciliation.invariants)) assert.equal(value, false);

console.log('✓ CAR v2 Authority Reconciliation passed.');
console.log('✓ CAR remains Asset Production Authority; ALR remains Learning Runtime; CPR remains Presentation Runtime.');
console.log('✓ CAR-W7 Lesson/Slides/Quiz/Assignment Briefs cannot create ALR learning or capability state.');
console.log('✓ CAR-W15-W17 resolve only Published Asset Eligibility / Projection; CPR owns Canonical Presentation.');
console.log('✓ CAR-W7-W18 and the existing CAR-W18 Freeze remain byte-preserved; provider and production activation stay disabled.');
