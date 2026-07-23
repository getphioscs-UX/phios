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
  'my-reality.html',
  'assets/css/review-memory-continuity.css',
  'assets/js/pages/my-reality.js',
  'assets/js/modules/continuity-customer-projection.js',
  'assets/js/locales/en/review.js',
  'assets/js/locales/zh-Hans/review.js',
  'content/registry/m3c-continuity.json',
  'docs/public/M3C-W9-CONTINUITY.md'
];
for (const file of required) {
  assert.equal(await exists(file), true, `Missing M3C-W9 deliverable: ${file}`);
}

const page = await read('my-reality.html');
for (const token of [
  'data-continuity-view="check-in"',
  'id="continuityTrigger"',
  'id="continuityNextReview"',
  'id="continuityTriggerInput"',
  'id="continuityNextReviewInput"',
  'name="newChangeStatus"',
  'id="continuityNewChange"',
  'id="continuityBranch"',
  'id="continuityBranchTitle"',
  'id="confirmContinuity"',
  'id="executeTransition"'
]) {
  assert.equal(page.includes(token), true, `Continuity customer contract is missing: ${token}`);
}

const controller = await read('assets/js/pages/my-reality.js');
for (const token of [
  "from '../modules/continuity-customer-projection.js'",
  'buildContinuityCustomerProjection(',
  'customerCheckIn: checkIn',
  "evidenceClass: 'reported_experience'",
  'automaticDetection: false',
  "status: 'prepared'",
  'automaticSelection:false',
  'createsNextRuntime:false',
  'RuntimeKernel.transition.execute('
]) {
  assert.equal(controller.includes(token), true, `Continuity controller is missing: ${token}`);
}

const projectionSource = await read('assets/js/modules/continuity-customer-projection.js');
for (const forbidden of ['sessionStorage', 'localStorage', 'fetch(', 'setSession(', '/api/']) {
  assert.equal(
    projectionSource.includes(forbidden),
    false,
    `Continuity projection must remain read-only: ${forbidden}`
  );
}
const projectionModule = await import(
  `${pathToFileURL(path.join(root, 'assets/js/modules/continuity-customer-projection.js')).href}?w9=${Date.now()}`
);
const revision = projectionModule.buildContinuityCustomerProjection({
  createdAt: '2026-07-23T00:00:00.000Z',
  selectedPath: { observationWindow: '7 days' },
  outcomeMemory: { nextRuntimeState: 'return_to_reading' }
});
assert.equal(revision.trigger.code, 'revision_needed');
assert.equal(revision.reviewTiming.nextReviewAt, '2026-07-30T00:00:00.000Z');
assert.equal(revision.branch.type, 'revision');
assert.equal(revision.branch.revisionAvailable, true);
assert.equal(revision.checkIn.automaticDetection, false);

const newJourney = projectionModule.buildContinuityCustomerProjection({
  createdAt: '2026-07-23T00:00:00.000Z',
  selectedPath: { observationWindow: '2 weeks' },
  outcomeMemory: { nextRuntimeState: 'start_new_entry' }
}, {
  userChoice: { confirmed: true },
  customerCheckIn: {
    trigger: 'new_change',
    nextReviewAt: '2026-08-10T00:00:00.000Z',
    newChangeStatus: 'yes',
    newChangeText: 'A new work change became visible.'
  }
});
assert.equal(newJourney.branch.type, 'new_journey');
assert.equal(newJourney.branch.newJourneyAvailable, true);
assert.equal(newJourney.checkIn.recorded, true);
assert.equal(newJourney.checkIn.evidenceClass, 'reported_experience');
assert.equal(newJourney.guardrails.automaticNextRuntimeCreationAllowed, false);

const registry = await json('content/registry/m3c-continuity.json');
assert.equal(registry.baseline.commit, '21531bb7527b34055ec4c20e852e463dae740d1c');
assert.equal(registry.checkInBoundary.automaticDetectionAllowed, false);
assert.equal(registry.branchBoundary.automaticNextRuntimeCreationAllowed, false);
for (const [file, expected] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(await sha256(file), expected, `Frozen M3C-W9 artifact changed: ${file}`);
}

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:m3c-continuity'],
  'node scripts/check-m3c-continuity.mjs'
);
assert.equal(packageJson.scripts.check.includes('scripts/check-m3c-continuity.mjs'), true);

console.log('✓ M3C-W9 Continuity passed: trigger, next Review, Check-in, new-change report and Revision / New Journey branch are customer-visible.');
console.log('  Check-in remains reported experience; Review outcome matching, confirmation, lineage and no-automatic-Runtime guardrails remain intact.');

