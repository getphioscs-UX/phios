export const PROFESSIONAL_APPOINTMENT_CONTRACT_VERSION = 'm4b-w6.1';

export const APPOINTMENT_SERVICE_TYPES = Object.freeze([
  'professional_runtime_consultation',
  'human_design_consultation',
  'runtime_human_design_consultation',
  'navigation_follow_up',
  'long_term_review',
  'integrated_review',
  'financial_discovery_meeting',
  'financial_stamina_review',
  'cash_flow_consultation',
  'insurance_review',
  'investment_review',
  'property_exposure_review',
  'retirement_planning',
  'education_planning',
  'estate_planning_preparation',
  'financial_navigation_follow_up',
  'annual_review'
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
  'professional_assigned',
  'household_scope_confirmed',
  'objectives_submitted',
  'income_data_complete',
  'expense_data_complete',
  'assets_submitted',
  'liabilities_submitted',
  'insurance_documents_submitted',
  'investment_statements_submitted',
  'property_information_submitted',
  'tax_information_submitted',
  'missing_evidence_identified'
]);

export const FINANCIAL_APPOINTMENT_MATERIALS = Object.freeze([
  'recent_income_evidence', 'recent_bank_or_cash_balance',
  'loan_statement', 'insurance_policy_summary', 'investment_statement',
  'property_and_loan_information', 'tax_information',
  'retirement_account_information', 'education_planning_information',
  'will_or_nomination_overview'
]);

export const FINANCIAL_MATERIAL_DELIVERY_BOUNDARY = Object.freeze({
  secure_upload_required: true,
  ordinary_email_sensitive_documents_allowed: false
});
