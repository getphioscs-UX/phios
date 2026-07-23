import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  normalizeMigrationText,
  sha256Hex
} from '../functions/runtime/migrations/migration-runner.js';
import {
  FINANCIAL_SCHEMA_TABLES,
  FINANCIAL_SCHEMA_VERSION,
  getFinancialSchemaTable,
  hasFinancialSchemaTable
} from '../functions/professional/financial/financial-schema-registry.js';
import {
  FINANCIAL_EVIDENCE_SOURCE_TYPES,
  createFinancialEvidenceValue
} from '../functions/professional/financial/financial-evidence-contract.js';
import {
  FINANCIAL_ASSUMPTION_TYPES,
  assertReportAssumptions,
  createFinancialAssumption
} from '../functions/professional/financial/financial-assumption-registry.js';
import {
  FINANCIAL_FORMULAS,
  calculateFinancialMetric,
  getFinancialFormula
} from '../functions/professional/financial/financial-formula-registry.js';
import {
  FINANCIAL_RISK_TYPES,
  createFinancialRiskPolicy,
  evaluateFinancialRiskFlags
} from '../functions/professional/financial/financial-risk-registry.js';
import {
  FINANCIAL_PERMITTED_SERVICE_SCOPES,
  authorizeFinancialProfessionalAction,
  createFinancialProfessionalAuthority
} from '../functions/professional/financial/financial-professional-authority.js';
import {
  FINANCIAL_POSITION_GATE_SECTIONS,
  PRODUCT_NEUTRAL_DIRECTIONS,
  createFinancialPositionGate,
  createProductNeutralDirection,
  evaluateProductSpecificStep
} from '../functions/professional/financial/financial-product-neutral-boundary.js';

const root = process.cwd();

function normalizeText(source) {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function read(relativePath) {
  return normalizeText(
    await fs.readFile(path.join(root, relativePath), 'utf8')
  );
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  return crypto
    .createHash('sha256')
    .update(await read(relativePath), 'utf8')
    .digest('hex');
}

const requiredFiles = [
  'content/registry/financial-schema-registry.json',
  'content/registry/financial-formula-registry.json',
  'content/registry/financial-assumption-registry.json',
  'content/registry/financial-risk-registry.json',
  'content/registry/financial-authority-boundary.json',
  'content/registry/financial-product-neutral-boundary.json',
  'content/registry/m4a-w8-financial-professional-infrastructure.json',
  'db/schema/financial-professional-schema-v1.sql',
  'db/migrations/0003_financial_professional_infrastructure.sql',
  'functions/professional/financial/financial-schema-registry.js',
  'functions/professional/financial/financial-evidence-contract.js',
  'functions/professional/financial/financial-formula-registry.js',
  'functions/professional/financial/financial-assumption-registry.js',
  'functions/professional/financial/financial-risk-registry.js',
  'functions/professional/financial/financial-professional-authority.js',
  'functions/professional/financial/financial-product-neutral-boundary.js',
  'tests/fixtures/m4a-w8-financial-infrastructure-scenarios.json',
  'docs/professional/M4A-W8-FINANCIAL-PROFESSIONAL-INFRASTRUCTURE.md',
  'docs/professional/M4A-W8-INSTALL.md'
];
for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M4A-W8 deliverable: ${file}`);
}

const schemaRegistry = await readJson(
  'content/registry/financial-schema-registry.json'
);
const formulaRegistry = await readJson(
  'content/registry/financial-formula-registry.json'
);
const assumptionRegistry = await readJson(
  'content/registry/financial-assumption-registry.json'
);
const riskRegistry = await readJson(
  'content/registry/financial-risk-registry.json'
);
const authorityRegistry = await readJson(
  'content/registry/financial-authority-boundary.json'
);
const productBoundary = await readJson(
  'content/registry/financial-product-neutral-boundary.json'
);
const milestone = await readJson(
  'content/registry/m4a-w8-financial-professional-infrastructure.json'
);
const fixtures = await readJson(
  'tests/fixtures/m4a-w8-financial-infrastructure-scenarios.json'
);
const registryIndex = await readJson('content/registry/index.json');

assert.equal(
  fixtures.schemaVersion,
  'phi-os.m4a-w8-financial-infrastructure-scenarios.v1'
);
assert.equal(fixtures.syntheticOnly, true);

const expectedTables = [
  'client_household',
  'financial_objective',
  'income_item',
  'expense_item',
  'asset_item',
  'liability_item',
  'bank_account_summary',
  'investment_item',
  'property_item',
  'insurance_policy',
  'tax_profile',
  'retirement_plan',
  'education_plan',
  'estate_profile',
  'financial_ratio',
  'financial_risk',
  'financial_recommendation',
  'financial_action',
  'financial_review'
];
assert.equal(FINANCIAL_SCHEMA_VERSION, schemaRegistry.schemaId);
assert.deepEqual(
  FINANCIAL_SCHEMA_TABLES.map(table => table.name),
  expectedTables
);
assert.deepEqual(
  schemaRegistry.tables.map(table => table.name),
  expectedTables
);
assert.equal(FINANCIAL_SCHEMA_TABLES.length, 19);
assert.equal(hasFinancialSchemaTable('financial_ratio'), true);
assert.equal(
  getFinancialSchemaTable('bank_account_summary').primary_key,
  'bank_summary_id'
);
assert.equal(
  FINANCIAL_SCHEMA_TABLES.every(
    table =>
      table.raw_document_content_allowed === false &&
      table.full_identifier_storage_allowed === false
  ),
  true
);
for (const value of Object.values(schemaRegistry.implementationBoundary)) {
  assert.equal(value, false);
}

const schemaSql = await read('db/schema/financial-professional-schema-v1.sql');
const migrationSql = await read(
  'db/migrations/0003_financial_professional_infrastructure.sql'
);
assert.equal(
  normalizeMigrationText(schemaSql),
  normalizeMigrationText(migrationSql)
);
const migrationRegistry = await readJson(
  'content/registry/runtime-migrations.json'
);
const migration = migrationRegistry.migrations.find(item => item.version === 3);
assert.ok(migration);
assert.equal(
  migration.file,
  'db/migrations/0003_financial_professional_infrastructure.sql'
);
assert.equal(migration.schema_id, FINANCIAL_SCHEMA_VERSION);
assert.equal(await sha256Hex(migrationSql), migration.checksum);
assert.equal(migration.immutable, true);

for (const forbiddenColumn of [
  'identity_number',
  'account_number',
  'policy_number',
  'tax_number',
  'exact_address',
  'raw_document_content',
  'public_url'
]) {
  assert.doesNotMatch(
    schemaSql,
    new RegExp(`\\b${forbiddenColumn}\\b`),
    `Financial schema contains prohibited column: ${forbiddenColumn}`
  );
}
for (const requiredColumn of [
  'masked_account_number',
  'masked_policy_number',
  'general_location',
  'evidence_source_type',
  'evidence_reference_id',
  'evidence_date',
  'verification_status',
  'formula_version',
  'assumption_ids',
  'authority_record_id'
]) {
  assert.match(schemaSql, new RegExp(`\\b${requiredColumn}\\b`));
}

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
database.exec(await read('db/migrations/0001_platform_foundation.sql'));
database.exec(await read('db/migrations/0002_initial_runtime.sql'));
database.exec(migrationSql);

const actualTables = new Set(
  database.prepare(`
    SELECT name FROM sqlite_schema
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all().map(row => row.name)
);
for (const table of expectedTables) {
  assert.equal(actualTables.has(table), true, `Missing Financial table: ${table}`);
}
const childTables = expectedTables.filter(
  table => table !== 'client_household'
);
for (const table of childTables) {
  const foreignKeys = database
    .prepare(`PRAGMA foreign_key_list(${table})`)
    .all();
  const householdKey = foreignKeys.find(key =>
    key.table === 'client_household' &&
    key.from === 'household_id' &&
    key.on_delete === 'CASCADE'
  );
  assert.ok(householdKey, `Missing household cascade: ${table}`);
}

database.prepare(`
  INSERT INTO client_household (
    household_id, primary_client_id, household_type, jurisdiction,
    data_date, consent_id, retention_decision_id, status,
    created_at, updated_at
  ) VALUES (?1, ?2, 'individual', 'MY', ?3, ?4, ?5, 'active', ?3, ?3)
`).run(
  'household_test_1',
  'client_test_1',
  fixtures.now,
  'consent_test_1',
  'retention_test_1'
);
database.prepare(`
  INSERT INTO income_item (
    income_id, household_id, data_subject_id, income_type, amount_minor,
    currency, amount_basis, frequency, owner_reference,
    evidence_source_type, evidence_reference_id, evidence_date,
    verification_status, created_at, updated_at
  ) VALUES (
    'income_test_1', 'household_test_1', 'subject_test_1', 'employment',
    800000, 'MYR', 'net', 'monthly', 'subject_test_1',
    'document_extracted', 'file_test_income_1', ?1, 'verified', ?1, ?1
  )
`).run(fixtures.now);
database.prepare(`
  INSERT INTO bank_account_summary (
    bank_summary_id, household_id, data_subject_id, institution,
    account_type, masked_account_number, currency, balance_minor,
    ownership_reference, ownership_basis_points, evidence_source_type,
    evidence_reference_id, evidence_date, verification_status,
    created_at, updated_at
  ) VALUES (
    'bank_test_1', 'household_test_1', 'subject_test_1',
    'Test Financial Institution', 'savings', '****5678', 'MYR', 500000,
    'subject_test_1', 10000, 'user_entered', NULL, ?1, 'unverified', ?1, ?1
  )
`).run(fixtures.now);
assert.throws(
  () => database.prepare(`
    INSERT INTO bank_account_summary (
      bank_summary_id, household_id, data_subject_id, institution,
      account_type, masked_account_number, currency, balance_minor,
      ownership_reference, ownership_basis_points, evidence_source_type,
      evidence_reference_id, evidence_date, verification_status,
      created_at, updated_at
    ) VALUES (
      'bank_test_bad', 'household_test_1', 'subject_test_1',
      'Test Financial Institution', 'savings', 'ABCD5678', 'MYR', 500000,
      'subject_test_1', 10000, 'user_entered', NULL, ?1, 'unverified', ?1, ?1
    )
  `).run(fixtures.now),
  /CHECK constraint failed/
);
assert.throws(
  () => database.prepare(`
    INSERT INTO financial_risk (
      risk_id, household_id, risk_type, policy_version, severity, status,
      evidence_references, triggered_at, review_status,
      recommendation_created, created_at, updated_at
    ) VALUES (
      'risk_test_bad', 'household_test_1', 'negative_cash_flow', '1.0.0',
      'material', 'open', '["evidence_test_1"]', ?1, 'pending', 1, ?1, ?1
    )
  `).run(fixtures.now),
  /CHECK constraint failed/
);
assert.throws(
  () => database.prepare(`
    INSERT INTO financial_recommendation (
      recommendation_id, household_id, direction_type, reason,
      evidence_references, constraint_references, missing_data_references,
      authority_record_id, recommendation_status, product_specific,
      client_decision_required, created_at, updated_at
    ) VALUES (
      'recommendation_test_bad', 'household_test_1', 'specific_product',
      'Synthetic test', '[]', '[]', '[]', 'authority_test_1', 'draft',
      1, 1, ?1, ?1
    )
  `).run(fixtures.now),
  /CHECK constraint failed/
);
database.prepare(
  'DELETE FROM client_household WHERE household_id = ?1'
).run('household_test_1');
for (const [table, id] of [
  ['income_item', 'income_test_1'],
  ['bank_account_summary', 'bank_test_1']
]) {
  assert.equal(
    database.prepare(`SELECT COUNT(*) AS count FROM ${table}`)
      .get().count,
    0,
    `Financial household cascade failed: ${table}.${id}`
  );
}
database.close();

assert.deepEqual(
  formulaRegistry.formulas.map(item => item.id),
  FINANCIAL_FORMULAS.map(item => item.id)
);
assert.equal(formulaRegistry.rules.pageLocalFormulaAllowed, false);
assert.equal(formulaRegistry.rules.calculationCreatesRecommendation, false);
assert.equal(fixtures.formulaCases.length, 10);
for (const [index, formulaCase] of fixtures.formulaCases.entries()) {
  const gapFormula = [
    'retirement_gap',
    'education_gap',
    'insurance_gap'
  ].includes(formulaCase.formula_id);
  const result = calculateFinancialMetric({
    calculation_id: `calculation_test_${index + 1}`,
    household_id: 'household_test_1',
    formula_id: formulaCase.formula_id,
    values: formulaCase.values,
    input_date: fixtures.now,
    input_source_ids: ['evidence_test_1'],
    assumption_ids: gapFormula ? ['assumption_test_inflation'] : []
  }, { now: fixtures.now });
  assert.equal(result.value_numeric, formulaCase.expected);
  assert.equal(result.calculation_status, 'calculated');
  assert.equal(result.creates_recommendation, false);
  assert.equal(result.formula_version, '1.0.0');
}
const zeroDenominator = calculateFinancialMetric({
  calculation_id: 'calculation_test_zero',
  household_id: 'household_test_1',
  formula_id: 'liquidity_ratio',
  values: {
    liquid_assets_minor: 500000,
    monthly_expenses_minor: 0
  },
  input_date: fixtures.now,
  input_source_ids: ['evidence_test_1'],
  assumption_ids: []
}, { now: fixtures.now });
assert.equal(zeroDenominator.calculation_status, 'insufficient_input');
assert.equal(zeroDenominator.value_numeric, null);
assert.equal(getFinancialFormula('net_worth').unit, 'currency_minor');

assert.deepEqual(
  assumptionRegistry.assumptionTypes.map(item => item.id),
  FINANCIAL_ASSUMPTION_TYPES.map(item => item.id)
);
assert.equal(
  FINANCIAL_ASSUMPTION_TYPES.every(item => item.numeric_default === null),
  true
);
assert.equal(assumptionRegistry.rules.numericDefaultProvidedBySystem, false);
const assumptions = fixtures.assumptions.map(input =>
  createFinancialAssumption(input, { now: fixtures.now })
);
assert.equal(
  assertReportAssumptions({
    assumption_ids: assumptions.map(item => item.assumption_id)
  }, assumptions),
  true
);
assert.throws(
  () => assertReportAssumptions({ assumption_ids: [] }, assumptions),
  /must list its assumptions/
);

assert.deepEqual(
  riskRegistry.riskTypes,
  [...FINANCIAL_RISK_TYPES]
);
assert.equal(riskRegistry.rules.riskFlagEqualsRecommendation, false);
const riskPolicy = createFinancialRiskPolicy(fixtures.riskPolicy);
const evidenceByRisk = Object.fromEntries(
  FINANCIAL_RISK_TYPES.map(risk => [risk, [`evidence_test_${risk}`]])
);
const riskFlags = evaluateFinancialRiskFlags({
  risk_run_id: 'risk_run_test_1',
  household_id: 'household_test_1',
  policy: riskPolicy,
  metrics: {
    cash_flow_surplus_minor: -10000,
    liquidity_ratio_months: 2,
    debt_to_income_percent: 50,
    savings_ratio_percent: 5,
    insurance_gap_minor: 100000,
    investment_concentration_percent: 60,
    property_concentration_percent: 80,
    currency_exposure_percent: 40,
    retirement_gap_minor: 100000,
    education_gap_minor: 100000
  },
  estate_gap: true,
  missing_critical_evidence: ['income_evidence'],
  valuation_age_days: 400,
  evidence_references: evidenceByRisk
}, { now: fixtures.now });
assert.equal(riskFlags.length, 13);
assert.equal(
  riskFlags.every(
    risk =>
      risk.recommendation_created === false &&
      risk.action_auto_executed === false &&
      risk.review_status === 'pending'
  ),
  true
);

assert.deepEqual(
  authorityRegistry.serviceScopes,
  [...FINANCIAL_PERMITTED_SERVICE_SCOPES]
);
const authority = createFinancialProfessionalAuthority(
  fixtures.authority,
  { now: fixtures.now }
);
const authorization = authorizeFinancialProfessionalAction(
  authority,
  {
    jurisdiction: 'MY',
    service_scope: 'product_neutral_navigation',
    product_specific: false
  },
  { now: fixtures.now }
);
assert.equal(authorization.allowed, true);
assert.equal(authorization.product_specific, false);
assert.equal(authorization.restricted_product_advice, true);
assert.throws(
  () => authorizeFinancialProfessionalAction(
    authority,
    {
      jurisdiction: 'SG',
      service_scope: 'product_neutral_navigation',
      product_specific: false
    },
    { now: fixtures.now }
  ),
  /jurisdiction does not match/
);
assert.throws(
  () => authorizeFinancialProfessionalAction(
    authority,
    {
      jurisdiction: 'MY',
      service_scope: 'product_neutral_navigation',
      product_specific: true
    },
    { now: fixtures.now }
  ),
  /later separate regulated step/
);

assert.deepEqual(
  productBoundary.requiredBeforeDirection,
  [...FINANCIAL_POSITION_GATE_SECTIONS]
);
assert.deepEqual(
  productBoundary.productNeutralDirections,
  [...PRODUCT_NEUTRAL_DIRECTIONS]
);
const positionGate = createFinancialPositionGate(fixtures.positionGate);
assert.equal(positionGate.ready_for_product_neutral_direction, true);
assert.equal(positionGate.ready_for_product_specific_advice, false);
assert.throws(
  () => createFinancialPositionGate({
    ...fixtures.positionGate,
    sections: {
      ...fixtures.positionGate.sections,
      missing_data: {
        complete: false,
        evidence_references: ['gap_test_1']
      }
    }
  }),
  /gate is incomplete/
);
const direction = createProductNeutralDirection({
  direction_id: 'direction_test_1',
  position_gate: positionGate,
  authority: authorization,
  direction_type: 'emergency_reserve',
  reason: 'Liquidity is below the reviewed policy threshold.',
  evidence_references: ['evidence_test_liquidity'],
  constraint_references: ['constraint_test_cash_flow'],
  missing_data_references: ['gap_test_income'],
  first_action: 'Confirm reserve target range with the client.',
  review_point: 'Review after the next verified monthly data update.'
});
assert.equal(direction.product_specific, false);
assert.equal(direction.transaction_created, false);
assert.equal(direction.client_decision_required, true);
assert.equal(direction.automatic_execution, false);
assert.throws(
  () => createProductNeutralDirection({
    direction_id: 'direction_test_bad',
    position_gate: positionGate,
    authority: authorization,
    direction_type: 'insurance_gap_review',
    reason: 'Synthetic scenario',
    evidence_references: ['evidence_test_insurance'],
    constraint_references: [],
    missing_data_references: [],
    first_action: 'Review options.',
    review_point: 'Client review.',
    product_identifier: 'specific-product'
  }),
  /cannot identify a product/
);
assert.equal(
  evaluateProductSpecificStep({ product_specific: true }).allowed,
  false
);

assert.deepEqual(
  [...FINANCIAL_EVIDENCE_SOURCE_TYPES],
  [
    'user_entered',
    'document_extracted',
    'professional_entered',
    'calculated',
    'estimated',
    'projected',
    'unverified'
  ]
);
const evidence = createFinancialEvidenceValue(
  fixtures.evidence,
  { now: fixtures.now }
);
assert.equal(evidence.raw_document_content_embedded, false);
assert.equal(evidence.full_identifier_embedded, false);
assert.equal(evidence.creates_recommendation, false);
assert.equal(evidence.source_reference_id, 'file_test_income_1');
assert.throws(
  () => createFinancialEvidenceValue({
    ...fixtures.evidence,
    raw_document_content: 'must not be embedded'
  }, { now: fixtures.now }),
  /cannot embed source content/
);

assert.equal(
  milestone.status,
  'financial-infrastructure-closed-next-workspace'
);
assert.equal(
  milestone.baseline.commit,
  '218b25c34d020534a62e22b286140d101a3417a3'
);
assert.equal(
  milestone.nextWorkPackage,
  'M4A-W2 Professional Workspace'
);
for (const value of Object.values(milestone.completion)) {
  assert.equal(value, true);
}
for (const value of Object.values(milestone.implementationBoundary)) {
  assert.equal(value, false);
}
for (const value of Object.values(milestone.guardrails)) {
  assert.equal(value, false);
}
for (const [file, expectedHash] of Object.entries(
  milestone.frozenArtifacts
)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen pre-W8 artifact changed: ${file}`
  );
}
const migrations = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(filename => filename.endsWith('.sql'))
  .sort();
assert.deepEqual(migrations, milestone.migrationInventory);

for (const [key, target] of [
  ['financial_schema_registry', './financial-schema-registry.json'],
  ['financial_formula_registry', './financial-formula-registry.json'],
  ['financial_assumption_registry', './financial-assumption-registry.json'],
  ['financial_risk_registry', './financial-risk-registry.json'],
  ['financial_authority_boundary', './financial-authority-boundary.json'],
  [
    'financial_product_neutral_boundary',
    './financial-product-neutral-boundary.json'
  ],
  [
    'm4a_w8_financial_professional_infrastructure',
    './m4a-w8-financial-professional-infrastructure.json'
  ]
]) {
  assert.equal(registryIndex.registries[key], target);
}

const w7 = await readJson(
  'content/registry/m4a-w7-professional-data-privacy.json'
);
assert.equal(
  w7.nextWorkPackage,
  'M4A-W8 Financial Professional Infrastructure'
);
const governance = await readJson(
  'content/registry/professional-data-governance.json'
);
assert.equal(governance.principles.sourceDocumentsInRuntimeMemory, false);
assert.equal(governance.financialGovernance.defaultRuntimeMemory, false);

const authoredText = (
  await Promise.all(requiredFiles.map(file => read(file)))
).join('\n');
assert.doesNotMatch(
  authoredText,
  /\b\d{6}-?\d{2}-?\d{4}\b/,
  'M4A-W8 must not contain an identity number'
);
assert.doesNotMatch(
  authoredText,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  'M4A-W8 must not contain a client email address'
);
assert.doesNotMatch(
  authoredText,
  /\b\d{10,16}\b/,
  'M4A-W8 must not contain a full account, policy or phone number'
);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m4a-financial-infrastructure'],
  'node --no-warnings scripts/check-m4a-financial-infrastructure.mjs'
);
assert.equal(
  packageJson.scripts.check.includes(
    'node --no-warnings scripts/check-m4a-financial-infrastructure.mjs'
  ),
  true
);

console.log(
  '✓ M4A-W8 Financial Professional Infrastructure passed: 19-table schema, migration, evidence, formulas, assumptions, risks, authority and product-neutral boundaries are closed.'
);
console.log(
  '  Calculations and Risk Flags do not create recommendations; product-specific advice and automatic transactions remain disabled.'
);
console.log(
  '  Next required gate: M4A-W2 Professional Workspace and Financial Intake.'
);
