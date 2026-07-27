/*
 * PHI OS Reconstruction Experience Contract
 * M3C-W14
 *
 * Builds a versioned, evidence-traceable organization layer on top of the
 * legacy rule reconstruction. It never interprets the Reality or prescribes
 * an action. Legacy fields remain available to Technical View consumers.
 */

const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => value && typeof value === 'object' && !Array.isArray(value)
  ? value
  : {};
const clean = value => typeof value === 'string'
  ? value.replace(/\s+/g, ' ').trim()
  : '';
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));
const now = options => clean(options?.now) || new Date().toISOString();

export const EVIDENCE_CLASSIFICATIONS = Object.freeze([
  'direct_observation', 'reported_event', 'reported_behavior',
  'reported_condition', 'reported_emotion', 'reported_experience',
  'reported_identity', 'reported_belief', 'reported_intention',
  'reported_relationship', 'reported_sequence', 'reported_time',
  'reported_counter_condition', 'documented_fact', 'system_derived',
  'professional_interpretation', 'unknown'
]);

export const MATURITY_STATES = Object.freeze([
  'not_assessed', 'not_mentioned', 'signal_detected',
  'candidate_identified', 'partially_supported', 'supported', 'confirmed',
  'contradicted', 'not_applicable', 'blocked_by_conflict'
]);

export const INFLUENCE_RELATION_TYPES = Object.freeze([
  'initiates', 'precedes', 'amplifies', 'reduces', 'maintains',
  'constrains', 'enables', 'co_occurs_with', 'mediates', 'depends_on',
  'conflicts_with', 'counteracts', 'spreads_to', 'correlates_with',
  'unknown_relation'
]);

const EMOTION = [
  'fear', 'afraid', 'anxious', 'anxiety', 'nervous', 'tense', 'worry',
  '害怕', '恐惧', '焦虑', '紧张', '担心', '不安'
];
const IDENTITY = [
  'identity', 'role', 'who i am', 'confidence in my ability', 'self-confidence',
  '身份', '角色', '工作能力', '信心', '自信', '我是谁'
];
const BEHAVIOR = [
  'check', 'checking', 'delay', 'delaying', 'avoid', 'reduced', 'stopped',
  'purchase', 'buy', 'social', '检查', '拖延', '推迟', '回避', '减少',
  '停止', '购买', '采购', '社交'
];
const RELATIONSHIP = [
  'husband', 'wife', 'partner', 'family', 'colleague', 'manager',
  '丈夫', '妻子', '伴侣', '家人', '同事', '主管', '催促'
];
const COUNTER = [
  'less', 'reduce', 'eases', 'lower', 'not when', '固定', '较少', '减弱',
  '降低', '缓解', '不再'
];
const TIME = [
  /\b\d+\s*(?:day|week|month|year)s?\s*ago\b/i,
  /\b(?:19|20)\d{2}(?:-\d{1,2}(?:-\d{1,2})?)?\b/,
  /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /(?:\d+|[一二两三四五六七八九十]+)\s*(?:天|周|星期|个月|月|年)前/,
  /(?:19|20)\d{2}年(?:\d{1,2}月(?:\d{1,2}日)?)?/,
  /(?:年初|年末|月底|月初|最近|之前|之后|当时)/
];

function includesAny(value, terms) {
  const source = clean(value).toLowerCase();
  return terms.some(term => source.includes(term));
}

function itemText(item) {
  if (typeof item === 'string') return clean(item);
  const value = asObject(item);
  return clean(
    value.raw_text || value.statement || value.sourceText || value.summary ||
    value.description || value.question || value.content || value.label
  );
}

function stableId(prefix, index) {
  return `${prefix}_${String(index + 1).padStart(3, '0')}`;
}

function sourceItems(runtimeEntry) {
  const boundary = asObject(runtimeEntry?.evidenceBoundary);
  const rows = [];
  const add = (values, sourceField, sourceRound = null) => {
    asArray(values).forEach(value => {
      const raw = itemText(value);
      if (!raw) return;
      rows.push({
        raw,
        value: asObject(value),
        sourceField,
        sourceRound: value?.sourceRound ?? value?.round ?? sourceRound
      });
    });
  };

  add(runtimeEntry?.entryEvidence, 'entryEvidence');
  add(runtimeEntry?.knownReality, 'knownReality');
  add(boundary.observedEvidence, 'evidenceBoundary.observedEvidence');
  add(boundary.reportedExperience, 'evidenceBoundary.reportedExperience');
  add(boundary.counterEvidence, 'evidenceBoundary.counterEvidence');
  add(runtimeEntry?.counterEvidence, 'counterEvidence');
  add(boundary.dependencies, 'evidenceBoundary.dependencies');
  add(runtimeEntry?.dependencies, 'dependencies');
  add(runtimeEntry?.reconstructionEvidence, 'reconstructionEvidence');
  add(runtimeEntry?.reconstructionCorrections, 'reconstructionCorrections');

  const direct = [
    [runtimeEntry?.realityChange?.rawStatement, 'realityChange.rawStatement'],
    [runtimeEntry?.realityChange?.normalizedStatement, 'realityChange.normalizedStatement'],
    [runtimeEntry?.timing?.statedTiming, 'timing.statedTiming'],
    [runtimeEntry?.timing?.normalizedTiming, 'timing.normalizedTiming'],
    [runtimeEntry?.initialContext?.summary, 'initialContext.summary'],
    [runtimeEntry?.emergingTension?.summary, 'emergingTension.summary'],
    [runtimeEntry?.userInterpretation?.summary, 'userInterpretation.summary']
  ];
  direct.forEach(([raw, sourceField]) => {
    if (clean(raw)) rows.push({ raw: clean(raw), value: {}, sourceField, sourceRound: null });
  });

  return rows;
}

export function classifyEvidence(raw, context = {}) {
  const text = clean(raw);
  const field = clean(context.sourceField).toLowerCase();
  const target = clean(context.target || context.value?.target).toLowerCase();
  const explicit = clean(context.value?.classification || context.value?.evidenceClass);
  if (EVIDENCE_CLASSIFICATIONS.includes(explicit)) return explicit;
  if (field.includes('timing') || TIME.some(pattern => pattern.test(text))) return 'reported_time';
  if (field.includes('counter') || includesAny(text, COUNTER)) return 'reported_counter_condition';
  if (target === 'identity_style' || includesAny(text, IDENTITY)) return 'reported_identity';
  if (target === 'experience_style' || includesAny(text, EMOTION)) return 'reported_emotion';
  if (target === 'expression_style') return 'reported_experience';
  if (target === 'agency_style' || includesAny(text, BEHAVIOR)) return 'reported_behavior';
  if (includesAny(text, RELATIONSHIP)) return 'reported_relationship';
  if (target === 'runtime_conditions' || target === 'carrier_signatures') return 'reported_condition';
  if (field.includes('interpretation')) return 'reported_belief';
  if (field.includes('known') || field.includes('observed')) return 'direct_observation';
  if (field.includes('realitychange')) return 'reported_event';
  return 'reported_experience';
}

function normalizedDuplicateKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[“”"'`，。！？、；：,.!?;:()[\]{}]/g, '')
    .replace(/\s+/g, '');
}

function tokens(value) {
  return new Set(
    clean(value).toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1)
  );
}

function semanticSimilarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter(token => b.has(token)).length;
  return overlap / Math.min(a.size, b.size);
}

function buildEvidence(runtimeEntry) {
  return sourceItems(runtimeEntry).map((source, index) => {
    const classification = classifyEvidence(source.raw, {
      sourceField: source.sourceField,
      value: source.value,
      target: source.value?.target
    });
    return {
      evidence_id: clean(source.value?.evidenceId) || stableId('evidence', index),
      raw_text: source.raw,
      source_round: source.sourceRound,
      source_field: source.sourceField,
      classification,
      confirmation_status: clean(source.value?.confirmationStatus) || 'reported',
      maturity: clean(source.value?.maturity) || 'candidate_identified',
      applicable_views: ['customer', 'evidence', 'technical'],
      lineage: {
        source_evidence_id: clean(source.value?.evidenceId),
        source: clean(source.value?.source) || source.sourceField
      }
    };
  });
}

function consolidateDuplicates(evidence) {
  const groups = [];
  evidence.forEach(item => {
    const exact = groups.find(group => group.items.some(candidate => candidate.raw_text === item.raw_text));
    const normalized = groups.find(group => group.items.some(candidate =>
      normalizedDuplicateKey(candidate.raw_text) === normalizedDuplicateKey(item.raw_text)
    ));
    const semantic = groups.find(group => group.items.some(candidate =>
      semanticSimilarity(candidate.raw_text, item.raw_text) >= 0.86
    ));
    const group = exact || normalized || semantic;
    if (group) {
      group.items.push(item);
      group.duplicate_type = exact
        ? 'exact_duplicate'
        : normalized
          ? 'normalized_duplicate'
          : 'semantic_duplicate';
    } else {
      groups.push({ items: [item], duplicate_type: 'related_but_distinct' });
    }
  });

  return groups.map((group, index) => ({
    canonical_evidence_id: stableId('canonical', index),
    merged_evidence_ids: group.items.map(item => item.evidence_id),
    duplicate_type: group.duplicate_type,
    canonical_text: group.items[0].raw_text,
    source_count: group.items.length
  }));
}

function parseReportedTime(value) {
  const source = clean(value);
  let match = source.match(/(\d+|[一二两三四五六七八九十]+)\s*(天|周|星期|个月|月|年)前/);
  if (match) {
    const unit = { 天: 'day', 周: 'week', 星期: 'week', 个月: 'month', 月: 'month', 年: 'year' }[match[2]];
    const chineseNumbers = {
      一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
      六: 6, 七: 7, 八: 8, 九: 9, 十: 10
    };
    const amount = /^\d+$/.test(match[1])
      ? Number(match[1])
      : chineseNumbers[match[1]] || null;
    return { type: 'relative_duration', value: amount, unit };
  }
  match = source.match(/\b(\d+)\s*(day|week|month|year)s?\s*ago\b/i);
  if (match) return { type: 'relative_duration', value: Number(match[1]), unit: match[2].toLowerCase() };
  match = source.match(/\b((?:19|20)\d{2})(?:-(\d{1,2})(?:-(\d{1,2}))?)?\b/);
  if (match) return {
    type: match[3] ? 'date' : match[2] ? 'month' : 'year',
    value: [match[1], match[2], match[3]].filter(Boolean).join('-')
  };
  match = source.match(/((?:19|20)\d{2})年(?:(\d{1,2})月(?:(\d{1,2})日)?)?/);
  if (match) return {
    type: match[3] ? 'date' : match[2] ? 'month' : 'year',
    value: [match[1], match[2], match[3]].filter(Boolean).join('-')
  };
  return { type: 'unresolved_expression', value: source };
}

function timePrecision(normalized) {
  return normalized.type === 'date'
    ? 'exact'
    : normalized.type === 'month' || normalized.type === 'year'
      ? 'bounded'
      : 'approximate';
}

function timeComparable(normalized) {
  if (normalized.type === 'relative_duration') return `${normalized.value}:${normalized.unit}`;
  return `${normalized.type}:${normalized.value}`;
}

function buildTimeline(evidence) {
  const classifiedTime = evidence.filter(item => item.classification === 'reported_time');
  const correctedTime = classifiedTime.filter(item =>
    item.source_field === 'reconstructionCorrections'
  );
  const timeEvidence = correctedTime.length ? correctedTime : classifiedTime;
  const events = timeEvidence.map((item, index) => {
    const normalized_time = parseReportedTime(item.raw_text);
    return {
      event_id: stableId('event', index),
      event_type: index === 0 ? 'onset' : 'reported_time_marker',
      label: item.raw_text,
      description: item.raw_text,
      reported_time: item.raw_text,
      normalized_time,
      normalization_basis: 'reported_expression_only',
      precision: timePrecision(normalized_time),
      evidence_ids: [item.evidence_id],
      confirmation_status: item.confirmation_status === 'confirmed' ? 'confirmed' : 'reported',
      confidence: normalized_time.type === 'unresolved_expression' ? 0.45 : 0.72,
      conflict_ids: [],
      sequence_order: index + 1
    };
  });
  const conflicts = [];
  for (let left = 0; left < events.length; left += 1) {
    for (let right = left + 1; right < events.length; right += 1) {
      if (timeComparable(events[left].normalized_time) === timeComparable(events[right].normalized_time)) continue;
      const conflict = {
        conflict_id: stableId('conflict_temporal', conflicts.length),
        conflict_type: 'temporal_conflict',
        severity: 'blocking',
        evidence_ids: [...events[left].evidence_ids, ...events[right].evidence_ids],
        values: [events[left].reported_time, events[right].reported_time],
        message_key: 'reconstruction.conflicts.temporal',
        resolution_status: 'unresolved',
        blocking_reading: true,
        created_at: '',
        resolved_at: null,
        resolution_revision_id: null
      };
      conflicts.push(conflict);
      events[left].conflict_ids.push(conflict.conflict_id);
      events[right].conflict_ids.push(conflict.conflict_id);
    }
  }
  return {
    timeline_status: events.length === 0 ? 'not_assessed' : conflicts.length ? 'conflicted' : 'partial',
    time_confidence: events.length
      ? Number((events.reduce((sum, event) => sum + event.confidence, 0) / events.length).toFixed(2))
      : 0,
    events,
    temporal_conflicts: conflicts
  };
}

function conditionDirection(item) {
  return item.classification === 'reported_counter_condition' || includesAny(item.raw_text, COUNTER)
    ? 'counter_condition'
    : 'enhancing_condition';
}

function conditionSubtype(value) {
  if (includesAny(value, RELATIONSHIP)) return 'relationship_condition';
  if (TIME.some(pattern => pattern.test(value))) return 'temporal_condition';
  if (/收入|付款|支付|账单|money|income|payment|bill|resource/i.test(value)) return 'resource_condition';
  if (/环境|地点|家里|办公室|environment|place|home|office/i.test(value)) return 'environment_condition';
  return 'context_condition';
}

function splitConditionText(value) {
  return clean(value).split(/[、,，；;]|\band\b/i).map(clean).filter(part => part.length >= 2);
}

function buildConditions(evidence) {
  const source = evidence.filter(item =>
    ['reported_condition', 'reported_relationship', 'reported_counter_condition', 'reported_time'].includes(item.classification) ||
    /条件|情况|更明显|较少出现|when|condition|uncertain|payment|催促|复盘|账单/i.test(item.raw_text)
  );
  const conditions = [];
  source.forEach(item => {
    splitConditionText(item.raw_text).forEach(part => {
      if (!/条件|情况|更明显|较少|收入|付款|支付|催促|月底|账单|when|income|payment|less|review|bill|uncertain/i.test(part)) return;
      conditions.push({
        condition_id: stableId('condition', conditions.length),
        condition_type: conditionDirection({ ...item, raw_text: part }),
        condition_subtype: conditionSubtype(part),
        label: part,
        description: part,
        maturity: 'candidate_identified',
        evidence_ids: [item.evidence_id],
        frequency: 'unknown',
        confidence: 0.64,
        confirmation_status: 'tentative'
      });
    });
  });
  return {
    status: conditions.length ? 'candidate_identified' : 'not_mentioned',
    enhancing: conditions.filter(item => item.condition_type === 'enhancing_condition'),
    reducing: conditions.filter(item => item.condition_type === 'counter_condition'),
    all: conditions
  };
}

function buildInfluenceMap(runtimeEntry, evidence, conditions) {
  const change = clean(
    runtimeEntry?.realityChange?.normalizedStatement ||
    runtimeEntry?.realityChange?.rawStatement
  );
  const changeId = 'reality_change_001';
  const relations = [];
  conditions.all.forEach(condition => {
    relations.push({
      relation_id: stableId('relation', relations.length),
      source_id: condition.condition_id,
      target_id: changeId,
      relation_type: condition.condition_type === 'counter_condition' ? 'reduces' : 'amplifies',
      direction: 'directed',
      evidence_ids: condition.evidence_ids,
      classification: 'reported_relation',
      confirmation_status: 'tentative',
      confidence: 0.58,
      explanation: condition.condition_type === 'counter_condition'
        ? `${condition.label} → ${change}`
        : `${condition.label} → ${change}`
    });
  });
  asArray(runtimeEntry?.affectedDomains).forEach(domain => {
    const label = itemText(domain);
    if (!label) return;
    relations.push({
      relation_id: stableId('relation', relations.length),
      source_id: changeId,
      target_id: `domain_${normalizedDuplicateKey(label)}`,
      relation_type: 'spreads_to',
      direction: 'directed',
      evidence_ids: evidence
        .filter(item => item.source_field === 'realityChange.rawStatement')
        .map(item => item.evidence_id),
      classification: 'system_derived',
      confirmation_status: 'tentative',
      confidence: 0.5,
      explanation: `${change} → ${label}`
    });
  });
  return { status: relations.length ? 'partial' : 'not_assessed', relations };
}

function buildUnknownQuestions(timeline, conditions) {
  const questions = timeline.temporal_conflicts.map((conflict, index) => ({
    question_id: stableId('question', index),
    unknown_type: 'temporal_conflict',
    question_key: 'reconstruction.questions.resolveTemporalConflict',
    question_text: '',
    options: [
      conflict.values[0],
      conflict.values[1],
      'progressive_onset',
      'custom'
    ],
    related_evidence_ids: conflict.evidence_ids,
    related_conflict_ids: [conflict.conflict_id],
    priority: 'high',
    blocking_reading: true,
    answer_type: 'single_choice',
    status: 'open'
  }));
  if (!conditions.enhancing.length && !conditions.reducing.length) {
    questions.push({
      question_id: stableId('question', questions.length),
      unknown_type: 'condition_pattern',
      question_key: 'reconstruction.questions.conditions',
      question_text: '',
      options: [],
      related_evidence_ids: [],
      related_conflict_ids: [],
      priority: 'medium',
      blocking_reading: false,
      answer_type: 'text',
      status: 'open'
    });
  }
  return questions;
}

function explainConfidence(evidence, timeline, conditions) {
  const conflictPenalty = timeline.temporal_conflicts.length ? -0.25 : 0;
  const components = {
    source_strength: evidence.length ? 0.72 : 0,
    source_consistency: timeline.temporal_conflicts.length ? 0.35 : 0.75,
    temporal_precision: timeline.events.length ? timeline.time_confidence : 0,
    cross_evidence_support: clamp(evidence.length / 8),
    conflict_penalty: conflictPenalty,
    confirmation_level: evidence.some(item => item.confirmation_status === 'confirmed') ? 0.85 : 0.58,
    classification_certainty: evidence.length ? 0.76 : 0
  };
  const positive = Object.entries(components)
    .filter(([key]) => key !== 'conflict_penalty')
    .reduce((sum, [, value]) => sum + value, 0) / 6;
  const score = clamp(positive + conflictPenalty);
  return {
    score: Number(score.toFixed(2)),
    level: score >= 0.75 ? 'high' : score >= 0.45 ? 'moderate' : 'low',
    components,
    explanation_keys: [
      evidence.length > 1
        ? 'reconstruction.confidence.multipleSources'
        : 'reconstruction.confidence.limitedSources',
      ...(timeline.temporal_conflicts.length
        ? ['reconstruction.confidence.temporalConflict']
        : [])
    ]
  };
}

export function evaluateReadingGate({ runtimeEntry, evidence, timeline, unknownQuestions, version }) {
  const blocking = [];
  if (!clean(runtimeEntry?.realityChange?.rawStatement || runtimeEntry?.realityChange?.normalizedStatement)) {
    blocking.push('primary_change_missing');
  }
  if (!evidence.length) blocking.push('traceable_evidence_missing');
  timeline.temporal_conflicts
    .filter(conflict => conflict.blocking_reading && conflict.resolution_status === 'unresolved')
    .forEach(conflict => blocking.push(conflict.conflict_id));
  const warnings = [];
  if (!timeline.events.length) warnings.push('timeline_not_assessed');
  if (unknownQuestions.some(question => !question.blocking_reading)) warnings.push('non_blocking_unknowns');
  const status = blocking.length ? 'blocked' : warnings.length ? 'ready_with_warnings' : 'ready';
  return {
    status,
    allowed: !blocking.length,
    blocking_reasons: blocking,
    warnings,
    required_questions: unknownQuestions.filter(question => question.blocking_reading).map(question => question.question_id),
    reconstruction_version: version,
    evaluated_at: ''
  };
}

function materialityForCorrection(correction) {
  const field = clean(correction?.field);
  return [
    'reported_time', 'normalized_time', 'sequence_order', 'condition_type',
    'relation_type', 'direction', 'confirmation_status', 'primary_change'
  ].includes(field)
    ? 'material'
    : 'non_material';
}

function applyCorrection(runtimeEntry, correction) {
  const copy = JSON.parse(JSON.stringify(runtimeEntry || {}));
  const targetType = clean(correction?.target_type);
  const value = correction?.new_value;
  if (targetType === 'timeline_event' && clean(correction?.field) === 'reported_time') {
    copy.timing = { ...asObject(copy.timing), statedTiming: clean(value), normalizedTiming: '' };
    copy.reconstructionCorrections = [
      ...asArray(copy.reconstructionCorrections),
      {
        evidenceId: clean(correction?.revision_id),
        statement: clean(value),
        classification: 'reported_time',
        confirmationStatus: 'confirmed',
        source: 'customer_inline_correction'
      }
    ];
  } else if (targetType === 'primary_change') {
    copy.realityChange = {
      ...asObject(copy.realityChange),
      rawStatement: clean(value),
      normalizedStatement: clean(value)
    };
  }
  return copy;
}

function stalenessRecords(artifacts, materiality, version, revision, timestamp) {
  return asArray(artifacts).map(artifact => ({
    ...artifact,
    status: materiality === 'material' ? 'stale' : clean(artifact?.status) || 'current',
    based_on_reconstruction_version: Number(artifact?.based_on_reconstruction_version || version - 1),
    current_reconstruction_version: version,
    stale_reason: materiality === 'material'
      ? `material_${clean(revision.field || revision.target_type)}_revision`
      : '',
    revision_id: revision.revision_id,
    marked_at: materiality === 'material' ? timestamp : ''
  }));
}

export function buildReconstructionExperience(runtimeEntry, legacyReconstruction = {}, options = {}) {
  const suppliedPrevious = asObject(options.previousReconstruction);
  const previousLineage = asObject(suppliedPrevious?.views?.technical?.lineage);
  const previous = clean(previousLineage.runtime_entry_id) &&
    clean(previousLineage.runtime_entry_id) !== clean(runtimeEntry?.runtimeEntryId)
    ? {}
    : suppliedPrevious;
  const correction = asObject(options.correction);
  const timestamp = now(options);
  const correctedEntry = Object.keys(correction).length
    ? applyCorrection(runtimeEntry, correction)
    : runtimeEntry;
  const previousVersion = Number(previous.reconstruction_version || 0);
  const version = Math.max(1, previousVersion + (Object.keys(correction).length ? 1 : 0));
  const evidence = buildEvidence(correctedEntry);
  const canonicalEvidence = consolidateDuplicates(evidence);
  const timeline = buildTimeline(evidence);
  timeline.temporal_conflicts.forEach(conflict => { conflict.created_at = timestamp; });
  const conditions = buildConditions(evidence);
  const influenceMap = buildInfluenceMap(correctedEntry, evidence, conditions);
  const unknownQuestions = buildUnknownQuestions(timeline, conditions);
  const confidence = explainConfidence(evidence, timeline, conditions);
  const readingGate = evaluateReadingGate({
    runtimeEntry: correctedEntry,
    evidence,
    timeline,
    unknownQuestions,
    version
  });
  readingGate.evaluated_at = timestamp;
  const materiality = Object.keys(correction).length ? materialityForCorrection(correction) : 'none';
  const revision = Object.keys(correction).length
    ? {
        revision_id: clean(correction.revision_id) || `revision_${timestamp.replace(/\D/g, '')}`,
        target_type: clean(correction.target_type),
        target_id: clean(correction.target_id),
        field: clean(correction.field),
        previous_value: correction.previous_value ?? null,
        new_value: correction.new_value ?? null,
        reason: clean(correction.reason),
        source: clean(correction.source) || 'customer_inline_correction',
        materiality,
        created_at: timestamp
      }
    : null;
  const conflicts = [...timeline.temporal_conflicts];
  const primaryChange = clean(
    correctedEntry?.realityChange?.normalizedStatement ||
    correctedEntry?.realityChange?.rawStatement
  );
  const summary = {
    reconstruction_id: clean(previous.reconstruction_id) ||
      `reconstruction_${clean(correctedEntry?.runtimeEntryId) || 'runtime'}`,
    reconstruction_version: version,
    summary_status: readingGate.status === 'blocked' ? 'needs_confirmation' : 'ready',
    primary_change: primaryChange,
    timeline_status: timeline.timeline_status,
    condition_status: conditions.status,
    influence_status: influenceMap.status,
    confirmed_count: evidence.filter(item => item.confirmation_status === 'confirmed').length,
    candidate_count: conditions.all.length + influenceMap.relations.filter(item => item.confirmation_status === 'tentative').length,
    unknown_count: unknownQuestions.length,
    conflict_count: conflicts.length,
    reading_gate_status: readingGate.status,
    source_entry_version: Number(correctedEntry?.entryVersion || correctedEntry?.version || 1),
    evidence_version: Number(correctedEntry?.evidenceVersion || 1),
    created_at: clean(previous.created_at) || timestamp,
    updated_at: timestamp
  };
  const technicalView = {
    legacy_reconstruction: legacyReconstruction,
    figure_mapping: {
      figure_0A: legacyReconstruction?.grammarStates || [],
      figure_4A: legacyReconstruction?.carrier || {},
      figure_5E: legacyReconstruction?.conscious || {}
    },
    evidence_structure: legacyReconstruction?.evidenceBoundary || {},
    confidence_components: confidence.components,
    conflicts,
    revision_metadata: revision,
    lineage: {
      runtime_entry_id: clean(correctedEntry?.runtimeEntryId),
      source_entry_version: summary.source_entry_version,
      evidence_version: summary.evidence_version,
      previous_reconstruction_version: previousVersion || null
    }
  };
  const experience = {
    schema_version: 'phi-os.reconstruction-experience.v1',
    ...summary,
    summary,
    timeline,
    conditions,
    influence_map: influenceMap,
    evidence: { items: evidence, canonical: canonicalEvidence },
    conflicts,
    missing_evidence: unknownQuestions.map(question => ({
      unknown_type: question.unknown_type,
      maturity: question.blocking_reading ? 'blocked_by_conflict' : 'not_mentioned',
      question_id: question.question_id
    })),
    unknown_questions: unknownQuestions,
    confidence,
    reading_gate: readingGate,
    revision,
    revision_history: [
      ...asArray(previous.revision_history),
      ...(revision ? [revision] : [])
    ],
    previous_versions: [
      ...asArray(previous.previous_versions),
      ...(previousVersion ? [{
        reconstruction_version: previousVersion,
        reconstruction_id: clean(previous.reconstruction_id),
        summary: asObject(previous.summary),
        timeline: asObject(previous.timeline),
        conditions: asObject(previous.conditions),
        influence_map: asObject(previous.influence_map),
        conflicts: asArray(previous.conflicts),
        reading_gate: asObject(previous.reading_gate),
        updated_at: clean(previous.updated_at)
      }] : [])
    ],
    downstream_staleness: revision
      ? stalenessRecords(options.downstreamArtifacts, materiality, version, revision, timestamp)
      : asArray(options.downstreamArtifacts),
    views: {
      customer: {
        primary_change: primaryChange,
        timeline: timeline.events,
        enhancing_conditions: conditions.enhancing,
        reducing_conditions: conditions.reducing,
        influence_spread: influenceMap.relations,
        confirmed: canonicalEvidence.filter(item =>
          item.merged_evidence_ids.some(id =>
            evidence.find(candidate => candidate.evidence_id === id)?.confirmation_status === 'confirmed'
          )
        ),
        tentative: canonicalEvidence.filter(item =>
          !item.merged_evidence_ids.some(id =>
            evidence.find(candidate => candidate.evidence_id === id)?.confirmation_status === 'confirmed'
          )
        ),
        unknown: unknownQuestions,
        reading_gate: readingGate,
        confidence: { level: confidence.level, explanation_keys: confidence.explanation_keys }
      },
      evidence: {
        items: evidence,
        canonical: canonicalEvidence,
        timeline_links: timeline.events,
        condition_links: conditions.all,
        influence_links: influenceMap.relations,
        conflicts
      },
      technical: technicalView
    }
  };
  return { runtimeEntry: correctedEntry, experience };
}

export default buildReconstructionExperience;
