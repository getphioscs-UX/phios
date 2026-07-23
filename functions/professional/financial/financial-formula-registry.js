export const FINANCIAL_FORMULA_REGISTRY_VERSION =
  'phi-os.financial-formula-registry.v1';

const formulas = [
  {
    id: 'liquidity_ratio',
    version: '1.0.0',
    inputs: ['liquid_assets_minor', 'monthly_expenses_minor'],
    unit: 'months',
    denominator: 'monthly_expenses_minor',
    calculate: value =>
      value.liquid_assets_minor / value.monthly_expenses_minor
  },
  {
    id: 'debt_to_income_ratio',
    version: '1.0.0',
    inputs: ['monthly_debt_repayments_minor', 'monthly_gross_income_minor'],
    unit: 'percent',
    denominator: 'monthly_gross_income_minor',
    calculate: value =>
      value.monthly_debt_repayments_minor /
      value.monthly_gross_income_minor * 100
  },
  {
    id: 'current_ratio',
    version: '1.0.0',
    inputs: ['liquid_assets_minor', 'current_liabilities_minor'],
    unit: 'ratio',
    denominator: 'current_liabilities_minor',
    calculate: value =>
      value.liquid_assets_minor / value.current_liabilities_minor
  },
  {
    id: 'leverage_ratio',
    version: '1.0.0',
    inputs: ['total_liabilities_minor', 'total_assets_minor'],
    unit: 'percent',
    denominator: 'total_assets_minor',
    calculate: value =>
      value.total_liabilities_minor / value.total_assets_minor * 100
  },
  {
    id: 'savings_ratio',
    version: '1.0.0',
    inputs: ['monthly_surplus_minor', 'monthly_net_income_minor'],
    unit: 'percent',
    denominator: 'monthly_net_income_minor',
    calculate: value =>
      value.monthly_surplus_minor / value.monthly_net_income_minor * 100
  },
  {
    id: 'net_worth',
    version: '1.0.0',
    inputs: ['total_assets_minor', 'total_liabilities_minor'],
    unit: 'currency_minor',
    calculate: value =>
      value.total_assets_minor - value.total_liabilities_minor
  },
  {
    id: 'cash_flow_surplus',
    version: '1.0.0',
    inputs: ['total_income_minor', 'total_expenses_minor'],
    unit: 'currency_minor',
    calculate: value =>
      value.total_income_minor - value.total_expenses_minor
  },
  {
    id: 'retirement_gap',
    version: '1.0.0',
    inputs: [
      'required_retirement_fund_minor',
      'existing_retirement_assets_minor'
    ],
    unit: 'currency_minor',
    calculate: value => Math.max(
      0,
      value.required_retirement_fund_minor -
        value.existing_retirement_assets_minor
    )
  },
  {
    id: 'education_gap',
    version: '1.0.0',
    inputs: [
      'projected_education_cost_minor',
      'existing_education_fund_minor'
    ],
    unit: 'currency_minor',
    calculate: value => Math.max(
      0,
      value.projected_education_cost_minor -
        value.existing_education_fund_minor
    )
  },
  {
    id: 'insurance_gap',
    version: '1.0.0',
    inputs: ['required_coverage_minor', 'existing_coverage_minor'],
    unit: 'currency_minor',
    calculate: value => Math.max(
      0,
      value.required_coverage_minor - value.existing_coverage_minor
    )
  }
];

export const FINANCIAL_FORMULAS = Object.freeze(
  formulas.map(formula => Object.freeze({
    id: formula.id,
    version: formula.version,
    inputs: Object.freeze([...formula.inputs]),
    unit: formula.unit,
    zero_denominator_policy: formula.denominator
      ? 'insufficient_input'
      : 'not_applicable',
    creates_recommendation: false
  }))
);

const executableById = new Map(formulas.map(formula => [formula.id, formula]));

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function uniqueReferences(values, field) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = requiredText(value, field);
    if (!result.includes(text)) result.push(text);
  }
  return result;
}

function rounded(value, unit) {
  if (unit === 'currency_minor') return Math.round(value);
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}

export function getFinancialFormula(id) {
  const formula = executableById.get(cleanText(id));
  if (!formula) return null;
  return FINANCIAL_FORMULAS.find(item => item.id === formula.id) || null;
}

export function calculateFinancialMetric(input = {}, options = {}) {
  const formula = executableById.get(cleanText(input.formula_id));
  if (!formula) throw new TypeError('A registered Financial formula is required.');
  const values = input.values || {};
  for (const key of formula.inputs) {
    if (typeof values[key] !== 'number' || !Number.isFinite(values[key])) {
      throw new TypeError(`Financial formula input is required: ${key}`);
    }
  }
  const inputSources = uniqueReferences(
    input.input_source_ids,
    'input_source_ids'
  );
  if (inputSources.length === 0) {
    throw new TypeError('Financial calculation requires evidence inputs.');
  }
  const assumptionIds = uniqueReferences(
    input.assumption_ids,
    'assumption_ids'
  );
  if (
    ['retirement_gap', 'education_gap', 'insurance_gap'].includes(formula.id) &&
    assumptionIds.length === 0
  ) {
    throw new TypeError(
      'Projected Financial calculation requires explicit assumptions.'
    );
  }
  const zeroDenominator = formula.denominator &&
    values[formula.denominator] === 0;
  const result = zeroDenominator ? null : rounded(
    formula.calculate(values),
    formula.unit
  );

  let professionalOverride = null;
  if (input.professional_override) {
    if (
      input.professional_override.explicit_action !== true ||
      !cleanText(input.professional_override.reason) ||
      !cleanText(input.professional_override.overridden_by) ||
      typeof input.professional_override.value_numeric !== 'number' ||
      !Number.isFinite(input.professional_override.value_numeric)
    ) {
      throw new TypeError(
        'Professional calculation override requires value, reason and author.'
      );
    }
    professionalOverride = Object.freeze({
      value_numeric: input.professional_override.value_numeric,
      reason: cleanText(input.professional_override.reason),
      overridden_by: cleanText(input.professional_override.overridden_by),
      explicit_action: true
    });
  }

  return Object.freeze({
    contract: FINANCIAL_FORMULA_REGISTRY_VERSION,
    calculation_id: requiredText(input.calculation_id, 'calculation_id'),
    household_id: requiredText(input.household_id, 'household_id'),
    formula_id: formula.id,
    formula_version: formula.version,
    value_numeric: result,
    unit: formula.unit,
    calculation_status: zeroDenominator
      ? 'insufficient_input'
      : 'calculated',
    input_date: isoDate(input.input_date, 'input_date'),
    input_source_ids: Object.freeze(inputSources),
    assumption_ids: Object.freeze(assumptionIds),
    calculated_at: isoDate(
      options.now || input.calculated_at || new Date().toISOString(),
      'calculated_at'
    ),
    review_status: professionalOverride ? 'overridden' : 'pending',
    professional_override: professionalOverride,
    creates_recommendation: false
  });
}

export default FINANCIAL_FORMULAS;
