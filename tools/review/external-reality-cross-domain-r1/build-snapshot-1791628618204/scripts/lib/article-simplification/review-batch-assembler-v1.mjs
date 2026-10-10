import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { stableJson } from './single-readiness-v1.mjs';

export const APS5_BASELINE = '655a6136919fa820f6d064237cf01a8fc4f8f667';
export const APS5_CONTRACT = 'content/production/article-simplification/contracts/aps-5-review-batch-assembly-contract-v1.json';
export const APS5_ALLOWED_PUBLICATION_DECISIONS = Object.freeze(['publish', 'do_not_publish', 'defer']);

const normalize = source => String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
const abs = (root, relative) => path.join(root, relative);
const exists = (root, relative) => fs.existsSync(abs(root, relative));
const readJson = (root, relative) => JSON.parse(fs.readFileSync(abs(root, relative), 'utf8'));
const fileDigest = (root, relative) => exists(root, relative) ? `sha256:${sha(fs.readFileSync(abs(root, relative), 'utf8'))}` : null;

function packagePath(nodeCode, locale) {
  return `content/production/visual-article/packages/${locale}/${nodeCode}/production-article-package.v1.json`;
}

function productionPackage(root, { nodeCode, locale, candidateDigest, reviewDigest, approvalDigest }) {
  const relative = packagePath(nodeCode, locale);
  if (!exists(root, relative)) {
    return {
      present: false,
      valid: false,
      path: null,
      fileDigest: null,
      packageCode: null,
      packageDigest: null,
      packageState: null,
      articleBodyPath: null,
      articleBodyDigest: null,
      blockers: ['PRODUCTION_ARTICLE_PACKAGE_NOT_PRESENT']
    };
  }
  const record = readJson(root, relative);
  const blockers = [];
  if (record.nodeCode !== nodeCode) blockers.push('PACKAGE_NODE_CODE_MISMATCH');
  if (record.locale !== locale) blockers.push('PACKAGE_LOCALE_MISMATCH');
  if (record.candidate?.candidateDigest !== candidateDigest) blockers.push('PACKAGE_CANDIDATE_DIGEST_MISMATCH');
  if (record.review?.reviewDigest !== reviewDigest) blockers.push('PACKAGE_REVIEW_DIGEST_MISMATCH');
  if (record.approval?.approvalDigest !== approvalDigest) blockers.push('PACKAGE_APPROVAL_DIGEST_MISMATCH');
  if (record.review?.decision !== 'accept') blockers.push('PACKAGE_REVIEW_NOT_ACCEPTED');
  if (record.approval?.decision !== 'approve') blockers.push('PACKAGE_APPROVAL_NOT_APPROVED');
  if (record.packageState !== 'human_approved_not_published') blockers.push('PACKAGE_STATE_NOT_HUMAN_APPROVED_NOT_PUBLISHED');
  if (record.authority?.humanReviewRecorded !== true) blockers.push('PACKAGE_HUMAN_REVIEW_AUTHORITY_MISSING');
  if (record.authority?.humanApprovalRecorded !== true) blockers.push('PACKAGE_HUMAN_APPROVAL_AUTHORITY_MISSING');
  if (record.authority?.publicationRecorded !== false) blockers.push('PACKAGE_MUST_NOT_RECORD_PUBLICATION');
  if (record.governance?.packageIsPublication !== false) blockers.push('PACKAGE_MUST_NOT_EQUAL_PUBLICATION');
  if (record.governance?.publicProjectionAllowed !== false) blockers.push('PACKAGE_PUBLIC_PROJECTION_MUST_REMAIN_BLOCKED');
  return {
    present: true,
    valid: blockers.length === 0,
    path: relative,
    fileDigest: fileDigest(root, relative),
    packageCode: record.packageCode || null,
    packageDigest: record.packageDigest || null,
    packageState: record.packageState || null,
    articleBodyPath: record.article?.bodyPath || null,
    articleBodyDigest: record.article?.bodyDigest || null,
    blockers
  };
}

function decisionRequirements(lane, pkg) {
  const review = lane.existingHumanEvidence?.review || {};
  const approval = lane.existingHumanEvidence?.approval || {};
  const publication = lane.existingHumanEvidence?.publication || {};
  const reviewRequirement = review.accepted
    ? 'REUSED_EXISTING_ACCEPTED_TL_REVIEW'
    : 'EXPLICIT_TL_REVIEW_DECISION_REQUIRED';
  const approvalRequirement = approval.approved
    ? 'REUSED_EXISTING_TL_APPROVAL'
    : review.accepted
      ? 'EXPLICIT_TL_APPROVAL_DECISION_REQUIRED'
      : 'BLOCKED_UNTIL_ACCEPTED_TL_REVIEW';
  const publicationRequirement = publication.published
    ? 'REUSED_EXISTING_PUBLICATION_AUTHORITY'
    : review.accepted && approval.approved && pkg.valid
      ? 'EXPLICIT_TL_PUBLICATION_DECISION_REQUIRED'
      : 'BLOCKED_UNTIL_REVIEW_APPROVAL_AND_PACKAGE_READY';
  return {
    review: reviewRequirement,
    approval: approvalRequirement,
    publication: publicationRequirement
  };
}

function unresolvedDecisionFields(requirements) {
  const fields = [];
  if (requirements.review === 'EXPLICIT_TL_REVIEW_DECISION_REQUIRED') fields.push('reviewDecision');
  if (requirements.approval === 'EXPLICIT_TL_APPROVAL_DECISION_REQUIRED') fields.push('approvalDecision');
  if (requirements.publication === 'EXPLICIT_TL_PUBLICATION_DECISION_REQUIRED') {
    fields.push('publicationDecision', 'publisherCode', 'decidedAt', 'summary');
  }
  return fields;
}

function activeEntry(root, sourceEntry, lane) {
  const review = lane.existingHumanEvidence.review;
  const approval = lane.existingHumanEvidence.approval;
  const publication = lane.existingHumanEvidence.publication;
  const pkg = productionPackage(root, {
    nodeCode: sourceEntry.nodeCode,
    locale: lane.locale,
    candidateDigest: lane.candidate.candidateDigest,
    reviewDigest: review.digest,
    approvalDigest: approval.digest
  });
  const requirements = decisionRequirements(lane, pkg);
  return {
    batchIndex: sourceEntry.batchIndex,
    nodeCode: sourceEntry.nodeCode,
    bookCode: sourceEntry.bookCode,
    partCode: sourceEntry.partCode,
    locale: lane.locale,
    title: lane.localeIdentity?.displayQuestion || sourceEntry.title,
    route: {
      slug: lane.localeIdentity?.slug || null,
      href: lane.localeIdentity?.slug ? `/articles/${lane.localeIdentity.slug}` : null,
      sameRouteLocaleReleaseRequired: true
    },
    candidate: {
      path: lane.candidate.path,
      candidateCode: lane.candidate.candidateCode,
      candidateDigest: lane.candidate.candidateDigest,
      candidateState: lane.candidate.candidateState,
      resolution: lane.candidate.resolution,
      candidateAuthority: false
    },
    existingAuthority: {
      review: {
        present: review.present,
        accepted: review.accepted,
        path: review.path,
        reviewCode: review.code,
        reviewDigest: review.digest
      },
      approval: {
        present: approval.present,
        approved: approval.approved,
        path: approval.path,
        approvalCode: approval.code,
        approvalDigest: approval.digest
      },
      publication: {
        present: publication.present,
        published: publication.published,
        path: publication.path,
        publicationCode: publication.code,
        publicationDigest: publication.digest
      }
    },
    productionArticlePackage: pkg,
    requiredHumanDecisions: requirements,
    unresolvedDecisionFields: unresolvedDecisionFields(requirements),
    apsL10nHandoff: {
      localeArticleAuthorityState: lane.localeArticleAuthorityState,
      sequenceAfterExplicitPublication: [
        'LOCALE_ARTICLE_AUTHORITY',
        'CAR',
        'CPR',
        'VISUAL_ARTICLE',
        'SAME_ROUTE_LOCALE_RELEASE'
      ]
    }
  };
}

function excludedEntry(sourceEntry, lane) {
  return {
    nodeCode: sourceEntry.nodeCode,
    bookCode: sourceEntry.bookCode,
    partCode: sourceEntry.partCode,
    locale: lane.locale,
    state: lane.state,
    blockers: lane.blockers,
    candidateState: lane.candidate?.state || null,
    localeArticleAuthorityState: lane.localeArticleAuthorityState,
    reason: lane.state === 'BLOCKED_LOCALE_AUTHORITY_DISCOVERY'
      ? 'LOCALE_NOT_ELIGIBLE_FOR_APS_5_HUMAN_REVIEW_BATCH'
      : 'LANE_NOT_READY_FOR_APS_5_HUMAN_REVIEW_BATCH'
  };
}

export function buildReviewBatch(root, orchestration, { createdAt = null } = {}) {
  if (!orchestration || orchestration.work !== 'APS-4') throw new Error('APS-5 requires an APS-4 candidate orchestration');
  const entries = [];
  const excludedLocaleLanes = [];
  for (const sourceEntry of orchestration.entries || []) {
    for (const lane of sourceEntry.targetLocaleLanes || []) {
      if (lane.state === 'CANDIDATE_READY_FOR_LOCALE_AUTHORITY' && lane.candidate?.state === 'CANDIDATE_READY') {
        entries.push(activeEntry(root, sourceEntry, lane));
      } else {
        excludedLocaleLanes.push(excludedEntry(sourceEntry, lane));
      }
    }
  }
  entries.sort((a, b) => a.batchIndex - b.batchIndex || a.locale.localeCompare(b.locale));
  excludedLocaleLanes.sort((a, b) => a.nodeCode.localeCompare(b.nodeCode) || a.locale.localeCompare(b.locale));
  const publicationPending = entries.filter(entry => entry.requiredHumanDecisions.publication === 'EXPLICIT_TL_PUBLICATION_DECISION_REQUIRED');
  const reviewPending = entries.filter(entry => entry.requiredHumanDecisions.review === 'EXPLICIT_TL_REVIEW_DECISION_REQUIRED');
  const approvalPending = entries.filter(entry => entry.requiredHumanDecisions.approval === 'EXPLICIT_TL_APPROVAL_DECISION_REQUIRED');
  const packageBlocked = entries.filter(entry => !entry.productionArticlePackage.valid);
  const result = {
    schemaVersion: 'PHI-OS-APS-5-REVIEW-BATCH-v1.0.0',
    work: 'APS-5',
    status: publicationPending.length > 0 && reviewPending.length === 0 && approvalPending.length === 0 && packageBlocked.length === 0
      ? 'AWAITING_TL_PUBLICATION_DECISIONS'
      : reviewPending.length > 0 || approvalPending.length > 0
        ? 'AWAITING_TL_REVIEW_AND_APPROVAL_DECISIONS'
        : packageBlocked.length > 0
          ? 'BLOCKED_PRODUCTION_ARTICLE_PACKAGE'
          : 'NO_UNRESOLVED_HUMAN_DECISIONS',
    implementationBaselineCommit: APS5_BASELINE,
    contractReference: APS5_CONTRACT,
    batchCode: orchestration.batchCode,
    createdAt: createdAt || new Date().toISOString(),
    sourceOrchestration: {
      work: 'APS-4',
      orchestrationDigest: orchestration.orchestrationDigest,
      targetLocales: orchestration.targetLocales
    },
    summary: {
      activeReviewEntryCount: entries.length,
      excludedLocaleLaneCount: excludedLocaleLanes.length,
      reusedAcceptedReviewCount: entries.filter(entry => entry.existingAuthority.review.accepted).length,
      reusedApprovedApprovalCount: entries.filter(entry => entry.existingAuthority.approval.approved).length,
      validProductionArticlePackageCount: entries.filter(entry => entry.productionArticlePackage.valid).length,
      pendingReviewDecisionCount: reviewPending.length,
      pendingApprovalDecisionCount: approvalPending.length,
      pendingPublicationDecisionCount: publicationPending.length,
      existingPublicationAuthorityCount: entries.filter(entry => entry.existingAuthority.publication.published).length
    },
    entries,
    excludedLocaleLanes,
    humanDecisionInterface: {
      decisionFile: `content/production/article-simplification/batches/${orchestration.batchCode}/human-decisions.v1.json`,
      oneIndependentDecisionPerNodeLocale: true,
      bulkPublicationDecisionAllowed: false,
      allowedPublicationDecisions: [...APS5_ALLOWED_PUBLICATION_DECISIONS],
      currentBatchMayReuseReviewApproval: true,
      publicationDecisionMustRemainExplicit: true
    },
    governance: {
      reviewBatchAuthority: false,
      reviewBatchEqualsBulkApproval: false,
      reviewBatchEqualsPublicationDecision: false,
      candidateEqualsAuthority: false,
      existingDigestBoundReviewMayBeReused: true,
      existingDigestBoundApprovalMayBeReused: true,
      humanPublicationDecisionMayBeInferred: false,
      localeAuthorityInheritanceAllowed: false,
      englishLaneMayEnterWithoutIndependentCandidateAndLocaleIdentity: false,
      publicationCreated: false,
      carCreated: false,
      cprCreated: false,
      visualArticleCreated: false,
      sameRouteReleaseCreated: false
    },
    nextWork: 'APS-6_BATCH_HUMAN_REVIEW_AND_DECISION_BRIDGE'
  };
  const digestInput = structuredClone(result);
  result.reviewBatchDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}

export function reviewBatchPath(batchCode) {
  return `content/production/article-simplification/batches/${batchCode}/review-batch.v1.json`;
}

export function humanDecisionsPath(batchCode) {
  return `content/production/article-simplification/batches/${batchCode}/human-decisions.v1.json`;
}

function sameReviewBatch(existing, current) {
  if (existing?.work !== 'APS-5' || existing?.batchCode !== current.batchCode) return false;
  if (existing?.sourceOrchestration?.orchestrationDigest !== current.sourceOrchestration.orchestrationDigest) return false;
  const compact = batch => (batch.entries || []).map(entry => ({
    nodeCode: entry.nodeCode,
    locale: entry.locale,
    candidateDigest: entry.candidate?.candidateDigest,
    reviewDigest: entry.existingAuthority?.review?.reviewDigest,
    approvalDigest: entry.existingAuthority?.approval?.approvalDigest,
    packageDigest: entry.productionArticlePackage?.packageDigest,
    requirements: entry.requiredHumanDecisions
  }));
  const excluded = batch => (batch.excludedLocaleLanes || []).map(entry => [entry.nodeCode, entry.locale, entry.state, entry.blockers]);
  return stableJson(compact(existing)) === stableJson(compact(current)) && stableJson(excluded(existing)) === stableJson(excluded(current));
}

export function buildHumanDecisionInput(reviewBatch) {
  const entries = (reviewBatch.entries || []).map(entry => ({
    nodeCode: entry.nodeCode,
    locale: entry.locale,
    candidateCode: entry.candidate.candidateCode,
    candidateDigest: entry.candidate.candidateDigest,
    reviewDecision: entry.existingAuthority.review.accepted ? 'accept' : null,
    reviewerCode: entry.existingAuthority.review.accepted ? 'TL' : null,
    approvalDecision: entry.existingAuthority.approval.approved ? 'approve' : null,
    approverCode: entry.existingAuthority.approval.approved ? 'TL' : null,
    publicationDecision: entry.existingAuthority.publication.published ? 'publish' : null,
    publisherCode: entry.existingAuthority.publication.published ? 'TL' : null,
    decisionState: entry.existingAuthority.publication.published ? 'existing_authority_reused' : 'pending_human',
    decidedAt: null,
    summary: null,
    findings: [],
    unresolvedDecisionFields: entry.unresolvedDecisionFields
  }));
  return {
    schemaVersion: 'PHI-OS-APS-5-HUMAN-DECISION-INPUT-v1.0.0',
    work: 'APS-5',
    status: entries.some(entry => entry.decisionState === 'pending_human') ? 'PENDING_HUMAN' : 'NO_PENDING_HUMAN_DECISIONS',
    batchCode: reviewBatch.batchCode,
    sourceReviewBatchDigest: reviewBatch.reviewBatchDigest,
    oneIndependentDecisionPerNodeLocale: true,
    bulkApprovalAuthorityCreated: false,
    publicationAuthorityCreated: false,
    allowedPublicationDecisions: [...APS5_ALLOWED_PUBLICATION_DECISIONS],
    entries,
    instructions: {
      role: 'HUMAN_DECISION_INPUT_ONLY_UNTIL_APS_6_VALIDATES_AND_BRIDGES_EXPLICIT_DECISIONS',
      doNotChange: ['batchCode', 'sourceReviewBatchDigest', 'nodeCode', 'locale', 'candidateCode', 'candidateDigest'],
      editableWhenListedAsUnresolved: ['reviewDecision', 'approvalDecision', 'publicationDecision', 'reviewerCode', 'approverCode', 'publisherCode', 'decidedAt', 'summary', 'findings'],
      currentBatchPublicationDecisionOptions: [...APS5_ALLOWED_PUBLICATION_DECISIONS],
      nextCommandAfterAPS6: 'npm run article:publish -- --batch BATCH-001'
    },
    nextWork: 'APS-6_BATCH_HUMAN_REVIEW_AND_DECISION_BRIDGE'
  };
}

function decisionInputStillBound(input, reviewBatch) {
  if (input?.batchCode !== reviewBatch.batchCode || input?.sourceReviewBatchDigest !== reviewBatch.reviewBatchDigest) return false;
  const expected = new Map((reviewBatch.entries || []).map(entry => [`${entry.nodeCode}::${entry.locale}`, entry]));
  if ((input.entries || []).length !== expected.size) return false;
  for (const decision of input.entries || []) {
    const entry = expected.get(`${decision.nodeCode}::${decision.locale}`);
    if (!entry) return false;
    if (decision.candidateCode !== entry.candidate.candidateCode || decision.candidateDigest !== entry.candidate.candidateDigest) return false;
  }
  return true;
}

export function writeReviewBatch(root, orchestration, options = {}) {
  const current = buildReviewBatch(root, orchestration, options);
  const outputPath = reviewBatchPath(orchestration.batchCode);
  let reviewBatch = current;
  let reusedExistingReviewBatch = false;
  if (exists(root, outputPath)) {
    const existing = readJson(root, outputPath);
    if (!sameReviewBatch(existing, current)) throw new Error(`${outputPath} exists but no longer matches current APS-4/Human/package evidence`);
    reviewBatch = existing;
    reusedExistingReviewBatch = true;
  } else {
    fs.mkdirSync(path.dirname(abs(root, outputPath)), { recursive: true });
    fs.writeFileSync(abs(root, outputPath), stableJson(current), 'utf8');
  }

  const decisionPath = humanDecisionsPath(orchestration.batchCode);
  let humanDecisions;
  let reusedExistingHumanDecisions = false;
  if (exists(root, decisionPath)) {
    humanDecisions = readJson(root, decisionPath);
    if (!decisionInputStillBound(humanDecisions, reviewBatch)) throw new Error(`${decisionPath} is not bound to the current APS-5 review batch`);
    reusedExistingHumanDecisions = true;
  } else {
    humanDecisions = buildHumanDecisionInput(reviewBatch);
    fs.writeFileSync(abs(root, decisionPath), stableJson(humanDecisions), 'utf8');
  }

  return {
    reviewBatch,
    reviewBatchPath: outputPath,
    humanDecisions,
    humanDecisionsPath: decisionPath,
    reusedExistingReviewBatch,
    reusedExistingHumanDecisions
  };
}
