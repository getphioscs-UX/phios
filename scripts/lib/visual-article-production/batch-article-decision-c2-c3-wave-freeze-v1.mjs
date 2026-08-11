import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildC2, contentHash } from '../knowledge-readiness/canonical-thesis-boundary.mjs';
import { buildProductionReadiness, recordPath as c3RecordPath } from '../knowledge-readiness/universal-production-readiness.mjs';
import {
  VAP_W6A_BASELINE,
  VAP_W6A_BATCH_CODE,
  VAP_W6A_DECISIONS,
  VAP_W6A_NODE_CODES,
  VAP_W6A_REVIEW,
  loadVapW6aHumanAuthority
} from './vap-w6a-authority-resolution-v1.mjs';

export const VAP_W6A_CONTRACT = 'content/production/visual-article/contracts/vap-w6a-batch-article-decision-c2-c3-wave-freeze-v1.json';
export const VAP_W6A_SCHEMA = 'content/production/visual-article/schemas/vap-w6a-human-decisions-v1.schema.json';
export const VAP_W6_BATCH = 'content/production/visual-article/batches/vap-article-batch-001-selection-v1.json';
export const VAP_W6A_ELIGIBILITY = 'content/production/visual-article/eligibility/vap-article-batch-001-execution-eligibility-v1.json';
export const VAP_W6A_ACTIVATION = 'content/production/visual-article/activation/vap-w6a-batch-article-decision-c2-c3-wave-freeze-v1.json';
export const VAP_W6A_PRODUCTION_ROOT = 'content/knowledge/production-planning/production/vap-article-batch-001';
export const VAP_W6A_HUMAN_PRODUCTION_DECISION = `${VAP_W6A_PRODUCTION_ROOT}/human-production-decision-v1.json`;
export const VAP_W6A_FROZEN_PLAN = `${VAP_W6A_PRODUCTION_ROOT}/frozen-production-plan-v1.json`;
export const VAP_W6A_FROZEN_WAVE = `${VAP_W6A_PRODUCTION_ROOT}/frozen-production-wave-v1.json`;
export const VAP_W6A_EXECUTION_AUTHORITY = `${VAP_W6A_PRODUCTION_ROOT}/execution-authority-v1.json`;
export const VAP_W6A_WAVE_CODE = 'KPP-WAVE-VAP-ARTICLE-BATCH-001';
export const C2_INDEX = 'content/knowledge/editorial/c2/canonical-thesis-boundary-index.json';
export const C3_INDEX = 'content/knowledge/editorial/c3/universal-production-readiness-index.json';
export const NODE_REGISTRY = 'content/knowledge/registry/nodes.json';
export const LOCALIZED_REGISTRY = 'content/knowledge/registry/localized-content.json';
export const SUPPORTING_QUESTIONS = 'content/knowledge/registry/supporting-questions.json';
export const BLUEPRINT = 'content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json';
export const READINESS_SCHEMA = 'content/knowledge/editorial/readiness/canonical-production-readiness.schema.json';

const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const exists = (root, relative) => fs.existsSync(path.join(root, relative));
const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;
export const digest = value => `sha256:${crypto.createHash('sha256').update(
  typeof value === 'string' ? value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n') : stableJson(value),
  'utf8'
).digest('hex')}`;
const coded = (code, detail = null) => Object.assign(new Error(code), { code, detail });
const slug = nodeCode => nodeCode.toLowerCase();
const decisionPath = nodeCode => `${VAP_W6A_PRODUCTION_ROOT}/decisions/${slug(nodeCode)}-production-decision-v1.json`;
const canonicalReadinessPath = nodeCode => `content/knowledge/editorial/readiness/${slug(nodeCode)}-production-readiness.json`;

function atomicWriteJson(root, relative, value) {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temp = `${absolute}.tmp`;
  fs.writeFileSync(temp, stableJson(value), 'utf8');
  fs.renameSync(temp, absolute);
}

function writeFileMap(root, files) {
  for (const [relative, value] of files) atomicWriteJson(root, relative, value);
}

function currentC2Entry(root, nodeCode) {
  if (!exists(root, C2_INDEX)) return null;
  return readJson(root, C2_INDEX).entries?.find(entry => entry.nodeCode === nodeCode) || null;
}

function currentC3Entry(root, nodeCode) {
  if (!exists(root, C3_INDEX)) return null;
  return readJson(root, C3_INDEX).entries?.find(entry => entry.nodeCode === nodeCode) || null;
}

function productionArtifacts(root) {
  const plan = exists(root, VAP_W6A_FROZEN_PLAN) ? readJson(root, VAP_W6A_FROZEN_PLAN) : null;
  const wave = exists(root, VAP_W6A_FROZEN_WAVE) ? readJson(root, VAP_W6A_FROZEN_WAVE) : null;
  const authority = exists(root, VAP_W6A_EXECUTION_AUTHORITY) ? readJson(root, VAP_W6A_EXECUTION_AUTHORITY) : null;
  return { plan, wave, authority };
}

function artifactContainsNode(artifact, nodeCode) {
  if (!artifact) return false;
  return (artifact.items || []).some(item => item.nodeCode === nodeCode) || (artifact.eligibleNodes || []).includes(nodeCode);
}

export function buildVapW6aExecutionEligibility(root, overrides = {}) {
  const human = loadVapW6aHumanAuthority(root, overrides);
  const batch = readJson(root, VAP_W6_BATCH);
  if (batch.batchCode !== VAP_W6A_BATCH_CODE) throw coded('VAP_W6A_BATCH_MISMATCH');
  const { plan, wave, authority } = productionArtifacts(root);
  const entries = VAP_W6A_NODE_CODES.map(nodeCode => {
    const productionDecision = human.approvedProductionByNode.get(nodeCode) || null;
    const editorialDecision = human.approvedEditorialByNode.get(nodeCode) || null;
    const c2 = currentC2Entry(root, nodeCode);
    const c3 = currentC3Entry(root, nodeCode);
    const humanArticleApproved = productionDecision?.productionRole === 'ARTICLE' && productionDecision?.approved === true;
    const humanC2Approved = Boolean(editorialDecision);
    const mappingApproved = editorialDecision?.manuscriptMappingReview?.humanVerified === true;
    const c2Frozen = c2?.status === 'frozen' && c2?.thesisState === 'frozen' && c2?.boundaryState === 'frozen' && c2?.humanFreezeState === 'approved';
    const c3Ready = c3?.productionReady === true && c3?.status === 'production_ready';
    const planFrozen = plan?.status === 'FROZEN' && artifactContainsNode(plan, nodeCode);
    const waveFrozen = wave?.status === 'FROZEN' && artifactContainsNode(wave, nodeCode);
    const executionAuthorityValid = authority?.status === 'ACTIVE' && authority?.executionAuthority?.dispatchAllowed === true && artifactContainsNode(authority, nodeCode);
    const blockers = [];
    if (!humanArticleApproved) blockers.push('HUMAN_ARTICLE_PRODUCTION_DECISION_REQUIRED');
    if (!humanC2Approved) blockers.push('HUMAN_C2_FREEZE_DECISION_REQUIRED');
    if (!mappingApproved) blockers.push('HUMAN_MANUSCRIPT_MAPPING_VERIFICATION_REQUIRED');
    if (!c2Frozen) blockers.push('C2_THESIS_BOUNDARY_NOT_FROZEN');
    if (!c3Ready) blockers.push('C3_PRODUCTION_READINESS_NOT_PASSED');
    if (!planFrozen) blockers.push('FROZEN_ARTICLE_PRODUCTION_PLAN_REQUIRED');
    if (!waveFrozen) blockers.push('FROZEN_ARTICLE_PRODUCTION_WAVE_REQUIRED');
    if (!executionAuthorityValid) blockers.push('EXECUTION_AUTHORITY_NOT_VALID');
    return {
      nodeCode,
      locale: 'zh-Hans',
      productionRole: humanArticleApproved ? 'ARTICLE' : null,
      articleIntent: humanArticleApproved,
      humanProductionDecisionApproved: humanArticleApproved,
      humanEditorialC2Approved: humanC2Approved,
      manuscriptMappingHumanVerified: mappingApproved,
      c2Frozen,
      c2Record: c2?.record || null,
      c3ProductionReady: c3Ready,
      c3AssessmentFile: c3?.assessmentFile || null,
      productionPlanFrozen: planFrozen,
      productionWaveFrozen: waveFrozen,
      executionAuthorityValid,
      articleExecutionEligible: blockers.length === 0,
      articleExecutionStatus: blockers.length === 0 ? 'NEW_ARTICLE_EXECUTION_ELIGIBLE' : 'BLOCKED_PENDING_W6A_AUTHORITY_FORMATION',
      nonExecutionReasons: blockers
    };
  });
  const eligible = entries.filter(entry => entry.articleExecutionEligible);
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-ARTICLE-EXECUTION-ELIGIBILITY-v1.0.0',
    work: 'VAP-W6A',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    baselineCommit: VAP_W6A_BASELINE,
    batchCode: VAP_W6A_BATCH_CODE,
    status: eligible.length ? 'PARTIAL_OR_FULL_NEW_ARTICLE_EXECUTION_ELIGIBILITY_ESTABLISHED' : 'AWAITING_EXPLICIT_HUMAN_AND_READINESS_AUTHORITY',
    authority: 'DERIVED_ONLY_NO_HUMAN_DECISION_CREATED',
    summary: {
      selectedNodeCount: entries.length,
      humanArticleApprovedCount: entries.filter(entry => entry.humanProductionDecisionApproved).length,
      humanC2ApprovedCount: entries.filter(entry => entry.humanEditorialC2Approved).length,
      manuscriptMappingVerifiedCount: entries.filter(entry => entry.manuscriptMappingHumanVerified).length,
      c2FrozenCount: entries.filter(entry => entry.c2Frozen).length,
      c3ProductionReadyCount: entries.filter(entry => entry.c3ProductionReady).length,
      productionPlanFrozenCount: entries.filter(entry => entry.productionPlanFrozen).length,
      productionWaveFrozenCount: entries.filter(entry => entry.productionWaveFrozen).length,
      executionAuthorityValidCount: entries.filter(entry => entry.executionAuthorityValid).length,
      newArticleExecutionEligibleCount: eligible.length,
      newArticleExecutionEligibleNodeCodes: eligible.map(entry => entry.nodeCode)
    },
    entries,
    invariants: {
      continueCommandIsHumanApproval: false,
      aiMayCreateHumanDecision: false,
      c2FailureCodePreserved: 'C2_THESIS_BOUNDARY_NOT_FROZEN',
      candidateCreationAllowed: false,
      providerInvocationAllowedByW6a: false,
      publicationAllowed: false
    }
  };
  result.eligibilityDigest = digest(result);
  return result;
}

export function buildVapW6aActivation(root, eligibility = buildVapW6aExecutionEligibility(root)) {
  const human = loadVapW6aHumanAuthority(root);
  const eligibleCount = eligibility.summary.newArticleExecutionEligibleCount;
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-BATCH-ARTICLE-DECISION-C2-C3-WAVE-FREEZE-ACTIVATION-v1.0.0',
    activationCode: 'PHI-OS-VAP-W6A-BATCH-ARTICLE-DECISION-C2-C3-WAVE-FREEZE-ACTIVATION-v1',
    activationVersion: '1.0.0',
    work: 'VAP-W6A',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    baselineCommit: VAP_W6A_BASELINE,
    batchCode: VAP_W6A_BATCH_CODE,
    status: eligibleCount
      ? 'ARTICLE_EXECUTION_FORMATION_ACTIVE'
      : 'AWAITING_EXPLICIT_HUMAN_ARTICLE_AND_C2_DECISIONS',
    reviewReference: VAP_W6A_REVIEW,
    humanDecisionReference: VAP_W6A_DECISIONS,
    executionEligibilityReference: VAP_W6A_ELIGIBILITY,
    currentAuthority: {
      pendingHumanNodeCount: human.pendingNodeCodes.length,
      humanApprovedNodeCount: human.approvedNodeCodes.length,
      humanApprovedNodeCodes: human.approvedNodeCodes,
      newArticleExecutionEligibleCount: eligibleCount,
      newArticleExecutionEligibleNodeCodes: eligibility.summary.newArticleExecutionEligibleNodeCodes
    },
    formationOrder: [
      'HUMAN_ARTICLE_DECISION',
      'HUMAN_C2_CONTENT_AND_MAPPING_APPROVAL',
      'C2_FREEZE',
      'C3_REBUILD',
      'CANONICAL_PRODUCTION_READINESS_PROJECTION',
      'PRODUCTION_PLAN_FREEZE',
      'ARTICLE_WAVE_FREEZE',
      'EXECUTION_ELIGIBILITY',
      'W6_BRIEF_EXPORT'
    ],
    effectsByActivation: {
      humanDecisionCreatedBySystem: false,
      c2FrozenWithoutHumanApproval: false,
      c3PromotedWithoutHumanApproval: false,
      candidateCreated: false,
      providerInvoked: false,
      publicationCreated: false
    },
    nextRequiredAuthority: eligibleCount
      ? 'VAP_W6_BATCH_PRODUCTION_BRIEF_EXPORT'
      : 'EXPLICIT_PER_NODE_HUMAN_PRODUCTION_AND_EDITORIAL_DECISIONS'
  };
  result.activationDigest = digest(result);
  return result;
}

function buildCanonicalReadiness(root, nodeCode, editorialApproval, productionDecision, c2Entry, c3Entry) {
  const registry = readJson(root, NODE_REGISTRY);
  const localizedRegistry = readJson(root, LOCALIZED_REGISTRY);
  const blueprint = readJson(root, BLUEPRINT);
  const questionsRegistry = readJson(root, SUPPORTING_QUESTIONS);
  const node = registry.nodes.find(item => item.nodeCode === nodeCode);
  const blueprintNode = blueprint.nodes.find(item => item.nodeCode === nodeCode);
  const localized = localizedRegistry.localizedContent.find(item => item.nodeCode === nodeCode)?.locales?.['zh-Hans'];
  const part = blueprint.parts.find(item => item.partCode === blueprintNode?.partCode);
  if (!node || !blueprintNode || !localized || !part) throw coded('VAP_W6A_CANONICAL_IDENTITY_MISSING', nodeCode);
  const c2Frozen = readJson(root, c2Entry.record);
  const content = c2Frozen.content;
  const boundaries = content.boundaries;
  const registeredQuestions = questionsRegistry.supportingQuestions.filter(question => (
    (question.canonicalNodeCode || question.primaryNodeCode) === nodeCode ||
    (node.supportingQuestionCodes || []).includes(question.questionCode || question.supportingQuestionCode)
  ));
  const supportingQuestionBoundary = registeredQuestions.map(question => ({
    questionCode: question.questionCode || question.supportingQuestionCode,
    questionText: question.locales?.['zh-Hans']?.displayQuestion || question.questionText || '',
    primaryNodeCode: question.canonicalNodeCode || question.primaryNodeCode || nodeCode,
    relatedNodeCodes: question.relatedNodeCodes || [],
    relationshipType: question.questionType || 'supporting_question',
    coverageRole: question.publicationPolicy || 'embedded_or_search_entry',
    articleTreatment: 'defer',
    searchAliasEligibility: false,
    supportingContentEligibility: true,
    fieldSemantics: {
      primaryNodeCode: 'Canonical ownership only.',
      sourceNodeCode: 'Consolidation origin only; never overrides canonical ownership.'
    }
  }));
  const previousNode = node.relationships?.prerequisiteNodeCodes?.[0] || null;
  const nextNode = node.relationships?.nextNodeCodes?.[0] || null;
  const canonicalThesis = content.canonicalThesis;
  return {
    readinessSchemaVersion: 'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0',
    recordType: 'canonical_production_readiness',
    nodeCode,
    locale: 'zh-Hans',
    canonicalIdentity: {
      nodeCode,
      canonicalQuestionKey: node.canonicalQuestionKey,
      slug: localized.slug,
      localizedTitle: blueprintNode.titleZhHans || localized.displayTitle || localized.displayQuestion,
      localizedQuestion: localized.displayQuestion,
      registryStatus: node.registryStatus,
      blueprintStatus: blueprintNode.status || 'registered'
    },
    hierarchy: {
      bookCode: blueprint.bookCode,
      bookTitle: blueprint.bookTitleZhHans,
      partCode: blueprintNode.partCode,
      partTitle: part.title,
      domainCode: node.domainCode || null,
      themeCode: node.themeCode || null,
      nodeCode,
      nodeType: node.nodeType
    },
    canonicalThesis: {
      thesisVersion: '1.0.0',
      statement: canonicalThesis.statement,
      mechanism: canonicalThesis.mechanism,
      necessity: canonicalThesis.necessity,
      systemRole: canonicalThesis.systemRole,
      continuity: canonicalThesis.continuity
    },
    articleBoundary: boundaries.article,
    supportingQuestionBoundary,
    sequenceBoundary: {
      previousNode,
      nextNode,
      previousNodeContribution: canonicalThesis.continuity?.fromPreviousNode || null,
      currentNodeTransformation: canonicalThesis.systemRole,
      nextNodePreparation: canonicalThesis.continuity?.toNextNode || null,
      partContribution: canonicalThesis.partContribution || null,
      bookContribution: canonicalThesis.bookContribution || null,
      systemContribution: 'Supports governed public Article production without transferring Canonical authority to the generated candidate.'
    },
    claimBoundary: boundaries.claims,
    sourceBoundary: boundaries.sources,
    figureBoundary: boundaries.figures,
    publicContentBoundary: boundaries.publicContent,
    localizationReadiness: {
      localizedTitle: blueprintNode.titleZhHans || localized.displayTitle || localized.displayQuestion,
      localizedQuestion: localized.displayQuestion,
      canonicalThesis: 'production_ready',
      articleBoundary: 'production_ready',
      supportingQuestions: 'production_ready',
      searchAliases: 'production_ready',
      terminologyReview: 'approved',
      languageStatus: 'production_ready'
    },
    productionReadiness: {
      readinessVersion: '1.0.0',
      status: 'production_ready',
      productionPriority: productionDecision.productionPriority || 'P0',
      registryStatus: node.registryStatus,
      blueprintMembership: 'registered',
      exportability: 'exportable',
      missingFields: [],
      blockingFindings: [],
      blockingReasons: []
    },
    contentVersions: {
      canonicalKnowledgeVersion: node.version,
      c2ContentHash: c2Frozen.contentHash,
      c3AssessmentReference: c3Entry.assessmentFile,
      humanDecisionReference: VAP_W6A_DECISIONS
    },
    versionBinding: {
      registryVersion: registry.version || '2.0.0',
      blueprintVersion: blueprint.contract || 'PHI-OS-BOOK-I-KNOWLEDGE-BLUEPRINT-v1.3.0',
      editorialContractVersion: 'PJA-W2A-v1.0.0',
      articleSchemaVersion: 'PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0',
      claimGovernanceVersion: 'PJA-W2C-v1.0.0',
      exporterVersion: 'PJA-W2E-v1.0.0-Frozen'
    },
    review: {
      status: 'approved',
      humanFrozen: true,
      reviewedBy: editorialApproval.humanDecision.actor,
      reviewedAt: editorialApproval.humanDecision.decidedAt,
      blockingFindings: []
    }
  };
}

function buildHumanProductionDecisionEnvelope(derivedDecisions) {
  const first = derivedDecisions[0];
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-HUMAN-PRODUCTION-DECISION-PROJECTION-v1.0.0',
    productionDecisionCode: 'VAP-W6A-BATCH-001-HUMAN-PRODUCTION-DECISION-001',
    productionDecisionVersion: '1.0.0',
    status: derivedDecisions.length === VAP_W6A_NODE_CODES.length ? 'APPROVED_FOR_PRODUCTION' : 'PARTIALLY_APPROVED_FOR_PRODUCTION',
    baselineCommit: VAP_W6A_BASELINE,
    authoritativeDecisionReference: VAP_W6A_DECISIONS,
    actor: first.actor,
    actorRole: 'HUMAN_PRODUCTION_AUTHORITY',
    timestamp: first.timestamp,
    planVersion: '1.0.0',
    entries: derivedDecisions,
    authorityBoundary: {
      humanDecisionIsProductionAuthority: true,
      humanDecisionIsPublicationAuthority: false,
      humanDecisionCreatesCandidate: false,
      humanDecisionInvokesProvider: false
    }
  };
  result.decisionDigest = digest(result);
  return result;
}

function buildPlan(derivedDecisions, envelope) {
  const byNode = new Map(derivedDecisions.map(item => [item.nodeCode, item]));
  const items = VAP_W6A_NODE_CODES.filter(code => byNode.has(code)).map(nodeCode => {
    const item = byNode.get(nodeCode);
    return {
      nodeCode,
      knowledgeVersion: item.knowledgeVersion,
      productionRole: 'ARTICLE',
      productionPriority: item.priority,
      requiredOutputs: ['ARTICLE'],
      dispatchTarget: 'PJA',
      localeRequirements: ['zh-Hans'],
      productionReadiness: 'production_ready',
      planStatus: 'FROZEN',
      newArticleCandidateRequired: true
    };
  });
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-FROZEN-ARTICLE-PRODUCTION-PLAN-v1.0.0',
    planCode: 'VAP-W6A-ARTICLE-PRODUCTION-PLAN-001',
    planVersion: '1.0.0',
    status: 'FROZEN',
    baselineCommit: VAP_W6A_BASELINE,
    humanDecisionReference: VAP_W6A_HUMAN_PRODUCTION_DECISION,
    humanDecisionDigest: envelope.decisionDigest,
    frozenBy: envelope.actor,
    frozenAt: envelope.timestamp,
    eligibleNodes: items.map(item => item.nodeCode),
    productionRoles: Object.fromEntries(items.map(item => [item.nodeCode, 'ARTICLE'])),
    priorityProjection: Object.fromEntries(items.map(item => [item.nodeCode, item.productionPriority])),
    waves: [VAP_W6A_WAVE_CODE],
    handoffTargets: Object.fromEntries(items.map(item => [item.nodeCode, 'PJA'])),
    localeTargets: Object.fromEntries(items.map(item => [item.nodeCode, ['zh-Hans']])),
    items,
    authorityBoundary: {
      waveIsArticleBatch: true,
      mixedRolesAllowed: false,
      mutatesCanonicalKnowledge: false,
      createsCandidate: false,
      providerInvocationAllowed: false,
      publicationAllowed: false
    }
  };
  result.planDigest = digest(result);
  return result;
}

function buildWave(plan, envelope) {
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-FROZEN-ARTICLE-PRODUCTION-WAVE-v1.0.0',
    waveCode: VAP_W6A_WAVE_CODE,
    waveVersion: '1.0.0',
    title: 'PHI OS VAP Article Batch 001 Governed Production Wave',
    status: 'FROZEN',
    baselineCommit: VAP_W6A_BASELINE,
    planReference: VAP_W6A_FROZEN_PLAN,
    planDigest: plan.planDigest,
    humanDecisionReference: VAP_W6A_HUMAN_PRODUCTION_DECISION,
    humanDecisionDigest: envelope.decisionDigest,
    items: plan.items.map(item => ({
      nodeCode: item.nodeCode,
      productionRole: 'ARTICLE',
      priority: item.productionPriority,
      requiredOutputs: ['ARTICLE'],
      dispatchTarget: 'PJA',
      localeRequirement: 'zh-Hans'
    })),
    createdAt: envelope.timestamp,
    updatedAt: envelope.timestamp,
    frozenAt: envelope.timestamp,
    authorityBoundary: {
      waveIsArticleBatch: true,
      mixedRolesAllowed: false,
      maximumMatureWaveSize: 24,
      providerInvocationAllowedByWave: false,
      publicationAllowed: false
    }
  };
  result.waveDigest = digest(result);
  return result;
}

function buildExecutionAuthority(wave, envelope) {
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-ARTICLE-EXECUTION-AUTHORITY-v1.0.0',
    authorityCode: 'VAP-W6A-ARTICLE-BATCH-001-EXECUTION-AUTHORITY-001',
    version: '1.0.0',
    status: 'ACTIVE',
    baselineCommit: VAP_W6A_BASELINE,
    activatedAt: envelope.timestamp,
    planReference: VAP_W6A_FROZEN_PLAN,
    waveReference: VAP_W6A_FROZEN_WAVE,
    humanDecisionReference: VAP_W6A_HUMAN_PRODUCTION_DECISION,
    items: wave.items.map(item => ({ nodeCode: item.nodeCode, productionRole: 'ARTICLE', dispatchTarget: 'PJA' })),
    executionAuthority: {
      owner: 'VAP_W6A_ARTICLE_PRODUCTION_OVERLAY',
      scope: 'GOVERNED_PJA_PRODUCTION_BRIEF_EXPORT_ONLY',
      dispatchAllowed: true,
      pjaBriefGenerationAllowed: true,
      candidateMaterializationAllowed: false,
      providerInvocationAllowedByW6a: false,
      networkCallAllowedByW6a: false,
      publicationAllowed: false
    }
  };
  result.authorityDigest = digest(result);
  return result;
}

export function applyVapW6aFormation(root) {
  const human = loadVapW6aHumanAuthority(root);
  if (!human.approvedNodeCodes.length) throw coded('VAP_W6A_EXPLICIT_HUMAN_DECISIONS_REQUIRED', {
    pendingNodeCodes: human.pendingNodeCodes
  });

  const c2Build = buildC2(root);
  writeFileMap(root, c2Build.files);
  const c3Build = buildProductionReadiness(root);
  writeFileMap(root, c3Build.files);

  const c2Index = readJson(root, C2_INDEX);
  const c3Index = readJson(root, C3_INDEX);
  const derivedDecisions = [];
  for (const nodeCode of human.approvedNodeCodes) {
    const c2Entry = c2Index.entries.find(entry => entry.nodeCode === nodeCode);
    const c3Entry = c3Index.entries.find(entry => entry.nodeCode === nodeCode);
    if (!c2Entry || c2Entry.status !== 'frozen') throw coded('VAP_W6A_C2_FREEZE_NOT_FORMED', nodeCode);
    if (!c3Entry || c3Entry.productionReady !== true || c3Entry.status !== 'production_ready') throw coded('VAP_W6A_C3_PRODUCTION_READINESS_NOT_FORMED', nodeCode);
    const editorialApproval = human.approvedEditorialByNode.get(nodeCode);
    const productionDecision = human.approvedProductionByNode.get(nodeCode);
    const readiness = buildCanonicalReadiness(root, nodeCode, editorialApproval, productionDecision, c2Entry, c3Entry);
    atomicWriteJson(root, canonicalReadinessPath(nodeCode), readiness);
    const derived = buildDerivedDecisionForRoot(root, nodeCode, productionDecision, c2Entry, c3Entry);
    atomicWriteJson(root, decisionPath(nodeCode), derived);
    derivedDecisions.push(derived);
  }

  const envelope = buildHumanProductionDecisionEnvelope(derivedDecisions);
  atomicWriteJson(root, VAP_W6A_HUMAN_PRODUCTION_DECISION, envelope);
  const plan = buildPlan(derivedDecisions, envelope);
  atomicWriteJson(root, VAP_W6A_FROZEN_PLAN, plan);
  const wave = buildWave(plan, envelope);
  atomicWriteJson(root, VAP_W6A_FROZEN_WAVE, wave);
  const executionAuthority = buildExecutionAuthority(wave, envelope);
  atomicWriteJson(root, VAP_W6A_EXECUTION_AUTHORITY, executionAuthority);

  const eligibility = buildVapW6aExecutionEligibility(root);
  atomicWriteJson(root, VAP_W6A_ELIGIBILITY, eligibility);
  const activation = buildVapW6aActivation(root, eligibility);
  atomicWriteJson(root, VAP_W6A_ACTIVATION, activation);
  return { human, c2Build, c3Build, derivedDecisions, envelope, plan, wave, executionAuthority, eligibility, activation };
}

function buildDerivedDecisionForRoot(root, nodeCode, productionDecision, c2Entry, c3Entry) {
  const c2Frozen = readJson(root, c2Entry.record);
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6A-KPP-HUMAN-PRODUCTION-DECISION-PROJECTION-v1.0.0',
    productionDecisionCode: `VAP-W6A-${nodeCode}-PRODUCTION-DECISION-001`,
    productionDecisionVersion: '1.0.0',
    nodeCode,
    knowledgeVersion: productionDecision.knowledgeVersion || '1.0.0',
    decision: 'approve_for_production',
    productionRole: 'ARTICLE',
    requiredOutputs: ['ARTICLE'],
    dispatchTarget: 'PJA',
    priority: 'P0',
    waveCode: VAP_W6A_WAVE_CODE,
    reason: productionDecision.rationale,
    actor: productionDecision.actor,
    actorRole: 'HUMAN_PRODUCTION_AUTHORITY',
    timestamp: productionDecision.decidedAt,
    planVersion: '1.0.0',
    c2ContentHash: c2Frozen.contentHash,
    c3AssessmentReference: c3Entry.assessmentFile,
    authoritySource: VAP_W6A_DECISIONS,
    sourceDecisionCode: productionDecision.decisionCode
  };
  result.decisionDigest = digest(result);
  return result;
}

export function writeVapW6aPendingProjection(root) {
  const eligibility = buildVapW6aExecutionEligibility(root);
  atomicWriteJson(root, VAP_W6A_ELIGIBILITY, eligibility);
  const activation = buildVapW6aActivation(root, eligibility);
  atomicWriteJson(root, VAP_W6A_ACTIVATION, activation);
  return { eligibility, activation };
}

export function removeVapW6aExecutionArtifacts(root) {
  for (const relative of [VAP_W6A_HUMAN_PRODUCTION_DECISION, VAP_W6A_FROZEN_PLAN, VAP_W6A_FROZEN_WAVE, VAP_W6A_EXECUTION_AUTHORITY]) {
    const absolute = path.join(root, relative);
    if (fs.existsSync(absolute)) fs.rmSync(absolute, { force: true });
  }
}
