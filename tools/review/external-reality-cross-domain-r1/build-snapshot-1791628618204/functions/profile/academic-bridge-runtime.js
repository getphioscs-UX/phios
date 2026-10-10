import { clone, deepFreeze, sha256Stable, stableStringify } from '../interpretation-runtime/mir7-utils.js';
import {
  buildProfileSignalEnvelope,
  buildReasoningPerformanceSignals,
  normalizeReasoningTaskPerformance
} from './profile-foundation-runtime.js';

export const ACADEMIC_SIGNAL_BUNDLE_SCHEMA = 'PHI-OS-ACADEMIC-PROFILE-SIGNAL-BUNDLE-v1';
export const IPIP_RESULT_SCHEMA = 'PHI-OS-IPIP-RESULT-v1';
export const REASONING_SESSION_SCHEMA = 'PHI-OS-ORIGINAL-REASONING-SESSION-v1';
export const REASONING_RENDERER_SCHEMA = 'PHI-OS-REASONING-PERFORMANCE-RENDERER-v1';
export const ONET_RESULT_SCHEMA = 'PHI-OS-ONET-INTEREST-PROFILER-RESULT-v1';
export const ONET_CAREER_DETAIL_SCHEMA = 'PHI-OS-ONET-CAREER-DETAIL-v1';
export const ONET_JOB_ZONE_SCHEMA = 'PHI-OS-ONET-JOB-ZONE-SET-v1';
export const FINANCIAL_CAPABILITY_RESULT_SCHEMA = 'PHI-OS-FINANCIAL-CAPABILITY-RESULT-v1';

const fail = (code, details = null) => {
  const error = new Error(code);
  error.code = code;
  if (details !== null) error.details = details;
  throw error;
};

const text = (value, code, max = 240) => {
  if (typeof value !== 'string') fail(code);
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, max);
  if (!clean) fail(code);
  return clean;
};
const finite = value => typeof value === 'number' && Number.isFinite(value);
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const list = value => Array.isArray(value) ? value : [];

function isoDate(value, code) {
  const v = text(value, code, 50);
  if (Number.isNaN(Date.parse(v.length === 10 ? `${v}T00:00:00Z` : v))) fail(code);
  return v;
}

function assertLikertResponse(value, itemId) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) fail('PRF_W10B_IPIP_RESPONSE_OUT_OF_RANGE', { itemId, value });
  return n;
}

function scoreKeyedResponse(response, reverseKeyed) {
  return reverseKeyed ? 6 - response : response;
}

export async function scoreIpipAssessment({ instrument, responses = {}, participantRef, assessmentDate, consent, sensitiveConsent = false, customerConfirmed = true } = {}) {
  if (consent !== true) fail('PRF_W10B_IPIP_EXPLICIT_CONSENT_REQUIRED');
  if (!instrument || !['IPIP_BIG_FIVE_50', 'IPIP_NEO_120'].includes(instrument.instrumentId)) fail('PRF_W10B_IPIP_INSTRUMENT_NOT_ADMITTED');
  const person = text(participantRef, 'PRF_W10B_IPIP_PARTICIPANT_REQUIRED', 160);
  const date = isoDate(assessmentDate, 'PRF_W10B_IPIP_ASSESSMENT_DATE_REQUIRED');
  const items = list(instrument.items);
  if (!items.length) fail('PRF_W10B_IPIP_ITEMS_REQUIRED');
  const answered = [];
  let sensitiveAnswered = 0;
  for (const item of items) {
    if (!(item.itemId in responses)) continue;
    if (item.sensitive === true) sensitiveAnswered += 1;
    const raw = assertLikertResponse(responses[item.itemId], item.itemId);
    answered.push({ itemId: item.itemId, order: item.order, factorId: item.factorId ?? null, domainCode: item.domainCode ?? null, facetId: item.facetId ?? null, raw, keyed: scoreKeyedResponse(raw, item.reverseKeyed === true), reverseKeyed: item.reverseKeyed === true });
  }
  if (sensitiveAnswered > 0 && sensitiveConsent !== true) fail('PRF_W10B_IPIP_SENSITIVE_CONSENT_REQUIRED');
  if (!answered.length) fail('PRF_W10B_IPIP_RESPONSES_REQUIRED');

  const responseMap = new Map(answered.map(row => [row.itemId, row]));
  const result = {
    schemaVersion: IPIP_RESULT_SCHEMA,
    participantRef: person,
    instrumentId: instrument.instrumentId,
    instrumentVersion: instrument.instrumentVersion,
    assessmentDate: date,
    sourceClass: 'STANDARDIZED_SELF_REPORT',
    scoringState: 'FIRST_PARTY_SCORED',
    normingState: 'NOT_NORMED',
    customerConfirmed: customerConfirmed === true,
    responseCompleteness: { answered: answered.length, total: items.length, ratio: round(answered.length / items.length, 4) },
    sensitiveResponseCount: sensitiveAnswered,
    scores: {},
    scoredResponses: answered,
    governance: {
      explicitConsentCaptured: true,
      sensitiveConsentCapturedIfRequired: sensitiveAnswered === 0 || sensitiveConsent === true,
      percentileCreated: false,
      diagnosisCreated: false,
      objectivePersonalityTruthCreated: false,
      crossInstrumentEquivalenceCreated: false,
      symbolicScientificValidationCreated: false,
      customerPublishableBeforePrfW12: false
    }
  };

  if (instrument.instrumentId === 'IPIP_BIG_FIVE_50') {
    const factors = {};
    for (const factor of instrument.factors) {
      const ids = items.filter(item => item.factorId === factor.factorId).map(item => item.itemId);
      const rows = ids.map(id => responseMap.get(id)).filter(Boolean);
      const total = rows.reduce((sum, row) => sum + row.keyed, 0);
      factors[factor.factorId] = {
        rawTotal: total,
        rawMean: rows.length ? round(total / rows.length, 4) : null,
        answered: rows.length,
        expected: ids.length,
        rawRangeWhenComplete: [10, 50]
      };
    }
    result.scores = { factors };
  } else {
    const facets = {};
    for (const facet of instrument.facets) {
      const ids = items.filter(item => item.facetId === facet.facetId).map(item => item.itemId);
      const rows = ids.map(id => responseMap.get(id)).filter(Boolean);
      const total = rows.reduce((sum, row) => sum + row.keyed, 0);
      facets[facet.facetId] = { domainCode: facet.domainCode, facetName: facet.facetName, rawTotal: total, rawMean: rows.length ? round(total / rows.length, 4) : null, answered: rows.length, expected: ids.length, rawRangeWhenComplete: [4, 20] };
    }
    const domains = {};
    for (const domain of instrument.domains) {
      const rows = Object.values(facets).filter(facet => facet.domainCode === domain.domainCode && facet.answered > 0);
      const rawTotal = rows.reduce((sum, facet) => sum + facet.rawTotal, 0);
      domains[domain.domainId] = { domainCode: domain.domainCode, rawTotal, rawMeanAcrossFacets: rows.length ? round(rows.reduce((s, f) => s + f.rawMean, 0) / rows.length, 4) : null, facetsAnswered: rows.length, expectedFacets: 6, rawRangeWhenComplete: [24, 120] };
    }
    result.scores = { facets, domains };
  }
  const digest = await sha256Stable({ participantRef: person, instrumentId: result.instrumentId, instrumentVersion: result.instrumentVersion, assessmentDate: date, scores: result.scores, answered: answered.map(row => [row.itemId, row.raw]) });
  result.resultId = `PRF-IPIP-${digest.slice(0, 24).toUpperCase()}`;
  result.semanticDigest = digest;
  return deepFreeze(result);
}

export function scoreOriginalReasoningTaskBank({ bank, bankAuthority, responses = {}, completionTimes = {}, participantRef, assessmentDate } = {}) {
  if (bank?.schemaVersion !== 'PHI-OS-ORIGINAL-REASONING-TASK-BANK-v1.0.0') fail('PRF_W10C_REASONING_BANK_REQUIRED');
  if (bankAuthority?.status !== 'ADMITTED' || bankAuthority.sourceRef !== 'content/profile/academic/reasoning/original-reasoning-task-bank-v1.json') fail('PRF_W10C_REASONING_BANK_AUTHORITY_REQUIRED');
  const attempts = [];
  let weightedPossible = 0;
  let weightedCorrect = 0;
  for (const item of bank.items) {
    if (!(item.taskId in responses)) continue;
    const selected = text(String(responses[item.taskId]), 'PRF_W10C_REASONING_OPTION_REQUIRED', 40);
    if (!item.options.some(option => option.optionId === selected)) fail('PRF_W10C_REASONING_OPTION_UNKNOWN', { taskId: item.taskId, selected });
    const correct = selected === item.correctOptionId;
    const weight = Number(item.difficultyTier);
    weightedPossible += weight;
    if (correct) weightedCorrect += weight;
    attempts.push({ taskId: item.taskId, family: item.family, correct, completionTime: completionTimes[item.taskId] ?? null, selectedOptionId: selected, difficultyTier: item.difficultyTier });
  }
  if (!attempts.length) fail('PRF_W10C_REASONING_RESPONSES_REQUIRED');
  const performance = normalizeReasoningTaskPerformance({
    participantRef,
    assessmentDate,
    taskBankAuthority: { status: 'ADMITTED', sourceRef: bankAuthority.sourceRef, version: bankAuthority.version },
    attempts,
    itemVersion: bank.taskBankVersion
  });
  return deepFreeze({
    schemaVersion: REASONING_SESSION_SCHEMA,
    participantRef: performance.participantRef,
    taskBankId: bank.taskBankId,
    taskBankVersion: bank.taskBankVersion,
    performance,
    difficultyContext: {
      weightedCorrect,
      weightedPossible,
      localTaskSampleIndex: weightedPossible ? round((weightedCorrect / weightedPossible) * 100, 2) : null,
      interpretation: 'LOCAL_TASK_SAMPLE_ONLY_NOT_NORMED'
    },
    governance: {
      originalTaskBank: true,
      rawPerformanceIsIq: false,
      percentileCreated: false,
      normingClaimCreated: false,
      diagnosticClaimCreated: false,
      customerPublishableBeforePrfW12: false
    }
  });
}

export function renderReasoningPerformance(session, { locale = 'en' } = {}) {
  if (session?.schemaVersion !== REASONING_SESSION_SCHEMA) fail('PRF_W10C_REASONING_SESSION_REQUIRED');
  const zh = locale === 'zh-Hans';
  const familyName = {
    PATTERN_COMPLETION: ['Pattern completion', '规律补全'],
    ABSTRACT_RELATION: ['Abstract relation', '抽象关系'],
    SEQUENCE_REASONING: ['Sequence reasoning', '序列推理'],
    SPATIAL_TRANSFORMATION: ['Spatial transformation', '空间变换'],
    RELATIONAL_MATRIX: ['Relational matrix', '关系矩阵']
  };
  return deepFreeze({
    schemaVersion: REASONING_RENDERER_SCHEMA,
    title: zh ? '推理任务表现' : 'Reasoning Task Performance',
    summary: zh ? `本次完成 ${session.performance.rawAttempted} 题，答对 ${session.performance.rawCorrect} 题。` : `${session.performance.rawCorrect} of ${session.performance.rawAttempted} tasks were answered correctly in this task sample.`,
    familyPerformance: session.performance.taskFamilyPerformance.map(row => ({
      family: row.family,
      label: familyName[row.family]?.[zh ? 1 : 0] ?? row.family,
      rawCorrect: row.rawCorrect,
      rawAttempted: row.rawAttempted,
      rawAccuracy: row.rawAccuracy
    })),
    difficultyContext: clone(session.difficultyContext),
    boundaries: zh ? ['这是本题库样本中的任务表现。', '不是 IQ。', '不是常模百分位。', '不是认知诊断。'] : ['This is performance on this task sample.', 'It is not IQ.', 'It is not a normed percentile.', 'It is not a cognitive diagnosis.']
  });
}

const ONET_BASE = 'https://api-v2.onetcenter.org';
const ONET_RIASEC = ['realistic','investigative','artistic','social','enterprising','conventional'];
const ONET_FORMS = Object.freeze({
  MINI_30: { path: '/mnm/interestprofiler/questions_30', itemCount: 30, perInterestCount: 5, rawRange: [5,25] },
  SHORT_60: { path: '/mnm/interestprofiler/questions', itemCount: 60, perInterestCount: 10, rawRange: [10,50] }
});
const ONET_FIT_LABELS = Object.freeze({
  Best: 'STRONG_INTEREST_MATCH',
  Great: 'MODERATE_INTEREST_MATCH',
  Good: 'EXPLORATORY_INTEREST_MATCH'
});

function onetKey(apiKey) {
  return text(apiKey, 'PRF_W10D_ONET_API_KEY_REQUIRED', 240);
}

async function onetGet(path, { apiKey, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') fail('PRF_W10D_ONET_FETCH_REQUIRED');
  const key = onetKey(apiKey);
  let response;
  try {
    response = await fetchImpl(`${ONET_BASE}${path}`, { headers: { 'X-API-Key': key, accept: 'application/json' } });
  } catch (error) {
    fail('PRF_ONET_PROVIDER_NETWORK_FAILED', { path, message: String(error?.message || error) });
  }
  if (!response || response.ok !== true) fail('PRF_W10D_ONET_PROVIDER_REQUEST_FAILED', { status: response?.status ?? null, path });
  try { return await response.json(); }
  catch { fail('PRF_ONET_PROVIDER_JSON_INVALID', { path }); }
}

function onetForm(form) {
  const normalized = text(form, 'PRF_ONET_FORM_REQUIRED', 40).toUpperCase();
  const config = ONET_FORMS[normalized];
  if (!config) fail('PRF_W10D_ONET_FORM_NOT_ADMITTED');
  return [normalized, config];
}

export async function fetchOnetInterestProfilerQuestions({ apiKey, form = 'MINI_30', start = 1, end = null, fetchImpl } = {}) {
  const [, config] = onetForm(form);
  const params = new URLSearchParams();
  params.set('start', String(start));
  if (end !== null) params.set('end', String(end));
  return onetGet(`${config.path}?${params.toString()}`, { apiKey, fetchImpl });
}

function normalizeOnetAnswerOptions(value) {
  return list(value).map(row => ({ value: Number(row.value), name: text(row.name, 'PRF_ONET_ANSWER_OPTION_NAME_REQUIRED', 100) }))
    .filter(row => Number.isInteger(row.value) && row.value >= 1 && row.value <= 5);
}

function normalizeOnetQuestions(value) {
  return list(value).map(row => ({
    index: Number(row.index),
    area: text(row.area, 'PRF_ONET_QUESTION_AREA_REQUIRED', 40).toLowerCase(),
    text: text(row.text, 'PRF_ONET_QUESTION_TEXT_REQUIRED', 400)
  })).filter(row => Number.isInteger(row.index) && row.index > 0 && ONET_RIASEC.includes(row.area));
}

export async function fetchOnetInterestProfilerQuestionSet({ apiKey, form = 'MINI_30', fetchImpl } = {}) {
  const [normalizedForm, config] = onetForm(form);
  const questions = [];
  let answerOptions = [];
  for (let start = 1; start <= config.itemCount; start += 12) {
    const end = Math.min(config.itemCount, start + 11);
    const page = await fetchOnetInterestProfilerQuestions({ apiKey, form: normalizedForm, start, end, fetchImpl });
    if (!answerOptions.length) answerOptions = normalizeOnetAnswerOptions(page.answer_option);
    questions.push(...normalizeOnetQuestions(page.question));
  }
  questions.sort((a,b)=>a.index-b.index);
  if (questions.length !== config.itemCount || new Set(questions.map(row=>row.index)).size !== config.itemCount) fail('PRF_ONET_QUESTION_SET_INCOMPLETE', { form: normalizedForm, expected: config.itemCount, actual: questions.length });
  if (answerOptions.length !== 5) fail('PRF_ONET_ANSWER_OPTIONS_INCOMPLETE');
  return deepFreeze({
    schemaVersion: 'PHI-OS-ONET-INTEREST-PROFILER-QUESTION-SET-v1',
    provider: 'O_NET_WEB_SERVICES_V2', form: normalizedForm, itemCount: config.itemCount,
    answerOptions, questions,
    governance: { providerQuestionTextAltered: false, apiKeyExposed: false, automaticPersistence: false }
  });
}

function answersString(answers) {
  if (typeof answers === 'string') {
    if (!/^[1-5]{30}$|^[1-5]{60}$/.test(answers)) fail('PRF_W10D_ONET_ANSWER_STRING_INVALID');
    return answers;
  }
  if (!Array.isArray(answers) || ![30,60].includes(answers.length) || answers.some(value => !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5)) fail('PRF_W10D_ONET_ANSWERS_INVALID');
  return answers.map(Number).join('');
}

export async function fetchOnetInterestProfilerResults({ apiKey, answers, fetchImpl } = {}) {
  const encoded = encodeURIComponent(answersString(answers));
  return onetGet(`/mnm/interestprofiler/results?answers=${encoded}`, { apiKey, fetchImpl });
}

export async function fetchOnetMatchingCareers({ apiKey, answers = null, scores = null, zone = null, start = 1, end = 20, fetchImpl } = {}) {
  const params = new URLSearchParams();
  if (answers !== null) params.set('answers', answersString(answers));
  else {
    if (!scores || ONET_RIASEC.some(code => !Number.isInteger(Number(scores[code])))) fail('PRF_W10D_ONET_RIASEC_SCORES_REQUIRED');
    for (const code of ONET_RIASEC) params.set(code, String(Number(scores[code])));
  }
  if (zone !== null && zone !== '') {
    const z = Number(zone);
    if (!Number.isInteger(z) || z < 1 || z > 5) fail('PRF_W10D_ONET_JOB_ZONE_INVALID');
    params.set('zone', String(z));
  }
  params.set('start', String(start));
  params.set('end', String(end));
  return onetGet(`/mnm/interestprofiler/careers?${params.toString()}`, { apiKey, fetchImpl });
}

export async function fetchOnetJobZones({ apiKey, fetchImpl } = {}) {
  return onetGet('/mnm/interestprofiler/job_zones', { apiKey, fetchImpl });
}

export function normalizeOnetJobZones(providerZones) {
  const raw = list(providerZones?.job_zone ?? providerZones?.job_zones ?? providerZones);
  const zones = raw.map(row => ({ code: Number(row.code), title: text(row.title, 'PRF_ONET_JOB_ZONE_TITLE_REQUIRED', 180) }))
    .filter(row => Number.isInteger(row.code) && row.code >= 1 && row.code <= 5);
  if (!zones.length) fail('PRF_ONET_JOB_ZONES_REQUIRED');
  return deepFreeze({ schemaVersion: ONET_JOB_ZONE_SCHEMA, zones, governance: { providerLabelsPreserved: true, preparationContextNotAbilityRank: true } });
}

export async function fetchOnetCareerDetail({ apiKey, code, fetchImpl } = {}) {
  const careerCode = text(code, 'PRF_ONET_CAREER_CODE_REQUIRED', 40);
  if (!/^\d{2}-\d{4}\.\d{2}$/.test(careerCode)) fail('PRF_ONET_CAREER_CODE_INVALID');
  return onetGet(`/mnm/careers/${encodeURIComponent(careerCode)}/`, { apiKey, fetchImpl });
}

export function normalizeOnetCareerDetail(providerCareer) {
  const code = text(providerCareer?.code, 'PRF_ONET_CAREER_CODE_REQUIRED', 40);
  const title = text(providerCareer?.title, 'PRF_ONET_CAREER_TITLE_REQUIRED', 220);
  const whatTheyDo = text(providerCareer?.what_they_do, 'PRF_ONET_CAREER_SUMMARY_REQUIRED', 1600);
  const onTheJob = list(providerCareer?.on_the_job).map(item => typeof item === 'string' ? text(item, 'PRF_ONET_CAREER_TASK_INVALID', 800) : text(item?.text, 'PRF_ONET_CAREER_TASK_INVALID', 800)).slice(0,12);
  return deepFreeze({
    schemaVersion: ONET_CAREER_DETAIL_SCHEMA, provider: 'O_NET_WEB_SERVICES_V2', code, title, whatTheyDo, onTheJob,
    governance: { providerDataAltered: false, explorationOnly: true, jobFitGuaranteeCreated: false, employmentDecisionAuthorityCreated: false }
  });
}

function normalizeOnetCareerMatches(careers) {
  return list(careers?.career ?? careers).slice(0, 100).map(row => {
    const providerFit = typeof row.fit === 'string' ? row.fit : null;
    return {
      code: text(row.code, 'PRF_W10D_ONET_CAREER_CODE_REQUIRED', 40),
      title: text(row.title, 'PRF_W10D_ONET_CAREER_TITLE_REQUIRED', 200),
      providerFit,
      interestMatchClass: ONET_FIT_LABELS[providerFit] || 'PROVIDER_MATCH_UNCLASSIFIED',
      brightOutlook: row.tags?.bright_outlook === true,
      href: typeof row.href === 'string' ? row.href : null
    };
  });
}

export async function normalizeOnetInterestProfilerResult({ participantRef, assessmentDate, form = 'MINI_30', providerResult, careers = [], jobZones = null, selectedJobZone = null, customerConfirmed = true } = {}) {
  const person = text(participantRef, 'PRF_W10D_ONET_PARTICIPANT_REQUIRED', 160);
  const date = isoDate(assessmentDate, 'PRF_W10D_ONET_ASSESSMENT_DATE_REQUIRED');
  const [normalizedForm, config] = onetForm(form);
  const rows = list(providerResult?.result);
  if (rows.length !== 6) fail('PRF_W10D_ONET_SIX_RIASEC_RESULTS_REQUIRED');
  const interests = {};
  for (const row of rows) {
    const code = text(row.code, 'PRF_W10D_ONET_RIASEC_CODE_REQUIRED', 40).toLowerCase();
    if (!ONET_RIASEC.includes(code) || interests[code]) fail('PRF_W10D_ONET_RIASEC_CODE_INVALID');
    const score = Number(row.score);
    if (!Number.isInteger(score) || score < config.rawRange[0] || score > config.rawRange[1]) fail('PRF_W10D_ONET_RIASEC_SCORE_INVALID', { code, score, rawRange: config.rawRange });
    interests[code] = { code, score, title: typeof row.title === 'string' ? row.title : code, description: typeof row.description === 'string' ? row.description : null, href: typeof row.href === 'string' ? row.href : null, rawRange: [...config.rawRange] };
  }
  if (ONET_RIASEC.some(code => !(code in interests))) fail('PRF_W10D_ONET_RIASEC_COVERAGE_REQUIRED');
  const normalizedCareers = normalizeOnetCareerMatches(careers);
  const normalizedZones = jobZones ? normalizeOnetJobZones(jobZones) : null;
  const selectedZone = selectedJobZone === null || selectedJobZone === '' ? null : Number(selectedJobZone);
  if (selectedZone !== null && (!Number.isInteger(selectedZone) || selectedZone < 1 || selectedZone > 5)) fail('PRF_W10D_ONET_JOB_ZONE_INVALID');
  const ranking = ONET_RIASEC.map(code => interests[code]).sort((a,b)=>b.score-a.score || a.code.localeCompare(b.code)).map(row=>row.code);
  const digest = await sha256Stable({ person, date, form:normalizedForm, scores: ONET_RIASEC.map(code => [code, interests[code].score]), careers: normalizedCareers.map(row => [row.code,row.providerFit]), selectedZone });
  return deepFreeze({
    schemaVersion: ONET_RESULT_SCHEMA,
    resultId: `PRF-ONET-${digest.slice(0, 24).toUpperCase()}`,
    participantRef: person,
    assessmentDate: date,
    form: normalizedForm,
    itemCount: config.itemCount,
    sourceClass: 'STANDARDIZED_SELF_REPORT',
    scoringState: 'EXTERNALLY_SCORED',
    normingState: 'NOT_NORMED',
    provider: 'O_NET_WEB_SERVICES_V2',
    interests,
    interestRanking: ranking,
    careers: normalizedCareers,
    jobZones: normalizedZones?.zones || [],
    selectedJobZone: selectedZone,
    customerConfirmed: customerConfirmed === true,
    attribution: 'This application incorporates information from O*NET Web Services by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET® is a trademark of USDOL/ETA.',
    governance: {
      providerScoringPreserved: true,
      providerDataAltered: false,
      providerFitLabelPreserved: true,
      phiosFitLabelIsExplorationLanguageOnly: true,
      careerFitGuaranteeCreated: false,
      employmentDecisionAuthorityCreated: false,
      destinyClaimCreated: false,
      automaticPersistence: false,
      customerPublishableBeforePrfW12: false
    },
    semanticDigest: digest
  });
}

export async function buildOnetProfileSignals(onetResult) {
  if (onetResult?.schemaVersion !== ONET_RESULT_SCHEMA) fail('PRF_W10F_ONET_RESULT_REQUIRED');
  const signals = [];
  for (const code of ONET_RIASEC) {
    const row = onetResult.interests[code];
    signals.push(await buildProfileSignalEnvelope({
      participantRef: onetResult.participantRef,
      sourceClass:'STANDARDIZED_SELF_REPORT',
      sourceRef:onetResult.resultId,
      domainId:`RIASEC::${code.toUpperCase()}`,
      value:{ score:row.score, title:row.title, form:onetResult.form, rawRange:row.rawRange },
      valueType:'OBJECT',
      confidence:onetResult.customerConfirmed?'CUSTOMER_CONFIRMED':'SELF_REPORTED',
      assessmentDate:onetResult.assessmentDate,
      customerConfirmed:onetResult.customerConfirmed,
      precisionBoundary:['EXTERNALLY_SCORED_BY_ONET_WEB_SERVICES','STANDARDIZED_SELF_REPORT_INTEREST_NOT_OBJECTIVE_PERSONALITY_FACT','CAREER_INTEREST_NOT_JOB_FIT_GUARANTEE','NO_EMPLOYMENT_DECISION_AUTHORITY'],
      provenance:[{source:onetResult.resultId,provider:onetResult.provider,form:onetResult.form,attribution:onetResult.attribution}]
    }));
  }
  return deepFreeze(signals);
}

export async function scoreFinancialCapabilityAssessment({ instrument, responses = {}, participantRef, assessmentDate, consent, customerConfirmed = true } = {}) {
  if (instrument?.schemaVersion !== 'PHI-OS-FINANCIAL-CAPABILITY-INSTRUMENT-v1.0.0') fail('PRF_W10E_FINANCIAL_INSTRUMENT_REQUIRED');
  if (consent !== true) fail('PRF_W10E_FINANCIAL_EXPLICIT_CONSENT_REQUIRED');
  const person = text(participantRef, 'PRF_W10E_FINANCIAL_PARTICIPANT_REQUIRED', 160);
  const date = isoDate(assessmentDate, 'PRF_W10E_FINANCIAL_ASSESSMENT_DATE_REQUIRED');
  const sectionRows = new Map();
  const scoredResponses = [];
  for (const item of instrument.items) {
    if (!(item.itemId in responses)) continue;
    const raw = responses[item.itemId];
    let point;
    if (item.response === 'LIKERT_1_5') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 5) fail('PRF_W10E_FINANCIAL_RESPONSE_INVALID', { itemId: item.itemId });
      point = item.scoring.goodIf.includes(n) ? 1 : 0;
    } else {
      const v = text(String(raw), 'PRF_W10E_FINANCIAL_RESPONSE_INVALID', 80);
      if (!item.scoring.options.includes(v)) fail('PRF_W10E_FINANCIAL_RESPONSE_OPTION_INVALID', { itemId: item.itemId, value: v });
      point = v === item.scoring.correct ? 1 : 0;
    }
    if (!sectionRows.has(item.section)) sectionRows.set(item.section, []);
    sectionRows.get(item.section).push({ itemId: item.itemId, sourceClass: item.sourceClass, point, raw });
    scoredResponses.push({ itemId: item.itemId, section: item.section, sourceClass: item.sourceClass, point, raw });
  }
  if (!scoredResponses.length) fail('PRF_W10E_FINANCIAL_RESPONSES_REQUIRED');
  const sections = {};
  for (const [section, rows] of [...sectionRows.entries()].sort(([a],[b]) => a.localeCompare(b))) {
    const sourceClasses = [...new Set(rows.map(row => row.sourceClass))];
    const rawPoints = rows.reduce((sum,row)=>sum+row.point,0);
    sections[section] = { rawPoints, answered: rows.length, adaptedIndex: round((rawPoints / rows.length) * 100, 2), sourceClasses };
  }
  const digest = await sha256Stable({ person, date, responses: scoredResponses.map(row => [row.itemId,row.raw]), sections });
  return deepFreeze({
    schemaVersion: FINANCIAL_CAPABILITY_RESULT_SCHEMA,
    resultId: `PRF-FCAP-${digest.slice(0, 24).toUpperCase()}`,
    participantRef: person,
    instrumentId: instrument.instrumentId,
    instrumentVersion: instrument.instrumentVersion,
    assessmentDate: date,
    scoringState: 'ADAPTED_SCORED',
    normingState: 'NOT_NORMED',
    sourceClasses: [...new Set(scoredResponses.map(row => row.sourceClass))].sort(),
    sections,
    scoredResponses,
    customerConfirmed: customerConfirmed === true,
    adaptationDisclosure: instrument.adaptationDisclosure,
    governance: {
      explicitFinancialConsentCaptured: true,
      officialOecdCompositeCreated: false,
      officialOecdScoreClaimed: false,
      oecdEndorsementClaimed: false,
      professionalFinancialAdviceCreated: false,
      diagnosisCreated: false,
      customerPublishableBeforePrfW12: false
    },
    semanticDigest: digest
  });
}

export async function buildAcademicProfileSignalBundle({ ipipResult = null, reasoningSession = null, onetResult = null, financialResult = null } = {}) {
  const signals = [];
  if (ipipResult !== null) {
    if (ipipResult?.schemaVersion !== IPIP_RESULT_SCHEMA) fail('PRF_W10F_IPIP_RESULT_REQUIRED');
    if (ipipResult.instrumentId === 'IPIP_BIG_FIVE_50') {
      for (const [factorId, score] of Object.entries(ipipResult.scores?.factors || {}).sort(([a],[b])=>a.localeCompare(b))) {
        signals.push(await buildProfileSignalEnvelope({
          participantRef: ipipResult.participantRef,
          sourceClass: 'STANDARDIZED_SELF_REPORT',
          sourceRef: ipipResult.resultId,
          providerFamily: 'IPIP_BIG_FIVE',
          domainId: `BIG_FIVE::${factorId}`,
          value: { rawTotal: score.rawTotal, rawMean: score.rawMean, answered: score.answered, expected: score.expected },
          valueType: 'OBJECT', confidence: ipipResult.customerConfirmed ? 'CUSTOMER_CONFIRMED' : 'SELF_REPORTED', assessmentDate: ipipResult.assessmentDate, customerConfirmed: ipipResult.customerConfirmed,
          precisionBoundary: ['STANDARDIZED_SELF_REPORT','RAW_KEYED_IPIP_SCORE','NOT_NORMED','NOT_PERCENTILE','NOT_DIAGNOSTIC'],
          provenance: [{ source: ipipResult.resultId, instrumentId: ipipResult.instrumentId, instrumentVersion: ipipResult.instrumentVersion, scoringState: ipipResult.scoringState }]
        }));
      }
    } else {
      for (const [domainId, score] of Object.entries(ipipResult.scores?.domains || {}).sort(([a],[b])=>a.localeCompare(b))) {
        signals.push(await buildProfileSignalEnvelope({ participantRef: ipipResult.participantRef, sourceClass:'STANDARDIZED_SELF_REPORT', sourceRef:ipipResult.resultId, providerFamily:'IPIP_BIG_FIVE', domainId:`BIG_FIVE::${domainId}`, value:clone(score), valueType:'OBJECT', confidence:ipipResult.customerConfirmed?'CUSTOMER_CONFIRMED':'SELF_REPORTED', assessmentDate:ipipResult.assessmentDate, customerConfirmed:ipipResult.customerConfirmed, precisionBoundary:['STANDARDIZED_SELF_REPORT','RAW_KEYED_IPIP_SCORE','NOT_NORMED','NOT_PERCENTILE','NOT_DIAGNOSTIC'], provenance:[{source:ipipResult.resultId,instrumentId:ipipResult.instrumentId,instrumentVersion:ipipResult.instrumentVersion}] }));
      }
      for (const [facetId, score] of Object.entries(ipipResult.scores?.facets || {}).sort(([a],[b])=>a.localeCompare(b))) {
        signals.push(await buildProfileSignalEnvelope({ participantRef: ipipResult.participantRef, sourceClass:'STANDARDIZED_SELF_REPORT', sourceRef:ipipResult.resultId, providerFamily:'IPIP_BIG_FIVE', domainId:`BIG_FIVE::${score.domainCode}`, facetId, value:clone(score), valueType:'OBJECT', confidence:ipipResult.customerConfirmed?'CUSTOMER_CONFIRMED':'SELF_REPORTED', assessmentDate:ipipResult.assessmentDate, customerConfirmed:ipipResult.customerConfirmed, precisionBoundary:['STANDARDIZED_SELF_REPORT','RAW_KEYED_IPIP_FACET_SCORE','NOT_NORMED','NOT_PERCENTILE','NOT_DIAGNOSTIC'], provenance:[{source:ipipResult.resultId,instrumentId:ipipResult.instrumentId,instrumentVersion:ipipResult.instrumentVersion}] }));
      }
    }
  }

  if (reasoningSession !== null) {
    if (reasoningSession?.schemaVersion !== REASONING_SESSION_SCHEMA) fail('PRF_W10F_REASONING_SESSION_REQUIRED');
    signals.push(...await buildReasoningPerformanceSignals(reasoningSession.performance));
  }

  if (onetResult !== null) {
    signals.push(...await buildOnetProfileSignals(onetResult));
  }

  if (financialResult !== null) {
    if (financialResult?.schemaVersion !== FINANCIAL_CAPABILITY_RESULT_SCHEMA) fail('PRF_W10F_FINANCIAL_RESULT_REQUIRED');
    for (const [section, score] of Object.entries(financialResult.sections || {}).sort(([a],[b])=>a.localeCompare(b))) {
      const sourceClass = score.sourceClasses.length === 1 ? score.sourceClasses[0] : null;
      if (!sourceClass) fail('PRF_W10F_FINANCIAL_SECTION_SOURCE_CLASS_AMBIGUOUS', { section, sourceClasses: score.sourceClasses });
      signals.push(await buildProfileSignalEnvelope({ participantRef:financialResult.participantRef, sourceClass, sourceRef:financialResult.resultId, domainId:`FINANCIAL_CAPABILITY::${section}`, value:{rawPoints:score.rawPoints,answered:score.answered,adaptedIndex:score.adaptedIndex}, valueType:'OBJECT', confidence:sourceClass==='MEASURED_TASK_PERFORMANCE'?'TASK_OBSERVED':(financialResult.customerConfirmed?'CUSTOMER_CONFIRMED':'SELF_REPORTED'), assessmentDate:financialResult.assessmentDate, customerConfirmed:financialResult.customerConfirmed, precisionBoundary:[sourceClass,'PHI_OS_ADAPTED_SCORING','NOT_OFFICIAL_OECD_SCORE','NOT_NORMED','NOT_FINANCIAL_ADVICE'], provenance:[{source:financialResult.resultId,sourceBasis:'OECD_INFE_2026',scoringState:'ADAPTED_SCORED'}] }));
    }
  }

  if (!signals.length) fail('PRF_W10F_ACADEMIC_SIGNAL_SOURCE_REQUIRED');
  const sourceClassIndex = {};
  for (const signal of signals) {
    if (!sourceClassIndex[signal.sourceClass]) sourceClassIndex[signal.sourceClass] = [];
    sourceClassIndex[signal.sourceClass].push(signal.profileSignalId);
  }
  for (const ids of Object.values(sourceClassIndex)) ids.sort();
  const semanticDigest = await sha256Stable(signals.map(signal => signal.semanticDigest).sort());
  return deepFreeze({
    schemaVersion: ACADEMIC_SIGNAL_BUNDLE_SCHEMA,
    signals: deepFreeze(signals),
    sourceClassIndex: deepFreeze(sourceClassIndex),
    governance: deepFreeze({
      canonicalEnvelopePreserved: true,
      sourceClassesPreserved: true,
      crossLaneAveragingAllowed: false,
      universalMasterScoreCreated: false,
      symbolicScientificValidationCreated: false,
      customerPublishableBeforePrfW12: false
    }),
    semanticDigest
  });
}

export function stableAcademicBridgeSnapshot(value) {
  return stableStringify(value);
}
