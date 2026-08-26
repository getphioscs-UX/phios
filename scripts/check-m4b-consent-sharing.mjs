import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const load = file => import(`${pathToFileURL(path.join(root, file)).href}?v=${Date.now()}`);
const [page, controller, en, zh, consentModule, eventModule] = await Promise.all([
  read('professional-consent-sharing.html'),
  read('assets/js/pages/professional-consent-sharing.js'),
  read('assets/js/locales/en/professional.js'),
  read('assets/js/locales/zh-Hans/professional.js'),
  load('functions/professional/consent/external-reader-consent-contract.js'),
  load('functions/professional/consent/external-reader-access-event-contract.js')
]);
assert.deepEqual(consentModule.EXTERNAL_READER_RESOURCE_SCOPES, [
  'entry', 'reconstruction', 'reading', 'navigation', 'runtime_memory',
  'uploaded_files', 'birth_information', 'external_reader_chart', 'previous_reports'
]);
assert.deepEqual(consentModule.EXTERNAL_READER_CONSENT_DURATIONS, [
  'one_time', 'seven_days', 'thirty_days', 'ninety_days',
  'until_service_completion', 'custom_date'
]);
const acknowledgementKeys = [
  'birth_data_voluntarily_submitted', 'birth_time_accuracy_affects_result',
  'interpretive_not_diagnostic', 'reader_does_not_prove_causation',
  'professional_access_is_service_bound', 'future_access_revocable',
  'policy_retention_understood', 'report_does_not_prove_cause',
  'correspondence_requires_runtime_evidence', 'not_licensed_professional_advice',
  'not_deterministic_prediction', 'client_retains_final_decision'
];
const acknowledgements = Object.fromEntries(acknowledgementKeys.map(key => [key, true]));
const consent = consentModule.createExternalReaderConsent({
  consent_id: 'consent_1', client_id: 'client_1', professional_id: 'pro_1',
  service_id: 'service_1', reader_type: 'human_design', purpose: 'Professional review',
  resource_scopes: ['birth_information', 'external_reader_chart'],
  duration: 'thirty_days', acknowledgements, explicit_action: true
}, { now: '2026-07-27T00:00:00.000Z' });
assert.equal(consent.expires_at, '2026-08-26T00:00:00.000Z');
assert.equal(consent.all_scopes_granted_by_default, false);
assert.equal(consent.runtime_evidence_write_authorised, false);
assert.throws(() => consentModule.createExternalReaderConsent({
  ...consent, consent_id: 'invalid', resource_scopes: [], explicit_action: true
}), /explicit supported scopes/);
const access = consentModule.authorizeExternalReaderAccess(consent, {
  resource_scope: 'external_reader_chart', professional_id: 'pro_1'
}, { now: '2026-07-28T00:00:00.000Z' });
assert.equal(access.allowed, true);
assert.equal(access.runtime_evidence_write_authorised, false);
assert.throws(() => consentModule.authorizeExternalReaderAccess(consent, {
  resource_scope: 'reading', professional_id: 'pro_1'
}, { now: '2026-07-28T00:00:00.000Z' }), /outside consent scope/);
assert.throws(() => consentModule.authorizeExternalReaderAccess(consent, {
  resource_scope: 'external_reader_chart', professional_id: 'pro_1'
}, { now: '2026-08-26T00:00:00.000Z' }), /expired/);
const revoked = consentModule.revokeExternalReaderConsent(consent, {
  explicit_action: true, revocation_scopes: ['chart_access'],
  revoked_by: 'client_1', reason: 'Client choice'
}, { now: '2026-07-29T00:00:00.000Z' });
assert.equal(revoked.revocation.new_access_stopped, true);
assert.throws(() => consentModule.authorizeExternalReaderAccess(revoked, {
  resource_scope: 'external_reader_chart', professional_id: 'pro_1'
}, { now: '2026-07-29T00:00:01.000Z' }), /revoked/);
const event = eventModule.createExternalReaderAccessEvent({
  event_id: 'event_1', professional_id: 'pro_1', client_id: 'client_1',
  resource_type: 'external_reader_chart', access_purpose: 'Professional review',
  access_duration: 'thirty_days', consent_id: 'consent_1', service_id: 'service_1',
  reader_type: 'human_design', action: 'chart_viewed'
}, { now: '2026-07-28T00:00:00.000Z' });
assert.equal(event.audit_only, true);
assert.equal(event.contains_chart_content, false);
for (const scope of consentModule.EXTERNAL_READER_RESOURCE_SCOPES) assert.ok(page.includes(`value="${scope}"`));
for (const duration of consentModule.EXTERNAL_READER_CONSENT_DURATIONS) assert.ok(page.includes(`value="${duration}"`));
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) assert.equal(controller.includes(forbidden), false);
for (const key of ['title', 'resources', 'duration', 'ackEvidence', 'revokeTitle', 'footer']) {
  assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`));
}
console.log('✓ M4B-W4 Consent and Sharing passed: explicit resource scopes, duration, partial revocation, External Reader boundaries and payload-free access audit are aligned.');
