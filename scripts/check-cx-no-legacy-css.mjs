import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, base, readJson, cxImplementationFiles, cxHtmlSurfaces, normalizedLocalAsset, stylesheetRefs } from './lib/customer-experience-rebuild/cx-r1-guards.mjs';

const freeze = readJson(`${base}/legacy/legacy-css-freeze-v2.json`);
const frozen = new Set(freeze.entries.map((x) => x.stylesheet));

function inspect(rel, text) {
  const hits = [];
  for (const css of frozen) {
    if (text.includes(css) || text.includes(`/${css}`)) hits.push(css);
  }
  return [...new Set(hits)].sort();
}

// Self-test proves the detector does not pass merely because no CX page exists yet.
assert.deepEqual(inspect('fixture-safe', '<link rel="stylesheet" href="/assets/customer-ui/base.css">'), []);
assert.ok(inspect('fixture-bad', '<link rel="stylesheet" href="/assets/css/phios-public-v2.css">').includes('assets/css/phios-public-v2.css'));

const violations = [];
for (const rel of cxImplementationFiles()) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const css of inspect(rel, text)) violations.push({ file: rel, stylesheet: css, reason: 'FROZEN_LEGACY_STYLESHEET_REFERENCE' });
}

// CX HTML local stylesheets must come from the one customer design-system directory.
for (const rel of cxHtmlSurfaces()) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const href of stylesheetRefs(html)) {
    const local = normalizedLocalAsset(href);
    if (!local) continue;
    if (!local.startsWith('assets/customer-ui/')) violations.push({ file: rel, stylesheet: local, reason: 'LOCAL_CSS_OUTSIDE_CUSTOMER_UI' });
  }
}

assert.deepEqual(violations, [], `CX legacy CSS guard failed:\n${violations.map((v) => `${v.file}: ${v.stylesheet} (${v.reason})`).join('\n')}`);
console.log(`✓ CX-R1-W2 legacy CSS import guard passed: ${cxHtmlSurfaces().length} CX HTML surfaces + customer-ui sources contain 0 frozen legacy stylesheet imports.`);
