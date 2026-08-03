import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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
const COMMANDS = new Set(['verify', 'inventory', 'map', 'status']);
const PROHIBITED_KEYS = new Set([
  'publicUrl',
  'presignedUrl',
  'secret',
  'accessKey',
  'secretKey',
  'apiToken',
  'credential'
]);

const relative = file => path.relative(ROOT, file).replaceAll(path.sep, '/');
const coded = (code, detail) => Object.assign(new Error(detail || code), { code });

function readJson(file, code) {
  if (!fs.existsSync(file)) throw coded(code, `Required file is missing: ${relative(file)}`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw coded(`${code}_INVALID_JSON`, `Invalid JSON: ${relative(file)}`);
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
  if (forbidden.length) throw coded('PROHIBITED_MANIFEST_FIELD', forbidden.join(', '));

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

function assertFlags(command, args) {
  const allowed = command === 'status' ? new Set() : new Set(['--dry-run']);
  const unknown = args.filter(argument => !allowed.has(argument));
  if (unknown.includes('--download')) {
    throw coded('DOWNLOAD_MODE_DEFERRED_TO_STEP_6_2');
  }
  if (unknown.length) throw coded('UNKNOWN_ARGUMENT', unknown.join(', '));
}

function common(manifest, command) {
  const source = manifest.objects.find(object => object.objectRole === 'source_pdf');
  return {
    schemaVersion: 'PHI-OS-KNR-W2R1-MANUSCRIPT-TOOL-v1.0.0',
    stage: 'KNR-W2R1-T02-STEP-6.1',
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
    writes: 0,
    productionModified: false,
    remoteRequestPerformed: false,
    downloadPerformed: false
  };
}

function verify(manifest) {
  return {
    ...common(manifest, 'verify'),
    mode: 'dry-run',
    status: 'interface_registered',
    localManifestConsistency: 'passed',
    remoteMetadataVerification: 'not_run',
    plannedMetadataChecks: [
      'bucket',
      'object_key',
      'content_type',
      'size_bytes',
      'etag',
      'version_id',
      'sha256',
      'public_access_disabled'
    ],
    nextImplementation: 'KNR-W2R1-T02-STEP-6.2'
  };
}

function inventory(manifest) {
  const present = fs.existsSync(INVENTORY_PATH);
  return {
    ...common(manifest, 'inventory'),
    mode: 'dry-run',
    status: present ? 'registered' : 'not_materialized',
    inventoryPath: relative(INVENTORY_PATH),
    inventoryFilePresent: present,
    plannedParts: manifest.parts.map(part => part.partCode),
    nextImplementation: 'KNR-W2R1-T06'
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

function status(manifest) {
  return {
    ...common(manifest, 'status'),
    status: manifest.verificationStatus,
    inventoryFilePresent: fs.existsSync(INVENTORY_PATH),
    mappingFilePresent: fs.existsSync(MAPPING_PATH),
    remoteMetadataVerified: false,
    contentVerified: false,
    readyForPublicRetrieval: false,
    nextAction: 'implement_read_only_r2_metadata_verification'
  };
}

export function runBookIManuscriptCommand(command, args = []) {
  if (!COMMANDS.has(command)) throw coded('UNKNOWN_OR_MISSING_COMMAND');
  assertFlags(command, args);
  const manifest = loadBookIManifest();
  if (command === 'verify') return verify(manifest);
  if (command === 'inventory') return inventory(manifest);
  if (command === 'map') return map(manifest);
  return status(manifest);
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    console.log(JSON.stringify(runBookIManuscriptCommand(command, args), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schemaVersion: 'PHI-OS-KNR-W2R1-MANUSCRIPT-TOOL-v1.0.0',
      stage: 'KNR-W2R1-T02-STEP-6.1',
      command: command || null,
      status: 'blocked',
      code: error.code || 'MANUSCRIPT_TOOL_FAILED',
      writes: 0,
      productionModified: false,
      remoteRequestPerformed: false,
      downloadPerformed: false
    }, null, 2));
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
