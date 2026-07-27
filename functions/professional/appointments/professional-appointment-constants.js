export const PROFESSIONAL_APPOINTMENT_CONTRACT_VERSION = 'm4b-w6.1';

export const APPOINTMENT_SERVICE_TYPES = Object.freeze([
  'professional_runtime_consultation',
  'human_design_consultation',
  'runtime_human_design_consultation',
  'navigation_follow_up',
  'long_term_review',
  'integrated_review'
]);

export const APPOINTMENT_STATUSES = Object.freeze([
  'requested', 'pending_payment', 'confirmed', 'reschedule_requested',
  'cancelled', 'completed', 'no_show'
]);

export const PAYMENT_STATUSES = Object.freeze([
  'not_required', 'pending', 'authorised', 'paid', 'failed', 'cancelled'
]);

export const REFUND_STATUSES = Object.freeze([
  'not_requested', 'requested', 'processing', 'partially_refunded', 'refunded', 'declined'
]);

export const REMINDER_TYPES = Object.freeze([
  'appointment', 'missing_intake', 'missing_consent', 'missing_chart',
  'report_ready', 'follow_up'
]);

export const PRE_APPOINTMENT_CHECKS = Object.freeze([
  'consent_completed',
  'birth_data_complete',
  'birth_time_reliability_recorded',
  'chart_uploaded',
  'chart_verified',
  'reality_question_submitted',
  'report_type_confirmed',
  'professional_assigned'
]);
