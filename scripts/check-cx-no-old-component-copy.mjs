import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, base, readJson, cxImplementationFiles, signatureHits } from './lib/customer-experience-rebuild/cx-r1-guards.mjs';

const registry = readJson(`${base}/legacy/legacy-component-signature-registry-v1.json`);
const signatures = registry.signatures;
const safe = '<main data-cx-surface><section class="cx-hero"><div class="cx-container"></div></section></main>';
assert.deepEqual(signatureHits(safe, signatures), []);
const old = '<div data-puxr-header></div><script src="/assets/js/public-shell-v2.js"></script>';
assert.ok(signatureHits(old, signatures).some((x) => x.signatureId === 'OLD-PUXR-GLOBAL-SHELL'));

const violations = [];
for (const rel of cxImplementationFiles()) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const sig of signatureHits(text, signatures)) violations.push({ file: rel, signatureId: sig.signatureId, role: sig.role });
}
assert.deepEqual(violations, [], `CX old-component-copy guard failed:\n${violations.map((v) => `${v.file}: ${v.signatureId} (${v.role})`).join('\n')}`);
console.log(`✓ CX-R1-W4 old component signature guard passed: ${signatures.length} frozen legacy composition signatures cannot enter CX implementation.`);
