import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async p => JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const contract = await readJson('content/runtime/contracts/runtime-checker-alias-contract-v1.json');
const registry = await readJson('content/runtime/checkers/runtime-checker-alias-registry-v1.json');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(registry.registryVersion, '1.0.0');
assert.equal(registry.authority, 'PHIOS_RUNTIME_GOVERNANCE');
assert.equal(registry.historicalFilenamePolicy.normalizationByRenameForbidden, true);
const workCodes = new Set();
const aliases = new Set();
for (const entry of registry.entries) {
  assert.match(entry.workCode, /^[A-Z0-9.-]+$/);
  assert.equal(workCodes.has(entry.workCode), false, `duplicate workCode ${entry.workCode}`);
  workCodes.add(entry.workCode);
  const full = path.join(root, entry.checker);
  const stat = await fs.stat(full);
  assert.equal(stat.isFile(), true, entry.checker);
  assert.match(entry.checker, /^scripts\/check-(?:cm|cmr)-.+\.mjs$/);
  for (const alias of entry.aliases) {
    assert.equal(workCodes.has(alias) || aliases.has(alias), false, `duplicate alias ${alias}`);
    aliases.add(alias);
  }
}
assert.equal(registry.entries.find(x=>x.workCode==='CM-W10').checker, 'scripts/check-cm-w10-cross-method-number-meaning.mjs');
assert.equal(registry.entries.find(x=>x.workCode==='CM-W14').checker, 'scripts/check-cm-w14-meaning-projection-for-journey.mjs');
assert.equal(registry.entries.find(x=>x.workCode==='CM-W13').checker, 'scripts/check-cmr-w13-meaning-to-knowledge-bridge.mjs');
assert.equal(registry.entries.find(x=>x.workCode==='CM-W15').checker, 'scripts/check-cmr-w15-acceptance-freeze.mjs');

const freeze = await readJson('content/runtime/freeze/runtime-checker-alias-foundation-v1.json');
assert.equal(freeze.status, 'frozen');
for (const file of freeze.outputs) {
  const crypto = await import('node:crypto');
  const bytes = await fs.readFile(path.join(root, file));
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest, freeze.digests[file], `freeze digest ${file}`);
}

const runner = await fs.readFile(path.join(root,'scripts/run-runtime-checker.mjs'),'utf8');
assert.doesNotMatch(runner, /rename|writeFile|rmSync|unlink|update.*freeze/i);
console.log('✓ Runtime Checker Alias Foundation passed.');
console.log('✓ Stable Work Codes resolve historical check-cm/check-cmr filenames without renaming accepted checker artifacts.');
console.log('✓ CM-W10 and CM-W14 historical filenames are preserved; CMR freezes and runtime authorities are untouched.');
