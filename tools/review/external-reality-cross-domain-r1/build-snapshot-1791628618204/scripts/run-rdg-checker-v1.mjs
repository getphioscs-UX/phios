import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const registryPath = 'content/governance/reality-data-governance/registries/rdg-checker-alias-registry-v1.json';
const registry = JSON.parse(await fs.readFile(path.join(root, registryPath), 'utf8'));
const input = process.argv[2]?.trim().toUpperCase();
const fail = (code, detail) => {
  console.error(`${code}: ${detail}`);
  process.exit(1);
};

let entries;
if (input) {
  const matches = registry.entries.filter(entry => entry.workCode === input || (entry.aliases ?? []).includes(input));
  if (matches.length === 0) fail('RDG_CHECKER_WORK_CODE_UNKNOWN', input);
  if (matches.length > 1) fail('RDG_CHECKER_WORK_CODE_AMBIGUOUS', input);
  entries = matches;
} else {
  const unique = new Map();
  for (const entry of registry.entries) {
    if (!unique.has(entry.implementationFile)) unique.set(entry.implementationFile, entry);
  }
  entries = [...unique.values()];
  console.log(`→ RDG: ${entries.length} unique checker implementations`);
}

for (const entry of entries) {
  const checkerPath = path.join(root, entry.implementationFile);
  try {
    await fs.access(checkerPath);
  } catch {
    fail('RDG_CHECKER_FILE_MISSING', entry.implementationFile);
  }
  console.log(`→ ${entry.workCode} [RDG]`);
  console.log(`  ${entry.implementationFile}`);
  const result = spawnSync(process.execPath, [checkerPath], { cwd: root, stdio: 'inherit' });
  if (result.error) fail('RDG_CHECKER_EXECUTION_FAILED', result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
