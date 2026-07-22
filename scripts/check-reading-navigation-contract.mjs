import assert from 'node:assert/strict';
import readRuntimeRuleFirst from '../functions/runtime/reading/rule-reading.js';
import {
  validateReadingNavigationContract
} from '../functions/runtime/navigation/reading-navigation-contract.js';

const baseInput = {
  schemaVersion: 'phi-os.reading-input.v1',
  runtimeEntityId: 'entity-test',
  runtimeEntryId: 'entry-test',
  runtimeEntry: {
    desiredTransition: { summary: 'Clarify whether to continue the current work direction.' },
    activeConstraints: ['Limited time']
  },
  evidenceBoundary: {
    observedEvidence: ['Work confidence declined.', 'Social activity decreased.'],
    reportedExperience: ['Fear appears when spending money.'],
    interpretation: ['I may be failing.'],
    professionalAssessment: [],
    unknownReality: ['Whether income stability changed materially.']
  },
  reconstruction: {
    primaryArc: 'reorganization',
    direction: { priorityEvidence: ['Track spending decisions for two weeks.'] }
  },
  grammarStates: [{ code: 'G2', confidence: 0.8 }]
};

const reading = readRuntimeRuleFirst(baseInput, { outputLanguage: 'en' });
const handoff = reading.navigationHandoff;
const validation = validateReadingNavigationContract(handoff);

assert.equal(validation.valid, true, validation.errors.join('\n'));
assert.equal(handoff.runtimeEntityId, 'entity-test');
assert.equal(handoff.runtimeEntryId, 'entry-test');
assert.equal(Array.isArray(handoff.availablePaths), true);
assert.equal(handoff.availablePaths.length > 0, true);
assert.equal(handoff.recommendedPriority.length, handoff.availablePaths.length);
assert.equal(handoff.selectedPath, null);
assert.equal(handoff.desiredDirection.length > 0, true);
assert.equal(handoff.constraints.includes('Limited time'), true);
assert.equal(handoff.evidenceBoundary.interpretationExcluded, true);
assert.equal(handoff.unknownReality.length, 1);

const blocked = readRuntimeRuleFirst({
  ...baseInput,
  runtimeEntry: {},
  evidenceBoundary: {
    observedEvidence: [],
    reportedExperience: [],
    interpretation: ['Only an interpretation exists.'],
    professionalAssessment: [],
    unknownReality: ['What actually changed.']
  }
}, { outputLanguage: 'en' }).navigationHandoff;

assert.equal(blocked.navigationReady, false);
assert.equal(blocked.blockers.includes('insufficient_observed_evidence'), true);
assert.equal(blocked.advisories.includes('pattern_not_established'), true);
assert.equal(blocked.advisories.includes('direction_not_established'), true);
assert.equal(blocked.availablePaths.length, 0);

console.log('Reading → Navigation contract checks passed.');
