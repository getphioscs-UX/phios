import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createFinancialIntake,
  FINANCIAL_INTAKE_SECTIONS,
  FINANCIAL_INTAKE_SECTION_FIELDS,
  FINANCIAL_EVIDENCE_CLASSES
} from '../functions/professional/financial/financial-intake-contract.js';
import {
  calculateFinancialPosition,
  FINANCIAL_METRICS
} from '../functions/professional/financial/financial-calculation-layer.js';
import {
  createFinancialEvidenceMap
} from '../functions/professional/financial/financial-evidence-contract.js';
import {
  createFinancialRevision,
  buildFinancialRecalculationRequest
} from '../functions/professional/financial/financial-workspace-contract.js';

const root = process.cwd();
const registry = JSON.parse(await fs.readFile(path.join(
  root, 'content/registry/m4a-w2c-financial-intake-calculation.json'
), 'utf8'));

assert.equal(
  registry.baseline,
  'f583b2c22a8470cb6d0bd06c3689558aae45a538'
);
assert.deepEqual(registry.intake_sections, FINANCIAL_INTAKE_SECTIONS);
assert.deepEqual(registry.calculation_metrics, FINANCIAL_METRICS);
assert.deepEqual(registry.evidence_classes, FINANCIAL_EVIDENCE_CLASSES);
assert.deepEqual(Object.keys(FINANCIAL_INTAKE_SECTION_FIELDS), FINANCIAL_INTAKE_SECTIONS);

const intake = createFinancialIntake({
  intake_id: 'intake_w2c',
  client_id: 'client_w2c',
  service_id: 'financial_navigation',
  household_type: 'family',
  data_date: '2026-07-27',
  data_version: 3,
  client_household: [{
    household_members: ['client', 'partner'], dependants: 1,
    employment_status: 'self_employed',
    primary_financial_decision_makers: ['client', 'partner']
  }],
  objectives: [{
    objective: 'Retirement readiness', priority_score: 5,
    time_horizon: 'long_term', target_amount: 1000000,
    target_date: '2050-01-01'
  }],
  income: [{
    income_type: 'business_income', amount: 12000, gross_net: 'net',
    frequency: 'monthly', owner: 'client',
    evidence_source: 'bank_supported'
  }],
  expenses: [{
    expense_type: 'mortgage', amount: 2500, frequency: 'monthly',
    owner: 'household', evidence_source: 'bank_supported'
  }],
  bank_cash: [{
    institution: 'Example Bank', account_type: 'savings',
    last_four_digits: '1234', currency: 'myr', balance: 30000,
    ownership: 'joint', share_percentage: 50,
    evidence_date: '2026-07-01'
  }],
  investments: [{ asset_type: 'fund', current_value: 50000 }],
  properties: [{ property_type: 'home', current_market_value: 500000 }],
  liabilities: [{ liability_type: 'mortgage', outstanding_amount: 180000 }],
  insurance: [{ policy_type: 'life', life_cover: 300000 }],
  tax: [{ taxpayer_type: 'individual', tax_filing_status: 'filed' }],
  retirement: [{ desired_retirement_age: 60, existing_retirement_assets: 250000 }],
  education: [{ child: 'child_1', existing_fund: 50000 }],
  estate: [{ will_status: 'not_started' }],
  evidence_map: [{
    evidence_map_id: 'map_income',
    field_path: 'income.income_1.amount',
    evidence_class: 'document_extracted',
    source_reference: 'bank_statement_masked',
    information_date: '2026-07-01',
    verification_status: 'verified'
  }]
}, { now: '2026-07-27' });

assert.equal(intake.data_version, 3);
assert.equal(intake.sections.bank_cash[0].last_four_digits, '1234');
assert.equal(intake.sections.bank_cash[0].currency, 'MYR');
assert.equal(intake.evidence_map[0].field_path, 'income.income_1.amount');
assert.equal(intake.full_bank_accounts_stored, false);
assert.equal(intake.raw_documents_embedded, false);
assert.equal(intake.runtime_evidence_written, false);
assert.equal(intake.runtime_memory_written, false);
for (const section of FINANCIAL_INTAKE_SECTIONS) {
  assert.ok(Array.isArray(intake.sections[section]), `${section} missing`);
}
for (const forbidden of [
  'account_number', 'policy_number', 'identity_number',
  'tax_number', 'exact_address'
]) {
  assert.throws(() => createFinancialIntake({
    intake_id: `bad_${forbidden}`,
    client_id: 'client', service_id: 'service',
    household_type: 'individual', data_date: '2026-07-27',
    income: [{ [forbidden]: 'sensitive' }]
  }), /not accepted|Full bank account/);
}

const mapping = createFinancialEvidenceMap({
  evidence_map_id: 'map_property',
  intake_id: intake.intake_id,
  field_path: 'properties.properties_1.current_market_value',
  source_type: 'estimated',
  source_reference_id: 'valuation_note_1',
  evidence_date: '2026-07-01',
  verification_status: 'pending',
  assumption_ids: ['assumption_market_value']
}, { now: '2026-07-27' });
assert.equal(mapping.runtime_evidence, false);
assert.equal(mapping.raw_document_content_embedded, false);
assert.throws(() => createFinancialEvidenceMap({
  ...mapping, evidence_map_id: 'map_bad', assumption_ids: []
}), /require explicit assumptions/);

const calculation = calculateFinancialPosition({
  income: [12000], expenses: [7000], assets: [580000],
  liquid_assets: [30000], liabilities: [180000],
  current_liabilities: [12000], monthly_debt_repayment: 2500,
  insurance_need: 500000, insurance_cover: 300000,
  retirement_target: 1000000, retirement_assets: 250000,
  education_target: 300000, education_fund: 50000
}, {
  calculation_id: 'calculation_w2c',
  intake_id: intake.intake_id,
  intake_data_version: intake.data_version,
  formula_version: 'financial-formulas.v1',
  input_date: '2026-07-27',
  input_sources: ['intake_w2c'],
  input_evidence_ids: ['map_income', 'map_property'],
  assumptions: ['Monthly values use the same currency'],
  calculated_at: '2026-07-27',
  review_status: 'professional_review_required'
});
assert.deepEqual(Object.keys(calculation.values), FINANCIAL_METRICS);
assert.deepEqual(Object.keys(calculation.metrics), FINANCIAL_METRICS);
for (const metric of FINANCIAL_METRICS) {
  const record = calculation.metrics[metric];
  for (const field of registry.calculation_metadata) {
    assert.ok(field in record, `${metric}.${field} missing`);
  }
  assert.ok(record.input_evidence_ids.length);
  assert.equal(record.evidence_class, 'calculated');
  assert.equal(record.creates_recommendation, false);
}
assert.equal(calculation.values.monthly_surplus_deficit, 5000);
assert.equal(calculation.values.net_worth, 400000);
assert.equal(calculation.recommendation_created, false);
assert.equal(calculation.runtime_reading_modified, false);

const revision = createFinancialRevision({
  revision_id: 'revision_w2c', data_date: '2026-07-27',
  field_path: 'income.income_1.amount',
  previous_value: 10000, updated_value: 12000,
  source_document: 'map_income', changed_by: 'professional_w2c',
  changed_at: '2026-07-27', reason: 'Verified source update',
  calculation_impact: 'cash_flow_and_ratios',
  recommendation_impact: 'review_required',
  previous_data_version: 2, revised_data_version: 3
});
const request = buildFinancialRecalculationRequest(revision);
assert.ok(request.metrics.includes('total_income'));
assert.equal(request.from_data_version, 2);
assert.equal(request.to_data_version, 3);
assert.equal(request.old_calculation_overwritten, false);
assert.equal(request.automatic_recommendation_created, false);

for (const value of Object.values(registry.boundaries)) {
  assert.equal(value, false);
}

console.log('✓ M4A-W2C Financial Intake and Calculation Completion passed: 13-section Intake, 16 traceable calculations and field-level evidence mappings are aligned.');
