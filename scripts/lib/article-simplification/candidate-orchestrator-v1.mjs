import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { stableJson } from './single-readiness-v1.mjs';
import { computeCandidateDigest as computeZhHansCandidateDigest } from '../knowledge-production/zh-hans-candidate-v1.mjs';
import { compute as computeEnglishCandidateDigest } from '../knowledge-production/english-candidate-v1.mjs';

export const APS4_BASELINE = 'eb55edb1a183a173aca707e3d3f1a6f842e36271';
export const APS4_CONTRACT = 'content/production/article-simplification/contracts/aps-4-candidate-orchestration-contract-v1.json';
export const APS_L10N_CONTRACT = 'content/production/article-simplification/contracts/aps-l10n-same-route-locale-release-contract-v1.json';
export const APS_L10N_RECONCILIATION = 'content/production/article-simplification/l10n/aps-l10n-vap-l10n-r1-r5-reconciliation-v1.json';
export const L10N_REGISTRY = 'content/knowledge/l10n/multilingual-node-projection-registry.json';
export const VISUAL_RELEASE = 'content/knowledge/public/visual-article-release.json';
export const DEFAULT_TARGET_LOCALES = Object.freeze(['zh-Hans', 'en']);

const normalize = source => String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
const abs = (root, relative) => path.join(root, relative);
const exists = (root, relative) => fs.existsSync(abs(root, relative));
const readJson = (root, relative) => JSON.parse(fs.readFileSync(abs(root, relative), 'utf8'));
const fileDigest = (root, relative) => exists(root, relative) ? `sha256:${sha(fs.readFileSync(abs(root, relative), 'utf8'))}` : null;

function candidatePath(nodeCode, locale) {
  return `content/knowledge/production/candidates/${locale}/${nodeCode}/candidate.v1.json`;
}
function reviewPath(nodeCode, locale) {
  return `content/knowledge/production/reviews/${locale}/${nodeCode}/review.v1.json`;
}
function approvalPath(nodeCode, locale) {
  return `content/knowledge/production/approvals/${locale}/${nodeCode}/approval.v1.json`;
}
function publicationPath(nodeCode, locale) {
  return `content/knowledge/production/publications/${locale}/${nodeCode}/publication.v1.json`;
}

function computeCandidateDigest(candidate) {
  if (candidate.locale === 'zh-Hans') return computeZhHansCandidateDigest(candidate);
  if (candidate.locale === 'en') return computeEnglishCandidateDigest(candidate);
  return null;
}

function candidateValidation(candidate, { nodeCode, locale }) {
  const blockers = [];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) blockers.push('CANDIDATE_NOT_OBJECT');
  if (candidate?.nodeCode !== nodeCode) blockers.push('CANDIDATE_NODE_CODE_MISMATCH');
  if (candidate?.locale !== locale) blockers.push('CANDIDATE_LOCALE_MISMATCH');
  if (candidate?.candidateType !== 'canonical_article_candidate') blockers.push('CANDIDATE_TYPE_INVALID');
  if (!['draft', 'ready_for_human_review', 'changes_required'].includes(candidate?.candidateState)) blockers.push('CANDIDATE_STATE_INVALID');
  if (candidate?.authority?.candidateContent !== 'candidate_only') blockers.push('CANDIDATE_AUTHORITY_BOUNDARY_INVALID');
  if (candidate?.authority?.publication !== 'not_published') blockers.push('CANDIDATE_MUST_NOT_CLAIM_PUBLICATION');
  if (candidate?.governance?.publicationRecorded !== false) blockers.push('CANDIDATE_PUBLICATION_GOVERNANCE_INVALID');
  if (candidate?.provenance?.independentLocaleAuthoring !== true) blockers.push('INDEPENDENT_LOCALE_AUTHORING_REQUIRED');
  if (locale === 'en' && candidate?.governance?.translationFromZhHansAllowed !== false) blockers.push('EN_TRANSLATION_INHERITANCE_FORBIDDEN');
  if (!/^[a-f0-9]{64}$/.test(candidate?.candidateDigest || '')) blockers.push('CANDIDATE_DIGEST_FORMAT_INVALID');
  else {
    const expected = computeCandidateDigest(candidate);
    if (!expected || expected !== candidate.candidateDigest) blockers.push('CANDIDATE_DIGEST_INVALID');
  }
  return { valid: blockers.length === 0, blockers };
}

function humanEvidence(root, nodeCode, locale, candidateDigest) {
  const paths = {
    review: reviewPath(nodeCode, locale),
    approval: approvalPath(nodeCode, locale),
    publication: publicationPath(nodeCode, locale)
  };
  const review = exists(root, paths.review) ? readJson(root, paths.review) : null;
  const approval = exists(root, paths.approval) ? readJson(root, paths.approval) : null;
  const publication = exists(root, paths.publication) ? readJson(root, paths.publication) : null;
  const reviewAccepted = Boolean(review && review.decision === 'accept' && review.candidate?.candidateDigest === candidateDigest);
  const approvalApproved = Boolean(approval && approval.decision === 'approve' && approval.candidate?.candidateDigest === candidateDigest && approval.review?.reviewDigest === review?.reviewDigest);
  const publicationPublished = Boolean(publication && publication.decision === 'publish' && (
    publication.candidate?.candidateDigest === candidateDigest || publication.candidateDigest === candidateDigest
  ));
  return {
    review: {
      path: review ? paths.review : null,
      present: Boolean(review),
      accepted: reviewAccepted,
      code: review?.reviewCode || null,
      digest: review?.reviewDigest || null
    },
    approval: {
      path: approval ? paths.approval : null,
      present: Boolean(approval),
      approved: approvalApproved,
      code: approval?.approvalCode || null,
      digest: approval?.approvalDigest || null
    },
    publication: {
      path: publication ? paths.publication : null,
      present: Boolean(publication),
      published: publicationPublished,
      code: publication?.publicationCode || null,
      digest: publication?.publicationDigest || null
    }
  };
}

function localeMetadata(l10nMap, nodeCode, locale) {
  const record = l10nMap.get(nodeCode) || null;
  const localeRecord = record?.locales?.[locale] || null;
  const ready = Boolean(localeRecord && localeRecord.availability === 'available' && localeRecord.authority !== 'unassigned' && localeRecord.stalenessStatus === 'current');
  const blockers = [];
  if (!localeRecord) blockers.push('LOCALE_REGISTRY_RECORD_MISSING');
  else {
    if (localeRecord.availability !== 'available') blockers.push('LOCALE_DISCOVERY_REQUIRED');
    if (localeRecord.authority === 'unassigned') blockers.push('LOCALE_AUTHORITY_UNASSIGNED');
    if (localeRecord.stalenessStatus !== 'current') blockers.push('LOCALE_NOT_CURRENT');
    if (!localeRecord.slug) blockers.push('LOCALE_SLUG_NOT_ESTABLISHED');
    if (!localeRecord.displayQuestion) blockers.push('LOCALE_DISPLAY_IDENTITY_NOT_ESTABLISHED');
  }
  return { record: localeRecord, ready, blockers };
}

function resolveCandidate(root, nodeCode, locale) {
  const relative = candidatePath(nodeCode, locale);
  if (!exists(root, relative)) {
    return {
      state: 'CANDIDATE_NOT_PRESENT',
      resolution: 'GOVERNED_CANDIDATE_GENERATION_REQUIRED',
      path: null,
      candidateCode: null,
      candidateDigest: null,
      fileDigest: null,
      candidateState: null,
      validCandidateOnlyBoundary: false,
      blockers: ['CANDIDATE_NOT_PRESENT']
    };
  }
  const candidate = readJson(root, relative);
  const validation = candidateValidation(candidate, { nodeCode, locale });
  return {
    state: validation.valid ? 'CANDIDATE_READY' : 'CANDIDATE_CONFLICT',
    resolution: validation.valid ? 'REUSED_EXISTING_GOVERNED_PJA_CANDIDATE' : 'INVALID_EXISTING_CANDIDATE_BLOCKED',
    path: relative,
    candidateCode: candidate.candidateCode || null,
    candidateDigest: candidate.candidateDigest || null,
    fileDigest: fileDigest(root, relative),
    candidateState: candidate.candidateState || null,
    validCandidateOnlyBoundary: validation.valid,
    blockers: validation.blockers,
    sourceBrief: candidate.sourceBrief || null
  };
}

function laneState({ localeReady, candidate, sameRouteReady }) {
  if (!localeReady) return 'BLOCKED_LOCALE_AUTHORITY_DISCOVERY';
  if (candidate.state === 'CANDIDATE_CONFLICT') return 'BLOCKED_INVALID_EXISTING_CANDIDATE';
  if (candidate.state === 'CANDIDATE_NOT_PRESENT') return 'GOVERNED_CANDIDATE_GENERATION_REQUIRED';
  if (!sameRouteReady) return 'BLOCKED_SAME_ROUTE_IDENTITY';
  return 'CANDIDATE_READY_FOR_LOCALE_AUTHORITY';
}

function localeLane(root, { nodeCode, locale, l10nMap, primarySlug }) {
  const metadata = localeMetadata(l10nMap, nodeCode, locale);
  const candidate = resolveCandidate(root, nodeCode, locale);
  const routeBlockers = [];
  if (metadata.record?.slug && primarySlug && metadata.record.slug !== primarySlug) routeBlockers.push('SAME_ROUTE_SLUG_MISMATCH');
  const sameRouteReady = Boolean(metadata.record?.slug && primarySlug && metadata.record.slug === primarySlug);
  const human = candidate.candidateDigest ? humanEvidence(root, nodeCode, locale, candidate.candidateDigest) : {
    review: { path: null, present: false, accepted: false, code: null, digest: null },
    approval: { path: null, present: false, approved: false, code: null, digest: null },
    publication: { path: null, present: false, published: false, code: null, digest: null }
  };
  const blockers = [...new Set([...metadata.blockers, ...candidate.blockers, ...routeBlockers])];
  const state = laneState({ localeReady: metadata.ready, candidate, sameRouteReady });
  const localeAuthorityState = human.publication.published
    ? 'LOCALE_ARTICLE_AUTHORITY_PRESENT'
    : human.approval.approved
      ? 'AWAITING_EXPLICIT_HUMAN_PUBLICATION_DECISION'
      : human.review.accepted
        ? 'AWAITING_EXPLICIT_HUMAN_APPROVAL'
        : candidate.state === 'CANDIDATE_READY'
          ? 'AWAITING_HUMAN_EDITORIAL_REVIEW'
          : 'NOT_ELIGIBLE_FOR_LOCALE_AUTHORITY';
  return {
    locale,
    state,
    blockers,
    localeIdentity: {
      availability: metadata.record?.availability || null,
      authority: metadata.record?.authority || null,
      translationMode: metadata.record?.translationMode || null,
      stalenessStatus: metadata.record?.stalenessStatus || null,
      displayQuestion: metadata.record?.displayQuestion || null,
      slug: metadata.record?.slug || null,
      sameRouteSlugReady: sameRouteReady
    },
    candidate,
    existingHumanEvidence: human,
    localeArticleAuthorityState: localeAuthorityState,
    downstreamProjection: {
      car: human.publication.published ? 'ELIGIBLE_AFTER_LOCALE_AUTHORITY_BINDING' : 'BLOCKED_UNTIL_LOCALE_ARTICLE_AUTHORITY',
      cpr: human.publication.published ? 'ELIGIBLE_AFTER_CAR' : 'BLOCKED_UNTIL_LOCALE_ARTICLE_AUTHORITY',
      visualArticle: human.publication.published ? 'ELIGIBLE_AFTER_CPR' : 'BLOCKED_UNTIL_LOCALE_ARTICLE_AUTHORITY',
      sameRouteLocaleRelease: human.publication.published ? 'ELIGIBLE_AFTER_VISUAL_ARTICLE' : 'BLOCKED_UNTIL_LOCALE_ARTICLE_AUTHORITY'
    }
  };
}

function targetLocalesNormalized(targetLocales) {
  const source = Array.isArray(targetLocales) ? targetLocales : DEFAULT_TARGET_LOCALES;
  const unique = [...new Set(source.map(value => String(value).trim()).filter(Boolean))];
  return unique.length ? unique : [...DEFAULT_TARGET_LOCALES];
}

export function buildCandidateOrchestration(root, batchPlan, { targetLocales = DEFAULT_TARGET_LOCALES, createdAt = null } = {}) {
  if (!batchPlan || batchPlan.work !== 'APS-3') throw new Error('APS-4 requires an APS-3 batch plan');
  const l10n = readJson(root, L10N_REGISTRY);
  const l10nMap = new Map((l10n.records || []).map(record => [record.nodeCode, record]));
  const locales = targetLocalesNormalized(targetLocales);
  const entries = (batchPlan.entries || []).map(entry => {
    const primaryMetadata = localeMetadata(l10nMap, entry.nodeCode, entry.locale);
    const primarySlug = primaryMetadata.record?.slug || null;
    const lanes = locales.map(locale => localeLane(root, { nodeCode: entry.nodeCode, locale, l10nMap, primarySlug }));
    const primaryLane = lanes.find(lane => lane.locale === entry.locale) || localeLane(root, { nodeCode: entry.nodeCode, locale: entry.locale, l10nMap, primarySlug });
    return {
      batchIndex: entry.batchIndex,
      nodeCode: entry.nodeCode,
      bookCode: entry.bookCode,
      partCode: entry.partCode,
      title: entry.title,
      sourceSelectionLocale: entry.locale,
      primaryCandidate: primaryLane.candidate,
      targetLocaleLanes: lanes,
      apsL10nHandoff: {
        contract: APS_L10N_CONTRACT,
        sequence: ['ARTICLE_CANDIDATE', 'LOCALE_ARTICLE_AUTHORITY', 'CAR', 'CPR', 'VISUAL_ARTICLE', 'SAME_ROUTE_LOCALE_RELEASE'],
        downstreamAuthorityMayBegin: primaryLane.candidate.state === 'CANDIDATE_READY'
      }
    };
  });
  const primaryCandidates = entries.map(entry => entry.primaryCandidate);
  const allLanes = entries.flatMap(entry => entry.targetLocaleLanes);
  const result = {
    schemaVersion: 'PHI-OS-APS-4-CANDIDATE-ORCHESTRATION-v1.0.0',
    work: 'APS-4',
    status: primaryCandidates.every(candidate => candidate.state === 'CANDIDATE_READY')
      ? 'PRIMARY_CANDIDATES_RESOLVED_FOR_APS_5_REVIEW_BATCH'
      : 'PRIMARY_CANDIDATE_ORCHESTRATION_REQUIRES_GENERATION_OR_REPAIR',
    implementationBaselineCommit: APS4_BASELINE,
    contractReference: APS4_CONTRACT,
    apsL10nContractReference: APS_L10N_CONTRACT,
    apsL10nReconciliationReference: APS_L10N_RECONCILIATION,
    batchCode: batchPlan.batchCode,
    createdAt: createdAt || new Date().toISOString(),
    sourceBatch: {
      work: 'APS-3',
      batchCode: batchPlan.batchCode,
      batchDigest: batchPlan.batchDigest,
      request: batchPlan.request
    },
    targetLocales: locales,
    summary: {
      selectedNodeCount: entries.length,
      primaryCandidateReadyCount: primaryCandidates.filter(candidate => candidate.state === 'CANDIDATE_READY').length,
      reusedExistingPrimaryCandidateCount: primaryCandidates.filter(candidate => candidate.resolution === 'REUSED_EXISTING_GOVERNED_PJA_CANDIDATE').length,
      primaryCandidateGenerationRequiredCount: primaryCandidates.filter(candidate => candidate.resolution === 'GOVERNED_CANDIDATE_GENERATION_REQUIRED').length,
      primaryCandidateConflictCount: primaryCandidates.filter(candidate => candidate.state === 'CANDIDATE_CONFLICT').length,
      localeLaneCount: allLanes.length,
      localeCandidateReadyCount: allLanes.filter(lane => lane.state === 'CANDIDATE_READY_FOR_LOCALE_AUTHORITY').length,
      localeDiscoveryBlockedCount: allLanes.filter(lane => lane.state === 'BLOCKED_LOCALE_AUTHORITY_DISCOVERY').length,
      localeGenerationRequiredCount: allLanes.filter(lane => lane.state === 'GOVERNED_CANDIDATE_GENERATION_REQUIRED').length,
      reusableHumanReviewCount: allLanes.filter(lane => lane.existingHumanEvidence.review.accepted).length,
      reusableHumanApprovalCount: allLanes.filter(lane => lane.existingHumanEvidence.approval.approved).length,
      localePublicationAuthorityPresentCount: allLanes.filter(lane => lane.existingHumanEvidence.publication.published).length
    },
    entries,
    governance: {
      candidateEqualsAuthority: false,
      existingValidCandidateMustBeReused: true,
      existingCandidateMutationAllowed: false,
      implicitPaidAiInvocationAllowed: false,
      missingCandidateMayBeFabricatedFromMetadata: false,
      missingCandidateRequiresGovernedGenerationAdapter: true,
      humanReviewMayBeInferred: false,
      humanApprovalMayBeInferred: false,
      humanPublicationMayBeInferred: false,
      localeAuthorityInheritanceAllowed: false,
      zhHansToEnglishTranslationInheritanceAllowed: false,
      carAuthorityOwnedByCar: true,
      cprAuthorityOwnedByCpr: true,
      visualArticleReleaseOwnedByVap: true,
      sameRouteRuntimeChoosesLocale: true
    },
    nextWork: 'APS-5_REVIEW_BATCH_ASSEMBLY'
  };
  const digestInput = structuredClone(result);
  result.orchestrationDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}

export function candidateOrchestrationPath(batchCode) {
  return `content/production/article-simplification/batches/${batchCode}/candidate-orchestration.v1.json`;
}

function equivalentCurrent(existing, current) {
  if (existing?.work !== 'APS-4' || existing?.batchCode !== current.batchCode) return false;
  if (existing?.sourceBatch?.batchDigest !== current.sourceBatch.batchDigest) return false;
  if (JSON.stringify(existing?.targetLocales) !== JSON.stringify(current.targetLocales)) return false;
  const existingCandidates = (existing.entries || []).map(entry => [entry.nodeCode, entry.primaryCandidate?.candidateDigest, entry.primaryCandidate?.fileDigest]);
  const currentCandidates = (current.entries || []).map(entry => [entry.nodeCode, entry.primaryCandidate?.candidateDigest, entry.primaryCandidate?.fileDigest]);
  const existingLanes = (existing.entries || []).flatMap(entry => (entry.targetLocaleLanes || []).map(lane => [entry.nodeCode, lane.locale, lane.state, lane.candidate?.candidateDigest, lane.localeIdentity?.slug]));
  const currentLanes = (current.entries || []).flatMap(entry => (entry.targetLocaleLanes || []).map(lane => [entry.nodeCode, lane.locale, lane.state, lane.candidate?.candidateDigest, lane.localeIdentity?.slug]));
  return JSON.stringify(existingCandidates) === JSON.stringify(currentCandidates) && JSON.stringify(existingLanes) === JSON.stringify(currentLanes);
}

export function writeCandidateOrchestration(root, batchPlan, options = {}) {
  const current = buildCandidateOrchestration(root, batchPlan, options);
  const outputPath = candidateOrchestrationPath(batchPlan.batchCode);
  if (exists(root, outputPath)) {
    const existing = readJson(root, outputPath);
    if (!equivalentCurrent(existing, current)) throw new Error(`${outputPath} exists but no longer matches current candidate/locale evidence`);
    return { orchestration: existing, outputPath, reusedExistingOrchestration: true };
  }
  fs.mkdirSync(path.dirname(abs(root, outputPath)), { recursive: true });
  fs.writeFileSync(abs(root, outputPath), stableJson(current), 'utf8');
  return { orchestration: current, outputPath, reusedExistingOrchestration: false };
}

export function vapL10nReferenceState(root) {
  const manifest = readJson(root, VISUAL_RELEASE);
  const records = (manifest.records || []).filter(record => record.nodeCode === 'KN-PREFACE-001');
  const zh = records.find(record => record.locale === 'zh-Hans') || null;
  const en = records.find(record => record.locale === 'en') || null;
  return {
    nodeCode: 'KN-PREFACE-001',
    zhHans: zh,
    en,
    sameSlug: Boolean(zh && en && zh.slug === en.slug),
    sameHref: Boolean(zh && en && zh.href === en.href),
    bothPublished: Boolean(zh?.status === 'published' && en?.status === 'published')
  };
}
