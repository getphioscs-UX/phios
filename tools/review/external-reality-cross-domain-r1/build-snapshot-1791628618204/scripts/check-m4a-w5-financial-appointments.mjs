import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  FINANCIAL_APPOINTMENT_SERVICE_TYPES,
  FINANCIAL_PRE_APPOINTMENT_CHECKS,
  FINANCIAL_APPOINTMENT_MATERIALS,
  FINANCIAL_MATERIAL_DELIVERY_BOUNDARY
} from '../functions/professional/appointments/professional-appointment-constants.js';
import {
  createProfessionalAppointment
} from '../functions/professional/appointments/professional-appointment-contract.js';
import {
  createFinancialAppointmentConfirmation
} from '../functions/professional/appointments/professional-appointment-notification-contract.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const registry = JSON.parse(await read(
  'content/registry/m4a-w5-financial-appointments.json'
));
const controller = await read('assets/js/pages/professional-appointments.js');
const en = await read('assets/js/locales/en/professional.js');
const zh = await read('assets/js/locales/zh-Hans/professional.js');

assert.equal(
  registry.baseline,
  '7670afdf34583bc940bae4237edfdbd27c0589d4'
);
assert.deepEqual(
  registry.financial_appointment_types,
  FINANCIAL_APPOINTMENT_SERVICE_TYPES
);
assert.deepEqual(
  registry.financial_pre_appointment_checks,
  FINANCIAL_PRE_APPOINTMENT_CHECKS
);
assert.deepEqual(
  registry.requested_materials,
  FINANCIAL_APPOINTMENT_MATERIALS
);
assert.equal(FINANCIAL_APPOINTMENT_SERVICE_TYPES.length, 11);
assert.equal(FINANCIAL_PRE_APPOINTMENT_CHECKS.length, 13);
assert.equal(FINANCIAL_APPOINTMENT_MATERIALS.length, 10);
assert.equal(
  FINANCIAL_MATERIAL_DELIVERY_BOUNDARY
    .ordinary_email_sensitive_documents_allowed,
  false
);

const checks = Object.fromEntries(
  FINANCIAL_PRE_APPOINTMENT_CHECKS.map(key => [key, true])
);
const appointment = createProfessionalAppointment({
  appointment_id: 'financial_appointment_1',
  client_id: 'client_1',
  professional_id: 'professional_1',
  service_type: 'financial_stamina_review',
  status: 'confirmed',
  scheduled_start: '2026-08-01T02:00:00.000Z',
  scheduled_end: '2026-08-01T03:00:00.000Z',
  timezone: 'Asia/Kuala_Lumpur',
  meeting_method: 'video',
  consent_reference: 'financial_consent_1',
  pre_appointment_checks: checks
}, { now: '2026-07-27T00:00:00.000Z' });
assert.equal(appointment.pre_appointment_check_contract, 'financial');
assert.deepEqual(
  Object.keys(appointment.pre_appointment_checks),
  FINANCIAL_PRE_APPOINTMENT_CHECKS
);
assert.equal(appointment.ready_for_appointment, true);
assert.deepEqual(appointment.incomplete_checks, []);
assert.equal('birth_data_complete' in appointment.pre_appointment_checks, false);
assert.equal('chart_uploaded' in appointment.pre_appointment_checks, false);

const incomplete = createProfessionalAppointment({
  ...appointment,
  appointment_id: 'financial_appointment_incomplete',
  pre_appointment_checks: {
    ...checks,
    income_data_complete: false,
    missing_evidence_identified: false
  }
});
assert.equal(incomplete.ready_for_appointment, false);
assert.deepEqual(
  incomplete.incomplete_checks,
  ['income_data_complete', 'missing_evidence_identified']
);

const bilingual = (enValue, zhValue) => ({
  en: enValue,
  zh_Hans: zhValue
});
const confirmationInput = {
  notification_id: 'financial_confirmation_1',
  recipient_reference: 'client_1',
  subject: bilingual(
    'Prepare for your Financial Stamina Review',
    '准备财务承受力审阅'
  ),
  introduction: bilingual(
    'Please prepare the listed information before the appointment.',
    '请在预约前准备以下资料。'
  ),
  requested_materials: FINANCIAL_APPOINTMENT_MATERIALS,
  secure_upload_reference: 'secure_upload_session_1',
  secure_upload_notice: bilingual(
    'Use the secure portal. Do not reply with sensitive files.',
    '请使用安全上传入口，不要通过普通邮件回复敏感文件。'
  ),
  professional_boundary: bilingual(
    'Preparation does not create a Financial recommendation.',
    '准备资料不会自动形成财务建议。'
  )
};
const confirmation = createFinancialAppointmentConfirmation(
  appointment,
  confirmationInput,
  { now: '2026-07-27T00:00:00.000Z' }
);
assert.deepEqual(
  confirmation.requested_materials,
  FINANCIAL_APPOINTMENT_MATERIALS
);
assert.equal(
  confirmation.secure_upload.upload_method,
  'private_secure_portal'
);
assert.equal(confirmation.secure_upload.signed_access_required, true);
assert.equal(confirmation.secure_upload.access_expiry_required, true);
assert.equal(confirmation.secure_upload.malware_scan_required, true);
assert.equal(
  confirmation.ordinary_email_sensitive_documents_allowed,
  false
);
assert.equal(confirmation.email_attachments_requested, false);
assert.equal(confirmation.sent_automatically, false);
assert.equal(confirmation.runtime_memory_written, false);

for (const unsafe of [
  { email_attachments: ['bank.pdf'] },
  { reply_with_documents: true },
  { ordinary_email_upload: true }
]) {
  assert.throws(() => createFinancialAppointmentConfirmation(
    appointment,
    { ...confirmationInput, ...unsafe }
  ), /cannot be requested through ordinary email/);
}
assert.throws(() => createFinancialAppointmentConfirmation(
  appointment,
  { ...confirmationInput, secure_upload_reference: '' }
), /secure_upload_reference/);

const runtimeAppointment = createProfessionalAppointment({
  appointment_id: 'runtime_appointment',
  client_id: 'client_1',
  service_type: 'professional_runtime_consultation',
  scheduled_start: '2026-08-01T02:00:00.000Z',
  scheduled_end: '2026-08-01T03:00:00.000Z',
  timezone: 'Asia/Kuala_Lumpur',
  meeting_method: 'video',
  pre_appointment_checks: {}
});
assert.equal(
  runtimeAppointment.pre_appointment_check_contract,
  'external_reader_or_runtime'
);
assert.equal(
  'income_data_complete' in runtimeAppointment.pre_appointment_checks,
  false
);

for (const service of FINANCIAL_APPOINTMENT_SERVICE_TYPES) {
  assert.ok(en.includes(`${service}:`), `English service missing: ${service}`);
  assert.ok(zh.includes(`${service}:`), `Chinese service missing: ${service}`);
}
for (const check of FINANCIAL_PRE_APPOINTMENT_CHECKS) {
  assert.ok(en.includes(`${check}:`), `English check missing: ${check}`);
  assert.ok(zh.includes(`${check}:`), `Chinese check missing: ${check}`);
}
for (const material of FINANCIAL_APPOINTMENT_MATERIALS) {
  assert.ok(en.includes(`${material}:`), `English material missing: ${material}`);
  assert.ok(zh.includes(`${material}:`), `Chinese material missing: ${material}`);
}
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) {
  assert.equal(controller.includes(forbidden), false);
}
assert.ok(controller.includes('financialMaterialsTitle'));
assert.ok(controller.includes('secure_upload_notice'));
for (const value of Object.values(registry.boundaries)) {
  assert.equal(value, false);
}

console.log('✓ M4A-W5 Financial Appointment passed: 11 service types, isolated 13-point readiness, bilingual preparation and secure-upload-only confirmation are aligned.');
