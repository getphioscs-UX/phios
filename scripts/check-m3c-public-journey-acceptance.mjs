import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

async function read(relativePath) {
  return (await fs.readFile(path.join(root, relativePath), 'utf8'))
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
  const bytes = await fs.readFile(path.join(root, relativePath));
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

const requiredFiles = [
  'reality-journey.html',
  'reality-dashboard.html',
  'reality-entry.html',
  'reality-reconstruction.html',
  'reality-reading.html',
  'reality-navigation.html',
  'reality-review.html',
  'my-reality.html',
  'assets/js/modules/journey-dashboard-projection.js',
  'assets/js/modules/runtime-persistence.js',
  'assets/js/modules/runtime-transition-engine.js',
  'functions/runtime/shared/provider-interface.js',
  'tests/fixtures/m3c-public-journey-acceptance.json',
  'content/registry/m3c-public-journey-acceptance.json',
  'scripts/check-m3c-public-journey-production.mjs',
  'docs/public/M3C-W10-PUBLIC-JOURNEY-ACCEPTANCE.md'
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(file),
    true,
    `Missing M3C-W10 deliverable: ${file}`
  );
}

const fixtures = await readJson(
  'tests/fixtures/m3c-public-journey-acceptance.json'
);
const registry = await readJson(
  'content/registry/m3c-public-journey-acceptance.json'
);

assert.equal(fixtures.schemaVersion, 'phi-os.m3c-public-journey-acceptance-fixtures.v1');
assert.deepEqual(fixtures.locales, ['en', 'zh-Hans']);
assert.deepEqual(
  fixtures.viewports.map(viewport => viewport.id),
  ['mobile', 'desktop']
);
assert.equal(fixtures.scenarios.length, 8);

const requiredScenarios = [
  'first-time-user',
  'returning-user',
  'interrupted-session',
  'provider-failure',
  'language-switching',
  'mobile-use',
  'slow-network',
  'expired-session'
];
assert.deepEqual(
  fixtures.scenarios.map(scenario => scenario.id),
  requiredScenarios
);

const acceptanceCases = fixtures.scenarios.flatMap(scenario =>
  fixtures.locales.flatMap(locale =>
    fixtures.viewports.map(viewport => ({
      scenario: scenario.id,
      locale,
      viewport: viewport.id
    }))
  )
);
assert.equal(acceptanceCases.length, 32);
assert.equal(
  new Set(
    acceptanceCases.map(item =>
      `${item.scenario}:${item.locale}:${item.viewport}`
    )
  ).size,
  32
);

const dashboardModule = await import(
  `${pathToFileURL(
    path.join(root, 'assets/js/modules/journey-dashboard-projection.js')
  ).href}?m3cw10=${Date.now()}`
);
const {
  JOURNEY_DASHBOARD_STAGES,
  buildJourneyDashboardProjection
} = dashboardModule;

assert.deepEqual(
  JOURNEY_DASHBOARD_STAGES.map(stage => stage.id),
  registry.journeyStages
);

for (const scenario of fixtures.scenarios) {
  const snapshotIsValid = scenario.snapshot === 'valid';
  const projection = buildJourneyDashboardProjection({
    hasActiveJourney: scenario.hasActiveJourney,
    workspace: scenario.workspace,
    snapshot: snapshotIsValid
      ? {
          runtimeId: `runtime-${scenario.id}`,
          runtimeEntityId: 'entity-public-acceptance',
          updatedAt: scenario.recoveryState?.savedAt
        }
      : null,
    snapshotValidation: {
      valid: snapshotIsValid,
      reason: snapshotIsValid ? '' : 'snapshot_missing'
    },
    recoveryState: scenario.recoveryState,
    lineage: {
      activeRuntimeId: `runtime-${scenario.id}`,
      runtimeEntityId: 'entity-public-acceptance',
      runtimes: []
    }
  });

  assert.equal(
    projection.currentStage,
    scenario.expected.currentStage,
    `${scenario.id}: current stage`
  );
  assert.equal(
    projection.resumeRoute,
    scenario.expected.resumeRoute,
    `${scenario.id}: resume route`
  );
  assert.equal(
    projection.recoveryCode,
    scenario.expected.recoveryCode,
    `${scenario.id}: recovery state`
  );
  if (Number.isInteger(scenario.expected.completedCount)) {
    assert.equal(
      projection.completedCount,
      scenario.expected.completedCount,
      `${scenario.id}: completed stage count`
    );
  }
  assert.equal(projection.guardrails.readOnlyProjection, true);
  assert.equal(projection.guardrails.automaticRuntimeCreation, false);
  assert.equal(projection.guardrails.historicalOverwriteAllowed, false);
}

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.has(String(key))
      ? this.values.get(String(key))
      : null;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key) {
    this.values.delete(String(key));
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }
}

const sessionStorage = new MemoryStorage();
const localStorage = new MemoryStorage();
globalThis.window = {
  sessionStorage,
  localStorage,
  setTimeout,
  clearTimeout,
  addEventListener() {}
};
globalThis.document = {
  visibilityState: 'visible',
  addEventListener() {}
};

const persistence = await import(
  `${pathToFileURL(
    path.join(root, 'assets/js/modules/runtime-persistence.js')
  ).href}?m3cw10=${Date.now()}`
);

assert.deepEqual(
  persistence.restoreRuntimeSnapshot(),
  { restored: false, reason: 'unsupported_schema' },
  'First-time user must not receive invented recovered state'
);

const runtimeIdentity = {
  runtimeId: 'runtime-m3c-w10',
  runtimeEntityId: 'entity-m3c-w10',
  runtimeEntryId: 'entry-m3c-w10'
};
sessionStorage.setItem(
  'phiOSRuntimeEntry',
  JSON.stringify(runtimeIdentity)
);
sessionStorage.setItem(
  'phiOSRuntimeWorkspaceState',
  JSON.stringify({
    ...runtimeIdentity,
    currentStage: 'review',
    completedStages: ['entry', 'reconstruction', 'reading', 'navigation'],
    availableStages: ['entry', 'reconstruction', 'reading', 'navigation', 'review']
  })
);
const savedSnapshot = persistence.saveRuntimeSnapshot('m3c_w10_interruption');
assert.equal(savedSnapshot.runtimeId, runtimeIdentity.runtimeId);
assert.equal(savedSnapshot.runtimeEntityId, runtimeIdentity.runtimeEntityId);
assert.equal(savedSnapshot.runtimeEntryId, runtimeIdentity.runtimeEntryId);
assert.equal(savedSnapshot.workspaceStage, 'review');
assert.equal(persistence.validateRuntimeSnapshot(savedSnapshot).valid, true);

sessionStorage.clear();
assert.equal(persistence.hasActiveRuntimeSession(), false);
const restored = persistence.restoreRuntimeSnapshot();
assert.equal(restored.restored, true);
assert.equal(persistence.hasActiveRuntimeSession(), true);
assert.equal(
  JSON.parse(sessionStorage.getItem('phiOSRuntimeEntry')).runtimeId,
  runtimeIdentity.runtimeId
);
assert.equal(
  JSON.parse(sessionStorage.getItem('phiOSRuntimeWorkspaceState')).currentStage,
  'review'
);
assert.equal(persistence.getRuntimeRecoveryState().status, 'restored');

const providerModule = await import(
  `${pathToFileURL(
    path.join(root, 'functions/runtime/shared/provider-interface.js')
  ).href}?m3cw10=${Date.now()}`
);
const providerFixtureFiles = [
  'empty-output.json',
  'invalid-json.json',
  'provider-unavailable.json',
  'quota-exceeded.json',
  'schema-mismatch.json',
  'timeout.json'
];
for (const filename of providerFixtureFiles) {
  const fixture = await readJson(`tests/fixtures/provider-failures/${filename}`);
  assert.equal(fixture.preserveRuleOutput, true, `${filename}: preserve output`);
  assert.equal(fixture.destroySession, false, `${filename}: preserve session`);
  const failure = providerModule.createProviderFailure({
    provider: fixture.provider,
    stage: fixture.stage,
    code: fixture.failure,
    warning: `provider_failure:${fixture.failure}`
  });
  assert.equal(failure.success, false);
  assert.equal(failure.output, null);
  assert.equal(failure.error.code, fixture.failure);
  assert.equal(failure.warnings.length, 1);
}

const recoveryCheck = await read('scripts/check-runtime-recovery.mjs');
assert.match(recoveryCheck, /state_preserved,\s*true/);
assert.match(recoveryCheck, /automatic_retry,\s*false/);

const runtimePages = [
  'reality-entry.html',
  'reality-reconstruction.html',
  'reality-reading.html',
  'reality-navigation.html',
  'reality-review.html',
  'my-reality.html'
];
for (const page of runtimePages) {
  const source = await read(page);
  assert.match(source, /name="viewport"/, `${page}: responsive viewport`);
  assert.match(source, /data-runtime-workspace/, `${page}: unified Runtime shell`);
  assert.match(
    source,
    /class="[^"]*language-(?:switcher|option|button)|data-locale=/,
    `${page}: language switcher`
  );
}

const localeControllers = [
  'assets/js/reality-entry.js',
  'assets/js/reconstruction.js',
  'assets/js/reading.js',
  'assets/js/navigation.js',
  'assets/js/review.js',
  'assets/js/pages/my-reality.js'
];
for (const controller of localeControllers) {
  assert.match(
    await read(controller),
    /onLocaleChange/,
    `${controller}: live bilingual refresh`
  );
}
const i18nSource = await read('assets/js/i18n.js');
assert.equal(
  i18nSource.includes('sessionStorage'),
  false,
  'Changing interface language must not replace Runtime session contracts'
);

const responsiveStyles = [
  'assets/css/reality-journey.css',
  'assets/css/reality-dashboard.css',
  'assets/css/entry-workspace.css',
  'assets/css/entry-visual-alignment.css',
  'assets/css/guided-entry.css',
  'assets/css/entry-recovery-consent.css',
  'assets/css/reconstruction-workspace.css',
  'assets/css/reconstruction-visual-alignment.css',
  'assets/css/reading-workspace.css',
  'assets/css/reading-visual-alignment.css',
  'assets/css/navigation-workspace.css',
  'assets/css/navigation-visual-alignment.css',
  'assets/css/review-memory-continuity.css'
];
for (const stylesheet of responsiveStyles) {
  assert.match(
    (await read(stylesheet)).replaceAll(' ', ''),
    /@media\(max-width:/,
    `${stylesheet}: mobile layout contract`
  );
}

const slowNetworkContracts = [
  {
    controller: 'assets/js/reconstruction.js',
    loader: 'assets/js/modules/reconstruction-loader.js',
    retry: 'retryReconstruction'
  },
  {
    controller: 'assets/js/reading.js',
    loader: 'assets/js/modules/reading-loader.js',
    retry: 'retryReading'
  },
  {
    controller: 'assets/js/navigation.js',
    loader: 'assets/js/modules/navigation-loader.js',
    retry: 'retryNavigation'
  }
];
for (const contract of slowNetworkContracts) {
  const controller = await read(contract.controller);
  const loader = await read(contract.loader);
  assert.match(controller, /finally\s*\{/, `${contract.controller}: loading reset`);
  assert.match(loader, /loading/i, `${contract.loader}: loading state`);
  assert.equal(
    loader.includes(contract.retry),
    true,
    `${contract.loader}: explicit retry`
  );
}

const overview = await read('reality-journey.html');
for (const stage of registry.journeyStages) {
  assert.equal(
    overview.includes(`id="stage-${stage}"`),
    true,
    `Journey Overview missing ${stage}`
  );
}
const dashboard = await read('reality-dashboard.html');
for (const marker of [
  'id="currentStage"',
  'id="completedStages"',
  'id="nextStep"',
  'id="latestUpdate"',
  'id="recoveryStatus"',
  'id="journeyTimeline"'
]) {
  assert.equal(dashboard.includes(marker), true, `Dashboard missing ${marker}`);
}

const routeFiles = {
  entry: 'reality-entry.html',
  reconstruction: 'reality-reconstruction.html',
  reading: 'reality-reading.html',
  navigation: 'reality-navigation.html',
  review: 'reality-review.html',
  memory: 'my-reality.html',
  continuity: 'my-reality.html'
};
for (const stage of JOURNEY_DASHBOARD_STAGES) {
  assert.equal(
    await exists(routeFiles[stage.id]),
    true,
    `Journey route gap at ${stage.id}`
  );
}

const runtimeWorkspace = await read('assets/js/modules/runtime-workspace.js');
for (const stage of JOURNEY_DASHBOARD_STAGES) {
  assert.equal(
    runtimeWorkspace.includes(`id: '${stage.id}'`),
    true,
    `Unified Runtime progress missing ${stage.id}`
  );
  assert.equal(
    runtimeWorkspace.includes(stage.route),
    true,
    `Unified Runtime progress missing route ${stage.route}`
  );
}

const transitionEngine = await read(
  'assets/js/modules/runtime-transition-engine.js'
);
for (const lineageContract of [
  'appendRuntimeHistory(snapshot)',
  "mode: 'new_revision'",
  "return_to_reading: '/reality-reading.html?mode=revision'",
  "start_new_entry: '/reality-entry.html?mode=new-runtime'"
]) {
  assert.equal(
    transitionEngine.includes(lineageContract),
    true,
    `Lineage-preserving transition contract missing: ${lineageContract}`
  );
}

const myReality = await read('my-reality.html');
for (const visibleContract of [
  'id="memoryWorkspace"',
  'data-memory-view="memory-summary"',
  'id="continuity"',
  'data-continuity-view="check-in"',
  'id="confirmContinuity"'
]) {
  assert.equal(
    myReality.includes(visibleContract),
    true,
    `Memory/Continuity visibility missing: ${visibleContract}`
  );
}

const entryPage = await read('reality-entry.html');
assert.equal(entryPage.includes('id="entryRecoveryGate"'), true);
assert.equal(entryPage.includes('id="resumeEntryButton"'), true);
assert.equal(entryPage.includes('id="startFreshEntryButton"'), true);

assert.equal(registry.status, 'm3c-public-journey-acceptance-ready');
assert.equal(
  registry.baseline.commit,
  'e5ea4a357c8593fd09b99bbe4afe953f1134c95d'
);
assert.equal(registry.matrix.caseCount, acceptanceCases.length);
assert.deepEqual(registry.scenarios, requiredScenarios);
for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen M3C artifact changed: ${file}`
  );
}
assert.deepEqual(registry.acceptanceBoundaries, {
  dashboardProjectionReadOnly: true,
  recoveryUsesValidatedSnapshot: true,
  providerFailurePreservesRuntime: true,
  automaticProviderRetry: false,
  languageSwitchPreservesRuntimeIdentity: true,
  slowNetworkExposesLoadingAndRetry: true,
  expiredSessionRequiresExplicitEntryResume: true,
  revisionPreservesLineage: true,
  productionRunReadOnly: true
});
for (const value of Object.values(registry.completionStandard)) {
  assert.equal(value, true);
}

const productionCheck = await read(
  'scripts/check-m3c-public-journey-production.mjs'
);
assert.match(productionCheck, /PHIOS_PUBLIC_JOURNEY_BASE_URL/);
assert.match(productionCheck, /runtimeDatabaseBound/);
assert.match(productionCheck, /method:\s*['"]GET['"]|fetch\(/);
for (const forbidden of [
  "method: 'POST'",
  'method: "POST"',
  "method: 'PUT'",
  "method: 'PATCH'",
  "method: 'DELETE'"
]) {
  assert.equal(
    productionCheck.includes(forbidden),
    false,
    `Production acceptance must remain read-only: ${forbidden}`
  );
}

console.log(
  '✓ M3C-W10 Public Journey Acceptance passed (8 scenarios × 2 languages × 2 viewports = 32 cases).'
);
console.log(
  '  Journey Overview → Dashboard → Runtime stages → Memory → Continuity is recoverable, bilingual, responsive and lineage-preserving.'
);
console.log(
  '  Run check:m3c-public-journey-production after deployment for the live read-only release gate.'
);
