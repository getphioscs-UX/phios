import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  APPROVAL_REGISTRY,
  CANDIDATE_REGISTRY,
  MEDIA_REGISTRY,
  PUBLISHED_REGISTRY,
  REVIEW_REGISTRY,
  approveCandidate,
  deriveCarProductionActivation,
  fileDigest,
  importCandidate,
  materializeMedia,
  publishProductionAsset,
  readJson,
  refreshCarProductionActivation,
  reviewCandidate,
  writeJson
} from './lib/car-production/car-production-v1.mjs';

const root = process.cwd();
const briefCode = 'CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-001';
const pilotCandidateCode = 'CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-001';
const pilotAssetCode = 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-001';
const registries = {
  candidates: readJson(root, CANDIDATE_REGISTRY),
  reviews: readJson(root, REVIEW_REGISTRY),
  approvals: readJson(root, APPROVAL_REGISTRY),
  media: readJson(root, MEDIA_REGISTRY),
  publications: readJson(root, PUBLISHED_REGISTRY)
};

// Successor-aware real production-state validation. W15-W19 may advance over time,
// but every downstream artifact must remain exact-lineage bound to the pilot Candidate.
assert(registries.candidates.candidates.length <= 1, 'CAR_PILOT_MULTIPLE_REAL_CANDIDATES_UNEXPECTED');
if (registries.candidates.candidates.length) {
  const entry = registries.candidates.candidates[0];
  assert.equal(entry.candidateCode, pilotCandidateCode);
  assert.equal(entry.assetCode, pilotAssetCode);
  assert.equal(entry.briefCode, briefCode);
  const candidate = readJson(root, entry.path);
  assert.equal(candidate.candidateCode, entry.candidateCode);
  assert.equal(candidate.candidateDigest, entry.candidateDigest);
  assert.equal(candidate.assetBriefCode, briefCode);
  assert.equal(candidate.providerLineage.mode, 'external_manual');
  assert.equal(candidate.providerLineage.providerCode, 'OPENAI_CHATGPT');
  assert.equal(candidate.candidateState, 'candidate');
  assert.equal(fileDigest(fs.readFileSync(path.join(root, entry.binaryPath))), candidate.candidatePayload.fileDigest);
  assert(['image/webp','image/avif','image/svg+xml'].includes(candidate.candidatePayload.contentType));
  assert(candidate.candidatePayload.width > 0 && candidate.candidatePayload.height > 0);

  const reviewEntries = registries.reviews.reviews.filter(x => x.candidateCode === candidate.candidateCode);
  for (const reviewEntry of reviewEntries) {
    const review = readJson(root, reviewEntry.path);
    assert.equal(review.candidateDigest, candidate.candidateDigest);
    assert.equal(review.reviewDigest, reviewEntry.reviewDigest);
    assert(['accept','changes_required','reject'].includes(review.decision));
    if (review.decision === 'accept') assert.deepEqual(Object.values(review.dimensions), Array(5).fill('pass'));
  }
  const latestReview = reviewEntries.length ? readJson(root, reviewEntries.at(-1).path) : null;

  const approvalEntries = registries.approvals.approvals.filter(x => x.candidateCode === candidate.candidateCode);
  for (const approvalEntry of approvalEntries) {
    const approval = readJson(root, approvalEntry.path);
    assert(latestReview, 'CAR_REAL_APPROVAL_REQUIRES_REAL_REVIEW');
    assert.equal(latestReview.decision, 'accept');
    assert.equal(approval.candidateDigest, candidate.candidateDigest);
    assert.equal(approval.reviewCode, latestReview.reviewCode);
    assert.equal(approval.reviewDigest, latestReview.reviewDigest);
    assert.equal(approval.approvalDigest, approvalEntry.approvalDigest);
    assert(['approved','conditionally_approved','rejected','revoked'].includes(approval.decision));
    if (approval.decision === 'approved') assert.deepEqual(approval.conditions, []);
  }
  const latestApproval = approvalEntries.length ? readJson(root, approvalEntries.at(-1).path) : null;

  const mediaEntries = registries.media.media.filter(x => x.candidateCode === candidate.candidateCode);
  for (const mediaEntry of mediaEntries) {
    const media = readJson(root, mediaEntry.path);
    assert(latestReview && latestReview.decision === 'accept', 'CAR_REAL_MEDIA_REQUIRES_ACCEPTED_REVIEW');
    assert(latestApproval && latestApproval.decision === 'approved', 'CAR_REAL_MEDIA_REQUIRES_APPROVED_APPROVAL');
    assert.equal(media.candidateDigest, candidate.candidateDigest);
    assert(['cleared','owned','licensed'].includes(media.rightsStatus));
    assert.equal(media.accessibilityStatus, 'passed');
    assert(media.width > 0 && media.height > 0);
    assert(media.publicSrc.startsWith('/assets/'));
    assert(/\.(?:webp|avif|svg)$/i.test(media.publicSrc));
    const publicFile = path.join(root, media.publicSrc.slice(1));
    assert(fs.existsSync(publicFile), `CAR_REAL_MEDIA_BINARY_MISSING:${media.publicSrc}`);
    assert.equal(fileDigest(fs.readFileSync(publicFile)), candidate.candidatePayload.fileDigest);
  }
  const latestMedia = mediaEntries.length ? readJson(root, mediaEntries.at(-1).path) : null;

  const publicationEntries = registries.publications.publications.filter(x => x.assetCode === candidate.assetCode);
  for (const publicationEntry of publicationEntries) {
    const published = readJson(root, publicationEntry.path);
    assert(latestReview && latestReview.decision === 'accept', 'CAR_REAL_PUBLICATION_REQUIRES_ACCEPTED_REVIEW');
    assert(latestApproval && latestApproval.decision === 'approved', 'CAR_REAL_PUBLICATION_REQUIRES_APPROVED_APPROVAL');
    assert(latestMedia, 'CAR_REAL_PUBLICATION_REQUIRES_MEDIA');
    assert.equal(published.assetCode, candidate.assetCode);
    assert.equal(published.mediaCode, latestMedia.mediaCode);
    assert.equal(published.publicSrc, latestMedia.publicSrc);
    assert.equal(published.rightsStatus, latestMedia.rightsStatus);
    assert.equal(published.accessibilityStatus, 'passed');
    assert.equal(published.publicationState, 'published');
    assert.equal(published.publicationDigest, publicationEntry.publicationDigest);
  }
}

const expectedActivation = deriveCarProductionActivation(root);
const storedActivation = readJson(root, 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json');
assert.deepEqual(storedActivation, expectedActivation, 'CAR_PRODUCTION_ACTIVATION_MUST_MATCH_REAL_REGISTRIES');

// Isolated full lifecycle fixture: reset successor production state before exercising W15-W19.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phios-car-life-'));
fs.cpSync(root, tmp, { recursive: true, filter: src => !src.includes(`${path.sep}.git${path.sep}`) && !src.includes(`${path.sep}node_modules${path.sep}`) });
for (const [relative, collection, code] of [
  [CANDIDATE_REGISTRY, 'candidates', 'PHI-OS-CAR-PRODUCTION-CANDIDATE-REGISTRY-v1'],
  [REVIEW_REGISTRY, 'reviews', 'PHI-OS-CAR-PRODUCTION-REVIEW-REGISTRY-v1'],
  [APPROVAL_REGISTRY, 'approvals', 'PHI-OS-CAR-PRODUCTION-APPROVAL-REGISTRY-v1'],
  [MEDIA_REGISTRY, 'media', 'PHI-OS-CAR-PRODUCTION-MEDIA-REGISTRY-v1'],
  [PUBLISHED_REGISTRY, 'publications', 'PHI-OS-CAR-PRODUCTION-PUBLISHED-ASSET-REGISTRY-v1']
]) await writeJson(tmp, relative, { registryCode: code, registryVersion: '1.0.0', productionStatus: 'active', authority: 'CAR Production Activation', [collection]: [] });
for (const dir of ['candidates','reviews','approvals','media','published']) fs.rmSync(path.join(tmp, 'content/production/car', dir), { recursive: true, force: true });
fs.rmSync(path.join(tmp, 'assets/knowledge/KN-PREFACE-001'), { recursive: true, force: true });
await refreshCarProductionActivation(tmp);

const svg = path.join(tmp, 'external-chatgpt-candidate.svg');
fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800"/><circle cx="600" cy="400" r="100"/></svg>');
const candidate = await importCandidate({ root: tmp, briefCode, file: svg, modelCode: null, createdAt: '2026-08-11T12:00:00.000Z' });
assert.equal(candidate.providerLineage.mode, 'external_manual');
assert.equal(candidate.providerLineage.providerCode, 'OPENAI_CHATGPT');
assert.equal(candidate.providerLineage.modelCode, null);
assert.equal(candidate.candidateState, 'candidate');
assert.equal(candidate.assetBriefCode, briefCode);
assert.equal(candidate.assetType, 'DIAGRAM');
assert.equal(readJson(tmp, 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json').status, 'PILOT_FIGURE_CANDIDATE_IMPORTED_AWAITING_HUMAN_ASSET_REVIEW');

const dimsPass = { semanticAccuracy: 'pass', knowledgeTraceability: 'pass', brandCompliance: 'pass', accessibility: 'pass', rightsLicense: 'pass' };
const changes = await reviewCandidate({ root: tmp, candidateCode: candidate.candidateCode, reviewerCode: 'TL', decision: 'changes_required', dimensions: { ...dimsPass, brandCompliance: 'fail' }, reviewNotes: ['fixture changes required'], reviewedAt: '2026-08-11T12:01:00.000Z' });
assert.equal(changes.decision, 'changes_required');
await assert.rejects(() => approveCandidate({ root: tmp, candidateCode: candidate.candidateCode, approverCode: 'TL', decision: 'approved', approvedAt: '2026-08-11T12:02:00.000Z' }), /CAR_APPROVAL_ACCEPTED_REVIEW_REQUIRED/);
const accepted = await reviewCandidate({ root: tmp, candidateCode: candidate.candidateCode, reviewerCode: 'TL', decision: 'accept', dimensions: dimsPass, reviewNotes: [], reviewedAt: '2026-08-11T12:03:00.000Z' });
assert.equal(accepted.decision, 'accept');
assert.deepEqual(Object.values(accepted.dimensions), Array(5).fill('pass'));
assert.equal(readJson(tmp, 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json').status, 'PILOT_FIGURE_CANDIDATE_ACCEPTED_AWAITING_HUMAN_ASSET_APPROVAL');

const approval = await approveCandidate({ root: tmp, candidateCode: candidate.candidateCode, approverCode: 'TL', decision: 'approved', conditions: [], approvedAt: '2026-08-11T12:04:00.000Z' });
assert.equal(approval.approver, 'TL');
assert.equal(approval.candidateDigest, candidate.candidateDigest);
assert.equal(approval.reviewDigest, accepted.reviewDigest);
assert.equal(approval.decision, 'approved');
assert.equal(readJson(tmp, 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json').status, 'PILOT_FIGURE_APPROVED_AWAITING_MEDIA_MATERIALIZATION');

await assert.rejects(() => materializeMedia({ root: tmp, candidateCode: candidate.candidateCode, altText: 'x', rightsStatus: 'blocked', accessibilityStatus: 'passed' }), /CAR_MEDIA_RIGHTS_MUST_BE_CLEARED/);
await assert.rejects(() => materializeMedia({ root: tmp, candidateCode: candidate.candidateCode, altText: 'x', rightsStatus: 'owned', accessibilityStatus: 'failed' }), /CAR_MEDIA_ACCESSIBILITY_MUST_PASS/);
const media = await materializeMedia({ root: tmp, candidateCode: candidate.candidateCode, altText: '文明能力形成机制图', rightsStatus: 'owned', accessibilityStatus: 'passed' });
assert.equal(media.width, 1200);
assert.equal(media.height, 800);
assert.equal(media.altText, '文明能力形成机制图');
assert.equal(media.rightsStatus, 'owned');
assert.equal(media.accessibilityStatus, 'passed');
assert(media.publicSrc.startsWith('/assets/knowledge/KN-PREFACE-001/'));
assert(media.publicSrc.endsWith('.svg'));
assert.equal(media.carMediaRecord.fixtureOnly, false);
assert.equal(readJson(tmp, 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json').status, 'PILOT_MEDIA_MATERIALIZED_AWAITING_PUBLISHED_ASSET_GATE');

const published = await publishProductionAsset({ root: tmp, candidateCode: candidate.candidateCode, surface: 'WEBSITE', publishedAt: '2026-08-11T12:05:00.000Z' });
assert.equal(published.publishedAssetCode, `PUBLISHED-${candidate.assetCode}`);
assert.equal(published.mediaCode, media.mediaCode);
assert.equal(published.publicSrc, media.publicSrc);
assert.equal(published.width, 1200);
assert.equal(published.height, 800);
assert.equal(published.altText, '文明能力形成机制图');
assert.equal(published.carPublicationRecord.publicationState, 'published');
assert.equal(published.carPublicationRecord.rightsStatus, 'owned');
assert.equal(published.carPublicationRecord.accessibilityStatus, 'passed');
assert.equal(readJson(tmp, 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json').status, 'PILOT_PUBLISHED_ASSET_RECORDED');

console.log('✓ VAP-W15 external-manual Figure Candidate Intake preserves CAB/Knowledge/Meaning lineage and records OPENAI_CHATGPT provider lineage.');
console.log('✓ VAP-W16 independent Human Asset Review is successor-aware; accept requires all five review dimensions to pass and does not create Approval.');
console.log('✓ VAP-W17 independent Asset Approval requires an accepted review and remains distinct from generation/publication.');
console.log('✓ VAP-W18 Media Materialization is fail-closed on rights/accessibility and emits only safe /assets/... .svg/.webp/.avif paths with dimensions and alt text.');
console.log('✓ VAP-W19 Published Asset requires Candidate + accepted Review + approved Approval + Media + rights/accessibility gates.');
console.log(`✓ Real CAR pilot state: ${registries.candidates.candidates.length} Candidate, ${registries.reviews.reviews.length} Review, ${registries.approvals.approvals.length} Approval, ${registries.media.media.length} Media, ${registries.publications.publications.length} Published Asset.`);
