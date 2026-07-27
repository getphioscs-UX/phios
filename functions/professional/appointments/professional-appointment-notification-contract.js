import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import { REMINDER_TYPES } from './professional-appointment-constants.js';

const CONFIRMATION_FIELDS = Object.freeze([
  'service_purchased', 'appointment_time', 'required_materials', 'consent_link',
  'upload_link', 'estimated_delivery', 'rescheduling_policy', 'professional_boundary'
]);

function bilingual(value, field) {
  return Object.freeze({
    en: requiredText(value?.en, `${field}.en`),
    zh_Hans: requiredText(value?.zh_Hans, `${field}.zh_Hans`)
  });
}

export function createAppointmentConfirmation(input = {}, options = {}) {
  const content = {};
  for (const field of CONFIRMATION_FIELDS) content[field] = bilingual(input.content?.[field], field);
  return Object.freeze({
    schema_version: 'm4b-w6.confirmation.1',
    notification_id: requiredText(input.notification_id, 'notification_id'),
    appointment_id: requiredText(input.appointment_id, 'appointment_id'),
    recipient_reference: requiredText(input.recipient_reference, 'recipient_reference'),
    content: Object.freeze(content),
    delivery_status: cleanText(input.delivery_status) || 'draft',
    created_at: isoDate(options.now || input.created_at || new Date().toISOString(), 'created_at'),
    sent_automatically: false
  });
}

export function createAppointmentReminder(input = {}, options = {}) {
  const reminderType = requiredText(input.reminder_type, 'reminder_type');
  if (!REMINDER_TYPES.includes(reminderType)) throw new TypeError('Unsupported reminder_type.');
  return Object.freeze({
    schema_version: 'm4b-w6.reminder.1',
    reminder_id: requiredText(input.reminder_id, 'reminder_id'),
    appointment_id: requiredText(input.appointment_id, 'appointment_id'),
    reminder_type: reminderType,
    scheduled_for: isoDate(input.scheduled_for, 'scheduled_for'),
    message: bilingual(input.message, 'message'),
    delivery_status: cleanText(input.delivery_status) || 'draft',
    created_at: isoDate(options.now || input.created_at || new Date().toISOString(), 'created_at'),
    sent_automatically: false
  });
}
