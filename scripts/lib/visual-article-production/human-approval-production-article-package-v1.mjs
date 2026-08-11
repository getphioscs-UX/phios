import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  buildHumanApproval,
  validateHumanApproval,
  buildApprovalRegistryRecord
} from '../knowledge-production/human-approval-v1.mjs';
import {
  ARTICLE_PACKAGE_CONTRACT_V2,
  validateArticlePackageBinding
} from '../knowledge-production/article-package-v2.mjs';
import { serialize, digest } from '../knowledge-production/canonical-brief-v2.mjs';

export const VAP_W10_SCHEMA_VERSION = 'PHI-OS-VAP-W10-HUMAN-APPROVAL-PRODUCTION-ARTICLE-PACKAGE-v1.0.0';
export const VAP_W10_BATCH_CODE = 'VAP-ARTICLE-BATCH-001';
export const VAP_W10_LOCALE = 'zh-Hans';
export const VAP_W10_EXPECTED_NODE_CODES = Object.freeze([
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
]);
export const VAP_W10_ALLOWED_DECISIONS = Object.freeze(['approve', 'decline', 'defer']);

export const VAP_W10_PATHS = Object.freeze({
  w9Activation: 'content/production/visual-article/activation/vap-w9-human-editorial-review-candidate-promotion-v1.json',
  w9PromotionManifest: 'content/production/visual-article/promotion/vap-article-batch-001-candidate-promotion-v1.json',
  approvalQueue: 'content/production/visual-article/approval/vap-w10-batch-001-human-approval-queue-v1.json',
  decisions: 'content/production/visual-article/decisions/vap-w10-batch-001-human-approval-decisions-v1.json',
  packageManifest: 'content/production/visual-article/packages/vap-article-batch-001-production-article-package-manifest-v1.json',
  activation: 'content/production/visual-article/activation/vap-w10-human-approval-production-article-package-v1.json',
  pjaReviewRegistry: 'content/knowledge/production/registry/review-registry.json',
  pjaApprovalRegistry: 'content/knowledge/production/registry/approval-registry.json',
  pjaPublicationRegistry: 'content/knowledge/production/registry/publication-registry.json',
  nodeRegistry: 'content/knowledge/registry/nodes.json',
  blueprintRegistry: 'content/knowledge/blueprints/blueprint-registry.json'
});

const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = async (root, rel) => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const exists = file => fs.access(file).then(() => true, () => false);
const shaBytes = bytes => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
const packageRoot = nodeCode => `content/production/visual-article/packages/${VAP_W10_LOCALE}/${nodeCode}`;
const approvalPath = nodeCode => `content/knowledge/production/approvals/${VAP_W10_LOCALE}/${nodeCode}/approval.v1.json`;
const reviewPath = nodeCode => `content/knowledge/production/reviews/${VAP_W10_LOCALE}/${nodeCode}/review.v1.json`;
const candidatePath = nodeCode => `content/knowledge/production/candidates/${VAP_W10_LOCALE}/${nodeCode}/candidate.v1.json`;
const promotionPath = nodeCode => `content/production/visual-article/promotion/${VAP_W10_LOCALE}/${nodeCode}/promotion.v1.json`;

function partCodeFor(nodeCode) {
  const match = /^KN-B1-P(\d+)-/.exec(nodeCode);
  if (!match) throw fail('VAP_W10_PART_CODE_UNRESOLVED', nodeCode);
  return `P${Number(match[1])}`;
}

function decisionCodeFor(nodeCode) {
  return `VAP-W10-${nodeCode}-HUMAN-APPROVAL-DECISION-001`;
}

function approvalConditionProjection() {
  return [
    { status: 'satisfied', description: 'TL Human Editorial Review decision is accept.' },
    { status: 'satisfied', description: 'VAP-W9 Candidate Promotion to PJA Approval Eligibility is recorded.' },
    { status: 'not_applicable', description: 'No additional approval condition was declared at queue formation.' }
  ];
}

export async function buildVapW10ApprovalQueue(root) {
  const [w9Activation, w9PromotionManifest, reviewRegistry, approvalRegistry, publicationRegistry] = await Promise.all([
    readJson(root, VAP_W10_PATHS.w9Activation),
    readJson(root, VAP_W10_PATHS.w9PromotionManifest),
    readJson(root, VAP_W10_PATHS.pjaReviewRegistry),
    readJson(root, VAP_W10_PATHS.pjaApprovalRegistry),
    readJson(root, VAP_W10_PATHS.pjaPublicationRegistry)
  ]);
  if (w9Activation.humanEditorialReviewCount !== 6 || w9Activation.humanAcceptedCount !== 6 || w9Activation.candidatePromotionCount !== 6) {
    throw fail('VAP_W10_W9_PROMOTION_REQUIRED', JSON.stringify({ humanEditorialReviewCount: w9Activation.humanEditorialReviewCount, humanAcceptedCount: w9Activation.humanAcceptedCount, candidatePromotionCount: w9Activation.candidatePromotionCount }));
  }
  if (w9PromotionManifest.promotedCount !== 6 || w9PromotionManifest.status !== 'ALL_ACCEPTED_CANDIDATES_PROMOTED_TO_PJA_APPROVAL_ELIGIBILITY') {
    throw fail('VAP_W10_W9_PROMOTION_MANIFEST_INVALID', w9PromotionManifest.status);
  }

  const entries = [];
  for (const nodeCode of VAP_W10_EXPECTED_NODE_CODES) {
    const [candidate, review, promotion] = await Promise.all([
      readJson(root, candidatePath(nodeCode)),
      readJson(root, reviewPath(nodeCode)),
      readJson(root, promotionPath(nodeCode))
    ]);
    if (review.decision !== 'accept' || review.reviewer?.reviewerCode !== 'TL') throw fail('VAP_W10_ACCEPTED_HUMAN_REVIEW_REQUIRED', nodeCode);
    if (promotion.promotionState !== 'promoted_to_pja_approval_eligibility' || promotion.reviewDecision !== 'accept') throw fail('VAP_W10_PROMOTION_ELIGIBILITY_REQUIRED', nodeCode);
    if (promotion.candidateDigest !== candidate.candidateDigest || promotion.reviewDigest !== review.reviewDigest) throw fail('VAP_W10_W9_LINEAGE_MISMATCH', nodeCode);
    const reviewRecord = reviewRegistry.records.find(record => record.reviewCode === review.reviewCode);
    if (!reviewRecord || reviewRecord.reviewDigest !== review.reviewDigest || reviewRecord.decision !== 'accept') throw fail('VAP_W10_REVIEW_REGISTRY_BINDING_REQUIRED', nodeCode);
    const existingApproval = approvalRegistry.records.find(record => record.nodeCode === nodeCode && record.locale === VAP_W10_LOCALE) ?? null;
    const existingPublication = publicationRegistry.records.find(record => record.nodeCode === nodeCode && record.locale === VAP_W10_LOCALE) ?? null;
    entries.push({
      approvalIndex: entries.length + 1,
      nodeCode,
      locale: VAP_W10_LOCALE,
      title: candidate.article.title,
      candidate: { candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest, path: candidatePath(nodeCode) },
      review: { reviewCode: review.reviewCode, reviewDigest: review.reviewDigest, decision: review.decision, reviewerCode: review.reviewer.reviewerCode, path: reviewPath(nodeCode) },
      promotion: { promotionCode: promotion.promotionCode, state: promotion.promotionState, path: promotionPath(nodeCode) },
      humanApprovalState: existingApproval ? 'already_recorded' : 'pending_human',
      productionArticlePackageState: existingApproval?.decision === 'approve' ? 'package_build_required' : 'blocked_pending_human_approval',
      existingApprovalCode: existingApproval?.approvalCode ?? null,
      existingPublicationCode: existingPublication?.publicationCode ?? null,
      publicationRecorded: Boolean(existingPublication),
      proposedConditions: approvalConditionProjection()
    });
  }
  const payload = {
    schemaVersion: 'PHI-OS-VAP-W10-HUMAN-APPROVAL-QUEUE-v1.0.0',
    work: 'VAP-W10',
    batchCode: VAP_W10_BATCH_CODE,
    locale: VAP_W10_LOCALE,
    status: entries.some(entry => entry.humanApprovalState === 'pending_human') ? 'AWAITING_EXPLICIT_HUMAN_APPROVAL' : 'HUMAN_APPROVALS_ALREADY_RECORDED',
    approvalAuthority: 'TL Human Approval Authority',
    approvalIsPublication: false,
    productionArticlePackageIsPublication: false,
    candidateContentMutationAllowed: false,
    entries
  };
  return { ...payload, approvalQueueDigest: shaBytes(Buffer.from(serialize(payload), 'utf8')) };
}

function approvalQueueWithoutDigest(queue) {
  const copy = structuredClone(queue);
  delete copy.approvalQueueDigest;
  return copy;
}

function staticQueueEntry(entry) {
  return {
    approvalIndex: entry.approvalIndex,
    nodeCode: entry.nodeCode,
    locale: entry.locale,
    title: entry.title,
    candidate: entry.candidate,
    review: entry.review,
    promotion: entry.promotion,
    proposedConditions: entry.proposedConditions
  };
}

export function validateFrozenApprovalQueueLineage(frozenQueue, currentQueue) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  if (frozenQueue?.schemaVersion !== 'PHI-OS-VAP-W10-HUMAN-APPROVAL-QUEUE-v1.0.0') add('VAP_W10_FROZEN_QUEUE_SCHEMA_INVALID', String(frozenQueue?.schemaVersion));
  if (frozenQueue?.batchCode !== VAP_W10_BATCH_CODE || frozenQueue?.locale !== VAP_W10_LOCALE) add('VAP_W10_FROZEN_QUEUE_SCOPE_INVALID', `${frozenQueue?.batchCode}:${frozenQueue?.locale}`);
  const expectedDigest = shaBytes(Buffer.from(serialize(approvalQueueWithoutDigest(frozenQueue)), 'utf8'));
  if (frozenQueue?.approvalQueueDigest !== expectedDigest) add('VAP_W10_FROZEN_QUEUE_DIGEST_INVALID', String(frozenQueue?.approvalQueueDigest));
  if (frozenQueue?.approvalAuthority !== 'TL Human Approval Authority' || frozenQueue?.approvalIsPublication !== false || frozenQueue?.productionArticlePackageIsPublication !== false) add('VAP_W10_FROZEN_QUEUE_AUTHORITY_INVALID', 'approval/publication boundary');
  if (!Array.isArray(frozenQueue?.entries) || frozenQueue.entries.length !== VAP_W10_EXPECTED_NODE_CODES.length) add('VAP_W10_FROZEN_QUEUE_COUNT_INVALID', String(frozenQueue?.entries?.length));
  const currentByNode = new Map((currentQueue?.entries ?? []).map(item => [item.nodeCode, item]));
  for (const nodeCode of VAP_W10_EXPECTED_NODE_CODES) {
    const frozen = frozenQueue?.entries?.find(item => item.nodeCode === nodeCode);
    const current = currentByNode.get(nodeCode);
    if (!frozen || !current) { add('VAP_W10_FROZEN_QUEUE_NODE_MISSING', nodeCode); continue; }
    if (serialize(staticQueueEntry(frozen)) !== serialize(staticQueueEntry(current))) add('VAP_W10_FROZEN_QUEUE_LINEAGE_DRIFT', nodeCode);
  }
  return { valid: errors.length === 0, errors };
}

async function resolveDecisionInputQueue(root, decisionEnvelope) {
  const currentQueue = await buildVapW10ApprovalQueue(root);
  const frozenPath = path.join(root, VAP_W10_PATHS.approvalQueue);
  if (!(await exists(frozenPath))) return { queue: currentQueue, currentQueue, source: 'current_runtime_projection' };
  const frozenQueue = await readJson(root, VAP_W10_PATHS.approvalQueue);
  const lineage = validateFrozenApprovalQueueLineage(frozenQueue, currentQueue);
  if (!lineage.valid) throw fail('VAP_W10_FROZEN_APPROVAL_QUEUE_INVALID', JSON.stringify(lineage.errors));
  if (decisionEnvelope?.approvalQueueDigest === frozenQueue.approvalQueueDigest) return { queue: frozenQueue, currentQueue, source: 'frozen_pre_decision_queue' };
  return { queue: currentQueue, currentQueue, source: 'current_runtime_projection' };
}

export function buildPendingApprovalDecisionEnvelope(queue) {
  return {
    schemaVersion: 'PHI-OS-VAP-W10-HUMAN-APPROVAL-DECISIONS-v1.0.0',
    decisionEnvelopeCode: 'PHI-OS-VAP-W10-BATCH-001-HUMAN-APPROVAL-DECISIONS-v1',
    work: 'VAP-W10', batchCode: VAP_W10_BATCH_CODE, locale: VAP_W10_LOCALE,
    status: 'PENDING_HUMAN_APPROVAL',
    approvalQueueDigest: queue.approvalQueueDigest,
    bulkApprovalAllowed: false,
    oneIndependentDecisionPerNode: true,
    entries: queue.entries.map(item => ({
      decisionCode: decisionCodeFor(item.nodeCode),
      nodeCode: item.nodeCode,
      candidateCode: item.candidate.candidateCode,
      candidateDigest: item.candidate.candidateDigest,
      reviewCode: item.review.reviewCode,
      reviewDigest: item.review.reviewDigest,
      decisionState: 'pending_human',
      decision: null,
      approverCode: null,
      approverAuthority: null,
      approvedAt: null,
      summary: null,
      conditions: item.proposedConditions
    }))
  };
}

export function validateApprovalDecisionEnvelope(envelope, queue, { requireAllDecided = false } = {}) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  if (envelope?.schemaVersion !== 'PHI-OS-VAP-W10-HUMAN-APPROVAL-DECISIONS-v1.0.0') add('VAP_W10_DECISION_SCHEMA_INVALID', String(envelope?.schemaVersion));
  if (envelope?.batchCode !== VAP_W10_BATCH_CODE || envelope?.locale !== VAP_W10_LOCALE) add('VAP_W10_DECISION_SCOPE_INVALID', `${envelope?.batchCode}:${envelope?.locale}`);
  if (envelope?.approvalQueueDigest !== queue.approvalQueueDigest) add('VAP_W10_APPROVAL_QUEUE_DIGEST_DRIFT', String(envelope?.approvalQueueDigest));
  if (envelope?.bulkApprovalAllowed !== false || envelope?.oneIndependentDecisionPerNode !== true) add('VAP_W10_BULK_APPROVAL_FORBIDDEN', 'Each node requires one independent TL Human Approval decision.');
  if (!Array.isArray(envelope?.entries) || envelope.entries.length !== VAP_W10_EXPECTED_NODE_CODES.length) add('VAP_W10_DECISION_COUNT_INVALID', String(envelope?.entries?.length));
  const byNode = new Map((envelope?.entries ?? []).map(entry => [entry.nodeCode, entry]));
  for (const q of queue.entries) {
    const entry = byNode.get(q.nodeCode);
    if (!entry) { add('VAP_W10_DECISION_MISSING', q.nodeCode); continue; }
    if (entry.candidateCode !== q.candidate.candidateCode || entry.candidateDigest !== q.candidate.candidateDigest || entry.reviewCode !== q.review.reviewCode || entry.reviewDigest !== q.review.reviewDigest) add('VAP_W10_DECISION_LINEAGE_INVALID', q.nodeCode);
    if (entry.decisionState === 'pending_human') { if (requireAllDecided) add('VAP_W10_EXPLICIT_HUMAN_APPROVAL_REQUIRED', q.nodeCode); continue; }
    if (entry.decisionState !== 'human_decided') { add('VAP_W10_DECISION_STATE_INVALID', `${q.nodeCode}:${entry.decisionState}`); continue; }
    if (!VAP_W10_ALLOWED_DECISIONS.includes(entry.decision)) add('VAP_W10_DECISION_INVALID', `${q.nodeCode}:${entry.decision}`);
    if (entry.approverCode !== 'TL' || entry.approverAuthority !== 'TL Human Approval Authority') add('VAP_W10_HUMAN_APPROVER_AUTHORITY_INVALID', q.nodeCode);
    if (!entry.approvedAt || Number.isNaN(Date.parse(entry.approvedAt))) add('VAP_W10_APPROVED_AT_INVALID', q.nodeCode);
    if (typeof entry.summary !== 'string' || !entry.summary.trim()) add('VAP_W10_APPROVAL_SUMMARY_REQUIRED', q.nodeCode);
    if (!Array.isArray(entry.conditions)) add('VAP_W10_APPROVAL_CONDITIONS_INVALID', q.nodeCode);
    if (entry.decision === 'approve' && (entry.conditions ?? []).some(condition => condition.status === 'pending')) add('VAP_W10_APPROVAL_PENDING_CONDITION', q.nodeCode);
  }
  return { valid: errors.length === 0, errors };
}

function buildPackageBinding(nodeCode, nodeRegistry, blueprintRegistry) {
  const node = nodeRegistry.nodes.find(item => item.nodeCode === nodeCode);
  if (!node) throw fail('VAP_W10_NODE_NOT_REGISTERED', nodeCode);
  const partCode = partCodeFor(nodeCode);
  const bookEntry = blueprintRegistry.books.find(book => book.partCodes.includes(partCode));
  if (!bookEntry) throw fail('VAP_W10_PUBLICATION_BOOK_UNRESOLVED', `${nodeCode}:${partCode}`);
  const binding = {
    nodeCode,
    canonicalNodeVersion: node.version || '1.0.0',
    publicationBookCode: bookEntry.bookCode,
    publicationPartCode: partCode,
    blueprintContract: bookEntry.contract,
    blueprintDigest: bookEntry.sha256,
    blueprintRegistryContract: blueprintRegistry.contract,
    blueprintRegistryDigest: digest(blueprintRegistry),
    canonicalLocale: node.canonicalLanguage || VAP_W10_LOCALE,
    sourceLocale: VAP_W10_LOCALE,
    productionLocale: VAP_W10_LOCALE,
    targetPublicationLocale: VAP_W10_LOCALE,
    productionWaveCode: VAP_W10_BATCH_CODE,
    productionPackageVersion: '1.0.0',
    authorityResolved: true
  };
  const validation = validateArticlePackageBinding(binding);
  if (!validation.valid) throw fail('VAP_W10_ARTICLE_PACKAGE_V2_BINDING_INVALID', validation.missing.join(','));
  return binding;
}

function productionPackageWithoutDigest(value) { const copy = structuredClone(value); delete copy.packageDigest; return copy; }
export function computeProductionArticlePackageDigest(value) { return digest(productionPackageWithoutDigest(value)); }

export function buildProductionArticlePackage({ candidate, review, approval, binding, bodyDigest }) {
  const payload = {
    schemaVersion: 'PHI-OS-VAP-W10-PRODUCTION-ARTICLE-PACKAGE-v1.0.0',
    packageType: 'approved_article_production_handoff',
    packageCode: `VAP-W10-PACKAGE-${candidate.nodeCode}-ZH-HANS-V1`,
    work: 'VAP-W10', batchCode: VAP_W10_BATCH_CODE,
    nodeCode: candidate.nodeCode, locale: candidate.locale,
    packageState: 'human_approved_not_published',
    articlePackageContract: ARTICLE_PACKAGE_CONTRACT_V2,
    binding,
    article: {
      title: candidate.article.title,
      bodyPath: `${packageRoot(candidate.nodeCode)}/article.md`,
      bodyDigest,
      bodyByteEquivalentToCandidate: true,
      sourceCandidatePath: candidatePath(candidate.nodeCode)
    },
    candidate: { candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest },
    review: { reviewCode: review.reviewCode, reviewDigest: review.reviewDigest, decision: review.decision, reviewerCode: review.reviewer.reviewerCode },
    approval: { approvalCode: approval.approvalCode, approvalDigest: approval.approvalDigest, decision: approval.decision, approverCode: approval.approver.approverCode },
    authority: { canonicalKnowledgeMutation: false, humanReviewRecorded: true, humanApprovalRecorded: true, publicationRecorded: false },
    governance: { candidateContentMutated: false, reviewMutated: false, approvalIsPublication: false, packageIsPublication: false, publicationRuntimeBypassAllowed: false, publicProjectionAllowed: false },
    createdAt: approval.approvedAt,
    nextAuthority: 'PJA Publication Runtime / governed publication handoff'
  };
  return { ...payload, packageDigest: computeProductionArticlePackageDigest(payload) };
}

export function validateProductionArticlePackage(pkg, { candidate, review, approval, articleBody } = {}) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  if (pkg?.schemaVersion !== 'PHI-OS-VAP-W10-PRODUCTION-ARTICLE-PACKAGE-v1.0.0') add('VAP_W10_PACKAGE_SCHEMA_INVALID', String(pkg?.schemaVersion));
  if (pkg?.articlePackageContract !== ARTICLE_PACKAGE_CONTRACT_V2) add('VAP_W10_PACKAGE_V2_CONTRACT_INVALID', String(pkg?.articlePackageContract));
  const bindingValidation = validateArticlePackageBinding(pkg?.binding ?? {}); if (!bindingValidation.valid) add('VAP_W10_PACKAGE_BINDING_INVALID', bindingValidation.missing.join(','));
  if (pkg?.packageState !== 'human_approved_not_published' || pkg?.approval?.decision !== 'approve') add('VAP_W10_PACKAGE_APPROVAL_REQUIRED', String(pkg?.approval?.decision));
  if (pkg?.authority?.publicationRecorded !== false || pkg?.governance?.approvalIsPublication !== false || pkg?.governance?.packageIsPublication !== false || pkg?.governance?.publicProjectionAllowed !== false) add('VAP_W10_PACKAGE_PUBLICATION_BOUNDARY_INVALID', 'publication');
  if (!/^[a-f0-9]{64}$/.test(pkg?.packageDigest ?? '') || pkg.packageDigest !== computeProductionArticlePackageDigest(pkg)) add('VAP_W10_PACKAGE_DIGEST_INVALID', String(pkg?.packageDigest));
  if (candidate) {
    if (pkg.candidate?.candidateCode !== candidate.candidateCode || pkg.candidate?.candidateDigest !== candidate.candidateDigest || pkg.nodeCode !== candidate.nodeCode) add('VAP_W10_PACKAGE_CANDIDATE_BINDING_INVALID', candidate.nodeCode);
    if (articleBody !== undefined) {
      const candidateBody = candidate.article.bodyMarkdown;
      if (articleBody !== candidateBody) add('VAP_W10_PACKAGE_ARTICLE_BODY_MUTATED', candidate.nodeCode);
      if (pkg.article?.bodyDigest !== shaBytes(Buffer.from(candidateBody, 'utf8'))) add('VAP_W10_PACKAGE_BODY_DIGEST_INVALID', candidate.nodeCode);
    }
  }
  if (review && (pkg.review?.reviewCode !== review.reviewCode || pkg.review?.reviewDigest !== review.reviewDigest || review.decision !== 'accept')) add('VAP_W10_PACKAGE_REVIEW_BINDING_INVALID', pkg.nodeCode);
  if (approval && (pkg.approval?.approvalCode !== approval.approvalCode || pkg.approval?.approvalDigest !== approval.approvalDigest || approval.decision !== 'approve')) add('VAP_W10_PACKAGE_APPROVAL_BINDING_INVALID', pkg.nodeCode);
  return { valid: errors.length === 0, errors };
}

async function atomicWrite(target, text) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await fs.writeFile(temp, text, { flag: 'wx' });
  await fs.rename(temp, target);
}

async function preflightEquivalent(target, text, conflictCode) {
  if (!(await exists(target))) return 'create';
  if ((await fs.readFile(target, 'utf8')) !== text) throw fail(conflictCode, target);
  return 'existing_byte_equivalent';
}

export async function applyVapW10(root, decisionEnvelope, { apply = false, targetRoot = root } = {}) {
  const { queue } = await resolveDecisionInputQueue(root, decisionEnvelope);
  const decisionValidation = validateApprovalDecisionEnvelope(decisionEnvelope, queue, { requireAllDecided: true });
  if (!decisionValidation.valid) throw fail('VAP_W10_HUMAN_APPROVAL_DECISIONS_INVALID', JSON.stringify(decisionValidation.errors));
  const [approvalRegistry, publicationRegistry, nodeRegistry, blueprintRegistry] = await Promise.all([
    readJson(targetRoot, VAP_W10_PATHS.pjaApprovalRegistry),
    readJson(root, VAP_W10_PATHS.pjaPublicationRegistry),
    readJson(root, VAP_W10_PATHS.nodeRegistry),
    readJson(root, VAP_W10_PATHS.blueprintRegistry)
  ]);
  const originalPublicationDigest = digest(publicationRegistry);
  const nextApprovalRecords = [...approvalRegistry.records];
  const outcomes = [], approvedPackages = [];

  for (const q of queue.entries) {
    const decision = decisionEnvelope.entries.find(item => item.nodeCode === q.nodeCode);
    const [candidate, review] = await Promise.all([readJson(root, q.candidate.path), readJson(root, q.review.path)]);
    const approval = await buildHumanApproval(root, { candidate, review, approverCode: decision.approverCode, decision: decision.decision, summary: decision.summary, conditions: decision.conditions, approvedAt: decision.approvedAt });
    const approvalValidation = validateHumanApproval(approval, candidate, review);
    if (!approvalValidation.valid) throw fail('VAP_W10_PJA_APPROVAL_INVALID', `${q.nodeCode}:${JSON.stringify(approvalValidation.errors)}`);
    const record = buildApprovalRegistryRecord(approval);
    const existingRecord = nextApprovalRecords.find(item => item.approvalCode === record.approvalCode);
    if (existingRecord && serialize(existingRecord) !== serialize(record)) throw fail('VAP_W10_APPROVAL_REGISTRY_CONFLICT', record.approvalCode);
    if (!existingRecord) nextApprovalRecords.push(record);
    let productionPackage = null;
    if (approval.decision === 'approve') {
      const binding = buildPackageBinding(q.nodeCode, nodeRegistry, blueprintRegistry);
      const bodyDigest = shaBytes(Buffer.from(candidate.article.bodyMarkdown, 'utf8'));
      productionPackage = buildProductionArticlePackage({ candidate, review, approval, binding, bodyDigest });
      const validation = validateProductionArticlePackage(productionPackage, { candidate, review, approval, articleBody: candidate.article.bodyMarkdown });
      if (!validation.valid) throw fail('VAP_W10_PRODUCTION_ARTICLE_PACKAGE_INVALID', `${q.nodeCode}:${JSON.stringify(validation.errors)}`);
      approvedPackages.push({ nodeCode: q.nodeCode, candidate, review, approval, productionPackage });
    }
    outcomes.push({ nodeCode: q.nodeCode, decision: approval.decision, approvalCode: approval.approvalCode, approvalDigest: approval.approvalDigest, approvalPackagePath: approvalPath(q.nodeCode), productionArticlePackageCreated: Boolean(productionPackage), productionArticlePackagePath: productionPackage ? `${packageRoot(q.nodeCode)}/production-article-package.v1.json` : null, publicationRecorded: false, approval });
  }

  const packageManifest = {
    schemaVersion: 'PHI-OS-VAP-W10-PRODUCTION-ARTICLE-PACKAGE-MANIFEST-v1.0.0',
    work: 'VAP-W10', batchCode: VAP_W10_BATCH_CODE, locale: VAP_W10_LOCALE,
    status: approvedPackages.length === 6 ? 'SIX_HUMAN_APPROVED_PRODUCTION_ARTICLE_PACKAGES_READY_FOR_PUBLICATION_GOVERNANCE' : 'HUMAN_APPROVAL_COMPLETE_WITH_NON_APPROVE_OUTCOMES',
    humanApprovalDecisionCount: outcomes.length,
    approvedCount: outcomes.filter(item => item.decision === 'approve').length,
    declinedCount: outcomes.filter(item => item.decision === 'decline').length,
    deferredCount: outcomes.filter(item => item.decision === 'defer').length,
    productionArticlePackageCount: approvedPackages.length,
    publicationCount: 0,
    packageMeaning: 'immutable_candidate_plus_human_review_plus_human_approval_handoff_not_publication',
    entries: outcomes.map(item => ({ nodeCode: item.nodeCode, decision: item.decision, approvalCode: item.approvalCode, approvalDigest: item.approvalDigest, productionArticlePackageCreated: item.productionArticlePackageCreated, productionArticlePackagePath: item.productionArticlePackagePath, publicationRecorded: false }))
  };
  const activation = {
    schemaVersion: 'PHI-OS-VAP-W10-ACTIVATION-v1.0.0', work: 'VAP-W10', batchCode: VAP_W10_BATCH_CODE, locale: VAP_W10_LOCALE,
    status: packageManifest.status,
    approvalEligibleCount: 6,
    humanApprovalDecisionCount: outcomes.length,
    humanApprovedCount: packageManifest.approvedCount,
    productionArticlePackageCount: packageManifest.productionArticlePackageCount,
    publicationCount: 0,
    candidateContentMutated: false,
    humanReviewMutated: false,
    pjaApprovalRegistryMutated: apply,
    pjaPublicationRegistryMutated: false,
    nextAuthority: approvedPackages.length ? 'PJA Publication Runtime / VAP publication successor stage' : 'TL Human Approval resolution',
    nextWork: approvedPackages.length ? 'VAP-W11_PUBLICATION_HANDOFF' : 'VAP-W10_HUMAN_APPROVAL_RESOLUTION'
  };

  if (!apply) return { mode: 'dry-run', applied: false, queue, outcomes, packageManifest, activation };

  // Preflight every file before the first mutation.
  for (const outcome of outcomes) await preflightEquivalent(path.join(targetRoot, outcome.approvalPackagePath), serialize(outcome.approval), 'VAP_W10_APPROVAL_PACKAGE_CONFLICT');
  for (const item of approvedPackages) {
    await preflightEquivalent(path.join(targetRoot, packageRoot(item.nodeCode), 'article.md'), item.candidate.article.bodyMarkdown, 'VAP_W10_ARTICLE_BODY_CONFLICT');
    await preflightEquivalent(path.join(targetRoot, packageRoot(item.nodeCode), 'production-article-package.v1.json'), serialize(item.productionPackage), 'VAP_W10_PRODUCTION_PACKAGE_CONFLICT');
  }

  for (const outcome of outcomes) {
    const target = path.join(targetRoot, outcome.approvalPackagePath); if (!(await exists(target))) await atomicWrite(target, serialize(outcome.approval));
  }
  const nextApprovalRegistry = { ...approvalRegistry, records: nextApprovalRecords.sort((a, b) => a.approvalCode.localeCompare(b.approvalCode)) };
  await atomicWrite(path.join(targetRoot, VAP_W10_PATHS.pjaApprovalRegistry), serialize(nextApprovalRegistry));
  for (const item of approvedPackages) {
    const dir = path.join(targetRoot, packageRoot(item.nodeCode));
    const bodyTarget = path.join(dir, 'article.md'); if (!(await exists(bodyTarget))) await atomicWrite(bodyTarget, item.candidate.article.bodyMarkdown);
    const packageTarget = path.join(dir, 'production-article-package.v1.json'); if (!(await exists(packageTarget))) await atomicWrite(packageTarget, serialize(item.productionPackage));
  }
  await atomicWrite(path.join(targetRoot, VAP_W10_PATHS.packageManifest), serialize(packageManifest));
  await atomicWrite(path.join(targetRoot, VAP_W10_PATHS.activation), serialize(activation));

  const publicationAfter = await readJson(root, VAP_W10_PATHS.pjaPublicationRegistry);
  if (digest(publicationAfter) !== originalPublicationDigest) throw fail('VAP_W10_PUBLICATION_REGISTRY_MUTATION_FORBIDDEN', VAP_W10_PATHS.pjaPublicationRegistry);
  return { mode: 'apply', applied: true, queue, outcomes, packageManifest, activation };
}

export async function buildPendingVapW10Projection(root) {
  const currentQueue = await buildVapW10ApprovalQueue(root);
  let decisions;
  const decisionsFile = path.join(root, VAP_W10_PATHS.decisions);
  const frozenQueueFile = path.join(root, VAP_W10_PATHS.approvalQueue);
  let queue = currentQueue;
  if (await exists(frozenQueueFile)) {
    const frozenQueue = await readJson(root, VAP_W10_PATHS.approvalQueue);
    const lineage = validateFrozenApprovalQueueLineage(frozenQueue, currentQueue);
    if (!lineage.valid) throw fail('VAP_W10_FROZEN_APPROVAL_QUEUE_INVALID', JSON.stringify(lineage.errors));
    queue = frozenQueue;
  }
  if (await exists(decisionsFile)) decisions = await readJson(root, VAP_W10_PATHS.decisions); else decisions = buildPendingApprovalDecisionEnvelope(queue);
  const validation = validateApprovalDecisionEnvelope(decisions, queue, { requireAllDecided: false });
  if (!validation.valid) throw fail('VAP_W10_PENDING_DECISIONS_INVALID', JSON.stringify(validation.errors));
  const decided = decisions.entries.filter(item => item.decisionState === 'human_decided');
  const fullyDecided = decided.length === VAP_W10_EXPECTED_NODE_CODES.length;
  if (fullyDecided) {
    const approvalPackagesExist = (await Promise.all(VAP_W10_EXPECTED_NODE_CODES.map(code => exists(path.join(root, approvalPath(code)))))).every(Boolean);
    const productionPackagesExist = (await Promise.all(VAP_W10_EXPECTED_NODE_CODES.map(code => exists(path.join(root, packageRoot(code), 'production-article-package.v1.json'))))).every(Boolean);
    if (approvalPackagesExist && productionPackagesExist && await exists(path.join(root, VAP_W10_PATHS.packageManifest)) && await exists(path.join(root, VAP_W10_PATHS.activation))) {
      const packageManifest = await readJson(root, VAP_W10_PATHS.packageManifest);
      const activation = await readJson(root, VAP_W10_PATHS.activation);
      return { queue, decisions, packageManifest, activation };
    }
  }
  const packageManifest = {
    schemaVersion: 'PHI-OS-VAP-W10-PRODUCTION-ARTICLE-PACKAGE-MANIFEST-v1.0.0', work: 'VAP-W10', batchCode: VAP_W10_BATCH_CODE, locale: VAP_W10_LOCALE,
    status: decided.length ? 'HUMAN_APPROVAL_DECISIONS_PRESENT_APPLY_REQUIRED' : 'AWAITING_EXPLICIT_HUMAN_APPROVAL',
    humanApprovalDecisionCount: 0, approvedCount: 0, declinedCount: 0, deferredCount: 0, productionArticlePackageCount: 0, publicationCount: 0,
    packageMeaning: 'immutable_candidate_plus_human_review_plus_human_approval_handoff_not_publication',
    entries: queue.entries.map(item => ({ nodeCode: item.nodeCode, decision: null, approvalCode: null, approvalDigest: null, productionArticlePackageCreated: false, productionArticlePackagePath: null, publicationRecorded: false }))
  };
  const activation = {
    schemaVersion: 'PHI-OS-VAP-W10-ACTIVATION-v1.0.0', work: 'VAP-W10', batchCode: VAP_W10_BATCH_CODE, locale: VAP_W10_LOCALE,
    status: decided.length ? 'HUMAN_APPROVAL_DECISIONS_PRESENT_APPLY_REQUIRED' : 'AWAITING_EXPLICIT_HUMAN_APPROVAL',
    approvalEligibleCount: 6,
    humanApprovalDecisionCount: 0,
    humanApprovedCount: 0,
    productionArticlePackageCount: 0,
    publicationCount: 0,
    candidateContentMutated: false,
    humanReviewMutated: false,
    pjaApprovalRegistryMutated: false,
    pjaPublicationRegistryMutated: false,
    nextAuthority: 'TL Human Approval Authority',
    nextWork: 'VAP-W10_EXPLICIT_HUMAN_APPROVAL_DECISIONS'
  };
  return { queue, decisions, packageManifest, activation };
}

export async function writePendingVapW10Projection(root, { apply = false } = {}) {
  const built = await buildPendingVapW10Projection(root);
  if (!apply) return { mode: 'dry-run', applied: false, ...built };
  if (!(await exists(path.join(root, VAP_W10_PATHS.approvalQueue)))) await atomicWrite(path.join(root, VAP_W10_PATHS.approvalQueue), serialize(built.queue));
  if (!(await exists(path.join(root, VAP_W10_PATHS.decisions)))) await atomicWrite(path.join(root, VAP_W10_PATHS.decisions), serialize(built.decisions));
  await atomicWrite(path.join(root, VAP_W10_PATHS.packageManifest), serialize(built.packageManifest));
  await atomicWrite(path.join(root, VAP_W10_PATHS.activation), serialize(built.activation));
  return { mode: 'apply', applied: true, ...built };
}
