export const FINANCIAL_CALCULATION_CONTRACT_VERSION =
  'phi-os.financial-calculation.v1';

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

export function calculateFinancialPosition(input = {}, context = {}) {
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
  return Object.freeze({
    schema_version: FINANCIAL_CALCULATION_CONTRACT_VERSION,
    calculation_id: String(context.calculation_id || '').trim(),
    formula_version: String(context.formula_version || 'financial-formulas.v1'),
    input_date: new Date(context.input_date).toISOString(),
    input_sources: Object.freeze([...(context.input_sources || [])]),
    assumptions: Object.freeze([...(context.assumptions || [])]),
    calculated_at: new Date(context.calculated_at || new Date()).toISOString(),
    review_status: context.review_status || 'professional_review_required',
    professional_override: context.professional_override || null,
    values,
    projected_outcome_guaranteed: false,
    required_product_action: null,
    runtime_reading_modified: false
  });
}

export default Object.freeze({ calculateFinancialPosition });
