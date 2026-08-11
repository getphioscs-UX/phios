import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const fail = (code, message) => { console.error(`${code}: ${message}`); process.exit(1); };

const registry = await read('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v4.json');
const input = process.argv[2];
if (!input) fail('CHECKER_TARGET_REQUIRED', 'Use <WORK-CODE> or --group=<GROUP-CODE>');

let entries;
if (input.startsWith('--group=')) {
  const groupCode = input.slice('--group='.length).trim().toUpperCase();
  const groups = await read('content/governance/runtime-checker-governance/registries/runtime-checker-group-registry-v2.json');
  const group = groups.groups.find(item => item.groupCode === groupCode);
  if (!group) fail('CHECKER_GROUP_UNKNOWN', groupCode);
  entries = registry.entries.filter(entry => group.runtimeCodes.includes(entry.runtimeCode));
  if (entries.length === 0) fail('CHECKER_GROUP_EMPTY', groupCode);
  const unique = new Map();
  for (const entry of entries) if (!unique.has(entry.implementationFile)) unique.set(entry.implementationFile, entry);
  entries = [...unique.values()];
  console.log(`→ GROUP ${groupCode}: ${entries.length} unique implementations`);
} else {
  const needle = input.trim().toUpperCase();
  const matches = registry.entries.filter(entry =>
    entry.workCode.toUpperCase() === needle ||
    (entry.aliases ?? []).some(alias => alias.toUpperCase() === needle)
  );
  if (matches.length === 0) fail('CHECKER_WORK_CODE_UNKNOWN', input);
  if (matches.length > 1) fail('CHECKER_WORK_CODE_AMBIGUOUS', input);
  entries = matches;
}

for (const entry of entries) {
  const checkerPath = path.join(root, entry.implementationFile);
  try { await fs.access(checkerPath); } catch { fail('CHECKER_FILE_MISSING', entry.implementationFile); }
  console.log(`→ ${entry.workCode} [${entry.runtimeCode}]`);
  console.log(`  ${entry.implementationFile}`);
  const result = spawnSync(process.execPath, [checkerPath], {cwd: root, stdio: 'inherit'});
  if (result.error) fail('CHECKER_EXECUTION_FAILED', result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
