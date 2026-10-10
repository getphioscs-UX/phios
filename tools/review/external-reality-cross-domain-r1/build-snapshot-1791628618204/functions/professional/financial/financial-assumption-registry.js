export const FINANCIAL_ASSUMPTION_REGISTRY_VERSION =
  'phi-os.financial-assumption-registry.v1';

const definitions = [
  ['inflation_rate', 'percent_per_year'],
  ['investment_return', 'percent_per_year'],
  ['income_growth', 'percent_per_year'],
  ['expense_growth', 'percent_per_year'],
  ['property_growth', 'percent_per_year'],
  ['retirement_age', 'age_years'],
  ['life_expectancy', 'age_years'],
  ['education_inflation', 'percent_per_year'],
  ['insurance_cost_growth', 'percent_per_year'],
  ['exchange_rate', 'currency_pair_rate']
];

export const FINANCIAL_ASSUMPTION_TYPES = Object.freeze(
  definitions.map(([id, unit]) => Object.freeze({
    id,
    unit,
    numeric_default: null,
    guaranteed_outcome: false
  }))
);

const byId = new Map(
  FINANCIAL_ASSUMPTION_TYPES.map(assumption => [
    assumption.id,
    assumption
  ])
);

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

export function getFinancialAssumptionType(id) {
  return byId.get(cleanText(id)) || null;
}

export function createFinancialAssumption(input = {}, options = {}) {
  const type = getFinancialAssumptionType(input.assumption_type);
  if (!type) throw new TypeError('A supported Financial assumption is required.');
  if (
    typeof input.value_numeric !== 'number' ||
    !Number.isFinite(input.value_numeric)
  ) {
    throw new TypeError('Financial assumption value must be finite.');
  }
  if (cleanText(input.unit) !== type.unit) {
    throw new TypeError('Financial assumption unit does not match its type.');
  }
  const effectiveAt = isoDate(input.effective_at, 'effective_at');
  const reviewAt = isoDate(input.review_at, 'review_at');
  if (reviewAt <= effectiveAt) {
    throw new TypeError('Financial assumption review must follow its effective date.');
  }

  return Object.freeze({
    contract: FINANCIAL_ASSUMPTION_REGISTRY_VERSION,
    assumption_id: requiredText(input.assumption_id, 'assumption_id'),
    assumption_type: type.id,
    version: requiredText(input.version, 'version'),
    value_numeric: input.value_numeric,
    unit: type.unit,
    currency_pair: cleanText(input.currency_pair),
    source: requiredText(input.source, 'source'),
    jurisdiction: requiredText(input.jurisdiction, 'jurisdiction'),
    effective_at: effectiveAt,
    review_at: reviewAt,
    created_by: requiredText(input.created_by, 'created_by'),
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    ),
    review_status: cleanText(input.review_status) || 'pending',
    guaranteed_outcome: false,
    global_default: false
  });
}

export function assertReportAssumptions(report = {}, assumptions = []) {
  const ids = new Set(
    assumptions.map(item => cleanText(item.assumption_id)).filter(Boolean)
  );
  const used = Array.isArray(report.assumption_ids)
    ? report.assumption_ids.map(cleanText).filter(Boolean)
    : [];
  if (used.length === 0) {
    throw new TypeError('Financial report must list its assumptions.');
  }
  for (const id of used) {
    if (!ids.has(id)) {
      throw new TypeError(`Financial report assumption is missing: ${id}`);
    }
  }
  return true;
}

export default FINANCIAL_ASSUMPTION_TYPES;
