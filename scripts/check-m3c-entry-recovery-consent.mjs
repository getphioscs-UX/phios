import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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
  const source = await read(relativePath);
  return crypto.createHash('sha256').update(source, 'utf8').digest('hex');
}

const requiredFiles = [
  'reality-entry.html',
  'reality-demo.html',
  'assets/css/entry-recovery-consent.css',
  'assets/css/guided-entry.css',
  'assets/js/reality-entry.js',
  'assets/js/pages/reality-demo.js',
  'assets/js/modules/journey-dashboard-projection.js',
  'assets/js/locales/en/entry.js',
  'assets/js/locales/zh-Hans/entry.js',
  'assets/js/locales/en/public.js',
  'assets/js/locales/zh-Hans/public.js',
  'content/registry/m3c-entry-recovery-consent.json',
  'docs/public/M3C-W3.2-ENTRY-RECOVERY-CONSENT.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W3.2 deliverable: ${file}`);
}

const page = await read('reality-entry.html');
for (const contract of [
  'data-entry-recovery="checking"',
  'id="entryRecoveryGate"',
  'id="entryRecoverySavedAt"',
  'id="resumeEntryButton"',
  'id="startFreshEntryButton"',
  'id="runtimeWorkspaceLayout"',
  'id="coordinateContinueButton"',
  'id="guidedEntryBoundary"',
  'data-evidence-class="reported_orientation"',
  'data-runtime-effect="none"',
  'class="evidence-depth hidden"',
  'class="conversation-stage hidden"',
  'class="entry-composer hidden"'
]) {
  assert.equal(
    page.includes(contract),
    true,
    `Entry recovery/coordinate-first page contract is missing: ${contract}`
  );
}

assert.equal(
  page.indexOf('id="entryRecoveryGate"') <
    page.indexOf('id="runtimeWorkspaceLayout"'),
  true,
  'Recovery consent gate must precede recovered Runtime content'
);
assert.equal(
  page.indexOf('id="realityCoordinates"') <
    page.indexOf('id="messageInput"'),
  true,
  'Reality Coordinate must be the first Entry question'
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

const controller = await read('assets/js/reality-entry.js');
for (const behavior of [
  "const EXPLICIT_ENTRY_MODES = new Set([\n  'resume',\n  'revise',\n  'new-runtime'\n]);",
  'function hasRecoverableEntry()',
  'function showRecoveryGate()',
  'function openEntryWorkspace()',
  'function clearBrowserRuntimeRecovery()',
  'function continueFromRealityCoordinate()',
  "state.guidedStep = 'observation';",
  "document.body.dataset.entryRecovery = 'awaiting-consent';",
  "document.body.dataset.entryRecovery = 'ready';",
  'clearPersistedRuntime();',
  'RUNTIME_PERSISTENCE_KEYS.forEach',
  '!EXPLICIT_ENTRY_MODES.has(currentEntryMode())',
  'els.resumeEntry?.addEventListener',
  'els.startFreshEntry?.addEventListener',
  'Client-only reported orientation'
]) {
  assert.equal(
    controller.includes(behavior),
    true,
    `Entry recovery/coordinate-first behavior is missing: ${behavior}`
  );
}

assert.equal(
  controller.includes('submit(initial)'),
  false,
  'Inbound Entry text must not auto-submit before coordinate choice'
);

const coordinateContinueStart = controller.indexOf(
  'function continueFromRealityCoordinate()'
);
const coordinateContinueEnd = controller.indexOf(
  '\nfunction normalizedText(',
  coordinateContinueStart
);
const coordinateContinue = controller.slice(
  coordinateContinueStart,
  coordinateContinueEnd
);
for (const forbidden of [
  'postJSON(',
  '/api/',
  'state.round +=',
  'answerBindings.push'
]) {
  assert.equal(
    coordinateContinue.includes(forbidden),
    false,
    `Coordinate selection must not execute Runtime behavior: ${forbidden}`
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
  'reported_orientation',
  'professional'
]) {
  assert.equal(
    payload.includes(excluded),
    false,
    `Reality Coordinate must not enter the Runtime API payload: ${excluded}`
  );
}

const recoveryCss = await read('assets/css/entry-recovery-consent.css');
for (const visualContract of [
  'body[data-entry-recovery="checking"] .runtime-workspace-layout',
  'body[data-entry-recovery="awaiting-consent"] .runtime-workspace-layout',
  '.entry-recovery-gate__card',
  '.entry-recovery-gate__actions',
  '@media (max-width: 640px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(
    recoveryCss.includes(visualContract),
    true,
    `Recovery consent stylesheet is missing: ${visualContract}`
  );
}

const demoPage = await read('reality-demo.html');
for (const contract of [
  'id="light-coordinate-step"',
  'id="light-reality-coordinates"',
  'id="light-coordinate-continue"',
  'id="light-observation-step"',
  'id="light-coordinate-summary"',
  'id="light-coordinate-back"'
]) {
  assert.equal(
    demoPage.includes(contract),
    true,
    `Light Try coordinate-first contract is missing: ${contract}`
  );
}
assert.equal(
  demoPage.indexOf('id="light-reality-coordinates"') <
    demoPage.indexOf('id="light-change"'),
  true,
  'Light Try must ask for Reality Coordinate before free text'
);
assert.match(
  demoPage,
  /id="light-observation-step"[\s\S]*?hidden/,
  'Light Try text step must be hidden initially'
);

const demoController = await read('assets/js/pages/reality-demo.js');
for (const forbidden of [
  'sessionStorage',
  'localStorage',
  'fetch(',
  'RuntimeKernel',
  'setSession',
  'runtime-persistence',
  '/api/'
]) {
  assert.equal(
    demoController.includes(forbidden),
    false,
    `Light Try must remain isolated from Runtime persistence/API: ${forbidden}`
  );
}

const projectionModule = await import(
  `${pathToFileURL(
    path.join(root, 'assets/js/modules/journey-dashboard-projection.js')
  ).href}?w32=${Date.now()}`
);
const entryProjection = projectionModule.buildJourneyDashboardProjection({
  hasActiveJourney: true,
  workspace: {
    currentStage: 'entry',
    completedStages: [],
    availableStages: ['entry']
  }
});
assert.equal(
  entryProjection.resumeRoute,
  '/reality-entry.html?mode=resume',
  'Dashboard Entry resume must provide explicit recovery consent'
);

const registry = await readJson(
  'content/registry/m3c-entry-recovery-consent.json'
);
assert.equal(registry.status, 'w3.2-entry-recovery-consent-ready');
assert.equal(
  registry.baseline.commit,
  '26451dff0b974daaed9c84aa505361ae0bd4d466'
);
assert.equal(registry.recoveryConsent.defaultRouteRevealsRecoveredContent, false);
assert.equal(registry.recoveryConsent.explicitResumeRequired, true);
assert.equal(registry.coordinateFirst.required, true);
assert.equal(registry.coordinateFirst.firstInterfaceQuestion, 'reality-coordinate');
assert.equal(registry.coordinateFirst.apiCalledOnSelection, false);
assert.equal(registry.demoBoundary.apiAccess, false);
assert.equal(registry.demoBoundary.sessionStorage, false);
assert.equal(registry.demoBoundary.localStorage, false);
assert.deepEqual(registry.coordinateFirst.options, coordinateValues);

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
    `Frozen M3C-W3.2 artifact changed: ${file}`
  );
}

const runtimeContracts = await readJson('content/registry/runtime-contracts.json');
const entryContract = runtimeContracts.contracts.find(
  contract => contract.id === 'runtime-entry'
);
assert.equal(entryContract.version, '1.0.0');
assert.equal(entryContract.schemaId, 'phi-os.runtime-entry.v1');
assert.equal(entryContract.status, 'stable');

for (const localePath of [
  'assets/js/locales/en/entry.js',
  'assets/js/locales/zh-Hans/entry.js'
]) {
  const locale = await read(localePath);
  for (const key of [
    'recoveryGate:',
    'savedAt:',
    'resume:',
    'startFresh:',
    'coordinateAction:',
    'questionWithCoordinate:',
    'requiredStatus:'
  ]) {
    assert.equal(
      locale.includes(key),
      true,
      `Entry locale is missing M3C-W3.2 key: ${localePath} ${key}`
    );
  }
}

for (const localePath of [
  'assets/js/locales/en/public.js',
  'assets/js/locales/zh-Hans/public.js'
]) {
  const locale = await read(localePath);
  for (const key of [
    'coordinateQuestion:',
    'coordinateRequired:',
    'selectedStatus:',
    'coordinateSummary:',
    'back:'
  ]) {
    assert.equal(
      locale.includes(key),
      true,
      `Public locale is missing coordinate-first key: ${localePath} ${key}`
    );
  }
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-entry-recovery-consent'],
  'node scripts/check-m3c-entry-recovery-consent.mjs'
);
assert.match(
  packageJson.scripts.check,
  /check-m3c-entry-recovery-consent\.mjs/
);

console.log('✓ M3C-W3.2 Entry Recovery Consent passed: recovered Entry content stays hidden until explicit Resume.');
console.log('  Reality Coordinate is now the required first question; text follows without changing Runtime or Professional contracts.');
