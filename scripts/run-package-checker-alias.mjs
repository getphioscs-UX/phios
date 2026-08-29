import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const registryPath = path.join(root, 'content/governance/runtime-checker-governance/registries/package-checker-alias-registry-v1.json');
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const args = process.argv.slice(2);
const fail = (code, detail) => {
  console.error(`${code}: ${detail}`);
  process.exit(1);
};

const resolveEntry = raw => {
  if (!raw) fail('PACKAGE_CHECKER_ALIAS_REQUIRED', 'Use npm run check:legacy -- <alias> or invoke a retained historical npm key.');
  const needle = raw.trim();
  const candidates = [needle, needle.startsWith('check:') ? null : `check:${needle}`].filter(Boolean);
  const matches = registry.entries.filter(entry => candidates.includes(entry.alias));
  if (matches.length === 0) fail('PACKAGE_CHECKER_ALIAS_UNKNOWN', needle);
  if (matches.length > 1) fail('PACKAGE_CHECKER_ALIAS_AMBIGUOUS', needle);
  return matches[0];
};

if (args[0] === '--list') {
  for (const entry of registry.entries) console.log(`${entry.alias} -> ${entry.legacyCommand}`);
  process.exit(0);
}

const resolving = args[0] === '--resolve';
const entry = resolveEntry(resolving ? args[1] : args[0]);
if (resolving) {
  console.log(`${entry.alias} -> ${entry.legacyCommand}`);
  process.exit(0);
}

console.log(`→ historical package alias ${entry.alias}`);
console.log(`  ${entry.legacyCommand}`);
const result = spawnSync(entry.legacyCommand, {
  cwd: root,
  env: process.env,
  shell: true,
  stdio: 'inherit'
});
if (result.error) fail('PACKAGE_CHECKER_ALIAS_EXECUTION_FAILED', result.error.message);
process.exit(result.status ?? 1);
