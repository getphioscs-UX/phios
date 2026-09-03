import { clone, deepFreeze, sha256Stable } from '../interpretation-runtime/mir7-utils.js';
import { PROFILE_SIGNAL_SCHEMA, PROFILE_SOURCE_CLASSES } from './profile-foundation-runtime.js';
import { PROFILE_REALITY_CORRELATION_SCHEMA, CROSS_SOURCE_PERSPECTIVE_SCHEMA, RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA } from './profile-context-runtime.js';

export const PROFILE_PROGRESSIVE_UX_SCHEMA = 'PHI-OS-PROGRESSIVE-PROFILE-UX-v1';
export const PROFILE_PROGRESSIVE_VIEW_SCHEMA = 'PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1';
export const PROFILE_PROGRESSIVE_MODES = Object.freeze([
  'QUICK_PROFILE',
  'FULL_SELF_ASSESSMENT',
  'REASONING_TASKS',
  'IMPORT_EXTERNAL_RESULT',
  'BIG_FIVE',
  'FINANCIAL_CAPABILITY',
  'CAREER_INTERESTS'
]);

export const PROFILE_SELF_ASSESSMENT_DOMAINS = Object.freeze([
  'COGNITIVE_NAVIGATION',
  'EMOTIONAL_SOCIAL_REGULATION',
  'ADAPTATION_COPING',
  'BODY_LIFESTYLE_STEWARDSHIP',
  'FINANCIAL_CAPABILITY',
  'MEANING_VALUES'
]);

const SOURCE_META = Object.freeze({
  MEASURED_TASK_PERFORMANCE: {
    en: 'Observed task performance', zh: '任务表现', family: 'MEASURED', descriptionEn: 'What happened on this task sample.', descriptionZh: '这次任务样本中实际发生的表现。'
  },
  STANDARDIZED_SELF_REPORT: {
    en: 'Standardized self-report', zh: '标准化自陈', family: 'SELF_REPORTED', descriptionEn: 'Answers scored under an admitted questionnaire or external scoring method.', descriptionZh: '依据已准入问卷或外部评分方式整理的自陈结果。'
  },
  CUSTOMER_SELF_REPORT: {
    en: 'Your self-report', zh: '你的自我评估', family: 'SELF_REPORTED', descriptionEn: 'How you describe yourself in this assessment.', descriptionZh: '你在这次评估中如何描述自己。'
  },
  EXTERNAL_PROFILE_RESULT: {
    en: 'Imported external profile', zh: '导入的外部结果', family: 'EXTERNAL', descriptionEn: 'A result you supplied from another provider; its provider identity stays visible.', descriptionZh: '你从其他提供方带入的结果；提供方身份会一直保留。'
  },
  SYMBOLIC_INTERPRETATION: {
    en: 'Symbolic interpretation', zh: '象征／诠释视角', family: 'SYMBOLIC', descriptionEn: 'An interpretive perspective, not a measured trait or scientific validation.', descriptionZh: '一种诠释视角，不等同于测量特质或科学验证。'
  },
  CURRENT_REALITY_OBSERVATION: {
    en: 'Current Reality', zh: '当前现实', family: 'CURRENT', descriptionEn: 'What you report is happening now.', descriptionZh: '你所报告的现在正在发生什么。'
  },
  PROFESSIONAL_EVIDENCE: {
    en: 'Professional evidence', zh: '专业证据', family: 'PROFESSIONAL', descriptionEn: 'Evidence supplied under a separate professional scope.', descriptionZh: '在独立专业范围内提供的证据。'
  }
});

const DOMAIN_META = Object.freeze({
  COGNITIVE_NAVIGATION: ['Cognitive Navigation','认知导航'],
  EMOTIONAL_SOCIAL_REGULATION: ['Emotional & Social Regulation','情绪与社会调节'],
  ADAPTATION_COPING: ['Adaptation & Coping','适应与应对'],
  BODY_LIFESTYLE_STEWARDSHIP: ['Body & Lifestyle Stewardship','身体与生活管理'],
  FINANCIAL_CAPABILITY: ['Financial Capability','财务能力'],
  MEANING_VALUES: ['Meaning & Values','意义与价值']
});

const RIASEC_META = Object.freeze({
  REALISTIC: ['Realistic','现实型'],
  INVESTIGATIVE: ['Investigative','研究型'],
  ARTISTIC: ['Artistic','艺术型'],
  SOCIAL: ['Social','社会型'],
  ENTERPRISING: ['Enterprising','企业型'],
  CONVENTIONAL: ['Conventional','常规型']
});

const fail = (code, details = null) => {
  const error = new Error(code);
  error.code = code;
  if (details !== null) error.details = details;
  throw error;
};
const list = value => Array.isArray(value) ? value : [];
const clean = (value, max = 500) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const iso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && !Number.isNaN(Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value));
const dayMs = 86400000;

function ageState(assessmentDate, asOfDate) {
  if (!assessmentDate || !iso(assessmentDate)) return { state: 'UNDATED', ageDays: null, currentPresentationAllowed: false };
  if (!asOfDate || !iso(asOfDate)) return { state: 'DATED', ageDays: null, currentPresentationAllowed: false };
  const a = Date.parse(assessmentDate.length === 10 ? `${assessmentDate}T00:00:00Z` : assessmentDate);
  const b = Date.parse(asOfDate.length === 10 ? `${asOfDate}T00:00:00Z` : asOfDate);
  const ageDays = Math.max(0, Math.floor((b - a) / dayMs));
  if (ageDays > 365) return { state: 'OLD_RESULT', ageDays, currentPresentationAllowed: false };
  if (ageDays > 180) return { state: 'DATED_RESULT', ageDays, currentPresentationAllowed: true };
  return { state: 'RECENT_RESULT', ageDays, currentPresentationAllowed: true };
}

function sourceLegend(signals, locale) {
  const zh = locale === 'zh-Hans';
  const present = new Set(signals.map(signal => signal.sourceClass));
  return PROFILE_SOURCE_CLASSES.filter(sourceClass => present.has(sourceClass)).map(sourceClass => {
    const meta = SOURCE_META[sourceClass];
    return {
      sourceClass,
      family: meta.family,
      label: zh ? meta.zh : meta.en,
      description: zh ? meta.descriptionZh : meta.descriptionEn
    };
  });
}

function validateSignals(profileSignals) {
  const signals = list(profileSignals);
  const ids = new Set();
  for (const signal of signals) {
    if (signal?.schemaVersion !== PROFILE_SIGNAL_SCHEMA) fail('PRF_W11_PROFILE_SIGNAL_ENVELOPE_REQUIRED');
    if (!PROFILE_SOURCE_CLASSES.includes(signal.sourceClass)) fail('PRF_W11_PROFILE_SOURCE_CLASS_REQUIRED');
    if (!signal.profileSignalId || ids.has(signal.profileSignalId)) fail('PRF_W11_PROFILE_SIGNAL_ID_UNIQUE_REQUIRED');
    ids.add(signal.profileSignalId);
  }
  return signals;
}

function selfAssessmentRadar(signals, locale) {
  const zh = locale === 'zh-Hans';
  const rows = PROFILE_SELF_ASSESSMENT_DOMAINS.map(domainId => {
    const candidates = signals.filter(signal => signal.sourceClass === 'CUSTOMER_SELF_REPORT' && signal.domainId === domainId && typeof signal.value === 'number' && Number.isFinite(signal.value));
    const signal = candidates[0] || null;
    const meta = DOMAIN_META[domainId];
    return {
      domainId,
      label: zh ? meta[1] : meta[0],
      value: signal ? Math.max(0, Math.min(100, Number(signal.value))) : null,
      signalRef: signal?.profileSignalId || null,
      missing: !signal
    };
  });
  const completeCount = rows.filter(row => row.value !== null).length;
  return deepFreeze({
    kind: 'SIX_DOMAIN_RADAR',
    axes: rows,
    completeCount,
    complete: completeCount === PROFILE_SELF_ASSESSMENT_DOMAINS.length,
    masterScore: null,
    quotientScore: null,
    interpretation: zh ? '各轴只表示这次自我评估中的相对位置，不是 IQ／EQ 等商数，也不是常模百分位。' : 'Each axis is a relative position from this self-assessment only; it is not an IQ/EQ-style quotient or a normed percentile.'
  });
}

function signalCard(signal, asOfDate, locale) {
  const zh = locale === 'zh-Hans';
  const meta = SOURCE_META[signal.sourceClass];
  return deepFreeze({
    signalRef: signal.profileSignalId,
    sourceClass: signal.sourceClass,
    sourceLabel: zh ? meta.zh : meta.en,
    sourceFamily: meta.family,
    providerFamily: signal.providerFamily || null,
    domainId: signal.domainId,
    facetId: signal.facetId || null,
    value: clone(signal.value),
    confidence: signal.confidence,
    assessmentDate: signal.assessmentDate || null,
    freshness: ageState(signal.assessmentDate, asOfDate),
    precisionBoundary: clone(signal.precisionBoundary || []),
    provenance: clone(signal.provenance || [])
  });
}

function careerInterestSummary(signals, locale) {
  const zh = locale === 'zh-Hans';
  const rows = signals.filter(signal => signal.sourceClass === 'STANDARDIZED_SELF_REPORT' && /^RIASEC::/.test(signal.domainId) && signal.value && typeof signal.value === 'object' && Number.isFinite(Number(signal.value.score))).map(signal => {
    const code = signal.domainId.split('::')[1];
    const meta = RIASEC_META[code] || [code,code];
    return {
      signalRef: signal.profileSignalId,
      code,
      label: zh ? meta[1] : meta[0],
      score: Number(signal.value.score),
      rawRange: Array.isArray(signal.value.rawRange) ? clone(signal.value.rawRange) : null,
      form: signal.value.form || null,
      sourceClass: signal.sourceClass,
      assessmentDate: signal.assessmentDate || null
    };
  }).sort((a,b)=>b.score-a.score || a.code.localeCompare(b.code));
  if (!rows.length) return null;
  const max = Math.max(...rows.map(row=>row.score));
  const top = rows.filter(row=>row.score===max).map(row=>row.code);
  return deepFreeze({
    kind: 'ONET_RIASEC_RAW_SCORE_PROFILE',
    axes: rows,
    topInterestCodes: top,
    interpretation: zh ? '这些是 O*NET Interest Profiler 的原始 RIASEC 分数。它们描述本次标准化自陈中的兴趣方向，不是能力、人格真理或职业命定。' : 'These are raw RIASEC scores from the O*NET Interest Profiler. They describe interests reported in this standardized self-report; they are not ability scores, objective personality facts or career destiny.',
    currentRealityPrompts: zh ? [
      '这些兴趣目前在哪里真实出现？',
      '哪些工作活动让你更投入，哪些让你明显耗竭？',
      '当前现实是支持、部分支持、反驳，还是仍未验证这些兴趣信号？'
    ] : [
      'Where are these interests actually showing up now?',
      'Which work activities feel engaging, and which feel draining?',
      'Does Current Reality support, partly support, contradict, or leave these interest signals open?'
    ],
    governance: { providerRawScoresPreserved:true, masterScoreCreated:false, jobFitGuaranteeCreated:false, automaticRealityMatching:false }
  });
}

function realitySummary(profileRealityCorrelation, locale) {
  if (profileRealityCorrelation === null || profileRealityCorrelation === undefined) return null;
  if (profileRealityCorrelation?.schemaVersion !== PROFILE_REALITY_CORRELATION_SCHEMA) fail('PRF_W11_REALITY_CORRELATION_SCHEMA_REQUIRED');
  const zh = locale === 'zh-Hans';
  const counts = Object.fromEntries(['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN'].map(state => [state, 0]));
  for (const row of list(profileRealityCorrelation.correlations)) counts[row.state] = (counts[row.state] || 0) + 1;
  return deepFreeze({
    counts,
    total: list(profileRealityCorrelation.correlations).length,
    label: zh ? '与当前现实对照' : 'Compared with Current Reality',
    boundary: zh ? '当前现实可以支持、削弱或保留一个 Profile 信号，但不会证明某个模型为真。' : 'Current Reality may support, weaken or leave a profile signal open; it does not prove a profile model true.'
  });
}

function crossSourceSummary(crossSourcePerspective, locale) {
  if (crossSourcePerspective === null || crossSourcePerspective === undefined) return null;
  if (crossSourcePerspective?.schemaVersion !== CROSS_SOURCE_PERSPECTIVE_SCHEMA) fail('PRF_W11_CROSS_SOURCE_SCHEMA_REQUIRED');
  const zh = locale === 'zh-Hans';
  const groups = Object.entries(crossSourcePerspective.groupIndex || {}).filter(([, refs]) => Array.isArray(refs) && refs.length).map(([group, refs]) => ({ group, count: refs.length }));
  return deepFreeze({
    groups,
    perspectives: list(crossSourcePerspective.perspectives).map(item => ({
      id: item.crossSourcePerspectiveId,
      group: item.group,
      topicId: item.topicId,
      statement: item.statement,
      sourceClasses: clone(item.sourceClasses),
      signalRefs: clone(item.signalRefs),
      realityCorrelationRefs: clone(item.realityCorrelationRefs)
    })),
    boundary: zh ? '不同来源可以并列、互补或冲突，但不会被合成一个“总分”，也不会互相证明。' : 'Different sources may align, complement or conflict, but they are not collapsed into one master score and do not validate one another.'
  });
}

function relationshipSummary(relationshipProfileEvidence, locale) {
  if (relationshipProfileEvidence === null || relationshipProfileEvidence === undefined) return null;
  if (relationshipProfileEvidence?.schemaVersion !== RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA) fail('PRF_W11_RELATIONSHIP_PROFILE_SCHEMA_REQUIRED');
  const zh = locale === 'zh-Hans';
  return deepFreeze({
    participants: clone(relationshipProfileEvidence.participants),
    evidence: list(relationshipProfileEvidence.evidence).map(item => ({
      id: item.relationshipProfileEvidenceId,
      comparisonClass: item.comparisonClass,
      topicId: item.topicId,
      statement: item.statement,
      sourceClass: item.sourceClass,
      providerFamily: item.providerFamily || null
    })),
    boundary: zh ? '这里比较的是可观察的 Profile 差异与共同点，不是相容度百分比，也不是对伴侣内心的推断。' : 'This compares observable profile differences and similarities; it is not a compatibility percentage or an inference about a partner’s hidden state.'
  });
}

export async function buildProgressiveProfileView({
  mode,
  profileSignals = [],
  profileRealityCorrelation = null,
  crossSourcePerspective = null,
  relationshipProfileEvidence = null,
  participantRef = null,
  asOfDate = null,
  locale = 'en',
  customerPublishable = false,
  preview = false
} = {}) {
  const normalizedMode = clean(mode, 80).toUpperCase();
  if (!PROFILE_PROGRESSIVE_MODES.includes(normalizedMode)) fail('PRF_W11_PROFILE_MODE_NOT_ADMITTED', { mode });
  if (!['en','zh-Hans'].includes(locale)) locale = 'en';
  const signals = validateSignals(profileSignals);
  const participantRefs = [...new Set(signals.map(signal => signal.participantRef))];
  if (participantRef && signals.some(signal => signal.participantRef !== participantRef)) fail('PRF_W11_PARTICIPANT_SCOPE_MISMATCH');
  const resolvedParticipant = participantRef || (participantRefs.length === 1 ? participantRefs[0] : null);
  const cards = signals.map(signal => signalCard(signal, asOfDate, locale));
  const oldSignalRefs = cards.filter(card => card.freshness.state === 'OLD_RESULT').map(card => card.signalRef);
  const digest = await sha256Stable({ normalizedMode, signalDigests: signals.map(signal => signal.semanticDigest).sort(), reality: profileRealityCorrelation?.semanticDigest || null, cross: crossSourcePerspective?.semanticDigest || null, relationship: relationshipProfileEvidence?.semanticDigest || null, asOfDate, locale });
  const zh = locale === 'zh-Hans';
  return deepFreeze({
    schemaVersion: PROFILE_PROGRESSIVE_VIEW_SCHEMA,
    profileViewId: `PRF-VIEW-${digest.slice(0, 24).toUpperCase()}`,
    mode: normalizedMode,
    participantRef: resolvedParticipant,
    asOfDate: iso(asOfDate) ? asOfDate : null,
    sourceLegend: sourceLegend(signals, locale),
    signalCards: cards,
    selfAssessmentRadar: selfAssessmentRadar(signals, locale),
    careerInterest: careerInterestSummary(signals, locale),
    currentReality: realitySummary(profileRealityCorrelation, locale),
    crossSource: crossSourceSummary(crossSourcePerspective, locale),
    relationshipProfile: relationshipSummary(relationshipProfileEvidence, locale),
    freshness: {
      oldSignalRefs,
      oldResultWarningRequired: oldSignalRefs.length > 0,
      message: oldSignalRefs.length ? (zh ? '这份 Profile 含有较早的评估结果。请把日期一起阅读，不要把旧结果自动当成现在。' : 'This Profile contains older assessment results. Read them with their dates rather than treating them as automatically current.') : null
    },
    customerPublication: {
      customerPublishable: customerPublishable === true,
      preview: preview === true,
      state: customerPublishable === true ? 'PRODUCTION' : preview === true ? 'REVIEW_PREVIEW' : 'NOT_PUBLISHED'
    },
    boundaries: [
      zh ? '不同来源会保留自己的证据类别。' : 'Each source keeps its own evidence class.',
      zh ? '不会生成一个总人格分数。' : 'No universal personality master score is created.',
      zh ? '推理任务表现不是 IQ，也不是常模百分位。' : 'Reasoning task performance is not IQ and is not a normed percentile.',
      zh ? '自我评估不是诊断。' : 'Self-assessment is not a diagnosis.',
      zh ? '象征视角不会因为与问卷相似而获得科学验证。' : 'A symbolic perspective does not become scientifically validated because it resembles a questionnaire result.'
    ],
    governance: {
      progressiveOptionalLane: true,
      personalReadingGateCreated: false,
      skipAllowed: true,
      sourceClassesPreserved: true,
      sourceClassFlatteningAllowed: false,
      universalMasterScoreCreated: false,
      iqOrQuotientCreated: false,
      diagnosisCreated: false,
      symbolicScientificValidationCreated: false,
      relationshipCompatibilityScoreCreated: false,
      partnerHiddenStateInferenceCreated: false,
      customerPublishableBeforePrfW12HumanAcceptance: false
    },
    semanticDigest: digest
  });
}

export function assertProgressiveProfileUxContract(contract) {
  if (!['PHI-OS-PROGRESSIVE-PROFILE-UX-CONTRACT-v1.0.0','PHI-OS-PROGRESSIVE-PROFILE-UX-CONTRACT-v2.0.0','PHI-OS-PROGRESSIVE-PROFILE-UX-CONTRACT-v3.0.0'].includes(contract?.schemaVersion)) fail('PRF_W11_UX_CONTRACT_REQUIRED');
  if (contract.personalReading?.profileRequiredBeforeReading !== false) fail('PRF_W11_PROFILE_MUST_REMAIN_OPTIONAL');
  if (contract.personalReading?.skipAllowed !== true) fail('PRF_W11_PROFILE_SKIP_REQUIRED');
  const modes = list(contract.modes).map(item => item.mode);
  if (modes.length !== PROFILE_PROGRESSIVE_MODES.length || PROFILE_PROGRESSIVE_MODES.some(mode => !modes.includes(mode))) fail('PRF_W11_ALL_PROFILE_MODES_REQUIRED');
  if (contract.boundaries?.quotientLabelsAllowed !== false || contract.boundaries?.diagnosticLanguageAllowed !== false || contract.boundaries?.universalMasterScoreAllowed !== false) fail('PRF_W11_BOUNDARY_DRIFT');
  return true;
}
