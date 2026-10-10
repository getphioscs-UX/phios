import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const load = file => import(`${pathToFileURL(path.join(root, file)).href}?v=${Date.now()}`);
const [page, controller, css, en, zh, intakeModule, handoffModule] = await Promise.all([
  read('external-reader-intake.html'),
  read('assets/js/pages/external-reader-intake.js'),
  read('assets/css/professional-workspace.css'),
  read('assets/js/locales/en/professional.js'),
  read('assets/js/locales/zh-Hans/professional.js'),
  load('functions/professional/external-readers/external-reader-intake-contract.js'),
  load('functions/professional/external-readers/chart-upload-handoff-contract.js')
]);
for (const token of ['externalReaderIntakeForm', 'externalReaderChartFile', 'humanDesignFields', 'genericReaderFields', 'externalReaderHandoff', '.png,.jpg,.jpeg,.webp,.pdf']) {
  assert.ok(page.includes(token), `Intake page missing ${token}`);
}
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', 'FileReader', '/api/']) {
  assert.equal(controller.includes(forbidden), false, `Client boundary crossed: ${forbidden}`);
}
for (const token of ['.intake-form', 'min-height: 48px', 'max-width: 768px', 'max-width: 520px']) {
  assert.ok(css.includes(token), `Responsive intake CSS missing ${token}`);
}
for (const key of ['title', 'humanDesignAvailable', 'infrastructureReady', 'consentBoundary', 'prepareHandoff', 'footerBoundary']) {
  assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`));
}
const consent = {
  data_submission_confirmed: true,
  interpretation_boundary_acknowledged: true,
  professional_access_confirmed: true
};
const base = {
  intake_id: 'intake_1', workspace_id: 'workspace_1', client_id: 'client_1',
  display_name: 'Client', service_id: 'runtime_interpretation',
  current_reality_question: 'What should be observed?', consent,
  retention_choice: 'service_only', submitted_at: '2026-07-27T00:00:00.000Z'
};
const human = intakeModule.createExternalReaderIntake({
  ...base, reader_type: 'human_design', known_chart_fields: { type: 'Generator' }
});
assert.equal(human.interpretation_available, true);
assert.equal(human.runtime_evidence_written, false);
const bazi = intakeModule.createExternalReaderIntake({
  ...base, intake_id: 'intake_2', reader_type: 'bazi',
  known_chart_fields: { day_master: 'client-provided' }
});
assert.equal(bazi.interpretation_available, false);
const handoff = handoffModule.createExternalReaderIntakeHandoff(human, {
  handoff_id: 'handoff_1', workspace_id: 'workspace_1',
  now: '2026-07-27T00:00:00.000Z'
});
assert.deepEqual(handoff.queue_tasks.map(task => task.task_type), [
  'external_reader_intake_received',
  'structured_data_awaiting_verification'
]);
assert.equal(handoff.required_action_generated, false);
console.log('✓ M4B-W3D External Reader Intake passed: shared Human Design/Generic Reader intake, metadata-only chart preview and professional review handoff preserve Runtime boundaries.');
