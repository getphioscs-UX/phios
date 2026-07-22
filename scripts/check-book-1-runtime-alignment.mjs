import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRAMMAR_CODES, GRAMMAR_REGISTRY, validateGrammarRegistry } from '../functions/runtime/formation/grammar-registry.js';
import { assessPatternThreshold } from '../functions/runtime/reading/pattern-threshold.js';
import { assessNavigationReadiness } from '../functions/runtime/reading/navigation-readiness.js';

const expected = [
  ['G1', 'Difference'], ['G2', 'Constraint'], ['G3', 'Structure'], ['G4', 'Field'],
  ['G5', 'Activation'], ['G6', 'Carrier'], ['G7', 'Runtime'], ['G8', 'Experience'],
  ['G9', 'Expression'], ['G10', 'Agency'], ['G11', 'Identity'], ['G12', 'Feedback'],
  ['G13', 'Settlement'], ['G14', 'Reconfiguration'], ['G15', 'Emergence'], ['G16', 'Continuity']
];

assert.deepEqual(GRAMMAR_CODES, expected.map(([code]) => code));
for (const [code, label] of expected) assert.equal(GRAMMAR_REGISTRY[code].label, label, `${code} label drifted.`);
assert.equal(validateGrammarRegistry().valid, true);

const removedSignatures = [
  'Structural Signature', 'Relational Signature', 'Navigational Signature',
  'Resource Signature', 'Directional Signature', 'Temporal Signature'
];
for (const file of ['reality-reconstruction.html', 'reality-reading.html']) {
  const source = fs.readFileSync(file, 'utf8');
  for (const removed of removedSignatures) assert.equal(source.includes(removed), false, `${removed} remains in ${file}.`);
}

const boundary = {
  observedEvidence: [
    '过去两个月有三项原本计划购买的工作工具没有购买；我取消了两次朋友聚会；每次付款前会多次查看银行余额；我和丈夫曾经两次因为家庭开支讨论而发生争执。'
  ],
  reportedExperience: ['我报告自己对花钱感到害怕。']
};
const grammar = { code: 'G2', confidence: 0.84 };
const pattern = assessPatternThreshold(boundary, grammar);
assert.equal(pattern.established, true, 'Multiple evidence statements in one paragraph must satisfy the evidence-unit threshold.');
assert.equal(pattern.counts.observedEvidence, 4);

const readiness = assessNavigationReadiness({
  readingInput: { runtimeEntry: { desiredTransition: { summary: '根据实际资料区分必要支出与恐惧造成的拖延。' } } },
  boundary,
  patternAssessment: pattern,
  primaryRegion: { id: 'R5', label: 'Resource' },
  confidence: 0.72,
  language: 'zh'
});
assert.equal(readiness.ready, true, readiness.blockers.join(', '));

console.log('✓ Book 1 G1–G16, removed Signature families, and Navigation evidence-unit alignment passed.');
