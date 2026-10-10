export const PROFESSIONAL_REPORT_CONTRACT_VERSION = 'phi-os.professional-report.v1';
export const PROFESSIONAL_REPORT_TYPES = Object.freeze([
  'runtime_report',
  'professional_readout',
  'navigation_plan',
  'follow_up_report',
  'human_design_foundation_report',
  'human_design_runtime_interpretation',
  'reality_specific_external_reader_report',
  'integrated_runtime_review',
  'financial_reality_snapshot',
  'financial_stamina_analysis',
  'financial_navigation_plan',
  'financial_follow_up_report',
  'annual_financial_runtime_review',
  'integrated_runtime_financial_review'
]);
export const PROFESSIONAL_REPORT_STATUSES = Object.freeze([
  'draft', 'professional_review', 'client_review',
  'revised', 'final', 'superseded'
]);
export const PROFESSIONAL_REPORT_SOURCE_TYPES = Object.freeze([
  'observed_evidence', 'user_statement', 'system_extraction',
  'rule_inference', 'ai_interpretation', 'professional_interpretation',
  'external_reader_interpretation', 'unverified_correspondence',
  'unknown',
  'client_declared',
  'document_supported',
  'professionally_verified',
  'calculated',
  'estimated',
  'projected',
  'assumption',
  'professional_recommendation',
  'client_decision',
  'implementation_result'
]);

export const FINANCIAL_REPORT_REDACTED_FIELDS = Object.freeze([
  'full_identity_number', 'full_bank_account', 'full_policy_number',
  'full_home_address', 'unauthorised_household_member_data'
]);
export const FINANCIAL_REPORT_TYPES = Object.freeze([
  'financial_reality_snapshot',
  'financial_stamina_analysis',
  'financial_navigation_plan',
  'financial_follow_up_report',
  'annual_financial_runtime_review',
  'integrated_runtime_financial_review'
]);
export const FINANCIAL_REPORT_SOURCE_TYPES = Object.freeze([
  'client_declared',
  'document_supported',
  'professionally_verified',
  'calculated',
  'estimated',
  'projected',
  'assumption',
  'professional_recommendation',
  'client_decision',
  'implementation_result'
]);
export const PROFESSIONAL_REPORT_CONFIDENCE = Object.freeze([
  'low', 'moderate', 'high', 'not_assessed'
]);
export const PROFESSIONAL_REPORT_CORRESPONDENCE = Object.freeze([
  'not_applicable', 'possible', 'client_confirmed',
  'professionally_supported', 'conflicting_evidence',
  'no_confirmed_correspondence', 'insufficient_evidence'
]);
