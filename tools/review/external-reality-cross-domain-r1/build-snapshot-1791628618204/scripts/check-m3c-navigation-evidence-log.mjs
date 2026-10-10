import assert from 'node:assert/strict';
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

const base = fixtureResponse();
let response = selectExecutionPath(base, base.navigation.availablePaths[0]);
response = saveNavigationConfiguration(response, observationConfiguration());
response = startNavigationAction(response, { at: '2026-07-27T00:00:00.000Z' });
response = addNavigationEvidenceLog(response, {
  recorded_at: '2026-07-28T00:00:00.000Z',
  signal: '每天检查余额次数',
  value: 6,
  unit: 'count',
  trigger: 'income_change',
  intensity: 7,
  counter_example: false,
  user_note: '延后了一项决定'
}, { at: '2026-07-28T00:00:00.000Z' });
response = addNavigationEvidenceLog(response, {
  recorded_at: '2026-07-29T00:00:00.000Z',
  signal: '每天检查余额次数',
  value: 3,
  unit: 'count',
  trigger: 'fixed_bill',
  intensity: 2,
  counter_example: true
}, { at: '2026-07-29T00:00:00.000Z' });

const action = activeNavigationAction(response);
assert.equal(action.evidence_logs.length, 2);
assert.equal(action.evidence_logs[0].evidence_class, 'user_logged_observation');
assert.equal(action.evidence_logs[1].evidence_class, 'counter_example');
assert.notEqual(action.evidence_logs[0].evidence_class, 'observed_evidence');
assert.equal(action.progress.log_count, 2);
assert.equal(action.progress.counter_example_count, 1);
assert.equal(action.progress.outcome_improvement_claimed, false);

console.log('✓ M3C-W12 Navigation Evidence Log and Observation progress passed; user logs are not upgraded to Observed Evidence.');
