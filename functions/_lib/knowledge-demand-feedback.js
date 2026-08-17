const COVERAGE_GAPS = new Set(['NONE', 'PARTIAL', 'INSUFFICIENT']);
const DIFFICULTIES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const THESIS_SOURCES = new Set(['CANONICAL_THESIS', 'HUMAN_EDITORIAL']);
const CAR_ROLES = new Set(['FIGURE', 'DIAGRAM', 'MULTI_ASSET']);
const VISUAL_TYPES = new Set(['FIGURE', 'DIAGRAM', 'FLOW', 'COMPARISON']);
const BANNED_KEYS = new Set([
  'question', 'rawquestion', 'questiontext', 'prompt', 'userid', 'accountid', 'email', 'phone',
  'sessionid', 'caseid', 'birthdata', 'ipaddress'
]);

const DEFAULT_POLICY = Object.freeze({
  highDemand: Object.freeze({ minimumFrequency: 20, alternate: Object.freeze({ minimumFrequency: 10, minimumFollowUpRate: 0.25 }) }),
  strongKnowledgeSupport: Object.freeze({ allowedStatuses: Object.freeze(['STRONG']), minimumCanonicalNodes: 1, minimumGovernedSourceRefs: 1 })
});

const canonicalText = value => String(value ?? '').normalize('NFKC').trim();
const unique = values => [...new Set((values || []).filter(Boolean))];
const clampRate = value => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('PCA_RATE_INVALID');
  return n;
};

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
}

function assertAnonymousAggregate(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (BANNED_KEYS.has(normalized)) throw new Error(`PCA_PERSONAL_OR_RAW_FIELD_FORBIDDEN:${path}.${key}`);
    if (child && typeof child === 'object') assertAnonymousAggregate(child, `${path}.${key}`);
  }
}

function normalizeWindow(window = {}) {
  const start = new Date(window.start);
  const end = new Date(window.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) throw new Error('PCA_WINDOW_INVALID');
  return { start: start.toISOString(), end: end.toISOString() };
}

function normalizeClusterCode(value) {
  const code = canonicalText(value).toUpperCase();
  if (!/^QCL-[A-Z0-9][A-Z0-9_-]{2,63}$/.test(code)) throw new Error('PCA_QUESTION_CLUSTER_CODE_INVALID');
  return code;
}

function normalizeNodes(nodes = []) {
  const normalized = unique(nodes.map(value => canonicalText(value).toUpperCase()));
  if (normalized.some(code => !/^KN-[A-Z0-9-]+$/.test(code))) throw new Error('PCA_MATCHED_NODE_INVALID');
  return normalized.sort();
}

function normalizeDifficulty(value) {
  const difficulty = canonicalText(value).toUpperCase();
  if (!DIFFICULTIES.has(difficulty)) throw new Error('PCA_ANSWER_DIFFICULTY_INVALID');
  return difficulty;
}

function normalizeCoverageGap(value) {
  const gap = canonicalText(value).toUpperCase();
  if (!COVERAGE_GAPS.has(gap)) throw new Error('PCA_COVERAGE_GAP_INVALID');
  return gap;
}

export function createQuestionDemandSignal(input = {}) {
  assertAnonymousAggregate(input);
  const questionClusterCode = normalizeClusterCode(input.questionClusterCode);
  const frequency = Number(input.frequency);
  if (!Number.isInteger(frequency) || frequency < 1) throw new Error('PCA_FREQUENCY_INVALID');
  const matchedNodes = normalizeNodes(input.matchedNodes || []);
  const window = normalizeWindow(input.window);
  const metrics = {
    frequency,
    coverageGap: normalizeCoverageGap(input.coverageGap),
    followUpRate: clampRate(input.followUpRate),
    answerDifficulty: normalizeDifficulty(input.answerDifficulty),
    journeyEscalationRate: clampRate(input.journeyEscalationRate)
  };
  const identity = `${questionClusterCode}|${window.start}|${window.end}|${matchedNodes.join(',')}|${JSON.stringify(metrics)}`;
  return Object.freeze({
    schemaVersion: 'PHI-OS-QUESTION-DEMAND-SIGNAL-v1.0.0',
    signalId: `PCA-QDS-${stableHash(identity)}`,
    questionClusterCode,
    window,
    matchedNodes,
    metrics,
    privacy: {
      dataClass: 'ANONYMOUS_AGGREGATED',
      rawQuestionStored: false,
      userIdentityStored: false,
      sessionIdentityStored: false
    },
    authority: {
      createsCanonicalKnowledge: false,
      changesCanonicalTruth: false,
      createsPublication: false
    }
  });
}

export function aggregateQuestionDemandCluster(signals = []) {
  if (!Array.isArray(signals) || !signals.length) throw new Error('PCA_DEMAND_SIGNALS_REQUIRED');
  for (const signal of signals) {
    if (signal?.schemaVersion !== 'PHI-OS-QUESTION-DEMAND-SIGNAL-v1.0.0') throw new Error('PCA_DEMAND_SIGNAL_INVALID');
    assertAnonymousAggregate(signal);
  }
  const questionClusterCode = normalizeClusterCode(signals[0].questionClusterCode);
  if (signals.some(signal => normalizeClusterCode(signal.questionClusterCode) !== questionClusterCode)) throw new Error('PCA_MIXED_CLUSTER_CODES_FORBIDDEN');
  const total = signals.reduce((sum, signal) => sum + Number(signal.metrics.frequency || 0), 0);
  const weighted = key => Number((signals.reduce((sum, signal) => sum + Number(signal.metrics[key] || 0) * Number(signal.metrics.frequency || 0), 0) / total).toFixed(6));
  const difficultyRank = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const coverageRank = { NONE: 0, PARTIAL: 1, INSUFFICIENT: 2 };
  const answerDifficulty = signals.map(signal => signal.metrics.answerDifficulty).sort((a, b) => difficultyRank[b] - difficultyRank[a])[0];
  const coverageGap = signals.map(signal => signal.metrics.coverageGap).sort((a, b) => coverageRank[b] - coverageRank[a])[0];
  const matchedNodes = unique(signals.flatMap(signal => signal.matchedNodes || [])).sort();
  const windowStart = new Date(Math.min(...signals.map(signal => new Date(signal.window.start).getTime()))).toISOString();
  const windowEnd = new Date(Math.max(...signals.map(signal => new Date(signal.window.end).getTime()))).toISOString();
  const identity = `${questionClusterCode}|${signals.map(signal => signal.signalId).sort().join('|')}`;
  return Object.freeze({
    schemaVersion: 'PHI-OS-QUESTION-DEMAND-CLUSTER-v1.0.0',
    clusterId: `PCA-QCL-${stableHash(identity)}`,
    questionClusterCode,
    signalCount: signals.length,
    window: { start: windowStart, end: windowEnd },
    matchedNodes,
    metrics: {
      frequency: total,
      coverageGap,
      followUpRate: weighted('followUpRate'),
      answerDifficulty,
      journeyEscalationRate: weighted('journeyEscalationRate')
    },
    authority: {
      isCanonicalKnowledge: false,
      createsCanonicalNode: false,
      changesThesis: false,
      changesRelationship: false,
      changesCanonicalMeaning: false
    }
  });
}

export function buildKppDemandInput({ cluster, canonicalMaturity = 'UNKNOWN', knowledgeGap = 'UNKNOWN', surfaceNeed = 'NONE', academyNeed = 'NONE', readingNeed = 'NONE' } = {}) {
  if (cluster?.schemaVersion !== 'PHI-OS-QUESTION-DEMAND-CLUSTER-v1.0.0') throw new Error('PCA_DEMAND_CLUSTER_REQUIRED');
  return Object.freeze({
    schemaVersion: 'PHI-OS-KPP-DEMAND-INPUT-v1.0.0',
    demandInputId: `PCA-KPP-${stableHash(`${cluster.clusterId}|${canonicalMaturity}|${knowledgeGap}|${surfaceNeed}|${academyNeed}|${readingNeed}`)}`,
    dimensions: {
      canonicalMaturity: canonicalText(canonicalMaturity).toUpperCase(),
      knowledgeGap: canonicalText(knowledgeGap).toUpperCase(),
      clientDemand: { clusterId: cluster.clusterId, questionClusterCode: cluster.questionClusterCode, metrics: cluster.metrics, matchedNodes: cluster.matchedNodes },
      surfaceNeed: canonicalText(surfaceNeed).toUpperCase(),
      academyNeed: canonicalText(academyNeed).toUpperCase(),
      readingNeed: canonicalText(readingNeed).toUpperCase()
    },
    authority: {
      advisoryPlanningInputOnly: true,
      automaticPlanMutation: false,
      automaticRoleMutation: false,
      automaticWaveMutation: false,
      productionDecisionAuthority: 'KPP'
    }
  });
}

export function evaluatePcaArticleCandidate({ kppDemandInput, reusable, personalSpecificity = false, knowledgeSupport = {}, policy = DEFAULT_POLICY } = {}) {
  if (kppDemandInput?.schemaVersion !== 'PHI-OS-KPP-DEMAND-INPUT-v1.0.0') throw new Error('PCA_KPP_DEMAND_INPUT_REQUIRED');
  const metrics = kppDemandInput.dimensions.clientDemand.metrics;
  const highDemand = metrics.frequency >= policy.highDemand.minimumFrequency || (metrics.frequency >= policy.highDemand.alternate.minimumFrequency && metrics.followUpRate >= policy.highDemand.alternate.minimumFollowUpRate);
  const reusableEligible = reusable === true && personalSpecificity !== true;
  const status = canonicalText(knowledgeSupport.status).toUpperCase();
  const nodeCount = Number(knowledgeSupport.canonicalNodeCount || 0);
  const sourceRefCount = Number(knowledgeSupport.governedSourceRefCount || 0);
  const strongKnowledgeSupport = policy.strongKnowledgeSupport.allowedStatuses.includes(status) && nodeCount >= policy.strongKnowledgeSupport.minimumCanonicalNodes && sourceRefCount >= policy.strongKnowledgeSupport.minimumGovernedSourceRefs;
  const eligible = highDemand && reusableEligible && strongKnowledgeSupport;
  return Object.freeze({
    schemaVersion: 'PHI-OS-PCA-ARTICLE-CANDIDATE-v1.0.0',
    candidateId: `PCA-ARTICLE-${stableHash(`${kppDemandInput.demandInputId}|${highDemand}|${reusableEligible}|${strongKnowledgeSupport}`)}`,
    status: eligible ? 'ELIGIBLE_FOR_KPP_ARTICLE_CONSIDERATION' : 'NOT_ELIGIBLE',
    tests: { highDemand, reusable: reusableEligible, strongKnowledgeSupport },
    evidence: { demandInputId: kppDemandInput.demandInputId, canonicalNodeCount: nodeCount, governedSourceRefCount: sourceRefCount },
    authority: {
      productionRoleAssigned: false,
      kppMaySelectProductionRoleArticle: eligible,
      humanProductionDecisionRequired: true,
      isArticle: false,
      isPublication: false
    }
  });
}

export function buildPjaDemandBriefCandidate({ articleCandidate, kppDecision = {}, scope, canonicalNodes = [], thesis = {}, boundaries = [], sourceRefs = [], localeRequirements = [] } = {}) {
  if (articleCandidate?.status !== 'ELIGIBLE_FOR_KPP_ARTICLE_CONSIDERATION') throw new Error('PCA_ARTICLE_CANDIDATE_NOT_ELIGIBLE');
  if (kppDecision.productionRole !== 'ARTICLE') throw new Error('PCA_KPP_ARTICLE_ROLE_REQUIRED');
  if (kppDecision.humanProductionDecision !== 'APPROVED') throw new Error('PCA_KPP_HUMAN_DECISION_REQUIRED');
  if (!kppDecision.frozenPlanRef || !kppDecision.frozenWaveRef) throw new Error('PCA_KPP_FROZEN_PLAN_WAVE_REQUIRED');
  const thesisSource = canonicalText(thesis.source).toUpperCase();
  if (!THESIS_SOURCES.has(thesisSource) || !canonicalText(thesis.text)) throw new Error('PCA_PJA_THESIS_SOURCE_INVALID');
  const nodes = normalizeNodes(canonicalNodes);
  if (!canonicalText(scope) || !nodes.length || !boundaries.length || !sourceRefs.length || !localeRequirements.length) throw new Error('PCA_PJA_BRIEF_FIELDS_INCOMPLETE');
  const identity = `${articleCandidate.candidateId}|${kppDecision.frozenPlanRef}|${kppDecision.frozenWaveRef}|${nodes.join(',')}|${thesisSource}|${thesis.text}`;
  return Object.freeze({
    schemaVersion: 'PHI-OS-PCA-PJA-DEMAND-BRIEF-CANDIDATE-v1.0.0',
    briefId: `PCA-PJA-${stableHash(identity)}`,
    origin: 'CLIENT_DEMAND_FEEDBACK',
    scope: canonicalText(scope),
    canonicalNodes: nodes,
    thesis: { source: thesisSource, text: canonicalText(thesis.text), demandDerived: false },
    boundaries: unique(boundaries.map(canonicalText)),
    sourceRefs: unique(sourceRefs.map(canonicalText)),
    localeRequirements: unique(localeRequirements.map(canonicalText)),
    kppDecision: {
      productionRole: 'ARTICLE',
      humanProductionDecision: 'APPROVED',
      frozenPlanRef: canonicalText(kppDecision.frozenPlanRef),
      frozenWaveRef: canonicalText(kppDecision.frozenWaveRef)
    },
    governance: {
      humanReviewRequired: true,
      pjaLifecycleRequired: true,
      pjaApprovalGranted: false,
      publicationAllowed: false
    }
  });
}

export function evaluateCarVisualCandidate({ visualNeed = {}, kppCarHandoff = {} } = {}) {
  const type = canonicalText(visualNeed.type).toUpperCase();
  if (!VISUAL_TYPES.has(type)) throw new Error('PCA_VISUAL_NEED_UNSUPPORTED');
  if (visualNeed.reusable !== true) throw new Error('PCA_VISUAL_NEED_NOT_REUSABLE');
  const role = canonicalText(kppCarHandoff.productionRole).toUpperCase();
  if (!CAR_ROLES.has(role) || !kppCarHandoff.handoffRef || !kppCarHandoff.frozenPlanRef || !kppCarHandoff.frozenWaveRef) throw new Error('PCA_GOVERNED_KPP_CAR_HANDOFF_REQUIRED');
  const mappedRole = type === 'FIGURE' ? 'FIGURE' : 'DIAGRAM';
  if (role !== 'MULTI_ASSET' && role !== mappedRole) throw new Error('PCA_KPP_CAR_ROLE_MISMATCH');
  return Object.freeze({
    schemaVersion: 'PHI-OS-PCA-CAR-VISUAL-CANDIDATE-v1.0.0',
    candidateId: `PCA-CAR-${stableHash(`${type}|${visualNeed.clusterId || ''}|${kppCarHandoff.handoffRef}`)}`,
    visualNeed: { type, mappedProductionRole: mappedRole, purpose: canonicalText(visualNeed.purpose), reusable: true },
    kppCarHandoff: { handoffRef: canonicalText(kppCarHandoff.handoffRef), productionRole: role, frozenPlanRef: canonicalText(kppCarHandoff.frozenPlanRef), frozenWaveRef: canonicalText(kppCarHandoff.frozenWaveRef) },
    authority: { createsFinalAsset: false, approvesAsset: false, publishesAsset: false, carLifecycleRequired: true }
  });
}

export function buildPcaProductionFeedbackRecord({ cluster, articleCandidate = null, pjaBrief = null, carVisualCandidate = null, publishedKnowledgeRefs = [] } = {}) {
  if (cluster?.schemaVersion !== 'PHI-OS-QUESTION-DEMAND-CLUSTER-v1.0.0') throw new Error('PCA_DEMAND_CLUSTER_REQUIRED');
  return Object.freeze({
    schemaVersion: 'PHI-OS-PCA-PRODUCTION-FEEDBACK-RECORD-v1.0.0',
    feedbackId: `PCA-FEEDBACK-${stableHash(`${cluster.clusterId}|${articleCandidate?.candidateId || ''}|${pjaBrief?.briefId || ''}|${carVisualCandidate?.candidateId || ''}|${publishedKnowledgeRefs.join(',')}`)}`,
    loop: ['CLIENT_QUESTIONS','DYNAMIC_ANSWERS','ANONYMOUS_DEMAND_SIGNAL','KPP','PJA_OR_CAR','HUMAN_REVIEW','PUBLISHED_KNOWLEDGE','BETTER_FUTURE_ANSWERS'],
    references: { clusterId: cluster.clusterId, articleCandidateId: articleCandidate?.candidateId || null, pjaBriefId: pjaBrief?.briefId || null, carVisualCandidateId: carVisualCandidate?.candidateId || null, publishedKnowledgeRefs: unique(publishedKnowledgeRefs.map(canonicalText)) },
    authority: {
      demandCanRewriteCanonicalTruth: false,
      automaticCanonicalNodeCreation: false,
      automaticThesisChange: false,
      automaticRelationshipChange: false,
      automaticPublication: false
    }
  });
}

export const PCA_DEMAND_POLICY_DEFAULTS = DEFAULT_POLICY;
