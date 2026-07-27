import assert from 'node:assert/strict';
import {
  createNavigationAction,
  evaluateReviewGate,
  selectExecutionPath,
  saveNavigationConfiguration,
  startNavigationAction,
  addNavigationEvidenceLog,
  triggerNavigationReview,
  buildReviewHandoff,
  activeNavigationAction
} from '../assets/js/modules/navigation-execution.js';
import {
  fixtureResponse,
  observationConfiguration
} from './fixtures/navigation-execution-fixture.mjs';

const fixture = fixtureResponse();
const selected = createNavigationAction(fixture, fixture.navigation.availablePaths[0]);
assert.equal(evaluateReviewGate(selected, 'user_end').status, 'blocked');

let response = selectExecutionPath(fixture, fixture.navigation.availablePaths[0]);
response = saveNavigationConfiguration(response, observationConfiguration());
response = startNavigationAction(response, { at: '2026-07-27T00:00:00.000Z' });
assert.equal(
  evaluateReviewGate(activeNavigationAction(response), 'observation_window_completed').status,
  'blocked'
);
response = addNavigationEvidenceLog(response, {
  signal: '每天检查余额次数',
  value: 8,
  evidence_class: 'user_logged_observation'
});
response = triggerNavigationReview(response, 'stop_condition_triggered', {
  high_risk: true,
  risk_domain: 'financial'
});
const action = activeNavigationAction(response);
assert.equal(action.review_gate.status, 'required');
assert.equal(action.review_gate.review_payload_ready, true);
const handoff = buildReviewHandoff(response);
assert.equal(handoff.schema_version, 'phi-os.navigation-review-handoff.v1');
assert.equal(handoff.reading_reference.reading_version, 3);
assert.equal(handoff.navigation_reference.execution_state, 'review_due');
assert.equal(handoff.evidence_log_ids.length, 1);

console.log('✓ M3C-W12 Navigation Review Gate and versioned Review Handoff passed.');
