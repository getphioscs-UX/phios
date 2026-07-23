import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

async function read(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), 'utf8');
  return source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
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
  return crypto.createHash('sha256')
    .update(await read(relativePath), 'utf8')
    .digest('hex');
}

const requiredFiles = [
  'reality-navigation.html',
  'assets/css/navigation-visual-alignment.css',
  'assets/js/navigation.js',
  'assets/js/modules/navigation-customer-projection.js',
  'assets/js/modules/navigation-visual-alignment.js',
  'assets/js/locales/en/navigation.js',
  'assets/js/locales/zh-Hans/navigation.js',
  'content/registry/m3c-navigation-visual-alignment.json',
  'docs/public/M3C-W6-NAVIGATION-VISUAL-ALIGNMENT.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W6 deliverable: ${file}`);
}

const page = await read('reality-navigation.html');
for (const contract of [
  '/assets/css/navigation-visual-alignment.css',
  'data-navigation-view="available-direction"',
  'data-navigation-view="reason"',
  'data-navigation-view="evidence"',
  'data-navigation-view="constraint"',
  'data-navigation-view="first-action"',
  'data-navigation-view="review-point"',
  'id="navigationPath"',
  'id="navigationReason"',
  'id="navigationEvidenceWatch"',
  'id="navigationConstraints"',
  'id="navigationFirstAction"',
  'id="navigationReviewConditions"',
  'id="navigationSelectedPathPanel"'
]) {
  assert.equal(page.includes(contract), true, `Navigation visual contract is missing: ${contract}`);
}

assert.deepEqual(
  [...page.matchAll(/data-navigation-view="([^"]+)"/g)].map(match => match[1]),
  ['available-direction', 'reason', 'evidence', 'constraint', 'first-action', 'review-point']
);
assert.equal(
  page.indexOf('/assets/css/navigation-visual-alignment.css') >
    page.indexOf('/assets/css/design/visual-acceptance.css'),
  true,
  'M3C-W6 stylesheet must load after the existing Navigation layers'
);

for (const id of [
  'navigationDirectionStatus',
  'navigationChoiceBoundary',
  'navigationReason',
  'navigationReasonSource',
  'navigationFirstAction',
  'navigationFirstActionStatus',
  'navigationReviewConditions'
]) {
  assert.equal(
    (page.match(new RegExp(`id="${id}"`, 'g')) || []).length,
    1,
    `Navigation customer metadata must appear exactly once: ${id}`
  );
}

const progressStart = page.indexOf('<ol data-current-stage="navigation"');
const progressBlock = page.slice(
  progressStart,
  page.indexOf('</ol>', progressStart) + 5
);
assert.equal((progressBlock.match(/<li/g) || []).length, 7);
assert.deepEqual(
  [...progressBlock.matchAll(/<data value="([^"]+)"/g)].map(match => match[1]),
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.match(progressBlock, /aria-current="step"/);

const controller = await read('assets/js/navigation.js');
for (const behavior of [
  "from './modules/navigation-visual-alignment.js'",
  'renderNavigationVisualAlignment(',
  'renderRealityNavigation(',
  'restoreNavigationState(',
  'bindNavigationPathSelection('
]) {
  assert.equal(controller.includes(behavior), true, `Navigation controller alignment is missing: ${behavior}`);
}
assert.equal(
  (controller.match(/renderNavigationVisualAlignment\(/g) || []).length,
  2,
  'Navigation projection must refresh after loading and after user path selection'
);

const projectionSource = await read('assets/js/modules/navigation-customer-projection.js');
for (const forbidden of [
  'sessionStorage',
  'localStorage',
  'fetch(',
  'postJSON(',
  'setSession(',
  'persistNavigationState(',
  'selectNavigationPath(',
  'prepareNavigationForReview(',
  '/api/'
]) {
  assert.equal(
    projectionSource.includes(forbidden),
    false,
    `Navigation customer projection must remain read-only: ${forbidden}`
  );
}

const projectionModule = await import(
  `${pathToFileURL(
    path.join(root, 'assets/js/modules/navigation-customer-projection.js')
  ).href}?w6=${Date.now()}`
);

const baseNavigation = {
  currentTransition: { label: 'Clarify the current work transition.' },
  currentPosition: {
    priority: { reason: 'The current evidence supports clarification first.' }
  },
  availablePaths: [
    {
      id: 'observe',
      label: 'Observe',
      firstStep: 'Record one observable change.',
      evidenceWatch: ['Track the next decision.'],
      boundary: 'This path does not decide the final outcome.',
      reviewConditions: ['Review after seven days.']
    }
  ],
  recommendedDirection: { pathId: 'observe' },
  evidenceWatch: ['Track the next decision.'],
  constraints: ['Limited time'],
  unknownReality: ['Whether the change will continue.'],
  reviewConditions: ['Review after seven days.'],
  professionalReview: { recommended: false },
  selectedPath: null
};

const unselected = projectionModule.buildNavigationCustomerProjection({
  navigation: baseNavigation
});
assert.equal(unselected.availableDirection.pathCount, 1);
assert.equal(unselected.availableDirection.selectedPathId, '');
assert.equal(unselected.firstAction.established, false);
assert.equal(unselected.firstAction.text, '');
assert.equal(unselected.reason.sourceCode, 'currentReading');

const selected = projectionModule.buildNavigationCustomerProjection({
  navigation: {
    ...baseNavigation,
    selectedPath: {
      ...baseNavigation.availablePaths[0],
      rationale: 'Observe before changing the current arrangement.'
    }
  }
});
assert.equal(selected.firstAction.established, true);
assert.equal(selected.firstAction.text, 'Record one observable change.');
assert.equal(selected.reason.sourceCode, 'selectedPath');
assert.deepEqual(selected.reviewPoint.items, ['Review after seven days.']);
assert.deepEqual(selected.guardrails, {
  readOnlyProjection: true,
  pathSelectionAllowed: false,
  reviewPreparationAllowed: false,
  sessionWriteAllowed: false,
  automaticPathSelectionAllowed: false,
  userChoiceRequired: true
});

const stylesheet = await read('assets/css/navigation-visual-alignment.css');
for (const styleContract of [
  '.navigation-customer-views',
  '.navigation-customer-view',
  '.navigation-review-view',
  'grid-template-columns: repeat(7',
  '@media (max-width: 900px)',
  '@media (max-width: 720px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(stylesheet.includes(styleContract), true, `Navigation style contract is missing: ${styleContract}`);
}

const registry = await readJson('content/registry/m3c-navigation-visual-alignment.json');
assert.equal(registry.baseline.commit, '8efaae557b05f0187f514798b5a592fbaebbe171');
assert.deepEqual(registry.customerViews, [
  'available-direction',
  'reason',
  'evidence',
  'constraint',
  'first-action',
  'review-point'
]);
assert.equal(registry.choiceBoundary.automaticPathSelectionAllowed, false);
assert.equal(registry.choiceBoundary.firstActionRequiresSelectedPath, true);
assert.equal(registry.acceptance.reviewGateChanged, false);

for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(await sha256(file), expectedHash, `Frozen M3C-W6 artifact changed: ${file}`);
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-navigation-visual-alignment'],
  'node scripts/check-m3c-navigation-visual-alignment.mjs'
);
assert.equal(
  packageJson.scripts.check.includes('scripts/check-m3c-navigation-visual-alignment.mjs'),
  true
);

console.log('✓ M3C-W6 Navigation Visual Alignment passed: Available Direction, Reason, Evidence, Constraint, First Action and Review Point are customer-visible.');
console.log('  No path is auto-selected; Navigation API, state, selection, professional boundary, Review gate, persistence and lineage remain frozen.');
