import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  EVIDENCE_CLASSIFICATIONS,
  INFLUENCE_RELATION_TYPES,
  MATURITY_STATES,
  buildReconstructionExperience,
  classifyEvidence
} from '../functions/runtime/reconstruction/reconstruction-experience.js';
import {
  onRequestPost as readRuntimePost,
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

for (const condition of ['个人业务收入不确定', '需要一次支付较大金额', '伴侣催促尽快决定', '月底查看收入与支出']) {
  assert.equal(result.conditions.enhancing.some(item =>
    item.label === condition && item.maturity === 'candidate_identified'
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

const productionEntry = {
  runtimeEntityId: 'runtime_production_defect',
  runtimeEntryId: 'entry_production_defect',
  entryVersion: 7,
  evidenceVersion: 9,
  realityChange: {
    rawStatement: '三个月前离开固定工作后，我越来越害怕花钱，即使是家庭支出也会反复检查余额、拖延决定，并减少社交活动，对工作能力的信心也下降。',
    normalizedStatement: '离开固定工作后，对花钱的紧张增加。'
  },
  timing: { statedTiming: '三个月前' },
  entryEvidence: [
    { evidenceId: 'prod_001', statement: '月底查看收入和支出时也会明显增加。' },
    { evidenceId: 'prod_002', statement: '月底查看收入和支出时也会明显增加。' },
    { evidenceId: 'prod_003', statement: '收入不确定。' },
    { evidenceId: 'prod_004', statement: '个人业务收入不确定。' },
    { evidenceId: 'prod_005', statement: '收入确定性下降。' },
    { evidenceId: 'prod_006', statement: '反复检查余额并拖延支出决定，也推迟业务工具采购。' },
    { evidenceId: 'prod_007', statement: '社交活动减少。' },
    { evidenceId: 'prod_008', statement: '对工作能力的信心下降。' },
    { evidenceId: 'prod_009', statement: '希望根据财务资料作决定。' },
    { evidenceId: 'prod_010', statement: '安全感与发展之间存在张力。' }
  ],
  reconstructionEvidence: [
    {
      evidenceId: 'prod_re_001',
      target: 'runtime_conditions',
      statement: '与此同时；第三；或者丈夫催促我尽快决定时；这种紧张较少出现。与此同时；一次性大额付款；月底查看收入和支出时也会明显增加。'
    },
    {
      evidenceId: 'prod_re_002',
      target: 'runtime_conditions',
      statement: '支付固定账单、购买孩子需要的用品、没有受到伴侣催促、家庭仍有储蓄与其他收入来源时较少出现。'
    },
    {
      evidenceId: 'prod_re_003',
      target: 'carrier_signatures',
      statement: '2 年前'
    }
  ],
  evidenceBoundary: {
    observedEvidence: [
      '月底查看收入和支出时也会明显增加。',
      '家庭并没有完全失去收入，丈夫也有收入。'
    ],
    reportedExperience: [],
    counterEvidence: [
      '支付固定账单时较少出现。'
    ]
  }
};

const production = buildReconstructionExperience(
  productionEntry,
  legacy,
  { now: '2026-07-27T03:00:00.000Z' }
).experience;

// Test 1: repeated condition is one canonical customer item.
assert.equal(
  production.views.customer.enhancing_conditions.filter(item =>
    item.canonical_concept === 'month_end_review'
  ).length,
  1
);

// Test 2: semantic evidence is consolidated for Customer View, lineage remains.
const incomeCanonical = production.evidence.canonical.find(item =>
  item.canonical_semantic_key.startsWith('income_uncertainty|')
);
assert.ok(incomeCanonical);
assert.equal(incomeCanonical.source_count, 3);
assert.equal(production.evidence.items.filter(item =>
  ['收入不确定。', '个人业务收入不确定。', '收入确定性下降。'].includes(item.raw_text)
).length, 3);

// Test 3: no connector or ordinal fragment becomes a customer condition.
for (const fragment of ['与此同时', '第三', '或者丈夫催促我尽快决定时', '这种紧张较少出现。与此同时']) {
  assert.equal(production.conditions.all.some(item => item.label === fragment), false);
}
assert.equal(production.conditions.all.every(item =>
  !/^(与此同时|第三|或者|因此)/.test(item.label) &&
  !/(与此同时|第三|或者|因此|当|在|时)$/.test(item.label)
), true);

// Test 4: canonical nodes, never the full Entry paragraph, own relation targets.
assert.equal(production.influence_map.nodes.some(node =>
  node.node_id === 'spending_tension'
), true);
assert.equal(production.influence_map.relations.every(relation =>
  relation.target_id !== productionEntry.realityChange.rawStatement &&
  relation.target_label !== productionEntry.realityChange.rawStatement &&
  !relation.explanation.includes(productionEntry.realityChange.rawStatement)
), true);

// Test 5: no inferred compromise timeline; only the genuine conflict remains.
assert.deepEqual(
  production.timeline.events.map(event => event.reported_time).sort(),
  ['2 年前', '三个月前'].sort()
);
assert.equal(production.conflicts.length, 1);
assert.equal(production.conflicts[0].resolution_status, 'unresolved');
assert.equal(production.conflicts[0].blocking_reading, true);
assert.equal(JSON.stringify(production.timeline).includes('较早已经出现迹象，后来才变得明显'), false);
assert.equal(production.reading_gate.status, 'blocked');

// Test 6: all required inline-correction target types are exposed.
const rendererSource = await readFile(
  new URL('../assets/js/modules/reconstruction-experience-render.js', import.meta.url),
  'utf8'
);
for (const targetType of [
  "targetType: 'timeline_event'",
  "targetType: 'condition'",
  "targetType: 'influence_relation'",
  "targetType: 'evidence'",
  "targetType: 'unknown_question'"
]) {
  assert.equal(rendererSource.includes(targetType), true, `Missing inline correction: ${targetType}`);
}

// Test 7: unknowns are answerable questions, not placeholder status text.
assert.equal(production.views.customer.unknown.length >= 3, true);
assert.equal(production.views.customer.unknown.some(question =>
  question.question_key === 'reconstruction.w14.questions.spendingScope'
), true);
assert.equal(production.views.customer.unknown.some(question =>
  question.question_key === 'reconstruction.w14.questions.noPartnerPressure'
), true);

// Test 8: the final projection is bounded by stable semantic keys.
const uniqueCount = (items, key) => new Set(items.map(key)).size;
assert.equal(
  production.views.customer.enhancing_conditions.length,
  uniqueCount(production.views.customer.enhancing_conditions, item => item.canonical_semantic_key)
);
assert.equal(
  production.views.customer.reducing_conditions.length,
  uniqueCount(production.views.customer.reducing_conditions, item => item.canonical_semantic_key)
);
assert.equal(
  production.views.customer.influence_spread.length,
  uniqueCount(production.views.customer.influence_spread, item => item.canonical_semantic_key)
);
assert.ok(production.views.customer.enhancing_conditions.length <= 8);
assert.ok(production.views.customer.reducing_conditions.length <= 8);
assert.ok(production.views.customer.influence_spread.length <= 12);

// Evidence classifications remain distinct in the evidence projection.
const productionClassification = raw => production.evidence.items.find(item => item.raw_text === raw)?.classification;
assert.equal(productionClassification('社交活动减少。'), 'reported_behavior');
assert.equal(productionClassification('对工作能力的信心下降。'), 'reported_identity');
assert.equal(productionClassification('希望根据财务资料作决定。'), 'reported_intention');
assert.equal(productionClassification('安全感与发展之间存在张力。'), 'reported_experience');

// The real API refuses to route a new Reading while the server Gate is blocked.
const productionReadingInput = {
  schemaVersion: 'phi-os.reading-input.v1',
  runtimeEntityId: productionEntry.runtimeEntityId,
  runtimeEntryId: productionEntry.runtimeEntryId,
  runtimeEntry: productionEntry,
  reconstruction: {
    reconstructionVersion: production.reconstruction_version,
    sourceEntryVersion: production.source_entry_version,
    evidenceVersion: production.evidence_version,
    readingGate: production.reading_gate
  },
  evidenceBoundary: {},
  interpretationPolicy: {
    evidenceBeforeInterpretation: true,
    preserveUnknownReality: true
  }
};
const apiResponse = await readRuntimePost({
  request: new Request('https://example.test/api/read-runtime', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ readingInput: productionReadingInput })
  }),
  env: {}
});
const apiPayload = await apiResponse.json();
assert.equal(apiResponse.status, 422);
assert.equal(apiPayload.validationErrors.some(issue =>
  issue.code === 'reconstruction_reading_gate_blocked'
), true);

console.log('✓ M3C-W14 Reconstruction Experience contracts, fixture, revision, staleness, views and Reading Gate passed.');
