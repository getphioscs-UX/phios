import assert from 'node:assert/strict';
import {
  createReadingNavigationContract,
  validateReadingNavigationContract
} from '../functions/runtime/navigation/reading-navigation-contract.js';
import generateNavigationPaths from '../functions/runtime/navigation/navigation-path-rules.js';

const readyBase = createReadingNavigationContract({
  runtimeEntityId: 'entity-ready',
  runtimeEntryId: 'entry-ready',
  readingSchemaVersion: 'phi-os.reality-reading.v1',
  readingStatus: 'complete',
  navigationReadiness: {
    ready: true,
    score: 0.78,
    blockers: [],
    reason: 'Evidence threshold met.',
    requirements: {}
  },
  currentReality: {
    primaryPattern: { established: true, name: 'Possible work reorganization' },
    confidence: 0.72
  },
  currentTransition: 'Observe how work confidence changes under resource pressure.',
  desiredDirection: 'Make a more stable work decision.',
  constraints: ['Limited time'],
  evidenceBoundary: {
    observedEvidenceCount: 2,
    reportedExperienceCount: 1,
    interpretationExcluded: true,
    unknownRealityExcluded: true
  },
  evidenceWatch: ['Track work decisions for two weeks.'],
  unknownReality: ['Whether income stability changed materially.'],
  professionalBoundary: {
    escalationNeeded: false,
    domains: [],
    reasons: []
  }
});

const generated = generateNavigationPaths(readyBase, { outputLanguage: 'en' });
assert.equal(generated.pathGeneration.generated, true);
assert.equal(generated.availablePaths.length >= 2, true);
assert.equal(generated.availablePaths.length <= 4, true);
assert.equal(generated.recommendedPriority.length, generated.availablePaths.length);
assert.equal(generated.pathGeneration.automaticSelection, false);
assert.equal(generated.pathGeneration.unknownRealityUsedForInference, false);
assert.equal(generated.pathGeneration.aiUsed, false);
assert.equal(generated.availablePaths.every(path => path.userChoiceRequired === true), true);
assert.equal(generated.availablePaths.every(path => path.deterministicCommand === false), true);

const readyContract = createReadingNavigationContract({
  ...readyBase,
  availablePaths: generated.availablePaths,
  recommendedPriority: generated.recommendedPriority,
  pathGeneration: generated.pathGeneration
});
const validation = validateReadingNavigationContract(readyContract);
assert.equal(validation.valid, true, validation.errors.join('\n'));
assert.equal(readyContract.selectedPath, null);

const blockedBase = createReadingNavigationContract({
  runtimeEntityId: 'entity-blocked',
  runtimeEntryId: 'entry-blocked',
  navigationReadiness: {
    ready: false,
    score: 0.3,
    blockers: ['pattern_not_established'],
    reason: 'Pattern is not established.',
    requirements: {}
  },
  currentReality: {},
  unknownReality: ['What actually changed.']
});
const blocked = generateNavigationPaths(blockedBase, { outputLanguage: 'en' });
assert.equal(blocked.availablePaths.length, 0);
assert.equal(blocked.recommendedPriority.length, 0);
assert.equal(blocked.pathGeneration.reason, 'navigation_not_ready');

const professionalBase = createReadingNavigationContract({
  ...readyBase,
  runtimeEntityId: 'entity-professional',
  runtimeEntryId: 'entry-professional',
  professionalBoundary: {
    escalationNeeded: true,
    domains: ['financial'],
    reasons: ['professional_assessment_present']
  }
});
const professional = generateNavigationPaths(professionalBase, { outputLanguage: 'en' });
assert.equal(professional.availablePaths.some(path => path.pathType === 'professional_review'), true);
assert.equal(professional.availablePaths.some(path => path.id === 'small-reversible-experiment'), false);

console.log('Navigation path generation rules: passed');
