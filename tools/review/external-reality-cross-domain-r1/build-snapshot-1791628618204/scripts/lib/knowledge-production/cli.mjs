import path from 'node:path';
import { ProductionError } from './production-errors.mjs';

export function parseArgs(argv, positionalCount) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const name = value.slice(2);
    if (['force', 'json-report', 'apply'].includes(name)) {
      options[name] = true;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      throw new ProductionError('IMPORT_CONFLICT', `Option --${name} requires a value.`);
    }
    options[name] = next;
    index += 1;
  }
  if (positionals.length < positionalCount) {
    throw new ProductionError(
      positionalCount === 1 ? 'NODE_CODE_REQUIRED' : 'PACKAGE_NOT_FOUND',
      'Required command arguments are missing.'
    );
  }
  return { positionals, options };
}

export function resolveInside(root, candidate, code = 'TARGET_PATH_PROTECTED') {
  const absolute = path.resolve(root, candidate);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative) && relative !== '') {
    throw new ProductionError(code, `Path escapes the allowed root: ${candidate}.`);
  }
  return absolute;
}
