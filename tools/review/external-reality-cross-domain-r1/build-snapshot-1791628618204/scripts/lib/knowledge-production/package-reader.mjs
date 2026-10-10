import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import {
  PACKAGE_FILES,
  ZIP_LIMITS
} from './production-config.mjs';
import { sha256 } from './checksum.mjs';
import { ProductionError } from './production-errors.mjs';

const inflateRaw = promisify(zlib.inflateRaw);

function safeEntryName(name) {
  const normalized = name.replaceAll('\\', '/');
  if (
    normalized.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split('/').includes('..') ||
    normalized.includes('\0')
  ) {
    throw new ProductionError('PACKAGE_PATH_TRAVERSAL', `Unsafe ZIP path: ${name}.`);
  }
  const depth = normalized.split('/').filter(Boolean).length;
  if (depth > ZIP_LIMITS.maximumDepth) {
    throw new ProductionError('PACKAGE_PATH_TRAVERSAL', `ZIP path is too deep: ${name}.`);
  }
  return normalized;
}

async function zipEntries(buffer) {
  if (buffer.length > ZIP_LIMITS.maximumArchiveBytes) {
    throw new ProductionError('PACKAGE_TOO_LARGE', 'ZIP exceeds the 10 MB archive limit.');
  }
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new ProductionError('PACKAGE_FORMAT_UNSUPPORTED', 'ZIP end record is missing.');
  const count = buffer.readUInt16LE(eocd + 10);
  if (count > ZIP_LIMITS.maximumFiles) {
    throw new ProductionError('PACKAGE_FILE_LIMIT_EXCEEDED', 'ZIP contains too many files.');
  }
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  const names = new Set();
  let offset = centralOffset;
  let expandedTotal = 0;
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new ProductionError('PACKAGE_FORMAT_UNSUPPORTED', 'ZIP central directory is invalid.');
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = safeEntryName(buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8'));
    const unixMode = externalAttributes >>> 16;
    if ((unixMode & 0o170000) === 0o120000) {
      throw new ProductionError('PACKAGE_SYMLINK_NOT_ALLOWED', `ZIP symlink is forbidden: ${name}.`);
    }
    if ((unixMode & 0o111) !== 0) {
      throw new ProductionError('PACKAGE_UNKNOWN_FILE', `Executable ZIP entry is forbidden: ${name}.`);
    }
    if (flags & 1 || ![0, 8].includes(method)) {
      throw new ProductionError('PACKAGE_FORMAT_UNSUPPORTED', `Unsupported ZIP entry: ${name}.`);
    }
    if (names.has(name)) {
      throw new ProductionError('PACKAGE_UNKNOWN_FILE', `Duplicate ZIP entry: ${name}.`);
    }
    names.add(name);
    if (size > ZIP_LIMITS.maximumFileBytes) {
      throw new ProductionError('PACKAGE_TOO_LARGE', `ZIP entry exceeds 5 MB: ${name}.`);
    }
    expandedTotal += size;
    if (expandedTotal > ZIP_LIMITS.maximumExpandedBytes) {
      throw new ProductionError('PACKAGE_TOO_LARGE', 'Expanded ZIP exceeds the 30 MB limit.');
    }
    entries.push({ name, method, compressedSize, size, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function extractZip(packagePath) {
  const archive = await fs.readFile(packagePath);
  const entries = await zipEntries(archive);
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'phios-w2e-zip-'));
  try {
    for (const entry of entries) {
      if (entry.name.endsWith('/')) continue;
      if (entry.name.includes('/')) {
        throw new ProductionError('PACKAGE_UNKNOWN_FILE', `Nested package entry is forbidden: ${entry.name}.`);
      }
      const local = entry.localOffset;
      if (archive.readUInt32LE(local) !== 0x04034b50) {
        throw new ProductionError('PACKAGE_FORMAT_UNSUPPORTED', `ZIP local entry is invalid: ${entry.name}.`);
      }
      const localNameLength = archive.readUInt16LE(local + 26);
      const localExtraLength = archive.readUInt16LE(local + 28);
      const dataStart = local + 30 + localNameLength + localExtraLength;
      const compressed = archive.subarray(dataStart, dataStart + entry.compressedSize);
      const content = entry.method === 0 ? compressed : await inflateRaw(compressed);
      if (content.length !== entry.size) {
        throw new ProductionError('PACKAGE_FORMAT_UNSUPPORTED', `ZIP entry size mismatch: ${entry.name}.`);
      }
      await fs.writeFile(path.join(temporaryRoot, entry.name), content, { flag: 'wx' });
    }
    return await readDirectory(temporaryRoot, { temporaryRoot });
  } catch (error) {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
    throw error;
  }
}

async function readDirectory(packagePath, { temporaryRoot = null } = {}) {
  const entries = await fs.readdir(packagePath, { withFileTypes: true });
  const files = new Map();
  let total = 0;
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new ProductionError('PACKAGE_SYMLINK_NOT_ALLOWED', `Package symlink is forbidden: ${entry.name}.`);
    }
    if (!entry.isFile()) {
      throw new ProductionError('PACKAGE_UNKNOWN_FILE', `Nested or special entry is forbidden: ${entry.name}.`);
    }
    if (!PACKAGE_FILES.includes(entry.name)) {
      throw new ProductionError('PACKAGE_UNKNOWN_FILE', `Unknown package file: ${entry.name}.`);
    }
    const stat = await fs.stat(path.join(packagePath, entry.name));
    if (stat.mode & 0o111) {
      throw new ProductionError('PACKAGE_UNKNOWN_FILE', `Executable package file is forbidden: ${entry.name}.`);
    }
    if (stat.size > ZIP_LIMITS.maximumFileBytes) {
      throw new ProductionError('PACKAGE_TOO_LARGE', `Package file exceeds 5 MB: ${entry.name}.`);
    }
    total += stat.size;
    if (total > ZIP_LIMITS.maximumExpandedBytes) {
      throw new ProductionError('PACKAGE_TOO_LARGE', 'Package exceeds the 30 MB expanded limit.');
    }
    files.set(entry.name, await fs.readFile(path.join(packagePath, entry.name)));
  }
  return {
    files,
    packagePath,
    temporaryRoot,
    packageChecksum: sha256(Buffer.concat(
      [...files.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(
        ([name, content]) => [Buffer.from(name), content]
      )
    )),
    async cleanup() {
      if (temporaryRoot) await fs.rm(temporaryRoot, { recursive: true, force: true });
    }
  };
}

export async function readPackage(packagePath) {
  let stat;
  try {
    stat = await fs.lstat(packagePath);
  } catch {
    throw new ProductionError('PACKAGE_NOT_FOUND', `Package does not exist: ${packagePath}.`);
  }
  if (stat.isSymbolicLink()) {
    throw new ProductionError('PACKAGE_SYMLINK_NOT_ALLOWED', 'Package path cannot be a symlink.');
  }
  if (stat.isDirectory()) return readDirectory(packagePath);
  if (stat.isFile() && packagePath.toLowerCase().endsWith('.zip')) return extractZip(packagePath);
  throw new ProductionError('PACKAGE_FORMAT_UNSUPPORTED', 'Package must be a directory or .zip file.');
}

export function parsePackageJson(files, name, errorCode) {
  const bytes = files.get(name);
  if (!bytes) throw new ProductionError('PACKAGE_FILE_MISSING', `Required file is missing: ${name}.`);
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new ProductionError(errorCode, `Invalid JSON in ${name}.`);
  }
}
