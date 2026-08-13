import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildCanonicalBriefV2, serialize, digest } from '../knowledge-production/canonical-brief-v2.mjs';
import { validatePublication } from '../knowledge-production/publication-v1.mjs';
import { validateProductionArticlePackage } from './human-approval-production-article-package-v1.mjs';

export const VAP_W11_SCHEMA_VERSION = 'PHI-OS-VAP-W11-PUBLICATION-HANDOFF-DECISION-v1.0.0';
export const VAP_W11_BASELINE = 'd150a741231abe608a0d994e9e5787e6c71cfc3d';
export const VAP_W11_BATCH_CODE = 'VAP-ARTICLE-BATCH-001';
export const VAP_W11_LOCALE = 'zh-Hans';
export const VAP_W11_EXPECTED_NODE_CODES = Object.freeze([
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
]);
export const VAP_W11_ALLOWED_DECISIONS = Object.freeze(['publish', 'do_not_publish', 'defer']);
export const VAP_W11_PUBLICATION_AUTHORITY = 'TL Independent Publication Authority';

export const VAP_W11_PATHS = Object.freeze({
  w10Activation: 'content/production/visual-article/activation/vap-w10-human-approval-production-article-package-v1.json',
  w10PackageManifest: 'content/production/visual-article/packages/vap-article-batch-001-production-article-package-manifest-v1.json',
  publicationQueue: 'content/production/visual-article/publication/vap-w11-batch-001-publication-handoff-queue-v1.json',
  decisions: 'content/production/visual-article/decisions/vap-w11-batch-001-human-publication-decisions-v1.json',
  authorizationManifest: 'content/production/visual-article/publication/vap-w11-batch-001-publication-authorization-manifest-v1.json',
  activation: 'content/production/visual-article/activation/vap-w11-publication-handoff-decision-v1.json',
  pjaPublicationRegistry: 'content/knowledge/production/registry/publication-registry.json',
  publishedAuthorityRegistry: 'content/knowledge/public/authority/published-knowledge-authority.json'
});

const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = async (root, rel) => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const exists = file => fs.access(file).then(() => true, () => false);
const shaBytes = bytes => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
const candidatePath = nodeCode => `content/knowledge/production/candidates/${VAP_W11_LOCALE}/${nodeCode}/candidate.v1.json`;
const reviewPath = nodeCode => `content/knowledge/production/reviews/${VAP_W11_LOCALE}/${nodeCode}/review.v1.json`;
const approvalPath = nodeCode => `content/knowledge/production/approvals/${VAP_W11_LOCALE}/${nodeCode}/approval.v1.json`;
const productionPackagePath = nodeCode => `content/production/visual-article/packages/${VAP_W11_LOCALE}/${nodeCode}/production-article-package.v1.json`;
const productionBodyPath = nodeCode => `content/production/visual-article/packages/${VAP_W11_LOCALE}/${nodeCode}/article.md`;
const canonicalBriefPath = nodeCode => `content/knowledge/production/briefs/${VAP_W11_LOCALE}/${nodeCode}-production-brief.v2.json`;
const handoffPath = nodeCode => `content/production/visual-article/publication/${VAP_W11_LOCALE}/${nodeCode}/publication-handoff.v1.json`;
const publicationPath = nodeCode => `content/knowledge/production/publications/${VAP_W11_LOCALE}/${nodeCode}/publication.v1.json`;

function withShaPrefix(hex) { return String(hex).startsWith('sha256:') ? String(hex) : `sha256:${hex}`; }
function withoutDigest(value, field) { const copy = structuredClone(value); delete copy[field]; return copy; }
function digestWithPrefix(value) { return withShaPrefix(digest(value)); }
export function computePublicationQueueDigest(value) { return digestWithPrefix(withoutDigest(value, 'publicationQueueDigest')); }
export function computePublicationHandoffDigest(value) { return digestWithPrefix(withoutDigest(value, 'handoffDigest')); }

function articleCodeFor(nodeCode) { return `KA-${nodeCode.replace(/^KN-/, '')}-ZH-ARTICLE`; }
function publicationIdentityFromBrief(nodeCode, brief, productionPackage) {
  return {
    articleCode: articleCodeFor(nodeCode),
    slug: brief.localizedIdentity.slug,
    href: `/articles/${brief.localizedIdentity.slug}`,
    version: productionPackage.binding.productionPackageVersion || '1.0.0',
    publicationBookCode: productionPackage.binding.publicationBookCode,
    publicationPartCode: productionPackage.binding.publicationPartCode,
    targetPublicationLocale: productionPackage.binding.targetPublicationLocale
  };
}

async function buildEntry(root, nodeCode, index, publicationRegistry) {
  const [candidate, review, approval, productionPackage, articleBody] = await Promise.all([
    readJson(root, candidatePath(nodeCode)),
    readJson(root, reviewPath(nodeCode)),
    readJson(root, approvalPath(nodeCode)),
    readJson(root, productionPackagePath(nodeCode)),
    fs.readFile(path.join(root, productionBodyPath(nodeCode)), 'utf8')
  ]);
  const packageValidation = validateProductionArticlePackage(productionPackage, { candidate, review, approval, articleBody });
  if (!packageValidation.valid) throw fail('VAP_W11_PRODUCTION_PACKAGE_INVALID', `${nodeCode}:${JSON.stringify(packageValidation.errors)}`);
  if (productionPackage.packageState !== 'human_approved_not_published') throw fail('VAP_W11_PRODUCTION_PACKAGE_NOT_APPROVED', nodeCode);
  if (approval.decision !== 'approve' || review.decision !== 'accept') throw fail('VAP_W11_HUMAN_AUTHORITY_CHAIN_INCOMPLETE', nodeCode);
  if (articleBody !== candidate.article.bodyMarkdown) throw fail('VAP_W11_ARTICLE_BODY_MUTATED', nodeCode);

  const sourceBrief = candidate.sourceBrief ?? {};
  if (sourceBrief.briefSchemaVersion !== 'PHI-OS-CANONICAL-PRODUCTION-BRIEF-v2.0.0' || !sourceBrief.repositoryCommit) throw fail('VAP_W11_CANONICAL_BRIEF_BINDING_REQUIRED', nodeCode);
  const canonicalBrief = await readJson(root, canonicalBriefPath(nodeCode));
  if (canonicalBrief.briefCode !== sourceBrief.briefCode || canonicalBrief.briefDigest !== sourceBrief.briefDigest) throw fail('VAP_W11_CANONICAL_BRIEF_DIGEST_MISMATCH', nodeCode);
  const target = publicationIdentityFromBrief(nodeCode, canonicalBrief, productionPackage);
  const existingPublication = publicationRegistry.records.find(record => record.nodeCode === nodeCode && record.locale === VAP_W11_LOCALE) ?? null;

  return {
    publicationIndex: index + 1,
    nodeCode,
    locale: VAP_W11_LOCALE,
    title: candidate.article.title,
    productionArticlePackage: {
      path: productionPackagePath(nodeCode),
      packageCode: productionPackage.packageCode,
      packageDigest: productionPackage.packageDigest,
      packageState: productionPackage.packageState,
      bodyPath: productionBodyPath(nodeCode),
      bodyDigest: productionPackage.article.bodyDigest
    },
    candidate: { path: candidatePath(nodeCode), candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest },
    review: { path: reviewPath(nodeCode), reviewCode: review.reviewCode, reviewDigest: review.reviewDigest, decision: review.decision, reviewerCode: review.reviewer.reviewerCode },
    approval: { path: approvalPath(nodeCode), approvalCode: approval.approvalCode, approvalDigest: approval.approvalDigest, decision: approval.decision, approverCode: approval.approver.approverCode },
    canonicalBrief: {
      path: canonicalBriefPath(nodeCode), briefCode: canonicalBrief.briefCode, briefDigest: canonicalBrief.briefDigest,
      briefSchemaVersion: canonicalBrief.briefSchemaVersion, repositoryCommit: canonicalBrief.repositoryCommit,
      deterministicallyReconstructed: true, exactCandidateDigestMatch: true
    },
    targetPublication: target,
    preconditions: [
      { code: 'HUMAN_EDITORIAL_REVIEW_ACCEPTED', status: 'satisfied' },
      { code: 'HUMAN_APPROVAL_RECORDED', status: 'satisfied' },
      { code: 'PRODUCTION_ARTICLE_PACKAGE_VALID', status: 'satisfied' },
      { code: 'CANONICAL_BRIEF_V2_EXACT_DIGEST_BOUND', status: 'satisfied' },
      { code: 'PUBLICATION_IDENTITY_RESOLVED', status: 'satisfied' }
    ],
    pjaPublicationRuntimeExecutionReady: true,
    publicationDecisionState: 'pending_human',
    existingPublicationCode: existingPublication?.publicationCode ?? null,
    publicationRecorded: Boolean(existingPublication),
    publicProjectionRecordedByW11: false
  };
}

export async function buildVapW11PublicationQueue(root) {
  const [w10Activation, w10Manifest, publicationRegistry] = await Promise.all([
    readJson(root, VAP_W11_PATHS.w10Activation),
    readJson(root, VAP_W11_PATHS.w10PackageManifest),
    readJson(root, VAP_W11_PATHS.pjaPublicationRegistry)
  ]);
  if (w10Activation.status !== 'SIX_HUMAN_APPROVED_PRODUCTION_ARTICLE_PACKAGES_READY_FOR_PUBLICATION_GOVERNANCE' || w10Activation.humanApprovedCount !== 6 || w10Activation.productionArticlePackageCount !== 6) throw fail('VAP_W11_W10_ACTIVATION_NOT_READY', w10Activation.status);
  if (w10Manifest.status !== w10Activation.status || w10Manifest.approvedCount !== 6 || w10Manifest.productionArticlePackageCount !== 6) throw fail('VAP_W11_W10_MANIFEST_NOT_READY', w10Manifest.status);
  const entries = [];
  for (let i = 0; i < VAP_W11_EXPECTED_NODE_CODES.length; i++) entries.push(await buildEntry(root, VAP_W11_EXPECTED_NODE_CODES[i], i, publicationRegistry));
  const payload = {
    schemaVersion: 'PHI-OS-VAP-W11-PUBLICATION-HANDOFF-QUEUE-v1.0.0',
    work: 'VAP-W11', baselineCommit: VAP_W11_BASELINE, batchCode: VAP_W11_BATCH_CODE, locale: VAP_W11_LOCALE,
    status: 'READY_FOR_EXPLICIT_HUMAN_PUBLICATION_DECISION',
    publicationAuthority: VAP_W11_PUBLICATION_AUTHORITY,
    bulkPublicationDecisionAllowed: false,
    oneIndependentDecisionPerNode: true,
    humanApprovalDoesNotEqualPublication: true,
    humanPublicationDecisionDoesNotEqualPublicationRecord: true,
    pjaPublicationRuntimeRequiredAfterPublishDecision: true,
    publicProjectionAllowedByW11: false,
    entries
  };
  return { ...payload, publicationQueueDigest: computePublicationQueueDigest(payload) };
}

export function validateFrozenPublicationQueueLineage(frozen, current) {
  const errors = [], add = (code, message) => errors.push({ code, message });
  if (frozen?.publicationQueueDigest !== computePublicationQueueDigest(frozen)) add('VAP_W11_FROZEN_QUEUE_DIGEST_INVALID', 'publicationQueueDigest');
  if (frozen?.batchCode !== current?.batchCode || frozen?.locale !== current?.locale) add('VAP_W11_FROZEN_QUEUE_IDENTITY_INVALID', 'batch/locale');
  if (!Array.isArray(frozen?.entries) || frozen.entries.length !== VAP_W11_EXPECTED_NODE_CODES.length) add('VAP_W11_FROZEN_QUEUE_SCOPE_INVALID', 'entries');
  for (const nodeCode of VAP_W11_EXPECTED_NODE_CODES) {
    const a = frozen?.entries?.find(item => item.nodeCode === nodeCode), b = current?.entries?.find(item => item.nodeCode === nodeCode);
    if (!a || !b) { add('VAP_W11_FROZEN_QUEUE_NODE_MISSING', nodeCode); continue; }
    for (const [label, av, bv] of [
      ['packageDigest', a.productionArticlePackage?.packageDigest, b.productionArticlePackage?.packageDigest],
      ['candidateDigest', a.candidate?.candidateDigest, b.candidate?.candidateDigest],
      ['reviewDigest', a.review?.reviewDigest, b.review?.reviewDigest],
      ['approvalDigest', a.approval?.approvalDigest, b.approval?.approvalDigest],
      ['briefDigest', a.canonicalBrief?.briefDigest, b.canonicalBrief?.briefDigest],
      ['articleCode', a.targetPublication?.articleCode, b.targetPublication?.articleCode],
      ['slug', a.targetPublication?.slug, b.targetPublication?.slug],
      ['href', a.targetPublication?.href, b.targetPublication?.href],
      ['publicationBookCode', a.targetPublication?.publicationBookCode, b.targetPublication?.publicationBookCode],
      ['publicationPartCode', a.targetPublication?.publicationPartCode, b.targetPublication?.publicationPartCode]
    ]) if (av !== bv) add('VAP_W11_FROZEN_QUEUE_LINEAGE_DRIFT', `${nodeCode}:${label}`);
  }
  return { valid: errors.length === 0, errors };
}

export function buildPendingPublicationDecisionEnvelope(queue) {
  return {
    schemaVersion: 'PHI-OS-VAP-W11-HUMAN-PUBLICATION-DECISIONS-v1.0.0',
    work: 'VAP-W11', batchCode: queue.batchCode, locale: queue.locale,
    decisionEnvelopeCode: 'PHI-OS-VAP-W11-BATCH-001-HUMAN-PUBLICATION-DECISIONS-v1',
    publicationQueueDigest: queue.publicationQueueDigest,
    bulkPublicationDecisionAllowed: false,
    oneIndependentDecisionPerNode: true,
    status: 'PENDING_HUMAN_PUBLICATION_DECISION',
    entries: queue.entries.map(item => ({
      nodeCode: item.nodeCode,
      decisionCode: `VAP-W11-${item.nodeCode}-HUMAN-PUBLICATION-DECISION-001`,
      productionArticlePackageCode: item.productionArticlePackage.packageCode,
      productionArticlePackageDigest: item.productionArticlePackage.packageDigest,
      candidateCode: item.candidate.candidateCode,
      candidateDigest: item.candidate.candidateDigest,
      approvalCode: item.approval.approvalCode,
      approvalDigest: item.approval.approvalDigest,
      targetArticleCode: item.targetPublication.articleCode,
      targetSlug: item.targetPublication.slug,
      decisionState: 'pending_human', decision: null,
      publisherCode: null, publisherAuthority: null, decidedAt: null, summary: null
    }))
  };
}

const automationActors = new Set(['ai', 'system', 'automation', 'chatgpt', 'codex']);
export function validatePublicationDecisionEnvelope(envelope, queue, { requireAllDecided = false } = {}) {
  const errors = [], add = (code, message) => errors.push({ code, message });
  if (envelope?.publicationQueueDigest !== queue?.publicationQueueDigest) add('VAP_W11_DECISION_QUEUE_DIGEST_MISMATCH', 'publicationQueueDigest');
  if (envelope?.batchCode !== queue?.batchCode || envelope?.locale !== queue?.locale) add('VAP_W11_DECISION_IDENTITY_MISMATCH', 'batch/locale');
  if (envelope?.bulkPublicationDecisionAllowed !== false || envelope?.oneIndependentDecisionPerNode !== true) add('VAP_W11_BULK_PUBLICATION_DECISION_FORBIDDEN', 'decision envelope');
  if (!Array.isArray(envelope?.entries) || envelope.entries.length !== VAP_W11_EXPECTED_NODE_CODES.length) add('VAP_W11_DECISION_SCOPE_INVALID', 'entries');
  const seen = new Set();
  for (const q of queue.entries) {
    const entry = envelope?.entries?.find(item => item.nodeCode === q.nodeCode);
    if (!entry || seen.has(q.nodeCode)) { add('VAP_W11_DECISION_NODE_MISSING_OR_DUPLICATE', q.nodeCode); continue; }
    seen.add(q.nodeCode);
    if (entry.productionArticlePackageCode !== q.productionArticlePackage.packageCode || entry.productionArticlePackageDigest !== q.productionArticlePackage.packageDigest) add('VAP_W11_DECISION_PACKAGE_BINDING_INVALID', q.nodeCode);
    if (entry.candidateCode !== q.candidate.candidateCode || entry.candidateDigest !== q.candidate.candidateDigest) add('VAP_W11_DECISION_CANDIDATE_BINDING_INVALID', q.nodeCode);
    if (entry.approvalCode !== q.approval.approvalCode || entry.approvalDigest !== q.approval.approvalDigest) add('VAP_W11_DECISION_APPROVAL_BINDING_INVALID', q.nodeCode);
    if (entry.targetArticleCode !== q.targetPublication.articleCode || entry.targetSlug !== q.targetPublication.slug) add('VAP_W11_DECISION_PUBLICATION_IDENTITY_INVALID', q.nodeCode);
    if (entry.decisionState === 'pending_human') {
      if (requireAllDecided) add('VAP_W11_EXPLICIT_HUMAN_PUBLICATION_DECISION_REQUIRED', q.nodeCode);
      if (entry.decision !== null || entry.publisherCode !== null || entry.publisherAuthority !== null || entry.decidedAt !== null || entry.summary !== null) add('VAP_W11_PENDING_DECISION_MUST_BE_EMPTY', q.nodeCode);
      continue;
    }
    if (entry.decisionState !== 'human_decided' || !VAP_W11_ALLOWED_DECISIONS.includes(entry.decision)) { add('VAP_W11_HUMAN_PUBLICATION_DECISION_INVALID', q.nodeCode); continue; }
    if (!entry.publisherCode || automationActors.has(String(entry.publisherCode).trim().toLowerCase())) add('VAP_W11_REAL_HUMAN_PUBLISHER_REQUIRED', q.nodeCode);
    if (entry.publisherCode !== 'TL' || entry.publisherAuthority !== VAP_W11_PUBLICATION_AUTHORITY) add('VAP_W11_PUBLICATION_AUTHORITY_REQUIRED', q.nodeCode);
    if (!entry.decidedAt || Number.isNaN(Date.parse(entry.decidedAt))) add('VAP_W11_PUBLICATION_DECISION_TIMESTAMP_INVALID', q.nodeCode);
    if (typeof entry.summary !== 'string' || !entry.summary.trim()) add('VAP_W11_PUBLICATION_DECISION_SUMMARY_REQUIRED', q.nodeCode);
    if (entry.decision === 'publish' && (!q.pjaPublicationRuntimeExecutionReady || q.preconditions.some(condition => condition.status !== 'satisfied'))) add('VAP_W11_PUBLICATION_EXECUTION_PRECONDITION_BLOCKED', q.nodeCode);
  }
  return { valid: errors.length === 0, errors };
}

export function buildPublicationHandoff(queueEntry, decision) {
  const payload = {
    schemaVersion: 'PHI-OS-VAP-W11-PUBLICATION-HANDOFF-v1.0.0',
    handoffType: 'human_publication_decision_to_pja_publication_runtime',
    handoffCode: `VAP-W11-HANDOFF-${queueEntry.nodeCode}-ZH-HANS-V1`,
    work: 'VAP-W11', batchCode: VAP_W11_BATCH_CODE, nodeCode: queueEntry.nodeCode, locale: queueEntry.locale,
    authorizationState: decision.decision === 'publish' ? 'authorized_for_pja_publication_runtime' : decision.decision === 'defer' ? 'deferred_by_human_publication_authority' : 'not_authorized_by_human_publication_authority',
    pjaPublicationRuntimeExecutionEligible: decision.decision === 'publish',
    publicationDecision: {
      decisionCode: decision.decisionCode, decision: decision.decision, decisionState: decision.decisionState,
      publisherCode: decision.publisherCode, publisherAuthority: decision.publisherAuthority, decidedAt: decision.decidedAt, summary: decision.summary
    },
    productionArticlePackage: queueEntry.productionArticlePackage,
    candidate: queueEntry.candidate,
    review: queueEntry.review,
    approval: queueEntry.approval,
    canonicalBrief: queueEntry.canonicalBrief,
    targetPublication: queueEntry.targetPublication,
    authority: { humanPublicationDecisionRecorded: true, publicationRecorded: false, publicProjectionRecorded: false },
    governance: {
      humanPublicationDecisionIsPublicationRecord: false,
      handoffIsPublicationRecord: false,
      pjaPublicationRuntimeBypassAllowed: false,
      articleBodyMutationAllowed: false,
      publishedAuthorityProjectionAllowed: false
    },
    nextAuthority: decision.decision === 'publish' ? 'PJA Publication Runtime' : 'TL Independent Publication Authority',
    nextWork: decision.decision === 'publish' ? 'VAP-W12_PJA_PUBLICATION_EXECUTION' : 'VAP-W11_PUBLICATION_DECISION_RESOLUTION'
  };
  return { ...payload, handoffDigest: computePublicationHandoffDigest(payload) };
}

export function validatePublicationHandoff(handoff, queueEntry, decision) {
  const errors = [], add = (code, message) => errors.push({ code, message });
  if (handoff?.schemaVersion !== 'PHI-OS-VAP-W11-PUBLICATION-HANDOFF-v1.0.0') add('VAP_W11_HANDOFF_SCHEMA_INVALID', queueEntry.nodeCode);
  if (handoff?.nodeCode !== queueEntry.nodeCode || handoff?.locale !== queueEntry.locale) add('VAP_W11_HANDOFF_IDENTITY_INVALID', queueEntry.nodeCode);
  if (handoff?.handoffDigest !== computePublicationHandoffDigest(handoff)) add('VAP_W11_HANDOFF_DIGEST_INVALID', queueEntry.nodeCode);
  if (handoff?.publicationDecision?.decisionCode !== decision.decisionCode || handoff?.publicationDecision?.decision !== decision.decision || handoff?.publicationDecision?.publisherCode !== decision.publisherCode) add('VAP_W11_HANDOFF_DECISION_BINDING_INVALID', queueEntry.nodeCode);
  if (handoff?.productionArticlePackage?.packageDigest !== queueEntry.productionArticlePackage.packageDigest || handoff?.candidate?.candidateDigest !== queueEntry.candidate.candidateDigest || handoff?.approval?.approvalDigest !== queueEntry.approval.approvalDigest || handoff?.canonicalBrief?.briefDigest !== queueEntry.canonicalBrief.briefDigest) add('VAP_W11_HANDOFF_LINEAGE_INVALID', queueEntry.nodeCode);
  if (handoff?.targetPublication?.articleCode !== queueEntry.targetPublication.articleCode || handoff?.targetPublication?.slug !== queueEntry.targetPublication.slug) add('VAP_W11_HANDOFF_TARGET_INVALID', queueEntry.nodeCode);
  if (handoff?.authority?.publicationRecorded !== false || handoff?.authority?.publicProjectionRecorded !== false || handoff?.governance?.humanPublicationDecisionIsPublicationRecord !== false || handoff?.governance?.handoffIsPublicationRecord !== false || handoff?.governance?.pjaPublicationRuntimeBypassAllowed !== false || handoff?.governance?.publishedAuthorityProjectionAllowed !== false) add('VAP_W11_HANDOFF_AUTHORITY_BOUNDARY_INVALID', queueEntry.nodeCode);
  const eligible = decision.decision === 'publish';
  if (handoff?.pjaPublicationRuntimeExecutionEligible !== eligible) add('VAP_W11_HANDOFF_EXECUTION_ELIGIBILITY_INVALID', queueEntry.nodeCode);
  return { valid: errors.length === 0, errors };
}

async function atomicWrite(target, text) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await fs.writeFile(temp, text, { flag: 'wx' });
  await fs.rename(temp, target);
}
async function preflightEquivalent(target, text, code) {
  if (!(await exists(target))) return 'create';
  if ((await fs.readFile(target, 'utf8')) !== text) throw fail(code, target);
  return 'existing_byte_equivalent';
}

export async function materializeBoundCanonicalBriefs(root, queue, { apply = false, targetRoot = root } = {}) {
  const outcomes = [];
  for (const entry of queue.entries) {
    const candidate = await readJson(root, entry.candidate.path);
    const brief = await readJson(root, canonicalBriefPath(entry.nodeCode));
    if (brief.briefDigest !== entry.canonicalBrief.briefDigest || brief.briefDigest !== candidate.sourceBrief.briefDigest) throw fail('VAP_W11_CANONICAL_BRIEF_MATERIALIZATION_DIGEST_MISMATCH', entry.nodeCode);
    const text = serialize(brief), target = path.join(targetRoot, entry.canonicalBrief.path);
    const state = await preflightEquivalent(target, text, 'VAP_W11_CANONICAL_BRIEF_CONFLICT');
    if (apply && state === 'create') await atomicWrite(target, text);
    outcomes.push({ nodeCode: entry.nodeCode, path: entry.canonicalBrief.path, briefDigest: brief.briefDigest, state });
  }
  return outcomes;
}

export async function resolveDecisionInputQueue(root, decisionEnvelope) {
  const currentQueue = await buildVapW11PublicationQueue(root);
  const queueFile = path.join(root, VAP_W11_PATHS.publicationQueue);
  if (!(await exists(queueFile))) return { queue: currentQueue, currentQueue };
  const frozen = await readJson(root, VAP_W11_PATHS.publicationQueue);
  const validation = validateFrozenPublicationQueueLineage(frozen, currentQueue);
  if (!validation.valid) throw fail('VAP_W11_FROZEN_PUBLICATION_QUEUE_INVALID', JSON.stringify(validation.errors));
  if (decisionEnvelope?.publicationQueueDigest !== frozen.publicationQueueDigest) throw fail('VAP_W11_DECISION_NOT_BOUND_TO_FROZEN_QUEUE', decisionEnvelope?.publicationQueueDigest ?? 'missing');
  return { queue: frozen, currentQueue };
}

export async function applyVapW11(root, decisionEnvelope, { apply = false, targetRoot = root } = {}) {
  const { queue } = await resolveDecisionInputQueue(root, decisionEnvelope);
  const decisionValidation = validatePublicationDecisionEnvelope(decisionEnvelope, queue, { requireAllDecided: true });
  if (!decisionValidation.valid) throw fail('VAP_W11_HUMAN_PUBLICATION_DECISIONS_INVALID', JSON.stringify(decisionValidation.errors));
  const [publicationRegistryBefore, publishedAuthorityBefore] = await Promise.all([
    readJson(root, VAP_W11_PATHS.pjaPublicationRegistry), readJson(root, VAP_W11_PATHS.publishedAuthorityRegistry)
  ]);
  const publicationRegistryDigestBefore = digest(publicationRegistryBefore), publishedAuthorityDigestBefore = digest(publishedAuthorityBefore);
  const outcomes = [];
  for (const q of queue.entries) {
    const decision = decisionEnvelope.entries.find(item => item.nodeCode === q.nodeCode);
    const handoff = buildPublicationHandoff(q, decision);
    const validation = validatePublicationHandoff(handoff, q, decision);
    if (!validation.valid) throw fail('VAP_W11_PUBLICATION_HANDOFF_INVALID', `${q.nodeCode}:${JSON.stringify(validation.errors)}`);
    outcomes.push({ nodeCode: q.nodeCode, decision: decision.decision, handoff, handoffPath: handoffPath(q.nodeCode), pjaPublicationRuntimeExecutionEligible: handoff.pjaPublicationRuntimeExecutionEligible });
  }
  const publishAuthorizedCount = outcomes.filter(item => item.decision === 'publish').length;
  const manifest = {
    schemaVersion: 'PHI-OS-VAP-W11-PUBLICATION-AUTHORIZATION-MANIFEST-v1.0.0', work: 'VAP-W11', batchCode: VAP_W11_BATCH_CODE, locale: VAP_W11_LOCALE,
    status: publishAuthorizedCount === 6 ? 'SIX_HUMAN_PUBLICATION_DECISIONS_AUTHORIZE_PJA_PUBLICATION_EXECUTION' : 'HUMAN_PUBLICATION_DECISIONS_RECORDED_WITH_NON_PUBLISH_OUTCOMES',
    humanPublicationDecisionCount: outcomes.length, publishAuthorizedCount,
    doNotPublishCount: outcomes.filter(item => item.decision === 'do_not_publish').length,
    deferredCount: outcomes.filter(item => item.decision === 'defer').length,
    publicationHandoffCount: outcomes.length,
    pjaPublicationRecordCountCreatedByW11: 0,
    publicProjectionCountCreatedByW11: 0,
    authorizationMeaning: 'human_publication_decision_and_exact_handoff_only_not_publication_record',
    entries: outcomes.map(item => ({ nodeCode: item.nodeCode, decision: item.decision, handoffPath: item.handoffPath, handoffDigest: item.handoff.handoffDigest, pjaPublicationRuntimeExecutionEligible: item.pjaPublicationRuntimeExecutionEligible, publicationRecordedByW11: false, publicProjectionRecordedByW11: false }))
  };
  const activation = {
    schemaVersion: 'PHI-OS-VAP-W11-ACTIVATION-v1.0.0', work: 'VAP-W11', batchCode: VAP_W11_BATCH_CODE, locale: VAP_W11_LOCALE,
    status: manifest.status,
    publicationEligibleCount: 6,
    humanPublicationDecisionCount: outcomes.length,
    publishAuthorizedCount,
    publicationHandoffCount: outcomes.length,
    pjaPublicationRecordCountCreatedByW11: 0,
    publicProjectionCountCreatedByW11: 0,
    canonicalBriefMaterializedCount: 6,
    pjaPublicationRegistryMutated: false,
    publishedKnowledgeAuthorityMutated: false,
    nextAuthority: publishAuthorizedCount ? 'PJA Publication Runtime' : 'TL Independent Publication Authority',
    nextWork: publishAuthorizedCount ? 'VAP-W12_PJA_PUBLICATION_EXECUTION_AND_PUBLISHED_AUTHORITY_PROJECTION' : 'VAP-W11_PUBLICATION_DECISION_RESOLUTION'
  };
  if (!apply) return { mode: 'dry-run', applied: false, queue, outcomes, manifest, activation };
  await materializeBoundCanonicalBriefs(root, queue, { apply: true, targetRoot });
  for (const outcome of outcomes) await preflightEquivalent(path.join(targetRoot, outcome.handoffPath), serialize(outcome.handoff), 'VAP_W11_HANDOFF_CONFLICT');
  for (const outcome of outcomes) { const target = path.join(targetRoot, outcome.handoffPath); if (!(await exists(target))) await atomicWrite(target, serialize(outcome.handoff)); }
  await atomicWrite(path.join(targetRoot, VAP_W11_PATHS.authorizationManifest), serialize(manifest));
  await atomicWrite(path.join(targetRoot, VAP_W11_PATHS.activation), serialize(activation));
  const [publicationRegistryAfter, publishedAuthorityAfter] = await Promise.all([
    readJson(root, VAP_W11_PATHS.pjaPublicationRegistry), readJson(root, VAP_W11_PATHS.publishedAuthorityRegistry)
  ]);
  if (digest(publicationRegistryAfter) !== publicationRegistryDigestBefore) throw fail('VAP_W11_PUBLICATION_REGISTRY_MUTATION_FORBIDDEN', VAP_W11_PATHS.pjaPublicationRegistry);
  if (digest(publishedAuthorityAfter) !== publishedAuthorityDigestBefore) throw fail('VAP_W11_PUBLISHED_AUTHORITY_MUTATION_FORBIDDEN', VAP_W11_PATHS.publishedAuthorityRegistry);
  return { mode: 'apply', applied: true, queue, outcomes, manifest, activation };
}

export async function buildPendingVapW11Projection(root) {
  const currentQueue = await buildVapW11PublicationQueue(root);
  let queue = currentQueue;
  if (await exists(path.join(root, VAP_W11_PATHS.publicationQueue))) {
    const frozen = await readJson(root, VAP_W11_PATHS.publicationQueue);
    const validation = validateFrozenPublicationQueueLineage(frozen, currentQueue);
    if (!validation.valid) throw fail('VAP_W11_FROZEN_PUBLICATION_QUEUE_INVALID', JSON.stringify(validation.errors));
    queue = frozen;
  }
  const decisions = await exists(path.join(root, VAP_W11_PATHS.decisions)) ? await readJson(root, VAP_W11_PATHS.decisions) : buildPendingPublicationDecisionEnvelope(queue);
  const validation = validatePublicationDecisionEnvelope(decisions, queue, { requireAllDecided: false });
  if (!validation.valid) throw fail('VAP_W11_PENDING_PUBLICATION_DECISIONS_INVALID', JSON.stringify(validation.errors));
  const decided = decisions.entries.filter(item => item.decisionState === 'human_decided');
  const fullyDecided = decided.length === VAP_W11_EXPECTED_NODE_CODES.length;
  if (fullyDecided) {
    const handoffsExist = (await Promise.all(VAP_W11_EXPECTED_NODE_CODES.map(code => exists(path.join(root, handoffPath(code)))))).every(Boolean);
    if (handoffsExist && await exists(path.join(root, VAP_W11_PATHS.authorizationManifest)) && await exists(path.join(root, VAP_W11_PATHS.activation))) {
      return { queue, decisions, manifest: await readJson(root, VAP_W11_PATHS.authorizationManifest), activation: await readJson(root, VAP_W11_PATHS.activation) };
    }
  }
  const manifest = {
    schemaVersion: 'PHI-OS-VAP-W11-PUBLICATION-AUTHORIZATION-MANIFEST-v1.0.0', work: 'VAP-W11', batchCode: VAP_W11_BATCH_CODE, locale: VAP_W11_LOCALE,
    status: decided.length ? 'HUMAN_PUBLICATION_DECISIONS_PRESENT_APPLY_REQUIRED' : 'AWAITING_EXPLICIT_HUMAN_PUBLICATION_DECISION',
    humanPublicationDecisionCount: 0, publishAuthorizedCount: 0, doNotPublishCount: 0, deferredCount: 0,
    publicationHandoffCount: 0, pjaPublicationRecordCountCreatedByW11: 0, publicProjectionCountCreatedByW11: 0,
    authorizationMeaning: 'human_publication_decision_and_exact_handoff_only_not_publication_record',
    entries: queue.entries.map(item => ({ nodeCode: item.nodeCode, decision: null, handoffPath: null, handoffDigest: null, pjaPublicationRuntimeExecutionEligible: false, publicationRecordedByW11: false, publicProjectionRecordedByW11: false }))
  };
  const activation = {
    schemaVersion: 'PHI-OS-VAP-W11-ACTIVATION-v1.0.0', work: 'VAP-W11', batchCode: VAP_W11_BATCH_CODE, locale: VAP_W11_LOCALE,
    status: manifest.status,
    publicationEligibleCount: 6, humanPublicationDecisionCount: 0, publishAuthorizedCount: 0, publicationHandoffCount: 0,
    pjaPublicationRecordCountCreatedByW11: 0, publicProjectionCountCreatedByW11: 0, canonicalBriefMaterializedCount: 6,
    pjaPublicationRegistryMutated: false, publishedKnowledgeAuthorityMutated: false,
    nextAuthority: VAP_W11_PUBLICATION_AUTHORITY, nextWork: 'VAP-W11_EXPLICIT_HUMAN_PUBLICATION_DECISIONS'
  };
  return { queue, decisions, manifest, activation };
}

export async function writePendingVapW11Projection(root, { apply = false } = {}) {
  const built = await buildPendingVapW11Projection(root);
  if (!apply) return { mode: 'dry-run', applied: false, ...built };
  await materializeBoundCanonicalBriefs(root, built.queue, { apply: true, targetRoot: root });
  if (!(await exists(path.join(root, VAP_W11_PATHS.publicationQueue)))) await atomicWrite(path.join(root, VAP_W11_PATHS.publicationQueue), serialize(built.queue));
  if (!(await exists(path.join(root, VAP_W11_PATHS.decisions)))) await atomicWrite(path.join(root, VAP_W11_PATHS.decisions), serialize(built.decisions));
  await atomicWrite(path.join(root, VAP_W11_PATHS.authorizationManifest), serialize(built.manifest));
  await atomicWrite(path.join(root, VAP_W11_PATHS.activation), serialize(built.activation));
  return { mode: 'apply', applied: true, ...built };
}

export async function resolveVapW11PublishedSuccessorAuthority(root, nodeCode) {
  const decisionFile = path.join(root, VAP_W11_PATHS.decisions);
  if (!(await exists(decisionFile))) return null;
  const decisions = await readJson(root, VAP_W11_PATHS.decisions);
  const decision = decisions.entries?.find(item => item.nodeCode === nodeCode);
  if (!decision || decision.decisionState !== 'human_decided' || decision.decision !== 'publish' || decision.publisherCode !== 'TL' || decision.publisherAuthority !== VAP_W11_PUBLICATION_AUTHORITY) return null;
  const registry = await readJson(root, VAP_W11_PATHS.pjaPublicationRegistry);
  const record = registry.records.find(item => item.nodeCode === nodeCode && item.locale === VAP_W11_LOCALE);
  if (!record) return { humanPublicationAuthorized: true, publicationRecorded: false, decision };
  const pPath = publicationPath(nodeCode);
  if (!(await exists(path.join(root, pPath)))) throw fail('VAP_W11_SUCCESSOR_PUBLICATION_PACKAGE_MISSING', nodeCode);
  const [publication, candidate, review, approval] = await Promise.all([readJson(root, pPath), readJson(root, candidatePath(nodeCode)), readJson(root, reviewPath(nodeCode)), readJson(root, approvalPath(nodeCode))]);
  const validation = validatePublication(publication, candidate, review, approval);
  if (!validation.valid || publication.publisher?.publisherCode !== 'TL' || record.publicationDigest !== publication.publicationDigest) throw fail('VAP_W11_SUCCESSOR_PUBLICATION_AUTHORITY_INVALID', `${nodeCode}:${JSON.stringify(validation.errors)}`);
  return { humanPublicationAuthorized: true, publicationRecorded: true, decision, publication, record };
}
