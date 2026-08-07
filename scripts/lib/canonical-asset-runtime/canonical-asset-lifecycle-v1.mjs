import crypto from 'node:crypto';
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const assert = (ok, code) => { if (!ok) throw new Error(code); };

export function buildAssetCandidate(input) {
  const { brief } = input;
  assert(brief?.briefDigest, 'CAR_CANDIDATE_BRIEF_REQUIRED');
  assert(brief.outputContract?.candidateOnly === true && brief.outputContract?.publicationAllowed === false, 'CAR_CANDIDATE_BRIEF_BOUNDARY_INVALID');
  const body = {
    candidateCode: input.candidateCode,
    candidateVersion: '1.0.0',
    assetCode: input.assetCode,
    assetType: brief.assetType,
    nodeCode: brief.nodeCode,
    assetBriefCode: brief.briefCode,
    assetBriefDigest: brief.briefDigest,
    meaningReferences: [...brief.meaningReferences].sort(),
    knowledgeReferences: [...brief.knowledgeReferences].sort(),
    sourceFragmentDigests: [...brief.sourceFragmentDigests].sort(),
    locale: brief.locale,
    candidatePayload: input.candidatePayload ?? {},
    providerLineage: input.providerLineage ?? { mode: 'none', providerCode: null, modelCode: null, invocationDigest: null },
    candidateState: 'candidate',
    createdAt: input.createdAt
  };
  return { ...body, candidateDigest: digest(body) };
}

export function buildAssetReview({ candidate, reviewerCode, reviewerIndependent, dimensions, decision, reviewNotes = [], reviewedAt, reviewCode }) {
  assert(reviewerIndependent === true, 'CAR_REVIEW_INDEPENDENCE_REQUIRED');
  const body = { reviewCode, reviewVersion: '1.0.0', candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest, reviewerCode, reviewerIndependent: true, dimensions, decision, reviewNotes, reviewedAt };
  return { ...body, reviewDigest: digest(body) };
}

export function buildAssetApproval({ candidate, review, approverCode, approverIndependent, decision, conditions = [], approvedAt, approvalCode }) {
  assert(approverIndependent === true, 'CAR_APPROVAL_INDEPENDENCE_REQUIRED');
  assert(review.candidateCode === candidate.candidateCode && review.candidateDigest === candidate.candidateDigest, 'CAR_APPROVAL_REVIEW_LINEAGE_INVALID');
  assert(review.decision === 'accept', 'CAR_APPROVAL_ACCEPTED_REVIEW_REQUIRED');
  assert(decision !== 'approved' || conditions.length === 0, 'CAR_APPROVAL_APPROVED_WITH_CONDITIONS_INVALID');
  const body = { approvalCode, approvalVersion: '1.0.0', candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest, reviewCode: review.reviewCode, reviewDigest: review.reviewDigest, approverCode, approverIndependent: true, decision, conditions, approvedAt };
  return { ...body, approvalDigest: digest(body) };
}

export function buildMediaRecord({ candidate, assetType, mediaCode, mediaType, storageAuthority, contentType, width = null, height = null, duration = null, locale, accessibilityText, accessibilityStatus, rightsStatus, sourceDigest, fixtureOnly = true }) {
  assert(!String(assetType).endsWith('_PROMPT'), 'CAR_PROMPT_CANNOT_REGISTER_AS_MEDIA');
  assert(candidate.candidateDigest === sourceDigest, 'CAR_MEDIA_SOURCE_DIGEST_INVALID');
  const body = { mediaCode, assetCode: candidate.assetCode, assetType, candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest, mediaType, storageAuthority, contentType, width, height, duration, locale, accessibilityText, accessibilityStatus, rightsStatus, sourceDigest, fixtureOnly };
  return { ...body, mediaDigest: digest(body) };
}

export function publishAsset({ candidate, review, approval, media = [], surface, rightsStatus, accessibilityStatus, publishedAt, publicationCode }) {
  assert(review.candidateDigest === candidate.candidateDigest && approval.candidateDigest === candidate.candidateDigest, 'CAR_PUBLICATION_CANDIDATE_LINEAGE_INVALID');
  assert(approval.reviewDigest === review.reviewDigest, 'CAR_PUBLICATION_REVIEW_LINEAGE_INVALID');
  assert(review.decision === 'accept', 'CAR_PUBLICATION_REVIEW_NOT_ACCEPTED');
  assert(approval.decision === 'approved', 'CAR_PUBLICATION_APPROVAL_REQUIRED');
  assert(['cleared','owned','licensed'].includes(rightsStatus), 'CAR_PUBLICATION_RIGHTS_GATE_FAILED');
  assert(accessibilityStatus === 'passed', 'CAR_PUBLICATION_ACCESSIBILITY_GATE_FAILED');
  assert(media.every(m => m.candidateDigest === candidate.candidateDigest && m.rightsStatus !== 'blocked' && m.accessibilityStatus === 'passed'), 'CAR_PUBLICATION_MEDIA_GATE_FAILED');
  const body = { publicationCode, publicationVersion: '1.0.0', assetCode: candidate.assetCode, assetType: candidate.assetType, candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest, reviewCode: review.reviewCode, reviewDigest: review.reviewDigest, approvalCode: approval.approvalCode, approvalDigest: approval.approvalDigest, mediaReferences: media.map(x => x.mediaCode).sort(), surface, locale: candidate.locale, rightsStatus, accessibilityStatus, publicationState: 'published', publishedAt };
  return { ...body, publicationDigest: digest(body) };
}
