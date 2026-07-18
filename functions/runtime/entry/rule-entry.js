import { SCHEMA_IDS } from '../shared/schema-registry.js';
import {
  FIELD_NAMES,
  THRESH,
  completeness,
  nextTarget,
  sanitizeConversation
} from '../../_lib/utils.js';

/*
 * PHI OS Rule-first Runtime Entry Engine
 *
 * Input:  conversation plus the current Entry round
 * Output: a deterministic ENTRY_SCHEMA-compatible extraction, an explicit
 *         five-class Evidence Boundary, and provider-routing hints.
 *
 * This engine never calls a model, resolves relative dates, diagnoses,
 * predicts, or upgrades reported/interpretive material into Observed Evidence.
 */

const EVIDENCE_DEPTHS = Object.freeze({
  quick: Object.freeze({ minimum: 3, maximum: 4 }),
  guided: Object.freeze({ minimum: 5, maximum: 7 }),
  deep: Object.freeze({ minimum: 7, maximum: 10 })
});

function evidenceDepth(value) {
  const key = cleanText(value).toLowerCase();
  return {
    key: EVIDENCE_DEPTHS[key] ? key : 'guided',
    ...(EVIDENCE_DEPTHS[key] || EVIDENCE_DEPTHS.guided)
  };
}

const DOMAIN_REGISTRY = Object.freeze([
  { domain: 'Financial', words: ['money', 'income', 'salary', 'spend', 'saving', 'debt', 'finance', 'business', '钱', '收入', '薪水', '花费', '储蓄', '债务', '财务', '生意'] },
  { domain: 'Work', words: ['job', 'work', 'career', 'project', 'company', 'client', 'team', '工作', '职业', '事业', '项目', '公司', '客户', '团队'] },
  { domain: 'Relationship', words: ['relationship', 'partner', 'husband', 'wife', 'family', 'friend', 'conflict', '关系', '伴侣', '丈夫', '妻子', '家庭', '朋友', '冲突'] },
  { domain: 'Health', words: ['health', 'body', 'sleep', 'pain', 'illness', 'energy', '健康', '身体', '睡眠', '疼痛', '疾病', '精力'] },
  { domain: 'Role / Identity', words: ['role', 'identity', 'position', 'responsibility', 'belong', '角色', '身份', '位置', '责任', '归属'] },
  { domain: 'Environment', words: ['home', 'house', 'move', 'environment', 'country', 'city', '家', '房子', '搬家', '环境', '国家', '城市'] }
]);

const QUESTIONS = Object.freeze({
  observed_change: {
    en: 'What is different now compared with before, stated only as something you directly noticed or could verify?',
    zh: '与之前相比，现在具体有什么不同？请只描述你直接注意到或能够核实的变化。'
  },
  timeline: {
    en: 'When did this first become noticeable? You may answer with the exact words you naturally use, such as “three months ago”.',
    zh: '这项变化最早在什么时候变得明显？你可以保留自己的原始时间表达，例如“三个月前”。'
  },
  trigger: {
    en: 'What happened shortly before this change began, without assuming that it caused the change?',
    zh: '这项变化开始之前发生了什么？请暂时不要假定它就是原因。'
  },
  context: {
    en: 'What conditions, people, roles or circumstances were present around this change?',
    zh: '这项变化周围有哪些条件、人物、角色或现实情境？'
  },
  affected_realities: {
    en: 'Which part of your Reality is directly affected, and what changed within that domain?',
    zh: '哪一个现实领域受到直接影响？该领域内具体改变了什么？'
  },
  evidence: {
    en: 'What have you directly observed that supports the current account of this change?',
    zh: '你直接观察到哪些证据，可以支持目前对这项变化的描述？'
  },
  counter_evidence: {
    en: 'Have you noticed any occasion when this pattern did not happen, or when things went differently from your current explanation?',
    zh: '有没有哪一次，这种情况并没有发生，或者事情的发展和你目前的解释不一样？'
  },
  dependency: {
    en: 'When one part of this situation changes, does another part seem to change with it? Please give one example you have actually noticed. You may also say you are not sure.',
    zh: '这件事里，当其中一个部分发生变化时，另一个部分会不会也跟着变化？请举一个你实际观察过的例子；不确定也可以直接说明。'
  },
  current_tension: {
    en: 'What competing pressures or unresolved tension are most active now?',
    zh: '目前最明显的相互拉扯、压力或未解决张力是什么？'
  },
  desired_transition: {
    en: 'If this situation began to improve, what is the first concrete difference you would most want to notice? You do not need to explain how to achieve it.',
    zh: '如果这段情况开始改善，你最希望先看到哪一个具体变化？暂时不需要说明应该怎样做到。'
  }
});

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function unique(values) {
  const seen = new Set();
  return values.filter(value => {
    const text = cleanText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(cleanText);
}

function userMessages(conversation) {
  return sanitizeConversation(conversation)
    .filter(item => item.role === 'user')
    .map(item => cleanText(item.content))
    .filter(Boolean);
}

function sentences(messages) {
  return unique(messages.flatMap(message => (
    message.match(/[^.!?。！？]+[.!?。！？]?/g) || [message]
  )));
}

function includesAny(text, words) {
  const source = text.toLowerCase();
  return words.some(word => source.includes(word.toLowerCase()));
}

function isChinese(text) {
  return /[\u3400-\u9fff]/.test(text);
}

function extractTime(messages) {
  const patterns = [
    /\b(?:today|yesterday|recently|lately|last\s+(?:week|month|year)|this\s+(?:week|month|year)|(?:about\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a)\s+(?:days?|weeks?|months?|years?)\s+ago)\b/i,
    /(?:今天|昨天|最近|近来|上周|上个月|去年|本周|这个月|今年|[一二三四五六七八九十两\d]+\s*(?:天|周|星期|个月|月|年)前)/,
    /\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
    /\b\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)?\d{2}\b/,
    /(?:19|20)\d{2}年\d{1,2}月\d{1,2}日/
  ];

  for (const message of messages) {
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (!match) continue;
      const rawExpression = cleanText(match[0]);
      const exactDate = /(?:19|20)\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}/.test(rawExpression) ||
        /\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)?\d{2}/.test(rawExpression);
      return {
        rawExpression,
        normalizedTime: rawExpression,
        precision: exactDate ? 'exact_date' : 'relative'
      };
    }
  }

  return { rawExpression: '', normalizedTime: '', precision: 'unknown' };
}

function extractDomains(corpus) {
  return DOMAIN_REGISTRY
    .filter(item => includesAny(corpus, item.words))
    .map((item, index) => ({
      domain: item.domain,
      role: index === 0 ? 'primary' : 'connected',
      effect: 'The user explicitly referenced this domain; the specific effect remains provisional.'
    }))
    .slice(0, 4);
}

function selectByMarkers(items, markers) {
  return unique(items.filter(item => includesAny(item, markers)));
}

function score(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function buildScores({ messages, allSentences, time, domains, extracted }) {
  const answerCount = messages.length;
  const observedLength = cleanText(extracted.observedChange).length;
  return {
    observed_change: score(observedLength >= 30 ? 0.78 : observedLength >= 12 ? 0.58 : 0),
    timeline: time.precision === 'exact_date' ? 0.9 : time.precision === 'relative' ? 0.68 : 0,
    trigger: score(extracted.trigger ? 0.58 : 0),
    context: score(answerCount >= 2 && extracted.context.length ? 0.62 : extracted.context.length ? 0.38 : 0),
    affected_realities: score(domains.length ? Math.min(0.78, 0.56 + (domains.length - 1) * 0.08) : 0),
    evidence: score(extracted.evidence.length ? Math.min(0.76, 0.48 + extracted.evidence.length * 0.08) : 0),
    counter_evidence: score(extracted.counterEvidence.length ? 0.62 : 0),
    dependency: score(extracted.dependencies.length ? 0.55 : 0),
    current_tension: score(extracted.currentTension ? 0.62 : 0),
    desired_transition: score(extracted.desiredTransition ? 0.58 : 0)
  };
}

function normalizeTarget(value) {
  const target = cleanText(value).toLowerCase();
  return FIELD_NAMES.includes(target) ? target : '';
}

function normalizeAskedTargets(value) {
  return unique(
    (Array.isArray(value) ? value : [])
      .map(normalizeTarget)
      .filter(Boolean)
  );
}

function questionCandidates(fieldScores, language, askedTargets = []) {
  const alreadyAsked = new Set(normalizeAskedTargets(askedTargets));
  return FIELD_NAMES
    .filter(field => (
      fieldScores[field] < THRESH[field] &&
      !alreadyAsked.has(field)
    ))
    .sort((a, b) => (THRESH[b] - fieldScores[b]) - (THRESH[a] - fieldScores[a]))
    .slice(0, 3)
    .map(target => ({ target, question: QUESTIONS[target][language] }));
}

function evidenceCoverage(fieldScores, askedTargets, answerBindings) {
  const asked = new Set(normalizeAskedTargets(askedTargets));
  const bindings = Array.isArray(answerBindings) ? answerBindings : [];
  const skipped = new Set(bindings.filter(item =>
    /^(?:skip|pass|不答|跳过|暂不回答)$/i.test(cleanText(item?.content))
  ).map(item => normalizeTarget(item?.target)).filter(Boolean));
  const uncertain = new Set(bindings.filter(item =>
    /^(?:not sure|uncertain|unknown|不知道|不确定|不清楚)$/i.test(cleanText(item?.content))
  ).map(item => normalizeTarget(item?.target)).filter(Boolean));
  const noChange = new Set(bindings.filter(item =>
    /^(?:no change|none|nothing|没有变化|无变化|没有)$/i.test(cleanText(item?.content))
  ).map(item => normalizeTarget(item?.target)).filter(Boolean));

  return Object.fromEntries(FIELD_NAMES.map(field => {
    let status = 'not_asked';
    if (skipped.has(field)) status = 'skipped';
    else if (uncertain.has(field)) status = 'uncertain';
    else if (noChange.has(field)) status = 'no_change';
    else if (fieldScores[field] >= THRESH[field]) status = 'answered';
    else if (asked.has(field) || fieldScores[field] > 0) status = 'partial';
    return [field, { status, score: fieldScores[field] }];
  }));
}

function bindAnswer(extracted, targetValue, answerValue, revision, time, domains) {
  const target = normalizeTarget(targetValue);
  const answer = cleanText(answerValue);

  if (!target || !answer) return target;

  if (target === 'observed_change') {
    extracted.observedChange = answer;
  } else if (target === 'timeline' && time.precision === 'unknown') {
    extracted.time = {
      rawExpression: answer,
      normalizedTime: answer,
      precision: 'relative'
    };
  } else if (target === 'trigger') {
    extracted.trigger = extracted.trigger || answer;
  } else if (target === 'context') {
    extracted.context = unique([...extracted.context, answer]);
  } else if (target === 'affected_realities') {
    if (domains.length) extracted.affectedRealities = domains;
    extracted.context = unique([...extracted.context, answer]);
  } else if (target === 'evidence') {
    extracted.evidence = unique([...extracted.evidence, answer]);
  } else if (target === 'counter_evidence') {
    extracted.counterEvidence = unique([...extracted.counterEvidence, answer]);
  } else if (target === 'dependency') {
    extracted.dependencies = [
      ...extracted.dependencies,
      {
        source: answer,
        effect: 'The dependency was directly reported in response to the dependency question; its mechanism remains unverified.',
        status: 'reported'
      }
    ];
  } else if (target === 'current_tension') {
    extracted.currentTension = extracted.currentTension || answer;
  } else if (target === 'desired_transition') {
    extracted.desiredTransition = extracted.desiredTransition || answer;
  }

  return target;
}

function applyAnswerBindings(extracted, input, messages, time, domains) {
  const bindings = Array.isArray(input?.answerBindings)
    ? input.answerBindings
    : [];

  if (bindings.length) {
    let answeredTarget = '';
    for (const binding of bindings.slice(-12)) {
      answeredTarget = bindAnswer(
        extracted,
        binding?.target,
        binding?.content,
        binding?.revision === true,
        time,
        domains
      ) || answeredTarget;
    }
    return answeredTarget;
  }

  return bindAnswer(
    extracted,
    input?.answerTarget || input?.lastQuestionTarget,
    messages.at(-1),
    input?.mode === 'revision',
    time,
    domains
  );
}

export function evaluateEntryRuleFirst(input = {}) {
  const depth = evidenceDepth(input.evidenceDepth);
  const messages = userMessages(input.conversation);
  const allSentences = sentences(messages);
  const corpus = messages.join(' ');
  const language = resolveQuestionLanguage(
  input,
  messages,
  corpus
);
  const entryRound = Math.min(
    depth.maximum,
    Math.max(0, Number(input.entryRound) || messages.length)
  );
  const time = extractTime(messages);
  const domains = extractDomains(corpus);

  const reportedExperience = selectByMarkers(allSentences, [
    'feel', 'felt', 'afraid', 'fear', 'worry', 'anxious', 'uncertain', '感到', '感觉', '害怕', '担心', '焦虑', '不确定'
  ]);
  const interpretations = selectByMarkers(allSentences, [
    'i think', 'i believe', 'i assume', 'it means', 'probably', '我认为', '我觉得', '我相信', '可能是', '意味着'
  ]);
  const professionalAssessment = selectByMarkers(allSentences, [
    'doctor said', 'lawyer said', 'accountant said', 'therapist said', 'diagnosed', '医生说', '律师说', '会计师说', '治疗师说', '诊断'
  ]);
  const counterEvidence = selectByMarkers(allSentences, [
    'but not', 'however', 'although', 'does not fit', 'except', '但并不', '然而', '虽然', '不符合', '例外'
  ]);
  const dependencySentences = selectByMarkers(allSentences, [
    'depends on', 'dependent on', 'only when', 'requires', '取决于', '依赖', '只有在', '需要先'
  ]);
  const triggerCandidates = selectByMarkers(allSentences, [
    'after ', 'since ', 'when i ', 'following ', '之后', '自从', '当我', '随后'
  ]);
  const desiredCandidates = selectByMarkers(allSentences, [
    'i want', 'i hope', 'i would like', 'i need to change', '我希望', '我想要', '我想改变'
  ]);

  const excludedFromObserved = new Set([
    ...reportedExperience,
    ...interpretations,
    ...professionalAssessment
  ].map(item => item.toLowerCase()));
  const observedEvidence = unique(allSentences.filter(sentence => (
    !excludedFromObserved.has(sentence.toLowerCase()) &&
    includesAny(sentence, [
      'started', 'stopped', 'increased', 'decreased', 'changed', 'left', 'moved', 'happened', 'became',
      '开始', '停止', '增加', '减少', '改变', '离开', '搬到', '发生', '变得'
    ])
  )));

  const extractedFields = {
    observedChange: observedEvidence[0] || messages[0] || '',
    time,
    trigger: triggerCandidates[0] || '',
    context: [],
    affectedRealities: domains,
    evidence: observedEvidence,
    counterEvidence,
    dependencies: dependencySentences.map(statement => ({
      source: statement,
      effect: 'An explicit dependency was reported; its mechanism remains unverified.',
      status: 'reported'
    })),
    reportedExperience,
    interpretations,
    currentTension: '',
    desiredTransition: desiredCandidates[0] || '',
    unknownReality: []
  };

  const answeredTarget = applyAnswerBindings(
    extractedFields,
    input,
    messages,
    time,
    domains
  );

  const askedTargets = normalizeAskedTargets([
    ...(Array.isArray(input.askedTargets) ? input.askedTargets : []),
    answeredTarget
  ]);

  const fieldCompleteness = buildScores({
    messages,
    allSentences,
    time: extractedFields.time,
    domains,
    extracted: extractedFields
  });
  const completion = completeness(fieldCompleteness);
  const minimumRoundsMet = entryRound >= depth.minimum;
  const maximumRoundsReached = entryRound >= depth.maximum;
  const unaskedCandidates = questionCandidates(
    fieldCompleteness,
    language,
    askedTargets
  );
  const noQuestionRemaining = unaskedCandidates.length === 0;
  const entryComplete = noQuestionRemaining || maximumRoundsReached || (
    minimumRoundsMet && (
      completion.entryComplete
    )
  );
  const nextQuestionTarget = entryComplete
    ? 'none'
    : unaskedCandidates[0]?.target || 'none';
  const missingFields = FIELD_NAMES.filter(field => fieldCompleteness[field] < THRESH[field]);
  extractedFields.unknownReality = missingFields.map(field => `${field.replaceAll('_', ' ')} remains unestablished.`);

  const lowRuleCoverage = completion.entryCompleteness < 0.52;
  const modelInferenceUseful = !entryComplete && entryRound >= 2 && lowRuleCoverage && corpus.length >= 80;

  return {
    schemaVersion: SCHEMA_IDS.RUNTIME_ENTRY,
    entryMethod: 'rule_first',
    acknowledgement: language === 'zh'
      ? 'PHI OS 已记录你明确提供的内容，并保留仍未建立的 Reality。'
      : 'PHI OS recorded the material you explicitly supplied and preserved what remains unestablished.',
    fieldCompleteness,
    evidenceCoverage: evidenceCoverage(
      fieldCompleteness,
      askedTargets,
      input.answerBindings
    ),
    questionCandidates: unaskedCandidates,
    extractedFields,
    evidenceBoundary: {
      observedEvidence: extractedFields.evidence,
      reportedExperience,
      interpretation: interpretations,
      professionalAssessment,
      unknownReality: extractedFields.unknownReality
    },
    assessment: {
      entryRound,
      evidenceDepth: depth.key,
      minimumRounds: depth.minimum,
      maximumRounds: depth.maximum,
      minimumRoundsMet,
      maximumRoundsReached,
      entryCompleteness: completion.entryCompleteness,
      entryComplete,
      noQuestionRemaining,
      nextQuestionTarget,
      answeredTarget,
      askedTargets,
      missingFields
    },
    routingHints: {
      modelInferenceUseful,
      reason: modelInferenceUseful
        ? 'The user supplied substantial material, but deterministic extraction remains below the Entry threshold.'
        : 'The Rule Engine can continue evidence acquisition without model inference.',
      providerOrder: ['rule_engine', 'workers_ai', 'openai', 'professional_review']
    }
  };function resolveQuestionLanguage(input, messages, corpus) {
  const requested = cleanText(
    input?.language ||
    input?.locale
  ).toLowerCase();

  if (
    requested === 'zh' ||
    requested === 'zh-hans' ||
    requested.startsWith('zh-')
  ) {
    return 'zh';
  }

  if (
    requested === 'en' ||
    requested.startsWith('en-')
  ) {
    return 'en';
  }

  return isChinese(messages.at(-1) || corpus)
    ? 'zh'
    : 'en';
}
}

export default evaluateEntryRuleFirst;
