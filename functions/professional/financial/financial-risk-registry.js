export const FINANCIAL_RISK_REGISTRY_VERSION =
  'phi-os.financial-risk-registry.v1';

export const FINANCIAL_RISK_TYPES = Object.freeze([
  'negative_cash_flow',
  'insufficient_liquidity',
  'high_debt_burden',
  'low_savings_capacity',
  'insurance_gap',
  'concentrated_investment',
  'property_concentration',
  'currency_exposure',
  'retirement_gap',
  'education_gap',
  'estate_gap',
  'missing_critical_evidence',
  'outdated_valuation'
]);

const REQUIRED_THRESHOLDS = Object.freeze([
  'minimum_liquidity_months',
  'maximum_debt_to_income_percent',
  'minimum_savings_ratio_percent',
  'maximum_investment_concentration_percent',
  'maximum_property_concentration_percent',
  'maximum_currency_exposure_percent',
  'valuation_max_age_days'
]);

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

function references(values, field) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = requiredText(value, field);
    if (!result.includes(text)) result.push(text);
  }
  return result;
}

export function createFinancialRiskPolicy(input = {}) {
  const thresholds = {};
  for (const key of REQUIRED_THRESHOLDS) {
    const value = input.thresholds?.[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new TypeError(`Financial risk threshold is required: ${key}`);
    }
    thresholds[key] = value;
  }
  const effectiveAt = isoDate(input.effective_at, 'effective_at');
  const reviewAt = isoDate(input.review_at, 'review_at');
  if (reviewAt <= effectiveAt) {
    throw new TypeError('Financial risk policy review must follow its effective date.');
  }
  return Object.freeze({
    contract: FINANCIAL_RISK_REGISTRY_VERSION,
    policy_id: requiredText(input.policy_id, 'policy_id'),
    version: requiredText(input.version, 'version'),
    jurisdiction: requiredText(input.jurisdiction, 'jurisdiction'),
    effective_at: effectiveAt,
    review_at: reviewAt,
    thresholds: Object.freeze(thresholds),
    reviewed_by: requiredText(input.reviewed_by, 'reviewed_by'),
    creates_recommendation: false
  });
}

function valueOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : null;
}

export function evaluateFinancialRiskFlags(input = {}, options = {}) {
  const policy = input.policy;
  if (policy?.contract !== FINANCIAL_RISK_REGISTRY_VERSION) {
    throw new TypeError('A reviewed Financial risk policy is required.');
  }
  const metrics = input.metrics || {};
  const threshold = policy.thresholds;
  const triggers = {
    negative_cash_flow:
      valueOrNull(metrics.cash_flow_surplus_minor) !== null &&
      metrics.cash_flow_surplus_minor < 0,
    insufficient_liquidity:
      valueOrNull(metrics.liquidity_ratio_months) !== null &&
      metrics.liquidity_ratio_months < threshold.minimum_liquidity_months,
    high_debt_burden:
      valueOrNull(metrics.debt_to_income_percent) !== null &&
      metrics.debt_to_income_percent >
        threshold.maximum_debt_to_income_percent,
    low_savings_capacity:
      valueOrNull(metrics.savings_ratio_percent) !== null &&
      metrics.savings_ratio_percent < threshold.minimum_savings_ratio_percent,
    insurance_gap:
      valueOrNull(metrics.insurance_gap_minor) !== null &&
      metrics.insurance_gap_minor > 0,
    concentrated_investment:
      valueOrNull(metrics.investment_concentration_percent) !== null &&
      metrics.investment_concentration_percent >
        threshold.maximum_investment_concentration_percent,
    property_concentration:
      valueOrNull(metrics.property_concentration_percent) !== null &&
      metrics.property_concentration_percent >
        threshold.maximum_property_concentration_percent,
    currency_exposure:
      valueOrNull(metrics.currency_exposure_percent) !== null &&
      metrics.currency_exposure_percent >
        threshold.maximum_currency_exposure_percent,
    retirement_gap:
      valueOrNull(metrics.retirement_gap_minor) !== null &&
      metrics.retirement_gap_minor > 0,
    education_gap:
      valueOrNull(metrics.education_gap_minor) !== null &&
      metrics.education_gap_minor > 0,
    estate_gap: input.estate_gap === true,
    missing_critical_evidence:
      Array.isArray(input.missing_critical_evidence) &&
      input.missing_critical_evidence.length > 0,
    outdated_valuation:
      valueOrNull(input.valuation_age_days) !== null &&
      input.valuation_age_days > threshold.valuation_max_age_days
  };

  const evidenceByRisk = input.evidence_references || {};
  const triggeredAt = isoDate(
    options.now || input.triggered_at || new Date().toISOString(),
    'triggered_at'
  );
  const records = [];
  for (const riskType of FINANCIAL_RISK_TYPES) {
    if (!triggers[riskType]) continue;
    const evidence = references(evidenceByRisk[riskType], riskType);
    if (evidence.length === 0) {
      throw new TypeError(
        `Triggered Financial risk requires evidence: ${riskType}`
      );
    }
    records.push(Object.freeze({
      contract: FINANCIAL_RISK_REGISTRY_VERSION,
      risk_id: `${requiredText(input.risk_run_id, 'risk_run_id')}:${riskType}`,
      household_id: requiredText(input.household_id, 'household_id'),
      risk_type: riskType,
      policy_version: policy.version,
      severity: riskType === 'negative_cash_flow'
        ? 'material'
        : 'attention',
      status: 'open',
      evidence_references: Object.freeze(evidence),
      triggered_at: triggeredAt,
      review_status: 'pending',
      recommendation_created: false,
      action_auto_executed: false
    }));
  }
  return Object.freeze(records);
}

export default FINANCIAL_RISK_TYPES;
