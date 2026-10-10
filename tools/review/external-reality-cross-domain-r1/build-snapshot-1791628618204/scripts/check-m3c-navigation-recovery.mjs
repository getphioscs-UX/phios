import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  selectExecutionPath,
  saveNavigationConfiguration,
  startNavigationAction,
  addNavigationEvidenceLog,
  activeNavigationAction
} from '../assets/js/modules/navigation-execution.js';
import {
  fixtureResponse,
  observationConfiguration
} from './fixtures/navigation-execution-fixture.mjs';

const fixture = fixtureResponse();
let response = selectExecutionPath(fixture, fixture.navigation.availablePaths[0]);
response = saveNavigationConfiguration(response, observationConfiguration());
response = startNavigationAction(response);
response = addNavigationEvidenceLog(response, {
  signal: '每天检查余额次数',
  value: 8
});
const serialized = JSON.stringify(response);
const restored = JSON.parse(serialized);
assert.equal(activeNavigationAction(restored).execution.state, 'active');
assert.deepEqual(activeNavigationAction(restored).path.baseline, ['每天约 8 次']);
assert.equal(activeNavigationAction(restored).evidence_logs.length, 1);
assert.equal(restored.navigationExecution.storage_capability.local_recovery, true);
assert.equal(restored.navigationExecution.storage_capability.cross_device_recovery, false);
assert.equal(
  restored.navigationExecution.storage_capability.cross_device_status,
  'capability_not_available'
);

const nextPath = fixture.navigation.availablePaths[1];
const changed = selectExecutionPath(restored, nextPath, {
  change_reason: '需要先澄清未知项'
});
assert.equal(changed.navigationExecution.actions.length, 2);
assert.equal(changed.navigationExecution.actions[0].execution.state, 'cancelled');
assert.equal(changed.navigationExecution.actions[0].evidence_logs.length, 1);
assert.notEqual(
  changed.navigationExecution.actions[0].navigation_action_id,
  changed.navigationExecution.actions[1].navigation_action_id
);
assert.equal(changed.navigationExecution.path_changes.length, 1);

const persistence = await fs.readFile('assets/js/modules/runtime-persistence.js', 'utf8');
assert.match(persistence, /phiOSRealityNavigation/);
assert.match(persistence, /phiOSNavigationReviewHandoff/);

console.log('✓ M3C-W12 local Persistence, recovery and change-path lineage passed; cross-device recovery remains capability_not_available.');
