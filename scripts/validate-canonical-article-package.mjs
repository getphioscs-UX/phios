import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_VALIDATION_OUTPUT
} from './lib/knowledge-production/production-config.mjs';
import { parseArgs, resolveInside } from './lib/knowledge-production/cli.mjs';
import { repositoryCommit } from './lib/knowledge-production/repository-loader.mjs';
import { formatError } from './lib/knowledge-production/production-errors.mjs';
import { validatePackage } from './lib/knowledge-production/package-validator.mjs';

const root = process.cwd();

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 2);
  const [nodeCode, packageArgument] = positionals;
  const packagePath = path.resolve(root, packageArgument);
  const result = await validatePackage(root, nodeCode, packagePath);
  result.validatedAt = new Date().toISOString();
  result.repositoryCommit = await repositoryCommit(root);
  delete result.parsed;
  delete result.sourceFiles;
  console.log(result.valid ? 'VALID' : 'INVALID');
  for (const error of result.errors) console.log(`ERROR ${error.code}: ${error.message}`);
  for (const warning of result.warnings) console.log(`WARNING ${warning.code}: ${warning.message}`);
  for (const info of result.informationalFindings) console.log(`INFO ${info.code}: ${info.message}`);
  if (options['json-report']) {
    const directory = resolveInside(root, DEFAULT_VALIDATION_OUTPUT);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, `${nodeCode}-validation-report.json`),
      `${JSON.stringify(result, null, 2)}\n`
    );
  }
  process.exitCode = result.valid ? 0 : 1;
}

main().catch(error => {
  console.error(formatError(error));
  process.exitCode = 2;
});
