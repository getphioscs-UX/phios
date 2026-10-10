import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  buildVapW11PublicationQueue,
  buildPendingPublicationDecisionEnvelope,
  validateFrozenPublicationQueueLineage,
  validatePublicationDecisionEnvelope,
  VAP_W11_ALLOWED_DECISIONS,
  VAP_W11_PATHS,
  VAP_W11_PUBLICATION_AUTHORITY
} from '../visual-article-production/publication-handoff-decision-v1.mjs';

export const APS6_SCHEMA_VERSION = 'PHI-OS-APS-6-HUMAN-DECISION-BRIDGE-v1.0.0';
export const APS6_WORK = 'APS-6';
export const APS6_BASELINE = '94d5efa953ff83713505b133d0039764df577675';

const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = async (root, rel) => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const exists = file => fs.access(file).then(() => true, () => false);
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const aps6Digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

export const apsBatchPaths = batchCode => ({
  reviewBatch: `content/production/article-simplification/batches/${batchCode}/review-batch.v1.json`,
  humanDecisions: `content/production/article-simplification/batches/${batchCode}/human-decisions.v1.json`,
  decisionBridge: `content/production/article-simplification/batches/${batchCode}/decision-bridge.v1.json`
});

function validateSourceBinding(human, reviewBatch) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  if (human?.batchCode !== reviewBatch?.batchCode) add('APS6_BATCH_IDENTITY_MISMATCH', `${human?.batchCode}:${reviewBatch?.batchCode}`);
  if (human?.sourceReviewBatchDigest !== `sha256:${reviewBatch.reviewBatchDigest}` && human?.sourceReviewBatchDigest !== reviewBatch.reviewBatchDigest) {
    add('APS6_REVIEW_BATCH_DIGEST_MISMATCH', String(human?.sourceReviewBatchDigest));
  }
  if (!Array.isArray(human?.entries) || human.entries.length !== reviewBatch.entries.length) add('APS6_DECISION_SCOPE_INVALID', String(human?.entries?.length));
  const seen = new Set();
  for (const reviewEntry of reviewBatch.entries) {
    const entry = human?.entries?.find(item => item.nodeCode === reviewEntry.nodeCode && item.locale === reviewEntry.locale);
    if (!entry || seen.has(`${reviewEntry.nodeCode}:${reviewEntry.locale}`)) { add('APS6_NODE_LOCALE_DECISION_MISSING_OR_DUPLICATE', `${reviewEntry.nodeCode}:${reviewEntry.locale}`); continue; }
    seen.add(`${reviewEntry.nodeCode}:${reviewEntry.locale}`);
    if (entry.candidateCode !== reviewEntry.candidate.candidateCode || entry.candidateDigest !== reviewEntry.candidate.candidateDigest) add('APS6_CANDIDATE_BINDING_INVALID', reviewEntry.nodeCode);
    if (entry.reviewDecision !== 'accept' || entry.reviewerCode !== 'TL' || reviewEntry.existingAuthority?.review?.accepted !== true) add('APS6_REVIEW_AUTHORITY_BINDING_INVALID', reviewEntry.nodeCode);
    if (entry.approvalDecision !== 'approve' || entry.approverCode !== 'TL' || reviewEntry.existingAuthority?.approval?.approved !== true) add('APS6_APPROVAL_AUTHORITY_BINDING_INVALID', reviewEntry.nodeCode);
  }
  return errors;
}

function explicitDecisionState(entry) {
  const hasDecision = VAP_W11_ALLOWED_DECISIONS.includes(entry?.publicationDecision);
  const hasPublisher = entry?.publisherCode === 'TL';
  const hasTimestamp = typeof entry?.decidedAt === 'string' && !Number.isNaN(Date.parse(entry.decidedAt));
  const hasSummary = typeof entry?.summary === 'string' && entry.summary.trim().length > 0;
  const any = entry?.publicationDecision !== null || entry?.publisherCode !== null || entry?.decidedAt !== null || entry?.summary !== null;
  const complete = hasDecision && hasPublisher && hasTimestamp && hasSummary;
  return { any, complete, hasDecision, hasPublisher, hasTimestamp, hasSummary };
}

export async function buildAps6DecisionBridge(root, batchCode = 'BATCH-001', { humanDecisionsOverride = null } = {}) {
  const paths = apsBatchPaths(batchCode);
  const [reviewBatch, humanDecisions, currentQueue] = await Promise.all([
    readJson(root, paths.reviewBatch),
    humanDecisionsOverride ? Promise.resolve(structuredClone(humanDecisionsOverride)) : readJson(root, paths.humanDecisions),
    buildVapW11PublicationQueue(root)
  ]);
  const sourceErrors = validateSourceBinding(humanDecisions, reviewBatch);
  let queue = currentQueue;
  const frozenQueuePath = path.join(root, VAP_W11_PATHS.publicationQueue);
  if (await exists(frozenQueuePath)) {
    const frozen = await readJson(root, VAP_W11_PATHS.publicationQueue);
    const validation = validateFrozenPublicationQueueLineage(frozen, currentQueue);
    if (!validation.valid) sourceErrors.push(...validation.errors.map(error => ({ code: `APS6_${error.code}`, message: error.message })));
    else queue = frozen;
  }
  const vapEnvelope = buildPendingPublicationDecisionEnvelope(queue);
  const entries = [];
  for (const reviewEntry of reviewBatch.entries) {
    const input = humanDecisions.entries.find(item => item.nodeCode === reviewEntry.nodeCode && item.locale === reviewEntry.locale);
    const q = queue.entries.find(item => item.nodeCode === reviewEntry.nodeCode && item.locale === reviewEntry.locale);
    const state = explicitDecisionState(input);
    const blockers = [];
    if (state.any && !state.complete) blockers.push('INCOMPLETE_EXPLICIT_HUMAN_PUBLICATION_DECISION');
    if (!state.any) blockers.push('EXPLICIT_TL_PUBLICATION_DECISION_REQUIRED');
    if (!q) blockers.push('VAP_W11_QUEUE_BINDING_MISSING');
    const target = vapEnvelope.entries.find(item => item.nodeCode === reviewEntry.nodeCode);
    if (state.complete && target && q) {
      target.decisionState = 'human_decided';
      target.decision = input.publicationDecision;
      target.publisherCode = 'TL';
      target.publisherAuthority = VAP_W11_PUBLICATION_AUTHORITY;
      target.decidedAt = new Date(input.decidedAt).toISOString();
      target.summary = input.summary.trim();
    }
    entries.push({
      nodeCode: reviewEntry.nodeCode,
      locale: reviewEntry.locale,
      candidateCode: input?.candidateCode ?? null,
      candidateDigest: input?.candidateDigest ?? null,
      inputDecisionState: input?.decisionState ?? null,
      publicationDecision: state.complete ? input.publicationDecision : null,
      explicitHumanDecisionComplete: state.complete,
      blockers,
      vapW11DecisionCode: target?.decisionCode ?? null,
      vapW11QueueBound: Boolean(q)
    });
  }
  if (entries.every(entry => entry.explicitHumanDecisionComplete)) vapEnvelope.status = 'HUMAN_PUBLICATION_DECISIONS_RECORDED';
  const vapValidation = validatePublicationDecisionEnvelope(vapEnvelope, queue, { requireAllDecided: entries.every(entry => entry.explicitHumanDecisionComplete) });
  if (!vapValidation.valid) sourceErrors.push(...vapValidation.errors.map(error => ({ code: `APS6_${error.code}`, message: error.message })));
  const decidedCount = entries.filter(entry => entry.explicitHumanDecisionComplete).length;
  const payload = {
    schemaVersion: APS6_SCHEMA_VERSION,
    work: APS6_WORK,
    baselineCommit: APS6_BASELINE,
    batchCode,
    sourceReviewBatchDigest: humanDecisions.sourceReviewBatchDigest,
    status: sourceErrors.length ? 'INVALID_DECISION_INPUT' : decidedCount === entries.length ? 'READY_FOR_APS_7_PUBLICATION' : 'AWAITING_EXPLICIT_TL_PUBLICATION_DECISIONS',
    humanDecisionCount: decidedCount,
    expectedDecisionCount: entries.length,
    publishCount: entries.filter(entry => entry.publicationDecision === 'publish').length,
    deferCount: entries.filter(entry => entry.publicationDecision === 'defer').length,
    doNotPublishCount: entries.filter(entry => entry.publicationDecision === 'do_not_publish').length,
    oneIndependentDecisionPerNodeLocale: true,
    bulkPublicationAuthorityCreated: false,
    publicationAuthorityCreatedByAps6: false,
    errors: sourceErrors,
    entries,
    governance: {
      explicitTlDecisionRequired: true,
      apsDecisionInputIsPublicationAuthority: false,
      aps6CreatesPublicationRecord: false,
      aps6CreatesPublicProjection: false,
      candidateReviewApprovalMutationAllowed: false,
      localeAuthorityInheritanceAllowed: false
    }
  };
  return { bridge: { ...payload, bridgeDigest: aps6Digest(payload) }, reviewBatch, humanDecisions, queue, vapEnvelope, vapValidation };
}

export async function writeAps6DecisionBridge(root, batchCode, { apply = false } = {}) {
  const built = await buildAps6DecisionBridge(root, batchCode);
  if (built.bridge.errors.length) throw fail('APS6_DECISION_INPUT_INVALID', JSON.stringify(built.bridge.errors));
  if (!apply) return { ...built, applied: false };
  const relative = apsBatchPaths(batchCode).decisionBridge;
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(built.bridge, null, 2)}\n`, 'utf8');
  return { ...built, applied: true, decisionBridgePath: relative };
}
