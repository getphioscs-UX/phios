import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const packageJson = await readJson('package.json');
const registry = await readJson('content/governance/runtime-checker-governance/registries/package-checker-alias-registry-v1.json');

assert.equal(registry.schemaVersion, 'PHI-OS-PACKAGE-CHECKER-ALIAS-REGISTRY-v1.0.0');
assert.equal(registry.baselineCommit, '4975180fff09ac3a1e3f559fcc02f07357ffb269');
assert.equal(registry.status, 'ACTIVE_COMPATIBILITY_ROUTER');
assert.equal(registry.selectionPolicy.packageKeysDeleted, false);
assert.equal(registry.selectionPolicy.publicCanonicalCommandsReordered, false);
assert.equal(registry.entries.length, 171);
assert.equal(registry.selectionPolicy.migratedAliasCount, registry.entries.length);

const seen = new Set();
for (const entry of registry.entries) {
  assert.equal(seen.has(entry.alias), false, `duplicate package alias ${entry.alias}`);
  seen.add(entry.alias);
  assert.match(entry.alias, /^check:/, entry.alias);
  assert.equal(entry.packageCompatibilityKeyRetained, true, entry.alias);
  assert.equal(entry.status, 'HISTORICAL_ALIAS_ROUTED', entry.alias);
  assert.equal(typeof entry.legacyCommand, 'string');
  assert.ok(entry.legacyCommand.length > 0, entry.alias);
  assert.doesNotMatch(entry.legacyCommand, /run-package-checker-alias\.mjs/, entry.alias);
  assert.equal(
    packageJson.scripts[entry.alias],
    `npm run check:legacy -- ${entry.alias.split(':', 2)[1]}`,
    `package wrapper drift ${entry.alias}`
  );
  const npmTarget = entry.legacyCommand.match(/^npm run ([A-Za-z0-9:._-]+)/)?.[1];
  if (npmTarget) {
    assert.ok(packageJson.scripts[npmTarget], `missing npm target ${npmTarget} for ${entry.alias}`);
    assert.equal(seen.has(npmTarget), false, `legacy alias chains to another migrated alias: ${entry.alias} -> ${npmTarget}`);
  }
  const nodeFile = entry.legacyCommand.match(/^node(?: --no-warnings)? (scripts\/[A-Za-z0-9._/-]+\.mjs)/)?.[1];
  if (nodeFile) {
    const stat = await fs.stat(path.join(root, nodeFile));
    assert.equal(stat.isFile(), true, `missing checker file ${nodeFile} for ${entry.alias}`);
  }
}

for (const command of registry.protectedCanonicalCommands) {
  assert.ok(packageJson.scripts[command], `missing protected canonical command ${command}`);
  if (!['check:legacy'].includes(command)) {
    assert.doesNotMatch(packageJson.scripts[command], /run-package-checker-alias\.mjs/, `canonical command routed as legacy: ${command}`);
  }
}

assert.match(packageJson.scripts.check, /npm run check:package-aliases/);
assert.match(packageJson.scripts.check, /npm run check:cross-final-production-admission/);
assert.doesNotMatch(packageJson.scripts.check, /npm run check:cross-r2-w24-w26-pre-admission/);

const runner = await fs.readFile(path.join(root, registry.runner), 'utf8');
assert.doesNotMatch(runner, /writeFile|unlink|rmSync|rename/i);
assert.match(runner, /spawnSync\(entry\.legacyCommand/);

console.log(`✓ Package checker alias registry passed: ${registry.entries.length} historical W-stage aliases route through one runner; compatibility npm keys remain present.`);
console.log('✓ Public/canonical commands remain direct and in current-main order; parallel PPR/AST package-only deltas remain quarantined until their target gates pass.');
