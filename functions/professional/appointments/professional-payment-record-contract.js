import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import { PAYMENT_STATUSES, REFUND_STATUSES } from './professional-appointment-constants.js';

function allowed(value, values, field) {
  const text = requiredText(value, field);
  if (!values.includes(text)) throw new TypeError(`Unsupported ${field}.`);
  return text;
}

function money(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new TypeError(`${field} must be a non-negative number.`);
  return number;
}

export function createProfessionalPaymentRecord(input = {}, options = {}) {
  const amount = money(input.amount, 'amount');
  const tax = money(input.tax || 0, 'tax');
  const discount = money(input.discount || 0, 'discount');
  if (discount > amount + tax) throw new TypeError('discount cannot exceed amount plus tax.');
  return Object.freeze({
    schema_version: 'm4b-w6.payment.1',
    payment_record_id: requiredText(input.payment_record_id, 'payment_record_id'),
    appointment_id: requiredText(input.appointment_id, 'appointment_id'),
    service: requiredText(input.service, 'service'),
    currency: requiredText(input.currency, 'currency').toUpperCase(),
    amount,
    tax,
    discount,
    total: amount + tax - discount,
    payment_status: allowed(input.payment_status || 'pending', PAYMENT_STATUSES, 'payment_status'),
    refund_status: allowed(input.refund_status || 'not_requested', REFUND_STATUSES, 'refund_status'),
    invoice_id: cleanText(input.invoice_id) || null,
    provider_reference: cleanText(input.provider_reference) || null,
    recorded_at: isoDate(options.now || input.recorded_at || new Date().toISOString(), 'recorded_at'),
    card_data_stored: false,
    payment_credentials_stored: false,
    runtime_memory_written: false
  });
}
