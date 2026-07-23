import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  JOURNEY_DASHBOARD_STAGES,
  buildJourneyDashboardProjection
} from '../assets/js/modules/journey-dashboard-projection.js';

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

const requiredFiles = [
  'reality-dashboard.html',
  'assets/css/reality-dashboard.css',
  'assets/js/pages/reality-dashboard.js',
  'assets/js/modules/journey-dashboard-projection.js',
  'assets/js/locales/en/journey.js',
  'assets/js/locales/zh-Hans/journey.js',
  'content/registry/m3c-journey-dashboard.json',
  'docs/public/M3C-W2-JOURNEY-DASHBOARD.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W2 deliverable: ${file}`);
}

const page = await read('reality-dashboard.html');
for (const contract of [
  'id="currentStage"',
  'id="completedStages"',
  'id="nextStep"',
  'id="latestUpdate"',
  'id="recoveryStatus"',
  'id="resumeJourney"',
  'id="resumeBoundaryAction"',
  'id="reviseBoundaryAction"',
  'id="newJourneyBoundaryAction"',
  'id="journeyTimeline"',
  '/assets/js/pages/reality-dashboard.js',
  '/assets/js/public-shell.js',
  'data-public-section="reality"',
  'content="noindex,follow"'
]) {
  assert.match(page, new RegExp(contract), `Journey Dashboard is missing: ${contract}`);
}

for (const forbidden of [
  '<form',
  '<input',
  '<textarea',
  'data-runtime-submit',
  '/api/'
]) {
  assert.equal(
    page.includes(forbidden),
    false,
    `Journey Dashboard page must not contain ${forbidden}`
  );
}

const dashboardScript = await read('assets/js/pages/reality-dashboard.js');
for (const readContract of [
  'RuntimeKernel.workspace.inspect',
  'RuntimeKernel.persistence.recoveryState',
  'RuntimeKernel.persistence.loadSnapshot',
  'RuntimeKernel.persistence.validateSnapshot',
  'RuntimeKernel.lineage.timeline',
  'buildJourneyDashboardProjection'
]) {
  assert.match(
    dashboardScript,
    new RegExp(readContract),
    `Dashboard must read canonical state through ${readContract}`
  );
}

for (const forbiddenMutation of [
  'setSession(',
  'sessionStorage.setItem',
  'sessionStorage.removeItem',
  'sessionStorage.clear',
  'localStorage.setItem',
  'localStorage.removeItem',
  'executeRuntimeTransition',
  'transition.execute',
  'clearPersistedRuntime'
]) {
  assert.equal(
    dashboardScript.includes(forbiddenMutation),
    false,
    `Dashboard projection must not mutate Runtime through ${forbiddenMutation}`
  );
}

const workspaceState = await read('assets/js/modules/runtime-workspace-state.js');
assert.match(
  workspaceState,
  /export function inspectRuntimeWorkspaceState\(currentStage = ''\)/
);
assert.match(
  workspaceState,
  /export function deriveRuntimeWorkspaceState\(currentStage = ''\)/
);
assert.match(
  workspaceState,
  /const state = inspectRuntimeWorkspaceState\(currentStage\);\s+setSession\(WORKSPACE_STATE_KEY, state\);/
);

assert.deepEqual(
  JOURNEY_DASHBOARD_STAGES.map(stage => stage.id),
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.deepEqual(
  JOURNEY_DASHBOARD_STAGES.map(stage => stage.number),
  ['01', '02', '03', '04', '05', '06', '07']
);

const emptyProjection = buildJourneyDashboardProjection();
assert.equal(emptyProjection.hasActiveJourney, false);
assert.equal(emptyProjection.resumeRoute, '/reality-entry.html');
assert.equal(emptyProjection.recoveryCode, 'empty');
assert.equal(emptyProjection.guardrails.readOnlyProjection, true);
assert.equal(emptyProjection.guardrails.automaticRuntimeCreation, false);

const readingProjection = buildJourneyDashboardProjection({
  workspace: {
    currentStage: 'reading',
    completedStages: ['entry', 'reconstruction'],
    availableStages: ['entry', 'reconstruction', 'reading']
  },
  lineage: {
    activeRuntimeId: 'runtime_current',
    runtimeEntityId: 'entity_current',
    runtimes: [{
      runtimeId: 'runtime_current',
      runtimeEntityId: 'entity_current',
      status: 'active',
      events: [
        { type: 'entry', occurredAt: '2026-07-23T01:00:00.000Z' },
        { type: 'reconstruction', occurredAt: '2026-07-23T02:00:00.000Z' }
      ]
    }]
  },
  snapshot: {
    runtimeId: 'runtime_current',
    savedAt: '2026-07-23T02:30:00.000Z'
  },
  snapshotValidation: { valid: true, reason: '' },
  recoveryState: { status: 'saved', savedAt: '2026-07-23T02:30:00.000Z' },
  hasActiveJourney: true
});

assert.equal(readingProjection.currentStage, 'reading');
assert.equal(readingProjection.resumeRoute, '/reality-reading.html');
assert.equal(readingProjection.completedCount, 2);
assert.equal(readingProjection.nextStepStage, 'reading');
assert.equal(readingProjection.recoveryCode, 'protected');
assert.equal(readingProjection.timeline[0].type, 'reconstruction');
assert.equal(readingProjection.revisionRoute, '/my-reality.html#continuity');
assert.equal(readingProjection.newJourneyRoute, '/my-reality.html#continuity');
assert.equal(
  readingProjection.guardrails.explicitContinuityChoiceRequired,
  true
);

const restoredProjection = buildJourneyDashboardProjection({
  workspace: { currentStage: 'navigation' },
  snapshot: { runtimeId: 'runtime_restored' },
  snapshotValidation: { valid: true, reason: '' },
  recoveryState: {
    status: 'restored',
    restoredAt: '2026-07-23T03:00:00.000Z'
  },
  hasActiveJourney: true
});
assert.equal(restoredProjection.recoveryCode, 'restored');
assert.equal(restoredProjection.latestUpdate, '2026-07-23T03:00:00.000Z');

const attentionProjection = buildJourneyDashboardProjection({
  snapshot: { runtimeId: 'runtime_invalid' },
  snapshotValidation: { valid: false, reason: 'checksum_mismatch' },
  hasActiveJourney: true
});
assert.equal(attentionProjection.recoveryCode, 'attention');

const shell = await read('assets/js/public-shell.js');
assert.match(shell, /path === '\/reality-dashboard'/);
const overview = await read('reality-journey.html');
assert.match(overview, /href="\/reality-dashboard"/);
assert.match(overview, /data-i18n="journeyPublic\.hero\.resume"/);

const registry = await readJson('content/registry/m3c-journey-dashboard.json');
assert.equal(registry.status, 'w2-journey-dashboard-ready');
assert.equal(registry.dashboard.publicRoute, '/reality-dashboard');
assert.equal(registry.dashboard.projectionMode, 'read-only');
assert.equal(registry.dashboard.automaticRuntimeCreation, false);
assert.deepEqual(
  registry.summary.fields,
  ['currentStage', 'completedStages', 'nextStep', 'latestUpdate', 'recoveryStatus']
);
assert.equal(registry.summary.secondStateSystemCreated, false);
assert.equal(registry.actions.revise.requiresExplicitContinuityChoice, true);
assert.equal(
  registry.actions.startNewJourney.requiresExplicitContinuityChoiceWhenRuntimeExists,
  true
);
assert.equal(registry.actions.startNewJourney.preservesLineage, true);
assert.equal(registry.timeline.appendOnly, true);
assert.equal(registry.timeline.promotesReportedExperienceToEvidence, false);
assert.equal(registry.recovery.claimsCloudRecoveryWithoutEvidence, false);
assert.equal(registry.acceptance.runtimeContractsChanged, false);
assert.equal(registry.acceptance.runtimeSchemasChanged, false);
assert.equal(registry.acceptance.d1BindingChanged, false);
assert.equal(registry.acceptance.runtimeMigrationsChanged, false);
assert.equal(registry.acceptance.dashboardMutatesRuntime, false);
assert.equal(registry.acceptance.dashboardExecutesTransition, false);

const css = await read('assets/css/reality-dashboard.css');
for (const responsiveContract of [
  '@media (max-width: 1000px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '.journey-dashboard-summary__grid',
  '.journey-dashboard-stages',
  '.journey-dashboard-decision-grid',
  '.journey-dashboard-events'
]) {
  assert.match(css, new RegExp(responsiveContract.replace(/[()]/g, '\\$&')));
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-journey-dashboard'],
  'node scripts/check-m3c-journey-dashboard.mjs'
);
assert.match(packageJson.scripts.check, /check-m3c-journey-dashboard\.mjs/);

console.log('✓ M3C-W2 Journey Dashboard passed: state, recovery, actions and timeline are customer-visible.');
console.log('  Dashboard remains read-only; Revise and Start New Journey require explicit Continuity confirmation.');
