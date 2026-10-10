import assert from 'node:assert/strict';
import {
  createNavigationAction,
  navigationExecutionStatus
} from '../assets/js/modules/navigation-execution.js';
import { fixtureResponse } from './fixtures/navigation-execution-fixture.mjs';

const response = fixtureResponse();
for (const path of response.navigation.availablePaths) {
  const action = createNavigationAction(response, path, {
    at: '2026-07-27T00:00:00.000Z'
  });
  for (const field of [
    'navigation_action_id', 'runtime_entity_id', 'runtime_entry_id',
    'source_reading_id', 'source_reading_version', 'navigation_version',
    'path', 'execution', 'created_at', 'updated_at'
  ]) assert.ok(action[field] !== undefined, `Missing Action field: ${field}`);
  for (const field of [
    'path_id', 'path_type', 'objective', 'selected_signal', 'baseline',
    'action', 'observation_window', 'frequency', 'completion_condition',
    'stop_condition', 'review_condition'
  ]) assert.ok(action.path[field] !== undefined, `Missing path field: ${field}`);
}

const observation = createNavigationAction(response, response.navigation.availablePaths[0]);
assert.ok(observation.path.record_fields.includes('counter_example'));
const clarification = createNavigationAction(response, response.navigation.availablePaths[1]);
assert.ok(Array.isArray(clarification.path.unknown_items));
assert.equal(clarification.path.answer_classification, 'clarification_answer');
const verification = createNavigationAction(response, response.navigation.availablePaths[2]);
assert.ok('discriminating_condition' in verification.path);
const financial = createNavigationAction(response, response.navigation.availablePaths[3]);
assert.equal(financial.path.sensitive_financial_data_collected, false);
assert.equal(financial.path.financial_intake_enabled, false);
assert.equal(navigationExecutionStatus().crossDeviceStatus, 'capability_not_available');

console.log('✓ M3C-W12 Navigation Action Schema passed for Observation, Clarification, Verification and Financial Review.');
