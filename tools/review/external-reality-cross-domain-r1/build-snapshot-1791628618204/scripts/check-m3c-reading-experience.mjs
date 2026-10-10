import assert from 'node:assert/strict';
import { buildReadingExperience } from '../functions/runtime/reading/reading-experience.js';

const canonical = [
  ['离开固定工作后，对花钱的紧张增加。', 'reported_experience', ['entry_1', 'known_1', 'boundary_1']],
  ['我会反复检查余额并拖延支出决定。', 'reported_behavior', ['entry_2', 'reconstruction_2']],
  ['我减少了社交活动，对工作能力的信心也下降。', 'reported_behavior', ['entry_3', 'known_3', 'observed_3']],
  ['家庭仍有储蓄，伴侣也有收入。', 'reported_experience', ['counter_1', 'boundary_counter_1', 'reconstruction_counter_1']]
].map(([canonical_text, evidence_classification, source_ids], index) => ({
  canonical_text,
  evidence_classification,
  confirmation_status: index === 2 ? 'reported' : 'confirmed',
  counter_evidence: index === 3,
  source_count: source_ids.length,
  source_ids,
  lineage: source_ids.map(source_id => ({ source_id }))
}));

const readingInput = {
  runtimeEntityId: 'runtime_prod_money',
  runtimeEntryId: 'entry_prod_money',
  runtimeEntry: {
    entryVersion: 2,
    evidenceVersion: 4,
    realityChange: { normalizedStatement: '离开固定工作后，对花钱的紧张增加。' },
    emergingTension: { summary: '安全感与继续发展事业之间形成张力。' }
  },
  reconstruction: {
    schemaVersion: 'phi-os.reality-reconstruction.v1',
    reconstructionVersion: 3,
    evidenceVersion: 4,
    reconstructionExperience: {
      conditions: {
        enhancing: ['个人业务收入不确定', '需要一次支付较大金额', '伴侣催促尽快决定'],
        reducing: ['家庭仍有储蓄与其他收入来源']
      },
      influence_map: {
        nodes: [
          ['spending_tension', '花钱时的紧张'],
          ['balance_checking', '余额反复检查'],
          ['purchase_delay', '支出决定拖延'],
          ['reduced_social_activity', '社交活动减少'],
          ['reduced_work_confidence', '工作信心下降']
        ].map(([node_id, zh]) => ({ node_id, labels: { zh } }))
      },
      evidence: { canonical },
      unknown_questions: [
        { unknown_type: 'spending_scope', customer_question: '哪些支出最容易引发反复检查？' },
        { unknown_type: 'partner_pressure', customer_question: '当没有伴侣催促时，这种紧张是否明显降低？' }
      ]
    }
  },
  languageContract: { outputLanguage: 'zh' },
  previousReadings: [{ readingId: 'reading_v1' }]
};

const reading = {
  schemaVersion: 'phi-os.reality-reading.v1',
  createdAt: '2026-07-27T00:00:00.000Z',
  runtimeEntityId: readingInput.runtimeEntityId,
  runtimeEntryId: readingInput.runtimeEntryId,
  readingMethod: 'rule_first',
  outputLanguage: 'zh',
  confidence: 0.68,
  readingVersion: 2,
  evidenceBoundary: {
    observedEvidence: canonical.slice(0, 3),
    reportedExperience: canonical,
    interpretation: ['当前反应具有保护功能。'],
    professionalAssessment: [],
    unknownReality: ['哪些支出最容易引发反复检查？']
  },
  integratedReading: {
    primaryPattern: { summary: '不确定感会增强花钱时的紧张，并维持反复检查与拖延。', confidence: 0.68 },
    alternativeReading: {
      summary: '这也可能主要是离开固定工作后的短期过渡反应。',
      evidenceNeeded: ['观察收入更稳定时反应是否减弱。']
    }
  },
  navigationReadiness: { ready: true, status: 'ready_with_warnings' },
  navigationHandoff: { schemaVersion: 'phi-os.reading-navigation-contract.v1', readingVersion: 'reading_v2' }
};

const result = buildReadingExperience({ reading, readingInput });
assert.equal(result.schema_version, 'phi-os.reading-experience.v1');
assert.deepEqual(Object.keys(result.summary), [
  'what_changed', 'operating_pattern', 'protective_function',
  'current_cost', 'current_tension', 'one_sentence_reading'
]);
assert.deepEqual(result.runtime_chain.map(item => item.stage), [
  'origin', 'condition', 'adaptive_response', 'reinforcement',
  'spread', 'cost', 'current_tension'
]);
assert.equal(result.priority_evidence.length, 4);
assert.equal(new Set(result.priority_evidence.map(item => item.canonical_text)).size, 4);
assert.equal(result.priority_evidence[0].source_ids.length, 3);
assert.equal(result.alternative_reading.status, 'compatible');
assert.ok(result.alternative_reading.conflicting_evidence.includes('counter_1'));
assert.ok(['high', 'moderate', 'limited'].includes(result.confidence.customer_level));
assert.match(result.confidence.customer_explanation, /不是“当前解释为真”的概率/);
assert.equal(result.unknown_questions.length, 2);
assert.ok(result.unknown_questions.every(item => item.question.endsWith('？')));
assert.equal(result.boundary.interpretive_not_diagnostic, true);
assert.equal(result.boundary.not_predictive, true);
assert.equal(result.boundary.not_prescriptive, true);
assert.equal(result.navigation_rationale.contract_unchanged, true);
assert.equal(result.navigation_rationale.path_generation_unchanged, true);
assert.equal(result.revision.previous_reading_preserved, true);
assert.equal(result.revision.based_on_reconstruction_version, 3);
assert.equal(result.view_projection.customer.technical_labels_exposed, false);
assert.equal(result.view_projection.customer.maximum_priority_evidence, 5);
assert.deepEqual(result.compatibility, {
  legacy_reading_preserved: true,
  reconstruction_contract_changed: false,
  navigation_contract_changed: false,
  navigation_path_generation_changed: false
});

console.log('✓ M3C-W13 Reading Experience contract passed.');
console.log(`  Production fixture: ${canonical.length} canonical evidence → ${result.priority_evidence.length} prioritized items.`);

