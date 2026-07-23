import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = async relative => (await fs.readFile(path.join(root, relative), 'utf8'))
  .replace(/^\uFEFF/, '')
  .replace(/\r\n?/g, '\n');
const json = async relative => JSON.parse(await read(relative));
const exists = async relative => fs.access(path.join(root, relative))
  .then(() => true)
  .catch(() => false);
const sha256 = async relative => crypto.createHash('sha256')
  .update(await read(relative), 'utf8')
  .digest('hex');

const required = [
  'reality-review.html',
  'assets/css/review-memory-continuity.css',
  'assets/js/review.js',
  'assets/js/modules/review-customer-projection.js',
  'assets/js/modules/review-visual-alignment.js',
  'assets/js/locales/en/review.js',
  'assets/js/locales/zh-Hans/review.js',
  'content/registry/m3c-review.json',
  'docs/public/M3C-W7-REVIEW.md'
];
for (const file of required) {
  assert.equal(await exists(file), true, `Missing M3C-W7 deliverable: ${file}`);
}

const page = await read('reality-review.html');
for (const token of [
  '/assets/css/review-memory-continuity.css',
  'data-review-view="review-summary"',
  'data-review-view="change-since-reading"',
  'data-review-view="action-result"',
  'data-review-view="next-decision"',
  'id="reviewSummaryPath"',
  'id="reviewObserved"',
  'id="reviewPathStatus"',
  'id="reviewDecisionStatus"',
  'data-review-decision-group="continue"',
  'data-review-decision-group="revise"',
  'data-review-decision-group="close"'
]) {
  assert.equal(page.includes(token), true, `Review customer contract is missing: ${token}`);
}
assert.deepEqual(
  [...page.matchAll(/data-review-view="([^"]+)"/g)].map(match => match[1]),
  ['review-summary', 'change-since-reading', 'action-result', 'next-decision']
);

const controller = await read('assets/js/review.js');
for (const token of [
  "from './modules/review-visual-alignment.js'",
  'renderReviewVisualAlignment(',
  'reported_experience',
  'readingOverwriteAllowed:false',
  'automaticSelection:false',
  'selectedByUser: true',
  'setSession(MEMORY_KEY, buildMemory(review))'
]) {
  assert.equal(controller.includes(token), true, `Review controller is missing: ${token}`);
}

const projectionSource = await read('assets/js/modules/review-customer-projection.js');
for (const forbidden of ['sessionStorage', 'localStorage', 'fetch(', 'setSession(', '/api/']) {
  assert.equal(
    projectionSource.includes(forbidden),
    false,
    `Review projection must remain read-only: ${forbidden}`
  );
}
const projectionModule = await import(
  `${pathToFileURL(path.join(root, 'assets/js/modules/review-customer-projection.js')).href}?w7=${Date.now()}`
);
const fixture = projectionModule.buildReviewCustomerProjection({
  status: 'ready_for_memory',
  selectedPath: { label: 'Observe work transition' },
  customerReport: {
    pathStatus: 'completed',
    reviewedAt: '2026-07-23T00:00:00.000Z',
    observedChanges: ['One change'],
    noObservedChange: ['One unchanged condition'],
    unexpectedReality: ['One unexpected condition'],
    difficulties: ['One constraint'],
    customerNotes: 'Recorded'
  },
  reviewOutcome: {
    nextRuntimeState: 'return_to_reading',
    reasons: ['Evidence changed'],
    userSelected: true
  },
  memoryHandoff: { ready: true }
});
assert.equal(fixture.summary.memoryReady, true);
assert.equal(fixture.changeSinceReading.observedCount, 1);
assert.equal(fixture.changeSinceReading.unexpectedCount, 1);
assert.equal(fixture.actionResult.difficultyCount, 1);
assert.equal(fixture.decision.group, 'revise');
assert.equal(fixture.decision.selectedByUser, true);
assert.equal(fixture.guardrails.customerReportAsFactAllowed, false);

const stylesheet = await read('assets/css/review-memory-continuity.css');
for (const token of [
  '.review-summary',
  '.review-decision-grid',
  '@media (max-width: 900px)',
  '@media (max-width: 720px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(stylesheet.includes(token), true, `Review style contract is missing: ${token}`);
}

const registry = await json('content/registry/m3c-review.json');
assert.equal(registry.baseline.commit, '21531bb7527b34055ec4c20e852e463dae740d1c');
assert.deepEqual(registry.customerViews, [
  'review-summary',
  'change-since-reading',
  'action-result',
  'next-decision'
]);
assert.equal(registry.acceptance.automaticOutcomeSelectionAllowed, false);
for (const [file, expected] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(await sha256(file), expected, `Frozen M3C-W7 artifact changed: ${file}`);
}

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:m3c-review'],
  'node scripts/check-m3c-review.mjs'
);
assert.equal(packageJson.scripts.check.includes('scripts/check-m3c-review.mjs'), true);

console.log('✓ M3C-W7 Review passed: Review Summary, Change Since Reading, Action Result and Continue / Revise / Close are customer-visible.');
console.log('  Review Contract, evidence class, Navigation source, Memory handoff and user-choice boundary remain frozen.');

