export const FINANCIAL_WORKSPACE_CONTRACT_VERSION =
  'phi-os.financial-workspace-extension.v1';

export const FINANCIAL_WORKSPACE_SECTIONS = Object.freeze([
  'overview', 'objectives', 'income', 'expenses', 'assets', 'liabilities',
  'cash_flow', 'net_worth', 'insurance', 'investments', 'properties', 'tax',
  'retirement', 'education', 'estate', 'ratios', 'risks', 'recommendations',
  'documents'
]);

export const FINANCIAL_NOTE_TYPES = Object.freeze([
  'financial_fact_note', 'document_verification_note', 'assumption_note',
  'calculation_note', 'risk_observation', 'product_neutral_recommendation',
  'regulated_advice_note', 'client_decision', 'implementation_note',
  'review_note'
]);

export const FINANCIAL_QUEUE_TYPES = Object.freeze([
  'financial_intake_received', 'bank_records_pending',
  'income_evidence_pending', 'expense_evidence_pending',
  'insurance_documents_pending', 'investment_statements_pending',
  'property_documents_pending', 'liability_details_pending',
  'calculation_review_required', 'financial_recommendation_review',
  'client_clarification_required', 'annual_review_due'
]);

export const FINANCIAL_NAVIGATION_DOMAINS = Object.freeze([
  'cash_flow_stabilisation', 'emergency_reserve', 'debt_restructuring',
  'expense_adjustment', 'insurance_gap_review',
  'investment_reallocation_review', 'property_exposure_review',
  'tax_planning_review', 'retirement_funding', 'education_funding',
  'estate_preparation', 'business_continuity'
]);

export const FINANCIAL_TIMELINE_EVENTS = Object.freeze([
  'financial_intake_started', 'financial_data_submitted',
  'document_uploaded', 'document_verified', 'financial_position_calculated',
  'risk_flag_raised', 'professional_review_completed',
  'consultation_completed', 'navigation_plan_delivered',
  'client_decision_recorded', 'implementation_started',
  'implementation_confirmed', 'financial_data_updated',
  'scheduled_review_completed'
]);

export function createFinancialRevision(input = {}) {
  const required = [
    'revision_id', 'data_date', 'field_path', 'previous_value',
    'updated_value', 'source_document', 'changed_by', 'changed_at', 'reason',
    'calculation_impact', 'recommendation_impact'
  ];
  for (const field of required) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      throw new TypeError(`${field} is required.`);
    }
  }
  return Object.freeze({
    schema_version: 'phi-os.financial-revision.v1',
    ...input,
    changed_at: new Date(input.changed_at).toISOString(),
    data_date: new Date(input.data_date).toISOString(),
    previous_value_preserved: true,
    silent_overwrite: false,
    recalculation_required: input.calculation_impact !== 'none'
  });
}

export default Object.freeze({ createFinancialRevision });
