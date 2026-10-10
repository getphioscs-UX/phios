export const FINANCIAL_CALCULATION_CONTRACT_VERSION =
  'phi-os.financial-calculation.v2';

export const FINANCIAL_METRICS = Object.freeze([
  'total_income', 'total_expenses', 'monthly_surplus_deficit',
  'savings_ratio', 'liquid_assets', 'current_liabilities', 'total_assets',
  'total_liabilities', 'net_worth', 'debt_to_income_ratio',
  'current_ratio', 'liquidity_months', 'leverage_ratio',
  'insurance_coverage_gap', 'retirement_funding_gap',
  'education_funding_gap'
]);

const sum = values => values.reduce((total, value) => total + (Number(value) || 0), 0);
const ratio = (numerator, denominator) => denominator ? numerator / denominator : null;
const iso = (value, field) => {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
};
const references = values => Object.freeze(
  [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))]
);

function createMetricRecord(metric, value, context) {
  const inputEvidenceIds = references(
    context.metric_input_evidence?.[metric] ||
    context.input_evidence_ids ||
    context.input_sources
  );
  if (!inputEvidenceIds.length) {
    throw new TypeError(`${metric} requires input evidence lineage.`);
  }
  return Object.freeze({
    metric,
    value,
    formula_version: String(context.formula_version || 'financial-formulas.v1'),
    input_date: iso(context.input_date, 'input_date'),
    input_source: references(context.input_sources),
    input_evidence_ids: inputEvidenceIds,
    assumptions: references(context.metric_assumptions?.[metric] || context.assumptions),
    calculated_at: iso(context.calculated_at || new Date(), 'calculated_at'),
    review_status: context.metric_review_status?.[metric] ||
      context.review_status || 'professional_review_required',
    professional_override: context.professional_overrides?.[metric] ||
      context.professional_override || null,
    evidence_class: 'calculated',
    creates_recommendation: false
  });
}

export function calculateFinancialPosition(input = {}, context = {}) {
  const calculationId = String(context.calculation_id || '').trim();
  if (!calculationId) throw new TypeError('calculation_id is required.');
  const totalIncome = sum(input.income || []);
  const totalExpenses = sum(input.expenses || []);
  const totalAssets = sum(input.assets || []);
  const liquidAssets = sum(input.liquid_assets || []);
  const totalLiabilities = sum(input.liabilities || []);
  const currentLiabilities = sum(input.current_liabilities || []);
  const surplus = totalIncome - totalExpenses;
  const values = Object.freeze({
    total_income: totalIncome,
    total_expenses: totalExpenses,
    monthly_surplus_deficit: surplus,
    savings_ratio: ratio(surplus, totalIncome),
    liquid_assets: liquidAssets,
    current_liabilities: currentLiabilities,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    net_worth: totalAssets - totalLiabilities,
    debt_to_income_ratio: ratio(Number(input.monthly_debt_repayment) || 0, totalIncome),
    current_ratio: ratio(liquidAssets, currentLiabilities),
    liquidity_months: ratio(liquidAssets, totalExpenses),
    leverage_ratio: ratio(totalLiabilities, totalAssets),
    insurance_coverage_gap: Math.max(0, (Number(input.insurance_need) || 0) - (Number(input.insurance_cover) || 0)),
    retirement_funding_gap: Math.max(0, (Number(input.retirement_target) || 0) - (Number(input.retirement_assets) || 0)),
    education_funding_gap: Math.max(0, (Number(input.education_target) || 0) - (Number(input.education_fund) || 0))
  });
  const metricRecords = Object.freeze(Object.fromEntries(
    FINANCIAL_METRICS.map(metric => [
      metric, createMetricRecord(metric, values[metric], context)
    ])
  ));
  return Object.freeze({
    schema_version: FINANCIAL_CALCULATION_CONTRACT_VERSION,
    calculation_id: calculationId,
    intake_id: String(context.intake_id || '').trim() || null,
    intake_data_version: Number(context.intake_data_version || 1),
    formula_version: String(context.formula_version || 'financial-formulas.v1'),
    input_date: iso(context.input_date, 'input_date'),
    input_sources: references(context.input_sources),
    input_evidence_ids: references(context.input_evidence_ids),
    assumptions: references(context.assumptions),
    calculated_at: iso(context.calculated_at || new Date(), 'calculated_at'),
    review_status: context.review_status || 'professional_review_required',
    professional_override: context.professional_override || null,
    values,
    metrics: metricRecords,
    projected_outcome_guaranteed: false,
    required_product_action: null,
    recommendation_created: false,
    runtime_evidence_written: false,
    runtime_reading_modified: false
  });
}

export default Object.freeze({ calculateFinancialPosition });
