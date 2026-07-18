import assert from 'node:assert/strict';
import { readRuntimeRuleFirst } from '../functions/runtime/reading/rule-reading.js';

const input = {
  schemaVersion: 'phi-os.reading-input.v1',
  runtimeEntityId: 'entity-dedup',
  runtimeEntryId: 'entry-dedup',
  locale: 'en',
  runtimeEntry: {
    realityChange: { rawStatement: 'Work and money decisions changed.' },
    affectedDomains: ['work', 'finance'],
    desiredTransition: { summary: 'Clarify a sustainable next direction.' }
  },
  reconstruction: {
    primaryArc: 'reorganization',
    maturityScore: 0.8,
    grammarStates: [{
      code: 'G13',
      label: 'Reconfiguration',
      status: 'provisional',
      confidence: 0.8,
      summary: ''
    }],
    direction: {
      priorityEvidence: [
        'Actual monthly cash flow remains unclear.',
        'Observe whether spending fear changes when income becomes predictable.'
      ]
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
    interpretation: [
      'The user believes the fear means failure.'
    ],
    professionalAssessment: [],
    unknownReality: [
      'Actual monthly cash flow remains unclear.'
    ]
  }
};

const reading = readRuntimeRuleFirst(input);
const integrated = reading.integratedReading;

assert.deepEqual(integrated.unknownReality, [
  'Actual monthly cash flow remains unclear.'
]);
assert.deepEqual(integrated.evidenceWatch, [
  'Observe whether spending fear changes when income becomes predictable.'
]);
assert.deepEqual(integrated.alternativeReading.evidenceNeeded, [
  'Observe whether spending fear changes when income becomes predictable.'
]);
assert.equal(
  integrated.strengths.some(item => item.includes('Unknown Reality')),
  false
);
assert.equal(
  integrated.risks.some(item => item.includes('unresolved item')),
  false
);

const customerBuckets = [
  ...integrated.unknownReality,
  ...integrated.evidenceWatch
].map(item => item.toLowerCase());
assert.equal(new Set(customerBuckets).size, customerBuckets.length);

console.log('Reading de-duplication checks passed.');
