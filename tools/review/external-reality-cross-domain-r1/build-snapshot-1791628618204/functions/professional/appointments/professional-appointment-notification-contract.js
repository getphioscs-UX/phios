import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import {
  FINANCIAL_APPOINTMENT_MATERIALS,
  FINANCIAL_APPOINTMENT_SERVICE_TYPES,
  FINANCIAL_MATERIAL_DELIVERY_BOUNDARY,
  REMINDER_TYPES
} from './professional-appointment-constants.js';

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

export function createFinancialAppointmentConfirmation(
  appointment,
  input = {},
  options = {}
) {
  if (
    !appointment?.appointment_id ||
    !FINANCIAL_APPOINTMENT_SERVICE_TYPES.includes(appointment.service_type)
  ) {
    throw new TypeError(
      'Financial confirmation requires a Financial Appointment.'
    );
  }
  if (
    input.email_attachments?.length ||
    input.reply_with_documents === true ||
    input.ordinary_email_upload === true
  ) {
    throw new TypeError(
      'Sensitive Financial materials cannot be requested through ordinary email.'
    );
  }
  const secureUploadReference = requiredText(
    input.secure_upload_reference,
    'secure_upload_reference'
  );
  const requestedMaterials = Object.freeze([
    ...new Set(input.requested_materials || FINANCIAL_APPOINTMENT_MATERIALS)
  ]);
  for (const material of requestedMaterials) {
    if (!FINANCIAL_APPOINTMENT_MATERIALS.includes(material)) {
      throw new TypeError('Unsupported Financial appointment material.');
    }
  }
  return Object.freeze({
    schema_version: 'phi-os.financial-appointment-confirmation.v1',
    notification_id: requiredText(input.notification_id, 'notification_id'),
    appointment_id: appointment.appointment_id,
    service_type: appointment.service_type,
    recipient_reference: requiredText(
      input.recipient_reference,
      'recipient_reference'
    ),
    subject: bilingual(input.subject, 'subject'),
    introduction: bilingual(input.introduction, 'introduction'),
    requested_materials: requestedMaterials,
    secure_upload: Object.freeze({
      upload_reference: secureUploadReference,
      upload_method: 'private_secure_portal',
      signed_access_required: true,
      access_expiry_required: true,
      malware_scan_required: true
    }),
    secure_upload_notice: bilingual(
      input.secure_upload_notice,
      'secure_upload_notice'
    ),
    professional_boundary: bilingual(
      input.professional_boundary,
      'professional_boundary'
    ),
    delivery_status: cleanText(input.delivery_status) || 'draft',
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    ),
    ordinary_email_sensitive_documents_allowed:
      FINANCIAL_MATERIAL_DELIVERY_BOUNDARY
        .ordinary_email_sensitive_documents_allowed,
    email_attachments_requested: false,
    sent_automatically: false,
    runtime_memory_written: false
  });
}
