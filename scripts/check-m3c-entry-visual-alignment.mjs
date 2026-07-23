import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  const buffer = await fs.readFile(path.join(root, relativePath));
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const requiredFiles = [
  'reality-entry.html',
  'assets/css/entry-visual-alignment.css',
  'assets/js/reality-entry.js',
  'assets/js/locales/en/entry.js',
  'assets/js/locales/zh-Hans/entry.js',
  'content/registry/m3c-entry-visual-alignment.json',
  'docs/public/M3C-W3-ENTRY-VISUAL-ALIGNMENT.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W3 deliverable: ${file}`);
}

const page = await read('reality-entry.html');
for (const contract of [
  '/assets/css/entry-visual-alignment.css',
  'data-runtime-workspace',
  'id="entryWorkspace"',
  'id="chatForm"',
  'id="messageInput"',
  'id="sendButton"',
  'id="continueButton"',
  'id="reviseButton"',
  'id="entryCard"',
  'aria-describedby="loadingText roundIndicator"',
  'aria-atomic="true"',
  'class="entry-send-button phi-button phi-button--primary"'
]) {
  assert.match(page, new RegExp(contract), `Entry page is missing: ${contract}`);
}

const progressBlock = page.slice(
  page.indexOf('<ol class="runtime-progress"'),
  page.indexOf('</ol>', page.indexOf('<ol class="runtime-progress"')) + 5
);
assert.equal(
  (progressBlock.match(/<li/g) || []).length,
  7,
  'Entry header must show the complete seven-stage Journey'
);
assert.match(progressBlock, /data-current-stage="entry"/);
assert.match(progressBlock, /aria-current="step"/);
assert.deepEqual(
  [...progressBlock.matchAll(/<data value="([^"]+)"/g)].map(match => match[1]),
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);

const stylesheetOrder = [
  '/assets/css/entry-workspace.css',
  '/assets/css/evidence-depth.css',
  '/assets/css/runtime-workspace.css',
  '/assets/css/design/visual-acceptance.css',
  '/assets/css/entry-visual-alignment.css'
].map(stylesheet => page.indexOf(stylesheet));
assert.equal(
  stylesheetOrder.every((position, index) => (
    position >= 0 && (index === 0 || position > stylesheetOrder[index - 1])
  )),
  true,
  'Entry visual alignment stylesheet must load after the frozen legacy layers'
);

const controller = await read('assets/js/reality-entry.js');
for (const frozenBehavior of [
  "postJSON(\n      '/api/reconstruct-reality'",
  'withLanguageContract({',
  'setSession(SESSION.entry, result)',
  "location.href = '/reality-reconstruction'",
  'initializeNewRuntimeEntry()',
  'restoreEntryState()',
  "quick: { minimum: 3, maximum: 4 }",
  "guided: { minimum: 5, maximum: 7 }",
  "deep: { minimum: 7, maximum: 10 }"
]) {
  assert.equal(
    controller.includes(frozenBehavior),
    true,
    `Entry behavior changed or disappeared: ${frozenBehavior}`
  );
}

for (const visualState of [
  "item.tone === 'error'",
  'role="alert" aria-atomic="true"',
  "els.load.dataset.tone = 'error'",
  "els.input.setAttribute('aria-invalid', 'true')",
  "item => item.tone !== 'error'",
  "'entry.requestFailed',\n      'error'"
]) {
  assert.equal(
    controller.includes(visualState),
    true,
    `Entry error-state alignment is missing: ${visualState}`
  );
}

const css = await read('assets/css/entry-visual-alignment.css');
for (const visualContract of [
  '.entry-workspace-page .entry-site-header',
  '.entry-workspace-shell',
  '.entry-workspace-grid',
  '.workspace-heading',
  '.entry-send-button',
  '.live-entry-block',
  '.entry-ready-panel',
  '.runtime-progress',
  'grid-template-columns: repeat(7',
  '.message.is-error',
  '.entry-loading[data-tone="error"]',
  '@media (max-width: 1120px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(
    css.includes(visualContract),
    true,
    `Entry visual stylesheet is missing: ${visualContract}`
  );
}

for (const token of [
  '--phi-font-display',
  '--phi-font-body',
  '--phi-space-',
  '--phi-border-subtle',
  '--phi-radius-',
  '--phi-action-primary',
  '--phi-state-danger'
]) {
  assert.match(css, new RegExp(token), `Entry alignment must use Design Token: ${token}`);
}

const registry = await readJson('content/registry/m3c-entry-visual-alignment.json');
assert.equal(registry.status, 'w3-entry-visual-alignment-ready');
assert.equal(registry.baseline.commit, '096575e95502e9144f03ec29d0ef4930f74be4b0');
assert.equal(registry.baseline.entryContractVersion, '1.0.0');
assert.equal(registry.baseline.entrySchemaId, 'phi-os.runtime-entry.v1');
assert.deepEqual(
  registry.scope.alignedSurfaces,
  ['header', 'spacing', 'button', 'card', 'typography', 'progress', 'error-state']
);
assert.deepEqual(
  registry.progress.stageOrder,
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.equal(registry.progress.automaticAdvance, false);
assert.equal(registry.errorState.retryPreservesEntry, true);
assert.equal(registry.errorState.providerFailureClearsRuntime, false);

for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen M3C-W3 artifact changed: ${file}`
  );
}

for (const [key, value] of Object.entries(registry.acceptance)) {
  if (key.endsWith('Changed')) {
    assert.equal(value, false, `M3C-W3 must not change ${key}`);
  }
}
assert.equal(registry.acceptance.mobileContractsPresent, true);
assert.equal(registry.acceptance.languageParityRequired, true);

const runtimeContracts = await readJson('content/registry/runtime-contracts.json');
const entryContract = runtimeContracts.contracts.find(
  contract => contract.id === 'runtime-entry'
);
assert.equal(entryContract.version, '1.0.0');
assert.equal(entryContract.schemaId, 'phi-os.runtime-entry.v1');
assert.equal(entryContract.status, 'stable');

const en = await read('assets/js/locales/en/entry.js');
const zh = await read('assets/js/locales/zh-Hans/entry.js');
for (const locale of [en, zh]) {
  assert.match(locale, /progressMemory:/);
  assert.match(locale, /progressContinuity:/);
  assert.match(locale, /errorLabel:/);
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-entry-visual-alignment'],
  'node scripts/check-m3c-entry-visual-alignment.mjs'
);
assert.match(packageJson.scripts.check, /check-m3c-entry-visual-alignment\.mjs/);

console.log('✓ M3C-W3 Entry Visual Alignment passed: Header, spacing, buttons, cards, typography, progress and errors.');
console.log('  Runtime Entry v1, API, persistence, revision and Reconstruction handoff remain unchanged.');
