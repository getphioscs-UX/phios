import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ProductionError } from './production-errors.mjs';

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
    try {
      await fs.access(targetDirectory);
      throw new ProductionError(
        'TARGET_PACKAGE_EXISTS',
        `Target package already exists: ${targetDirectory}.`,
        'W2E does not overwrite or invent a versioning model.'
      );
    } catch (error) {
      if (error instanceof ProductionError) throw error;
    }
    await fs.rename(staging, targetDirectory);
    moved = true;
  } catch (error) {
    if (error instanceof ProductionError) throw error;
    throw new ProductionError(
      'IMPORT_ATOMIC_WRITE_FAILED',
      'Atomic package creation failed; no partial target was retained.',
      'Resolve filesystem permissions or locks, then retry.',
      error.message
    );
  } finally {
    if (!moved) await fs.rm(staging, { recursive: true, force: true });
  }
}
