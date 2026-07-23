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
  'assets/js/modules/memory-customer-projection.js',
  'assets/js/locales/en/review.js',
  'assets/js/locales/zh-Hans/review.js',
  'content/registry/m3c-memory.json',
  'docs/public/M3C-W8-MEMORY.md'
];
for (const file of required) {
  assert.equal(await exists(file), true, `Missing M3C-W8 deliverable: ${file}`);
}

const page = await read('my-reality.html');
for (const token of [
  'data-memory-view="memory-summary"',
  'data-memory-view="saved-content"',
  'data-memory-view="privacy-actions"',
  'id="memorySavedCount"',
  'id="memoryObserved"',
  'id="memoryNoChange"',
  'id="memoryEvidence"',
  'id="memoryUnknown"',
  'id="exportRuntimeReport"',
  'id="deleteBrowserRuntime"',
  'memory.deleteBoundary'
]) {
  assert.equal(page.includes(token), true, `Memory customer contract is missing: ${token}`);
}

const controller = await read('assets/js/pages/my-reality.js');
for (const token of [
  "from '../modules/memory-customer-projection.js'",
  'buildMemoryCustomerProjection(',
  'new Blob(',
  'RuntimeKernel.contracts.keys.forEach',
  'RuntimeKernel.persistence.clear()',
  'window.confirm(',
  'PHI-OS-Runtime-Report-'
]) {
  assert.equal(controller.includes(token), true, `Memory controller is missing: ${token}`);
}

const projectionSource = await read('assets/js/modules/memory-customer-projection.js');
for (const forbidden of ['sessionStorage', 'localStorage', 'fetch(', 'setSession(', '/api/']) {
  assert.equal(
    projectionSource.includes(forbidden),
    false,
    `Memory projection must remain read-only: ${forbidden}`
  );
}
const projectionModule = await import(
  `${pathToFileURL(path.join(root, 'assets/js/modules/memory-customer-projection.js')).href}?w8=${Date.now()}`
);
const fixture = projectionModule.buildMemoryCustomerProjection({
  memoryId: 'memory-1',
  runtimeEntryId: 'entry-1',
  selectedPath: { label: 'Observe' },
  reportedMemory: {
    observedChanges: [{ statement: 'A change', verified: false }],
    noObservedChange: [{ statement: 'Still unchanged', verified: false }],
    unexpectedReality: [],
    difficulties: [],
    customerNotes: 'A note'
  },
  evidenceMemory: {
    observedEvidence: [{ statement: 'One observation' }],
    verifiedRecords: [],
    professionalRecords: []
  },
  interpretationMemory: { observations: [], interpretation: '' },
  unresolvedMemory: {
    inheritedUnknownReality: [{ statement: 'Still unknown', verified: false }],
    unexpectedRealityPendingReview: []
  },
  outcomeMemory: { nextRuntimeState: 'continue_observation' }
});
assert.equal(fixture.summary.savedItemCount, 5);
assert.equal(fixture.savedGroups.observedChanges[0], 'A change');
assert.equal(fixture.classifications.reportedExperienceVerified, false);
assert.equal(fixture.actions.browserExportAvailable, true);
assert.equal(fixture.actions.browserDeletionAvailable, true);
assert.equal(fixture.actions.remoteDeletionAvailable, false);
assert.equal(fixture.guardrails.remoteDeletionClaimAllowed, false);

const registry = await json('content/registry/m3c-memory.json');
assert.equal(registry.baseline.commit, '21531bb7527b34055ec4c20e852e463dae740d1c');
assert.equal(registry.dataControls.browserRuntimeDeletion, true);
assert.equal(registry.dataControls.authenticatedRemoteDeletion, false);
assert.equal(registry.dataControls.remoteDeletionClaimAllowed, false);
for (const [file, expected] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(await sha256(file), expected, `Frozen M3C-W8 artifact changed: ${file}`);
}

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:m3c-memory'],
  'node scripts/check-m3c-memory.mjs'
);
assert.equal(packageJson.scripts.check.includes('scripts/check-m3c-memory.mjs'), true);

console.log('✓ M3C-W8 Memory passed: summary, saved-content transparency, local report export and confirmed browser deletion are available.');
console.log('  Browser deletion is not misrepresented as authenticated account or remote D1 deletion; evidence classes and Memory Contract remain frozen.');

