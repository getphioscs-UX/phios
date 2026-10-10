import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_IMPORT_OUTPUT,
  PACKAGE_FILES,
  PROTECTED_PATHS
} from './lib/knowledge-production/production-config.mjs';
import { parseArgs, resolveInside } from './lib/knowledge-production/cli.mjs';
import { repositoryCommit } from './lib/knowledge-production/repository-loader.mjs';
import { formatError, ProductionError } from './lib/knowledge-production/production-errors.mjs';
import { validatePackage } from './lib/knowledge-production/package-validator.mjs';
import { atomicCreateDirectory } from './lib/knowledge-production/atomic-write.mjs';

const root = process.cwd();
const exists = file => fs.access(file).then(() => true, () => false);

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 2);
  const [nodeCode, packageArgument] = positionals;
  const packagePath = path.resolve(root, packageArgument);
  const validation = await validatePackage(root, nodeCode, packagePath);
  if (!validation.valid) {
    const first = validation.errors[0];
    throw new ProductionError(
      'IMPORT_REQUIRES_VALID_PACKAGE',
      `Package validation failed (${first?.code || 'unknown'}): ${first?.message || ''}`
    );
  }
  const locale = validation.locale;
  const targetRoot = options['target-root']
    ? path.resolve(root, options['target-root'])
    : root;
  if (!options['target-root'] && options.apply) {
    throw new ProductionError(
      'TARGET_PATH_PROTECTED',
      'W2E refuses --apply to the formal repository root.',
      'Use --target-root with a dedicated temporary or review worktree.'
    );
  }
  const relativeTarget = path.posix.join(
    'content/knowledge/articles',
    locale,
    nodeCode
  );
  const targetDirectory = resolveInside(targetRoot, relativeTarget);
  const targetPaths = PACKAGE_FILES.map(name => path.join(targetDirectory, name));
  const targetExists = await exists(targetDirectory);
  if (targetExists) {
    throw new ProductionError(
      'TARGET_PACKAGE_EXISTS',
      `Target package already exists: ${targetDirectory}.`
    );
  }
  const commit = await repositoryCommit(root);
  const report = {
    mode: options.apply ? 'apply' : 'dry-run',
    applied: false,
    nodeCode,
    locale,
    packageChecksum: validation.packageChecksum,
    repositoryCommitBefore: commit,
    targetPaths: targetPaths.map(file => path.relative(targetRoot, file)),
    createdFiles: targetPaths.map(file => path.relative(targetRoot, file)),
    replacedFiles: [],
    unchangedFiles: [],
    protectedFiles: PROTECTED_PATHS.map(file => `PROTECTED — NOT WRITABLE: ${file}`),
    warnings: [],
    errors: [],
    completedAt: null
  };
  console.log(options.apply ? 'APPLY' : 'DRY RUN');
  console.log(`Package Identity: ${nodeCode}/${locale}`);
  console.log('Validation Result: VALID');
  for (const file of report.createdFiles) console.log(`CREATE ${file}`);
  for (const file of report.protectedFiles) console.log(file);
  if (options.apply) {
    await atomicCreateDirectory(targetDirectory, validation.sourceFiles);
    report.applied = true;
  }
  report.completedAt = new Date().toISOString();
  const reportDirectory = resolveInside(
    root,
    options['report-output'] || DEFAULT_IMPORT_OUTPUT
  );
  await fs.mkdir(reportDirectory, { recursive: true });
  await fs.writeFile(
    path.join(reportDirectory, `${nodeCode}-import-report.json`),
    `${JSON.stringify(report, null, 2)}\n`
  );
  console.log(`applied: ${report.applied}`);
}

main().catch(error => {
  console.error(formatError(error));
  process.exitCode = error.code === 'IMPORT_REQUIRES_VALID_PACKAGE' ? 1 : 2;
});
