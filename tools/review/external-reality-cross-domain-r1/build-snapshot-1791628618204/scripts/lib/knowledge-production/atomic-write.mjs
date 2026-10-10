import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ProductionError } from './production-errors.mjs';

const WINDOWS_TRANSIENT_RENAME_CODES = new Set([
  'EPERM',
  'EACCES',
  'EBUSY',
  'ENOTEMPTY'
]);

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function assertTargetAbsent(targetDirectory) {
  try {
    await fs.access(targetDirectory);
    throw new ProductionError(
      'TARGET_PACKAGE_EXISTS',
      `Target package already exists: ${targetDirectory}.`,
      'W2E does not overwrite or invent a versioning model.'
    );
  } catch (error) {
    if (error instanceof ProductionError) throw error;
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function renameWithTransientRetry(source, target) {
  const delays = [50, 100, 200, 400, 800, 1200];
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fs.rename(source, target);
      return;
    } catch (error) {
      const retryable = process.platform === 'win32'
        && WINDOWS_TRANSIENT_RENAME_CODES.has(error?.code)
        && attempt < delays.length;
      if (!retryable) throw error;
      await sleep(delays[attempt]);
      await assertTargetAbsent(target);
    }
  }
}

export async function atomicCreateDirectory(targetDirectory, files) {
  const parent = path.dirname(targetDirectory);
  const staging = path.join(parent, `.pja-w2e-${randomUUID()}.staging`);
  let moved = false;
  try {
    await fs.mkdir(parent, { recursive: true });
    await fs.mkdir(staging, { recursive: false });
    for (const [name, content] of files) {
      await fs.writeFile(path.join(staging, name), content, { flag: 'wx' });
    }
    await assertTargetAbsent(targetDirectory);
    await renameWithTransientRetry(staging, targetDirectory);
    moved = true;
  } catch (error) {
    if (error instanceof ProductionError) throw error;
    throw new ProductionError(
      'IMPORT_ATOMIC_WRITE_FAILED',
      'Atomic package creation failed; no partial target was retained.',
      'Resolve filesystem permissions or locks, then retry.',
      `${error?.code || 'UNKNOWN'}: ${error?.message || String(error)}`
    );
  } finally {
    if (!moved) await fs.rm(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
