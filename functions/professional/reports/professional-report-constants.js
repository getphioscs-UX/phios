export const PROFESSIONAL_REPORT_CONTRACT_VERSION = 'phi-os.professional-report.v1';
export const PROFESSIONAL_REPORT_TYPES = Object.freeze([
  'runtime_report',
  'professional_readout',
  'navigation_plan',
  'follow_up_report',
  'human_design_foundation_report',
  'human_design_runtime_interpretation',
  'reality_specific_external_reader_report',
  'integrated_runtime_review'
]);
export const PROFESSIONAL_REPORT_STATUSES = Object.freeze([
  'draft', 'professional_review', 'client_review',
  'revised', 'final', 'superseded'
]);
export const PROFESSIONAL_REPORT_SOURCE_TYPES = Object.freeze([
  'observed_evidence', 'user_statement', 'system_extraction',
  'rule_inference', 'ai_interpretation', 'professional_interpretation',
  'external_reader_interpretation', 'unverified_correspondence',
  'unknown'
]);
export const PROFESSIONAL_REPORT_CONFIDENCE = Object.freeze([
  'low', 'moderate', 'high', 'not_assessed'
]);
export const PROFESSIONAL_REPORT_CORRESPONDENCE = Object.freeze([
  'not_applicable', 'possible', 'client_confirmed',
  'professionally_supported', 'conflicting_evidence',
  'no_confirmed_correspondence', 'insufficient_evidence'
]);
