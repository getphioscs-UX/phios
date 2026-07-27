export const FINANCIAL_INTAKE_CONTRACT_VERSION = 'phi-os.financial-intake.v2';

export const FINANCIAL_HOUSEHOLD_TYPES = Object.freeze([
  'individual', 'joint', 'family', 'business'
]);

export const FINANCIAL_INTAKE_SECTIONS = Object.freeze([
  'client_household', 'objectives', 'income', 'expenses', 'bank_cash',
  'investments', 'properties', 'liabilities', 'insurance', 'tax',
  'retirement', 'education', 'estate'
]);

export const FINANCIAL_EVIDENCE_CLASSES = Object.freeze([
  'user_entered', 'document_extracted', 'professional_entered',
  'calculated', 'estimated', 'projected', 'unverified'
]);

export const FINANCIAL_INTAKE_SECTION_FIELDS = Object.freeze({
  client_household: Object.freeze([
    'record_id', 'household_members', 'dependants', 'employment_status',
    'business_ownership', 'primary_financial_decision_makers'
  ]),
  objectives: Object.freeze([
    'record_id', 'objective', 'priority_score', 'time_horizon',
    'target_amount', 'target_date', 'current_progress', 'notes'
  ]),
  income: Object.freeze([
    'record_id', 'income_type', 'amount', 'gross_net', 'frequency', 'owner',
    'evidence_source'
  ]),
  expenses: Object.freeze([
    'record_id', 'expense_type', 'amount', 'frequency', 'owner',
    'evidence_source'
  ]),
  bank_cash: Object.freeze([
    'record_id', 'institution', 'account_type', 'last_four_digits', 'currency',
    'balance', 'interest_rate', 'maturity', 'ownership', 'share_percentage',
    'evidence_date'
  ]),
  investments: Object.freeze([
    'record_id', 'asset_type', 'instrument', 'institution', 'acquired_date',
    'amount_invested', 'current_value', 'currency', 'ownership',
    'profit_loss', 'valuation_date', 'risk_classification'
  ]),
  properties: Object.freeze([
    'record_id', 'property_type', 'general_location', 'acquired_date',
    'tenure', 'size', 'purchase_price', 'other_cost',
    'current_market_value', 'outstanding_loan', 'monthly_instalment',
    'rental_income', 'ownership_share', 'valuation_date'
  ]),
  liabilities: Object.freeze([
    'record_id', 'liability_type', 'lender', 'original_amount',
    'outstanding_amount', 'interest_rate', 'monthly_repayment',
    'remaining_term', 'secured_asset', 'borrower', 'guarantor'
  ]),
  insurance: Object.freeze([
    'record_id', 'policy_holder', 'insured_person', 'company', 'policy_type',
    'commencement_date', 'premium', 'payment_mode', 'maturity', 'life_cover',
    'tpd', 'critical_illness', 'medical_cover', 'hospital_benefit',
    'cash_value', 'nomination', 'waiver', 'other_benefits'
  ]),
  tax: Object.freeze([
    'record_id', 'taxpayer_type', 'income_basis',
    'estimated_assessable_income', 'reliefs', 'deductions',
    'business_expenses', 'estimated_tax', 'tax_filing_status',
    'professional_referral_required'
  ]),
  retirement: Object.freeze([
    'record_id', 'desired_retirement_age', 'current_age',
    'expected_retirement_expenses', 'inflation_assumption',
    'life_expectancy_assumption', 'existing_retirement_assets',
    'expected_income_sources', 'funding_gap'
  ]),
  education: Object.freeze([
    'record_id', 'child', 'current_age', 'target_education_age', 'location',
    'education_type', 'current_cost', 'inflation_assumption',
    'existing_fund', 'funding_gap'
  ]),
  estate: Object.freeze([
    'record_id', 'will_status', 'nomination_status', 'beneficiary_overview',
    'guardian_consideration', 'trust_consideration',
    'property_ownership_structure', 'business_succession',
    'professional_referral_required'
  ])
});

const clean = value => typeof value === 'string' ? value.trim() : '';
const required = (value, field) => {
  const text = clean(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
};
const date = (value, field) => {
  const time = Date.parse(clean(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
};
const optionalDate = (value, field) => value ? date(value, field) : null;
const finiteNumber = (value, field, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${field} must be finite.`);
  return number;
};

function rejectSensitiveIdentifiers(record = {}) {
  if (clean(record.account_number) || clean(record.bank_account_number)) {
    throw new TypeError('Full bank account numbers are not accepted.');
  }
  for (const field of [
    'policy_number', 'identity_number', 'tax_number', 'exact_address'
  ]) {
    if (clean(record[field])) {
      throw new TypeError(`${field} is not accepted by Financial Intake.`);
    }
  }
}

function sanitiseAccount(record = {}, index) {
  rejectSensitiveIdentifiers(record);
  const lastFour = clean(record.last_four_digits);
  if (lastFour && !/^\d{4}$/.test(lastFour)) {
    throw new TypeError('last_four_digits must contain exactly four digits.');
  }
  return Object.freeze({
    record_id: clean(record.record_id) || `bank_cash_${index + 1}`,
    institution: required(record.institution, 'institution'),
    account_type: required(record.account_type, 'account_type'),
    last_four_digits: lastFour || null,
    currency: clean(record.currency).toUpperCase() || 'MYR',
    balance: finiteNumber(record.balance, 'balance', 0),
    interest_rate: finiteNumber(record.interest_rate, 'interest_rate'),
    maturity: optionalDate(record.maturity, 'maturity'),
    ownership: required(record.ownership, 'ownership'),
    share_percentage: finiteNumber(record.share_percentage, 'share_percentage', 100),
    evidence_date: date(record.evidence_date, 'evidence_date')
  });
}

function normaliseSectionRecord(section, record = {}, index) {
  rejectSensitiveIdentifiers(record);
  const allowed = FINANCIAL_INTAKE_SECTION_FIELDS[section];
  const result = { record_id: clean(record.record_id) || `${section}_${index + 1}` };
  for (const field of allowed) {
    if (field === 'record_id') continue;
    const value = record[field];
    if (value === undefined) continue;
    result[field] = typeof value === 'string' ? value.trim() : value;
  }
  return Object.freeze(result);
}

function normaliseEvidence(record = {}, index) {
  const evidenceClass = clean(record.evidence_class) || 'unverified';
  if (!FINANCIAL_EVIDENCE_CLASSES.includes(evidenceClass)) {
    throw new TypeError('Unsupported financial evidence_class.');
  }
  const fieldPath = clean(record.field_path) || 'client_household';
  const validSection = FINANCIAL_INTAKE_SECTIONS.some(section =>
    fieldPath === section || fieldPath.startsWith(`${section}.`)
  );
  if (!validSection) {
    throw new TypeError('Financial evidence field_path must target an intake section.');
  }
  return Object.freeze({
    evidence_map_id: clean(record.evidence_map_id) || `evidence_map_${index + 1}`,
    field_path: fieldPath,
    evidence_class: evidenceClass,
    source_reference: required(record.source_reference, 'source_reference'),
    information_date: date(record.information_date, 'information_date'),
    verification_status: clean(record.verification_status) || 'unverified',
    verified_by: clean(record.verified_by) || null,
    verified_at: record.verified_at ? date(record.verified_at, 'verified_at') : null,
    assumption_ids: Object.freeze([...(record.assumption_ids || [])]),
    document_content_embedded: false
  });
}

export function createFinancialIntake(input = {}, options = {}) {
  const householdType = clean(input.household_type);
  if (!FINANCIAL_HOUSEHOLD_TYPES.includes(householdType)) {
    throw new TypeError('Unsupported household_type.');
  }
  const sections = Object.fromEntries(FINANCIAL_INTAKE_SECTIONS.map(section => {
    const records = Array.isArray(input[section]) ? input[section] : [];
    return [
      section,
      Object.freeze(section === 'bank_cash'
        ? records.map(sanitiseAccount)
        : records.map((record, index) =>
          normaliseSectionRecord(section, record, index)))
    ];
  }));
  return Object.freeze({
    schema_version: FINANCIAL_INTAKE_CONTRACT_VERSION,
    intake_id: required(input.intake_id, 'intake_id'),
    client_id: required(input.client_id, 'client_id'),
    service_id: required(input.service_id, 'service_id'),
    household_type: householdType,
    data_date: date(input.data_date, 'data_date'),
    data_version: Number(input.data_version || 1),
    sections: Object.freeze(sections),
    evidence_map: Object.freeze(
      Array.isArray(input.evidence_map)
        ? input.evidence_map.map(normaliseEvidence)
        : []
    ),
    status: clean(input.status) || 'draft',
    created_at: date(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    ),
    full_bank_accounts_stored: false,
    raw_documents_embedded: false,
    runtime_evidence_written: false,
    runtime_memory_written: false
  });
}

export default Object.freeze({ createFinancialIntake });
