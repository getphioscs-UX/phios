import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const registryPath = path.join(root, 'content/runtime/checkers/runtime-checker-alias-registry-v1.json');
const fail = (code, message) => { console.error(`${code}: ${message}`); process.exit(1); };
const input = process.argv[2];
if (!input) fail('CHECKER_WORK_CODE_REQUIRED', 'Usage: node scripts/run-runtime-checker.mjs <WORK-CODE>');
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const needle = input.trim().toUpperCase();
const matches = registry.entries.filter(entry =>
  entry.workCode.toUpperCase() === needle || entry.aliases.some(alias => alias.toUpperCase() === needle)
);
if (matches.length === 0) fail('CHECKER_WORK_CODE_UNKNOWN', input);
if (matches.length > 1) fail('CHECKER_WORK_CODE_AMBIGUOUS', input);
const entry = matches[0];
const checkerPath = path.join(root, entry.checker);
try { await fs.access(checkerPath); } catch { fail('CHECKER_FILE_MISSING', entry.checker); }
console.log(`→ ${entry.workCode} [${entry.runtime}]`);
console.log(`  ${entry.checker}`);
const result = spawnSync(process.execPath, [checkerPath], { cwd: root, stdio: 'inherit' });
if (result.error) fail('CHECKER_EXECUTION_FAILED', result.error.message);
process.exit(result.status ?? 1);
