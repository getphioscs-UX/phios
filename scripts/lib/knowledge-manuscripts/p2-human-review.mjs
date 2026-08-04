import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';

export const T05_SCHEMA_VERSION = 'PHI-OS-KNR-W2R1-P2-HUMAN-REVIEW-v1.0.0';
export const P2_CANDIDATE_RELATIVE =
  '.tmp/knowledge-manuscripts/book-1/p2-projection-system-candidate.md';
export const P2_EXTRACTION_REPORT_RELATIVE =
  '.tmp/knowledge-manuscripts/book-1/p2-projection-system-extraction-report.json';
export const P2_HUMAN_REVIEW_RELATIVE =
  '.tmp/knowledge-manuscripts/book-1/p2-projection-system-human-review.json';
export const P2_MANIFEST_RELATIVE =
  'content/knowledge/manuscripts/book-1/manuscript-manifest.json';
export const P2_R2_TARGET = 'books/book-1/extracted/p2-projection-system.md';

export const REQUIRED_REVIEW_CHECKS = Object.freeze([
  'titles',
  'paragraphs',
  'order',
  'encoding',
  'completeness',
  'headings',
  'page-numbers',
  'figure-captions',
  'theoretical-meaning'
]);

const REQUIRED_CREDENTIALS = Object.freeze([
  'PHIOS_MANUSCRIPT_R2_ACCOUNT_ID',
  'PHIOS_MANUSCRIPT_R2_BUCKET',
  'PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID',
  'PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY'
]);

const clean = value => typeof value === 'string' ? value.trim() : '';
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const clone = value => JSON.parse(JSON.stringify(value));

function resolvePrivate(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw coded('P2_PRIVATE_PATH_ESCAPE', { path: relativePath });
  }
  return resolved;
}

function readJson(file, code) {
  if (!fs.existsSync(file)) throw coded(code);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error?.code) throw error;
    throw coded(`${code}_INVALID_JSON`);
  }
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJsonIfChanged(file, value, mode) {
  const next = jsonText(value);
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === next) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.partial-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(temporary, next, { flag: 'wx', mode });
    fs.renameSync(temporary, file);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
  return true;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function isoNow(now) {
  const supplied = typeof now === 'function' ? now() : new Date();
  const value = supplied instanceof Date ? supplied : new Date(supplied);
  if (Number.isNaN(value.getTime())) throw coded('P2_REVIEW_TIMESTAMP_INVALID');
  return value.toISOString();
}

function loadManifest(root) {
  const file = resolvePrivate(root, P2_MANIFEST_RELATIVE);
  const manifest = readJson(file, 'P2_MANIFEST_MISSING');
  if (manifest.bookCode !== 'BOOK-1') throw coded('P2_MANIFEST_BOOK_MISMATCH');
  if (manifest.publicAccess !== 'disabled') throw coded('P2_PUBLIC_ACCESS_MUST_BE_DISABLED');
  if (manifest.retrievalEligibility !== 'internal_only') {
    throw coded('P2_RETRIEVAL_MUST_BE_INTERNAL_ONLY');
  }
  if (!/(?:^|-)private(?:-|$)/u.test(clean(manifest.r2Bucket))) {
    throw coded('P2_PRIVATE_BUCKET_REQUIRED');
  }
  const part = manifest.parts?.find(item => item.partCode === 'P2');
  if (!part) throw coded('P2_MANIFEST_PART_MISSING');
  return { file, manifest, part };
}

function candidateState(root) {
  const candidateFile = resolvePrivate(root, P2_CANDIDATE_RELATIVE);
  const extractionReportFile = resolvePrivate(root, P2_EXTRACTION_REPORT_RELATIVE);
  if (!fs.existsSync(candidateFile)) throw coded('P2_CANDIDATE_MISSING');
  const bytes = fs.readFileSync(candidateFile);
  if (!bytes.length) throw coded('P2_CANDIDATE_EMPTY');
  const candidateText = bytes.toString('utf8');
  const extractionReport = readJson(extractionReportFile, 'P2_EXTRACTION_REPORT_MISSING');
  if (extractionReport.stage !== 'KNR-W2R1-T09-P2' || extractionReport.partCode !== 'P2') {
    throw coded('P2_EXTRACTION_REPORT_IDENTITY_MISMATCH');
  }
  if (extractionReport.candidate?.path !== P2_CANDIDATE_RELATIVE) {
    throw coded('P2_EXTRACTION_REPORT_PATH_MISMATCH');
  }
  if (extractionReport.r2TargetObjectKey !== P2_R2_TARGET) {
    throw coded('P2_EXTRACTION_REPORT_TARGET_MISMATCH');
  }
  if (extractionReport.ocrUsed !== false || extractionReport.r2UploadPerformed !== false) {
    throw coded('P2_EXTRACTION_BOUNDARY_MISMATCH');
  }
  return {
    candidateFile,
    extractionReportFile,
    extractionReport,
    bytes,
    text: candidateText,
    sha256: sha256(bytes),
    sizeBytes: bytes.length,
    characterCount: candidateText.length,
    sourceCandidateSha256: extractionReport.candidate?.sha256 || null
  };
}

export function automaticCandidateChecks(candidateText) {
  const lines = candidateText.split(/\r?\n/u);
  const headings = lines.filter(line => /^#{1,6}\s+\S/u.test(line));
  const findings = {
    replacementCharacterCount: [...candidateText].filter(character => character === '\uFFFD').length,
    decorativeHeadingMarkerCount: lines.filter(line => /^#{1,6}\s*[◈◆◇]/u.test(line)).length,
    standalonePageNumberCount: lines.filter(line => /^\s*(?:第\s*)?[0-9０-９]+(?:\s*页)?\s*$/u.test(line)).length,
    splitHeadingFragmentCount: lines.filter(line => /^#{1,6}\s+己的生命过程\s*$/u.test(line)).length,
    headingCount: headings.length,
    h1Count: headings.filter(line => /^#\s+/u.test(line)).length
  };
  const blockers = [];
  if (findings.replacementCharacterCount) blockers.push('replacement_characters');
  if (findings.decorativeHeadingMarkerCount) blockers.push('decorative_heading_markers');
  if (findings.standalonePageNumberCount) blockers.push('standalone_page_numbers');
  if (findings.splitHeadingFragmentCount) blockers.push('split_heading_fragment');
  if (findings.h1Count !== 1) blockers.push('root_heading_count');
  if (findings.headingCount < 2) blockers.push('heading_structure_missing');
  return { status: blockers.length ? 'blocked' : 'passed', findings, blockers };
}

function reviewChecklist(confirmations) {
  const supplied = [...new Set((confirmations || []).map(clean).filter(Boolean))];
  const unknown = supplied.filter(item => !REQUIRED_REVIEW_CHECKS.includes(item));
  const missing = REQUIRED_REVIEW_CHECKS.filter(item => !supplied.includes(item));
  return {
    supplied,
    unknown,
    missing,
    checks: Object.fromEntries(REQUIRED_REVIEW_CHECKS.map(item => [item, supplied.includes(item)]))
  };
}

function approvalReport(root) {
  const file = resolvePrivate(root, P2_HUMAN_REVIEW_RELATIVE);
  return { file, report: fs.existsSync(file) ? readJson(file, 'P2_HUMAN_REVIEW_REPORT_INVALID') : null };
}

function manifestApprovalMatches(manifest, candidateHash) {
  const part = manifest.parts.find(item => item.partCode === 'P2');
  return part?.normalizationStatus === 'human_verified' &&
    part?.humanVerified === true &&
    manifest.contentHashes?.normalizedParts?.P2 === candidateHash;
}

function reportApprovalMatches(report, candidateHash) {
  return report?.stage === 'KNR-W2R1-T09-P2' &&
    report?.bookCode === 'BOOK-1' &&
    report?.partCode === 'P2' &&
    report?.reviewerRole === 'TL' &&
    report?.candidate?.sha256 === candidateHash &&
    report?.normalizationStatus === 'human_verified' &&
    report?.humanVerified === true &&
    REQUIRED_REVIEW_CHECKS.every(item => report?.reviewChecklist?.[item] === true);
}

function commonResult(candidate, automatic, overrides = {}) {
  return {
    schemaVersion: T05_SCHEMA_VERSION,
    stage: 'KNR-W2R1-T09-P2',
    bookCode: 'BOOK-1',
    partCode: 'P2',
    candidatePath: P2_CANDIDATE_RELATIVE,
    candidateSha256: candidate.sha256,
    candidateSizeBytes: candidate.sizeBytes,
    candidateCharacterCount: candidate.characterCount,
    sourceCandidateSha256: candidate.sourceCandidateSha256,
    candidateChangedAfterExtraction: candidate.sha256 !== candidate.sourceCandidateSha256,
    automaticChecks: automatic,
    r2TargetObjectKey: P2_R2_TARGET,
    privateMaterialization: true,
    gitEligible: false,
    publicBuildEligible: false,
    publicIndexEligible: false,
    publishedArticleEligible: false,
    productionPackageEligible: false,
    productionModified: false,
    credentialsPersisted: false,
    ...overrides
  };
}

export function reviewP2Candidate({
  root,
  mode = 'dry-run',
  expectedSha256 = null,
  reviewerRole = null,
  confirmations = [],
  now
}) {
  if (!['dry-run', 'approve'].includes(mode)) throw coded('P2_REVIEW_MODE_INVALID');
  const candidate = candidateState(root);
  const automatic = automaticCandidateChecks(candidate.text);
  const { file: manifestFile, manifest } = loadManifest(root);
  const { file: reviewFile, report: existingReport } = approvalReport(root);
  const checklist = reviewChecklist(confirmations);

  if (mode === 'dry-run') {
    const verified = reportApprovalMatches(existingReport, candidate.sha256) &&
      manifestApprovalMatches(manifest, candidate.sha256);
    return commonResult(candidate, automatic, {
      command: 'review-p2',
      mode,
      status: verified ? 'human_verified' : 'human_review_required',
      normalizationStatus: verified ? 'human_verified' : 'human_review_required',
      humanVerified: verified,
      requiredReviewChecks: REQUIRED_REVIEW_CHECKS,
      reviewReportPath: P2_HUMAN_REVIEW_RELATIVE,
      reviewReportPresent: Boolean(existingReport),
      writes: 0,
      manifestWrites: 0,
      r2UploadPerformed: false,
      remoteRequestPerformed: false,
      nextAction: verified ? 'PRIVATE_R2_UPLOAD_DRY_RUN' : 'TL_HUMAN_REVIEW_AND_APPROVAL'
    });
  }

  if (!/^[a-f0-9]{64}$/u.test(clean(expectedSha256))) {
    throw coded('P2_REVIEW_EXPECTED_SHA256_REQUIRED');
  }
  if (expectedSha256 !== candidate.sha256) {
    throw coded('P2_REVIEW_CANDIDATE_HASH_MISMATCH', {
      expected: expectedSha256,
      actual: candidate.sha256
    });
  }
  if (reviewerRole !== 'TL') throw coded('P2_REVIEWER_ROLE_TL_REQUIRED');
  if (checklist.unknown.length || checklist.missing.length) {
    throw coded('P2_HUMAN_REVIEW_CHECKLIST_INCOMPLETE', {
      missing: checklist.missing,
      unknown: checklist.unknown
    });
  }
  if (automatic.status !== 'passed') {
    throw coded('P2_AUTOMATIC_REVIEW_BLOCKED', { blockers: automatic.blockers });
  }
  if (existingReport && !reportApprovalMatches(existingReport, candidate.sha256)) {
    throw coded('P2_EXISTING_APPROVAL_CONFLICT');
  }

  const nextManifest = clone(manifest);
  const nextPart = nextManifest.parts.find(item => item.partCode === 'P2');
  nextPart.normalizationStatus = 'human_verified';
  nextPart.humanVerified = true;
  nextManifest.contentHashes.normalizedParts.P2 = candidate.sha256;

  const reviewedAt = existingReport?.reviewedAt || isoNow(now);
  const nextReport = existingReport || {
    schemaVersion: T05_SCHEMA_VERSION,
    stage: 'KNR-W2R1-T09-P2',
    bookCode: 'BOOK-1',
    partCode: 'P2',
    reviewerRole: 'TL',
    reviewedAt,
    sourceExtraction: {
      reportPath: P2_EXTRACTION_REPORT_RELATIVE,
      sourceCandidateSha256: candidate.sourceCandidateSha256
    },
    candidate: {
      path: P2_CANDIDATE_RELATIVE,
      sha256: candidate.sha256,
      sizeBytes: candidate.sizeBytes,
      characterCount: candidate.characterCount,
      changedAfterExtraction: candidate.sha256 !== candidate.sourceCandidateSha256
    },
    reviewChecklist: checklist.checks,
    automaticChecks: automatic,
    normalizationStatus: 'human_verified',
    humanVerified: true,
    r2TargetObjectKey: P2_R2_TARGET,
    upload: {
      status: 'not_uploaded',
      uploadedAt: null,
      etag: null,
      versionId: null
    },
    publicEligibility: false,
    productionModified: false
  };

  const reportWritten = writeJsonIfChanged(reviewFile, nextReport, 0o600);
  const manifestWritten = writeJsonIfChanged(manifestFile, nextManifest, 0o644);
  return commonResult(candidate, automatic, {
    command: 'review-p2',
    mode,
    status: reportWritten || manifestWritten ? 'human_verified' : 'already_human_verified',
    normalizationStatus: 'human_verified',
    humanVerified: true,
    reviewerRole: 'TL',
    reviewedAt,
    reviewChecklist: checklist.checks,
    reviewReportPath: P2_HUMAN_REVIEW_RELATIVE,
    writes: Number(reportWritten) + Number(manifestWritten),
    manifestWrites: Number(manifestWritten),
    r2UploadPerformed: false,
    remoteRequestPerformed: false,
    nextAction: 'PRIVATE_R2_UPLOAD_DRY_RUN'
  });
}

function credentialState(env) {
  const configuredVariables = REQUIRED_CREDENTIALS.filter(name => clean(env[name]));
  const missingVariables = REQUIRED_CREDENTIALS.filter(name => !clean(env[name]));
  return {
    status: configuredVariables.length === 0
      ? 'not_configured'
      : missingVariables.length === 0 ? 'configured' : 'incomplete',
    configuredVariables,
    missingVariables
  };
}

function credentialsFor(manifest, env, required) {
  const state = credentialState(env);
  if (state.status === 'incomplete') {
    throw coded('P2_R2_CREDENTIALS_INCOMPLETE', { missingVariables: state.missingVariables });
  }
  if (required && state.status !== 'configured') {
    throw coded('P2_R2_CREDENTIALS_REQUIRED', { missingVariables: state.missingVariables });
  }
  if (state.status !== 'configured') return { state, credentials: null };
  const accountId = clean(env.PHIOS_MANUSCRIPT_R2_ACCOUNT_ID);
  const bucket = clean(env.PHIOS_MANUSCRIPT_R2_BUCKET);
  if (!/^[a-f0-9]{32}$/iu.test(accountId)) throw coded('P2_R2_ACCOUNT_ID_INVALID');
  if (bucket !== manifest.r2Bucket) {
    throw coded('P2_R2_BUCKET_MANIFEST_MISMATCH', { expectedBucket: manifest.r2Bucket });
  }
  return {
    state,
    credentials: {
      accountId,
      bucket,
      accessKeyId: clean(env.PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID),
      secretAccessKey: clean(env.PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY)
    }
  };
}

function createR2Client(credentials) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${credentials.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    }
  });
}

function normalizeEtag(value) {
  return clean(value).replace(/^"|"$/gu, '') || null;
}

function remoteFailure(error, fallback = 'P2_R2_REQUEST_FAILED') {
  const status = Number(error?.$metadata?.httpStatusCode || 0);
  if (status === 401 || status === 403) return coded('P2_R2_ACCESS_DENIED');
  if (status === 412) return coded('P2_R2_CONDITIONAL_WRITE_CONFLICT');
  return coded(fallback, { httpStatus: status || null });
}

async function headObject(client, bucket, key) {
  try {
    return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    const status = Number(error?.$metadata?.httpStatusCode || 0);
    if (status === 404 || ['NoSuchKey', 'NotFound'].includes(error?.name)) return null;
    throw remoteFailure(error, 'P2_R2_HEAD_FAILED');
  }
}

function assertRemoteObject(head, candidate) {
  const checks = {
    contentType: clean(head?.ContentType).split(';')[0] === 'text/markdown',
    sizeBytes: Number(head?.ContentLength) === candidate.sizeBytes,
    sha256: clean(head?.Metadata?.sha256).toLowerCase() === candidate.sha256,
    humanVerified: clean(head?.Metadata?.humanverified).toLowerCase() === 'true'
  };
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) throw coded('P2_R2_TARGET_CONFLICT', { failedChecks: failed });
  return checks;
}

function assertApproved(manifest, report, candidate) {
  if (!reportApprovalMatches(report, candidate.sha256)) {
    throw coded('P2_HUMAN_APPROVAL_REQUIRED');
  }
  if (!manifestApprovalMatches(manifest, candidate.sha256)) {
    throw coded('P2_MANIFEST_HUMAN_APPROVAL_REQUIRED');
  }
}

export async function uploadApprovedP2({
  root,
  mode = 'dry-run',
  env = process.env,
  clientFactory = createR2Client,
  now
}) {
  if (!['dry-run', 'apply'].includes(mode)) throw coded('P2_UPLOAD_MODE_INVALID');
  const candidate = candidateState(root);
  const automatic = automaticCandidateChecks(candidate.text);
  if (automatic.status !== 'passed') {
    throw coded('P2_AUTOMATIC_REVIEW_BLOCKED', { blockers: automatic.blockers });
  }
  const { file: manifestFile, manifest } = loadManifest(root);
  const { file: reviewFile, report } = approvalReport(root);
  assertApproved(manifest, report, candidate);
  const { state: credentialsState, credentials } = credentialsFor(manifest, env, mode === 'apply');

  if (mode === 'dry-run') {
    return commonResult(candidate, automatic, {
      command: 'upload-p2',
      mode,
      status: 'ready_for_private_r2_upload',
      normalizationStatus: 'human_verified',
      humanVerified: true,
      reviewerRole: 'TL',
      reviewReportPath: P2_HUMAN_REVIEW_RELATIVE,
      credentials: credentialsState,
      writes: 0,
      manifestWrites: 0,
      r2UploadPerformed: false,
      remoteRequestPerformed: false,
      nextAction: credentials ? 'PRIVATE_R2_UPLOAD_APPLY' : 'CONFIGURE_R2_CREDENTIALS'
    });
  }

  const existingManifestObject = manifest.objects.find(object => object.objectKey === P2_R2_TARGET);
  if (existingManifestObject && existingManifestObject.sha256 !== candidate.sha256) {
    throw coded('P2_MANIFEST_TARGET_CONFLICT');
  }

  const client = clientFactory(credentials);
  let uploadPerformed = false;
  let remoteHead;
  try {
    remoteHead = await headObject(client, credentials.bucket, P2_R2_TARGET);
    if (remoteHead) {
      assertRemoteObject(remoteHead, candidate);
    } else {
      try {
        const body = fs.createReadStream(candidate.candidateFile);
        await client.send(new PutObjectCommand({
          Bucket: credentials.bucket,
          Key: P2_R2_TARGET,
          Body: body,
          ContentLength: candidate.sizeBytes,
          ContentType: 'text/markdown',
          CacheControl: 'private, no-store',
          Metadata: {
            sha256: candidate.sha256,
            bookcode: 'BOOK-1',
            partcode: 'P2',
            humanverified: 'true'
          }
        }));
        uploadPerformed = true;
      } catch (error) {
        throw remoteFailure(error, 'P2_R2_UPLOAD_FAILED');
      }
      remoteHead = await headObject(client, credentials.bucket, P2_R2_TARGET);
      if (!remoteHead) throw coded('P2_R2_POST_UPLOAD_HEAD_MISSING');
      assertRemoteObject(remoteHead, candidate);
    }
  } finally {
    if (client && typeof client.destroy === 'function') client.destroy();
  }

  const uploadedAt = report.upload?.uploadedAt || isoNow(now);
  const etag = normalizeEtag(remoteHead.ETag);
  const versionId = clean(remoteHead.VersionId) || null;
  const nextReport = clone(report);
  nextReport.upload = {
    status: 'content_verified_private_r2',
    uploadedAt,
    etag,
    versionId
  };

  const nextManifest = clone(manifest);
  const nextPart = nextManifest.parts.find(item => item.partCode === 'P2');
  nextPart.normalizedObjectKey = P2_R2_TARGET;
  nextPart.normalizationStatus = 'human_verified';
  nextPart.humanVerified = true;
  nextManifest.contentHashes.normalizedParts.P2 = candidate.sha256;
  const objectRecord = {
    objectRole: 'part_extraction',
    objectKey: P2_R2_TARGET,
    contentType: 'text/markdown',
    sizeBytes: candidate.sizeBytes,
    sha256: candidate.sha256,
    etag,
    versionId,
    authoritative: false,
    uploadedAt,
    verificationStatus: 'content_verified'
  };
  const objectIndex = nextManifest.objects.findIndex(object => object.objectKey === P2_R2_TARGET);
  if (objectIndex === -1) nextManifest.objects.push(objectRecord);
  else nextManifest.objects[objectIndex] = objectRecord;

  const reportWritten = writeJsonIfChanged(reviewFile, nextReport, 0o600);
  const manifestWritten = writeJsonIfChanged(manifestFile, nextManifest, 0o644);
  return commonResult(candidate, automatic, {
    command: 'upload-p2',
    mode,
    status: 'private_r2_upload_verified',
    normalizationStatus: 'human_verified',
    humanVerified: true,
    reviewerRole: 'TL',
    reviewReportPath: P2_HUMAN_REVIEW_RELATIVE,
    credentials: credentialsState,
    remoteChecks: {
      objectKey: 'passed',
      contentType: 'passed',
      sizeBytes: 'passed',
      sha256: 'passed',
      humanVerifiedMetadata: 'passed',
      publicAccess: 'manifest_disabled'
    },
    etag,
    versionId,
    writes: Number(uploadPerformed) + Number(reportWritten) + Number(manifestWritten),
    manifestWrites: Number(manifestWritten),
    r2UploadPerformed: uploadPerformed,
    remoteRequestPerformed: true,
    nextAction: 'KNR_W2R1_T05_ACCEPTANCE_CHECK'
  });
}

export { coded };
