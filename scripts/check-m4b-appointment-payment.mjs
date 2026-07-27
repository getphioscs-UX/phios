import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const load = file => import(`${pathToFileURL(path.join(root, file)).href}?v=${Date.now()}`);

const [page, controller, css, workspace, en, zh, constants, appointments, payments, notifications, registry] = await Promise.all([
  read('professional-appointments.html'), read('assets/js/pages/professional-appointments.js'),
  read('assets/css/professional-workspace.css'), read('professional-workspace.html'),
  read('assets/js/locales/en/professional.js'), read('assets/js/locales/zh-Hans/professional.js'),
  load('functions/professional/appointments/professional-appointment-constants.js'),
  load('functions/professional/appointments/professional-appointment-contract.js'),
  load('functions/professional/appointments/professional-payment-record-contract.js'),
  load('functions/professional/appointments/professional-appointment-notification-contract.js'),
  JSON.parse(await read('content/registry/m4b-appointment-payment.json'))
]);

assert.ok(constants.APPOINTMENT_SERVICE_TYPES.length >= 6);
for (const type of [
  'professional_runtime_consultation', 'human_design_consultation',
  'runtime_human_design_consultation', 'navigation_follow_up',
  'long_term_review', 'integrated_review'
]) assert.ok(constants.APPOINTMENT_SERVICE_TYPES.includes(type));
assert.equal(constants.REMINDER_TYPES.length, 6);
assert.ok(constants.PRE_APPOINTMENT_CHECKS.length >= 8);
const checks = Object.fromEntries(constants.PRE_APPOINTMENT_CHECKS.map(key => [key, true]));
const appointment = appointments.createProfessionalAppointment({
  appointment_id: 'appointment_1', client_id: 'client_1', professional_id: 'professional_1',
  service_type: 'runtime_human_design_consultation', status: 'confirmed',
  scheduled_start: '2026-08-01T02:00:00.000Z', scheduled_end: '2026-08-01T03:00:00.000Z',
  timezone: 'Asia/Kuala_Lumpur', meeting_method: 'video', consent_reference: 'consent_1',
  payment_record_id: 'payment_1', pre_appointment_checks: checks
}, { now: '2026-07-27T00:00:00.000Z' });
assert.equal(appointment.ready_for_appointment, true);
assert.deepEqual(appointment.incomplete_checks, []);
assert.equal(appointment.runtime_reading_modified, false);
assert.equal(appointment.runtime_evidence_modified, false);
assert.equal(appointment.runtime_memory_written, false);
assert.equal(appointment.external_reader_interpretation_generated, false);

const payment = payments.createProfessionalPaymentRecord({
  payment_record_id: 'payment_1', appointment_id: 'appointment_1', service: 'Consultation',
  currency: 'myr', amount: 300, tax: 18, discount: 20, payment_status: 'paid',
  refund_status: 'not_requested', invoice_id: 'invoice_1'
}, { now: '2026-07-27T00:00:00.000Z' });
assert.equal(payment.total, 298);
assert.equal(payment.card_data_stored, false);
assert.equal(payment.payment_credentials_stored, false);
assert.throws(() => payments.createProfessionalPaymentRecord({
  payment_record_id: 'x', appointment_id: 'a', service: 's', currency: 'MYR',
  amount: 10, tax: 0, discount: 11
}), /discount/);

const bilingual = { en: 'Text', zh_Hans: '文字' };
const confirmation = notifications.createAppointmentConfirmation({
  notification_id: 'confirmation_1', appointment_id: 'appointment_1', recipient_reference: 'client_1',
  content: {
    service_purchased: bilingual, appointment_time: bilingual, required_materials: bilingual,
    consent_link: bilingual, upload_link: bilingual, estimated_delivery: bilingual,
    rescheduling_policy: bilingual, professional_boundary: bilingual
  }
}, { now: '2026-07-27T00:00:00.000Z' });
assert.equal(Object.keys(confirmation.content).length, 8);
assert.equal(confirmation.sent_automatically, false);
for (const reminderType of constants.REMINDER_TYPES) {
  const reminder = notifications.createAppointmentReminder({
    reminder_id: `reminder_${reminderType}`, appointment_id: 'appointment_1',
    reminder_type: reminderType, scheduled_for: '2026-07-31T02:00:00.000Z', message: bilingual
  }, { now: '2026-07-27T00:00:00.000Z' });
  assert.equal(reminder.sent_automatically, false);
}

for (const id of ['professionalAppointment','appointmentOverview','appointmentPrecheck','appointmentPayment','appointmentNotifications']) assert.ok(page.includes(id));
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/', 'card_number', 'cvv']) assert.equal(controller.includes(forbidden), false);
assert.ok(workspace.includes('/professional-appointments'));
assert.ok(css.includes('.appointment-check-list'));
assert.ok(css.includes('@media (max-width: 768px)'));
assert.equal(registry.capabilities.paymentGateway, false);
assert.equal(registry.capabilities.automaticEmail, false);
for (const key of ['navTitle','precheck','paymentStatus','refundStatus','boundary']) {
  assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`));
}
console.log('✓ M4B-W6 Appointment and Payment passed: original and additive financial services, bounded payment records, bilingual confirmation/reminders and readiness checks are aligned.');
console.log('  No gateway charge, automatic email, card storage, Runtime mutation or External Reader interpretation is performed.');
