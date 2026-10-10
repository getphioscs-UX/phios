export const FINANCIAL_SCHEMA_VERSION =
  'phi-os.financial-professional-schema.v1';

const definitions = [
  ['client_household', 'household_id'],
  ['financial_objective', 'objective_id'],
  ['income_item', 'income_id'],
  ['expense_item', 'expense_id'],
  ['asset_item', 'asset_id'],
  ['liability_item', 'liability_id'],
  ['bank_account_summary', 'bank_summary_id'],
  ['investment_item', 'investment_id'],
  ['property_item', 'property_id'],
  ['insurance_policy', 'insurance_policy_id'],
  ['tax_profile', 'tax_profile_id'],
  ['retirement_plan', 'retirement_plan_id'],
  ['education_plan', 'education_plan_id'],
  ['estate_profile', 'estate_profile_id'],
  ['financial_ratio', 'ratio_id'],
  ['financial_risk', 'risk_id'],
  ['financial_recommendation', 'recommendation_id'],
  ['financial_action', 'action_id'],
  ['financial_review', 'review_id']
];

export const FINANCIAL_SCHEMA_TABLES = Object.freeze(
  definitions.map(([name, primaryKey]) => Object.freeze({
    name,
    primary_key: primaryKey,
    schema_version: FINANCIAL_SCHEMA_VERSION,
    household_scoped: name !== 'client_household',
    raw_document_content_allowed: false,
    full_identifier_storage_allowed: false
  }))
);

const byName = new Map(
  FINANCIAL_SCHEMA_TABLES.map(table => [table.name, table])
);

export function getFinancialSchemaTable(name) {
  return byName.get(String(name || '').trim()) || null;
}

export function hasFinancialSchemaTable(name) {
  return byName.has(String(name || '').trim());
}

export default FINANCIAL_SCHEMA_TABLES;
