import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  evaluateCapabilityDependencies,
  evaluateCapabilityEvidence,
  evaluateCapabilityGaps,
  evaluateCapabilityTransition,
  resolveCapabilityPrerequisites,
  validateCapabilityDependencyGraph,
  validateCapabilityRegistry
} from './lib/academy-learning-runtime/alr-capability-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto
  .createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-capability-reconciliation-v1.json`);
assert.equal(audit.baselineCommit, 'c1ded91129cea2e9406f49c5066fdf041df0c1eb');
assert.equal(audit.scope, 'ALR-W5-W9');
assert.deepEqual(audit.canonicalWork.map(item => item.workCode), [
  'ALR-W5', 'ALR-W6', 'ALR-W7', 'ALR-W8', 'ALR-W9'
]);
assert.equal(audit.baselineFindings.rdgAlrDataContractActivationState, 'RESERVED_NOT_IMPLEMENTED');
assert.equal(audit.implementationDecision.capabilityTransitionsMayBeEvaluatedWithoutMutation, true);
assert.equal(audit.implementationDecision.capabilityStateMayBePersisted, false);
assert.equal(audit.implementationDecision.learningRecommendationMayBeGenerated, false);
assert.equal(audit.implementationDecision.credentialOrEntitlementMayBeGranted, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:5|6|7|8|9)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), ['ALR-W5', 'ALR-W6', 'ALR-W7', 'ALR-W8', 'ALR-W9']);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const levels = await read(`${base}/registries/academy-level-registry-v1.json`);
const tracks = await read(`${base}/registries/learning-track-registry-v1.json`);
const capabilities = await read(`${base}/registries/capability-registry-v1.json`);
assert.equal(validateCapabilityRegistry(capabilities, levels), 'VALID_CAPABILITY_REGISTRY');
assert.deepEqual(capabilities.capabilities.map(item => item.capabilityCode), [
  'ALR-CAP-EVIDENCE-DISTINCTION',
  'ALR-CAP-BOUNDED-READING',
  'ALR-CAP-CONSTRAINT-AWARE-NAVIGATION',
  'ALR-CAP-REVIEW-CONTINUITY',
  'ALR-CAP-BOUNDED-PROFESSIONAL-FORMATION'
]);
assert.ok(capabilities.capabilities.every(item => item.capabilityCode.startsWith('ALR-CAP-')));
assert.ok(capabilities.capabilities.every(item => item.authorityReference === 'ALR'));
assert.ok(capabilities.capabilities.every(item => item.requiredEvidenceCriteria.length === 2));
assert.equal(capabilities.rules.academyLevelIsCapabilityState, false);
assert.equal(capabilities.rules.trackClassIsCapability, false);
assert.equal(capabilities.rules.assessmentScoreIsCapability, false);
assert.equal(capabilities.rules.alrLearningCapabilityIsPwsProfessionalCapability, false);
assert.equal(capabilities.rules.registryStoresLearnerData, false);
assert.equal(tracks.rules.trackClassIsTrackInstance, false);

const invalidCapabilityRegistry = structuredClone(capabilities);
invalidCapabilityRegistry.capabilities[0].capabilityCode = 'pws.capability.evidence_distinction';
assert.equal(validateCapabilityRegistry(invalidCapabilityRegistry, levels), 'INVALID_CAPABILITY_IDENTITY');

const graph = await read(`${base}/registries/capability-dependency-graph-v1.json`);
assert.equal(validateCapabilityDependencyGraph(capabilities, graph), 'VALID_ACYCLIC_GRAPH');
assert.deepEqual(resolveCapabilityPrerequisites(graph, 'ALR-CAP-EVIDENCE-DISTINCTION'), []);
assert.deepEqual(resolveCapabilityPrerequisites(graph, 'ALR-CAP-BOUNDED-READING'), [
  'ALR-CAP-EVIDENCE-DISTINCTION'
]);
assert.deepEqual(resolveCapabilityPrerequisites(graph, 'ALR-CAP-BOUNDED-PROFESSIONAL-FORMATION'), [
  'ALR-CAP-REVIEW-CONTINUITY'
]);
assert.equal(graph.rules.dependencyGrantsCapabilityState, false);
assert.equal(graph.rules.dependencyMayCrossIntoPwsNamespace, false);
assert.equal(evaluateCapabilityDependencies(graph, 'ALR-CAP-EVIDENCE-DISTINCTION', []), 'SATISFIED');
assert.equal(evaluateCapabilityDependencies(graph, 'ALR-CAP-BOUNDED-READING', [
  { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'SUPPORTED' }
]), 'SATISFIED');
assert.equal(evaluateCapabilityDependencies(graph, 'ALR-CAP-BOUNDED-READING', []), 'UNSATISFIED');
assert.equal(evaluateCapabilityDependencies(graph, 'ALR-CAP-BOUNDED-READING', [
  { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'DISPUTED' }
]), 'DISPUTED');

const cyclicGraph = structuredClone(graph);
cyclicGraph.edges.push({
  fromCapabilityCode: 'ALR-CAP-BOUNDED-PROFESSIONAL-FORMATION',
  toCapabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION',
  edgeType: 'REQUIRES'
});
assert.equal(validateCapabilityDependencyGraph(capabilities, cyclicGraph), 'CYCLIC_CAPABILITY_GRAPH');

const evidenceContract = await read(`${base}/contracts/capability-evidence-contract-v1.json`);
const rdgLearning = await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json');
const rdgEvidence = await read('content/governance/reality-data-governance/contracts/capability-evidence-boundary-v1.json');
assert.equal(evidenceContract.semanticAuthority, 'ALR');
assert.equal(evidenceContract.dataGovernanceAuthority, 'RDG');
assert.deepEqual(evidenceContract.acceptedRdgEligibilityDecisions, rdgEvidence.eligibilityOutputs);
assert.ok(rdgEvidence.evidenceRequiredInputs.every(field => evidenceContract.requiredEvidenceFields.includes(field)));
assert.equal(rdgLearning.rules.assessmentScoreIsCapability, false);
assert.equal(rdgLearning.rules.learningRecordMaySetCapabilityState, false);
assert.equal(rdgEvidence.rules.capabilityEvidenceIsCapabilityState, false);
assert.equal(evidenceContract.rules.alrMayOverrideRdgEligibility, false);
assert.equal(evidenceContract.rules.semanticEvaluationPersistsData, false);

const evidenceCapability = capabilities.capabilities[0];
const validEvidence = {
  capabilityEvidenceCode: 'ALR-CAPE-EVIDENCE-DISTINCTION-001',
  capabilityReference: evidenceCapability.capabilityCode,
  learningRecordReference: 'RDG-LEARNING-RECORD-001',
  practiceReference: 'ALR-PRACTICE-001',
  assessmentReference: 'ALR-ASSESSMENT-001',
  criterionResults: evidenceCapability.requiredEvidenceCriteria.map(criterion => ({
    criterionCode: criterion.criterionCode,
    status: 'MET'
  })),
  lineageReferences: ['RDG-LINEAGE-001'],
  recordedAt: '2026-08-10T00:00:00.000Z',
  rdgEligibilityDecision: 'ELIGIBLE_FOR_ALR_REVIEW'
};
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, validEvidence),
  'READY_FOR_CAPABILITY_STATE_REVIEW'
);
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, { score: 100 }),
  'UNRESOLVED_REQUIRED_FIELDS'
);
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, { ...validEvidence, capabilityState: 'SUPPORTED' }),
  'DENY_AUTHORITY_FIELD'
);
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, { ...validEvidence, rdgEligibilityDecision: 'DISPUTED' }),
  'DISPUTED'
);
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, { ...validEvidence, rdgEligibilityDecision: 'UNKNOWN' }),
  'UNKNOWN'
);
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, {
    ...validEvidence,
    criterionResults: validEvidence.criterionResults.map((result, index) =>
      index === 0 ? { ...result, status: 'NOT_MET' } : result
    )
  }),
  'INSUFFICIENT_EVIDENCE'
);
assert.equal(
  evaluateCapabilityEvidence(capabilities, evidenceContract, {
    ...validEvidence,
    criterionResults: [{ criterionCode: 'UNREGISTERED_CRITERION', status: 'MET' }]
  }),
  'DENY_UNKNOWN_CRITERION'
);

const stateRegistry = await read(`${base}/registries/capability-state-registry-v1.json`);
assert.deepEqual(stateRegistry.states.map(item => item.stateCode), [
  'NOT_EVALUATED', 'DEVELOPING', 'EVIDENCE_REVIEW', 'SUPPORTED', 'MAINTENANCE_DUE',
  'DISPUTED', 'UNKNOWN', 'SUSPENDED', 'RETIRED'
]);
assert.equal(stateRegistry.rules.onlyAlrMayDetermineSemanticState, true);
assert.equal(stateRegistry.rules.supportedIsPermanentAchievement, false);
assert.equal(stateRegistry.rules.semanticEvaluationMutatesPersistentState, false);
assert.equal(stateRegistry.rules.persistentCapabilityStateActivated, false);

const transition = {
  capabilityCode: 'ALR-CAP-BOUNDED-READING',
  fromState: 'EVIDENCE_REVIEW',
  toState: 'SUPPORTED',
  evidenceDecision: 'READY_FOR_CAPABILITY_STATE_REVIEW',
  dependencyDecision: 'SATISFIED',
  decisionAuthority: 'ALR'
};
const transitionBefore = JSON.stringify(transition);
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, transition), 'TRANSITION_ELIGIBLE');
assert.equal(JSON.stringify(transition), transitionBefore);
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, {
  ...transition,
  evidenceDecision: 'INSUFFICIENT_EVIDENCE'
}), 'DENY_EVIDENCE');
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, {
  ...transition,
  dependencyDecision: 'UNSATISFIED'
}), 'DENY_DEPENDENCY');
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, {
  ...transition,
  decisionAuthority: 'RDG'
}), 'DENY_NON_ALR_AUTHORITY');
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, {
  ...transition,
  persist: true
}), 'DENY_PERSISTENCE_OR_AUTHORITY_FIELD');
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, {
  ...transition,
  evidenceDecision: 'INSUFFICIENT_EVIDENCE',
  dependencyDecision: 'UNSATISFIED',
  transitionConditions: ['READY_FOR_CAPABILITY_STATE_REVIEW', 'DEPENDENCIES_SATISFIED']
}), 'DENY_UNTRUSTED_TRANSITION_CONDITION');
assert.equal(evaluateCapabilityTransition(stateRegistry, capabilities, {
  ...transition,
  fromState: 'NOT_EVALUATED'
}), 'DENY_TRANSITION');

const gapContract = await read(`${base}/contracts/capability-gap-contract-v1.json`);
assert.deepEqual(gapContract.gapTypes, [
  'PREREQUISITE_GAP', 'STATE_GAP', 'EVIDENCE_GAP',
  'MAINTENANCE_GAP', 'DISPUTED_GAP', 'UNKNOWN_GAP'
]);
assert.equal(gapContract.rules.gapDeterminationIsRecommendation, false);
assert.equal(gapContract.rules.gapMayDetermineProfessionalReadiness, false);
assert.equal(gapContract.rules.evaluationPersistsLearnerData, false);

const noGapInput = {
  targetCapabilityCode: 'ALR-CAP-BOUNDED-READING',
  currentCapabilityStates: [
    { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'SUPPORTED' },
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', state: 'SUPPORTED' }
  ],
  evidenceDecisions: []
};
assert.deepEqual(
  evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, noGapInput),
  { decision: 'NO_GAP', targetCapabilityCode: 'ALR-CAP-BOUNDED-READING', gaps: [] }
);

const prerequisiteGap = evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  targetCapabilityCode: 'ALR-CAP-BOUNDED-READING',
  currentCapabilityStates: [
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', state: 'DEVELOPING' }
  ],
  evidenceDecisions: []
});
assert.equal(prerequisiteGap.decision, 'GAPS_IDENTIFIED');
assert.ok(prerequisiteGap.gaps.some(gap => gap.gapType === 'PREREQUISITE_GAP'));
assert.ok(prerequisiteGap.gaps.some(gap => gap.gapType === 'STATE_GAP'));

const disputedGap = evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  ...noGapInput,
  currentCapabilityStates: [
    { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'DISPUTED' },
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', state: 'SUPPORTED' }
  ]
});
assert.equal(disputedGap.gaps[0].gapType, 'DISPUTED_GAP');

const unknownGap = evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  ...noGapInput,
  currentCapabilityStates: [
    { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'SUPPORTED' },
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', state: 'UNKNOWN' }
  ]
});
assert.equal(unknownGap.gaps[0].gapType, 'UNKNOWN_GAP');

const evidenceGapInput = {
  targetCapabilityCode: 'ALR-CAP-BOUNDED-READING',
  currentCapabilityStates: [
    { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'SUPPORTED' },
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', state: 'EVIDENCE_REVIEW' }
  ],
  evidenceDecisions: [
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', decision: 'INSUFFICIENT_EVIDENCE' }
  ]
};
const evidenceGapBefore = JSON.stringify(evidenceGapInput);
const evidenceGap = evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, evidenceGapInput);
assert.equal(evidenceGap.gaps[0].gapType, 'EVIDENCE_GAP');
assert.equal(JSON.stringify(evidenceGapInput), evidenceGapBefore);
assert.deepEqual(
  evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, evidenceGapInput),
  evidenceGap
);

const maintenanceGap = evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  ...noGapInput,
  currentCapabilityStates: [
    { capabilityCode: 'ALR-CAP-EVIDENCE-DISTINCTION', state: 'SUPPORTED' },
    { capabilityCode: 'ALR-CAP-BOUNDED-READING', state: 'MAINTENANCE_DUE' }
  ]
});
assert.equal(maintenanceGap.gaps[0].gapType, 'MAINTENANCE_GAP');
assert.equal(evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  ...noGapInput,
  learnerReference: 'LEARNER-1'
}).decision, 'DENY_AUTHORITY_OR_USER_DATA_FIELD');
assert.equal(evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  ...noGapInput,
  evidenceDecisions: [{ capabilityCode: 'ALR-CAP-UNKNOWN', decision: 'INSUFFICIENT_EVIDENCE' }]
}).decision, 'DENY_UNREGISTERED_EVIDENCE_CAPABILITY');
assert.equal(evaluateCapabilityGaps(capabilities, graph, stateRegistry, gapContract, {
  ...noGapInput,
  evidenceDecisions: [{
    capabilityCode: 'ALR-CAP-BOUNDED-READING',
    decision: 'AUTO_PROMOTED'
  }]
}).decision, 'DENY_UNKNOWN_EVIDENCE_DECISION');

const rdgRegistry = await read('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const alrDataContract = rdgRegistry.entries.find(entry => entry.runtimeCode === 'ALR');
assert.equal(alrDataContract.activationState, 'RESERVED_NOT_IMPLEMENTED');
assert.equal(alrDataContract.permissions.professionalDataWrite, 'DENY');

const carReconciliation = await read('content/professional/canonical-asset-runtime/contracts/car-alr-cpr-authority-reconciliation-v1.json');
assert.equal(carReconciliation.workInterpretation['CAR-W7'].rules.carMayPromoteCapability, false);
assert.equal(carReconciliation.handoffs.find(item => item.from === 'CAR' && item.to === 'ALR').writeThroughAllowed, false);

const freeze = await read(`${base}/freeze/alr-w5-w9-capability-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['ALR-W5', 'ALR-W6', 'ALR-W7', 'ALR-W8', 'ALR-W9']);
assert.equal(freeze.capabilityRegistryPopulated, true);
assert.equal(freeze.capabilityDependencyGraphCanonicalAndAcyclic, true);
assert.equal(freeze.capabilityEvidenceSemanticEvaluationEstablished, true);
assert.equal(freeze.capabilityStateSemanticsEstablished, true);
assert.equal(freeze.deterministicCapabilityGapEvaluationEstablished, true);
assert.equal(freeze.persistentCapabilityStateRuntimeActivated, false);
assert.equal(freeze.learnerDataWriteActivated, false);
assert.equal(freeze.learningRecommendationRuntimeActivated, false);
assert.equal(freeze.credentialRuntimeActivated, false);
assert.equal(freeze.pwsProfessionalCapabilityRegistryMutated, false);
assert.equal(freeze.existingRuntimeOrUserDataMutated, false);
assert.equal(freeze.nextWork, 'ALR-W10 Program');
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w5-w9'], 'node scripts/check-alr-w5-w9-capability.mjs');
assert.equal(pkg.scripts['check:alr-capability'], 'npm run check:alr-w5-w9');
assert.ok(pkg.scripts.postcheck.startsWith(
  'npm run check:governance-data-closure && npm run check:alr-foundation && npm run check:alr-capability && '
));

console.log('✓ ALR-W5～W9 Capability Registry / Dependency / Evidence / State / Gap passed.');
console.log('✓ ALR owns Capability semantics; RDG retains data governance; PWS, Credential, Entitlement and Professional authority remain firewalled.');
console.log('✓ Capability evaluation is deterministic and fail closed without learner-data or persistent state mutation.');
