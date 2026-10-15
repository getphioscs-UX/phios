import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, base, readJson, cxImplementationFiles, cxHtmlSurfaces, normalizedLocalAsset, stylesheetRefs } from './lib/customer-experience-rebuild/cx-r1-guards.mjs';

const freeze = readJson(`${base}/legacy/legacy-css-freeze-v2.json`);
const frozen = new Set(freeze.entries.map((x) => x.stylesheet));
const successor = readJson(`${base}/legacy/current-shared-stylesheet-successor-v1.json`);
assert.equal(successor.status, 'ENGINEERING_RECONCILIATION');
for (const key of ['historicalFreezeRewritten', 'humanAcceptanceGranted', 'productionAcceptanceGranted']) assert.equal(successor[key], false);
assert.deepEqual(successor.stylesheets.map(item => item.path), ['assets/css/global-visual-r2.css', 'assets/css/ask-architecture-r1.css']);
const currentSharedStylesheets = new Set();
for (const item of successor.stylesheets) {
  assert.ok(!frozen.has(item.path), 'Frozen legacy stylesheet cannot receive a current exception');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, item.path))).digest('hex'), item.sha256, `Current stylesheet successor drift: ${item.path}`);
  currentSharedStylesheets.add(item.path);
}
const scopedSuccessor = readJson(`${base}/legacy/current-shared-stylesheet-successor-v2.json`);
assert.equal(scopedSuccessor.status, 'ENGINEERING_RECONCILIATION');
assert.equal(scopedSuccessor.predecessor.path, `${base}/legacy/current-shared-stylesheet-successor-v1.json`);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, scopedSuccessor.predecessor.path))).digest('hex'), scopedSuccessor.predecessor.sha256);
for (const key of ['historicalFreezeRewritten', 'humanAcceptanceGranted', 'productionAcceptanceGranted']) assert.equal(scopedSuccessor[key], false);
assert.deepEqual(scopedSuccessor.stylesheets.map(item => item.path), ['assets/css/integrated-r42.css']);
const scopedStylesheets = new Map();
for (const item of scopedSuccessor.stylesheets) {
  assert.ok(!frozen.has(item.path), 'Frozen legacy stylesheet cannot receive a current exception');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, item.path))).digest('hex'), item.sha256, `Current stylesheet successor drift: ${item.path}`);
  assert.deepEqual(item.consumers, ['academy/index.html', 'books/index.html', 'knowledge/ask/index.html', 'search/index.html']);
  scopedStylesheets.set(item.path, new Set(item.consumers));
}

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
    if (!local.startsWith('assets/customer-ui/') && !currentSharedStylesheets.has(local) && !scopedStylesheets.get(local)?.has(rel)) violations.push({ file: rel, stylesheet: local, reason: 'LOCAL_CSS_OUTSIDE_CUSTOMER_UI' });
  }
}

assert.deepEqual(violations, [], `CX legacy CSS guard failed:\n${violations.map((v) => `${v.file}: ${v.stylesheet} (${v.reason})`).join('\n')}`);
console.log(`✓ CX-R1-W2 legacy CSS import guard passed: ${cxHtmlSurfaces().length} CX HTML surfaces + customer-ui sources contain 0 frozen legacy stylesheet imports.`);
