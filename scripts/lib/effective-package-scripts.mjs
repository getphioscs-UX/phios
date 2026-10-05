import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

// Check orchestration semantics without removing the paid-network guard from npm.
export function effectivePackageScripts(pkg, root = process.cwd()) {
  if (pkg && typeof pkg.then === 'function') return pkg.then(value => effectivePackageScripts(value, root));
  const textInput = typeof pkg === 'string';
  if (textInput) pkg = JSON.parse(pkg);
  const commands = JSON.parse(fs.readFileSync(`${root}/config/reports/zero-cost-check-commands.json`, 'utf8'));
  const scripts = { ...pkg.scripts };
  for (const [key, value] of Object.entries(scripts)) {
    if (!value.includes('scripts/run-zero-cost-regression.mjs')) continue;
    assert.equal(value, `node scripts/run-zero-cost-regression.mjs ${key}`, `ZERO_COST_ALIAS_MISMATCH:${key}`);
    assert.equal(typeof commands[key], 'string', `ZERO_COST_COMMAND_MISSING:${key}`);
    assert.ok(commands[key].trim(), `ZERO_COST_COMMAND_EMPTY:${key}`);
    assert.ok(!commands[key].includes('scripts/run-zero-cost-regression.mjs'), `ZERO_COST_COMMAND_RECURSION:${key}`);
    scripts[key] = commands[key];
  }
  const resolved = { ...pkg, scripts };
  return textInput ? JSON.stringify(resolved, null, 2) : resolved;
}

// A registered historical checker may use only its explicitly hashed current route.
export function registeredCheckerCommandMatches(alias, actual, expected, root = process.cwd()) {
  if (actual === expected) return true;
  const successors = JSON.parse(fs.readFileSync(`${root}/config/reports/zero-cost-check-successors.json`, 'utf8'));
  const record = successors.files.find(item => item.commands.includes(alias)
    && expected.includes(`node ${item.historicalPath}`)
    && actual === expected.replace(item.historicalPath, item.currentPath));
  if (!record) return false;
  const commands = JSON.parse(fs.readFileSync(`${root}/config/reports/zero-cost-check-commands.json`, 'utf8'));
  if (commands[alias] !== actual) return false;
  const hash = file => createHash('sha256').update(fs.readFileSync(`${root}/${file}`, 'utf8')
    .replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')).digest('hex');
  assert.equal(hash(record.historicalPath), record.historicalTextSha256, 'FROZEN_CHECKER_DRIFT:' + record.historicalPath);
  assert.equal(hash(record.currentPath), record.currentTextSha256, 'CHECK_SUCCESSOR_DRIFT:' + record.currentPath);
  return true;
}
