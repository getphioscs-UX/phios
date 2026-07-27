import assert from 'node:assert/strict';
import {
  EVIDENCE_CLASSIFICATIONS,
  INFLUENCE_RELATION_TYPES,
  MATURITY_STATES,
  buildReconstructionExperience,
  classifyEvidence
} from '../functions/runtime/reconstruction/reconstruction-experience.js';
import {
  validateReadingInput
} from '../functions/api/read-runtime.js';

const entry = {
  runtimeEntityId: 'runtime_fixture_money',
  runtimeEntryId: 'entry_fixture_money',
  entryVersion: 4,
  evidenceVersion: 6,
  realityChange: {
    rawStatement: '三个月前离开固定工作并开始经营自己的事业后，越来越害怕花钱。',
    normalizedStatement: '离开固定工作后，对花钱的恐惧增加。'
  },
  timing: { statedTiming: '三个月前', normalizedTiming: '' },
  affectedDomains: ['financial', 'work', 'relationship'],
  entryEvidence: [
    { evidenceId: 'ev_001', statement: '即使是正常家庭支出，也会反复检查余额并拖延决定。', sourceRound: 2 },
    { evidenceId: 'ev_002', statement: '社交活动减少。', sourceRound: 2 },
    { evidenceId: 'ev_003', statement: '对工作能力的信心下降。', sourceRound: 3 },
    { evidenceId: 'ev_004', statement: '丈夫催促后紧张升高。', sourceRound: 3 }
  ],
  reconstructionEvidence: [
    { evidenceId: 're_001', target: 'runtime_conditions', statement: '收入不确定、一次性大额付款、丈夫催促、月底复盘时更明显。' },
    { evidenceId: 're_002', target: 'runtime_conditions', statement: '支付固定账单时较少出现。' },
    { evidenceId: 're_003', target: 'experience_style', statement: '花钱时会害怕和紧张。' },
    { evidenceId: 're_004', target: 'identity_style', statement: '我对自己的工作能力没有以前那么有信心。' },
    { evidenceId: 're_005', target: 'carrier_signatures', statement: '2 年前' }
  ],
  evidenceBoundary: {
    observedEvidence: ['即使是正常家庭支出，也会反复检查余额并拖延决定。'],
    counterEvidence: ['支付固定账单时较少出现。']
  }
};

const legacy = {
  grammarStates: [{ code: 'G1' }],
  carrier: { initializationCoordinates: [] },
  conscious: { stages: [] },
  evidenceBoundary: entry.evidenceBoundary
};
const result = buildReconstructionExperience(
  entry,
  legacy,
  { now: '2026-07-27T02:00:00.000Z' }
).experience;

assert.equal(result.schema_version, 'phi-os.reconstruction-experience.v1');
assert.equal(result.reconstruction_version, 1);
const relative = result.timeline.events.find(event => event.reported_time === '三个月前');
assert.equal(relative.normalized_time.type, 'relative_duration');
assert.equal(relative.precision, 'approximate');
assert.equal(relative.normalization_basis, 'reported_expression_only');
assert.equal(result.conflicts.some(conflict =>
  conflict.conflict_type === 'temporal_conflict' &&
  conflict.severity === 'blocking' &&
  conflict.values.includes('三个月前') &&
  conflict.values.includes('2 年前')
), true);
assert.equal(result.reading_gate.status, 'blocked');
assert.equal(result.reading_gate.allowed, false);

for (const condition of ['收入不确定', '一次性大额付款', '丈夫催促', '月底复盘']) {
  assert.equal(result.conditions.enhancing.some(item =>
    item.label.includes(condition) && item.maturity === 'candidate_identified'
  ), true, `${condition} must be an enhancing candidate`);
}
assert.equal(result.conditions.reducing.some(item =>
  item.label.includes('固定账单') &&
  item.condition_type === 'counter_condition' &&
  item.maturity === 'candidate_identified'
), true);

assert.equal(classifyEvidence('我感到害怕和紧张'), 'reported_emotion');
assert.equal(classifyEvidence('我对工作能力失去信心'), 'reported_identity');
assert.equal(classifyEvidence('我反复检查余额并拖延购买'), 'reported_behavior');
assert.equal(classifyEvidence('三个月前'), 'reported_time');
assert.equal(classifyEvidence('支付固定账单时较少出现'), 'reported_counter_condition');
assert.notEqual(classifyEvidence('一种主观经验'), 'direct_observation');

const duplicate = result.evidence.canonical.find(item =>
  item.canonical_text.includes('反复检查余额')
);
assert.equal(duplicate.source_count, 2);
assert.equal(result.views.customer.tentative.filter(item =>
  item.canonical_text.includes('反复检查余额')
).length, 1);
assert.ok(result.views.technical.figure_mapping.figure_0A);
assert.ok(result.views.technical.figure_mapping.figure_4A);
assert.ok(result.views.technical.figure_mapping.figure_5E);
assert.equal('figure_mapping' in result.views.customer, false);
assert.equal(result.unknown_questions.some(question =>
  question.unknown_type === 'temporal_conflict' && question.blocking_reading
), true);
assert.equal(result.confidence.components.conflict_penalty < 0, true);

const corrected = buildReconstructionExperience(entry, legacy, {
  previousReconstruction: result,
  correction: {
    target_type: 'timeline_event',
    target_id: relative.event_id,
    field: 'reported_time',
    previous_value: '三个月前',
    new_value: '两年前已有迹象，三个月前明显加重',
    reason: 'Customer clarified progressive onset'
  },
  downstreamArtifacts: [
    { artifact_type: 'reading', artifact_id: 'reading_1', status: 'current', based_on_reconstruction_version: 1 },
    { artifact_type: 'navigation', artifact_id: 'navigation_1', status: 'current', based_on_reconstruction_version: 1 }
  ],
  now: '2026-07-27T02:05:00.000Z'
}).experience;
assert.equal(corrected.reconstruction_version, 2);
assert.equal(corrected.revision.materiality, 'material');
assert.equal(corrected.previous_versions.length, 1);
assert.equal(corrected.revision_history.length, 1);
assert.equal(corrected.downstream_staleness.every(item => item.status === 'stale'), true);
assert.equal(corrected.downstream_staleness.some(item => item.artifact_type === 'reading'), true);
assert.equal(corrected.downstream_staleness.some(item => item.artifact_type === 'navigation'), true);
assert.equal(corrected.conflicts.length, 0);
assert.equal(corrected.reading_gate.allowed, true);

const nonMaterial = buildReconstructionExperience(entry, legacy, {
  previousReconstruction: result,
  correction: {
    target_type: 'display_text',
    target_id: 'summary',
    field: 'display_label',
    previous_value: '旧标签',
    new_value: '新标签'
  },
  downstreamArtifacts: [
    { artifact_type: 'reading', artifact_id: 'reading_1', status: 'current', based_on_reconstruction_version: 1 }
  ],
  now: '2026-07-27T02:10:00.000Z'
}).experience;
assert.equal(nonMaterial.revision.materiality, 'non_material');
assert.equal(nonMaterial.downstream_staleness[0].status, 'current');

const legacyResult = buildReconstructionExperience({
  runtimeEntityId: 'legacy_runtime',
  runtimeEntryId: 'legacy_entry',
  realityChange: { rawStatement: 'A change was reported.' },
  entryEvidence: [{ statement: 'A behavior changed.' }]
}, {}, { now: '2026-07-27T02:15:00.000Z' }).experience;
assert.ok(legacyResult.timeline);
assert.ok(legacyResult.reading_gate);
assert.ok(legacyResult.views.customer);
assert.ok(legacyResult.views.evidence);
assert.ok(legacyResult.views.technical);

assert.ok(EVIDENCE_CLASSIFICATIONS.includes('reported_emotion'));
assert.ok(EVIDENCE_CLASSIFICATIONS.includes('reported_identity'));
assert.ok(EVIDENCE_CLASSIFICATIONS.includes('system_derived'));
assert.ok(MATURITY_STATES.includes('blocked_by_conflict'));
assert.ok(INFLUENCE_RELATION_TYPES.includes('co_occurs_with'));
assert.ok(INFLUENCE_RELATION_TYPES.includes('unknown_relation'));

const blockedReadingInput = {
  schemaVersion: 'phi-os.reading-input.v1',
  runtimeEntityId: entry.runtimeEntityId,
  runtimeEntryId: entry.runtimeEntryId,
  runtimeEntry: entry,
  reconstruction: {
    readingGate: result.reading_gate
  },
  evidenceBoundary: {},
  interpretationPolicy: {
    evidenceBeforeInterpretation: true,
    preserveUnknownReality: true
  }
};
assert.equal(validateReadingInput(blockedReadingInput).some(issue =>
  issue.code === 'reconstruction_reading_gate_blocked'
), true, 'Reading API must enforce a blocking Reconstruction Gate');

console.log('✓ M3C-W14 Reconstruction Experience contracts, fixture, revision, staleness, views and Reading Gate passed.');
