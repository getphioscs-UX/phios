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

export const FINANCIAL_RECALCULATION_TRIGGERS = Object.freeze({
  income: Object.freeze([
    'total_income', 'monthly_surplus_deficit', 'savings_ratio',
    'debt_to_income_ratio', 'liquidity_months'
  ]),
  liabilities: Object.freeze([
    'current_liabilities', 'total_liabilities', 'net_worth',
    'debt_to_income_ratio', 'current_ratio', 'leverage_ratio'
  ]),
  properties: Object.freeze([
    'total_assets', 'total_liabilities', 'net_worth', 'leverage_ratio',
    'property_exposure'
  ]),
  insurance: Object.freeze([
    'insurance_coverage_gap', 'protection_risk'
  ])
});

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveVersion(value, field, fallback) {
  const version = Number(value ?? fallback);
  if (!Number.isInteger(version) || version < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return version;
}

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
  const domain = cleanText(input.field_path).split('.')[0];
  const impactedMetrics = FINANCIAL_RECALCULATION_TRIGGERS[domain] || [];
  const previousVersion = positiveVersion(
    input.previous_data_version,
    'previous_data_version',
    1
  );
  const revisedVersion = positiveVersion(
    input.revised_data_version,
    'revised_data_version',
    previousVersion + 1
  );
  if (revisedVersion <= previousVersion) {
    throw new TypeError(
      'revised_data_version must be newer than previous_data_version.'
    );
  }
  return Object.freeze({
    schema_version: 'phi-os.financial-revision.v1',
    ...input,
    changed_at: new Date(input.changed_at).toISOString(),
    data_date: new Date(input.data_date).toISOString(),
    previous_revision_id: cleanText(input.previous_revision_id) || null,
    previous_data_version: previousVersion,
    revised_data_version: revisedVersion,
    impacted_metrics: Object.freeze([...impactedMetrics]),
    previous_value_preserved: true,
    silent_overwrite: false,
    recalculation_required:
      input.calculation_impact !== 'none' || impactedMetrics.length > 0,
    recommendation_review_required:
      input.recommendation_impact !== 'none',
    downstream_calculations_stale: impactedMetrics.length > 0,
    downstream_recommendations_stale:
      input.recommendation_impact !== 'none',
    runtime_evidence_written: false,
    runtime_reading_modified: false
  });
}

export function reviseFinancialRevision(previous, input = {}) {
  if (!previous?.revision_id) {
    throw new TypeError('A previous Financial Revision is required.');
  }
  return createFinancialRevision({
    ...input,
    previous_revision_id: previous.revision_id,
    previous_data_version: previous.revised_data_version,
    revised_data_version: Number(previous.revised_data_version) + 1,
    previous_value: input.previous_value ?? previous.updated_value
  });
}

export function buildFinancialRecalculationRequest(revision, input = {}) {
  if (!revision?.recalculation_required) {
    throw new TypeError(
      'A recalculation request requires a material Financial Revision.'
    );
  }
  return Object.freeze({
    request_id: cleanText(input.request_id) ||
      `recalculate_${revision.revision_id}`,
    revision_id: revision.revision_id,
    source_document: revision.source_document,
    data_date: revision.data_date,
    from_data_version: revision.previous_data_version,
    to_data_version: revision.revised_data_version,
    metrics: Object.freeze([...revision.impacted_metrics]),
    status: 'pending_professional_review',
    automatic_recommendation_created: false,
    old_calculation_overwritten: false
  });
}

export default Object.freeze({
  createFinancialRevision,
  reviseFinancialRevision,
  buildFinancialRecalculationRequest
});
