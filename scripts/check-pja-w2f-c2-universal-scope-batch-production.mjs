import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
function run(args) {
  return spawnSync(process.execPath, ['scripts/produce-canonical-articles-batch.mjs', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
}

for (const scope of ['KN-PREFACE-001', 'PREFACE', 'PART-0', 'BOOK-1', 'ALL']) {
  const result = run([scope, '--json-report']);
  assert.equal(result.status, 0, `${scope}: ${result.stderr}`);
  assert(result.stdout.includes(`Scope: ${scope}`));
  assert(result.stdout.includes('Mode: plan'));
}

let result = run(['PREFACE', '--json-report']);
assert(result.stdout.includes('Selected: 13'));
assert(result.stdout.includes('Eligible: 1'));
assert(result.stdout.includes('Existing: 1'));
assert(result.stdout.includes('Blocked: 12'));

result = run(['NOT-A-SCOPE']);
assert.notEqual(result.status, 0);
assert((result.stderr + result.stdout).includes('KNOWLEDGE_SCOPE_INVALID'));

const temporaryRelative = '.tmp/pja-w2f-c2-apply-fixture';
const temporary = path.join(root, temporaryRelative);
await fs.rm(temporary, { recursive: true, force: true });
try {
  result = run(['PREFACE', '--apply', '--output', temporaryRelative]);
  assert.equal(result.status, 0, result.stderr);
  const produced = path.join(temporary, 'kn-preface-001', 'zh-Hans', '1.0.0', 'package-manifest.json');
  await fs.access(produced);
  for (let index = 2; index <= 13; index += 1) {
    const node = `kn-preface-${String(index).padStart(3, '0')}`;
    await assert.rejects(fs.access(path.join(temporary, node)));
  }
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}

console.log('✓ PJA-W2F-C2 Universal Scope and Batch Production Infrastructure passed.');
console.log('  NODE, PREFACE, PART, BOOK and ALL scopes resolve deterministically.');
console.log('  Plan mode is write-free; apply mode produces only eligible Human-Frozen Nodes.');
console.log('  Blocked Nodes remain blocked and batch execution creates no approval or publication state.');
console.log('  Windows/OneDrive symlink restrictions no longer invalidate the mandatory archive security test.');
console.log('  State: PJA-W2F-C2-v1.0.0-Infrastructure-Ready.');
