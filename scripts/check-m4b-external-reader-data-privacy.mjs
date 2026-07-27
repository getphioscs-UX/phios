import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const load = file => import(`${pathToFileURL(path.join(root, file)).href}?v=${Date.now()}`);
const [page, controller, workspace, css, en, zh, privacy, files, registry] = await Promise.all([
  read('professional-data-privacy.html'), read('assets/js/pages/professional-data-privacy.js'),
  read('professional-workspace.html'), read('assets/css/professional-workspace.css'),
  read('assets/js/locales/en/professional.js'), read('assets/js/locales/zh-Hans/professional.js'),
  load('functions/professional/external-readers/external-reader-data-privacy-contract.js'),
  load('functions/professional/external-readers/external-reader-file-security-policy.js'),
  JSON.parse(await read('content/registry/m4b-external-reader-data-privacy.json'))
]);
assert.equal(privacy.EXTERNAL_READER_DATA_CLASSES.length, 10);
assert.equal(privacy.EXTERNAL_READER_RETENTION_CATEGORIES.length, 5);
assert.equal(privacy.EXTERNAL_READER_RIGHTS_ACTIONS.length, 6);
for (const dataClass of privacy.EXTERNAL_READER_DATA_CLASSES) {
  const classified = privacy.classifyExternalReaderData({ data_class: dataClass, source_reference: `source_${dataClass}`, client_id: 'client_1' });
  assert.equal(classified.public, false); assert.equal(classified.runtime_evidence, false);
  assert.equal(classified.runtime_memory_eligible_by_default, false);
}
for (const choice of privacy.EXTERNAL_READER_RETENTION_CHOICES) {
  const decision = privacy.createExternalReaderRetentionDecision({
    retention_decision_id: `decision_${choice}`, client_id: 'client_1', service_id: 'service_1',
    consent_reference: 'consent_1', retention_choice: choice,
    data_classes: ['birth_date','chart_image','professional_interpretation'], explicit_action: true
  }, { now: '2026-07-27T00:00:00.000Z' });
  assert.equal(decision.long_term_runtime_memory_write, false);
  assert.equal(decision.deletion_claimed_complete, false);
}
assert.throws(() => privacy.createExternalReaderRetentionDecision({
  retention_decision_id: 'bad', client_id: 'c', service_id: 's', consent_reference: 'x',
  retention_choice: 'service_only', data_classes: ['birth_date']
}), /explicit/);
for (const action of privacy.EXTERNAL_READER_RIGHTS_ACTIONS) {
  const request = privacy.createExternalReaderRightsRequest({
    request_id: `request_${action}`, client_id: 'client_1', action,
    resource_references: action === 'request_account_deletion' ? [] : ['resource_1'], explicit_action: true
  }, { now: '2026-07-27T00:00:00.000Z' });
  assert.equal(request.action_executed, false); assert.equal(request.deletion_claimed_complete, false);
}
const policy = files.getExternalReaderFileSecurityPolicy();
assert.deepEqual(Object.keys(policy.allowed_file_types), ['png','jpg','jpeg','webp','pdf']);
assert.equal(policy.maximum_file_size_bytes, 26214400);
assert.equal(policy.malware_scan_required, true); assert.equal(policy.private_storage_required, true);
assert.equal(policy.signed_access_url_required, true); assert.equal(policy.access_expiry_maximum_seconds, 900);
assert.equal(policy.storage_implementation_enabled, false); assert.equal(policy.deletion_worker_enabled, false);
const metadata = files.validateExternalReaderFileMetadata({ extension: '.webp', mime_type: 'image/webp', size_bytes: 1024 });
assert.equal(metadata.upload_authorised, false); assert.equal(metadata.malware_scan_status, 'not_started');
for (const token of ['retentionChoices','confirmRetention','export_birth_data','delete_uploaded_chart','request_account_deletion']) assert.ok(page.includes(token));
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) assert.equal(controller.includes(forbidden), false);
assert.ok(workspace.includes('/professional-data-privacy'));
assert.equal(registry.runtimeBoundary.explicitRetentionChoiceRequired, true);
assert.equal(registry.runtimeBoundary.readerInterpretationWrittenByDefault, false);
assert.equal(registry.capabilities.liveDeletionWorker, false);
for (const key of ['serviceOnly','futureSessions','noRetention','exportBirth','deleteChart','boundary']) {
  assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`));
}
assert.ok(css.includes('.privacy-rights-grid'));
console.log('✓ M4B-W8 External Reader Data and Privacy passed: classification, retention, file security, rights requests and explicit memory choices are aligned.');
console.log('  No file storage, malware scanner, signed URL, export worker or deletion worker is falsely represented as active.');
