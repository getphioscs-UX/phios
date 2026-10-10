import assert from 'node:assert/strict';
import { readRuntimeRuleFirst } from '../functions/runtime/reading/rule-reading.js';

function baseInput(overrides = {}) {
  return {
    schemaVersion: 'phi-os.reading-input.v1',
    runtimeEntityId: 'entity-test',
    runtimeEntryId: 'entry-test',
    locale: 'en',
    runtimeEntry: {
      realityChange: {
        rawStatement: 'My work and money decisions have changed.'
      },
      affectedDomains: ['work', 'finance'],
      desiredTransition: {
        summary: 'Clarify a sustainable next direction.'
      }
    },
    reconstruction: {
      primaryArc: 'reorganization',
      maturityScore: 0.8,
      grammarStates: [
        {
          code: 'G13',
          label: 'Reconfiguration',
          status: 'provisional',
          confidence: 0.8,
          summary: ''
        }
      ],
      direction: {
        priorityEvidence: []
      }
    },
    evidenceBoundary: {
      observedEvidence: [
        'The user left a fixed job.',
        'The user began operating a business.'
      ],
      reportedExperience: [
        'The user reports fear when spending money.'
      ],
      interpretation: [],
      professionalAssessment: [],
      unknownReality: []
    },
    ...overrides
  };
}

const established = readRuntimeRuleFirst(baseInput());
assert.equal(established.patternAssessment.established, true);
assert.equal(
  established.integratedReading.primaryPattern.classification,
  'primary_pattern'
);
assert.equal(established.navigationReadiness.ready, true);
assert.equal(
  established.evidenceAudit.patternSources.length,
  3
);

const interpretationOnly = readRuntimeRuleFirst(baseInput({
  runtimeEntry: {
    realityChange: { rawStatement: '' },
    affectedDomains: [],
    desiredTransition: { summary: 'Find a direction.' }
  },
  evidenceBoundary: {
    observedEvidence: [],
    reportedExperience: [],
    interpretation: [
      'I believe I am failing financially and cannot act.'
    ],
    professionalAssessment: [],
    unknownReality: ['Actual financial position is unknown.']
  }
}));

assert.equal(interpretationOnly.patternAssessment.established, false);
assert.equal(
  interpretationOnly.integratedReading.primaryPattern.classification,
  'possible_reading'
);
assert.equal(interpretationOnly.navigationReadiness.ready, false);
assert.equal(
  interpretationOnly.runtimeRegions.every(
    region => region.status === 'not_established'
  ),
  true
);
assert.equal(
  interpretationOnly.evidenceAudit.patternSources.length,
  0
);
assert.equal(
  interpretationOnly.evidenceAudit.excludedFromInference.length,
  2
);

const noDirection = readRuntimeRuleFirst(baseInput({
  runtimeEntry: {
    realityChange: {
      rawStatement: 'My work and money decisions have changed.'
    },
    affectedDomains: ['work', 'finance'],
    desiredTransition: {}
  }
}));

assert.equal(noDirection.patternAssessment.established, true);
assert.equal(noDirection.navigationReadiness.ready, true);
assert.equal(
  noDirection.navigationReadiness.advisories.includes(
    'direction_not_established'
  ),
  true
);
assert.equal(noDirection.navigationReadiness.requirements.directionRequired, false);

const observationFirstWithoutReportedExperience = readRuntimeRuleFirst(baseInput({
  evidenceBoundary: {
    observedEvidence: [
      'Three purchases were postponed; two gatherings were cancelled; the balance was checked before every payment.'
    ],
    reportedExperience: [],
    interpretation: [],
    professionalAssessment: [],
    unknownReality: ['reported experience remains unestablished.']
  }
}));
assert.equal(observationFirstWithoutReportedExperience.navigationReadiness.ready, true);
assert.equal(observationFirstWithoutReportedExperience.navigationReadiness.navigationMode, 'observation_first');
assert.equal(
  observationFirstWithoutReportedExperience.navigationReadiness.advisories.includes('insufficient_reported_experience'),
  true
);
assert.equal(
  observationFirstWithoutReportedExperience.navigationReadiness.advisories.includes('pattern_not_established'),
  true
);

const englishUiWithChineseDerivedUnknowns = readRuntimeRuleFirst(baseInput({
  languageContract: { locale: 'en', outputLanguage: 'en' },
  evidenceBoundary: {
    observedEvidence: [
      'Three planned purchases did not occur; two gatherings were cancelled; the balance was checked before each payment.'
    ],
    reportedExperience: ['The user reports fear before spending.'],
    interpretation: [],
    professionalAssessment: [],
    unknownReality: [
      '触发条件仍未建立。',
      '反向证据仍未建立。',
      '依赖关系仍未建立。',
      '期望转变仍未建立。'
    ]
  }
}), { outputLanguage: 'en' });

assert.deepEqual(
  englishUiWithChineseDerivedUnknowns.evidenceBoundary.unknownReality,
  [
    'Trigger condition remains unestablished.',
    'Counter-evidence remains unestablished.',
    'Dependency remains unestablished.',
    'Desired transition remains unestablished.'
  ]
);
assert.equal(
  englishUiWithChineseDerivedUnknowns.integratedReading.unknownReality
    .some(value => /[\u3400-\u9fff]/u.test(value)),
  false
);
assert.equal(
  englishUiWithChineseDerivedUnknowns.integratedReading.evidenceWatch.length,
  4
);
assert.equal(englishUiWithChineseDerivedUnknowns.navigationReadiness.ready, true);

const unknownExcluded = readRuntimeRuleFirst(baseInput({
  evidenceBoundary: {
    observedEvidence: [
      'The user left a fixed job.',
      'The user began operating a business.'
    ],
    reportedExperience: [
      'The user reports uncertainty.'
    ],
    interpretation: [],
    professionalAssessment: [],
    aiInterpretation: [
      'An AI-generated causal explanation.'
    ],
    unknownReality: [
      'The cause is unknown.'
    ]
  }
}));

assert.equal(
  unknownExcluded.evidenceAudit.patternSources.some(
    item => item.evidenceClass === 'unknown_reality' ||
      item.evidenceClass === 'ai_interpretation'
  ),
  false
);

console.log('Reading Evidence Boundary checks passed.');
