import assert from 'node:assert/strict';
import readRuntimeRuleFirst from '../functions/runtime/reading/rule-reading.js';
import navigateRuntimeRuleFirst from '../functions/runtime/navigation/rule-navigation.js';
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

/*
 * Switching the UI to English after a Chinese Reading must regenerate only
 * Runtime-authored labels and placeholders. Original Chinese user evidence
 * remains unchanged.
 */
const chineseReadingInput = {
  ...baseInput,
  runtimeEntityId: 'entity-language-switch',
  runtimeEntryId: 'entry-language-switch',
  runtimeEntry: {
    desiredTransition: {
      summary: '我希望根据实际财务资料区分必要投入和正常支出。'
    },
    activeConstraints: [
      '我希望保护家庭储蓄，同时业务也需要适当投入。'
    ]
  },
  evidenceBoundary: {
    observedEvidence: [
      '离开固定工作后，我反复检查支出。',
      '我减少了社交活动。'
    ],
    reportedExperience: [
      '我越来越害怕花钱。'
    ],
    interpretation: [],
    professionalAssessment: [],
    unknownReality: [
      '反向证据仍未建立。',
      '依赖关系仍未建立。'
    ]
  },
  reconstruction: {
    primaryArc: 'formation'
  },
  grammarStates: [{ code: 'G2', confidence: 0.84 }],
  languageContract: {
    locale: 'zh-Hans',
    outputLanguage: 'zh'
  }
};

const chineseReading = readRuntimeRuleFirst(
  chineseReadingInput,
  { outputLanguage: 'zh' }
);
const switchedNavigation = navigateRuntimeRuleFirst({
  schemaVersion: 'phi-os.navigation-input.v1',
  runtimeEntityId: chineseReading.runtimeEntityId,
  runtimeEntryId: chineseReading.runtimeEntryId,
  reading: chineseReading,
  evidenceBoundary: chineseReading.evidenceBoundary,
  transition: {
    currentRuntime: 'G2 约束',
    currentTransition: chineseReading.integratedReading.currentTransition,
    evidenceWatch: chineseReading.integratedReading.evidenceWatch
  },
  navigationContext: {
    currentSituation: '离开固定工作后，我反复检查支出。',
    desiredDirection: chineseReadingInput.runtimeEntry.desiredTransition.summary,
    activeConstraints: chineseReadingInput.runtimeEntry.activeConstraints
  },
  languageContract: {
    locale: 'zh-Hans',
    outputLanguage: 'zh'
  }
}, {
  locale: 'en',
  outputLanguage: 'en'
});

assert.equal(switchedNavigation.languageContract.outputLanguage, 'en');
assert.equal(switchedNavigation.currentRuntime, 'G2 Constraint');
assert.equal(
  switchedNavigation.currentTransitionLabel,
  'Clarify which forming structure is supported by evidence and which parts remain unknown.'
);
assert.deepEqual(switchedNavigation.unknownReality, [
  'Counter-evidence remains unestablished.',
  'Dependency remains unestablished.'
]);
assert.equal(
  switchedNavigation.evidenceWatch.includes(
    'Whether a counter-example or different outcome can be observed.'
  ),
  true
);
assert.equal(
  switchedNavigation.evidenceWatch.includes(
    'Whether one part changes consistently when another part changes.'
  ),
  true
);
assert.equal(
  switchedNavigation.currentPosition.situation,
  '离开固定工作后，我反复检查支出。'
);
assert.equal(
  switchedNavigation.desiredDirection,
  chineseReadingInput.runtimeEntry.desiredTransition.summary
);
assert.equal(
  JSON.stringify(switchedNavigation.availablePaths).includes('反向证据仍未建立'),
  false
);

console.log('Reading → Navigation contract checks passed.');
