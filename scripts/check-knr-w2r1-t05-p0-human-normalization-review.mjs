import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  P0_CANDIDATE_RELATIVE,
  P0_EXTRACTION_REPORT_RELATIVE,
  P0_HUMAN_REVIEW_RELATIVE,
  P0_MANIFEST_RELATIVE,
  P0_R2_TARGET,
  REQUIRED_REVIEW_CHECKS,
  automaticCandidateChecks,
  reviewP0Candidate,
  uploadApprovedP0
} from './lib/knowledge-manuscripts/p0-human-review.mjs';
import { parseP0ReviewArgs } from './review-book-i-p0.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(repositoryRoot, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const sha256 = value => createHash('sha256').update(value).digest('hex');

const packageJson = json('package.json');
const repositoryManifest = json(P0_MANIFEST_RELATIVE);
const manifestSchema = json('content/knowledge/manuscripts/schemas/manuscript-manifest.schema.json');
const gitignore = read('.gitignore');
const cliSource = read('scripts/review-book-i-p0.mjs');
const implementationSource = read('scripts/lib/knowledge-manuscripts/p0-human-review.mjs');

assert.equal(
  packageJson.scripts['knowledge:manuscript:review-p0'],
  'node scripts/review-book-i-p0.mjs review'
);
assert.equal(
  packageJson.scripts['knowledge:manuscript:upload-p0'],
  'node scripts/review-book-i-p0.mjs upload'
);
assert.equal(
  packageJson.scripts['check:knr-w2r1-t05'],
  'node scripts/check-knr-w2r1-t05-p0-human-normalization-review.mjs'
);
assert(gitignore.split(/\r?\n/u).includes('.tmp/knowledge-manuscripts/'));
assert.equal(repositoryManifest.publicAccess, 'disabled');
assert.equal(repositoryManifest.retrievalEligibility, 'internal_only');
assert(manifestSchema.$defs.manuscriptPart.properties.normalizationStatus.enum.includes('human_verified'));
assert.deepEqual(REQUIRED_REVIEW_CHECKS, [
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
assert(P0_CANDIDATE_RELATIVE.startsWith('.tmp/knowledge-manuscripts/'));
assert(P0_EXTRACTION_REPORT_RELATIVE.startsWith('.tmp/knowledge-manuscripts/'));
assert(P0_HUMAN_REVIEW_RELATIVE.startsWith('.tmp/knowledge-manuscripts/'));
assert.equal(P0_R2_TARGET, 'books/book-1/extracted/p0-preface.md');
assert(implementationSource.includes("IfNoneMatch: '*'"));
assert(implementationSource.includes("CacheControl: 'private, no-store'"));
assert(implementationSource.includes("humanverified: 'true'"));
assert(implementationSource.includes("authoritative: false"));
assert(!/publicUrl|presignedUrl|r2\.dev|PutObjectAcl|public-read/u.test(implementationSource));
assert(!/PHIOS_MANUSCRIPT_R2_(?:ACCOUNT_ID|ACCESS_KEY_ID|SECRET_ACCESS_KEY)\s*[:=]\s*['"][^'"]+['"]/u.test(
  `${cliSource}\n${implementationSource}`
));

assert.deepEqual(parseP0ReviewArgs('review', []), {
  command: 'review',
  mode: 'dry-run',
  expectedSha256: null,
  reviewerRole: null,
  confirmations: []
});
assert.deepEqual(parseP0ReviewArgs('upload', []), { command: 'upload', mode: 'dry-run' });
assert.deepEqual(parseP0ReviewArgs('upload', ['--apply']), { command: 'upload', mode: 'apply' });
assert.throws(
  () => parseP0ReviewArgs('upload', ['--dry-run', '--apply']),
  error => error.code === 'P0_UPLOAD_MODE_CONFLICT'
);
assert.throws(
  () => parseP0ReviewArgs('review', ['--candidate-sha256', 'a'.repeat(64)]),
  error => error.code === 'P0_REVIEW_APPROVAL_ARGUMENTS_REQUIRE_APPROVE'
);

const candidateText = `---
schemaVersion: PHI-OS-KNR-W2R1-P0-CANDIDATE-v1.0.0
bookCode: BOOK-1
partCode: P0
---

# 为什么需要 PHI OS

现实需要通过结构、条件与持续运行被理解，而不是仅被视为静态结果。

## 序章｜文明断裂 Reality Breakdown

文明断裂不是遥远的未来，而是当前系统失配逐步显现的结果。

## 为什么现实不是一个对象，而是一种持续形成自己的生命过程

现实持续形成、运行并重组自身；人工复核必须保持原有理论含义。
`;

assert.deepEqual(automaticCandidateChecks(candidateText).blockers, []);
assert(automaticCandidateChecks(`${candidateText}\n�`).blockers.includes('replacement_characters'));
assert(automaticCandidateChecks(`${candidateText}\n## 己的生命过程`).blockers.includes('split_heading_fragment'));

function resetManifest() {
  const manifest = JSON.parse(JSON.stringify(repositoryManifest));
  const part = manifest.parts.find(item => item.partCode === 'P0');
  part.normalizedObjectKey = null;
  part.normalizationStatus = 'not_materialized';
  part.humanVerified = false;
  manifest.contentHashes.normalizedParts.P0 = null;
  manifest.objects = manifest.objects.filter(object => object.objectKey !== P0_R2_TARGET);
  return manifest;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'phios-knr-w2r1-t05-'));
  const candidateFile = path.join(root, P0_CANDIDATE_RELATIVE);
  const candidateHash = sha256(candidateText);
  fs.mkdirSync(path.dirname(candidateFile), { recursive: true });
  fs.writeFileSync(candidateFile, candidateText, { encoding: 'utf8', mode: 0o600 });
  writeJson(path.join(root, P0_EXTRACTION_REPORT_RELATIVE), {
    schemaVersion: 'PHI-OS-KNR-W2R1-P0-EXTRACTION-REPORT-v1.0.0',
    stage: 'KNR-W2R1-T04',
    bookCode: 'BOOK-1',
    partCode: 'P0',
    extractionMethod: 'searchable_pdf_text_layer',
    ocrUsed: false,
    candidate: {
      path: P0_CANDIDATE_RELATIVE,
      sha256: candidateHash,
      characterCount: candidateText.length,
      normalizationStatus: 'human_review_required',
      humanVerified: false
    },
    r2TargetObjectKey: P0_R2_TARGET,
    r2UploadPerformed: false,
    publicEligibility: false,
    productionModified: false
  });
  writeJson(path.join(root, P0_MANIFEST_RELATIVE), resetManifest());
  return { root, candidateFile, candidateHash };
}

const fixedNow = () => new Date('2026-08-03T13:00:00.000Z');
const fullConfirmations = [...REQUIRED_REVIEW_CHECKS];
const fixture = createFixtureRoot();

try {
  const dryRun = reviewP0Candidate({ root: fixture.root, mode: 'dry-run', now: fixedNow });
  assert.equal(dryRun.status, 'human_review_required');
  assert.equal(dryRun.humanVerified, false);
  assert.equal(dryRun.writes, 0);
  assert.equal(dryRun.r2UploadPerformed, false);
  assert(!fs.existsSync(path.join(fixture.root, P0_HUMAN_REVIEW_RELATIVE)));

  assert.throws(
    () => reviewP0Candidate({
      root: fixture.root,
      mode: 'approve',
      expectedSha256: fixture.candidateHash,
      reviewerRole: 'TL',
      confirmations: fullConfirmations.slice(0, -1),
      now: fixedNow
    }),
    error => error.code === 'P0_HUMAN_REVIEW_CHECKLIST_INCOMPLETE'
  );
  assert.throws(
    () => reviewP0Candidate({
      root: fixture.root,
      mode: 'approve',
      expectedSha256: '0'.repeat(64),
      reviewerRole: 'TL',
      confirmations: fullConfirmations,
      now: fixedNow
    }),
    error => error.code === 'P0_REVIEW_CANDIDATE_HASH_MISMATCH'
  );
  assert.throws(
    () => reviewP0Candidate({
      root: fixture.root,
      mode: 'approve',
      expectedSha256: fixture.candidateHash,
      reviewerRole: 'EDITOR',
      confirmations: fullConfirmations,
      now: fixedNow
    }),
    error => error.code === 'P0_REVIEWER_ROLE_TL_REQUIRED'
  );

  const approved = reviewP0Candidate({
    root: fixture.root,
    mode: 'approve',
    expectedSha256: fixture.candidateHash,
    reviewerRole: 'TL',
    confirmations: fullConfirmations,
    now: fixedNow
  });
  assert.equal(approved.status, 'human_verified');
  assert.equal(approved.humanVerified, true);
  assert.equal(approved.normalizationStatus, 'human_verified');
  assert.equal(approved.r2UploadPerformed, false);
  assert.equal(approved.manifestWrites, 1);
  const approvedManifest = JSON.parse(fs.readFileSync(path.join(fixture.root, P0_MANIFEST_RELATIVE), 'utf8'));
  const approvedPart = approvedManifest.parts.find(item => item.partCode === 'P0');
  assert.equal(approvedPart.normalizationStatus, 'human_verified');
  assert.equal(approvedPart.humanVerified, true);
  assert.equal(approvedPart.normalizedObjectKey, null);
  assert.equal(approvedManifest.contentHashes.normalizedParts.P0, fixture.candidateHash);
  const humanReport = JSON.parse(fs.readFileSync(path.join(fixture.root, P0_HUMAN_REVIEW_RELATIVE), 'utf8'));
  assert.equal(humanReport.reviewerRole, 'TL');
  assert.equal(humanReport.upload.status, 'not_uploaded');
  assert(REQUIRED_REVIEW_CHECKS.every(item => humanReport.reviewChecklist[item] === true));

  const idempotentApproval = reviewP0Candidate({
    root: fixture.root,
    mode: 'approve',
    expectedSha256: fixture.candidateHash,
    reviewerRole: 'TL',
    confirmations: fullConfirmations,
    now: fixedNow
  });
  assert.equal(idempotentApproval.status, 'already_human_verified');
  assert.equal(idempotentApproval.writes, 0);

  const uploadDryRun = await uploadApprovedP0({
    root: fixture.root,
    mode: 'dry-run',
    env: {},
    now: fixedNow
  });
  assert.equal(uploadDryRun.status, 'ready_for_private_r2_upload');
  assert.equal(uploadDryRun.credentials.status, 'not_configured');
  assert.equal(uploadDryRun.remoteRequestPerformed, false);
  assert.equal(uploadDryRun.writes, 0);

  fs.appendFileSync(fixture.candidateFile, '\n受控变更。\n', 'utf8');
  await assert.rejects(
    uploadApprovedP0({ root: fixture.root, mode: 'dry-run', env: {}, now: fixedNow }),
    error => error.code === 'P0_HUMAN_APPROVAL_REQUIRED'
  );
  fs.writeFileSync(fixture.candidateFile, candidateText, 'utf8');

  const env = {
    PHIOS_MANUSCRIPT_R2_ACCOUNT_ID: '0'.repeat(32),
    PHIOS_MANUSCRIPT_R2_BUCKET: repositoryManifest.r2Bucket,
    PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID: 'fixture-access-key',
    PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY: 'fixture-secret-key'
  };
  let headCount = 0;
  const calls = [];
  const client = {
    async send(command) {
      calls.push(command.constructor.name);
      if (command.constructor.name === 'HeadObjectCommand') {
        headCount += 1;
        if (headCount === 1) {
          const error = new Error('NotFound');
          error.name = 'NotFound';
          error.$metadata = { httpStatusCode: 404 };
          throw error;
        }
        return {
          ContentType: 'text/markdown',
          ContentLength: Buffer.byteLength(candidateText),
          Metadata: { sha256: fixture.candidateHash, humanverified: 'true' },
          ETag: '"fixture-etag"',
          VersionId: null
        };
      }
      assert.equal(command.constructor.name, 'PutObjectCommand');
      assert.equal(command.input.Bucket, repositoryManifest.r2Bucket);
      assert.equal(command.input.Key, P0_R2_TARGET);
      assert.equal(command.input.ContentType, 'text/markdown');
      assert.equal(command.input.CacheControl, 'private, no-store');
      assert.equal(command.input.IfNoneMatch, '*');
      assert.equal(command.input.Metadata.sha256, fixture.candidateHash);
      assert.equal(command.input.Metadata.humanverified, 'true');
      let uploadedSize = 0;
      for await (const chunk of command.input.Body) uploadedSize += chunk.length;
      assert.equal(uploadedSize, Buffer.byteLength(candidateText));
      return { ETag: '"fixture-etag"' };
    },
    destroy() {}
  };

  const uploaded = await uploadApprovedP0({
    root: fixture.root,
    mode: 'apply',
    env,
    clientFactory: () => client,
    now: fixedNow
  });
  assert.equal(uploaded.status, 'private_r2_upload_verified');
  assert.equal(uploaded.r2UploadPerformed, true);
  assert.equal(uploaded.remoteRequestPerformed, true);
  assert.deepEqual(calls, ['HeadObjectCommand', 'PutObjectCommand', 'HeadObjectCommand']);
  const uploadedManifest = JSON.parse(fs.readFileSync(path.join(fixture.root, P0_MANIFEST_RELATIVE), 'utf8'));
  const uploadedPart = uploadedManifest.parts.find(item => item.partCode === 'P0');
  assert.equal(uploadedPart.normalizedObjectKey, P0_R2_TARGET);
  const uploadedObject = uploadedManifest.objects.find(object => object.objectKey === P0_R2_TARGET);
  assert.equal(uploadedObject.objectRole, 'part_extraction');
  assert.equal(uploadedObject.authoritative, false);
  assert.equal(uploadedObject.sha256, fixture.candidateHash);
  assert.equal(uploadedObject.verificationStatus, 'content_verified');
  const uploadedReport = JSON.parse(fs.readFileSync(path.join(fixture.root, P0_HUMAN_REVIEW_RELATIVE), 'utf8'));
  assert.equal(uploadedReport.upload.status, 'content_verified_private_r2');
  assert.equal(uploadedReport.upload.etag, 'fixture-etag');

  const existingClient = {
    async send(command) {
      assert.equal(command.constructor.name, 'HeadObjectCommand');
      return {
        ContentType: 'text/markdown',
        ContentLength: Buffer.byteLength(candidateText),
        Metadata: { sha256: fixture.candidateHash, humanverified: 'true' },
        ETag: '"fixture-etag"',
        VersionId: null
      };
    },
    destroy() {}
  };
  const repeatedUpload = await uploadApprovedP0({
    root: fixture.root,
    mode: 'apply',
    env,
    clientFactory: () => existingClient,
    now: fixedNow
  });
  assert.equal(repeatedUpload.r2UploadPerformed, false);
  assert.equal(repeatedUpload.writes, 0);
} finally {
  fs.rmSync(fixture.root, { recursive: true, force: true });
}

const unapprovedFixture = createFixtureRoot();
try {
  await assert.rejects(
    uploadApprovedP0({ root: unapprovedFixture.root, mode: 'dry-run', env: {}, now: fixedNow }),
    error => error.code === 'P0_HUMAN_APPROVAL_REQUIRED'
  );
} finally {
  fs.rmSync(unapprovedFixture.root, { recursive: true, force: true });
}

console.log('✓ KNR-W2R1-T05 P0 Human Normalization Review contract passed.');
console.log('  TL approval requires the current Candidate SHA-256 and all nine explicit human checks.');
console.log('  Private R2 upload is blocked until Candidate, review record and Manifest hashes agree.');
console.log('  Existing remote content is accepted only when metadata matches; conflicting content is never overwritten.');
console.log('  Manuscript body, review evidence and credentials remain outside Git, public builds and Production.');
