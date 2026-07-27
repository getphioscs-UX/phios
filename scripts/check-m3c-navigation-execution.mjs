import assert from 'node:assert/strict';
import {
  EXECUTION_STATES,
  transitionExecution,
  selectExecutionPath,
  saveNavigationConfiguration,
  startNavigationAction,
  triggerNavigationReview
} from '../assets/js/modules/navigation-execution.js';
import {
  fixtureResponse,
  observationConfiguration
} from './fixtures/navigation-execution-fixture.mjs';

assert.deepEqual(EXECUTION_STATES, [
  'available', 'selected', 'configured', 'active',
  'completed', 'review_due', 'cancelled'
]);
for (const [state, event, next] of [
  ['available', 'select_path', 'selected'],
  ['selected', 'save_configuration', 'configured'],
  ['selected', 'cancel', 'cancelled'],
  ['configured', 'start', 'active'],
  ['configured', 'change_path', 'cancelled'],
  ['active', 'add_log', 'active'],
  ['active', 'completion_condition_met', 'completed'],
  ['active', 'stop_condition_triggered', 'review_due'],
  ['active', 'observation_window_completed', 'review_due'],
  ['active', 'user_end', 'review_due'],
  ['active', 'professional_review_requested', 'review_due'],
  ['completed', 'request_review', 'review_due']
]) assert.equal(transitionExecution(state, event), next);
assert.throws(() => transitionExecution('selected', 'start'), /Illegal/);
assert.throws(() => transitionExecution('available', 'start'), /Illegal/);

let response = selectExecutionPath(
  fixtureResponse(),
  fixtureResponse().navigation.availablePaths[0]
);
assert.equal(response.navigationExecution.actions[0].execution.state, 'selected');
response = saveNavigationConfiguration(response, observationConfiguration());
assert.equal(response.navigationExecution.actions[0].execution.state, 'configured');
response = startNavigationAction(response, { at: '2026-07-27T00:00:00.000Z' });
assert.equal(response.navigationExecution.actions[0].execution.state, 'active');
response = triggerNavigationReview(response, 'user_end', {
  at: '2026-07-28T00:00:00.000Z'
});
assert.equal(response.navigationExecution.actions[0].execution.state, 'review_due');

console.log('✓ M3C-W12 Navigation Execution state machine passed; illegal skips are rejected.');
