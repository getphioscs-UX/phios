import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), 'utf8');
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
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
  const source = await fs.readFile(path.join(root, relativePath), 'utf8');
  const normalized = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

const requiredFiles = [
  'reality-entry.html',
  'assets/css/guided-entry.css',
  'assets/js/reality-entry.js',
  'assets/js/locales/en/entry.js',
  'assets/js/locales/zh-Hans/entry.js',
  'content/registry/m3c-guided-entry.json',
  'docs/public/M3C-W3.1-GUIDED-ENTRY.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W3.1 deliverable: ${file}`);
}

const page = await read('reality-entry.html');
for (const contract of [
  '/assets/css/guided-entry.css',
  'id="guidedEntry"',
  'id="guidedEntryTitle"',
  'id="realityCoordinates"',
  'id="coordinateStatus"',
  'id="sendButtonLabel"',
  'data-evidence-class="reported_orientation"',
  'data-runtime-effect="none"',
  'data-i18n="entry.guided.question"',
  'data-i18n="entry.guided.beginAction"'
]) {
  assert.equal(
    page.includes(contract),
    true,
    `Guided Entry page contract is missing: ${contract}`
  );
}

assert.equal(
  page.indexOf('/assets/css/guided-entry.css') >
    page.indexOf('/assets/css/entry-visual-alignment.css'),
  true,
  'Guided Entry stylesheet must load after M3C-W3 visual alignment'
);

const coordinateBlock = page.slice(
  page.indexOf('id="realityCoordinates"'),
  page.indexOf('</fieldset>', page.indexOf('id="realityCoordinates"'))
);
const coordinateValues = [
  ...coordinateBlock.matchAll(
    /name="realityCoordinate"[\s\S]*?value="([^"]+)"/g
  )
].map(match => match[1]);

assert.deepEqual(coordinateValues, [
  'body_health',
  'relationships_family',
  'work_career',
  'money_resources',
  'learning_growth',
  'meaning_purpose',
  'environment_place',
  'unsure'
]);
assert.equal(
  (coordinateBlock.match(/type="checkbox"/g) || []).length,
  8,
  'Reality Coordinate must expose eight optional checkboxes'
);

const controller = await read('assets/js/reality-entry.js');
for (const behavior of [
  'const REALITY_COORDINATE_MAXIMUM = 2;',
  "const REALITY_COORDINATE_UNSURE = 'unsure';",
  'realityCoordinates: []',
  'realityCoordinates: state.realityCoordinates',
  'normalizeRealityCoordinates(',
  'updateRealityCoordinate(input)',
  "input[name=\"realityCoordinate\"]",
  "state.round === 0 && !state.revision",
  "t('entry.guided.beginAction')",
  "t('common.continue')",
  'state.round > 0 || state.revision || state.ready',
  'Client-only reported orientation'
]) {
  assert.equal(
    controller.includes(behavior),
    true,
    `Guided Entry controller behavior is missing: ${behavior}`
  );
}

const payloadStart = controller.indexOf(
  'const payload = withLanguageContract({'
);
const payloadEnd = controller.indexOf('}, message);', payloadStart);
assert.notEqual(payloadStart, -1, 'Runtime Entry payload was not found');
assert.notEqual(payloadEnd, -1, 'Runtime Entry payload boundary was not found');
const payload = controller.slice(payloadStart, payloadEnd);

for (const excluded of [
  'realityCoordinates',
  'realityCoordinate',
  'professional',
  'reported_orientation'
]) {
  assert.equal(
    payload.includes(excluded),
    false,
    `Guided orientation must not enter the Runtime API payload: ${excluded}`
  );
}

for (const frozenBehavior of [
  "postJSON(\n      '/api/reconstruct-reality'",
  'setSession(SESSION.entry, result)',
  "location.href = '/reality-reconstruction'",
  "quick: { minimum: 3, maximum: 4 }",
  "guided: { minimum: 5, maximum: 7 }",
  "deep: { minimum: 7, maximum: 10 }"
]) {
  assert.equal(
    controller.includes(frozenBehavior),
    true,
    `Frozen Entry behavior changed: ${frozenBehavior}`
  );
}

const css = await read('assets/css/guided-entry.css');
for (const visualContract of [
  '.guided-entry',
  '.reality-coordinate-fieldset',
  '.reality-coordinate-options',
  '.reality-coordinate-options label.is-selected',
  '.coordinate-status[data-tone="limit"]',
  '.guided-entry-boundary',
  '.entry-question-label',
  '@media (max-width: 760px)',
  '@media (max-width: 440px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(
    css.includes(visualContract),
    true,
    `Guided Entry stylesheet is missing: ${visualContract}`
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
  assert.equal(
    css.includes(token),
    true,
    `Guided Entry must use Design Token: ${token}`
  );
}

const registry = await readJson('content/registry/m3c-guided-entry.json');
assert.equal(registry.status, 'w3.1-guided-entry-ready');
assert.equal(
  registry.baseline.commit,
  'e5d4aa96c93f8cb6ec1d124ada550d00baf978e9'
);
assert.equal(registry.baseline.entryContractVersion, '1.0.0');
assert.equal(registry.baseline.entrySchemaId, 'phi-os.runtime-entry.v1');
assert.equal(registry.realityCoordinate.evidenceClass, 'reported_orientation');
assert.equal(registry.realityCoordinate.runtimeEffect, 'none');
assert.equal(registry.realityCoordinate.optional, true);
assert.equal(registry.realityCoordinate.maximumSelections, 2);
assert.equal(registry.realityCoordinate.unsureExclusive, true);
assert.deepEqual(registry.realityCoordinate.options, coordinateValues);

for (const [boundary, value] of Object.entries({
  forwardedToEntryApi: false,
  includedInConversation: false,
  includedInAnswerBindings: false,
  countsAsEntryQuestion: false,
  automaticClassification: false,
  selectsNavigationPath: false,
  professionalRouting: false
})) {
  assert.equal(
    registry.dataBoundary[boundary],
    value,
    `Guided Entry data boundary changed: ${boundary}`
  );
}

assert.deepEqual(registry.hashPolicy, {
  algorithm: 'sha256',
  encoding: 'utf8',
  textNormalization: 'lf',
  byteOrderMarkIgnored: true
});

for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen M3C-W3.1 artifact changed: ${file}`
  );
}

for (const [key, value] of Object.entries(registry.acceptance)) {
  if (key.endsWith('Changed')) {
    assert.equal(value, false, `M3C-W3.1 must not change ${key}`);
  }
}
assert.equal(registry.acceptance.professionalApplicationAdded, false);
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
  for (const key of [
    'guided:',
    'coordinateLegend:',
    'coordinateQuestion:',
    'beginAction:',
    'limitStatus:',
    'coordinates:',
    'environmentPlace:',
    'unsure:'
  ]) {
    assert.equal(
      locale.includes(key),
      true,
      `Guided Entry locale key is missing: ${key}`
    );
  }
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-guided-entry'],
  'node scripts/check-m3c-guided-entry.mjs'
);
assert.match(packageJson.scripts.check, /check-m3c-guided-entry\.mjs/);

console.log('✓ M3C-W3.1 Guided Entry baseline passed: Reality Coordinate is bilingual, mobile-ready and evidence-bounded.');
console.log('  Its historical optional opening is superseded by the required coordinate-first M3C-W3.2 interface; the Runtime boundary is unchanged.');
