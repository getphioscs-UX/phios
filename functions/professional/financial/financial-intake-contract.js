export const FINANCIAL_INTAKE_CONTRACT_VERSION = 'phi-os.financial-intake.v1';

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

function sanitiseAccount(record = {}) {
  if (clean(record.account_number)) {
    throw new TypeError('Full bank account numbers are not accepted.');
  }
  const lastFour = clean(record.last_four_digits);
  if (lastFour && !/^\d{4}$/.test(lastFour)) {
    throw new TypeError('last_four_digits must contain exactly four digits.');
  }
  return Object.freeze({
    institution: required(record.institution, 'institution'),
    account_type: required(record.account_type, 'account_type'),
    last_four_digits: lastFour || null,
    currency: clean(record.currency) || 'MYR',
    balance: Number(record.balance) || 0,
    ownership: required(record.ownership, 'ownership'),
    share_percentage: Number(record.share_percentage ?? 100),
    evidence_date: date(record.evidence_date, 'evidence_date')
  });
}

function normaliseEvidence(record = {}) {
  const evidenceClass = clean(record.evidence_class) || 'unverified';
  if (!FINANCIAL_EVIDENCE_CLASSES.includes(evidenceClass)) {
    throw new TypeError('Unsupported financial evidence_class.');
  }
  return Object.freeze({
    evidence_class: evidenceClass,
    source_reference: required(record.source_reference, 'source_reference'),
    information_date: date(record.information_date, 'information_date'),
    verified_by: clean(record.verified_by) || null,
    verified_at: record.verified_at ? date(record.verified_at, 'verified_at') : null
  });
}

export function createFinancialIntake(input = {}, options = {}) {
  const householdType = clean(input.household_type);
  if (!FINANCIAL_HOUSEHOLD_TYPES.includes(householdType)) {
    throw new TypeError('Unsupported household_type.');
  }
  const sections = Object.fromEntries(FINANCIAL_INTAKE_SECTIONS.map(section => [
    section,
    Object.freeze(Array.isArray(input[section]) ? [...input[section]] : [])
  ]));
  sections.bank_cash = Object.freeze(sections.bank_cash.map(sanitiseAccount));
  return Object.freeze({
    schema_version: FINANCIAL_INTAKE_CONTRACT_VERSION,
    intake_id: required(input.intake_id, 'intake_id'),
    client_id: required(input.client_id, 'client_id'),
    service_id: required(input.service_id, 'service_id'),
    household_type: householdType,
    data_date: date(input.data_date, 'data_date'),
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
    runtime_evidence_written: false,
    runtime_memory_written: false
  });
}

export default Object.freeze({ createFinancialIntake });
