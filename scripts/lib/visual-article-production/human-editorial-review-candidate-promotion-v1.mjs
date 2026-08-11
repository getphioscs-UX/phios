import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  buildHumanReview,
  validateHumanReview,
  buildReviewRegistryRecord
} from '../knowledge-production/human-review-v1.mjs';
import { serialize, digest } from '../knowledge-production/canonical-brief-v2.mjs';

export const VAP_W9_SCHEMA_VERSION = 'PHI-OS-VAP-W9-HUMAN-EDITORIAL-REVIEW-CANDIDATE-PROMOTION-v1.0.0';
export const VAP_W9_BATCH_CODE = 'VAP-ARTICLE-BATCH-001';
export const VAP_W9_LOCALE = 'zh-Hans';
export const VAP_W9_EXPECTED_NODE_CODES = Object.freeze([
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
]);
export const VAP_W9_ALLOWED_DECISIONS = Object.freeze(['accept', 'changes_required', 'reject', 'defer']);

export const VAP_W9_PATHS = Object.freeze({
  w8Activation: 'content/production/visual-article/activation/vap-w8-candidate-validation-pja-import-v1.json',
  w8Validation: 'content/production/visual-article/validation/vap-article-batch-001-candidate-validation-v1.json',
  w8Import: 'content/production/visual-article/import/vap-article-batch-001-pja-import-v1.json',
  w6aReview: 'content/production/visual-article/review/vap-w6a-batch-001-human-review-v1.json',
  decisions: 'content/production/visual-article/decisions/vap-w9-batch-001-human-editorial-decisions-v1.json',
  reviewQueue: 'content/production/visual-article/review/vap-w9-batch-001-human-editorial-review-v1.json',
  promotionManifest: 'content/production/visual-article/promotion/vap-article-batch-001-candidate-promotion-v1.json',
  activation: 'content/production/visual-article/activation/vap-w9-human-editorial-review-candidate-promotion-v1.json',
  pjaReviewRegistry: 'content/knowledge/production/registry/review-registry.json',
  pjaCandidateRegistry: 'content/knowledge/production/registry/candidate-registry.json',
  pjaApprovalRegistry: 'content/knowledge/production/registry/approval-registry.json',
  pjaPublicationRegistry: 'content/knowledge/production/registry/publication-registry.json'
});

const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = async (root, rel) => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const exists = file => fs.access(file).then(() => true, () => false);
const shaFile = async file => digest(await fs.readFile(file));

function recommendationFor(nodeCode) {
  const map = {
    'KN-B1-P1-006': {
      recommendation: 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION',
      summary: '正文清楚区分位置、方向与坐标，明确坐标不等同 GPS，也明确导航不保证唯一正确路径；结尾自然进入分辨率问题。',
      focus: ['确认“结构分辨率 ≠ 导航本身”的语义边界保持清楚。']
    },
    'KN-B1-P2-001': {
      recommendation: 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION',
      summary: '正文明确建立 Reality 与 World Projection 的差异，并直接说明 Projection ≠ Illusion、Selection ≠ Fabrication；没有把 PHI OS 投影等同于外部理论。',
      focus: ['W8 对英文 distinction 标签的字面覆盖为 0；Human Review 应按中文语义确认，而不是要求正文出现英文标签。']
    },
    'KN-B1-P2-009': {
      recommendation: 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION',
      summary: '正文分别解释偏向、失真、稳定与更新，明确 Bias 不自动等于 Error、Stability 不等于 Accuracy、Update 不保证更优，并避免个人心理推断。',
      focus: ['Human Review 确认“更新 ≠ 完整替换”与“失真 ≠ 道德失败”已以中文语义充分表达。']
    },
    'KN-B1-P3-005': {
      recommendation: 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION',
      summary: '正文把问题定义为开放现实的结构化压缩，明确有限问题不等于简单问题，也反复保留盲区与未覆盖现实，没有把分类写成唯一自然结构。',
      focus: ['Human Review 确认 Operational Boundary 与 Reality Boundary 的区分足够明确。']
    },
    'KN-B1-P3-015': {
      recommendation: 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION',
      summary: '正文以分布式网络解释状态、反馈、重组与连续性，明确反馈不保证稳定、重组不要求归零、连续性不等于不变。',
      focus: ['Human Review 确认“关键关系与约束被维持”没有被读成固定结构必须永久保留。']
    },
    'KN-B1-P4-006': {
      recommendation: 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION',
      summary: '正文完整建立成本、恢复与内部连接的动态稳定关系，并明确 Runtime Cost 不是道德评价；医学诊断与个人健康建议边界被显式保留。',
      focus: ['Human Review 特别确认一般 Runtime 模型没有被写成具体生理机制或医疗建议。']
    }
  };
  return map[nodeCode] ?? { recommendation: 'HUMAN_REVIEW_REQUIRED', summary: 'Human semantic review required.', focus: [] };
}

function validationEntryByNode(validation, nodeCode) {
  const entries = validation.entries ?? validation.results ?? [];
  return entries.find(item => item.nodeCode === nodeCode);
}

function c2EntryByNode(c2Review, nodeCode) {
  return (c2Review.entries ?? []).find(item => item.nodeCode === nodeCode);
}

export async function buildVapW9ReviewQueue(root) {
  const [w8Activation, w8Validation, w8Import, c2Review] = await Promise.all([
    readJson(root, VAP_W9_PATHS.w8Activation),
    readJson(root, VAP_W9_PATHS.w8Validation),
    readJson(root, VAP_W9_PATHS.w8Import),
    readJson(root, VAP_W9_PATHS.w6aReview)
  ]);
  if (w8Activation.pjaImportedCount !== VAP_W9_EXPECTED_NODE_CODES.length) throw fail('VAP_W9_W8_IMPORT_COUNT_INVALID', String(w8Activation.pjaImportedCount));
  if (w8Activation.humanEditorialReviewCount !== 0) throw fail('VAP_W9_UPSTREAM_REVIEW_ALREADY_RECORDED', String(w8Activation.humanEditorialReviewCount));
  if (w8Import.importedOrEquivalentCount !== VAP_W9_EXPECTED_NODE_CODES.length) throw fail('VAP_W9_IMPORT_MANIFEST_INCOMPLETE', String(w8Import.importedOrEquivalentCount));

  const entries = [];
  for (const nodeCode of VAP_W9_EXPECTED_NODE_CODES) {
    const candidatePath = `content/knowledge/production/candidates/${VAP_W9_LOCALE}/${nodeCode}/candidate.v1.json`;
    const candidate = await readJson(root, candidatePath);
    const v = validationEntryByNode(w8Validation, nodeCode);
    const c2 = c2EntryByNode(c2Review, nodeCode);
    if (!v || v.importEligible !== true || v.pjaCandidate?.schemaValidationPassed !== true) throw fail('VAP_W9_W8_VALIDATION_REQUIRED', nodeCode);
    if (!c2) throw fail('VAP_W9_C2_REVIEW_CONTEXT_MISSING', nodeCode);
    if (candidate.candidateState !== 'ready_for_human_review') throw fail('VAP_W9_CANDIDATE_NOT_REVIEW_READY', `${nodeCode}:${candidate.candidateState}`);
    if (candidate.candidateDigest !== v.pjaCandidate?.candidateDigest) throw fail('VAP_W9_CANDIDATE_DIGEST_DRIFT', nodeCode);
    const rec = recommendationFor(nodeCode);
    entries.push({
      reviewIndex: entries.length + 1,
      nodeCode,
      locale: VAP_W9_LOCALE,
      candidate: {
        candidateCode: candidate.candidateCode,
        candidateDigest: candidate.candidateDigest,
        path: candidatePath,
        title: candidate.article.title,
        summary: candidate.article.summary,
        sectionHeadings: candidate.article.sectionHeadings,
        bodyCharacters: candidate.article.bodyMarkdown.length
      },
      controllingC2: {
        proposalContentHash: c2.proposalContentHash,
        requiredDistinctions: c2.proposedContent?.boundaries?.article?.requiredDistinctions ?? [],
        mustNotClaim: c2.proposedContent?.boundaries?.article?.mustNotClaim ?? [],
        continuity: c2.proposedContent?.canonicalThesis?.continuity ?? null
      },
      automatedValidation: {
        thesisCoverage: v.automatedValidation?.thesisCoverage ?? null,
        mustEstablishCoverage: v.automatedValidation?.mustEstablishCoverage ?? [],
        requiredDistinctionCoverage: v.automatedValidation?.requiredDistinctionCoverage ?? [],
        externalFactIndicators: v.automatedValidation?.externalFactIndicators ?? [],
        factualTruthValidated: false,
        sourceTruthValidated: false,
        semanticHumanReviewStillRequired: true
      },
      aiEditorialRecommendation: {
        authority: 'AI_EDITORIAL_RECOMMENDATION_ONLY_NOT_HUMAN_REVIEW',
        recommendation: rec.recommendation,
        summary: rec.summary,
        reviewFocus: rec.focus
      },
      humanReviewDimensions: [
        'canonical_meaning',
        'boundary',
        'structure',
        'terminology',
        'evidence',
        'continuity',
        'language'
      ],
      humanDecisionState: 'pending_human',
      promotionState: 'not_promoted_pending_human_review'
    });
  }

  const payload = {
    schemaVersion: 'PHI-OS-VAP-W9-BATCH-HUMAN-EDITORIAL-REVIEW-v1.0.0',
    reviewQueueCode: 'PHI-OS-VAP-W9-BATCH-001-HUMAN-EDITORIAL-REVIEW-v1',
    work: 'VAP-W9',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    batchCode: VAP_W9_BATCH_CODE,
    locale: VAP_W9_LOCALE,
    status: 'AWAITING_EXPLICIT_HUMAN_EDITORIAL_DECISIONS',
    proposalAuthority: 'AI_EDITORIAL_RECOMMENDATION_ONLY_NOT_HUMAN_REVIEW',
    humanAuthorityRequired: true,
    oneIndependentDecisionPerNode: true,
    bulkEnvelopeIsNotBulkReviewDecision: true,
    reviewRuntime: 'PJA-HUMAN-REVIEW-W1',
    candidatePromotionMeaning: 'accepted_human_review_handoff_to_pja_approval_eligibility',
    candidatePromotionIsApproval: false,
    candidatePromotionIsPublication: false,
    candidateRegistryMutationAllowedByW9: false,
    entries
  };
  return { ...payload, reviewQueueDigest: `sha256:${digest(payload)}` };
}

export function buildPendingDecisionEnvelope(reviewQueue) {
  return {
    schemaVersion: 'PHI-OS-VAP-W9-HUMAN-EDITORIAL-DECISIONS-v1.0.0',
    decisionEnvelopeCode: 'PHI-OS-VAP-W9-BATCH-001-HUMAN-EDITORIAL-DECISIONS-v1',
    work: 'VAP-W9',
    batchCode: VAP_W9_BATCH_CODE,
    locale: VAP_W9_LOCALE,
    status: 'PENDING_HUMAN',
    reviewQueueDigest: reviewQueue.reviewQueueDigest,
    bulkApprovalAllowed: false,
    oneIndependentDecisionPerNode: true,
    entries: reviewQueue.entries.map(item => ({
      decisionCode: `VAP-W9-${item.nodeCode}-HUMAN-EDITORIAL-DECISION-001`,
      nodeCode: item.nodeCode,
      candidateCode: item.candidate.candidateCode,
      candidateDigest: item.candidate.candidateDigest,
      decisionState: 'pending_human',
      decision: null,
      reviewerCode: null,
      reviewerAuthority: null,
      editorialActorRole: null,
      reviewedAt: null,
      summary: null,
      findings: []
    }))
  };
}

export function validateDecisionEnvelope(envelope, reviewQueue, { requireAllDecided = false } = {}) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  if (envelope?.schemaVersion !== 'PHI-OS-VAP-W9-HUMAN-EDITORIAL-DECISIONS-v1.0.0') add('VAP_W9_DECISION_SCHEMA_INVALID', String(envelope?.schemaVersion));
  if (envelope?.batchCode !== VAP_W9_BATCH_CODE) add('VAP_W9_DECISION_BATCH_INVALID', String(envelope?.batchCode));
  if (envelope?.locale !== VAP_W9_LOCALE) add('VAP_W9_DECISION_LOCALE_INVALID', String(envelope?.locale));
  if (envelope?.reviewQueueDigest !== reviewQueue.reviewQueueDigest) add('VAP_W9_REVIEW_QUEUE_DIGEST_DRIFT', String(envelope?.reviewQueueDigest));
  if (envelope?.bulkApprovalAllowed !== false || envelope?.oneIndependentDecisionPerNode !== true) add('VAP_W9_BULK_REVIEW_FORBIDDEN', 'Each node requires one independent Human Editorial decision.');
  if (!Array.isArray(envelope?.entries) || envelope.entries.length !== VAP_W9_EXPECTED_NODE_CODES.length) add('VAP_W9_DECISION_COUNT_INVALID', String(envelope?.entries?.length));
  const byNode = new Map((envelope?.entries ?? []).map(entry => [entry.nodeCode, entry]));
  for (const queueEntry of reviewQueue.entries) {
    const entry = byNode.get(queueEntry.nodeCode);
    if (!entry) { add('VAP_W9_DECISION_MISSING', queueEntry.nodeCode); continue; }
    if (entry.candidateCode !== queueEntry.candidate.candidateCode || entry.candidateDigest !== queueEntry.candidate.candidateDigest) add('VAP_W9_DECISION_CANDIDATE_BINDING_INVALID', queueEntry.nodeCode);
    if (entry.decisionState === 'pending_human') {
      if (requireAllDecided) add('VAP_W9_EXPLICIT_HUMAN_REVIEW_REQUIRED', queueEntry.nodeCode);
      continue;
    }
    if (entry.decisionState !== 'human_decided') { add('VAP_W9_DECISION_STATE_INVALID', `${queueEntry.nodeCode}:${entry.decisionState}`); continue; }
    if (!VAP_W9_ALLOWED_DECISIONS.includes(entry.decision)) add('VAP_W9_DECISION_INVALID', `${queueEntry.nodeCode}:${entry.decision}`);
    if (entry.reviewerCode !== 'TL' || entry.reviewerAuthority !== 'TL Human Review Authority' || entry.editorialActorRole !== 'HUMAN_EDITORIAL_AUTHORITY') add('VAP_W9_HUMAN_REVIEWER_AUTHORITY_INVALID', queueEntry.nodeCode);
    if (!entry.reviewedAt || Number.isNaN(Date.parse(entry.reviewedAt))) add('VAP_W9_REVIEWED_AT_INVALID', queueEntry.nodeCode);
    if (typeof entry.summary !== 'string' || !entry.summary.trim()) add('VAP_W9_REVIEW_SUMMARY_REQUIRED', queueEntry.nodeCode);
    if (!Array.isArray(entry.findings)) add('VAP_W9_REVIEW_FINDINGS_INVALID', queueEntry.nodeCode);
    if (['changes_required', 'reject'].includes(entry.decision) && (!Array.isArray(entry.findings) || entry.findings.length === 0)) add('VAP_W9_REVIEW_FINDING_REQUIRED', queueEntry.nodeCode);
  }
  return { valid: errors.length === 0, errors };
}

function buildPromotionRecord(review) {
  return {
    schemaVersion: 'PHI-OS-VAP-W9-CANDIDATE-PROMOTION-v1.0.0',
    promotionCode: `VAP-W9-PROMOTION-${review.candidate.candidateCode}-V1`,
    work: 'VAP-W9',
    batchCode: VAP_W9_BATCH_CODE,
    nodeCode: review.candidate.nodeCode,
    locale: review.candidate.locale,
    candidateCode: review.candidate.candidateCode,
    candidateDigest: review.candidate.candidateDigest,
    reviewCode: review.reviewCode,
    reviewDigest: review.reviewDigest,
    reviewDecision: review.decision,
    promotionState: 'promoted_to_pja_approval_eligibility',
    nextAuthority: 'PJA Human Approval Runtime',
    candidateContentMutated: false,
    candidateRegistryMutated: false,
    candidateAcceptanceIsApproval: false,
    approvalRecorded: false,
    publicationRecorded: false,
    authority: false,
    promotedAt: review.reviewedAt
  };
}

async function atomicWrite(target, text) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await fs.writeFile(temp, text, { flag: 'wx' });
  await fs.rename(temp, target);
}

async function writeIdempotentJson(target, value, conflictCode) {
  const text = serialize(value);
  if (await exists(target)) {
    const current = await fs.readFile(target, 'utf8');
    if (current !== text) throw fail(conflictCode, target);
    return { applied: false, state: 'existing_byte_equivalent' };
  }
  await atomicWrite(target, text);
  return { applied: true, state: 'created' };
}

export async function applyVapW9(root, decisionEnvelope, { apply = false, targetRoot = root } = {}) {
  const reviewQueue = await buildVapW9ReviewQueue(root);
  const envelopeValidation = validateDecisionEnvelope(decisionEnvelope, reviewQueue, { requireAllDecided: true });
  if (!envelopeValidation.valid) throw fail('VAP_W9_HUMAN_DECISIONS_INVALID', JSON.stringify(envelopeValidation.errors));

  const [originalCandidateRegistry, originalApprovalRegistry, originalPublicationRegistry, reviewRegistry] = await Promise.all([
    readJson(root, VAP_W9_PATHS.pjaCandidateRegistry),
    readJson(root, VAP_W9_PATHS.pjaApprovalRegistry),
    readJson(root, VAP_W9_PATHS.pjaPublicationRegistry),
    readJson(targetRoot, VAP_W9_PATHS.pjaReviewRegistry)
  ]);
  const reviewRecords = [...reviewRegistry.records];
  const outcomes = [];
  const promotionRecords = [];

  for (const queueEntry of reviewQueue.entries) {
    const decision = decisionEnvelope.entries.find(entry => entry.nodeCode === queueEntry.nodeCode);
    const candidate = await readJson(root, queueEntry.candidate.path);
    const review = await buildHumanReview(root, {
      candidate,
      reviewerCode: decision.reviewerCode,
      decision: decision.decision,
      summary: decision.summary,
      findings: decision.findings,
      reviewedAt: decision.reviewedAt
    });
    const valid = validateHumanReview(review, candidate);
    if (!valid.valid) throw fail('VAP_W9_PJA_REVIEW_INVALID', `${queueEntry.nodeCode}:${JSON.stringify(valid.errors)}`);
    const record = buildReviewRegistryRecord(review);
    const existing = reviewRecords.find(item => item.reviewCode === record.reviewCode);
    if (existing && serialize(existing) !== serialize(record)) throw fail('VAP_W9_REVIEW_REGISTRY_CONFLICT', record.reviewCode);
    if (!existing) reviewRecords.push(record);
    const promotion = review.decision === 'accept' ? buildPromotionRecord(review) : null;
    if (promotion) promotionRecords.push(promotion);
    outcomes.push({
      nodeCode: queueEntry.nodeCode,
      candidateCode: candidate.candidateCode,
      candidateDigest: candidate.candidateDigest,
      reviewCode: review.reviewCode,
      reviewDigest: review.reviewDigest,
      reviewDecision: review.decision,
      reviewPackagePath: `content/knowledge/production/reviews/${VAP_W9_LOCALE}/${queueEntry.nodeCode}/review.v1.json`,
      promotionEligible: review.decision === 'accept',
      promotionCode: promotion?.promotionCode ?? null,
      promotionState: promotion?.promotionState ?? `not_promoted_review_${review.decision}`,
      approvalRecorded: false,
      publicationRecorded: false
    });
  }

  const promotionManifest = {
    schemaVersion: 'PHI-OS-VAP-W9-CANDIDATE-PROMOTION-MANIFEST-v1.0.0',
    work: 'VAP-W9',
    batchCode: VAP_W9_BATCH_CODE,
    locale: VAP_W9_LOCALE,
    status: promotionRecords.length === VAP_W9_EXPECTED_NODE_CODES.length ? 'ALL_ACCEPTED_CANDIDATES_PROMOTED_TO_PJA_APPROVAL_ELIGIBILITY' : 'HUMAN_REVIEW_COMPLETE_WITH_NON_ACCEPT_OUTCOMES',
    reviewedCount: outcomes.length,
    acceptedCount: outcomes.filter(x => x.reviewDecision === 'accept').length,
    changesRequiredCount: outcomes.filter(x => x.reviewDecision === 'changes_required').length,
    rejectedCount: outcomes.filter(x => x.reviewDecision === 'reject').length,
    deferredCount: outcomes.filter(x => x.reviewDecision === 'defer').length,
    promotedCount: promotionRecords.length,
    candidateRegistryMutated: false,
    approvalRecorded: false,
    publicationRecorded: false,
    promotionMeaning: 'accepted_human_review_handoff_to_pja_approval_eligibility',
    entries: outcomes
  };
  const activation = {
    schemaVersion: 'PHI-OS-VAP-W9-ACTIVATION-v1.0.0',
    work: 'VAP-W9',
    batchCode: VAP_W9_BATCH_CODE,
    locale: VAP_W9_LOCALE,
    status: promotionManifest.status,
    humanEditorialReviewCount: outcomes.length,
    humanAcceptedCount: promotionManifest.acceptedCount,
    candidatePromotionCount: promotionRecords.length,
    approvalCount: 0,
    publicationCount: 0,
    candidateContentMutated: false,
    pjaCandidateRegistryMutated: false,
    pjaReviewRegistryMutated: apply,
    nextAuthority: promotionRecords.length ? 'PJA Human Approval Runtime' : 'Human editorial rework / deferred resolution',
    nextWork: 'PJA_HUMAN_APPROVAL_OR_VAP_SUCCESSOR_APPROVAL_STAGE'
  };

  if (!apply) return { mode: 'dry-run', applied: false, reviewQueue, outcomes, promotionManifest, activation };

  // Preflight all target conflicts before mutating any review/promotion files.
  const nextReviewRegistry = { ...reviewRegistry, records: reviewRecords.sort((a, b) => a.reviewCode.localeCompare(b.reviewCode)) };
  const reviewRegistryTarget = path.join(targetRoot, VAP_W9_PATHS.pjaReviewRegistry);
  if (await exists(reviewRegistryTarget)) {
    // Registry itself is expected to exist; conflict checks are record-level above.
  }
  for (const outcome of outcomes) {
    const review = await buildHumanReview(root, {
      candidate: await readJson(root, `content/knowledge/production/candidates/${VAP_W9_LOCALE}/${outcome.nodeCode}/candidate.v1.json`),
      reviewerCode: decisionEnvelope.entries.find(x => x.nodeCode === outcome.nodeCode).reviewerCode,
      decision: outcome.reviewDecision,
      summary: decisionEnvelope.entries.find(x => x.nodeCode === outcome.nodeCode).summary,
      findings: decisionEnvelope.entries.find(x => x.nodeCode === outcome.nodeCode).findings,
      reviewedAt: decisionEnvelope.entries.find(x => x.nodeCode === outcome.nodeCode).reviewedAt
    });
    const target = path.join(targetRoot, outcome.reviewPackagePath);
    if (await exists(target) && (await fs.readFile(target, 'utf8')) !== serialize(review)) throw fail('VAP_W9_REVIEW_PACKAGE_CONFLICT', outcome.nodeCode);
  }
  for (const promotion of promotionRecords) {
    const rel = `content/production/visual-article/promotion/${VAP_W9_LOCALE}/${promotion.nodeCode}/promotion.v1.json`;
    const target = path.join(targetRoot, rel);
    if (await exists(target) && (await fs.readFile(target, 'utf8')) !== serialize(promotion)) throw fail('VAP_W9_PROMOTION_PACKAGE_CONFLICT', promotion.nodeCode);
  }

  // Apply idempotently after successful preflight.
  for (const outcome of outcomes) {
    const decision = decisionEnvelope.entries.find(x => x.nodeCode === outcome.nodeCode);
    const candidate = await readJson(root, `content/knowledge/production/candidates/${VAP_W9_LOCALE}/${outcome.nodeCode}/candidate.v1.json`);
    const review = await buildHumanReview(root, { candidate, reviewerCode: decision.reviewerCode, decision: decision.decision, summary: decision.summary, findings: decision.findings, reviewedAt: decision.reviewedAt });
    await writeIdempotentJson(path.join(targetRoot, outcome.reviewPackagePath), review, 'VAP_W9_REVIEW_PACKAGE_CONFLICT');
  }
  await atomicWrite(reviewRegistryTarget, serialize(nextReviewRegistry));
  for (const promotion of promotionRecords) {
    const rel = `content/production/visual-article/promotion/${VAP_W9_LOCALE}/${promotion.nodeCode}/promotion.v1.json`;
    await writeIdempotentJson(path.join(targetRoot, rel), promotion, 'VAP_W9_PROMOTION_PACKAGE_CONFLICT');
  }
  await atomicWrite(path.join(targetRoot, VAP_W9_PATHS.promotionManifest), serialize(promotionManifest));
  await atomicWrite(path.join(targetRoot, VAP_W9_PATHS.activation), serialize(activation));

  // Assert W9 did not mutate the independent frozen Candidate/Approval/Publication registries.
  const [candidateRegistryAfter, approvalRegistryAfter, publicationRegistryAfter] = await Promise.all([
    readJson(root, VAP_W9_PATHS.pjaCandidateRegistry),
    readJson(root, VAP_W9_PATHS.pjaApprovalRegistry),
    readJson(root, VAP_W9_PATHS.pjaPublicationRegistry)
  ]);
  if (serialize(candidateRegistryAfter) !== serialize(originalCandidateRegistry)) throw fail('VAP_W9_CANDIDATE_REGISTRY_MUTATION_FORBIDDEN', 'candidate-registry.json');
  if (serialize(approvalRegistryAfter) !== serialize(originalApprovalRegistry)) throw fail('VAP_W9_APPROVAL_REGISTRY_MUTATION_FORBIDDEN', 'approval-registry.json');
  if (serialize(publicationRegistryAfter) !== serialize(originalPublicationRegistry)) throw fail('VAP_W9_PUBLICATION_REGISTRY_MUTATION_FORBIDDEN', 'publication-registry.json');

  return { mode: 'apply', applied: true, outcomes, promotionManifest, activation };
}

export async function buildPendingVapW9Projection(root) {
  const reviewQueue = await buildVapW9ReviewQueue(root);
  let decisions;
  const decisionPath = path.join(root, VAP_W9_PATHS.decisions);
  if (await exists(decisionPath)) decisions = await readJson(root, VAP_W9_PATHS.decisions);
  else decisions = buildPendingDecisionEnvelope(reviewQueue);
  const validation = validateDecisionEnvelope(decisions, reviewQueue, { requireAllDecided: false });
  if (!validation.valid) throw fail('VAP_W9_PENDING_DECISIONS_INVALID', JSON.stringify(validation.errors));
  const decided = decisions.entries.filter(x => x.decisionState === 'human_decided');
  const accepted = decided.filter(x => x.decision === 'accept');
  const promotionManifest = {
    schemaVersion: 'PHI-OS-VAP-W9-CANDIDATE-PROMOTION-MANIFEST-v1.0.0',
    work: 'VAP-W9', batchCode: VAP_W9_BATCH_CODE, locale: VAP_W9_LOCALE,
    status: decided.length ? 'HUMAN_DECISIONS_PRESENT_APPLY_REQUIRED' : 'AWAITING_HUMAN_EDITORIAL_REVIEW',
    reviewedCount: 0,
    acceptedCount: 0,
    changesRequiredCount: 0,
    rejectedCount: 0,
    deferredCount: 0,
    promotedCount: 0,
    candidateRegistryMutated: false,
    approvalRecorded: false,
    publicationRecorded: false,
    promotionMeaning: 'accepted_human_review_handoff_to_pja_approval_eligibility',
    entries: reviewQueue.entries.map(x => ({ nodeCode: x.nodeCode, candidateCode: x.candidate.candidateCode, candidateDigest: x.candidate.candidateDigest, reviewDecision: null, promotionEligible: false, promotionState: 'not_promoted_pending_human_review' }))
  };
  const activation = {
    schemaVersion: 'PHI-OS-VAP-W9-ACTIVATION-v1.0.0', work: 'VAP-W9', batchCode: VAP_W9_BATCH_CODE, locale: VAP_W9_LOCALE,
    status: decided.length ? 'HUMAN_DECISIONS_PRESENT_APPLY_REQUIRED' : 'AWAITING_EXPLICIT_HUMAN_EDITORIAL_DECISIONS',
    candidateCount: VAP_W9_EXPECTED_NODE_CODES.length,
    humanDecisionRecordedCount: decided.length,
    humanEditorialReviewCount: 0,
    humanAcceptedCount: 0,
    candidatePromotionCount: 0,
    approvalCount: 0,
    publicationCount: 0,
    candidateContentMutated: false,
    pjaCandidateRegistryMutated: false,
    pjaReviewRegistryMutated: false,
    acceptedDecisionInputsPresent: accepted.length,
    nextAuthority: 'TL Human Review Authority',
    nextWork: 'VAP-W9_EXPLICIT_HUMAN_EDITORIAL_DECISIONS'
  };
  return { reviewQueue, decisions, promotionManifest, activation };
}

export async function writePendingVapW9Projection(root, { apply = false } = {}) {
  const built = await buildPendingVapW9Projection(root);
  if (!apply) return { mode: 'dry-run', applied: false, ...built };
  await atomicWrite(path.join(root, VAP_W9_PATHS.reviewQueue), serialize(built.reviewQueue));
  if (!(await exists(path.join(root, VAP_W9_PATHS.decisions)))) await atomicWrite(path.join(root, VAP_W9_PATHS.decisions), serialize(built.decisions));
  await atomicWrite(path.join(root, VAP_W9_PATHS.promotionManifest), serialize(built.promotionManifest));
  await atomicWrite(path.join(root, VAP_W9_PATHS.activation), serialize(built.activation));
  return { mode: 'apply', applied: true, ...built };
}

export async function snapshotAuthorityDigests(root) {
  const result = {};
  for (const rel of [VAP_W9_PATHS.pjaCandidateRegistry, VAP_W9_PATHS.pjaApprovalRegistry, VAP_W9_PATHS.pjaPublicationRegistry]) result[rel] = await shaFile(path.join(root, rel));
  return result;
}
