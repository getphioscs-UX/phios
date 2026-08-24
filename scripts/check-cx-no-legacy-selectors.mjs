import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, base, readJson, cxImplementationFiles, legacyNamespaceHits } from './lib/customer-experience-rebuild/cx-r1-guards.mjs';

const invariants = readJson(`${base}/authority/cx-r-global-invariants-v1.json`);
const prefixes = invariants.forbiddenNewNamespaces;
assert.deepEqual(legacyNamespaceHits('<div class="cx-card">', prefixes), []);
assert.ok(legacyNamespaceHits('<div class="puxr-card">', prefixes).includes('puxr-'));

const violations = [];
for (const rel of cxImplementationFiles()) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const prefix of legacyNamespaceHits(text, prefixes)) violations.push({ file: rel, prefix });
}
assert.deepEqual(violations, [], `CX legacy namespace guard failed:\n${violations.map((v) => `${v.file}: ${v.prefix}`).join('\n')}`);
console.log(`✓ CX-R1-W3 legacy namespace guard passed: 0 puxr-/public-/rs-/pr-/px2-/wpr-/phi-public- references in CX implementation.`);
