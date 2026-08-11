import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const VAP_W6A_BASELINE = '3dd903344945ecd3b585c8aafe48b93d7894caa9';
export const VAP_W6A_REVIEW = 'content/production/visual-article/review/vap-w6a-batch-001-human-review-v1.json';
export const VAP_W6A_DECISIONS = 'content/production/visual-article/decisions/vap-w6a-batch-001-human-decisions-v1.json';
export const VAP_W6A_BATCH_CODE = 'VAP-ARTICLE-BATCH-001';
export const VAP_W6A_NODE_CODES = Object.freeze([
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
]);

const automationActors = new Set(['ai', 'system', 'automation', 'chatgpt', 'codex']);
const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
const canonicalJson = value => JSON.stringify(stableValue(value));
export const proposalContentHash = value => `sha256:${crypto.createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`;
const coded = (code, detail = null) => Object.assign(new Error(code), { code, detail });

export function loadVapW6aHumanAuthority(root, { reviewOverride = null, decisionOverride = null } = {}) {
  const review = reviewOverride ?? readJson(root, VAP_W6A_REVIEW);
  const decisions = decisionOverride ?? readJson(root, VAP_W6A_DECISIONS);
  if (review.batchCode !== VAP_W6A_BATCH_CODE || decisions.batchCode !== VAP_W6A_BATCH_CODE) throw coded('VAP_W6A_BATCH_CODE_MISMATCH');
  if (review.baselineCommit !== VAP_W6A_BASELINE) throw coded('VAP_W6A_REVIEW_BASELINE_MISMATCH');
  if (!Array.isArray(review.entries) || review.entries.length !== VAP_W6A_NODE_CODES.length) throw coded('VAP_W6A_REVIEW_SCOPE_INVALID');
  if (!Array.isArray(decisions.entries) || decisions.entries.length !== VAP_W6A_NODE_CODES.length) throw coded('VAP_W6A_DECISION_SCOPE_INVALID');
  if (review.entries.some((entry, index) => entry.nodeCode !== VAP_W6A_NODE_CODES[index])) throw coded('VAP_W6A_REVIEW_ORDER_INVALID');
  if (decisions.entries.some((entry, index) => entry.nodeCode !== VAP_W6A_NODE_CODES[index])) throw coded('VAP_W6A_DECISION_ORDER_INVALID');

  const reviewByNode = new Map(review.entries.map(entry => [entry.nodeCode, entry]));
  const approvedEditorialByNode = new Map();
  const approvedProductionByNode = new Map();
  const pendingNodeCodes = [];
  const invalidNodeCodes = [];

  for (const decision of decisions.entries) {
    const proposal = reviewByNode.get(decision.nodeCode);
    if (!proposal) throw coded('VAP_W6A_REVIEW_ENTRY_MISSING', decision.nodeCode);
    const actualHash = proposalContentHash(proposal.proposedContent);
    if (proposal.proposalContentHash !== actualHash || decision.proposalContentHash !== actualHash) throw coded('VAP_W6A_PROPOSAL_HASH_MISMATCH', decision.nodeCode);
    if (decision.decisionState === 'pending_human') {
      pendingNodeCodes.push(decision.nodeCode);
      continue;
    }
    if (decision.decisionState !== 'human_approved') {
      invalidNodeCodes.push(decision.nodeCode);
      continue;
    }
    validateHumanApprovedDecision(decision);
    approvedProductionByNode.set(decision.nodeCode, {
      ...decision,
      approved: true,
      source: VAP_W6A_DECISIONS
    });
    approvedEditorialByNode.set(decision.nodeCode, synthesizeEditorialResolutionEntry(proposal, decision));
  }

  return {
    review,
    decisions,
    reviewByNode,
    approvedEditorialByNode,
    approvedProductionByNode,
    pendingNodeCodes,
    invalidNodeCodes,
    approvedNodeCodes: VAP_W6A_NODE_CODES.filter(code => approvedProductionByNode.has(code) && approvedEditorialByNode.has(code))
  };
}

function validateHumanApprovedDecision(decision) {
  if (!decision.actor || automationActors.has(String(decision.actor).trim().toLowerCase())) throw coded('VAP_W6A_REAL_HUMAN_REQUIRED', decision.nodeCode);
  if (decision.productionActorRole !== 'HUMAN_PRODUCTION_AUTHORITY') throw coded('VAP_W6A_HUMAN_PRODUCTION_ROLE_REQUIRED', decision.nodeCode);
  if (decision.editorialActorRole !== 'HUMAN_EDITORIAL_AUTHORITY') throw coded('VAP_W6A_HUMAN_EDITORIAL_ROLE_REQUIRED', decision.nodeCode);
  if (!decision.decidedAt || Number.isNaN(Date.parse(decision.decidedAt))) throw coded('VAP_W6A_HUMAN_TIMESTAMP_REQUIRED', decision.nodeCode);
  if (!decision.rationale || !String(decision.rationale).trim()) throw coded('VAP_W6A_HUMAN_RATIONALE_REQUIRED', decision.nodeCode);
  if (decision.productionDecision !== 'approve_for_production') throw coded('VAP_W6A_ARTICLE_PRODUCTION_APPROVAL_REQUIRED', decision.nodeCode);
  if (decision.productionRole !== 'ARTICLE') throw coded('VAP_W6A_ARTICLE_ROLE_REQUIRED', decision.nodeCode);
  if (JSON.stringify(decision.requiredOutputs) !== JSON.stringify(['ARTICLE'])) throw coded('VAP_W6A_ARTICLE_OUTPUT_REQUIRED', decision.nodeCode);
  if (decision.dispatchTarget !== 'PJA') throw coded('VAP_W6A_PJA_DISPATCH_REQUIRED', decision.nodeCode);
  if (decision.c2FreezeDecision !== 'freeze_approved') throw coded('VAP_W6A_C2_FREEZE_APPROVAL_REQUIRED', decision.nodeCode);
  if (decision.manuscriptMappingDecision !== 'range_approved') throw coded('VAP_W6A_MAPPING_APPROVAL_REQUIRED', decision.nodeCode);
}

function synthesizeEditorialResolutionEntry(proposal, decision) {
  return {
    nodeCode: proposal.nodeCode,
    titleZhHans: proposal.titleZhHans,
    knowledgeVersion: proposal.knowledgeVersion,
    locale: proposal.locale,
    reviewPackageCode: `VAP-W6A-${proposal.nodeCode}-C2-REVIEW`,
    approvalState: 'human_approved',
    sourceAuthorities: [
      VAP_W6A_REVIEW,
      proposal.manuscriptMappingReview.reference
    ],
    supportingEvidenceReferences: [],
    manuscriptMappingReview: {
      ...proposal.manuscriptMappingReview,
      humanVerified: true,
      reviewedBy: decision.actor,
      reviewedAt: decision.decidedAt,
      decision: 'range_approved'
    },
    proposedContent: proposal.proposedContent,
    proposalContentHash: proposal.proposalContentHash,
    reviewDimensionProposals: proposal.reviewDimensionProposals.map(item => ({
      ...item,
      state: 'HUMAN_APPROVED',
      humanFinding: decision.rationale
    })),
    humanDecision: {
      decision: 'freeze_approved',
      actor: decision.actor,
      actorRole: 'HUMAN_EDITORIAL_AUTHORITY',
      decidedAt: decision.decidedAt,
      rationale: decision.rationale,
      contentHash: proposal.proposalContentHash
    },
    publicationReconciliationProposal: 'NO_EXISTING_PUBLICATION',
    promotionAllowed: true,
    authoritySource: VAP_W6A_DECISIONS
  };
}

export function resolveVapW6aEditorialApprovals(root, overrides = {}) {
  return loadVapW6aHumanAuthority(root, overrides).approvedEditorialByNode;
}

export function resolveVapW6aProductionDecision(root, nodeCode, overrides = {}) {
  return loadVapW6aHumanAuthority(root, overrides).approvedProductionByNode.get(nodeCode) ?? null;
}
