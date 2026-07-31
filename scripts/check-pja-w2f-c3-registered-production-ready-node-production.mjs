import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
function run(args) {
  return spawnSync(process.execPath, ['scripts/produce-registered-ready-nodes.mjs', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
}

let result = run(['PREFACE', '--json-report']);
assert.equal(result.status, 0, result.stderr);
assert(result.stdout.includes('Mode: plan'));
assert(result.stdout.includes('Selected: 13'));
assert(result.stdout.includes('Registered: 13'));
assert(result.stdout.includes('Production Ready: 1'));
assert(result.stdout.includes('Existing: 1'));
assert(result.stdout.includes('Blocked: 12'));
assert(result.stdout.includes('Produced: 0'));

result = run(['PREFACE', '--force']);
assert.notEqual(result.status, 0);
assert((result.stdout + result.stderr).includes('FORCE_NOT_ALLOWED'));

const temporaryRelative = '.tmp/pja-w2f-c3-production';
const reportRelative = '.tmp/pja-w2f-c3-run-report.json';
const temporary = path.join(root, temporaryRelative);
const report = path.join(root, reportRelative);
await fs.rm(temporary, { recursive: true, force: true });
await fs.rm(report, { force: true });
try {
  result = run(['PREFACE', '--apply', '--output', temporaryRelative, '--report', reportRelative, '--json-report']);
  assert.equal(result.status, 0, result.stderr);
  assert(result.stdout.includes('Pending: 1'));
  assert(result.stdout.includes('Produced: 1'));
  await fs.access(path.join(temporary, 'kn-preface-001', 'zh-Hans', '1.0.0', 'package-manifest.json'));
  const firstReport = JSON.parse(await fs.readFile(report, 'utf8'));
  assert.equal(firstReport.contract, 'PHI-OS-PJA-W2F-C3-REGISTERED-READY-PRODUCTION-v1.0.0');
  assert.equal(firstReport.produced, 1);
  assert.equal(firstReport.failed, 0);
  for (let index = 2; index <= 13; index += 1) {
    await assert.rejects(fs.access(path.join(temporary, `kn-preface-${String(index).padStart(3, '0')}`)));
  }

  await fs.rm(report, { force: true });
  result = run(['PREFACE', '--apply', '--output', temporaryRelative, '--report', reportRelative]);
  assert.equal(result.status, 0, result.stderr);
  assert(result.stdout.includes('Pending: 0'));
  assert(result.stdout.includes('Existing: 1'));
  assert(result.stdout.includes('Produced: 0'));
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
  await fs.rm(report, { force: true });
}

console.log('✓ PJA-W2F-C3 Registered Production-Ready Node Production passed.');
console.log('  Only registered, Human-Frozen, production_ready Nodes enter governed production.');
console.log('  Existing governed packages are idempotently skipped and force overwrite is prohibited.');
console.log('  Execution reports bind scope, inventory hash, eligibility and production outcome.');
console.log('  Twelve blocked Preface Nodes remain unproduced; no review, approval or publication state is created.');
console.log('  State: PJA-W2F-C3-v1.0.0-Production-Execution-Ready.');
