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
const INTENTION = [
  '希望', '想要', '目标', '打算', '根据财务资料', '区分必要投入',
  'hope', 'want to', 'intend', 'goal', 'based on financial data'
];
const EXPERIENCE = [
  '张力', '安全感与发展', '内在冲突', '不再迷失', 'experience',
  'inner tension', 'sense of safety'
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
  /(?:19|20)\d{2}年(?:\d{1,2}月(?:\d{1,2}日)?)?/
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
  if (includesAny(text, INTENTION)) return 'reported_intention';
  if (includesAny(text, RELATIONSHIP)) return 'reported_relationship';
  if (target === 'experience_style' || includesAny(text, EMOTION)) return 'reported_emotion';
  if (includesAny(text, EXPERIENCE)) return 'reported_experience';
  if (target === 'expression_style') return 'reported_experience';
  if (target === 'agency_style' || includesAny(text, BEHAVIOR)) return 'reported_behavior';
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

const SEMANTIC_CONCEPTS = Object.freeze([
  { id: 'income_uncertainty', terms: ['收入不确定', '业务收入不确定', '个人业务收入不确定', '收入确定性下降', 'income uncertainty', 'uncertain income'] },
  { id: 'large_payment', terms: ['一次性大额付款', '一次支付较大金额', '大额支付', '大额付款', 'large payment', 'large one-time payment'] },
  { id: 'no_partner_pressure', terms: ['丈夫没有催促', '伴侣没有催促', '没有受到伴侣催促', 'without partner pressure', 'partner does not urge'] },
  { id: 'partner_pressure', terms: ['丈夫催促', '伴侣催促', '催促尽快决定', 'partner pressure', 'partner urging'] },
  { id: 'month_end_review', terms: ['月底复盘', '月底查看收入和支出', '月底查看收支', 'month-end review', 'reviewing income and expenses'] },
  { id: 'fixed_bills', terms: ['支付固定账单', '固定账单', 'regular bills', 'fixed bills'] },
  { id: 'child_necessities', terms: ['孩子需要的用品', '孩子必需品', 'child necessities', 'items the child needs'] },
  { id: 'household_resources', terms: ['家庭并没有完全失去收入', '家庭仍有储蓄', '丈夫也有收入', '其他收入来源', 'household savings', 'other household income'] },
  { id: 'spending_tension', terms: ['花钱时的紧张', '害怕花钱', '花钱的恐惧', 'spending tension', 'fear of spending'] },
  { id: 'balance_checking', terms: ['反复检查余额', '查看余额次数增加', 'repeated balance checking', 'check the balance repeatedly'] },
  { id: 'purchase_delay', terms: ['支出决定拖延', '拖延决定', '推迟购买', 'purchase delay', 'delay spending decisions'] },
  { id: 'business_investment_delay', terms: ['业务工具投入', '工具采购', '业务投入', 'business investment', 'business tools'] },
  { id: 'reduced_social_activity', terms: ['社交活动减少', '减少社交', 'reduced social activity'] },
  { id: 'reduced_work_confidence', terms: ['工作信心下降', '工作能力的信心下降', '失去工作信心', 'reduced work confidence'] }
]);

function semanticConcept(value) {
  const source = normalizedDuplicateKey(value);
  const found = SEMANTIC_CONCEPTS.find(concept =>
    concept.terms.some(term => source.includes(normalizedDuplicateKey(term)))
  );
  return found?.id || '';
}

function characterBigrams(value) {
  const source = normalizedDuplicateKey(value);
  const values = new Set();
  for (let index = 0; index < source.length - 1; index += 1) {
    values.add(source.slice(index, index + 2));
  }
  return values;
}

function semanticSimilarity(left, right) {
  const leftConcept = semanticConcept(left);
  const rightConcept = semanticConcept(right);
  if (leftConcept && leftConcept === rightConcept) return 1;
  const a = characterBigrams(left);
  const b = characterBigrams(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter(token => b.has(token)).length;
  return overlap / Math.min(a.size, b.size);
}

function canonicalSemanticKey(value, dimensions = {}) {
  return [
    semanticConcept(value) || normalizedDuplicateKey(value),
    clean(dimensions.classification),
    clean(dimensions.condition_type),
    clean(dimensions.relation_type),
    clean(dimensions.canonical_target)
  ].join('|');
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
      source_target: clean(source.value?.target),
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
    const exact = groups.find(group => group.items.some(candidate =>
      candidate.classification === item.classification &&
      candidate.raw_text === item.raw_text
    ));
    const normalized = groups.find(group => group.items.some(candidate =>
      candidate.classification === item.classification &&
      normalizedDuplicateKey(candidate.raw_text) === normalizedDuplicateKey(item.raw_text)
    ));
    const semantic = groups.find(group => group.items.some(candidate =>
      candidate.classification === item.classification &&
      semanticSimilarity(candidate.raw_text, item.raw_text) >= 0.72
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
    canonical_semantic_key: canonicalSemanticKey(group.items[0].raw_text, {
      classification: group.items[0].classification
    }),
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

function reportedTimeText(value) {
  const source = clean(value);
  const patterns = [
    /(?:\d+|[一二两三四五六七八九十]+)\s*(?:天|周|星期|个月|月|年)前/,
    /\b\d+\s*(?:day|week|month|year)s?\s*ago\b/i,
    /\b(?:19|20)\d{2}(?:-\d{1,2}(?:-\d{1,2})?)?\b/,
    /(?:19|20)\d{2}年(?:\d{1,2}月(?:\d{1,2}日)?)?/
  ];
  return patterns.map(pattern => source.match(pattern)?.[0]).find(Boolean) || '';
}

function reportedTimeExpressions(value) {
  const source = clean(value);
  const pattern = /(?:\d+|[一二两三四五六七八九十]+)\s*(?:天|周|星期|个月|月|年)前|\b\d+\s*(?:day|week|month|year)s?\s*ago\b|\b(?:19|20)\d{2}(?:-\d{1,2}(?:-\d{1,2})?)?\b|(?:19|20)\d{2}年(?:\d{1,2}月(?:\d{1,2}日)?)?/gi;
  return [...source.matchAll(pattern)].map(match => match[0]);
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
  const classifiedTime = evidence.filter(item =>
    item.classification === 'reported_time' &&
    (
      item.source_field.startsWith('timing.') ||
      item.source_field.startsWith('realityChange.') ||
      item.source_field === 'reconstructionCorrections' ||
      ['carrier_signatures', 'runtime_conditions'].includes(item.source_target)
    ) &&
    Boolean(reportedTimeText(item.raw_text))
  );
  const correctedTime = classifiedTime.filter(item =>
    item.source_field === 'reconstructionCorrections' &&
    item.lineage?.source === 'customer_inline_correction' &&
    item.confirmation_status === 'confirmed'
  );
  const timeEvidence = correctedTime.length ? correctedTime : classifiedTime;
  const eventGroups = [];
  timeEvidence.forEach(item => {
    const expressions = reportedTimeExpressions(item.raw_text);
    const isConfirmedProgressive =
      item.source_field === 'reconstructionCorrections' &&
      item.lineage?.source === 'customer_inline_correction' &&
      item.confirmation_status === 'confirmed' &&
      expressions.length > 1;
    const reported = isConfirmedProgressive ? item.raw_text : expressions[0];
    const normalized = isConfirmedProgressive
      ? {
          type: 'progressive_range',
          values: expressions.map(parseReportedTime)
        }
      : parseReportedTime(reported);
    const key = timeComparable(normalized);
    const existing = eventGroups.find(group => group.key === key);
    if (existing) {
      existing.evidence.push(item);
    } else {
      eventGroups.push({ key, reported, normalized, evidence: [item] });
    }
  });
  const events = eventGroups.map((group, index) => {
    const normalized_time = group.normalized;
    return {
      event_id: stableId('event', index),
      event_type: index === 0 ? 'onset' : 'reported_time_marker',
      label: group.reported,
      description: group.reported,
      reported_time: group.reported,
      normalized_time,
      normalization_basis: 'reported_expression_only',
      precision: timePrecision(normalized_time),
      evidence_ids: [...new Set(group.evidence.map(item => item.evidence_id))],
      confirmation_status: group.evidence.some(item => item.confirmation_status === 'confirmed')
        ? 'confirmed'
        : 'reported',
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

const CONDITION_DEFINITIONS = Object.freeze([
  { concept: 'income_uncertainty', type: 'enhancing_condition', zh: '个人业务收入不确定', en: 'Personal business income is uncertain' },
  { concept: 'large_payment', type: 'enhancing_condition', zh: '需要一次支付较大金额', en: 'A larger one-time payment is required' },
  { concept: 'partner_pressure', type: 'enhancing_condition', zh: '伴侣催促尽快决定', en: 'A partner urges a quick decision' },
  { concept: 'month_end_review', type: 'enhancing_condition', zh: '月底查看收入与支出', en: 'Reviewing income and expenses at month end' },
  { concept: 'fixed_bills', type: 'counter_condition', zh: '支付固定账单', en: 'Paying fixed bills' },
  { concept: 'child_necessities', type: 'counter_condition', zh: '购买孩子需要的用品', en: 'Buying items the child needs' },
  { concept: 'no_partner_pressure', type: 'counter_condition', zh: '没有受到伴侣催促', en: 'No pressure from a partner' },
  { concept: 'household_resources', type: 'counter_condition', zh: '家庭仍有储蓄与其他收入来源', en: 'The household still has savings and other income' }
]);

const FRAGMENT_START = /^(?:与此同时|第三|第一|第二|第四|或者|因此|所以|而且|以及|并且|同时|then|third|therefore|meanwhile|or|and)[，,、；;：:\s]*/i;
const FRAGMENT_END = /(?:与此同时|第三|或者|因此|当|在|时|和|与|以及|并且|then|therefore|meanwhile|or|and|when)$/i;

function validConditionUnit(value) {
  const source = clean(value);
  if (!source || normalizedDuplicateKey(source).length < 4) return false;
  if (FRAGMENT_START.test(source) || FRAGMENT_END.test(source)) return false;
  if (/^(?:第一|第二|第三|第四|其一|其二|其三)[、，,.\s]*$/i.test(source)) return false;
  if (!semanticConcept(source) && !/(?:收入|付款|支付|催促|复盘|账单|储蓄|用品|income|payment|pressure|review|bill|saving)/i.test(source)) {
    return false;
  }
  return true;
}

function languageOfEvidence(evidence) {
  return evidence.some(item => /[\u3400-\u9fff]/u.test(item.raw_text)) ? 'zh-Hans' : 'en';
}

function conditionEvidenceMatches(item, definition) {
  const concept = semanticConcept(item.raw_text);
  if (concept === definition.concept) return true;
  return SEMANTIC_CONCEPTS
    .find(candidate => candidate.id === definition.concept)
    ?.terms.some(term =>
      normalizedDuplicateKey(item.raw_text).includes(normalizedDuplicateKey(term))
    ) === true;
}

function buildConditions(evidence) {
  const language = languageOfEvidence(evidence);
  const conditions = CONDITION_DEFINITIONS.flatMap(definition => {
    const matches = evidence.filter(item => conditionEvidenceMatches(item, definition));
    if (!matches.length) return [];
    const label = language === 'zh-Hans' ? definition.zh : definition.en;
    if (!validConditionUnit(label)) return [];
    return [{
      condition_id: `condition_${definition.concept}`,
      canonical_semantic_key: canonicalSemanticKey(label, {
        classification: 'reported_condition',
        condition_type: definition.type
      }),
      canonical_concept: definition.concept,
      condition_type: definition.type,
      condition_subtype: conditionSubtype(label),
      label,
      description: label,
      maturity: 'candidate_identified',
      evidence_ids: [...new Set(matches.map(item => item.evidence_id))],
      source_count: matches.length,
      frequency: 'unknown',
      confidence: Math.min(0.82, 0.58 + matches.length * 0.06),
      confirmation_status: matches.some(item => item.confirmation_status === 'confirmed')
        ? 'confirmed'
        : 'tentative'
    }];
  });
  return {
    status: conditions.length ? 'candidate_identified' : 'not_mentioned',
    enhancing: conditions.filter(item => item.condition_type === 'enhancing_condition'),
    reducing: conditions.filter(item => item.condition_type === 'counter_condition'),
    all: conditions
  };
}

function buildInfluenceMap(runtimeEntry, evidence, conditions) {
  const language = languageOfEvidence(evidence);
  const labels = {
    current_change: ['Current change', '当前变化'],
    spending_tension: ['Tension when spending', '花钱时的紧张'],
    balance_checking: ['Repeated balance checking', '余额反复检查'],
    purchase_delay: ['Delayed spending decisions', '支出决定拖延'],
    business_investment_delay: ['Business tool investment', '业务工具投入'],
    reduced_social_activity: ['Reduced social activity', '社交活动减少'],
    reduced_work_confidence: ['Reduced work confidence', '工作信心下降']
  };
  const label = id => labels[id]?.[language === 'zh-Hans' ? 1 : 0] || id;
  const nodes = new Map();
  const addNode = (id, type, displayLabel, evidenceIds = []) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        node_id: id,
        node_type: type,
        canonical_semantic_key: id,
        label: displayLabel,
        evidence_ids: [...new Set(evidenceIds)]
      });
    }
  };
  addNode('current_change', 'reality_change', label('current_change'),
    evidence.filter(item => item.source_field.startsWith('realityChange.')).map(item => item.evidence_id));
  addNode('spending_tension', 'experience', label('spending_tension'),
    evidence.filter(item => ['reported_emotion', 'reported_experience'].includes(item.classification)).map(item => item.evidence_id));
  conditions.all.forEach(condition =>
    addNode(condition.canonical_concept, 'condition', condition.label, condition.evidence_ids)
  );
  const relations = [];
  const addRelation = ({ sourceId, targetId, type, evidenceIds, classification = 'reported_relation' }) => {
    const key = canonicalSemanticKey(sourceId, {
      relation_type: type,
      canonical_target: targetId
    });
    const existing = relations.find(item => item.canonical_semantic_key === key);
    if (existing) {
      existing.evidence_ids = [...new Set([...existing.evidence_ids, ...evidenceIds])];
      return;
    }
    const source = nodes.get(sourceId);
    const target = nodes.get(targetId);
    if (!source || !target) return;
    relations.push({
      relation_id: stableId('relation', relations.length),
      canonical_semantic_key: key,
      source_id: sourceId,
      source_label: source.label,
      target_id: targetId,
      target_label: target.label,
      relation_type: type,
      direction: 'directed',
      evidence_ids: [...new Set(evidenceIds)],
      classification,
      confirmation_status: 'tentative',
      confidence: classification === 'reported_relation' ? 0.64 : 0.5,
      explanation: `${source.label} → ${target.label}`
    });
  };
  conditions.all.forEach(condition => {
    addRelation({
      sourceId: condition.canonical_concept,
      targetId: 'spending_tension',
      type: condition.condition_type === 'counter_condition' ? 'reduces' : 'amplifies',
      evidenceIds: condition.evidence_ids
    });
  });
  const behaviorRelations = [
    ['balance_checking', 'spending_tension', 'maintains'],
    ['purchase_delay', 'spending_tension', 'maintains'],
    ['business_investment_delay', 'purchase_delay', 'constrains'],
    ['reduced_social_activity', 'current_change', 'spreads_to'],
    ['reduced_work_confidence', 'current_change', 'spreads_to']
  ];
  behaviorRelations.forEach(([targetId, sourceId, type]) => {
    const matches = evidence.filter(item => semanticConcept(item.raw_text) === targetId);
    if (!matches.length) return;
    addNode(targetId, targetId.includes('confidence') ? 'identity' : 'behavior', label(targetId),
      matches.map(item => item.evidence_id));
    addRelation({
      sourceId,
      targetId,
      type,
      evidenceIds: matches.map(item => item.evidence_id),
      classification: 'reported_relation'
    });
  });
  return {
    status: relations.length ? 'partial' : 'not_assessed',
    nodes: [...nodes.values()],
    relations
  };
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
  questions.push({
    question_id: stableId('question', questions.length),
    unknown_type: 'spending_scope',
    question_key: 'reconstruction.w14.questions.spendingScope',
    question_text: '',
    options: [],
    related_evidence_ids: [],
    related_conflict_ids: [],
    priority: 'medium',
    blocking_reading: false,
    answer_type: 'text',
    status: 'open'
  });
  if (conditions.all.some(condition =>
    ['partner_pressure', 'no_partner_pressure'].includes(condition.canonical_concept)
  )) {
    questions.push({
      question_id: stableId('question', questions.length),
      unknown_type: 'counter_condition_confirmation',
      question_key: 'reconstruction.w14.questions.noPartnerPressure',
      question_text: '',
      options: ['yes', 'partly', 'no', 'uncertain'],
      related_evidence_ids: conditions.all
        .filter(condition => ['partner_pressure', 'no_partner_pressure'].includes(condition.canonical_concept))
        .flatMap(condition => condition.evidence_ids),
      related_conflict_ids: [],
      priority: 'medium',
      blocking_reading: false,
      answer_type: 'single_choice',
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

export function evaluateReadingGate({
  runtimeEntry,
  evidence,
  timeline,
  unknownQuestions,
  version,
  sourceEntryVersion,
  sourceEvidenceVersion,
  expectedReconstructionVersion
}) {
  const blocking = [];
  if (!clean(runtimeEntry?.realityChange?.rawStatement || runtimeEntry?.realityChange?.normalizedStatement)) {
    blocking.push('primary_change_missing');
  }
  if (!evidence.length) blocking.push('traceable_evidence_missing');
  if (
    Number.isFinite(Number(expectedReconstructionVersion)) &&
    Number(expectedReconstructionVersion) !== Number(version)
  ) {
    blocking.push('reconstruction_version_mismatch');
  }
  if (
    Number.isFinite(Number(runtimeEntry?.entryVersion)) &&
    Number(runtimeEntry.entryVersion) !== Number(sourceEntryVersion)
  ) {
    blocking.push('entry_version_mismatch');
  }
  if (
    Number.isFinite(Number(runtimeEntry?.evidenceVersion)) &&
    Number(runtimeEntry.evidenceVersion) !== Number(sourceEvidenceVersion)
  ) {
    blocking.push('evidence_version_mismatch');
  }
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
        source: 'customer_inline_correction',
        target_type: targetType,
        target_id: clean(correction?.target_id),
        field: clean(correction?.field),
        new_value: value
      }
    ];
  } else if (targetType === 'primary_change') {
    copy.realityChange = {
      ...asObject(copy.realityChange),
      rawStatement: clean(value),
      normalizedStatement: clean(value)
    };
  } else {
    copy.reconstructionCorrections = [
      ...asArray(copy.reconstructionCorrections),
      {
        evidenceId: clean(correction?.revision_id),
        statement: clean(value),
        classification: targetType === 'evidence'
          ? 'reported_experience'
          : 'system_derived',
        confirmationStatus: 'confirmed',
        source: 'customer_inline_correction',
        target_type: targetType,
        target_id: clean(correction?.target_id),
        field: clean(correction?.field),
        new_value: value
      }
    ];
  }
  return copy;
}

function applyStructuredCorrections({ runtimeEntry, correction, evidence, conditions, influenceMap, unknownQuestions }) {
  const records = [
    ...asArray(runtimeEntry?.reconstructionCorrections),
    ...(Object.keys(asObject(correction)).length ? [correction] : [])
  ];
  records.forEach(record => {
    const targetType = clean(record.target_type);
    const targetId = clean(record.target_id);
    const field = clean(record.field);
    const value = record.new_value ?? record.statement;
    if (targetType === 'condition') {
      const target = conditions.all.find(item => item.condition_id === targetId);
      if (target && ['condition_type', 'confirmation_status', 'maturity'].includes(field)) {
        target[field] = clean(value);
      }
    }
    if (targetType === 'influence_relation') {
      const target = influenceMap.relations.find(item => item.relation_id === targetId);
      if (target && ['relation_type', 'direction', 'confirmation_status'].includes(field)) {
        target[field] = clean(value);
      }
    }
    if (targetType === 'evidence') {
      const target = evidence.find(item => item.evidence_id === targetId);
      if (target && ['classification', 'confirmation_status', 'maturity'].includes(field)) {
        target[field] = clean(value);
      }
    }
    if (targetType === 'unknown_question' && field === 'answer') {
      const target = unknownQuestions.find(item => item.question_id === targetId);
      if (target) {
        target.answer = value;
        target.status = 'answered';
        target.blocking_reading = false;
      }
    }
  });
  conditions.enhancing = conditions.all.filter(item => item.condition_type === 'enhancing_condition');
  conditions.reducing = conditions.all.filter(item =>
    ['counter_condition', 'reducing_condition', 'protective_condition'].includes(item.condition_type)
  );
}

function uniqueProjection(items, keyBuilder, limit = 12) {
  const seen = new Set();
  return asArray(items).filter(item => {
    const key = keyBuilder(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
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
  const timeline = buildTimeline(evidence);
  timeline.temporal_conflicts.forEach(conflict => { conflict.created_at = timestamp; });
  const conditions = buildConditions(evidence);
  const influenceMap = buildInfluenceMap(correctedEntry, evidence, conditions);
  const unknownQuestions = buildUnknownQuestions(timeline, conditions);
  applyStructuredCorrections({
    runtimeEntry: correctedEntry,
    correction,
    evidence,
    conditions,
    influenceMap,
    unknownQuestions
  });
  const canonicalEvidence = consolidateDuplicates(evidence);
  const confidence = explainConfidence(evidence, timeline, conditions);
  const sourceEntryVersion = Number(correctedEntry?.entryVersion || correctedEntry?.version || 1);
  const sourceEvidenceVersion = Number(correctedEntry?.evidenceVersion || 1);
  const readingGate = evaluateReadingGate({
    runtimeEntry: correctedEntry,
    evidence,
    timeline,
    unknownQuestions,
    version,
    sourceEntryVersion,
    sourceEvidenceVersion,
    expectedReconstructionVersion:
      correctedEntry?.expectedReconstructionVersion
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
    source_entry_version: sourceEntryVersion,
    evidence_version: sourceEvidenceVersion,
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
  const customerConditions = {
    enhancing: uniqueProjection(
      conditions.enhancing,
      item => item.canonical_semantic_key,
      8
    ),
    reducing: uniqueProjection(
      conditions.reducing,
      item => item.canonical_semantic_key,
      8
    )
  };
  const customerInfluence = uniqueProjection(
    influenceMap.relations,
    item => item.canonical_semantic_key,
    12
  );
  const customerConfirmed = uniqueProjection(
    canonicalEvidence.filter(item =>
      item.merged_evidence_ids.some(id => {
        const candidate = evidence.find(value => value.evidence_id === id);
        return candidate?.confirmation_status === 'confirmed' ||
          ['confirmed', 'supported'].includes(candidate?.maturity);
      })
    ),
    item => semanticConcept(item.canonical_text) || normalizedDuplicateKey(item.canonical_text),
    8
  );
  const customerTentative = uniqueProjection(
    canonicalEvidence.filter(item =>
      !customerConfirmed.some(confirmed =>
        (semanticConcept(confirmed.canonical_text) || normalizedDuplicateKey(confirmed.canonical_text)) ===
        (semanticConcept(item.canonical_text) || normalizedDuplicateKey(item.canonical_text))
      ) &&
      item.merged_evidence_ids.some(id => {
        const candidate = evidence.find(value => value.evidence_id === id);
        return ['reported', 'tentative'].includes(candidate?.confirmation_status) ||
          ['signal_detected', 'candidate_identified', 'partially_supported'].includes(candidate?.maturity);
      })
    ),
    item => semanticConcept(item.canonical_text) || normalizedDuplicateKey(item.canonical_text),
    8
  );
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
        timeline: uniqueProjection(
          timeline.events,
          item => canonicalSemanticKey(item.reported_time, {
            classification: 'reported_time'
          }),
          6
        ),
        enhancing_conditions: customerConditions.enhancing,
        reducing_conditions: customerConditions.reducing,
        influence_spread: customerInfluence,
        confirmed: customerConfirmed,
        tentative: customerTentative,
        unknown: uniqueProjection(
          unknownQuestions.filter(question => question.status !== 'answered'),
          item => `${item.unknown_type}|${item.question_key}`,
          6
        ),
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
