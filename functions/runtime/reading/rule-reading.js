/*
 * PHI OS Rule-first Reality Reading Engine
 * File: functions/runtime/reading/rule-reading.js
 * Version: 1.1.0
 *
 * Input:  phi-os.reading-input.v1
 * Output: phi-os.reality-reading.v1
 *
 * This engine is deterministic and does not call a model provider. It may
 * identify bounded Runtime signals, but it never upgrades reported experience,
 * interpretation, professional assessment, or unknown material into Observed
 * Evidence. Canonical schema values remain English; generated explanatory text
 * follows the requested output language.
 */
import {
  SCHEMA_IDS,
  isAcceptedSchema
} from '../shared/schema-registry.js';
import {
  normalizeReadingEvidenceBoundary,
  allowedEvidenceFor,
  buildReadingEvidenceAudit
} from './reading-evidence-boundary.js';
import { assessPatternThreshold } from './pattern-threshold.js';
import { assessNavigationReadiness } from './navigation-readiness.js';
import { buildReadingNavigationContract } from '../navigation/reading-navigation-builder.js';
import {
  RUNTIME_CAPABILITIES,
  buildDecisionContext
} from '../formation/book-1-runtime-model.js';
const SUPPORTED_OUTPUT_LANGUAGES = Object.freeze([
  'en',
  'zh'
]);

const REGION_REGISTRY = Object.freeze([
  {
    id: 'R1',
    label: 'Direction',
    chineseLabel: '方向',
    words: [
      'direction', 'goal', 'purpose', 'decision', 'choice',
      '方向', '目标', '目的', '选择', '决定'
    ]
  },
  {
    id: 'R2',
    label: 'Understanding',
    chineseLabel: '理解',
    words: [
      'understand', 'meaning', 'clarity', 'confusion', 'belief',
      '理解', '意义', '清晰', '困惑', '认知'
    ]
  },
  {
    id: 'R3',
    label: 'Expression',
    chineseLabel: '表达',
    words: [
      'express', 'communicate', 'speak', 'write', 'create',
      '表达', '沟通', '说', '写', '创作'
    ]
  },
  {
    id: 'R4',
    label: 'Position',
    chineseLabel: '位置',
    words: [
      'position', 'role', 'identity', 'status', 'belong',
      '位置', '角色', '身份', '地位', '归属'
    ]
  },
  {
    id: 'R5',
    label: 'Resource',
    chineseLabel: '资源',
    words: [
      'money', 'finance', 'financial', 'resource', 'time', 'energy',
      'asset', 'income', 'spending', 'saving', '钱', '财务', '资源',
      '时间', '精力', '收入', '资产', '花钱', '储蓄'
    ]
  },
  {
    id: 'R6',
    label: 'Execution',
    chineseLabel: '执行',
    words: [
      'action', 'execute', 'work', 'task', 'business', 'project',
      '行动', '执行', '工作', '任务', '事业', '项目'
    ]
  },
  {
    id: 'R7',
    label: 'Relationship',
    chineseLabel: '关系',
    words: [
      'relationship', 'partner', 'family', 'team', 'conflict',
      'husband', 'wife', '关系', '伴侣', '家庭', '团队', '冲突',
      '丈夫', '妻子'
    ]
  },
  {
    id: 'R8',
    label: 'Survival',
    chineseLabel: '生存',
    words: [
      'safety', 'health', 'body', 'fear', 'risk', 'survival', 'sleep',
      '安全', '健康', '身体', '害怕', '恐惧', '风险', '生存', '睡眠'
    ]
  },
  {
    id: 'R9',
    label: 'Driver',
    chineseLabel: '驱动',
    words: [
      'drive', 'motivation', 'desire', 'pressure', 'ambition', 'need',
      '驱动', '动机', '愿望', '压力', '野心', '需要'
    ]
  }
]);

const ARC_REGION_HINTS = Object.freeze({
  formation: ['R2'],
  activation: ['R9'],
  internalization: ['R2', 'R3'],
  reorganization: ['R4', 'R6'],
  continuity: ['R6']
});

const COORDINATE_REGISTRY = Object.freeze([
  {
    label: 'DNA',
    chineseLabel: 'DNA',
    aliases: ['dna', '基因', '遗传']
  },
  {
    label: 'Nervous System',
    chineseLabel: '神经系统',
    aliases: ['nervous system', '神经系统']
  },
  {
    label: 'Circadian Rhythm',
    chineseLabel: '昼夜节律',
    aliases: ['circadian rhythm', 'circadian', '昼夜节律', '生理时钟']
  },
  {
    label: 'Hormones',
    chineseLabel: '激素',
    aliases: ['hormone', 'hormones', '激素', '荷尔蒙']
  },
  {
    label: 'Body Structure',
    chineseLabel: '身体结构',
    aliases: ['body structure', 'body', '身体结构', '身体']
  },
  {
    label: 'Perception',
    chineseLabel: '感知',
    aliases: ['perception', 'perceptual', '感知', '感官']
  }
]);

const SIGNATURE_REGISTRY = Object.freeze([]);

const CONSCIOUS_REGISTRY = Object.freeze({
  C1: {
    label: 'Experience',
    chineseLabel: '体验'
  },
  C2: {
    label: 'Compression',
    chineseLabel: '压缩'
  },
  C3: {
    label: 'Expression',
    chineseLabel: '表达'
  },
  C4: {
    label: 'Action',
    chineseLabel: '行动'
  },
  C5: {
    label: 'Identity',
    chineseLabel: '身份'
  }
});

const GRAMMAR_LABELS = Object.freeze({
  G1: { en: 'Difference', zh: '差异' },
  G2: { en: 'Constraint', zh: '约束' },
  G3: { en: 'Structure', zh: '结构' },
  G4: { en: 'Field', zh: '场域' },
  G5: { en: 'Activation', zh: '激活' },
  G6: { en: 'Carrier', zh: '载体' },
  G7: { en: 'Runtime', zh: '运行' },
  G8: { en: 'Experience', zh: '体验' },
  G9: { en: 'Expression', zh: '表达' },
  G10: { en: 'Agency', zh: '行动主体' },
  G11: { en: 'Identity', zh: '身份' },
  G12: { en: 'Feedback', zh: '反馈' },
  G13: { en: 'Settlement', zh: '沉降' },
  G14: { en: 'Reconfiguration', zh: '重组' },
  G15: { en: 'Emergence', zh: '涌现' },
  G16: { en: 'Continuity', zh: '持续' }
});

const ARC_LABELS = Object.freeze({
  formation: {
    en: 'Formation Arc',
    zh: '形成弧'
  },
  activation: {
    en: 'Activation Arc',
    zh: '激活弧'
  },
  internalization: {
    en: 'Internalization Arc',
    zh: '内化弧'
  },
  reorganization: {
    en: 'Reorganization Arc',
    zh: '重组弧'
  },
  continuity: {
    en: 'Continuity Arc',
    zh: '持续弧'
  }
});

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function containsChinese(value) {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(
    cleanText(value)
  );
}

function itemText(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!isObject(value)) return '';

  return cleanText(
    value.statement ||
    value.summary ||
    value.question ||
    value.explanation ||
    value.sourceText ||
    value.label ||
    value.name ||
    value.domain
  );
}

function itemSummary(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!isObject(value)) return '';

  return cleanText(
    value.statement ||
    value.summary ||
    value.explanation ||
    value.sourceText
  );
}

function uniqueText(values) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = itemText(value);
    const key = text.toLocaleLowerCase();

    if (!text || seen.has(key)) continue;

    seen.add(key);
    output.push(text);
  }

  return output;
}

function humanize(value) {
  return cleanText(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function normalizeOutputLanguage(value) {
  const language = cleanText(value).toLowerCase().replaceAll('_', '-');

  if (language === 'zh' || language.startsWith('zh-')) return 'zh';
  if (language === 'en' || language.startsWith('en-')) return 'en';

  return '';
}

function resolveOutputLanguage(readingInput, options = {}) {
  const candidates = [
    options.outputLanguage,
    options.language,
    options.locale,
    readingInput?.languageContract?.outputLanguage,
    readingInput?.outputLanguage,
    readingInput?.locale,
    readingInput?.runtimeEntry?.languageContract?.outputLanguage,
    readingInput?.runtimeEntry?.outputLanguage,
    readingInput?.runtimeEntry?.locale
  ];

  for (const candidate of candidates) {
    const language = normalizeOutputLanguage(candidate);
    if (SUPPORTED_OUTPUT_LANGUAGES.includes(language)) return language;
  }

  return 'en';
}

function localeForLanguage(language, requestedLocale = '') {
  const locale = cleanText(requestedLocale);

  if (language === 'zh') return 'zh-Hans';
  if (locale.toLowerCase().startsWith('en')) return locale;

  return 'en';
}

function copy(language, english, chinese) {
  return language === 'zh' ? chinese : english;
}

function languageMatches(value, language) {
  const text = cleanText(value);
  if (!text) return false;

  return language === 'zh'
    ? containsChinese(text)
    : !containsChinese(text);
}

function containsAliases(value, aliases) {
  const source = cleanText(value).toLocaleLowerCase();

  return list(aliases).some(alias => (
    source.includes(cleanText(alias).toLocaleLowerCase())
  ));
}

function matchesWord(source, word) {
  const candidate = cleanText(word).toLocaleLowerCase();

  if (!candidate) return false;

  if (containsChinese(candidate)) {
    return source.includes(candidate);
  }

  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(source);
}

function matchingWords(corpus, words) {
  const source = cleanText(corpus).toLocaleLowerCase();

  return [...new Set(
    list(words)
      .map(word => cleanText(word).toLocaleLowerCase())
      .filter(word => matchesWord(source, word))
  )];
}

function normalizeEvidenceBoundary(readingInput) {
  const boundary = isObject(readingInput?.evidenceBoundary)
    ? readingInput.evidenceBoundary
    : {};

  return normalizeReadingEvidenceBoundary(boundary);
}

const DERIVED_UNKNOWN_FIELDS = Object.freeze({
  observed_change: Object.freeze({
    en: 'Observed change remains unestablished.',
    zh: '可观察变化仍未建立。',
    watch: Object.freeze({
      en: 'Which observable change can be verified.',
      zh: '哪些可观察变化能够得到核实。'
    }),
    aliases: ['observed change', '可观察变化']
  }),
  timeline: Object.freeze({
    en: 'Timeline remains unestablished.',
    zh: '时间线仍未建立。',
    watch: Object.freeze({
      en: 'When the reported change first became observable.',
      zh: '报告的变化最早在什么时候变得可观察。'
    }),
    aliases: ['timeline', '时间线']
  }),
  trigger: Object.freeze({
    en: 'Trigger condition remains unestablished.',
    zh: '触发条件仍未建立。',
    watch: Object.freeze({
      en: 'Whether a repeatable trigger condition can be observed.',
      zh: '是否能够观察到可重复的触发条件。'
    }),
    aliases: ['trigger condition', 'trigger', '触发条件']
  }),
  context: Object.freeze({
    en: 'Reality context remains unestablished.',
    zh: '现实情境仍未建立。',
    watch: Object.freeze({
      en: 'Which context is present when the pattern appears or does not appear.',
      zh: '模式出现或没有出现时，哪些现实情境同时存在。'
    }),
    aliases: ['reality context', 'context', '现实情境']
  }),
  affected_realities: Object.freeze({
    en: 'Affected Reality remains unestablished.',
    zh: '受影响的现实领域仍未建立。',
    watch: Object.freeze({
      en: 'Which Reality domain shows an observable effect.',
      zh: '哪些现实领域呈现了可观察影响。'
    }),
    aliases: ['affected reality', 'affected realities', '受影响的现实领域']
  }),
  evidence: Object.freeze({
    en: 'Supporting evidence remains unestablished.',
    zh: '支持证据仍未建立。',
    watch: Object.freeze({
      en: 'Which additional observed evidence supports or changes the current reading.',
      zh: '哪些新增观察证据会支持或改变当前读取。'
    }),
    aliases: ['supporting evidence', 'evidence', '支持证据']
  }),
  counter_evidence: Object.freeze({
    en: 'Counter-evidence remains unestablished.',
    zh: '反向证据仍未建立。',
    watch: Object.freeze({
      en: 'Whether a counter-example or different outcome can be observed.',
      zh: '是否能够观察到反例或不同结果。'
    }),
    aliases: ['counter evidence', 'counter-evidence', '反向证据']
  }),
  dependency: Object.freeze({
    en: 'Dependency remains unestablished.',
    zh: '依赖关系仍未建立。',
    watch: Object.freeze({
      en: 'Whether one part changes consistently when another part changes.',
      zh: '当一个部分改变时，另一个部分是否也持续发生改变。'
    }),
    aliases: ['dependency', 'dependencies', '依赖关系']
  }),
  current_tension: Object.freeze({
    en: 'Current tension remains unestablished.',
    zh: '当前张力仍未建立。',
    watch: Object.freeze({
      en: 'Which competing pressures remain active in the current situation.',
      zh: '当前情境中哪些相互竞争的压力仍然活跃。'
    }),
    aliases: ['current tension', '当前张力']
  }),
  desired_transition: Object.freeze({
    en: 'Desired transition remains unestablished.',
    zh: '期望转变仍未建立。',
    watch: Object.freeze({
      en: 'Which first concrete difference the user confirms as the desired transition.',
      zh: '用户将哪一个最先出现的具体差异确认为期望转变。'
    }),
    aliases: ['desired transition', '期望转变']
  })
});

function derivedUnknownField(value) {
  const normalized = cleanText(value)
    .toLocaleLowerCase()
    .replace(/[。.!！]/g, '');

  if (!(
    normalized.includes('remain') ||
    normalized.includes('unestablished') ||
    normalized.includes('not established') ||
    normalized.includes('仍未建立') ||
    normalized.includes('尚未建立')
  )) {
    return null;
  }

  return Object.values(DERIVED_UNKNOWN_FIELDS).find(candidate => (
    candidate.aliases.some(alias => normalized.includes(alias))
  )) || null;
}

function localizeDerivedUnknownReality(values, language) {
  return uniqueText(values).map(value => {
    const field = derivedUnknownField(value);

    return field?.[language] || value;
  });
}

function evidenceWatchFromUnknownReality(values, language) {
  return uniqueText(values).map(value => {
    const field = derivedUnknownField(value);
    return field?.watch?.[language] || '';
  }).filter(Boolean);
}

function normalizeGrammarStates(readingInput) {
  return list(readingInput?.reconstruction?.grammarStates)
    .filter(isObject)
    .map(state => ({
      code: cleanText(state.code).toUpperCase(),
      label: cleanText(state.label) || humanize(state.slug),
      status: cleanText(state.status) || 'provisional',
      confidence: clamp(state.confidence),
      summary: cleanText(state.summary)
    }))
    .filter(state => /^G(?:[1-9]|1[0-6])$/.test(state.code))
    .sort((a, b) => b.confidence - a.confidence);
}

function selectStrongestGrammar(grammarStates) {
  const substantive = list(grammarStates).find(state => (
    state.code !== 'G1' &&
    state.confidence >= 0.45 &&
    state.status !== 'not_established' &&
    state.status !== 'inactive' &&
    state.status !== 'contradicted'
  ));

  return substantive || list(grammarStates)[0] || null;
}

function localizedGrammarLabel(grammar, language) {
  const code = cleanText(grammar?.code).toUpperCase();
  const registered = GRAMMAR_LABELS[code];

  if (registered) return registered[language];

  return cleanText(grammar?.label) || copy(
    language,
    'Runtime signal',
    'Runtime 信号'
  );
}

function localizedArcLabel(arc, language) {
  const registered = ARC_LABELS[cleanText(arc).toLowerCase()];
  return registered?.[language] || humanize(arc);
}

function localizedRegionLabel(region, language) {
  return language === 'zh'
    ? region.chineseLabel
    : region.label;
}

function normalizeCoordinates(readingInput, language) {
  const supplied = list(
    readingInput?.reconstruction?.carrier?.initializationCoordinates
  );

  return COORDINATE_REGISTRY.map(coordinate => {
    const found = supplied.find(item => (
      containsAliases(cleanText(item?.label), coordinate.aliases) ||
      containsAliases(itemText(item), coordinate.aliases)
    ));

    const status = cleanText(found?.status) || 'not_established';
    const suppliedSummary = itemSummary(found);
    const sourceText = cleanText(found?.sourceText);
    const localizedSummary = sourceText && status !== 'not_established'
      ? copy(
          language,
          `The user reported material associated with ${coordinate.label}: “${sourceText}”. This is a provisional carrier signal, not a medical conclusion.`,
          `用户报告了与${coordinate.chineseLabel}有关的资料：「${sourceText}」。这只是暂定的载体信号，不构成医学结论。`
        )
      : suppliedSummary;

    return {
      label: coordinate.label,
      status,
      summary: localizedSummary || copy(
        language,
        'No supporting carrier evidence has been supplied for this coordinate.',
        '目前尚未提供足以支持这一初始化坐标的载体证据。'
      ),
      confidence: clamp(found?.confidence),
      evidenceClass: cleanText(found?.evidenceClass) || 'unknown_reality'
    };
  });
}

function normalizeSignatures(readingInput, language) {
  const supplied = list(
    readingInput?.reconstruction?.carrier?.carrierSignatures
  );

  return SIGNATURE_REGISTRY.map(signature => {
    const found = supplied.find(item => (
      containsAliases(cleanText(item?.label), signature.aliases) ||
      containsAliases(itemText(item), signature.aliases)
    ));

    const status = cleanText(found?.status) || 'not_established';
    const suppliedSummary = itemSummary(found);
    const sourceText = cleanText(found?.sourceText);
    const localizedSummary = sourceText && status !== 'not_established'
      ? copy(
          language,
          `The user reported material associated with ${signature.label}: “${sourceText}”. This Carrier Signature remains provisional.`,
          `用户报告了与${signature.chineseLabel}有关的资料：「${sourceText}」。这一载体签名仍属暂定。`
        )
      : suppliedSummary;

    return {
      label: signature.label,
      status,
      summary: localizedSummary || copy(
        language,
        'Cross-runtime evidence is not yet sufficient to establish this Carrier Signature.',
        '目前的跨 Runtime 证据尚不足以建立这一载体签名。'
      ),
      confidence: clamp(found?.confidence),
      evidenceClass: cleanText(found?.evidenceClass) || 'unknown_reality'
    };
  });
}

function createRuntimeRegions(readingInput, boundary, language) {
  const regionEvidence = allowedEvidenceFor(
    boundary,
    'maySupportRegion'
  ).map(item => item.statement);
  const corpus = regionEvidence.filter(Boolean).join(' ');

  const primaryArc = cleanText(
    readingInput?.reconstruction?.primaryArc
  ).toLowerCase() || 'formation';

  const arcHints = ARC_REGION_HINTS[primaryArc] || [];

  return REGION_REGISTRY.map(region => {
    const hits = matchingWords(corpus, region.words);
    const arcHint = arcHints.includes(region.id);

    const score = clamp(Math.min(0.72, hits.length * 0.22));

    const status = score >= 0.55
      ? 'active'
      : score >= 0.22
        ? 'emerging'
        : 'not_established';

    const label = localizedRegionLabel(region, language);
    let summary;

    if (status === 'not_established') {
      summary = copy(
        language,
        `The current material does not yet establish a material ${label} signal.`,
        `当前材料尚不足以建立明确的${label}信号。`
      );
    } else if (hits.length > 0) {
      summary = copy(
        language,
        `Entry material contains signals associated with ${label}. The classification remains provisional and does not prove cause or stability.`,
        `现实入口材料中出现了与${label}有关的信号；这一分类仍属暂定，不代表成因或稳定性已经得到证明。`
      );
    } else if (arcHint) {
      summary = copy(
        language,
        `The Formation Arc suggests ${label} may deserve attention, but it cannot establish a Runtime Region without direct allowed evidence.`,
        `现实形成弧提示${label}可能值得关注，但没有直接且获准使用的证据时，不能据此建立 Runtime Region。`
      );
    } else {
      summary = copy(
        language,
        `The current allowed evidence does not establish a material ${label} signal.`,
        `当前获准参与读取的证据尚不足以建立明确的${label}信号。`
      );
    }

    return {
      id: region.id,
      label: region.label,
      status,
      confidence: Number(score.toFixed(2)),
      summary,
      evidenceClass: status === 'not_established'
        ? 'unknown_reality'
        : 'interpretation'
    };
  });
}

function configurationResult({
  label,
  matches,
  language,
  configurationName
}) {
  if (!matches.length) {
    return {
      label: 'Not established',
      status: 'not_established',
      summary: copy(
        language,
        `The current material does not establish a stable ${configurationName} configuration.`,
        `当前材料尚不足以建立稳定的${configurationName}配置。`
      ),
      confidence: 0,
      evidenceClass: 'unknown_reality'
    };
  }

  const confidence = clamp(0.35 + (matches.length * 0.1));

  return {
    label,
    status: 'provisional',
    summary: copy(
      language,
      `The material supports a provisional ${configurationName} configuration. It remains a reading of context rather than new Observed Evidence.`,
      `现有材料支持建立一个暂定的${configurationName}配置；这是对情境的读取，不构成新的观察证据。`
    ),
    confidence: Number(confidence.toFixed(2)),
    evidenceClass: 'interpretation'
  };
}

function createConfigurations(readingInput, boundary, language) {
  const configurationEvidence = allowedEvidenceFor(
    boundary,
    'maySupportConfiguration'
  ).map(item => item.statement);

  const corpus = configurationEvidence
    .join(' ')
    .toLocaleLowerCase();

  const relational = matchingWords(corpus, [
    'relationship',
    'partner',
    'family',
    'team',
    '关系',
    '伴侣',
    '家庭',
    '团队'
  ]);

  const organizational = matchingWords(corpus, [
    'organization',
    'career',
    'business',
    'work',
    'company',
    '组织',
    '事业',
    '工作',
    '公司'
  ]);

  return {
    relational: configurationResult({
      label: 'Relational configuration',
      matches: relational,
      language,
      configurationName: copy(language, 'relational', '关系')
    }),
    organizational: configurationResult({
      label: 'Organizational configuration',
      matches: organizational,
      language,
      configurationName: copy(language, 'organizational', '组织')
    }),
    contextual: configurationResult({
      label: 'Multi-domain context',
      matches: relational.length > 0 && organizational.length > 0
        ? [...relational, ...organizational]
        : [],
      language,
      configurationName: copy(
        language,
        'multi-domain contextual',
        '多领域情境'
      )
    })
  };
}

function consciousSummary(stage, found, language) {
  const status = cleanText(found?.status) || 'not_established';
  const suppliedSummary = itemSummary(found);

  if (suppliedSummary && languageMatches(suppliedSummary, language)) {
    return suppliedSummary;
  }

  const stageLabel = language === 'zh'
    ? stage.chineseLabel
    : stage.label;

  if (status === 'not_established') {
    return copy(
      language,
      `The current material does not establish a stable ${stageLabel} pattern.`,
      `当前材料尚未建立稳定的${stageLabel}模式。`
    );
  }

  return copy(
    language,
    `Reconstruction contains a provisional ${stageLabel} signal. Its meaning remains bounded by the supplied evidence.`,
    `现实重建中出现了暂定的${stageLabel}信号，其意义仍受现有证据边界限制。`
  );
}

function createConsciousReading(readingInput, language) {
  const supplied = list(
    readingInput?.reconstruction?.conscious?.stages
  ).filter(isObject);

  return Object.entries(CONSCIOUS_REGISTRY).map(([code, stage]) => {
    const found = supplied.find(item => (
      cleanText(item?.code).toUpperCase() === code
    ));

    return {
      code,
      label: stage.label,
      status: cleanText(found?.status) || 'not_established',
      summary: consciousSummary(stage, found, language),
      confidence: clamp(found?.confidence)
    };
  });
}

function createEvidenceTrail(boundary, grammarStates, language) {
  const trail = [];

  boundary.observedEvidence.slice(0, 4).forEach(statement => {
    trail.push({
      evidenceClass: 'observed_evidence',
      statement
    });
  });

  boundary.reportedExperience.slice(0, 3).forEach(statement => {
    trail.push({
      evidenceClass: 'reported_experience',
      statement
    });
  });

  boundary.interpretation.slice(0, 2).forEach(statement => {
    trail.push({
      evidenceClass: 'interpretation',
      statement
    });
  });

  boundary.professionalAssessment.slice(0, 2).forEach(statement => {
    trail.push({
      evidenceClass: 'professional_assessment',
      statement
    });
  });

  if (trail.length === 0 && grammarStates[0]) {
    const grammar = selectStrongestGrammar(grammarStates);
    const label = localizedGrammarLabel(grammar, language);

    trail.push({
      evidenceClass: 'interpretation',
      statement: copy(
        language,
        `${grammar.code} ${label} is a rule-derived Runtime marker, not new evidence.`,
        `${grammar.code} ${label}属于规则生成的 Runtime 标记，并不是新增证据。`
      )
    });
  }

  return trail;
}

function calculateConfidence(readingInput, boundary, grammarStates) {
  const maturity = clamp(readingInput?.reconstruction?.maturityScore);
  const grammarCoverage = clamp(grammarStates.length / 15);

  const evidenceCoverage = clamp(
    (boundary.observedEvidence.length * 0.18) +
    (boundary.reportedExperience.length * 0.08)
  );

  const uncertaintyPenalty = Math.min(
    0.18,
    boundary.unknownReality.length * 0.025
  );

  return clamp(
    (maturity * 0.42) +
    (grammarCoverage * 0.28) +
    (evidenceCoverage * 0.3) -
    uncertaintyPenalty
  );
}

function grammarSummary(grammar, language) {
  if (!grammar) {
    return copy(
      language,
      'The supplied evidence does not yet support a stable Runtime pattern.',
      '现有证据尚不足以支持一个稳定的 Runtime 模式。'
    );
  }

  if (grammar.summary && languageMatches(grammar.summary, language)) {
    return grammar.summary;
  }

  const label = localizedGrammarLabel(grammar, language);

  return copy(
    language,
    `The rule-first Reconstruction identifies ${grammar.code} ${label} as the strongest current signal. This classification is provisional and does not establish cause, permanence, or outcome.`,
    `规则优先的现实重建将 ${grammar.code} ${label}识别为目前最明显的信号；这一分类仍属暂定，不代表成因、持续性或结果已经得到证明。`
  );
}

function transitionLabel(primaryArc, language) {
  const transitions = {
    formation: {
      en: 'Clarify which forming structure is supported by evidence and which parts remain unknown.',
      zh: '厘清正在形成的结构中，哪些部分已有证据支持，哪些部分仍属于未知。'
    },
    activation: {
      en: 'Clarify what has begun to operate, when it became active, and what remains unverified about its cause.',
      zh: '厘清什么已经开始运行、何时被激活，以及关于成因的哪些部分仍未得到验证。'
    },
    internalization: {
      en: 'Separate reported experience from the interpretation currently organizing that experience.',
      zh: '将报告的经验与目前用来组织这些经验的解释清楚分开。'
    },
    reorganization: {
      en: 'Observe which roles, resources, boundaries, or positions are actually being redistributed.',
      zh: '继续观察哪些角色、资源、边界或位置正在发生实际重组。'
    },
    continuity: {
      en: 'Test what is genuinely continuing across time and what only appears persistent because evidence remains incomplete.',
      zh: '检验哪些模式确实跨时间持续，哪些持续性只是因证据尚不完整而暂时呈现。'
    }
  };

  return transitions[primaryArc]?.[language] || copy(
    language,
    'Clarify the current Runtime transition while preserving unresolved Reality.',
    '在保留未知现实的前提下，进一步厘清当前 Runtime 的转变。'
  );
}

function signatureSummary(signatures, language) {
  const ranked = list(signatures)
    .filter(signature => (
      signature.status !== 'not_established' &&
      signature.confidence >= 0.45
    ))
    .sort((a, b) => b.confidence - a.confidence);

  const strongest = ranked[0];

  if (!strongest) {
    return {
      strongestSignature: copy(
        language,
        'Not established',
        '尚未建立'
      ),
      signatureStability: copy(
        language,
        'Not established',
        '尚未建立'
      )
    };
  }

  const definition = SIGNATURE_REGISTRY.find(item => (
    item.label === strongest.label
  ));

  const label = language === 'zh'
    ? definition?.chineseLabel || strongest.label
    : strongest.label;

  const score = `${Math.round(strongest.confidence * 100)}%`;

  return {
    strongestSignature: copy(
      language,
      `${label} · provisional`,
      `${label} · 暂定`
    ),
    signatureStability: copy(
      language,
      `Provisional confidence ${score}; cross-runtime confirmation is still required.`,
      `暂定置信度 ${score}；仍需跨 Runtime 证据确认。`
    )
  };
}

function alternativeReading(
  boundary,
  interpretationCount,
  evidenceWatch,
  language
) {
  let summary;

  if (boundary.unknownReality[0]) {
    summary = copy(
      language,
      `A different reading remains possible because this material question is unresolved: “${boundary.unknownReality[0]}”`,
      `由于以下关键问题仍未解决，另一种读取依然成立：“${boundary.unknownReality[0]}”`
    );
  } else if (interpretationCount > 0) {
    summary = copy(
      language,
      'The current interpretation may be accurate, but it remains separate from Observed Evidence and should be tested against future material.',
      '目前的解释可能成立，但它仍须与观察证据分开，并由后续材料继续检验。'
    );
  } else {
    summary = copy(
      language,
      'The apparent pattern may reflect limited Entry coverage rather than a stable Runtime structure.',
      '目前呈现的模式也可能来自现实入口覆盖不足，而不是已经稳定的 Runtime 结构。'
    );
  }

  return {
    summary,
    supportingEvidence: boundary.interpretation.slice(0, 3),
    evidenceNeeded: evidenceWatch.slice(0, 4),
    evidenceClass: 'interpretation'
  };
}

function createStrengths(grammarStates, boundary, language) {
  const knownCount = boundary.observedEvidence.length;
  const strengths = [];

  if (grammarStates.some(state => state.code === 'G1')) {
    strengths.push(copy(
      language,
      'A detectable difference between the earlier and current Reality has been preserved.',
      '先前现实与当前现实之间可识别的差异已经得到保留。'
    ));
  }

  if (knownCount > 0) {
    strengths.push(copy(
      language,
      `${knownCount} Observed Evidence item${knownCount === 1 ? '' : 's'} remain available for review.`,
      `目前保留了 ${knownCount} 项观察证据，可供后续核对。`
    ));
  }

  return strengths;
}

function createRisks(boundary, language) {
  const knownCount = boundary.observedEvidence.length;
  const interpretationCount = boundary.interpretation.length;
  const risks = [];

  if (knownCount === 0) {
    risks.push(copy(
      language,
      'No material is currently classified as Observed Evidence; the Reading therefore remains structurally limited.',
      '目前没有材料被归类为观察证据，因此本次读取仍受到结构性限制。'
    ));
  }

  if (interpretationCount > knownCount) {
    risks.push(copy(
      language,
      'Interpretive material currently outweighs Observed Evidence and may over-shape the apparent pattern.',
      '当前解释性材料多于观察证据，可能过度塑造目前呈现的模式。'
    ));
  }

  return risks;
}

export function readRuntimeRuleFirst(readingInput, options = {}) {
  if (!isObject(readingInput)) {
    throw new Error('Reality Reading input must be an object.');
  }

  if (
  !isAcceptedSchema(
    'readingInput',
    cleanText(readingInput.schemaVersion)
  )
) {
  throw new Error(
    'Reality Reading input schemaVersion is invalid.'
  );
}

  const outputLanguage = resolveOutputLanguage(readingInput, options);

  const locale = localeForLanguage(
    outputLanguage,
    options.locale || readingInput.locale
  );

  const boundary = normalizeEvidenceBoundary(readingInput);
  boundary.unknownReality = localizeDerivedUnknownReality(
    boundary.unknownReality,
    outputLanguage
  );
  const grammarStates = normalizeGrammarStates(readingInput);

  const primaryArc = cleanText(
    readingInput?.reconstruction?.primaryArc
  ).toLowerCase() || 'formation';

  const strongestGrammar = selectStrongestGrammar(grammarStates);
  const patternAssessment = assessPatternThreshold(
    boundary,
    strongestGrammar
  );

  const runtimeRegions = createRuntimeRegions(
    readingInput,
    boundary,
    outputLanguage
  );

  const rankedRegions = [...runtimeRegions]
    .sort((a, b) => b.confidence - a.confidence);

  const primaryRegion = rankedRegions.find(region => (
    region.confidence >= 0.22 &&
    region.status !== 'not_established'
  )) || null;

  const connectedRegions = rankedRegions.filter(region => (
    region.id !== primaryRegion?.id &&
    region.confidence >= 0.22
  ));

  const runtimeCapabilities = RUNTIME_CAPABILITIES.map(capability => {
    const region = runtimeRegions.find(item => item.id === capability.id);
    return {
      ...region,
      id: capability.id,
      label: outputLanguage === 'zh' ? capability.zh : capability.label,
      canonicalLabel: capability.label,
      representation: 'capability'
    };
  });

  const decisionContext = buildDecisionContext({
    strongestGrammar,
    primaryCapability: primaryRegion,
    language: outputLanguage
  });

  const configurations = createConfigurations(
    readingInput,
    boundary,
    outputLanguage
  );

  const confidence = calculateConfidence(
    readingInput,
    boundary,
    grammarStates
  );

  const localizedPriorityEvidence = localizeDerivedUnknownReality(
    list(readingInput?.reconstruction?.direction?.priorityEvidence),
    outputLanguage
  );

  const normalizedUnknown = new Set(
    boundary.unknownReality.map(item => cleanText(item).toLowerCase())
  );

  const evidenceWatch = uniqueText([
    ...uniqueText(localizedPriorityEvidence)
      .filter(item => !normalizedUnknown.has(cleanText(item).toLowerCase())),
    ...evidenceWatchFromUnknownReality(
      boundary.unknownReality,
      outputLanguage
    )
  ])
    .slice(0, 8);

  const knownCount = boundary.observedEvidence.length;
  const interpretationCount = boundary.interpretation.length;

  const coordinates = normalizeCoordinates(
    readingInput,
    outputLanguage
  );

  const grammarName = strongestGrammar
    ? `${strongestGrammar.code} ${localizedGrammarLabel(
        strongestGrammar,
        outputLanguage
      )}`
    : '';

  const primaryPattern = {
    name: patternAssessment.established
      ? grammarName
      : copy(
          outputLanguage,
          grammarName
            ? `Possible reading · ${grammarName}`
            : 'Pattern not established',
          grammarName
            ? `可能的读取 · ${grammarName}`
            : '尚未建立模式'
        ),
    summary: patternAssessment.established
      ? grammarSummary(strongestGrammar, outputLanguage)
      : copy(
          outputLanguage,
          'The current material may point toward this Runtime signal, but it has not met the minimum evidence threshold required to establish a Primary Pattern.',
          '当前材料可能指向这一 Runtime 信号，但尚未达到建立主要模式所需的最低证据门槛。'
        ),
    confidence: strongestGrammar
      ? Number(
          Math.min(
            confidence,
            strongestGrammar.confidence
          ).toFixed(2)
        )
      : 0,
    evidenceClass: 'interpretation',
    classification: patternAssessment.classification,
    established: patternAssessment.established,
    blockers: patternAssessment.blockers,
    sourceClasses: [
      'observed_evidence',
      'reported_experience',
      'rule_engine'
    ]
  };

  const strengths = createStrengths(
    grammarStates,
    boundary,
    outputLanguage
  );

  const risks = createRisks(
    boundary,
    outputLanguage
  );

  const navigationReadiness = assessNavigationReadiness({
    readingInput,
    boundary,
    patternAssessment,
    primaryRegion,
    confidence,
    language: outputLanguage
  });

  const evidenceAudit = buildReadingEvidenceAudit(boundary);

  const reading = {
    schemaVersion: SCHEMA_IDS.REALITY_READING,
    createdAt: new Date().toISOString(),
    runtimeEntityId: cleanText(readingInput.runtimeEntityId),
    runtimeEntryId: cleanText(readingInput.runtimeEntryId),
    readingMethod: 'rule_first',
    readingMode:
      cleanText(readingInput.readingMode) ||
      'initial_integrated_reading',
    status: confidence >= 0.62 && patternAssessment.established
      ? 'ready'
      : 'partial',
    confidence: Number(confidence.toFixed(2)),
    locale,
    outputLanguage,
    primaryArc,
    evidenceBoundary: boundary,
    evidenceAudit,
    patternAssessment,
    initializationCoordinates: coordinates,
    runtimeCoordinate: list(readingInput?.reconstruction?.runtimeCoordinate),
    carrierOrganization: list(readingInput?.reconstruction?.carrierOrganization),
    carrierConfiguration: list(readingInput?.reconstruction?.carrierConfiguration),
    runtimeRegions,
    runtimeCapabilities,
    primaryRuntimeRegion: primaryRegion,
    primaryCapability: decisionContext.primaryCapability,
    connectedRuntimeRegions: connectedRegions,
    decisionContext,
    configurations,
    interpretiveInterfaces: {
      enabled:
        readingInput?.interpretiveReaders?.enabled === true,
      selected: list(
        readingInput?.interpretiveReaders?.selected
      )
        .map(cleanText)
        .filter(Boolean),
      evidenceClass: 'interpretation'
    },
    integratedReading: {
      observedEvidence: boundary.observedEvidence,
      reportedExperience: boundary.reportedExperience,
      interpretation: boundary.interpretation,
      professionalAssessment:
        boundary.professionalAssessment,
      unknownReality: boundary.unknownReality,
      primaryPattern,
      alternativeReading: alternativeReading(
        boundary,
        interpretationCount,
        evidenceWatch,
        outputLanguage
      ),
      evidenceTrail: createEvidenceTrail(
        boundary,
        grammarStates,
        outputLanguage
      ),
      consciousRuntime: createConsciousReading(
        readingInput,
        outputLanguage
      ),
      strengths,
      risks,
      currentRuntime: patternAssessment.established && strongestGrammar
        ? `${strongestGrammar.code} ${localizedGrammarLabel(
            strongestGrammar,
            outputLanguage
          )}`
        : copy(
            outputLanguage,
            'Current possible reading',
            '当前可能的读取'
          ),
      currentTransition: transitionLabel(
        primaryArc,
        outputLanguage
      ),
      evidenceWatch
    },
    navigationReadiness,
    routingHints: {
      modelInferenceUseful:
        confidence >= 0.42 &&
        confidence < 0.72 &&
        knownCount +
          boundary.reportedExperience.length >= 2 &&
        boundary.unknownReality.length > 0,
      professionalReviewUseful:
        boundary.professionalAssessment.length > 0
    }
  };

  reading.navigationHandoff = buildReadingNavigationContract({
    reading,
    readingInput
  });

  return reading;
}

export default readRuntimeRuleFirst;
