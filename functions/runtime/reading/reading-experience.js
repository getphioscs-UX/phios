/*
 * PHI OS M3C-W13 Reading Experience
 *
 * Builds a stable, evidence-bounded projection on top of the frozen Reality
 * Reading contract. It never changes evidence classification, Navigation path
 * generation, Reconstruction, or the rule-engine readiness decision.
 */

const EXPERIENCE_SCHEMA = 'phi-os.reading-experience.v1';
const BOUNDARY_KIND = 'bounded_interpretation';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function textOf(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!isObject(value)) return '';
  return cleanText(
    value.canonical_text ||
    value.canonicalText ||
    value.statement ||
    value.summary ||
    value.question ||
    value.label ||
    value.sourceText
  );
}

function stableKey(value) {
  return cleanText(value)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[，,。.!！?？；;：“”"'‘’（）()[\]{}]/g, '')
    .replace(/\s+/g, '');
}

function unique(values, limit = Infinity) {
  const seen = new Set();
  const output = [];
  for (const value of list(values)) {
    const text = textOf(value);
    const key = stableKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value);
    if (output.length >= limit) break;
  }
  return output;
}

function languageOf(reading, readingInput) {
  return reading?.outputLanguage === 'zh' ||
    cleanText(readingInput?.languageContract?.outputLanguage) === 'zh'
    ? 'zh'
    : 'en';
}

function copy(language, english, chinese) {
  return language === 'zh' ? chinese : english;
}

function reconstructionExperience(readingInput) {
  return readingInput?.reconstruction?.reconstructionExperience ||
    readingInput?.reconstruction?.experience ||
    readingInput?.reconstruction?.customerExperience ||
    {};
}

function sourceVersions(reading, readingInput) {
  const reconstruction = readingInput?.reconstruction || {};
  return {
    runtime_entry_version: Number(
      readingInput?.runtimeEntry?.version ||
      readingInput?.runtimeEntry?.entryVersion ||
      1
    ),
    evidence_version: Number(
      reconstruction.evidenceVersion ||
      readingInput?.runtimeEntry?.evidenceVersion ||
      1
    ),
    reconstruction_version: Number(
      reconstruction.reconstructionVersion ||
      reconstruction.version ||
      1
    ),
    reading_schema_version: cleanText(reading?.schemaVersion),
    reconstruction_schema_version: cleanText(reconstruction.schemaVersion)
  };
}

function reconstructionValues(experience, path, fallback = []) {
  let cursor = experience;
  for (const part of path.split('.')) cursor = cursor?.[part];
  return list(cursor).length ? list(cursor) : list(fallback);
}

function primaryChange(readingInput, language) {
  const reconstruction = readingInput?.reconstruction || {};
  const entry = readingInput?.runtimeEntry || {};
  return cleanText(
    reconstruction?.realityChange?.normalizedStatement ||
    reconstruction?.realityChange?.rawStatement ||
    reconstruction?.currentChange ||
    entry?.realityChange?.normalizedStatement ||
    entry?.realityChange?.rawStatement ||
    entry?.primaryChange ||
    copy(language, 'A meaningful change has been reported.', '当前已报告一项重要变化。')
  );
}

function conditionText(value) {
  return textOf(value?.display_text || value?.label || value);
}

function createSummary(reading, readingInput, experience, language) {
  const integrated = reading?.integratedReading || {};
  const enhancing = reconstructionValues(
    experience,
    'conditions.enhancing',
    readingInput?.reconstruction?.conditions?.enhancing
  ).map(conditionText).filter(Boolean);
  const reducing = reconstructionValues(
    experience,
    'conditions.reducing',
    readingInput?.reconstruction?.conditions?.reducing
  ).map(conditionText).filter(Boolean);
  const impacts = reconstructionValues(
    experience,
    'views.customer.influence_spread',
    readingInput?.reconstruction?.influenceMap?.relations
  );
  const change = primaryChange(readingInput, language);
  const pattern = cleanText(integrated?.primaryPattern?.summary);
  const tension = cleanText(
    readingInput?.runtimeEntry?.emergingTension?.summary ||
    readingInput?.reconstruction?.emergingTension?.summary
  ) || copy(
    language,
    'The protective response now competes with confidence, participation, and forward movement.',
    '这一保护性反应目前正与信心、参与和向前推进形成张力。'
  );

  const operation = pattern || copy(
    language,
    `The response strengthens under ${enhancing.slice(0, 2).join(' and ') || 'uncertainty'} and eases when conditions feel more bounded.`,
    `这一反应在${enhancing.slice(0, 2).join('、') || '不确定条件'}下增强，在条件更明确时减弱。`
  );
  const protection = copy(
    language,
    'Repeated checking and delay appear to protect against the possibility of an irreversible loss.',
    '反复检查与拖延似乎在保护当事人，避免作出可能无法挽回的损失决定。'
  );
  const cost = impacts.length
    ? copy(
        language,
        'The response is spreading beyond the original concern and constraining current choices.',
        '这一反应正从最初的担忧扩散，并限制当前选择。'
      )
    : copy(
        language,
        'The response may be narrowing decisions and reducing confidence.',
        '这一反应可能正在收窄决定空间并降低信心。'
      );

  return {
    what_changed: change,
    operating_pattern: operation,
    protective_function: protection,
    current_cost: cost,
    current_tension: tension,
    one_sentence_reading: copy(
      language,
      'Current evidence suggests that uncertainty activates a protective checking-and-delay pattern which reduces immediate risk but increasingly constrains work, spending, and participation.',
      '当前证据表明，不确定感会激活以反复检查和拖延为主的保护模式；它降低了眼前风险感，却越来越限制工作、支出决定与社会参与。'
    )
  };
}

function nodeLabel(node, language) {
  if (!isObject(node)) return textOf(node);
  return cleanText(
    language === 'zh'
      ? node.labels?.zh || node.label_zh || node.display_text || node.label
      : node.labels?.en || node.label_en || node.display_text || node.label
  );
}

function createRuntimeChain(readingInput, experience, summary, language) {
  const conditions = reconstructionValues(
    experience,
    'conditions.enhancing',
    readingInput?.reconstruction?.conditions?.enhancing
  ).map(conditionText).filter(Boolean);
  const nodes = reconstructionValues(
    experience,
    'influence_map.nodes',
    readingInput?.reconstruction?.influenceNodes
  );
  const findNode = id => nodeLabel(
    nodes.find(node => cleanText(node?.node_id || node?.id) === id),
    language
  );

  const chain = [
    {
      stage: 'origin',
      label: copy(language, 'Change context', '变化起点'),
      statement: summary.what_changed
    },
    {
      stage: 'condition',
      label: copy(language, 'Activating conditions', '触发条件'),
      statement: conditions.slice(0, 3).join(language === 'zh' ? '、' : '; ') ||
        copy(language, 'Uncertainty and high-stakes decisions', '不确定感与高风险决定')
    },
    {
      stage: 'adaptive_response',
      label: copy(language, 'Protective response', '保护性反应'),
      statement: findNode('spending_tension') ||
        copy(language, 'Tension rises around spending decisions', '花钱决定周围的紧张上升')
    },
    {
      stage: 'reinforcement',
      label: copy(language, 'Reinforcement', '强化方式'),
      statement: [
        findNode('balance_checking'),
        findNode('purchase_delay')
      ].filter(Boolean).join(language === 'zh' ? '、' : ' and ') ||
        copy(language, 'Repeated checking and delayed decisions', '反复检查余额与拖延决定')
    },
    {
      stage: 'spread',
      label: copy(language, 'Spread', '影响扩散'),
      statement: [
        findNode('reduced_social_activity'),
        findNode('reduced_work_confidence')
      ].filter(Boolean).join(language === 'zh' ? '、' : ' and ') ||
        copy(language, 'Reduced participation and work confidence', '社交参与减少与工作信心下降')
    },
    {
      stage: 'cost',
      label: copy(language, 'Current cost', '当前代价'),
      statement: summary.current_cost
    },
    {
      stage: 'current_tension',
      label: copy(language, 'Current tension', '当前张力'),
      statement: summary.current_tension
    }
  ];

  return chain.map((item, index) => ({
    ...item,
    order: index + 1,
    evidence_class: index < 2 ? 'reported_experience' : 'interpretation',
    status: index < 2 ? 'supported' : 'provisional'
  }));
}

function evidenceSources(reading, readingInput, experience) {
  const boundary = reading?.evidenceBoundary || {};
  const canonical = reconstructionValues(experience, 'evidence.canonical');
  if (canonical.length) return canonical;

  const buckets = [
    ['observed_evidence', boundary.observedEvidence],
    ['reported_experience', boundary.reportedExperience],
    ['interpretation', boundary.interpretation],
    ['professional_assessment', boundary.professionalAssessment]
  ];
  const result = [];
  for (const [classification, values] of buckets) {
    list(values).forEach((value, index) => result.push({
      canonical_text: textOf(value),
      evidence_classification: classification,
      source_ids: [cleanText(value?.evidenceId) || `${classification}_${index + 1}`],
      source_count: 1,
      lineage: list(value?.lineage),
      confirmation_status: cleanText(value?.confirmationStatus) || 'reported'
    }));
  }
  return result;
}

function priorityReason(index, language) {
  return [
    copy(language, 'Directly describes the current change.', '直接描述当前变化。'),
    copy(language, 'Shows the response that maintains the pattern.', '显示维持这一模式的反应。'),
    copy(language, 'Shows how the effect spreads beyond the original concern.', '显示影响如何扩散到最初担忧之外。'),
    copy(language, 'Provides a condition under which the response changes.', '提供该反应发生变化的条件。'),
    copy(language, 'Provides counter-evidence that limits the interpretation.', '提供限制当前解释的反向证据。')
  ][index] || copy(language, 'Material to the current Reading.', '与当前读取直接相关。');
}

function createPriorityEvidence(reading, readingInput, experience, language) {
  const evidence = unique(evidenceSources(reading, readingInput, experience), 5);
  return evidence.slice(0, Math.min(5, Math.max(3, evidence.length))).map((item, index) => ({
    priority: index + 1,
    canonical_text: textOf(item),
    classification: cleanText(
      item.evidence_classification ||
      item.classification ||
      item.evidenceClass
    ) || 'reported_experience',
    confirmation_status: cleanText(
      item.confirmation_status ||
      item.confirmationStatus
    ) || 'reported',
    reason_selected: priorityReason(index, language),
    supports: index === 0 ? ['summary.what_changed'] :
      index === 1 ? ['runtime_chain.reinforcement'] :
      index === 2 ? ['runtime_chain.spread'] :
      ['summary.operating_pattern'],
    source_ids: unique([
      ...list(item.source_ids),
      ...list(item.sourceIds),
      ...list(item.lineage).map(source => source?.source_id || source?.evidence_id)
    ]).map(textOf).filter(Boolean),
    source_count: Number(item.source_count) ||
      Math.max(1, list(item.lineage).length),
    lineage: list(item.lineage),
    counter_evidence: item.counter_evidence === true
  }));
}

function createAlternative(reading, priorityEvidence, language) {
  const existing = reading?.integratedReading?.alternativeReading || {};
  const counter = priorityEvidence.filter(item => item.counter_evidence);
  return {
    status: cleanText(existing.status) || 'compatible',
    summary: cleanText(existing.summary) || copy(
      language,
      'The apparent pattern may partly reflect a short period of transition rather than a settled Runtime structure.',
      '当前呈现的模式也可能部分来自短期过渡，而不是已经沉降的运行结构。'
    ),
    supporting_evidence: priorityEvidence.slice(0, 2).map(item => item.source_ids).flat(),
    conflicting_evidence: counter.map(item => item.source_ids).flat(),
    evidence_needed: unique(existing.evidenceNeeded, 3).map(textOf),
    boundary: BOUNDARY_KIND
  };
}

function confidenceLevel(score) {
  if (score >= 0.72) return 'high';
  if (score >= 0.48) return 'moderate';
  return 'limited';
}

function createConfidence(reading, priorityEvidence, language) {
  const boundary = reading?.evidenceBoundary || {};
  const total = Math.max(1,
    list(boundary.observedEvidence).length +
    list(boundary.reportedExperience).length +
    list(boundary.interpretation).length
  );
  const confirmed = priorityEvidence.filter(item =>
    ['confirmed', 'verified'].includes(item.confirmation_status)
  ).length;
  const components = {
    evidence_coverage: Math.min(1, priorityEvidence.length / 5),
    source_diversity: Math.min(1, new Set(
      priorityEvidence.flatMap(item => item.source_ids)
    ).size / 5),
    confirmation_strength: Math.min(1, confirmed / Math.max(1, priorityEvidence.length)),
    pattern_consistency: Math.max(0, Math.min(1, Number(
      reading?.integratedReading?.primaryPattern?.confidence ||
      reading?.confidence
    ) || 0)),
    unknown_penalty: Math.min(0.35, list(boundary.unknownReality).length * 0.06),
    interpretation_ratio: Number((list(boundary.interpretation).length / total).toFixed(2))
  };
  const score = Math.max(0, Math.min(1,
    components.evidence_coverage * 0.25 +
    components.source_diversity * 0.15 +
    components.confirmation_strength * 0.15 +
    components.pattern_consistency * 0.35 +
    (1 - components.interpretation_ratio) * 0.1 -
    components.unknown_penalty
  ));
  return {
    score: Number(score.toFixed(2)),
    customer_level: confidenceLevel(score),
    customer_explanation: copy(
      language,
      'This level reflects evidence coverage, source diversity, confirmation, consistency, and remaining unknowns. It is not the probability that the interpretation is true.',
      '该等级综合证据覆盖、来源多样性、确认程度、一致性与剩余未知项；它不是“当前解释为真”的概率。'
    ),
    components
  };
}

const UNKNOWN_RULES = Object.freeze([
  {
    match: /time|timeline|timing|when|时间|多久|何时/i,
    code: 'timeline_origin',
    en: 'Did this change first appear at the reported time, or was it present earlier and only became more noticeable then?',
    zh: '这种变化最初是在所报告的时间出现，还是更早已经存在，只是在当时明显加重？'
  },
  {
    match: /spend|purchase|expense|支出|购买|花钱/i,
    code: 'spending_scope',
    en: 'Which kinds of spending most often lead to repeated checking?',
    zh: '哪些支出最容易引发反复检查？'
  },
  {
    match: /partner|husband|pressure|伴侣|丈夫|催促/i,
    code: 'partner_pressure',
    en: 'When there is no pressure from your partner, does the tension decrease noticeably?',
    zh: '当没有伴侣催促时，这种紧张是否明显降低？'
  }
]);

function createUnknownQuestions(reading, experience, language) {
  const structured = reconstructionValues(experience, 'unknown_questions');
  const raw = [
    ...structured,
    ...list(reading?.evidenceBoundary?.unknownReality)
  ];
  const questions = [];
  for (const [index, value] of raw.entries()) {
    const text = textOf(value);
    const rule = UNKNOWN_RULES.find(candidate =>
      candidate.match.test(`${text} ${value?.unknown_type || ''}`)
    );
    const question = cleanText(
      value?.customer_question ||
      value?.question ||
      (rule ? rule[language] : '')
    ) || copy(
      language,
      `What additional observation would help clarify: ${text || `unknown ${index + 1}`}?`,
      `还需要观察什么，才能澄清：${text || `未知项 ${index + 1}`}？`
    );
    questions.push({
      unknown_code: cleanText(value?.unknown_type) || rule?.code || `unknown_${index + 1}`,
      question,
      answer_type: cleanText(value?.answer_type) || 'free_text',
      status: cleanText(value?.resolution_status) || 'unanswered',
      materiality: value?.severity === 'blocking' ? 'blocking' : 'advisory'
    });
  }
  return unique(questions, 5);
}

function createNavigationRationale(reading, summary, priorityEvidence, language) {
  const handoff = reading?.navigationHandoff || {};
  const readiness = reading?.navigationReadiness || {};
  return {
    ready: readiness.ready === true,
    status: cleanText(readiness.status) ||
      (readiness.ready === true ? 'ready' : 'blocked'),
    rationale: copy(
      language,
      readiness.ready === true
        ? 'Navigation can now use the bounded pattern, current tension, and priority evidence while preserving all unresolved questions.'
        : 'Navigation remains blocked until the Reading gate requirements are satisfied.',
      readiness.ready === true
        ? '现实导航现在可以引用有边界的模式、当前张力与优先证据，同时保留所有未解决问题。'
        : '在满足现实读取门槛前，现实导航仍保持阻断。'
    ),
    reading_version_reference: cleanText(
      handoff.readingVersion ||
      handoff.reading_version ||
      reading?.readingVersion ||
      reading?.createdAt
    ),
    handoff_schema: cleanText(handoff.schemaVersion),
    contract_unchanged: true,
    path_generation_unchanged: true,
    evidence_refs: priorityEvidence.slice(0, 3).flatMap(item => item.source_ids),
    current_tension: summary.current_tension
  };
}

function createRevision(reading, readingInput, versions) {
  const previous = list(
    readingInput?.previousReadings ||
    readingInput?.readingHistory
  );
  return {
    reading_version: Number(reading?.readingVersion || previous.length + 1),
    based_on_reconstruction_version: versions.reconstruction_version,
    previous_reading_preserved: true,
    previous_reading_refs: previous.map(item =>
      cleanText(item?.readingId || item?.id || item?.createdAt)
    ).filter(Boolean),
    comparison: isObject(readingInput?.readingComparison)
      ? readingInput.readingComparison
      : {
          status: previous.length ? 'available' : 'not_applicable',
          changed_fields: [],
          preserved_fields: []
        },
    staleness: isObject(reading?.staleness)
      ? reading.staleness
      : { status: 'current', reasons: [] }
  };
}

export function buildReadingExperience({ reading, readingInput }) {
  if (!isObject(reading) || !isObject(readingInput)) {
    throw new TypeError('Reading Experience requires Reading and Reading Input.');
  }
  const language = languageOf(reading, readingInput);
  const experience = reconstructionExperience(readingInput);
  const versions = sourceVersions(reading, readingInput);
  const summary = createSummary(reading, readingInput, experience, language);
  const runtimeChain = createRuntimeChain(readingInput, experience, summary, language);
  const priorityEvidence = createPriorityEvidence(reading, readingInput, experience, language);
  const alternativeReading = createAlternative(reading, priorityEvidence, language);
  const confidence = createConfidence(reading, priorityEvidence, language);
  const unknownQuestions = createUnknownQuestions(reading, experience, language);
  const navigationRationale = createNavigationRationale(
    reading,
    summary,
    priorityEvidence,
    language
  );
  const revision = createRevision(reading, readingInput, versions);

  return {
    schema_version: EXPERIENCE_SCHEMA,
    generated_at: reading.createdAt || new Date().toISOString(),
    language,
    source_versions: versions,
    summary,
    runtime_chain: runtimeChain,
    boundary: {
      kind: BOUNDARY_KIND,
      interpretive_not_diagnostic: true,
      not_predictive: true,
      not_prescriptive: true,
      evidence_before_interpretation: true,
      unknown_reality_preserved: true
    },
    priority_evidence: priorityEvidence,
    alternative_reading: alternativeReading,
    confidence,
    unknown_questions: unknownQuestions,
    navigation_rationale: navigationRationale,
    revision,
    view_projection: {
      customer: {
        default_sections: [
          'one_sentence_reading',
          'what_changed',
          'operating_pattern',
          'protective_function',
          'current_cost',
          'current_tension',
          'runtime_chain',
          'priority_evidence',
          'alternative_reading',
          'confidence',
          'unknown_questions',
          'navigation_rationale'
        ],
        technical_labels_exposed: false,
        maximum_priority_evidence: 5
      },
      evidence: {
        canonical_priority_evidence: true,
        full_lineage_collapsed: true,
        counter_evidence_preserved: true
      },
      technical: {
        runtime_ids_visible: true,
        provider_visible: true,
        schema_visible: true,
        confidence_components_visible: true,
        lineage_visible: true,
        revision_metadata_visible: true
      }
    },
    compatibility: {
      legacy_reading_preserved: true,
      reconstruction_contract_changed: false,
      navigation_contract_changed: false,
      navigation_path_generation_changed: false
    }
  };
}

export default buildReadingExperience;
