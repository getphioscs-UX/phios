import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(
  ROOT,
  'content/knowledge/manuscripts/book-1/manuscript-manifest.json'
);
const INVENTORY_PATH = path.join(
  ROOT,
  'content/knowledge/manuscripts/book-1/book-1-section-inventory.json'
);
const MAPPING_PATH = path.join(
  ROOT,
  'content/knowledge/manuscripts/book-1/node-manuscript-mapping.json'
);
const MATERIALIZATION_ROOT = path.join(
  ROOT,
  '.tmp/knowledge-manuscripts/book-1'
);
const COMMANDS = new Set(['verify', 'inventory', 'map', 'status']);
const CREDENTIAL_ENV_NAMES = Object.freeze([
  'PHIOS_MANUSCRIPT_R2_ACCOUNT_ID',
  'PHIOS_MANUSCRIPT_R2_BUCKET',
  'PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID',
  'PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY'
]);
const PROHIBITED_KEYS = new Set([
  'publicUrl',
  'presignedUrl',
  'secret',
  'accessKey',
  'secretKey',
  'apiToken',
  'credential'
]);
const SECTION_HASH_PATTERN = /^[a-f0-9]{64}$/u;
const INVENTORY_PART_FIELDS = Object.freeze([
  'partCode',
  'title',
  'sequence',
  'sourceObjectKey',
  'normalizedObjectKey',
  'startHeading',
  'endHeading',
  'startAnchor',
  'endAnchor',
  'estimatedCharacterCount',
  'sectionHash',
  'normalizationStatus',
  'humanVerified',
  'startPage',
  'endPage',
  'stalenessStatus'
]);
const INVENTORY_STALENESS_STATUSES = new Set([
  'CURRENT',
  'NOT_MATERIALIZED',
  'MANUSCRIPT_STALE'
]);

const relative = file => path.relative(ROOT, file).replaceAll(path.sep, '/');
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const text = value => typeof value === 'string' ? value.trim() : '';
const normalizeEtag = value => text(value).replace(/^"|"$/g, '') || null;

function readJson(file, code) {
  if (!fs.existsSync(file)) throw coded(code, { path: relative(file) });
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw coded(`${code}_INVALID_JSON`, { path: relative(file) });
  }
}

function prohibitedPaths(value, current = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => prohibitedPaths(item, `${current}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== 'object') return findings;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_KEYS.has(key)) findings.push(`${current}.${key}`);
    prohibitedPaths(child, `${current}.${key}`, findings);
  }
  return findings;
}

export function loadBookIManifest() {
  const manifest = readJson(MANIFEST_PATH, 'MANUSCRIPT_MANIFEST_MISSING');
  if (manifest.bookCode !== 'BOOK-1') throw coded('BOOK_CODE_MISMATCH');
  if (manifest.publicAccess !== 'disabled') throw coded('PUBLIC_ACCESS_NOT_DISABLED');
  if (manifest.retrievalEligibility !== 'internal_only') {
    throw coded('RETRIEVAL_NOT_INTERNAL_ONLY');
  }
  if (!/(?:^|-)private(?:-|$)/.test(String(manifest.r2Bucket || ''))) {
    throw coded('PRIVATE_BUCKET_REQUIRED');
  }
  if (!Array.isArray(manifest.objects) || manifest.objects.length === 0) {
    throw coded('MANUSCRIPT_OBJECT_REQUIRED');
  }
  if (!Array.isArray(manifest.parts) || manifest.parts.length === 0) {
    throw coded('MANUSCRIPT_PARTS_REQUIRED');
  }
  const forbidden = prohibitedPaths(manifest);
  if (forbidden.length) throw coded('PROHIBITED_MANIFEST_FIELD', { paths: forbidden });

  const objectKeys = new Set(manifest.objects.map(object => object.objectKey));
  if (objectKeys.size !== manifest.objects.length) throw coded('DUPLICATE_OBJECT_KEY');
  if (manifest.parts.some(part => !objectKeys.has(part.sourceObjectKey))) {
    throw coded('DANGLING_PART_SOURCE_OBJECT');
  }
  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  if (!source) throw coded('SOURCE_PDF_OBJECT_REQUIRED');
  if (source.sha256 !== manifest.contentHashes?.sourceObjectSha256) {
    throw coded('SOURCE_HASH_MISMATCH');
  }
  return manifest;
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const nullableText = value => value === null || (typeof value === 'string' && value.trim());
const nullableNonNegativeInteger = value => (
  value === null || (Number.isInteger(value) && value >= 0)
);

export function validateBookISectionInventory(sectionInventory, manifest = loadBookIManifest()) {
  if (!sectionInventory || typeof sectionInventory !== 'object' || Array.isArray(sectionInventory)) {
    throw coded('SECTION_INVENTORY_INVALID');
  }
  const forbidden = prohibitedPaths(sectionInventory);
  if (forbidden.length) {
    throw coded('PROHIBITED_SECTION_INVENTORY_FIELD', { paths: forbidden });
  }
  if (sectionInventory.schemaVersion !== '1.0.0') {
    throw coded('SECTION_INVENTORY_SCHEMA_VERSION_MISMATCH');
  }
  if (sectionInventory.stage !== 'KNR-W2R1-T06') {
    throw coded('SECTION_INVENTORY_STAGE_MISMATCH');
  }
  if (sectionInventory.bookCode !== manifest.bookCode) {
    throw coded('SECTION_INVENTORY_BOOK_CODE_MISMATCH');
  }
  if (sectionInventory.locale !== manifest.locale) {
    throw coded('SECTION_INVENTORY_LOCALE_MISMATCH');
  }
  if (sectionInventory.manuscriptVersion !== manifest.manuscriptVersion) {
    throw coded('SECTION_INVENTORY_MANUSCRIPT_VERSION_MISMATCH');
  }
  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  if (sectionInventory.sourceObjectKey !== source.objectKey) {
    throw coded('SECTION_INVENTORY_SOURCE_OBJECT_MISMATCH');
  }
  if (sectionInventory.sourceObjectSha256 !== source.sha256) {
    throw coded('SECTION_INVENTORY_SOURCE_HASH_MISMATCH');
  }
  if (!Array.isArray(sectionInventory.parts)) {
    throw coded('SECTION_INVENTORY_PARTS_REQUIRED');
  }
  const manifestParts = new Map(manifest.parts.map(part => [part.partCode, part]));
  const expectedCodes = manifest.parts.map(part => part.partCode);
  const actualCodes = sectionInventory.parts.map(part => part?.partCode);
  if (JSON.stringify(actualCodes) !== JSON.stringify(expectedCodes)) {
    throw coded('SECTION_INVENTORY_PART_SEQUENCE_MISMATCH', {
      expected: expectedCodes,
      actual: actualCodes
    });
  }

  for (const [index, part] of sectionInventory.parts.entries()) {
    if (!part || typeof part !== 'object' || Array.isArray(part)) {
      throw coded('SECTION_INVENTORY_PART_INVALID', { index });
    }
    const missingFields = INVENTORY_PART_FIELDS.filter(field => !hasOwn(part, field));
    if (missingFields.length) {
      throw coded('SECTION_INVENTORY_PART_FIELDS_MISSING', {
        partCode: part.partCode || null,
        missingFields
      });
    }
    const manifestPart = manifestParts.get(part.partCode);
    if (
      !manifestPart ||
      part.title !== manifestPart.title ||
      part.sequence !== manifestPart.sequence ||
      part.sourceObjectKey !== manifestPart.sourceObjectKey ||
      part.normalizedObjectKey !== manifestPart.normalizedObjectKey
    ) {
      throw coded('SECTION_INVENTORY_MANIFEST_PART_MISMATCH', { partCode: part.partCode });
    }
    if (!nullableText(part.startHeading) || !nullableText(part.endHeading)) {
      throw coded('SECTION_INVENTORY_HEADING_INVALID', { partCode: part.partCode });
    }
    if (!nullableText(part.startAnchor) || !nullableText(part.endAnchor)) {
      throw coded('SECTION_INVENTORY_ANCHOR_INVALID', { partCode: part.partCode });
    }
    if (!nullableNonNegativeInteger(part.estimatedCharacterCount)) {
      throw coded('SECTION_INVENTORY_CHARACTER_COUNT_INVALID', { partCode: part.partCode });
    }
    if (part.sectionHash !== null && !SECTION_HASH_PATTERN.test(part.sectionHash)) {
      throw coded('SECTION_INVENTORY_HASH_INVALID', { partCode: part.partCode });
    }
    if (!nullableNonNegativeInteger(part.startPage) || !nullableNonNegativeInteger(part.endPage)) {
      throw coded('SECTION_INVENTORY_PAGE_INVALID', { partCode: part.partCode });
    }
    if (part.startPage !== null && part.endPage !== null && part.endPage < part.startPage) {
      throw coded('SECTION_INVENTORY_PAGE_RANGE_INVALID', { partCode: part.partCode });
    }
    if (!INVENTORY_STALENESS_STATUSES.has(part.stalenessStatus)) {
      throw coded('SECTION_INVENTORY_STALENESS_STATUS_INVALID', { partCode: part.partCode });
    }
    if (
      part.humanVerified &&
      (
        part.normalizationStatus !== 'human_verified' ||
        part.normalizedObjectKey === null ||
        part.sectionHash === null ||
        part.stalenessStatus !== 'CURRENT'
      )
    ) {
      throw coded('SECTION_INVENTORY_HUMAN_VERIFICATION_INVALID', { partCode: part.partCode });
    }
    if (
      part.stalenessStatus === 'NOT_MATERIALIZED' &&
      (
        part.normalizationStatus !== 'not_materialized' ||
        part.normalizedObjectKey !== null ||
        part.sectionHash !== null ||
        part.humanVerified
      )
    ) {
      throw coded('SECTION_INVENTORY_NOT_MATERIALIZED_INVALID', { partCode: part.partCode });
    }
    if (
      part.stalenessStatus === 'MANUSCRIPT_STALE' &&
      (part.normalizationStatus !== 'stale' || part.humanVerified)
    ) {
      throw coded('SECTION_INVENTORY_STALE_STATE_INVALID', { partCode: part.partCode });
    }
  }

  for (let index = 0; index < sectionInventory.parts.length - 1; index += 1) {
    const current = sectionInventory.parts[index];
    const next = sectionInventory.parts[index + 1];
    if (current.endHeading !== next.startHeading || current.endAnchor !== next.startAnchor) {
      throw coded('SECTION_INVENTORY_BOUNDARY_CONTINUITY_FAILED', {
        currentPartCode: current.partCode,
        nextPartCode: next.partCode
      });
    }
  }

  const boundary = sectionInventory.boundaryAuthority;
  if (
    JSON.stringify(boundary?.primary) !== JSON.stringify([
      'startHeading',
      'endHeading',
      'startAnchor',
      'endAnchor',
      'sectionHash'
    ]) ||
    JSON.stringify(boundary?.auxiliary) !== JSON.stringify(['startPage', 'endPage']) ||
    boundary?.pageNumbersAuthoritative !== false
  ) {
    throw coded('SECTION_INVENTORY_BOUNDARY_AUTHORITY_INVALID');
  }
  const policy = sectionInventory.stalenessPolicy;
  if (
    policy?.hashAlgorithm !== 'sha256' ||
    policy?.hashChangeStatus !== 'MANUSCRIPT_STALE' ||
    policy?.automaticReuseOnHashChange?.mapping !== false ||
    policy?.automaticReuseOnHashChange?.candidate !== false ||
    policy?.automaticReuseOnHashChange?.prompt !== false ||
    policy?.automaticStaleClear !== false ||
    policy?.freshHumanReviewRequired !== true
  ) {
    throw coded('SECTION_INVENTORY_STALENESS_POLICY_INVALID');
  }
  return sectionInventory;
}

export function loadBookISectionInventory(manifest = loadBookIManifest()) {
  return validateBookISectionInventory(
    readJson(INVENTORY_PATH, 'SECTION_INVENTORY_MISSING'),
    manifest
  );
}

export function evaluateSectionStaleness(part, currentSectionHash) {
  if (!part || typeof part !== 'object') throw coded('SECTION_INVENTORY_PART_INVALID');
  if (part.sectionHash !== null && !SECTION_HASH_PATTERN.test(part.sectionHash)) {
    throw coded('SECTION_INVENTORY_HASH_INVALID', { partCode: part.partCode || null });
  }
  if (currentSectionHash !== null && !SECTION_HASH_PATTERN.test(currentSectionHash)) {
    throw coded('CURRENT_SECTION_HASH_INVALID', { partCode: part.partCode || null });
  }
  const changed = part.sectionHash !== null &&
    currentSectionHash !== null &&
    part.sectionHash !== currentSectionHash;
  const remainsStale = part.stalenessStatus === 'MANUSCRIPT_STALE';
  const effectiveStatus = changed || remainsStale
    ? 'MANUSCRIPT_STALE'
    : part.stalenessStatus;
  const reuseBlocked = effectiveStatus === 'MANUSCRIPT_STALE';
  return {
    partCode: part.partCode,
    recordedStalenessStatus: part.stalenessStatus,
    stalenessStatus: effectiveStatus,
    hashComparison: changed
      ? 'changed'
      : part.sectionHash === null || currentSectionHash === null
        ? 'not_available'
        : 'matched',
    reuseBlocked,
    invalidatedArtifacts: reuseBlocked ? ['mapping', 'candidate', 'prompt'] : [],
    freshHumanReviewRequired: reuseBlocked
  };
}

function credentialState(env = process.env) {
  const configured = CREDENTIAL_ENV_NAMES.filter(name => text(env[name]));
  const missing = CREDENTIAL_ENV_NAMES.filter(name => !text(env[name]));
  return {
    status: configured.length === 0
      ? 'not_configured'
      : missing.length === 0
        ? 'configured'
        : 'incomplete',
    configuredVariables: configured,
    missingVariables: missing
  };
}

function credentialsFor(manifest, env, { required }) {
  const state = credentialState(env);
  if (state.status === 'not_configured') {
    if (required) throw coded('R2_CREDENTIALS_REQUIRED', { missingVariables: state.missingVariables });
    return { state, credentials: null };
  }
  if (state.status === 'incomplete') {
    throw coded('R2_CREDENTIALS_INCOMPLETE', { missingVariables: state.missingVariables });
  }
  const accountId = text(env.PHIOS_MANUSCRIPT_R2_ACCOUNT_ID);
  const bucket = text(env.PHIOS_MANUSCRIPT_R2_BUCKET);
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw coded('R2_ACCOUNT_ID_INVALID');
  if (bucket !== manifest.r2Bucket) {
    throw coded('R2_BUCKET_MANIFEST_MISMATCH', {
      expectedBucket: manifest.r2Bucket,
      configuredBucketMatches: false
    });
  }
  return {
    state,
    credentials: {
      accountId,
      bucket,
      accessKeyId: text(env.PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID),
      secretAccessKey: text(env.PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY)
    }
  };
}

function assertFlags(command, args) {
  const allowed = command === 'verify'
    ? new Set(['--dry-run', '--download'])
    : command === 'status'
      ? new Set()
      : new Set(['--dry-run']);
  const unknown = args.filter(argument => !allowed.has(argument));
  if (unknown.length) throw coded('UNKNOWN_ARGUMENT', { arguments: unknown });
  if (args.includes('--dry-run') && args.includes('--download')) {
    throw coded('VERIFY_MODE_CONFLICT');
  }
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

function privateBoundary() {
  return {
    materializationRoot: relative(MATERIALIZATION_ROOT),
    gitEligible: false,
    publicBuildEligible: false,
    publicIndexEligible: false,
    publishedArticleEligible: false,
    productionPackageEligible: false
  };
}

function common(manifest, command, overrides = {}) {
  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  return {
    schemaVersion: 'PHI-OS-KNR-W2R1-MANUSCRIPT-TOOL-v1.1.0',
    stage: 'KNR-W2R1-T02-T03',
    command,
    bookCode: manifest.bookCode,
    locale: manifest.locale,
    manuscriptVersion: manifest.manuscriptVersion,
    manifestPath: relative(MANIFEST_PATH),
    authorityStatus: manifest.authorityStatus,
    verificationStatus: manifest.verificationStatus,
    publicAccess: manifest.publicAccess,
    retrievalEligibility: manifest.retrievalEligibility,
    objectCount: manifest.objects.length,
    partCount: manifest.parts.length,
    sourceObject: {
      objectKey: source.objectKey,
      contentType: source.contentType,
      sizeBytes: source.sizeBytes,
      metadataStatus: source.verificationStatus
    },
    privateMaterializationBoundary: privateBoundary(),
    writes: 0,
    manifestWrites: 0,
    productionModified: false,
    remoteRequestPerformed: false,
    downloadPerformed: false,
    ...overrides
  };
}

function remoteError(error) {
  const status = Number(error?.$metadata?.httpStatusCode || 0);
  if (status === 401 || status === 403) return coded('R2_ACCESS_DENIED');
  if (status === 404 || ['NoSuchBucket', 'NoSuchKey', 'NotFound'].includes(error?.name)) {
    return coded('R2_BUCKET_OR_OBJECT_NOT_FOUND');
  }
  return coded('R2_METADATA_REQUEST_FAILED', { httpStatus: status || null });
}

async function headRemoteObject(client, bucket, objectKey) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return await client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ChecksumMode: 'ENABLED'
    }));
  } catch (error) {
    throw remoteError(error);
  }
}

function sha256FromHead(head) {
  const metadataHash = text(head.Metadata?.sha256).toLowerCase();
  if (metadataHash) {
    if (!/^[a-f0-9]{64}$/.test(metadataHash)) throw coded('REMOTE_SHA256_METADATA_INVALID');
    return { value: metadataHash, source: 'object_metadata' };
  }
  if (head.ChecksumType === 'FULL_OBJECT' && text(head.ChecksumSHA256)) {
    const value = Buffer.from(head.ChecksumSHA256, 'base64').toString('hex');
    if (/^[a-f0-9]{64}$/.test(value)) return { value, source: 's3_full_object_checksum' };
  }
  return { value: null, source: null };
}

function metadataChecks(manifest, configuredBucket, head, downloaded = null) {
  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  const remoteEtag = normalizeEtag(head.ETag);
  const remoteVersionId = text(head.VersionId) || null;
  const remoteSha = downloaded
    ? { value: downloaded.sha256, source: 'downloaded_content' }
    : sha256FromHead(head);
  const checks = {
    bucket: {
      status: configuredBucket === manifest.r2Bucket ? 'passed' : 'failed',
      expected: manifest.r2Bucket,
      actual: configuredBucket
    },
    objectKey: {
      status: 'passed',
      expected: source.objectKey,
      actual: source.objectKey
    },
    contentType: {
      status: head.ContentType === source.contentType ? 'passed' : 'failed',
      expected: source.contentType,
      actual: head.ContentType || null
    },
    sizeBytes: {
      status: Number(head.ContentLength) === source.sizeBytes ? 'passed' : 'failed',
      expected: source.sizeBytes,
      actual: Number.isFinite(Number(head.ContentLength)) ? Number(head.ContentLength) : null
    },
    etag: {
      status: source.etag === null
        ? 'metadata_pending_manifest_update'
        : normalizeEtag(source.etag) === remoteEtag ? 'passed' : 'failed',
      expected: normalizeEtag(source.etag),
      actual: remoteEtag
    },
    versionId: {
      status: source.versionId === null
        ? remoteVersionId === null ? 'passed_not_available' : 'metadata_pending_manifest_update'
        : source.versionId === remoteVersionId ? 'passed' : 'failed',
      expected: source.versionId,
      actual: remoteVersionId
    },
    sha256: {
      status: remoteSha.value === null
        ? 'metadata_pending_download_required'
        : remoteSha.value === source.sha256 ? 'passed' : 'failed',
      expected: source.sha256,
      actual: remoteSha.value,
      source: remoteSha.source
    },
    publicAccessDisabled: {
      status: manifest.publicAccess === 'disabled'
        ? 'manifest_passed_remote_configuration_not_exposed_by_s3'
        : 'failed',
      manifest: manifest.publicAccess,
      remoteConfiguration: 'not_exposed_by_s3_object_api'
    },
    manifestConsistency: {
      status: 'passed'
    }
  };
  return checks;
}

function failedChecks(checks) {
  return Object.entries(checks)
    .filter(([, check]) => check.status === 'failed')
    .map(([name]) => name);
}

function pendingChecks(checks) {
  return Object.entries(checks)
    .filter(([, check]) => check.status.startsWith('metadata_pending'))
    .map(([name]) => name);
}

function materializationTarget(source, root = MATERIALIZATION_ROOT) {
  const filename = path.basename(source.objectKey);
  if (!filename || filename === '.' || filename === '..') {
    throw coded('MATERIALIZATION_FILENAME_INVALID');
  }
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, filename);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw coded('MATERIALIZATION_PATH_ESCAPE');
  }
  return target;
}

export async function downloadToPrivateMaterialization({
  client,
  bucket,
  source,
  root = MATERIALIZATION_ROOT
}) {
  const target = materializationTarget(source, root);
  if (fs.existsSync(target)) {
    throw coded('MATERIALIZED_FILE_ALREADY_EXISTS', { path: relative(target) });
  }
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const partial = `${target}.partial-${process.pid}`;
  let body;
  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: source.objectKey
    }));
    body = response.Body;
    if (!body) throw coded('R2_DOWNLOAD_BODY_MISSING');
    const hash = createHash('sha256');
    let sizeBytes = 0;
    const meter = new Transform({
      transform(chunk, encoding, callback) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
        sizeBytes += bytes.length;
        hash.update(bytes);
        callback(null, bytes);
      }
    });
    await pipeline(
      body,
      meter,
      fs.createWriteStream(partial, { flags: 'wx', mode: 0o600 })
    );
    const sha256 = hash.digest('hex');
    if (sizeBytes !== source.sizeBytes) {
      throw coded('DOWNLOADED_SIZE_MISMATCH', {
        expected: source.sizeBytes,
        actual: sizeBytes
      });
    }
    if (sha256 !== source.sha256) {
      throw coded('DOWNLOADED_SHA256_MISMATCH', {
        expected: source.sha256,
        actual: sha256
      });
    }
    fs.renameSync(partial, target);
    return { path: relative(target), sizeBytes, sha256 };
  } catch (error) {
    if (fs.existsSync(partial)) fs.unlinkSync(partial);
    if (error?.code) throw error;
    throw remoteError(error);
  } finally {
    if (body && typeof body.destroy === 'function') body.destroy();
  }
}

async function verify(manifest, args, options) {
  const download = args.includes('--download');
  const { state, credentials } = credentialsFor(
    manifest,
    options.env || process.env,
    { required: download }
  );
  if (!credentials) {
    return {
      ...common(manifest, 'verify'),
      mode: 'dry-run',
      status: 'metadata_pending',
      localManifestConsistency: 'passed',
      credentials: state,
      remoteMetadataVerification: 'pending_credentials',
      conditionalAcceptance: 'KNR-W2R1-v1.0.0-Conditional-Passed',
      reason: 'remote R2 metadata verification pending'
    };
  }

  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  const client = (options.clientFactory || createR2Client)(credentials);
  let downloaded = null;
  try {
    const head = await headRemoteObject(client, credentials.bucket, source.objectKey);
    const headChecks = metadataChecks(manifest, credentials.bucket, head);
    const headFailures = failedChecks(headChecks);
    if (headFailures.length) {
      throw coded('R2_METADATA_MISMATCH', { failedChecks: headFailures, checks: headChecks });
    }
    if (download) {
      downloaded = await downloadToPrivateMaterialization({
        client,
        bucket: credentials.bucket,
        source,
        root: options.materializationRoot || MATERIALIZATION_ROOT
      });
    }
    const checks = metadataChecks(manifest, credentials.bucket, head, downloaded);
    const failures = failedChecks(checks);
    if (failures.length) {
      throw coded('R2_VERIFICATION_FAILED', { failedChecks: failures, checks });
    }
    const pending = pendingChecks(checks);
    return {
      ...common(manifest, 'verify', {
        writes: downloaded ? 1 : 0,
        remoteRequestPerformed: true,
        downloadPerformed: Boolean(downloaded)
      }),
      mode: download ? 'download' : 'dry-run',
      status: downloaded
        ? pending.length ? 'content_verified_metadata_pending' : 'content_verified'
        : pending.length ? 'metadata_pending' : 'metadata_verified',
      localManifestConsistency: 'passed',
      credentials: state,
      remoteMetadataVerification: 'completed',
      checks,
      pendingManifestFields: pending,
      materializedFile: downloaded?.path || null,
      conditionalAcceptance: pending.length
        ? 'KNR-W2R1-v1.0.0-Conditional-Passed'
        : null,
      reason: pending.length ? 'remote metadata requires governed Manifest update or download' : null
    };
  } finally {
    if (client && typeof client.destroy === 'function') client.destroy();
  }
}

function inventory(manifest, options = {}) {
  const present = fs.existsSync(INVENTORY_PATH);
  if (!present && !options.inventory) {
    return {
      ...common(manifest, 'inventory'),
      stage: 'KNR-W2R1-T06',
      mode: 'dry-run',
      status: 'not_materialized',
      inventoryPath: relative(INVENTORY_PATH),
      inventoryFilePresent: false,
      plannedParts: manifest.parts.map(part => part.partCode),
      nextImplementation: 'KNR-W2R1-T06'
    };
  }
  const sectionInventory = options.inventory
    ? validateBookISectionInventory(options.inventory, manifest)
    : loadBookISectionInventory(manifest);
  const partStates = sectionInventory.parts.map(part => evaluateSectionStaleness(
    part,
    manifest.contentHashes?.normalizedParts?.[part.partCode] ?? null
  ));
  const staleParts = partStates
    .filter(part => part.stalenessStatus === 'MANUSCRIPT_STALE')
    .map(part => part.partCode);
  return {
    ...common(manifest, 'inventory'),
    stage: 'KNR-W2R1-T06',
    mode: 'dry-run',
    status: staleParts.length ? 'MANUSCRIPT_STALE' : 'registered',
    inventoryPath: relative(INVENTORY_PATH),
    inventoryFilePresent: present,
    sectionCount: sectionInventory.parts.length,
    humanVerifiedSectionCount: sectionInventory.parts.filter(part => part.humanVerified).length,
    notMaterializedSectionCount: sectionInventory.parts.filter(
      part => part.stalenessStatus === 'NOT_MATERIALIZED'
    ).length,
    primaryBoundaryAuthority: [...sectionInventory.boundaryAuthority.primary],
    pageNumberAuthority: 'auxiliary_only',
    partStates,
    staleParts,
    staleArtifactReuseBlocked: staleParts.length > 0,
    nextImplementation: staleParts.length
      ? 'FRESH_EXTRACTION_MAPPING_CANDIDATE_AND_PROMPT_REVIEW_REQUIRED'
      : 'KNR-W2R1-T07'
  };
}

function map(manifest) {
  const present = fs.existsSync(MAPPING_PATH);
  return {
    ...common(manifest, 'map'),
    mode: 'dry-run',
    status: present ? 'registered' : 'not_materialized',
    mappingPath: relative(MAPPING_PATH),
    mappingFilePresent: present,
    automaticHumanVerification: false,
    automaticMappedStatus: false,
    nextImplementation: 'KNR-W2R1-T07'
  };
}

function status(manifest, env) {
  return {
    ...common(manifest, 'status'),
    status: manifest.verificationStatus,
    credentials: credentialState(env),
    inventoryFilePresent: fs.existsSync(INVENTORY_PATH),
    mappingFilePresent: fs.existsSync(MAPPING_PATH),
    remoteMetadataVerified: ['metadata_verified', 'content_verified'].includes(
      manifest.verificationStatus
    ),
    contentVerified: manifest.verificationStatus === 'content_verified',
    readyForPublicRetrieval: false,
    nextAction: manifest.verificationStatus === 'metadata_pending'
      ? 'run_read_only_r2_metadata_verification'
      : 'continue_governed_private_materialization'
  };
}

export async function runBookIManuscriptCommand(command, args = [], options = {}) {
  if (!COMMANDS.has(command)) throw coded('UNKNOWN_OR_MISSING_COMMAND');
  assertFlags(command, args);
  const manifest = options.manifest || loadBookIManifest();
  if (command === 'verify') return verify(manifest, args, options);
  if (command === 'inventory') return inventory(manifest, options);
  if (command === 'map') return map(manifest);
  return status(manifest, options.env || process.env);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    console.log(JSON.stringify(await runBookIManuscriptCommand(command, args), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schemaVersion: 'PHI-OS-KNR-W2R1-MANUSCRIPT-TOOL-v1.1.0',
      stage: 'KNR-W2R1-T02-T03',
      command: command || null,
      status: 'blocked',
      code: error.code || 'MANUSCRIPT_TOOL_FAILED',
      details: error.details || null,
      writes: 0,
      manifestWrites: 0,
      productionModified: false
    }, null, 2));
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
